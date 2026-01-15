/**
 * Tenant SSO Configs API Handler
 * 
 * CRUD operations for tenant SSO configurations
 * Supports SAML, OAuth2, OIDC protocols
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

// Helper: Get current user from auth token
const getCurrentUser = async (c: Context): Promise<string | null> => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return null;
  
  const token = authHeader.replace('Bearer ', '');
  const supabase = getSupabaseClient();
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  
  return user.id;
};

/**
 * GET /tenant-sso-configs
 * List SSO configs with optional tenant filter
 */
app.get('/tenant-sso-configs', async (c: Context) => {
  try {
    const supabase = getSupabaseClient();
    
    const tenant_id = c.req.query('tenant_id');
    const provider = c.req.query('provider');
    const status = c.req.query('status');
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');
    
    let query = supabase
      .from('tenant_sso_configs')
      .select('*, tenant:tenants(name, code)', { count: 'exact' })
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (tenant_id) query = query.eq('tenant_id', tenant_id);
    if (provider) query = query.eq('provider', provider);
    if (status) query = query.eq('status', status);
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('Error fetching SSO configs:', error);
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
    console.error('Unexpected error in GET /tenant-sso-configs:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * GET /tenant-sso-configs/:id
 * Get single SSO config by ID
 */
app.get('/tenant-sso-configs/:id', async (c: Context) => {
  try {
    const id = c.req.param('id');
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('tenant_sso_configs')
      .select('*, tenant:tenants(name, code)')
      .eq('_id', id)
      .is('deleted_at', null)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return c.json({ error: 'SSO config not found' }, 404);
      }
      console.error('Error fetching SSO config:', error);
      return c.json({ error: error.message }, 500);
    }
    
    return c.json({ data });
  } catch (error) {
    console.error('Unexpected error in GET /tenant-sso-configs/:id:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * POST /tenant-sso-configs
 * Create new SSO config
 */
app.post('/tenant-sso-configs', async (c: Context) => {
  try {
    const userId = await getCurrentUser(c);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const body = await c.req.json();
    const supabase = getSupabaseClient();
    
    // Validate required fields
    if (!body.tenant_id || !body.provider || !body.name) {
      return c.json({ 
        error: 'Validation failed', 
        details: ['tenant_id, provider, and name are required'] 
      }, 400);
    }
    
    // Generate UUID
    const newConfigId = crypto.randomUUID();
    
    // Prepare insert data
    const insertData = {
      _id: newConfigId,
      tenant_id: body.tenant_id,
      provider: body.provider,
      name: body.name,
      description: body.description || null,
      status: body.status || 'ACTIVE',
      entity_id: body.entity_id || null,
      sso_url: body.sso_url || null,
      slo_url: body.slo_url || null,
      certificate: body.certificate || null,
      metadata_url: body.metadata_url || null,
      client_id: body.client_id || null,
      client_secret: body.client_secret || null,
      authorization_endpoint: body.authorization_endpoint || null,
      token_endpoint: body.token_endpoint || null,
      userinfo_endpoint: body.userinfo_endpoint || null,
      jwks_uri: body.jwks_uri || null,
      scopes: body.scopes || ['openid', 'profile', 'email'],
      attribute_mapping: body.attribute_mapping || {},
      settings: body.settings || {},
      created_by: userId,
      updated_by: userId,
      version: 1,
    };
    
    const { data, error } = await supabase
      .from('tenant_sso_configs')
      .insert(insertData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating SSO config:', error);
      return c.json({ error: error.message }, 500);
    }
    
    return c.json({ data }, 201);
  } catch (error) {
    console.error('Unexpected error in POST /tenant-sso-configs:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * PATCH /tenant-sso-configs/:id
 * Update SSO config
 */
app.patch('/tenant-sso-configs/:id', async (c: Context) => {
  try {
    const userId = await getCurrentUser(c);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const id = c.req.param('id');
    const body = await c.req.json();
    const supabase = getSupabaseClient();
    
    // Get current version
    const { data: current, error: fetchError } = await supabase
      .from('tenant_sso_configs')
      .select('version')
      .eq('_id', id)
      .is('deleted_at', null)
      .single();
    
    if (fetchError || !current) {
      return c.json({ error: 'SSO config not found' }, 404);
    }
    
    // Optimistic locking
    if (body.version !== undefined && body.version !== current.version) {
      return c.json({ 
        error: 'Version conflict. The config was modified by another user.' 
      }, 409);
    }
    
    // Prepare update data
    const updateData: any = {
      ...body,
      updated_by: userId,
      updated_at: new Date().toISOString(),
      version: current.version + 1,
    };
    
    // Remove fields that shouldn't be updated
    delete updateData._id;
    delete updateData.created_at;
    delete updateData.created_by;
    delete updateData.tenant_id; // Cannot change tenant
    
    const { data, error } = await supabase
      .from('tenant_sso_configs')
      .update(updateData)
      .eq('_id', id)
      .eq('version', current.version)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating SSO config:', error);
      return c.json({ error: error.message }, 500);
    }
    
    return c.json({ data });
  } catch (error) {
    console.error('Unexpected error in PATCH /tenant-sso-configs/:id:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * DELETE /tenant-sso-configs/:id
 * Soft delete SSO config
 */
app.delete('/tenant-sso-configs/:id', async (c: Context) => {
  try {
    const userId = await getCurrentUser(c);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const id = c.req.param('id');
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('tenant_sso_configs')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: userId,
      })
      .eq('_id', id)
      .is('deleted_at', null)
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return c.json({ error: 'SSO config not found or already deleted' }, 404);
      }
      console.error('Error deleting SSO config:', error);
      return c.json({ error: error.message }, 500);
    }
    
    return c.json({ data, message: 'SSO config deleted successfully' });
  } catch (error) {
    console.error('Unexpected error in DELETE /tenant-sso-configs/:id:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * POST /tenant-sso-configs/:id/test
 * Test SSO configuration
 */
app.post('/tenant-sso-configs/:id/test', async (c: Context) => {
  try {
    const userId = await getCurrentUser(c);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const id = c.req.param('id');
    const supabase = getSupabaseClient();
    
    const { data: config, error } = await supabase
      .from('tenant_sso_configs')
      .select('*')
      .eq('_id', id)
      .is('deleted_at', null)
      .single();
    
    if (error || !config) {
      return c.json({ error: 'SSO config not found' }, 404);
    }
    
    // Validate configuration based on provider
    const validation = validateSSOConfig(config);
    
    return c.json({
      success: validation.valid,
      message: validation.valid ? 'Configuration is valid' : 'Configuration has errors',
      errors: validation.errors,
      warnings: validation.warnings,
    });
  } catch (error) {
    console.error('Unexpected error in POST /tenant-sso-configs/:id/test:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * Helper: Validate SSO configuration
 */
function validateSSOConfig(config: any): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Common validation
  if (!config.name) errors.push('Name is required');
  if (!config.provider) errors.push('Provider is required');
  
  // Provider-specific validation
  switch (config.provider) {
    case 'SAML':
      if (!config.entity_id) errors.push('Entity ID is required for SAML');
      if (!config.sso_url) errors.push('SSO URL is required for SAML');
      if (!config.certificate) warnings.push('Certificate is recommended for SAML');
      break;
      
    case 'OAUTH2':
    case 'OIDC':
      if (!config.client_id) errors.push('Client ID is required for OAuth2/OIDC');
      if (!config.client_secret) warnings.push('Client Secret is recommended');
      if (!config.authorization_endpoint) errors.push('Authorization endpoint is required');
      if (!config.token_endpoint) errors.push('Token endpoint is required');
      if (config.provider === 'OIDC' && !config.userinfo_endpoint) {
        warnings.push('UserInfo endpoint is recommended for OIDC');
      }
      break;
      
    default:
      errors.push('Unknown provider type');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export default app;