import { ModuleDefinition } from "../../core/ModuleRegistry";
import { lazy, Suspense } from "react";
import { LoadingFallback } from "../../components/LoadingFallback";
import { Building2, Plus, Edit, Eye } from "lucide-react";

/**
 * Lazy-load Tenant Pages
 */
const TenantsPage = lazy(() => 
  import("../../pages/TenantsPage")
);

const AddTenantPage = lazy(() => 
  import("../../pages/AddTenantPage")
);

const EditTenantPage = lazy(() => 
  import("../../pages/EditTenantPage")
);

// Note: TenantDetailPage is full-screen (defined in App.tsx, not in module registry)

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
      path: "/core/tenants",
      element: (
        <Suspense fallback={<LoadingFallback message="Đang tải Tenants..." />}>
          <TenantsPage />
        </Suspense>
      ),
      title: "Tenants",
    },
    {
      path: "/core/tenants/add",
      element: (
        <Suspense fallback={<LoadingFallback message="Đang tải..." />}>
          <AddTenantPage />
        </Suspense>
      ),
      title: "Add Tenant",
    },
    {
      path: "/core/tenants/edit/:id",
      element: (
        <Suspense fallback={<LoadingFallback message="Đang tải..." />}>
          <EditTenantPage />
        </Suspense>
      ),
      title: "Edit Tenant",
    },
  ],
  menuItems: [
    {
      id: "tenants",
      label: "navigation.tenants",
      icon: <Building2 className="w-5 h-5" />,
      path: "/core/tenants",
    },
  ],
};