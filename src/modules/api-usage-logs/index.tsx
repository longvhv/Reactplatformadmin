/**
 * API Usage Logs Module
 * Module definition for API usage monitoring and analytics
 */

import { ModuleDefinition } from '../../core/ModuleRegistry';
import { lazy, Suspense } from 'react';
import { LoadingFallback } from '../../components/LoadingFallback';
import { BarChart3 } from 'lucide-react';

// Lazy-loaded pages
const ApiUsageLogsPage = lazy(() => import('../../pages/core/api-usage-logs/index'));
const ApiUsageLogDetailPage = lazy(() => import('../../pages/core/api-usage-logs/[id]'));
const ApiUsageLogsAnalyticsPage = lazy(() => import('../../pages/core/api-usage-logs/analytics'));
const ApiUsageLogsSettingsPage = lazy(() => import('../../pages/core/api-usage-logs/settings'));

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
      path: '/core/api-usage-logs',
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <ApiUsageLogsPage />
        </Suspense>
      ),
      title: 'apiUsageLogs.menu',
    },
    {
      path: '/core/api-usage-logs/analytics',
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <ApiUsageLogsAnalyticsPage />
        </Suspense>
      ),
      title: 'apiUsageLogs.analytics',
    },
    {
      path: '/core/api-usage-logs/settings',
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <ApiUsageLogsSettingsPage />
        </Suspense>
      ),
      title: 'apiUsageLogs.settings',
    },
    {
      path: '/core/api-usage-logs/:id',
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
      path: '/core/api-usage-logs',
      order: 1,
    },
  ],
};
