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
const UserRegistrationTelemetryPage = lazy(() => import('../../pages/UserRegistrationTelemetryPage'));
const AddUserRegistrationPage = lazy(() => import('../../pages/AddUserRegistrationPage'));
const EditUserRegistrationPage = lazy(() => import('../../pages/EditUserRegistrationPage'));
const UserRegistrationDetailPage = lazy(() => import('../../pages/UserRegistrationDetailPage'));

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