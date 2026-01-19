import { projectId, publicAnonKey } from '@/utils/supabase/info';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-7eedb4e0/api/core`;

// ============================================
// TYPES
// ============================================

export type MemberRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
export type MemberStatus = 'ACTIVE' | 'RESIGNED' | 'ONBOARDING' | 'SUSPENDED';

export interface TenantMember {
  _id: string;
  tenant_id: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  user_avatar?: string;
  employee_code?: string;
  internal_email?: string;
  job_title?: string;
  manager_id?: string;
  manager?: {
    full_name: string;
  };
  role: MemberRole;
  status: MemberStatus;
  joined_at?: string;
  left_at?: string;
  created_at: string;
  updated_at: string;
  user?: {
    full_name: string;
    email: string;
  };
}

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

export const tenantMembersApi = {
  getAll: async (): Promise<TenantMember[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/tenant-members`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch tenant members');
      }

      const result = await response.json();
      const members = result.data || [];
      
      // Cache to localStorage
      localStorage.setItem('tenant_members_cache', JSON.stringify(members));
      
      return members;
    } catch (error) {
      console.error('[fetchTenantMembers] Error:', error);
      
      // Fallback to localStorage
      const cached = localStorage.getItem('tenant_members_cache');
      if (cached) {
        return JSON.parse(cached);
      }
      
      return [];
    }
  },

  getByTenant: async (tenantId: string): Promise<TenantMember[]> => {
    try {
      // In a real app, this should be a query param: ?tenant_id=${tenantId}
      // For now, we fetch all and filter client-side if the API doesn't support it
      // However, usually GET /tenant-members returns all members the user has access to
      const allMembers = await tenantMembersApi.getAll();
      return allMembers.filter(m => m.tenant_id === tenantId);
    } catch (error) {
      console.error('[getByTenant] Error:', error);
      throw error;
    }
  },

  getById: async (id: string): Promise<TenantMember> => {
    try {
      const response = await fetch(`${API_BASE_URL}/tenant-members/${id}`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch tenant member details');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('[getById] Error:', error);
      throw error;
    }
  },

  create: async (data: TenantMemberFormData): Promise<TenantMember> => {
    try {
      const response = await fetch(`${API_BASE_URL}/tenant-members`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create tenant member');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('[createTenantMember] Error:', error);
      throw error;
    }
  },

  update: async (id: string, data: Partial<TenantMemberFormData>): Promise<TenantMember> => {
    try {
      const response = await fetch(`${API_BASE_URL}/tenant-members/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update tenant member');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('[updateTenantMember] Error:', error);
      throw error;
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/tenant-members/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete tenant member');
      }
    } catch (error) {
      console.error('[deleteTenantMember] Error:', error);
      throw error;
    }
  },

  changeStatus: async (id: string, status: MemberStatus): Promise<TenantMember> => {
    return tenantMembersApi.update(id, { status } as any);
  },

  changeRole: async (id: string, role: MemberRole): Promise<TenantMember> => {
    return tenantMembersApi.update(id, { role } as any);
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
      // Return empty stats on error
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
  
  fetchTenants: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/tenants`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      });
  
      if (!response.ok) throw new Error('Failed to fetch tenants');
      
      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('[fetchTenants] Error:', error);
      
      // Fallback to localStorage
      const cached = localStorage.getItem('tenants_cache');
      if (cached) {
        return JSON.parse(cached);
      }
      
      return [];
    }
  },
  
  fetchUsers: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      });
  
      if (!response.ok) throw new Error('Failed to fetch users');
      
      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('[fetchUsers] Error:', error);
      
      // Fallback to localStorage
      const cached = localStorage.getItem('users_cache');
      if (cached) {
        return JSON.parse(cached);
      }
      
      return [];
    }
  }
};
