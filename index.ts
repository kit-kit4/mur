import { Bot, GrammyError, HttpError, InlineKeyboard } from "grammy";
import * as fs from "fs";

// ==========================================
// 1. КОНФІГУРАЦІЯ
// ==========================================
const CONFIG = {
  BOT_TOKEN: "8473334106:AAHVg3p_q7_M46bVLLFBr4QIAGmDhvcCD-U", // Обов'язково зміни токен після тестів!
  ALLOWED_RESOURCES: [
    -1002789684698, -1003200253794, -1002557455848, -1002563493364,
    -1002808281023, 5147076742, 8296806565, 987654321, 1122334455,
  ],
  ADMIN_CHAT_ID: -1002808281023,
  LOG_THREAD_ID: 3861,
  VIP_USERS: [8296806565, 987654321, 1122334455],
  DB_PATH: "./storage.json",

  // Оновлений текст із красивим HTML-форматуванням
  POST_TEXT: `<i>НАГАДУВАННЯ</i> від Мурумі!

Хочеш тут фігурку? 
<b>Пиши Бронь</b> + скрін/назва у коментарях! 

Оплата виключно на ФОП (це офіційний рахунок бізнесу).

<blockquote>Писати про оплату може ТІЛЬКИ @murumich. 

<prem>5429605292331533576+💌</prem> Зв'язок/Адмін: @murumich</blockquote>
<u>Спілкування лише українською.</u>`,
};

// Функція для перетворення твого тегу в преміум-емодзі Telegram
const formatPremiumEmoji = (text: string): string => {
  return text.replace(/<prem>(\d+)\+(.*?)<\/prem>/g, (match, id, emoji) => {
    return `<tg-emoji emoji-id="${id}">${emoji}</tg-emoji>`;
  });
};

// ==========================================
// 2. БАЗА ДАНИХ
// ==========================================
interface Database {
  clicks: Record<string, number>;
  warnings: Record<number, number>;
  lastReset: string;
}

const defaultData: Database = {
  clicks: {},
  warnings: {},
  lastReset: new Date().toISOString(),
};

function initStorage() {
  if (!fs.existsSync(CONFIG.DB_PATH)) {
    console.log("🐾 Створюю новий файл бази даних storage.json...");
    saveStorage(defaultData);
  }
}

function loadStorage(): Database {
  try {
    if (!fs.existsSync(CONFIG.DB_PATH)) {
      initStorage();
    }
    const data = fs.readFileSync(CONFIG.DB_PATH, "utf-8");
    return JSON.parse(data);
  } catch (e) {
    console.error("Помилка читання бази, повертаю дефолт:", e);
    return defaultData;
  }
}

function saveStorage(data: Database) {
  fs.writeFileSync(CONFIG.DB_PATH, JSON.stringify(data, null, 2));
}

// ==========================================
// 3. ЛОГІКА ТА КЛАВІАТУРИ
// ==========================================
const checker = {
  hasRussian(text: string): boolean {
    return /[ёъыэ]/i.test(text);
  },
  getPostKeyboard() {
    return new InlineKeyboard()
      .url("Відгуки 📝", "https://t.me/infomurumi/7")
      .url("Скільки чекати? ⏳", "https://t.me/murumishop/64")
      .row()
      .url("Як це працює? 🗺", "https://t.me/murumishop/106")
      .url("Канал з посилками 📦", "https://t.me/deliverymurumi")
      .row()
      .url("Наш Чатик", "https://t.me/infomurumi");
  },
};

// ==========================================
// 4. ГОЛОВНА ЛОГІКА БОТА
// ==========================================
initStorage(); // Ініціалізуємо БД при старті

const bot = new Bot(CONFIG.BOT_TOKEN);

// Кеш для збереження ID альбомів (media_group_id), щоб не відповідати на кожне фото
const processedMediaGroups = new Set<string>();

// 4.1. Контроль чатів (Забороняємо ліві групи)
bot.on("message", async (ctx, next) => {
  const isAllowed = CONFIG.ALLOWED_RESOURCES.includes(ctx.chat.id);
  const isAdminChat = ctx.chat.id === CONFIG.ADMIN_CHAT_ID;

  if (!isAllowed && !isAdminChat) {
    console.log(`Спроба додати в лівий чат: ${ctx.chat.id}. Ліваю...`);
    try {
      await ctx.leaveChat();
      console.log(`Успішно вийшов з чату ${ctx.chat.id}`);
    } catch (e) {
      console.log(`Не зміг вийти з ${ctx.chat.id}. Ігноруємо.`);
    }
    return;
  }
  await next();
});

// ==========================================
// 4.1.5. Роздача сердечок VIP-користувачам
// ==========================================
bot.on("message", async (ctx, next) => {
  const userId = ctx.from?.id;

  // Якщо користувач є в нашому списку VIP
  if (userId && CONFIG.VIP_USERS.includes(userId)) {
    try {
      // Ставимо сердечко (можеш змінити емодзі на 💘, 🍓, 💅 тощо)
      await ctx.react("💘");
    } catch (e) {
      console.error(`Не зміг поставити реакцію користувачу ${userId}`);
    }
  }

  // Обов'язково викликаємо next(), щоб бот не зупинився
  // і пішов перевіряти мову чи інші команди далі!
  await next();
});

// 4.2. Команда перевірки (Мур -> Мяу)
bot.hears(/^[Мм]ур[!?.]*$/i, async (ctx) => {
  await ctx.reply("Мяу 🐾", {
    reply_parameters: { message_id: ctx.msg.message_id },
  });
});

// 4.3. АВТОВІДПОВІДЬ В ЧАТІ НА ПОСТИ З КАНАЛУ
bot.on("message", async (ctx, next) => {
  if (ctx.msg.sender_chat?.type === "channel") {
    const channelId = ctx.msg.sender_chat.id;

    if (CONFIG.ALLOWED_RESOURCES.includes(channelId)) {
      // ПЕРЕВІРКА НА АЛЬБОМ: Якщо це фото з альбому, і ми його вже обробляли - ігноруємо
      const mediaGroupId = ctx.msg.media_group_id;
      if (mediaGroupId) {
        if (processedMediaGroups.has(mediaGroupId)) return;

        // Запам'ятовуємо цей альбом і видаляємо з пам'яті через 60 секунд
        processedMediaGroups.add(mediaGroupId);
        setTimeout(() => processedMediaGroups.delete(mediaGroupId), 60000);
      }

      try {
        await ctx.reply(formatPremiumEmoji(CONFIG.POST_TEXT), {
          reply_parameters: { message_id: ctx.msg.message_id },
          reply_markup: checker.getPostKeyboard(),
          parse_mode: "HTML",
        });
      } catch (e) {
        console.error("Помилка при надсиланні кнопок під пост:", e);
      }
    }
    return;
  }

  await next();
});

// 4.4. Авто-відповідь, якщо бота додали ПРЯМО В КАНАЛ (як адміна)
bot.on("channel_post", async (ctx) => {
  if (CONFIG.ALLOWED_RESOURCES.includes(ctx.chat.id)) {
    // ПЕРЕВІРКА НА АЛЬБОМ ДЛЯ КАНАЛУ
    const mediaGroupId = ctx.msg.media_group_id;
    if (mediaGroupId) {
      if (processedMediaGroups.has(mediaGroupId)) return;

      processedMediaGroups.add(mediaGroupId);
      setTimeout(() => processedMediaGroups.delete(mediaGroupId), 60000);
    }

    try {
      await ctx.reply(formatPremiumEmoji(CONFIG.POST_TEXT), {
        reply_markup: checker.getPostKeyboard(),
        parse_mode: "HTML",
      });
    } catch (e) {
      console.error("Помилка при надсиланні посту:", e);
    }
  }
});

// 4.5. Обробка кліків на кнопки
bot.on("callback_query:data", async (ctx) => {
  const data = loadStorage();
  const key = ctx.callbackQuery.data;

  data.clicks[key] = (data.clicks[key] || 0) + 1;
  saveStorage(data);

  await ctx.answerCallbackQuery("Дякуємо, що читаєте! Мур-мяу 🐾");
});

// 4.6. Мовний патруль
bot.on("message:text", async (ctx) => {
  if (ctx.from?.is_bot) return;
  if (ctx.chat.id === CONFIG.ADMIN_CHAT_ID) return;

  if (checker.hasRussian(ctx.msg.text)) {
    const userId = ctx.from?.id;
    if (!userId) return;

    const db = loadStorage();
    db.warnings[userId] = (db.warnings[userId] || 0) + 1;
    saveStorage(db);

    if (db.warnings[userId] >= 3) {
      const cleanChatId = ctx.chat.id.toString().replace("-100", "");
      try {
        await bot.api.sendMessage(
          CONFIG.ADMIN_CHAT_ID,
          `🚨 **ПОРУШЕННЯ МОВНИХ ПРАВИЛ**\n\n` +
            `👤 **Користувач:** ${ctx.from.first_name} (@${ctx.from.username || "немає"})\n` +
            `🆔 **ID:** \`${userId}\`\n` +
            `⏰ **Час:** ${new Date().toLocaleString("uk-UA")}\n` +
            `🔗 [Посилання на повідомлення](https://t.me/c/${cleanChatId}/${ctx.msg.message_id})`,
          {
            message_thread_id: CONFIG.LOG_THREAD_ID,
            parse_mode: "Markdown",
          },
        );
      } catch (err) {
        console.error("Не зміг відправити звіт в адмін чат.");
      }
    } else {
      try {
        await ctx.reply(
          `Ай-ай-ай, ${ctx.from.first_name}, в цьому чаті не можна спілкуватись російською. Усне попередження! (${db.warnings[userId]}/3)`,
          { reply_parameters: { message_id: ctx.msg.message_id } },
        );
      } catch (err) {
        await ctx.reply(
          `Ай-ай-ай, ${ctx.from.first_name}, в цьому чаті не можна спілкуватись російською. Усне попередження! (${db.warnings[userId]}/3)`,
        );
      }
    }
  }
});

// 4.7. Звіт та обнулення кожні 24 години
setInterval(async () => {
  const db = loadStorage();
  const now = new Date();
  const lastReset = new Date(db.lastReset);

  if (now.getTime() - lastReset.getTime() > 24 * 60 * 60 * 1000) {
    let report = "📈 **ДОБОВИЙ ЗВІТ ПО КЛІКАХ**\n\n";

    if (Object.keys(db.clicks).length === 0) {
      report += "Сьогодні ніхто нікуди не тицяв 😿";
    } else {
      for (const [btn, count] of Object.entries(db.clicks)) {
        report += `🔹 **${btn}**: ${count} разів\n`;
      }
    }

    try {
      await bot.api.sendMessage(CONFIG.ADMIN_CHAT_ID, report, {
        message_thread_id: CONFIG.LOG_THREAD_ID,
        parse_mode: "Markdown",
      });
    } catch (err) {
      console.error("Не зміг відправити добовий звіт:", err);
    }

    db.clicks = {};
    db.lastReset = now.toISOString();
    saveStorage(db);
  }
}, 60000);

// Глобальний обробник помилок
bot.catch((err) => {
  const ctx = err.ctx;
  console.error(`[Помилка] Апдейт ${ctx.update.update_id}:`);
  const e = err.error;
  if (e instanceof GrammyError) {
    console.error("Помилка від Telegram:", e.description);
  } else if (e instanceof HttpError) {
    console.error("Немає зв'язку з Telegram:", e);
  } else {
    console.error("Невідома помилка:", e);
  }
});

// Запуск бота
bot.start();
console.log("Мур-бот успішно запущений! 🚀");
