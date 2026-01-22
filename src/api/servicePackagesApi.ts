/**
 * Service Packages API Client
 * Manages service packages (pricing plans) for SaaS products
 * 
 * ✅ 100% COMPLIANT with database schema (2026-01-20)
 * Matches: public.service_packages table structure
 */

import { getSupabaseClient } from '../lib/supabase';

// ==================== TYPES ====================

export interface ServicePackage {
  _id: string;                       // uuid not null primary key
  tenant_id: string;                 // uuid not null
  product_id: string;                // uuid not null references saas_products
  package_code: string;              // varchar not null
  package_name: string;              // varchar not null
  description?: string;              // text
  billing_cycle: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'LIFETIME' | 'ONE_TIME' | 'CUSTOM';
  price: number;                     // numeric not null default 0.00 check (price >= 0)
  currency: string;                  // varchar not null default 'USD'
  features_config: Record<string, any>; // jsonb default '[]' (Entitlements)
  limits_config: Record<string, any>;   // jsonb default '{}' (Limits)
  display_order: number;             // integer default 0 check (display_order >= 0)
  is_public: boolean;                // boolean default true
  is_active: boolean;                // boolean default true
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  deleted_at?: string;
  deleted_by?: string;
  version: number;                   // integer not null default 1
}

export interface CreateServicePackageRequest {
  tenant_id: string;
  product_id: string;
  package_code: string;
  package_name: string;
  description?: string;
  billing_cycle?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'LIFETIME' | 'ONE_TIME' | 'CUSTOM';
  price: number;
  currency?: string;
  features_config?: Record<string, any>;
  limits_config?: Record<string, any>;
  display_order?: number;
  is_public?: boolean;
  is_active?: boolean;
}

export interface UpdateServicePackageRequest {
  package_name?: string;
  description?: string;
  billing_cycle?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'LIFETIME' | 'ONE_TIME' | 'CUSTOM';
  price?: number;
  currency?: string;
  features_config?: Record<string, any>;
  limits_config?: Record<string, any>;
  display_order?: number;
  is_public?: boolean;
  is_active?: boolean;
  version: number; // Required for optimistic locking
}

export interface ServicePackageFilters {
  tenant_id?: string;
  product_id?: string;
  is_active?: boolean;
  is_public?: boolean;
  search?: string;
  include_deleted?: boolean;
  limit?: number;
  offset?: number;
}

// ==================== API CLIENT ====================

export const servicePackagesApi = {
  /**
   * GET /service-packages
   */
  getAll: async (filters?: ServicePackageFilters): Promise<ServicePackage[]> => {
    const supabase = getSupabaseClient();
    let query = supabase
      .from('service_packages')
      .select(`
        *,
        product:saas_products(name, code)
      `)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    // Filter out deleted by default
    if (!filters?.include_deleted) {
      query = query.is('deleted_at', null);
    }

    // Apply filters
    if (filters?.tenant_id) query = query.eq('tenant_id', filters.tenant_id);
    if (filters?.product_id) query = query.eq('product_id', filters.product_id);
    if (filters?.is_active !== undefined) query = query.eq('is_active', filters.is_active);
    if (filters?.is_public !== undefined) query = query.eq('is_public', filters.is_public);

    // Pagination
    if (filters?.limit) query = query.limit(filters.limit);
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Failed to fetch service packages: ${error.message}`);

    let result = data as ServicePackage[];

    // Client-side search
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(p => 
        p.package_name.toLowerCase().includes(search) || 
        p.package_code.toLowerCase().includes(search) || 
        (p.description && p.description.toLowerCase().includes(search))
      );
    }

    return result;
  },

  /**
   * GET /service-packages/:id
   */
  getById: async (id: string): Promise<ServicePackage> => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('service_packages')
      .select('*')
      .eq('_id', id)
      .single();

    if (error) throw new Error(`Failed to fetch service package: ${error.message}`);
    return data as ServicePackage;
  },

  /**
   * POST /service-packages
   */
  create: async (data: CreateServicePackageRequest): Promise<ServicePackage> => {
    // Validate required fields
    if (!data.tenant_id) throw new Error('Tenant ID is required');
    if (!data.product_id) throw new Error('Product ID is required');
    if (!data.package_code) throw new Error('Package Code is required');
    if (!data.package_name) throw new Error('Package Name is required');
    if (data.price < 0) throw new Error('Price must be >= 0');

    const supabase = getSupabaseClient();
    const _id = crypto.randomUUID();
    const now = new Date().toISOString();

    const requestData = {
      _id,
      ...data,
      currency: data.currency || 'USD', // Default as per schema
      billing_cycle: data.billing_cycle || 'MONTHLY',
      features_config: data.features_config || {},
      limits_config: data.limits_config || {},
      display_order: data.display_order ?? 0,
      is_public: data.is_public ?? true,
      is_active: data.is_active ?? true,
      created_at: now,
      updated_at: now,
      version: 1,
    };

    const { data: created, error } = await supabase
      .from('service_packages')
      .insert([requestData])
      .select()
      .single();

    if (error) throw new Error(`Failed to create service package: ${error.message}`);
    return created as ServicePackage;
  },

  /**
   * PATCH /service-packages/:id
   */
  update: async (id: string, data: UpdateServicePackageRequest): Promise<ServicePackage> => {
    const supabase = getSupabaseClient();

    // 1. Get current version
    let currentVersion = data.version;
    if (currentVersion === undefined) {
      const { data: current, error: fetchError } = await supabase
        .from('service_packages')
        .select('version')
        .eq('_id', id)
        .single();
      
      if (fetchError || !current) {
        throw new Error('Service package not found or access denied');
      }
      currentVersion = current.version;
    }

    const nextVersion = currentVersion + 1;
    const now = new Date().toISOString();

    const { version, ...updateFields } = data;

    const updateData = {
      ...updateFields,
      updated_at: now,
      version: nextVersion,
    };

    const { data: updated, error } = await supabase
      .from('service_packages')
      .update(updateData)
      .eq('_id', id)
      .eq('version', currentVersion)
      .select()
      .single();

    if (error) throw new Error(`Failed to update service package: ${error.message}`);
    if (!updated) throw new Error('Concurrent modification detected. Please refresh and try again.');

    return updated as ServicePackage;
  },

  /**
   * DELETE /service-packages/:id
   * Soft Delete with Version Check
   */
  delete: async (id: string, version?: number): Promise<void> => {
    const supabase = getSupabaseClient();

    let currentVersion = version;
    if (currentVersion === undefined) {
      const { data: current, error: fetchError } = await supabase
        .from('service_packages')
        .select('version')
        .eq('_id', id)
        .single();
      
      if (fetchError || !current) {
        return; // Already deleted
      }
      currentVersion = current.version;
    }

    const nextVersion = currentVersion + 1;

    const { error } = await supabase
      .from('service_packages')
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        version: nextVersion,
        is_active: false // Archive implies inactive
      })
      .eq('_id', id)
      .eq('version', currentVersion);

    if (error) throw new Error(`Failed to delete service package: ${error.message}`);
  }
};

export default servicePackagesApi;