import { ModuleConfig } from "../../core/ModuleRegistry";
import { lazy, Suspense } from "react";
import { LoadingFallback } from "../../components/LoadingFallback";
import { LayoutDashboard, BarChart3, PieChart, TrendingUp, Activity } from "lucide-react";

/**
 * Lazy-load Dashboard Page
 */
const DashboardPage = lazy(() => import("./DashboardPage"));

/**
 * Dashboard Module
 * 
 * Module trang chủ/dashboard của ứng dụng
 * Metadata loaded immediately, component lazy loaded
 */
export const DashboardModule: ModuleConfig = {
  id: "dashboard",
  name: "Dashboard",
  icon: <LayoutDashboard className="w-4 h-4" />,
  enabled: true,
  showInSidebar: true, // Show menu items in sidebar
  routes: [
    {
      path: "/core/dashboard",
      element: (
        <Suspense fallback={<LoadingFallback message="Đang tải Dashboard..." />}>
          <DashboardPage />
        </Suspense>
      ),
      title: "Dashboard",
    },
  ],
  menuItems: [
    {
      id: "dashboard",
      label: "navigation.dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
      path: "/core/dashboard",
    },
  ],
};