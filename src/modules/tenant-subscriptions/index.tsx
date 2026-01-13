/**
 * Tenant Subscriptions Module
 * Subscription Management with full CRUD operations
 */

import { lazy, Suspense } from 'react';
import { ModuleDefinition } from '../../core/ModuleRegistry';
import { CreditCard } from 'lucide-react';

// Lazy-loaded pages
const TenantSubscriptionsPage = lazy(() => import('../../pages/TenantSubscriptionsPage').then(m => ({ default: m.TenantSubscriptionsPage })));
const SubscriptionDetailPage = lazy(() => import('../../pages/SubscriptionDetailPage').then(m => ({ default: m.SubscriptionDetailPage })));
const AddSubscriptionPage = lazy(() => import('../../pages/AddSubscriptionPage').then(m => ({ default: m.AddSubscriptionPage })));
const EditSubscriptionPage = lazy(() => import('../../pages/EditSubscriptionPage').then(m => ({ default: m.EditSubscriptionPage })));

// Loading fallback
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
  </div>
);

/**
 * Tenant Subscriptions Module Definition
 * Translation keys are resolved at runtime
 */
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
      path: "/core/tenant-subscriptions",
      icon: <CreditCard className="w-5 h-5" />,
      order: 47,
    },
  ],

  routes: [
    {
      path: "/core/tenant-subscriptions",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <TenantSubscriptionsPage />
        </Suspense>
      ),
      title: "subscriptions.title", // Translation key
    },
    {
      path: "/core/tenant-subscriptions/:id",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <SubscriptionDetailPage />
        </Suspense>
      ),
      title: "subscriptions.viewSubscription", // Translation key
    },
    {
      path: "/core/tenant-subscriptions/add",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <AddSubscriptionPage />
        </Suspense>
      ),
      title: "subscriptions.addSubscription", // Translation key
    },
    {
      path: "/core/tenant-subscriptions/edit/:id",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <EditSubscriptionPage />
        </Suspense>
      ),
      title: "subscriptions.editSubscription", // Translation key
    },
  ],

  initialize: async () => {
    console.log('✅ Tenant Subscriptions module initialized');
  },

  cleanup: async () => {
    console.log('🧹 Tenant Subscriptions module cleaned up');
  },
};