/**
 * User Authentication Methods API Handler
 * 
 * Endpoints for:
 * - Linked Identities (OAuth/Social login providers)
 * - MFA Methods (Multi-factor authentication)
 * 
 * Under 500 lines
 */

import { Hono } from 'npm:hono';
import type { Context } from 'npm:hono';
import { createClient } from 'npm:@supabase/supabase-js@2';

const app = new Hono();

// ============================================
// TYPES & INTERFACES
// ============================================

export type IdentityProvider = 
  | 'GOOGLE' | 'FACEBOOK' | 'GITHUB' | 'GITLAB' | 'BITBUCKET'
  | 'LINKEDIN' | 'TWITTER' | 'MICROSOFT' | 'APPLE' | 'SLACK'
  | 'DISCORD' | 'OKTA' | 'AUTH0' | 'SAML' | 'LDAP' | 'OTHER';

export type IdentityStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'REVOKED';

export type MFAMethodType = 
  | 'TOTP' | 'SMS' | 'EMAIL' | 'WEBAUTHN' | 'BACKUP_CODES'
  | 'PUSH_NOTIFICATION' | 'BIOMETRIC' | 'HARDWARE_TOKEN' | 'OTHER';

export type MFAStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'REVOKED' | 'PENDING';

export interface LinkedIdentity {
  _id: string;
  user_id: string;
  provider: IdentityProvider;
  provider_user_id: string;
  provider_username?: string;
  provider_email?: string;
  provider_profile?: Record<string, any>;
  avatar_url?: string;
  display_name?: string;
  status: IdentityStatus;
  is_verified: boolean;
  is_primary: boolean;
  last_used_at?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  version: number;
}

export interface MFAMethod {
  _id: string;
  user_id: string;
  method_type: MFAMethodType;
  method_name?: string;
  sms_phone_number?: string;
  sms_phone_verified?: boolean;
  email_address?: string;
  email_verified?: boolean;
  status: MFAStatus;
  is_verified: boolean;
  is_primary: boolean;
  is_enforced: boolean;
  last_used_at?: string;
  last_verified_at?: string;
  success_count: number;
  failure_count: number;
  device_name?: string;
  device_type?: string;
  backup_codes_used?: number;
  backup_codes_total?: number;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
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

// ============================================
// LINKED IDENTITIES ENDPOINTS
// ============================================

/**
 * GET /user-linked-identities
 * List linked identities with filters
 */
app.get('/user-linked-identities', async (c: Context) => {
  try {
    const supabase = getSupabaseClient();
    
    const user_id = c.req.query('user_id');
    const provider = c.req.query('provider');
    const status = c.req.query('status');
    const is_primary = c.req.query('is_primary');
    
    let query = supabase
      .from('user_linked_identities')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)
      .order('is_primary', { ascending: false })
      .order('last_used_at', { ascending: false });
    
    if (user_id) query = query.eq('user_id', user_id);
    if (provider) query = query.eq('provider', provider);
    if (status) query = query.eq('status', status);
    if (is_primary) query = query.eq('is_primary', is_primary === 'true');
    
    const { data, error, count } = await query;
    
    if (error) {
      // If table doesn't exist, return empty array instead of error
      if (error.code === 'PGRST205') {
        console.log('⚠️ Table user_linked_identities does not exist yet. Returning empty array.');
        return c.json({
          data: [],
          pagination: { total: 0 }
        });
      }
      console.error('Error fetching linked identities:', error);
      return c.json({ error: error.message }, 500);
    }
    
    return c.json({
      data: data || [],
      pagination: {
        total: count || 0,
      }
    });
  } catch (err) {
    console.error('Unexpected error in GET /user-linked-identities:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * GET /user-linked-identities/:id
 * Get single linked identity
 */
app.get('/user-linked-identities/:id', async (c: Context) => {
  try {
    const id = c.req.param('id');
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('user_linked_identities')
      .select('*')
      .eq('_id', id)
      .is('deleted_at', null)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return c.json({ error: 'Linked identity not found' }, 404);
      }
      console.error('Error fetching linked identity:', error);
      return c.json({ error: error.message }, 500);
    }
    
    return c.json({ data });
  } catch (err) {
    console.error('Unexpected error in GET /user-linked-identities/:id:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * POST /user-linked-identities
 * Create new linked identity
 */
app.post('/user-linked-identities', async (c: Context) => {
  try {
    const body = await c.req.json();
    const supabase = getSupabaseClient();
    
    const insertData = {
      user_id: body.user_id,
      provider: body.provider,
      provider_user_id: body.provider_user_id,
      provider_username: body.provider_username,
      provider_email: body.provider_email,
      provider_profile: body.provider_profile || {},
      avatar_url: body.avatar_url,
      display_name: body.display_name,
      status: body.status || 'ACTIVE',
      is_verified: body.is_verified || false,
      is_primary: body.is_primary || false,
      metadata: body.metadata || {},
      version: 1,
    };
    
    const { data, error } = await supabase
      .from('user_linked_identities')
      .insert(insertData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating linked identity:', error);
      if (error.code === '23505') {
        return c.json({ error: 'This identity is already linked' }, 409);
      }
      return c.json({ error: error.message }, 500);
    }
    
    return c.json({ data }, 201);
  } catch (err) {
    console.error('Unexpected error in POST /user-linked-identities:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * PATCH /user-linked-identities/:id
 * Update linked identity
 */
app.patch('/user-linked-identities/:id', async (c: Context) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const supabase = getSupabaseClient();
    
    if (!body.version) {
      return c.json({ error: 'version field is required' }, 400);
    }
    
    const { version, ...updateFields } = body;
    const updateData = {
      ...updateFields,
      version: version + 1,
    };
    
    const { data, error } = await supabase
      .from('user_linked_identities')
      .update(updateData)
      .eq('_id', id)
      .eq('version', version)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating linked identity:', error);
      return c.json({ error: error.message }, 500);
    }
    
    return c.json({ data });
  } catch (err) {
    console.error('Unexpected error in PATCH /user-linked-identities/:id:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * DELETE /user-linked-identities/:id
 * Remove linked identity
 */
app.delete('/user-linked-identities/:id', async (c: Context) => {
  try {
    const id = c.req.param('id');
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('user_linked_identities')
      .update({ deleted_at: new Date().toISOString() })
      .eq('_id', id)
      .is('deleted_at', null)
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return c.json({ error: 'Linked identity not found' }, 404);
      }
      console.error('Error deleting linked identity:', error);
      return c.json({ error: error.message }, 500);
    }
    
    return c.json({ message: 'Linked identity removed', data });
  } catch (err) {
    console.error('Unexpected error in DELETE /user-linked-identities/:id:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ============================================
// MFA METHODS ENDPOINTS
// ============================================

/**
 * GET /user-mfa-methods
 * List MFA methods with filters
 */
app.get('/user-mfa-methods', async (c: Context) => {
  try {
    const supabase = getSupabaseClient();
    
    const user_id = c.req.query('user_id');
    const method_type = c.req.query('method_type');
    const status = c.req.query('status');
    const is_verified = c.req.query('is_verified');
    
    let query = supabase
      .from('user_mfa_methods')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)
      .order('is_primary', { ascending: false })
      .order('last_used_at', { ascending: false });
    
    if (user_id) query = query.eq('user_id', user_id);
    if (method_type) query = query.eq('method_type', method_type);
    if (status) query = query.eq('status', status);
    if (is_verified) query = query.eq('is_verified', is_verified === 'true');
    
    const { data, error, count } = await query;
    
    if (error) {
      // If table doesn't exist, return empty array instead of error
      if (error.code === 'PGRST205') {
        console.log('⚠️ Table user_mfa_methods does not exist yet. Returning empty array.');
        return c.json({
          data: [],
          pagination: { total: 0 }
        });
      }
      console.error('Error fetching MFA methods:', error);
      return c.json({ error: error.message }, 500);
    }
    
    // Remove sensitive data before sending
    const sanitizedData = data?.map(item => ({
      ...item,
      totp_secret_encrypted: undefined,
      totp_backup_codes_encrypted: undefined,
      backup_codes_encrypted: undefined,
      access_token_encrypted: undefined,
      refresh_token_encrypted: undefined,
    }));
    
    return c.json({
      data: sanitizedData || [],
      pagination: {
        total: count || 0,
      }
    });
  } catch (err) {
    console.error('Unexpected error in GET /user-mfa-methods:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * GET /user-mfa-methods/:id
 * Get single MFA method
 */
app.get('/user-mfa-methods/:id', async (c: Context) => {
  try {
    const id = c.req.param('id');
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('user_mfa_methods')
      .select('*')
      .eq('_id', id)
      .is('deleted_at', null)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return c.json({ error: 'MFA method not found' }, 404);
      }
      console.error('Error fetching MFA method:', error);
      return c.json({ error: error.message }, 500);
    }
    
    // Remove sensitive data
    const sanitized = {
      ...data,
      totp_secret_encrypted: undefined,
      totp_backup_codes_encrypted: undefined,
      backup_codes_encrypted: undefined,
    };
    
    return c.json({ data: sanitized });
  } catch (err) {
    console.error('Unexpected error in GET /user-mfa-methods/:id:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * POST /user-mfa-methods
 * Create new MFA method
 */
app.post('/user-mfa-methods', async (c: Context) => {
  try {
    const body = await c.req.json();
    const supabase = getSupabaseClient();
    
    const insertData = {
      user_id: body.user_id,
      method_type: body.method_type,
      method_name: body.method_name,
      sms_phone_number: body.sms_phone_number,
      sms_phone_verified: body.sms_phone_verified || false,
      email_address: body.email_address,
      email_verified: body.email_verified || false,
      status: body.status || 'PENDING',
      is_verified: body.is_verified || false,
      is_primary: body.is_primary || false,
      is_enforced: body.is_enforced || false,
      device_name: body.device_name,
      device_type: body.device_type,
      backup_codes_total: body.backup_codes_total || 10,
      backup_codes_used: 0,
      success_count: 0,
      failure_count: 0,
      metadata: body.metadata || {},
      version: 1,
    };
    
    const { data, error } = await supabase
      .from('user_mfa_methods')
      .insert(insertData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating MFA method:', error);
      return c.json({ error: error.message }, 500);
    }
    
    return c.json({ data }, 201);
  } catch (err) {
    console.error('Unexpected error in POST /user-mfa-methods:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * PATCH /user-mfa-methods/:id
 * Update MFA method
 */
app.patch('/user-mfa-methods/:id', async (c: Context) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const supabase = getSupabaseClient();
    
    if (!body.version) {
      return c.json({ error: 'version field is required' }, 400);
    }
    
    const { version, ...updateFields } = body;
    const updateData = {
      ...updateFields,
      version: version + 1,
    };
    
    const { data, error } = await supabase
      .from('user_mfa_methods')
      .update(updateData)
      .eq('_id', id)
      .eq('version', version)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating MFA method:', error);
      return c.json({ error: error.message }, 500);
    }
    
    return c.json({ data });
  } catch (err) {
    console.error('Unexpected error in PATCH /user-mfa-methods/:id:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * DELETE /user-mfa-methods/:id
 * Remove MFA method
 */
app.delete('/user-mfa-methods/:id', async (c: Context) => {
  try {
    const id = c.req.param('id');
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('user_mfa_methods')
      .update({ deleted_at: new Date().toISOString() })
      .eq('_id', id)
      .is('deleted_at', null)
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return c.json({ error: 'MFA method not found' }, 404);
      }
      console.error('Error deleting MFA method:', error);
      return c.json({ error: error.message }, 500);
    }
    
    return c.json({ message: 'MFA method removed', data });
  } catch (err) {
    console.error('Unexpected error in DELETE /user-mfa-methods/:id:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default app;