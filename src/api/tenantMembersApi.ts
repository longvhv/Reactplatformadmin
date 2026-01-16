/**
 * Tenant Members API Client
 * Uses Adapter pattern - Ready for Golang migration
 * 
 * ✅ ENHANCED 2026-01-16: 100% database alignment + Complete implementation
 * Database: tenant_members (19 fields, soft delete, versioning, audit trail)
 */

import { createAdapter, BaseFilters } from './adapters';

// ==================== TYPES ====================

export type MemberRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
export type MemberStatus = 'ACTIVE' | 'RESIGNED' | 'ONBOARDING' | 'SUSPENDED';

export const MemberRoleHelper = {
  OWNER: 'OWNER' as MemberRole,
  ADMIN: 'ADMIN' as MemberRole,
  MEMBER: 'MEMBER' as MemberRole,
  VIEWER: 'VIEWER' as MemberRole,

  isOwner: (role: MemberRole) => role === 'OWNER',
  isAdmin: (role: MemberRole) => role === 'ADMIN',
  isMember: (role: MemberRole) => role === 'MEMBER',
  isViewer: (role: MemberRole) => role === 'VIEWER',
  hasAdminAccess: (role: MemberRole) => role === 'OWNER' || role === 'ADMIN',
  canManageMembers: (role: MemberRole) => role === 'OWNER' || role === 'ADMIN',
  canEditContent: (role: MemberRole) => role !== 'VIEWER',
};

export const MemberStatusHelper = {
  ACTIVE: 'ACTIVE' as MemberStatus,
  RESIGNED: 'RESIGNED' as MemberStatus,
  ONBOARDING: 'ONBOARDING' as MemberStatus,
  SUSPENDED: 'SUSPENDED' as MemberStatus,

  isActive: (status: MemberStatus) => status === 'ACTIVE',
  isResigned: (status: MemberStatus) => status === 'RESIGNED',
  isOnboarding: (status: MemberStatus) => status === 'ONBOARDING',
  isSuspended: (status: MemberStatus) => status === 'SUSPENDED',
  canAccess: (status: MemberStatus) => status === 'ACTIVE' || status === 'ONBOARDING',
  needsOnboarding: (status: MemberStatus) => status === 'ONBOARDING',
};

// ==================== MAIN INTERFACE ====================

/**
 * TenantMember - 100% matches tenant_members table (19 fields)
 */
export interface TenantMember {
  // I. IDENTITY & RELATIONSHIPS (3)
  _id: string;
  tenant_id: string;
  user_id: string;

  // II. EMPLOYEE INFORMATION (4)
  employee_code: string | null; // varchar(50), unique per tenant
  internal_email: string | null; // varchar(255)
  job_title: string | null; // varchar(100)
  manager_id: string | null; // FK to tenant_members (self-reference)

  // III. ROLE & PERMISSIONS (3)
  role: MemberRole; // NOT NULL, default 'MEMBER'
  status: MemberStatus; // NOT NULL, default 'ACTIVE'
  permissions: string[]; // jsonb, default []

  // IV. TIMELINE (2)
  joined_at: string | null;
  left_at: string | null;

  // V. METADATA (1)
  metadata: Record<string, any>; // jsonb, default {}

  // VI. AUDIT TRAIL (6)
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  created_by: string | null;
  updated_by: string | null;
  deleted_by: string | null;

  // VII. VERSIONING (1)
  version: number; // bigint, default 1, for optimistic locking
}

export interface MemberWithDetails extends TenantMember {
  // Joined from users table
  user_name?: string;
  user_email?: string;
  user_avatar?: string;
  user_display_name?: string;

  // Joined from manager (self-join)
  manager_name?: string;
  manager_email?: string;
  manager_employee_code?: string;

  // Computed fields
  tenure_days?: number | null;
  is_new_joiner?: boolean; // Within 30 days
  is_recent_leaver?: boolean; // Left within 30 days
}

// ==================== REQUEST INTERFACES ====================

export interface CreateMemberRequest {
  // Required
  tenant_id: string;
  user_id: string;

  // Optional with defaults
  role?: MemberRole; // default: 'MEMBER'
  status?: MemberStatus; // default: 'ACTIVE'
  permissions?: string[]; // default: []
  metadata?: Record<string, any>; // default: {}
  version?: number; // default: 1

  // Optional
  employee_code?: string | null;
  internal_email?: string | null;
  job_title?: string | null;
  manager_id?: string | null;
  joined_at?: string | null;
  created_by?: string | null;
}

export interface UpdateMemberRequest {
  employee_code?: string | null;
  internal_email?: string | null;
  job_title?: string | null;
  manager_id?: string | null;
  role?: MemberRole;
  status?: MemberStatus;
  permissions?: string[];
  joined_at?: string | null;
  left_at?: string | null;
  metadata?: Record<string, any>;
  updated_by?: string | null;
}

export interface MemberFilters extends BaseFilters {
  tenant_id?: string;
  user_id?: string;
  role?: MemberRole;
  status?: MemberStatus;
  manager_id?: string;
  has_manager?: boolean;
  has_employee_code?: boolean;
  search?: string; // Search by name, email, employee_code, job_title
}

// ==================== STATISTICS ====================

export interface MemberStatistics {
  total_members: number;
  active_members: number;
  resigned_members: number;
  onboarding_members: number;
  suspended_members: number;
  by_role: Record<MemberRole, number>;
  by_status: Record<MemberStatus, number>;
  with_manager: number;
  with_employee_code: number;
  avg_tenure_days: number | null;
  recent_joiners: number; // Last 30 days
  recent_leavers: number; // Last 30 days
}

// ==================== VALIDATION ====================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// ==================== HIERARCHY ====================

export interface MemberHierarchyNode {
  member: TenantMember;
  children: MemberHierarchyNode[];
  depth: number;
  subordinate_count: number;
}

// ==================== ADAPTER ====================

const adapter = createAdapter<TenantMember, CreateMemberRequest, UpdateMemberRequest>(
  'tenant_members',
  '/tenant-members',
  true // Soft delete enabled
);

// ==================== API CLIENT ====================

export const tenantMembersApi = {
  /**
   * GET /tenant-members
   * Fetch members with filters
   */
  getAll: async (filters?: MemberFilters): Promise<TenantMember[]> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    let query = supabase
      .from('tenant_members')
      .select('*')
      .is('deleted_at', null) // Exclude soft-deleted
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters?.tenant_id) {
      query = query.eq('tenant_id', filters.tenant_id);
    }
    if (filters?.user_id) {
      query = query.eq('user_id', filters.user_id);
    }
    if (filters?.role) {
      query = query.eq('role', filters.role);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.manager_id) {
      query = query.eq('manager_id', filters.manager_id);
    }
    if (filters?.has_manager !== undefined) {
      query = filters.has_manager ? query.not('manager_id', 'is', null) : query.is('manager_id', null);
    }
    if (filters?.has_employee_code !== undefined) {
      query = filters.has_employee_code
        ? query.not('employee_code', 'is', null)
        : query.is('employee_code', null);
    }

    // Pagination
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch members: ${error.message}`);
    }

    return data || [];
  },

  /**
   * GET /tenant-members/:id
   */
  getById: async (id: string): Promise<TenantMember> => {
    return adapter.getById(id);
  },

  /**
   * GET /tenant-members/:id/details
   * Get member with joined user and manager data
   */
  getByIdWithDetails: async (id: string): Promise<MemberWithDetails> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    // Get member
    const { data: member, error: memberError } = await supabase
      .from('tenant_members')
      .select('*')
      .eq('_id', id)
      .is('deleted_at', null)
      .single();

    if (memberError || !member) {
      throw new Error(`Member not found: ${memberError?.message || 'Unknown error'}`);
    }

    // Get user info
    let user_name: string | undefined;
    let user_email: string | undefined;
    let user_avatar: string | undefined;
    let user_display_name: string | undefined;
    if (member.user_id) {
      const { data: user } = await supabase
        .from('users')
        .select('name, email, avatar_url, display_name')
        .eq('_id', member.user_id)
        .single();
      if (user) {
        user_name = user.name;
        user_email = user.email;
        user_avatar = user.avatar_url;
        user_display_name = user.display_name;
      }
    }

    // Get manager info
    let manager_name: string | undefined;
    let manager_email: string | undefined;
    let manager_employee_code: string | undefined;
    if (member.manager_id) {
      const { data: managerData } = await supabase
        .from('tenant_members')
        .select('employee_code')
        .eq('_id', member.manager_id)
        .single();

      if (managerData) {
        manager_employee_code = managerData.employee_code;

        // Get manager's user info
        const { data: managerMember } = await supabase
          .from('tenant_members')
          .select('user_id')
          .eq('_id', member.manager_id)
          .single();

        if (managerMember?.user_id) {
          const { data: managerUser } = await supabase
            .from('users')
            .select('name, email')
            .eq('_id', managerMember.user_id)
            .single();
          if (managerUser) {
            manager_name = managerUser.name;
            manager_email = managerUser.email;
          }
        }
      }
    }

    const tenure_days = getTenureDays(member);
    const is_new_joiner = isNewJoiner(member);
    const is_recent_leaver = isRecentLeaver(member);

    return {
      ...member,
      user_name,
      user_email,
      user_avatar,
      user_display_name,
      manager_name,
      manager_email,
      manager_employee_code,
      tenure_days,
      is_new_joiner,
      is_recent_leaver,
    } as MemberWithDetails;
  },

  /**
   * POST /tenant-members
   * Create new member with validation and defaults
   */
  create: async (data: CreateMemberRequest): Promise<TenantMember> => {
    // Validate
    const validation = tenantMembersApi.validate(data);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Apply defaults
    const requestData = {
      ...data,
      role: data.role || 'MEMBER' as MemberRole, // default
      status: data.status || 'ACTIVE' as MemberStatus, // default
      permissions: data.permissions || [], // default
      metadata: data.metadata || {}, // default
      version: data.version || 1, // default
    };

    return adapter.create(requestData);
  },

  /**
   * PUT /tenant-members/:id
   * Update member with validation
   */
  update: async (id: string, data: UpdateMemberRequest): Promise<TenantMember> => {
    // Validate
    const validation = tenantMembersApi.validate(data);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    return adapter.update(id, data);
  },

  /**
   * DELETE /tenant-members/:id
   * Soft delete member
   */
  delete: async (id: string, deletedBy?: string): Promise<void> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('tenant_members')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: deletedBy || null,
      })
      .eq('_id', id);

    if (error) {
      throw new Error(`Failed to delete member: ${error.message}`);
    }
  },

  /**
   * GET /tenant-members/by-tenant/:tenantId
   */
  getByTenant: async (tenantId: string): Promise<TenantMember[]> => {
    return tenantMembersApi.getAll({ tenant_id: tenantId });
  },

  /**
   * GET /tenant-members/by-user/:userId/tenant/:tenantId
   * Get member by unique constraint (tenant_id, user_id)
   */
  getByUserAndTenant: async (userId: string, tenantId: string): Promise<TenantMember | null> => {
    const members = await tenantMembersApi.getAll({
      user_id: userId,
      tenant_id: tenantId,
    });
    return members.length > 0 ? members[0] : null;
  },

  /**
   * GET /tenant-members/active/:tenantId
   */
  getActive: async (tenantId?: string): Promise<TenantMember[]> => {
    return tenantMembersApi.getAll({
      tenant_id: tenantId,
      status: 'ACTIVE',
    });
  },

  /**
   * GET /tenant-members/resigned/:tenantId
   */
  getResigned: async (tenantId?: string): Promise<TenantMember[]> => {
    return tenantMembersApi.getAll({
      tenant_id: tenantId,
      status: 'RESIGNED',
    });
  },

  /**
   * GET /tenant-members/onboarding/:tenantId
   */
  getOnboarding: async (tenantId?: string): Promise<TenantMember[]> => {
    return tenantMembersApi.getAll({
      tenant_id: tenantId,
      status: 'ONBOARDING',
    });
  },

  /**
   * GET /tenant-members/suspended/:tenantId
   */
  getSuspended: async (tenantId?: string): Promise<TenantMember[]> => {
    return tenantMembersApi.getAll({
      tenant_id: tenantId,
      status: 'SUSPENDED',
    });
  },

  /**
   * GET /tenant-members/by-role/:role
   */
  getByRole: async (role: MemberRole, tenantId?: string): Promise<TenantMember[]> => {
    return tenantMembersApi.getAll({
      tenant_id: tenantId,
      role,
    });
  },

  /**
   * GET /tenant-members/without-manager/:tenantId
   */
  getWithoutManager: async (tenantId: string): Promise<TenantMember[]> => {
    return tenantMembersApi.getAll({
      tenant_id: tenantId,
      has_manager: false,
    });
  },

  /**
   * GET /tenant-members/direct-reports/:managerId
   */
  getDirectReports: async (managerId: string): Promise<TenantMember[]> => {
    return tenantMembersApi.getAll({ manager_id: managerId });
  },

  /**
   * GET /tenant-members/recent-joiners/:tenantId
   */
  getRecentJoiners: async (tenantId: string, days: number = 30): Promise<TenantMember[]> => {
    const members = await tenantMembersApi.getAll({ tenant_id: tenantId });
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return members.filter((m) => m.joined_at && new Date(m.joined_at) >= cutoffDate);
  },

  /**
   * GET /tenant-members/recent-leavers/:tenantId
   */
  getRecentLeavers: async (tenantId: string, days: number = 30): Promise<TenantMember[]> => {
    const members = await tenantMembersApi.getAll({ tenant_id: tenantId });
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return members.filter((m) => m.left_at && new Date(m.left_at) >= cutoffDate);
  },

  /**
   * PUT /tenant-members/:id/role
   * Change member role
   */
  changeRole: async (id: string, role: MemberRole, updatedBy?: string): Promise<TenantMember> => {
    return tenantMembersApi.update(id, { role, updated_by: updatedBy });
  },

  /**
   * PUT /tenant-members/:id/status
   * Change member status
   */
  changeStatus: async (id: string, status: MemberStatus, updatedBy?: string): Promise<TenantMember> => {
    const updateData: UpdateMemberRequest = { status, updated_by: updatedBy };

    // Auto-set left_at when status changes to RESIGNED
    if (status === 'RESIGNED') {
      updateData.left_at = new Date().toISOString();
    }

    return tenantMembersApi.update(id, updateData);
  },

  /**
   * POST /tenant-members/:id/activate
   */
  activate: async (id: string, updatedBy?: string): Promise<TenantMember> => {
    return tenantMembersApi.changeStatus(id, 'ACTIVE', updatedBy);
  },

  /**
   * POST /tenant-members/:id/suspend
   */
  suspend: async (id: string, updatedBy?: string): Promise<TenantMember> => {
    return tenantMembersApi.changeStatus(id, 'SUSPENDED', updatedBy);
  },

  /**
   * POST /tenant-members/:id/resign
   */
  resign: async (id: string, updatedBy?: string): Promise<TenantMember> => {
    return tenantMembersApi.changeStatus(id, 'RESIGNED', updatedBy);
  },

  /**
   * POST /tenant-members/:id/onboard
   */
  onboard: async (id: string, updatedBy?: string): Promise<TenantMember> => {
    return tenantMembersApi.changeStatus(id, 'ONBOARDING', updatedBy);
  },

  /**
   * POST /tenant-members/:id/complete-onboarding
   */
  completeOnboarding: async (id: string, updatedBy?: string): Promise<TenantMember> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('tenant_members')
      .update({
        status: 'ACTIVE',
        joined_at: new Date().toISOString(),
        updated_by: updatedBy || null,
        updated_at: new Date().toISOString(),
      })
      .eq('_id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to complete onboarding: ${error?.message || 'Unknown error'}`);
    }

    return data;
  },

  /**
   * PUT /tenant-members/:id/permissions
   */
  updatePermissions: async (id: string, permissions: string[], updatedBy?: string): Promise<TenantMember> => {
    return tenantMembersApi.update(id, { permissions, updated_by: updatedBy });
  },

  /**
   * PUT /tenant-members/:id/manager
   */
  assignManager: async (memberId: string, managerId: string | null, updatedBy?: string): Promise<TenantMember> => {
    return tenantMembersApi.update(memberId, { manager_id: managerId, updated_by: updatedBy });
  },

  /**
   * POST /tenant-members/:id/promote
   * Promote member to next higher role
   */
  promote: async (id: string, updatedBy?: string): Promise<TenantMember> => {
    const member = await tenantMembersApi.getById(id);
    const roleHierarchy: MemberRole[] = ['VIEWER', 'MEMBER', 'ADMIN', 'OWNER'];
    const currentIndex = roleHierarchy.indexOf(member.role);

    if (currentIndex === roleHierarchy.length - 1) {
      throw new Error('Cannot promote OWNER role');
    }

    const newRole = roleHierarchy[currentIndex + 1];
    return tenantMembersApi.changeRole(id, newRole, updatedBy);
  },

  /**
   * POST /tenant-members/:id/demote
   * Demote member to next lower role
   */
  demote: async (id: string, updatedBy?: string): Promise<TenantMember> => {
    const member = await tenantMembersApi.getById(id);
    const roleHierarchy: MemberRole[] = ['VIEWER', 'MEMBER', 'ADMIN', 'OWNER'];
    const currentIndex = roleHierarchy.indexOf(member.role);

    if (currentIndex === 0) {
      throw new Error('Cannot demote VIEWER role');
    }

    const newRole = roleHierarchy[currentIndex - 1];
    return tenantMembersApi.changeRole(id, newRole, updatedBy);
  },

  /**
   * GET /tenant-members/statistics/:tenantId
   */
  getStatistics: async (tenantId?: string): Promise<MemberStatistics> => {
    const members = await tenantMembersApi.getAll(tenantId ? { tenant_id: tenantId } : {});
    return calculateStatistics(members);
  },

  /**
   * Client-side validation
   */
  validate: (data: Partial<CreateMemberRequest | UpdateMemberRequest>): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate tenant_id
    if ('tenant_id' in data && data.tenant_id !== undefined) {
      if (!data.tenant_id || !data.tenant_id.trim()) {
        errors.push('Tenant ID không được để trống');
      }
    }

    // Validate user_id
    if ('user_id' in data && data.user_id !== undefined) {
      if (!data.user_id || !data.user_id.trim()) {
        errors.push('User ID không được để trống');
      }
    }

    // Validate employee_code length
    if ('employee_code' in data && data.employee_code) {
      if (data.employee_code.length > 50) {
        errors.push('Mã nhân viên không được vượt quá 50 ký tự');
      }
    }

    // Validate internal_email format
    if ('internal_email' in data && data.internal_email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.internal_email)) {
        errors.push('Email nội bộ không đúng định dạng');
      }
      if (data.internal_email.length > 255) {
        errors.push('Email nội bộ không được vượt quá 255 ký tự');
      }
    }

    // Validate job_title length
    if ('job_title' in data && data.job_title) {
      if (data.job_title.length > 100) {
        errors.push('Chức danh không được vượt quá 100 ký tự');
      }
    }

    // Validate version
    if ('version' in data && (data as any).version !== undefined) {
      const version = (data as any).version;
      if (typeof version === 'number' && version < 1) {
        errors.push('Version phải >= 1');
      }
    }

    // Warnings
    if ('status' in data && data.status === 'RESIGNED' && !('left_at' in data)) {
      warnings.push('Nên set left_at khi status là RESIGNED');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  },
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Calculate statistics from members array
 */
export function calculateStatistics(members: TenantMember[]): MemberStatistics {
  const byRole: Record<MemberRole, number> = {
    OWNER: 0,
    ADMIN: 0,
    MEMBER: 0,
    VIEWER: 0,
  };

  const byStatus: Record<MemberStatus, number> = {
    ACTIVE: 0,
    RESIGNED: 0,
    ONBOARDING: 0,
    SUSPENDED: 0,
  };

  let activeCount = 0;
  let resignedCount = 0;
  let onboardingCount = 0;
  let suspendedCount = 0;
  let withManager = 0;
  let withEmployeeCode = 0;
  let totalTenureDays = 0;
  let membersWithTenure = 0;
  let recentJoiners = 0;
  let recentLeavers = 0;

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  members.forEach((member) => {
    // Count by role
    byRole[member.role]++;

    // Count by status
    byStatus[member.status]++;
    switch (member.status) {
      case 'ACTIVE':
        activeCount++;
        break;
      case 'RESIGNED':
        resignedCount++;
        break;
      case 'ONBOARDING':
        onboardingCount++;
        break;
      case 'SUSPENDED':
        suspendedCount++;
        break;
    }

    // Count with manager
    if (member.manager_id) {
      withManager++;
    }

    // Count with employee code
    if (member.employee_code) {
      withEmployeeCode++;
    }

    // Calculate tenure (only for active members)
    if (member.status === 'ACTIVE' && member.joined_at) {
      const joinDate = new Date(member.joined_at);
      const tenureDays = Math.floor((now.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24));
      totalTenureDays += tenureDays;
      membersWithTenure++;
    }

    // Count recent joiners
    if (member.joined_at && new Date(member.joined_at) >= thirtyDaysAgo) {
      recentJoiners++;
    }

    // Count recent leavers
    if (member.left_at && new Date(member.left_at) >= thirtyDaysAgo) {
      recentLeavers++;
    }
  });

  const avgTenureDays = membersWithTenure > 0 ? Math.round(totalTenureDays / membersWithTenure) : null;

  return {
    total_members: members.length,
    active_members: activeCount,
    resigned_members: resignedCount,
    onboarding_members: onboardingCount,
    suspended_members: suspendedCount,
    by_role: byRole,
    by_status: byStatus,
    with_manager: withManager,
    with_employee_code: withEmployeeCode,
    avg_tenure_days: avgTenureDays,
    recent_joiners: recentJoiners,
    recent_leavers: recentLeavers,
  };
}

/**
 * Get member role label
 */
export function getRoleLabel(role: MemberRole): string {
  const labels: Record<MemberRole, string> = {
    OWNER: 'Chủ sở hữu',
    ADMIN: 'Quản trị viên',
    MEMBER: 'Thành viên',
    VIEWER: 'Người xem',
  };
  return labels[role];
}

/**
 * Get member role color
 */
export function getRoleColor(role: MemberRole): string {
  const colors: Record<MemberRole, string> = {
    OWNER: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    ADMIN: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    MEMBER: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    VIEWER: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
  };
  return colors[role];
}

/**
 * Get member status label
 */
export function getStatusLabel(status: MemberStatus): string {
  const labels: Record<MemberStatus, string> = {
    ACTIVE: 'Hoạt động',
    RESIGNED: 'Đã nghỉ việc',
    ONBOARDING: 'Đang nhập môn',
    SUSPENDED: 'Bị đình chỉ',
  };
  return labels[status];
}

/**
 * Get member status color
 */
export function getStatusColor(status: MemberStatus): string {
  const colors: Record<MemberStatus, string> = {
    ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    RESIGNED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
    ONBOARDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    SUSPENDED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  };
  return colors[status];
}

/**
 * Get tenure in days (time since joined)
 */
export function getTenureDays(member: TenantMember): number | null {
  if (!member.joined_at) return null;

  const joinDate = new Date(member.joined_at);
  const now = new Date();
  const days = Math.floor((now.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24));

  return days;
}

/**
 * Check if member is new joiner (within 30 days)
 */
export function isNewJoiner(member: TenantMember): boolean {
  if (!member.joined_at) return false;

  const joinDate = new Date(member.joined_at);
  const now = new Date();
  const days = Math.floor((now.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24));

  return days <= 30 && days >= 0;
}

/**
 * Check if member is recent leaver (left within 30 days)
 */
export function isRecentLeaver(member: TenantMember): boolean {
  if (!member.left_at) return false;

  const leftDate = new Date(member.left_at);
  const now = new Date();
  const days = Math.floor((now.getTime() - leftDate.getTime()) / (1000 * 60 * 60 * 24));

  return days <= 30 && days >= 0;
}

/**
 * Format tenure for display
 */
export function formatTenure(member: TenantMember): string {
  const days = getTenureDays(member);

  if (days === null) return 'Chưa xác định';
  if (days === 0) return 'Hôm nay';
  if (days === 1) return '1 ngày';

  if (days < 30) return `${days} ngày`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months} tháng`;

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  if (remainingMonths === 0) return `${years} năm`;
  return `${years} năm ${remainingMonths} tháng`;
}

export default tenantMembersApi;
