import Fastify from "fastify";
import * as fs from "fs";
import { startMurBot } from "./mur";
import { startShigiBot } from "./shigi";

const STATS_FILE = "./click_stats.json";

type StatsDB = Record<string, Record<string, number>>;
let memoryStats: StatsDB = {};

if (fs.existsSync(STATS_FILE)) {
  memoryStats = JSON.parse(fs.readFileSync(STATS_FILE, "utf-8"));
} else {
  fs.writeFileSync(STATS_FILE, JSON.stringify({}));
}

setInterval(() => {
  fs.writeFile(STATS_FILE, JSON.stringify(memoryStats, null, 2), () => {});
}, 10000);

export const getStats = (botName: string) => memoryStats[botName] || {};

const fastify = Fastify({ logger: false });
const LINKS: Record<string, Record<string, string>> = {
  mur: {
    reviews: "https://t.me/infomurumi/7",
    wait: "https://t.me/murumishop/64",
    how: "https://t.me/murumishop/106",
    chat: "https://t.me/infomurumi/13",
  },
  shigi: {
  faq: "https://telegra.ph/SHCHo-take-lot-sistema-V%D1%96dpov%D1%96d-na-pitannya-04-05",
  chat: "https://t.me/infoshigiureshop",
  track: "https://t.me/TTNShigiureshop",
  book: "https://telegra.ph/Pravila-bronyuvannya-03-21",
  delivery: "https://telegra.ph/Dostavka-07-29-4"
}
};

fastify.get("/click", (request, reply) => {
  const { bot, target } = request.query as { bot?: string; target?: string };

  if (!bot || !target || !LINKS[bot]?.[target]) {
    return reply.status(404).send("Посилання не знайдено");
  }

  // Записуємо клік в пам'ять
  if (!memoryStats[bot]) memoryStats[bot] = {};
  memoryStats[bot][target] = (memoryStats[bot][target] || 0) + 1;

  // Перенаправляємо користувача
  reply.redirect(302, LINKS[bot][target]);
});

console.log("+-----------------------------+");

fastify.listen({ port: 1213, host: "0.0.0.0" }).then(() => {
  console.log("Сервер редіректів та статистики запущено");
});

// Запуск ботів
startMurBot();
startShigiBot();