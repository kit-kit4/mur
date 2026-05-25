import { Bot, GrammyError, HttpError, InlineKeyboard } from "grammy";
import * as fs from "fs";

const CONFIG = {
  name: "Мур-БОТ",
  token: process.env.MUR_BOT || "",
  admins: [5147076742, 8296806565],
  allowedResources: [
    -1002789684698, -1003200253794, -1002557455848, -1002563493364,
    -1003872064368, -1002808281023, 5147076742, 8296806565, 987654321
  ],
  adminChatId: -1002808281023,
  vipUsers: [5147076742, 992804916, 380752717, 8296806565],
  threads: {
    uptime: 530,
    logs: 3861
  },
  dbPath: "./mur_storage.json",
  startupGifId:
    "CgACAgQAAyEFAASnYve_AAISWWnRNUYojtzxI9jKVcTxdoGGyPPIAAI0AwACuO4EU0owWp5UIXEFOwQ",
  startupCaption: "О ні, я знову тут! Та скільки ж можна. Я хочу відпочити!",

  // Тексти для різних типів постів
  texts: {
    default: ``,
    lot: `<i>Нагадування</i> від Мурумі!\n\nХочеш тут фігурку? \n<b>Пиши Бронь</b> + скрін/назва у коментарях! \n\nОплата виключно на ФОП (це офіційний рахунок бізнесу).\n\n<blockquote><prem>5429605292331533576+💌</prem> Зв'язок/Адмін: @murumich</blockquote>\n\n<u>Спілкування лише українською.</u>`,
    auction: `<i>Нагадування</i> від Мурумі!\n\nХочеш цю фігурку? <b>Став ставку!</b>\n<i>(і відповідайте реплаєм на попередню)</i>\n\n<blockquote><b>ПРАВИЛА аукціону:</b>\n ✿ Ставки не можна відміняти(Я все побачу)\n ✿ Флудити <b>заборонено</b></blockquote>\n\n<prem>5429605292331533576+💌</prem> <b>Зв'язок:</b> @murumich\n\n <u>Спілкування лише українською.</u>`
  }
};

const formatPremiumEmoji = (text: string) =>
  text.replace(
    /<prem>(\d+)\+(.*?)<\/prem>/g,
    (m, id, emo) => `<tg-emoji emoji-id="${id}">${emo}</tg-emoji>`
  );

const hasRussian = (text: string) => {
  if (/[ёъыэ]/i.test(text)) return true;
  const russianMarkers = [
    "что",
    "как",
    "окак",
    "почему",
    "зачем",
    "когда",
    "только",
    "очень",
    "сейчас",
    "было",
    "есть",
    "будет",
    "него",
    "сделал",
    "сказал",
    "привет",
    "спасибо",
    "пожалуйста",
    "случилось",
    "если",
    "админ",
    "купил",
    "цена",
    "сколько",
    "нетути",
    "вообще",
    "совсем",
    "вместе",
    "после",
    "вчера",
    "сегодня",

    "быстро"
  ];
  const words = text.toLowerCase().split(/\s+/);
  return words.some((word) =>
    russianMarkers.includes(word.replace(/[?.!,]/g, ""))
  );
};

const getDefaultKeyboard = () =>
  new InlineKeyboard()
    .url("Відгуки 📝", "https://t.me/infomurumi/7")
    .url("Скільки чекати? ⏳", "https://t.me/murumishop/64")
    .row()
    .url("Як це працює? 🗺", "https://t.me/murumishop/106")
    .row()
    .url("Наш Чатик", "https://t.me/infomurumi/13");

const getLotKeyboard = () =>
  new InlineKeyboard()
    .url("Відгуки 📝", "https://t.me/infomurumi/7")
    .url("Скільки чекати? ⏳", "https://t.me/murumishop/64")
    .row()
    .url("Як це працює? 🗺", "https://t.me/murumishop/106")
    .row()
    .url("Наш Чатик", "https://t.me/infomurumi/13");

const getAuctionKeyboard = () =>
  new InlineKeyboard()
    .url("Відгуки 📝", "https://t.me/infomurumi/7")
    .url("Наш Чатик", "https://t.me/infomurumi/13");
export function startMurBot() {
  const bot = new Bot(CONFIG.token);
  const processedMediaGroups = new Set<string>();

  const initDb = () => {
    if (!fs.existsSync(CONFIG.dbPath)) {
      fs.writeFileSync(
        CONFIG.dbPath,
        JSON.stringify({ warnings: {}, lastReset: new Date().toISOString() })
      );
    }
  };
  const loadDb = () => {
    initDb();
    return JSON.parse(fs.readFileSync(CONFIG.dbPath, "utf-8"));
  };
  const saveDb = (data: any) =>
    fs.writeFileSync(CONFIG.dbPath, JSON.stringify(data, null, 2));

  const logTo = async (threadId: number, message: string) => {
    try {
      await bot.api.sendMessage(CONFIG.adminChatId, message, {
        message_thread_id: threadId,
        parse_mode: "HTML"
      });
    } catch (e: any) {
      if (e.description?.includes("message thread not found")) {
        await bot.api
          .sendMessage(
            CONFIG.adminChatId,
            `⚠️ <i>(Гілку не знайдено)</i>\n\n${message}`,
            { parse_mode: "HTML" }
          )
          .catch(() => {});
      } else console.error(`[${CONFIG.name}] Помилка логування:`, e.message);
    }
  };
  initDb();

  bot.command("start", async (ctx) => {
    if (ctx.chat?.type === "private") {
      const keyboard = new InlineKeyboard().text(
        "Як працює бот і що збирає?",
        "about_bot"
      );

      await ctx.reply(
        "Я ботик! Якщо є питання - @murumich\n\nЯкщо ти хочеш отримати інформацію про фігурки, будь ласка, приєднуйся до нашого каналу та чатиків! 🐾\n\nКанал: https://t.me/murumishop\nЧат: https://t.me/infomurumi",
        { reply_markup: keyboard }
      );
    }
  });

  bot.callbackQuery("about_bot", async (ctx) => {
    const aboutText = `Вітаю, я бот, створений для каналу "murumishop". Моя мета — надсилати під постами каналу додаткову інформацію для аукціонів та лотів, а також нагадувати про правила.

<b>Які дані я збираю?</b>
Я збираю виключно ваш ID під час того, як ви порушуєте мовні правила чату. 

Як саме? 
Коли ви пишете російські слова, я даю вам попередження, записую ваш ідентифікаційний код Telegram (його бачать буквально всі) і присвоюю вам варн. При 3-му порушенні я надсилаю в приватні адміну просте нагадування про ваше порушення. Не більше. Покарання залишається виключно на розсуд адміна.

Якщо ви не довіряєте мені, то можете перейти на мій GitHub, самостійно переглянути код та навіть надіслати його Штучному інтелекту на перевірку, якщо ви не знаєтеся на програмуванні.

GitHub: https://github.com/kit-kit4/mur

З любов'ю, Помічниця 💙`;

    const keyboard = new InlineKeyboard().text("⬅️ Назад", "back_to_start");

    await ctx.editMessageText(aboutText, {
      parse_mode: "HTML",
      reply_markup: keyboard
    });
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery("back_to_start", async (ctx) => {
    const startText =
      "Я ботик! Якщо є питання - @murumich\n\nЯкщо ти хочеш отримати інформацію про фігурки, будь ласка, приєднуйся до нашого каналу та чатиків! 🐾\n\nКанал: https://t.me/murumishop\nЧат: https://t.me/infomurumi";

    const keyboard = new InlineKeyboard().text(
      "Як працює бот і що збирає?",
      "about_bot"
    );

    await ctx.editMessageText(startText, {
      reply_markup: keyboard
    });

    await ctx.answerCallbackQuery();
  });

  bot.on("message", async (ctx, next) => {
    if (
      !CONFIG.allowedResources.includes(ctx.chat.id) &&
      ctx.chat.id !== CONFIG.adminChatId &&
      ctx.chat.type !== "private"
    ) {
      await logTo(
        CONFIG.threads.logs,
        `⚠️ <b>Спроба додавання!</b>\nЧат ID: <code>${ctx.chat.id}</code>\nДія: <b>Ліваю...</b> 🏃‍♂️`
      );
      try {
        await ctx.leaveChat();
      } catch (e) {}
      return;
    }
    await next();
  });

  bot.on("message", async (ctx, next) => {
    if (ctx.from && CONFIG.vipUsers.includes(ctx.from.id)) {
      try {
        await ctx.react("💘");
      } catch (e) {}
    }
    await next();
  });

  // 3. Команда Мур
  bot.hears(/^[Мм]ур[!?.]*$/i, async (ctx) => {
    await ctx.reply("Хальо, няв няв.🐾", {
      reply_parameters: { message_id: ctx.msg.message_id }
    });
  });

  bot.command("postrep", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId || !CONFIG.admins.includes(userId)) return;

    const args = ctx.match.split(" ");
    if (args.length < 2 || args.length > 3) {
      await ctx.reply(
        "❌ Формат: <code>/postrep -100xxxxxx message_id [a/l]</code>\nНаприклад: <code>/postrep -10012345 567 a</code>",
        { parse_mode: "HTML" }
      );
      return;
    }

    const chatId = Number(args[0]);
    const messageId = Number(args[1]);
    const type = args[2]?.toLowerCase();

    if (isNaN(chatId) || isNaN(messageId)) {
      await ctx.reply("❌ ID чату та ID повідомлення мають бути числами!");
      return;
    }

    let replyText = CONFIG.texts.default;
    let keyboard = getDefaultKeyboard();

    if (type === "l" || type === "л") {
      replyText = CONFIG.texts.lot;
      keyboard = getLotKeyboard();
    } else if (type === "a" || type === "а") {
      replyText = CONFIG.texts.auction;
      keyboard = getAuctionKeyboard();
    }

    try {
      await ctx.api.sendMessage(chatId, formatPremiumEmoji(replyText), {
        reply_parameters: { message_id: messageId },
        reply_markup: keyboard,
        parse_mode: "HTML"
      });
      await ctx.reply(`✅ відправлено!`);
    } catch (e: any) {
      await ctx.reply(
        `❌ Помилка API: ${e.message}\nПеревір ID та права бота.`
      );
    }
  });

  const sendPostMarkup = async (ctx: any) => {
    const mgId = ctx.msg.media_group_id;
    if (mgId) {
      if (processedMediaGroups.has(mgId)) return;
      processedMediaGroups.add(mgId);
      setTimeout(() => processedMediaGroups.delete(mgId), 60000);
    }

    const text = (ctx.msg.text || ctx.msg.caption || "").toLowerCase();
    let replyText = CONFIG.texts.default;
    let keyboard = getDefaultKeyboard();

    if (text.includes("[l]") || text.includes("[л]")) {
      replyText = CONFIG.texts.lot;
      keyboard = getLotKeyboard();
    } else if (text.includes("[a]") || text.includes("[а]")) {
      replyText = CONFIG.texts.auction;
      keyboard = getAuctionKeyboard();
    }

    try {
      await ctx.reply(formatPremiumEmoji(replyText), {
        reply_parameters: ctx.msg.message_id
          ? { message_id: ctx.msg.message_id }
          : undefined,
        reply_markup: keyboard,
        parse_mode: "HTML"
      });
    } catch (e) {}
  };

  bot.on("channel_post", async (ctx) => {
    if (CONFIG.allowedResources.includes(ctx.chat.id))
      await sendPostMarkup(ctx);
  });

  bot.on("message", async (ctx, next) => {
    if (
      ctx.msg.sender_chat?.type === "channel" &&
      CONFIG.allowedResources.includes(ctx.msg.sender_chat.id)
    ) {
      await sendPostMarkup(ctx);
      return;
    }
    await next();
  });
  bot.on("message:text", async (ctx) => {
    if (
      ctx.from?.is_bot ||
      ctx.chat.id === CONFIG.adminChatId ||
      ctx.chat.type === "private"
    )
      return;

    if (hasRussian(ctx.msg.text)) {
      const userId = ctx.from?.id;
      if (!userId) return;

      const db = loadDb();
      db.warnings[userId] = (db.warnings[userId] || 0) + 1;
      saveDb(db);

      if (db.warnings[userId] >= 3) {
        const cleanChatId = ctx.chat.id.toString().replace("-100", "");
        await logTo(
          CONFIG.threads.logs,
          `🚨 <b>ПОРУШЕННЯ МОВНИХ ПРАВИЛ</b>\n\n👤 <b>Юзер:</b> ${ctx.from.first_name}\n🆔 <b>ID:</b> <code>${userId}</code>\n🔗 <a href="https://t.me/c/${cleanChatId}/${ctx.msg.message_id}">Посилання</a>`
        );
      } else {
        const warnText = `Ой-ой, помітив російську в чаті 🥺\n Будь ласка, спілкуємось тільки українською, дякую! \n\n(Усне для ${ctx.from.first_name} (${db.warnings[userId]}/3) )`;

        try {
          await ctx.reply(warnText, {
            reply_parameters: { message_id: ctx.msg.message_id }
          });
        } catch (e) {
          await ctx.reply(warnText);
        }
      }
    }
  });
  bot.catch(async (err) => {
    const e = err.error;
    let errorMsg =
      e instanceof GrammyError
        ? e.description
        : e instanceof HttpError
          ? "Помилка мережі"
          : String(e);
    console.error(`[${CONFIG.name}] Помилка:`, errorMsg);
    await logTo(
      CONFIG.threads.logs,
      `❌ <b>ПОМИЛКА [${CONFIG.name}]</b>\n\n<pre>${errorMsg}</pre>`
    );
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
        await logTo(
          CONFIG.threads.uptime,
          `Встав <b>${CONFIG.name}</b> (@${info.username})\n${CONFIG.startupCaption}`
        );
      }
    }
  });
}
