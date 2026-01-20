import { ModuleDefinition } from "../../core/ModuleRegistry";
import { lazy, Suspense } from "react";
import { LoadingFallback } from "../../components/LoadingFallback";
import { Shield } from "lucide-react";

/**
 * Lazy-load Roles Pages
 * ✅ MIGRATED: Import from /app/(admin)/ for single source of truth
 */
const RolesPage = lazy(() => 
  import("../../app/(admin)/admin/roles/page")
);

const RoleDetailPage = lazy(() => 
  import("../../app/(admin)/admin/roles/[id]/page")
);

const AddRolePage = lazy(() => 
  import("../../app/(admin)/admin/roles/create/page")
);

const EditRolePage = lazy(() => 
  import("../../app/(admin)/admin/roles/edit/[id]/page")
);

/**
 * Roles Module
 * 
 * 🌐 Path: /admin/roles
 */
export const RolesModule: ModuleDefinition = {
  id: "roles",
  name: "Roles",
  description: "Quản lý vai trò và quyền hạn",
  icon: <Shield className="w-4 h-4" />,
  enabled: true,
  showInSidebar: true,
  order: 14, // QUẢN TRỊ & TRUY CẬP group
  routes: [
    {
      path: "/admin/roles",
      element: (
        <Suspense fallback={<LoadingFallback message="Đang tải Vai trò..." />}>
          <RolesPage />
        </Suspense>
      ),
      title: "Roles",
    },
    {
      path: "/admin/roles/create",
      element: (
        <Suspense fallback={<LoadingFallback message="Đang tải..." />}>
          <AddRolePage />
        </Suspense>
      ),
      title: "Add Role",
    },
    {
      path: "/admin/roles/:id",
      element: (
        <Suspense fallback={<LoadingFallback message="Đang tải chi tiết..." />}>
          <RoleDetailPage />
        </Suspense>
      ),
      title: "Role Detail",
    },
    {
      path: "/admin/roles/:id/edit",
      element: (
        <Suspense fallback={<LoadingFallback message="Đang tải..." />}>
          <EditRolePage />
        </Suspense>
      ),
      title: "Edit Role",
    },
  ],
  menuItems: [
    {
      id: "roles",
      label: "navigation.roles",
      icon: <Shield className="w-5 h-5" />,
      path: "/admin/roles",
    },
  ],
};