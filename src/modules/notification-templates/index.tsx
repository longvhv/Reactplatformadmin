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

// Lazy-loaded pages
const NotificationTemplatesPage = lazy(() => import('../../pages/NotificationTemplatesPage'));

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