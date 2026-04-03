import { Bot, GrammyError, HttpError, InlineKeyboard } from "grammy";
import * as fs from "fs";
import * as os from "os";
import { execSync } from "child_process";

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
    uptime: number; // Логи запуску/вимкнення та загальний статус
    hosting: number; // Навантаження RAM/SSD
    db: number; // Стан бази даних (більше не спамить при старті)
    logs: number; // Спроби додавання, помилки, патруль
    clicks: number; // Звіти по кнопках
  };
  dbPath: string;
  postText: string;
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
    hosting: 3986,
    db: 3986,
    logs: 3861,
    clicks: 10,
  },
  dbPath: "./mur_storage.json",
  postText: `<i>НАГАДУВАННЯ</i> від Мурумі!\n\nХочеш тут фігурку? \n<b>Пиши Бронь</b> + скрін/назва у коментарях! \n\nОплата виключно на ФОП (це офіційний рахунок бізнесу).\n\n<blockquote>Писати про оплату може ТІЛЬКИ @murumich. \n\n<prem>5429605292331533576+💌</prem> Зв'язок/Адмін: @murumich</blockquote>\n<u>Спілкування лише українською.</u>`,
};

// 🦊 Налаштування ШІГІ-бота (Заглушка)
const SHIGI_CONFIG: BotConfig = {
  name: "Шігі-БОТ",
  token: "8794247949:AAFsPQGYP6k9oMgElHqQ-VNLmKGFk3vwPBw",
  admins: [5147076742],
  allowedResources: [-1002808281023],
  adminChatId: 0,
  vipUsers: [5147076742, 992804916, 380752717],
  threads: {
    uptime: 530,
    hosting: 3986,
    db: 3986,
    logs: 3861,
    clicks: 10,
  },
  dbPath: "./shigi_storage.json",
  postText: `<i>НАГАДУВАННЯ</i> від Шігі!\n\nТут інший текст...`,
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

const getSystemInfo = () => {
  const totalRam = (os.totalmem() / 1024 ** 3).toFixed(2);
  const freeRam = (os.freemem() / 1024 ** 3).toFixed(2);
  const usedRam = (Number(totalRam) - Number(freeRam)).toFixed(2);
  const ramPercent = ((Number(usedRam) / Number(totalRam)) * 100).toFixed(0);

  let ssdInfo = "Локальний тест (Win)";
  if (os.platform() !== "win32") {
    try {
      const df = execSync("df -h / | tail -1").toString().trim().split(/\s+/);
      ssdInfo = `${df[2]} / ${df[3]} (Усього: ${df[1]})`;
    } catch (e) {
      ssdInfo = "Помилка читання SSD";
    }
  }

  return {
    ram: `${usedRam}GB / ${totalRam}GB (${ramPercent}%)`,
    ssd: ssdInfo,
  };
};

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
          clicks: {},
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

  // 1. Команда /inf (Швидка перевірка статусу)
  bot.command("inf", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;

    // Працює тільки для адмінів, або якщо це викликано в адмін-чаті
    if (!config.admins.includes(userId) && ctx.chat.id !== config.adminChatId)
      return;

    const sys = getSystemInfo();
    const db = loadDb();

    // Формуємо дату початку відліку
    const resetDate = new Date(db.lastReset).toLocaleString("uk-UA", {
      timeZone: "Europe/Kiev",
    });

    // Рахуємо кліки
    let clicksReport = "";
    let totalClicks = 0;

    if (Object.keys(db.clicks).length === 0) {
      clicksReport = "<i>Сьогодні ще ніхто нікуди не тицяв</i> 😿\n";
    } else {
      for (const [btn, count] of Object.entries(db.clicks)) {
        clicksReport += `▪️ <code>${btn}</code>: <b>${count}</b>\n`;
        totalClicks += count as number;
      }
    }

    const reportMsg =
      `📊 <b>СИСТЕМНИЙ СТАТУС [${config.name}]</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🖥 <b>Хостинг:</b>\n` +
      `🧠 <b>RAM:</b> <code>${sys.ram}</code>\n` +
      `💾 <b>SSD:</b> <code>${sys.ssd}</code>\n\n` +
      `👆 <b>Кліки (з ${resetDate}):</b>\n` +
      `${clicksReport}` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📈 <b>Всього кліків: ${totalClicks}</b>`;

    await ctx.reply(reportMsg, {
      parse_mode: "HTML",
      reply_parameters: { message_id: ctx.msg.message_id },
    });
  });

  // 2. Контроль додавань
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

  // 3. VIP сердечка
  bot.on("message", async (ctx, next) => {
    if (ctx.from && config.vipUsers.includes(ctx.from.id)) {
      try {
        await ctx.react("💘");
      } catch (e) {}
    }
    await next();
  });

  // 4. Команда Мур
  bot.hears(/^[Мм]ур[!?.]*$/i, async (ctx) => {
    await ctx.reply("Мяу 🐾", {
      reply_parameters: { message_id: ctx.msg.message_id },
    });
  });

  // 5. Команда /postREP
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

  // 6. Обробка постів з альбомами (канал + чат)
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

  // 7. Кліки (для callback_data кнопок)
  bot.on("callback_query:data", async (ctx) => {
    const db = loadDb();
    const key = ctx.callbackQuery.data;
    db.clicks[key] = (db.clicks[key] || 0) + 1;
    saveDb(db);
    await ctx.answerCallbackQuery("Мур! ✅");
  });

  // 8. Мовний патруль
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

  // 9. ЗВІТИ (Кожні 24 години: Кліки + Хостинг)
  setInterval(async () => {
    const db = loadDb();
    const now = new Date();
    const lastReset = new Date(db.lastReset);

    if (now.getTime() - lastReset.getTime() > 24 * 60 * 60 * 1000) {
      // --- Звіт по кліках ---
      let report = `📈 <b>ДОБОВИЙ ЗВІТ ПО КЛІКАХ [${config.name}]</b>\n━━━━━━━━━━━━━━━━━━━━\n`;
      let totalClicks = 0;

      if (Object.keys(db.clicks).length === 0) {
        report += "Сьогодні ніхто нікуди не тицяв 😿\n";
      } else {
        for (const [btn, count] of Object.entries(db.clicks)) {
          report += `▪️ <code>${btn}</code>: <b>${count}</b>\n`;
          totalClicks += count as number;
        }
      }
      report += `━━━━━━━━━━━━━━━━━━━━\n<b>Всього: ${totalClicks}</b>`;
      await logTo(config.threads.clicks, report);

      // --- Щоденний звіт про хостинг ---
      const sys = getSystemInfo();
      await logTo(
        config.threads.hosting,
        `🖥 <b>ЩОДЕННИЙ ЗВІТ ХОСТИНГУ [${config.name}]</b>\n\n🧠 <b>RAM:</b> <code>${sys.ram}</code>\n💾 <b>SSD:</b> <code>${sys.ssd}</code>`,
      );

      // Скидання
      db.clicks = {};
      db.lastReset = now.toISOString();
      saveDb(db);
    }
  }, 60000); // Перевіряємо час кожну хвилину

  // 10. Обробка помилок (Тепер логується в адмін-чат)
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

    // Відправляємо помилку в гілку логів
    await logTo(
      config.threads.logs,
      `❌ <b>АВАРІЯ / ПОМИЛКА [${config.name}]</b>\n\n<pre>${errorMsg}</pre>`,
    );
  });

  // 11. СТАРТ
  bot.start({
    onStart: async (info) => {
      console.log(`${config.name} успішно запущений! 🚀`);
      const sys = getSystemInfo();

      // Одне красиве повідомлення замість спаму (прибрано спам гілки DB)
      await logTo(
        config.threads.uptime,
        `🚀 Бот <b>${config.name}</b> (@${info.username}) успішно піднявся!\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `🖥 <b>Система при старті:</b>\n` +
          `🧠 <b>RAM:</b> <code>${sys.ram}</code>\n` +
          `💾 <b>SSD:</b> <code>${sys.ssd}</code>`,
      );
    },
  });
}

// ==========================================
// 4. ЗАПУСК БОТІВ
// ==========================================

startBot(MUR_CONFIG);
startBot(SHIGI_CONFIG);
