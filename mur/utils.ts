import { InlineKeyboard } from "grammy";

// Створюється ОДИН раз під час запуску бота
const RUSSIAN_WORDS = new Set([
  "что", "как", "окак", "почему", "зачем", "когда", "только", "очень", "сейчас",
  "было", "есть", "будет", "него", "сделал", "сказал", "привет", "спасибо",
  "пожалуйста", "случилось", "если", "админ", "купил", "цена", "сколько",
  "нетути", "вообще", "совсем", "вместе", "после", "вчера", "сегодня", "быстро"
]);

export const formatPremiumEmoji = (text: string) =>
  text.replace(
    /<prem>(\d+)\+(.*?)<\/prem>/g,
    (_, id, emo) => `<tg-emoji emoji-id="${id}">${emo}</tg-emoji>`
  );

export const hasRussian = (text: string): boolean => {
  if (/[ёъыэ]/i.test(text)) return true;
  const words = text.toLowerCase().split(/\s+/);
  return words.some(word => RUSSIAN_WORDS.has(word.replace(/[?.!,]/g, "")));
};

export const getKeyboard = (type: "lot" | "auction" | "default") => {
  const kb = new InlineKeyboard().url("Відгуки 📝", "https://t.me/infomurumi/7");
  if (type === "auction") return kb.url("Наш Чатик", "https://t.me/infomurumi/13") && kb.url("Як працює аукціон?", "https://t.me/murumishop/12871");
  return kb
    .url("Скільки чекати? ⏳", "https://t.me/murumishop/64")
    .row()
    .url("Як це працює? 🗺", "https://t.me/murumishop/106")
    .row()
    .url("Наш Чатик", "https://t.me/infomurumi/13");
};