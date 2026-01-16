/**
 * useProductType Hook
 * Hook for managing single product type
 * 
 * ✅ CREATED 2026-01-15: Uses productTypesApi
 */

import { useState, useEffect } from 'react';
import { ProductType, productTypesApi, UpdateProductTypeRequest } from '../api/productTypesApi';

export function useProductType(id?: string) {
  const [productType, setProductType] = useState<ProductType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProductType = async () => {
    if (!id || id === 'new') return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await productTypesApi.getById(id);
      setProductType(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load product type');
    } finally {
      setLoading(false);
    }
  };

  const updateProductType = async (data: UpdateProductTypeRequest) => {
    if (!productType) return;
    
    try {
      const updated = await productTypesApi.update(productType._id, data);
      setProductType(updated);
      return updated;
    } catch (err) {
      throw new Error('Failed to update product type');
    }
  };

  const deleteProductType = async () => {
    if (!productType) return;
    
    try {
      await productTypesApi.delete(productType._id);
      setProductType(null);
    } catch (err) {
      throw new Error('Failed to delete product type');
    }
  };

  const toggleActive = async () => {
    if (!productType) return;
    
    try {
      const updated = await productTypesApi.toggleActive(productType._id);
      setProductType(updated);
      return updated;
    } catch (err) {
      throw new Error('Failed to toggle active status');
    }
  };

  useEffect(() => {
    if (id && id !== 'new') {
      loadProductType();
    }
  }, [id]);

  return {
    productType,
    loading,
    error,
    updateProductType,
    deleteProductType,
    toggleActive,
    refresh: loadProductType,
  };
}

export default useProductType;
