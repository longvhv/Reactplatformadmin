/**
 * Subscription Orders Module Definition
 * Note: menuItems label and routes title use translation keys that will be resolved at runtime
 * 
 * 🌐 Path: /commerce/subscription-orders
 */

import { ModuleDefinition } from '../../core/ModuleRegistry';
import { lazy, Suspense } from 'react';
import { LoadingFallback } from '../../components/LoadingFallback';
import { ShoppingCart } from 'lucide-react';

const SubscriptionOrdersPage = lazy(() => 
  import('../../app/(admin)/commerce/subscription-orders/page').then(m => ({ default: m.default }))
);
const SubscriptionOrderDetailPage = lazy(() => 
  import('../../app/(admin)/commerce/subscription-orders/[id]/page').then(m => ({ default: m.default }))
);
const AddOrderPage = lazy(() => 
  import('../../app/(admin)/commerce/subscription-orders/create/page').then(m => ({ default: m.default }))
);
const EditOrderPage = lazy(() => 
  import('../../app/(admin)/commerce/subscription-orders/edit/[id]/page').then(m => ({ default: m.default }))
);

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
      path: "/commerce/subscription-orders",
      icon: <ShoppingCart className="w-5 h-5" />,
      order: 45,
    },
  ],

  routes: [
    {
      path: "/commerce/subscription-orders",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <SubscriptionOrdersPage />
        </Suspense>
      ),
      title: "subscriptionOrders.title",
    },
    {
      path: "/commerce/subscription-orders/create",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <AddOrderPage />
        </Suspense>
      ),
      title: "Tạo đơn hàng",
    },
    {
      path: "/commerce/subscription-orders/edit/:id",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <EditOrderPage />
        </Suspense>
      ),
      title: "Chỉnh sửa đơn hàng",
    },
    {
      path: "/commerce/subscription-orders/:id",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <SubscriptionOrderDetailPage />
        </Suspense>
      ),
      title: "Chi tiết đơn hàng",
    },
  ],

  initialize: async () => {
    console.log('✅ Subscription Orders module initialized');
  },

  cleanup: async () => {
    console.log('🧹 Subscription Orders module cleaned up');
  },
};

export default SubscriptionOrdersModule;