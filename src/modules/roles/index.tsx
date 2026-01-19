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