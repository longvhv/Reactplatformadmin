import { ModuleDefinition } from "../../core/ModuleRegistry";
import { lazy, Suspense } from "react";
import { LoadingFallback } from "../../components/LoadingFallback";
import { Shield } from "lucide-react";

/**
 * Lazy-load Permissions Page
 */
const PermissionsPage = lazy(() => 
  import("../../pages/PermissionsPage")
);

/**
 * Permissions Module
 * Quản lý phân quyền hệ thống theo cấu trúc cây phân cấp
 * 
 * 🌐 Path: /platform/permissions
 */
export const PermissionsModule: ModuleDefinition = {
  id: "permissions",
  name: "Phân quyền",
  description: "Quản lý permissions và authorization",
  icon: <Shield className="w-4 h-4" />,
  enabled: true,
  showInSidebar: true,
  order: 54, // NỀN TẢNG & CẤU HÌNH group (after location-types)
  routes: [
    {
      path: "/platform/permissions",
      element: (
        <Suspense fallback={<LoadingFallback message="Đang tải permissions..." />}>
          <PermissionsPage />
        </Suspense>
      ),
      title: "Permissions",
    },
  ],
  menuItems: [
    {
      id: "permissions",
      label: "navigation.permissions",
      icon: <Shield className="w-5 h-5" />,
      path: "/platform/permissions",
    },
  ],
};

export default PermissionsModule;