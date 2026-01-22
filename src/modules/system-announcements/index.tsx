/**
 * System Announcements Module
 * Module definition for system-wide announcements management
 * 
 * 🌐 Path: /platform/system-announcements
 */

import { ModuleDefinition } from '../../core/ModuleRegistry';
import { lazy, Suspense } from 'react';
import { LoadingFallback } from '../../components/LoadingFallback';
import { Bell } from 'lucide-react';

// Lazy-loaded pages
const SystemAnnouncementsPage = lazy(() => import('../../app/(admin)/platform/system-announcements/page'));
const CreateSystemAnnouncementPage = lazy(() => import('../../app/(admin)/platform/system-announcements/create/page'));
const EditSystemAnnouncementPage = lazy(() => import('../../app/(admin)/platform/system-announcements/edit/[id]/page'));
// Reuse edit page for detail view
const SystemAnnouncementDetailPage = lazy(() => import('../../app/(admin)/platform/system-announcements/edit/[id]/page'));

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
      path: '/platform/system-announcements',
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <SystemAnnouncementsPage />
        </Suspense>
      ),
      title: 'systemAnnouncements.menu',
    },
    {
      path: '/platform/system-announcements/create',
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <CreateSystemAnnouncementPage />
        </Suspense>
      ),
      title: 'systemAnnouncements.add',
    },
    {
      path: '/platform/system-announcements/:id/edit',
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <EditSystemAnnouncementPage />
        </Suspense>
      ),
      title: 'systemAnnouncements.edit',
    },
    {
      path: '/platform/system-announcements/:id',
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <SystemAnnouncementDetailPage />
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
      path: '/platform/system-announcements',
      order: 1,
    },
  ],
};

export default SystemAnnouncementsModule;