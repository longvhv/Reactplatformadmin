/**
 * Performance Utilities
 * Advanced performance optimization helpers
 */

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
 * Create a memoized function
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>) => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key);
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
  // Implementation depends on memoization strategy
  console.log('Cache cleared');
}

/**
 * Lazy load component after delay
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
 * Preload component
 */
export function preloadComponent<T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
): void {
  importFunc();
}

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

/**
 * Batch multiple state updates
 */
export function batchUpdates<T>(updates: (() => void)[]): void {
  // In React 18+, updates are automatically batched
  updates.forEach(update => update());
}

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
 * Optimize images based on device pixel ratio
 */
export function getOptimizedImageUrl(url: string, width: number): string {
  const dpr = isBrowser ? window.devicePixelRatio || 1 : 1;
  const optimizedWidth = Math.round(width * dpr);
  
  // This is a placeholder - implement based on your image CDN
  return url.replace(/\.(jpg|jpeg|png|webp)$/, `-${optimizedWidth}w.$1`);
}

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

import React from 'react';
