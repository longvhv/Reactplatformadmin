/**
 * Subscription Invoices Module Definition
 * Note: menuItems label and routes title use translation keys that will be resolved at runtime
 * 
 * 🌐 Path: /commerce/subscription-invoices
 */

import { ModuleDefinition } from '../../core/ModuleRegistry';
import { lazy, Suspense } from 'react';
import { LoadingFallback } from '../../components/LoadingFallback';
import { FileText } from 'lucide-react';

const SubscriptionInvoicesPage = lazy(() => import('../../app/(admin)/subscriptions/invoices/page'));

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
  ],

  initialize: async () => {
    console.log('✅ Subscription Invoices module initialized');
  },

  cleanup: async () => {
    console.log('🧹 Subscription Invoices module cleaned up');
  },
};