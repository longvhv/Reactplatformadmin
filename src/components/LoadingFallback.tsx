import { Card } from "./ui/card";
import { Loader2 } from "lucide-react";

interface LoadingFallbackProps {
  message?: string;
  fullScreen?: boolean;
}

/**
 * Loading Fallback Component
 * 
 * Elegant loading state cho Suspense boundaries
 */
export function LoadingFallback({ 
  message = "Đang tải...", 
  fullScreen = false 
}: LoadingFallbackProps) {
  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center animate-in fade-in-0 zoom-in-95 duration-500">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
          <p className="text-muted-foreground">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

/**
 * Skeleton Loading Components
 */
export function SkeletonCard() {
  return (
    <Card className="p-6 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-muted rounded w-24"></div>
          <div className="h-8 bg-muted rounded w-32"></div>
        </div>
        <div className="w-12 h-12 bg-muted rounded-xl"></div>
      </div>
      <div className="h-12 bg-muted rounded mb-3"></div>
      <div className="h-6 bg-muted rounded w-40"></div>
    </Card>
  );
}

export function SkeletonTable() {
  return (
    <Card className="overflow-hidden">
      <div className="p-6 border-b border-border/40 animate-pulse">
        <div className="h-6 bg-muted rounded w-48 mb-2"></div>
        <div className="h-4 bg-muted rounded w-64"></div>
      </div>
      <div className="p-6 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 animate-pulse">
            <div className="w-10 h-10 bg-muted rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-32"></div>
              <div className="h-3 bg-muted rounded w-48"></div>
            </div>
            <div className="h-6 bg-muted rounded w-16"></div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function SkeletonStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
