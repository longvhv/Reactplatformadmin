import { ModuleDefinition } from "../../core/ModuleRegistry";
import { lazy, Suspense } from "react";
import { LoadingFallback } from "../../components/LoadingFallback";
import { Shield } from "lucide-react";

/**
 * Lazy load Roles pages
 */
const RolesPage = lazy(() => import("../../pages/RolesPage"));
const RoleDetailPage = lazy(() => import("../../pages/RoleDetailPage"));
const AddRolePage = lazy(() => import("../../pages/AddRolePage"));
const EditRolePage = lazy(() => import("../../pages/EditRolePage"));

/**
 * Roles Module
 */
export const RolesModule: ModuleDefinition = {
  id: "roles",
  name: "Roles",
  description: "Quản lý vai trò và quyền hạn",
  icon: <Shield className="w-4 h-4" />,
  enabled: true,
  showInSidebar: true,
  routes: [
    {
      path: "/core/roles",
      element: (
        <Suspense fallback={<LoadingFallback message="Đang tải Vai trò..." />}>
          <RolesPage />
        </Suspense>
      ),
      title: "Roles",
    },
    {
      path: "/core/roles/new",
      element: (
        <Suspense fallback={<LoadingFallback message="Đang tải..." />}>
          <AddRolePage />
        </Suspense>
      ),
      title: "Add Role",
    },
    {
      path: "/core/roles/:id",
      element: (
        <Suspense fallback={<LoadingFallback message="Đang tải chi tiết..." />}>
          <RoleDetailPage />
        </Suspense>
      ),
      title: "Role Detail",
    },
    {
      path: "/core/roles/edit/:id",
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
      path: "/core/roles",
    },
  ],
};