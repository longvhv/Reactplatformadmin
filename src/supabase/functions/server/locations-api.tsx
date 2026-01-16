/**
 * Locations API Handler
 * 
 * ✅ UPDATED 2026-01-15: Aligned with NEW database schema (18 fields)
 * ⚠️ BREAKING CHANGES:
 *   - type_id (UUID FK) replaces location_type (enum)
 *   - address (jsonb) replaces separate address fields
 *   - coordinates (POINT) replaces latitude/longitude
 *   - Added: parent_id, path, radius_meters, timezone, is_headquarter
 *   - Removed: phone, email, fax, manager_id, is_primary, is_warehouse, is_retail, 
 *              area_sqm, capacity, opening_hours, description, order
 * 
 * Complete CRUD operations for locations with Supabase integration
 * Under 500 lines - SonarQube compliant
 */

import { Hono } from 'npm:hono';
import type { Context } from 'npm:hono';
import { createClient } from 'npm:@supabase/supabase-js@2';

const app = new Hono();

// ============================================
// TYPES & INTERFACES
// ============================================

export type LocationStatus = 'ACTIVE' | 'INACTIVE' | 'CLOSED';

export interface LocationAddress {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  [key: string]: any;
}

export interface LocationCoordinates {
  longitude: number;  // POINT format: (longitude, latitude)
  latitude: number;
}

/**
 * Location - 100% matches NEW database schema (18 fields)
 */
export interface Location {
  // Identity & Structure (4)
  _id: string;
  tenant_id: string;
  parent_id?: string;            // FK to locations (self-reference)
  type_id: string;               // UUID FK to location_types
  
  // Basic Info (4)
  name: string;                  // text not null
  code?: string;                 // varchar(50)
  path?: string;                 // Materialized path
  status: LocationStatus;        // varchar(20)
  
  // Geography & Timekeeping (5)
  address: LocationAddress;      // jsonb default '{}'
  coordinates?: LocationCoordinates;  // POINT
  radius_meters?: number;        // int default 100
  timezone: string;              // varchar(50) default 'UTC'
  is_headquarter: boolean;       // boolean default false
  
  // Dynamic Data (1)
  metadata: Record<string, any>; // jsonb default '{}'
  
  // Audit (4)
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  version: number;
}

interface CreateLocationInput {
  tenant_id: string;
  parent_id?: string;
  type_id: string;               // UUID FK!
  name: string;
  code?: string;
  status?: LocationStatus;
  address?: LocationAddress;
  coordinates?: LocationCoordinates;
  radius_meters?: number;
  timezone?: string;
  is_headquarter?: boolean;
  metadata?: Record<string, any>;
}

interface UpdateLocationInput extends Partial<CreateLocationInput> {
  version: number;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

const getSupabaseClient = () => {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
};

const validateLocationInput = (input: Partial<CreateLocationInput>): string[] => {
  const errors: string[] = [];
  
  if ('name' in input && (!input.name || input.name.trim().length === 0)) {
    errors.push('name: Required field');
  }
  
  if ('code' in input && input.code && !/^[a-z0-9-]+$/i.test(input.code)) {
    errors.push('code: Must contain only letters, numbers, and hyphens');
  }
  
  if ('status' in input && input.status) {
    if (!['ACTIVE', 'INACTIVE', 'CLOSED'].includes(input.status)) {
      errors.push('status: Must be ACTIVE, INACTIVE, or CLOSED');
    }
  }
  
  if ('radius_meters' in input && input.radius_meters !== undefined) {
    if (input.radius_meters <= 0) {
      errors.push('radius_meters: Must be greater than 0');
    }
  }
  
  if ('coordinates' in input && input.coordinates) {
    const { latitude, longitude } = input.coordinates;
    if (latitude < -90 || latitude > 90) {
      errors.push('coordinates.latitude: Must be between -90 and 90');
    }
    if (longitude < -180 || longitude > 180) {
      errors.push('coordinates.longitude: Must be between -180 and 180');
    }
  }
  
  return errors;
};

/**
 * Convert LocationCoordinates to PostGIS POINT string
 * Format: POINT(longitude latitude)
 */
const coordinatesToPoint = (coords: LocationCoordinates): string => {
  return `POINT(${coords.longitude} ${coords.latitude})`;
};

/**
 * Parse PostGIS POINT to LocationCoordinates
 * Input: "(longitude,latitude)" or "POINT(longitude latitude)"
 */
const pointToCoordinates = (point: any): LocationCoordinates | undefined => {
  if (!point) return undefined;
  
  // PostGIS returns as object with x, y
  if (typeof point === 'object' && 'x' in point && 'y' in point) {
    return {
      longitude: point.x,
      latitude: point.y
    };
  }
  
  // String format: "(x,y)" or "POINT(x y)"
  if (typeof point === 'string') {
    const matches = point.match(/\(([^,\s]+)[,\s]+([^)]+)\)/);
    if (matches) {
      return {
        longitude: parseFloat(matches[1]),
        latitude: parseFloat(matches[2])
      };
    }
  }
  
  return undefined;
};

// ============================================
// API ENDPOINTS
// ============================================

/**
 * GET /locations
 * List all locations with optional filters
 */
app.get('/locations', async (c: Context) => {
  try {
    const supabase = getSupabaseClient();
    
    // Query parameters
    const tenant_id = c.req.query('tenant_id');
    const type_id = c.req.query('type_id');
    const parent_id = c.req.query('parent_id');
    const status = c.req.query('status');
    const is_headquarter = c.req.query('is_headquarter');
    const search = c.req.query('search');
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');
    
    let query = supabase
      .from('locations')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1);
    
    // Apply filters
    if (tenant_id) query = query.eq('tenant_id', tenant_id);
    if (type_id) query = query.eq('type_id', type_id);
    if (parent_id) query = query.eq('parent_id', parent_id);
    if (status) query = query.eq('status', status);
    if (is_headquarter) query = query.eq('is_headquarter', is_headquarter === 'true');
    if (search) {
      query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%`);
    }
    
    const { data, error, count } = await query;
    
    if (error) {
      // Handle table not exists
      if (error.code === 'PGRST204' || error.code === 'PGRST205' || error.code === '42P01') {
        console.log('⚠️ Table locations does not exist yet.');
        return c.json({ 
          data: [], 
          pagination: { total: 0, limit, offset, hasMore: false } 
        });
      }
      console.error('Error fetching locations:', error);
      return c.json({ error: error.message }, 500);
    }
    
    // Convert coordinates from POINT to object
    const locations = (data || []).map(loc => ({
      ...loc,
      coordinates: pointToCoordinates(loc.coordinates)
    }));
    
    return c.json({
      data: locations,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    });
  } catch (err) {
    console.error('Unexpected error in GET /locations:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * GET /locations/:id
 * Get a single location by ID
 */
app.get('/locations/:id', async (c: Context) => {
  try {
    const id = c.req.param('id');
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('_id', id)
      .is('deleted_at', null)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return c.json({ error: 'Location not found' }, 404);
      }
      console.error('Error fetching location:', error);
      return c.json({ error: error.message }, 500);
    }
    
    // Convert coordinates
    const location = {
      ...data,
      coordinates: pointToCoordinates(data.coordinates)
    };
    
    return c.json({ data: location });
  } catch (err) {
    console.error('Unexpected error in GET /locations/:id:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * POST /locations
 * Create a new location
 */
app.post('/locations', async (c: Context) => {
  try {
    const body: CreateLocationInput = await c.req.json();
    
    // Validation
    const errors = validateLocationInput(body);
    if (errors.length > 0) {
      return c.json({ error: 'Validation failed', details: errors }, 400);
    }
    
    const supabase = getSupabaseClient();
    
    // Prepare insert data
    const insertData: any = {
      _id: crypto.randomUUID(),
      tenant_id: body.tenant_id,
      type_id: body.type_id,
      parent_id: body.parent_id || null,
      name: body.name,
      code: body.code || null,
      path: body.parent_id ? null : `/${crypto.randomUUID()}/`, // Will be calculated by trigger
      status: body.status || 'ACTIVE',
      address: body.address || {},
      radius_meters: body.radius_meters || 100,
      timezone: body.timezone || 'UTC',
      is_headquarter: body.is_headquarter || false,
      metadata: body.metadata || {},
      version: 1,
    };
    
    // Handle coordinates (convert to POINT)
    if (body.coordinates) {
      insertData.coordinates = coordinatesToPoint(body.coordinates);
    }
    
    const { data, error } = await supabase
      .from('locations')
      .insert(insertData)
      .select()
      .single();
    
    if (error) {
      // Handle table not exists
      if (error.code === 'PGRST204' || error.code === 'PGRST205' || error.code === '42P01') {
        console.log('⚠️ Table locations does not exist yet.');
        return c.json({ 
          error: 'Table locations is not available. Please use KV store for prototyping.',
          code: 'TABLE_NOT_FOUND'
        }, 503);
      }
      console.error('Error creating location:', error);
      if (error.code === '23505') { // Unique violation
        return c.json({ error: 'Location with this code already exists for this tenant' }, 409);
      }
      if (error.code === '23503') { // FK violation
        return c.json({ error: 'Invalid tenant_id, type_id, or parent_id' }, 400);
      }
      return c.json({ error: error.message, details: error }, 500);
    }
    
    // Convert coordinates
    const location = {
      ...data,
      coordinates: pointToCoordinates(data.coordinates)
    };
    
    return c.json({ data: location }, 201);
  } catch (err) {
    console.error('Unexpected error in POST /locations:', err);
    return c.json({ error: 'Internal server error', details: String(err) }, 500);
  }
});

/**
 * PATCH /locations/:id
 * Update an existing location
 */
app.patch('/locations/:id', async (c: Context) => {
  try {
    const id = c.req.param('id');
    const body: UpdateLocationInput = await c.req.json();
    
    if (!body.version) {
      return c.json({ error: 'version field is required for optimistic locking' }, 400);
    }
    
    // Validation
    const errors = validateLocationInput(body);
    if (errors.length > 0) {
      return c.json({ error: 'Validation failed', details: errors }, 400);
    }
    
    const supabase = getSupabaseClient();
    
    // Check current version
    const { data: current, error: fetchError } = await supabase
      .from('locations')
      .select('version')
      .eq('_id', id)
      .is('deleted_at', null)
      .single();
    
    if (fetchError || !current) {
      return c.json({ error: 'Location not found' }, 404);
    }
    
    if (current.version !== body.version) {
      return c.json({ 
        error: 'Version mismatch - location was modified by another user',
        currentVersion: current.version,
        providedVersion: body.version
      }, 409);
    }
    
    // Prepare update data
    const { version, ...updateFields } = body;
    const updateData: any = {
      ...updateFields,
      version: version + 1,
    };
    
    // Handle coordinates (convert to POINT)
    if (updateFields.coordinates) {
      updateData.coordinates = coordinatesToPoint(updateFields.coordinates);
    }
    
    const { data, error } = await supabase
      .from('locations')
      .update(updateData)
      .eq('_id', id)
      .eq('version', version)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating location:', error);
      if (error.code === '23505') {
        return c.json({ error: 'Location with this code already exists for this tenant' }, 409);
      }
      if (error.code === '23503') {
        return c.json({ error: 'Invalid type_id or parent_id' }, 400);
      }
      return c.json({ error: error.message }, 500);
    }
    
    // Convert coordinates
    const location = {
      ...data,
      coordinates: pointToCoordinates(data.coordinates)
    };
    
    return c.json({ data: location });
  } catch (err) {
    console.error('Unexpected error in PATCH /locations/:id:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * DELETE /locations/:id
 * Soft delete a location
 */
app.delete('/locations/:id', async (c: Context) => {
  try {
    const id = c.req.param('id');
    const supabase = getSupabaseClient();
    
    // Check for children
    const { data: children, error: childError } = await supabase
      .from('locations')
      .select('_id')
      .eq('parent_id', id)
      .is('deleted_at', null);
    
    if (childError) {
      console.error('Error checking children:', childError);
      return c.json({ error: 'Failed to check for child locations' }, 500);
    }
    
    if (children && children.length > 0) {
      return c.json({ 
        error: 'Cannot delete location with children. Please delete or move child locations first.',
        children_count: children.length
      }, 400);
    }
    
    // Soft delete
    const { data, error } = await supabase
      .from('locations')
      .update({ 
        deleted_at: new Date().toISOString(),
      })
      .eq('_id', id)
      .is('deleted_at', null)
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return c.json({ error: 'Location not found or already deleted' }, 404);
      }
      console.error('Error deleting location:', error);
      return c.json({ error: error.message }, 500);
    }
    
    return c.json({ 
      message: 'Location deleted successfully',
      data 
    });
  } catch (err) {
    console.error('Unexpected error in DELETE /locations/:id:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default app;
