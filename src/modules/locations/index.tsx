/**
 * Locations Module
 * Manages location data across the system
 * 
 * 🌐 Path: /platform/locations
 * ✅ UPDATED: Vietnamese paths
 */

import { MapPin } from 'lucide-react';
import type { ModuleDefinition } from '../../core/ModuleRegistry';
import { lazy, Suspense } from 'react';
import { LoadingFallback } from '../../components/LoadingFallback';

// Lazy-loaded pages
// ✅ MIGRATED: Import from /app/(admin)/ for single source of truth
const LocationsPage = lazy(() => import('../../app/(admin)/location-types/page').then(m => ({ default: m.default })));

export const LocationsModule: ModuleDefinition = {
  id: 'locations',
  name: 'Locations',
  description: 'Manage locations and their hierarchies',
  icon: <MapPin className="w-4 h-4" />,
  showInSidebar: false,
  category: 'Infrastructure',
  order: 55,

  routes: [
    {
      path: '/platform/locations',
      element: (
        <Suspense fallback={<LoadingFallback message="Đang tải Locations..." />}>
          <LocationsPage />
        </Suspense>
      ),
    },
  ],
};

export default LocationsModule;