/**
 * Digital Assets Module
 * Manages digital assets like domains, SSL certificates, license keys
 */

import { lazy, Suspense } from 'react';
import { ModuleDefinition } from '../../core/ModuleRegistry';
import { LoadingFallback } from '../../components/LoadingFallback';
import { Shield } from 'lucide-react';

// Lazy-loaded pages
const DigitalAssetsPage = lazy(() => import('../../pages/DigitalAssetsPage'));
const AddDigitalAssetPage = lazy(() => import('../../pages/AddDigitalAssetPage'));
const EditDigitalAssetPage = lazy(() => import('../../pages/EditDigitalAssetPage'));
const DigitalAssetDetailPage = lazy(() => import('../../pages/DigitalAssetDetailPage'));

/**
 * Digital Assets Module Definition
 */
export const DigitalAssetsModule: ModuleDefinition = {
  id: "digital-assets",
  name: "Digital Assets",
  version: "1.0.0",
  enabled: true,
  showInSidebar: true,
  order: 45,
  
  menuItems: [
    {
      id: "digital-assets",
      label: "Tài Sản Số",
      path: "/core/digital-assets",
      icon: <Shield className="w-5 h-5" />,
      order: 45,
    },
  ],

  routes: [
    {
      path: "/core/digital-assets",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <DigitalAssetsPage />
        </Suspense>
      ),
      title: "Tài Sản Số",
    },
    {
      path: "/core/digital-assets/add",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <AddDigitalAssetPage />
        </Suspense>
      ),
      title: "Thêm Tài Sản Số",
    },
    {
      path: "/core/digital-assets/edit/:id",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <EditDigitalAssetPage />
        </Suspense>
      ),
      title: "Chỉnh Sửa Tài Sản Số",
    },
    {
      path: "/core/digital-assets/:id",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <DigitalAssetDetailPage />
        </Suspense>
      ),
      title: "Chi Tiết Tài Sản Số",
    },
  ],

  initialize: async () => {
    console.log('✅ Digital Assets module initialized');
  },

  cleanup: async () => {
    console.log('🧹 Digital Assets module cleaned up');
  },
};