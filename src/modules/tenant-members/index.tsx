import { ModuleDefinition } from "../../core/ModuleRegistry";
import { lazy, Suspense } from "react";
import { LoadingFallback } from "../../components/LoadingFallback";
import { Users } from "lucide-react";

/**
 * Lazy load Tenant Members page
 */
const TenantMembersPage = lazy(() => 
  import("../../pages/TenantMembersPage").then(module => ({ default: module.TenantMembersPage }))
);

/**
 * Tenant Members Module
 * Manages user-tenant relationships (employee profiles)
 */
export const TenantMembersModule: ModuleDefinition = {
  id: "tenant-members",
  name: "Tenant Members",
  description: "Quản lý thành viên trong các tenant (hồ sơ nhân viên)",
  icon: <Users className="w-4 h-4" />,
  enabled: true,
  showInSidebar: false, // Hidden from sidebar - members shown in tenant/user details
  routes: [
    {
      path: "/core/tenant-members",
      element: (
        <Suspense fallback={<LoadingFallback message="Đang tải tenant members..." />}>
          <TenantMembersPage />
        </Suspense>
      ),
      title: "Tenant Members",
    },
  ],
  menuItems: [
    {
      id: "tenant-members",
      label: "navigation.tenantMembers",
      icon: <Users className="w-5 h-5" />,
      path: "/core/tenant-members",
    },
  ],
};