import { ModuleDefinition } from "../../core/ModuleRegistry";
import { lazy, Suspense } from "react";
import { LoadingFallback } from "../../components/LoadingFallback";
import { Building2, Plus, Edit, Eye } from "lucide-react";

/**
 * Lazy-load Tenants Pages
 * ✅ MIGRATED: Import from /app/(admin)/ for single source of truth
 */
const TenantsPage = lazy(() => 
  import("../../app/(admin)/admin/tenants/page")
);

const TenantDetailPage = lazy(() => 
  import("../../app/(admin)/admin/tenants/[id]/page")
);

const AddTenantPage = lazy(() => 
  import("../../app/(admin)/admin/tenants/create/page")
);

const EditTenantPage = lazy(() => 
  import("../../app/(admin)/admin/tenants/edit/[id]/page")
);

/**
 * Tenants Module
 * 
 * 🌐 Path: /admin/tenants
 */
export const TenantsModule: ModuleDefinition = {
  id: "tenants",
  name: "Tenants",
  description: "Quản lý tenants và tổ chức",
  icon: <Building2 className="w-4 h-4" />,
  enabled: true,
  showInSidebar: true,
  order: 10, // QUẢN TRỊ & TRUY CẬP group
  routes: [
    {
      path: "/admin/tenants",
      element: (
        <Suspense fallback={<LoadingFallback message="Đang tải Tenants..." />}>
          <TenantsPage />
        </Suspense>
      ),
      title: "Tenants",
    },
    {
      path: "/admin/tenants/create",
      element: (
        <Suspense fallback={<LoadingFallback message="Đang tải..." />}>
          <AddTenantPage />
        </Suspense>
      ),
      title: "Add Tenant",
    },
    {
      path: "/admin/tenants/:id/edit",
      element: (
        <Suspense fallback={<LoadingFallback message="Đang tải..." />}>
          <EditTenantPage />
        </Suspense>
      ),
      title: "Edit Tenant",
    },
    {
      path: "/admin/tenants/:id",
      element: (
        <Suspense fallback={<LoadingFallback message="Đang tải..." />}>
          <TenantDetailPage />
        </Suspense>
      ),
      title: "Tenant Detail",
    },
  ],
  menuItems: [
    {
      id: "tenants",
      label: "navigation.tenants",
      icon: <Building2 className="w-5 h-5" />,
      path: "/admin/tenants",
    },
  ],
};