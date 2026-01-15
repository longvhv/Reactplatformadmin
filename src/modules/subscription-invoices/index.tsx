/**
 * Subscription Invoices Module
 * Invoice Management with full CRUD operations
 */

import { lazy, Suspense } from 'react';
import { ModuleDefinition } from '../../core/ModuleRegistry';
import { LoadingFallback } from '../../components/LoadingFallback';
import { FileText } from 'lucide-react';

// Lazy-loaded pages
const SubscriptionInvoicesPage = lazy(() => import('../../pages/SubscriptionInvoicesPage'));
const InvoiceDetailPage = lazy(() => import('../../pages/InvoiceDetailPage'));
const AddInvoicePage = lazy(() => import('../../pages/AddInvoicePage'));
const EditInvoicePage = lazy(() => import('../../pages/EditInvoicePage'));

/**
 * Subscription Invoices Module Definition
 * Translation keys are resolved at runtime
 */
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
      path: "/core/subscription-invoices",
      icon: <FileText className="w-5 h-5" />,
      order: 46,
    },
  ],

  routes: [
    {
      path: "/core/subscription-invoices",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <SubscriptionInvoicesPage />
        </Suspense>
      ),
      title: "invoices.title", // Translation key
    },
    {
      path: "/core/subscription-invoices/add",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <AddInvoicePage />
        </Suspense>
      ),
      title: "invoices.addInvoice", // Translation key
    },
    {
      path: "/core/subscription-invoices/edit/:id",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <EditInvoicePage />
        </Suspense>
      ),
      title: "invoices.editInvoice", // Translation key
    },
    {
      path: "/core/subscription-invoices/:id",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <InvoiceDetailPage />
        </Suspense>
      ),
      title: "invoices.viewDetails", // Translation key
    },
  ],

  initialize: async () => {
    console.log('✅ Subscription Invoices module initialized');
  },

  cleanup: async () => {
    console.log('🧹 Subscription Invoices module cleaned up');
  },
};