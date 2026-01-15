/**
 * Service Deliveries Module
 * Manages service deliveries like consulting hours, training sessions
 */

import { lazy, Suspense } from 'react';
import { ModuleDefinition } from '../../core/ModuleRegistry';
import { LoadingFallback } from '../../components/LoadingFallback';
import { Briefcase } from 'lucide-react';

// Lazy-loaded pages
const ServiceDeliveriesPage = lazy(() => import('../../pages/ServiceDeliveriesPage'));
const AddServiceDeliveryPage = lazy(() => import('../../pages/AddServiceDeliveryPage'));
const EditServiceDeliveryPage = lazy(() => import('../../pages/EditServiceDeliveryPage'));
const ServiceDeliveryDetailPage = lazy(() => import('../../pages/ServiceDeliveryDetailPage'));

/**
 * Service Deliveries Module Definition
 */
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
      label: "Dịch Vụ",
      path: "/core/service-deliveries",
      icon: <Briefcase className="w-5 h-5" />,
      order: 46,
    },
  ],

  routes: [
    {
      path: "/core/service-deliveries",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <ServiceDeliveriesPage />
        </Suspense>
      ),
      title: "Dịch Vụ",
    },
    {
      path: "/core/service-deliveries/add",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <AddServiceDeliveryPage />
        </Suspense>
      ),
      title: "Thêm Dịch Vụ",
    },
    {
      path: "/core/service-deliveries/edit/:id",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <EditServiceDeliveryPage />
        </Suspense>
      ),
      title: "Chỉnh Sửa Dịch Vụ",
    },
    {
      path: "/core/service-deliveries/:id",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <ServiceDeliveryDetailPage />
        </Suspense>
      ),
      title: "Chi Tiết Dịch Vụ",
    },
  ],

  initialize: async () => {
    console.log('✅ Service Deliveries module initialized');
  },

  cleanup: async () => {
    console.log('🧹 Service Deliveries module cleaned up');
  },
};