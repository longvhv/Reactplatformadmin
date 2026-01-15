/**
 * Tenants API Client
 * Uses Adapter pattern - Ready for Golang migration
 */

import { createAdapter, BaseFilters } from './adapters';
import type { Tenant, TenantStatus, TenantTier } from '@/data/tenants';

// ==================== TYPES ====================

export interface CreateTenantRequest {
  code: string;
  name: string;
  parent_tenant_id?: string | null; // Fixed from parent_id
  partner_tenant_id?: string | null; // Added
  tier: TenantTier;
  status: TenantStatus;
  data_region: string; // Added - required in DB
  compliance_level: string; // Added - required in DB
  timezone?: string; // Added
  billing_type: string; // Added - required in DB
  profile?: Record<string, any>; // Added - required in DB (defaults to {})
  settings?: Record<string, any>; // Added - required in DB (defaults to {})
  created_by?: string; // Added
  metadata?: Record<string, any>; // Keep for backward compatibility
}

export interface UpdateTenantRequest {
  code?: string;
  name?: string;
  parent_tenant_id?: string | null; // Fixed from parent_id
  partner_tenant_id?: string | null; // Added
  tier?: TenantTier;
  status?: TenantStatus;
  data_region?: string; // Added
  compliance_level?: string; // Added
  timezone?: string; // Added
  billing_type?: string; // Added
  profile?: Record<string, any>; // Added
  settings?: Record<string, any>; // Added
  updated_by?: string; // Added
  metadata?: Record<string, any>; // Keep for backward compatibility
  version: number;
}

export interface TenantFilters extends BaseFilters {
  tier?: TenantTier;
  status?: TenantStatus;
  parent_tenant_id?: string; // Fixed from parent_id
  partner_tenant_id?: string; // Added
  data_region?: string; // Added
  compliance_level?: string; // Added
  billing_type?: string; // Added
}

export interface TenantStats {
  tenant_id: string;
  tenant_name: string;
  tenant_code: string;
  tier: string;
  status: string;
  created_at: string;
  members_count: number;
  active_members: number;
  departments_count: number;
  user_groups_count: number;
  locations_count: number;
  roles_count: number;
  active_subscriptions: number;
  monthly_revenue: number;
  total_orders: number;
  unpaid_invoices: number;
  app_routes_count: number;
  webhooks_count: number;
  rate_limits_count: number;
  sso_configs_count: number;
  storage_used_gb: number;
  api_calls_month: number;
  last_activity_at?: string;
}

export interface TenantActivity {
  _id: string;
  tenant_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  action: string;
  resource: string;
  details: string;
  ip_address: string;
  created_at: string;
}

export interface TenantMember {
  _id: string;
  user_id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  display_name?: string;
  status: 'ACTIVE' | 'INVITED' | 'SUSPENDED' | 'RESIGNED';
  joined_at: string;
  roles: string[];
  departments: string[];
  last_login_at?: string;
}

export interface TenantHierarchy {
  _id: string;
  code: string;
  name: string;
  tier: string;
  status: string;
  parent?: TenantHierarchy;
  children: TenantHierarchy[];
}

export interface TenantOverview {
  tenant: Tenant;
  stats: TenantStats;
  recentActivities: TenantActivity[];
}

// ==================== ADAPTER ====================

const adapter = createAdapter<Tenant, CreateTenantRequest, UpdateTenantRequest>(
  'tenants',
  '/tenants'
);

// ==================== API CLIENT ====================

export const tenantsApi = {
  /**
   * GET /tenants
   */
  getAll: async (filters?: TenantFilters): Promise<Tenant[]> => {
    return adapter.getAll(filters);
  },

  /**
   * GET /tenants/:id
   */
  getById: async (id: string): Promise<Tenant> => {
    return adapter.getById(id);
  },

  /**
   * POST /tenants
   */
  create: async (data: CreateTenantRequest): Promise<Tenant> => {
    return adapter.create(data);
  },

  /**
   * PATCH /tenants/:id
   */
  update: async (id: string, data: UpdateTenantRequest): Promise<Tenant> => {
    return adapter.update(id, data);
  },

  /**
   * DELETE /tenants/:id
   */
  delete: async (id: string): Promise<void> => {
    return adapter.delete(id);
  },

  /**
   * GET /tenants/:id/stats
   * TODO (Golang): Implement aggregation endpoint
   */
  getStats: async (id: string): Promise<TenantStats> => {
    // Complex aggregation - keep Supabase for now
    throw new Error('Not implemented - migrate to Golang');
  },

  /**
   * GET /tenants/:id/activities
   * TODO (Golang): Implement activities endpoint
   */
  getActivities: async (id: string, limit = 10): Promise<TenantActivity[]> => {
    // Complex query - keep Supabase for now
    throw new Error('Not implemented - migrate to Golang');
  },

  /**
   * GET /tenants/:id/members
   * TODO (Golang): Implement members endpoint
   */
  getMembers: async (id: string): Promise<TenantMember[]> => {
    // Complex query - keep Supabase for now
    throw new Error('Not implemented - migrate to Golang');
  },

  /**
   * GET /tenants/hierarchy
   * TODO (Golang): Implement hierarchy endpoint
   */
  getHierarchy: async (): Promise<TenantHierarchy[]> => {
    // Complex query - keep Supabase for now
    throw new Error('Not implemented - migrate to Golang');
  },

  /**
   * GET /tenants/:id/overview
   * TODO (Golang): Implement overview endpoint
   */
  getOverview: async (id: string): Promise<TenantOverview> => {
    // Complex aggregation - keep Supabase for now
    throw new Error('Not implemented - migrate to Golang');
  },
};

/**
 * React Hooks
 */

import { useState, useEffect } from 'react';

export function useTenants(params?: TenantFilters) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTenants = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await tenantsApi.getAll(params);
        setTenants(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch tenants');
      } finally {
        setLoading(false);
      }
    };

    fetchTenants();
  }, [JSON.stringify(params)]);

  return { tenants, loading, error, refetch: () => tenantsApi.getAll(params) };
}

export function useTenant(id?: string) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // ✅ Skip fetching for "new" or empty id
    if (!id || id === 'new') {
      setLoading(false);
      return;
    }

    const fetchTenant = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('🔍 [useTenant] Fetching tenant:', id);
        const data = await tenantsApi.getById(id);
        console.log('✅ [useTenant] Tenant loaded:', data);
        setTenant(data);
      } catch (err) {
        console.error('❌ [useTenant] Error fetching tenant:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch tenant');
      } finally {
        setLoading(false);
      }
    };

    fetchTenant();
  }, [id]);

  const updateTenant = async (data: UpdateTenantRequest) => {
    if (!id) return;
    await tenantsApi.update(id, data);
    const updated = await tenantsApi.getById(id);
    setTenant(updated);
  };

  const deleteTenant = async () => {
    if (!id) return;
    await tenantsApi.delete(id);
  };

  return { 
    tenant, 
    loading, 
    error, 
    updateTenant, 
    deleteTenant,
    refetch: () => id ? tenantsApi.getById(id) : null,
  };
}

export function useTenantStats(id?: string) {
  const [stats, setStats] = useState<TenantStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await tenantsApi.getStats(id);
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [id]);

  return { stats, loading, error, refetch: () => id ? tenantsApi.getStats(id) : null };
}

export function useTenantActivities(id?: string, limit: number = 50) {
  const [activities, setActivities] = useState<TenantActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchActivities = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await tenantsApi.getActivities(id, limit, 0);
        setActivities(data);
        setHasMore(data.length === limit);
        setOffset(limit);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch activities');
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [id, limit]);

  const loadMore = async () => {
    if (!id || !hasMore) return;

    try {
      const data = await tenantsApi.getActivities(id, limit, offset);
      setActivities([...activities, ...data]);
      setHasMore(data.length === limit);
      setOffset(offset + limit);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more activities');
    }
  };

  return { activities, loading, error, hasMore, loadMore };
}

/**
 * Export everything
 */
export default tenantsApi;