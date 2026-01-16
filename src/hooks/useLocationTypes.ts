/**
 * useLocationTypes Hook
 * React hook for managing location types with optimistic locking
 */

import { useState, useEffect, useCallback } from 'react';
import {
  locationTypesApi,
  LocationType,
  LocationTypeFilters,
  CreateLocationTypeData,
  UpdateLocationTypeData,
} from '../api/locationTypesApi';

export function useLocationTypes(filters?: LocationTypeFilters) {
  const [locationTypes, setLocationTypes] = useState<LocationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch location types
   */
  const fetchLocationTypes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await locationTypesApi.getAll(filters);
      setLocationTypes(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load location types';
      setError(message);
      console.error('Error fetching location types:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  /**
   * Initial load
   */
  useEffect(() => {
    fetchLocationTypes();
  }, [fetchLocationTypes]);

  /**
   * Create location type
   */
  const createLocationType = async (data: CreateLocationTypeData): Promise<LocationType> => {
    try {
      const created = await locationTypesApi.create(data);
      await fetchLocationTypes(); // Refresh list
      return created;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create location type';
      setError(message);
      throw new Error(message);
    }
  };

  /**
   * Update location type with optimistic locking
   */
  const updateLocationType = async (
    id: string, 
    data: UpdateLocationTypeData
  ): Promise<LocationType> => {
    try {
      const updated = await locationTypesApi.update(id, data);
      await fetchLocationTypes(); // Refresh list
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update location type';
      
      // Handle optimistic locking conflict
      if (message.includes('version') || message.includes('conflict')) {
        setError('This location type was modified by another user. Please refresh and try again.');
      } else {
        setError(message);
      }
      
      throw new Error(message);
    }
  };

  /**
   * Delete location type
   */
  const deleteLocationType = async (id: string): Promise<void> => {
    try {
      await locationTypesApi.delete(id);
      await fetchLocationTypes(); // Refresh list
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete location type';
      setError(message);
      throw new Error(message);
    }
  };

  /**
   * Toggle active status
   */
  const toggleActive = async (id: string, version: number): Promise<LocationType> => {
    try {
      const updated = await locationTypesApi.toggleActive(id, version);
      await fetchLocationTypes(); // Refresh list
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to toggle active status';
      setError(message);
      throw new Error(message);
    }
  };

  /**
   * Validate code uniqueness
   */
  const validateCode = async (
    code: string, 
    tenantId: string, 
    excludeId?: string
  ): Promise<boolean> => {
    try {
      return await locationTypesApi.validateCode(code, tenantId, excludeId);
    } catch (err) {
      console.error('Error validating code:', err);
      return false;
    }
  };

  /**
   * Get active location types only
   */
  const getActiveLocationTypes = useCallback((): LocationType[] => {
    return locationTypes.filter(lt => lt.is_active);
  }, [locationTypes]);

  /**
   * Get by tenant
   */
  const getByTenant = useCallback((tenantId: string, activeOnly: boolean = false): LocationType[] => {
    return locationTypes.filter(lt => 
      lt.tenant_id === tenantId && (!activeOnly || lt.is_active)
    );
  }, [locationTypes]);

  /**
   * Get statistics
   */
  const getStats = useCallback(() => {
    return {
      total: locationTypes.length,
      active: locationTypes.filter(lt => lt.is_active).length,
      inactive: locationTypes.filter(lt => !lt.is_active).length,
      system: locationTypes.filter(lt => lt.is_system).length,
      custom: locationTypes.filter(lt => !lt.is_system).length,
    };
  }, [locationTypes]);

  return {
    // State
    locationTypes,
    loading,
    error,

    // Actions
    createLocationType,
    updateLocationType,
    deleteLocationType,
    toggleActive,
    validateCode,
    refresh: fetchLocationTypes,

    // Utilities
    getActiveLocationTypes,
    getByTenant,
    getStats,
  };
}

export default useLocationTypes;
