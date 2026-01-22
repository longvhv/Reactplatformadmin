/**
 * useServicePackages Hook
 * Hook for managing service packages
 */

import { useState, useEffect, useCallback } from 'react';
import {
  servicePackagesApi,
  ServicePackage,
  CreateServicePackageRequest,
  UpdateServicePackageRequest,
  ServicePackageFilters,
} from '../api/servicePackagesApi';

interface UseServicePackagesOptions extends ServicePackageFilters {
  autoLoad?: boolean;
}

export function useServicePackages(options: UseServicePackagesOptions = {}) {
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPackages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await servicePackagesApi.getAll(options);
      setPackages(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load service packages');
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(options)]);

  const createPackage = async (data: CreateServicePackageRequest) => {
    try {
      const newPackage = await servicePackagesApi.create(data);
      setPackages(prev => [newPackage, ...prev]);
      return newPackage;
    } catch (err) {
      throw err;
    }
  };

  const updatePackage = async (id: string, data: UpdateServicePackageRequest) => {
    try {
      const updated = await servicePackagesApi.update(id, data);
      setPackages(prev => prev.map(p => p._id === id ? updated : p));
      return updated;
    } catch (err) {
      throw err;
    }
  };

  const deletePackage = async (id: string) => {
    try {
      const current = packages.find(p => p._id === id);
      if (!current) throw new Error('Package not found in local state');
      
      await servicePackagesApi.delete(id, current.version);
      setPackages(prev => prev.filter(p => p._id !== id));
    } catch (err) {
      throw err;
    }
  };

  const toggleStatus = async (id: string) => {
    try {
      const current = packages.find(p => p._id === id);
      if (!current) throw new Error('Package not found');
      
      return await updatePackage(id, {
        is_active: !current.is_active,
        version: current.version
      });
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    if (options.autoLoad !== false) {
      loadPackages();
    }
  }, [loadPackages]);

  return {
    packages,
    loading,
    error,
    loadPackages,
    createPackage,
    updatePackage,
    deletePackage,
    toggleStatus
  };
}

export function useServicePackage(id: string | undefined) {
  const [pkg, setPkg] = useState<ServicePackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await servicePackagesApi.getById(id);
      setPkg(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch package');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [id]);

  return { pkg, loading, error, refresh };
}
