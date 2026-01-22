/**
 * User Groups API Client
 * Uses Adapter pattern - Ready for Golang migration
 * 
 * ✅ ENHANCED 2026-01-16: 100% database alignment + Type helpers
 * Database: user_groups (16 fields, soft delete, versioning, ordering)
 */

import { createAdapter, BaseFilters } from './adapters';
import { GroupMember } from '../types';

// ==================== TYPE HELPERS ====================

export const UserGroupStatusHelper = {
  ACTIVE: 'ACTIVE' as UserGroupStatus,
  INACTIVE: 'INACTIVE' as UserGroupStatus,
  ARCHIVED: 'ARCHIVED' as UserGroupStatus,

  isActive: (status: UserGroupStatus) => status === 'ACTIVE',
  isInactive: (status: UserGroupStatus) => status === 'INACTIVE',
  isArchived: (status: UserGroupStatus) => status === 'ARCHIVED',
  isUsable: (status: UserGroupStatus) => status === 'ACTIVE',
  isNotUsable: (status: UserGroupStatus) => status === 'INACTIVE' || status === 'ARCHIVED',
  canBeActivated: (status: UserGroupStatus) => status === 'INACTIVE' || status === 'ARCHIVED',
  canBeArchived: (status: UserGroupStatus) => status === 'ACTIVE' || status === 'INACTIVE',
};

// ==================== TYPES ====================

/**
 * User Group Status - 3 statuses
 */
export type UserGroupStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

/**
 * UserGroup - 100% matches user_groups table (16 fields)
 */
export interface UserGroup {
  // Identity & Relationships (2)
  _id: string;
  tenant_id: string;
  
  // Group Information (4)
  code: string;                      // varchar(50) not null, unique per tenant
  name: string;                      // varchar(255) not null
  description?: string;              // text nullable
  group_type?: string;               // varchar(50) nullable - flexible type!
  
  // Status & Configuration (3)
  status: UserGroupStatus;           // varchar(20) not null default 'ACTIVE'
  order?: number;                    // integer default 0, for sorting
  metadata?: Record<string, any>;    // jsonb default '{}'
  
  // Audit Fields (4)
  created_at: string;                // timestamptz not null
  updated_at: string;                // timestamptz not null
  created_by?: string;               // uuid nullable
  updated_by?: string;               // uuid nullable
  
  // Soft Delete (2)
  deleted_at?: string;               // timestamptz nullable - SOFT DELETE!
  deleted_by?: string;               // uuid nullable
  
  // Versioning (1)
  version: number;                   // bigint not null default 1
}

/**
 * Create User Group Request
 */
export interface CreateUserGroupRequest {
  tenant_id: string;
  code: string;
  name: string;
  description?: string;
  group_type?: string;               // Flexible - no enum constraint in DB
  status?: UserGroupStatus;          // Default 'ACTIVE' in database
  order?: number;                    // Default 0 in database
  metadata?: Record<string, any>;    // Default '{}' in database
  created_by?: string;
}

/**
 * Update User Group Request
 * ✅ IMPROVEMENT: Added version for optimistic locking
 */
export interface UpdateUserGroupRequest {
  code?: string;
  name?: string;
  description?: string;
  group_type?: string;
  status?: UserGroupStatus;
  order?: number;
  metadata?: Record<string, any>;
  updated_by?: string;
  version?: number; // ✅ Optional for now, but recommended for optimistic locking
}

/**
 * User Group Filters
 */
export interface UserGroupFilters extends BaseFilters {
  tenant_id?: string;
  status?: UserGroupStatus;
  group_type?: string;               // Filter by type
  search?: string;                   // Search by name or code
  include_deleted?: boolean;         // Include soft-deleted groups
}

/**
 * User Group with computed fields (for display)
 */
export interface UserGroupWithMembers extends UserGroup {
  member_count?: number;             // Number of members in this group
  role_count?: number;               // Number of roles assigned to this group
  permission_count?: number;         // Number of permissions
  is_system?: boolean;               // Is this a system group?
}

/**
 * User Group Statistics
 */
export interface UserGroupStats {
  total: number;
  by_status: {
    ACTIVE: number;
    INACTIVE: number;
    ARCHIVED: number;
  };
  by_type: Record<string, number>;   // Dynamic - based on actual types in DB
  total_members: number;
  avg_members_per_group: number;
  groups_with_no_members: number;
  largest_group: {
    _id: string;
    name: string;
    member_count: number;
  } | null;
  most_common_type: {
    type: string;
    count: number;
  } | null;
}

/**
 * Add members to group request
 */
export interface AddMembersRequest {
  tenant_member_ids: string[];
  role?: string;
  added_by?: string;
}

// ==================== ADAPTER ====================

const adapter = createAdapter<UserGroup, CreateUserGroupRequest, UpdateUserGroupRequest>(
  'user_groups',
  '/user-groups',
  true  // Enable soft delete filtering
);

// ==================== API CLIENT ====================

export const userGroupsApi = {
  /**
   * GET /user-groups
   */
  getAll: async (filters?: UserGroupFilters): Promise<UserGroup[]> => {
    return adapter.getAll(filters);
  },

  /**
   * GET /user-groups/:id
   */
  getById: async (id: string): Promise<UserGroup> => {
    return adapter.getById(id);
  },

  /**
   * POST /user-groups
   */
  create: async (data: CreateUserGroupRequest): Promise<UserGroup> => {
    // Validate code format
    if (!data.code || data.code.trim().length === 0) {
      throw new Error('User group code is required');
    }
    
    // Validate name
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('User group name is required');
    }

    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    const _id = crypto.randomUUID();

    const requestData = {
      _id,
      tenant_id: data.tenant_id,
      code: data.code,
      name: data.name,
      description: data.description || null,
      group_type: data.group_type || null,
      status: data.status || 'ACTIVE',
      order: data.order || 0,
      metadata: data.metadata || {},
      created_by: data.created_by || null,
      version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    const { data: created, error } = await supabase
      .from('user_groups')
      .insert([requestData])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create user group: ${error.message}`);
    }

    return created;
  },

  /**
   * PATCH /user-groups/:id
   */
  update: async (id: string, data: UpdateUserGroupRequest): Promise<UserGroup> => {
    // Validate code if provided
    if (data.code !== undefined && data.code.trim().length === 0) {
      throw new Error('User group code cannot be empty');
    }
    
    // Validate name if provided
    if (data.name !== undefined && data.name.trim().length === 0) {
      throw new Error('User group name cannot be empty');
    }

    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    // Get current version if not provided
    let currentVersion = data.version;

    if (!currentVersion) {
        const { data: current, error: fetchError } = await supabase
            .from('user_groups')
            .select('version')
            .eq('_id', id)
            .single();
            
        if (fetchError || !current) {
            throw new Error(`User group not found: ${fetchError?.message || 'Unknown error'}`);
        }
        currentVersion = current.version;
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
      version: currentVersion + 1,
    };

    if (data.code !== undefined) updateData.code = data.code;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.group_type !== undefined) updateData.group_type = data.group_type;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.order !== undefined) updateData.order = data.order;
    if (data.metadata !== undefined) updateData.metadata = data.metadata;
    if (data.updated_by !== undefined) updateData.updated_by = data.updated_by;

    const { data: updated, error } = await supabase
      .from('user_groups')
      .update(updateData)
      .eq('_id', id)
      .eq('version', currentVersion)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update user group: ${error.message}`);
    }

    if (!updated) {
      throw new Error('Concurrent modification detected. Please refresh and try again.');
    }

    return updated;
  },

  /**
   * DELETE /user-groups/:id (SOFT DELETE)
   * Sets deleted_at to current timestamp
   */
  delete: async (id: string, deleted_by?: string, version?: number): Promise<void> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    // Get current version if not provided
    let currentVersion = version;
    if (!currentVersion) {
        const { data: current, error: fetchError } = await supabase
            .from('user_groups')
            .select('version')
            .eq('_id', id)
            .single();
        
        if (fetchError || !current) {
             if (fetchError) throw new Error(fetchError.message);
             return;
        }
        currentVersion = current.version;
    }

    const { error, data } = await supabase
      .from('user_groups')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: deleted_by || null,
        version: currentVersion + 1
      })
      .eq('_id', id)
      .eq('version', currentVersion)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to delete user group: ${error.message}`);
    }
    
    if (!data) {
        throw new Error('Concurrent modification detected. Please refresh and try again.');
    }
  },

  /**
   * Hard delete (permanently remove from database)
   * Use with caution!
   */
  hardDelete: async (id: string): Promise<void> => {
    return adapter.delete(id);
  },

  /**
   * Restore soft-deleted group
   */
  restore: async (id: string, version?: number): Promise<UserGroup> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    let currentVersion = version;
    if (!currentVersion) {
        const { data: current, error } = await supabase
            .from('user_groups')
            .select('version')
            .eq('_id', id)
            .single();
        if (error || !current) throw new Error(`User group not found: ${error?.message}`);
        currentVersion = current.version;
    }
    
    const { data: updated, error } = await supabase
      .from('user_groups')
      .update({
        deleted_at: null,
        deleted_by: null,
        updated_at: new Date().toISOString(),
        version: currentVersion + 1
      })
      .eq('_id', id)
      .eq('version', currentVersion)
      .select()
      .single();

    if (error) throw new Error(`Failed to restore user group: ${error.message}`);
    if (!updated) throw new Error('Concurrent modification detected.');
    
    return updated;
  },

  /**
   * Get groups by tenant
   */
  getByTenant: async (tenantId: string, includeDeleted: boolean = false): Promise<UserGroup[]> => {
    return adapter.getAll({ 
      tenant_id: tenantId,
      include_deleted: includeDeleted,
    });
  },

  /**
   * Get groups by type
   */
  getByType: async (tenantId: string, groupType: string): Promise<UserGroup[]> => {
    return adapter.getAll({
      tenant_id: tenantId,
      group_type: groupType,
    });
  },

  /**
   * Get groups by status
   */
  getByStatus: async (tenantId: string, status: UserGroupStatus): Promise<UserGroup[]> => {
    return adapter.getAll({
      tenant_id: tenantId,
      status,
    });
  },

  /**
   * Update group status
   */
  updateStatus: async (id: string, status: UserGroupStatus, updated_by?: string, version?: number): Promise<UserGroup> => {
    // If version is not provided, fetch it first to ensure safe update
    let currentVersion = version;
    if (!currentVersion) {
        const group = await userGroupsApi.getById(id);
        currentVersion = group.version;
    }

    return userGroupsApi.update(id, {
      status,
      updated_by,
      version: currentVersion,
    });
  },

  /**
   * Archive group (set status to ARCHIVED)
   */
  archive: async (id: string, updated_by?: string, version?: number): Promise<UserGroup> => {
    let currentVersion = version;
    if (!currentVersion) {
        const group = await userGroupsApi.getById(id);
        currentVersion = group.version;
    }

    return userGroupsApi.update(id, {
      status: 'ARCHIVED',
      updated_by,
      version: currentVersion,
    });
  },

  /**
   * Activate group (set status to ACTIVE)
   */
  activate: async (id: string, updated_by?: string, version?: number): Promise<UserGroup> => {
    let currentVersion = version;
    if (!currentVersion) {
        const group = await userGroupsApi.getById(id);
        currentVersion = group.version;
    }

    return userGroupsApi.update(id, {
      status: 'ACTIVE',
      updated_by,
      version: currentVersion,
    });
  },

  /**
   * Update group order
   */
  updateOrder: async (id: string, order: number, version?: number): Promise<UserGroup> => {
    let currentVersion = version;
    if (!currentVersion) {
        const group = await userGroupsApi.getById(id);
        currentVersion = group.version;
    }

    return userGroupsApi.update(id, { order, version: currentVersion });
  },

  /**
   * Get group statistics
   */
  getStats: async (tenantId: string): Promise<UserGroupStats> => {
    const groups = await adapter.getAll({ tenant_id: tenantId });
    
    const byStatus = {
      ACTIVE: groups.filter(g => g.status === 'ACTIVE').length,
      INACTIVE: groups.filter(g => g.status === 'INACTIVE').length,
      ARCHIVED: groups.filter(g => g.status === 'ARCHIVED').length,
    };
    
    // Count by type (dynamic based on actual data)
    const byType: Record<string, number> = {};
    groups.forEach(g => {
      const type = g.group_type || 'UNKNOWN';
      byType[type] = (byType[type] || 0) + 1;
    });
    
    // Find most common type
    let mostCommonType: { type: string; count: number } | null = null;
    Object.entries(byType).forEach(([type, count]) => {
      if (!mostCommonType || count > mostCommonType.count) {
        mostCommonType = { type, count };
      }
    });
    
    // TODO: Get member counts from Golang backend
    const totalMembers = 0;
    const avgMembers = 0;
    const groupsWithNoMembers = 0;
    
    return {
      total: groups.length,
      by_status: byStatus,
      by_type: byType,
      total_members: totalMembers,
      avg_members_per_group: avgMembers,
      groups_with_no_members: groupsWithNoMembers,
      largest_group: null,
      most_common_type: mostCommonType,
    };
  },

  /**
   * Search groups
   */
  search: async (tenantId: string, query: string): Promise<UserGroup[]> => {
    return adapter.getAll({
      tenant_id: tenantId,
      search: query,
    });
  },

  /**
   * Check if group can be deleted
   */
  canDelete: async (id: string): Promise<{
    can_delete: boolean;
    reason?: string;
    member_count?: number;
  }> => {
    // TODO: Check if has members in Golang backend
    // SELECT COUNT(*) FROM user_group_members WHERE user_group_id = $1
    
    return {
      can_delete: true,
    };
  },

  /**
   * Clone group (create copy with new code)
   */
  clone: async (id: string, newCode: string, newName?: string): Promise<UserGroup> => {
    const original = await adapter.getById(id);
    
    return userGroupsApi.create({
      tenant_id: original.tenant_id,
      code: newCode,
      name: newName || `${original.name} (Copy)`,
      description: original.description,
      group_type: original.group_type,
      status: original.status,
      order: original.order,
      metadata: original.metadata ? { ...original.metadata } : undefined,
      // Don't copy audit fields
    });
  },

  /**
   * Bulk update status
   */
  bulkUpdateStatus: async (ids: string[], status: UserGroupStatus, updated_by?: string): Promise<void> => {
    // Use promise all to update individually with version checks implicitly handled by updateStatus logic
    await Promise.all(
      ids.map(async id => {
        try {
            await userGroupsApi.updateStatus(id, status, updated_by);
        } catch (e) {
            console.error(`Failed to update status for group ${id}`, e);
        }
      })
    );
  },

  /**
   * Bulk delete (soft delete)
   */
  bulkDelete: async (ids: string[], deleted_by?: string): Promise<void> => {
    await Promise.all(
      ids.map(async id => {
        try {
            await userGroupsApi.delete(id, deleted_by);
        } catch (e) {
            console.error(`Failed to delete group ${id}`, e);
        }
      })
    );
  },

  /**
   * Get groups with member counts
   */
  getWithMemberCounts: async (tenantId: string): Promise<UserGroupWithMembers[]> => {
    // TODO: Implement in Golang backend with JOIN
    // SELECT ug.*, COUNT(ugm.tenant_member_id) as member_count
    // FROM user_groups ug
    // LEFT JOIN user_group_members ugm ON ug._id = ugm.user_group_id
    // WHERE ug.tenant_id = $1 AND ug.deleted_at IS NULL
    // GROUP BY ug._id
    
    const groups = await adapter.getAll({ tenant_id: tenantId });
    return groups.map(g => ({
      ...g,
      member_count: 0, // Placeholder
    }));
  },

  /**
   * Get all unique group types in a tenant
   */
  getTypes: async (tenantId: string): Promise<string[]> => {
    const groups = await adapter.getAll({ tenant_id: tenantId });
    const types = new Set<string>();
    
    groups.forEach(g => {
      if (g.group_type) {
        types.add(g.group_type);
      }
    });
    
    return Array.from(types).sort();
  },

  /**
   * Get groups ordered by order field
   */
  getOrdered: async (tenantId: string): Promise<UserGroup[]> => {
    const groups = await adapter.getAll({ tenant_id: tenantId });
    return groups.sort((a, b) => (a.order || 0) - (b.order || 0));
  },

  // ==================== MEMBER MANAGEMENT ====================

  /**
   * Get members of a group
   */
  getMembers: async (groupId: string): Promise<GroupMember[]> => {
    // TODO: Implement in Golang backend
    // SELECT * FROM user_group_members WHERE user_group_id = $1
    throw new Error('Get members endpoint not implemented - migrate to Golang');
  },

  /**
   * Add members to group
   */
  addMembers: async (groupId: string, data: AddMembersRequest): Promise<void> => {
    // TODO: Implement in Golang backend
    // INSERT INTO user_group_members (user_group_id, tenant_member_id, ...)
    throw new Error('Add members endpoint not implemented - migrate to Golang');
  },

  /**
   * Remove member from group
   */
  removeMember: async (groupId: string, memberId: string): Promise<void> => {
    // TODO: Implement in Golang backend
    // DELETE FROM user_group_members 
    // WHERE user_group_id = $1 AND tenant_member_id = $2
    throw new Error('Remove member endpoint not implemented - migrate to Golang');
  },

  /**
   * Update member role in group
   */
  updateMemberRole: async (groupId: string, memberId: string, role: string): Promise<void> => {
    // TODO: Implement in Golang backend
    // UPDATE user_group_members SET role = $3
    // WHERE user_group_id = $1 AND tenant_member_id = $2
    throw new Error('Update member role endpoint not implemented - migrate to Golang');
  },

  /**
   * Get groups that a member belongs to
   */
  getMemberGroups: async (memberId: string): Promise<UserGroup[]> => {
    // TODO: Implement in Golang backend
    // SELECT ug.* FROM user_groups ug
    // JOIN user_group_members ugm ON ug._id = ugm.user_group_id
    // WHERE ugm.tenant_member_id = $1 AND ug.deleted_at IS NULL
    throw new Error('Get member groups endpoint not implemented - migrate to Golang');
  },

  /**
   * Check if member is in group
   */
  isMemberInGroup: async (groupId: string, memberId: string): Promise<boolean> => {
    // TODO: Implement in Golang backend
    // SELECT EXISTS(SELECT 1 FROM user_group_members 
    // WHERE user_group_id = $1 AND tenant_member_id = $2)
    throw new Error('Check membership endpoint not implemented - migrate to Golang');
  },

  /**
   * Get member count for a group
   */
  getMemberCount: async (groupId: string): Promise<number> => {
    // TODO: Implement in Golang backend
    // SELECT COUNT(*) FROM user_group_members WHERE user_group_id = $1
    throw new Error('Get member count endpoint not implemented - migrate to Golang');
  },

  /**
   * Bulk add members to multiple groups
   */
  bulkAddMembers: async (memberIds: string[], groupIds: string[]): Promise<void> => {
    // TODO: Implement in Golang backend
    // INSERT INTO user_group_members (user_group_id, tenant_member_id, ...)
    // VALUES ($1, $2), ($1, $3), ($2, $2), ...
    throw new Error('Bulk add members endpoint not implemented - migrate to Golang');
  },

  /**
   * Bulk remove members from multiple groups
   */
  bulkRemoveMembers: async (memberIds: string[], groupIds: string[]): Promise<void> => {
    // TODO: Implement in Golang backend
    // DELETE FROM user_group_members 
    // WHERE user_group_id IN (...) AND tenant_member_id IN (...)
    throw new Error('Bulk remove members endpoint not implemented - migrate to Golang');
  },
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Validate group code format
 */
export function validateGroupCode(code: string): {
  valid: boolean;
  error?: string;
} {
  if (!code || code.trim().length === 0) {
    return { valid: false, error: 'Code is required' };
  }
  
  if (code.length > 50) {
    return { valid: false, error: 'Code must be 50 characters or less' };
  }
  
  // Optional: Add regex validation for code format
  // e.g., only alphanumeric and hyphens/underscores
  const codeRegex = /^[a-zA-Z0-9_-]+$/;
  if (!codeRegex.test(code)) {
    return { valid: false, error: 'Code can only contain letters, numbers, hyphens, and underscores' };
  }
  
  return { valid: true };
}

/**
 * Validate group name
 */
export function validateGroupName(name: string): {
  valid: boolean;
  error?: string;
} {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Name is required' };
  }
  
  if (name.length > 255) {
    return { valid: false, error: 'Name must be 255 characters or less' };
  }
  
  return { valid: true };
}

/**
 * Format group type for display
 */
export function formatGroupType(type?: string): string {
  if (!type) return 'Unknown';
  
  // Convert snake_case or SCREAMING_CASE to Title Case
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Get status color for UI
 */
export function getStatusColor(status: UserGroupStatus): string {
  const colors = {
    ACTIVE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    INACTIVE: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
    ARCHIVED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };
  return colors[status] || colors.INACTIVE;
}

/**
 * Get default metadata structure
 */
export function getDefaultMetadata(): Record<string, any> {
  return {
    created_from: 'web',
    settings: {},
    custom_fields: {},
  };
}

/**
 * Sort groups by order field
 */
export function sortByOrder(groups: UserGroup[]): UserGroup[] {
  return [...groups].sort((a, b) => (a.order || 0) - (b.order || 0));
}

/**
 * Group groups by type
 */
export function groupByType(groups: UserGroup[]): Record<string, UserGroup[]> {
  const result: Record<string, UserGroup[]> = {};
  
  groups.forEach(group => {
    const type = group.group_type || 'UNKNOWN';
    if (!result[type]) {
      result[type] = [];
    }
    result[type].push(group);
  });
  
  return result;
}

/**
 * Filter groups by multiple criteria
 */
export function filterGroups(
  groups: UserGroup[],
  filters: {
    search?: string;
    status?: UserGroupStatus;
    type?: string;
  }
): UserGroup[] {
  let result = [...groups];
  
  if (filters.search) {
    const query = filters.search.toLowerCase();
    result = result.filter(
      g =>
        g.name.toLowerCase().includes(query) ||
        g.code.toLowerCase().includes(query) ||
        g.description?.toLowerCase().includes(query)
    );
  }
  
  if (filters.status) {
    result = result.filter(g => g.status === filters.status);
  }
  
  if (filters.type) {
    result = result.filter(g => g.group_type === filters.type);
  }
  
  return result;
}

export default userGroupsApi;