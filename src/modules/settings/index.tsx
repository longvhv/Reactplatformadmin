import { ModuleConfig } from "../../core/ModuleRegistry";
import { lazy, Suspense } from "react";
import { LoadingFallback } from "../../components/LoadingFallback";
import { Settings, Globe, Shield, Bell, Database, Sliders } from "lucide-react";

/**
 * Lazy-load Settings Page
 */
const SettingsPage = lazy(() => import("../../pages/SettingsPage"));

/**
 * Settings Module
 * 
 * Module cài đặt ứng dụng
 * Metadata loaded immediately, component lazy loaded
 */
export const SettingsModule: ModuleConfig = {
  id: "settings",
  name: "Hệ thống",
  icon: <Settings className="w-4 h-4" />,
  enabled: true,
  showInSidebar: true, // ✅ CHANGED: Show in main sidebar
  order: 100, // ✅ ADDED: Platform & Configuration group (80-99)
  routes: [
    {
      path: "/core/settings",
      element: (
        <Suspense fallback={<LoadingFallback message="Đang tải cài đặt..." />}>
          <SettingsPage />
        </Suspense>
      ),
      title: "Settings",
    },
  ],
  menuItems: [
    {
      id: "settings",
      label: "Cài Đặt",
      icon: <Settings className="w-5 h-5" />,
      path: "/core/settings",
      order: 100, // ✅ ADDED: Consistent ordering
    } as any,
  ],
};