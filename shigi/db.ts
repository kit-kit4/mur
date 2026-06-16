interface ShigiData {
  warnings: Record<number, number>;
  lastReset: string;
}

export class ShigiDatabase {
  private data: ShigiData = { warnings: {}, lastReset: new Date().toISOString() };
  private isDirty = false;

  constructor(private dbPath: string) {
    this.init();
    setInterval(() => this.save(), 10000); 
  }

  private async init() {
    const file = Bun.file(this.dbPath);
    if (await file.exists()) {
      try {
        this.data = await file.json();
      } catch (e) {
        console.error("Помилка читання бази Шігі:", e);
      }
    } else {
      this.isDirty = true;
      await this.save();
    }
  }

  private async save() {
    if (!this.isDirty) return;
    try {
      // Нативний, швидкий запис файлу через Bun
      await Bun.write(this.dbPath, JSON.stringify(this.data, null, 2));
      this.isDirty = false;
    } catch (e) {
      console.error("Помилка збереження бази Шігі:", e);
    }
  }

  public addWarning(userId: number): number {
    this.data.warnings[userId] = (this.data.warnings[userId] || 0) + 1;
    this.isDirty = true;
    return this.data.warnings[userId];
  }
}