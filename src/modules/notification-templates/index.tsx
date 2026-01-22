/**
 * Notification Templates Module
 * Module definition for notification template management
 * 
 * 🌐 Path: /platform/notification-templates
 */

import { ModuleDefinition } from '../../core/ModuleRegistry';
import { lazy, Suspense } from 'react';
import { LoadingFallback } from '../../components/LoadingFallback';
import { Mail } from 'lucide-react';

// Lazy-loaded pages (App Router)
const NotificationTemplatesPage = lazy(() => import('../../app/(admin)/platform/notification-templates/page').then(m => ({ default: m.default })));
const CreateNotificationTemplatePage = lazy(() => import('../../app/(admin)/platform/notification-templates/create/page').then(m => ({ default: m.default })));
const EditNotificationTemplatePage = lazy(() => import('../../app/(admin)/platform/notification-templates/edit/[id]/page').then(m => ({ default: m.default })));

export const NotificationTemplatesModule: ModuleDefinition = {
  id: 'notification-templates',
  name: 'Notification Templates',
  version: '1.0.0',
  enabled: true,
  showInSidebar: true,
  order: 91,
  icon: <Mail className="h-5 w-5" />,
  
  routes: [
    {
      path: '/platform/notification-templates',
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <NotificationTemplatesPage />
        </Suspense>
      ),
      title: 'notificationTemplates.menu',
    },
    {
      path: '/platform/notification-templates/create',
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <CreateNotificationTemplatePage />
        </Suspense>
      ),
      title: 'notificationTemplates.add',
    },
    {
      path: '/platform/notification-templates/edit/:id',
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <EditNotificationTemplatePage />
        </Suspense>
      ),
      title: 'notificationTemplates.edit',
    },
  ],
  
  menuItems: [
    {
      id: 'notification-templates',
      label: 'notificationTemplates.menu',
      icon: <Mail className="h-5 w-5" />,
      path: '/platform/notification-templates',
      order: 1,
    },
  ],
};

export default NotificationTemplatesModule;