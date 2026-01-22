/**
 * Service Packages Module Definition
 * Note: menuItems label and routes title use translation keys that will be resolved at runtime
 * 
 * 🌐 Path: /commerce/service-packages
 */

import { ModuleDefinition } from '../../core/ModuleRegistry';
import { lazy, Suspense } from 'react';
import { LoadingFallback } from '../../components/LoadingFallback';
import { Package2 } from 'lucide-react';

const ServicePackagesPage = lazy(() => import('../../app/(admin)/service-packages/page').then(module => ({ default: module.default })));

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
      path: "/commerce/service-packages",
      icon: <Package2 className="w-5 h-5" />,
      order: 45,
    },
  ],

  routes: [
    {
      path: "/commerce/service-packages",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <ServicePackagesPage />
        </Suspense>
      ),
      title: "servicePackages.title", // Translation key
    },
    // Note: /add and /edit/:id routes moved to App.tsx
    // to ensure correct routing precedence (must come before /:id)
  ],

  initialize: async () => {
    console.log('✅ Service Packages module initialized');
  },

  cleanup: async () => {
    console.log('🧹 Service Packages module cleaned up');
  },
};

export default ServicePackagesModule;