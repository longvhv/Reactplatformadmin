import { ModuleDefinition } from "../../core/ModuleRegistry";
import { Users } from "lucide-react";

/**
 * Users Module
 */
export const UsersModule: ModuleDefinition = {
  id: "users",
  name: "Quản lý người dùng",
  description: "Quản lý người dùng và phân quyền",
  icon: <Users className="w-4 h-4" />,
  enabled: true,
  showInSidebar: true,
  routes: [
    {
      path: "/users",
      element: <div className="p-6"><h1>Users Management (Coming Soon)</h1></div>,
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
