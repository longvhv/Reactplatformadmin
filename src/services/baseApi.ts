/**
 * Base API service for localStorage operations
 * Provides common CRUD operations pattern
 */

export interface BaseEntity {
  id: number;
  createdAt: string;
  updatedAt: string;
}

export class BaseApi<T extends BaseEntity> {
  constructor(private storageKey: string) {}

  protected getFromStorage(): T[] {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`Error reading from localStorage [${this.storageKey}]:`, error);
      return [];
    }
  }

  protected saveToStorage(items: T[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(items));
    } catch (error) {
      console.error(`Error saving to localStorage [${this.storageKey}]:`, error);
    }
  }

  protected getNextId(items: T[]): number {
    return items.length > 0 ? Math.max(...items.map(item => item.id)) + 1 : 1;
  }

  getAll(): T[] {
    return this.getFromStorage();
  }

  getById(id: number): T | undefined {
    const items = this.getFromStorage();
    return items.find(item => item.id === id);
  }

  delete(id: number): boolean {
    const items = this.getFromStorage();
    const filtered = items.filter(item => item.id !== id);
    
    if (filtered.length === items.length) return false;

    this.saveToStorage(filtered);
    return true;
  }

  bulkDelete(ids: number[]): number {
    const items = this.getFromStorage();
    const filtered = items.filter(item => !ids.includes(item.id));
    const deletedCount = items.length - filtered.length;

    this.saveToStorage(filtered);
    return deletedCount;
  }

  clear(): void {
    localStorage.removeItem(this.storageKey);
  }

  count(): number {
    return this.getFromStorage().length;
  }
}
