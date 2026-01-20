import { ModuleDefinition } from "../../core/ModuleRegistry";
import { Users } from "lucide-react";
import { lazy, Suspense } from "react";
import { LoadingFallback } from "../../components/LoadingFallback";

/**
 * Lazy-load Users Pages
 * ✅ MIGRATED: Import from /app/(admin)/ for single source of truth
 */
const UsersPage = lazy(() => 
  import("../../app/(admin)/admin/users/page")
);

const UserDetailPage = lazy(() => 
  import("../../app/(admin)/admin/users/[id]/page")
);

const AddUserPage = lazy(() => 
  import("../../app/(admin)/admin/users/create/page")
);

const EditUserPage = lazy(() => 
  import("../../app/(admin)/admin/users/edit/[id]/page")
);

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
    {
      path: "/admin/users/:id",
      element: (
        <Suspense fallback={<LoadingFallback message="Đang tải..." />}>
          <UserDetailPage />
        </Suspense>
      ),
      title: "User Detail",
    },
    {
      path: "/admin/users/edit/:id",
      element: (
        <Suspense fallback={<LoadingFallback message="Đang tải..." />}>
          <EditUserPage />
        </Suspense>
      ),
      title: "Edit User",
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