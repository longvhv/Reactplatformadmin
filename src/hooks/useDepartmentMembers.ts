/**
 * Department Members Hook
 * Manages department member operations with optimistic updates
 * 
 * ✅ CREATED 2026-01-15
 * ✅ Production-ready with error handling
 * ✅ Optimistic UI updates
 */

import { useState, useEffect, useCallback } from 'react';
import { departmentMembersApi, DepartmentMember, DepartmentMemberFilters, CreateDepartmentMemberRequest, UpdateDepartmentMemberRequest, DepartmentMemberStats } from '../api/departmentMembersApi';
import { toast } from 'sonner@2.0.3';

interface UseDepartmentMembersOptions {
  filters?: DepartmentMemberFilters;
  autoLoad?: boolean;
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
}

export function useDepartmentMembers(options: UseDepartmentMembersOptions = {}) {
  const {
    filters,
    autoLoad = true,
    onSuccess,
    onError,
  } = options;

  const [members, setMembers] = useState<DepartmentMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DepartmentMemberStats | null>(null);

  // Load department members
  const loadMembers = useCallback(async (customFilters?: DepartmentMemberFilters) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await departmentMembersApi.getAll(customFilters || filters);
      setMembers(data);
      
      return data;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to load department members';
      setError(errorMsg);
      onError?.(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [filters, onError]);

  // Load stats
  const loadStats = useCallback(async (tenantId: string) => {
    try {
      setLoading(true);
      const data = await departmentMembersApi.getStats(tenantId);
      setStats(data);
      return data;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to load statistics';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create department member
  const createMember = useCallback(async (data: CreateDepartmentMemberRequest) => {
    try {
      setLoading(true);
      setError(null);
      
      const newMember = await departmentMembersApi.create(data);
      
      // Optimistic update
      setMembers(prev => [...prev, newMember]);
      
      const successMsg = 'Member assigned to department successfully';
      onSuccess?.(successMsg);
      toast.success(successMsg);
      
      return newMember;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to assign member';
      setError(errorMsg);
      onError?.(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [onSuccess, onError]);

  // Update department member
  const updateMember = useCallback(async (id: string, data: UpdateDepartmentMemberRequest) => {
    try {
      setLoading(true);
      setError(null);
      
      const updated = await departmentMembersApi.update(id, data);
      
      // Optimistic update
      setMembers(prev => prev.map(m => m._id === id ? updated : m));
      
      const successMsg = 'Department member updated successfully';
      onSuccess?.(successMsg);
      toast.success(successMsg);
      
      return updated;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to update department member';
      setError(errorMsg);
      onError?.(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [onSuccess, onError]);

  // Delete department member (soft delete)
  const deleteMember = useCallback(async (id: string, deleted_by?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      await departmentMembersApi.delete(id, deleted_by);
      
      // Optimistic update
      setMembers(prev => prev.filter(m => m._id !== id));
      
      const successMsg = 'Department member removed successfully';
      onSuccess?.(successMsg);
      toast.success(successMsg);
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to remove department member';
      setError(errorMsg);
      onError?.(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [onSuccess, onError]);

  // Restore soft-deleted member
  const restoreMember = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const restored = await departmentMembersApi.restore(id);
      
      // Optimistic update
      setMembers(prev => [...prev, restored]);
      
      const successMsg = 'Department member restored successfully';
      onSuccess?.(successMsg);
      toast.success(successMsg);
      
      return restored;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to restore department member';
      setError(errorMsg);
      onError?.(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [onSuccess, onError]);

  // Assign member to department
  const assignMember = useCallback(async (
    departmentId: string,
    tenantMemberId: string,
    tenantId: string,
    options?: {
      is_primary?: boolean;
      role_in_department?: string;
      joined_at?: string;
      created_by?: string;
    }
  ) => {
    try {
      setLoading(true);
      setError(null);
      
      const member = await departmentMembersApi.assignMember(
        departmentId,
        tenantMemberId,
        tenantId,
        options
      );
      
      // Optimistic update
      setMembers(prev => [...prev, member]);
      
      const successMsg = 'Member assigned successfully';
      onSuccess?.(successMsg);
      toast.success(successMsg);
      
      return member;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to assign member';
      setError(errorMsg);
      onError?.(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [onSuccess, onError]);

  // Remove member from department
  const removeMember = useCallback(async (
    departmentId: string,
    tenantMemberId: string,
    updated_by?: string
  ) => {
    try {
      setLoading(true);
      setError(null);
      
      const updated = await departmentMembersApi.removeMember(
        departmentId,
        tenantMemberId,
        updated_by
      );
      
      // Optimistic update
      setMembers(prev => prev.map(m => 
        m.department_id === departmentId && m.tenant_member_id === tenantMemberId
          ? updated
          : m
      ));
      
      const successMsg = 'Member removed from department';
      onSuccess?.(successMsg);
      toast.success(successMsg);
      
      return updated;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to remove member';
      setError(errorMsg);
      onError?.(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [onSuccess, onError]);

  // Set primary department
  const setPrimaryDepartment = useCallback(async (
    tenantMemberId: string,
    departmentId: string,
    updated_by?: string
  ) => {
    try {
      setLoading(true);
      setError(null);
      
      const updated = await departmentMembersApi.setPrimaryDepartment(
        tenantMemberId,
        departmentId,
        updated_by
      );
      
      // Optimistic update - unset all primary, then set new one
      setMembers(prev => prev.map(m => {
        if (m.tenant_member_id === tenantMemberId) {
          return {
            ...m,
            is_primary: m.department_id === departmentId,
          };
        }
        return m;
      }));
      
      const successMsg = 'Primary department updated';
      onSuccess?.(successMsg);
      toast.success(successMsg);
      
      return updated;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to set primary department';
      setError(errorMsg);
      onError?.(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [onSuccess, onError]);

  // Update member role
  const updateRole = useCallback(async (
    departmentId: string,
    tenantMemberId: string,
    role: string,
    updated_by?: string
  ) => {
    try {
      setLoading(true);
      setError(null);
      
      const updated = await departmentMembersApi.updateRole(
        departmentId,
        tenantMemberId,
        role,
        updated_by
      );
      
      // Optimistic update
      setMembers(prev => prev.map(m => 
        m.department_id === departmentId && m.tenant_member_id === tenantMemberId
          ? updated
          : m
      ));
      
      const successMsg = 'Member role updated';
      onSuccess?.(successMsg);
      toast.success(successMsg);
      
      return updated;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to update role';
      setError(errorMsg);
      onError?.(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [onSuccess, onError]);

  // Batch assign members
  const batchAssign = useCallback(async (
    departmentId: string,
    tenantMemberIds: string[],
    options?: {
      is_primary?: boolean;
      role_in_department?: string;
      joined_at?: string;
      created_by?: string;
    }
  ) => {
    try {
      setLoading(true);
      setError(null);
      
      const newMembers = await departmentMembersApi.batchAssign({
        department_id: departmentId,
        tenant_member_ids: tenantMemberIds,
        ...options,
      });
      
      // Optimistic update
      setMembers(prev => [...prev, ...newMembers]);
      
      const successMsg = `${newMembers.length} members assigned successfully`;
      onSuccess?.(successMsg);
      toast.success(successMsg);
      
      return newMembers;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to assign members';
      setError(errorMsg);
      onError?.(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [onSuccess, onError]);

  // Batch remove members
  const batchRemove = useCallback(async (
    departmentId: string,
    tenantMemberIds: string[],
    updated_by?: string
  ) => {
    try {
      setLoading(true);
      setError(null);
      
      await departmentMembersApi.batchRemove(departmentId, tenantMemberIds, updated_by);
      
      // Optimistic update
      setMembers(prev => prev.filter(m => 
        !(m.department_id === departmentId && tenantMemberIds.includes(m.tenant_member_id))
      ));
      
      const successMsg = `${tenantMemberIds.length} members removed successfully`;
      onSuccess?.(successMsg);
      toast.success(successMsg);
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to remove members';
      setError(errorMsg);
      onError?.(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [onSuccess, onError]);

  // Transfer member
  const transferMember = useCallback(async (
    fromDepartmentId: string,
    toDepartmentId: string,
    tenantMemberId: string,
    options?: {
      role_in_department?: string;
      updated_by?: string;
    }
  ) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await departmentMembersApi.transferMember({
        from_department_id: fromDepartmentId,
        to_department_id: toDepartmentId,
        tenant_member_id: tenantMemberId,
        ...options,
      });
      
      // Optimistic update
      setMembers(prev => prev.map(m => {
        if (m.department_id === fromDepartmentId && m.tenant_member_id === tenantMemberId) {
          return result.removed;
        }
        return m;
      }));
      setMembers(prev => [...prev, result.added]);
      
      const successMsg = 'Member transferred successfully';
      onSuccess?.(successMsg);
      toast.success(successMsg);
      
      return result;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to transfer member';
      setError(errorMsg);
      onError?.(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [onSuccess, onError]);

  // Get members by department
  const getByDepartment = useCallback(async (departmentId: string, activeOnly: boolean = false) => {
    return departmentMembersApi.getByDepartment(departmentId, activeOnly);
  }, []);

  // Get departments by tenant member
  const getByTenantMember = useCallback(async (tenantMemberId: string, activeOnly: boolean = false) => {
    return departmentMembersApi.getByTenantMember(tenantMemberId, activeOnly);
  }, []);

  // Get primary department
  const getPrimaryDepartment = useCallback(async (tenantMemberId: string) => {
    return departmentMembersApi.getPrimaryDepartment(tenantMemberId);
  }, []);

  // Get member history
  const getMemberHistory = useCallback(async (tenantMemberId: string) => {
    return departmentMembersApi.getMemberHistory(tenantMemberId);
  }, []);

  // Check if can remove
  const canRemove = useCallback(async (departmentId: string, tenantMemberId: string) => {
    return departmentMembersApi.canRemove(departmentId, tenantMemberId);
  }, []);

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad) {
      loadMembers();
    }
  }, [autoLoad, loadMembers]);

  return {
    // State
    members,
    loading,
    error,
    stats,
    
    // CRUD operations
    loadMembers,
    loadStats,
    createMember,
    updateMember,
    deleteMember,
    restoreMember,
    
    // Helper functions
    assignMember,
    removeMember,
    setPrimaryDepartment,
    updateRole,
    batchAssign,
    batchRemove,
    transferMember,
    
    // Getters
    getByDepartment,
    getByTenantMember,
    getPrimaryDepartment,
    getMemberHistory,
    canRemove,
  };
}

export default useDepartmentMembers;
