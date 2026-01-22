/**
 * Service Packages Module Definition
 * Note: menuItems label and routes title use translation keys that will be resolved at runtime
 * 
 * 🌐 Path: /platform/service-packages
 */

import { ModuleDefinition } from '../../core/ModuleRegistry';
import { lazy, Suspense } from 'react';
import { LoadingFallback } from '../../components/LoadingFallback';
import { Package2 } from 'lucide-react';

const ServicePackagesPage = lazy(() => import('../../app/(admin)/platform/service-packages/page').then(module => ({ default: module.default })));
const AddServicePackagePage = lazy(() => import('../../app/(admin)/platform/service-packages/create/page').then(module => ({ default: module.default })));
const EditServicePackagePage = lazy(() => import('../../app/(admin)/platform/service-packages/edit/[id]/page').then(module => ({ default: module.default })));
const ServicePackageDetailPage = lazy(() => import('../../app/(admin)/platform/service-packages/[id]/page').then(module => ({ default: module.default })));

export const ServicePackagesModule: ModuleDefinition = {
  id: "service-packages",
  name: "Service Packages",
  version: "1.0.0",
  enabled: true,
  showInSidebar: true,
  order: 45,
  
  menuItems: [
    {
      id: "service-packages",
      label: "servicePackages.title", // Translation key
      path: "/platform/service-packages",
      icon: <Package2 className="w-5 h-5" />,
      order: 45,
    },
  ],

  routes: [
    {
      path: "/platform/service-packages",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <ServicePackagesPage />
        </Suspense>
      ),
      title: "servicePackages.title", // Translation key
    },
    {
      path: "/platform/service-packages/create",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <AddServicePackagePage />
        </Suspense>
      ),
      title: "Add Service Package",
    },
    {
      path: "/platform/service-packages/edit/:id",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <EditServicePackagePage />
        </Suspense>
      ),
      title: "Edit Service Package",
    },
    {
      path: "/platform/service-packages/:id",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <ServicePackageDetailPage />
        </Suspense>
      ),
      title: "Service Package Details",
    },
  ],

  initialize: async () => {
    console.log('✅ Service Packages module initialized');
  },

  cleanup: async () => {
    console.log('🧹 Service Packages module cleaned up');
  },
};

export default ServicePackagesModule;