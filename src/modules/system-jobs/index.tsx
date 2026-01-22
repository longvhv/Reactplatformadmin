/**
 * System Jobs Module
 * Module definition for system jobs management
 * 
 * 🌐 Path: /platform/system-jobs
 */

import { ModuleDefinition } from '../../core/ModuleRegistry';
import { lazy, Suspense } from 'react';
import { LoadingFallback } from '../../components/LoadingFallback';
import { Settings } from 'lucide-react';

// Lazy load pages
// ✅ MIGRATED: Import from /app/(admin)/ for single source of truth
const SystemJobsPage = lazy(() => 
  import('../../app/(admin)/platform/system-jobs/page').then(m => ({ default: m.default }))
);

const AddSystemJobPage = lazy(() => 
  import('../../app/(admin)/platform/system-jobs/create/page').then(m => ({ default: m.default }))
);
const EditSystemJobPage = lazy(() => 
  import('../../app/(admin)/platform/system-jobs/edit/[id]/page').then(m => ({ default: m.default }))
);
const SystemJobDetailPage = lazy(() => 
  import('../../app/(admin)/platform/system-jobs/[id]/page').then(m => ({ default: m.default }))
);

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
      path: '/platform/system-jobs',
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <SystemJobsPage />
        </Suspense>
      ),
      title: 'systemJobs.menu',
    },
    {
      path: '/platform/system-jobs/create',
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <AddSystemJobPage />
        </Suspense>
      ),
      title: 'systemJobs.add',
    },
    {
      path: '/platform/system-jobs/:id/edit',
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <EditSystemJobPage />
        </Suspense>
      ),
      title: 'systemJobs.edit',
    },
    {
      path: '/platform/system-jobs/:id',
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
      path: '/platform/system-jobs',
      order: 1,
    },
  ],
};

export default SystemJobsModule;