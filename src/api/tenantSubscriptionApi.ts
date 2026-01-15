/**
 * Tenant Subscription API Client
 */
import { createAdapter, BaseFilters } from './adapters';

// ==================== TYPES ====================

export type SubscriptionStatus = 'pending' | 'active' | 'suspended' | 'cancelled' | 'expired';
export type BillingCycle = 'monthly' | 'quarterly' | 'yearly';
export type PaymentStatus = 'unpaid' | 'paid' | 'overdue' | 'refunded';

export interface TenantSubscription {
  _id: string;
  tenant_id: string;
  package_id: string;
  subscription_number?: string;
  subscription_name?: string;
  status: SubscriptionStatus;
  start_date: string;
  end_date?: string;
  billing_cycle?: BillingCycle;
  payment_status?: PaymentStatus;
  auto_renew: boolean;
  is_trial?: boolean;
  base_price?: number;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  version: number;
}

export interface CreateSubscriptionRequest {
  tenant_id: string;
  package_id: string;
  start_date: string;
  end_date?: string;
  auto_renew?: boolean;
  metadata?: Record<string, any>;
}

export interface UpdateSubscriptionRequest {
  status?: 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' | 'EXPIRED';
  end_date?: string;
  auto_renew?: boolean;
  metadata?: Record<string, any>;
  version: number;
}

export interface SubscriptionFilters extends BaseFilters {
  tenant_id?: string;
  package_id?: string;
  status?: string;
}

export interface SubscriptionStatistics {
  total_subscriptions: number;
  active_subscriptions: number;
  suspended_subscriptions: number;
  cancelled_subscriptions: number;
  expired_subscriptions: number;
  total_mrr: number;
  total_arr: number;
}

const adapter = createAdapter<TenantSubscription, CreateSubscriptionRequest, UpdateSubscriptionRequest>(
  'tenant_subscriptions',
  '/tenant-subscriptions'
);

// ==================== HELPER FUNCTIONS ====================

/**
 * Generate subscription number
 * Format: SUB-YYYYMMDD-XXXXX
 */
export async function generateSubscriptionNumber(): Promise<string> {
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `SUB-${dateStr}-${random}`;
}

/**
 * Legacy function names for backward compatibility
 */
export const getTenantSubscriptions = (filters?: SubscriptionFilters) => adapter.getAll(filters);
export const getTenantSubscriptionById = (id: string) => adapter.getById(id);
export const createTenantSubscription = (data: CreateSubscriptionRequest) => adapter.create(data);
export const updateTenantSubscription = (id: string, data: UpdateSubscriptionRequest) => adapter.update(id, data);
export const deleteTenantSubscription = (id: string) => adapter.delete(id);

/**
 * Get subscription statistics
 * TODO (Golang): Implement /tenant-subscriptions/statistics endpoint
 */
export const getTenantSubscriptionStatistics = async (): Promise<SubscriptionStatistics> => {
  // Mock implementation - calculate from current data
  try {
    const subscriptions = await adapter.getAll();
    
    const stats: SubscriptionStatistics = {
      total_subscriptions: subscriptions.length,
      active_subscriptions: subscriptions.filter(s => s.status === 'active').length,
      suspended_subscriptions: subscriptions.filter(s => s.status === 'suspended').length,
      cancelled_subscriptions: subscriptions.filter(s => s.status === 'cancelled').length,
      expired_subscriptions: subscriptions.filter(s => s.status === 'expired').length,
      total_mrr: subscriptions
        .filter(s => s.status === 'active' && s.billing_cycle === 'monthly')
        .reduce((sum, s) => sum + (s.base_price || 0), 0),
      total_arr: subscriptions
        .filter(s => s.status === 'active' && s.billing_cycle === 'yearly')
        .reduce((sum, s) => sum + (s.base_price || 0), 0),
    };
    
    return stats;
  } catch (error) {
    console.error('Error calculating statistics:', error);
    // Return default stats on error
    return {
      total_subscriptions: 0,
      active_subscriptions: 0,
      suspended_subscriptions: 0,
      cancelled_subscriptions: 0,
      expired_subscriptions: 0,
      total_mrr: 0,
      total_arr: 0,
    };
  }
};

// ==================== API CLIENT ====================

export const tenantSubscriptionApi = {
  getAll: (filters?: SubscriptionFilters) => adapter.getAll(filters),
  getById: (id: string) => adapter.getById(id),
  create: (data: CreateSubscriptionRequest) => adapter.create(data),
  update: (id: string, data: UpdateSubscriptionRequest) => adapter.update(id, data),
  delete: (id: string) => adapter.delete(id),
};

export default tenantSubscriptionApi;