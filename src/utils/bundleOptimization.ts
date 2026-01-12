/**
 * Bundle Optimization Utilities
 * Code splitting and dynamic imports helpers
 */

import { lazy, ComponentType } from 'react';

/**
 * Create a lazy component with retry logic
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  retries = 3
): React.LazyExoticComponent<T> {
  return lazy(() => {
    return new Promise<{ default: T }>((resolve, reject) => {
      const attemptImport = (retriesLeft: number) => {
        importFunc()
          .then(resolve)
          .catch((error) => {
            if (retriesLeft === 0) {
              reject(error);
              return;
            }
            
            console.warn(
              `Failed to load component, retrying... (${retriesLeft} retries left)`
            );
            
            // Retry after a delay
            setTimeout(() => {
              attemptImport(retriesLeft - 1);
            }, 1000);
          });
      };

      attemptImport(retries);
    });
  });
}

/**
 * Preload multiple components
 */
export function preloadComponents(
  importFuncs: Array<() => Promise<any>>
): void {
  if (typeof window === 'undefined') return;

  // Use requestIdleCallback to preload in background
  const preload = () => {
    importFuncs.forEach((importFunc) => {
      importFunc().catch((error) => {
        console.warn('Failed to preload component:', error);
      });
    });
  };

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(preload);
  } else {
    setTimeout(preload, 1);
  }
}

/**
 * Preload component on hover
 */
export function preloadOnHover(
  importFunc: () => Promise<any>
): () => void {
  let isPreloaded = false;

  return () => {
    if (!isPreloaded) {
      isPreloaded = true;
      importFunc().catch((error) => {
        console.warn('Failed to preload on hover:', error);
      });
    }
  };
}

/**
 * Preload component on interaction
 */
export function setupPreloadOnInteraction(
  element: HTMLElement,
  importFunc: () => Promise<any>
): () => void {
  const preload = preloadOnHover(importFunc);

  const handlers = {
    mouseenter: preload,
    touchstart: preload,
    focus: preload,
  };

  Object.entries(handlers).forEach(([event, handler]) => {
    element.addEventListener(event, handler, { once: true, passive: true });
  });

  // Return cleanup function
  return () => {
    Object.entries(handlers).forEach(([event, handler]) => {
      element.removeEventListener(event, handler);
    });
  };
}

/**
 * Check if module is already loaded
 */
export function isModuleLoaded(moduleName: string): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check if module exists in window.__webpack_modules__ or similar
  // This is implementation-specific
  return false;
}

/**
 * Get chunk loading state
 */
export function getChunkLoadingState(): {
  loading: string[];
  loaded: string[];
  failed: string[];
} {
  // This would need integration with your bundler
  return {
    loading: [],
    loaded: [],
    failed: [],
  };
}

/**
 * Report chunk load time
 */
export function reportChunkLoadTime(
  chunkName: string,
  loadTime: number
): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Chunk Load] ${chunkName}: ${loadTime.toFixed(2)}ms`);
  }

  // Send to analytics in production
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    // Send to your analytics service
    // Example: analytics.track('chunk_load', { chunkName, loadTime });
  }
}

/**
 * Optimize bundle by route
 */
export function getBundleStrategy(): 'eager' | 'lazy' | 'prefetch' {
  if (typeof window === 'undefined') return 'lazy';

  // Check connection speed
  const connection = (navigator as any).connection;
  if (connection) {
    if (connection.effectiveType === '4g') {
      return 'prefetch';
    }
    if (connection.effectiveType === '3g') {
      return 'lazy';
    }
    return 'eager'; // Slow connection
  }

  return 'lazy';
}

/**
 * Dynamic import with performance tracking
 */
export async function dynamicImportWithTracking<T>(
  importFunc: () => Promise<T>,
  moduleName: string
): Promise<T> {
  const startTime = performance.now();

  try {
    const module = await importFunc();
    const loadTime = performance.now() - startTime;
    reportChunkLoadTime(moduleName, loadTime);
    return module;
  } catch (error) {
    const loadTime = performance.now() - startTime;
    console.error(`Failed to load ${moduleName} after ${loadTime.toFixed(2)}ms:`, error);
    throw error;
  }
}
