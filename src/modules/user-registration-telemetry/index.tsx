/**
 * User Registration Telemetry Module
 * Module definition for user registration analytics and tracking
 * 
 * 🌐 Path: /admin/registration-analytics
 */

import { ModuleDefinition } from '../../core/ModuleRegistry';
import { lazy, Suspense } from 'react';
import { LoadingFallback } from '../../components/LoadingFallback';
import { BarChart3 } from 'lucide-react';

// Lazy-loaded pages
// ✅ MIGRATED: Import from /app/(admin)/ for single source of truth
const UserRegistrationTelemetryPage = lazy(() => 
  import('../../app/(admin)/platform/user-registrations/page').then(m => ({ default: m.default }))
);
const AddUserRegistrationPage = lazy(() => 
  import('../../app/(admin)/platform/user-registrations/create/page').then(m => ({ default: m.default }))
);
const EditUserRegistrationPage = lazy(() => 
  import('../../app/(admin)/platform/user-registrations/edit/[id]/page').then(m => ({ default: m.default }))
);
const UserRegistrationDetailPage = lazy(() => 
  import('../../app/(admin)/platform/user-registrations/[id]/page').then(m => ({ default: m.default }))
);

export const UserRegistrationTelemetryModule: ModuleDefinition = {
  id: 'user-registration-telemetry',
  name: 'User Registration Telemetry',
  version: '1.0.0',
  enabled: true,
  showInSidebar: true,
  order: 96,
  icon: <BarChart3 className="h-5 w-5" />,
  
  routes: [
    {
      path: '/admin/registration-analytics',
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <UserRegistrationTelemetryPage />
        </Suspense>
      ),
      title: 'userRegistration.menu',
    },
    {
      path: '/admin/registration-analytics/create',
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <AddUserRegistrationPage />
        </Suspense>
      ),
      title: 'userRegistration.add',
    },
    {
      path: '/admin/registration-analytics/:id/edit',
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <EditUserRegistrationPage />
        </Suspense>
      ),
      title: 'userRegistration.edit',
    },
    {
      path: '/admin/registration-analytics/:id',
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <UserRegistrationDetailPage />
        </Suspense>
      ),
      title: 'userRegistration.detail',
    },
  ],
  
  menuItems: [
    {
      id: 'user-registration-telemetry',
      label: 'userRegistration.menu',
      icon: <BarChart3 className="h-5 w-5" />,
      path: '/admin/registration-analytics',
      order: 1,
    },
  ],
};

export default UserRegistrationTelemetryModule;