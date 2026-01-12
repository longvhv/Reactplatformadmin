import { ModuleDefinition } from "../../core/ModuleRegistry";
import { lazy, Suspense } from "react";
import { LoadingFallback } from "../../components/LoadingFallback";
import { Building2, Plus, Edit, Eye } from "lucide-react";

/**
 * Lazy load Tenant pages
 */
const TenantsPage = lazy(() => 
  import("../../pages/TenantsPage").then(module => ({ default: module.TenantsPage }))
);

const AddTenantPage = lazy(() => 
  import("../../pages/AddTenantPage").then(module => ({ default: module.AddTenantPage }))
);

const EditTenantPage = lazy(() => 
  import("../../pages/EditTenantPage").then(module => ({ default: module.EditTenantPage }))
);

const TenantDetailPage = lazy(() => 
  import("../../pages/TenantDetailPage").then(module => ({ default: module.TenantDetailPage }))
);

/**
 * Tenants Module
 */
export const TenantsModule: ModuleDefinition = {
  id: "tenants",
  name: "Tenants",
  description: "Quản lý tenants và tổ chức",
  icon: <Building2 className="w-4 h-4" />,
  enabled: true,
  showInSidebar: true,
  routes: [
    {
      path: "/tenants",
      element: (
        <Suspense fallback={<LoadingFallback message="Đang tải Tenants..." />}>
          <TenantsPage />
        </Suspense>
      ),
      title: "Tenants",
    },
    {
      path: "/tenants/add",
      element: (
        <Suspense fallback={<LoadingFallback message="Đang tải..." />}>
          <AddTenantPage />
        </Suspense>
      ),
      title: "Add Tenant",
    },
    {
      path: "/tenants/edit/:id",
      element: (
        <Suspense fallback={<LoadingFallback message="Đang tải..." />}>
          <EditTenantPage />
        </Suspense>
      ),
      title: "Edit Tenant",
    },
    {
      path: "/tenants/:id",
      element: (
        <Suspense fallback={<LoadingFallback message="Đang tải..." />}>
          <TenantDetailPage />
        </Suspense>
      ),
      title: "Tenant Details",
    },
  ],
  menuItems: [
    {
      id: "tenants",
      label: "navigation.tenants",
      icon: <Building2 className="w-5 h-5" />,
      path: "/tenants",
    },
  ],
};
