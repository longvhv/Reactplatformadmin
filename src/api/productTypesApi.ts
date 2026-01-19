/**
 * Product Types API Client
 * Uses Adapter pattern - Ready for Golang migration
 * 
 * ✅ UPDATED 2026-01-16: Changed table from product_types to saas_product_types
 */

import { createAdapter, BaseFilters } from './adapters';

// ==================== TYPES ====================

/**
 * ProductType - 100% matches saas_product_types table (8 fields)
 */
export interface ProductType {
  // Identity
  _id: string;                       // uuid not null primary key
  
  // Product Type Information
  code: string;                      // varchar(50) not null unique, check: /^[A-Z0-9_]+$/
  name: string;                      // text not null, check: length(name) > 0
  description?: string;              // text nullable
  
  // Status
  is_active: boolean;                // boolean not null default true
  
  // Audit Fields
  created_at: string;                // timestamptz not null default now()
  updated_at: string;                // timestamptz not null default now()
  
  // Versioning
  version: number;                   // bigint not null default 1, check: version >= 1
}

/**
 * Create Product Type Request
 */
export interface CreateProductTypeRequest {
  code: string;
  name: string;
  description?: string;
  is_active?: boolean;               // Default true in database
}

/**
 * Update Product Type Request
 */
export interface UpdateProductTypeRequest {
  name?: string;
  description?: string;
  is_active?: boolean;
  // ⚠️ code cannot be changed after creation (unique constraint)
}

/**
 * Product Type Filters
 */
export interface ProductTypeFilters extends BaseFilters {
  is_active?: boolean;
  search?: string;                   // Search by code, name, or description
  code_prefix?: string;              // Filter by code prefix (e.g., 'SAAS_' or 'PHYS_')
}

/**
 * Product Type Statistics
 */
export interface ProductTypeStats {
  total: number;
  active: number;
  inactive: number;
  by_code_prefix: Array<{
    prefix: string;
    count: number;
  }>;
  most_recent: ProductType[];
}

// ==================== ADAPTER ====================

const adapter = createAdapter<ProductType, CreateProductTypeRequest, UpdateProductTypeRequest>(
  'saas_product_types',  // ✅ FIXED: Changed from 'product_types' to 'saas_product_types'
  '/product-types'
);

// ==================== API CLIENT ====================

export const productTypesApi = {
  /**
   * GET /product-types
   */
  getAll: async (filters?: ProductTypeFilters): Promise<ProductType[]> => {
    return adapter.getAll(filters);
  },

  /**
   * GET /product-types/:id
   */
  getById: async (id: string): Promise<ProductType> => {
    return adapter.getById(id);
  },

  /**
   * POST /product-types
   */
  create: async (data: CreateProductTypeRequest): Promise<ProductType> => {
    // Validate code format: /^[A-Z0-9_]+$/
    if (!data.code || !/^[A-Z0-9_]+$/.test(data.code)) {
      throw new Error('Product type code must contain only uppercase letters, numbers, and underscores (A-Z, 0-9, _)');
    }
    
    // Validate name length > 0
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Product type name cannot be empty');
    }
    
    return adapter.create(data);
  },

  /**
   * PATCH /product-types/:id
   */
  update: async (id: string, data: UpdateProductTypeRequest): Promise<ProductType> => {
    // Validate name length > 0 if provided
    if (data.name !== undefined && data.name.trim().length === 0) {
      throw new Error('Product type name cannot be empty');
    }
    
    return adapter.update(id, data);
  },

  /**
   * DELETE /product-types/:id
   * Hard delete - WARNING: May cascade to products if foreign key exists
   */
  delete: async (id: string): Promise<void> => {
    return adapter.delete(id);
  },

  /**
   * Get active product types
   */
  getActive: async (): Promise<ProductType[]> => {
    return adapter.getAll({ is_active: true });
  },

  /**
   * Get inactive product types
   */
  getInactive: async (): Promise<ProductType[]> => {
    return adapter.getAll({ is_active: false });
  },

  /**
   * Get product type by code
   */
  getByCode: async (code: string): Promise<ProductType | null> => {
    const types = await adapter.getAll();
    return types.find(t => t.code === code) || null;
  },

  /**
   * Toggle active status
   */
  toggleActive: async (id: string): Promise<ProductType> => {
    const productType = await adapter.getById(id);
    return adapter.update(id, {
      is_active: !productType.is_active,
    });
  },

  /**
   * Activate product type
   */
  activate: async (id: string): Promise<ProductType> => {
    return adapter.update(id, { is_active: true });
  },

  /**
   * Deactivate product type
   */
  deactivate: async (id: string): Promise<ProductType> => {
    return adapter.update(id, { is_active: false });
  },

  /**
   * Bulk activate
   */
  bulkActivate: async (ids: string[]): Promise<ProductType[]> => {
    return Promise.all(
      ids.map(id => adapter.update(id, { is_active: true }))
    );
  },

  /**
   * Bulk deactivate
   */
  bulkDeactivate: async (ids: string[]): Promise<ProductType[]> => {
    return Promise.all(
      ids.map(id => adapter.update(id, { is_active: false }))
    );
  },

  /**
   * Get product type statistics
   */
  getStats: async (): Promise<ProductTypeStats> => {
    const types = await adapter.getAll();
    
    const active = types.filter(t => t.is_active).length;
    const inactive = types.length - active;
    
    // Group by code prefix (first part before underscore)
    const prefixCounts = new Map<string, number>();
    types.forEach(type => {
      const prefix = type.code.split('_')[0] || type.code;
      prefixCounts.set(prefix, (prefixCounts.get(prefix) || 0) + 1);
    });
    
    const byCodePrefix = Array.from(prefixCounts.entries())
      .map(([prefix, count]) => ({ prefix, count }))
      .sort((a, b) => b.count - a.count);
    
    // Get 5 most recent
    const mostRecent = [...types]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
    
    return {
      total: types.length,
      active,
      inactive,
      by_code_prefix: byCodePrefix,
      most_recent: mostRecent,
    };
  },

  /**
   * Search product types
   */
  search: async (query: string): Promise<ProductType[]> => {
    return adapter.getAll({ search: query });
  },

  /**
   * Get product types by code prefix
   */
  getByCodePrefix: async (prefix: string): Promise<ProductType[]> => {
    return adapter.getAll({ code_prefix: prefix });
  },

  /**
   * Check if code is available
   */
  isCodeAvailable: async (code: string): Promise<boolean> => {
    try {
      const existing = await productTypesApi.getByCode(code);
      return existing === null;
    } catch {
      return true;
    }
  },

  /**
   * Validate code format
   */
  validateCode: (code: string): { valid: boolean; error?: string } => {
    if (!code || code.length === 0) {
      return { valid: false, error: 'Code cannot be empty' };
    }
    
    if (code.length > 50) {
      return { valid: false, error: 'Code cannot exceed 50 characters' };
    }
    
    if (!/^[A-Z0-9_]+$/.test(code)) {
      return { 
        valid: false, 
        error: 'Code must contain only uppercase letters, numbers, and underscores (A-Z, 0-9, _)' 
      };
    }
    
    return { valid: true };
  },

  /**
   * Clone product type (create copy with new code)
   */
  clone: async (id: string, newCode: string, newName: string): Promise<ProductType> => {
    const original = await adapter.getById(id);
    
    return adapter.create({
      code: newCode,
      name: newName,
      description: original.description ? `Copy of ${original.description}` : undefined,
      is_active: original.is_active,
    });
  },

  /**
   * Check if product type can be deleted
   * TODO (Golang): Check if type is used by any products
   */
  canDelete: async (id: string): Promise<{ 
    can_delete: boolean; 
    reason?: string;
    product_count?: number;
  }> => {
    // TODO: Check if product type is assigned to products in Golang
    // SELECT COUNT(*) FROM saas_products WHERE product_type_id = $1
    
    return {
      can_delete: true,
    };
  },

  /**
   * Get product types created in date range
   */
  getByDateRange: async (startDate: string, endDate: string): Promise<ProductType[]> => {
    const types = await adapter.getAll();
    return types.filter(t => {
      const createdAt = new Date(t.created_at);
      return createdAt >= new Date(startDate) && createdAt <= new Date(endDate);
    });
  },
};

export default productTypesApi;