/**
 * Roles Module
 * Module definition for roles management
 * 
 * 🌐 Path: /platform/roles
 */

import { ModuleDefinition } from "../../core/ModuleRegistry";
import { lazy, Suspense } from "react";
import { LoadingFallback } from "../../components/LoadingFallback";
import { Shield } from "lucide-react";

// Lazy-loaded pages (App Router)
const RolesPage = lazy(() => import("../../app/(admin)/platform/roles/page"));
const AddRolePage = lazy(() => import("../../app/(admin)/platform/roles/create/page"));
const EditRolePage = lazy(() => import("../../app/(admin)/platform/roles/edit/[id]/page"));
const RoleDetailPage = lazy(() => import("../../app/(admin)/platform/roles/[id]/page"));

export const RolesModule: ModuleDefinition = {
  id: "roles",
  name: "Roles",
  description: "Quản lý vai trò và phân quyền",
  version: "1.0.0",
  enabled: true,
  showInSidebar: true,
  order: 14,
  icon: <Shield className="w-4 h-4" />,
  
  routes: [
    {
      path: "/platform/roles",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <RolesPage />
        </Suspense>
      ),
      title: "Roles",
    },
    {
      path: "/platform/roles/create",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <AddRolePage />
        </Suspense>
      ),
      title: "Create Role",
    },
    {
      path: "/platform/roles/edit/:id",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <EditRolePage />
        </Suspense>
      ),
      title: "Edit Role",
    },
    {
      path: "/platform/roles/:id",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <RoleDetailPage />
        </Suspense>
      ),
      title: "Role Detail",
    },
  ],
  
  menuItems: [
    {
      id: "roles",
      label: "navigation.roles",
      icon: <Shield className="w-5 h-5" />,
      path: "/platform/roles",
      order: 1,
    },
  ],
};

export default RolesModule;