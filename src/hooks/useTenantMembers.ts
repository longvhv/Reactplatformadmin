/**
 * useTenantMembers Hook
 * Manages tenant members (tenant_members table - JOIN of users + tenants)
 * 
 * MIGRATED: Now uses DataClient abstraction layer
 * - Easy to switch between Supabase and Golang API
 * - Consistent pattern across all hooks
 * - Type-safe with generics
 * 
 * NOTE: tenant_members is a separate table, not users!
 */

import { useState, useEffect, useCallback } from 'react';
import { useDataClient } from './useDataClient';

/**
 * Tenant Member type (from tenant_members table)
 */
export interface TenantMember {
  _id: string;
  tenant_id: string;
  user_id: string;
  employee_code?: string;
  internal_email?: string;
  job_title?: string;
  manager_id?: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
  status: 'ACTIVE' | 'RESIGNED' | 'ONBOARDING' | 'SUSPENDED';
  joined_at?: string;
  left_at?: string;
  permissions?: any[];
  metadata?: any;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  version: number;
}

/**
 * Filters for querying tenant members
 */
export interface TenantMemberFilters {
  role?: string;
  status?: string;
  search?: string;
}

/**
 * Hook for managing tenant members
 * @param tenantId - The ID of the tenant
 * @param filters - Optional filters
 */
export function useTenantMembers(
  tenantId?: string,
  filters?: TenantMemberFilters
) {
  const [members, setMembers] = useState<TenantMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState<number | undefined>();

  // Get DataClient instance
  const dataClient = useDataClient();

  /**
   * Load tenant members
   */
  const loadMembers = useCallback(async () => {
    // Skip if no tenant ID
    if (!tenantId) {
      setMembers([]);
      return;
    }

    // Guard: Wait for dataClient to be ready
    if (!dataClient) {
      console.log('[useTenantMembers] Waiting for DataClient to initialize...');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('[useTenantMembers] Loading members for tenant:', tenantId);

      // Try cache first
      const cacheKey = `tenant_members_${tenantId}`;
      const cachedData = localStorage.getItem(cacheKey);
      
      if (cachedData) {
        const cached = JSON.parse(cachedData);
        const cacheAge = Date.now() - cached.timestamp;

        // Use cache if less than 3 minutes old
        if (cacheAge < 3 * 60 * 1000) {
          setMembers(cached.data);
          setTotal(cached.total);
          setLoading(false);

          // Continue to fetch in background
          fetchFromDataSource(true);
          return;
        }
      }

      // Fetch from data source
      await fetchFromDataSource(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load members';
      setError(message);
      console.error('[useTenantMembers] Error loading members:', err);
      setLoading(false);
    }
  }, [tenantId, filters, dataClient]);

  /**
   * Fetch from data source using DataClient
   */
  const fetchFromDataSource = async (isBackgroundUpdate: boolean) => {
    if (!dataClient || !tenantId) {
      if (!isBackgroundUpdate) {
        setLoading(false);
      }
      return;
    }

    try {
      // Build filters - query tenant_members table
      const queryFilters: Record<string, any> = {
        tenant_id: tenantId,
      };

      if (filters?.role) queryFilters.role = filters.role;
      if (filters?.status) queryFilters.status = filters.status;
      // ✅ Skip search filter - it's not a database column
      // Search should be handled by backend or via text search on specific columns

      // Query using DataClient
      const result = await dataClient.query<TenantMember>('tenant_members', {
        filters: queryFilters,
        orderBy: [{ field: 'created_at', direction: 'desc' }],
      });

      console.log('[useTenantMembers] Loaded members:', result.data.length);

      // Update cache
      localStorage.setItem(
        `tenant_members_${tenantId}`,
        JSON.stringify({
          data: result.data,
          total: result.total,
          timestamp: Date.now(),
        })
      );

      // Update state
      setMembers(result.data);
      setTotal(result.total);

      if (!isBackgroundUpdate) {
        setLoading(false);
      }
    } catch (err) {
      console.error('[useTenantMembers] Fetch error:', err);
      
      if (!isBackgroundUpdate) {
        throw err;
      }
    }
  };

  /**
   * Add member to tenant (create tenant_member record)
   */
  const addMember = useCallback(
    async (userId: string, role: TenantMember['role'] = 'MEMBER'): Promise<TenantMember> => {
      if (!tenantId) {
        throw new Error('No tenant ID provided');
      }

      if (!dataClient) {
        throw new Error('DataClient not initialized');
      }

      setError(null);

      try {
        console.log('[useTenantMembers] Adding member to tenant:', userId);

        // Create tenant_member record
        const newMember = await dataClient.create<TenantMember>('tenant_members', {
          tenant_id: tenantId,
          user_id: userId,
          role,
          status: 'ACTIVE',
          joined_at: new Date().toISOString(),
        });

        console.log('[useTenantMembers] Member added:', newMember._id);

        // Optimistic update
        setMembers((prev) => [newMember, ...prev]);

        // Invalidate cache
        localStorage.removeItem(`tenant_members_${tenantId}`);

        return newMember;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to add member';
        setError(message);
        console.error('[useTenantMembers] Error adding member:', err);
        throw new Error(message);
      }
    },
    [tenantId, dataClient]
  );

  /**
   * Remove member from tenant (soft delete tenant_member)
   */
  const removeMember = useCallback(
    async (memberId: string): Promise<void> => {
      if (!tenantId) {
        throw new Error('No tenant ID provided');
      }

      if (!dataClient) {
        throw new Error('DataClient not initialized');
      }

      setError(null);

      try {
        console.log('[useTenantMembers] Removing member:', memberId);

        // Soft delete tenant_member
        await dataClient.delete('tenant_members', memberId);

        console.log('[useTenantMembers] Member removed:', memberId);

        // Optimistic update
        setMembers((prev) => prev.filter((m) => m._id !== memberId));

        // Invalidate cache
        localStorage.removeItem(`tenant_members_${tenantId}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to remove member';
        setError(message);
        console.error('[useTenantMembers] Error removing member:', err);
        throw new Error(message);
      }
    },
    [tenantId, dataClient]
  );

  /**
   * Update member role
   */
  const updateMemberRole = useCallback(
    async (memberId: string, role: TenantMember['role']): Promise<TenantMember> => {
      if (!dataClient) {
        throw new Error('DataClient not initialized');
      }

      setError(null);

      try {
        console.log('[useTenantMembers] Updating member role:', memberId, role);

        // Update tenant_member
        const updatedMember = await dataClient.update<TenantMember>('tenant_members', memberId, {
          role,
        });

        console.log('[useTenantMembers] Member role updated:', memberId);

        // Optimistic update
        setMembers((prev) =>
          prev.map((m) => (m._id === memberId ? updatedMember : m))
        );

        // Invalidate cache
        if (tenantId) {
          localStorage.removeItem(`tenant_members_${tenantId}`);
        }

        return updatedMember;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update role';
        setError(message);
        console.error('[useTenantMembers] Error updating role:', err);
        throw new Error(message);
      }
    },
    [tenantId, dataClient]
  );

  /**
   * Update member status
   */
  const updateMemberStatus = useCallback(
    async (memberId: string, status: TenantMember['status']): Promise<TenantMember> => {
      if (!dataClient) {
        throw new Error('DataClient not initialized');
      }

      setError(null);

      try {
        console.log('[useTenantMembers] Updating member status:', memberId, status);

        const updatedMember = await dataClient.update<TenantMember>('tenant_members', memberId, {
          status,
        });

        console.log('[useTenantMembers] Member status updated:', memberId);

        // Optimistic update
        setMembers((prev) =>
          prev.map((m) => (m._id === memberId ? updatedMember : m))
        );

        // Invalidate cache
        if (tenantId) {
          localStorage.removeItem(`tenant_members_${tenantId}`);
        }

        return updatedMember;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update status';
        setError(message);
        console.error('[useTenantMembers] Error updating status:', err);
        throw new Error(message);
      }
    },
    [tenantId, dataClient]
  );

  /**
   * Get member by ID
   */
  const getMember = useCallback(
    (memberId: string): TenantMember | undefined => {
      return members.find((m) => m._id === memberId);
    },
    [members]
  );

  /**
   * Reload members from server
   */
  const refresh = useCallback(async () => {
    if (tenantId) {
      localStorage.removeItem(`tenant_members_${tenantId}`);
    }
    await loadMembers();
  }, [tenantId, loadMembers]);

  // Auto-load on mount and when tenantId/dataClient change
  useEffect(() => {
    if (tenantId && dataClient) {
      console.log('[useTenantMembers] Auto-loading members for:', tenantId);
      loadMembers();
    }
  }, [tenantId, dataClient]); // Only depend on tenantId and dataClient

  // Reload when filters change
  useEffect(() => {
    if (tenantId && dataClient) {
      loadMembers();
    }
  }, [filters?.role, filters?.status, filters?.search]); // Reload on filter changes

  return {
    members,
    loading,
    error,
    total,
    loadMembers,
    addMember,
    removeMember,
    updateMemberRole,
    updateMemberStatus,
    getMember,
    refresh,
  };
}