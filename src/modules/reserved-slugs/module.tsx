/**
 * Reserved Slugs Module Definition
 * Manage system-wide reserved slugs/keywords
 */

import { Suspense, lazy } from 'react';
import { Shield } from 'lucide-react';
import type { ModuleDefinition } from '../../core/ModuleRegistry';
import { LoadingFallback } from '../../components/LoadingFallback';

const ReservedSlugsPage = lazy(() => import('../../pages/ReservedSlugsPage'));
const AddReservedSlugPage = lazy(() => import('../../pages/AddReservedSlugPage'));
const EditReservedSlugPage = lazy(() => import('../../pages/EditReservedSlugPage'));
const ReservedSlugDetailPage = lazy(() => import('../../pages/ReservedSlugDetailPage'));

export const ReservedSlugsModule: ModuleDefinition = {
  id: 'reserved-slugs',
  name: 'navigation.reservedSlugs',
  description: 'Manage system-wide reserved slugs and keywords',
  icon: <Shield className="w-4 h-4" />,
  version: '1.0.0',
  category: 'system',
  enabled: true,
  showInSidebar: true,
  order: 54, // NỀN TẢNG & CẤU HÌNH group
  routes: [
    {
      path: '/core/reserved-slugs',
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <ReservedSlugsPage />
        </Suspense>
      ),
      title: 'Reserved Slugs',
    },
    {
      path: '/core/reserved-slugs/add',
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <AddReservedSlugPage />
        </Suspense>
      ),
      title: 'Thêm Từ Khóa Dành Riêng',
    },
    {
      path: '/core/reserved-slugs/edit/:id',
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <EditReservedSlugPage />
        </Suspense>
      ),
      title: 'Chỉnh Sửa Từ Khóa Dành Riêng',
    },
    {
      path: '/core/reserved-slugs/:id',
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <ReservedSlugDetailPage />
        </Suspense>
      ),
      title: 'Chi Tiết Từ Khóa Dành Riêng',
    },
  ],
  menuItems: [
    {
      id: 'reserved-slugs',
      label: 'navigation.reservedSlugs',
      path: '/core/reserved-slugs',
      icon: <Shield className="w-4 h-4" />,
      category: 'system',
      description: 'Manage reserved slugs',
    },
  ],
};

export default ReservedSlugsModule;