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
    // Логи для адмінів тепер можуть бути простішими, бо ми зберігаємо все в базі
    editLog: (userId: number, link: string) => string; 
}

// Розширена структура для Web App
interface BidLog {
    msgId: number;
    userId: number;
    firstName: string;
    amount: number | null;
    rawText: string;
    timestamp: number;
    isValid: boolean;
    invalidReason?: string;
}

interface AuctionData {
    auctionId: number; 
    chatId: number;
    startBid: number;
    step: number;
    currentBid: number;
    endTime: number | null;
    isDynamic: boolean;
    lastBidMsgId: number;
    createdAt: number;
    history: BidLog[]; 
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
            this.activeAuctions = JSON.parse(fs.readFileSync(this.dbPath, "utf-8"));
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
            console.error("Помилка збереження БД:", e);
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

        if (auction.currentBid === 0) return;

        const validBids = auction.history.filter(b => b.isValid);
        const winner = validBids[validBids.length - 1]; 
        if (!winner) return;

        const cleanChatId = auction.chatId.toString().replace("-100", "");
        const auctionLink = `https://t.me/c/${cleanChatId}/${auctionId}`;
        const userLink = `<a href="tg://user?id=${winner.userId}">${winner.firstName}</a>`;

        await this.bot.api.sendMessage(auction.chatId, "ВАША", {
            reply_parameters: { message_id: winner.msgId }
        }).catch(() => {});

        const adminMsg = 
            `🏆 <b>Аукціон завершено!</b>\n` +
            `Переможець: ${userLink} (ID: <code>${winner.userId}</code>)\n` +
            `Ставка: <b>${winner.amount}</b>\n` +
            `🔗 <a href="${auctionLink}">Пост аукціону</a>`;

        await this.bot.api.sendMessage(this.adminChatId, adminMsg, { parse_mode: "HTML" }).catch(() => {});
    }

    public registerPost(messageId: number, chatId: number, text: string) {
        const startMatch = text.match(/початкова ставка\s*(?:-|:)\s*(\d+)/i);
        const stepMatch = text.match(/мінімальн(?:е підняття|ий крок)\s*(?:-|:)\s*(\d+)/i);

        if (!startMatch || !stepMatch) return;

        const isDynamic = text.includes("після публікування першої ставки");

        this.activeAuctions[messageId] = {
            auctionId: messageId,
            chatId,
            startBid: parseInt(startMatch[1]),
            step: parseInt(stepMatch[1]),
            currentBid: 0,
            endTime: isDynamic ? null : Date.now() + 24 * 60 * 60 * 1000,
            isDynamic,
            lastBidMsgId: messageId,
            createdAt: Date.now(),
            history: []
        };
        this.isDirty = true;
    }

    private getAuctionId(ctx: Context): number | null {
        if (ctx.message?.message_thread_id && this.activeAuctions[ctx.message.message_thread_id]) {
            return ctx.message.message_thread_id;
        }
        if (ctx.message?.reply_to_message?.message_id && this.activeAuctions[ctx.message.reply_to_message.message_id]) {
            return ctx.message.reply_to_message.message_id;
        }
        
        const replyId = ctx.message?.reply_to_message?.message_id;
        if (replyId) {
            for (const [aId, auction] of Object.entries(this.activeAuctions)) {
                if (auction.history.some(log => log.msgId === replyId)) return parseInt(aId);
            }
        }
        return null;
    }

    private extractBidAmount(text: string, startBid: number): number {
        const cleanText = text.toLowerCase().replace(/\s+/g, '');
        if (cleanText.includes("поч")) return startBid;
        const match = cleanText.match(/\d+/);
        return match ? parseInt(match[0], 10) : NaN;
    }

    public async handleBid(ctx: Context) {
        if (!ctx.message || ctx.from?.is_bot) return false;

        const auctionId = this.getAuctionId(ctx);
        if (!auctionId) return false;

        const auction = this.activeAuctions[auctionId];
        const msgId = ctx.message.message_id;
        const text = ctx.message.text || "";
        const now = Date.now();

        const logEntry: Omit<BidLog, 'isValid'> = {
            msgId,
            userId: ctx.from!.id,
            firstName: ctx.from!.first_name,
            amount: null,
            rawText: text,
            timestamp: now
        };
        const bidAmount = this.extractBidAmount(text, auction.startBid);
        if (isNaN(bidAmount)) {
            return false; 
        }

        if (!ctx.message.reply_to_message) {
            await this.rejectBid(ctx, auction, logEntry, this.texts.notReply, "No reply");
            return true;
        }

        if (ctx.message.reply_to_message.message_id !== auction.lastBidMsgId) {
            const cleanChatId = auction.chatId.toString().replace("-100", "");
            const lastBidLink = `https://t.me/c/${cleanChatId}/${auction.lastBidMsgId}`;
            await this.rejectBid(ctx, auction, logEntry, `${this.texts.notReplyToLast}\n\n🔗 <a href="${lastBidLink}">Остання ставка тут</a>`, "Wrong reply target");
            return true;
        }

        if (auction.endTime && now > auction.endTime) {
            await ctx.deleteMessage().catch(() => {});
            const responseText = auction.currentBid === 0 ? this.texts.lateNoBids : this.texts.late;
            await this.sendTempMessage(ctx, responseText);
            return true;
        }

        if (auction.currentBid === 0 && bidAmount < auction.startBid) {
            await this.rejectBid(ctx, auction, logEntry, this.texts.tooSmall(auction.startBid), "Below start bid");
            return true;
        }

        const minRequired = auction.currentBid > 0 ? auction.currentBid + auction.step : auction.startBid;
        if (auction.currentBid > 0 && bidAmount < minRequired) {
            await this.rejectBid(ctx, auction, logEntry, this.texts.tooSmall(minRequired), "Bid too small");
            return true;
        }
        logEntry.amount = bidAmount;
        auction.history.push({ ...logEntry, isValid: true });
        auction.currentBid = bidAmount;
        auction.lastBidMsgId = msgId;

        if (auction.isDynamic && auction.currentBid === bidAmount) {
             auction.endTime = now + 24 * 60 * 60 * 1000;
        } else if (auction.endTime && (auction.endTime - now) < 30 * 60 * 1000) {
            auction.endTime += 30 * 60 * 1000;
            await ctx.reply(this.texts.extended, { reply_parameters: { message_id: msgId } }).catch(() => {});
        }

        this.isDirty = true;
        await ctx.react("💘").catch(() => {});
        return true;
    }

    private async rejectBid(ctx: Context, auction: AuctionData, logEntry: any, warningText: string, reason: string) {
        auction.history.push({ ...logEntry, isValid: false, invalidReason: reason });
        this.isDirty = true;
        await ctx.deleteMessage().catch(() => {});
        await this.sendTempMessage(ctx, `❌ ${warningText}`);
    }

    public async handleEdit(ctx: Context) {
        if (!ctx.editedMessage) return;
        const msgId = ctx.editedMessage.message_id;
        for (const [aId, auction] of Object.entries(this.activeAuctions)) {
            const isBid = auction.history.some(log => log.msgId === msgId);
            
            if (isBid) {
                await ctx.deleteMessage().catch(() => {});
                await this.sendTempMessage(ctx, this.texts.editWarn);
                const cleanChatId = auction.chatId.toString().replace("-100", "");
                const link = `https://t.me/c/${cleanChatId}/${aId}`;
                await this.bot.api.sendMessage(
                    this.adminChatId, 
                    this.texts.editLog(ctx.from!.id, link), 
                    { parse_mode: "HTML" }
                ).catch(() => {});
                
                return;
            }
        }
    }

    private async sendTempMessage(ctx: Context, text: string) {
        // Надсилаємо повідомлення без реплаю (оскільки оригінал видалено)
        const msg = await ctx.reply(text, { parse_mode: "HTML" }).catch(() => null);
        if (msg) {
            setTimeout(() => ctx.api.deleteMessage(ctx.chat!.id, msg.message_id).catch(() => {}), 25000);
        }
    }
}