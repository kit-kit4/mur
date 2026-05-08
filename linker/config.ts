// config.ts
export const CONFIG = {
  port: 1313,
  dbPath: "./stats.json",
  syncIntervalMs: 10000, // Зберігати в файл кожні 10 секунд
  
  // Твій словник посилань
  links: {
    mur_bot: {
      reviews: "https://t.me/infomurumi/7",
      wait_time: "https://t.me/murumishop/64",
      how_it_works: "https://t.me/murumishop/106",
      chat: "https://t.me/infomurumi/13"
    },
    shigi_bot: {
      promo: "https://google.com"
    }
  } as Record<string, Record<string, string>>
};