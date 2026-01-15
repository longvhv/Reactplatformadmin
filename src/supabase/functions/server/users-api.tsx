/**
 * Users API Handler
 * 
 * Complete CRUD operations with authentication and audit trail
 * Aligned with go-framework database schema
 */

import { Hono } from 'npm:hono';
import type { Context } from 'npm:hono';
import { createClient } from 'npm:@supabase/supabase-js@2';
import type { 
  User,
  CreateUserInput, 
  UpdateUserInput,
  UserRole,
  UserStatus 
} from '../../../data/users.ts';
import { validateCreateUser, validateUpdateUser } from './user-validators.ts';

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
 * Helper: Hash password using Web Crypto API
 * Compatible with Deno edge runtime
 */
const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

/**
 * GET /users
 * List all users with optional filters
 */
app.get('/users', async (c) => {
  try {
    const supabase = getSupabaseClient();
    
    // Query parameters
    const role = c.req.query('role') as UserRole | undefined;
    const status = c.req.query('status') as UserStatus | undefined;
    const tenant_id = c.req.query('tenant_id');
    const search = c.req.query('search');
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');
    
    let query = supabase
      .from('users')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    // Apply filters
    if (role) query = query.eq('role', role);
    if (status) query = query.eq('status', status);
    if (tenant_id === 'null') {
      query = query.is('tenant_id', null);
    } else if (tenant_id) {
      query = query.eq('tenant_id', tenant_id);
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('Error fetching users:', error);
      return c.json({ error: error.message }, 500);
    }
    
    // Remove password_hash from response
    const sanitizedData = data?.map(user => {
      const { password_hash, ...rest } = user;
      return rest;
    }) || [];
    
    return c.json({
      data: sanitizedData,
      pagination: {
        total: count || 0,
        limit,
        offset,
        has_more: count ? count > offset + limit : false,
      },
    });
  } catch (error) {
    console.error('Unexpected error in GET /users:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * GET /users/:id
 * Get single user by ID
 */
app.get('/users/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('_id', id)
      .is('deleted_at', null)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return c.json({ error: 'User not found' }, 404);
      }
      console.error('Error fetching user:', error);
      return c.json({ error: error.message }, 500);
    }
    
    // Remove password_hash from response
    const { password_hash, ...sanitizedData } = data;
    
    return c.json({ data: sanitizedData });
  } catch (error) {
    console.error('Unexpected error in GET /users/:id:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * POST /users
 * Create new user
 */
app.post('/users', async (c) => {
  try {
    const userId = await getCurrentUser(c);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const body = await c.req.json<CreateUserInput>();
    const supabase = getSupabaseClient();
    
    // Validation
    const validation = validateCreateUser(body);
    if (!validation.valid) {
      return c.json({ 
        error: 'Validation failed', 
        details: validation.errors 
      }, 400);
    }
    
    // Check email uniqueness
    const { data: existing } = await supabase
      .from('users')
      .select('_id')
      .eq('email', body.email)
      .is('deleted_at', null)
      .single();
    
    if (existing) {
      return c.json({ error: 'Email already exists' }, 409);
    }
    
    // Hash password
    const passwordHash = await hashPassword(body.password);
    
    // Generate UUID
    const newUserId = crypto.randomUUID();
    
    // Prepare insert data
    const insertData = {
      _id: newUserId,
      email: body.email,
      password_hash: passwordHash,
      name: body.name,
      avatar: body.avatar || null,
      phone: body.phone || null,
      location: body.location || null,
      department: body.department || null,
      position: body.position || null,
      bio: body.bio || null,
      role: body.role || 'USER',
      status: body.status || 'ACTIVE',
      email_verified: false,
      tenant_id: body.tenant_id || null,
      created_by: userId,
      updated_by: userId,
      version: 1,
    };
    
    const { data, error } = await supabase
      .from('users')
      .insert(insertData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating user:', error);
      return c.json({ error: error.message }, 500);
    }
    
    // Remove password_hash from response
    const { password_hash, ...sanitizedData } = data;
    
    return c.json({ data: sanitizedData }, 201);
  } catch (error) {
    console.error('Unexpected error in POST /users:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * PATCH /users/:id
 * Update existing user (partial update)
 */
app.patch('/users/:id', async (c) => {
  try {
    const userId = await getCurrentUser(c);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const id = c.req.param('id');
    const body = await c.req.json<Partial<UpdateUserInput>>();
    const supabase = getSupabaseClient();
    
    // Validation
    const validation = validateUpdateUser(body as UpdateUserInput);
    if (!validation.valid) {
      return c.json({ 
        error: 'Validation failed', 
        details: validation.errors 
      }, 400);
    }
    
    // Get current version for optimistic locking
    const { data: current, error: fetchError } = await supabase
      .from('users')
      .select('version, email')
      .eq('_id', id)
      .is('deleted_at', null)
      .single();
    
    if (fetchError || !current) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    // Optimistic locking check
    if (body.version !== undefined && body.version !== current.version) {
      return c.json({ 
        error: 'Version conflict. The user was modified by another user.' 
      }, 409);
    }
    
    // Email validation if changing
    if (body.email && body.email !== current.email) {
      // Check uniqueness
      const { data: existing } = await supabase
        .from('users')
        .select('_id')
        .eq('email', body.email)
        .is('deleted_at', null)
        .single();
      
      if (existing) {
        return c.json({ error: 'Email already exists' }, 409);
      }
    }
    
    // Prepare update data
    const updateData: any = {
      ...body,
      updated_by: userId,
      updated_at: new Date().toISOString(),
      version: current.version + 1,
    };
    
    // Hash password if provided
    if (body.password) {
      updateData.password_hash = await hashPassword(body.password);
      delete updateData.password;
    }
    
    // Remove fields that shouldn't be updated
    delete updateData._id;
    delete updateData.created_at;
    delete updateData.created_by;
    
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('_id', id)
      .eq('version', current.version)  // Optimistic locking
      .select()
      .single();
    
    if (error) {
      console.error('Error updating user:', error);
      return c.json({ error: error.message }, 500);
    }
    
    // Remove password_hash from response
    const { password_hash, ...sanitizedData } = data;
    
    return c.json({ data: sanitizedData });
  } catch (error) {
    console.error('Unexpected error in PATCH /users/:id:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * DELETE /users/:id
 * Soft delete user
 */
app.delete('/users/:id', async (c) => {
  try {
    const userId = await getCurrentUser(c);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const id = c.req.param('id');
    
    // Prevent self-deletion
    if (id === userId) {
      return c.json({ error: 'Cannot delete your own account' }, 400);
    }
    
    const supabase = getSupabaseClient();
    
    // Soft delete
    const { data, error } = await supabase
      .from('users')
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
        return c.json({ error: 'User not found or already deleted' }, 404);
      }
      console.error('Error deleting user:', error);
      return c.json({ error: error.message }, 500);
    }
    
    // Remove password_hash from response
    const { password_hash, ...sanitizedData } = data;
    
    return c.json({ data: sanitizedData, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Unexpected error in DELETE /users/:id:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * GET /users/:id/activity
 * Get user activity logs
 */
app.get('/users/:id/activity', async (c) => {
  try {
    const id = c.req.param('id');
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');
    
    const supabase = getSupabaseClient();
    
    const { data, error, count } = await supabase
      .from('user_activities')
      .select('*', { count: 'exact' })
      .eq('userId', id)
      .order('createdAt', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      console.error('Error fetching user activity:', error);
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
    console.error('Unexpected error in GET /users/:id/activity:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default app;