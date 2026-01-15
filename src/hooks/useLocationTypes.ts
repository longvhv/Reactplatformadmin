/**
 * useLocationTypes Hook
 * React hook for managing location types
 * 
 * ✅ CREATED 2026-01-14: Use new interface with 11 fields
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  locationTypesApi,
  LocationType,
  LocationTypeFilters,
  CreateLocationTypeRequest,
  UpdateLocationTypeRequest,
  LocationTypeStats,
  ExtraFieldDefinition,
} from '../api/locationTypesApi';

export function useLocationTypes(filters?: LocationTypeFilters) {
  const [locationTypes, setLocationTypes] = useState<LocationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize filters
  const memoizedFilters = useMemo(() => filters, [
    filters?.tenant_id,
    filters?.code,
    filters?.is_system,
    filters?.is_active,
    filters?.include_system,
    filters?.search,
    filters?.limit,
    filters?.offset,
  ]);

  // Fetch location types
  const fetchLocationTypes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await locationTypesApi.getAll(memoizedFilters);
      setLocationTypes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load location types');
      console.error('Error fetching location types:', err);
    } finally {
      setLoading(false);
    }
  }, [memoizedFilters]);

  // Create location type
  const createLocationType = async (data: CreateLocationTypeRequest): Promise<LocationType> => {
    try {
      const created = await locationTypesApi.create(data);
      await fetchLocationTypes();
      return created;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create location type';
      setError(message);
      throw new Error(message);
    }
  };

  // Update location type
  const updateLocationType = async (id: string, data: UpdateLocationTypeRequest): Promise<LocationType> => {
    try {
      const updated = await locationTypesApi.update(id, data);
      await fetchLocationTypes();
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update location type';
      setError(message);
      throw new Error(message);
    }
  };

  // Delete location type
  const deleteLocationType = async (id: string): Promise<void> => {
    try {
      await locationTypesApi.delete(id);
      await fetchLocationTypes();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete location type';
      setError(message);
      throw new Error(message);
    }
  };

  // Activate/Deactivate
  const activateLocationType = async (id: string): Promise<LocationType> => {
    try {
      const activated = await locationTypesApi.activate(id);
      await fetchLocationTypes();
      return activated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to activate location type';
      setError(message);
      throw new Error(message);
    }
  };

  const deactivateLocationType = async (id: string): Promise<LocationType> => {
    try {
      const deactivated = await locationTypesApi.deactivate(id);
      await fetchLocationTypes();
      return deactivated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to deactivate location type';
      setError(message);
      throw new Error(message);
    }
  };

  // Extra field management
  const addExtraField = async (id: string, field: ExtraFieldDefinition): Promise<LocationType> => {
    try {
      const updated = await locationTypesApi.addExtraField(id, field);
      await fetchLocationTypes();
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add extra field';
      setError(message);
      throw new Error(message);
    }
  };

  const removeExtraField = async (id: string, fieldName: string): Promise<LocationType> => {
    try {
      const updated = await locationTypesApi.removeExtraField(id, fieldName);
      await fetchLocationTypes();
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove extra field';
      setError(message);
      throw new Error(message);
    }
  };

  const updateExtraField = async (
    id: string,
    fieldName: string,
    field: Partial<ExtraFieldDefinition>
  ): Promise<LocationType> => {
    try {
      const updated = await locationTypesApi.updateExtraField(id, fieldName, field);
      await fetchLocationTypes();
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update extra field';
      setError(message);
      throw new Error(message);
    }
  };

  // Get stats
  const getStats = async (): Promise<LocationTypeStats> => {
    try {
      return await locationTypesApi.getStats(memoizedFilters);
    } catch (err) {
      console.error('Error getting stats:', err);
      return {
        total: 0,
        system_types: 0,
        custom_types: 0,
        active: 0,
        inactive: 0,
        with_extra_fields: 0,
        by_tenant: {},
      };
    }
  };

  // Initial load
  useEffect(() => {
    fetchLocationTypes();
  }, [fetchLocationTypes]);

  return {
    locationTypes,
    loading,
    error,
    createLocationType,
    updateLocationType,
    deleteLocationType,
    activateLocationType,
    deactivateLocationType,
    addExtraField,
    removeExtraField,
    updateExtraField,
    getStats,
    refresh: fetchLocationTypes,
  };
}

export default useLocationTypes;
