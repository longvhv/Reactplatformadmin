/**
 * User Roles Module
 * Quản lý phân quyền người dùng
 */

import { UserCog } from 'lucide-react';
import type { Module } from '../../core/ModuleRegistry';
import UserRolesPage from '../../pages/UserRolesPage';

export const UserRolesModule: Module = {
  id: 'user-roles',
  name: 'Phân quyền',
  description: 'Quản lý phân quyền người dùng',
  icon: UserCog,
  path: '/core/user-roles',
  element: <UserRolesPage />,
  
  // Routes array (required)
  routes: [
    {
      path: '/core/user-roles',
      element: <UserRolesPage />,
    },
  ],
  
  // Routes
  routes: [],
  
  // Sidebar config
  sidebar: {
    label: 'Phân quyền',
    icon: UserCog,
    position: 60, // After Users, before Help
    category: 'Quản lý',
  },
  
  // Permissions
  requiredPermissions: ['user_roles.view'],
  
  // Feature flags
  enabled: true,
};