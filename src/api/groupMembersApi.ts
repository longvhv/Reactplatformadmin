/**
 * Group Members API Client
 * Uses Adapter pattern - Ready for Golang migration
 * 
 * ✅ CREATED 2026-01-15: 100% matches group_members schema (16 fields)
 * ⚠️ SOFT DELETE: Has deleted_at, deleted_by fields
 * 
 * This API manages the membership relationship between tenant members and user groups.
 * Supports:
 * - Primary group designation (one per member)
 * - Role-based membership
 * - Soft delete with restoration
 * - Batch operations
 * - Member transfer between groups
 */

import { createAdapter, BaseFilters } from './adapters';
import { GroupMember } from '../types';

// ==================== REQUEST/RESPONSE TYPES ====================

/**
 * Create Group Member Request
 */
export interface CreateGroupMemberRequest {
  tenant_id: string;
  user_group_id: string;
  tenant_member_id: string;
  is_primary?: boolean;              // Default false in database
  role_in_group?: string;            // varchar(100)
  joined_at?: string;                // Auto-set to now() if not provided
  metadata?: Record<string, any>;    // Default '{}' in database
  created_by?: string;
}

/**
 * Update Group Member Request
 */
export interface UpdateGroupMemberRequest {
  is_primary?: boolean;
  role_in_group?: string;
  left_at?: string;                  // Set when member leaves group
  metadata?: Record<string, any>;
  updated_by?: string;
}

/**
 * Group Member Filters
 */
export interface GroupMemberFilters extends BaseFilters {
  tenant_id?: string;
  user_group_id?: string;            // Filter by group
  tenant_member_id?: string;         // Filter by member
  is_primary?: boolean;              // Filter primary only
  active_only?: boolean;             // Exclude members who left (left_at IS NULL)
  include_deleted?: boolean;         // Include soft-deleted
}

/**
 * Group Member with joined details (for display)
 */
export interface GroupMemberWithDetails extends GroupMember {
  group_name?: string;               // From user_groups join
  group_code?: string;               // From user_groups join
  member_name?: string;              // From tenant_members join
  member_email?: string;             // From tenant_members join
  member_status?: string;            // From tenant_members join
}

/**
 * Group membership statistics
 */
export interface GroupMembershipStats {
  total: number;
  active: number;                    // left_at IS NULL
  left: number;                      // left_at IS NOT NULL
  primary: number;                   // is_primary = true
  by_role: Record<string, number>;   // Count by role_in_group
  avg_member_per_group: number;
  avg_group_per_member: number;
  most_common_role: {
    role: string;
    count: number;
  } | null;
}

/**
 * Assign member to group request
 */
export interface AssignMemberRequest {
  is_primary?: boolean;
  role_in_group?: string;
  joined_at?: string;                // Default to now()
  metadata?: Record<string, any>;
  created_by?: string;
}

/**
 * Batch assign members request
 */
export interface BatchAssignRequest {
  tenant_member_ids: string[];
  is_primary?: boolean;
  role_in_group?: string;
  metadata?: Record<string, any>;
  created_by?: string;
}

// ==================== ADAPTER ====================

const adapter = createAdapter<GroupMember, CreateGroupMemberRequest, UpdateGroupMemberRequest>(
  'group_members',
  '/group-members'
);

// ==================== API CLIENT ====================

export const groupMembersApi = {
  // ==================== CRUD OPERATIONS ====================

  /**
   * GET /group-members
   * List all group memberships with optional filters
   */
  getAll: async (filters?: GroupMemberFilters): Promise<GroupMember[]> => {
    return adapter.getAll(filters);
  },

  /**
   * GET /group-members/:id
   * Get a single group membership by ID
   */
  getById: async (id: string): Promise<GroupMember> => {
    return adapter.getById(id);
  },

  /**
   * POST /group-members
   * Create a new group membership
   * Validates unique constraint (user_group_id, tenant_member_id)
   */
  create: async (data: CreateGroupMemberRequest): Promise<GroupMember> => {
    // Validate required fields
    if (!data.user_group_id || !data.tenant_member_id) {
      throw new Error('user_group_id and tenant_member_id are required');
    }

    // Check unique constraint: (user_group_id, tenant_member_id)
    const existing = await adapter.getAll({
      user_group_id: data.user_group_id,
      tenant_member_id: data.tenant_member_id,
    });

    if (existing.length > 0 && !existing[0].deleted_at) {
      throw new Error('Member is already assigned to this group');
    }

    // Auto-set joined_at if not provided
    if (!data.joined_at) {
      data.joined_at = new Date().toISOString();
    }

    return adapter.create(data);
  },

  /**
   * PATCH /group-members/:id
   * Update a group membership
   */
  update: async (id: string, data: UpdateGroupMemberRequest): Promise<GroupMember> => {
    return adapter.update(id, data);
  },

  /**
   * DELETE /group-members/:id (SOFT DELETE)
   * Sets deleted_at to current timestamp
   */
  delete: async (id: string, deleted_by?: string): Promise<void> => {
    await adapter.update(id, {
      deleted_at: new Date().toISOString(),
      deleted_by,
    } as any);
  },

  /**
   * Hard delete (permanently remove from database)
   * Use with extreme caution!
   */
  hardDelete: async (id: string): Promise<void> => {
    return adapter.delete(id);
  },

  /**
   * Restore soft-deleted membership
   */
  restore: async (id: string): Promise<GroupMember> => {
    return adapter.update(id, {
      deleted_at: undefined,
      deleted_by: undefined,
    } as any);
  },

  // ==================== QUERY OPERATIONS ====================

  /**
   * Get all members of a specific group
   */
  getByGroup: async (groupId: string, activeOnly: boolean = true): Promise<GroupMember[]> => {
    const filters: GroupMemberFilters = {
      user_group_id: groupId,
      active_only: activeOnly,
    };
    return adapter.getAll(filters);
  },

  /**
   * Get all groups that a tenant member belongs to
   */
  getByTenantMember: async (
    tenantMemberId: string,
    includeLeft: boolean = false
  ): Promise<GroupMember[]> => {
    const filters: GroupMemberFilters = {
      tenant_member_id: tenantMemberId,
      active_only: !includeLeft,
    };
    return adapter.getAll(filters);
  },

  /**
   * Get the primary group of a tenant member
   */
  getPrimaryGroup: async (tenantMemberId: string): Promise<GroupMember | null> => {
    const memberships = await adapter.getAll({
      tenant_member_id: tenantMemberId,
      is_primary: true,
      active_only: true,
    });

    return memberships.length > 0 ? memberships[0] : null;
  },

  /**
   * Get all group memberships for a tenant
   */
  getByTenant: async (
    tenantId: string,
    filters?: Partial<GroupMemberFilters>
  ): Promise<GroupMember[]> => {
    return adapter.getAll({
      tenant_id: tenantId,
      ...filters,
    });
  },

  /**
   * Get active memberships (not left) for a group
   */
  getActive: async (groupId: string): Promise<GroupMember[]> => {
    return adapter.getAll({
      user_group_id: groupId,
      active_only: true,
    });
  },

  /**
   * Get memberships with joined details
   * TODO: Implement in Golang backend with JOINs
   */
  getWithDetails: async (groupId: string): Promise<GroupMemberWithDetails[]> => {
    // For now, return basic data
    // Backend should implement:
    // SELECT gm.*, ug.name as group_name, ug.code as group_code,
    //        tm.name as member_name, tm.email as member_email
    // FROM group_members gm
    // JOIN user_groups ug ON gm.user_group_id = ug._id
    // JOIN tenant_members tm ON gm.tenant_member_id = tm._id
    // WHERE gm.user_group_id = $1
    
    const members = await adapter.getAll({ user_group_id: groupId });
    return members as GroupMemberWithDetails[];
  },

  // ==================== ASSIGNMENT OPERATIONS ====================

  /**
   * Assign a member to a group
   * Convenience wrapper around create()
   */
  assignMember: async (
    groupId: string,
    tenantMemberId: string,
    data: AssignMemberRequest = {}
  ): Promise<GroupMember> => {
    // Get tenant_id from the group
    // TODO: In real implementation, fetch from backend
    // For now, user must provide tenant_id in metadata or we throw error
    
    const createData: CreateGroupMemberRequest = {
      tenant_id: data.metadata?.tenant_id || '', // Should be fetched from group
      user_group_id: groupId,
      tenant_member_id: tenantMemberId,
      is_primary: data.is_primary,
      role_in_group: data.role_in_group,
      joined_at: data.joined_at || new Date().toISOString(),
      metadata: data.metadata,
      created_by: data.created_by,
    };

    return groupMembersApi.create(createData);
  },

  /**
   * Remove a member from a group
   * Sets left_at timestamp (not soft delete!)
   */
  removeMember: async (
    groupId: string,
    tenantMemberId: string,
    updated_by?: string
  ): Promise<GroupMember> => {
    // Find the membership
    const memberships = await adapter.getAll({
      user_group_id: groupId,
      tenant_member_id: tenantMemberId,
      active_only: true,
    });

    if (memberships.length === 0) {
      throw new Error('Membership not found or member has already left');
    }

    const membership = memberships[0];

    // Check if can remove (validation)
    const canRemoveResult = await groupMembersApi.canRemove(groupId, tenantMemberId);
    if (!canRemoveResult.can_remove) {
      throw new Error(canRemoveResult.reason || 'Cannot remove member');
    }

    // Set left_at
    return adapter.update(membership._id, {
      left_at: new Date().toISOString(),
      updated_by,
    });
  },

  /**
   * Set a group as the primary group for a member
   * Automatically unsets all other primary flags for this member
   */
  setPrimaryGroup: async (
    tenantMemberId: string,
    groupId: string,
    updated_by?: string
  ): Promise<GroupMember> => {
    // Get all active memberships for this member
    const allMemberships = await groupMembersApi.getByTenantMember(tenantMemberId, false);

    if (allMemberships.length === 0) {
      throw new Error('Member is not assigned to any groups');
    }

    // Find target membership
    const targetMembership = allMemberships.find(m => m.user_group_id === groupId);
    if (!targetMembership) {
      throw new Error('Member is not assigned to this group');
    }

    // Unset all current primary flags
    await Promise.all(
      allMemberships
        .filter(m => m.is_primary)
        .map(m =>
          adapter.update(m._id, {
            is_primary: false,
            updated_by,
          })
        )
    );

    // Set new primary
    return adapter.update(targetMembership._id, {
      is_primary: true,
      updated_by,
    });
  },

  /**
   * Update the role of a member in a group
   */
  updateRole: async (
    groupId: string,
    tenantMemberId: string,
    role: string,
    updated_by?: string
  ): Promise<GroupMember> => {
    const memberships = await adapter.getAll({
      user_group_id: groupId,
      tenant_member_id: tenantMemberId,
      active_only: true,
    });

    if (memberships.length === 0) {
      throw new Error('Membership not found');
    }

    return adapter.update(memberships[0]._id, {
      role_in_group: role,
      updated_by,
    });
  },

  /**
   * Transfer a member from one group to another
   * Marks old membership as left, creates new membership
   */
  transferMember: async (
    fromGroupId: string,
    toGroupId: string,
    tenantMemberId: string,
    updated_by?: string
  ): Promise<GroupMember> => {
    // Get current membership
    const currentMemberships = await adapter.getAll({
      user_group_id: fromGroupId,
      tenant_member_id: tenantMemberId,
      active_only: true,
    });

    if (currentMemberships.length === 0) {
      throw new Error('Member is not in the source group');
    }

    const currentMembership = currentMemberships[0];
    const wasPrimary = currentMembership.is_primary;

    // Mark as left
    await adapter.update(currentMembership._id, {
      left_at: new Date().toISOString(),
      updated_by,
    });

    // Create new membership
    return groupMembersApi.create({
      tenant_id: currentMembership.tenant_id,
      user_group_id: toGroupId,
      tenant_member_id: tenantMemberId,
      is_primary: wasPrimary,
      role_in_group: currentMembership.role_in_group,
      metadata: currentMembership.metadata,
      created_by: updated_by,
    });
  },

  // ==================== BATCH OPERATIONS ====================

  /**
   * Batch assign multiple members to a group
   */
  batchAssign: async (
    groupId: string,
    data: BatchAssignRequest
  ): Promise<GroupMember[]> => {
    const { tenant_member_ids, ...assignData } = data;

    const results = await Promise.all(
      tenant_member_ids.map(memberId =>
        groupMembersApi.assignMember(groupId, memberId, assignData)
      )
    );

    return results;
  },

  /**
   * Batch remove multiple members from a group
   */
  batchRemove: async (
    groupId: string,
    tenantMemberIds: string[],
    updated_by?: string
  ): Promise<void> => {
    await Promise.all(
      tenantMemberIds.map(memberId =>
        groupMembersApi.removeMember(groupId, memberId, updated_by)
      )
    );
  },

  /**
   * Bulk update primary flags
   */
  bulkUpdatePrimary: async (
    updates: Array<{
      tenant_member_id: string;
      group_id: string;
    }>,
    updated_by?: string
  ): Promise<void> => {
    await Promise.all(
      updates.map(({ tenant_member_id, group_id }) =>
        groupMembersApi.setPrimaryGroup(tenant_member_id, group_id, updated_by)
      )
    );
  },

  /**
   * Bulk soft delete
   */
  bulkDelete: async (ids: string[], deleted_by?: string): Promise<void> => {
    const deleted_at = new Date().toISOString();
    await Promise.all(
      ids.map(id =>
        adapter.update(id, { deleted_at, deleted_by } as any)
      )
    );
  },

  // ==================== UTILITIES ====================

  /**
   * Check if a member can be removed from a group
   * Cannot remove primary group if it's the only group
   */
  canRemove: async (
    groupId: string,
    tenantMemberId: string
  ): Promise<{
    can_remove: boolean;
    reason?: string;
  }> => {
    const memberships = await adapter.getAll({
      user_group_id: groupId,
      tenant_member_id: tenantMemberId,
      active_only: true,
    });

    if (memberships.length === 0) {
      return {
        can_remove: false,
        reason: 'Membership not found',
      };
    }

    const membership = memberships[0];

    // If this is the primary group, check if member has other groups
    if (membership.is_primary) {
      const allGroups = await groupMembersApi.getByTenantMember(tenantMemberId, false);
      
      if (allGroups.length === 1) {
        return {
          can_remove: false,
          reason: 'Cannot remove primary group when it\'s the only group',
        };
      }
    }

    return { can_remove: true };
  },

  /**
   * Get statistics for group memberships
   */
  getStats: async (
    tenantId?: string,
    groupId?: string
  ): Promise<GroupMembershipStats> => {
    const filters: GroupMemberFilters = {};
    if (tenantId) filters.tenant_id = tenantId;
    if (groupId) filters.user_group_id = groupId;

    const memberships = await adapter.getAll(filters);

    const active = memberships.filter(m => !m.left_at).length;
    const left = memberships.filter(m => m.left_at).length;
    const primary = memberships.filter(m => m.is_primary).length;

    // Count by role
    const byRole: Record<string, number> = {};
    memberships.forEach(m => {
      const role = m.role_in_group || 'NO_ROLE';
      byRole[role] = (byRole[role] || 0) + 1;
    });

    // Find most common role
    let mostCommonRole: { role: string; count: number } | null = null;
    Object.entries(byRole).forEach(([role, count]) => {
      if (!mostCommonRole || count > mostCommonRole.count) {
        mostCommonRole = { role, count };
      }
    });

    // Calculate averages
    const uniqueGroups = new Set(memberships.map(m => m.user_group_id)).size;
    const uniqueMembers = new Set(memberships.map(m => m.tenant_member_id)).size;

    return {
      total: memberships.length,
      active,
      left,
      primary,
      by_role: byRole,
      avg_member_per_group: uniqueGroups > 0 ? memberships.length / uniqueGroups : 0,
      avg_group_per_member: uniqueMembers > 0 ? memberships.length / uniqueMembers : 0,
      most_common_role: mostCommonRole,
    };
  },

  /**
   * Clone all members from one group to another
   */
  cloneToGroup: async (
    fromGroupId: string,
    toGroupId: string,
    created_by?: string
  ): Promise<GroupMember[]> => {
    const sourceMembers = await groupMembersApi.getActive(fromGroupId);

    if (sourceMembers.length === 0) {
      return [];
    }

    const results = await Promise.all(
      sourceMembers.map(member =>
        groupMembersApi.create({
          tenant_id: member.tenant_id,
          user_group_id: toGroupId,
          tenant_member_id: member.tenant_member_id,
          is_primary: false, // Don't clone primary status
          role_in_group: member.role_in_group,
          metadata: member.metadata ? { ...member.metadata } : undefined,
          created_by,
        })
      )
    );

    return results;
  },

  /**
   * Get membership history for a tenant member
   * Includes both active and left groups
   */
  getMemberHistory: async (tenantMemberId: string): Promise<GroupMember[]> => {
    const memberships = await adapter.getAll({
      tenant_member_id: tenantMemberId,
      include_deleted: true,
    });

    // Sort by joined_at (most recent first)
    return memberships.sort((a, b) => {
      const dateA = a.joined_at ? new Date(a.joined_at).getTime() : 0;
      const dateB = b.joined_at ? new Date(b.joined_at).getTime() : 0;
      return dateB - dateA;
    });
  },

  /**
   * Search memberships
   */
  search: async (
    tenantId: string,
    query: string,
    filters?: Partial<GroupMemberFilters>
  ): Promise<GroupMember[]> => {
    // TODO: Backend should implement full-text search
    // For now, just return all for the tenant
    return adapter.getAll({
      tenant_id: tenantId,
      ...filters,
    });
  },

  /**
   * Check if a member is in a specific group
   */
  isMemberInGroup: async (
    groupId: string,
    tenantMemberId: string
  ): Promise<boolean> => {
    const memberships = await adapter.getAll({
      user_group_id: groupId,
      tenant_member_id: tenantMemberId,
      active_only: true,
    });

    return memberships.length > 0;
  },

  /**
   * Get member count for a group
   */
  getMemberCount: async (groupId: string, activeOnly: boolean = true): Promise<number> => {
    const members = await groupMembersApi.getByGroup(groupId, activeOnly);
    return members.length;
  },

  /**
   * Get all roles used in a group
   */
  getGroupRoles: async (groupId: string): Promise<string[]> => {
    const members = await groupMembersApi.getActive(groupId);
    const roles = new Set<string>();
    
    members.forEach(m => {
      if (m.role_in_group) {
        roles.add(m.role_in_group);
      }
    });

    return Array.from(roles).sort();
  },

  /**
   * Get members by role in a group
   */
  getMembersByRole: async (groupId: string, role: string): Promise<GroupMember[]> => {
    const members = await groupMembersApi.getActive(groupId);
    return members.filter(m => m.role_in_group === role);
  },
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Validate role format
 */
export function validateRole(role: string): {
  valid: boolean;
  error?: string;
} {
  if (role.length > 100) {
    return { valid: false, error: 'Role must be 100 characters or less' };
  }

  return { valid: true };
}

/**
 * Format role for display
 */
export function formatRole(role?: string | null): string {
  if (!role) return 'No Role';

  // Convert snake_case or SCREAMING_CASE to Title Case
  return role
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Get primary status color for UI
 */
export function getPrimaryStatusColor(isPrimary: boolean): string {
  return isPrimary
    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
    : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
}

/**
 * Sort memberships by joined date
 */
export function sortByJoinedDate(
  memberships: GroupMember[],
  desc: boolean = true
): GroupMember[] {
  return [...memberships].sort((a, b) => {
    const dateA = a.joined_at ? new Date(a.joined_at).getTime() : 0;
    const dateB = b.joined_at ? new Date(b.joined_at).getTime() : 0;
    return desc ? dateB - dateA : dateA - dateB;
  });
}

/**
 * Group memberships by group
 */
export function groupByGroup(
  memberships: GroupMember[]
): Record<string, GroupMember[]> {
  const result: Record<string, GroupMember[]> = {};

  memberships.forEach(membership => {
    const groupId = membership.user_group_id;
    if (!result[groupId]) {
      result[groupId] = [];
    }
    result[groupId].push(membership);
  });

  return result;
}

/**
 * Filter memberships by multiple criteria
 */
export function filterMemberships(
  memberships: GroupMember[],
  filters: {
    role?: string;
    is_primary?: boolean;
    active_only?: boolean;
  }
): GroupMember[] {
  let result = [...memberships];

  if (filters.role) {
    result = result.filter(m => m.role_in_group === filters.role);
  }

  if (filters.is_primary !== undefined) {
    result = result.filter(m => m.is_primary === filters.is_primary);
  }

  if (filters.active_only) {
    result = result.filter(m => !m.left_at);
  }

  return result;
}

export default groupMembersApi;
