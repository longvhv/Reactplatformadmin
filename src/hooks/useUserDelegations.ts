/**
 * useUserDelegations Hook
 * React hook for managing user delegations
 * 
 * ✅ REWRITTEN 2026-01-14: Use new interface with 21 fields
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  userDelegationsApi,
  UserDelegation,
  DelegationFilters,
  CreateDelegationRequest,
  UpdateDelegationRequest,
  DelegationStats,
  RevokeDelegationRequest,
  DelegationStatus,
} from '../api/userDelegationsApi';

export function useUserDelegations(filters?: DelegationFilters) {
  const [delegations, setDelegations] = useState<UserDelegation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize filters to prevent infinite loop
  const memoizedFilters = useMemo(() => filters, [
    filters?.delegator_id,
    filters?.delegate_id,
    filters?.tenant_id,
    filters?.scope,
    filters?.status,
    filters?.active_only,
    filters?.expired_only,
    filters?.expiring_soon,
    filters?.include_revoked,
    filters?.search,
    filters?.limit,
    filters?.offset,
    filters?.order_by,
    filters?.order_direction,
  ]);

  // Fetch delegations
  const fetchDelegations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await userDelegationsApi.getAll(memoizedFilters);
      setDelegations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load delegations');
      console.error('Error fetching user delegations:', err);
    } finally {
      setLoading(false);
    }
  }, [memoizedFilters]);

  // Create delegation
  const createDelegation = async (data: CreateDelegationRequest): Promise<UserDelegation> => {
    try {
      const created = await userDelegationsApi.create(data);
      await fetchDelegations();
      return created;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create delegation';
      setError(message);
      throw new Error(message);
    }
  };

  // Update delegation
  const updateDelegation = async (id: string, data: UpdateDelegationRequest): Promise<UserDelegation> => {
    try {
      const updated = await userDelegationsApi.update(id, data);
      await fetchDelegations();
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update delegation';
      setError(message);
      throw new Error(message);
    }
  };

  // Activate delegation
  const activateDelegation = async (id: string): Promise<UserDelegation> => {
    try {
      const activated = await userDelegationsApi.activate(id);
      await fetchDelegations();
      return activated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to activate delegation';
      setError(message);
      throw new Error(message);
    }
  };

  // Suspend delegation
  const suspendDelegation = async (id: string, reason?: string): Promise<UserDelegation> => {
    try {
      const suspended = await userDelegationsApi.suspend(id, reason);
      await fetchDelegations();
      return suspended;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to suspend delegation';
      setError(message);
      throw new Error(message);
    }
  };

  // Revoke delegation
  const revokeDelegation = async (id: string, request: RevokeDelegationRequest): Promise<UserDelegation> => {
    try {
      const revoked = await userDelegationsApi.revoke(id, request);
      await fetchDelegations();
      return revoked;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to revoke delegation';
      setError(message);
      throw new Error(message);
    }
  };

  // Resume delegation
  const resumeDelegation = async (id: string): Promise<UserDelegation> => {
    try {
      const resumed = await userDelegationsApi.resume(id);
      await fetchDelegations();
      return resumed;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to resume delegation';
      setError(message);
      throw new Error(message);
    }
  };

  // Extend delegation
  const extendDelegation = async (id: string, newEndDate: string): Promise<UserDelegation> => {
    try {
      const extended = await userDelegationsApi.extend(id, newEndDate);
      await fetchDelegations();
      return extended;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to extend delegation';
      setError(message);
      throw new Error(message);
    }
  };

  // Delete delegation
  const deleteDelegation = async (id: string): Promise<void> => {
    try {
      await userDelegationsApi.delete(id);
      await fetchDelegations();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete delegation';
      setError(message);
      throw new Error(message);
    }
  };

  // Get stats
  const getStats = async (): Promise<DelegationStats> => {
    try {
      return await userDelegationsApi.getStats(memoizedFilters);
    } catch (err) {
      console.error('Error getting stats:', err);
      return {
        total: 0,
        by_status: {
          pending: 0,
          active: 0,
          expired: 0,
          revoked: 0,
          suspended: 0,
        },
        by_scope: {
          admin: 0,
          manager: 0,
          editor: 0,
          viewer: 0,
          approver: 0,
          reviewer: 0,
          auditor: 0,
          custom: 0,
        },
        active_now: 0,
        expiring_soon: 0,
        expiring_today: 0,
        expired_recently: 0,
        revoked_recently: 0,
        auto_expire_enabled: 0,
        with_notifications: 0,
        avg_duration_days: 0,
        longest_active: null,
      };
    }
  };

  // Clone delegation
  const cloneDelegation = async (id: string, newStartDate: string, newEndDate?: string): Promise<UserDelegation> => {
    try {
      const cloned = await userDelegationsApi.clone(id, newStartDate, newEndDate);
      await fetchDelegations();
      return cloned;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to clone delegation';
      setError(message);
      throw new Error(message);
    }
  };

  // Bulk operations
  const bulkActivate = async (ids: string[]): Promise<void> => {
    try {
      await userDelegationsApi.bulkActivate(ids);
      await fetchDelegations();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to bulk activate';
      setError(message);
      throw new Error(message);
    }
  };

  const bulkRevoke = async (ids: string[], request: RevokeDelegationRequest): Promise<void> => {
    try {
      await userDelegationsApi.bulkRevoke(ids, request);
      await fetchDelegations();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to bulk revoke';
      setError(message);
      throw new Error(message);
    }
  };

  const bulkDelete = async (ids: string[]): Promise<void> => {
    try {
      await userDelegationsApi.bulkDelete(ids);
      await fetchDelegations();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to bulk delete';
      setError(message);
      throw new Error(message);
    }
  };

  // Check if can delegate
  const canDelegate = async (delegatorId: string, delegateId: string): Promise<{
    can_delegate: boolean;
    reason?: string;
  }> => {
    try {
      return await userDelegationsApi.canDelegate(delegatorId, delegateId);
    } catch (err) {
      console.error('Error checking if can delegate:', err);
      return { can_delegate: false, reason: 'Error checking delegation permission' };
    }
  };

  // Initial load
  useEffect(() => {
    fetchDelegations();
  }, [fetchDelegations]);

  return {
    delegations,
    loading,
    error,
    createDelegation,
    updateDelegation,
    activateDelegation,
    suspendDelegation,
    revokeDelegation,
    resumeDelegation,
    extendDelegation,
    deleteDelegation,
    getStats,
    cloneDelegation,
    bulkActivate,
    bulkRevoke,
    bulkDelete,
    canDelegate,
    refresh: fetchDelegations,
  };
}

export default useUserDelegations;
