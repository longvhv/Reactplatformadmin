/**
 * Traffic Logs Module
 * Module definition for traffic monitoring and analytics
 */

import { ModuleDefinition } from '../../core/ModuleRegistry';
import { lazy, Suspense } from 'react';
import { LoadingFallback } from '../../components/LoadingFallback';
import { Activity } from 'lucide-react';

// Lazy-loaded pages
const TrafficLogsPage = lazy(() => import('../../pages/TrafficLogsPage'));
const TrafficLogDetailPage = lazy(() => import('../../pages/TrafficLogDetailPage'));
const TrafficLogsAnalyticsPage = lazy(() => import('../../pages/TrafficLogsAnalyticsPage'));
const AddTrafficLogPage = lazy(() => import('../../pages/AddTrafficLogPage'));

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
      path: '/core/traffic-logs',
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <TrafficLogsPage />
        </Suspense>
      ),
      title: 'trafficLogs.menu',
    },
    {
      path: '/core/traffic-logs/analytics',
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <TrafficLogsAnalyticsPage />
        </Suspense>
      ),
      title: 'trafficLogs.analytics',
    },
    {
      path: '/core/traffic-logs/new',
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <AddTrafficLogPage />
        </Suspense>
      ),
      title: 'trafficLogs.addLog',
    },
    {
      path: '/core/traffic-logs/:id',
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
      path: '/core/traffic-logs',
      order: 1,
    },
  ],
};
