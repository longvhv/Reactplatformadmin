/**
 * Lazy Module Loader
 * 
 * Tự động lazy load modules để giảm bundle size
 * Hỗ trợ preloading và error handling
 */

import { lazy, ComponentType, LazyExoticComponent } from 'react';

interface ModuleMetadata {
  name: string;
  loader: () => Promise<any>;
  component?: LazyExoticComponent<ComponentType<any>>;
  preloaded?: boolean;
}

class LazyModuleLoaderClass {
  private modules = new Map<string, ModuleMetadata>();
  private loadingModules = new Map<string, Promise<any>>();
  
  /**
   * Register a lazy module
   */
  register(
    name: string,
    loader: () => Promise<any>
  ): LazyExoticComponent<ComponentType<any>> {
    // Create lazy component
    const lazyComponent = lazy(async () => {
      try {
        // Check if already loading
        let modulePromise = this.loadingModules.get(name);
        
        if (!modulePromise) {
          modulePromise = loader();
          this.loadingModules.set(name, modulePromise);
        }
        
        const module = await modulePromise;
        this.loadingModules.delete(name);
        
        // Mark as loaded
        const metadata = this.modules.get(name);
        if (metadata) {
          metadata.preloaded = true;
        }
        
        return module;
      } catch (error) {
        this.loadingModules.delete(name);
        console.error(`Failed to load module: ${name}`, error);
        throw error;
      }
    });
    
    // Store metadata
    this.modules.set(name, {
      name,
      loader,
      component: lazyComponent,
      preloaded: false,
    });
    
    return lazyComponent;
  }
  
  /**
   * Preload a module
   */
  async preload(name: string): Promise<void> {
    const metadata = this.modules.get(name);
    if (!metadata) {
      console.warn(`Module not found: ${name}`);
      return;
    }
    
    // Skip if already loaded
    if (metadata.preloaded) return;
    
    // Check if currently loading
    const loading = this.loadingModules.get(name);
    if (loading) {
      await loading;
      return;
    }
    
    // Start loading
    try {
      const promise = metadata.loader();
      this.loadingModules.set(name, promise);
      await promise;
      this.loadingModules.delete(name);
      metadata.preloaded = true;
    } catch (error) {
      this.loadingModules.delete(name);
      console.error(`Failed to preload module: ${name}`, error);
    }
  }
  
  /**
   * Preload multiple modules
   */
  async preloadModules(names: string[]): Promise<void> {
    await Promise.all(names.map(name => this.preload(name)));
  }
  
  /**
   * Get lazy component by name
   */
  getComponent(name: string): LazyExoticComponent<ComponentType<any>> | null {
    const metadata = this.modules.get(name);
    return metadata?.component || null;
  }
  
  /**
   * Check if module is loaded
   */
  isLoaded(name: string): boolean {
    const metadata = this.modules.get(name);
    return metadata?.preloaded || false;
  }
  
  /**
   * Check if module is loading
   */
  isLoading(name: string): boolean {
    return this.loadingModules.has(name);
  }
  
  /**
   * Get all registered module names
   */
  getModuleNames(): string[] {
    return Array.from(this.modules.keys());
  }
  
  /**
   * Get loading stats
   */
  getStats() {
    const total = this.modules.size;
    let loaded = 0;
    let loading = 0;
    
    this.modules.forEach((metadata) => {
      if (metadata.preloaded) loaded++;
      if (this.loadingModules.has(metadata.name)) loading++;
    });
    
    return {
      total,
      loaded,
      loading,
      pending: total - loaded - loading,
    };
  }
  
  /**
   * Clear all modules
   */
  clear() {
    this.modules.clear();
    this.loadingModules.clear();
  }
}

// Singleton instance
export const LazyModuleLoader = new LazyModuleLoaderClass();

/**
 * Hook to preload modules on hover
 */
export function useModulePreload() {
  let hoverTimer: number | null = null;
  
  const preloadOnHover = (moduleName: string, delay = 100) => {
    const handleMouseEnter = () => {
      hoverTimer = window.setTimeout(() => {
        LazyModuleLoader.preload(moduleName);
      }, delay);
    };
    
    const handleMouseLeave = () => {
      if (hoverTimer) {
        clearTimeout(hoverTimer);
        hoverTimer = null;
      }
    };
    
    return {
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
    };
  };
  
  return { preloadOnHover };
}

/**
 * Utility to create lazy module with retry logic
 */
export function createLazyModule(
  loader: () => Promise<any>,
  options: {
    name?: string;
    maxRetries?: number;
    retryDelay?: number;
  } = {}
): LazyExoticComponent<ComponentType<any>> {
  const { maxRetries = 3, retryDelay = 1000 } = options;
  
  return lazy(async () => {
    let lastError: Error | null = null;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await loader();
      } catch (error) {
        lastError = error as Error;
        console.warn(`Module load attempt ${i + 1} failed, retrying...`);
        
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * (i + 1)));
        }
      }
    }
    
    console.error(`Failed to load module after ${maxRetries} attempts`);
    throw lastError;
  });
}

/**
 * Prefetch module on idle
 */
export function prefetchOnIdle(moduleName: string, timeout = 5000) {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(
      () => {
        LazyModuleLoader.preload(moduleName);
      },
      { timeout }
    );
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => {
      LazyModuleLoader.preload(moduleName);
    }, 1000);
  }
}

/**
 * Prefetch modules based on route priority
 */
export function prefetchByPriority(
  routes: Array<{ name: string; priority: number }>
) {
  // Sort by priority (higher first)
  const sorted = [...routes].sort((a, b) => b.priority - a.priority);
  
  // Prefetch high priority immediately
  const highPriority = sorted.filter(r => r.priority >= 80);
  highPriority.forEach(route => {
    LazyModuleLoader.preload(route.name);
  });
  
  // Prefetch medium priority on idle
  const mediumPriority = sorted.filter(r => r.priority >= 50 && r.priority < 80);
  mediumPriority.forEach(route => {
    prefetchOnIdle(route.name);
  });
  
  // Low priority not prefetched - load on demand
}

/**
 * Example usage:
 * 
 * // Register lazy modules
 * const DashboardModule = LazyModuleLoader.register(
 *   'dashboard',
 *   () => import('./modules/dashboard')
 * );
 * 
 * // Preload on hover
 * const { preloadOnHover } = useModulePreload();
 * <Link {...preloadOnHover('dashboard')}>Dashboard</Link>
 * 
 * // Manual preload
 * await LazyModuleLoader.preload('dashboard');
 * 
 * // Prefetch on idle
 * prefetchOnIdle('settings');
 * 
 * // With retry logic
 * const Module = createLazyModule(
 *   () => import('./Module'),
 *   { maxRetries: 3, retryDelay: 1000 }
 * );
 */
