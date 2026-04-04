import { Bot, GrammyError, HttpError, InlineKeyboard } from "grammy";
import * as fs from "fs";

// ==========================================
// КОНФІГУРАЦІЯ МУР-БОТА
// ==========================================
const CONFIG = {
  name: "Мур-БОТ",
  token: "8473334106:AAHVg3p_q7_M46bVLLFBr4QIAGmDhvcCD-U", // Обов'язково зміни токен після тестів!
  admins: [5147076742],
  allowedResources: [
    -1002789684698, -1003200253794, -1002557455848, -1002563493364,
    -1003872064368, -1002808281023, 5147076742, 8296806565, 987654321,
  ],
  adminChatId: -1002808281023,
  vipUsers: [5147076742, 992804916, 380752717],
  threads: {
    uptime: 530,
    logs: 3861,
  },
  dbPath: "./mur_storage.json",
  startupGifId:
    "CgACAgQAAyEFAASnYve_AAISWWnRNUYojtzxI9jKVcTxdoGGyPPIAAI0AwACuO4EU0owWp5UIXEFOwQ",
  startupCaption: "О ні, я знову тут! Та скільки ж можна. Я хочу відпочити!",

  // Тексти для різних типів постів
  texts: {
    default: `<i>НАГАДУВАННЯ</i> від Мурумі!\n\nХочеш тут фігурку? \n<b>Пиши Бронь</b> + скрін/назва у коментарях! \n\nОплата виключно на ФОП.\n\n<blockquote>Писати про оплату може ТІЛЬКИ @murumich. \n\n<prem>5429605292331533576+💌</prem> Зв'язок/Адмін: @murumich</blockquote>\n<u>Спілкування лише українською.</u>`,
    lot: `<i>НАГАДУВАННЯ</i> від Мурумі!\n\nХочеш тут фігурку? \n<b>Пиши Бронь</b> + скрін/назва у коментарях! \n\nОплата виключно на ФОП.\n\n<blockquote>Писати про оплату може ТІЛЬКИ @murumich. \n\n<prem>5429605292331533576+💌</prem> Зв'язок/Адмін: @murumich</blockquote>\n<u>Спілкування лише українською.</u>`,
    auction: `<i>НАГАДУВАННЯ</i> від Мурумі! 🔨\n\nХочеш цю фігурку? <b>Став ставку!</b>\n<i>(і відповідайте реплаєм на попередню)</i>\n\n<blockquote>⭐ Видаляти ставки не можна, я це побачу\n⭐ Оплата виключно на ФОП (це офіційний рахунок бізнесу).\n⭐ Писати про оплату може ТІЛЬКИ @murumich.</blockquote>\n\n<prem>5429605292331533576+💌</prem> <b>Зв'язок:</b> @murumich\n<u>Спілкування лише українською.</u>`,
  },
};

// ==========================================
// УТИЛІТИ ТА КЛАВІАТУРИ
// ==========================================
const formatPremiumEmoji = (text: string) =>
  text.replace(
    /<prem>(\d+)\+(.*?)<\/prem>/g,
    (m, id, emo) => `<tg-emoji emoji-id="${id}">${emo}</tg-emoji>`,
  );

const hasRussian = (text: string) => {
  // 1. Перевірка на унікальні російські літери
  if (/[ёъыэ]/i.test(text)) return true;

  // 2. Список частих російських слів (маркерів)
  const russianMarkers = [
    "что",
    "как",
    "почему",
    "зачем",
    "когда",
    "только",
    "очень",
    "сейчас",
    "было",
    "есть",
    "будет",
    "меня",
    "тебя",
    "него",
    "нее",
    "ними",
    "хочу",
    "могу",
    "сделал",
    "сказал",
    "привет",
    "пока",
    "спасибо",
    "пожалуйста",
    "случилось",
    "нужно",
    "можно",
    "нельзя",
    "тоже",
    "если",
    "админ",
    "бронь",
    "купил",
    "цена",
    "сколько",
    "нету",
    "нетути",
    "хотя",
    "вообще",
    "совсем",
    "даже",
    "вместе",
    "через",
    "после",
    "вчера",
    "сегодня",
    "завтра",
    "прямо",
    "быстро",
    "плохо",
    "хорошо",
  ];

  // Перевіряємо, чи містить текст хоча б одне слово зі списку (цілим словом)
  const words = text.toLowerCase().split(/\s+/);
  return words.some((word) =>
    russianMarkers.includes(word.replace(/[?.!,]/g, "")),
  );
};

const getDefaultKeyboard = () =>
  new InlineKeyboard()
    .url("Відгуки 📝", "https://t.me/infomurumi/7")
    .url("Скільки чекати? ⏳", "https://t.me/murumishop/64")
    .row()
    .url("Як це працює? 🗺", "https://t.me/murumishop/106")
    .url("Канал з посилками 📦", "https://t.me/deliverymurumi")
    .row()
    .url("Наш Чатик", "https://t.me/infomurumi");

const getLotKeyboard = () =>
  new InlineKeyboard()
    .url("Відгуки 📝", "https://t.me/infomurumi/7")
    .url("Скільки чекати? ⏳", "https://t.me/murumishop/64")
    .row()
    .url("Як це працює? 🗺", "https://t.me/murumishop/106")
    .url("Канал з посилками 📦", "https://t.me/deliverymurumi")
    .row()
    .url("Наш Чатик", "https://t.me/infomurumi");

const getAuctionKeyboard = () =>
  new InlineKeyboard()
    .url("Правила Аукціонів 🔨", "https://t.me/murumishop") // Зміни на своє посилання
    .url("Відгуки 📝", "https://t.me/infomurumi/7");

// ==========================================
// МОДУЛЬ БОТА
// ==========================================
export function startMurBot() {
  const bot = new Bot(CONFIG.token);
  const processedMediaGroups = new Set<string>();

  const initDb = () => {
    if (!fs.existsSync(CONFIG.dbPath)) {
      fs.writeFileSync(
        CONFIG.dbPath,
        JSON.stringify({ warnings: {}, lastReset: new Date().toISOString() }),
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
        parse_mode: "HTML",
      });
    } catch (e: any) {
      if (e.description?.includes("message thread not found")) {
        await bot.api
          .sendMessage(
            CONFIG.adminChatId,
            `⚠️ <i>(Гілку не знайдено)</i>\n\n${message}`,
            { parse_mode: "HTML" },
          )
          .catch(() => {});
      } else console.error(`[${CONFIG.name}] Помилка логування:`, e.message);
    }
  };

  initDb();

  // 0. Команда /start ТІЛЬКИ в приватних
  bot.command("start", async (ctx) => {
    if (ctx.chat.type === "private") {
      await ctx.reply(
        "Я ботик! Якщо є питання - @murumich\n/n Якщо ти хочеш отримати інформацію про фігурки, будь ласка, приєднуйся до нашого каналу та чатиків! 🐾\n\nКанал: https://t.me/murumishop\nЧат: https://t.me/infomurumi",
      );
    }
  });

  // 1. Контроль додавань
  bot.on("message", async (ctx, next) => {
    if (
      !CONFIG.allowedResources.includes(ctx.chat.id) &&
      ctx.chat.id !== CONFIG.adminChatId &&
      ctx.chat.type !== "private"
    ) {
      await logTo(
        CONFIG.threads.logs,
        `⚠️ <b>Спроба додавання!</b>\nЧат ID: <code>${ctx.chat.id}</code>\nДія: <b>Ліваю...</b> 🏃‍♂️`,
      );
      try {
        await ctx.leaveChat();
      } catch (e) {}
      return;
    }
    await next();
  });

  // 2. VIP сердечка
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
    await ctx.reply("Мяу 🐾", {
      reply_parameters: { message_id: ctx.msg.message_id },
    });
  });

  // 4. Обробка постів (Канал + Чат) з перевіркою на [l] і [a]
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
        parse_mode: "HTML",
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

  // 5. Мовний патруль
  bot.on("message:text", async (ctx) => {
    if (
      ctx.from?.is_bot ||
      ctx.chat.id === CONFIG.adminChatId ||
      ctx.chat.type === "private"
    )
      return;

    // Використовуємо нову функцію hasRussian (переконайся, що вона оголошена вище в коді)
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
          `🚨 <b>ПОРУШЕННЯ МОВНИХ ПРАВИЛ</b>\n\n👤 <b>Юзер:</b> ${ctx.from.first_name}\n🆔 <b>ID:</b> <code>${userId}</code>\n🔗 <a href="https://t.me/c/${cleanChatId}/${ctx.msg.message_id}">Посилання</a>`,
        );
      } else {
        // Твій текст, який ти просив залишити
        const warnText = `Ай-ай-ай, ${ctx.from.first_name}, в цьому чаті не можна спілкуватись російською. Усне попередження! (${db.warnings[userId]}/3)`;

        try {
          await ctx.reply(warnText, {
            reply_parameters: { message_id: ctx.msg.message_id },
          });
        } catch (e) {
          await ctx.reply(warnText);
        }
      }
    }
  });

  // 6. Обробка помилок та Старт
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
      `❌ <b>ПОМИЛКА [${CONFIG.name}]</b>\n\n<pre>${errorMsg}</pre>`,
    );
  });

  bot.start({
    onStart: async (info) => {
      console.log(`${CONFIG.name} Є`);
      try {
        await bot.api.sendAnimation(CONFIG.adminChatId, CONFIG.startupGifId, {
          caption: `<b>${CONFIG.name}</b> (@${info.username}) увійшов у чат!\n\n${CONFIG.startupCaption}`,
          message_thread_id: CONFIG.threads.uptime,
          parse_mode: "HTML",
        });
      } catch (e) {
        await logTo(
          CONFIG.threads.uptime,
          `Встав <b>${CONFIG.name}</b> (@${info.username})\n${CONFIG.startupCaption}`,
        );
      }
    },
  });
}
