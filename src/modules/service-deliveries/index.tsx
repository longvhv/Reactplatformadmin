/**
 * Service Deliveries Module Definition
 * Note: menuItems label and routes title use translation keys that will be resolved at runtime
 * 
 * 🌐 Path: /commerce/service-deliveries
 */

import { ModuleDefinition } from '../../core/ModuleRegistry';
import { lazy, Suspense } from 'react';
import { LoadingFallback } from '../../components/LoadingFallback';
import { Truck } from 'lucide-react';

const ServiceDeliveriesPage = lazy(() => 
  import('../../app/(admin)/platform/service-deliveries/page').then(m => ({ default: m.default }))
);
const ServiceDeliveryDetailPage = lazy(() => 
  import('../../app/(admin)/platform/service-deliveries/[id]/page').then(m => ({ default: m.default }))
);
const AddServiceDeliveryPage = lazy(() => 
  import('../../app/(admin)/platform/service-deliveries/create/page').then(m => ({ default: m.default }))
);
const EditServiceDeliveryPage = lazy(() => 
  import('../../app/(admin)/platform/service-deliveries/edit/[id]/page').then(m => ({ default: m.default }))
);

export const ServiceDeliveriesModule: ModuleDefinition = {
  id: "service-deliveries",
  name: "Service Deliveries",
  version: "1.0.0",
  enabled: true,
  showInSidebar: true,
  order: 46,
  
  menuItems: [
    {
      id: "service-deliveries",
      label: "navigation.serviceDeliveries",
      path: "/commerce/service-deliveries",
      icon: <Truck className="w-5 h-5" />,
      order: 46,
    },
  ],

  routes: [
    {
      path: "/commerce/service-deliveries",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <ServiceDeliveriesPage />
        </Suspense>
      ),
      title: "navigation.serviceDeliveries",
    },
    {
      path: "/commerce/service-deliveries/add",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <AddServiceDeliveryPage />
        </Suspense>
      ),
      title: "Add Service Delivery",
    },
    {
      path: "/commerce/service-deliveries/edit/:id",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <EditServiceDeliveryPage />
        </Suspense>
      ),
      title: "Edit Service Delivery",
    },
    {
      path: "/commerce/service-deliveries/:id",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <ServiceDeliveryDetailPage />
        </Suspense>
      ),
      title: "Service Delivery Detail",
    },
  ],

  initialize: async () => {
    console.log('✅ Service Deliveries module initialized');
  },

  cleanup: async () => {
    console.log('🧹 Service Deliveries module cleaned up');
  },
};

export default ServiceDeliveriesModule;