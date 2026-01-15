/**
 * Tenant App Routes API
 * Handles tenant app routing configuration
 */

import { Hono } from 'npm:hono';
import { createClient } from 'npm:@supabase/supabase-js';

const app = new Hono();

// Helper to get Supabase client
const getSupabaseClient = () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseKey);
};

/**
 * GET /tenant-app-routes
 * List all tenant app routes with filters
 */
app.get('/tenant-app-routes', async (c) => {
  try {
    const supabase = getSupabaseClient();
    const url = new URL(c.req.url);
    
    const tenant_id = url.searchParams.get('tenant_id');
    const app_code = url.searchParams.get('app_code');
    const route_scope = url.searchParams.get('route_scope');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    
    let query = supabase
      .from('tenant_app_routes')
      .select('*', { count: 'exact' })
      .is('deleted_at', null);
    
    if (tenant_id) {
      query = query.eq('tenant_id', tenant_id);
    }
    
    if (app_code) {
      query = query.eq('app_code', app_code);
    }
    
    if (route_scope) {
      query = query.eq('route_scope', route_scope);
    }
    
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    const { data, error, count } = await query;
    
    if (error) {
      // Handle table not exists
      if (error.code === 'PGRST204' || error.code === 'PGRST205' || error.code === '42P01') {
        console.log('⚠️ Table tenant_app_routes does not exist yet.');
        return c.json({ 
          data: [], 
          pagination: { total: 0, limit, offset, hasMore: false } 
        });
      }
      console.error('Error fetching tenant app routes:', error);
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
    console.error('Unexpected error in GET /tenant-app-routes:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * GET /tenant-app-routes/:id
 * Get a single tenant app route by ID
 */
app.get('/tenant-app-routes/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('tenant_app_routes')
      .select('*')
      .eq('_id', id)
      .is('deleted_at', null)
      .single();
    
    if (error) {
      // Handle table not exists
      if (error.code === 'PGRST204' || error.code === 'PGRST205' || error.code === '42P01') {
        return c.json({ 
          error: 'Table tenant_app_routes is not available.',
          code: 'TABLE_NOT_FOUND'
        }, 503);
      }
      
      if (error.code === 'PGRST116') {
        return c.json({ error: 'Tenant app route not found' }, 404);
      }
      
      console.error('Error fetching tenant app route:', error);
      return c.json({ error: error.message }, 500);
    }
    
    return c.json({ data });
  } catch (err) {
    console.error('Unexpected error in GET /tenant-app-routes/:id:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * POST /tenant-app-routes
 * Create a new tenant app route
 */
app.post('/tenant-app-routes', async (c) => {
  try {
    const body = await c.req.json();
    const supabase = getSupabaseClient();
    
    // Validate required fields
    if (!body.tenant_id || !body.app_code || !body.path_prefix || !body.route_scope) {
      return c.json({ 
        error: 'Missing required fields: tenant_id, app_code, path_prefix, route_scope' 
      }, 400);
    }
    
    // Generate UUID for _id
    const _id = crypto.randomUUID();
    
    const insertData = {
      _id,
      tenant_id: body.tenant_id,
      app_code: body.app_code,
      route_scope: body.route_scope,
      domain: body.domain || null,
      path_prefix: body.path_prefix,
      is_default: body.is_default || false,
      is_https_only: body.is_https_only || false,
      ssl_status: body.ssl_status || 'NONE',
      status: body.status || 'ACTIVE',
      metadata: body.metadata || {},
      version: 1,
    };
    
    const { data, error } = await supabase
      .from('tenant_app_routes')
      .insert(insertData)
      .select()
      .single();
    
    if (error) {
      // Handle table not exists
      if (error.code === 'PGRST204' || error.code === 'PGRST205' || error.code === '42P01') {
        console.log('⚠️ Table tenant_app_routes does not exist yet.');
        return c.json({ 
          error: 'Table tenant_app_routes is not available. Please use KV store for prototyping.',
          code: 'TABLE_NOT_FOUND'
        }, 503);
      }
      
      console.error('Error creating tenant app route:', error);
      
      if (error.code === '23505') { // Unique violation
        return c.json({ error: 'Tenant app route with this configuration already exists' }, 409);
      }
      
      return c.json({ error: error.message }, 500);
    }
    
    return c.json({ data }, 201);
  } catch (err) {
    console.error('Unexpected error in POST /tenant-app-routes:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * PUT /tenant-app-routes/:id
 * Update an existing tenant app route
 */
app.put('/tenant-app-routes/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const supabase = getSupabaseClient();
    
    // Prepare update data
    const updateData = {
      ...body,
      updated_at: new Date().toISOString(),
      version: body.version ? body.version + 1 : 1,
    };
    
    // Remove fields that shouldn't be updated
    delete updateData._id;
    delete updateData.tenant_id;
    delete updateData.created_at;
    
    const { data, error } = await supabase
      .from('tenant_app_routes')
      .update(updateData)
      .eq('_id', id)
      .is('deleted_at', null)
      .select()
      .single();
    
    if (error) {
      // Handle table not exists
      if (error.code === 'PGRST204' || error.code === 'PGRST205' || error.code === '42P01') {
        return c.json({ 
          error: 'Table tenant_app_routes is not available.',
          code: 'TABLE_NOT_FOUND'
        }, 503);
      }
      
      if (error.code === 'PGRST116') {
        return c.json({ error: 'Tenant app route not found' }, 404);
      }
      
      console.error('Error updating tenant app route:', error);
      return c.json({ error: error.message }, 500);
    }
    
    return c.json({ data });
  } catch (err) {
    console.error('Unexpected error in PUT /tenant-app-routes/:id:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * DELETE /tenant-app-routes/:id
 * Soft delete a tenant app route
 */
app.delete('/tenant-app-routes/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('tenant_app_routes')
      .update({ 
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('_id', id)
      .is('deleted_at', null)
      .select()
      .single();
    
    if (error) {
      // Handle table not exists
      if (error.code === 'PGRST204' || error.code === 'PGRST205' || error.code === '42P01') {
        return c.json({ 
          error: 'Table tenant_app_routes is not available.',
          code: 'TABLE_NOT_FOUND'
        }, 503);
      }
      
      if (error.code === 'PGRST116') {
        return c.json({ error: 'Tenant app route not found' }, 404);
      }
      
      console.error('Error deleting tenant app route:', error);
      return c.json({ error: error.message }, 500);
    }
    
    return c.json({ success: true, data });
  } catch (err) {
    console.error('Unexpected error in DELETE /tenant-app-routes/:id:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default app;
