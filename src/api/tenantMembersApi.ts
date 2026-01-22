/**
 * Tenant Members API Client
 * Uses Adapter pattern - Ready for Golang migration
 * 
 * Database: tenant_members (Global Table)
 * ✅ ENHANCED: Includes user details via join
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

// Enhanced type with joined data
export interface EnrichedTenantMember extends TenantMember {
  user?: {
    full_name: string;
    email: string;
    avatar_url?: string;
  };
  manager?: {
    _id: string;
    user?: {
      full_name: string;
    };
  };
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
  getById: async (id: string): Promise<EnrichedTenantMember> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();
    
    // Fetch with joins
    const { data, error } = await supabase
      .from('tenant_members')
      .select(`
        *,
        user:users!user_id(full_name, email, avatar_url),
        manager:tenant_members!manager_id(
          _id,
          user:users!user_id(full_name)
        )
      `)
      .eq('_id', id)
      .single();
      
    if (error || !data) {
      // Fallback to adapter if join fails or just simple get
      return adapter.getById(id) as Promise<EnrichedTenantMember>;
    }
    
    return data as EnrichedTenantMember;
  },

  /**
   * POST /tenant-members
   */
  create: async (data: CreateTenantMemberRequest): Promise<TenantMember> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    // Generate UUID
    const _id = crypto.randomUUID();

    // Prepare data
    const requestData = {
      _id,
      tenant_id: data.tenant_id,
      user_id: data.user_id,
      employee_code: data.employee_code || null,
      internal_email: data.internal_email || null,
      job_title: data.job_title || null,
      manager_id: data.manager_id || null,
      role: data.role || 'MEMBER',
      status: data.status || 'ACTIVE',
      joined_at: data.joined_at || null,
      permissions: data.permissions || [],
      metadata: data.metadata || {},
      version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: created, error } = await supabase
      .from('tenant_members')
      .insert([requestData])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create tenant member: ${error.message}`);
    }

    return created;
  },

  /**
   * PATCH /tenant-members/:id
   */
  update: async (id: string, data: UpdateTenantMemberRequest): Promise<TenantMember> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    // Optimistic locking logic
    let currentVersion = data.version;

    if (!currentVersion) {
        const { data: current, error: fetchError } = await supabase
            .from('tenant_members')
            .select('version')
            .eq('_id', id)
            .single();
            
        if (fetchError || !current) {
            throw new Error(`Tenant member not found: ${fetchError?.message || 'Unknown error'}`);
        }
        currentVersion = current.version;
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
      version: currentVersion + 1,
    };

    if (data.employee_code !== undefined) updateData.employee_code = data.employee_code;
    if (data.internal_email !== undefined) updateData.internal_email = data.internal_email;
    if (data.job_title !== undefined) updateData.job_title = data.job_title;
    if (data.manager_id !== undefined) updateData.manager_id = data.manager_id;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.joined_at !== undefined) updateData.joined_at = data.joined_at;
    if (data.left_at !== undefined) updateData.left_at = data.left_at;
    if (data.permissions !== undefined) updateData.permissions = data.permissions;
    if (data.metadata !== undefined) updateData.metadata = data.metadata;

    const { data: updated, error } = await supabase
      .from('tenant_members')
      .update(updateData)
      .eq('_id', id)
      .eq('version', currentVersion)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update tenant member: ${error.message}`);
    }

    if (!updated) {
      throw new Error('Concurrent modification detected. Please refresh and try again.');
    }

    return updated;
  },

  /**
   * DELETE /tenant-members/:id
   */
  delete: async (id: string): Promise<void> => {
    return adapter.delete(id);
  },

  // Helper methods
  
  getByTenant: async (tenantId: string): Promise<EnrichedTenantMember[]> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();
    
    // Join with users and manager details
    // Note: 'users!user_id' specifies the foreign key relationship
    // 'tenant_members!manager_id' specifies self-referencing relationship
    const { data, error } = await supabase
      .from('tenant_members')
      .select(`
        *,
        user:users!user_id(full_name, email, avatar_url),
        manager:tenant_members!manager_id(
          _id,
          user:users!user_id(full_name)
        )
      `)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.warn('Failed to fetch enriched members, falling back to simple fetch', error);
      return adapter.getAll({ tenant_id: tenantId }) as Promise<EnrichedTenantMember[]>;
    }
    
    return (data || []) as EnrichedTenantMember[];
  },

  getByUser: async (userId: string): Promise<TenantMember[]> => {
    return adapter.getAll({ user_id: userId });
  },

  changeStatus: async (id: string, status: MemberStatus, version: number): Promise<TenantMember> => {
    return tenantMembersApi.update(id, { status, version });
  },

  changeRole: async (id: string, role: MemberRole, version: number): Promise<TenantMember> => {
    return tenantMembersApi.update(id, { role, version });
  },

  // These fetch methods are used for dropdowns in the UI
  fetchTenants: async () => {
    const { tenantsApi } = await import('./tenantsApi');
    return tenantsApi.getAll();
  },
  
  fetchUsers: async () => {
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
