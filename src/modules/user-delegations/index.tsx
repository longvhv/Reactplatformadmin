/**
 * User Delegations Module
 * Module quản lý ủy quyền giữa users
 */

import { Suspense, lazy } from 'react';
import { UserCog } from 'lucide-react';
import type { ModuleDefinition } from '../../core/ModuleRegistry';
import { LoadingFallback } from '../../components/LoadingFallback';

// Lazy load pages (will create later)
const UserDelegationsPage = lazy(() => import('../../pages/UserDelegationsPage').catch(() => ({
  default: () => (
    <div className="p-8 text-center">
      <UserCog className="w-16 h-16 mx-auto mb-4 text-gray-400" />
      <h2 className="text-2xl font-bold mb-2">Ủy quyền</h2>
      <p className="text-gray-600">Tính năng quản lý ủy quyền giữa các users đang được phát triển</p>
    </div>
  )
})));

const AddUserDelegationPage = lazy(() => import('../../pages/AddUserDelegationPage'));

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