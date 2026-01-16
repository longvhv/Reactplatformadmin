/**
 * System Jobs Module
 * Module definition for system jobs management
 */

import { ModuleDefinition } from '../../core/ModuleRegistry';
import { lazy, Suspense } from 'react';
import { LoadingFallback } from '../../components/LoadingFallback';
import { Settings } from 'lucide-react';

// Lazy-loaded pages
const SystemJobsPage = lazy(() => import('../../pages/SystemJobsPage'));
const AddSystemJobPage = lazy(() => import('../../pages/AddSystemJobPage'));
const EditSystemJobPage = lazy(() => import('../../pages/EditSystemJobPage'));
const SystemJobDetailPage = lazy(() => import('../../pages/SystemJobDetailPage'));

export const SystemJobsModule: ModuleDefinition = {
  id: 'system-jobs',
  name: 'System Jobs',
  version: '1.0.0',
  enabled: true,
  showInSidebar: true,
  order: 95,
  icon: <Settings className="h-5 w-5" />,
  
  routes: [
    {
      path: '/core/system-jobs',
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <SystemJobsPage />
        </Suspense>
      ),
      title: 'systemJobs.menu',
    },
    {
      path: '/core/system-jobs/new',
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <AddSystemJobPage />
        </Suspense>
      ),
      title: 'systemJobs.add',
    },
    {
      path: '/core/system-jobs/edit/:id',
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <EditSystemJobPage />
        </Suspense>
      ),
      title: 'systemJobs.edit',
    },
    {
      path: '/core/system-jobs/:id',
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <SystemJobDetailPage />
        </Suspense>
      ),
      title: 'systemJobs.detail',
    },
  ],
  
  menuItems: [
    {
      id: 'system-jobs',
      label: 'systemJobs.menu',
      icon: <Settings className="h-5 w-5" />,
      path: '/core/system-jobs',
      order: 1,
    },
  ],
};
