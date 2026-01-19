/**
 * Locations Module
 * Manages location data across the system
 * 
 * 🌐 Path: /platform/locations
 * ✅ UPDATED: Vietnamese paths
 */

import { MapPin } from 'lucide-react';
import LocationsPage from '../../pages/LocationsPage';
import type { ModuleDefinition } from '../../core/ModuleRegistry';

export const LocationsModule: ModuleDefinition = {
  id: 'locations',
  name: 'Locations',
  description: 'Manage locations and their hierarchies',
  icon: MapPin,
  showInSidebar: false,
  category: 'Infrastructure',
  order: 55,

  routes: [
    {
      path: '/platform/locations',
      element: <LocationsPage />,
    },
  ],
};

export default LocationsModule;