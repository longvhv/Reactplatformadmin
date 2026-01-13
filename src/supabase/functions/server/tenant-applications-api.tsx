/**
 * Tenant Applications API
 * Quản lý mapping giữa Tenants và Applications
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

function getSupabaseClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

/**
 * GET /tenant-applications/by-app/:app_code
 * Lấy danh sách tenants sử dụng một application
 */
export async function getTenantsByApp(appCode: string, request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const isActive = url.searchParams.get('is_active');
    const search = url.searchParams.get('search');
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const supabase = getSupabaseClient();

    // Query with JOIN to get tenant info
    let query = supabase
      .from('tenant_applications')
      .select(`
        *,
        tenants (
          _id,
          code,
          name,
          tier,
          status,
          data_region,
          created_at
        )
      `, { count: 'exact' })
      .eq('app_code', appCode)
      .is('deleted_at', null);

    if (isActive !== null && isActive !== '') {
      query = query.eq('is_active', isActive === 'true');
    }

    // Search in tenant name or code
    if (search) {
      // Note: We can't directly filter on joined table in Supabase
      // So we'll filter in-memory after fetch
      // For production, consider using a view or RPC
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching tenants by app:', error);
      return new Response(
        JSON.stringify({ error: 'Database error', details: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Filter by search if provided
    let filteredData = data || [];
    if (search && filteredData.length > 0) {
      const searchLower = search.toLowerCase();
      filteredData = filteredData.filter((item: any) => {
        const tenant = item.tenants;
        return tenant && (
          tenant.name?.toLowerCase().includes(searchLower) ||
          tenant.code?.toLowerCase().includes(searchLower)
        );
      });
    }

    return new Response(
      JSON.stringify({ 
        data: filteredData, 
        count: filteredData.length,
        total: count,
        limit, 
        offset 
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error in getTenantsByApp:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * GET /tenant-applications/by-tenant/:tenant_id
 * Lấy danh sách applications mà một tenant đang sử dụng
 */
export async function getAppsByTenant(tenantId: string, request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const isActive = url.searchParams.get('is_active');

    const supabase = getSupabaseClient();

    let query = supabase
      .from('tenant_applications')
      .select(`
        *,
        applications (
          _id,
          code,
          name,
          description,
          is_active
        )
      `)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null);

    if (isActive !== null && isActive !== '') {
      query = query.eq('is_active', isActive === 'true');
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching apps by tenant:', error);
      return new Response(
        JSON.stringify({ error: 'Database error', details: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ data }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error in getAppsByTenant:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * POST /tenant-applications
 * Gán application cho tenant
 */
export async function assignAppToTenant(request: Request): Promise<Response> {
  try {
    const body = await request.json();

    if (!body.tenant_id || !body.app_code) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields', 
          details: 'tenant_id and app_code are required' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = getSupabaseClient();

    const newAssignment = {
      tenant_id: body.tenant_id,
      app_code: body.app_code,
      is_active: body.is_active !== undefined ? body.is_active : true,
      license_type: body.license_type || 'TRIAL',
      max_users: body.max_users || 10,
      expires_at: body.expires_at || null,
      settings: body.settings || {},
      activated_at: body.is_active ? new Date().toISOString() : null,
      created_by: body.created_by || null,
      updated_by: body.created_by || null,
      version: 1,
    };

    const { data, error } = await supabase
      .from('tenant_applications')
      .insert([newAssignment])
      .select()
      .single();

    if (error) {
      console.error('Error assigning app to tenant:', error);
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
    console.error('Unexpected error in assignAppToTenant:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * PUT /tenant-applications/:id
 * Cập nhật tenant-application mapping
 */
export async function updateTenantApplication(id: string, request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const supabase = getSupabaseClient();

    const updateData: any = {
      ...body,
      updated_by: body.updated_by || null,
      updated_at: new Date().toISOString(),
    };

    // Remove protected fields
    delete updateData._id;
    delete updateData.created_at;
    delete updateData.created_by;
    delete updateData.deleted_at;
    delete updateData.deleted_by;
    delete updateData.tenant_id;
    delete updateData.app_code;

    const { data, error } = await supabase
      .from('tenant_applications')
      .update(updateData)
      .eq('_id', id)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) {
      console.error('Error updating tenant application:', error);
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
    console.error('Unexpected error in updateTenantApplication:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * DELETE /tenant-applications/:id
 * Xóa mapping (revoke app from tenant)
 */
export async function revokeTenantApplication(id: string, deletedBy?: string): Promise<Response> {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('tenant_applications')
      .update({ 
        deleted_at: new Date().toISOString(),
        deleted_by: deletedBy || null,
        is_active: false,
        deactivated_at: new Date().toISOString(),
      })
      .eq('_id', id)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) {
      console.error('Error revoking tenant application:', error);
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
    console.error('Unexpected error in revokeTenantApplication:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
