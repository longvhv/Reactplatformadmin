/**
 * Notification Templates Module
 * Module definition for notification template management
 */

import { Module } from '../../core/ModuleRegistry';
import { Mail } from 'lucide-react';

export const NotificationTemplatesModule: Module = {
  id: 'notification-templates',
  name: 'Notification Templates',
  version: '1.0.0',
  enabled: true,
  showInSidebar: true,
  order: 91,
  icon: <Mail className="h-5 w-5" />,
  routes: [],
  menuItems: [
    {
      id: 'notification-templates',
      label: 'notificationTemplates.menu',
      icon: <Mail className="h-5 w-5" />,
      path: '/core/notification-templates',
      order: 1,
    },
  ],
};