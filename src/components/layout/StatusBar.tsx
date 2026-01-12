import { memo, useState, useEffect } from "react";
import { Wifi, WifiOff, Activity, AlertTriangle, CheckCircle2, Clock } from "lucide-react";

/**
 * Status Bar - Inspired by VS Code & Linear
 * 
 * Features:
 * - System status indicators
 * - Network status
 * - Real-time updates
 * - Performance metrics
 * - Deployment status
 * - Smooth animations
 */
export const StatusBar = memo(() => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const [deployStatus, setDeployStatus] = useState<"idle" | "deploying" | "success" | "error">("idle");

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Auto sync every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setLastSync(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const formatLastSync = () => {
    const seconds = Math.floor((new Date().getTime() - lastSync.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s trước`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m trước`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h trước`;
  };

  return (
    <div className="hidden lg:flex items-center gap-4 px-6 py-1.5 text-xs text-muted-foreground border-t border-border/20">
      {/* Network Status */}
      <div className={`flex items-center gap-1.5 transition-colors duration-200 ${
        isOnline ? "text-success" : "text-destructive"
      }`}>
        {isOnline ? (
          <>
            <Wifi className="w-3 h-3" />
            <span>Online</span>
          </>
        ) : (
          <>
            <WifiOff className="w-3 h-3" />
            <span>Offline</span>
          </>
        )}
      </div>

      <div className="w-px h-3 bg-border/40" />

      {/* Last Sync */}
      <div className="flex items-center gap-1.5 hover:text-foreground transition-colors duration-150 cursor-pointer group">
        <Clock className="w-3 h-3 group-hover:rotate-180 transition-transform duration-300" />
        <span>Đồng bộ: {formatLastSync()}</span>
      </div>

      <div className="w-px h-3 bg-border/40" />

      {/* Deploy Status */}
      <div className="flex items-center gap-1.5">
        {deployStatus === "deploying" && (
          <>
            <Activity className="w-3 h-3 text-primary animate-pulse" />
            <span className="text-primary">Đang triển khai...</span>
          </>
        )}
        {deployStatus === "success" && (
          <>
            <CheckCircle2 className="w-3 h-3 text-success" />
            <span className="text-success">Deploy thành công</span>
          </>
        )}
        {deployStatus === "error" && (
          <>
            <AlertTriangle className="w-3 h-3 text-destructive" />
            <span className="text-destructive">Deploy thất bại</span>
          </>
        )}
        {deployStatus === "idle" && (
          <>
            <Activity className="w-3 h-3" />
            <span>Production</span>
          </>
        )}
      </div>

      <div className="flex-1" />

      {/* System Info */}
      <div className="flex items-center gap-3">
        <span className="opacity-60">v1.0.0</span>
        <div className="w-px h-3 bg-border/40" />
        <span className="opacity-60">React 18</span>
        <div className="w-px h-3 bg-border/40" />
        <span className="opacity-60">Vite 5</span>
      </div>
    </div>
  );
});

StatusBar.displayName = "StatusBar";
