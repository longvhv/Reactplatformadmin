import { useEffect } from "react";

/**
 * Web Vitals Metrics
 */
export interface WebVitalsMetric {
  name: "CLS" | "FCP" | "FID" | "INP" | "LCP" | "TTFB";
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  delta: number;
  id: string;
}

/**
 * Custom hook để monitor Web Vitals
 * 
 * Tracks: CLS, FCP, INP (or FID), LCP, TTFB
 * Send metrics to analytics service
 * 
 * Note: FID is deprecated in favor of INP in web-vitals v3+
 * Note: This hook gracefully does nothing if web-vitals is not installed
 */
export function useWebVitals(
  callback?: (metric: WebVitalsMetric) => void
) {
  useEffect(() => {
    // Early return if no callback
    if (!callback) return;

    let mounted = true;

    const loadWebVitals = async () => {
      try {
        // Dynamically import web-vitals - this will throw if not installed
        const webVitals = await import("web-vitals");

        if (!mounted) return;

        const reportMetric = (metric: any) => {
          if (!mounted) return;

          try {
            // Log to console in development
            if (process.env.NODE_ENV === "development") {
              console.log(`⚡ ${metric.name}:`, metric.value.toFixed(2), metric.rating);
            }

            // Send to callback
            callback?.(metric);

            // Send to Google Analytics if available
            if (typeof window !== "undefined" && (window as any).gtag) {
              (window as any).gtag("event", metric.name, {
                value: Math.round(metric.name === "CLS" ? metric.value * 1000 : metric.value),
                event_category: "Web Vitals",
                event_label: metric.id,
                non_interaction: true,
              });
            }
          } catch (error) {
            // Silently fail if callback throws
            console.error("Error in web vitals callback:", error);
          }
        };

        // Register all vitals with error handling for each
        // Only call functions that exist
        try {
          if (typeof webVitals.onCLS === "function") {
            webVitals.onCLS(reportMetric);
          }
        } catch (e) {
          // Silent fail
        }

        try {
          if (typeof webVitals.onFCP === "function") {
            webVitals.onFCP(reportMetric);
          }
        } catch (e) {
          // Silent fail
        }

        // Try INP first (newer), fallback to FID (older)
        try {
          if (typeof webVitals.onINP === "function") {
            webVitals.onINP(reportMetric);
          } else if (typeof webVitals.onFID === "function") {
            webVitals.onFID(reportMetric);
          }
        } catch (e) {
          // Silent fail
        }

        try {
          if (typeof webVitals.onLCP === "function") {
            webVitals.onLCP(reportMetric);
          }
        } catch (e) {
          // Silent fail
        }

        try {
          if (typeof webVitals.onTTFB === "function") {
            webVitals.onTTFB(reportMetric);
          }
        } catch (e) {
          // Silent fail
        }
      } catch (error) {
        // web-vitals not installed or import failed
        // This is expected and OK - just silently skip
        if (process.env.NODE_ENV === "development") {
          console.info(
            "ℹ️ web-vitals not installed. Performance monitoring disabled.\n" +
            "To enable: npm install web-vitals"
          );
        }
      }
    };

    loadWebVitals();

    return () => {
      mounted = false;
    };
  }, [callback]);
}

/**
 * Helper để get rating cho metric value
 */
export function getMetricRating(
  name: WebVitalsMetric["name"],
  value: number
): "good" | "needs-improvement" | "poor" {
  const thresholds = {
    CLS: { good: 0.1, poor: 0.25 },
    FCP: { good: 1800, poor: 3000 },
    FID: { good: 100, poor: 300 },
    INP: { good: 200, poor: 500 },
    LCP: { good: 2500, poor: 4000 },
    TTFB: { good: 800, poor: 1800 },
  };

  const threshold = thresholds[name];
  if (!threshold) return "good";
  
  if (value <= threshold.good) return "good";
  if (value <= threshold.poor) return "needs-improvement";
  return "poor";
}

/**
 * Format metric value for display
 */
export function formatMetricValue(metric: WebVitalsMetric): string {
  if (metric.name === "CLS") {
    return metric.value.toFixed(3);
  }
  return `${Math.round(metric.value)}ms`;
}
