import * as fs from 'fs';
import { Bot, Context } from 'grammy';

// Структура ткст
export interface AuctionTexts {
    notReply: string;
    notReplyToLast: string; 
    tooSmall: (minRequired: number) => string;
    late: string;
    extended: string;
    ended: string;
    editWarn: string;
    editLog: (oldVal: number | string, newVal: number | string, link: string) => string;
    deleteLog: (val: number, link: string) => string;
}

// Структура аук
interface AuctionData {
    chatId: number;
    startBid: number;
    step: number;
    currentBid: number;
    endTime: number | null;
    isDynamic: boolean;
    lastBidMsgId: number; // ID 
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
            console.error(`Помилка запису БД аукціонів (${this.dbPath}):`, e);
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
        if (!ctx.message || !ctx.message.reply_to_message) return false;
        
        const replyId = ctx.message.reply_to_message.message_id;
        const msgId = ctx.message.message_id;
        const text = ctx.message.text?.toLowerCase().replace(/[.*]/g, "").trim() || "";
        
        let auctionId = this.findAuctionIdByReply(replyId);
        if (!auctionId) return false; 

        const auction = this.activeAuctions[auctionId];
        const now = Date.now();

        // 1. Перевірка закінчення часу
        if (auction.endTime && now > auction.endTime) {
            const isDeleted = await ctx.deleteMessage().then(() => true).catch(() => false);
            
            if (isDeleted) {
                
                const msg = await ctx.reply(this.texts.late);
                setTimeout(() => ctx.api.deleteMessage(ctx.chat!.id, msg.message_id).catch(() => {}), 10000);
            } else {
               
                await ctx.reply(this.texts.late, { reply_parameters: { message_id: msgId } });
            }
            return true;
        }

        
        if (replyId !== auction.lastBidMsgId) {
            await this.sendTempWarning(ctx, this.texts.notReplyToLast);
            auction.invalidBids[msgId] = text; 
            this.isDirty = true;
            return true;
        }

        let bidAmount = parseInt(text);
        if (text === "поч" || text === "початкова") {
            bidAmount = auction.startBid;
        }

        if (isNaN(bidAmount)) return false; //(не число)

        // 3. Валідація суми
        if (auction.currentBid === 0) {
            // Перша 
            if (bidAmount < auction.startBid) {
                await this.sendTempWarning(ctx, this.texts.tooSmall(auction.startBid));
                auction.invalidBids[msgId] = text;
                this.isDirty = true;
                return true;
            }
            if (auction.isDynamic) auction.endTime = now + 24 * 60 * 60 * 1000;
        } else {
            // Наступні
            const minRequired = auction.currentBid + auction.step;
            if (bidAmount < minRequired) {
                await this.sendTempWarning(ctx, this.texts.tooSmall(minRequired));
                auction.invalidBids[msgId] = text;
                this.isDirty = true;
                return true;
            }
            
            // Анти-снайпер
            if (auction.endTime && (auction.endTime - now) < 30 * 60 * 1000) {
                auction.endTime += 30 * 60 * 1000;
                await ctx.reply(this.texts.extended, { reply_parameters: { message_id: msgId } });
            }
        }

        // Успішна ставка
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

    //  малі/хибні ставки)
    public async handleEdit(ctx: Context) {
        if (!ctx.editedMessage) return;
        const msgId = ctx.editedMessage.message_id;
        
        for (const [auctionId, auction] of Object.entries(this.activeAuctions)) {
            let oldVal: string | number | null = null;

            if (auction.bids[msgId]) {
                oldVal = auction.bids[msgId].amount;
            } else if (auction.invalidBids[msgId]) {
                oldVal = `(Хибна ставка) ${auction.invalidBids[msgId]}`;
            }

            if (oldVal !== null) {
                const newText = ctx.editedMessage.text || "видалив текст";
                
                // Сваримо
                await ctx.reply(this.texts.editWarn, { reply_parameters: { message_id: msgId } });
                
                // адмінам
                const link = `https://t.me/c/${auction.chatId.toString().replace("-100", "")}/${msgId}`;
                await this.bot.api.sendMessage(this.adminChatId, this.texts.editLog(oldVal, newText, link), { parse_mode: "HTML" }).catch(() => {});
                return;
            }
        }
    }

    // Допоміжні методи
    private findAuctionIdByReply(replyId: number): number | null {
        if (this.activeAuctions[replyId]) return replyId; // Реплай на пост
        for (const [aId, auction] of Object.entries(this.activeAuctions)) {
            
            if (auction.bids[replyId] || auction.invalidBids[replyId]) return parseInt(aId); 
        }
        return null;
    }

    private async sendTempWarning(ctx: Context, text: string) {
        const msg = await ctx.reply(`❌ ${text}`, { reply_parameters: { message_id: ctx.message!.message_id } });
        // Видаляємо через 10 секунд
        setTimeout(() => ctx.api.deleteMessage(ctx.chat!.id, msg.message_id).catch(() => {}), 10000);
    }
}