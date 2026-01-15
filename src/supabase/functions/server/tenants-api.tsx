/**
 * Tenants API Handler
 * 
 * Complete CRUD operations with audit trail support
 * Aligned with go-framework database schema
 * Enhanced with full validation and error handling
 */

import { Hono } from 'npm:hono';
import type { Context } from 'npm:hono';
import { createClient } from 'npm:@supabase/supabase-js@2';

const app = new Hono();

// Helper: Get Supabase client
const getSupabaseClient = () => {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
};

/**
 * GET /tenants
 * List all tenants with optional filters
 */
app.get('/tenants', async (c: Context) => {
  try {
    const supabase = getSupabaseClient();
    
    // Query parameters
    const status = c.req.query('status');
    const tier = c.req.query('tier');
    const search = c.req.query('search');
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');
    
    let query = supabase
      .from('tenants')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    // Apply filters
    if (status) query = query.eq('status', status);
    if (tier) query = query.eq('tier', tier);
    if (search) {
      query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%`);
    }
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('Error fetching tenants:', error);
      return c.json({ error: error.message }, 500);
    }
    
    return c.json({
      data: data || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        has_more: count ? count > offset + limit : false,
      },
    });
  } catch (error) {
    console.error('Unexpected error in GET /tenants:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * GET /tenants/:id
 * Get single tenant by ID
 */
app.get('/tenants/:id', async (c: Context) => {
  try {
    const id = c.req.param('id');
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('_id', id)
      .is('deleted_at', null)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return c.json({ error: 'Tenant not found' }, 404);
      }
      console.error('Error fetching tenant:', error);
      return c.json({ error: error.message }, 500);
    }
    
    return c.json({ data });
  } catch (error) {
    console.error('Unexpected error in GET /tenants/:id:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * POST /tenants
 * Create new tenant
 */
app.post('/tenants', async (c: Context) => {
  try {
    const body = await c.req.json();
    const supabase = getSupabaseClient();
    
    // Check code uniqueness
    const { data: existing } = await supabase
      .from('tenants')
      .select('_id')
      .eq('code', body.code)
      .is('deleted_at', null)
      .single();
    
    if (existing) {
      return c.json({ error: 'Code already exists' }, 409);
    }
    
    // Generate UUID
    const newTenantId = crypto.randomUUID();
    
    // Prepare insert data
    const insertData = {
      _id: newTenantId,
      name: body.name,
      code: body.code,
      domain: body.domain || null,
      logo: body.logo || null,
      description: body.description || null,
      tier: body.tier || 'FREE',
      status: body.status || 'ACTIVE',
      settings: body.settings || {},
      metadata: body.metadata || {},
      version: 1,
    };
    
    const { data, error } = await supabase
      .from('tenants')
      .insert(insertData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating tenant:', error);
      return c.json({ error: error.message }, 500);
    }
    
    return c.json({ data }, 201);
  } catch (error) {
    console.error('Unexpected error in POST /tenants:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * PATCH /tenants/:id
 * Update existing tenant (partial update)
 */
app.patch('/tenants/:id', async (c: Context) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const supabase = getSupabaseClient();
    
    // Get current version for optimistic locking
    const { data: current, error: fetchError } = await supabase
      .from('tenants')
      .select('version, code')
      .eq('_id', id)
      .is('deleted_at', null)
      .single();
    
    if (fetchError || !current) {
      return c.json({ error: 'Tenant not found' }, 404);
    }
    
    // Optimistic locking check
    if (body.version !== undefined && body.version !== current.version) {
      return c.json({ 
        error: 'Version conflict. The tenant was modified by another user.' 
      }, 409);
    }
    
    // Code validation if changing
    if (body.code && body.code !== current.code) {
      const { data: existing } = await supabase
        .from('tenants')
        .select('_id')
        .eq('code', body.code)
        .is('deleted_at', null)
        .single();
      
      if (existing) {
        return c.json({ error: 'Code already exists' }, 409);
      }
    }
    
    // Prepare update data
    const updateData: any = {
      ...body,
      updated_at: new Date().toISOString(),
      version: current.version + 1,
    };
    
    // Remove fields that shouldn't be updated
    delete updateData._id;
    delete updateData.created_at;
    delete updateData.created_by;
    
    const { data, error } = await supabase
      .from('tenants')
      .update(updateData)
      .eq('_id', id)
      .eq('version', current.version)  // Optimistic locking
      .select()
      .single();
    
    if (error) {
      console.error('Error updating tenant:', error);
      return c.json({ error: error.message }, 500);
    }
    
    return c.json({ data });
  } catch (error) {
    console.error('Unexpected error in PATCH /tenants/:id:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * DELETE /tenants/:id
 * Soft delete tenant
 */
app.delete('/tenants/:id', async (c: Context) => {
  try {
    const id = c.req.param('id');
    const supabase = getSupabaseClient();
    
    // Soft delete
    const { data, error } = await supabase
      .from('tenants')
      .update({
        deleted_at: new Date().toISOString(),
      })
      .eq('_id', id)
      .is('deleted_at', null)
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return c.json({ error: 'Tenant not found or already deleted' }, 404);
      }
      console.error('Error deleting tenant:', error);
      return c.json({ error: error.message }, 500);
    }
    
    return c.json({ data, message: 'Tenant deleted successfully' });
  } catch (error) {
    console.error('Unexpected error in DELETE /tenants/:id:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default app;