/**
 * useProductTypes Hook
 * Hook for managing product types - uses productTypesApi
 * 
 * ✅ CREATED 2026-01-15: Uses productTypesApi with 8 fields
 */

import { useState, useEffect } from 'react';
import { 
  productTypesApi, 
  ProductType, 
  CreateProductTypeRequest, 
  UpdateProductTypeRequest, 
  ProductTypeFilters 
} from '../api/productTypesApi';

interface UseProductTypesOptions extends ProductTypeFilters {
  autoLoad?: boolean;
}

export function useProductTypes(options: UseProductTypesOptions = {}) {
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProductTypes = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const filters: ProductTypeFilters = {};
      if (options.is_active !== undefined) filters.is_active = options.is_active;
      if (options.search) filters.search = options.search;
      if (options.code_prefix) filters.code_prefix = options.code_prefix;
      
      console.log('[useProductTypes] Loading product types with filters:', filters);
      const data = await productTypesApi.getAll(filters);
      console.log('[useProductTypes] Loaded product types:', data.length);
      setProductTypes(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load product types';
      setError(message);
      console.error('[useProductTypes] Error loading product types:', err);
    } finally {
      setLoading(false);
    }
  };

  const createProductType = async (data: CreateProductTypeRequest) => {
    try {
      const newType = await productTypesApi.create(data);
      setProductTypes(prev => [...prev, newType]);
      return newType;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create product type';
      throw new Error(message);
    }
  };

  const updateProductType = async (id: string, data: UpdateProductTypeRequest) => {
    try {
      const updated = await productTypesApi.update(id, data);
      setProductTypes(prev => prev.map(pt => pt._id === id ? updated : pt));
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update product type';
      throw new Error(message);
    }
  };

  const deleteProductType = async (id: string) => {
    try {
      await productTypesApi.delete(id);
      setProductTypes(prev => prev.filter(pt => pt._id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete product type';
      throw new Error(message);
    }
  };

  const toggleActive = async (id: string) => {
    try {
      const updated = await productTypesApi.toggleActive(id);
      setProductTypes(prev => prev.map(pt => pt._id === id ? updated : pt));
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to toggle active status';
      throw new Error(message);
    }
  };

  const refresh = async () => {
    await loadProductTypes();
  };

  useEffect(() => {
    if (options.autoLoad !== false) {
      loadProductTypes();
    }
  }, [options.is_active, options.code_prefix]);

  return {
    productTypes,
    loading,
    error,
    loadProductTypes,
    createProductType,
    updateProductType,
    deleteProductType,
    toggleActive,
    refresh,
  };
}

export default useProductTypes;
