import * as fs from 'fs';
import { Bot, Context } from 'grammy';

export interface AuctionTexts {
    notReply: string;
    notReplyToLast: string; 
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
    bids: Record<number, { userId: number; amount: number; text: string }>; 
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
            await this.sendTempWarning(ctx, this.texts.notReplyToLast);
            auction.invalidBids[msgId] = text; 
            this.isDirty = true;
            return true;
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
            amount: bidAmount,
            text: ctx.message.text || ""
        };
        this.isDirty = true;

        await ctx.react("💘").catch(() => {});
        return true;
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

            if (auction.bids[msgId]) {
                oldVal = auction.bids[msgId].amount;
            } else if (auction.invalidBids?.[msgId]) {
                oldVal = `(Хибна ставка) ${auction.invalidBids[msgId]}`;
            }

            if (oldVal !== null) {
                const newText = ctx.editedMessage.text || "видалив текст";
                
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
        const msg = await ctx.reply(`❌ ${text}`, { reply_parameters: { message_id: ctx.message!.message_id } });
        setTimeout(() => ctx.api.deleteMessage(ctx.chat!.id, msg.message_id).catch(() => {}), 10000);
    }
}