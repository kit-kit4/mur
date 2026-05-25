import * as fs from 'fs';
import { Bot, Context } from 'grammy';

// Структура ткст
export interface AuctionTexts {
    notReply: string;
    tooSmall: (minRequired: number) => string;
    late: string;
    extended: string;
    ended: string;
    editWarn: string;
    editLog: (oldVal: number, newVal: number | string, link: string) => string;
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
            endTime: isDynamic ? null : Date.now() + 24 * 60 * 60 * 1000, // Дефолт 24 год
            isDynamic,
            bids: {}
        };
        this.isDirty = true;
    }

    public async handleBid(ctx: Context) {
        if (!ctx.message || !ctx.message.reply_to_message) return false;
        
        const replyId = ctx.message.reply_to_message.message_id;
        const text = ctx.message.text?.toLowerCase().replace(/[.*]/g, "").trim() || "";
        
        // ID 
        let auctionId = this.findAuctionIdByReply(replyId);
        if (!auctionId) return false; // рпл не в аук

        const auction = this.activeAuctions[auctionId];
        const now = Date.now();

        // (закінчився?)
        if (auction.endTime && now > auction.endTime) {
            await ctx.deleteMessage().catch(() => {});
            const msg = await ctx.reply(this.texts.late, { reply_parameters: { message_id: replyId } });
            setTimeout(() => ctx.api.deleteMessage(ctx.chat!.id, msg.message_id).catch(() => {}), 10000);
            return true;
        }

        let bidAmount = parseInt(text);
        if (text === "поч" || text === "початкова") {
            bidAmount = auction.startBid;
        }

        if (isNaN(bidAmount)) return false; // флуд

        if (auction.currentBid === 0) {
            if (bidAmount < auction.startBid) {
                await this.sendTempWarning(ctx, this.texts.tooSmall(auction.startBid));
                return true;
            }
            if (auction.isDynamic) auction.endTime = now + 24 * 60 * 60 * 1000;
        } else {
            // Наступні ств
            const minRequired = auction.currentBid + auction.step;
            if (bidAmount < minRequired) {
                await this.sendTempWarning(ctx, this.texts.tooSmall(minRequired));
                return true;
            }
            
            // якщо до кінця менше 30 хв, додаємо ще 30 хв
            if (auction.endTime && (auction.endTime - now) < 30 * 60 * 1000) {
                auction.endTime += 30 * 60 * 1000;
                await ctx.reply(this.texts.extended, { reply_parameters: { message_id: ctx.message.message_id } });
            }
        }

        // Успішна став
        auction.currentBid = bidAmount;
        auction.bids[ctx.message.message_id] = {
            userId: ctx.from!.id,
            amount: bidAmount,
            text: ctx.message.text || ""
        };
        this.isDirty = true;

        await ctx.react("💘").catch(() => {});
        return true;
    }

    // (Я все бачу)
    public async handleEdit(ctx: Context) {
        if (!ctx.editedMessage) return;
        const msgId = ctx.editedMessage.message_id;
        
        for (const [auctionId, auction] of Object.entries(this.activeAuctions)) {
            if (auction.bids[msgId]) {
                const oldBid = auction.bids[msgId];
                const newText = ctx.editedMessage.text || "видалив текст";
                
                // Сваримо
                await ctx.reply(this.texts.editWarn, { reply_parameters: { message_id: msgId } });
                
                // адм
                const link = `https://t.me/c/${auction.chatId.toString().replace("-100", "")}/${msgId}`;
                await this.bot.api.sendMessage(this.adminChatId, this.texts.editLog(oldBid.amount, newText, link), { parse_mode: "HTML" });
                return;
            }
        }
    }

    // Допоміжні методи
    private findAuctionIdByReply(replyId: number): number | null {
        if (this.activeAuctions[replyId]) return replyId; // на пост
        for (const [aId, auction] of Object.entries(this.activeAuctions)) {
            if (auction.bids[replyId]) return parseInt(aId); //на ставку
        }
        return null;
    }

    private async sendTempWarning(ctx: Context, text: string) {
        const msg = await ctx.reply(`❌ ${text}`, { reply_parameters: { message_id: ctx.message!.message_id } });
        // Видаляємо попередженнячерез 10 секунд
        setTimeout(() => ctx.api.deleteMessage(ctx.chat!.id, msg.message_id).catch(() => {}), 10000);
    }
}