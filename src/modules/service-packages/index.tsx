/**
 * Service Packages Module
 * Service Package Management with Features & Limits Configuration
 */

import { lazy, Suspense } from 'react';
import { ModuleDefinition } from '../../core/ModuleRegistry';
import { LoadingFallback } from '../../components/LoadingFallback';
import { Package2 } from 'lucide-react';

// Lazy-loaded pages
const ServicePackagesPage = lazy(() => import('../../pages/ServicePackagesPage'));
// Note: AddServicePackagePage and EditServicePackagePage moved to App.tsx
// to fix routing precedence issue (must come before /:id route)

// Note: ServicePackageDetailPage is full-screen (defined in App.tsx)

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