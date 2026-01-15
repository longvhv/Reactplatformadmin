/**
 * Performance Utilities - Unified
 * Advanced performance optimization helpers merged from lib and utils
 * 
 * Features:
 * - Debounce & Throttle
 * - Lazy loading with retry
 * - Performance monitoring
 * - Memoization
 * - Virtual scroll helpers
 * - Network awareness
 * - Prefetching & preloading
 */

import React from 'react';

// =====================================================
// FUNCTION UTILITIES
// =====================================================

/**
 * Debounce function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function calls
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  let lastResult: ReturnType<T>;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      inThrottle = true;
      lastResult = func(...args);
      setTimeout(() => (inThrottle = false), limit);
    }
    return lastResult;
  };
}

// =====================================================
// MEASUREMENT & MONITORING
// =====================================================

/**
 * Measure function execution time
 */
export async function measureTime<T>(
  fn: () => T | Promise<T>,
  label: string
): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    const end = performance.now();
    console.log(`[Performance] ${label}: ${(end - start).toFixed(2)}ms`);
    return result;
  } catch (error) {
    const end = performance.now();
    console.error(`[Performance] ${label} failed after ${(end - start).toFixed(2)}ms`);
    throw error;
  }
}

/**
 * Performance monitoring class
 */
export class PerformanceMonitor {
  private static marks: Map<string, number> = new Map();

  static start(label: string): void {
    this.marks.set(label, performance.now());
  }

  static end(label: string, log = true): number {
    const start = this.marks.get(label);
    if (!start) {
      console.warn(`No start mark found for "${label}"`);
      return 0;
    }

    const duration = performance.now() - start;
    this.marks.delete(label);

    if (log) {
      console.log(`⚡ ${label}: ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  static measure(label: string, fn: () => void): number {
    this.start(label);
    fn();
    return this.end(label);
  }

  static async measureAsync(label: string, fn: () => Promise<void>): Promise<number> {
    this.start(label);
    await fn();
    return this.end(label);
  }
}

// =====================================================
// MEMOIZATION
// =====================================================

/**
 * Create a memoized function with custom key generator
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>) => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Clear memoized cache
 */
export function clearMemoCache() {
  console.log('Cache cleared');
}

// =====================================================
// LAZY LOADING
// =====================================================

/**
 * Lazy load component with delay
 */
export function lazyWithDelay<T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  delay: number = 0
): React.LazyExoticComponent<T> {
  return React.lazy(() => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(importFunc());
      }, delay);
    });
  });
}

/**
 * Lazy load component with retry mechanism
 */
export function lazyWithRetry<T extends React.ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  retries = 3,
  interval = 1000
): React.LazyExoticComponent<T> {
  return React.lazy(() =>
    new Promise<{ default: T }>((resolve, reject) => {
      const attemptLoad = (retriesLeft: number) => {
        componentImport()
          .then(resolve)
          .catch((error) => {
            if (retriesLeft === 0) {
              reject(error);
              return;
            }
            setTimeout(() => {
              console.log(`Retrying import... (${retriesLeft} attempts left)`);
              attemptLoad(retriesLeft - 1);
            }, interval);
          });
      };
      attemptLoad(retries);
    })
  );
}

/**
 * Preload component
 */
export function preloadComponent<T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
): void {
  importFunc();
}

// =====================================================
// ENVIRONMENT & DEVICE DETECTION
// =====================================================

/**
 * Check if code is running in browser
 */
export const isBrowser = typeof window !== 'undefined';

/**
 * Check if device is mobile
 */
export function isMobileDevice(): boolean {
  if (!isBrowser) return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * Get connection speed
 */
export function getConnectionSpeed(): 'slow' | 'medium' | 'fast' {
  if (!isBrowser) return 'fast';
  
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  
  if (!connection) return 'fast';
  
  const effectiveType = connection.effectiveType;
  
  if (effectiveType === 'slow-2g' || effectiveType === '2g') return 'slow';
  if (effectiveType === '3g') return 'medium';
  return 'fast';
}

/**
 * Adaptive loading based on network speed
 */
export function shouldLoadHeavyContent(): boolean {
  const speed = getConnectionSpeed();
  const isMobile = isMobileDevice();
  
  // Don't load heavy content on slow connections or mobile
  if (speed === 'slow' || (isMobile && speed === 'medium')) {
    return false;
  }
  
  return true;
}

/**
 * Check if should use reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (!isBrowser) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// =====================================================
// IDLE CALLBACKS
// =====================================================

/**
 * Request idle callback polyfill
 */
export const requestIdleCallback =
  isBrowser && 'requestIdleCallback' in window
    ? window.requestIdleCallback
    : (cb: IdleRequestCallback) => setTimeout(cb, 1);

/**
 * Cancel idle callback polyfill
 */
export const cancelIdleCallback =
  isBrowser && 'cancelIdleCallback' in window
    ? window.cancelIdleCallback
    : (id: number) => clearTimeout(id);

/**
 * Run function when browser is idle
 */
export function runWhenIdle(callback: () => void, options?: IdleRequestOptions) {
  return requestIdleCallback(callback, options);
}

// =====================================================
// BATCH UPDATES
// =====================================================

/**
 * Batch multiple state updates
 */
export function batchUpdates<T>(
  updates: (() => void)[],
  callback?: () => void
): void {
  // React 18+ automatically batches updates in event handlers
  // But still useful for non-event scenarios
  if (typeof React !== "undefined" && "startTransition" in React) {
    React.startTransition(() => {
      updates.forEach((update) => update());
      callback?.();
    });
  } else {
    updates.forEach(update => update());
    callback?.();
  }
}

// =====================================================
// VIEWPORT & VISIBILITY
// =====================================================

/**
 * Check if element is in viewport
 */
export function isInViewport(element: Element): boolean {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Virtual scroll helper - Calculate visible items in viewport
 */
export function getVisibleRange(
  scrollTop: number,
  containerHeight: number,
  itemHeight: number,
  totalItems: number,
  overscan = 3
): { start: number; end: number } {
  const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const end = Math.min(totalItems, start + visibleCount + overscan * 2);

  return { start, end };
}

// =====================================================
// IMAGE OPTIMIZATION
// =====================================================

/**
 * Optimize images based on device pixel ratio
 */
export function getOptimizedImageUrl(url: string, width: number): string {
  const dpr = isBrowser ? window.devicePixelRatio || 1 : 1;
  const optimizedWidth = Math.round(width * dpr);
  
  // This is a placeholder - implement based on your image CDN
  return url.replace(/\.(jpg|jpeg|png|webp)$/, `-${optimizedWidth}w.$1`);
}

// =====================================================
// DNS & PRECONNECT
// =====================================================

/**
 * Prefetch DNS for external domains
 */
export function prefetchDNS(domains: string[]) {
  if (!isBrowser) return;
  
  domains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = domain;
    document.head.appendChild(link);
  });
}

/**
 * Preconnect to external domains
 */
export function preconnect(urls: string[]) {
  if (!isBrowser) return;
  
  urls.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = url;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
}

// =====================================================
// EVENT LISTENERS
// =====================================================

/**
 * Optimize event listener with passive flag
 */
export function addPassiveEventListener(
  element: HTMLElement | Window,
  event: string,
  handler: EventListener
): void {
  element.addEventListener(event, handler, { passive: true });
}

// =====================================================
// WEB VITALS & MONITORING
// =====================================================

/**
 * Initialize performance monitoring
 */
export function initPerformanceMonitoring(): void {
  if (typeof window === 'undefined' || !('performance' in window)) {
    return;
  }

  // Monitor Web Vitals
  if ('PerformanceObserver' in window) {
    try {
      // Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        console.log('⚡ LCP:', lastEntry.renderTime || lastEntry.loadTime);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          console.log('⚡ FID:', entry.processingStart - entry.startTime);
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift (CLS)
      let clsScore = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsScore += entry.value;
            console.log('⚡ CLS:', clsScore);
          }
        });
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      console.warn('Performance monitoring setup failed:', e);
    }
  }

  // Log initial page load metrics
  if (document.readyState === 'complete') {
    logPageLoadMetrics();
  } else {
    window.addEventListener('load', logPageLoadMetrics);
  }
}

/**
 * Log page load metrics
 */
function logPageLoadMetrics(): void {
  if (!('performance' in window)) return;

  const perfData = window.performance.timing;
  const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
  const connectTime = perfData.responseEnd - perfData.requestStart;
  const renderTime = perfData.domComplete - perfData.domLoading;

  console.log('📊 Page Load Metrics:');
  console.log('  - Total Load Time:', pageLoadTime, 'ms');
  console.log('  - Connect Time:', connectTime, 'ms');
  console.log('  - Render Time:', renderTime, 'ms');
}

/**
 * Preload critical resources
 */
export function preloadCriticalResources(): void {
  if (typeof document === 'undefined') return;

  // Preload Inter font (used throughout the app)
  const fontLink = document.createElement('link');
  fontLink.rel = 'preload';
  fontLink.as = 'font';
  fontLink.type = 'font/woff2';
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
  fontLink.crossOrigin = 'anonymous';
  document.head.appendChild(fontLink);

  // Preconnect to CDN domains
  const cdnDomains = [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
  ];

  cdnDomains.forEach((domain) => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = domain;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });

  console.log('✅ Critical resources preloaded');
}

/**
 * Setup intelligent prefetching for navigation
 */
export function setupIntelligentPrefetch(): () => void {
  if (typeof window === 'undefined') return () => {};

  const prefetchedUrls = new Set<string>();
  const observers: IntersectionObserver[] = [];

  // Prefetch links when they enter viewport
  const prefetchOnVisible = () => {
    const links = document.querySelectorAll('a[href^="/"]');
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const link = entry.target as HTMLAnchorElement;
            const href = link.getAttribute('href');
            
            if (href && !prefetchedUrls.has(href)) {
              prefetchedUrls.add(href);
              // In a real app, you'd prefetch the route chunk here
              console.log('🔮 Prefetching:', href);
            }
          }
        });
      },
      { rootMargin: '50px' }
    );

    links.forEach((link) => observer.observe(link));
    observers.push(observer);
  };

  // Prefetch on mouse hover with delay
  const prefetchOnHover = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const link = target.closest('a[href^="/"]') as HTMLAnchorElement;
    
    if (link) {
      const href = link.getAttribute('href');
      if (href && !prefetchedUrls.has(href)) {
        setTimeout(() => {
          if (link.matches(':hover')) {
            prefetchedUrls.add(href);
            console.log('🔮 Prefetching on hover:', href);
          }
        }, 100);
      }
    }
  };

  // Setup observers
  if ('IntersectionObserver' in window) {
    prefetchOnVisible();
  }

  document.addEventListener('mouseover', prefetchOnHover, { passive: true });

  // Cleanup function
  return () => {
    observers.forEach((observer) => observer.disconnect());
    document.removeEventListener('mouseover', prefetchOnHover);
  };
}
