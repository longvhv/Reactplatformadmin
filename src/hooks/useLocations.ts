/**
 * useLocations Hook
 * React hook for managing locations
 * 
 * ✅ CREATED 2026-01-14: Use new interface with 18 fields
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  locationsApi,
  Location,
  LocationFilters,
  CreateLocationRequest,
  UpdateLocationRequest,
  LocationStats,
  LocationWithRelations,
  LocationStatus,
} from '../api/locationsApi';

export function useLocations(filters?: LocationFilters) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize filters
  const memoizedFilters = useMemo(() => filters, [
    filters?.tenant_id,
    filters?.parent_id,
    filters?.type_id,
    filters?.status,
    filters?.is_headquarter,
    filters?.include_deleted,
    filters?.with_children,
    filters?.search,
    filters?.limit,
    filters?.offset,
  ]);

  // Fetch locations
  const fetchLocations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await locationsApi.getAll(memoizedFilters);
      setLocations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load locations');
      console.error('Error fetching locations:', err);
    } finally {
      setLoading(false);
    }
  }, [memoizedFilters]);

  // Create location
  const createLocation = async (data: CreateLocationRequest): Promise<Location> => {
    try {
      const created = await locationsApi.create(data);
      await fetchLocations();
      return created;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create location';
      setError(message);
      throw new Error(message);
    }
  };

  // Update location
  const updateLocation = async (id: string, data: UpdateLocationRequest): Promise<Location> => {
    try {
      const updated = await locationsApi.update(id, data);
      await fetchLocations();
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update location';
      setError(message);
      throw new Error(message);
    }
  };

  // Delete location
  const deleteLocation = async (id: string): Promise<void> => {
    try {
      await locationsApi.delete(id);
      await fetchLocations();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete location';
      setError(message);
      throw new Error(message);
    }
  };

  // Status management
  const activateLocation = async (id: string): Promise<Location> => {
    try {
      const activated = await locationsApi.activate(id);
      await fetchLocations();
      return activated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to activate location';
      setError(message);
      throw new Error(message);
    }
  };

  const deactivateLocation = async (id: string): Promise<Location> => {
    try {
      const deactivated = await locationsApi.deactivate(id);
      await fetchLocations();
      return deactivated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to deactivate location';
      setError(message);
      throw new Error(message);
    }
  };

  const closeLocation = async (id: string): Promise<Location> => {
    try {
      const closed = await locationsApi.close(id);
      await fetchLocations();
      return closed;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to close location';
      setError(message);
      throw new Error(message);
    }
  };

  // Headquarters management
  const setAsHeadquarters = async (id: string): Promise<Location> => {
    try {
      const updated = await locationsApi.setAsHeadquarters(id);
      await fetchLocations();
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to set as headquarters';
      setError(message);
      throw new Error(message);
    }
  };

  // Tree operations
  const moveLocation = async (id: string, newParentId?: string): Promise<Location> => {
    try {
      const moved = await locationsApi.move(id, newParentId);
      await fetchLocations();
      return moved;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to move location';
      setError(message);
      throw new Error(message);
    }
  };

  const buildTree = async (tenantId: string): Promise<LocationWithRelations[]> => {
    try {
      return await locationsApi.buildTree(tenantId);
    } catch (err) {
      console.error('Error building tree:', err);
      return [];
    }
  };

  // Get stats
  const getStats = async (): Promise<LocationStats> => {
    try {
      return await locationsApi.getStats(memoizedFilters);
    } catch (err) {
      console.error('Error getting stats:', err);
      return {
        total: 0,
        by_status: {
          ACTIVE: 0,
          INACTIVE: 0,
          CLOSED: 0,
        },
        by_type: {},
        headquarters: 0,
        with_parent: 0,
        root_locations: 0,
        with_coordinates: 0,
        with_geofence: 0,
        avg_radius_meters: 0,
      };
    }
  };

  // Bulk operations
  const bulkActivate = async (ids: string[]): Promise<void> => {
    try {
      await locationsApi.bulkActivate(ids);
      await fetchLocations();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to bulk activate';
      setError(message);
      throw new Error(message);
    }
  };

  const bulkDeactivate = async (ids: string[]): Promise<void> => {
    try {
      await locationsApi.bulkDeactivate(ids);
      await fetchLocations();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to bulk deactivate';
      setError(message);
      throw new Error(message);
    }
  };

  const bulkDelete = async (ids: string[]): Promise<void> => {
    try {
      await locationsApi.bulkDelete(ids);
      await fetchLocations();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to bulk delete';
      setError(message);
      throw new Error(message);
    }
  };

  // Initial load
  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  return {
    locations,
    loading,
    error,
    createLocation,
    updateLocation,
    deleteLocation,
    activateLocation,
    deactivateLocation,
    closeLocation,
    setAsHeadquarters,
    moveLocation,
    buildTree,
    getStats,
    bulkActivate,
    bulkDeactivate,
    bulkDelete,
    refresh: fetchLocations,
  };
}

export default useLocations;
