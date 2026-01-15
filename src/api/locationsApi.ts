/**
 * Locations API Client
 * Uses Adapter pattern - Ready for Golang migration
 * 
 * ✅ CREATED 2026-01-14: 100% matches locations schema (18 fields)
 * ⚠️ CRITICAL FIX: type_id is UUID FK (not hardcoded enum), status is string (not boolean)
 * ⚠️ CRITICAL FIX: address is jsonb (not separate strings), coordinates is POINT (not separate lat/long)
 */

import { createAdapter, BaseFilters } from './adapters';

// ==================== TYPES ====================

/**
 * Location Status - 3 values from database
 */
export type LocationStatus = 'ACTIVE' | 'INACTIVE' | 'CLOSED';

/**
 * Address structure (stored in jsonb)
 */
export interface LocationAddress {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  [key: string]: any;  // Allow additional fields
}

/**
 * Coordinates (stored as POINT in database)
 */
export interface LocationCoordinates {
  longitude: number;  // POINT format: (longitude, latitude)
  latitude: number;
}

/**
 * Location - 100% matches locations table (18 fields)
 */
export interface Location {
  // Identity & Structure (4)
  _id: string;
  tenant_id: string;
  parent_id?: string;            // FK to locations (self-reference)
  type_id: string;               // ⚠️ UUID FK to location_types! NOT hardcoded enum!
  
  // Basic Info (4)
  name: string;                  // text not null
  code?: string;                 // varchar(50) - Unique per tenant
  path?: string;                 // text - Materialized Path: /root_id/parent_id/this_id/
  status: LocationStatus;        // ⚠️ varchar(20) with 3 values! NOT is_active boolean!
  
  // Geography & Timekeeping (4)
  address: LocationAddress;      // ⚠️ jsonb default '{}'! NOT separate string fields!
  coordinates?: LocationCoordinates;  // ⚠️ POINT! NOT separate latitude/longitude!
  radius_meters?: number;        // int default 100 - Geofencing radius
  timezone: string;              // varchar(50) default 'UTC'
  is_headquarter: boolean;       // boolean default false - Is main HQ
  
  // Dynamic Data (1)
  metadata: Record<string, any>; // jsonb default '{}' - Store extra_fields values
  
  // Audit (5)
  created_at: string;            // timestamptz not null
  updated_at: string;            // timestamptz not null
  deleted_at?: string;           // timestamptz - Soft delete
  version: number;               // bigint not null default 1
}

/**
 * Create Location Request
 */
export interface CreateLocationRequest {
  tenant_id: string;
  parent_id?: string;
  type_id: string;               // UUID FK to location_types!
  name: string;
  code?: string;
  status?: LocationStatus;       // Default 'ACTIVE'
  address?: LocationAddress;     // jsonb
  coordinates?: LocationCoordinates;  // POINT
  radius_meters?: number;        // Default 100
  timezone?: string;             // Default 'UTC'
  is_headquarter?: boolean;      // Default false
  metadata?: Record<string, any>;
}

/**
 * Update Location Request
 */
export interface UpdateLocationRequest {
  parent_id?: string;
  type_id?: string;
  name?: string;
  code?: string;
  status?: LocationStatus;
  address?: LocationAddress;
  coordinates?: LocationCoordinates;
  radius_meters?: number;
  timezone?: string;
  is_headquarter?: boolean;
  metadata?: Record<string, any>;
}

/**
 * Location Filters
 */
export interface LocationFilters extends BaseFilters {
  tenant_id?: string;
  parent_id?: string;
  type_id?: string;
  status?: LocationStatus;
  is_headquarter?: boolean;
  include_deleted?: boolean;
  with_children?: boolean;       // Include child locations
}

/**
 * Location with type and parent data
 */
export interface LocationWithRelations extends Location {
  type?: {
    _id: string;
    code: string;
    name: string;
  };
  parent?: {
    _id: string;
    name: string;
    code?: string;
  };
  children?: Location[];
  depth?: number;
}

/**
 * Location Statistics
 */
export interface LocationStats {
  total: number;
  by_status: {
    ACTIVE: number;
    INACTIVE: number;
    CLOSED: number;
  };
  by_type: Record<string, number>;
  headquarters: number;
  with_parent: number;
  root_locations: number;
  with_coordinates: number;
  with_geofence: number;
  avg_radius_meters: number;
}

// ==================== ADAPTER ====================

const adapter = createAdapter<Location, CreateLocationRequest, UpdateLocationRequest>(
  'locations',
  '/locations'
);

// ==================== API CLIENT ====================

export const locationsApi = {
  /**
   * GET /locations
   */
  getAll: async (filters?: LocationFilters): Promise<Location[]> => {
    return adapter.getAll(filters);
  },

  /**
   * GET /locations/:id
   */
  getById: async (id: string): Promise<Location> => {
    return adapter.getById(id);
  },

  /**
   * POST /locations
   */
  create: async (data: CreateLocationRequest): Promise<Location> => {
    // Validate name
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Name is required');
    }
    
    // Validate type_id
    if (!data.type_id) {
      throw new Error('Type ID is required');
    }
    
    // Validate coordinates if provided
    if (data.coordinates) {
      validateCoordinates(data.coordinates);
    }
    
    // Validate radius
    if (data.radius_meters !== undefined && data.radius_meters <= 0) {
      throw new Error('Radius must be greater than 0');
    }
    
    return adapter.create(data);
  },

  /**
   * PATCH /locations/:id
   */
  update: async (id: string, data: UpdateLocationRequest): Promise<Location> => {
    // Validate coordinates if provided
    if (data.coordinates) {
      validateCoordinates(data.coordinates);
    }
    
    // Validate radius
    if (data.radius_meters !== undefined && data.radius_meters <= 0) {
      throw new Error('Radius must be greater than 0');
    }
    
    return adapter.update(id, data);
  },

  /**
   * DELETE /locations/:id (Soft delete)
   */
  delete: async (id: string): Promise<void> => {
    return adapter.delete(id);
  },

  /**
   * Get locations by tenant
   */
  getByTenant: async (tenantId: string, filters?: LocationFilters): Promise<Location[]> => {
    return adapter.getAll({
      ...filters,
      tenant_id: tenantId,
    });
  },

  /**
   * Get locations by type
   */
  getByType: async (typeId: string, filters?: LocationFilters): Promise<Location[]> => {
    return adapter.getAll({
      ...filters,
      type_id: typeId,
    });
  },

  /**
   * Get root locations (no parent)
   */
  getRootLocations: async (tenantId: string): Promise<Location[]> => {
    const locations = await adapter.getAll({ tenant_id: tenantId });
    return locations.filter(l => !l.parent_id);
  },

  /**
   * Get child locations
   */
  getChildren: async (parentId: string): Promise<Location[]> => {
    return adapter.getAll({ parent_id: parentId });
  },

  /**
   * Get headquarters
   */
  getHeadquarters: async (tenantId: string): Promise<Location | null> => {
    const locations = await adapter.getAll({
      tenant_id: tenantId,
      is_headquarter: true,
    });
    return locations.length > 0 ? locations[0] : null;
  },

  /**
   * Get active locations
   */
  getActive: async (tenantId: string): Promise<Location[]> => {
    return adapter.getAll({
      tenant_id: tenantId,
      status: 'ACTIVE',
    });
  },

  /**
   * Build location tree
   */
  buildTree: async (tenantId: string): Promise<LocationWithRelations[]> => {
    const locations = await locationsApi.getByTenant(tenantId);
    return buildLocationTree(locations);
  },

  /**
   * Get location path (breadcrumb)
   */
  getPath: async (id: string): Promise<Location[]> => {
    const location = await adapter.getById(id);
    
    if (!location.path) {
      return [location];
    }
    
    // Parse path: /root_id/parent_id/this_id/
    const ids = location.path.split('/').filter(Boolean);
    
    // Fetch all locations in path
    const pathLocations = await Promise.all(
      ids.slice(0, -1).map(id => adapter.getById(id))
    );
    
    return [...pathLocations, location];
  },

  /**
   * Get statistics
   */
  getStats: async (filters?: LocationFilters): Promise<LocationStats> => {
    const locations = await adapter.getAll(filters);
    
    const stats: LocationStats = {
      total: locations.length,
      by_status: {
        ACTIVE: locations.filter(l => l.status === 'ACTIVE').length,
        INACTIVE: locations.filter(l => l.status === 'INACTIVE').length,
        CLOSED: locations.filter(l => l.status === 'CLOSED').length,
      },
      by_type: {},
      headquarters: locations.filter(l => l.is_headquarter).length,
      with_parent: locations.filter(l => l.parent_id).length,
      root_locations: locations.filter(l => !l.parent_id).length,
      with_coordinates: locations.filter(l => l.coordinates).length,
      with_geofence: locations.filter(l => l.radius_meters && l.radius_meters > 0).length,
      avg_radius_meters: 0,
    };
    
    // Count by type
    locations.forEach(l => {
      stats.by_type[l.type_id] = (stats.by_type[l.type_id] || 0) + 1;
    });
    
    // Calculate average radius
    const withRadius = locations.filter(l => l.radius_meters);
    if (withRadius.length > 0) {
      stats.avg_radius_meters = Math.round(
        withRadius.reduce((sum, l) => sum + (l.radius_meters || 0), 0) / withRadius.length
      );
    }
    
    return stats;
  },

  /**
   * Set as headquarters
   */
  setAsHeadquarters: async (id: string): Promise<Location> => {
    const location = await adapter.getById(id);
    
    // Unset other headquarters for this tenant
    const currentHQ = await locationsApi.getHeadquarters(location.tenant_id);
    if (currentHQ && currentHQ._id !== id) {
      await adapter.update(currentHQ._id, { is_headquarter: false });
    }
    
    return adapter.update(id, { is_headquarter: true });
  },

  /**
   * Move location (change parent)
   */
  move: async (id: string, newParentId?: string): Promise<Location> => {
    // Validate not moving to self
    if (newParentId === id) {
      throw new Error('Cannot move location to itself');
    }
    
    // Validate not moving to own child (would create circular reference)
    if (newParentId) {
      const children = await locationsApi.getChildren(id);
      const childIds = new Set(children.map(c => c._id));
      if (childIds.has(newParentId)) {
        throw new Error('Cannot move location to its own child');
      }
    }
    
    return adapter.update(id, { parent_id: newParentId });
  },

  /**
   * Update path (materialized path)
   */
  updatePath: async (id: string): Promise<Location> => {
    const location = await adapter.getById(id);
    
    let newPath = `/${location._id}/`;
    
    if (location.parent_id) {
      const parent = await adapter.getById(location.parent_id);
      newPath = `${parent.path || '/'}${parent._id}/${location._id}/`;
    }
    
    return adapter.update(id, { path: newPath });
  },

  /**
   * Activate location
   */
  activate: async (id: string): Promise<Location> => {
    return adapter.update(id, { status: 'ACTIVE' });
  },

  /**
   * Deactivate location
   */
  deactivate: async (id: string): Promise<Location> => {
    return adapter.update(id, { status: 'INACTIVE' });
  },

  /**
   * Close location
   */
  close: async (id: string): Promise<Location> => {
    return adapter.update(id, { status: 'CLOSED' });
  },

  /**
   * Check if point is within location geofence
   */
  isWithinGeofence: (
    location: Location,
    point: { latitude: number; longitude: number }
  ): boolean => {
    if (!location.coordinates || !location.radius_meters) {
      return false;
    }
    
    const distance = calculateDistance(
      location.coordinates.latitude,
      location.coordinates.longitude,
      point.latitude,
      point.longitude
    );
    
    return distance <= location.radius_meters;
  },

  /**
   * Find nearest location
   */
  findNearest: async (
    tenantId: string,
    point: { latitude: number; longitude: number }
  ): Promise<Location | null> => {
    const locations = await locationsApi.getActive(tenantId);
    const withCoordinates = locations.filter(l => l.coordinates);
    
    if (withCoordinates.length === 0) {
      return null;
    }
    
    let nearest = withCoordinates[0];
    let minDistance = calculateDistance(
      nearest.coordinates!.latitude,
      nearest.coordinates!.longitude,
      point.latitude,
      point.longitude
    );
    
    for (const location of withCoordinates.slice(1)) {
      const distance = calculateDistance(
        location.coordinates!.latitude,
        location.coordinates!.longitude,
        point.latitude,
        point.longitude
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        nearest = location;
      }
    }
    
    return nearest;
  },

  /**
   * Bulk operations
   */
  bulkActivate: async (ids: string[]): Promise<void> => {
    await Promise.all(ids.map(id => locationsApi.activate(id)));
  },

  bulkDeactivate: async (ids: string[]): Promise<void> => {
    await Promise.all(ids.map(id => locationsApi.deactivate(id)));
  },

  bulkDelete: async (ids: string[]): Promise<void> => {
    await Promise.all(ids.map(id => adapter.delete(id)));
  },
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Validate coordinates
 */
function validateCoordinates(coords: LocationCoordinates): void {
  if (coords.latitude < -90 || coords.latitude > 90) {
    throw new Error('Latitude must be between -90 and 90');
  }
  
  if (coords.longitude < -180 || coords.longitude > 180) {
    throw new Error('Longitude must be between -180 and 180');
  }
}

/**
 * Calculate distance between two points (Haversine formula)
 * Returns distance in meters
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Build location tree from flat list
 */
function buildLocationTree(locations: Location[]): LocationWithRelations[] {
  const map = new Map<string, LocationWithRelations>();
  const roots: LocationWithRelations[] = [];

  // Create map
  locations.forEach((loc) => {
    map.set(loc._id, { ...loc, children: [], depth: 0 });
  });

  // Build tree
  locations.forEach((loc) => {
    const node = map.get(loc._id)!;
    if (loc.parent_id) {
      const parent = map.get(loc.parent_id);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(node);
        node.depth = (parent.depth || 0) + 1;
      } else {
        // Parent not found, treat as root
        roots.push(node);
      }
    } else {
      roots.push(node);
    }
  });

  return roots;
}

/**
 * Get status color for UI
 */
export function getStatusColor(status: LocationStatus): string {
  const colors = {
    ACTIVE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    INACTIVE: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
    CLOSED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };
  return colors[status];
}

/**
 * Format address for display
 */
export function formatAddress(address: LocationAddress): string {
  const parts = [
    address.line1,
    address.line2,
    address.city,
    address.state,
    address.postal_code,
    address.country,
  ].filter(Boolean);
  
  return parts.join(', ');
}

/**
 * Format coordinates for display
 */
export function formatCoordinates(coords?: LocationCoordinates): string {
  if (!coords) return '-';
  return `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`;
}

/**
 * Get timezone offset
 */
export function getTimezoneOffset(timezone: string): string {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short',
    });
    const parts = formatter.formatToParts(now);
    const tzPart = parts.find(p => p.type === 'timeZoneName');
    return tzPart?.value || timezone;
  } catch {
    return timezone;
  }
}

export default locationsApi;
