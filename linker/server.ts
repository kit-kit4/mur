// server.ts
import Fastify from "fastify";
import * as fs from "fs";

import { CONFIG } from "./config";

const fastify = Fastify({ logger: false });

// Типізація для нашої бази даних в пам'яті
type StatsDB = Record<string, Record<string, number>>;

// Оперативна пам'ять: сюди ми грузимо дані при старті
let memoryStats: StatsDB = {};

// Функція завантаження існуючої статистики
const loadDb = () => {
  if (fs.existsSync(CONFIG.dbPath)) {
    const data = fs.readFileSync(CONFIG.dbPath, "utf-8");
    memoryStats = JSON.parse(data);
  } else {
    fs.writeFileSync(CONFIG.dbPath, JSON.stringify({}));
  }
};

// Функція збереження статистики на жорсткий диск
const saveDb = () => {
  fs.writeFile(CONFIG.dbPath, JSON.stringify(memoryStats, null, 2), (err) => {
    if (err) console.error("Помилка запису БД:", err);
  });
};

// --- ОСНОВНИЙ РОУТ (ШЛЯХ) ---
// Приклад запиту: http://localhost:3000/go?bot=mur_bot&target=reviews
fastify.get("/go", (request, reply) => {
  // Витягуємо параметри з URL (query parameters)
  const { bot, target } = request.query as { bot?: string; target?: string };

  // Перевіряємо, чи передали нам потрібні дані
  if (!bot || !target) {
    return reply.status(400).send("Відсутні параметри bot або target");
  }

  // Шукаємо посилання в конфігу
  const finalUrl = CONFIG.links[bot]?.[target];

  if (!finalUrl) {
    return reply.status(404).send("Посилання не знайдено");
  }

  // --- ОНОВЛЮЄМО СТАТИСТИКУ В ПАМ'ЯТІ ---
  if (!memoryStats[bot]) memoryStats[bot] = {};
  memoryStats[bot][target] = (memoryStats[bot][target] || 0) + 1;

  // Робимо редірект (HTTP 302 - тимчасове перенаправлення)
  reply.redirect(302, finalUrl);
});

// Запускаємо сервер
const start = async () => {
  try {
    loadDb();
    
    // Запускаємо таймер: зберігати дані з пам'яті у файл кожні 10 сек
    setInterval(saveDb, CONFIG.syncIntervalMs);

    await fastify.listen({ port: CONFIG.port, host: "0.0.0.0" });
    console.log(`Сервер-трекер запущено на порту ${CONFIG.port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();