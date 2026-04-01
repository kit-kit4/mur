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
    uptime: number; // Логи запуску/вимкнення
    hosting: number; // Навантаження RAM/SSD (старт + 24г)
    db: number; // Стан бази даних
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
  vipUsers: [8296806565, 987654321, 5147076742],
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
  token: "ТОКЕН_ШІГІ_ТУТ",
  admins: [5147076742],
  allowedResources: [-1001111111111],
  adminChatId: -1001111111111,
  vipUsers: [],
  threads: {
    uptime: 1,
    hosting: 1,
    db: 1,
    logs: 1,
    clicks: 1,
  },
  dbPath: "./shigi_storage.json",
  postText: `<i>НАГАДУВАННЯ</i> від Шігі!\n\nТут інший текст...`,
};

// ==========================================
// 2. СИСТЕМНІ УТИЛІТИ ТА ЕМОДЗІ
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

  let ssdInfo = "Локальний тест (Windows)";
  // Команда df працює тільки на Linux (на твоєму хостингу)
  if (os.platform() !== "win32") {
    try {
      const df = execSync("df -h / | tail -1").toString().trim().split(/\s+/);
      ssdInfo = `Вживано ${df[2]} / Вільно ${df[3]} (Загалом ${df[1]})`;
    } catch (e) {
      ssdInfo = "Помилка читання SSD";
    }
  }

  return {
    ram: `Вживано ${usedRam}GB / ${totalRam}GB (${ramPercent}%)`,
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
    if (!fs.existsSync(config.dbPath))
      fs.writeFileSync(
        config.dbPath,
        JSON.stringify({
          clicks: {},
          warnings: {},
          lastReset: new Date().toISOString(),
        }),
      );
  };
  const loadDb = () => {
    initDb();
    return JSON.parse(fs.readFileSync(config.dbPath, "utf-8"));
  };
  const saveDb = (data: any) =>
    fs.writeFileSync(config.dbPath, JSON.stringify(data, null, 2));

  // Розумна відправка логів (якщо гілки немає - шле в загальний чат)
  const logTo = async (threadId: number, message: string) => {
    try {
      await bot.api.sendMessage(config.adminChatId, message, {
        message_thread_id: threadId,
        parse_mode: "HTML",
        //disable_web_page_preview: true,
      });
    } catch (e: any) {
      if (e.description?.includes("message thread not found")) {
        // Якщо гілки немає, відправляємо просто в групу адмінів
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
        `⚠️ <b>Спроба додавання!</b>\nЧат: <code>${ctx.chat.id}</code>\nДія: <b>Ліваю...</b>`,
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
        {
          parse_mode: "HTML",
          reply_parameters: { message_id: ctx.msg.message_id },
        },
      );
      return;
    }

    const chatId = Number(args[0]);
    const messageId = Number(args[1]);

    if (isNaN(chatId) || isNaN(messageId)) {
      await ctx.reply("❌ ID чату та ID повідомлення мають бути числами!", {
        reply_parameters: { message_id: ctx.msg.message_id },
      });
      return;
    }

    try {
      await ctx.api.sendMessage(chatId, formatPremiumEmoji(config.postText), {
        reply_parameters: { message_id: messageId },
        reply_markup: getKeyboard(),
        parse_mode: "HTML",
      });
      await ctx.reply(`✅ Кнопки додано!`, {
        reply_parameters: { message_id: ctx.msg.message_id },
      });
    } catch (e) {
      await ctx.reply("❌ Помилка API. Перевір ID та права бота.", {
        reply_parameters: { message_id: ctx.msg.message_id },
      });
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

  // 6. Кліки
  bot.on("callback_query:data", async (ctx) => {
    const db = loadDb();
    const key = ctx.callbackQuery.data;
    db.clicks[key] = (db.clicks[key] || 0) + 1;
    saveDb(db);
    await ctx.answerCallbackQuery("Мур! ✅");
  });

  // 7. Мовний патруль
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
          `🚨 **ПОРУШЕННЯ МОВНИХ ПРАВИЛ**\n\n👤 **Користувач:** ${ctx.from.first_name}\n🆔 **ID:** <code>${userId}</code>\n🔗 <a href="https://t.me/c/${cleanChatId}/${ctx.msg.message_id}">Посилання</a>`,
        );
      } else {
        try {
          await ctx.reply(
            `Ай-ай-ай, ${ctx.from.first_name}, в цьому чаті не можна спілкуватись російською. Усне попередження! (${db.warnings[userId]}/3)`,
            { reply_parameters: { message_id: ctx.msg.message_id } },
          );
        } catch (e) {
          await ctx.reply(
            `Ай-ай-ай, ${ctx.from.first_name}, в цьому чаті не можна спілкуватись російською. Усне попередження! (${db.warnings[userId]}/3)`,
          );
        }
      }
    }
  });

  // 8. ЗВІТИ (Кожні 24 години: Кліки + Хостинг)
  setInterval(async () => {
    const db = loadDb();
    const now = new Date();
    const lastReset = new Date(db.lastReset);

    if (now.getTime() - lastReset.getTime() > 24 * 60 * 60 * 1000) {
      // --- Звіт по кліках ---
      let report = `📈 <b>ДОБОВИЙ ЗВІТ ПО КЛІКАХ [${config.name}]</b>\n\n`;
      if (Object.keys(db.clicks).length === 0)
        report += "Сьогодні ніхто нікуди не тицяв 😿\n";
      else {
        for (const [btn, count] of Object.entries(db.clicks)) {
          report += `🔹 ${btn}: ${count} разів\n`;
        }
      }
      await logTo(config.threads.clicks, report);

      // --- Щоденний звіт про хостинг ---
      const sys = getSystemInfo();
      await logTo(
        config.threads.hosting,
        `🖥 <b>Щоденний звіт хостингу [${config.name}]</b>\n\n<b>RAM:</b> ${sys.ram}\n<b>SSD:</b> ${sys.ssd}`,
      );

      // Скидання
      db.clicks = {};
      db.lastReset = now.toISOString();
      saveDb(db);
    }
  }, 60000); // Перевіряємо час кожну хвилину

  bot.catch((err) => {
    const e = err.error;
    if (e instanceof GrammyError) {
      console.error(`[${config.name}] Помилка Telegram:`, e.description);
    } else {
      console.error(`[${config.name}] Невідома помилка:`, e);
    }
  });

  // 9. СТАРТ
  bot.start({
    onStart: async (info) => {
      console.log(`${config.name} успішно запущений! 🚀`);
      const sys = getSystemInfo();
      const db = loadDb();
      const dbCount =
        Object.keys(db.clicks).length + Object.keys(db.warnings).length;

      await logTo(
        config.threads.uptime,
        `🟢 <b>Логи запуску (Uptime)</b>\n\n🚀 Бот <b>${config.name}</b> (@${info.username}) успішно піднявся!`,
      );
      await logTo(
        config.threads.hosting,
        `🖥 <b>Хостинг: Навантаження при старті [${config.name}]</b>\n\n<b>RAM:</b> ${sys.ram}\n<b>SSD:</b> ${sys.ssd}`,
      );
      await logTo(
        config.threads.db,
        `🗄 <b>Бази даних [${config.name}]:</b>\nКількість записів: ${dbCount}\nШвидкість відгуку API: OK ⚡️`,
      );
    },
  });
}

// ==========================================
// 4. ЗАПУСК БОТІВ
// ==========================================

startBot(MUR_CONFIG);
// startBot(SHIGI_CONFIG); // Розкоментуй, коли заповниш дані Шігі
