import { InlineKeyboard } from "grammy";

export const checker = {
  // Перевірка на москальські літери
  hasRussian(text: string): boolean {
    return /[ёъыэ]/i.test(text);
  },

  // Створення кнопок навігації
  getPostKeyboard() {
    return new InlineKeyboard()
      .url("Відгуки 📝", "https://t.me/infomurumi/7")
      .url("Скільки чекати? ⏳", "https://t.me/murumishop/64")
      .row()
      .url("Повна навігація 🗺", "https://t.me/murumishop/106")
      .url("Канал з посилками 📦", "https://t.me/deliverymurumi")
      .row()
      .text("Я прочитав(ла) ✅", "click_confirm"); // Кнопка для статистики
  }
};
