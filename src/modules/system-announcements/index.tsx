/**
 * System Announcements Module
 * Module definition for system-wide announcements management
 */

import { Module } from '../../core/ModuleRegistry';
import { Bell } from 'lucide-react';

export const SystemAnnouncementsModule: Module = {
  id: 'system-announcements',
  name: 'System Announcements',
  version: '1.0.0',
  enabled: true,
  showInSidebar: true,
  order: 90,
  icon: <Bell className="h-5 w-5" />,
  routes: [],
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