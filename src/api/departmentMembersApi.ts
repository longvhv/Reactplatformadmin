/**
 * Department Members API Client
 * Uses Adapter pattern - Ready for Golang migration
 * 
 * ✅ CREATED 2026-01-15: 100% matches department_members schema (16 fields)
 * ⚠️ SOFT DELETE: Has deleted_at, deleted_by fields
 */

import { createAdapter, BaseFilters } from './adapters';

// ==================== TYPES ====================

/**
 * Department Member - 100% matches department_members table (16 fields)
 */
export interface DepartmentMember {
  // Identity & Relationships (4)
  _id: string;
  tenant_id: string;
  department_id: string;
  tenant_member_id: string;
  
  // Member Information (4)
  is_primary: boolean;                   // boolean not null default false
  role_in_department?: string | null;    // varchar(100) nullable
  joined_at?: string | null;             // timestamptz nullable
  left_at?: string | null;               // timestamptz nullable
  
  // Metadata (1)
  metadata?: Record<string, any>;        // jsonb default '{}'
  
  // Audit Fields (4)
  created_at: string;                    // timestamptz not null
  updated_at: string;                    // timestamptz not null
  created_by?: string | null;            // uuid nullable
  updated_by?: string | null;            // uuid nullable
  
  // Soft Delete (2)
  deleted_at?: string | null;            // timestamptz nullable - SOFT DELETE!
  deleted_by?: string | null;            // uuid nullable
  
  // Versioning (1)
  version: number;                       // bigint not null default 1
}

/**
 * Create Department Member Request
 */
export interface CreateDepartmentMemberRequest {
  tenant_id: string;
  department_id: string;
  tenant_member_id: string;
  is_primary?: boolean;                  // Default false in database
  role_in_department?: string;
  joined_at?: string;
  metadata?: Record<string, any>;        // Default '{}' in database
  created_by?: string;
}

/**
 * Update Department Member Request
 */
export interface UpdateDepartmentMemberRequest {
  is_primary?: boolean;
  role_in_department?: string;
  joined_at?: string;
  left_at?: string;
  metadata?: Record<string, any>;
  updated_by?: string;
}

/**
 * Department Member Filters
 */
export interface DepartmentMemberFilters extends BaseFilters {
  tenant_id?: string;
  department_id?: string;
  tenant_member_id?: string;
  is_primary?: boolean;                  // Filter only primary departments
  include_deleted?: boolean;             // Include soft-deleted members
  active_only?: boolean;                 // Only active (no left_at date)
}

/**
 * Department Member with joined data
 */
export interface DepartmentMemberWithDetails extends DepartmentMember {
  department?: {
    _id: string;
    code: string;
    name: string;
    status: string;
  };
  tenant_member?: {
    _id: string;
    employee_code?: string;
    user_id?: string;
    status: string;
  };
}

/**
 * Department Member Statistics
 */
export interface DepartmentMemberStats {
  total: number;
  by_department: {
    department_id: string;
    department_name: string;
    member_count: number;
  }[];
  active_members: number;                // No left_at
  inactive_members: number;              // Has left_at
  primary_assignments: number;           // is_primary = true
  secondary_assignments: number;         // is_primary = false
  members_in_multiple_depts: number;     // Members in 2+ departments
  avg_members_per_dept: number;
  most_common_role?: string;
}

/**
 * Batch Assignment Request
 */
export interface BatchAssignRequest {
  department_id: string;
  tenant_member_ids: string[];
  is_primary?: boolean;
  role_in_department?: string;
  joined_at?: string;
  created_by?: string;
}

/**
 * Transfer Member Request
 */
export interface TransferMemberRequest {
  from_department_id: string;
  to_department_id: string;
  tenant_member_id: string;
  role_in_department?: string;
  updated_by?: string;
}

// ==================== ADAPTER ====================

const adapter = createAdapter<DepartmentMember, CreateDepartmentMemberRequest, UpdateDepartmentMemberRequest>(
  'department_members',
  '/department-members'
);

// ==================== API CLIENT ====================

export const departmentMembersApi = {
  /**
   * GET /department-members
   */
  getAll: async (filters?: DepartmentMemberFilters): Promise<DepartmentMember[]> => {
    return adapter.getAll(filters);
  },

  /**
   * GET /department-members/:id
   */
  getById: async (id: string): Promise<DepartmentMember> => {
    return adapter.getById(id);
  },

  /**
   * POST /department-members
   */
  create: async (data: CreateDepartmentMemberRequest): Promise<DepartmentMember> => {
    // Validate required fields
    if (!data.tenant_id || !data.department_id || !data.tenant_member_id) {
      throw new Error('tenant_id, department_id, and tenant_member_id are required');
    }
    
    return adapter.create(data);
  },

  /**
   * PATCH /department-members/:id
   */
  update: async (id: string, data: UpdateDepartmentMemberRequest): Promise<DepartmentMember> => {
    return adapter.update(id, data);
  },

  /**
   * DELETE /department-members/:id (SOFT DELETE)
   * Sets deleted_at to current timestamp
   */
  delete: async (id: string, deleted_by?: string): Promise<void> => {
    // Soft delete: set deleted_at
    await adapter.update(id, {
      deleted_at: new Date().toISOString(),
      deleted_by,
    } as any);
  },

  /**
   * Hard delete (permanently remove from database)
   * Use with caution!
   */
  hardDelete: async (id: string): Promise<void> => {
    return adapter.delete(id);
  },

  /**
   * Restore soft-deleted department member
   */
  restore: async (id: string): Promise<DepartmentMember> => {
    return adapter.update(id, {
      deleted_at: undefined,
      deleted_by: undefined,
    } as any);
  },

  /**
   * Get department members by tenant
   */
  getByTenant: async (tenantId: string, includeDeleted: boolean = false): Promise<DepartmentMember[]> => {
    return adapter.getAll({ 
      tenant_id: tenantId,
      include_deleted: includeDeleted,
    });
  },

  /**
   * Get members of a specific department
   */
  getByDepartment: async (departmentId: string, activeOnly: boolean = false): Promise<DepartmentMember[]> => {
    return adapter.getAll({
      department_id: departmentId,
      active_only: activeOnly,
    });
  },

  /**
   * Get departments of a specific tenant member
   */
  getByTenantMember: async (tenantMemberId: string, activeOnly: boolean = false): Promise<DepartmentMember[]> => {
    return adapter.getAll({
      tenant_member_id: tenantMemberId,
      active_only: activeOnly,
    });
  },

  /**
   * Get primary department of a tenant member
   */
  getPrimaryDepartment: async (tenantMemberId: string): Promise<DepartmentMember | null> => {
    const members = await adapter.getAll({
      tenant_member_id: tenantMemberId,
      is_primary: true,
    });
    
    return members.length > 0 ? members[0] : null;
  },

  /**
   * Set primary department for a tenant member
   * Automatically unsets other primary departments
   */
  setPrimaryDepartment: async (
    tenantMemberId: string,
    departmentId: string,
    updated_by?: string
  ): Promise<DepartmentMember> => {
    // Get all departments of this member
    const allMemberships = await departmentMembersApi.getByTenantMember(tenantMemberId);
    
    // Unset all current primary flags
    await Promise.all(
      allMemberships
        .filter(m => m.is_primary)
        .map(m => adapter.update(m._id, { is_primary: false, updated_by }))
    );
    
    // Find the target membership
    const targetMembership = allMemberships.find(m => m.department_id === departmentId);
    
    if (!targetMembership) {
      throw new Error('Member is not assigned to this department');
    }
    
    // Set as primary
    return adapter.update(targetMembership._id, { is_primary: true, updated_by });
  },

  /**
   * Assign member to department
   */
  assignMember: async (
    departmentId: string,
    tenantMemberId: string,
    tenantId: string,
    options?: {
      is_primary?: boolean;
      role_in_department?: string;
      joined_at?: string;
      created_by?: string;
    }
  ): Promise<DepartmentMember> => {
    // Check if already assigned
    const existing = await adapter.getAll({
      department_id: departmentId,
      tenant_member_id: tenantMemberId,
    });
    
    if (existing.length > 0 && !existing[0].deleted_at) {
      throw new Error('Member is already assigned to this department');
    }
    
    return adapter.create({
      tenant_id: tenantId,
      department_id: departmentId,
      tenant_member_id: tenantMemberId,
      is_primary: options?.is_primary || false,
      role_in_department: options?.role_in_department,
      joined_at: options?.joined_at || new Date().toISOString(),
      created_by: options?.created_by,
    });
  },

  /**
   * Remove member from department (set left_at)
   */
  removeMember: async (
    departmentId: string,
    tenantMemberId: string,
    updated_by?: string
  ): Promise<DepartmentMember> => {
    const memberships = await adapter.getAll({
      department_id: departmentId,
      tenant_member_id: tenantMemberId,
    });
    
    if (memberships.length === 0) {
      throw new Error('Member is not assigned to this department');
    }
    
    const membership = memberships[0];
    
    return adapter.update(membership._id, {
      left_at: new Date().toISOString(),
      is_primary: false, // Can't be primary if leaving
      updated_by,
    });
  },

  /**
   * Update member role in department
   */
  updateRole: async (
    departmentId: string,
    tenantMemberId: string,
    role: string,
    updated_by?: string
  ): Promise<DepartmentMember> => {
    const memberships = await adapter.getAll({
      department_id: departmentId,
      tenant_member_id: tenantMemberId,
    });
    
    if (memberships.length === 0) {
      throw new Error('Member is not assigned to this department');
    }
    
    return adapter.update(memberships[0]._id, {
      role_in_department: role,
      updated_by,
    });
  },

  /**
   * Batch assign members to department
   */
  batchAssign: async (request: BatchAssignRequest): Promise<DepartmentMember[]> => {
    const results: DepartmentMember[] = [];
    
    for (const memberId of request.tenant_member_ids) {
      try {
        const member = await departmentMembersApi.assignMember(
          request.department_id,
          memberId,
          '', // tenant_id should be provided
          {
            is_primary: request.is_primary,
            role_in_department: request.role_in_department,
            joined_at: request.joined_at,
            created_by: request.created_by,
          }
        );
        results.push(member);
      } catch (error) {
        console.error(`Failed to assign member ${memberId}:`, error);
        // Continue with other members
      }
    }
    
    return results;
  },

  /**
   * Batch remove members from department
   */
  batchRemove: async (
    departmentId: string,
    tenantMemberIds: string[],
    updated_by?: string
  ): Promise<void> => {
    await Promise.all(
      tenantMemberIds.map(memberId => 
        departmentMembersApi.removeMember(departmentId, memberId, updated_by)
      )
    );
  },

  /**
   * Transfer member from one department to another
   */
  transferMember: async (request: TransferMemberRequest): Promise<{
    removed: DepartmentMember;
    added: DepartmentMember;
  }> => {
    // Remove from old department
    const removed = await departmentMembersApi.removeMember(
      request.from_department_id,
      request.tenant_member_id,
      request.updated_by
    );
    
    // Add to new department
    const added = await departmentMembersApi.assignMember(
      request.to_department_id,
      request.tenant_member_id,
      removed.tenant_id,
      {
        role_in_department: request.role_in_department,
        joined_at: new Date().toISOString(),
        created_by: request.updated_by,
      }
    );
    
    return { removed, added };
  },

  /**
   * Get active members count by department
   */
  getActiveMemberCount: async (departmentId: string): Promise<number> => {
    const members = await adapter.getAll({
      department_id: departmentId,
      active_only: true,
    });
    
    return members.length;
  },

  /**
   * Get department member statistics
   */
  getStats: async (tenantId: string): Promise<DepartmentMemberStats> => {
    const allMembers = await adapter.getAll({ tenant_id: tenantId });
    
    const active = allMembers.filter(m => !m.left_at && !m.deleted_at);
    const inactive = allMembers.filter(m => m.left_at && !m.deleted_at);
    const primary = allMembers.filter(m => m.is_primary && !m.deleted_at);
    const secondary = allMembers.filter(m => !m.is_primary && !m.deleted_at);
    
    // Count members in multiple departments
    const memberDeptCount = new Map<string, number>();
    allMembers.forEach(m => {
      if (!m.deleted_at && !m.left_at) {
        const count = memberDeptCount.get(m.tenant_member_id) || 0;
        memberDeptCount.set(m.tenant_member_id, count + 1);
      }
    });
    
    const multiDept = Array.from(memberDeptCount.values()).filter(count => count >= 2).length;
    
    // Count by department
    const deptCounts = new Map<string, number>();
    allMembers.forEach(m => {
      if (!m.deleted_at && !m.left_at) {
        const count = deptCounts.get(m.department_id) || 0;
        deptCounts.set(m.department_id, count + 1);
      }
    });
    
    const byDepartment = Array.from(deptCounts.entries()).map(([dept_id, count]) => ({
      department_id: dept_id,
      department_name: '', // TODO: Join with departments table
      member_count: count,
    }));
    
    const avgMembers = deptCounts.size > 0
      ? Math.round(active.length / deptCounts.size * 10) / 10
      : 0;
    
    // Most common role
    const roleCounts = new Map<string, number>();
    allMembers.forEach(m => {
      if (m.role_in_department && !m.deleted_at && !m.left_at) {
        const count = roleCounts.get(m.role_in_department) || 0;
        roleCounts.set(m.role_in_department, count + 1);
      }
    });
    
    let mostCommonRole: string | undefined;
    let maxCount = 0;
    roleCounts.forEach((count, role) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommonRole = role;
      }
    });
    
    return {
      total: allMembers.filter(m => !m.deleted_at).length,
      by_department: byDepartment,
      active_members: active.length,
      inactive_members: inactive.length,
      primary_assignments: primary.length,
      secondary_assignments: secondary.length,
      members_in_multiple_depts: multiDept,
      avg_members_per_dept: avgMembers,
      most_common_role: mostCommonRole,
    };
  },

  /**
   * Check if member can be removed from department
   */
  canRemove: async (
    departmentId: string,
    tenantMemberId: string
  ): Promise<{
    can_remove: boolean;
    reason?: string;
    is_primary?: boolean;
  }> => {
    const memberships = await adapter.getAll({
      department_id: departmentId,
      tenant_member_id: tenantMemberId,
    });
    
    if (memberships.length === 0) {
      return {
        can_remove: false,
        reason: 'Member is not in this department',
      };
    }
    
    const membership = memberships[0];
    
    if (membership.is_primary) {
      // Check if member has other departments
      const allDepts = await departmentMembersApi.getByTenantMember(tenantMemberId, true);
      
      if (allDepts.length === 1) {
        return {
          can_remove: false,
          reason: 'Cannot remove primary department when it\'s the only department',
          is_primary: true,
        };
      }
    }
    
    return {
      can_remove: true,
      is_primary: membership.is_primary,
    };
  },

  /**
   * Bulk update is_primary status
   */
  bulkUpdatePrimary: async (
    ids: string[],
    is_primary: boolean,
    updated_by?: string
  ): Promise<void> => {
    await Promise.all(
      ids.map(id => adapter.update(id, { is_primary, updated_by }))
    );
  },

  /**
   * Bulk delete (soft delete)
   */
  bulkDelete: async (ids: string[], deleted_by?: string): Promise<void> => {
    const deleted_at = new Date().toISOString();
    await Promise.all(
      ids.map(id => adapter.update(id, { deleted_at, deleted_by } as any))
    );
  },

  /**
   * Get department member by unique constraint
   */
  getByUnique: async (
    departmentId: string,
    tenantMemberId: string
  ): Promise<DepartmentMember | null> => {
    const members = await adapter.getAll({
      department_id: departmentId,
      tenant_member_id: tenantMemberId,
    });
    
    return members.length > 0 ? members[0] : null;
  },

  /**
   * Clone department members to another department
   */
  cloneToDepartment: async (
    fromDepartmentId: string,
    toDepartmentId: string,
    created_by?: string
  ): Promise<DepartmentMember[]> => {
    const sourceMembers = await departmentMembersApi.getByDepartment(fromDepartmentId, true);
    
    const results: DepartmentMember[] = [];
    
    for (const member of sourceMembers) {
      try {
        const newMember = await adapter.create({
          tenant_id: member.tenant_id,
          department_id: toDepartmentId,
          tenant_member_id: member.tenant_member_id,
          is_primary: false, // Don't clone primary status
          role_in_department: member.role_in_department || undefined,
          joined_at: new Date().toISOString(),
          metadata: member.metadata ? { ...member.metadata } : undefined,
          created_by,
        });
        results.push(newMember);
      } catch (error) {
        console.error(`Failed to clone member ${member.tenant_member_id}:`, error);
        // Continue with other members
      }
    }
    
    return results;
  },

  /**
   * Get member history (including left departments)
   */
  getMemberHistory: async (tenantMemberId: string): Promise<DepartmentMember[]> => {
    const allMemberships = await adapter.getAll({
      tenant_member_id: tenantMemberId,
      include_deleted: false,
    });
    
    // Sort by joined_at descending (most recent first)
    return allMemberships.sort((a, b) => {
      const dateA = a.joined_at ? new Date(a.joined_at).getTime() : 0;
      const dateB = b.joined_at ? new Date(b.joined_at).getTime() : 0;
      return dateB - dateA;
    });
  },
};

export default departmentMembersApi;
