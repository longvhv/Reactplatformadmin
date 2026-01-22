/**
 * useSaasProducts Hook
 * Hook for managing SaaS products
 */

import { useState, useEffect } from 'react';
import {
  saasProductsApi,
  SaasProduct,
  CreateSaasProductRequest,
  UpdateSaasProductRequest,
  SaasProductFilters,
} from '../api/saasProductsApi';

interface UseSaasProductsOptions extends SaasProductFilters {
  autoLoad?: boolean;
}

export function useSaasProducts(options: UseSaasProductsOptions = {}) {
  const [products, setProducts] = useState<SaasProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await saasProductsApi.getAll(options);
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const createProduct = async (data: CreateSaasProductRequest) => {
    try {
      const newProduct = await saasProductsApi.create(data);
      setProducts(prev => [newProduct, ...prev]);
      return newProduct;
    } catch (err) {
      throw err;
    }
  };

  const updateProduct = async (id: string, data: UpdateSaasProductRequest) => {
    try {
      const updated = await saasProductsApi.update(id, data);
      setProducts(prev => prev.map(p => p._id === id ? updated : p));
      return updated;
    } catch (err) {
      throw err;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      const current = products.find(p => p._id === id);
      if (!current) throw new Error('Product not found in local state');
      
      await saasProductsApi.delete(id, current.version);
      setProducts(prev => prev.filter(p => p._id !== id));
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    if (options.autoLoad !== false) {
      loadProducts();
    }
  }, [JSON.stringify(options)]); // Simple dep check

  return {
    products,
    loading,
    error,
    loadProducts,
    createProduct,
    updateProduct,
    deleteProduct,
  };
}

export function useSaasProduct(id: string | undefined) {
  const [product, setProduct] = useState<SaasProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await saasProductsApi.getById(id);
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
