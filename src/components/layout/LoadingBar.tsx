import { memo, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Loading Progress Bar - Inspired by YouTube & GitHub
 * 
 * Features:
 * - Auto-triggered on route changes
 * - Smooth progress animation
 * - Gradient styling
 * - Auto-complete
 */
export const LoadingBar = memo(() => {
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Start loading on route change
    setIsLoading(true);
    setProgress(0);

    // Simulate progress
    const timer1 = setTimeout(() => setProgress(30), 100);
    const timer2 = setTimeout(() => setProgress(60), 300);
    const timer3 = setTimeout(() => setProgress(90), 500);
    const timer4 = setTimeout(() => {
      setProgress(100);
      setTimeout(() => setIsLoading(false), 300);
    }, 700);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [location.pathname]);

  if (!isLoading) return null;

  return (
    <div className="fixed top-0 left-0 lg:left-64 right-0 z-[60] h-1">
      <div
        className="h-full bg-gradient-to-r from-primary via-primary/80 to-primary transition-all duration-300 ease-out shadow-lg shadow-primary/50"
        style={{
          width: `${progress}%`,
          transition: progress === 100 ? "width 0.3s ease-out, opacity 0.3s ease-out" : "width 0.3s ease-out",
          opacity: progress === 100 ? 0 : 1,
        }}
      >
        {/* Shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
      </div>
    </div>
  );
});

LoadingBar.displayName = "LoadingBar";
