/**
 * Service Packages Module
 * Service Package Management with Features & Limits Configuration
 */

import { lazy, Suspense } from 'react';
import { ModuleDefinition } from '../../core/ModuleRegistry';
import { Package2 } from 'lucide-react';

// Lazy-loaded pages
const ServicePackagesPage = lazy(() => import('../../pages/ServicePackagesPage').then(m => ({ default: m.ServicePackagesPage })));
const AddServicePackagePage = lazy(() => import('../../pages/AddServicePackagePage').then(m => ({ default: m.AddServicePackagePage })));
const EditServicePackagePage = lazy(() => import('../../pages/EditServicePackagePage').then(m => ({ default: m.EditServicePackagePage })));

// Loading fallback
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
  </div>
);

/**
 * Service Packages Module Definition
 * Note: menuItems label and routes title use translation keys that will be resolved at runtime
 */
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
      path: "/core/service-packages",
      icon: <Package2 className="w-5 h-5" />,
      order: 45,
    },
  ],

  routes: [
    {
      path: "/core/service-packages",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <ServicePackagesPage />
        </Suspense>
      ),
      title: "servicePackages.title", // Translation key
    },
    {
      path: "/core/service-packages/add",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <AddServicePackagePage />
        </Suspense>
      ),
      title: "servicePackages.add", // Translation key
    },
    {
      path: "/core/service-packages/edit/:id",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <EditServicePackagePage />
        </Suspense>
      ),
      title: "servicePackages.edit", // Translation key
    },
  ],

  initialize: async () => {
    console.log('✅ Service Packages module initialized');
  },

  cleanup: async () => {
    console.log('🧹 Service Packages module cleaned up');
  },
};