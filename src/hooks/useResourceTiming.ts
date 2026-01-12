/**
 * Resource Timing Hook
 * 
 * Monitor and analyze resource loading performance
 */

import { useEffect, useState } from 'react';

export interface ResourceTiming {
  name: string;
  type: string;
  duration: number;
  size: number;
  startTime: number;
  cached: boolean;
}

export interface ResourceStats {
  totalResources: number;
  totalSize: number;
  totalDuration: number;
  cachedCount: number;
  byType: Record<string, { count: number; size: number; duration: number }>;
}

/**
 * Get resource type from URL
 */
function getResourceType(url: string): string {
  if (url.includes('.js')) return 'script';
  if (url.includes('.css')) return 'stylesheet';
  if (url.match(/\.(png|jpg|jpeg|gif|webp|svg)/)) return 'image';
  if (url.match(/\.(woff|woff2|ttf|otf)/)) return 'font';
  if (url.includes('/api/')) return 'xhr';
  return 'other';
}

/**
 * Hook to monitor resource timing
 */
export function useResourceTiming(enabled = true) {
  const [timings, setTimings] = useState<ResourceTiming[]>([]);
  const [stats, setStats] = useState<ResourceStats>({
    totalResources: 0,
    totalSize: 0,
    totalDuration: 0,
    cachedCount: 0,
    byType: {},
  });
  
  useEffect(() => {
    if (!enabled || !('performance' in window)) return;
    
    const updateTimings = () => {
      const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      
      const resourceTimings: ResourceTiming[] = entries.map(entry => ({
        name: entry.name,
        type: getResourceType(entry.name),
        duration: entry.duration,
        size: entry.transferSize || 0,
        startTime: entry.startTime,
        cached: entry.transferSize === 0 && entry.decodedBodySize > 0,
      }));
      
      // Calculate stats
      const newStats: ResourceStats = {
        totalResources: resourceTimings.length,
        totalSize: 0,
        totalDuration: 0,
        cachedCount: 0,
        byType: {},
      };
      
      resourceTimings.forEach(timing => {
        newStats.totalSize += timing.size;
        newStats.totalDuration += timing.duration;
        if (timing.cached) newStats.cachedCount++;
        
        if (!newStats.byType[timing.type]) {
          newStats.byType[timing.type] = { count: 0, size: 0, duration: 0 };
        }
        
        newStats.byType[timing.type].count++;
        newStats.byType[timing.type].size += timing.size;
        newStats.byType[timing.type].duration += timing.duration;
      });
      
      setTimings(resourceTimings);
      setStats(newStats);
    };
    
    // Initial update
    updateTimings();
    
    // Listen for new resources
    const observer = new PerformanceObserver((list) => {
      updateTimings();
    });
    
    observer.observe({ entryTypes: ['resource'] });
    
    return () => {
      observer.disconnect();
    };
  }, [enabled]);
  
  return { timings, stats };
}

/**
 * Hook to monitor specific resource loading
 */
export function useResourceLoad(resourceUrl: string) {
  const [loading, setLoading] = useState(true);
  const [timing, setTiming] = useState<ResourceTiming | null>(null);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    if (!('performance' in window)) {
      setLoading(false);
      return;
    }
    
    const checkResource = () => {
      const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const entry = entries.find(e => e.name.includes(resourceUrl));
      
      if (entry) {
        setTiming({
          name: entry.name,
          type: getResourceType(entry.name),
          duration: entry.duration,
          size: entry.transferSize || 0,
          startTime: entry.startTime,
          cached: entry.transferSize === 0 && entry.decodedBodySize > 0,
        });
        setLoading(false);
      }
    };
    
    // Check if already loaded
    checkResource();
    
    // Listen for the resource
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries() as PerformanceResourceTiming[];
      const entry = entries.find(e => e.name.includes(resourceUrl));
      
      if (entry) {
        setTiming({
          name: entry.name,
          type: getResourceType(entry.name),
          duration: entry.duration,
          size: entry.transferSize || 0,
          startTime: entry.startTime,
          cached: entry.transferSize === 0 && entry.decodedBodySize > 0,
        });
        setLoading(false);
        observer.disconnect();
      }
    });
    
    observer.observe({ entryTypes: ['resource'] });
    
    // Timeout after 30s
    const timeout = setTimeout(() => {
      if (loading) {
        setError(new Error('Resource load timeout'));
        setLoading(false);
        observer.disconnect();
      }
    }, 30000);
    
    return () => {
      observer.disconnect();
      clearTimeout(timeout);
    };
  }, [resourceUrl]);
  
  return { loading, timing, error };
}

/**
 * Get slow resources (> threshold ms)
 */
export function getSlowResources(threshold = 1000): ResourceTiming[] {
  if (!('performance' in window)) return [];
  
  const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  
  return entries
    .filter(entry => entry.duration > threshold)
    .map(entry => ({
      name: entry.name,
      type: getResourceType(entry.name),
      duration: entry.duration,
      size: entry.transferSize || 0,
      startTime: entry.startTime,
      cached: entry.transferSize === 0 && entry.decodedBodySize > 0,
    }))
    .sort((a, b) => b.duration - a.duration);
}

/**
 * Get resources by type
 */
export function getResourcesByType(type: string): ResourceTiming[] {
  if (!('performance' in window)) return [];
  
  const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  
  return entries
    .filter(entry => getResourceType(entry.name) === type)
    .map(entry => ({
      name: entry.name,
      type: getResourceType(entry.name),
      duration: entry.duration,
      size: entry.transferSize || 0,
      startTime: entry.startTime,
      cached: entry.transferSize === 0 && entry.decodedBodySize > 0,
    }));
}

/**
 * Clear resource timings
 */
export function clearResourceTimings() {
  if ('performance' in window && performance.clearResourceTimings) {
    performance.clearResourceTimings();
  }
}

/**
 * Get navigation timing
 */
export function getNavigationTiming() {
  if (!('performance' in window)) return null;
  
  const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  if (!nav) return null;
  
  return {
    // DNS
    dnsLookup: nav.domainLookupEnd - nav.domainLookupStart,
    
    // TCP
    tcpConnection: nav.connectEnd - nav.connectStart,
    
    // Request/Response
    requestTime: nav.responseStart - nav.requestStart,
    responseTime: nav.responseEnd - nav.responseStart,
    
    // DOM
    domInteractive: nav.domInteractive - nav.fetchStart,
    domContentLoaded: nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart,
    domComplete: nav.domComplete - nav.fetchStart,
    
    // Load
    loadTime: nav.loadEventEnd - nav.loadEventStart,
    totalTime: nav.loadEventEnd - nav.fetchStart,
    
    // Additional
    redirectTime: nav.redirectEnd - nav.redirectStart,
    cacheTime: nav.domainLookupStart - nav.fetchStart,
  };
}

/**
 * Log performance summary to console
 */
export function logPerformanceSummary() {
  const nav = getNavigationTiming();
  if (!nav) {
    console.log('Performance API not available');
    return;
  }
  
  console.group('🚀 Performance Summary');
  console.log('DNS Lookup:', `${nav.dnsLookup.toFixed(2)}ms`);
  console.log('TCP Connection:', `${nav.tcpConnection.toFixed(2)}ms`);
  console.log('Request Time:', `${nav.requestTime.toFixed(2)}ms`);
  console.log('Response Time:', `${nav.responseTime.toFixed(2)}ms`);
  console.log('DOM Interactive:', `${nav.domInteractive.toFixed(2)}ms`);
  console.log('DOM Content Loaded:', `${nav.domContentLoaded.toFixed(2)}ms`);
  console.log('DOM Complete:', `${nav.domComplete.toFixed(2)}ms`);
  console.log('Load Time:', `${nav.loadTime.toFixed(2)}ms`);
  console.log('Total Time:', `${nav.totalTime.toFixed(2)}ms`);
  console.groupEnd();
  
  const slowResources = getSlowResources(500);
  if (slowResources.length > 0) {
    console.group('⚠️ Slow Resources (>500ms)');
    slowResources.forEach(resource => {
      console.log(
        `${resource.type}: ${resource.name}`,
        `- ${resource.duration.toFixed(2)}ms`,
        resource.cached ? '(cached)' : `(${(resource.size / 1024).toFixed(2)}KB)`
      );
    });
    console.groupEnd();
  }
}

/**
 * Example usage:
 * 
 * // Monitor all resources
 * const { timings, stats } = useResourceTiming();
 * console.log('Total resources:', stats.totalResources);
 * console.log('Total size:', stats.totalSize);
 * 
 * // Monitor specific resource
 * const { loading, timing } = useResourceLoad('app.js');
 * 
 * // Get slow resources
 * const slow = getSlowResources(1000);
 * 
 * // Log summary
 * logPerformanceSummary();
 */
