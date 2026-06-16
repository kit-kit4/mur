export class FastCache<T> {
  private cache = new Map<T, number>();

  constructor(private ttlMs: number) {}

  add(item: T) {
    this.cache.set(item, Date.now() + this.ttlMs);
  }

  has(item: T): boolean {
    const expiresAt = this.cache.get(item);
    if (!expiresAt) return false;
    
    if (Date.now() > expiresAt) {
      this.cache.delete(item);
      return false;
    }
    return true;
  }
}