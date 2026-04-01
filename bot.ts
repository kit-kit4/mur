import { Bot, GrammyError, HttpError } from "grammy";
import { CONFIG } from "./config";
import { storage } from "./storage";
import { checker } from "./logic";

// Створюємо файл бази даних, якщо його ще немає
storage.init();

const bot = new Bot(CONFIG.BOT_TOKEN);

// 1. Контроль чатів (Ліваємо, якщо ID немає в списку дозволених або це не адмін-чат)
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

// 2. Команда перевірки (Мур -> Мяу)
// bot.hears реагує на конкретні слова. Регулярка /^[Мм]ур[!?.]*$/i ловить "Мур", "мур", "Мур!" тощо
bot.hears(/^[Мм]ур[!?.]*$/i, async (ctx) => {
  await ctx.reply("Мяу 🐾", { reply_to_message_id: ctx.msg.message_id });
});

// 3. Авто-відповідь на нові пости в каналі
bot.on("channel_post", async (ctx) => {
  if (CONFIG.ALLOWED_RESOURCES.includes(ctx.chat.id)) {
    try {
      await ctx.reply(CONFIG.POST_TEXT, {
        reply_markup: checker.getPostKeyboard()
      });
    } catch (e) {
      console.error("Помилка при надсиланні посту:", e);
    }
  }
});

// 4. Обробка кліків на кнопки (для статистики)
bot.on("callback_query:data", async (ctx) => {
  const data = storage.load();
  const key = ctx.callbackQuery.data;

  data.clicks[key] = (data.clicks[key] || 0) + 1;
  storage.save(data);

  await ctx.answerCallbackQuery("Дякуємо, що читаєте! Мур-мяу 🐾");
});

// 5. Мовний патруль (працює в чатах/коментарях)
bot.on("message:text", async (ctx) => {
  // Не перевіряємо адмін-чат, щоб ви могли там спілкуватись як завгодно
  // if (ctx.chat.id === CONFIG.ADMIN_CHAT_ID) return;

  // Якщо текст містить російські літери
  if (checker.hasRussian(ctx.msg.text)) {
    const userId = ctx.from?.id;
    if (!userId) return;

    const db = storage.load();
    db.warnings[userId] = (db.warnings[userId] || 0) + 1;
    storage.save(db);

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
            parse_mode: "Markdown"
          }
        );
      } catch (err) {
        console.error("Не зміг відправити звіт в адмін чат.", err);
      }
    } else {
      try {
        await ctx.reply(
          `Ай-ай-ай, ${ctx.from.first_name}, в цьому чаті не можна спілкуватись російською. Усне попередження! (${db.warnings[userId]}/3)`,
          { reply_to_message_id: ctx.msg.message_id }
        );
      } catch (err) {
        console.error("Не зміг відправити попередження:", err);
      }
    }
  }
});

// 6. Звіт та обнулення кожні 24 години
setInterval(async () => {
  const db = storage.load();
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
        parse_mode: "Markdown"
      });
    } catch (err) {
      console.error("Не зміг відправити добовий звіт:", err);
    }

    db.clicks = {};
    db.lastReset = now.toISOString();
    storage.save(db);
  }
}, 60000);

// Глобальний обробник помилок (Рятує бота від смерті)
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

bot.start();
console.log("Мур-бот успішно запущений! 🚀");
