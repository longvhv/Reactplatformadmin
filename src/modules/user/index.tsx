import { ModuleDefinition } from "../../core/ModuleRegistry";
import { Users } from "lucide-react";
import { lazy, Suspense } from "react";
import { LoadingFallback } from "../../components/LoadingFallback";

const UsersPage = lazy(() => import("../../pages/UsersPage"));
const AddUserPage = lazy(() => import("../../pages/AddUserPage"));

/**
 * Users Module
 * 
 * 🌐 Path: /admin/users
 */
export const UsersModule: ModuleDefinition = {
  id: "users",
  name: "Quản lý người dùng",
  description: "Quản lý người dùng và phân quyền",
  icon: <Users className="w-4 h-4" />,
  enabled: true,
  showInSidebar: true,
  order: 12, // QUẢN TRỊ & TRUY CẬP group
  routes: [
    {
      path: "/admin/users",
      element: (
        <Suspense fallback={<LoadingFallback message="Đang tải người dùng..." />}>
          <UsersPage />
        </Suspense>
      ),
      title: "Users",
    },
    {
      path: "/admin/users/create",
      element: (
        <Suspense fallback={<LoadingFallback message="Đang tải..." />}>
          <AddUserPage />
        </Suspense>
      ),
      title: "Add User",
    },
  ],
  menuItems: [
    {
      id: "users",
      label: "navigation.users",
      icon: <Users className="w-5 h-5" />,
      path: "/admin/users",
    },
  ],
};