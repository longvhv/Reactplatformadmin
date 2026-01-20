/**
 * API Usage Logs Module
 * Module definition for API usage monitoring and analytics
 * 
 * 🌐 Path: /integrations/api-usage-logs
 */

import { ModuleDefinition } from '../../core/ModuleRegistry';
import { lazy, Suspense } from 'react';
import { LoadingFallback } from '../../components/LoadingFallback';
import { BarChart3 } from 'lucide-react';

// Lazy-loaded pages
// ✅ MIGRATED: Import from /app/(admin)/ for single source of truth
const ApiUsageLogsPage = lazy(() => import('../../app/(admin)/platform/api-usage-logs/page'));
const ApiUsageLogDetailPage = lazy(() => import('../../app/(admin)/platform/api-usage-logs/[id]/page'));

export const ApiUsageLogsModule: ModuleDefinition = {
  id: 'api-usage-logs',
  name: 'API Usage Logs',
  version: '1.0.0',
  enabled: true,
  showInSidebar: true,
  order: 98,
  icon: <BarChart3 className="h-5 w-5" />,
  
  routes: [
    {
      path: '/integrations/api-usage-logs',
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <ApiUsageLogsPage />
        </Suspense>
      ),
      title: 'apiUsageLogs.menu',
    },
    {
      path: '/integrations/api-usage-logs/:id',
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <ApiUsageLogDetailPage />
        </Suspense>
      ),
      title: 'apiUsageLogs.detail',
    },
  ],
  
  menuItems: [
    {
      id: 'api-usage-logs',
      label: 'apiUsageLogs.menu',
      icon: <BarChart3 className="h-5 w-5" />,
      path: '/integrations/api-usage-logs',
      order: 1,
    },
  ],
};