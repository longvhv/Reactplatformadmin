/**
 * Web Worker Utilities
 * 
 * Offload heavy computations to background threads
 */

/**
 * Create inline web worker from function
 */
export function createWorker(fn: Function): Worker {
  const blob = new Blob([`(${fn.toString()})()`], { type: 'application/javascript' });
  const url = URL.createObjectURL(blob);
  return new Worker(url);
}

/**
 * Execute function in web worker
 */
export function runInWorker<T>(fn: () => T): Promise<T> {
  return new Promise((resolve, reject) => {
    const worker = createWorker(fn);
    
    worker.onmessage = (e) => {
      resolve(e.data);
      worker.terminate();
    };
    
    worker.onerror = (error) => {
      reject(error);
      worker.terminate();
    };
  });
}

/**
 * Web Worker Pool for parallel processing
 */
export class WorkerPool {
  private workers: Worker[] = [];
  private queue: Array<{
    task: any;
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];
  private activeWorkers = 0;
  private readonly maxWorkers: number;
  private readonly workerScript: string;
  
  constructor(workerScript: string, maxWorkers = navigator.hardwareConcurrency || 4) {
    this.workerScript = workerScript;
    this.maxWorkers = maxWorkers;
  }
  
  /**
   * Execute task in worker pool
   */
  execute<T>(task: any): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      this.processQueue();
    });
  }
  
  /**
   * Process queued tasks
   */
  private processQueue() {
    while (this.queue.length > 0 && this.activeWorkers < this.maxWorkers) {
      const { task, resolve, reject } = this.queue.shift()!;
      this.runTask(task, resolve, reject);
    }
  }
  
  /**
   * Run task in worker
   */
  private runTask(task: any, resolve: (value: any) => void, reject: (error: any) => void) {
    const worker = this.getWorker();
    this.activeWorkers++;
    
    const timeout = setTimeout(() => {
      worker.terminate();
      this.activeWorkers--;
      reject(new Error('Worker timeout'));
    }, 30000); // 30s timeout
    
    worker.onmessage = (e) => {
      clearTimeout(timeout);
      this.activeWorkers--;
      resolve(e.data);
      this.processQueue();
    };
    
    worker.onerror = (error) => {
      clearTimeout(timeout);
      this.activeWorkers--;
      reject(error);
      this.processQueue();
    };
    
    worker.postMessage(task);
  }
  
  /**
   * Get or create worker
   */
  private getWorker(): Worker {
    // Reuse terminated workers or create new one
    const worker = this.workers.find(w => !this.isWorkerActive(w));
    if (worker) return worker;
    
    const newWorker = new Worker(this.workerScript);
    this.workers.push(newWorker);
    return newWorker;
  }
  
  /**
   * Check if worker is active
   */
  private isWorkerActive(worker: Worker): boolean {
    // Simple check - can be enhanced with worker state tracking
    return this.activeWorkers > 0;
  }
  
  /**
   * Terminate all workers
   */
  terminate() {
    this.workers.forEach(worker => worker.terminate());
    this.workers = [];
    this.queue = [];
    this.activeWorkers = 0;
  }
  
  /**
   * Get pool stats
   */
  getStats() {
    return {
      totalWorkers: this.workers.length,
      activeWorkers: this.activeWorkers,
      queuedTasks: this.queue.length,
      maxWorkers: this.maxWorkers,
    };
  }
}

/**
 * Common worker tasks
 */
export const WorkerTasks = {
  /**
   * Sort large array in worker
   */
  sortArray: (array: any[], compareFn?: (a: any, b: any) => number) => {
    const worker = createWorker(function() {
      self.onmessage = (e: MessageEvent) => {
        const { array, compareFn } = e.data;
        const sorted = compareFn 
          ? array.sort(new Function('a', 'b', compareFn)())
          : array.sort();
        self.postMessage(sorted);
      };
    });
    
    return new Promise((resolve, reject) => {
      worker.onmessage = (e) => {
        resolve(e.data);
        worker.terminate();
      };
      worker.onerror = reject;
      worker.postMessage({ array, compareFn: compareFn?.toString() });
    });
  },
  
  /**
   * Filter large array in worker
   */
  filterArray: (array: any[], filterFn: (item: any) => boolean) => {
    const worker = createWorker(function() {
      self.onmessage = (e: MessageEvent) => {
        const { array, filterFn } = e.data;
        const fn = new Function('item', `return (${filterFn})(item)`);
        const filtered = array.filter(fn);
        self.postMessage(filtered);
      };
    });
    
    return new Promise((resolve, reject) => {
      worker.onmessage = (e) => {
        resolve(e.data);
        worker.terminate();
      };
      worker.onerror = reject;
      worker.postMessage({ array, filterFn: filterFn.toString() });
    });
  },
  
  /**
   * Process large data set in worker
   */
  processData: (data: any[], processFn: (item: any) => any) => {
    const worker = createWorker(function() {
      self.onmessage = (e: MessageEvent) => {
        const { data, processFn } = e.data;
        const fn = new Function('item', `return (${processFn})(item)`);
        const processed = data.map(fn);
        self.postMessage(processed);
      };
    });
    
    return new Promise((resolve, reject) => {
      worker.onmessage = (e) => {
        resolve(e.data);
        worker.terminate();
      };
      worker.onerror = reject;
      worker.postMessage({ data, processFn: processFn.toString() });
    });
  },
  
  /**
   * Parse large JSON in worker
   */
  parseJSON: (jsonString: string) => {
    const worker = createWorker(function() {
      self.onmessage = (e: MessageEvent) => {
        try {
          const parsed = JSON.parse(e.data);
          self.postMessage({ success: true, data: parsed });
        } catch (error: any) {
          self.postMessage({ success: false, error: error.message });
        }
      };
    });
    
    return new Promise((resolve, reject) => {
      worker.onmessage = (e) => {
        if (e.data.success) {
          resolve(e.data.data);
        } else {
          reject(new Error(e.data.error));
        }
        worker.terminate();
      };
      worker.onerror = reject;
      worker.postMessage(jsonString);
    });
  },
  
  /**
   * Hash data in worker (simple hash)
   */
  hashData: (data: string) => {
    const worker = createWorker(function() {
      self.onmessage = (e: MessageEvent) => {
        const str = e.data;
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
          const char = str.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash; // Convert to 32bit integer
        }
        self.postMessage(hash.toString(16));
      };
    });
    
    return new Promise((resolve, reject) => {
      worker.onmessage = (e) => {
        resolve(e.data);
        worker.terminate();
      };
      worker.onerror = reject;
      worker.postMessage(data);
    });
  },
};

/**
 * ComLink-like typed worker wrapper
 */
export class TypedWorker<T> {
  private worker: Worker;
  private messageId = 0;
  private pending = new Map<number, {
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }>();
  
  constructor(workerScript: string) {
    this.worker = new Worker(workerScript);
    this.worker.onmessage = this.handleMessage.bind(this);
    this.worker.onerror = this.handleError.bind(this);
  }
  
  /**
   * Call worker method
   */
  call<K extends keyof T>(method: K, ...args: any[]): Promise<any> {
    const id = this.messageId++;
    
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.worker.postMessage({ id, method, args });
    });
  }
  
  /**
   * Handle worker message
   */
  private handleMessage(e: MessageEvent) {
    const { id, result, error } = e.data;
    const pending = this.pending.get(id);
    
    if (pending) {
      this.pending.delete(id);
      if (error) {
        pending.reject(new Error(error));
      } else {
        pending.resolve(result);
      }
    }
  }
  
  /**
   * Handle worker error
   */
  private handleError(error: ErrorEvent) {
    console.error('Worker error:', error);
    this.pending.forEach(({ reject }) => reject(error));
    this.pending.clear();
  }
  
  /**
   * Terminate worker
   */
  terminate() {
    this.worker.terminate();
    this.pending.forEach(({ reject }) => reject(new Error('Worker terminated')));
    this.pending.clear();
  }
}

/**
 * Check if Web Workers are supported
 */
export function isWorkerSupported(): boolean {
  return typeof Worker !== 'undefined';
}

/**
 * Example usage:
 * 
 * // Simple worker
 * const result = await runInWorker(() => {
 *   // Heavy computation here
 *   return complexCalculation();
 * });
 * 
 * // Worker tasks
 * const sorted = await WorkerTasks.sortArray(largeArray);
 * const filtered = await WorkerTasks.filterArray(data, item => item.active);
 * 
 * // Worker pool
 * const pool = new WorkerPool('/worker.js', 4);
 * const results = await Promise.all([
 *   pool.execute({ task: 'compute', data: data1 }),
 *   pool.execute({ task: 'compute', data: data2 }),
 *   pool.execute({ task: 'compute', data: data3 }),
 * ]);
 * pool.terminate();
 */
