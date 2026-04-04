import { Bot, GrammyError, HttpError, InlineKeyboard } from "grammy";
import * as fs from "fs";

// ==========================================
// 1. КОНФІГУРАЦІЯ
// ==========================================

interface BotConfig {
  name: string;
  token: string;
  admins: number[];
  allowedResources: number[];
  adminChatId: number;
  vipUsers: number[];
  threads: {
    uptime: number; // Логи запуску та загальний статус
    logs: number; // Спроби додавання, помилки, патруль
  };
  dbPath: string;
  postText: string;
  startupGifId: string;
  startupCaption: string;
}

// 🐱 Налаштування МУР-бота
const MUR_CONFIG: BotConfig = {
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
  postText: `<i>НАГАДУВАННЯ</i> від Мурумі!\n\nХочеш тут фігурку? \n<b>Пиши Бронь</b> + скрін/назва у коментарях! \n\nОплата виключно на ФОП (це офіційний рахунок бізнесу).\n\n<blockquote>Писати про оплату може ТІЛЬКИ @murumich. \n\n<prem>5429605292331533576+💌</prem> Зв'язок/Адмін: @murumich</blockquote>\n<u>Спілкування лише українською.</u>`,
  startupGifId: "СЮДИ_ВСТАВ_ID_ГІФКИ_ДЛЯ_МУР", // TODO: Додати ID гіфки
  startupCaption: "Мур-мур! Я знову на зв'язку! 🐾",
};

// 🦊 Налаштування ШІГІ-бота
const SHIGI_CONFIG: BotConfig = {
  name: "Шігі-БОТ",
  token: "8794247949:AAFsPQGYP6k9oMgElHqQ-VNLmKGFk3vwPBw",
  admins: [5147076742],
  allowedResources: [-1002808281023],
  adminChatId: -1002808281023, // Змінив з 0 на ID чату, щоб бот міг туди писати
  vipUsers: [5147076742, 992804916, 380752717],
  threads: {
    uptime: 530,
    logs: 3861,
  },
  dbPath: "./shigi_storage.json",
  postText: `<i>НАГАДУВАННЯ</i> від Шігі!\n\nТут інший текст...`,
  startupGifId:
    "CgACAgQAAxkBAAIs5WnQVdHKrNYnO2KnHobIBmV5atXJAAJ_DAACjbVRUaKlAAFj0xhxzjsE",
  startupCaption: "Знову працювати, ех. От би вихідний!",
};

// ==========================================
// 2. СИСТЕМНІ УТИЛІТИ
// ==========================================

const formatPremiumEmoji = (text: string) =>
  text.replace(
    /<prem>(\d+)\+(.*?)<\/prem>/g,
    (m, id, emo) => `<tg-emoji emoji-id="${id}">${emo}</tg-emoji>`,
  );

const hasRussian = (text: string) => /[ёъыэ]/i.test(text);

// ==========================================
// 3. ФАБРИКА БОТІВ
// ==========================================

function startBot(config: BotConfig) {
  const bot = new Bot(config.token);
  const processedMediaGroups = new Set<string>();

  const initDb = () => {
    if (!fs.existsSync(config.dbPath)) {
      fs.writeFileSync(
        config.dbPath,
        JSON.stringify({
          warnings: {},
          lastReset: new Date().toISOString(),
        }),
      );
    }
  };

  const loadDb = () => {
    initDb();
    return JSON.parse(fs.readFileSync(config.dbPath, "utf-8"));
  };

  const saveDb = (data: any) =>
    fs.writeFileSync(config.dbPath, JSON.stringify(data, null, 2));

  // Централізоване логування
  const logTo = async (threadId: number, message: string) => {
    try {
      await bot.api.sendMessage(config.adminChatId, message, {
        message_thread_id: threadId,
        parse_mode: "HTML",
      });
    } catch (e: any) {
      if (e.description?.includes("message thread not found")) {
        await bot.api
          .sendMessage(
            config.adminChatId,
            `⚠️ <i>(Гілку не знайдено, надсилаю сюди)</i>\n\n${message}`,
            { parse_mode: "HTML" },
          )
          .catch(() => {});
      } else {
        console.error(`[${config.name}] Помилка логування:`, e.message);
      }
    }
  };

  const getKeyboard = () => {
    return new InlineKeyboard()
      .url("Відгуки 📝", "https://t.me/infomurumi/7")
      .url("Скільки чекати? ⏳", "https://t.me/murumishop/64")
      .row()
      .url("Як це працює? 🗺", "https://t.me/murumishop/106")
      .url("Канал з посилками 📦", "https://t.me/deliverymurumi")
      .row()
      .url("Наш Чатик", "https://t.me/infomurumi");
  };

  initDb();

  // 1. Контроль додавань
  bot.on("message", async (ctx, next) => {
    if (
      !config.allowedResources.includes(ctx.chat.id) &&
      ctx.chat.id !== config.adminChatId
    ) {
      await logTo(
        config.threads.logs,
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
    if (ctx.from && config.vipUsers.includes(ctx.from.id)) {
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

  // 4. Команда /postREP
  bot.command("postREP", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId || !config.admins.includes(userId)) return;

    const args = ctx.match.split(" ");
    if (args.length !== 2) {
      await ctx.reply(
        "❌ Формат: <code>/postREP -100xxxxxx message_id</code>",
        { parse_mode: "HTML" },
      );
      return;
    }

    const chatId = Number(args[0]);
    const messageId = Number(args[1]);

    if (isNaN(chatId) || isNaN(messageId)) {
      await ctx.reply("❌ ID чату та ID повідомлення мають бути числами!");
      return;
    }

    try {
      await ctx.api.sendMessage(chatId, formatPremiumEmoji(config.postText), {
        reply_parameters: { message_id: messageId },
        reply_markup: getKeyboard(),
        parse_mode: "HTML",
      });
      await ctx.reply(`✅ Кнопки успішно додано!`);
    } catch (e) {
      await ctx.reply("❌ Помилка API. Перевір ID та права бота.");
    }
  });

  // 5. Обробка постів з альбомами (канал + чат)
  const sendPostMarkup = async (ctx: any) => {
    const mgId = ctx.msg.media_group_id;
    if (mgId) {
      if (processedMediaGroups.has(mgId)) return;
      processedMediaGroups.add(mgId);
      setTimeout(() => processedMediaGroups.delete(mgId), 60000);
    }
    try {
      await ctx.reply(formatPremiumEmoji(config.postText), {
        reply_parameters: ctx.msg.message_id
          ? { message_id: ctx.msg.message_id }
          : undefined,
        reply_markup: getKeyboard(),
        parse_mode: "HTML",
      });
    } catch (e) {}
  };

  bot.on("channel_post", async (ctx) => {
    if (config.allowedResources.includes(ctx.chat.id))
      await sendPostMarkup(ctx);
  });

  bot.on("message", async (ctx, next) => {
    if (
      ctx.msg.sender_chat?.type === "channel" &&
      config.allowedResources.includes(ctx.msg.sender_chat.id)
    ) {
      await sendPostMarkup(ctx);
      return;
    }
    await next();
  });

  // 6. Мовний патруль
  bot.on("message:text", async (ctx) => {
    if (ctx.from?.is_bot || ctx.chat.id === config.adminChatId) return;
    if (hasRussian(ctx.msg.text)) {
      const userId = ctx.from?.id;
      if (!userId) return;

      const db = loadDb();
      db.warnings[userId] = (db.warnings[userId] || 0) + 1;
      saveDb(db);

      if (db.warnings[userId] >= 3) {
        const cleanChatId = ctx.chat.id.toString().replace("-100", "");
        await logTo(
          config.threads.logs,
          `🚨 <b>ПОРУШЕННЯ МОВНИХ ПРАВИЛ</b>\n\n` +
            `👤 <b>Юзер:</b> ${ctx.from.first_name}\n` +
            `🆔 <b>ID:</b> <code>${userId}</code>\n` +
            `🔗 <a href="https://t.me/c/${cleanChatId}/${ctx.msg.message_id}">Посилання на повідомлення</a>`,
        );
      } else {
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

  // 7. Обробка помилок
  bot.catch(async (err) => {
    const e = err.error;
    let errorMsg = "Невідома помилка";

    if (e instanceof GrammyError) {
      errorMsg = e.description;
    } else if (e instanceof HttpError) {
      errorMsg = "Помилка мережі (Telegram API не відповідає)";
    } else {
      errorMsg = String(e);
    }

    console.error(`[${config.name}] Помилка:`, errorMsg);

    await logTo(
      config.threads.logs,
      `❌ <b>АВАРІЯ / ПОМИЛКА [${config.name}]</b>\n\n<pre>${errorMsg}</pre>`,
    );
  });

  // 8. СТАРТ
  bot.start({
    onStart: async (info) => {
      console.log(`${config.name} успішно запущений! 🚀`);

      // Відправляємо гіфку з підписом при старті
      try {
        await bot.api.sendAnimation(config.adminChatId, config.startupGifId, {
          caption: `<b>${config.name}</b> (@${info.username}) увійшов у чат!\n\n${config.startupCaption}`,
          message_thread_id: config.threads.uptime,
          parse_mode: "HTML",
        });
      } catch (e) {
        console.error(
          `[${config.name}] Не вдалося відправити гіфку при старті:`,
          e,
        );
        // Фолбек: якщо гіфка не відправилась, шлемо просто текст
        await logTo(
          config.threads.uptime,
          `Встав <b>${config.name}</b> (@${info.username})\n${config.startupCaption}`,
        );
      }
    },
  });
}

// ==========================================
// 4. ЗАПУСК БОТІВ
// ==========================================

startBot(MUR_CONFIG);
startBot(SHIGI_CONFIG);
