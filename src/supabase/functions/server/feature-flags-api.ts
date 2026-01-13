/**
 * Feature Flags API Handlers
 * Full CRUD operations with Supabase integration
 */

import { Hono } from 'npm:hono';
import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const app = new Hono();

// Initialize Supabase client
const getSupabaseClient = () => {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
};

// GET /feature-flags - List all flags with filters
app.get('/feature-flags', async (c) => {
  try {
    const supabase = getSupabaseClient();
    const url = new URL(c.req.url);
    
    // Get query parameters for filtering
    const searchQuery = url.searchParams.get('search') || '';
    const flagType = url.searchParams.get('type') || '';
    const environment = url.searchParams.get('environment') || '';
    const isEnabled = url.searchParams.get('is_enabled');
    
    // Build query
    let query = supabase
      .from('feature_flags')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });
    
    // Apply filters
    if (searchQuery) {
      query = query.or(`flag_key.ilike.%${searchQuery}%,flag_name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
    }
    if (flagType) {
      query = query.eq('flag_type', flagType);
    }
    if (environment) {
      query = query.eq('environment', environment);
    }
    if (isEnabled !== null && isEnabled !== '') {
      query = query.eq('is_enabled', isEnabled === 'true');
    }
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('Error fetching feature flags:', error);
      return c.json({ error: error.message }, 500);
    }
    
    return c.json({
      data,
      count,
      success: true
    });
  } catch (error) {
    console.error('Feature flags fetch error:', error);
    return c.json({ error: 'Failed to fetch feature flags' }, 500);
  }
});

// GET /feature-flags/:id - Get single flag
app.get('/feature-flags/:id', async (c) => {
  try {
    const supabase = getSupabaseClient();
    const id = c.req.param('id');
    
    const { data, error } = await supabase
      .from('feature_flags')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error(`Error fetching feature flag ${id}:`, error);
      return c.json({ error: error.message }, error.code === 'PGRST116' ? 404 : 500);
    }
    
    return c.json({ data, success: true });
  } catch (error) {
    console.error('Feature flag fetch error:', error);
    return c.json({ error: 'Failed to fetch feature flag' }, 500);
  }
});

// POST /feature-flags - Create new flag
app.post('/feature-flags', async (c) => {
  try {
    const supabase = getSupabaseClient();
    const body = await c.req.json();
    
    // Validate required fields
    if (!body.flag_key || !body.flag_name || !body.flag_type || !body.environment) {
      return c.json({ 
        error: 'Missing required fields: flag_key, flag_name, flag_type, environment' 
      }, 400);
    }
    
    // Validate flag_key format (snake_case)
    if (!/^[a-z0-9_]+$/.test(body.flag_key)) {
      return c.json({ 
        error: 'Flag key can only contain lowercase letters, numbers and underscores' 
      }, 400);
    }
    
    // Check if flag_key already exists
    const { data: existing } = await supabase
      .from('feature_flags')
      .select('id')
      .eq('flag_key', body.flag_key)
      .single();
    
    if (existing) {
      return c.json({ error: 'Flag key already exists' }, 400);
    }
    
    // Prepare data
    const flagData = {
      flag_key: body.flag_key,
      flag_name: body.flag_name,
      description: body.description || null,
      is_enabled: body.is_enabled !== undefined ? body.is_enabled : false,
      environment: body.environment,
      flag_type: body.flag_type,
      target_audience: body.target_audience || 'all',
      percentage_rollout: body.percentage_rollout !== undefined ? body.percentage_rollout : 0,
      conditions: body.conditions || null,
      metadata: body.metadata || null,
      created_by: body.created_by || 'system',
      enabled_at: body.is_enabled ? new Date().toISOString() : null,
    };
    
    const { data, error } = await supabase
      .from('feature_flags')
      .insert([flagData])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating feature flag:', error);
      return c.json({ error: error.message }, 500);
    }
    
    return c.json({ 
      data, 
      success: true,
      message: 'Feature flag created successfully' 
    }, 201);
  } catch (error) {
    console.error('Feature flag creation error:', error);
    return c.json({ error: 'Failed to create feature flag' }, 500);
  }
});

// PUT /feature-flags/:id - Update flag
app.put('/feature-flags/:id', async (c) => {
  try {
    const supabase = getSupabaseClient();
    const id = c.req.param('id');
    const body = await c.req.json();
    
    // Prepare update data (exclude auto-managed fields)
    const updateData: any = {};
    const allowedFields = [
      'flag_name', 'description', 'is_enabled', 'environment', 'flag_type',
      'target_audience', 'percentage_rollout', 'conditions', 'metadata'
    ];
    
    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });
    
    // Handle enabled_at/disabled_at timestamps
    if (body.is_enabled !== undefined) {
      if (body.is_enabled) {
        updateData.enabled_at = new Date().toISOString();
        updateData.disabled_at = null;
      } else {
        updateData.disabled_at = new Date().toISOString();
      }
    }
    
    if (Object.keys(updateData).length === 0) {
      return c.json({ error: 'No fields to update' }, 400);
    }
    
    const { data, error } = await supabase
      .from('feature_flags')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error(`Error updating feature flag ${id}:`, error);
      return c.json({ error: error.message }, error.code === 'PGRST116' ? 404 : 500);
    }
    
    return c.json({ 
      data, 
      success: true,
      message: 'Feature flag updated successfully' 
    });
  } catch (error) {
    console.error('Feature flag update error:', error);
    return c.json({ error: 'Failed to update feature flag' }, 500);
  }
});

// PATCH /feature-flags/:id/toggle - Toggle enabled status
app.patch('/feature-flags/:id/toggle', async (c) => {
  try {
    const supabase = getSupabaseClient();
    const id = c.req.param('id');
    
    // First get current status
    const { data: currentFlag, error: fetchError } = await supabase
      .from('feature_flags')
      .select('is_enabled')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      console.error(`Error fetching flag ${id}:`, fetchError);
      return c.json({ error: fetchError.message }, fetchError.code === 'PGRST116' ? 404 : 500);
    }
    
    // Toggle the status
    const newStatus = !currentFlag.is_enabled;
    const updateData: any = { 
      is_enabled: newStatus 
    };
    
    if (newStatus) {
      updateData.enabled_at = new Date().toISOString();
      updateData.disabled_at = null;
    } else {
      updateData.disabled_at = new Date().toISOString();
    }
    
    const { data, error } = await supabase
      .from('feature_flags')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error(`Error toggling flag ${id}:`, error);
      return c.json({ error: error.message }, 500);
    }
    
    return c.json({ 
      data, 
      success: true,
      message: `Feature flag ${data.is_enabled ? 'enabled' : 'disabled'} successfully` 
    });
  } catch (error) {
    console.error('Flag toggle error:', error);
    return c.json({ error: 'Failed to toggle feature flag' }, 500);
  }
});

// DELETE /feature-flags/:id - Delete flag
app.delete('/feature-flags/:id', async (c) => {
  try {
    const supabase = getSupabaseClient();
    const id = c.req.param('id');
    
    const { error } = await supabase
      .from('feature_flags')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error(`Error deleting feature flag ${id}:`, error);
      return c.json({ error: error.message }, error.code === 'PGRST116' ? 404 : 500);
    }
    
    return c.json({ 
      success: true,
      message: 'Feature flag deleted successfully' 
    });
  } catch (error) {
    console.error('Feature flag deletion error:', error);
    return c.json({ error: 'Failed to delete feature flag' }, 500);
  }
});

// GET /feature-flags/stats/overview - Get statistics
app.get('/feature-flags/stats/overview', async (c) => {
  try {
    const supabase = getSupabaseClient();
    
    // Get all flags
    const { data: flags, error } = await supabase
      .from('feature_flags')
      .select('is_enabled, environment, percentage_rollout');
    
    if (error) {
      console.error('Error fetching flag stats:', error);
      return c.json({ error: error.message }, 500);
    }
    
    // Calculate statistics
    const stats = {
      totalFlags: flags.length,
      enabledFlags: flags.filter(f => f.is_enabled).length,
      disabledFlags: flags.filter(f => !f.is_enabled).length,
      productionFlags: flags.filter(f => f.environment === 'production').length,
      stagingFlags: flags.filter(f => f.environment === 'staging').length,
      developmentFlags: flags.filter(f => f.environment === 'development').length,
      betaFlags: flags.filter(f => f.environment === 'beta').length,
      averageRollout: flags.reduce((acc, f) => acc + f.percentage_rollout, 0) / (flags.length || 1)
    };
    
    return c.json({ data: stats, success: true });
  } catch (error) {
    console.error('Flag stats error:', error);
    return c.json({ error: 'Failed to fetch flag statistics' }, 500);
  }
});

// GET /feature-flags/check/:key - Check if a flag is enabled (for client apps)
app.get('/feature-flags/check/:key', async (c) => {
  try {
    const supabase = getSupabaseClient();
    const key = c.req.param('key');
    const url = new URL(c.req.url);
    const environment = url.searchParams.get('environment') || 'production';
    
    const { data, error } = await supabase
      .from('feature_flags')
      .select('is_enabled, percentage_rollout, target_audience, conditions')
      .eq('flag_key', key)
      .eq('environment', environment)
      .single();
    
    if (error) {
      // Flag not found - return disabled by default
      return c.json({ 
        enabled: false,
        exists: false,
        message: 'Feature flag not found'
      });
    }
    
    return c.json({ 
      enabled: data.is_enabled,
      exists: true,
      percentage_rollout: data.percentage_rollout,
      target_audience: data.target_audience,
      conditions: data.conditions
    });
  } catch (error) {
    console.error('Flag check error:', error);
    return c.json({ enabled: false, error: 'Failed to check feature flag' }, 500);
  }
});

export default app;
