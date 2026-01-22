/**
 * Subscription Invoices Module Definition
 * Note: menuItems label and routes title use translation keys that will be resolved at runtime
 * 
 * 🌐 Path: /commerce/subscription-invoices
 * ✅ FIXED 2026-01-22: Corrected import path from /commerce/invoices to /commerce/subscription-invoices
 * ✅ FIXED 2026-01-22: Added create, edit, and detail routes
 */

import { ModuleDefinition } from '../../core/ModuleRegistry';
import { lazy, Suspense } from 'react';
import { LoadingFallback } from '../../components/LoadingFallback';
import { FileText } from 'lucide-react';

const SubscriptionInvoicesPage = lazy(() => import('../../app/(admin)/commerce/subscription-invoices/page').then(module => ({ default: module.default })));
const SubscriptionInvoicesCreatePage = lazy(() => import('../../app/(admin)/commerce/subscription-invoices/create/page').then(module => ({ default: module.default })));
const SubscriptionInvoicesEditPage = lazy(() => import('../../app/(admin)/commerce/subscription-invoices/edit/[id]/page').then(module => ({ default: module.default })));
const SubscriptionInvoicesDetailPage = lazy(() => import('../../app/(admin)/commerce/subscription-invoices/[id]/page').then(module => ({ default: module.default })));

export const SubscriptionInvoicesModule: ModuleDefinition = {
  id: "subscription-invoices",
  name: "Subscription Invoices",
  version: "1.0.0",
  enabled: true,
  showInSidebar: true,
  order: 46,
  
  menuItems: [
    {
      id: "subscription-invoices",
      label: "invoices.title", // Translation key
      path: "/commerce/subscription-invoices",
      icon: <FileText className="w-5 h-5" />,
      order: 46,
    },
  ],

  routes: [
    {
      path: "/commerce/subscription-invoices",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <SubscriptionInvoicesPage />
        </Suspense>
      ),
      title: "invoices.title", // Translation key
    },
    {
      path: "/commerce/subscription-invoices/create",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <SubscriptionInvoicesCreatePage />
        </Suspense>
      ),
      title: "invoices.create",
    },
    {
      path: "/commerce/subscription-invoices/edit/:id",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <SubscriptionInvoicesEditPage />
        </Suspense>
      ),
      title: "invoices.edit",
    },
    {
      path: "/commerce/subscription-invoices/:id",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <SubscriptionInvoicesDetailPage />
        </Suspense>
      ),
      title: "invoices.details",
    },
  ],

  initialize: async () => {
    console.log('✅ Subscription Invoices module initialized');
  },

  cleanup: async () => {
    console.log('🧹 Subscription Invoices module cleaned up');
  },
};

export default SubscriptionInvoicesModule;