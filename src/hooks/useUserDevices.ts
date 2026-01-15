/**
 * useUserDevices Hook
 * React hook for managing user devices
 */

import { useState, useEffect, useCallback } from 'react';
import {
  userDevicesApi,
  UserDevice,
  DeviceFilters,
  CreateDeviceData,
  UpdateDeviceData,
} from '../api/userDevicesApi';

export function useUserDevices(filters?: DeviceFilters) {
  const [devices, setDevices] = useState<UserDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch devices
  const fetchDevices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await userDevicesApi.getAll(filters);
      setDevices(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load devices');
      console.error('Error fetching user devices:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Create device
  const createDevice = async (data: CreateDeviceData): Promise<UserDevice> => {
    try {
      const created = await userDevicesApi.create(data);
      await fetchDevices();
      return created;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create device';
      setError(message);
      throw new Error(message);
    }
  };

  // Update device
  const updateDevice = async (id: string, data: UpdateDeviceData): Promise<UserDevice> => {
    try {
      const updated = await userDevicesApi.update(id, data);
      await fetchDevices();
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update device';
      setError(message);
      throw new Error(message);
    }
  };

  // Trust device
  const trustDevice = async (id: string): Promise<UserDevice> => {
    try {
      const trusted = await userDevicesApi.trust(id);
      await fetchDevices();
      return trusted;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to trust device';
      setError(message);
      throw new Error(message);
    }
  };

  // Untrust device
  const untrustDevice = async (id: string): Promise<UserDevice> => {
    try {
      const untrusted = await userDevicesApi.untrust(id);
      await fetchDevices();
      return untrusted;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to untrust device';
      setError(message);
      throw new Error(message);
    }
  };

  // Block device
  const blockDevice = async (id: string): Promise<UserDevice> => {
    try {
      const blocked = await userDevicesApi.block(id);
      await fetchDevices();
      return blocked;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to block device';
      setError(message);
      throw new Error(message);
    }
  };

  // Revoke device
  const revokeDevice = async (id: string, reason?: string): Promise<UserDevice> => {
    try {
      const revoked = await userDevicesApi.revoke(id, reason);
      await fetchDevices();
      return revoked;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to revoke device';
      setError(message);
      throw new Error(message);
    }
  };

  // Delete device
  const deleteDevice = async (id: string): Promise<void> => {
    try {
      await userDevicesApi.delete(id);
      await fetchDevices();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete device';
      setError(message);
      throw new Error(message);
    }
  };

  // Get stats
  const getStats = async () => {
    try {
      return await userDevicesApi.getStats(filters);
    } catch (err) {
      console.error('Error getting stats:', err);
      return {
        total: 0,
        active: 0,
        inactive: 0,
        blocked: 0,
        trusted: 0,
        mobile: 0,
        desktop: 0,
        tablet: 0,
      };
    }
  };

  // Initial load
  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  return {
    devices,
    loading,
    error,
    createDevice,
    updateDevice,
    trustDevice,
    untrustDevice,
    blockDevice,
    revokeDevice,
    deleteDevice,
    getStats,
    refresh: fetchDevices,
  };
}

export default useUserDevices;
