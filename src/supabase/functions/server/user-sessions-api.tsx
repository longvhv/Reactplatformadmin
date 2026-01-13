/**
 * User Sessions API Handler
 * 
 * CRUD operations for user sessions
 * Track login sessions across devices
 */

import { Hono } from 'npm:hono';
import type { Context } from 'npm:hono';
import { createClient } from 'npm:@supabase/supabase-js@2';

const app = new Hono();

// ============================================
// TYPES
// ============================================

export type SessionStatus = 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'LOGGED_OUT';
export type LoginMethod = 'PASSWORD' | 'SSO' | 'OAUTH' | 'MFA' | 'BIOMETRIC' | 'API_KEY' | 'OTHER';

export interface UserSession {
  _id: string;
  user_id: string;
  session_token: string;
  ip_address?: string;
  user_agent?: string;
  device_type?: string;
  device_name?: string;
  os_name?: string;
  os_version?: string;
  browser_name?: string;
  browser_version?: string;
  country?: string;
  city?: string;
  status: SessionStatus;
  is_current: boolean;
  login_at: string;
  last_activity_at: string;
  expires_at?: string;
  logout_at?: string;
  login_method?: LoginMethod;
  mfa_verified: boolean;
  is_trusted_device: boolean;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  version: number;
}

// ============================================
// HELPERS
// ============================================

const getSupabaseClient = () => {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
};

const generateSessionToken = (): string => {
  return `sess_${crypto.randomUUID()}_${Date.now()}`;
};

// ============================================
// ENDPOINTS
// ============================================

/**
 * GET /user-sessions
 * List sessions with filters
 */
app.get('/user-sessions', async (c: Context) => {
  try {
    const supabase = getSupabaseClient();
    
    const user_id = c.req.query('user_id');
    const status = c.req.query('status');
    const is_current = c.req.query('is_current');
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');
    
    let query = supabase
      .from('user_sessions')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)
      .order('last_activity_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (user_id) query = query.eq('user_id', user_id);
    if (status) query = query.eq('status', status);
    if (is_current) query = query.eq('is_current', is_current === 'true');
    
    const { data, error, count } = await query;
    
    if (error) {
      if (error.code === 'PGRST204' || error.code === '42P01') {
        console.log('⚠️ Table user_sessions does not exist yet.');
        return c.json({ data: [], pagination: { total: 0, limit, offset, has_more: false } });
      }
      console.error('Error fetching sessions:', error);
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
  } catch (err) {
    console.error('Unexpected error in GET /user-sessions:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * GET /user-sessions/:id
 * Get single session
 */
app.get('/user-sessions/:id', async (c: Context) => {
  try {
    const id = c.req.param('id');
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('_id', id)
      .is('deleted_at', null)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return c.json({ error: 'Session not found' }, 404);
      }
      console.error('Error fetching session:', error);
      return c.json({ error: error.message }, 500);
    }
    
    return c.json({ data });
  } catch (err) {
    console.error('Unexpected error in GET /user-sessions/:id:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * POST /user-sessions
 * Create new session
 */
app.post('/user-sessions', async (c: Context) => {
  try {
    const body = await c.req.json();
    const supabase = getSupabaseClient();
    
    // Validate required fields
    if (!body.user_id) {
      return c.json({ error: 'user_id is required' }, 400);
    }
    
    const sessionId = crypto.randomUUID();
    const sessionToken = generateSessionToken();
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
    
    const insertData = {
      _id: sessionId,
      user_id: body.user_id,
      session_token: sessionToken,
      ip_address: body.ip_address || null,
      user_agent: body.user_agent || null,
      device_type: body.device_type || null,
      device_name: body.device_name || null,
      os_name: body.os_name || null,
      os_version: body.os_version || null,
      browser_name: body.browser_name || null,
      browser_version: body.browser_version || null,
      country: body.country || null,
      city: body.city || null,
      status: body.status || 'ACTIVE',
      is_current: body.is_current || false,
      login_at: body.login_at || now,
      last_activity_at: now,
      expires_at: body.expires_at || expiresAt,
      login_method: body.login_method || 'PASSWORD',
      mfa_verified: body.mfa_verified || false,
      is_trusted_device: body.is_trusted_device || false,
      metadata: body.metadata || {},
      version: 1,
    };
    
    const { data, error } = await supabase
      .from('user_sessions')
      .insert(insertData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating session:', error);
      return c.json({ error: error.message }, 500);
    }
    
    return c.json({ data }, 201);
  } catch (err) {
    console.error('Unexpected error in POST /user-sessions:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * PATCH /user-sessions/:id
 * Update session (e.g., update last activity, logout)
 */
app.patch('/user-sessions/:id', async (c: Context) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const supabase = getSupabaseClient();
    
    // Get current version
    const { data: current, error: fetchError } = await supabase
      .from('user_sessions')
      .select('version')
      .eq('_id', id)
      .is('deleted_at', null)
      .single();
    
    if (fetchError || !current) {
      return c.json({ error: 'Session not found' }, 404);
    }
    
    const updateData: any = {
      ...body,
      updated_at: new Date().toISOString(),
      version: current.version + 1,
    };
    
    // Remove fields that shouldn't be updated
    delete updateData._id;
    delete updateData.created_at;
    delete updateData.user_id;
    delete updateData.session_token;
    
    const { data, error } = await supabase
      .from('user_sessions')
      .update(updateData)
      .eq('_id', id)
      .eq('version', current.version)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating session:', error);
      return c.json({ error: error.message }, 500);
    }
    
    return c.json({ data });
  } catch (err) {
    console.error('Unexpected error in PATCH /user-sessions/:id:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * DELETE /user-sessions/:id
 * Soft delete session (or revoke)
 */
app.delete('/user-sessions/:id', async (c: Context) => {
  try {
    const id = c.req.param('id');
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('user_sessions')
      .update({
        status: 'REVOKED',
        deleted_at: new Date().toISOString(),
      })
      .eq('_id', id)
      .is('deleted_at', null)
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return c.json({ error: 'Session not found or already deleted' }, 404);
      }
      console.error('Error deleting session:', error);
      return c.json({ error: error.message }, 500);
    }
    
    return c.json({ data, message: 'Session revoked successfully' });
  } catch (err) {
    console.error('Unexpected error in DELETE /user-sessions/:id:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * POST /user-sessions/:id/logout
 * Logout session (mark as logged out)
 */
app.post('/user-sessions/:id/logout', async (c: Context) => {
  try {
    const id = c.req.param('id');
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('user_sessions')
      .update({
        status: 'LOGGED_OUT',
        logout_at: new Date().toISOString(),
        is_current: false,
      })
      .eq('_id', id)
      .eq('status', 'ACTIVE')
      .select()
      .single();
    
    if (error) {
      console.error('Error logging out session:', error);
      return c.json({ error: error.message }, 500);
    }
    
    return c.json({ data, message: 'Logged out successfully' });
  } catch (err) {
    console.error('Unexpected error in POST /user-sessions/:id/logout:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * POST /user-sessions/revoke-all
 * Revoke all sessions for a user except current
 */
app.post('/user-sessions/revoke-all', async (c: Context) => {
  try {
    const body = await c.req.json();
    const { user_id, except_session_id } = body;
    
    if (!user_id) {
      return c.json({ error: 'user_id is required' }, 400);
    }
    
    const supabase = getSupabaseClient();
    
    let query = supabase
      .from('user_sessions')
      .update({
        status: 'REVOKED',
        deleted_at: new Date().toISOString(),
      })
      .eq('user_id', user_id)
      .eq('status', 'ACTIVE')
      .is('deleted_at', null);
    
    if (except_session_id) {
      query = query.neq('_id', except_session_id);
    }
    
    const { data, error, count } = await query.select();
    
    if (error) {
      console.error('Error revoking sessions:', error);
      return c.json({ error: error.message }, 500);
    }
    
    return c.json({
      message: 'All sessions revoked successfully',
      revoked_count: count || 0,
    });
  } catch (err) {
    console.error('Unexpected error in POST /user-sessions/revoke-all:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default app;
