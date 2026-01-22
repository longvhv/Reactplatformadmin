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
 * 
 * 🌐 Path: /system/settings
 */
export const SettingsModule: ModuleConfig = {
  id: "settings",
  name: "Hệ thống",
  icon: <Settings className="w-4 h-4" />,
  enabled: true,
  showInSidebar: true,
  order: 100,
  routes: [
    {
      path: "/system/settings",
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
      label: "navigation.settings",
      icon: <Settings className="w-5 h-5" />,
      path: "/system/settings",
      order: 100,
    } as any,
  ],
};

export default SettingsModule;