/**
 * Tenant Subscriptions API Client
 * Uses Adapter pattern - Ready for Golang migration
 * 
 * 🔴 REFACTORED 2026-01-16: 100% database alignment (was 69% - critical mismatch!)
 * Database: tenant_subscriptions (42 fields, complex constraints, soft delete)
 */

import { createAdapter, BaseFilters } from './adapters';

// ==================== TYPES ====================

export type SubscriptionStatus = 'active' | 'trial' | 'suspended' | 'expired' | 'cancelled' | 'pending';
export type BillingCycle = 'monthly' | 'quarterly' | 'yearly' | 'custom';
export type PaymentStatus = 'paid' | 'unpaid' | 'partially_paid' | 'failed' | 'refunded';

export const SubscriptionStatusHelper = {
  ACTIVE: 'active' as SubscriptionStatus,
  TRIAL: 'trial' as SubscriptionStatus,
  SUSPENDED: 'suspended' as SubscriptionStatus,
  EXPIRED: 'expired' as SubscriptionStatus,
  CANCELLED: 'cancelled' as SubscriptionStatus,
  PENDING: 'pending' as SubscriptionStatus,

  isActive: (status: SubscriptionStatus) => status === 'active',
  isTrial: (status: SubscriptionStatus) => status === 'trial',
  isSuspended: (status: SubscriptionStatus) => status === 'suspended',
  isExpired: (status: SubscriptionStatus) => status === 'expired',
  isCancelled: (status: SubscriptionStatus) => status === 'cancelled',
  isPending: (status: SubscriptionStatus) => status === 'pending',
  isUsable: (status: SubscriptionStatus) => status === 'active' || status === 'trial',
  isTerminated: (status: SubscriptionStatus) => status === 'expired' || status === 'cancelled',
};

export const BillingCycleHelper = {
  MONTHLY: 'monthly' as BillingCycle,
  QUARTERLY: 'quarterly' as BillingCycle,
  YEARLY: 'yearly' as BillingCycle,
  CUSTOM: 'custom' as BillingCycle,

  isMonthly: (cycle: BillingCycle) => cycle === 'monthly',
  isQuarterly: (cycle: BillingCycle) => cycle === 'quarterly',
  isYearly: (cycle: BillingCycle) => cycle === 'yearly',
  isCustom: (cycle: BillingCycle) => cycle === 'custom',
};

export const PaymentStatusHelper = {
  PAID: 'paid' as PaymentStatus,
  UNPAID: 'unpaid' as PaymentStatus,
  PARTIALLY_PAID: 'partially_paid' as PaymentStatus,
  FAILED: 'failed' as PaymentStatus,
  REFUNDED: 'refunded' as PaymentStatus,

  isPaid: (status: PaymentStatus) => status === 'paid',
  isUnpaid: (status: PaymentStatus) => status === 'unpaid',
  isPartiallyPaid: (status: PaymentStatus) => status === 'partially_paid',
  isFailed: (status: PaymentStatus) => status === 'failed',
  isRefunded: (status: PaymentStatus) => status === 'refunded',
  needsPayment: (status: PaymentStatus) => status === 'unpaid' || status === 'partially_paid' || status === 'failed',
};

// ==================== MAIN INTERFACE ====================

/**
 * TenantSubscription - 100% matches tenant_subscriptions table (42 fields)
 */
export interface TenantSubscription {
  // I. IDENTITY (4)
  _id: string;
  tenant_id: string; // FK to tenants, NOT NULL
  plan_id: string | null; // FK to subscription_plans
  order_id: string | null; // FK to subscription_orders

  // II. SUBSCRIPTION INFO (5)
  subscription_number: string; // varchar(50), NOT NULL, UNIQUE
  subscription_name: string; // varchar(255), NOT NULL
  start_date: string; // date, NOT NULL
  end_date: string; // date, NOT NULL
  trial_end_date: string | null; // date
  renewal_date: string | null; // date

  // III. STATUS (3)
  status: SubscriptionStatus; // varchar(20), default 'active'
  auto_renew: boolean; // default true
  is_trial: boolean; // default false

  // IV. PLAN DETAILS (2)
  plan_name: string | null; // varchar(100)
  billing_cycle: BillingCycle; // varchar(20), default 'monthly'

  // V. PRICING (5)
  base_price: number; // numeric(15,2), default 0
  discount_amount: number; // numeric(15,2), default 0
  tax_amount: number; // numeric(15,2), default 0
  total_amount: number; // numeric(15,2), default 0
  currency: string; // varchar(3), default 'USD'

  // VI. LIMITS & USAGE (4)
  max_users: number; // integer, default 1
  current_users: number; // integer, default 0
  max_storage_gb: number; // integer, default 10
  current_storage_gb: number; // numeric(10,2), default 0

  // VII. FEATURES & LIMITS (2)
  features: string[]; // jsonb, default '[]'
  limits: Record<string, any>; // jsonb, default '{}'

  // VIII. PAYMENT INFO (5)
  payment_method: string | null; // varchar(50)
  payment_status: PaymentStatus; // varchar(20), default 'unpaid'
  last_payment_date: string | null; // date
  next_payment_date: string | null; // date

  // IX. BILLING CONTACT (3)
  billing_contact_name: string | null; // varchar(255)
  billing_contact_email: string | null; // varchar(255)
  billing_contact_phone: string | null; // varchar(50)

  // X. METADATA (3)
  notes: string | null; // text
  metadata: Record<string, any>; // jsonb, default '{}'
  tags: string[] | null; // varchar(100)[]

  // XI. AUDIT TRAIL (7)
  created_at: string;
  created_by: string | null;
  updated_at: string;
  updated_by: string | null;
  deleted_at: string | null; // Soft delete
  deleted_by: string | null;
  version: number; // integer, default 1
}

export interface SubscriptionWithDetails extends TenantSubscription {
  // Joined data
  tenant_name?: string;
  plan_display_name?: string;

  // Computed fields
  days_remaining?: number;
  days_until_renewal?: number;
  usage_percentage?: number; // current_users / max_users * 100
  storage_percentage?: number; // current_storage_gb / max_storage_gb * 100
  is_overdue?: boolean;
  is_near_expiry?: boolean; // < 30 days
  is_over_limit?: boolean; // current_users > max_users or storage > max
  monthly_cost?: number; // Normalized to monthly
  yearly_cost?: number; // Normalized to yearly
}

// ==================== REQUEST INTERFACES ====================

export interface CreateSubscriptionRequest {
  // Required
  tenant_id: string;
  subscription_name: string;
  start_date: string;
  end_date: string;

  // Optional with defaults
  status?: SubscriptionStatus; // default: 'active'
  auto_renew?: boolean; // default: true
  is_trial?: boolean; // default: false
  billing_cycle?: BillingCycle; // default: 'monthly'
  base_price?: number; // default: 0
  discount_amount?: number; // default: 0
  tax_amount?: number; // default: 0
  total_amount?: number; // default: 0
  currency?: string; // default: 'USD'
  max_users?: number; // default: 1
  current_users?: number; // default: 0
  max_storage_gb?: number; // default: 10
  current_storage_gb?: number; // default: 0
  features?: string[]; // default: []
  limits?: Record<string, any>; // default: {}
  payment_status?: PaymentStatus; // default: 'unpaid'
  metadata?: Record<string, any>; // default: {}
  version?: number; // default: 1

  // Optional
  plan_id?: string | null;
  order_id?: string | null;
  trial_end_date?: string | null;
  renewal_date?: string | null;
  plan_name?: string | null;
  payment_method?: string | null;
  last_payment_date?: string | null;
  next_payment_date?: string | null;
  billing_contact_name?: string | null;
  billing_contact_email?: string | null;
  billing_contact_phone?: string | null;
  notes?: string | null;
  tags?: string[] | null;
  created_by?: string | null;
}

export interface UpdateSubscriptionRequest {
  plan_id?: string | null;
  order_id?: string | null;
  subscription_name?: string;
  start_date?: string;
  end_date?: string;
  trial_end_date?: string | null;
  renewal_date?: string | null;
  status?: SubscriptionStatus;
  auto_renew?: boolean;
  is_trial?: boolean;
  plan_name?: string | null;
  billing_cycle?: BillingCycle;
  base_price?: number;
  discount_amount?: number;
  tax_amount?: number;
  total_amount?: number;
  currency?: string;
  max_users?: number;
  current_users?: number;
  max_storage_gb?: number;
  current_storage_gb?: number;
  features?: string[];
  limits?: Record<string, any>;
  payment_method?: string | null;
  payment_status?: PaymentStatus;
  last_payment_date?: string | null;
  next_payment_date?: string | null;
  billing_contact_name?: string | null;
  billing_contact_email?: string | null;
  billing_contact_phone?: string | null;
  notes?: string | null;
  metadata?: Record<string, any>;
  tags?: string[] | null;
  updated_by?: string | null;
}

export interface SubscriptionFilters extends BaseFilters {
  tenant_id?: string;
  plan_id?: string;
  order_id?: string;
  status?: SubscriptionStatus;
  billing_cycle?: BillingCycle;
  payment_status?: PaymentStatus;
  is_trial?: boolean;
  auto_renew?: boolean;
  currency?: string;
  min_price?: number;
  max_price?: number;
  expiring_soon?: boolean; // < 30 days
  overdue?: boolean;
  search?: string;
}

// ==================== STATISTICS ====================

export interface SubscriptionStatistics {
  total_subscriptions: number;
  active_subscriptions: number;
  trial_subscriptions: number;
  suspended_subscriptions: number;
  expired_subscriptions: number;
  cancelled_subscriptions: number;
  pending_subscriptions: number;
  deleted_subscriptions: number;
  by_status: Record<SubscriptionStatus, number>;
  by_billing_cycle: Record<BillingCycle, number>;
  by_payment_status: Record<PaymentStatus, number>;
  total_mrr: number; // Monthly Recurring Revenue
  total_arr: number; // Annual Recurring Revenue
  average_subscription_value: number;
  total_users: number;
  total_storage_gb: number;
  subscriptions_expiring_soon: number; // < 30 days
  subscriptions_overdue: number;
  auto_renew_enabled: number;
}

// ==================== VALIDATION ====================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// ==================== ADAPTER ====================

const adapter = createAdapter<TenantSubscription, CreateSubscriptionRequest, UpdateSubscriptionRequest>(
  'tenant_subscriptions',
  '/tenant-subscriptions',
  true // Soft delete enabled
);

// ==================== API CLIENT ====================

export const tenantSubscriptionsApi = {
  /**
   * GET /tenant-subscriptions
   */
  getAll: async (filters?: SubscriptionFilters): Promise<TenantSubscription[]> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    let query = supabase
      .from('tenant_subscriptions')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters?.tenant_id) query = query.eq('tenant_id', filters.tenant_id);
    if (filters?.plan_id) query = query.eq('plan_id', filters.plan_id);
    if (filters?.order_id) query = query.eq('order_id', filters.order_id);
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.billing_cycle) query = query.eq('billing_cycle', filters.billing_cycle);
    if (filters?.payment_status) query = query.eq('payment_status', filters.payment_status);
    if (filters?.is_trial !== undefined) query = query.eq('is_trial', filters.is_trial);
    if (filters?.auto_renew !== undefined) query = query.eq('auto_renew', filters.auto_renew);
    if (filters?.currency) query = query.eq('currency', filters.currency);
    if (filters?.min_price !== undefined) query = query.gte('total_amount', filters.min_price);
    if (filters?.max_price !== undefined) query = query.lte('total_amount', filters.max_price);

    // Pagination
    if (filters?.limit) query = query.limit(filters.limit);
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch subscriptions: ${error.message}`);
    }

    let subscriptions = data || [];

    // Client-side filters
    if (filters?.expiring_soon) {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      subscriptions = subscriptions.filter((s) => {
        const endDate = new Date(s.end_date);
        return endDate <= thirtyDaysFromNow && endDate > new Date();
      });
    }

    if (filters?.overdue) {
      const today = new Date();
      subscriptions = subscriptions.filter((s) => {
        if (!s.next_payment_date) return false;
        const nextPayment = new Date(s.next_payment_date);
        return nextPayment < today && s.payment_status !== 'paid';
      });
    }

    if (filters?.search) {
      const search = filters.search.toLowerCase();
      subscriptions = subscriptions.filter(
        (s) =>
          s.subscription_name.toLowerCase().includes(search) ||
          s.subscription_number.toLowerCase().includes(search) ||
          s.billing_contact_email?.toLowerCase().includes(search)
      );
    }

    return subscriptions;
  },

  /**
   * GET /tenant-subscriptions/:id
   */
  getById: async (id: string): Promise<TenantSubscription> => {
    return adapter.getById(id);
  },

  /**
   * GET /tenant-subscriptions/:id/details
   */
  getByIdWithDetails: async (id: string): Promise<SubscriptionWithDetails> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    const subscription = await tenantSubscriptionsApi.getById(id);

    // Get tenant name
    let tenant_name: string | undefined;
    if (subscription.tenant_id) {
      const { data: tenant } = await supabase.from('tenants').select('name').eq('_id', subscription.tenant_id).single();
      tenant_name = tenant?.name;
    }

    // Get plan name
    let plan_display_name: string | undefined;
    if (subscription.plan_id) {
      const { data: plan } = await supabase
        .from('subscription_plans')
        .select('name')
        .eq('_id', subscription.plan_id)
        .single();
      plan_display_name = plan?.name;
    }

    // Compute fields
    const today = new Date();
    const endDate = new Date(subscription.end_date);
    const days_remaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    let days_until_renewal: number | undefined;
    if (subscription.renewal_date) {
      const renewalDate = new Date(subscription.renewal_date);
      days_until_renewal = Math.ceil((renewalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    }

    const usage_percentage = subscription.max_users > 0 ? (subscription.current_users / subscription.max_users) * 100 : 0;
    const storage_percentage =
      subscription.max_storage_gb > 0 ? (subscription.current_storage_gb / subscription.max_storage_gb) * 100 : 0;

    const is_overdue =
      subscription.next_payment_date &&
      new Date(subscription.next_payment_date) < today &&
      subscription.payment_status !== 'paid';

    const is_near_expiry = days_remaining > 0 && days_remaining < 30;
    const is_over_limit =
      subscription.current_users > subscription.max_users || subscription.current_storage_gb > subscription.max_storage_gb;

    // Calculate normalized costs
    const monthly_cost = calculateMonthlyCost(subscription);
    const yearly_cost = monthly_cost * 12;

    return {
      ...subscription,
      tenant_name,
      plan_display_name,
      days_remaining,
      days_until_renewal,
      usage_percentage,
      storage_percentage,
      is_overdue,
      is_near_expiry,
      is_over_limit,
      monthly_cost,
      yearly_cost,
    } as SubscriptionWithDetails;
  },

  /**
   * POST /tenant-subscriptions
   */
  create: async (data: CreateSubscriptionRequest): Promise<TenantSubscription> => {
    // Validate
    const validation = tenantSubscriptionsApi.validate(data);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Generate subscription number if not provided
    const subscription_number = await generateSubscriptionNumber();

    // Apply defaults
    const requestData = {
      ...data,
      subscription_number,
      status: data.status || 'active' as SubscriptionStatus,
      auto_renew: data.auto_renew !== undefined ? data.auto_renew : true,
      is_trial: data.is_trial !== undefined ? data.is_trial : false,
      billing_cycle: data.billing_cycle || 'monthly' as BillingCycle,
      base_price: data.base_price !== undefined ? data.base_price : 0,
      discount_amount: data.discount_amount !== undefined ? data.discount_amount : 0,
      tax_amount: data.tax_amount !== undefined ? data.tax_amount : 0,
      total_amount: data.total_amount !== undefined ? data.total_amount : 0,
      currency: data.currency || 'USD',
      max_users: data.max_users !== undefined ? data.max_users : 1,
      current_users: data.current_users !== undefined ? data.current_users : 0,
      max_storage_gb: data.max_storage_gb !== undefined ? data.max_storage_gb : 10,
      current_storage_gb: data.current_storage_gb !== undefined ? data.current_storage_gb : 0,
      features: data.features || [],
      limits: data.limits || {},
      payment_status: data.payment_status || 'unpaid' as PaymentStatus,
      metadata: data.metadata || {},
      version: data.version || 1,
    };

    return adapter.create(requestData);
  },

  /**
   * PUT /tenant-subscriptions/:id
   */
  update: async (id: string, data: UpdateSubscriptionRequest): Promise<TenantSubscription> => {
    // Validate
    const validation = tenantSubscriptionsApi.validate(data);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    return adapter.update(id, data);
  },

  /**
   * DELETE /tenant-subscriptions/:id (Soft delete)
   */
  delete: async (id: string, deletedBy?: string): Promise<void> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('tenant_subscriptions')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: deletedBy || null,
      })
      .eq('_id', id);

    if (error) {
      throw new Error(`Failed to delete subscription: ${error.message}`);
    }
  },

  /**
   * GET /tenant-subscriptions/by-tenant/:tenantId
   */
  getByTenant: async (tenantId: string): Promise<TenantSubscription[]> => {
    return tenantSubscriptionsApi.getAll({ tenant_id: tenantId });
  },

  /**
   * GET /tenant-subscriptions/by-plan/:planId
   */
  getByPlan: async (planId: string): Promise<TenantSubscription[]> => {
    return tenantSubscriptionsApi.getAll({ plan_id: planId });
  },

  /**
   * GET /tenant-subscriptions/active
   */
  getActive: async (tenantId?: string): Promise<TenantSubscription[]> => {
    return tenantSubscriptionsApi.getAll({
      tenant_id: tenantId,
      status: 'active',
    });
  },

  /**
   * GET /tenant-subscriptions/trial
   */
  getTrial: async (tenantId?: string): Promise<TenantSubscription[]> => {
    return tenantSubscriptionsApi.getAll({
      tenant_id: tenantId,
      is_trial: true,
    });
  },

  /**
   * GET /tenant-subscriptions/expiring-soon
   */
  getExpiringSoon: async (tenantId?: string): Promise<TenantSubscription[]> => {
    return tenantSubscriptionsApi.getAll({
      tenant_id: tenantId,
      expiring_soon: true,
    });
  },

  /**
   * GET /tenant-subscriptions/overdue
   */
  getOverdue: async (tenantId?: string): Promise<TenantSubscription[]> => {
    return tenantSubscriptionsApi.getAll({
      tenant_id: tenantId,
      overdue: true,
    });
  },

  /**
   * PUT /tenant-subscriptions/:id/activate
   */
  activate: async (id: string, updatedBy?: string): Promise<TenantSubscription> => {
    return tenantSubscriptionsApi.update(id, {
      status: 'active',
      updated_by: updatedBy || null,
    });
  },

  /**
   * PUT /tenant-subscriptions/:id/suspend
   */
  suspend: async (id: string, updatedBy?: string): Promise<TenantSubscription> => {
    return tenantSubscriptionsApi.update(id, {
      status: 'suspended',
      updated_by: updatedBy || null,
    });
  },

  /**
   * PUT /tenant-subscriptions/:id/cancel
   */
  cancel: async (id: string, updatedBy?: string): Promise<TenantSubscription> => {
    return tenantSubscriptionsApi.update(id, {
      status: 'cancelled',
      auto_renew: false,
      updated_by: updatedBy || null,
    });
  },

  /**
   * PUT /tenant-subscriptions/:id/renew
   */
  renew: async (id: string, newEndDate: string, updatedBy?: string): Promise<TenantSubscription> => {
    const subscription = await tenantSubscriptionsApi.getById(id);

    return tenantSubscriptionsApi.update(id, {
      end_date: newEndDate,
      renewal_date: newEndDate,
      status: 'active',
      payment_status: 'unpaid', // Reset payment status on renewal
      updated_by: updatedBy || null,
    });
  },

  /**
   * PUT /tenant-subscriptions/:id/mark-paid
   */
  markPaid: async (id: string, paymentDate?: string, updatedBy?: string): Promise<TenantSubscription> => {
    return tenantSubscriptionsApi.update(id, {
      payment_status: 'paid',
      last_payment_date: paymentDate || new Date().toISOString().split('T')[0],
      updated_by: updatedBy || null,
    });
  },

  /**
   * PUT /tenant-subscriptions/:id/increment-users
   */
  incrementUsers: async (id: string, count: number = 1, updatedBy?: string): Promise<TenantSubscription> => {
    const subscription = await tenantSubscriptionsApi.getById(id);

    return tenantSubscriptionsApi.update(id, {
      current_users: subscription.current_users + count,
      updated_by: updatedBy || null,
    });
  },

  /**
   * PUT /tenant-subscriptions/:id/decrement-users
   */
  decrementUsers: async (id: string, count: number = 1, updatedBy?: string): Promise<TenantSubscription> => {
    const subscription = await tenantSubscriptionsApi.getById(id);
    const newCount = Math.max(0, subscription.current_users - count);

    return tenantSubscriptionsApi.update(id, {
      current_users: newCount,
      updated_by: updatedBy || null,
    });
  },

  /**
   * PUT /tenant-subscriptions/:id/update-storage
   */
  updateStorage: async (id: string, storageGb: number, updatedBy?: string): Promise<TenantSubscription> => {
    return tenantSubscriptionsApi.update(id, {
      current_storage_gb: storageGb,
      updated_by: updatedBy || null,
    });
  },

  /**
   * GET /tenant-subscriptions/statistics
   */
  getStatistics: async (tenantId?: string): Promise<SubscriptionStatistics> => {
    const subscriptions = await tenantSubscriptionsApi.getAll(tenantId ? { tenant_id: tenantId } : {});
    return calculateStatistics(subscriptions);
  },

  /**
   * Bulk operations
   */
  bulkActivate: async (ids: string[], updatedBy?: string): Promise<void> => {
    await Promise.all(ids.map((id) => tenantSubscriptionsApi.activate(id, updatedBy)));
  },

  bulkSuspend: async (ids: string[], updatedBy?: string): Promise<void> => {
    await Promise.all(ids.map((id) => tenantSubscriptionsApi.suspend(id, updatedBy)));
  },

  bulkCancel: async (ids: string[], updatedBy?: string): Promise<void> => {
    await Promise.all(ids.map((id) => tenantSubscriptionsApi.cancel(id, updatedBy)));
  },

  /**
   * Client-side validation
   */
  validate: (data: Partial<CreateSubscriptionRequest | UpdateSubscriptionRequest>): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields (create only)
    if ('tenant_id' in data && !data.tenant_id) {
      errors.push('Tenant ID không được để trống');
    }
    if ('subscription_name' in data && !data.subscription_name) {
      errors.push('Tên subscription không được để trống');
    }
    if ('start_date' in data && !data.start_date) {
      errors.push('Ngày bắt đầu không được để trống');
    }
    if ('end_date' in data && !data.end_date) {
      errors.push('Ngày kết thúc không được để trống');
    }

    // Validate dates
    if ('start_date' in data && 'end_date' in data && data.start_date && data.end_date) {
      if (new Date(data.end_date) < new Date(data.start_date)) {
        errors.push('Ngày kết thúc phải >= ngày bắt đầu');
      }
    }

    // Validate amounts
    if ('base_price' in data && data.base_price !== undefined && data.base_price < 0) {
      errors.push('Giá cơ bản phải >= 0');
    }
    if ('discount_amount' in data && data.discount_amount !== undefined && data.discount_amount < 0) {
      errors.push('Số tiền giảm giá phải >= 0');
    }
    if ('tax_amount' in data && data.tax_amount !== undefined && data.tax_amount < 0) {
      errors.push('Thuế phải >= 0');
    }
    if ('total_amount' in data && data.total_amount !== undefined && data.total_amount < 0) {
      errors.push('Tổng tiền phải >= 0');
    }

    // Validate users
    if ('current_users' in data && data.current_users !== undefined && data.current_users < 0) {
      errors.push('Số người dùng hiện tại phải >= 0');
    }
    if ('max_users' in data && 'current_users' in data) {
      if (
        data.max_users !== undefined &&
        data.current_users !== undefined &&
        data.current_users > data.max_users
      ) {
        errors.push('Số người dùng hiện tại không được vượt quá giới hạn');
      }
    }

    // Validate storage
    if ('current_storage_gb' in data && data.current_storage_gb !== undefined && data.current_storage_gb < 0) {
      errors.push('Dung lượng hiện tại phải >= 0');
    }
    if ('max_storage_gb' in data && 'current_storage_gb' in data) {
      if (
        data.max_storage_gb !== undefined &&
        data.current_storage_gb !== undefined &&
        data.current_storage_gb > data.max_storage_gb
      ) {
        errors.push('Dung lượng hiện tại không được vượt quá giới hạn');
      }
    }

    // Warnings
    if ('auto_renew' in data && data.auto_renew === false) {
      warnings.push('Auto-renew bị tắt, subscription sẽ hết hạn vào end_date');
    }
    if ('status' in data && data.status === 'suspended') {
      warnings.push('Subscription đang bị tạm dừng');
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
 * Generate subscription number
 * Format: SUB-YYYYMMDD-XXXXX
 */
export async function generateSubscriptionNumber(): Promise<string> {
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
  const random = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, '0');
  return `SUB-${dateStr}-${random}`;
}

/**
 * Calculate statistics
 */
export function calculateStatistics(subscriptions: TenantSubscription[]): SubscriptionStatistics {
  const byStatus: Record<SubscriptionStatus, number> = {
    active: 0,
    trial: 0,
    suspended: 0,
    expired: 0,
    cancelled: 0,
    pending: 0,
  };

  const byBillingCycle: Record<BillingCycle, number> = {
    monthly: 0,
    quarterly: 0,
    yearly: 0,
    custom: 0,
  };

  const byPaymentStatus: Record<PaymentStatus, number> = {
    paid: 0,
    unpaid: 0,
    partially_paid: 0,
    failed: 0,
    refunded: 0,
  };

  let activeCount = 0;
  let trialCount = 0;
  let suspendedCount = 0;
  let expiredCount = 0;
  let cancelledCount = 0;
  let pendingCount = 0;
  let deletedCount = 0;
  let totalMRR = 0;
  let totalARR = 0;
  let totalValue = 0;
  let totalUsers = 0;
  let totalStorage = 0;
  let expiringSoonCount = 0;
  let overdueCount = 0;
  let autoRenewCount = 0;

  const today = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  subscriptions.forEach((sub) => {
    // Count by status
    byStatus[sub.status]++;

    switch (sub.status) {
      case 'active':
        activeCount++;
        break;
      case 'trial':
        trialCount++;
        break;
      case 'suspended':
        suspendedCount++;
        break;
      case 'expired':
        expiredCount++;
        break;
      case 'cancelled':
        cancelledCount++;
        break;
      case 'pending':
        pendingCount++;
        break;
    }

    // Count by billing cycle
    byBillingCycle[sub.billing_cycle]++;

    // Count by payment status
    byPaymentStatus[sub.payment_status]++;

    // Count deleted
    if (sub.deleted_at) {
      deletedCount++;
    }

    // Calculate MRR/ARR
    if (SubscriptionStatusHelper.isUsable(sub.status)) {
      const monthlyCost = calculateMonthlyCost(sub);
      totalMRR += monthlyCost;
      totalARR += monthlyCost * 12;
    }

    // Total value
    totalValue += sub.total_amount;

    // Total users and storage
    totalUsers += sub.current_users;
    totalStorage += sub.current_storage_gb;

    // Expiring soon
    const endDate = new Date(sub.end_date);
    if (endDate <= thirtyDaysFromNow && endDate > today) {
      expiringSoonCount++;
    }

    // Overdue
    if (sub.next_payment_date) {
      const nextPayment = new Date(sub.next_payment_date);
      if (nextPayment < today && sub.payment_status !== 'paid') {
        overdueCount++;
      }
    }

    // Auto renew
    if (sub.auto_renew) {
      autoRenewCount++;
    }
  });

  const avgValue = subscriptions.length > 0 ? totalValue / subscriptions.length : 0;

  return {
    total_subscriptions: subscriptions.length,
    active_subscriptions: activeCount,
    trial_subscriptions: trialCount,
    suspended_subscriptions: suspendedCount,
    expired_subscriptions: expiredCount,
    cancelled_subscriptions: cancelledCount,
    pending_subscriptions: pendingCount,
    deleted_subscriptions: deletedCount,
    by_status: byStatus,
    by_billing_cycle: byBillingCycle,
    by_payment_status: byPaymentStatus,
    total_mrr: totalMRR,
    total_arr: totalARR,
    average_subscription_value: avgValue,
    total_users: totalUsers,
    total_storage_gb: totalStorage,
    subscriptions_expiring_soon: expiringSoonCount,
    subscriptions_overdue: overdueCount,
    auto_renew_enabled: autoRenewCount,
  };
}

/**
 * Calculate monthly cost
 */
export function calculateMonthlyCost(subscription: TenantSubscription): number {
  const { total_amount, billing_cycle } = subscription;

  switch (billing_cycle) {
    case 'monthly':
      return total_amount;
    case 'quarterly':
      return total_amount / 3;
    case 'yearly':
      return total_amount / 12;
    case 'custom':
      return 0; // Cannot normalize custom
    default:
      return 0;
  }
}

/**
 * Get status label
 */
export function getStatusLabel(status: SubscriptionStatus): string {
  const labels: Record<SubscriptionStatus, string> = {
    active: 'Đang hoạt động',
    trial: 'Dùng thử',
    suspended: 'Tạm dừng',
    expired: 'Hết hạn',
    cancelled: 'Đã hủy',
    pending: 'Chờ xử lý',
  };
  return labels[status];
}

/**
 * Get status color
 */
export function getStatusColor(status: SubscriptionStatus): string {
  const colors: Record<SubscriptionStatus, string> = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    trial: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    suspended: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    expired: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  };
  return colors[status];
}

/**
 * Get billing cycle label
 */
export function getBillingCycleLabel(cycle: BillingCycle): string {
  const labels: Record<BillingCycle, string> = {
    monthly: 'Hàng tháng',
    quarterly: 'Hàng quý',
    yearly: 'Hàng năm',
    custom: 'Tùy chỉnh',
  };
  return labels[cycle];
}

/**
 * Get payment status label
 */
export function getPaymentStatusLabel(status: PaymentStatus): string {
  const labels: Record<PaymentStatus, string> = {
    paid: 'Đã thanh toán',
    unpaid: 'Chưa thanh toán',
    partially_paid: 'Thanh toán một phần',
    failed: 'Thất bại',
    refunded: 'Đã hoàn tiền',
  };
  return labels[status];
}

/**
 * Get payment status color
 */
export function getPaymentStatusColor(status: PaymentStatus): string {
  const colors: Record<PaymentStatus, string> = {
    paid: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    unpaid: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    partially_paid: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    refunded: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
  };
  return colors[status];
}

/**
 * Format currency
 */
export function formatCurrency(amount: number, currency: string): string {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    VND: '₫',
  };

  const symbol = symbols[currency] || currency;

  if (currency === 'VND') {
    return `${amount.toLocaleString('vi-VN')}${symbol}`;
  }

  return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Check if subscription is near expiry (< 30 days)
 */
export function isNearExpiry(subscription: TenantSubscription): boolean {
  const today = new Date();
  const endDate = new Date(subscription.end_date);
  const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return daysRemaining > 0 && daysRemaining < 30;
}

/**
 * Check if subscription is overdue
 */
export function isOverdue(subscription: TenantSubscription): boolean {
  if (!subscription.next_payment_date) return false;
  const today = new Date();
  const nextPayment = new Date(subscription.next_payment_date);
  return nextPayment < today && subscription.payment_status !== 'paid';
}

/**
 * Check if subscription is over limit
 */
export function isOverLimit(subscription: TenantSubscription): boolean {
  return (
    subscription.current_users > subscription.max_users ||
    subscription.current_storage_gb > subscription.max_storage_gb
  );
}

export default tenantSubscriptionsApi;

// Legacy exports for backward compatibility
export const getTenantSubscriptions = (filters?: SubscriptionFilters) => tenantSubscriptionsApi.getAll(filters);
export const getTenantSubscriptionById = (id: string) => tenantSubscriptionsApi.getById(id);
export const createTenantSubscription = (data: CreateSubscriptionRequest) => tenantSubscriptionsApi.create(data);
export const updateTenantSubscription = (id: string, data: UpdateSubscriptionRequest) =>
  tenantSubscriptionsApi.update(id, data);
export const deleteTenantSubscription = (id: string) => tenantSubscriptionsApi.delete(id);
export const getTenantSubscriptionStatistics = () => tenantSubscriptionsApi.getStatistics();
