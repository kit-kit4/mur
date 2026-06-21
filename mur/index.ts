import { Bot, Context, GrammyError, HttpError, InlineKeyboard } from "grammy";
import { CONFIG } from "./config";
import { formatPremiumEmoji, getKeyboard, hasRussian } from "./utils";
import { FastCache } from "./cache";
import { MurDatabase } from "./db";
import { AuctionManager } from "../auction";

export function startMurBot() {
  const bot = new Bot(CONFIG.token);
  const db = new MurDatabase(CONFIG.dbPath);
  
  // Кеш з автоматичним TTL: 1 хвилина для медіагруп, 24 години для постів
  const processedMediaGroups = new FastCache<string>(60000);
  const processedPosts = new FastCache<number>(86400000);

  const auctionManager = new AuctionManager(bot as any, "./mur_auctions.json", {
    notReply: "Ставочки приймаю тільки реплаєм на попередню ціну, будь ласка! 🐾",
    notReplyToLast: "Ой-ой! Ставочку треба робити реплаєм виключно на останню актуальну ціну, щоб я не заплуталась!",
    tooSmall: (min) => `Малувато буде! 🥺 Мінімальна ставка зараз — ${min} грн, спробуй ще раз!`,
    late: "На жаль, аукціон вже закрився. Ти трошки не встиг(ла) 🙏",
    lateNoBids: "Аукціон завершено! Дякую всім за активність!",
    extended: "⏳ Оу, гаряча ставка в останні хвилини! Додаю аукціону ще 30 хвилин часу!",
    editWarn: "Аяяй, я все бачу! Редагувати ставочки не можна, так не роблять 😏",
    editLog: (userId, link) => `🚨 <b>Хтось намагався схитрувати (редагування)!</b>\nID: <code>${userId}</code>\n<a href="${link}">Місце злочину</a>`,
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
    const msg = ctx.msg || ctx.channelPost || ctx.editedMessage;// || ctx.editedChannelPost
    if (!msg) return;

    const mgId = msg.media_group_id;
    const msgId = msg.message_id;

    if (mgId && processedMediaGroups.has(mgId)) return;
    if (processedPosts.has(msgId)) return;

    const text = (msg.text || msg.caption || "").toLowerCase();
    let replyText = "";
    let keyboardType: "lot" | "auction" | "default" = "default";

    if (text.includes("[l]") || text.includes("[л]")) {
      replyText = CONFIG.texts.lot;
      keyboardType = "lot";
    } else if (text.includes("[a]") || text.includes("[а]")) {
      replyText = CONFIG.texts.auction;
      keyboardType = "auction";
      auctionManager.registerPost(msgId, ctx.chat!.id, msg.text || msg.caption || "");
    }

    if (!replyText) return;

    try {
      await ctx.reply(formatPremiumEmoji(replyText), {
        reply_parameters: { message_id: msgId },
        reply_markup: getKeyboard(keyboardType),
        parse_mode: "HTML",
        link_preview: { disable_preview: true }
      } as any);

      processedPosts.add(msgId);
      if (mgId) processedMediaGroups.add(mgId);
    } catch (e) {
      console.error("Помилка відправки маркапу:", e);
    }
  };

  bot.command("start", async (ctx) => {
    if (ctx.chat?.type === "private") {
      await ctx.reply(
        "Я ботик! Якщо є питання - @murumich\n\nЯкщо ти хочеш отримати інформацію про фігурки, будь ласка, приєднуйся до нашого каналу та чатиків! 🐾\n\nКанал: https://t.me/murumishop\nЧат: https://t.me/infomurumi",
        { 
          reply_markup: new InlineKeyboard().text("Як працює бот і що збирає?", "about_bot"), 
          link_preview: { disable_preview: true } 
        } as any
      );
    }
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
    let kbType: "lot" | "auction" = type === "a" || type === "а" ? "auction" : "lot";

    if (!replyText) return ctx.reply("❌ Невідомий тип. Використовуй a або l.");

    try {
      await ctx.api.sendMessage(chatId, formatPremiumEmoji(replyText), {
        reply_parameters: { message_id: messageId },
        reply_markup: getKeyboard(kbType),
        parse_mode: "HTML"
      } as any);
      await ctx.reply(`✅ Відправлено!`);
    } catch (e: any) {
      await ctx.reply(`❌ Помилка API: ${e.message}`);
    }
  });

  bot.callbackQuery("about_bot", async (ctx) => {
    const aboutText = `Вітаю, я бот...\nЯ збираю виключно ваш ID...\nGitHub: https://github.com/kit-kit4/mur`; 
    await ctx.editMessageText(aboutText, {
      parse_mode: "HTML",
      reply_markup: new InlineKeyboard().text("⬅️ Назад", "back_to_start"),
      link_preview: { disable_preview: true }
    } as any).catch(() => {});
    await ctx.answerCallbackQuery().catch(() => {});
  });

  bot.callbackQuery("back_to_start", async (ctx) => {
    const startText = "Я ботик! Якщо є питання...";
    await ctx.editMessageText(startText, {
      reply_markup: new InlineKeyboard().text("Як працює бот і що збирає?", "about_bot"),
      link_preview: { disable_preview: true }
    } as any).catch(() => {});
    await ctx.answerCallbackQuery().catch(() => {});
  });

  bot.on(["channel_post"], async (ctx) => {//, "edited_channel_post"
    if (CONFIG.allowedResources.includes(ctx.chat.id)) await sendPostMarkup(ctx);
  });

  bot.on("message", async (ctx, next) => {
    const chatId = Number(ctx.chat.id);
    const userId = ctx.from?.id;
    if (!CONFIG.allowedResources.includes(chatId) && chatId !== CONFIG.adminChatId && ctx.chat.type !== "private") {
      await logTo(CONFIG.threads.logs, `⚠️ <b>Спроба додавання!</b>\nЧат ID: <code>${chatId}</code>\nДія: <b>Ліваю...</b> 🏃‍♂️`);
      try { await ctx.leaveChat(); } catch (e) {}
      return;
    }
    if (userId && CONFIG.vipUsers.includes(userId)) {
      ctx.react("💘").catch(() => {});
    }
    if (ctx.msg.sender_chat?.type === "channel" && CONFIG.allowedResources.includes(ctx.msg.sender_chat.id)) {
      await sendPostMarkup(ctx);
      return;
    }

    await next();
  });

  bot.on("edited_message", async (ctx, next) => {
    if (ctx.editedMessage?.sender_chat?.type === "channel" && CONFIG.allowedResources.includes(ctx.editedMessage.sender_chat.id)) {
      await sendPostMarkup(ctx);
      return;
    }
    await auctionManager.handleEdit(ctx as any);
    await next();
  });

  bot.hears(/^[Мм]ур[!?.]*$/i, async (ctx) => {
    await ctx.reply("Хальо, няв няв.🐾", { reply_parameters: { message_id: ctx.msg.message_id } }).catch(() => {});
  });

  bot.hears(/^!відповідь\s+(.+)$/i, async (ctx) => {
    const answer = Math.random() > 0.5 ? "Так" : "Ні";
    await ctx.reply(`Я думаю, що "${ctx.match[1]}": ${answer}`, { reply_parameters: { message_id: ctx.msg.message_id } }).catch(() => {});
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
        await logTo(
          CONFIG.threads.logs,
          `🚨 <b>ПОРУШЕННЯ МОВНИХ ПРАВИЛ</b>\n\n👤 <b>Юзер:</b> ${ctx.from!.first_name}\n🆔 <b>ID:</b> <code>${userId}</code>\n🔗 <a href="https://t.me/c/${cleanChatId}/${ctx.msg.message_id}">Посилання</a>`
        );
      } else {
        const warnText = `Ой-ой, помітив російську в чаті 🥺\n Будь ласка, спілкуємось тільки українською, дякую! \n\n(Усне для ${ctx.from!.first_name} (${count}/3) )`;
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
      console.log(`${CONFIG.name} Є`);
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