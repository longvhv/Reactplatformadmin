import { ModuleDefinition } from "../../core/ModuleRegistry";
import { lazy, Suspense } from "react";
import { LoadingFallback } from "../../components/LoadingFallback";
import { Shield } from "lucide-react";

/**
 * Lazy-load Auth Logs Page
 */
// Lazy load the list page
// ✅ MIGRATED: Import from /app/(admin)/ for single source of truth
const AuthLogsPage = lazy(() => 
  import('../../app/(admin)/admin/auth-logs/page').then(m => ({ default: m.default }))
);

/**
 * Auth Logs Module
 * 
 * 🌐 Path: /admin/auth-logs
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
      path: "/admin/auth-logs",
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
      path: "/admin/auth-logs",
    },
  ],
};

export default AuthLogsModule;