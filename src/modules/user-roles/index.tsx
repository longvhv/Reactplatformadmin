/**
 * User Roles Module
 * Module definition for user role assignment management
 * 
 * 🌐 Path: /platform/user-roles
 */

import { ModuleDefinition } from "../../core/ModuleRegistry";
import { lazy, Suspense } from "react";
import { LoadingFallback } from "../../components/LoadingFallback";
import { Users } from "lucide-react";

// Lazy-loaded pages
const UserRolesPage = lazy(() => import("../../app/(admin)/platform/user-roles/page"));
const CreateUserRolePage = lazy(() => import("../../app/(admin)/platform/user-roles/create/page"));
const EditUserRolePage = lazy(() => import("../../app/(admin)/platform/user-roles/edit/[id]/page"));

export const UserRolesModule: ModuleDefinition = {
  id: "user-roles",
  name: "User Roles",
  description: "Manage user role assignments and scopes",
  version: "1.0.0",
  enabled: true,
  showInSidebar: true,
  order: 60, // Security / Access Control group
  icon: <Users className="w-4 h-4" />,
  
  routes: [
    {
      path: "/platform/user-roles",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <UserRolesPage />
        </Suspense>
      ),
      title: "User Roles",
    },
    {
      path: "/platform/user-roles/create",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <CreateUserRolePage />
        </Suspense>
      ),
      title: "Assign Role",
    },
    {
      path: "/platform/user-roles/edit/:id",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <EditUserRolePage />
        </Suspense>
      ),
      title: "Edit Role Assignment",
    },
  ],
  
  menuItems: [
    {
      id: "user-roles",
      label: "User Roles",
      icon: <Users className="w-5 h-5" />,
      path: "/platform/user-roles",
      order: 1,
    },
  ],
};

export default UserRolesModule;