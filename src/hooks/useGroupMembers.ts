/**
 * Group Members Hook
 * Provides React state management for group memberships
 * 
 * ✅ CREATED 2026-01-15
 * Features:
 * - Optimistic UI updates
 * - Error handling with toast notifications
 * - Auto-loading on mount (optional)
 * - Soft delete support
 * - Primary group management
 * - Batch operations
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner@2.0.3';
import groupMembersApi, {
  GroupMemberFilters,
  CreateGroupMemberRequest,
  UpdateGroupMemberRequest,
  AssignMemberRequest,
  BatchAssignRequest,
} from '../api/groupMembersApi';
import { GroupMember } from '../types';

// ==================== TYPES ====================

export interface UseGroupMembersOptions {
  groupId?: string;                  // Auto-load members for this group
  tenantMemberId?: string;           // Auto-load groups for this member
  tenantId?: string;                 // Auto-load all memberships for tenant
  activeOnly?: boolean;              // Exclude left members
  autoLoad?: boolean;                // Auto-load on mount (default: true)
  onError?: (error: Error) => void;  // Custom error handler
}

export interface UseGroupMembersReturn {
  // State
  members: GroupMember[];
  loading: boolean;
  error: Error | null;

  // CRUD operations
  loadMembers: (filters?: GroupMemberFilters) => Promise<void>;
  getMember: (id: string) => Promise<GroupMember | null>;
  createMember: (data: CreateGroupMemberRequest) => Promise<GroupMember | null>;
  updateMember: (id: string, data: UpdateGroupMemberRequest) => Promise<GroupMember | null>;
  deleteMember: (id: string, deleted_by?: string) => Promise<void>;
  restoreMember: (id: string) => Promise<GroupMember | null>;

  // Assignment operations
  assignMember: (
    groupId: string,
    tenantMemberId: string,
    data?: AssignMemberRequest
  ) => Promise<GroupMember | null>;
  removeMember: (
    groupId: string,
    tenantMemberId: string,
    updated_by?: string
  ) => Promise<GroupMember | null>;
  setPrimaryGroup: (
    tenantMemberId: string,
    groupId: string,
    updated_by?: string
  ) => Promise<GroupMember | null>;
  updateMemberRole: (
    groupId: string,
    tenantMemberId: string,
    role: string,
    updated_by?: string
  ) => Promise<GroupMember | null>;
  transferMember: (
    fromGroupId: string,
    toGroupId: string,
    tenantMemberId: string,
    updated_by?: string
  ) => Promise<GroupMember | null>;

  // Batch operations
  batchAssignMembers: (
    groupId: string,
    data: BatchAssignRequest
  ) => Promise<GroupMember[] | null>;
  batchRemoveMembers: (
    groupId: string,
    tenantMemberIds: string[],
    updated_by?: string
  ) => Promise<void>;

  // Utilities
  refreshMembers: () => Promise<void>;
  canRemoveMember: (groupId: string, tenantMemberId: string) => Promise<boolean>;
}

// ==================== HOOK ====================

export function useGroupMembers(
  options: UseGroupMembersOptions = {}
): UseGroupMembersReturn {
  const {
    groupId,
    tenantMemberId,
    tenantId,
    activeOnly = true,
    autoLoad = true,
    onError,
  } = options;

  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // ==================== ERROR HANDLING ====================

  const handleError = useCallback(
    (err: any, customMessage?: string) => {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);

      const message = customMessage || error.message;
      toast.error(message);

      if (onError) {
        onError(error);
      }

      console.error('[useGroupMembers]', error);
    },
    [onError]
  );

  // ==================== LOAD MEMBERS ====================

  const loadMembers = useCallback(
    async (filters?: GroupMemberFilters) => {
      setLoading(true);
      setError(null);

      try {
        const finalFilters: GroupMemberFilters = {
          ...filters,
          user_group_id: filters?.user_group_id || groupId,
          tenant_member_id: filters?.tenant_member_id || tenantMemberId,
          tenant_id: filters?.tenant_id || tenantId,
          active_only: filters?.active_only !== undefined ? filters.active_only : activeOnly,
        };

        const data = await groupMembersApi.getAll(finalFilters);
        setMembers(data);
      } catch (err) {
        handleError(err, 'Failed to load group members');
      } finally {
        setLoading(false);
      }
    },
    [groupId, tenantMemberId, tenantId, activeOnly, handleError]
  );

  const refreshMembers = useCallback(() => {
    return loadMembers();
  }, [loadMembers]);

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad) {
      loadMembers();
    }
  }, [autoLoad, loadMembers]);

  // ==================== GET MEMBER ====================

  const getMember = useCallback(
    async (id: string): Promise<GroupMember | null> => {
      try {
        const member = await groupMembersApi.getById(id);
        return member;
      } catch (err) {
        handleError(err, 'Failed to get member');
        return null;
      }
    },
    [handleError]
  );

  // ==================== CREATE MEMBER ====================

  const createMember = useCallback(
    async (data: CreateGroupMemberRequest): Promise<GroupMember | null> => {
      try {
        const newMember = await groupMembersApi.create(data);

        // Optimistic update
        setMembers(prev => [...prev, newMember]);

        toast.success('Member assigned to group successfully');
        return newMember;
      } catch (err) {
        handleError(err, 'Failed to assign member to group');
        return null;
      }
    },
    [handleError]
  );

  // ==================== UPDATE MEMBER ====================

  const updateMember = useCallback(
    async (
      id: string,
      data: UpdateGroupMemberRequest
    ): Promise<GroupMember | null> => {
      try {
        const updated = await groupMembersApi.update(id, data);

        // Optimistic update
        setMembers(prev =>
          prev.map(m => (m._id === id ? updated : m))
        );

        toast.success('Membership updated successfully');
        return updated;
      } catch (err) {
        handleError(err, 'Failed to update membership');
        return null;
      }
    },
    [handleError]
  );

  // ==================== DELETE MEMBER ====================

  const deleteMember = useCallback(
    async (id: string, deleted_by?: string): Promise<void> => {
      try {
        await groupMembersApi.delete(id, deleted_by);

        // Optimistic update
        setMembers(prev => prev.filter(m => m._id !== id));

        toast.success('Membership deleted successfully');
      } catch (err) {
        handleError(err, 'Failed to delete membership');
      }
    },
    [handleError]
  );

  // ==================== RESTORE MEMBER ====================

  const restoreMember = useCallback(
    async (id: string): Promise<GroupMember | null> => {
      try {
        const restored = await groupMembersApi.restore(id);

        // Optimistic update
        setMembers(prev => [...prev, restored]);

        toast.success('Membership restored successfully');
        return restored;
      } catch (err) {
        handleError(err, 'Failed to restore membership');
        return null;
      }
    },
    [handleError]
  );

  // ==================== ASSIGN MEMBER ====================

  const assignMember = useCallback(
    async (
      groupId: string,
      tenantMemberId: string,
      data: AssignMemberRequest = {}
    ): Promise<GroupMember | null> => {
      try {
        const newMember = await groupMembersApi.assignMember(
          groupId,
          tenantMemberId,
          data
        );

        // Optimistic update
        setMembers(prev => [...prev, newMember]);

        toast.success('Member assigned to group successfully');
        return newMember;
      } catch (err) {
        handleError(err, 'Failed to assign member to group');
        return null;
      }
    },
    [handleError]
  );

  // ==================== REMOVE MEMBER ====================

  const removeMember = useCallback(
    async (
      groupId: string,
      tenantMemberId: string,
      updated_by?: string
    ): Promise<GroupMember | null> => {
      try {
        const updated = await groupMembersApi.removeMember(
          groupId,
          tenantMemberId,
          updated_by
        );

        // Optimistic update: remove from active list if activeOnly is true
        if (activeOnly) {
          setMembers(prev =>
            prev.filter(
              m =>
                !(
                  m.user_group_id === groupId &&
                  m.tenant_member_id === tenantMemberId
                )
            )
          );
        } else {
          // Update in place
          setMembers(prev =>
            prev.map(m => (m._id === updated._id ? updated : m))
          );
        }

        toast.success('Member removed from group successfully');
        return updated;
      } catch (err) {
        handleError(err, 'Failed to remove member from group');
        return null;
      }
    },
    [activeOnly, handleError]
  );

  // ==================== SET PRIMARY GROUP ====================

  const setPrimaryGroup = useCallback(
    async (
      tenantMemberId: string,
      groupId: string,
      updated_by?: string
    ): Promise<GroupMember | null> => {
      try {
        const updated = await groupMembersApi.setPrimaryGroup(
          tenantMemberId,
          groupId,
          updated_by
        );

        // Refresh to get all updated primary flags
        await refreshMembers();

        toast.success('Primary group updated successfully');
        return updated;
      } catch (err) {
        handleError(err, 'Failed to set primary group');
        return null;
      }
    },
    [refreshMembers, handleError]
  );

  // ==================== UPDATE MEMBER ROLE ====================

  const updateMemberRole = useCallback(
    async (
      groupId: string,
      tenantMemberId: string,
      role: string,
      updated_by?: string
    ): Promise<GroupMember | null> => {
      try {
        const updated = await groupMembersApi.updateRole(
          groupId,
          tenantMemberId,
          role,
          updated_by
        );

        // Optimistic update
        setMembers(prev =>
          prev.map(m => (m._id === updated._id ? updated : m))
        );

        toast.success('Member role updated successfully');
        return updated;
      } catch (err) {
        handleError(err, 'Failed to update member role');
        return null;
      }
    },
    [handleError]
  );

  // ==================== TRANSFER MEMBER ====================

  const transferMember = useCallback(
    async (
      fromGroupId: string,
      toGroupId: string,
      tenantMemberId: string,
      updated_by?: string
    ): Promise<GroupMember | null> => {
      try {
        const newMember = await groupMembersApi.transferMember(
          fromGroupId,
          toGroupId,
          tenantMemberId,
          updated_by
        );

        // Refresh to get updated state
        await refreshMembers();

        toast.success('Member transferred successfully');
        return newMember;
      } catch (err) {
        handleError(err, 'Failed to transfer member');
        return null;
      }
    },
    [refreshMembers, handleError]
  );

  // ==================== BATCH ASSIGN MEMBERS ====================

  const batchAssignMembers = useCallback(
    async (
      groupId: string,
      data: BatchAssignRequest
    ): Promise<GroupMember[] | null> => {
      try {
        const newMembers = await groupMembersApi.batchAssign(groupId, data);

        // Optimistic update
        setMembers(prev => [...prev, ...newMembers]);

        toast.success(`${newMembers.length} members assigned successfully`);
        return newMembers;
      } catch (err) {
        handleError(err, 'Failed to assign members');
        return null;
      }
    },
    [handleError]
  );

  // ==================== BATCH REMOVE MEMBERS ====================

  const batchRemoveMembers = useCallback(
    async (
      groupId: string,
      tenantMemberIds: string[],
      updated_by?: string
    ): Promise<void> => {
      try {
        await groupMembersApi.batchRemove(groupId, tenantMemberIds, updated_by);

        // Optimistic update
        if (activeOnly) {
          setMembers(prev =>
            prev.filter(
              m =>
                !(
                  m.user_group_id === groupId &&
                  tenantMemberIds.includes(m.tenant_member_id)
                )
            )
          );
        } else {
          // Refresh to get updated state
          await refreshMembers();
        }

        toast.success(`${tenantMemberIds.length} members removed successfully`);
      } catch (err) {
        handleError(err, 'Failed to remove members');
      }
    },
    [activeOnly, refreshMembers, handleError]
  );

  // ==================== CAN REMOVE MEMBER ====================

  const canRemoveMember = useCallback(
    async (groupId: string, tenantMemberId: string): Promise<boolean> => {
      try {
        const result = await groupMembersApi.canRemove(groupId, tenantMemberId);
        
        if (!result.can_remove && result.reason) {
          toast.warning(result.reason);
        }

        return result.can_remove;
      } catch (err) {
        handleError(err, 'Failed to check if member can be removed');
        return false;
      }
    },
    [handleError]
  );

  // ==================== RETURN ====================

  return {
    // State
    members,
    loading,
    error,

    // CRUD
    loadMembers,
    getMember,
    createMember,
    updateMember,
    deleteMember,
    restoreMember,

    // Assignment
    assignMember,
    removeMember,
    setPrimaryGroup,
    updateMemberRole,
    transferMember,

    // Batch
    batchAssignMembers,
    batchRemoveMembers,

    // Utilities
    refreshMembers,
    canRemoveMember,
  };
}

export default useGroupMembers;
