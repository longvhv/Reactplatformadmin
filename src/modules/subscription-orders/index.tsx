/**
 * Subscription Orders Module
 * Subscription Order Management
 */

import { lazy, Suspense } from 'react';
import { ModuleDefinition } from '../../core/ModuleRegistry';
import { LoadingFallback } from '../../components/LoadingFallback';
import { ShoppingCart } from 'lucide-react';

// Lazy-loaded pages
const SubscriptionOrdersPage = lazy(() => import('../../pages/SubscriptionOrdersPage'));
const OrderDetailPage = lazy(() => import('../../pages/OrderDetailPage'));
const AddOrderPage = lazy(() => import('../../pages/AddOrderPage'));
const EditOrderPage = lazy(() => import('../../pages/EditOrderPage'));

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
    {
      path: "/core/subscription-orders/:id",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <OrderDetailPage />
        </Suspense>
      ),
      title: "subscriptionOrders.viewDetails", // Translation key
    },
  ],

  initialize: async () => {
    console.log('✅ Subscription Orders module initialized');
  },

  cleanup: async () => {
    console.log('🧹 Subscription Orders module cleaned up');
  },
};