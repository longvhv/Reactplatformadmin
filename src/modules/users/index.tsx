/**
 * Users Module
 * Module definition for user management
 * 
 * 🌐 Path: /platform/users
 */

import { ModuleDefinition } from "../../core/ModuleRegistry";
import { lazy, Suspense } from "react";
import { LoadingFallback } from "../../components/LoadingFallback";
import { Users } from "lucide-react";

// Lazy-loaded pages
const UsersPage = lazy(() => import("../../app/(admin)/platform/users/page"));
const CreateUserPage = lazy(() => import("../../app/(admin)/platform/users/create/page"));
const EditUserPage = lazy(() => import("../../app/(admin)/platform/users/edit/[id]/page"));

export const UsersModule: ModuleDefinition = {
  id: "users",
  name: "Users",
  description: "Quản lý người dùng hệ thống",
  version: "1.0.0",
  enabled: true,
  showInSidebar: true,
  order: 13, // Before Roles (14)
  icon: <Users className="w-4 h-4" />,
  
  routes: [
    {
      path: "/platform/users",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <UsersPage />
        </Suspense>
      ),
      title: "Users",
    },
    {
      path: "/platform/users/create",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <CreateUserPage />
        </Suspense>
      ),
      title: "Create User",
    },
    {
      path: "/platform/users/edit/:id",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <EditUserPage />
        </Suspense>
      ),
      title: "Edit User",
    },
    // Keep backward compatibility route /admin/users -> redirect logic should handle this, 
    // but here we define platform routes.
  ],
  
  menuItems: [
    {
      id: "users",
      label: "navigation.users",
      icon: <Users className="w-5 h-5" />,
      path: "/platform/users",
      order: 1,
    },
  ],
};

export default UsersModule;