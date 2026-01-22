/**
 * useAppCapabilities Hook
 * Hook for managing application capabilities
 */

import { useState, useEffect, useCallback } from 'react';
import {
  appCapabilitiesApi,
  AppCapability,
  CreateAppCapabilityRequest,
  UpdateAppCapabilityRequest,
  AppCapabilityFilters,
} from '../api/appCapabilitiesApi';

interface UseAppCapabilitiesOptions extends AppCapabilityFilters {
  autoLoad?: boolean;
}

export function useAppCapabilities(options: UseAppCapabilitiesOptions = {}) {
  const [capabilities, setCapabilities] = useState<AppCapability[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCapabilities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await appCapabilitiesApi.getAll(options);
      setCapabilities(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load app capabilities');
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(options)]);

  const createCapability = async (data: CreateAppCapabilityRequest) => {
    try {
      const newCapability = await appCapabilitiesApi.create(data);
      setCapabilities(prev => [newCapability, ...prev]);
      return newCapability;
    } catch (err) {
      throw err;
    }
  };

  const updateCapability = async (id: string, data: UpdateAppCapabilityRequest) => {
    try {
      const updated = await appCapabilitiesApi.update(id, data);
      setCapabilities(prev => prev.map(c => c._id === id ? updated : c));
      return updated;
    } catch (err) {
      throw err;
    }
  };

  const deleteCapability = async (id: string) => {
    try {
      const current = capabilities.find(c => c._id === id);
      if (!current) throw new Error('Capability not found in local state');
      
      await appCapabilitiesApi.delete(id, current.version);
      setCapabilities(prev => prev.filter(c => c._id !== id));
    } catch (err) {
      throw err;
    }
  };

  const toggleStatus = async (id: string) => {
    try {
      const current = capabilities.find(c => c._id === id);
      if (!current) throw new Error('Capability not found');
      
      const newStatus = current.status === 'active' ? 'inactive' : 'active';
      return await updateCapability(id, {
        status: newStatus,
        version: current.version
      });
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    if (options.autoLoad !== false) {
      loadCapabilities();
    }
  }, [loadCapabilities]);

  return {
    capabilities,
    loading,
    error,
    loadCapabilities,
    createCapability,
    updateCapability,
    deleteCapability,
    toggleStatus
  };
}
