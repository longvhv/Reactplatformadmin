import { ModuleDefinition } from '../../core/ModuleRegistry';
import { lazy, Suspense } from 'react';
import { LoadingFallback } from '../../components/LoadingFallback';
import { AppWindow } from 'lucide-react';

/**
 * Lazy-load Applications Page
 * ✅ MIGRATED: Import from /app/(admin)/ for single source of truth
 */
const ApplicationsPage = lazy(() =>
  import('../../app/(admin)/platform/applications/page')
);

/**
 * Lazy-load Application Form Page
 */
const ApplicationFormPage = lazy(() =>
  import('../../pages/ApplicationFormPage')
);

/**
 * Applications Module
 * 
 * 🌐 Path: /platform/applications
 */
export const ApplicationsModule: ModuleDefinition = {
  id: 'applications',
  name: 'Applications',
  description: 'Quản lý các ứng dụng hệ thống',
  icon: <AppWindow className="w-4 h-4" />,
  enabled: true,
  showInSidebar: true,
  order: 50, // NỀN TẢNG & CẤU HÌNH group
  routes: [
    {
      path: '/platform/applications',
      element: (
        <Suspense fallback={<LoadingFallback message="Đang tải Applications..." />}>
          <ApplicationsPage />
        </Suspense>
      ),
      title: 'Applications',
    },
    // Note: /platform/applications/:id and /platform/applications/create routes
    // are defined in App.tsx (full-screen detail pages)
  ],
  menuItems: [
    {
      id: 'applications',
      label: 'navigation.applications',
      icon: <AppWindow className="w-5 h-5" />,
      path: '/platform/applications',
    },
  ],
};