/**
 * Tenant Subscriptions API Client
 * Uses Adapter pattern - Ready for Golang migration
 * 
 * 🔴 REFACTORED 2026-01-20: 100% database alignment
 * Database: tenant_subscriptions (42 fields, complex constraints, soft delete)
 */

import { createAdapter, BaseFilters } from './adapters';

// ==================== TYPES ====================

export type SubscriptionStatus = 'active' | 'trial' | 'suspended' | 'expired' | 'cancelled' | 'pending';
export type BillingCycle = 'monthly' | 'quarterly' | 'yearly' | 'custom';
export type PaymentStatus = 'paid' | 'unpaid' | 'partially_paid' | 'failed' | 'refunded';

export interface TenantSubscription {
  // I. IDENTITY (4)
  _id: string;
  tenant_id: string; // FK to tenants, NOT NULL
  plan_id: string | null; // FK to service_packages
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
  
  // Fields for soft delete / restoration
  deleted_at?: string | null;
  deleted_by?: string | null;
  
  // Optimistic Locking
  version: number;
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

// ==================== ADAPTER ====================

const adapter = createAdapter<TenantSubscription, CreateSubscriptionRequest, UpdateSubscriptionRequest>(
  'tenant_subscriptions',
  '/tenant-subscriptions',
  { supportsSoftDelete: true }
);

// ==================== API CLIENT ====================

export const tenantSubscriptionsApi = {
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
   * GET /tenant-subscriptions/:id/details
   * Fetches subscription with joined details (Tenant Name, Plan Name)
   */
  getByIdWithDetails: async (id: string): Promise<SubscriptionWithDetails> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    const subscription = await adapter.getById(id);

    // Get tenant name
    let tenant_name: string | undefined;
    if (subscription.tenant_id) {
      const { data: tenant } = await supabase.from('tenants').select('name').eq('_id', subscription.tenant_id).single();
      tenant_name = tenant?.name;
    }

    // Get plan name (from service_packages)
    let plan_display_name: string | undefined;
    if (subscription.plan_id) {
      const { data: plan } = await supabase
        .from('service_packages')
        .select('package_name')
        .eq('_id', subscription.plan_id)
        .single();
      plan_display_name = plan?.package_name;
    }

    return {
      ...subscription,
      tenant_name,
      plan_display_name,
    };
  },

  /**
   * POST /tenant-subscriptions
   */
  create: async (data: CreateSubscriptionRequest): Promise<TenantSubscription> => {
    // Generate subscription number if not provided
    const subscription_number = await generateSubscriptionNumber();

    const requestData: any = {
      ...data,
      subscription_number,
      // Defaults handled by DB or Adapter, but being explicit helps
      status: data.status || 'active',
      auto_renew: data.auto_renew ?? true,
      is_trial: data.is_trial ?? false,
      billing_cycle: data.billing_cycle || 'monthly',
      currency: data.currency || 'USD',
      features: data.features || [],
      limits: data.limits || {},
      metadata: data.metadata || {},
    };

    return adapter.create(requestData);
  },

  /**
   * PUT /tenant-subscriptions/:id
   * Requires version for optimistic locking
   */
  update: async (id: string, data: UpdateSubscriptionRequest): Promise<TenantSubscription> => {
    return adapter.update(id, data);
  },

  /**
   * DELETE /tenant-subscriptions/:id
   * Soft delete with Optimistic Locking
   */
  delete: async (id: string, version: number, deletedBy?: string): Promise<void> => {
    // We use update to perform soft delete to ensure version check (optimistic locking)
    // SupabaseDataClient.update will increment version and update updated_at automatically
    await adapter.update(id, {
      version,
      deleted_at: new Date().toISOString(),
      deleted_by: deletedBy || null,
      status: 'cancelled', // Archive usually implies cancelled/expired in business logic
    } as UpdateSubscriptionRequest);
  },

  /**
   * HELPER METHODS
   */
  
  generateSubscriptionNumber,
};

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

export default tenantSubscriptionsApi;
