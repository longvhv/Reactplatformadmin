/**
 * User Roles Module
 * Quản lý phân quyền người dùng
 * 
 * 🌐 Path: /admin/user-roles
 */

import { UserCog } from 'lucide-react';
import type { ModuleDefinition } from '../../core/ModuleRegistry';
import { lazy, Suspense } from 'react';
import { LoadingFallback } from '../../components/LoadingFallback';

// Lazy-loaded pages
// ✅ MIGRATED: Import from /app/(admin)/ for single source of truth
const UserRolesPage = lazy(() => import('../../app/(admin)/admin/roles/page'));

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
      element: (
        <Suspense fallback={<LoadingFallback message="Đang tải Phân quyền..." />}>
          <UserRolesPage />
        </Suspense>
      ),
    },
  ],
  
  enabled: true,
};