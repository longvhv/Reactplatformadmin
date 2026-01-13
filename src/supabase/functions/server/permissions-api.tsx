/**
 * Permissions API
 * CRUD operations cho bảng permissions với cấu trúc cây phân cấp
 * Tuân thủ chuẩn go-framework: UUID v7, snake_case, audit trail, soft delete
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

function getSupabaseClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

interface Permission {
  _id?: string;
  app_code: string;
  code: string;
  parent_code?: string | null;
  path?: string;
  is_group: boolean;
  name: string;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
  updated_by?: string | null;
  deleted_at?: string | null;
  deleted_by?: string | null;
  version?: number;
}

/**
 * GET /permissions
 * Lấy danh sách permissions với filter theo app_code
 */
export async function getPermissions(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const appCode = url.searchParams.get('app_code');
    const isGroup = url.searchParams.get('is_group');
    const search = url.searchParams.get('search');
    const limit = parseInt(url.searchParams.get('limit') || '1000');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const supabase = getSupabaseClient();
    let query = supabase
      .from('permissions')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)
      .order('path', { ascending: true });

    if (appCode) {
      query = query.eq('app_code', appCode);
    }

    if (isGroup !== null && isGroup !== '') {
      query = query.eq('is_group', isGroup === 'true');
    }

    if (search) {
      query = query.or(`code.ilike.%${search}%,name.ilike.%${search}%`);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching permissions:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Database error', 
          details: error.message 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ data, count, limit, offset }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error in getPermissions:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * GET /permissions/tree/:app_code
 * Lấy cấu trúc cây permissions theo app_code
 */
export async function getPermissionsTree(appCode: string): Promise<Response> {
  try {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('permissions')
      .select('*')
      .eq('app_code', appCode)
      .is('deleted_at', null)
      .order('path', { ascending: true });

    if (error) {
      console.error('Error fetching permissions tree:', error);
      return new Response(
        JSON.stringify({ error: 'Database error', details: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build tree structure
    const tree = buildTree(data || []);

    return new Response(
      JSON.stringify({ data: tree }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error in getPermissionsTree:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Helper: Build tree structure from flat list
 */
function buildTree(permissions: Permission[]): Permission[] {
  const map = new Map<string, Permission & { children?: Permission[] }>();
  const roots: (Permission & { children?: Permission[] })[] = [];

  // Create map
  permissions.forEach(perm => {
    map.set(perm.code, { ...perm, children: [] });
  });

  // Build tree
  permissions.forEach(perm => {
    const node = map.get(perm.code)!;
    if (perm.parent_code && map.has(perm.parent_code)) {
      const parent = map.get(perm.parent_code)!;
      parent.children = parent.children || [];
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

/**
 * GET /permissions/:id
 * Lấy chi tiết một permission
 */
export async function getPermissionById(id: string): Promise<Response> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('permissions')
      .select('*')
      .eq('_id', id)
      .is('deleted_at', null)
      .single();

    if (error) {
      return new Response(
        JSON.stringify({ error: 'Permission not found', details: error.message }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * POST /permissions
 * Tạo mới permission
 */
export async function createPermission(request: Request): Promise<Response> {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.app_code || !body.code || !body.name) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields', 
          details: 'app_code, code, and name are required' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = getSupabaseClient();

    // Check if code already exists
    const { data: existing } = await supabase
      .from('permissions')
      .select('code')
      .eq('code', body.code)
      .is('deleted_at', null)
      .single();

    if (existing) {
      return new Response(
        JSON.stringify({ 
          error: 'Code already exists', 
          details: `Permission with code "${body.code}" already exists` 
        }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify app_code exists
    const { data: app } = await supabase
      .from('applications')
      .select('code')
      .eq('code', body.app_code)
      .is('deleted_at', null)
      .single();

    if (!app) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid app_code', 
          details: `Application with code "${body.app_code}" not found` 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const newPermission: Permission = {
      app_code: body.app_code,
      code: body.code,
      parent_code: body.parent_code || null,
      is_group: body.is_group !== undefined ? body.is_group : false,
      name: body.name,
      description: body.description || null,
      created_by: body.created_by || null,
      updated_by: body.created_by || null,
      version: 1,
    };

    const { data, error } = await supabase
      .from('permissions')
      .insert([newPermission])
      .select()
      .single();

    if (error) {
      console.error('Error creating permission:', error);
      return new Response(
        JSON.stringify({ error: 'Database error', details: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify(data), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Unexpected error in createPermission:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * PUT /permissions/:id
 * Cập nhật permission
 */
export async function updatePermission(id: string, request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const supabase = getSupabaseClient();

    // Get current version
    const { data: current, error: fetchError } = await supabase
      .from('permissions')
      .select('version, code')
      .eq('_id', id)
      .is('deleted_at', null)
      .single();

    if (fetchError || !current) {
      return new Response(
        JSON.stringify({ error: 'Permission not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check version for optimistic locking
    if (body.version !== undefined && body.version !== current.version) {
      return new Response(
        JSON.stringify({ 
          error: 'Version conflict', 
          details: 'Permission has been modified. Please refresh and try again.' 
        }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if new code already exists
    if (body.code && body.code !== current.code) {
      const { data: existing } = await supabase
        .from('permissions')
        .select('code')
        .eq('code', body.code)
        .is('deleted_at', null)
        .neq('_id', id)
        .single();

      if (existing) {
        return new Response(
          JSON.stringify({ error: 'Code already exists' }),
          { status: 409, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    const updateData: Partial<Permission> = {
      ...body,
      updated_by: body.updated_by || null,
      version: (current.version || 1) + 1,
      updated_at: new Date().toISOString(),
    };

    // Remove protected fields
    delete (updateData as any)._id;
    delete (updateData as any).created_at;
    delete (updateData as any).created_by;
    delete (updateData as any).deleted_at;
    delete (updateData as any).deleted_by;
    delete (updateData as any).path; // Path is auto-calculated by trigger

    const { data, error } = await supabase
      .from('permissions')
      .update(updateData)
      .eq('_id', id)
      .eq('version', current.version)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) {
      console.error('Error updating permission:', error);
      return new Response(
        JSON.stringify({ error: 'Database error', details: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Unexpected error in updatePermission:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * DELETE /permissions/:id
 * Xóa mềm permission
 */
export async function deletePermission(id: string, deletedBy?: string): Promise<Response> {
  try {
    const supabase = getSupabaseClient();

    // Check if permission exists
    const { data: existing } = await supabase
      .from('permissions')
      .select('_id, code')
      .eq('_id', id)
      .is('deleted_at', null)
      .single();

    if (!existing) {
      return new Response(
        JSON.stringify({ error: 'Permission not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if permission has children
    const { data: children } = await supabase
      .from('permissions')
      .select('_id')
      .eq('parent_code', existing.code)
      .is('deleted_at', null);

    if (children && children.length > 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Cannot delete permission with children', 
          details: 'Please delete child permissions first' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { data, error } = await supabase
      .from('permissions')
      .update({ 
        deleted_at: new Date().toISOString(),
        deleted_by: deletedBy || null,
      })
      .eq('_id', id)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) {
      console.error('Error deleting permission:', error);
      return new Response(
        JSON.stringify({ error: 'Database error', details: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Unexpected error in deletePermission:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
