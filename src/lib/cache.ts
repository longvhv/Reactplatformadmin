/**
 * Advanced Caching System
 * In-memory and persistent caching with TTL
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class CacheManager {
  private memoryCache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Set cache entry
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.DEFAULT_TTL,
    };

    this.memoryCache.set(key, entry);

    // Also save to localStorage for persistence
    try {
      localStorage.setItem(
        `cache:${key}`,
        JSON.stringify({
          data,
          timestamp: entry.timestamp,
          ttl: entry.ttl,
        })
      );
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }

  /**
   * Get cache entry
   */
  get<T>(key: string): T | null {
    // Try memory cache first
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && this.isValid(memoryEntry)) {
      return memoryEntry.data;
    }

    // Try localStorage
    try {
      const stored = localStorage.getItem(`cache:${key}`);
      if (stored) {
        const entry: CacheEntry<T> = JSON.parse(stored);
        if (this.isValid(entry)) {
          // Restore to memory cache
          this.memoryCache.set(key, entry);
          return entry.data;
        } else {
          // Expired, remove it
          this.remove(key);
        }
      }
    } catch (error) {
      console.warn('Failed to read from localStorage:', error);
    }

    return null;
  }

  /**
   * Check if cache entry is valid
   */
  private isValid(entry: CacheEntry<any>): boolean {
    const age = Date.now() - entry.timestamp;
    return age < entry.ttl;
  }

  /**
   * Remove cache entry
   */
  remove(key: string): void {
    this.memoryCache.delete(key);
    try {
      localStorage.removeItem(`cache:${key}`);
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error);
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.memoryCache.clear();
    
    // Clear localStorage cache entries
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith('cache:')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear localStorage cache:', error);
    }
  }

  /**
   * Get cache with callback
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const data = await fetcher();
    this.set(key, data, ttl);
    return data;
  }

  /**
   * Invalidate cache by pattern
   */
  invalidatePattern(pattern: RegExp): void {
    // Memory cache
    for (const key of this.memoryCache.keys()) {
      if (pattern.test(key)) {
        this.memoryCache.delete(key);
      }
    }

    // localStorage
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith('cache:') && pattern.test(key.substring(6))) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to invalidate localStorage cache:', error);
    }
  }

  /**
   * Get cache stats
   */
  getStats() {
    const memorySize = this.memoryCache.size;
    let localStorageSize = 0;

    try {
      const keys = Object.keys(localStorage);
      localStorageSize = keys.filter((key) => key.startsWith('cache:')).length;
    } catch (error) {
      // Ignore
    }

    return {
      memorySize,
      localStorageSize,
      totalSize: memorySize + localStorageSize,
    };
  }
}

// Export singleton instance
export const cacheManager = new CacheManager();

/**
 * Cache decorator for functions
 */
export function withCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: { key: (...args: Parameters<T>) => string; ttl?: number }
): T {
  return (async (...args: Parameters<T>) => {
    const cacheKey = options.key(...args);
    const cached = cacheManager.get(cacheKey);
    
    if (cached !== null) {
      return cached;
    }

    const result = await fn(...args);
    cacheManager.set(cacheKey, result, options.ttl);
    return result;
  }) as T;
}
