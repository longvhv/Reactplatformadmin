/**
 * User Roles Module
 * Quản lý phân quyền người dùng
 * 
 * 🌐 Path: /admin/user-roles
 */

import { UserCog } from 'lucide-react';
import type { ModuleDefinition } from '../../core/ModuleRegistry';
import UserRolesPage from '../../pages/UserRolesPage';

export const UserRolesModule: ModuleDefinition = {
  id: 'user-roles',
  name: 'Phân quyền',
  description: 'Quản lý phân quyền người dùng',
  icon: <UserCog className="w-4 h-4" />,
  showInSidebar: false,
  order: 60,
  
  // Routes array (required)
  routes: [
    {
      path: '/admin/user-roles',
      element: <UserRolesPage />,
    },
  ],
  
  enabled: true,
};