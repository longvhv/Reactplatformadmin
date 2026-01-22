/**
 * SaaS Product Types API Client
 * Manages SaaS product types
 * 
 * ✅ 100% COMPLIANT with database schema (2026-01-20)
 * Matches: public.saas_product_types table structure
 */

import { getSupabaseClient } from '../lib/supabase';

// ==================== TYPES ====================

/**
 * SaasProductType - 100% matches saas_product_types table
 */
export interface SaasProductType {
  // Identity
  _id: string;                       // uuid not null primary key
  
  // Product Type Information
  code: string;                      // varchar(50) not null unique
  name: string;                      // text not null
  description?: string;              // text nullable
  
  // Status
  is_active: boolean;                // boolean not null default true
  
  // Audit Fields
  created_at: string;                // timestamptz not null default now()
  updated_at: string;                // timestamptz not null default now()
  
  // Versioning
  version: number;                   // bigint not null default 1
}

/**
 * Create SaaS Product Type Request
 */
export interface CreateSaasProductTypeRequest {
  code: string;
  name: string;
  description?: string;
  is_active?: boolean;
}

/**
 * Update SaaS Product Type Request
 */
export interface UpdateSaasProductTypeRequest {
  name?: string;
  description?: string;
  is_active?: boolean;
  version: number; // Required for optimistic locking
}

/**
 * SaaS Product Type Filters
 */
export interface SaasProductTypeFilters {
  is_active?: boolean;
  search?: string;
  code?: string; // Exact match
  code_prefix?: string;
  limit?: number;
  offset?: number;
}

// ==================== API CLIENT ====================

export const saasProductTypesApi = {
  /**
   * GET /saas-product-types
   */
  getAll: async (filters?: SaasProductTypeFilters): Promise<SaasProductType[]> => {
    const supabase = getSupabaseClient();
    let query = supabase
      .from('saas_product_types')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters?.is_active !== undefined) query = query.eq('is_active', filters.is_active);
    if (filters?.code) query = query.eq('code', filters.code);
    
    // Pagination
    if (filters?.limit) query = query.limit(filters.limit);
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Failed to fetch SaaS product types: ${error.message}`);
    
    // Client-side filtering for search/prefix if needed (or assume DB support)
    let result = data as SaasProductType[];
    
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(item => 
        item.name.toLowerCase().includes(search) || 
        item.code.toLowerCase().includes(search) ||
        (item.description && item.description.toLowerCase().includes(search))
      );
    }

    if (filters?.code_prefix) {
      result = result.filter(item => item.code.startsWith(filters.code_prefix!));
    }

    return result;
  },

  /**
   * GET /saas-product-types/:id
   */
  getById: async (id: string): Promise<SaasProductType> => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('saas_product_types')
      .select('*')
      .eq('_id', id)
      .single();

    if (error) throw new Error(`Failed to fetch SaaS product type: ${error.message}`);
    return data as SaasProductType;
  },

  /**
   * POST /saas-product-types
   */
  create: async (data: CreateSaasProductTypeRequest): Promise<SaasProductType> => {
    // Validate code format: /^[A-Z0-9_]+$/
    if (!data.code || !/^[A-Z0-9_]+$/.test(data.code)) {
      throw new Error('Code must contain only uppercase letters, numbers, and underscores (A-Z, 0-9, _)');
    }
    
    const supabase = getSupabaseClient();
    const _id = crypto.randomUUID();
    const now = new Date().toISOString();

    const requestData = {
      _id,
      ...data,
      is_active: data.is_active ?? true,
      created_at: now,
      updated_at: now,
      version: 1,
    };

    const { data: created, error } = await supabase
      .from('saas_product_types')
      .insert([requestData])
      .select()
      .single();

    if (error) throw new Error(`Failed to create SaaS product type: ${error.message}`);
    return created as SaasProductType;
  },

  /**
   * PATCH /saas-product-types/:id
   */
  update: async (id: string, data: UpdateSaasProductTypeRequest): Promise<SaasProductType> => {
    const supabase = getSupabaseClient();

    // 1. Get current version if not provided (though it should be required in interface)
    let currentVersion = data.version;
    if (currentVersion === undefined) {
      const { data: current, error: fetchError } = await supabase
        .from('saas_product_types')
        .select('version')
        .eq('_id', id)
        .single();
      
      if (fetchError || !current) {
        throw new Error('SaaS product type not found or access denied');
      }
      currentVersion = current.version;
    }

    const nextVersion = currentVersion + 1;
    const now = new Date().toISOString();

    // Prepare update data
    const { version, ...updateFields } = data;

    const updateData = {
      ...updateFields,
      updated_at: now,
      version: nextVersion,
    };

    const { data: updated, error } = await supabase
      .from('saas_product_types')
      .update(updateData)
      .eq('_id', id)
      .eq('version', currentVersion) // Optimistic locking
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // JSON object requested, multiple (or no) rows returned
         throw new Error('Concurrent modification detected or item deleted. Please refresh.');
      }
      throw new Error(`Failed to update SaaS product type: ${error.message}`);
    }

    return updated as SaasProductType;
  },

  /**
   * DELETE /saas-product-types/:id
   * Hard Delete with Version Check
   */
  delete: async (id: string, version?: number): Promise<void> => {
    const supabase = getSupabaseClient();

    let currentVersion = version;
    if (currentVersion === undefined) {
      const { data: current, error: fetchError } = await supabase
        .from('saas_product_types')
        .select('version')
        .eq('_id', id)
        .single();
      
      if (fetchError || !current) {
        return; // Already deleted or not found
      }
      currentVersion = current.version;
    }

    const { error, count } = await supabase
      .from('saas_product_types')
      .delete({ count: 'exact' }) // Return count of deleted rows
      .eq('_id', id)
      .eq('version', currentVersion);

    if (error) throw new Error(`Failed to delete SaaS product type: ${error.message}`);
    
    // If count is 0, it means version didn't match (or id not found)
    if (count === 0) {
       throw new Error('Concurrent modification detected. The item might have been modified or deleted by another user.');
    }
  },

  /**
   * Validation Helper
   */
  validateCode: (code: string): boolean => {
    return /^[A-Z0-9_]+$/.test(code);
  }
};

// Export individual validation function for convenience
export const validateCode = saasProductTypesApi.validateCode;

export default saasProductTypesApi;
