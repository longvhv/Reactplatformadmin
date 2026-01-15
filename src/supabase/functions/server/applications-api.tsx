/**
 * Applications API
 * CRUD operations cho bảng applications (GLOBAL table)
 * Tuân thủ chuẩn go-framework: UUID v7, snake_case, audit trail, soft delete
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

/**
 * Tạo Supabase client với service role key
 */
function getSupabaseClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

/**
 * Interface cho Application
 */
interface Application {
  _id?: string;
  code: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
  deleted_at?: string | null;
  deleted_by?: string | null;
  version?: number;
}

/**
 * GET /make-server-7eedb4e0/applications
 * Lấy danh sách tất cả applications (chưa bị xóa mềm)
 */
export async function getApplications(request: Request): Promise<Response> {
  try {
    console.log('getApplications called');
    console.log('SUPABASE_URL:', SUPABASE_URL);
    console.log('SUPABASE_SERVICE_ROLE_KEY exists:', !!SUPABASE_SERVICE_ROLE_KEY);
    
    const url = new URL(request.url);
    const isActive = url.searchParams.get('is_active');
    const search = url.searchParams.get('search');
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    console.log('Query params:', { isActive, search, limit, offset });

    const supabase = getSupabaseClient();
    let query = supabase
      .from('applications')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    // Filter by is_active - fix: check if the param exists, not if it's null
    if (isActive !== null && isActive !== undefined && isActive !== '') {
      console.log('Filtering by is_active:', isActive === 'true');
      query = query.eq('is_active', isActive === 'true');
    }

    // Search by code or name
    if (search) {
      console.log('Searching for:', search);
      query = query.or(`code.ilike.%${search}%,name.ilike.%${search}%`);
    }

    // Pagination
    query = query.range(offset, offset + limit - 1);

    console.log('Executing query...');
    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching applications:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return new Response(
        JSON.stringify({ 
          error: 'Database error while fetching applications', 
          details: error.message,
          code: error.code,
          hint: error.hint
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Successfully fetched ${data?.length || 0} applications`);
    return new Response(
      JSON.stringify({ 
        data, 
        count,
        limit,
        offset 
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error in getApplications:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'N/A');
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: String(error),
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * GET /make-server-7eedb4e0/applications/:id
 * Lấy chi tiết một application theo ID
 */
export async function getApplicationById(id: string): Promise<Response> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('_id', id)
      .is('deleted_at', null)
      .single();

    if (error) {
      console.error(`Error fetching application ${id}:`, error);
      return new Response(
        JSON.stringify({ 
          error: 'Application not found', 
          details: error.message 
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Unexpected error in getApplicationById:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * POST /make-server-7eedb4e0/applications
 * Tạo mới một application
 */
export async function createApplication(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.code || !body.name) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields', 
          details: 'code and name are required' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate code format (only uppercase letters, numbers, and underscores)
    if (!/^[A-Z0-9_]+$/.test(body.code)) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid code format', 
          details: 'code must contain only uppercase letters, numbers, and underscores' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = getSupabaseClient();
    
    // Check if code already exists
    const { data: existing } = await supabase
      .from('applications')
      .select('code')
      .eq('code', body.code)
      .is('deleted_at', null)
      .single();

    if (existing) {
      return new Response(
        JSON.stringify({ 
          error: 'Code already exists', 
          details: `Application with code "${body.code}" already exists` 
        }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const newApplication: Application = {
      code: body.code,
      name: body.name,
      description: body.description || null,
      is_active: body.is_active !== undefined ? body.is_active : true,
      created_by: body.created_by || null,
      updated_by: body.created_by || null,
      version: 1,
    };

    const { data, error } = await supabase
      .from('applications')
      .insert([newApplication])
      .select()
      .single();

    if (error) {
      console.error('Error creating application:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Database error while creating application', 
          details: error.message 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify(data), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Unexpected error in createApplication:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * PUT /make-server-7eedb4e0/applications/:id
 * Cập nhật một application (với optimistic locking)
 */
export async function updateApplication(id: string, request: Request): Promise<Response> {
  try {
    const body = await request.json();

    // Validate code format if provided
    if (body.code && !/^[A-Z0-9_]+$/.test(body.code)) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid code format', 
          details: 'code must contain only uppercase letters, numbers, and underscores' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = getSupabaseClient();

    // Get current version for optimistic locking
    const { data: current, error: fetchError } = await supabase
      .from('applications')
      .select('version, code')
      .eq('_id', id)
      .is('deleted_at', null)
      .single();

    if (fetchError || !current) {
      return new Response(
        JSON.stringify({ 
          error: 'Application not found', 
          details: 'Application does not exist or has been deleted' 
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check version for optimistic locking
    if (body.version !== undefined && body.version !== current.version) {
      return new Response(
        JSON.stringify({ 
          error: 'Version conflict', 
          details: 'Application has been modified by another user. Please refresh and try again.' 
        }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if new code already exists (if code is being changed)
    if (body.code && body.code !== current.code) {
      const { data: existing } = await supabase
        .from('applications')
        .select('code')
        .eq('code', body.code)
        .is('deleted_at', null)
        .neq('_id', id)
        .single();

      if (existing) {
        return new Response(
          JSON.stringify({ 
            error: 'Code already exists', 
            details: `Application with code "${body.code}" already exists` 
          }),
          { status: 409, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    const updateData: Partial<Application> = {
      ...body,
      updated_by: body.updated_by || null,
      version: (current.version || 1) + 1,
      updated_at: new Date().toISOString(),
    };

    // Remove fields that shouldn't be updated
    delete (updateData as any)._id;
    delete (updateData as any).created_at;
    delete (updateData as any).created_by;
    delete (updateData as any).deleted_at;
    delete (updateData as any).deleted_by;

    const { data, error } = await supabase
      .from('applications')
      .update(updateData)
      .eq('_id', id)
      .eq('version', current.version)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) {
      console.error(`Error updating application ${id}:`, error);
      return new Response(
        JSON.stringify({ 
          error: 'Database error while updating application', 
          details: error.message 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Unexpected error in updateApplication:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * DELETE /make-server-7eedb4e0/applications/:id
 * Xóa mềm một application (soft delete)
 */
export async function deleteApplication(id: string, deletedBy?: string): Promise<Response> {
  try {
    const supabase = getSupabaseClient();

    // Check if application exists
    const { data: existing } = await supabase
      .from('applications')
      .select('_id')
      .eq('_id', id)
      .is('deleted_at', null)
      .single();

    if (!existing) {
      return new Response(
        JSON.stringify({ 
          error: 'Application not found', 
          details: 'Application does not exist or has been deleted' 
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { data, error } = await supabase
      .from('applications')
      .update({ 
        deleted_at: new Date().toISOString(),
        deleted_by: deletedBy || null,
      })
      .eq('_id', id)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) {
      console.error(`Error deleting application ${id}:`, error);
      return new Response(
        JSON.stringify({ 
          error: 'Database error while deleting application', 
          details: error.message 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Application deleted successfully',
      data 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Unexpected error in deleteApplication:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * PATCH /make-server-7eedb4e0/applications/:id/toggle-active
 * Toggle trạng thái is_active của application
 */
export async function toggleApplicationActive(id: string, userId?: string): Promise<Response> {
  try {
    const supabase = getSupabaseClient();

    // Get current state
    const { data: current, error: fetchError } = await supabase
      .from('applications')
      .select('is_active, version')
      .eq('_id', id)
      .is('deleted_at', null)
      .single();

    if (fetchError || !current) {
      return new Response(
        JSON.stringify({ 
          error: 'Application not found', 
          details: 'Application does not exist or has been deleted' 
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Toggle is_active
    const { data, error } = await supabase
      .from('applications')
      .update({ 
        is_active: !current.is_active,
        updated_by: userId || null,
        version: (current.version || 1) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('_id', id)
      .eq('version', current.version)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) {
      console.error(`Error toggling application active status ${id}:`, error);
      return new Response(
        JSON.stringify({ 
          error: 'Database error while toggling application status', 
          details: error.message 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Unexpected error in toggleApplicationActive:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * GET /make-server-7eedb4e0/applications/:id/stats
 * Lấy thống kê của một application
 */
export async function getApplicationStats(id: string): Promise<Response> {
  try {
    const supabase = getSupabaseClient();

    // Verify application exists
    const { data: app, error: appError } = await supabase
      .from('applications')
      .select('_id, code, name')
      .eq('_id', id)
      .is('deleted_at', null)
      .single();

    if (appError || !app) {
      return new Response(
        JSON.stringify({ 
          error: 'Application not found', 
          details: 'Application does not exist or has been deleted' 
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get total capabilities for this app
    const { count: totalCapabilities } = await supabase
      .from('app_capabilities')
      .select('*', { count: 'exact', head: true })
      .eq('app_code', app.code)
      .is('deleted_at', null);

    // Get active capabilities
    const { count: activeCapabilities } = await supabase
      .from('app_capabilities')
      .select('*', { count: 'exact', head: true })
      .eq('app_code', app.code)
      .eq('is_active', true)
      .is('deleted_at', null);

    // Get total tenants using this application
    const { count: totalTenants } = await supabase
      .from('tenant_applications')
      .select('*', { count: 'exact', head: true })
      .eq('app_code', app.code)
      .is('deleted_at', null);

    // Get active tenants
    const { count: activeTenants } = await supabase
      .from('tenant_applications')
      .select('*', { count: 'exact', head: true })
      .eq('app_code', app.code)
      .eq('is_active', true)
      .is('deleted_at', null);

    // Get top tenants by usage (mock calculation based on tenant count)
    const { data: topTenantsData } = await supabase
      .from('tenant_applications')
      .select(`
        tenant_code,
        tenants!inner(name)
      `)
      .eq('app_code', app.code)
      .eq('is_active', true)
      .is('deleted_at', null)
      .limit(5);

    const topTenants = (topTenantsData || []).map((item: any, index: number) => ({
      tenant_code: item.tenant_code,
      name: item.tenants?.name || 'Unknown Tenant',
      usage: Math.floor(Math.random() * 1000) + 500, // Mock usage for now
      percentage: 100 - (index * 15), // Mock percentage
    }));

    // Calculate usage this month (mock for now)
    const usageThisMonth = Math.floor(Math.random() * 10000) + 5000;

    const stats = {
      totalCapabilities: totalCapabilities || 0,
      activeCapabilities: activeCapabilities || 0,
      totalTenants: totalTenants || 0,
      activeTenants: activeTenants || 0,
      usageThisMonth,
      topTenants,
    };

    return new Response(JSON.stringify(stats), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Unexpected error in getApplicationStats:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}