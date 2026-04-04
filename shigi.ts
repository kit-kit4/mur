import { Bot, GrammyError, HttpError, InlineKeyboard } from "grammy";
import * as fs from "fs";

// ==========================================
// КОНФІГУРАЦІЯ ШІГІ-БОТА
// ==========================================
const CONFIG = {
  name: "Шігі-БОТ",
  token: "8794247949:AAFsPQGYP6k9oMgElHqQ-VNLmKGFk3vwPBw",
  admins: [5147076742],
  allowedResources: [-1002808281023, -1002644865624, -1002598164499],
  adminChatId: -1002808281023,
  vipUsers: [5147076742, 992804916, 380752717],
  threads: {
    uptime: 530,
    logs: 530,
  },
  dbPath: "./shigi_storage.json",
  startupGifId:
    "CgACAgIAAyEFAASnYve_AAISUmnRMIK9DtsiPSOprPbCXfPUFzWMAAJ_jAAC54TgSAMm3LTlpWQDOwQ",
  startupCaption: "Знову працювати, ех. От би вихідний!",

  // Тексти для різних типів постів
  texts: {
    default: `Привяу!<prem>5472314056280921593+😃</prem>\nЯ <b>Ліам</b> і я допоможу Вам отримати бажану фігурку:\n<b>Пиши «Бронь + скрін / назва» у коментарях.</b>\n\nНе встигли? Не засмучуйтесь!\nСтавайте в чергу — напишіть<b>«черга»</b> у відповідь на повідомлення того, хто вже забронював.\nМожливо, фігурка ще перейде до Вас<prem>5474261377273057572+⭐️</prem>\n\n<b>Мова спілкування у чаті — українська</b> 🇺🇦\n\n<prem>5289771765743000332+🩵</prem> Зв'язок з адміном: @froggw`,
    lot: `Привяу!<prem>5472314056280921593+😃</prem>\nЯ <b>Ліам</b> і я допоможу Вам отримати бажану фігурку:\n<b>Пиши «Бронь + скрін / назва» у коментарях.</b>\n\nНе встигли? Не засмучуйтесь!\nСтавайте в чергу — напишіть<b>«черга»</b> у відповідь на повідомлення того, хто вже забронював.\nМожливо, фігурка ще перейде до Вас<prem>5474261377273057572+⭐️</prem>\n\n<b>Мова спілкування у чаті — українська</b> 🇺🇦\n\n<prem>5289771765743000332+🩵</prem> Зв'язок з адміном: @froggw`,

    auction: `Привяу!\nЯ <b>Ліам</b> і я допоможу не заплутатись в аукціоні.<prem>5472314056280921593+😃</prem>\n\n<i>Нагадую правила, щоб усім було комфортно:</i>\n<blockquote><prem>5289753804189766799+⭐️</prem> Без оффтопу під лотом;\n<prem>5289753804189766799+⭐️</prem> Нову ставку залишайте відповіддю на попередню;\n<prem>5289753804189766799+⭐️</prem> Видаляти ставки до завершення аукціону заборонено (я слідкую <prem>5474532716126950024+😏</prem>);</blockquote>\n\n<u><prem>5289613981529446001+❗️</prem> Зауважте, що ціна ставки не включає у себе вартість доставки з Японії!</u>\n\n<b>Мова спілкування у чаті — українська</b> 🇺🇦\n\n<prem>5289771765743000332+🩵</prem> Зв'язок з адміном: @froggw`,
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
  if (/[ёъыэ]/i.test(text)) return true;
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
    "него",
    "ними",
    "сделал",
    "сказал",
    "привет",
    "спасибо",
    "пожалуйста",
    "случилось",
    "тоже",
    "если",
    "админ",
    "купил",
    "цена",
    "сколько",
    "нетути",
    "вообще",
    "совсем",
    "даже",
    "вместе",
    "после",
    "вчера",
    "сегодня",
    "завтра",
    "быстро",
  ];
  const words = text.toLowerCase().split(/\s+/);
  return words.some((word) =>
    russianMarkers.includes(word.replace(/[?.!,]/g, "")),
  );
};

const getDefaultKeyboard = () =>
  new InlineKeyboard()
    .add({
      text: "❓ Відповіді на запитання",
      url: "https://telegra.ph/SHCHo-take-lot-sistema-V%D1%96dpov%D1%96d-na-pitannya-04-05",
      style: "primary",
    } as any)
    .row()
    .add({
      text: "🫂 Інформаційний чат",
      url: "https://t.me/infoshigiureshop",
      style: "success",
    } as any)
    .row()
    .add({
      text: "🚚 Канал відстеження",
      url: "https://t.me/TTNShigiureshop",
      style: "primary",
    } as any);

const getLotKeyboard = () =>
  new InlineKeyboard()
    .add({
      text: "❓ Відповіді на запитання",
      url: "https://telegra.ph/SHCHo-take-lot-sistema-V%D1%96dpov%D1%96d-na-pitannya-04-05",
      style: "primary",
    } as any)
    .row()
    .add({
      text: "🫂 Інформаційний чат",
      url: "https://t.me/infoshigiureshop",
      style: "success",
    } as any)
    .row()
    .add({
      text: "🚚 Канал відстеження",
      url: "https://t.me/TTNShigiureshop",
      style: "primary",
    } as any);

const getAuctionKeyboard = () => {
  return new InlineKeyboard()
    .add({
      text: "❓ Відповіді на запитання",
      url: "https://telegra.ph/SHCHo-take-lot-sistema-V%D1%96dpov%D1%96d-na-pitannya-04-05",
      style: "primary",
    } as any)
    .row()
    .add({
      text: "🫂 Інформаційний чат",
      url: "https://t.me/infoshigiureshop",
      style: "success",
    } as any)
    .row()
    .add({
      text: "🚚 Канал відстеження",
      url: "https://t.me/TTNShigiureshop",
      style: "primary",
    } as any);
};

// ==========================================
// МОДУЛЬ БОТА
// ==========================================
export function startShigiBot() {
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

  // 1. Команда Ліам
  bot.hears(/^[Лл]іам[!?.]*$/i, async (ctx) => {
    const replyText =
      "М? Вибач, ми не можемо бути разом) Можеш запитати Шігі, якщо є питання.";

    try {
      await ctx.reply(replyText, {
        reply_parameters: { message_id: ctx.msg.message_id },
      });
    } catch (e) {
      await ctx.reply(replyText);
    }
  });

  // 2. Команда /start ТІЛЬКИ в приватних
  bot.command("start", async (ctx) => {
    if (ctx.chat.type !== "private") return;

    const startText = `<prem>6316495320033266646+😃</prem> Привіт! Я <b>Ліам</b> — маскот і помічник <b>Shigiure Shop</b> <prem>5292214030176394674+😃</prem>\n\nЯкщо у вас є питання, можливо, ми вже відповіли на них. Усі кнопки знизу клікабельні та ведуть на інформаційну сторінку.\n\n<prem>5289784088004172160+😃</prem> <u>Також нагадую, що в нас є чат спілкування:</u>\n\n<a href="https://t.me/infoshigiureshop">ТИЦЬ, аби доєднатись</a>\n\nЯкщо у вас залишились питання — зверніться до адміна @froggw, вона з радістю допоможе <prem>5289617713856022447+😃</prem>\n\nІ без флірту будь ласка)`;

    const startKeyboard = new InlineKeyboard()
      .add({
        text: "❓Відповіді на часті запитання",
        url: "https://telegra.ph/SHCHo-take-lot-sistema-V%D1%96dpov%D1%96d-na-pitannya-04-05",
        style: "primary",
      } as any)
      .row()
      .add({
        text: "🗣 Як бронювати?",
        url: "https://telegra.ph/Pravila-bronyuvannya-03-21",
        style: "success",
      } as any)
      .row()
      .add({
        text: "🚚 Про доставку",
        url: "https://telegra.ph/Dostavka-07-29-4",
        style: "primary",
      } as any);

    try {
      await ctx.reply(formatPremiumEmoji(startText), {
        parse_mode: "HTML",
        reply_markup: startKeyboard,
      });
    } catch (e) {
      console.error("Помилка у команді /start:", e);
    }
  });

  // 3. Контроль додавань
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

  // 4. VIP сердечка
  bot.on("message", async (ctx, next) => {
    if (ctx.from && CONFIG.vipUsers.includes(ctx.from.id)) {
      try {
        await ctx.react("💘");
      } catch (e) {}
    }
    await next();
  });

  // 5. Команда /postrep з підтримкою a/l
  bot.command("postrep", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId || !CONFIG.admins.includes(userId)) return;

    const args = ctx.match.split(" ");
    if (args.length < 2 || args.length > 3) {
      await ctx.reply(
        "❌ Формат: <code>/postrep -100xxxxxx message_id [a/l]</code>\nНаприклад: <code>/postrep -10012345 567 a</code>",
        { parse_mode: "HTML" },
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
        parse_mode: "HTML",
      });
      await ctx.reply(`✅ Повідомлення успішно відправлено!`);
    } catch (e: any) {
      await ctx.reply(
        `❌ Помилка API: ${e.message}\nПеревір ID та права бота.`,
      );
    }
  });

  // 6. Обробка постів (Канал + Чат) з перевіркою на [l] і [a]
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

  // 7. Мовний патруль
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
          `🚨 <b>ПОРУШЕННЯ МОВНИХ ПРАВИЛ</b>\n\n👤 <b>Юзер:</b> ${ctx.from.first_name}\n🆔 <b>ID:</b> <code>${userId}</code>\n🔗 <a href="https://t.me/c/${cleanChatId}/${ctx.msg.message_id}">Посилання</a>`,
        );
      } else {
        const warnText = `Ой-ой, помітив російську в чаті 🥺\nБудь ласка,${ctx.from.first_name} спілкуємось  тільки українською, дякую!`;

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

  // 8. Обробка помилок та Старт
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
      console.log(`${CONFIG.name} успішно запущений! 🚀`);
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
