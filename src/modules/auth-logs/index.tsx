import { ModuleDefinition } from "../../core/ModuleRegistry";
import { lazy, Suspense } from "react";
import { LoadingFallback } from "../../components/LoadingFallback";
import { Shield } from "lucide-react";

/**
 * Lazy-load Auth Logs Page
 */
const AuthLogsPage = lazy(() => 
  import("../../pages/AuthLogsPage")
);

/**
 * Auth Logs Module
 */
export const AuthLogsModule: ModuleDefinition = {
  id: "auth-logs",
  name: "Auth Logs",
  description: "Quản lý lịch sử truy cập và xác thực",
  icon: <Shield className="w-4 h-4" />,
  enabled: true,
  showInSidebar: true,
  routes: [
    {
      path: "/core/auth-logs",
      element: (
        <Suspense fallback={<LoadingFallback message="Đang tải Lịch sử truy cập..." />}>
          <AuthLogsPage />
        </Suspense>
      ),
      title: "Auth Logs",
    },
  ],
  menuItems: [
    {
      id: "auth-logs",
      label: "navigation.authLogs",
      icon: <Shield className="w-5 h-5" />,
      path: "/core/auth-logs",
    },
  ],
};