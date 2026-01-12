/**
 * Request Batching Utilities
 * 
 * Kết hợp nhiều requests thành một để giảm network overhead
 */

type BatchRequest = {
  id: string;
  url: string;
  options?: RequestInit;
  resolve: (value: any) => void;
  reject: (error: any) => void;
};

class RequestBatcher {
  private queue: BatchRequest[] = [];
  private batchTimeout: number | null = null;
  private readonly maxBatchSize: number;
  private readonly batchDelay: number;
  
  constructor(maxBatchSize = 10, batchDelay = 50) {
    this.maxBatchSize = maxBatchSize;
    this.batchDelay = batchDelay;
  }
  
  /**
   * Add request to batch queue
   */
  add(url: string, options?: RequestInit): Promise<any> {
    return new Promise((resolve, reject) => {
      const id = `${Date.now()}-${Math.random()}`;
      
      this.queue.push({
        id,
        url,
        options,
        resolve,
        reject,
      });
      
      // Process batch if queue is full
      if (this.queue.length >= this.maxBatchSize) {
        this.processBatch();
      } else {
        // Schedule batch processing
        this.scheduleBatch();
      }
    });
  }
  
  /**
   * Schedule batch processing
   */
  private scheduleBatch() {
    if (this.batchTimeout) return;
    
    this.batchTimeout = window.setTimeout(() => {
      this.processBatch();
    }, this.batchDelay);
  }
  
  /**
   * Process queued requests
   */
  private async processBatch() {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
    
    if (this.queue.length === 0) return;
    
    // Take current queue and reset
    const batch = this.queue.splice(0, this.maxBatchSize);
    
    // Execute all requests in parallel
    const promises = batch.map(req => 
      fetch(req.url, req.options)
        .then(async response => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          const data = await response.json();
          req.resolve(data);
          return data;
        })
        .catch(error => {
          req.reject(error);
          throw error;
        })
    );
    
    try {
      await Promise.allSettled(promises);
    } catch (error) {
      console.error('Batch processing error:', error);
    }
    
    // Process remaining items if any
    if (this.queue.length > 0) {
      this.scheduleBatch();
    }
  }
  
  /**
   * Flush all pending requests immediately
   */
  flush() {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
    return this.processBatch();
  }
  
  /**
   * Get current queue size
   */
  get queueSize(): number {
    return this.queue.length;
  }
}

// Global batcher instance
export const requestBatcher = new RequestBatcher();

/**
 * Batch fetch - automatically batches requests
 */
export function batchFetch(url: string, options?: RequestInit): Promise<any> {
  return requestBatcher.add(url, options);
}

/**
 * GraphQL Request Batcher
 * Combines multiple GraphQL queries into one request
 */
class GraphQLBatcher {
  private queue: Array<{
    query: string;
    variables?: Record<string, any>;
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];
  private batchTimeout: number | null = null;
  private readonly endpoint: string;
  private readonly batchDelay: number;
  
  constructor(endpoint: string, batchDelay = 50) {
    this.endpoint = endpoint;
    this.batchDelay = batchDelay;
  }
  
  /**
   * Add GraphQL query to batch
   */
  query(query: string, variables?: Record<string, any>): Promise<any> {
    return new Promise((resolve, reject) => {
      this.queue.push({ query, variables, resolve, reject });
      this.scheduleBatch();
    });
  }
  
  /**
   * Schedule batch processing
   */
  private scheduleBatch() {
    if (this.batchTimeout) return;
    
    this.batchTimeout = window.setTimeout(() => {
      this.processBatch();
    }, this.batchDelay);
  }
  
  /**
   * Process queued GraphQL queries
   */
  private async processBatch() {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
    
    if (this.queue.length === 0) return;
    
    const batch = [...this.queue];
    this.queue = [];
    
    try {
      // Combine all queries into one batched request
      const batchedQuery = batch.map((item, index) => ({
        id: index,
        query: item.query,
        variables: item.variables,
      }));
      
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(batchedQuery),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const results = await response.json();
      
      // Resolve each query with its result
      batch.forEach((item, index) => {
        const result = Array.isArray(results) ? results[index] : results;
        if (result.errors) {
          item.reject(new Error(result.errors[0].message));
        } else {
          item.resolve(result.data);
        }
      });
    } catch (error) {
      // Reject all queries on batch error
      batch.forEach(item => item.reject(error));
    }
  }
}

/**
 * Create a GraphQL batcher for an endpoint
 */
export function createGraphQLBatcher(endpoint: string, batchDelay = 50) {
  return new GraphQLBatcher(endpoint, batchDelay);
}

/**
 * DataLoader pattern implementation
 * Automatically batches and caches requests by key
 */
export class DataLoader<K, V> {
  private batchLoadFn: (keys: K[]) => Promise<V[]>;
  private cache = new Map<K, Promise<V>>();
  private queue: Array<{
    key: K;
    resolve: (value: V) => void;
    reject: (error: any) => void;
  }> = [];
  private batchTimeout: number | null = null;
  private readonly batchDelay: number;
  
  constructor(
    batchLoadFn: (keys: K[]) => Promise<V[]>,
    options: { cache?: boolean; batchDelay?: number } = {}
  ) {
    this.batchLoadFn = batchLoadFn;
    this.batchDelay = options.batchDelay ?? 10;
    
    if (options.cache === false) {
      this.cache.clear();
    }
  }
  
  /**
   * Load a value by key
   */
  load(key: K): Promise<V> {
    // Check cache first
    const cached = this.cache.get(key);
    if (cached) return cached;
    
    // Create promise and add to queue
    const promise = new Promise<V>((resolve, reject) => {
      this.queue.push({ key, resolve, reject });
      this.scheduleBatch();
    });
    
    this.cache.set(key, promise);
    return promise;
  }
  
  /**
   * Load multiple values by keys
   */
  loadMany(keys: K[]): Promise<V[]> {
    return Promise.all(keys.map(key => this.load(key)));
  }
  
  /**
   * Schedule batch processing
   */
  private scheduleBatch() {
    if (this.batchTimeout) return;
    
    this.batchTimeout = window.setTimeout(() => {
      this.processBatch();
    }, this.batchDelay);
  }
  
  /**
   * Process queued loads
   */
  private async processBatch() {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
    
    if (this.queue.length === 0) return;
    
    const batch = [...this.queue];
    this.queue = [];
    
    try {
      const keys = batch.map(item => item.key);
      const values = await this.batchLoadFn(keys);
      
      // Resolve each load with its value
      batch.forEach((item, index) => {
        item.resolve(values[index]);
      });
    } catch (error) {
      // Reject all loads on batch error and clear cache
      batch.forEach(item => {
        this.cache.delete(item.key);
        item.reject(error);
      });
    }
  }
  
  /**
   * Clear cache
   */
  clearAll() {
    this.cache.clear();
  }
  
  /**
   * Clear specific key from cache
   */
  clear(key: K) {
    this.cache.delete(key);
  }
  
  /**
   * Prime the cache with a value
   */
  prime(key: K, value: V) {
    this.cache.set(key, Promise.resolve(value));
  }
}

/**
 * Create a DataLoader instance
 */
export function createDataLoader<K, V>(
  batchLoadFn: (keys: K[]) => Promise<V[]>,
  options?: { cache?: boolean; batchDelay?: number }
) {
  return new DataLoader(batchLoadFn, options);
}

/**
 * Example usage:
 * 
 * // Simple batching
 * const data1 = await batchFetch('/api/user/1');
 * const data2 = await batchFetch('/api/user/2');
 * // Both requests are batched together
 * 
 * // GraphQL batching
 * const batcher = createGraphQLBatcher('/graphql');
 * const user = await batcher.query('{ user(id: 1) { name } }');
 * const posts = await batcher.query('{ posts { title } }');
 * // Both queries sent in one request
 * 
 * // DataLoader pattern
 * const userLoader = createDataLoader(async (ids: number[]) => {
 *   const response = await fetch(`/api/users?ids=${ids.join(',')}`);
 *   return response.json();
 * });
 * 
 * const user1 = await userLoader.load(1);
 * const user2 = await userLoader.load(2);
 * // Automatically batched and cached
 */
