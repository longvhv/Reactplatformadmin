/**
 * Digital Assets Module Definition
 * Note: menuItems label and routes title use translation keys that will be resolved at runtime
 * 
 * 🌐 Path: /commerce/digital-assets
 */

import { ModuleDefinition } from '../../core/ModuleRegistry';
import { lazy, Suspense } from 'react';
import { LoadingFallback } from '../../components/LoadingFallback';
import { Image } from 'lucide-react';

const DigitalAssetsPage = lazy(() => 
  import('../../app/(admin)/commerce/digital-assets/page').then(m => ({ default: m.default }))
);
const DigitalAssetDetailPage = lazy(() => 
  import('../../app/(admin)/commerce/digital-assets/[id]/page').then(m => ({ default: m.default }))
);
const AddTenantDigitalAssetPage = lazy(() => 
  import('../../app/(admin)/content/digital-assets/create/page').then(m => ({ default: m.default }))
);
const EditTenantDigitalAssetPage = lazy(() => 
  import('../../app/(admin)/content/digital-assets/edit/[id]/page').then(m => ({ default: m.default }))
);

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
      label: "navigation.digitalAssets",
      path: "/commerce/digital-assets",
      icon: <Image className="w-5 h-5" />,
      order: 45,
    },
  ],

  routes: [
    {
      path: "/commerce/digital-assets",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <DigitalAssetsPage />
        </Suspense>
      ),
      title: "navigation.digitalAssets",
    },
    {
      path: "/commerce/digital-assets/create",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <AddTenantDigitalAssetPage />
        </Suspense>
      ),
      title: "Add Digital Asset",
    },
    {
      path: "/commerce/digital-assets/edit/:id",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <EditTenantDigitalAssetPage />
        </Suspense>
      ),
      title: "Edit Digital Asset",
    },
    {
      path: "/commerce/digital-assets/:id",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <DigitalAssetDetailPage />
        </Suspense>
      ),
      title: "Digital Asset Detail",
    },
  ],

  initialize: async () => {
    console.log('✅ Digital Assets module initialized');
  },

  cleanup: async () => {
    console.log('🧹 Digital Assets module cleaned up');
  },
};

export default DigitalAssetsModule;