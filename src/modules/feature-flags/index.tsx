/**
 * Feature Flags Module
 * Module definition for feature flags management
 * 
 * 🌐 Path: /platform/feature-flags
 */

import { ModuleDefinition } from '../../core/ModuleRegistry';
import { lazy, Suspense } from 'react';
import { LoadingFallback } from '../../components/LoadingFallback';
import { Flag } from 'lucide-react';

// Lazy-loaded pages
const FeatureFlagsPage = lazy(() => import('../../pages/FeatureFlagsPage'));
const AddFeatureFlagPage = lazy(() => import('../../pages/AddFeatureFlagPage'));
const EditFeatureFlagPage = lazy(() => import('../../pages/EditFeatureFlagPage'));
const FeatureFlagDetailPage = lazy(() => import('../../pages/FeatureFlagDetailPage'));

export const FeatureFlagsModule: ModuleDefinition = {
  id: 'feature-flags',
  name: 'Feature Flags',
  version: '1.0.0',
  enabled: true,
  showInSidebar: true,
  order: 85,
  icon: <Flag className="h-5 w-5" />,
  
  routes: [
    {
      path: '/platform/feature-flags',
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <FeatureFlagsPage />
        </Suspense>
      ),
      title: 'featureFlags.menu',
    },
    {
      path: '/platform/feature-flags/create',
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <AddFeatureFlagPage />
        </Suspense>
      ),
      title: 'featureFlags.add',
    },
    {
      path: '/platform/feature-flags/:id/edit',
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <EditFeatureFlagPage />
        </Suspense>
      ),
      title: 'featureFlags.edit',
    },
    {
      path: '/platform/feature-flags/:id',
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <FeatureFlagDetailPage />
        </Suspense>
      ),
      title: 'featureFlags.detail',
    },
  ],
  
  menuItems: [
    {
      id: 'feature-flags',
      label: 'featureFlags.menu',
      icon: <Flag className="h-5 w-5" />,
      path: '/platform/feature-flags',
      order: 1,
    },
  ],
};
