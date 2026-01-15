/**
 * Dashboard API Client
 * Complex aggregation queries - Keep Supabase for now
 * TODO (Golang): Implement dedicated dashboard endpoints
 */

export interface DashboardStats {
  tenants_count: number;
  users_count: number;
  active_subscriptions: number;
  monthly_revenue: number;
  total_orders: number;
  pending_invoices: number;
}

export interface TenantDashboard {
  tenant_id: string;
  members_count: number;
  active_subscriptions: number;
  monthly_spending: number;
  storage_used_gb: number;
  api_calls_month: number;
}

export const dashboardApi = {
  /**
   * Get system-wide dashboard stats
   * TODO (Golang): Implement /dashboard/system endpoint
   */
  getSystemStats: async (): Promise<DashboardStats> => {
    // Complex aggregation - keep Supabase for now
    throw new Error('Not implemented - complex aggregation, migrate to Golang');
  },

  /**
   * Get tenant-specific dashboard
   * TODO (Golang): Implement /dashboard/tenant/:id endpoint
   */
  getTenantDashboard: async (tenantId: string): Promise<TenantDashboard> => {
    // Complex aggregation - keep Supabase for now
    throw new Error('Not implemented - complex aggregation, migrate to Golang');
  },

  /**
   * Get revenue analytics
   * TODO (Golang): Implement /dashboard/revenue endpoint
   */
  getRevenueAnalytics: async (startDate: string, endDate: string): Promise<any> => {
    // Complex aggregation - keep Supabase for now
    throw new Error('Not implemented - complex aggregation, migrate to Golang');
  },
};

export default dashboardApi;