/**
 * SaaS Product Types API Client
 * Uses Adapter pattern - Ready for Golang migration
 * ✅ Production-ready with full CRUD operations
 * ✅ Type-safe with TypeScript
 * ✅ Optimistic locking support
 */

import { useState, useEffect } from 'react';
import { createAdapter, BaseFilters } from './adapters';

// ==================== TYPES ====================

/**
 * SaaS Product Type - 100% matches saas_product_types table (8 fields)
 */
export interface SaasProductType {
  // I. Identity (1)
  _id: string;                      // uuid PK
  
  // II. Product Type Information (3)
  code: string;                     // varchar(50) UNIQUE, check format ^[A-Z0-9_]+$
  name: string;                     // text NOT NULL, check length > 0
  description: string | null;       // text nullable
  
  // III. Status (1)
  is_active: boolean;               // boolean default true
  
  // IV. Audit & Versioning (3)
  created_at: string;               // timestamptz
  updated_at: string;               // timestamptz
  version: number;                  // bigint default 1, check >= 1
}

/**
 * Create SaaS Product Type Request
 */
export interface CreateSaasProductTypeRequest {
  code: string;                     // Required, will be validated
  name: string;                     // Required
  description?: string;             // Optional
  is_active?: boolean;              // Optional, default true
}

/**
 * Update SaaS Product Type Request
 */
export interface UpdateSaasProductTypeRequest {
  name?: string;                    // Optional
  description?: string;             // Optional
  is_active?: boolean;              // Optional
  version: number;                  // Required for optimistic locking
  // ⚠️ code cannot be changed after creation (UNIQUE constraint)
}

/**
 * SaaS Product Type Filters
 */
export interface SaasProductTypeFilters extends BaseFilters {
  is_active?: boolean;              // Filter by active/inactive
  code?: string;                    // Filter/search by code
  search?: string;                  // Search by code or name
}

/**
 * SaaS Product Type Statistics
 */
export interface SaasProductTypeStats {
  total: number;
  active: number;
  inactive: number;
  recently_created: number;         // Created in last 7 days
  recently_updated: number;         // Updated in last 7 days
}

// ==================== ADAPTER ====================

const adapter = createAdapter<
  SaasProductType,
  CreateSaasProductTypeRequest,
  UpdateSaasProductTypeRequest
>(
  'saas_product_types',
  '/saas-product-types'
);

// ==================== VALIDATION ====================

/**
 * Validate product type code format
 * Must match: ^[A-Z0-9_]+$
 */
export function validateCode(code: string): boolean {
  const codeRegex = /^[A-Z0-9_]+$/;
  return codeRegex.test(code);
}

/**
 * Normalize code to uppercase and replace spaces/hyphens with underscores
 */
export function normalizeCode(code: string): string {
  return code
    .toUpperCase()
    .replace(/[\s-]+/g, '_')
    .replace(/[^A-Z0-9_]/g, '');
}

// ==================== API CLIENT ====================

export const saasProductTypesApi = {
  /**
   * GET /saas-product-types
   */
  getAll: async (filters?: SaasProductTypeFilters): Promise<SaasProductType[]> => {
    return adapter.getAll(filters);
  },

  /**
   * GET /saas-product-types/:id
   */
  getById: async (id: string): Promise<SaasProductType> => {
    return adapter.getById(id);
  },

  /**
   * GET /saas-product-types/code/:code
   * Check if a code exists
   */
  checkCode: async (code: string): Promise<{ exists: boolean; productType?: SaasProductType }> => {
    try {
      const { getSupabaseClient } = await import('../lib/supabase');
      const supabase = getSupabaseClient();

      const normalizedCode = normalizeCode(code);

      const { data, error } = await supabase
        .from('saas_product_types')
        .select('*')
        .eq('code', normalizedCode)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return {
        exists: !!data,
        productType: data || undefined,
      };
    } catch (error) {
      console.error('Error checking code:', error);
      throw error;
    }
  },

  /**
   * POST /saas-product-types
   */
  create: async (data: CreateSaasProductTypeRequest): Promise<SaasProductType> => {
    // Validate code format
    const normalizedCode = normalizeCode(data.code);
    
    if (!validateCode(normalizedCode)) {
      throw new Error('Product type code must contain only uppercase letters, numbers, and underscores');
    }

    // Validate name length > 0
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Product type name cannot be empty');
    }

    const createData = {
      ...data,
      code: normalizedCode,
      name: data.name.trim(),
      description: data.description?.trim() || null,
    };

    console.log('📤 Creating product type:', createData);
    try {
      const result = await adapter.create(createData);
      console.log('✅ Created product type:', result);
      return result;
    } catch (error: any) {
      console.error('❌ Failed to create product type:', error);
      console.error('Request data:', createData);
      
      // Check for duplicate code error
      if (error.message?.includes('duplicate key') || error.code === '23505') {
        throw new Error(`Product type code "${normalizedCode}" already exists`);
      }
      
      throw error;
    }
  },

  /**
   * PATCH /saas-product-types/:id
   */
  update: async (id: string, data: UpdateSaasProductTypeRequest): Promise<SaasProductType> => {
    // Validate name length > 0 if provided
    if (data.name !== undefined && data.name.trim().length === 0) {
      throw new Error('Product type name cannot be empty');
    }

    const updateData = {
      ...data,
      name: data.name?.trim(),
      description: data.description?.trim() || null,
    };

    return adapter.update(id, updateData);
  },

  /**
   * DELETE /saas-product-types/:id
   * Note: This is a hard delete. Consider soft delete if needed.
   */
  delete: async (id: string): Promise<void> => {
    return adapter.delete(id);
  },

  /**
   * POST /saas-product-types/:id/activate
   */
  activate: async (id: string): Promise<SaasProductType> => {
    const productType = await saasProductTypesApi.getById(id);
    return adapter.update(id, { 
      is_active: true, 
      version: productType.version 
    });
  },

  /**
   * POST /saas-product-types/:id/deactivate
   */
  deactivate: async (id: string): Promise<SaasProductType> => {
    const productType = await saasProductTypesApi.getById(id);
    return adapter.update(id, { 
      is_active: false, 
      version: productType.version 
    });
  },

  /**
   * GET /saas-product-types/stats
   */
  getStats: async (): Promise<SaasProductTypeStats> => {
    try {
      const { getSupabaseClient } = await import('../lib/supabase');
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('saas_product_types')
        .select('is_active, created_at, updated_at');

      if (error) throw error;

      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const stats: SaasProductTypeStats = {
        total: data.length,
        active: data.filter(pt => pt.is_active).length,
        inactive: data.filter(pt => !pt.is_active).length,
        recently_created: data.filter(pt => new Date(pt.created_at) > sevenDaysAgo).length,
        recently_updated: data.filter(pt => new Date(pt.updated_at) > sevenDaysAgo).length,
      };

      return stats;
    } catch (error) {
      console.error('Error getting stats:', error);
      throw error;
    }
  },

  /**
   * POST /saas-product-types/batch
   * Batch create product types
   */
  createBatch: async (productTypes: CreateSaasProductTypeRequest[]): Promise<SaasProductType[]> => {
    try {
      const { getSupabaseClient } = await import('../lib/supabase');
      const supabase = getSupabaseClient();

      // Normalize and validate all product types
      const normalizedProductTypes = productTypes.map(pt => {
        const normalizedCode = normalizeCode(pt.code);
        
        if (!validateCode(normalizedCode)) {
          throw new Error(`Invalid code format: ${pt.code}`);
        }
        
        if (!pt.name || pt.name.trim().length === 0) {
          throw new Error('Product type name cannot be empty');
        }

        return {
          code: normalizedCode,
          name: pt.name.trim(),
          description: pt.description?.trim() || null,
          is_active: pt.is_active !== undefined ? pt.is_active : true,
        };
      });

      const { data, error } = await supabase
        .from('saas_product_types')
        .insert(normalizedProductTypes)
        .select();

      if (error) {
        // Check for duplicate code error
        if (error.message?.includes('duplicate key') || error.code === '23505') {
          throw new Error('One or more product type codes already exist');
        }
        throw error;
      }

      return data as SaasProductType[];
    } catch (error) {
      console.error('Error creating batch:', error);
      throw error;
    }
  },

  /**
   * Search product types by code or name
   */
  search: async (query: string): Promise<SaasProductType[]> => {
    try {
      const { getSupabaseClient } = await import('../lib/supabase');
      const supabase = getSupabaseClient();

      const searchTerm = `%${query}%`;

      const { data, error } = await supabase
        .from('saas_product_types')
        .select('*')
        .or(`code.ilike.${searchTerm},name.ilike.${searchTerm}`)
        .order('code', { ascending: true });

      if (error) throw error;

      return data as SaasProductType[];
    } catch (error) {
      console.error('Error searching product types:', error);
      throw error;
    }
  },
};

// ==================== HOOKS ====================

/**
 * Hook to fetch all product types
 */
export function useSaasProductTypes(filters?: SaasProductTypeFilters) {
  const [productTypes, setProductTypes] = useState<SaasProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProductTypes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await saasProductTypesApi.getAll(filters);
      setProductTypes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch product types');
      console.error('Error fetching product types:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductTypes();
  }, [filters?.is_active, filters?.code, filters?.search]);

  return { 
    productTypes, 
    loading, 
    error, 
    refresh: fetchProductTypes 
  };
}

/**
 * Hook to check if code exists (debounced)
 */
export function useCodeChecker(code: string, debounceMs: number = 300) {
  const [exists, setExists] = useState(false);
  const [productType, setProductType] = useState<SaasProductType | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code || code.trim().length === 0) {
      setExists(false);
      setProductType(null);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        setChecking(true);
        setError(null);
        
        const result = await saasProductTypesApi.checkCode(code);
        setExists(result.exists);
        setProductType(result.productType || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to check code');
        console.error('Error checking code:', err);
      } finally {
        setChecking(false);
      }
    }, debounceMs);

    return () => clearTimeout(timeout);
  }, [code, debounceMs]);

  return { exists, productType, checking, error };
}

/**
 * Hook to fetch stats
 */
export function useSaasProductTypeStats() {
  const [stats, setStats] = useState<SaasProductTypeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await saasProductTypesApi.getStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return { 
    stats, 
    loading, 
    error, 
    refresh: fetchStats 
  };
}

export default saasProductTypesApi;
