/**
 * Reserved Slugs Module Definition
 * Manage system-wide reserved slugs/keywords
 */

import { Suspense, lazy } from 'react';
import { Shield } from 'lucide-react';
import type { ModuleDefinition } from '../../core/ModuleRegistry';
import { reservedSlugsRoutes } from './index';

const ReservedSlugsPage = lazy(() => import('../../pages/ReservedSlugsPage'));

export const ReservedSlugsModule: ModuleDefinition = {
  id: 'reserved-slugs',
  name: 'Reserved Slugs',
  description: 'Manage system-wide reserved slugs and keywords',
  icon: <Shield className="w-4 h-4" />,
  version: '1.0.0',
  category: 'system',
  enabled: true,
  showInSidebar: true,
  routes: [
    {
      path: '/core/reserved-slugs',
      element: (
        <Suspense fallback={<div>Loading...</div>}>
          <ReservedSlugsPage />
        </Suspense>
      ),
      title: 'Reserved Slugs',
    },
  ],
  menuItems: [
    {
      id: 'reserved-slugs',
      label: 'Reserved Slugs',
      path: '/core/reserved-slugs',
      icon: <Shield className="w-4 h-4" />,
      category: 'system',
      description: 'Manage reserved slugs',
    },
  ],
};

export default ReservedSlugsModule;