/**
 * Tenant Subscription API
 * Complete CRUD operations with Supabase integration and localStorage persistence
 * Version: 1.0.0
 */

import { getSupabaseClient } from '../utils/supabase/client';

const TABLE_NAME = 'tenant_subscriptions';
const STORAGE_KEY = 'tenant_subscriptions_cache';

// ============================================
// Types & Interfaces
// ============================================

export type SubscriptionStatus = 'active' | 'trial' | 'suspended' | 'expired' | 'cancelled' | 'pending';
export type BillingCycle = 'monthly' | 'quarterly' | 'yearly' | 'custom';
export type PaymentStatus = 'paid' | 'unpaid' | 'partially_paid' | 'failed' | 'refunded';

export interface SubscriptionFeature {
  name: string;
  enabled: boolean;
  limit?: number;
}

export interface SubscriptionLimits {
  api_calls_per_month?: number;
  concurrent_sessions?: number;
  max_projects?: number;
  max_team_members?: number;
  [key: string]: any;
}

export interface TenantSubscription {
  _id?: string;
  tenant_id: string;
  plan_id?: string | null;
  order_id?: string | null;
  
  // Identification
  subscription_number: string;
  subscription_name: string;
  
  // Period
  start_date: string;
  end_date: string;
  trial_end_date?: string | null;
  renewal_date?: string | null;
  
  // Status
  status: SubscriptionStatus;
  auto_renew: boolean;
  is_trial: boolean;
  
  // Pricing
  plan_name?: string;
  billing_cycle: BillingCycle;
  base_price: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  
  // Capacity
  max_users: number;
  current_users: number;
  max_storage_gb: number;
  current_storage_gb: number;
  
  // Features & Limits
  features?: any[];
  limits?: SubscriptionLimits;
  
  // Payment
  payment_method?: string;
  payment_status: PaymentStatus;
  last_payment_date?: string | null;
  next_payment_date?: string | null;
  
  // Contact
  billing_contact_name?: string;
  billing_contact_email?: string;
  billing_contact_phone?: string;
  
  // Additional
  notes?: string;
  metadata?: Record<string, any>;
  tags?: string[];
  
  // Audit Trail
  created_at?: string;
  created_by?: string;
  updated_at?: string;
  updated_by?: string;
  deleted_at?: string | null;
  deleted_by?: string | null;
  version?: number;
}

export interface SubscriptionFilters {
  tenant_id?: string;
  status?: SubscriptionStatus;
  billing_cycle?: BillingCycle;
  payment_status?: PaymentStatus;
  plan_name?: string;
  search?: string;
  start_date_from?: string;
  start_date_to?: string;
  end_date_from?: string;
  end_date_to?: string;
  is_trial?: boolean;
  auto_renew?: boolean;
  currency?: string;
}

export interface SubscriptionStatistics {
  total: number;
  active: number;
  trial: number;
  suspended: number;
  expired: number;
  cancelled: number;
  pending: number;
  total_revenue: number;
  monthly_recurring_revenue: number;
  average_subscription_value: number;
}

// ============================================
// Local Storage Helper Functions
// ============================================

const getFromStorage = (): TenantSubscription[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return [];
  }
};

const saveToStorage = (data: TenantSubscription[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

const clearStorage = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing localStorage:', error);
  }
};

// ============================================
// CRUD Operations
// ============================================

/**
 * 1. Get all tenant subscriptions with filters
 */
export const getTenantSubscriptions = async (
  filters?: SubscriptionFilters
): Promise<{ data: TenantSubscription[]; error: any }> => {
  try {
    const supabase = getSupabaseClient();
    let query = supabase
      .from(TABLE_NAME)
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters?.tenant_id) {
      query = query.eq('tenant_id', filters.tenant_id);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.billing_cycle) {
      query = query.eq('billing_cycle', filters.billing_cycle);
    }
    if (filters?.payment_status) {
      query = query.eq('payment_status', filters.payment_status);
    }
    if (filters?.plan_name) {
      query = query.ilike('plan_name', `%${filters.plan_name}%`);
    }
    if (filters?.is_trial !== undefined) {
      query = query.eq('is_trial', filters.is_trial);
    }
    if (filters?.auto_renew !== undefined) {
      query = query.eq('auto_renew', filters.auto_renew);
    }
    if (filters?.currency) {
      query = query.eq('currency', filters.currency);
    }
    if (filters?.start_date_from) {
      query = query.gte('start_date', filters.start_date_from);
    }
    if (filters?.start_date_to) {
      query = query.lte('start_date', filters.start_date_to);
    }
    if (filters?.end_date_from) {
      query = query.gte('end_date', filters.end_date_from);
    }
    if (filters?.end_date_to) {
      query = query.lte('end_date', filters.end_date_to);
    }
    if (filters?.search) {
      query = query.or(
        `subscription_number.ilike.%${filters.search}%,` +
        `subscription_name.ilike.%${filters.search}%,` +
        `billing_contact_email.ilike.%${filters.search}%`
      );
    }

    const { data, error } = await query;

    if (error) throw error;

    // Save to localStorage
    saveToStorage(data || []);

    return { data: data || [], error: null };
  } catch (error: any) {
    console.error('Error fetching subscriptions:', error);
    // Fallback to localStorage
    const cached = getFromStorage();
    return { data: cached, error };
  }
};

/**
 * 2. Get subscription by ID
 */
export const getTenantSubscriptionById = async (
  id: string
): Promise<{ data: TenantSubscription | null; error: any }> => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('_id', id)
      .is('deleted_at', null)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Error fetching subscription by ID:', error);
    // Fallback to localStorage
    const cached = getFromStorage();
    const item = cached.find(s => s._id === id);
    return { data: item || null, error };
  }
};

/**
 * 3. Get subscription by subscription number
 */
export const getTenantSubscriptionByNumber = async (
  subscriptionNumber: string
): Promise<{ data: TenantSubscription | null; error: any }> => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('subscription_number', subscriptionNumber)
      .is('deleted_at', null)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Error fetching subscription by number:', error);
    return { data: null, error };
  }
};

/**
 * 4. Create new subscription
 */
export const createTenantSubscription = async (
  subscription: Omit<TenantSubscription, '_id' | 'created_at' | 'updated_at' | 'version'>
): Promise<{ data: TenantSubscription | null; error: any }> => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert([subscription])
      .select()
      .single();

    if (error) throw error;

    // Update localStorage
    const cached = getFromStorage();
    saveToStorage([data, ...cached]);

    return { data, error: null };
  } catch (error: any) {
    console.error('Error creating subscription:', error);
    return { data: null, error };
  }
};

/**
 * 5. Update subscription
 */
export const updateTenantSubscription = async (
  id: string,
  updates: Partial<TenantSubscription>
): Promise<{ data: TenantSubscription | null; error: any }> => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update(updates)
      .eq('_id', id)
      .select()
      .single();

    if (error) throw error;

    // Update localStorage
    const cached = getFromStorage();
    const updated = cached.map(s => s._id === id ? data : s);
    saveToStorage(updated);

    return { data, error: null };
  } catch (error: any) {
    console.error('Error updating subscription:', error);
    return { data: null, error };
  }
};

/**
 * 6. Delete subscription (soft delete)
 */
export const deleteTenantSubscription = async (
  id: string
): Promise<{ success: boolean; error: any }> => {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from(TABLE_NAME)
      .update({ deleted_at: new Date().toISOString() })
      .eq('_id', id);

    if (error) throw error;

    // Update localStorage
    const cached = getFromStorage();
    const filtered = cached.filter(s => s._id !== id);
    saveToStorage(filtered);

    return { success: true, error: null };
  } catch (error: any) {
    console.error('Error deleting subscription:', error);
    return { success: false, error };
  }
};

/**
 * 7. Bulk delete subscriptions
 */
export const bulkDeleteTenantSubscriptions = async (
  ids: string[]
): Promise<{ success: boolean; error: any }> => {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from(TABLE_NAME)
      .update({ deleted_at: new Date().toISOString() })
      .in('_id', ids);

    if (error) throw error;

    // Update localStorage
    const cached = getFromStorage();
    const filtered = cached.filter(s => !ids.includes(s._id || ''));
    saveToStorage(filtered);

    return { success: true, error: null };
  } catch (error: any) {
    console.error('Error bulk deleting subscriptions:', error);
    return { success: false, error };
  }
};

/**
 * 8. Get subscription statistics
 */
export const getTenantSubscriptionStatistics = async (
  filters?: SubscriptionFilters
): Promise<{ data: SubscriptionStatistics | null; error: any }> => {
  try {
    const { data: subscriptions, error } = await getTenantSubscriptions(filters);
    if (error) throw error;

    const stats: SubscriptionStatistics = {
      total: subscriptions.length,
      active: subscriptions.filter(s => s.status === 'active').length,
      trial: subscriptions.filter(s => s.status === 'trial').length,
      suspended: subscriptions.filter(s => s.status === 'suspended').length,
      expired: subscriptions.filter(s => s.status === 'expired').length,
      cancelled: subscriptions.filter(s => s.status === 'cancelled').length,
      pending: subscriptions.filter(s => s.status === 'pending').length,
      total_revenue: subscriptions
        .filter(s => s.payment_status === 'paid')
        .reduce((sum, s) => sum + s.total_amount, 0),
      monthly_recurring_revenue: subscriptions
        .filter(s => s.status === 'active' && s.billing_cycle === 'monthly')
        .reduce((sum, s) => sum + s.total_amount, 0),
      average_subscription_value: subscriptions.length > 0
        ? subscriptions.reduce((sum, s) => sum + s.total_amount, 0) / subscriptions.length
        : 0,
    };

    return { data: stats, error: null };
  } catch (error: any) {
    console.error('Error calculating statistics:', error);
    return { data: null, error };
  }
};

/**
 * 9. Get subscriptions by tenant
 */
export const getTenantSubscriptionsByTenant = async (
  tenantId: string
): Promise<{ data: TenantSubscription[]; error: any }> => {
  return getTenantSubscriptions({ tenant_id: tenantId });
};

/**
 * 10. Get active subscriptions
 */
export const getActiveTenantSubscriptions = async (
  filters?: Omit<SubscriptionFilters, 'status'>
): Promise<{ data: TenantSubscription[]; error: any }> => {
  return getTenantSubscriptions({ ...filters, status: 'active' });
};

/**
 * 11. Get expiring subscriptions
 */
export const getExpiringTenantSubscriptions = async (
  daysUntilExpiry: number = 30
): Promise<{ data: TenantSubscription[]; error: any }> => {
  try {
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + daysUntilExpiry);

    const { data: subscriptions, error } = await getTenantSubscriptions({
      status: 'active',
      end_date_to: futureDate.toISOString().split('T')[0],
    });

    if (error) throw error;

    return { data: subscriptions, error: null };
  } catch (error: any) {
    console.error('Error fetching expiring subscriptions:', error);
    return { data: [], error };
  }
};

/**
 * 12. Renew subscription
 */
export const renewTenantSubscription = async (
  id: string,
  renewalPeriodMonths: number = 12
): Promise<{ data: TenantSubscription | null; error: any }> => {
  try {
    const { data: subscription, error: fetchError } = await getTenantSubscriptionById(id);
    if (fetchError || !subscription) throw fetchError;

    const newEndDate = new Date(subscription.end_date);
    newEndDate.setMonth(newEndDate.getMonth() + renewalPeriodMonths);

    const updates: Partial<TenantSubscription> = {
      end_date: newEndDate.toISOString().split('T')[0],
      renewal_date: newEndDate.toISOString().split('T')[0],
      status: 'active',
    };

    return await updateTenantSubscription(id, updates);
  } catch (error: any) {
    console.error('Error renewing subscription:', error);
    return { data: null, error };
  }
};

/**
 * 13. Cancel subscription
 */
export const cancelTenantSubscription = async (
  id: string,
  reason?: string
): Promise<{ data: TenantSubscription | null; error: any }> => {
  try {
    const updates: Partial<TenantSubscription> = {
      status: 'cancelled',
      auto_renew: false,
      notes: reason || 'Subscription cancelled',
    };

    return await updateTenantSubscription(id, updates);
  } catch (error: any) {
    console.error('Error cancelling subscription:', error);
    return { data: null, error };
  }
};

/**
 * 14. Suspend subscription
 */
export const suspendTenantSubscription = async (
  id: string,
  reason?: string
): Promise<{ data: TenantSubscription | null; error: any }> => {
  try {
    const updates: Partial<TenantSubscription> = {
      status: 'suspended',
      notes: reason || 'Subscription suspended',
    };

    return await updateTenantSubscription(id, updates);
  } catch (error: any) {
    console.error('Error suspending subscription:', error);
    return { data: null, error };
  }
};

/**
 * 15. Reactivate subscription
 */
export const reactivateTenantSubscription = async (
  id: string
): Promise<{ data: TenantSubscription | null; error: any }> => {
  try {
    const updates: Partial<TenantSubscription> = {
      status: 'active',
      payment_status: 'paid',
    };

    return await updateTenantSubscription(id, updates);
  } catch (error: any) {
    console.error('Error reactivating subscription:', error);
    return { data: null, error };
  }
};

/**
 * 16. Update subscription usage
 */
export const updateSubscriptionUsage = async (
  id: string,
  currentUsers: number,
  currentStorageGb: number
): Promise<{ data: TenantSubscription | null; error: any }> => {
  try {
    const updates: Partial<TenantSubscription> = {
      current_users: currentUsers,
      current_storage_gb: currentStorageGb,
    };

    return await updateTenantSubscription(id, updates);
  } catch (error: any) {
    console.error('Error updating subscription usage:', error);
    return { data: null, error };
  }
};

/**
 * 17. Generate subscription number
 */
export const generateSubscriptionNumber = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `SUB-${year}-${random}`;
};

/**
 * 18. Clear localStorage cache
 */
export const clearSubscriptionCache = (): void => {
  clearStorage();
};

// ============================================
// Export All Functions
// ============================================
export default {
  getTenantSubscriptions,
  getTenantSubscriptionById,
  getTenantSubscriptionByNumber,
  createTenantSubscription,
  updateTenantSubscription,
  deleteTenantSubscription,
  bulkDeleteTenantSubscriptions,
  getTenantSubscriptionStatistics,
  getTenantSubscriptionsByTenant,
  getActiveTenantSubscriptions,
  getExpiringTenantSubscriptions,
  renewTenantSubscription,
  cancelTenantSubscription,
  suspendTenantSubscription,
  reactivateTenantSubscription,
  updateSubscriptionUsage,
  generateSubscriptionNumber,
  clearSubscriptionCache,
};