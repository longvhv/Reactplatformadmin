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

// Lazy-loaded pages (App Router)
const SystemAnnouncementsPage = lazy(() => import('../../app/(admin)/platform/system-announcements/page').then(m => ({ default: m.default })));
const CreateSystemAnnouncementPage = lazy(() => import('../../app/(admin)/platform/system-announcements/create/page').then(m => ({ default: m.default })));
const EditSystemAnnouncementPage = lazy(() => import('../../app/(admin)/platform/system-announcements/edit/[id]/page').then(m => ({ default: m.default })));
// Detail page not implemented separately yet, reusing edit or list
const SystemAnnouncementDetailPage = lazy(() => import('../../app/(admin)/platform/system-announcements/edit/[id]/page').then(m => ({ default: m.default })));

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