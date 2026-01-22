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
 * Enriched Department Member with joined data
 */
export interface EnrichedDepartmentMember extends DepartmentMember {
  department?: {
    _id: string;
    code: string;
    name: string;
    status: string;
  };
  tenant_member?: {
    _id: string;
    employee_code?: string;
    user?: {
      full_name: string;
      email: string;
      avatar_url?: string;
    };
    status: string;
  };
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
 * ✅ IMPROVEMENT: Added version for optimistic locking
 */
export interface UpdateDepartmentMemberRequest {
  is_primary?: boolean;
  role_in_department?: string;
  joined_at?: string;
  left_at?: string;
  metadata?: Record<string, any>;
  updated_by?: string;
  version?: number; // ✅ Optional for now to maintain backward compatibility, but recommended
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
  getAll: async (filters?: DepartmentMemberFilters): Promise<EnrichedDepartmentMember[]> => {
    // Basic fetch via adapter
    const data = await adapter.getAll(filters);
    
    // Note: For full enrichment, we would need to join.
    // If strict compliance is needed for UI without extra calls, we should use Supabase join here.
    // However, the current UI often fetches tenant_members separately.
    // Let's keep it simple for now or upgrade if UI needs it.
    // Given the previous patterns, let's upgrade to join if possible, but many use cases just need the IDs.
    // The UI `DepartmentMembersTab` enriches manually. 
    return data as EnrichedDepartmentMember[];
  },

  /**
   * GET /department-members/:id
   */
  getById: async (id: string): Promise<EnrichedDepartmentMember> => {
    return adapter.getById(id) as Promise<EnrichedDepartmentMember>;
  },

  /**
   * POST /department-members
   */
  create: async (data: CreateDepartmentMemberRequest): Promise<DepartmentMember> => {
    // Validate required fields
    if (!data.tenant_id || !data.department_id || !data.tenant_member_id) {
      throw new Error('tenant_id, department_id, and tenant_member_id are required');
    }

    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    const _id = crypto.randomUUID();

    const requestData = {
      _id,
      tenant_id: data.tenant_id,
      department_id: data.department_id,
      tenant_member_id: data.tenant_member_id,
      is_primary: data.is_primary || false,
      role_in_department: data.role_in_department || null,
      joined_at: data.joined_at || new Date().toISOString(),
      metadata: data.metadata || {},
      created_by: data.created_by || null,
      version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    const { data: created, error } = await supabase
      .from('department_members')
      .insert([requestData])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create department member: ${error.message}`);
    }
    
    return created;
  },

  /**
   * PATCH /department-members/:id
   */
  update: async (id: string, data: UpdateDepartmentMemberRequest): Promise<DepartmentMember> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    // Get current version for optimistic locking
    let currentVersion = data.version;

    if (!currentVersion) {
        const { data: current, error: fetchError } = await supabase
            .from('department_members')
            .select('version')
            .eq('_id', id)
            .single();
            
        if (fetchError || !current) {
            throw new Error(`Department member not found: ${fetchError?.message || 'Unknown error'}`);
        }
        currentVersion = current.version;
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
      version: currentVersion + 1,
    };

    if (data.is_primary !== undefined) updateData.is_primary = data.is_primary;
    if (data.role_in_department !== undefined) updateData.role_in_department = data.role_in_department;
    if (data.joined_at !== undefined) updateData.joined_at = data.joined_at;
    if (data.left_at !== undefined) updateData.left_at = data.left_at;
    if (data.metadata !== undefined) updateData.metadata = data.metadata;
    if (data.updated_by !== undefined) updateData.updated_by = data.updated_by;

    const { data: updated, error } = await supabase
      .from('department_members')
      .update(updateData)
      .eq('_id', id)
      .eq('version', currentVersion)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update department member: ${error.message}`);
    }

    if (!updated) {
      throw new Error('Concurrent modification detected. Please refresh and try again.');
    }

    return updated;
  },

  /**
   * DELETE /department-members/:id (SOFT DELETE)
   * Sets deleted_at to current timestamp
   */
  delete: async (id: string, deleted_by?: string, version?: number): Promise<void> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    let currentVersion = version;
    if (!currentVersion) {
        const { data: current, error: fetchError } = await supabase
            .from('department_members')
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
      .from('department_members')
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
      throw new Error(`Failed to delete department member: ${error.message}`);
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
   * Restore soft-deleted department member
   */
  restore: async (id: string, version?: number): Promise<DepartmentMember> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    let currentVersion = version;
    if (!currentVersion) {
        const { data: current, error } = await supabase
            .from('department_members')
            .select('version')
            .eq('_id', id)
            .single();
        if (error || !current) throw new Error(`Department member not found: ${error?.message}`);
        currentVersion = current.version;
    }
    
    const { data: updated, error } = await supabase
      .from('department_members')
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

    if (error) throw new Error(`Failed to restore department member: ${error.message}`);
    if (!updated) throw new Error('Concurrent modification detected.');
    
    return updated;
  },

  /**
   * Get department members by tenant
   */
  getByTenant: async (tenantId: string, includeDeleted: boolean = false): Promise<EnrichedDepartmentMember[]> => {
    return adapter.getAll({ 
      tenant_id: tenantId,
      include_deleted: includeDeleted,
    }) as Promise<EnrichedDepartmentMember[]>;
  },

  /**
   * Get members of a specific department
   */
  getByDepartment: async (departmentId: string, activeOnly: boolean = false): Promise<EnrichedDepartmentMember[]> => {
    return adapter.getAll({
      department_id: departmentId,
      active_only: activeOnly,
    }) as Promise<EnrichedDepartmentMember[]>;
  },

  /**
   * Get departments of a specific tenant member
   */
  getByTenantMember: async (tenantMemberId: string, activeOnly: boolean = false): Promise<EnrichedDepartmentMember[]> => {
    return adapter.getAll({
      tenant_member_id: tenantMemberId,
      active_only: activeOnly,
    }) as Promise<EnrichedDepartmentMember[]>;
  },

  /**
   * Get primary department of a tenant member
   */
  getPrimaryDepartment: async (tenantMemberId: string): Promise<EnrichedDepartmentMember | null> => {
    const members = await adapter.getAll({
      tenant_member_id: tenantMemberId,
      is_primary: true,
    });
    
    return members.length > 0 ? members[0] as EnrichedDepartmentMember : null;
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
    
    // Better logic: Unset only others
    const toUnset = allMemberships.filter(m => m.is_primary && m.department_id !== departmentId);
    const targetIsAlreadyPrimary = allMemberships.find(m => m.department_id === departmentId)?.is_primary;
    
    // Find the target membership
    const targetMembership = allMemberships.find(m => m.department_id === departmentId);
    
    if (!targetMembership) {
      throw new Error('Member is not assigned to this department');
    }

    await Promise.all(
        toUnset.map(m => departmentMembersApi.update(m._id, { is_primary: false, updated_by, version: m.version }))
    );

    if (targetIsAlreadyPrimary) {
        return targetMembership;
    }

    // Refresh target membership to get latest version if needed (though local var is fine usually)
    return departmentMembersApi.update(targetMembership._id, { is_primary: true, updated_by, version: targetMembership.version });
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
      metadata?: Record<string, any>;
    }
  ): Promise<DepartmentMember> => {
    // Check if already assigned
    const existing = await adapter.getAll({
      department_id: departmentId,
      tenant_member_id: tenantMemberId,
    });
    
    // Check for active membership
    const activeExisting = existing.find(m => !m.deleted_at && !m.left_at);
    if (activeExisting) {
      throw new Error('Member is already assigned to this department');
    }

    // Check for inactive/deleted membership to reactivate
    const inactiveExisting = existing.find(m => m.deleted_at || m.left_at);

    if (inactiveExisting) {
      // Reactivate or update existing
      // We need to use update() to handle versioning
      return departmentMembersApi.update(inactiveExisting._id, {
        left_at: null, // Clear left_at - we need to support null in update type or cast
        // @ts-ignore: sending null to clear date
        deleted_at: null, 
        is_primary: options?.is_primary,
        role_in_department: options?.role_in_department,
        joined_at: options?.joined_at || new Date().toISOString(), // Re-joined date
        updated_by: options?.created_by,
        metadata: options?.metadata,
        version: inactiveExisting.version
      } as any);
    }
    
    return departmentMembersApi.create({
      tenant_id: tenantId,
      department_id: departmentId,
      tenant_member_id: tenantMemberId,
      is_primary: options?.is_primary || false,
      role_in_department: options?.role_in_department,
      joined_at: options?.joined_at || new Date().toISOString(),
      metadata: options?.metadata,
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
    
    const activeMembership = memberships.find(m => !m.left_at && !m.deleted_at);

    if (!activeMembership) {
      throw new Error('Member is not assigned to this department');
    }
    
    return departmentMembersApi.update(activeMembership._id, {
      left_at: new Date().toISOString(),
      is_primary: false, // Can't be primary if leaving
      updated_by,
      version: activeMembership.version
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
    
    const activeMembership = memberships.find(m => !m.left_at && !m.deleted_at);

    if (!activeMembership) {
      throw new Error('Member is not assigned to this department');
    }
    
    return departmentMembersApi.update(activeMembership._id, {
      role_in_department: role,
      updated_by,
      version: activeMembership.version
    });
  },

  /**
   * Batch assign members to department
   */
  batchAssign: async (request: BatchAssignRequest): Promise<DepartmentMember[]> => {
    const results: DepartmentMember[] = [];
    
    // We need tenant_id for creation. In a real app, this should be part of the request or inferred.
    // For now, we'll fetch the first member to get their tenant_id if possible, or error out.
    // But assignMember needs tenant_id.
    // Let's try to get tenant_id from the department first.
    let tenantId = '';
    try {
        const { departmentsApi } = await import('./departmentsApi');
        const dept = await departmentsApi.getById(request.department_id);
        tenantId = dept.tenant_id;
    } catch (e) {
        console.error('Could not fetch department to get tenant_id', e);
        throw new Error('Could not determine tenant context');
    }

    for (const memberId of request.tenant_member_ids) {
      try {
        const member = await departmentMembersApi.assignMember(
          request.department_id,
          memberId,
          tenantId,
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
    // Call update individually to handle versions
    await Promise.all(
      ids.map(async id => {
        try {
            await departmentMembersApi.update(id, { is_primary, updated_by });
        } catch (e) {
            console.error(`Failed to update primary status for ${id}`, e);
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
            await departmentMembersApi.delete(id, deleted_by);
        } catch (e) {
             console.error(`Failed to delete member ${id}`, e);
        }
      })
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
        const newMember = await departmentMembersApi.create({
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
