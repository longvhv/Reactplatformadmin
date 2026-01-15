/**
 * System Announcements Module
 * Module definition for system-wide announcements management
 */

import { ModuleDefinition } from '../../core/ModuleRegistry';
import { lazy, Suspense } from 'react';
import { LoadingFallback } from '../../components/LoadingFallback';
import { Bell } from 'lucide-react';

// Lazy-loaded pages
const NotificationsPage = lazy(() => import('../../pages/NotificationsPage'));
const NotificationDetailPage = lazy(() => import('../../pages/NotificationDetailPage'));
const AddNotificationPage = lazy(() => import('../../pages/AddNotificationPage'));
const EditNotificationPage = lazy(() => import('../../pages/EditNotificationPage'));

export const SystemAnnouncementsModule: ModuleDefinition = {
  id: 'system-announcements',
  name: 'System Announcements',
  version: '1.0.0',
  enabled: true,
  showInSidebar: true,
  order: 90,
  icon: <Bell className="h-5 w-5" />,
  
  routes: [
    {
      path: '/core/system-announcements',
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <NotificationsPage />
        </Suspense>
      ),
      title: 'systemAnnouncements.menu',
    },
    {
      path: '/core/system-announcements/new',
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <AddNotificationPage />
        </Suspense>
      ),
      title: 'systemAnnouncements.add',
    },
    {
      path: '/core/system-announcements/edit/:id',
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <EditNotificationPage />
        </Suspense>
      ),
      title: 'systemAnnouncements.edit',
    },
    {
      path: '/core/system-announcements/:id',
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <NotificationDetailPage />
        </Suspense>
      ),
      title: 'systemAnnouncements.detail',
    },
  ],
  
  menuItems: [
    {
      id: 'system-announcements',
      label: 'systemAnnouncements.menu',
      icon: <Bell className="h-5 w-5" />,
      path: '/core/system-announcements',
      order: 1,
    },
  ],
};