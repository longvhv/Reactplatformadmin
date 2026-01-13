/**
 * Subscription Invoices Module
 * Invoice Management with full CRUD operations
 */

import { lazy, Suspense } from 'react';
import { ModuleDefinition } from '../../core/ModuleRegistry';
import { FileText } from 'lucide-react';

// Lazy-loaded pages
const SubscriptionInvoicesPage = lazy(() => import('../../pages/SubscriptionInvoicesPage').then(m => ({ default: m.SubscriptionInvoicesPage })));
const InvoiceDetailPage = lazy(() => import('../../pages/InvoiceDetailPage').then(m => ({ default: m.InvoiceDetailPage })));
const AddInvoicePage = lazy(() => import('../../pages/AddInvoicePage').then(m => ({ default: m.AddInvoicePage })));
const EditInvoicePage = lazy(() => import('../../pages/EditInvoicePage').then(m => ({ default: m.EditInvoicePage })));

// Loading fallback
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
  </div>
);

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
      path: "/core/subscription-invoices/:id",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <InvoiceDetailPage />
        </Suspense>
      ),
      title: "invoices.viewDetails", // Translation key
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
  ],

  initialize: async () => {
    console.log('✅ Subscription Invoices module initialized');
  },

  cleanup: async () => {
    console.log('🧹 Subscription Invoices module cleaned up');
  },
};