import { existsSync, readFileSync } from "fs";

interface MurData {
  warnings: Record<number, number>;
  lastReset: string;
}

export class MurDatabase {
  private data: MurData = { warnings: {}, lastReset: new Date().toISOString() };
  private isDirty = false;

  constructor(private dbPath: string) {
    this.initSync();
    setInterval(() => this.save(), 10000); 
  }

  private initSync() {
    if (existsSync(this.dbPath)) {
      try {
        // Читаємо файл синхронно, щоб заблокувати потік до повного завантаження бази
        const rawData = readFileSync(this.dbPath, "utf-8");
        this.data = JSON.parse(rawData);
      } catch (e) {
        console.error("Помилка читання бази Мур:", e);
      }
    } else {
      // Якщо файлу ще немає, помічаємо як брудний, щоб setInterval його створив
      this.isDirty = true;
    }
  }

  private async save() {
    if (!this.isDirty) return;
    try {
      // Зберігаємо асинхронно через швидкий Bun.write
      await Bun.write(this.dbPath, JSON.stringify(this.data, null, 2));
      this.isDirty = false;
    } catch (e) {
      console.error("Помилка збереження бази Мур:", e);
    }
  }

  public getWarningCount(userId: number): number {
    return this.data.warnings[userId] || 0;
  }

  public addWarning(userId: number): number {
    this.data.warnings[userId] = this.getWarningCount(userId) + 1;
    this.isDirty = true;
    return this.data.warnings[userId];
  }
}