import { InlineKeyboard } from "grammy";

const RUSSIAN_WORDS = new Set([
  "что", "как", "окак", "почему", "зачем", "когда", "только", "очень", "сейчас",
  "было", "есть", "будет", "него", "сделал", "сказал", "привет", "мидория",
  "пожалуйста", "случилось", "если", "админ", "купил", "сколько", "нетути",
  "вообще", "совсем", "даже", "вместе", "после", "вчера", "сегодня", "быстро"
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

export const getDefaultKeyboard = () =>
  new InlineKeyboard()
    .add({ text: "❓ Відповіді на запитання", url: "https://telegra.ph/SHCHo-take-lot-sistema-V%D1%96dpov%D1%96d-na-pitannya-04-05", style: "primary" } as any)
    .row()
    .add({ text: "🫂 Інформаційний чат ", url: "https://t.me/infoshigiureshop", style: "success" } as any)
    .row()
    .add({ text: "🚚 Канал відстеження", url: "https://t.me/TTNShigiureshop", style: "primary" } as any);

export const getStartKeyboard = () =>
  new InlineKeyboard()
    .add({ text: "❓Відповіді на часті запитання", url: "https://telegra.ph/SHCHo-take-lot-sistema-V%D1%96dpov%D1%96d-na-pitannya-04-05", style: "primary" } as any)
    .row()
    .add({ text: "🗣 Як бронювати?", url: "https://telegra.ph/Pravila-bronyuvannya-03-21", style: "success" } as any)
    .row()
    .add({ text: "🚚 Про доставку", url: "https://telegra.ph/Dostavka-07-29-4", style: "primary" } as any)
    .row()
    .text("Як працює бот і що збирає?", "about_bot");