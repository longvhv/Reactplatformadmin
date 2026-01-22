/**
 * useCapabilities Hook
 * Hook for managing application capabilities
 * 
 * ✅ FIXED 2026-01-14:
 * - Import from /api/appCapabilityApi (correct interface with 19 fields)
 * - Use real API instead of mock data
 * - Fix app_code → app_id
 * - Fix type enum: BOOLEAN/NUMBER → FEATURE/LIMIT
 * - Fix is_active → status
 * - Add all missing fields
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  appCapabilityApi,
  type AppCapability, 
  type CreateCapabilityRequest,
  type UpdateCapabilityRequest,
  type CapabilityType,
  type CapabilityStatus,
} from '../api/appCapabilityApi';
import { toast } from 'sonner';

export function useCapabilities(appId: string, tenantId?: string) {
  const [capabilities, setCapabilities] = useState<AppCapability[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCapabilities = useCallback(async () => {
    if (!appId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 [useCapabilities] Loading capabilities for app:', appId);
      
      // ✅ Use real API
      const data = await appCapabilityApi.getByAppId(appId, tenantId);
      console.log('✅ [useCapabilities] Capabilities loaded:', data);
      
      setCapabilities(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load capabilities';
      console.error('❌ [useCapabilities] Error loading capabilities:', err);
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [appId, tenantId]);

  useEffect(() => {
    loadCapabilities();
  }, [loadCapabilities]);

  const createCapability = async (data: CreateCapabilityRequest): Promise<AppCapability> => {
    try {
      console.log('🔍 [useCapabilities] Creating capability:', data);
      
      const created = await appCapabilityApi.create(data);
      console.log('✅ [useCapabilities] Capability created:', created);
      
      await loadCapabilities();
      toast.success('Đã tạo khả năng thành công');
      
      return created;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create capability';
      console.error('❌ [useCapabilities] Error creating capability:', err);
      toast.error(message);
      throw err;
    }
  };

  const updateCapability = async (id: string, data: UpdateCapabilityRequest): Promise<AppCapability> => {
    try {
      console.log('🔍 [useCapabilities] Updating capability:', id, data);
      
      const updated = await appCapabilityApi.update(id, data);
      console.log('✅ [useCapabilities] Capability updated:', updated);
      
      await loadCapabilities();
      toast.success('Đã cập nhật khả năng thành công');
      
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update capability';
      console.error('❌ [useCapabilities] Error updating capability:', err);
      toast.error(message);
      throw err;
    }
  };

  const deleteCapability = async (id: string): Promise<void> => {
    try {
      console.log('🔍 [useCapabilities] Deleting capability:', id);
      
      await appCapabilityApi.delete(id);
      console.log('✅ [useCapabilities] Capability deleted');
      
      await loadCapabilities();
      toast.success('Đã xóa khả năng thành công');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete capability';
      console.error('❌ [useCapabilities] Error deleting capability:', err);
      toast.error(message);
      throw err;
    }
  };

  const changeStatus = async (id: string, status: CapabilityStatus, version: number): Promise<AppCapability> => {
    try {
      console.log('🔍 [useCapabilities] Changing status:', id, status);
      
      const updated = await appCapabilityApi.changeStatus(id, status, version);
      console.log('✅ [useCapabilities] Status changed:', updated);
      
      await loadCapabilities();
      toast.success(`Đã chuyển trạng thái thành ${status}`);
      
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to change status';
      console.error('❌ [useCapabilities] Error changing status:', err);
      toast.error(message);
      throw err;
    }
  };

  const getFeatures = (): AppCapability[] => {
    return capabilities.filter(cap => cap.type === 'FEATURE');
  };

  const getLimits = (): AppCapability[] => {
    return capabilities.filter(cap => cap.type === 'LIMIT');
  };

  const getActiveCapabilities = (): AppCapability[] => {
    return capabilities.filter(cap => cap.status === 'active');
  };

  return {
    capabilities,
    loading,
    error,
    createCapability,
    updateCapability,
    deleteCapability,
    changeStatus,
    refetch: loadCapabilities,
    // Helper methods
    getFeatures,
    getLimits,
    getActiveCapabilities,
  };
}