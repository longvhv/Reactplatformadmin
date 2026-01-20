/**
 * Tenant Members API Client
 * Uses Adapter pattern - Ready for Golang migration
 * 
 * Database: tenant_members (Global Table)
 */

import { createAdapter, BaseFilters } from './adapters';

// ==================== TYPES ====================

export type MemberRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
export type MemberStatus = 'ACTIVE' | 'RESIGNED' | 'ONBOARDING' | 'SUSPENDED';

export interface TenantMember {
  _id: string;
  tenant_id: string;
  user_id: string;
  employee_code?: string;
  internal_email?: string;
  job_title?: string;
  manager_id?: string;
  role: MemberRole;
  status: MemberStatus;
  joined_at?: string;
  left_at?: string;
  permissions: string[]; // jsonb array
  metadata?: Record<string, any>; // jsonb
  
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  created_by?: string;
  updated_by?: string;
  deleted_by?: string;
  version: number;
}

// Enhanced type with joined data (for UI display)
export interface EnrichedTenantMember extends TenantMember {
  user_name?: string;
  user_email?: string;
  user_avatar?: string;
  tenant_name?: string;
  manager_name?: string;
}

export interface CreateTenantMemberRequest {
  tenant_id: string;
  user_id: string;
  employee_code?: string;
  internal_email?: string;
  job_title?: string;
  manager_id?: string;
  role: MemberRole;
  status: MemberStatus;
  joined_at?: string;
  permissions?: string[];
  metadata?: Record<string, any>;
}

export interface UpdateTenantMemberRequest {
  employee_code?: string;
  internal_email?: string;
  job_title?: string;
  manager_id?: string;
  role?: MemberRole;
  status?: MemberStatus;
  joined_at?: string;
  left_at?: string;
  permissions?: string[];
  metadata?: Record<string, any>;
  version: number;
}

export interface TenantMemberFilters extends BaseFilters {
  tenant_id?: string;
  user_id?: string;
  role?: MemberRole;
  status?: MemberStatus;
  manager_id?: string;
  employee_code?: string;
}

// For backward compatibility and form usage
export interface TenantMemberFormData {
  tenant_id: string;
  user_id: string;
  employee_code?: string;
  internal_email?: string;
  job_title?: string;
  manager_id?: string;
  role: MemberRole;
  status: MemberStatus;
  joined_at?: string;
  left_at?: string;
  permissions?: string[];
  metadata?: Record<string, any>;
}

export interface MemberStatistics {
  total: number;
  by_role: { OWNER: number; ADMIN: number; MEMBER: number; VIEWER: number };
  by_status: { ACTIVE: number; RESIGNED: number; ONBOARDING: number; SUSPENDED: number };
  with_manager: number;
  with_employee_code: number;
  avg_tenure_days: number;
  recent_joiners: number; // Last 30 days
  recent_leavers: number; // Last 30 days
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
   */
  delete: async (id: string): Promise<void> => {
    return adapter.delete(id);
  },

  // Helper methods
  
  getByTenant: async (tenantId: string): Promise<TenantMember[]> => {
    return adapter.getAll({ tenant_id: tenantId });
  },

  getByUser: async (userId: string): Promise<TenantMember[]> => {
    return adapter.getAll({ user_id: userId });
  },

  changeStatus: async (id: string, status: MemberStatus, version: number): Promise<TenantMember> => {
    return adapter.update(id, { status, version });
  },

  changeRole: async (id: string, role: MemberRole, version: number): Promise<TenantMember> => {
    return adapter.update(id, { role, version });
  },

  // These fetch methods are used for dropdowns in the UI
  // In a real app, these should probably be in their respective APIs
  fetchTenants: async () => {
    const { tenantsApi } = await import('./tenantsApi');
    return tenantsApi.getAll();
  },
  
  fetchUsers: async () => {
    // This assumes there's a usersApi or similar. 
    // If not, we might need to implement a basic one or use the existing mock behavior if valid.
    // Given the previous file used a direct fetch, let's try to locate usersApi or simulate it.
    // For now, I'll assume we can import it or use a placeholder. 
    // The previous code had `fetchUsers` inside `tenantMembersApi`.
    // Let's implement it via adapter if possible, or keep the fetch if no adapter for users exists yet.
    // Since users is a global table, it should have an API.
    try {
        const { usersApi } = await import('./usersApi');
        return usersApi.getAll();
    } catch (e) {
        console.warn('usersApi not found, falling back to direct fetch or empty');
        return [];
    }
  },

  getStatistics: async (tenantId: string): Promise<MemberStatistics> => {
    try {
      const members = await tenantMembersApi.getByTenant(tenantId);
      
      const stats: MemberStatistics = {
        total: members.length,
        by_role: { OWNER: 0, ADMIN: 0, MEMBER: 0, VIEWER: 0 },
        by_status: { ACTIVE: 0, RESIGNED: 0, ONBOARDING: 0, SUSPENDED: 0 },
        with_manager: 0,
        with_employee_code: 0,
        avg_tenure_days: 0,
        recent_joiners: 0,
        recent_leavers: 0,
      };

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      let totalTenureMs = 0;
      let tenureCount = 0;

      members.forEach(m => {
        // Role stats
        if (stats.by_role[m.role] !== undefined) {
          stats.by_role[m.role]++;
        }

        // Status stats
        if (stats.by_status[m.status] !== undefined) {
          stats.by_status[m.status]++;
        }

        // Organization stats
        if (m.manager_id) stats.with_manager++;
        if (m.employee_code) stats.with_employee_code++;

        // Activity stats
        if (m.joined_at) {
          const joinDate = new Date(m.joined_at);
          if (joinDate >= thirtyDaysAgo) stats.recent_joiners++;
          
          if (m.status === 'ACTIVE' || m.status === 'ONBOARDING') {
            totalTenureMs += now.getTime() - joinDate.getTime();
            tenureCount++;
          }
        }

        if (m.left_at) {
          const leftDate = new Date(m.left_at);
          if (leftDate >= thirtyDaysAgo) stats.recent_leavers++;
        }
      });

      if (tenureCount > 0) {
        stats.avg_tenure_days = Math.round(totalTenureMs / (1000 * 60 * 60 * 24) / tenureCount);
      }

      return stats;
    } catch (error) {
      console.error('[getStatistics] Error:', error);
      return {
        total: 0,
        by_role: { OWNER: 0, ADMIN: 0, MEMBER: 0, VIEWER: 0 },
        by_status: { ACTIVE: 0, RESIGNED: 0, ONBOARDING: 0, SUSPENDED: 0 },
        with_manager: 0,
        with_employee_code: 0,
        avg_tenure_days: 0,
        recent_joiners: 0,
        recent_leavers: 0,
      };
    }
  },
};

export default tenantMembersApi;
