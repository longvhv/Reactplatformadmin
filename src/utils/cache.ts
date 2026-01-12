/**
 * Simple in-memory cache với TTL support
 */
export class Cache<T = any> {
  private cache = new Map<string, { value: T; expires: number }>();
  private defaultTTL: number;

  constructor(defaultTTL = 5 * 60 * 1000) {
    // Default 5 minutes
    this.defaultTTL = defaultTTL;
  }

  /**
   * Set value trong cache
   */
  set(key: string, value: T, ttl?: number): void {
    const expires = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { value, expires });
  }

  /**
   * Get value từ cache
   */
  get(key: string): T | undefined {
    const item = this.cache.get(key);

    if (!item) {
      return undefined;
    }

    // Check if expired
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return undefined;
    }

    return item.value;
  }

  /**
   * Check if key exists và chưa expired
   */
  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  /**
   * Delete key từ cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear toàn bộ cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache size
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Get or set - fetch if not in cache
   */
  async getOrSet(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.get(key);
    if (cached !== undefined) {
      return cached;
    }

    const value = await fetcher();
    this.set(key, value, ttl);
    return value;
  }
}

/**
 * Request deduplication cache
 * Prevents multiple identical requests from being made simultaneously
 */
export class RequestCache<T = any> {
  private pending = new Map<string, Promise<T>>();

  async dedupe(key: string, fetcher: () => Promise<T>): Promise<T> {
    // If request is already pending, return the same promise
    if (this.pending.has(key)) {
      return this.pending.get(key)!;
    }

    // Create new request
    const promise = fetcher().finally(() => {
      this.pending.delete(key);
    });

    this.pending.set(key, promise);
    return promise;
  }

  clear(): void {
    this.pending.clear();
  }
}

/**
 * LRU Cache - Least Recently Used
 */
export class LRUCache<T = any> {
  private cache = new Map<string, T>();
  private maxSize: number;

  constructor(maxSize = 100) {
    this.maxSize = maxSize;
  }

  get(key: string): T | undefined {
    if (!this.cache.has(key)) {
      return undefined;
    }

    // Move to end (most recently used)
    const value = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key: string, value: T): void {
    // Delete if already exists
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Add to end
    this.cache.set(key, value);

    // Evict oldest if over max size
    if (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

// Singleton instances
export const globalCache = new Cache();
export const requestCache = new RequestCache();
export const lruCache = new LRUCache(100);

// Auto cleanup expired entries every 5 minutes
if (typeof window !== "undefined") {
  setInterval(() => {
    globalCache.cleanup();
  }, 5 * 60 * 1000);
}
