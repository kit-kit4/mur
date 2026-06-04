import * as fs from 'fs';
import { Bot, Context } from 'grammy';

export interface AuctionTexts {
    notReply: string;
    notReplyToLast: string;
    bidDeletedReply: string;
    tooSmall: (minRequired: number) => string;
    late: string;
    lateNoBids: string;
    extended: string;
    editWarn: string;
    editLog: (oldVal: number | string, newVal: number | string, link: string) => string;
    deleteLog: (val: number | string, link: string) => string;
}

interface AuctionData {
    chatId: number;
    startBid: number;
    step: number;
    currentBid: number;
    endTime: number | null;
    isDynamic: boolean;
    lastBidMsgId: number; 
    invalidBids: Record<number, string>; 
    bids: Record<number, { userId: number; firstName: string; amount: number; text: string }>; 
}

export class AuctionManager {
    private activeAuctions: Record<number, AuctionData> = {}; 
    private isDirty = false;

    constructor(
        private bot: Bot<Context>,
        private dbPath: string,
        private texts: AuctionTexts,
        private adminChatId: number
    ) {
        this.loadDb();
        setInterval(() => this.saveDb(), 5000);
        setInterval(() => this.checkEndedAuctions(), 10000);
    }

    private loadDb() {
        if (fs.existsSync(this.dbPath)) {
            const data = JSON.parse(fs.readFileSync(this.dbPath, "utf-8"));
            for (const key in data) {
                if (!data[key].invalidBids) {
                    data[key].invalidBids = {};
                }
                if (!data[key].lastBidMsgId) {
                    data[key].lastBidMsgId = parseInt(key); 
                }
            }
            this.activeAuctions = data;
        } else {
            fs.writeFileSync(this.dbPath, JSON.stringify({}));
        }
    }

    private async saveDb() {
        if (!this.isDirty) return;
        try {
            await fs.promises.writeFile(this.dbPath, JSON.stringify(this.activeAuctions, null, 2));
            this.isDirty = false;
        } catch (e) {
            console.error(e);
        }
    }

    private async checkEndedAuctions() {
        const now = Date.now();
        for (const [idStr, auction] of Object.entries(this.activeAuctions)) {
            if (auction.endTime && now >= auction.endTime) {
                await this.finishAuction(parseInt(idStr), auction);
            }
        }
    }

    private async finishAuction(auctionId: number, auction: AuctionData) {
        delete this.activeAuctions[auctionId];
        this.isDirty = true;

        if (auction.currentBid === 0) {
            return;
        }

        const winnerMsgId = auction.lastBidMsgId;
        const winner = auction.bids[winnerMsgId];
        if (!winner) return;

        const cleanChatId = auction.chatId.toString().replace("-100", "");
        const auctionLink = `https://t.me/c/${cleanChatId}/${auctionId}`;
        const userLink = `<a href="tg://user?id=${winner.userId}">${winner.firstName}</a>`;

        await this.bot.api.sendMessage(auction.chatId, "ВАША", {
            reply_parameters: { message_id: winnerMsgId }
        }).catch(() => {});

        const adminMsg = 
            `🏆 <b>Аукціон завершено!</b>\n` +
            `Переможець: ${userLink} (ID: <code>${winner.userId}</code>)\n` +
            `Ставка: <b>${winner.amount}</b>\n` +
            `🔗 <a href="${auctionLink}">Пост аукціону</a>`;

        await this.bot.api.sendMessage(this.adminChatId, adminMsg, { parse_mode: "HTML" }).catch(() => {});
    }

    private async isMessageAlive(chatId: number, msgId: number): Promise<boolean> {
        try {
            const ping = await this.bot.api.copyMessage(this.adminChatId, chatId, msgId, { disable_notification: true });
            await this.bot.api.deleteMessage(this.adminChatId, ping.message_id).catch(() => {});
            return true;
        } catch (e: any) {
            if (e.description?.includes("message to copy not found") || e.description?.includes("not found")) {
                return false;
            }
            return true; 
        }
    }

    public registerPost(messageId: number, chatId: number, text: string) {
        const startMatch = text.match(/початкова ставка\s*(?:-|:)\s*(\d+)/i);
        const stepMatch = text.match(/мінімальн(?:е підняття|ий крок)\s*(?:-|:)\s*(\d+)/i);

        if (!startMatch || !stepMatch) return;

        const isDynamic = text.includes("після публікування першої ставки");

        this.activeAuctions[messageId] = {
            chatId,
            startBid: parseInt(startMatch[1]),
            step: parseInt(stepMatch[1]),
            currentBid: 0,
            endTime: isDynamic ? null : Date.now() + 24 * 60 * 60 * 1000,
            isDynamic,
            lastBidMsgId: messageId,
            invalidBids: {},
            bids: {}
        };
        this.isDirty = true;
    }

    public async handleBid(ctx: Context) {
        if (!ctx.message || ctx.from?.is_bot) return false;

        let auctionId: number | null = null;
        
        if (ctx.message.message_thread_id && this.activeAuctions[ctx.message.message_thread_id]) {
            auctionId = ctx.message.message_thread_id;
        } else if (ctx.message.reply_to_message) {
            auctionId = this.findAuctionIdByReply(ctx.message.reply_to_message.message_id);
        }

        if (!auctionId) return false; 
        
        const auction = this.activeAuctions[auctionId];
        const msgId = ctx.message.message_id;
        const text = ctx.message.text || "";
        
        const cleanText = text.replace(/[.*]/g, "").trim().toLowerCase();
        let bidAmount = NaN;
        
        if (["поч", "поч.", "початкова"].includes(cleanText)) {
            bidAmount = auction.startBid;
        } else {
            const bidMatch = cleanText.match(/^(\d+)\s*(?:грн|uah|₴)?$/);
            if (bidMatch) {
                bidAmount = parseInt(bidMatch[1]);
            }
        }

        if (isNaN(bidAmount)) return false; 

        if (!ctx.message.reply_to_message) {
            await this.sendTempWarning(ctx, this.texts.notReply);
            auction.invalidBids[msgId] = text;
            this.isDirty = true;
            return true;
        }

        const replyId = ctx.message.reply_to_message.message_id;
        const now = Date.now();

        if (auction.endTime && now > auction.endTime) {
            const isDeleted = await ctx.deleteMessage().then(() => true).catch(() => false);
            const responseText = auction.currentBid === 0 ? this.texts.lateNoBids : this.texts.late;
            
            if (isDeleted) {
                const msg = await ctx.reply(responseText);
                setTimeout(() => ctx.api.deleteMessage(ctx.chat!.id, msg.message_id).catch(() => {}), 10000);
            } else {
                await ctx.reply(responseText, { reply_parameters: { message_id: msgId } });
            }
            return true;
        }
        
        if (replyId !== auction.lastBidMsgId) {
            const isAlive = await this.isMessageAlive(auction.chatId, auction.lastBidMsgId);

            if (isAlive) {
                const cleanChatId = auction.chatId.toString().replace("-100", "");
                const lastBidLink = `https://t.me/c/${cleanChatId}/${auction.lastBidMsgId}`;
                await this.sendTempWarning(ctx, `${this.texts.notReplyToLast}\n\n🔗 <a href="${lastBidLink}">Остання ставка тут</a>`);
                auction.invalidBids[msgId] = text; 
                this.isDirty = true;
                return true;
            } else {
                const deletedBidInfo = auction.bids[auction.lastBidMsgId];
                delete auction.bids[auction.lastBidMsgId]; 

                let maxBid = 0;
                let newLastMsgId = auctionId; 

                for (const [idStr, bidInfo] of Object.entries(auction.bids)) {
                    if (bidInfo.amount > maxBid) {
                        maxBid = bidInfo.amount;
                        newLastMsgId = parseInt(idStr);
                    }
                }

                auction.currentBid = maxBid;
                auction.lastBidMsgId = newLastMsgId;

                const deletedAmount = deletedBidInfo ? deletedBidInfo.amount : "невідомо";
                const deletedByUserId = deletedBidInfo ? deletedBidInfo.userId : "невідомо";

                await this.bot.api.sendMessage(
                    this.adminChatId, 
                    `🚨 <b>Відкат аукціону!</b>\nСтавку на <code>${deletedAmount}</code> (від ID: <code>${deletedByUserId}</code>) було видалено.\nЦіну відкочено до <code>${maxBid || auction.startBid}</code>.`, 
                    { parse_mode: "HTML" }
                ).catch(() => {});

                const cleanChatId = auction.chatId.toString().replace("-100", "");
                const lastBidLink = `https://t.me/c/${cleanChatId}/${auction.lastBidMsgId}`;
                await this.sendTempWarning(ctx, `${this.texts.bidDeletedReply}\n\n🔗 <a href="${lastBidLink}">Відновлена остання ставка тут</a>`);
                auction.invalidBids[msgId] = text; 
                this.isDirty = true;
                return true;
            }
        }

        if (auction.currentBid === 0) {
            if (bidAmount < auction.startBid) {
                await this.sendTempWarning(ctx, this.texts.tooSmall(auction.startBid));
                auction.invalidBids[msgId] = text;
                this.isDirty = true;
                return true;
            }
            if (auction.isDynamic) auction.endTime = now + 24 * 60 * 60 * 1000;
        } else {
            const minRequired = auction.currentBid + auction.step;
            if (bidAmount < minRequired) {
                await this.sendTempWarning(ctx, this.texts.tooSmall(minRequired));
                auction.invalidBids[msgId] = text;
                this.isDirty = true;
                return true;
            }
            
            if (auction.endTime && (auction.endTime - now) < 30 * 60 * 1000) {
                auction.endTime += 30 * 60 * 1000;
                await ctx.reply(this.texts.extended, { reply_parameters: { message_id: msgId } }).catch(() => {});
            }
        }

        auction.currentBid = bidAmount;
        auction.lastBidMsgId = msgId; 
        auction.bids[msgId] = {
            userId: ctx.from!.id,
            firstName: ctx.from!.first_name,
            amount: bidAmount,
            text: ctx.message.text || ""
        };
        this.isDirty = true;

        await ctx.react("💘").catch(() => {});

        this.checkPreviousBidsBackground(auctionId, msgId);

        return true;
    }

    private async checkPreviousBidsBackground(auctionId: number, currentBidMsgId: number) {
        const auction = this.activeAuctions[auctionId];
        if (!auction) return;

        const bidIds = Object.keys(auction.bids)
            .map(id => parseInt(id))
            .filter(id => id !== currentBidMsgId);

        for (const msgId of bidIds) {
            if (!this.activeAuctions[auctionId] || !auction.bids[msgId]) continue;

            const isAlive = await this.isMessageAlive(auction.chatId, msgId);
            
            if (!isAlive) {
                const deletedBid = auction.bids[msgId];
                delete auction.bids[msgId];
                this.isDirty = true;
                
                const link = `https://t.me/c/${auction.chatId.toString().replace("-100", "")}/${msgId}`;
                await this.bot.api.sendMessage(
                    this.adminChatId, 
                    this.texts.deleteLog(deletedBid.amount, link), 
                    { parse_mode: "HTML" }
                ).catch(() => {});
            }

            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    public async handleEdit(ctx: Context) {
        if (!ctx.editedMessage) return;
        const msgId = ctx.editedMessage.message_id;
        
        if (this.activeAuctions[msgId]) {
            const auction = this.activeAuctions[msgId];
            const text = ctx.editedMessage.text || ctx.editedMessage.caption || "";
            const startMatch = text.match(/початкова ставка\s*(?:-|:)\s*(\d+)/i);
            const stepMatch = text.match(/мінімальн(?:е підняття|ий крок)\s*(?:-|:)\s*(\d+)/i);
            
            if (startMatch && stepMatch) {
                auction.startBid = parseInt(startMatch[1]);
                auction.step = parseInt(stepMatch[1]);
                this.isDirty = true;
            }
            return; 
        }

        for (const [auctionId, auction] of Object.entries(this.activeAuctions)) {
            let oldVal: string | number | null = null;
            let isInvalid = false;

            if (auction.bids[msgId]) {
                oldVal = auction.bids[msgId].amount;
            } else if (auction.invalidBids?.[msgId]) {
                oldVal = auction.invalidBids[msgId];
                isInvalid = true;
            }

            if (oldVal !== null) {
                const newText = ctx.editedMessage.text || "видалив текст";
                const cleanNewText = newText.replace(/[.*]/g, "").trim().toLowerCase();

                if (!isInvalid) {
                    let newAmount = NaN;
                    if (["поч", "поч.", "початкова"].includes(cleanNewText)) {
                        newAmount = auction.startBid;
                    } else {
                        const bidMatch = cleanNewText.match(/^(\d+)\s*(?:грн|uah|₴)?$/);
                        if (bidMatch) {
                            newAmount = parseInt(bidMatch[1]);
                        }
                    }

                    if (!isNaN(newAmount)) {
                        if (msgId === auction.lastBidMsgId && newAmount > (oldVal as number)) {
                            auction.currentBid = newAmount;
                            auction.bids[msgId].amount = newAmount;
                            this.isDirty = true;
                            return; 
                        }
                        if (newAmount === oldVal) return;
                    }
                } else {
                    if (cleanNewText === (oldVal as string).toLowerCase().replace(/[.*]/g, "").trim()) return;
                }
                
                await ctx.reply(this.texts.editWarn, { reply_parameters: { message_id: msgId } }).catch(() => {});
                
                const link = `https://t.me/c/${auction.chatId.toString().replace("-100", "")}/${msgId}`;
                await this.bot.api.sendMessage(this.adminChatId, this.texts.editLog(oldVal, newText, link), { parse_mode: "HTML" }).catch(() => {});
                return;
            }
        }
    }

    public async handleDelete(msgId: number) {
        for (const [auctionId, auction] of Object.entries(this.activeAuctions)) {
            let deletedVal: string | number | null = null;

            if (auction.bids[msgId]) {
                deletedVal = auction.bids[msgId].amount;
            } else if (auction.invalidBids?.[msgId]) {
                deletedVal = `(Хибна ставка) ${auction.invalidBids[msgId]}`;
            }

            if (deletedVal !== null) {
                const link = `https://t.me/c/${auction.chatId.toString().replace("-100", "")}/${msgId}`;
                await this.bot.api.sendMessage(this.adminChatId, this.texts.deleteLog(deletedVal, link), { parse_mode: "HTML" }).catch(() => {});
                return;
            }
        }
    }

    private findAuctionIdByReply(replyId: number): number | null {
        if (this.activeAuctions[replyId]) return replyId; 
        for (const [aId, auction] of Object.entries(this.activeAuctions)) {
            if (auction.bids[replyId] || auction.invalidBids?.[replyId]) return parseInt(aId); 
        }
        return null;
    }

    private async sendTempWarning(ctx: Context, text: string) {
        const msg = await ctx.reply(`❌ ${text}`, { reply_parameters: { message_id: ctx.message!.message_id }, parse_mode: "HTML" });
        setTimeout(() => ctx.api.deleteMessage(ctx.chat!.id, msg.message_id).catch(() => {}), 10000);
    }
}