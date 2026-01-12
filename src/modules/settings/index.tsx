import { ModuleConfig } from "../../core/ModuleRegistry";
import { lazy, Suspense } from "react";
import { LoadingFallback } from "../../components/LoadingFallback";
import { Settings, Globe, Shield, Bell, Database, Sliders } from "lucide-react";

/**
 * Lazy load Settings page component
 */
const SettingsPage = lazy(() => 
  import("./SettingsPage").then(module => ({ default: module.SettingsPage }))
);

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
  showInSidebar: true, // Show menu items in sidebar
  routes: [
    {
      path: "/settings",
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
      path: "/settings",
    },
  ],
};