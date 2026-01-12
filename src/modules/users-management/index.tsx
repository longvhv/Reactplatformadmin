import { ModuleDefinition } from "../../core/ModuleRegistry";
import { Users } from "lucide-react";
import UsersPage from "../../app/(dashboard)/users/page";

/**
 * Users Management Module
 * 
 * Module for user administration and management
 */
export const UsersManagementModule: ModuleDefinition = {
  id: "users-management",
  name: "Users",
  description: "Quản lý người dùng",
  icon: <Users className="w-4 h-4" />,
  enabled: true,
  showInSidebar: true,
  routes: [
    {
      path: "/users",
      element: <UsersPage />,
      title: "Users",
    },
  ],
  menuItems: [
    {
      id: "users",
      label: "navigation.users",
      icon: <Users className="w-5 h-5" />,
      path: "/users",
    },
  ],
};