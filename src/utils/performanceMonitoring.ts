/**
 * Performance Monitoring Utilities
 * Real-time performance tracking and reporting
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private observers: PerformanceObserver[] = [];

  /**
   * Initialize performance monitoring
   */
  init() {
    if (typeof window === 'undefined') return;

    this.observeWebVitals();
    this.observeNavigationTiming();
    this.observeResourceTiming();
    this.observeLongTasks();
  }

  /**
   * Observe Web Vitals (LCP, FID, CLS)
   */
  private observeWebVitals() {
    if (typeof PerformanceObserver === 'undefined') return;

    // Largest Contentful Paint (LCP)
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.recordMetric('LCP', lastEntry.startTime);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);
    } catch (e) {
      // LCP not supported
    }

    // First Input Delay (FID)
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries() as PerformanceEventTiming[];
        entries.forEach((entry) => {
          const fid = entry.processingStart - entry.startTime;
          this.recordMetric('FID', fid);
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);
    } catch (e) {
      // FID not supported
    }

    // Cumulative Layout Shift (CLS)
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries() as any[];
        entries.forEach((entry) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            this.recordMetric('CLS', clsValue);
          }
        });
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);
    } catch (e) {
      // CLS not supported
    }
  }

  /**
   * Observe Navigation Timing
   */
  private observeNavigationTiming() {
    if (typeof window === 'undefined' || !window.performance) return;

    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = window.performance.timing;
        const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
        const domReadyTime = perfData.domContentLoadedEventEnd - perfData.navigationStart;
        const domInteractive = perfData.domInteractive - perfData.navigationStart;

        this.recordMetric('PageLoad', pageLoadTime);
        this.recordMetric('DOMReady', domReadyTime);
        this.recordMetric('DOMInteractive', domInteractive);
      }, 0);
    });
  }

  /**
   * Observe Resource Timing
   */
  private observeResourceTiming() {
    if (typeof PerformanceObserver === 'undefined') return;

    try {
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          const duration = entry.duration;
          const name = entry.name.split('/').pop() || entry.name;
          
          this.recordMetric('Resource', duration, {
            resourceName: name,
            resourceType: entry.initiatorType,
          });
        });
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);
    } catch (e) {
      // Resource timing not supported
    }
  }

  /**
   * Observe Long Tasks
   */
  private observeLongTasks() {
    if (typeof PerformanceObserver === 'undefined') return;

    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          this.recordMetric('LongTask', entry.duration);
        });
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
      this.observers.push(longTaskObserver);
    } catch (e) {
      // Long tasks not supported
    }
  }

  /**
   * Record a performance metric
   */
  recordMetric(
    name: string,
    value: number,
    tags?: Record<string, string>
  ): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      tags,
    };

    this.metrics.push(metric);

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${name}:`, value.toFixed(2), 'ms', tags || '');
    }

    // Send to analytics in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalytics(metric);
    }

    // Keep only last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics.shift();
    }
  }

  /**
   * Send metric to analytics service
   */
  private sendToAnalytics(metric: PerformanceMetric): void {
    // Implement your analytics integration here
    // Example: analytics.track('performance_metric', metric);
  }

  /**
   * Get all metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Get metrics by name
   */
  getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter((m) => m.name === name);
  }

  /**
   * Get average metric value
   */
  getAverageMetric(name: string): number {
    const metrics = this.getMetricsByName(name);
    if (metrics.length === 0) return 0;
    
    const sum = metrics.reduce((acc, m) => acc + m.value, 0);
    return sum / metrics.length;
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Cleanup observers
   */
  cleanup(): void {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];
  }

  /**
   * Mark custom timing
   */
  mark(name: string): void {
    if (typeof performance !== 'undefined') {
      performance.mark(name);
    }
  }

  /**
   * Measure between marks
   */
  measure(name: string, startMark: string, endMark: string): void {
    if (typeof performance !== 'undefined') {
      try {
        performance.measure(name, startMark, endMark);
        const measure = performance.getEntriesByName(name)[0];
        if (measure) {
          this.recordMetric(name, measure.duration);
        }
      } catch (e) {
        // Marks don't exist
      }
    }
  }

  /**
   * Get performance summary
   */
  getSummary(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const summary: Record<string, { avg: number; min: number; max: number; count: number }> = {};

    this.metrics.forEach((metric) => {
      if (!summary[metric.name]) {
        summary[metric.name] = {
          avg: 0,
          min: Infinity,
          max: -Infinity,
          count: 0,
        };
      }

      const s = summary[metric.name];
      s.avg = (s.avg * s.count + metric.value) / (s.count + 1);
      s.min = Math.min(s.min, metric.value);
      s.max = Math.max(s.max, metric.value);
      s.count++;
    });

    return summary;
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Initialize performance monitoring
 */
export function initPerformanceMonitoring() {
  if (typeof window !== 'undefined') {
    performanceMonitor.init();
  }
}

/**
 * Track component render time
 */
export function trackComponentRender(componentName: string) {
  const startMark = `${componentName}-render-start`;
  const endMark = `${componentName}-render-end`;

  performanceMonitor.mark(startMark);

  return () => {
    performanceMonitor.mark(endMark);
    performanceMonitor.measure(`${componentName}-render`, startMark, endMark);
  };
}
