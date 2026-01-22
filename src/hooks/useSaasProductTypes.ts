/**
 * useSaasProductTypes Hook
 * Hook for managing SaaS product types
 * ✅ Production-ready with full CRUD operations
 * ✅ Auto-load support
 * ✅ Filters and search
 * ✅ Error handling
 */

import { useState, useEffect } from 'react';
import {
  saasProductTypesApi,
  SaasProductType,
  CreateSaasProductTypeRequest,
  UpdateSaasProductTypeRequest,
  SaasProductTypeFilters,
} from '../api/saasProductTypesApi';

interface UseSaasProductTypesOptions extends SaasProductTypeFilters {
  autoLoad?: boolean;
}

export function useSaasProductTypes(options: UseSaasProductTypesOptions = {}) {
  const [productTypes, setProductTypes] = useState<SaasProductType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProductTypes = async () => {
    setLoading(true);
    setError(null);

    try {
      const filters: SaasProductTypeFilters = {};
      if (options.is_active !== undefined) filters.is_active = options.is_active;
      if (options.code) filters.code = options.code;
      if (options.search) filters.search = options.search;

      console.log('[useSaasProductTypes] Loading product types with filters:', filters);
      const data = await saasProductTypesApi.getAll(filters);
      console.log('[useSaasProductTypes] Loaded product types:', data.length);
      setProductTypes(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load product types';
      setError(message);
      console.error('[useSaasProductTypes] Error loading product types:', err);
    } finally {
      setLoading(false);
    }
  };

  const createProductType = async (data: CreateSaasProductTypeRequest) => {
    try {
      console.log('[useSaasProductTypes] Creating product type:', data);
      const newProductType = await saasProductTypesApi.create(data);
      console.log('[useSaasProductTypes] Created product type:', newProductType);
      
      // Add to local state
      setProductTypes(prev => [...prev, newProductType]);
      
      return newProductType;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create product type';
      console.error('[useSaasProductTypes] Error creating product type:', err);
      throw new Error(message);
    }
  };

  const updateProductType = async (id: string, data: UpdateSaasProductTypeRequest) => {
    try {
      console.log('[useSaasProductTypes] Updating product type:', id, data);
      const updated = await saasProductTypesApi.update(id, data);
      console.log('[useSaasProductTypes] Updated product type:', updated);
      
      // Update local state
      setProductTypes(prev => prev.map(pt => pt._id === id ? updated : pt));
      
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update product type';
      console.error('[useSaasProductTypes] Error updating product type:', err);
      throw new Error(message);
    }
  };

  const deleteProductType = async (id: string) => {
    try {
      console.log('[useSaasProductTypes] Deleting product type:', id);
      
      // Find current item to get version
      const current = productTypes.find(p => p._id === id);
      if (!current) {
        throw new Error('Product type not found in local state');
      }

      await saasProductTypesApi.delete(id, current.version);
      console.log('[useSaasProductTypes] Deleted product type:', id);
      
      // Remove from local state
      setProductTypes(prev => prev.filter(pt => pt._id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete product type';
      console.error('[useSaasProductTypes] Error deleting product type:', err);
      throw new Error(message);
    }
  };

  const activateProductType = async (id: string) => {
    try {
      console.log('[useSaasProductTypes] Activating product type:', id);
      
      const current = productTypes.find(p => p._id === id);
      if (!current) throw new Error('Product type not found');

      const updated = await saasProductTypesApi.update(id, {
        is_active: true,
        version: current.version
      });
      console.log('[useSaasProductTypes] Activated product type:', updated);
      
      // Update local state
      setProductTypes(prev => prev.map(pt => pt._id === id ? updated : pt));
      
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to activate product type';
      console.error('[useSaasProductTypes] Error activating product type:', err);
      throw new Error(message);
    }
  };

  const deactivateProductType = async (id: string) => {
    try {
      console.log('[useSaasProductTypes] Deactivating product type:', id);
      
      const current = productTypes.find(p => p._id === id);
      if (!current) throw new Error('Product type not found');

      const updated = await saasProductTypesApi.update(id, {
        is_active: false,
        version: current.version
      });
      console.log('[useSaasProductTypes] Deactivated product type:', updated);
      
      // Update local state
      setProductTypes(prev => prev.map(pt => pt._id === id ? updated : pt));
      
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to deactivate product type';
      console.error('[useSaasProductTypes] Error deactivating product type:', err);
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
  }, [options.is_active, options.code, options.search]);

  return {
    productTypes,
    loading,
    error,
    loadProductTypes,
    createProductType,
    updateProductType,
    deleteProductType,
    activateProductType,
    deactivateProductType,
    refresh,
  };
}

export default useSaasProductTypes;
