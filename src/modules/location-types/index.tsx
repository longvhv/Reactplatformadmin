/**
 * Location Types Module
 * Manages location type definitions with extra fields
 * 
 * 🌐 Path: /platform/location-types
 */

import { lazy } from 'react';
import type { Module } from '../../core/ModuleRegistry';
import { MapPin } from 'lucide-react';

// ✅ Lazy load page components for code splitting
const LocationTypesPage = lazy(() => import('../../app/(admin)/location-types/page').then(m => ({ default: m.default })));

export const LocationTypesModule: Module = {
  id: 'location-types',
  name: 'Location Types',
  description: 'Manage location type definitions and custom fields',
  icon: <MapPin className="w-4 h-4" />,
  category: 'Master Data',
  order: 30,
  
  routes: [
    {
      path: '/platform/location-types',
      element: <LocationTypesPage />,
    },
  ],
  
  menuItems: [
    {
      id: 'location-types',
      label: 'Location Types',
      icon: <MapPin className="w-5 h-5" />,
      path: '/platform/location-types',
      category: 'Master Data',
      order: 30,
      permission: 'location_types.view',
    },
  ],
};

export default LocationTypesModule;