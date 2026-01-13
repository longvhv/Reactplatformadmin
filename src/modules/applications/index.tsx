import { ModuleDefinition } from '../../core/ModuleRegistry';
import { lazy, Suspense } from 'react';
import { LoadingFallback } from '../../components/LoadingFallback';
import { AppWindow } from 'lucide-react';

/**
 * Lazy load Applications pages
 */
const ApplicationsPage = lazy(() =>
  import('../../pages/ApplicationsPage').then((module) => ({ default: module.ApplicationsPage }))
);

/**
 * Applications Module
 */
export const ApplicationsModule: ModuleDefinition = {
  id: 'applications',
  name: 'Applications',
  description: 'Quản lý các ứng dụng hệ thống',
  icon: <AppWindow className="w-4 h-4" />,
  enabled: true,
  showInSidebar: true,
  routes: [
    {
      path: '/core/applications',
      element: (
        <Suspense fallback={<LoadingFallback message="Đang tải Applications..." />}>
          <ApplicationsPage />
        </Suspense>
      ),
      title: 'Applications',
    },
  ],
  menuItems: [
    {
      id: 'applications',
      label: 'navigation.applications',
      icon: <AppWindow className="w-5 h-5" />,
      path: '/core/applications',
    },
  ],
};
