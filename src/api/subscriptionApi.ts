/**
 * Subscription API Client
 * Uses Adapter pattern - Ready for Golang migration
 */

import { createAdapter, BaseFilters } from './adapters';

// ==================== TYPES ====================

export interface TenantSubscription {
  _id: string;
  tenant_id: string;
  package_id: string;
  price_amount: number;
  currency_code: string;
  granted_entitlements: Record<string, any>;
  granted_app_codes: string[];
  start_at: string;
  end_at?: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PAST_DUE';
  version: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
  
  // Joined fields
  tenant_name?: string;
  package_name?: string;
  package_code?: string;
}

export interface CreateSubscriptionRequest {
  tenant_id: string;
  package_id: string;
  price_amount: number;
  currency_code: string;
  granted_entitlements?: Record<string, any>;
  start_at: string;
  end_at?: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PAST_DUE';
}

export interface UpdateSubscriptionRequest {
  price_amount?: number;
  granted_entitlements?: Record<string, any>;
  end_at?: string;
  status?: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PAST_DUE';
  version: number;
}

export interface SubscriptionFilters extends BaseFilters {
  status?: string;
  tenant_id?: string;
  package_id?: string;
  app_code?: string;
  expiring_soon?: number;
}

export interface SubscriptionStatistics {
  total_subscriptions: number;
  active_subscriptions: number;
  expired_subscriptions: number;
  cancelled_subscriptions: number;
  past_due_subscriptions: number;
  total_revenue: number;
  average_price: number;
}

// ==================== ADAPTER ====================

const adapter = createAdapter<TenantSubscription, CreateSubscriptionRequest, UpdateSubscriptionRequest>(
  'tenant_subscriptions',
  '/tenant-subscriptions'
);

// ==================== API CLIENT ====================

export const subscriptionApi = {
  /**
   * GET /tenant-subscriptions
   */
  getAll: async (filters?: SubscriptionFilters): Promise<TenantSubscription[]> => {
    return adapter.getAll(filters);
  },

  /**
   * GET /tenant-subscriptions/:id
   */
  getById: async (id: string): Promise<TenantSubscription> => {
    return adapter.getById(id);
  },

  /**
   * POST /tenant-subscriptions
   */
  create: async (data: CreateSubscriptionRequest): Promise<TenantSubscription> => {
    return adapter.create(data);
  },

  /**
   * PATCH /tenant-subscriptions/:id
   */
  update: async (id: string, data: UpdateSubscriptionRequest): Promise<TenantSubscription> => {
    return adapter.update(id, data);
  },

  /**
   * DELETE /tenant-subscriptions/:id
   */
  delete: async (id: string): Promise<void> => {
    return adapter.delete(id);
  },

  /**
   * GET /tenants/:tenantId/subscriptions
   * TODO (Golang): Implement dedicated endpoint
   */
  getByTenant: async (tenantId: string, status?: string): Promise<TenantSubscription[]> => {
    return adapter.getAll({ tenant_id: tenantId, status });
  },

  /**
   * GET /tenant-subscriptions/statistics
   * TODO (Golang): Implement aggregation endpoint
   */
  getStatistics: async (): Promise<SubscriptionStatistics> => {
    // Mock implementation - calculate from current data
    try {
      const subscriptions = await adapter.getAll();
      
      const stats: SubscriptionStatistics = {
        total_subscriptions: subscriptions.length,
        active_subscriptions: subscriptions.filter(s => s.status === 'ACTIVE').length,
        expired_subscriptions: subscriptions.filter(s => s.status === 'EXPIRED').length,
        cancelled_subscriptions: subscriptions.filter(s => s.status === 'CANCELLED').length,
        past_due_subscriptions: subscriptions.filter(s => s.status === 'PAST_DUE').length,
        total_revenue: subscriptions
          .filter(s => s.status === 'ACTIVE')
          .reduce((sum, s) => sum + s.price_amount, 0),
        average_price: subscriptions.length > 0
          ? subscriptions.reduce((sum, s) => sum + s.price_amount, 0) / subscriptions.length
          : 0,
      };
      
      return stats;
    } catch (error) {
      console.error('Error calculating statistics:', error);
      // Return default stats on error
      return {
        total_subscriptions: 0,
        active_subscriptions: 0,
        expired_subscriptions: 0,
        cancelled_subscriptions: 0,
        past_due_subscriptions: 0,
        total_revenue: 0,
        average_price: 0,
      };
    }
  },

  /**
   * POST /tenant-subscriptions/:id/check-access
   * TODO (Golang): Implement access check endpoint
   */
  checkAppAccess: async (id: string, appCode: string): Promise<{ has_access: boolean; app_code: string; status: string }> => {
    throw new Error('Not implemented - migrate to Golang endpoint');
  },

  /**
   * Get statistics for a specific package
   * Calculate from current subscription data
   */
  getPackageStats: async (packageId: string): Promise<{ totalSubscriptions: number; activeSubscriptions: number; totalRevenue: number }> => {
    try {
      const subscriptions = await adapter.getAll({ package_id: packageId });
      
      const activeSubscriptions = subscriptions.filter(s => s.status === 'ACTIVE');
      const totalRevenue = activeSubscriptions.reduce((sum, s) => sum + s.price_amount, 0);
      
      return {
        totalSubscriptions: subscriptions.length,
        activeSubscriptions: activeSubscriptions.length,
        totalRevenue,
      };
    } catch (error) {
      console.error('Error calculating package stats:', error);
      return {
        totalSubscriptions: 0,
        activeSubscriptions: 0,
        totalRevenue: 0,
      };
    }
  },
};

// Export both subscriptionApi and subscriptionsApi for compatibility
export const subscriptionsApi = subscriptionApi;

export default subscriptionApi;