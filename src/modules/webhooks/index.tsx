/**
 * Webhooks Module Definition
 * Note: menuItems label and routes title use translation keys that will be resolved at runtime
 * 
 * 🌐 Path: /platform/webhooks
 */

import { ModuleDefinition } from '../../core/ModuleRegistry';
import { lazy, Suspense } from 'react';
import { LoadingFallback } from '../../components/LoadingFallback';
import { Webhook } from 'lucide-react';

const WebhooksPage = lazy(() => 
  import('../../app/(admin)/platform/webhooks/page').then(m => ({ default: m.default }))
);
const AddWebhookPage = lazy(() => 
  import('../../app/(admin)/platform/webhooks/add/page').then(m => ({ default: m.default }))
);
const EditWebhookPage = lazy(() => 
  import('../../app/(admin)/platform/webhooks/edit/[id]/page').then(m => ({ default: m.default }))
);
const WebhookDetailPage = lazy(() => 
  import('../../app/(admin)/platform/webhooks/[id]/page').then(m => ({ default: m.default }))
);

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
      path: "/platform/webhooks",
      icon: <Webhook className="w-5 h-5" />,
      order: 48,
    },
  ],

  routes: [
    {
      path: "/platform/webhooks",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <WebhooksPage />
        </Suspense>
      ),
      title: "Webhooks",
    },
    {
      path: "/platform/webhooks/add",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <AddWebhookPage />
        </Suspense>
      ),
      title: "Add Webhook",
    },
    {
      path: "/platform/webhooks/edit/:id",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <EditWebhookPage />
        </Suspense>
      ),
      title: "Edit Webhook",
    },
    {
      path: "/platform/webhooks/:id",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <WebhookDetailPage />
        </Suspense>
      ),
      title: "Webhook Detail",
    },
  ],
};

export default WebhooksModule;