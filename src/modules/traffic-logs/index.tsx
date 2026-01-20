/**
 * Traffic Logs Module
 * Module definition for traffic monitoring and analytics
 * 
 * 🌐 Path: /platform/traffic-logs
 */

import { ModuleDefinition } from '../../core/ModuleRegistry';
import { lazy, Suspense } from 'react';
import { LoadingFallback } from '../../components/LoadingFallback';
import { Activity } from 'lucide-react';

// Lazy-loaded pages
// ✅ MIGRATED: Import from /app/(admin)/ for single source of truth
const TrafficLogsPage = lazy(() => 
  import('../../app/(admin)/platform/traffic-logs/page')
);

const TrafficLogDetailPage = lazy(() => 
  import('../../app/(admin)/platform/traffic-logs/[id]/page')
);
const TrafficLogsAnalyticsPage = lazy(() => 
  import('../../app/(admin)/platform/traffic-logs/analytics/page')
);
const AddTrafficLogPage = lazy(() => 
  import('../../app/(admin)/platform/traffic-logs/create/page')
);

export const TrafficLogsModule: ModuleDefinition = {
  id: 'traffic-logs',
  name: 'Traffic Logs',
  version: '1.0.0',
  enabled: true,
  showInSidebar: true,
  order: 97,
  icon: <Activity className="h-5 w-5" />,
  
  routes: [
    {
      path: '/platform/traffic-logs',
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <TrafficLogsPage />
        </Suspense>
      ),
      title: 'trafficLogs.menu',
    },
    {
      path: '/platform/traffic-logs/analytics',
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <TrafficLogsAnalyticsPage />
        </Suspense>
      ),
      title: 'trafficLogs.analytics',
    },
    {
      path: '/platform/traffic-logs/create',
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <AddTrafficLogPage />
        </Suspense>
      ),
      title: 'trafficLogs.addLog',
    },
    {
      path: '/platform/traffic-logs/:id',
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <TrafficLogDetailPage />
        </Suspense>
      ),
      title: 'trafficLogs.detail',
    },
  ],
  
  menuItems: [
    {
      id: 'traffic-logs',
      label: 'trafficLogs.menu',
      icon: <Activity className="h-5 w-5" />,
      path: '/platform/traffic-logs',
      order: 1,
    },
  ],
};