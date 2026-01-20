/**
 * User Delegations Module
 * Module quản lý ủy quyền giữa users
 */

import { Suspense, lazy } from 'react';
import { UserCog } from 'lucide-react';
import type { ModuleDefinition } from '../../core/ModuleRegistry';
import { LoadingFallback } from '../../components/LoadingFallback';

// Lazy load pages - Import from bridge files (no .catch() pattern!)
// ✅ MIGRATED: Import from /app/(admin)/ for single source of truth
const UserDelegationsPage = lazy(() => 
  import('../../app/(admin)/platform/user-delegations/page')
);
const AddUserDelegationPage = lazy(() => 
  import('../../app/(admin)/platform/user-delegations/create/page')
);

export const UserDelegationsModule: ModuleDefinition = {
  id: 'user-delegations',
  name: 'navigation.userDelegations',
  description: 'Quản lý ủy quyền giữa các users',
  icon: <UserCog className="w-4 h-4" />,
  version: '1.0.0',
  enabled: true,
  showInSidebar: true,
  routes: [
    {
      path: '/admin/user-delegations/create',
      element: (
        <Suspense fallback={<LoadingFallback message="Đang tải..." />}>
          <AddUserDelegationPage />
        </Suspense>
      ),
      title: 'Thêm Ủy Quyền',
    },
    {
      path: '/admin/user-delegations',
      element: (
        <Suspense fallback={<LoadingFallback message="Đang tải..." />}>
          <UserDelegationsPage />
        </Suspense>
      ),
      title: 'User Delegations',
    },
  ],
  menuItems: [
    {
      id: 'user-delegations',
      label: 'navigation.userDelegations',
      path: '/admin/user-delegations',
      icon: <UserCog className="w-4 h-4" />,
      order: 95,
      description: 'Quản lý ủy quyền giữa các users',
    },
  ],
};

export default UserDelegationsModule;