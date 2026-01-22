/**
 * Tenant Subscriptions Module Definition
 * Note: menuItems label and routes title use translation keys that will be resolved at runtime
 * 
 * 🌐 Path: /commerce/tenant-subscriptions
 */

import { ModuleDefinition } from '../../core/ModuleRegistry';
import { lazy, Suspense } from 'react';
import { LoadingFallback } from '../../components/LoadingFallback';
import { CreditCard } from 'lucide-react';

const TenantSubscriptionsPage = lazy(() => 
  import('../../app/(admin)/admin/tenants/subscriptions/page').then(m => ({ default: m.default }))
);

// Full-screen detail page (shows in App.tsx)
const SubscriptionDetailPageFullscreen = lazy(() => 
  import('../../app/(admin)/commerce/subscriptions/[id]/page').then(m => ({ default: m.default }))
);

export const TenantSubscriptionsModule: ModuleDefinition = {
  id: "tenant-subscriptions",
  name: "Tenant Subscriptions",
  version: "1.0.0",
  enabled: true,
  showInSidebar: true,
  order: 47,
  
  menuItems: [
    {
      id: "tenant-subscriptions",
      label: "subscriptions.title", // Translation key
      path: "/commerce/tenant-subscriptions",
      icon: <CreditCard className="w-5 h-5" />,
      order: 47,
    },
  ],

  routes: [
    {
      path: "/commerce/tenant-subscriptions",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <TenantSubscriptionsPage />
        </Suspense>
      ),
      title: "subscriptions.title", // Translation key
    },
    {
      path: "/commerce/tenant-subscriptions/:id",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <SubscriptionDetailPageFullscreen />
        </Suspense>
      ),
      title: "subscriptions.detail",
    },
  ],

  initialize: async () => {
    console.log('✅ Tenant Subscriptions module initialized');
  },

  cleanup: async () => {
    console.log('🧹 Tenant Subscriptions module cleaned up');
  },
};

export default TenantSubscriptionsModule;