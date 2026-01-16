/**
 * Location Types Module
 * Manages location type definitions with extra fields
 */

import { lazy } from 'react';
import type { Module } from '../../core/ModuleRegistry';
import { MapPin } from 'lucide-react';

// ✅ Lazy load page components for code splitting
const LocationTypesPage = lazy(() => import('../../pages/LocationTypesPage'));

export const LocationTypesModule: Module = {
  id: 'location-types',
  name: 'Location Types',
  description: 'Manage location type definitions and custom fields',
  icon: MapPin,
  category: 'Master Data',
  order: 30,
  
  routes: [
    {
      path: '/core/location-types',
      element: <LocationTypesPage />,
    },
  ],
  
  menuItems: [
    {
      id: 'location-types',
      label: 'Location Types',
      icon: MapPin,
      path: '/core/location-types',
      category: 'Master Data',
      order: 30,
      permission: 'location_types.view',
    },
  ],
};

export default LocationTypesModule;
