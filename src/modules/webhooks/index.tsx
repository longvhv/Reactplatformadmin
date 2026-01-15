/**
 * Webhooks Module
 * Webhook Endpoints Management
 */

import { lazy, Suspense } from 'react';
import { ModuleDefinition } from '../../core/ModuleRegistry';
import { LoadingFallback } from '../../components/LoadingFallback';
import { Webhook } from 'lucide-react';

// Lazy-loaded pages
const WebhooksPage = lazy(() => import('../../pages/WebhooksPage'));
const AddWebhookPage = lazy(() => import('../../pages/AddWebhookPage'));
const EditWebhookPage = lazy(() => import('../../pages/EditWebhookPage'));
const WebhookDetailPage = lazy(() => import('../../pages/WebhookDetailPage'));

/**
 * Webhooks Module Definition
 * 
 * Features:
 * - Global webhooks management
 * - Multi-tenant support
 * - Event subscriptions
 * - Stats tracking
 * 
 * Note: menuItems label and routes title use translation keys that will be resolved at runtime
 */
export const WebhooksModule: ModuleDefinition = {
  id: "webhooks",
  name: "Webhooks",
  version: "1.0.0",
  enabled: true,
  showInSidebar: true,
  order: 48,
  
  menuItems: [
    {
      id: "webhooks",
      label: "navigation.webhooks",
      path: "/core/webhooks",
      icon: <Webhook className="w-5 h-5" />,
      order: 48,
    },
  ],

  routes: [
    {
      path: "/core/webhooks",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <WebhooksPage />
        </Suspense>
      ),
      title: "Webhooks",
    },
    {
      path: "/core/webhooks/new",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <AddWebhookPage />
        </Suspense>
      ),
      title: "Add Webhook",
    },
    {
      path: "/core/webhooks/edit/:id",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <EditWebhookPage />
        </Suspense>
      ),
      title: "Edit Webhook",
    },
    {
      path: "/core/webhooks/:id",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <WebhookDetailPage />
        </Suspense>
      ),
      title: "Webhook Details",
    },
  ],
};

export default WebhooksModule;