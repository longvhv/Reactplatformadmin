/**
 * Subscription Orders Module
 * Subscription Order Management
 */

import { lazy, Suspense } from 'react';
import { ModuleDefinition } from '../../core/ModuleRegistry';
import { ShoppingCart } from 'lucide-react';

// Lazy-loaded pages
const SubscriptionOrdersPage = lazy(() => import('../../pages/SubscriptionOrdersPage').then(m => ({ default: m.SubscriptionOrdersPage })));
const OrderDetailPage = lazy(() => import('../../pages/OrderDetailPage').then(m => ({ default: m.OrderDetailPage })));
const AddOrderPage = lazy(() => import('../../pages/AddOrderPage').then(m => ({ default: m.AddOrderPage })));
const EditOrderPage = lazy(() => import('../../pages/EditOrderPage').then(m => ({ default: m.EditOrderPage })));

// Loading fallback
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
  </div>
);

/**
 * Subscription Orders Module Definition
 * Note: menuItems label and routes title use translation keys that will be resolved at runtime
 */
export const SubscriptionOrdersModule: ModuleDefinition = {
  id: "subscription-orders",
  name: "Subscription Orders",
  version: "1.0.0",
  enabled: true,
  showInSidebar: true,
  order: 45,
  
  menuItems: [
    {
      id: "subscription-orders",
      label: "subscriptionOrders.title", // Translation key
      path: "/core/subscription-orders",
      icon: <ShoppingCart className="w-5 h-5" />,
      order: 45,
    },
  ],

  routes: [
    {
      path: "/core/subscription-orders",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <SubscriptionOrdersPage />
        </Suspense>
      ),
      title: "subscriptionOrders.title", // Translation key
    },
    {
      path: "/core/subscription-orders/:id",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <OrderDetailPage />
        </Suspense>
      ),
      title: "subscriptionOrders.viewDetails", // Translation key
    },
    {
      path: "/core/subscription-orders/add",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <AddOrderPage />
        </Suspense>
      ),
      title: "subscriptionOrders.addOrder", // Translation key
    },
    {
      path: "/core/subscription-orders/edit/:id",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <EditOrderPage />
        </Suspense>
      ),
      title: "subscriptionOrders.edit", // Translation key
    },
  ],

  initialize: async () => {
    console.log('✅ Subscription Orders module initialized');
  },

  cleanup: async () => {
    console.log('🧹 Subscription Orders module cleaned up');
  },
};
