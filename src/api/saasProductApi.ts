/**
 * SaaS Product API
 * Complete CRUD operations with Supabase integration
 */

import { getSupabaseClient } from '../utils/supabase/client';

const TABLE_NAME = 'saas_products';

// ============================================
// Types & Interfaces
// ============================================

export type ProductStatus = 'active' | 'inactive' | 'archived';
export type BillingCycle = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'LIFETIME';

export interface SaaSProduct {
  _id?: string;
  tenant_id: string;
  code: string;
  name: string;
  description?: string;
  product_type_code?: string;
  base_price: number;
  currency: string;
  billing_cycle: BillingCycle;
  trial_days: number;
  features: Record<string, any>;
  limits: Record<string, any>;
  status: ProductStatus;
  is_featured: boolean;
  display_order: number;
  metadata: Record<string, any>;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
  deleted_at?: string | null;
  deleted_by?: string | null;
  version?: number;
}

export interface ProductFilters {
  tenant_id?: string;
  status?: ProductStatus;
  product_type_code?: string;
  is_featured?: boolean;
  search?: string;
}

export interface ProductStatistics {
  total: number;
  active: number;
  inactive: number;
  archived: number;
  featured: number;
  total_revenue: number;
}

// ============================================
// API Functions
// ============================================

export const saasProductApi = {
  /**
   * Get all products with optional filters
   */
  getAll: async (filters?: ProductFilters): Promise<SaaSProduct[]> => {
    try {
      const supabase = getSupabaseClient();
      let query = supabase
        .from(TABLE_NAME)
        .select('*')
        .is('deleted_at', null)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (filters?.tenant_id) {
        query = query.eq('tenant_id', filters.tenant_id);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.product_type_code) {
        query = query.eq('product_type_code', filters.product_type_code);
      }

      if (filters?.is_featured !== undefined) {
        query = query.eq('is_featured', filters.is_featured);
      }

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,code.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw new Error(error.message);
      return data || [];
    } catch (error: any) {
      console.error('Error in saasProductApi.getAll:', error);
      throw error;
    }
  },

  /**
   * Get active products only
   */
  getActive: async (tenant_id?: string): Promise<SaaSProduct[]> => {
    try {
      const supabase = getSupabaseClient();
      let query = supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('status', 'active')
        .is('deleted_at', null)
        .order('display_order', { ascending: true });

      if (tenant_id) {
        query = query.eq('tenant_id', tenant_id);
      }

      const { data, error } = await query;

      if (error) throw new Error(error.message);
      return data || [];
    } catch (error: any) {
      console.error('Error in saasProductApi.getActive:', error);
      throw error;
    }
  },

  /**
   * Get featured products
   */
  getFeatured: async (tenant_id?: string): Promise<SaaSProduct[]> => {
    try {
      const supabase = getSupabaseClient();
      let query = supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('status', 'active')
        .eq('is_featured', true)
        .is('deleted_at', null)
        .order('display_order', { ascending: true });

      if (tenant_id) {
        query = query.eq('tenant_id', tenant_id);
      }

      const { data, error } = await query;

      if (error) throw new Error(error.message);
      return data || [];
    } catch (error: any) {
      console.error('Error in saasProductApi.getFeatured:', error);
      throw error;
    }
  },

  /**
   * Get products by type
   */
  getByType: async (product_type_code: string, tenant_id?: string): Promise<SaaSProduct[]> => {
    try {
      const supabase = getSupabaseClient();
      let query = supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('product_type_code', product_type_code)
        .is('deleted_at', null)
        .order('display_order', { ascending: true });

      if (tenant_id) {
        query = query.eq('tenant_id', tenant_id);
      }

      const { data, error } = await query;

      if (error) throw new Error(error.message);
      return data || [];
    } catch (error: any) {
      console.error('Error in saasProductApi.getByType:', error);
      throw error;
    }
  },

  /**
   * Get a single product by ID
   */
  getById: async (id: string): Promise<SaaSProduct | null> => {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('_id', id)
        .is('deleted_at', null)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw new Error(error.message);
      }
      return data;
    } catch (error: any) {
      console.error('Error in saasProductApi.getById:', error);
      throw error;
    }
  },

  /**
   * Get a single product by code
   */
  getByCode: async (code: string, tenant_id: string): Promise<SaaSProduct | null> => {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('code', code)
        .eq('tenant_id', tenant_id)
        .is('deleted_at', null)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw new Error(error.message);
      }
      return data;
    } catch (error: any) {
      console.error('Error in saasProductApi.getByCode:', error);
      throw error;
    }
  },

  /**
   * Create a new product
   */
  create: async (product: Omit<SaaSProduct, '_id' | 'created_at' | 'updated_at' | 'version'>): Promise<SaaSProduct> => {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .insert([{
          ...product,
          version: 1,
        }])
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    } catch (error: any) {
      console.error('Error in saasProductApi.create:', error);
      throw error;
    }
  },

  /**
   * Update a product
   */
  update: async (id: string, updates: Partial<SaaSProduct>, currentVersion: number): Promise<SaaSProduct> => {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .update({
          ...updates,
          version: currentVersion + 1,
        })
        .eq('_id', id)
        .eq('version', currentVersion) // Optimistic locking
        .is('deleted_at', null)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Version conflict: Product was modified by another user. Please refresh and try again.');
        }
        throw new Error(error.message);
      }
      return data;
    } catch (error: any) {
      console.error('Error in saasProductApi.update:', error);
      throw error;
    }
  },

  /**
   * Soft delete a product
   */
  softDelete: async (id: string, deleted_by?: string): Promise<void> => {
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from(TABLE_NAME)
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by,
        })
        .eq('_id', id)
        .is('deleted_at', null);

      if (error) throw new Error(error.message);
    } catch (error: any) {
      console.error('Error in saasProductApi.softDelete:', error);
      throw error;
    }
  },

  /**
   * Restore a soft-deleted product
   */
  restore: async (id: string): Promise<SaaSProduct> => {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .update({
          deleted_at: null,
          deleted_by: null,
        })
        .eq('_id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    } catch (error: any) {
      console.error('Error in saasProductApi.restore:', error);
      throw error;
    }
  },

  /**
   * Hard delete a product (permanent)
   */
  hardDelete: async (id: string): Promise<void> => {
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from(TABLE_NAME)
        .delete()
        .eq('_id', id);

      if (error) throw new Error(error.message);
    } catch (error: any) {
      console.error('Error in saasProductApi.hardDelete:', error);
      throw error;
    }
  },

  /**
   * Change product status
   */
  changeStatus: async (id: string, status: ProductStatus, currentVersion: number): Promise<SaaSProduct> => {
    return saasProductApi.update(id, { status }, currentVersion);
  },

  /**
   * Toggle featured status
   */
  toggleFeatured: async (id: string, currentVersion: number): Promise<SaaSProduct> => {
    const product = await saasProductApi.getById(id);
    if (!product) throw new Error('Product not found');

    return saasProductApi.update(id, { is_featured: !product.is_featured }, currentVersion);
  },

  /**
   * Update display order
   */
  updateDisplayOrder: async (id: string, display_order: number, currentVersion: number): Promise<SaaSProduct> => {
    return saasProductApi.update(id, { display_order }, currentVersion);
  },

  /**
   * Bulk update display orders
   */
  bulkUpdateDisplayOrder: async (items: Array<{ id: string; order: number; version: number }>): Promise<void> => {
    const promises = items.map(item =>
      saasProductApi.update(item.id, { display_order: item.order }, item.version)
    );

    await Promise.all(promises);
  },

  /**
   * Check if code exists
   */
  codeExists: async (code: string, tenant_id: string, excludeId?: string): Promise<boolean> => {
    try {
      const supabase = getSupabaseClient();
      let query = supabase
        .from(TABLE_NAME)
        .select('_id')
        .eq('code', code)
        .eq('tenant_id', tenant_id)
        .is('deleted_at', null);

      if (excludeId) {
        query = query.neq('_id', excludeId);
      }

      const { data, error } = await query;

      if (error) throw new Error(error.message);
      return (data?.length || 0) > 0;
    } catch (error: any) {
      console.error('Error in saasProductApi.codeExists:', error);
      throw error;
    }
  },

  /**
   * Get statistics
   */
  getStatistics: async (tenant_id?: string): Promise<ProductStatistics> => {
    try {
      const supabase = getSupabaseClient();
      let query = supabase
        .from(TABLE_NAME)
        .select('status, is_featured, base_price')
        .is('deleted_at', null);

      if (tenant_id) {
        query = query.eq('tenant_id', tenant_id);
      }

      const { data, error } = await query;

      if (error) throw new Error(error.message);

      const stats: ProductStatistics = {
        total: 0,
        active: 0,
        inactive: 0,
        archived: 0,
        featured: 0,
        total_revenue: 0,
      };

      data?.forEach(item => {
        stats.total++;
        
        if (item.status === 'active') stats.active++;
        else if (item.status === 'inactive') stats.inactive++;
        else if (item.status === 'archived') stats.archived++;

        if (item.is_featured) stats.featured++;

        stats.total_revenue += Number(item.base_price) || 0;
      });

      return stats;
    } catch (error: any) {
      console.error('Error in saasProductApi.getStatistics:', error);
      throw error;
    }
  },

  /**
   * Search products
   */
  search: async (searchTerm: string, tenant_id?: string): Promise<SaaSProduct[]> => {
    return saasProductApi.getAll({ search: searchTerm, tenant_id });
  },

  /**
   * Duplicate a product
   */
  duplicate: async (id: string, newCode: string, newName: string): Promise<SaaSProduct> => {
    const original = await saasProductApi.getById(id);
    if (!original) throw new Error('Product not found');

    const { _id, created_at, updated_at, version, ...productData } = original;

    return saasProductApi.create({
      ...productData,
      code: newCode,
      name: newName,
      is_featured: false,
    });
  },
};

export default saasProductApi;