import { readFileSync, existsSync, writeFileSync } from "fs";

interface ShigiData {
    warnings: Record<number, number>;
    lastReset: string;
}

export class ShigiDatabase {
    private data: ShigiData;
    private isDirty = false;

    constructor(private dbPath: string) {
        // Синхронна ініціалізація до запуску таймерів і обробки подій
        this.data = this.initSync();
        setInterval(() => this.save(), 10000); 
    }

    private initSync(): ShigiData {
        if (existsSync(this.dbPath)) {
            try {
                return JSON.parse(readFileSync(this.dbPath, "utf-8"));
            } catch (e) {
                console.error("Помилка читання бази Шігі (пошкоджений JSON):", e);
            }
        }
        
        // Якщо файлу немає або він не читається, створюємо дефолтні дані
        const defaultData: ShigiData = { warnings: {}, lastReset: new Date().toISOString() };
        
        // Одразу створюємо фізичний файл синхронно
        try {
            writeFileSync(this.dbPath, JSON.stringify(defaultData, null, 2));
        } catch (e) {
            console.error("Помилка створення файлу бази Шігі:", e);
        }
        
        return defaultData;
    }

    private async save() {
        if (!this.isDirty) return;
        try {
            // Асинхронний запис у фоні, щоб не гальмувати бота
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