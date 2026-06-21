import { Bot, Context, GrammyError, HttpError, InlineKeyboard } from "grammy";
import { CONFIG } from "./config";
import { formatPremiumEmoji, getDefaultKeyboard, getStartKeyboard, hasRussian } from "./utils";
import { FastCache } from "./cache";
import { ShigiDatabase } from "./db";
import { AuctionManager } from "../auction"; 

export function startShigiBot() {
  const bot = new Bot(CONFIG.token);
  const db = new ShigiDatabase(CONFIG.dbPath);
  
  const processedMediaGroups = new FastCache<string>(60000);

  const auctionManager = new AuctionManager(bot as any, "./shigi_auctions.json", {
    notReply: "Ставку треба робити реплаєм на попередню!",
    notReplyToLast: "Упс! Ставку потрібно робити реплаєм виключно на ОСТАННЮ актуальну ставку в чаті! ⚠️",
    tooSmall: (min) => `Ставка замала! Мінімальна наступна: ${min}`,
    late: "Аукціон вже закінчився, ви трошки запізнилися 🙏",
    lateNoBids: "Аукціон закінчився! Радий бачити стільки активності, дякую всім учасникам!",
    extended: "⏳ Ставка в останні хвилини! Час аукціону продовжено на 30 хв.",
    editWarn: "Аяяй, я все бачу! Редагувати ставки заборонено 😏",
    editLog: (userId, link) => `🚨 <b>Редагування ставки!</b>\nID: <code>${userId}</code>\n<a href="${link}">Посилання</a>`,
  }, CONFIG.adminChatId);

  const logTo = async (threadId: number, message: string) => {
    try {
      await bot.api.sendMessage(CONFIG.adminChatId, message, {
        message_thread_id: threadId,
        parse_mode: "HTML"
      });
    } catch (e: any) {
      if (e.description?.includes("message thread not found")) {
        await bot.api.sendMessage(CONFIG.adminChatId, `⚠️ <i>(Гілку не знайдено)</i>\n\n${message}`, { parse_mode: "HTML" }).catch(() => {});
      } else console.error(`[${CONFIG.name}] Помилка логування:`, e.message);
    }
  };

  const sendPostMarkup = async (ctx: Context) => {
    const msg = ctx.msg || ctx.channelPost;
    if (!msg) return;

    const mgId = msg.media_group_id;
    if (mgId && processedMediaGroups.has(mgId)) return;

    const text = (msg.text || msg.caption || "").toLowerCase();
    let replyText = "";

    if (text.includes("[l]") || text.includes("[л]")) {
      replyText = CONFIG.texts.lot;
    } else if (text.includes("[a]") || text.includes("[а]")) {
      replyText = CONFIG.texts.auction;
      auctionManager.registerPost(msg.message_id, ctx.chat!.id, msg.text || msg.caption || "");
    }

    if (!replyText) return;

    try {
      await ctx.reply(formatPremiumEmoji(replyText), {
        reply_parameters: { message_id: msg.message_id },
        reply_markup: getDefaultKeyboard(),
        parse_mode: "HTML",
        disable_web_page_preview: true
      } as any);

      if (mgId) processedMediaGroups.add(mgId);
    } catch (e) {
      console.error("Помилка відправки маркапу:", e);
    }
  };

  bot.command("start", async (ctx) => {
    if (ctx.chat?.type !== "private") return;
    await ctx.reply(formatPremiumEmoji(CONFIG.texts.start), {
      parse_mode: "HTML",
      reply_markup: getStartKeyboard(),
      disable_web_page_preview: true
    } as any).catch(console.error);
  });

  bot.command("status", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId || !CONFIG.admins.includes(userId)) return;

    const args = ctx.match.split(" ");

    const chatId = args[0] ? Number(args[0]) : ctx.chat.id;

    if (isNaN(chatId)) {
      return ctx.reply("❌ Формат: <code>/status [-100xxxxxx]</code>", { parse_mode: "HTML" });
    }

    try {
    
      const botMember = await ctx.api.getChatMember(chatId, ctx.me.id);
      
      let canDelete = false;
      if (botMember.status === "administrator") {
        canDelete = botMember.can_delete_messages ?? false;
      }

      const statusText = canDelete 
        ? `✅ Бот <b>має право</b> видаляти повідомлення у чаті <code>${chatId}</code>.`
        : `❌ Бот <b>НЕ має права</b> видаляти повідомлення у чаті <code>${chatId}</code> (бракує прав або не є адміністратором).`;

      await ctx.reply(statusText, { parse_mode: "HTML" });
    } catch (e: any) {
      await ctx.reply(`❌ Помилка API: ${e.message}`);
    }
  });

  bot.command("postrep", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId || !CONFIG.admins.includes(userId)) return;

    const args = ctx.match.split(" ");
    if (args.length < 2) {
      return ctx.reply("❌ Формат: <code>/postrep -100xxxxxx message_id [a/l]</code>", { parse_mode: "HTML" });
    }

    const chatId = Number(args[0]);
    const messageId = Number(args[1]);
    const type = args[2]?.toLowerCase();
    
    let replyText = type === "l" || type === "л" ? CONFIG.texts.lot : type === "a" || type === "а" ? CONFIG.texts.auction : null;
    if (!replyText) return ctx.reply("❌ Невідомий тип. Використовуй a (аукціон) або l (лот).");

    try {
      await ctx.api.sendMessage(chatId, formatPremiumEmoji(replyText), {
        reply_parameters: { message_id: messageId },
        reply_markup: getDefaultKeyboard(),
        parse_mode: "HTML"
      } as any);
      await ctx.reply(`✅ Відправлено!`);
    } catch (e: any) {
      await ctx.reply(`❌ Помилка API: ${e.message}`);
    }
  });

  bot.callbackQuery("about_bot", async (ctx) => {
    const aboutText = `Вітаю, я <b>Ліам</b>...\nЯ збираю виключно ваш ID...\nGitHub: https://github.com/kit-kit4/mur`;
    await ctx.editMessageText(aboutText, {
      parse_mode: "HTML",
      reply_markup: new InlineKeyboard().text("⬅️ Назад", "back_to_start"),
      disable_web_page_preview: true
    } as any).catch(() => {});
    await ctx.answerCallbackQuery().catch(() => {});
  });

  bot.callbackQuery("back_to_start", async (ctx) => {
    await ctx.editMessageText(formatPremiumEmoji(CONFIG.texts.start), {
      parse_mode: "HTML",
      reply_markup: getStartKeyboard(),
      disable_web_page_preview: true
    } as any).catch(() => {});
    await ctx.answerCallbackQuery().catch(() => {});
  });

  bot.on("channel_post", async (ctx) => {
    if (CONFIG.allowedResources.includes(ctx.chat.id)) await sendPostMarkup(ctx);
  });

  bot.on("message", async (ctx, next) => {
    const chatId = Number(ctx.chat.id);
    const userId = ctx.from?.id;
    const senderChatId = ctx.message?.sender_chat?.id;

    if (!CONFIG.allowedResources.includes(chatId) && chatId !== CONFIG.adminChatId && ctx.chat.type !== "private") {
      console.log(`[ЛІВ] Чат: ${chatId}. Дозволені на сервері:`, CONFIG.allowedResources);
      await logTo(CONFIG.threads.logs, `⚠️ <b>Спроба додавання!</b>\nЧат ID: <code>${chatId}</code>\nДія: <b>Ліваю...</b> 🏃‍♂️`);
      try { await ctx.leaveChat(); } catch (e) {}
      return;
    }
    if ((userId && CONFIG.vipUsers.includes(userId)) || (senderChatId && CONFIG.vipUsers.includes(senderChatId))) {
      ctx.react("💘").catch(() => {});
    }

    if (ctx.msg.sender_chat?.type === "channel" && CONFIG.allowedResources.includes(ctx.msg.sender_chat.id)) {
      await sendPostMarkup(ctx);
      return;
    }

    await next();
  });

  bot.on("edited_message", async (ctx) => {
    await auctionManager.handleEdit(ctx as any);
  });

  bot.hears(/^[Лл]іам[!?.]*$/i, async (ctx) => {
    await ctx.reply("М? Вибач, ми не можемо бути разом) Можеш запитати Шігі, якщо є питання.\n\nМій номер: <tg-spoiler>? Він тільки для Кайла.</tg-spoiler>", {
      parse_mode: "HTML", reply_parameters: { message_id: ctx.msg.message_id }
    }).catch(() => {});
  });

  bot.hears(/^(раф|раф\s+раф)[!?.]*$/i, async (ctx) => {
    await ctx.reply("Хороший хлопчик)", { reply_parameters: { message_id: ctx.msg.message_id } }).catch(() => {});
  });

  bot.on("message:text", async (ctx) => {
    if (ctx.from?.is_bot || ctx.chat.id === CONFIG.adminChatId || ctx.chat.type === "private") return;

    const isBid = await auctionManager.handleBid(ctx as any);
    if (isBid) return; 

    if (hasRussian(ctx.msg.text)) {
      const userId = ctx.from!.id;
      const count = db.addWarning(userId);

      if (count >= 3) {
        const cleanChatId = ctx.chat.id.toString().replace("-100", "");
        await logTo(CONFIG.threads.logs, `🚨 <b>ПОРУШЕННЯ МОВНИХ ПРАВИЛ</b>\n\n👤 <b>Юзер:</b> ${ctx.from!.first_name}\n🆔 <b>ID:</b> <code>${userId}</code>\n🔗 <a href="https://t.me/c/${cleanChatId}/${ctx.msg.message_id}">Посилання</a>`);
      } else {
        const warnText = `Ой-ой, помітив російську в чаті 🥺\nБудь ласка, ${ctx.from!.first_name} спілкуємось тільки українською, дякую!\n\nПрошу видалити/відредагувати повідомлення.❤️`;
        await ctx.reply(warnText, { reply_parameters: { message_id: ctx.msg.message_id } }).catch(() => ctx.reply(warnText).catch(() => {}));
      }
    }
  });

  bot.catch(async (err) => {
    const e = err.error;
    const errorMsg = e instanceof GrammyError ? e.description : e instanceof HttpError ? "Помилка мережі" : String(e);
    console.error(`[${CONFIG.name}] Помилка:`, errorMsg);
    await logTo(CONFIG.threads.logs, `❌ <b>ПОМИЛКА [${CONFIG.name}]</b>\n\n<pre>${errorMsg}</pre>`);
  });

  bot.start({
    onStart: async (info) => {
      console.log(`${CONFIG.name} успішно запущений на Bun! 🚀`);
      try {
        await bot.api.sendAnimation(CONFIG.adminChatId, CONFIG.startupGifId, {
          caption: `<b>${CONFIG.name}</b> (@${info.username}) увійшов у чат!\n\n${CONFIG.startupCaption}`,
          message_thread_id: CONFIG.threads.uptime,
          parse_mode: "HTML"
        });
      } catch (e) {
        await logTo(CONFIG.threads.uptime, `Встав <b>${CONFIG.name}</b> (@${info.username})\n${CONFIG.startupCaption}`);
      }
    }
  });
}