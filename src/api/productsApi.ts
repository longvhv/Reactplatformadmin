/**
 * Products API Client
 * Uses Adapter pattern - Ready for Golang migration
 * 
 * ✅ FIXED 2026-01-14: Field mapping now 100% matches saas_products schema
 */

import { useState, useEffect } from 'react';
import { createAdapter, BaseFilters } from './adapters';

// ==================== TYPES ====================

export interface Product {
  _id: string;
  tenant_id: string;
  code: string;
  name: string;
  description?: string;
  product_type_code?: string;
  base_price: number;
  currency: string;
  billing_cycle: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'LIFETIME';
  trial_days: number;
  features: Record<string, any>;
  limits: Record<string, any>;
  status: 'active' | 'inactive' | 'archived';
  is_featured: boolean;
  display_order: number;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  deleted_at?: string;
  deleted_by?: string;
  version: number;
}

export interface CreateProductRequest {
  tenant_id: string;
  code: string;
  name: string;
  description?: string;
  product_type_code?: string;
  base_price: number;
  currency: string;
  billing_cycle?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'LIFETIME';
  trial_days?: number;
  features?: Record<string, any>;
  limits?: Record<string, any>;
  status?: 'active' | 'inactive' | 'archived';
  is_featured?: boolean;
  display_order?: number;
  metadata?: Record<string, any>;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  product_type_code?: string;
  base_price?: number;
  currency?: string;
  billing_cycle?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'LIFETIME';
  trial_days?: number;
  features?: Record<string, any>;
  limits?: Record<string, any>;
  status?: 'active' | 'inactive' | 'archived';
  is_featured?: boolean;
  display_order?: number;
  metadata?: Record<string, any>;
  version: number;
}

export interface ProductFilters extends BaseFilters {
  tenant_id?: string;
  product_type_code?: string;
  status?: 'active' | 'inactive' | 'archived';
  is_featured?: boolean;
}

// ==================== ADAPTER ====================

const adapter = createAdapter<Product, CreateProductRequest, UpdateProductRequest>(
  'saas_products',
  '/products'
);

// ==================== API CLIENT ====================

export const productsApi = {
  /**
   * GET /products
   */
  getAll: async (filters?: ProductFilters): Promise<Product[]> => {
    return adapter.getAll(filters);
  },

  /**
   * GET /products/:id
   */
  getById: async (id: string): Promise<Product> => {
    return adapter.getById(id);
  },

  /**
   * POST /products
   */
  create: async (data: CreateProductRequest): Promise<Product> => {
    return adapter.create(data);
  },

  /**
   * PATCH /products/:id
   */
  update: async (id: string, data: UpdateProductRequest): Promise<Product> => {
    return adapter.update(id, data);
  },

  /**
   * DELETE /products/:id
   */
  delete: async (id: string): Promise<void> => {
    return adapter.delete(id);
  },

  /**
   * GET /products/:id/stats
   * TODO (Golang): Implement stats endpoint
   */
  getStats: async (id: string): Promise<any> => {
    throw new Error('Not implemented - migrate to Golang');
  },

  /**
   * GET /products/:id/packages
   * TODO (Golang): Implement packages endpoint
   */
  getPackages: async (id: string): Promise<any[]> => {
    throw new Error('Not implemented - migrate to Golang');
  },
};

// ==================== HOOKS ====================

/**
 * Hook to fetch single product
 */
export function useProduct(id: string | undefined) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await productsApi.getById(id);
      setProduct(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch product');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [id]);

  return { product, loading, error, refresh };
}

/**
 * Hook for product mutations (create, update, delete)
 */
export function useProductMutations() {
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const createProduct = async (data: CreateProductRequest) => {
    setSaving(true);
    try {
      const result = await productsApi.create(data);
      return { success: true, data: result };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to create product' };
    } finally {
      setSaving(false);
    }
  };

  const updateProduct = async (id: string, data: UpdateProductRequest) => {
    setSaving(true);
    try {
      const result = await productsApi.update(id, data);
      return { success: true, data: result };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to update product' };
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (id: string) => {
    setDeleting(true);
    try {
      await productsApi.delete(id);
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to delete product' };
    } finally {
      setDeleting(false);
    }
  };

  return { createProduct, updateProduct, deleteProduct, saving, deleting };
}

export default productsApi;