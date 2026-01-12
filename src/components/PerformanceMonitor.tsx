import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Activity, Zap, Clock, Eye, TrendingUp, X } from "lucide-react";
import { WebVitalsMetric } from "../hooks/useWebVitals";

/**
 * Performance Monitor Component (Development Only)
 * 
 * Displays real-time performance metrics
 * Only visible in development mode
 * Gracefully handles missing web-vitals library
 */
export function PerformanceMonitor() {
  const [isVisible, setIsVisible] = useState(false);
  const [metrics, setMetrics] = useState<WebVitalsMetric[]>([]);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hasWebVitals, setHasWebVitals] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Only show in development
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") {
      return;
    }

    // Check if web-vitals is available
    const checkWebVitals = async () => {
      try {
        const webVitals = await import("web-vitals");
        if (webVitals && typeof webVitals.onCLS === "function") {
          setHasWebVitals(true);
          
          // Setup web vitals monitoring
          const reportMetric = (metric: WebVitalsMetric) => {
            setMetrics((prev) => {
              const filtered = prev.filter((m) => m.name !== metric.name);
              return [...filtered, metric];
            });
          };

          // Register metrics with type checking
          if (typeof webVitals.onCLS === "function") {
            webVitals.onCLS(reportMetric);
          }
          if (typeof webVitals.onFCP === "function") {
            webVitals.onFCP(reportMetric);
          }
          if (typeof webVitals.onINP === "function") {
            webVitals.onINP(reportMetric);
          } else if (typeof webVitals.onFID === "function") {
            webVitals.onFID(reportMetric);
          }
          if (typeof webVitals.onLCP === "function") {
            webVitals.onLCP(reportMetric);
          }
          if (typeof webVitals.onTTFB === "function") {
            webVitals.onTTFB(reportMetric);
          }
        }
      } catch (error) {
        setHasWebVitals(false);
        console.info(
          "💡 Performance Monitor: web-vitals not installed. Run: npm install web-vitals"
        );
      } finally {
        setIsLoading(false);
      }
    };

    checkWebVitals();

    // Check localStorage for saved visibility state
    const saved = localStorage.getItem("perf-monitor-visible");
    setIsVisible(saved === "true");

    // Keyboard shortcut: Ctrl+Shift+P
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "P") {
        e.preventDefault();
        setIsVisible((prev) => {
          const newValue = !prev;
          localStorage.setItem("perf-monitor-visible", String(newValue));
          return newValue;
        });
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragStart]);

  if (process.env.NODE_ENV !== "development" || !isVisible || isLoading) {
    return null;
  }

  const getMetricIcon = (name: string) => {
    switch (name) {
      case "CLS":
        return Activity;
      case "FCP":
      case "LCP":
        return Eye;
      case "FID":
      case "INP":
        return Zap;
      case "TTFB":
        return Clock;
      default:
        return TrendingUp;
    }
  };

  const getMetricColor = (rating: string) => {
    switch (rating) {
      case "good":
        return "text-success";
      case "needs-improvement":
        return "text-warning";
      case "poor":
        return "text-destructive";
      default:
        return "text-muted-foreground";
    }
  };

  const formatValue = (metric: WebVitalsMetric) => {
    if (metric.name === "CLS") {
      return metric.value.toFixed(3);
    }
    return `${Math.round(metric.value)}ms`;
  };

  return (
    <div
      className="fixed z-[9999] select-none"
      style={{
        left: position.x,
        top: position.y,
        cursor: isDragging ? "grabbing" : "grab",
      }}
      onMouseDown={handleMouseDown}
    >
      <Card className="w-80 shadow-2xl border-2 border-primary/20 backdrop-blur-xl bg-card/95">
        <div className="p-3 border-b border-border/40 flex items-center justify-between bg-gradient-to-r from-primary/10 to-transparent">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${hasWebVitals ? 'bg-success animate-pulse' : 'bg-warning'}`} />
            <h3 className="text-sm font-semibold">Performance Monitor</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => {
              setIsVisible(false);
              localStorage.setItem("perf-monitor-visible", "false");
            }}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-3 space-y-2">
          {!hasWebVitals ? (
            <div className="text-center py-4">
              <div className="text-sm text-muted-foreground mb-2">
                web-vitals not installed
              </div>
              <code className="text-xs bg-muted px-2 py-1 rounded">
                npm install web-vitals
              </code>
            </div>
          ) : metrics.length === 0 ? (
            <div className="text-center py-4 text-sm text-muted-foreground">
              Waiting for metrics...
            </div>
          ) : (
            metrics.map((metric) => {
              const Icon = getMetricIcon(metric.name);
              const colorClass = getMetricColor(metric.rating);

              return (
                <div
                  key={metric.name}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{metric.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {metric.rating.replace("-", " ")}
                      </p>
                    </div>
                  </div>
                  <div className={`text-sm font-semibold ${colorClass}`}>
                    {formatValue(metric)}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-2 border-t border-border/40 bg-muted/30">
          <p className="text-xs text-muted-foreground text-center">
            Press <kbd className="px-1.5 py-0.5 rounded bg-muted text-foreground">Ctrl+Shift+P</kbd> to toggle
          </p>
        </div>
      </Card>
    </div>
  );
}