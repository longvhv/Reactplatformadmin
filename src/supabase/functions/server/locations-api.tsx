/**
 * Locations API Handler
 * 
 * Complete CRUD operations for locations with Supabase integration
 * Aligned with go-framework database schema
 * Under 500 lines
 */

import { Hono } from 'npm:hono';
import type { Context } from 'npm:hono';
import { createClient } from 'npm:@supabase/supabase-js@2';

const app = new Hono();

// ============================================
// TYPES & INTERFACES
// ============================================

export interface Location {
  _id: string;
  tenant_id: string;
  code: string;
  name: string;
  location_type: LocationType;
  status: LocationStatus;
  
  // Address
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state_province?: string;
  postal_code?: string;
  country?: string;
  
  // Contact
  phone?: string;
  email?: string;
  fax?: string;
  
  // Geographic
  latitude?: number;
  longitude?: number;
  timezone?: string;
  
  // Business
  manager_id?: string;
  parent_location_id?: string;
  is_primary: boolean;
  is_warehouse: boolean;
  is_retail: boolean;
  
  // Operational
  area_sqm?: number;
  capacity?: number;
  opening_hours?: Record<string, string>;
  
  // Metadata
  description?: string;
  order?: number;
  metadata?: Record<string, any>;
  
  // Audit
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  created_by?: string;
  updated_by?: string;
  deleted_by?: string;
  version: number;
}

export type LocationType = 
  | 'OFFICE' 
  | 'WAREHOUSE' 
  | 'RETAIL' 
  | 'FACTORY' 
  | 'BRANCH' 
  | 'HEADQUARTERS' 
  | 'DATACENTER' 
  | 'OTHER';

export type LocationStatus = 
  | 'ACTIVE' 
  | 'INACTIVE' 
  | 'CLOSED' 
  | 'MAINTENANCE' 
  | 'PLANNED';

interface CreateLocationInput {
  tenant_id: string;
  code: string;
  name: string;
  location_type?: LocationType;
  status?: LocationStatus;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state_province?: string;
  postal_code?: string;
  country?: string;
  phone?: string;
  email?: string;
  fax?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  manager_id?: string;
  parent_location_id?: string;
  is_primary?: boolean;
  is_warehouse?: boolean;
  is_retail?: boolean;
  area_sqm?: number;
  capacity?: number;
  opening_hours?: Record<string, string>;
  description?: string;
  order?: number;
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
  
  if ('code' in input && (!input.code || !/^[a-z0-9-]+$/i.test(input.code))) {
    errors.push('code: Must contain only letters, numbers, and hyphens');
  }
  
  if ('name' in input && (!input.name || input.name.trim().length === 0)) {
    errors.push('name: Required field');
  }
  
  if ('email' in input && input.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
    errors.push('email: Invalid email format');
  }
  
  if ('latitude' in input && input.latitude !== undefined) {
    if (input.latitude < -90 || input.latitude > 90) {
      errors.push('latitude: Must be between -90 and 90');
    }
  }
  
  if ('longitude' in input && input.longitude !== undefined) {
    if (input.longitude < -180 || input.longitude > 180) {
      errors.push('longitude: Must be between -180 and 180');
    }
  }
  
  return errors;
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
    const location_type = c.req.query('location_type');
    const status = c.req.query('status');
    const country = c.req.query('country');
    const is_primary = c.req.query('is_primary');
    const search = c.req.query('search');
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');
    
    let query = supabase
      .from('locations')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)
      .order('order', { ascending: true })
      .range(offset, offset + limit - 1);
    
    // Apply filters
    if (tenant_id) query = query.eq('tenant_id', tenant_id);
    if (location_type) query = query.eq('location_type', location_type);
    if (status) query = query.eq('status', status);
    if (country) query = query.eq('country', country);
    if (is_primary) query = query.eq('is_primary', is_primary === 'true');
    if (search) {
      query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%,city.ilike.%${search}%`);
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
    
    return c.json({
      data: data || [],
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
    
    return c.json({ data });
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
    
    // Prepare insert data with UUID
    const insertData = {
      _id: crypto.randomUUID(), // Generate UUID for primary key
      tenant_id: body.tenant_id,
      code: body.code,
      name: body.name,
      location_type: body.location_type || 'OFFICE',
      status: body.status || 'ACTIVE',
      address_line1: body.address_line1,
      address_line2: body.address_line2,
      city: body.city,
      state_province: body.state_province,
      postal_code: body.postal_code,
      country: body.country,
      phone: body.phone,
      email: body.email,
      fax: body.fax,
      latitude: body.latitude,
      longitude: body.longitude,
      timezone: body.timezone,
      manager_id: body.manager_id,
      parent_location_id: body.parent_location_id,
      is_primary: body.is_primary || false,
      is_warehouse: body.is_warehouse || false,
      is_retail: body.is_retail || false,
      area_sqm: body.area_sqm,
      capacity: body.capacity,
      opening_hours: body.opening_hours || {},
      description: body.description,
      order: body.order || 0,
      metadata: body.metadata || {},
      version: 1,
    };
    
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
        return c.json({ error: 'Location with this code already exists' }, 409);
      }
      return c.json({ error: error.message, details: error }, 500);
    }
    
    return c.json({ data }, 201);
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
    const updateData = {
      ...updateFields,
      version: version + 1,
    };
    
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
        return c.json({ error: 'Location with this code already exists' }, 409);
      }
      return c.json({ error: error.message }, 500);
    }
    
    return c.json({ data });
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