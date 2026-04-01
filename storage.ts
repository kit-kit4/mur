import * as fs from "fs";
import { CONFIG } from "./config";

export interface Database {
  clicks: Record<string, number>;
  warnings: Record<number, number>;
  lastReset: string;
}

export const storage = {
  // Функція для створення файлу при старті
  init() {
    if (!fs.existsSync(CONFIG.DB_PATH)) {
      console.log("🐾 Створюю новий файл бази даних storage.json...");
      this.save({
        clicks: {},
        warnings: {},
        lastReset: new Date().toISOString()
      });
    }
  },

  load(): Database {
    if (!fs.existsSync(CONFIG.DB_PATH)) {
      this.init();
    }
    return JSON.parse(fs.readFileSync(CONFIG.DB_PATH, "utf-8"));
  },

  save(data: Database) {
    fs.writeFileSync(CONFIG.DB_PATH, JSON.stringify(data, null, 2));
  }
};
