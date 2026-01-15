/**
 * Tenant Members API Client
 * Uses Adapter pattern - Ready for Golang migration
 * 
 * ✅ CREATED 2026-01-14: 100% matches tenant_members schema (19 fields)
 */

import { createAdapter, BaseFilters } from './adapters';

// ==================== TYPES ====================

/**
 * Member Role - 4 levels
 */
export type MemberRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

/**
 * Member Status - 4 states
 */
export type MemberStatus = 'ACTIVE' | 'RESIGNED' | 'ONBOARDING' | 'SUSPENDED';

/**
 * TenantMember - 100% matches tenant_members table (19 fields)
 */
export interface TenantMember {
  // Identity & Relationships
  _id: string;
  tenant_id: string;
  user_id: string;
  
  // Employee Information
  employee_code?: string;
  internal_email?: string;
  job_title?: string;
  manager_id?: string;
  
  // Role & Permissions
  role: MemberRole;
  status: MemberStatus;
  permissions: string[];
  
  // Timeline
  joined_at?: string;
  left_at?: string;
  
  // Metadata
  metadata: Record<string, any>;
  
  // Audit Fields
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  created_by?: string;
  updated_by?: string;
  deleted_by?: string;
  
  // Versioning
  version: number;
  
  // ⚠️ Computed/Joined Fields (from users table)
  // These are populated via JOIN queries
  user?: {
    email: string;
    full_name: string;
    avatar_url?: string;
    display_name?: string;
    last_login_at?: string;
  };
  
  // Computed Manager Info (from self-join)
  manager?: {
    _id: string;
    full_name: string;
    email: string;
    employee_code?: string;
  };
}

/**
 * Create Tenant Member Request
 */
export interface CreateTenantMemberRequest {
  tenant_id: string;
  user_id: string;
  employee_code?: string;
  internal_email?: string;
  job_title?: string;
  manager_id?: string;
  role?: MemberRole;
  status?: MemberStatus;
  permissions?: string[];
  joined_at?: string;
  metadata?: Record<string, any>;
}

/**
 * Update Tenant Member Request
 */
export interface UpdateTenantMemberRequest {
  employee_code?: string;
  internal_email?: string;
  job_title?: string;
  manager_id?: string;
  role?: MemberRole;
  status?: MemberStatus;
  permissions?: string[];
  joined_at?: string;
  left_at?: string;
  metadata?: Record<string, any>;
}

/**
 * Tenant Member Filters
 */
export interface TenantMemberFilters extends BaseFilters {
  tenant_id?: string;
  user_id?: string;
  role?: MemberRole;
  status?: MemberStatus;
  manager_id?: string;
  department?: string;
  has_employee_code?: boolean;
  search?: string; // Search by name, email, employee_code
}

/**
 * Tenant Member Statistics
 */
export interface TenantMemberStats {
  total: number;
  by_role: {
    OWNER: number;
    ADMIN: number;
    MEMBER: number;
    VIEWER: number;
  };
  by_status: {
    ACTIVE: number;
    RESIGNED: number;
    ONBOARDING: number;
    SUSPENDED: number;
  };
  with_manager: number;
  with_employee_code: number;
  avg_tenure_days: number;
  recent_joiners: number; // Last 30 days
  recent_leavers: number; // Last 30 days
}

/**
 * Member Hierarchy Node (for org chart)
 */
export interface MemberHierarchyNode {
  member: TenantMember;
  children: MemberHierarchyNode[];
  depth: number;
  subordinate_count: number;
}

// ==================== ADAPTER ====================

const adapter = createAdapter<TenantMember, CreateTenantMemberRequest, UpdateTenantMemberRequest>(
  'tenant_members',
  '/tenant-members'
);

// ==================== API CLIENT ====================

export const tenantMembersApi = {
  /**
   * GET /tenant-members
   */
  getAll: async (filters?: TenantMemberFilters): Promise<TenantMember[]> => {
    return adapter.getAll(filters);
  },

  /**
   * GET /tenant-members/:id
   */
  getById: async (id: string): Promise<TenantMember> => {
    return adapter.getById(id);
  },

  /**
   * POST /tenant-members
   */
  create: async (data: CreateTenantMemberRequest): Promise<TenantMember> => {
    return adapter.create(data);
  },

  /**
   * PATCH /tenant-members/:id
   */
  update: async (id: string, data: UpdateTenantMemberRequest): Promise<TenantMember> => {
    return adapter.update(id, data);
  },

  /**
   * DELETE /tenant-members/:id
   * Soft delete - sets deleted_at timestamp
   */
  delete: async (id: string): Promise<void> => {
    return adapter.delete(id);
  },

  /**
   * Get members by tenant
   * TODO (Golang): Implement with JOIN to users table
   */
  getByTenant: async (tenantId: string): Promise<TenantMember[]> => {
    return adapter.getAll({ tenant_id: tenantId });
  },

  /**
   * Get member by user and tenant
   * Uses unique constraint (tenant_id, user_id)
   */
  getByUserAndTenant: async (userId: string, tenantId: string): Promise<TenantMember | null> => {
    const members = await adapter.getAll({ 
      user_id: userId, 
      tenant_id: tenantId 
    });
    return members.length > 0 ? members[0] : null;
  },

  /**
   * Change member role
   */
  changeRole: async (id: string, role: MemberRole): Promise<TenantMember> => {
    return adapter.update(id, { role });
  },

  /**
   * Change member status
   */
  changeStatus: async (id: string, status: MemberStatus): Promise<TenantMember> => {
    const updateData: UpdateTenantMemberRequest = { status };
    
    // Auto-set left_at when status changes to RESIGNED
    if (status === 'RESIGNED') {
      updateData.left_at = new Date().toISOString();
    }
    
    return adapter.update(id, updateData);
  },

  /**
   * Update member permissions
   */
  updatePermissions: async (id: string, permissions: string[]): Promise<TenantMember> => {
    return adapter.update(id, { permissions });
  },

  /**
   * Assign manager
   */
  assignManager: async (memberId: string, managerId: string | null): Promise<TenantMember> => {
    return adapter.update(memberId, { manager_id: managerId || undefined });
  },

  /**
   * Get member statistics for a tenant
   * TODO (Golang): Implement with aggregation queries
   */
  getStats: async (tenantId: string): Promise<TenantMemberStats> => {
    const members = await adapter.getAll({ tenant_id: tenantId });
    
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const byRole = {
      OWNER: members.filter(m => m.role === 'OWNER').length,
      ADMIN: members.filter(m => m.role === 'ADMIN').length,
      MEMBER: members.filter(m => m.role === 'MEMBER').length,
      VIEWER: members.filter(m => m.role === 'VIEWER').length,
    };
    
    const byStatus = {
      ACTIVE: members.filter(m => m.status === 'ACTIVE').length,
      RESIGNED: members.filter(m => m.status === 'RESIGNED').length,
      ONBOARDING: members.filter(m => m.status === 'ONBOARDING').length,
      SUSPENDED: members.filter(m => m.status === 'SUSPENDED').length,
    };
    
    const withManager = members.filter(m => m.manager_id).length;
    const withEmployeeCode = members.filter(m => m.employee_code).length;
    
    // Calculate average tenure
    const activeMembersWithJoinDate = members.filter(m => m.status === 'ACTIVE' && m.joined_at);
    const totalTenureDays = activeMembersWithJoinDate.reduce((sum, m) => {
      const joinDate = new Date(m.joined_at!);
      const tenureDays = Math.floor((now.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24));
      return sum + tenureDays;
    }, 0);
    const avgTenureDays = activeMembersWithJoinDate.length > 0 
      ? Math.round(totalTenureDays / activeMembersWithJoinDate.length)
      : 0;
    
    const recentJoiners = members.filter(m => {
      if (!m.joined_at) return false;
      return new Date(m.joined_at) >= thirtyDaysAgo;
    }).length;
    
    const recentLeavers = members.filter(m => {
      if (!m.left_at) return false;
      return new Date(m.left_at) >= thirtyDaysAgo;
    }).length;
    
    return {
      total: members.length,
      by_role: byRole,
      by_status: byStatus,
      with_manager: withManager,
      with_employee_code: withEmployeeCode,
      avg_tenure_days: avgTenureDays,
      recent_joiners: recentJoiners,
      recent_leavers: recentLeavers,
    };
  },

  /**
   * Get organization hierarchy (manager-subordinate tree)
   * TODO (Golang): Implement with recursive CTE
   */
  getHierarchy: async (tenantId: string, rootManagerId?: string): Promise<MemberHierarchyNode[]> => {
    // TODO: Implement in Golang with recursive query
    // SELECT * FROM tenant_members
    // WHERE tenant_id = $1
    // START WITH manager_id IS NULL (or manager_id = $2)
    // CONNECT BY PRIOR _id = manager_id
    throw new Error('Hierarchy endpoint not implemented - migrate to Golang');
  },

  /**
   * Get direct reports for a manager
   */
  getDirectReports: async (managerId: string): Promise<TenantMember[]> => {
    return adapter.getAll({ manager_id: managerId });
  },

  /**
   * Invite new member (creates with ONBOARDING status)
   * TODO (Golang): Send invitation email
   */
  invite: async (data: {
    tenant_id: string;
    email: string;
    role?: MemberRole;
    job_title?: string;
  }): Promise<{ member: TenantMember; invitation_token: string }> => {
    // TODO: Implement in Golang backend
    // 1. Create or find user by email
    // 2. Create tenant_member with ONBOARDING status
    // 3. Generate invitation_token
    // 4. Send invitation email
    // 5. Return member + token
    throw new Error('Invite endpoint not implemented - migrate to Golang');
  },

  /**
   * Accept invitation (changes status from ONBOARDING to ACTIVE)
   */
  acceptInvitation: async (memberId: string, invitationToken: string): Promise<TenantMember> => {
    // TODO: Implement in Golang backend
    // 1. Verify invitation_token
    // 2. Update status to ACTIVE
    // 3. Set joined_at to now
    throw new Error('Accept invitation endpoint not implemented - migrate to Golang');
  },

  /**
   * Bulk update members
   * TODO (Golang): Implement batch update
   */
  bulkUpdate: async (updates: Array<{
    id: string;
    data: UpdateTenantMemberRequest;
  }>): Promise<TenantMember[]> => {
    // TODO: Implement in Golang with transaction
    throw new Error('Bulk update endpoint not implemented - migrate to Golang');
  },

  /**
   * Transfer members to another manager
   */
  transferToManager: async (
    fromManagerId: string,
    toManagerId: string
  ): Promise<{ updated_count: number }> => {
    // TODO: Implement in Golang
    // UPDATE tenant_members SET manager_id = $2 WHERE manager_id = $1
    throw new Error('Transfer manager endpoint not implemented - migrate to Golang');
  },

  /**
   * Search members (full-text search)
   * TODO (Golang): Implement with PostgreSQL full-text search
   */
  search: async (tenantId: string, query: string): Promise<TenantMember[]> => {
    // TODO: Implement in Golang with tsvector
    // Search in: employee_code, internal_email, job_title, user.full_name, user.email
    return adapter.getAll({ 
      tenant_id: tenantId,
      search: query 
    });
  },
};

export default tenantMembersApi;
