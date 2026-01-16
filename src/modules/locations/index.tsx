/**
 * Locations Module
 * Manages location data across the system
 * ✅ CREATED 2026-01-15: Complete module definition
 */

import { MapPin } from 'lucide-react';
import LocationsPage from '../../pages/LocationsPage';
import type { ModuleDefinition } from '../../core/ModuleRegistry';

export const LocationsModule: ModuleDefinition = {
  id: 'locations',
  name: 'Locations',
  description: 'Manage locations and their hierarchies',
  icon: MapPin,
  category: 'Infrastructure',
  order: 55,

  routes: [
    {
      path: '/core/locations',
      element: <LocationsPage />,
    },
  ],

  menuItems: [
    {
      id: 'locations',
      label: 'locations.menu',
      icon: MapPin,
      path: '/core/locations',
      category: 'Infrastructure',
      order: 55,
    },
  ],
};

export default LocationsModule;
