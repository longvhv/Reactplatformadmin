/**
 * SaaS Product Types API
 * Master Data API cho quản lý phân loại sản phẩm SaaS
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

function getSupabaseClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

/**
 * GET /saas-product-types
 * Lấy danh sách tất cả product types
 */
export async function listProductTypes(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const isActive = url.searchParams.get('is_active');
    const search = url.searchParams.get('search');
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const supabase = getSupabaseClient();

    let query = supabase
      .from('saas_product_types')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: true });

    // Filter by active status
    if (isActive !== null && isActive !== '') {
      query = query.eq('is_active', isActive === 'true');
    }

    // Search in code or name
    if (search) {
      query = query.or(`code.ilike.%${search}%,name.ilike.%${search}%`);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching product types:', error);
      return new Response(
        JSON.stringify({ error: 'Database error', details: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

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
    console.error('Unexpected error in listProductTypes:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * GET /saas-product-types/:id
 * Lấy chi tiết một product type
 */
export async function getProductType(id: string): Promise<Response> {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('saas_product_types')
      .select('*')
      .eq('_id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return new Response(
          JSON.stringify({ error: 'Product type not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }
      console.error('Error fetching product type:', error);
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
    console.error('Unexpected error in getProductType:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * GET /saas-product-types/by-code/:code
 * Lấy product type theo code
 */
export async function getProductTypeByCode(code: string): Promise<Response> {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('saas_product_types')
      .select('*')
      .eq('code', code)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return new Response(
          JSON.stringify({ error: 'Product type not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }
      console.error('Error fetching product type by code:', error);
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
    console.error('Unexpected error in getProductTypeByCode:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * POST /saas-product-types
 * Tạo product type mới
 */
export async function createProductType(request: Request): Promise<Response> {
  try {
    const body = await request.json();

    // Validation
    if (!body.code || !body.name) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields', 
          details: 'code and name are required' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate code format
    if (!/^[A-Z0-9_]+$/.test(body.code)) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid code format', 
          details: 'Code must contain only uppercase letters, numbers, and underscores' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = getSupabaseClient();

    const newProductType = {
      _id: crypto.randomUUID(), // Generate UUID
      code: body.code,
      name: body.name,
      description: body.description || null,
      is_active: body.is_active !== undefined ? body.is_active : true,
      version: 1,
    };

    const { data, error } = await supabase
      .from('saas_product_types')
      .insert([newProductType])
      .select()
      .single();

    if (error) {
      console.error('Error creating product type:', error);
      
      // Check for unique constraint violation
      if (error.code === '23505') {
        return new Response(
          JSON.stringify({ 
            error: 'Duplicate code', 
            details: 'A product type with this code already exists' 
          }),
          { status: 409, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
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
    console.error('Unexpected error in createProductType:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * PUT /saas-product-types/:id
 * Cập nhật product type
 */
export async function updateProductType(id: string, request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const supabase = getSupabaseClient();

    const updateData: any = {
      ...body,
      updated_at: new Date().toISOString(),
    };

    // Remove protected fields
    delete updateData._id;
    delete updateData.code; // Code không được phép thay đổi
    delete updateData.created_at;

    const { data, error } = await supabase
      .from('saas_product_types')
      .update(updateData)
      .eq('_id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return new Response(
          JSON.stringify({ error: 'Product type not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }
      console.error('Error updating product type:', error);
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
    console.error('Unexpected error in updateProductType:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * DELETE /saas-product-types/:id
 * Xóa product type (hard delete vì là master data)
 * Note: Chỉ admin mới được phép xóa
 */
export async function deleteProductType(id: string): Promise<Response> {
  try {
    const supabase = getSupabaseClient();

    // Set is_active = false instead of hard delete để giữ data integrity
    const { data, error } = await supabase
      .from('saas_product_types')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString() 
      })
      .eq('_id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return new Response(
          JSON.stringify({ error: 'Product type not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }
      console.error('Error deleting product type:', error);
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
    console.error('Unexpected error in deleteProductType:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * PATCH /saas-product-types/:id/activate
 * Kích hoạt product type
 */
export async function activateProductType(id: string): Promise<Response> {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('saas_product_types')
      .update({ 
        is_active: true,
        updated_at: new Date().toISOString() 
      })
      .eq('_id', id)
      .select()
      .single();

    if (error) {
      console.error('Error activating product type:', error);
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
    console.error('Unexpected error in activateProductType:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
