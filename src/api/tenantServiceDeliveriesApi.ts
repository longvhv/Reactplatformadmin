/**
 * Tenant Service Deliveries API Client
 * Uses Adapter pattern - Ready for Golang migration
 * 
 * ✅ REFACTORED 2026-01-16: 100% database alignment (was 36% mismatch!)
 * Database: tenant_service_deliveries (14 fields, product-based, versioning)
 * 
 * CRITICAL: Complete refactor from order-based to product-based model
 */

import { createAdapter, BaseFilters } from './adapters';

// ==================== TYPES ====================

export type DeliveryStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export const DeliveryStatusHelper = {
  PENDING: 'PENDING' as DeliveryStatus,
  IN_PROGRESS: 'IN_PROGRESS' as DeliveryStatus,
  COMPLETED: 'COMPLETED' as DeliveryStatus,
  CANCELLED: 'CANCELLED' as DeliveryStatus,

  isPending: (status: DeliveryStatus) => status === 'PENDING',
  isInProgress: (status: DeliveryStatus) => status === 'IN_PROGRESS',
  isCompleted: (status: DeliveryStatus) => status === 'COMPLETED',
  isCancelled: (status: DeliveryStatus) => status === 'CANCELLED',
  isActive: (status: DeliveryStatus) => status === 'PENDING' || status === 'IN_PROGRESS',
  isFinal: (status: DeliveryStatus) => status === 'COMPLETED' || status === 'CANCELLED',
};

// ==================== MAIN INTERFACE ====================

/**
 * TenantServiceDelivery - 100% matches tenant_service_deliveries table (14 fields)
 */
export interface TenantServiceDelivery {
  // I. IDENTITY & RELATIONSHIPS (4)
  _id: string;
  tenant_id: string; // FK to tenants, CASCADE
  product_id: string; // FK to saas_products, NOT NULL
  subscription_id: string | null; // FK to tenant_subscriptions, nullable

  // II. UNIT CONFIGURATION (2)
  unit_type: string; // varchar(20), NOT NULL
  total_units: number; // numeric(15,2), NOT NULL, default 0, must be > 0
  delivered_units: number; // numeric(15,2), NOT NULL, default 0, must be >= 0 and <= total_units

  // III. PRICING (2)
  unit_price: number; // numeric(19,4), NOT NULL, default 0
  currency_code: string; // varchar(3), NOT NULL, default 'VND'

  // IV. STATUS & METADATA (2)
  status: DeliveryStatus; // varchar(20), NOT NULL, default 'PENDING'
  service_metadata: Record<string, any>; // jsonb, NOT NULL, default {}

  // V. AUDIT TRAIL (3)
  created_at: string;
  updated_at: string;
  version: number; // bigint, NOT NULL, default 1, >= 1 (optimistic locking)
}

export interface ServiceDeliveryWithDetails extends TenantServiceDelivery {
  // Joined from products
  product_name?: string;
  product_code?: string;

  // Joined from subscription
  subscription_status?: string;

  // Joined from tenant
  tenant_name?: string;

  // Computed fields
  remaining_units?: number; // total_units - delivered_units
  progress_percentage?: number; // (delivered_units / total_units) * 100
  total_value?: number; // total_units * unit_price
  delivered_value?: number; // delivered_units * unit_price
  remaining_value?: number; // remaining_units * unit_price
  is_fully_delivered?: boolean; // delivered_units >= total_units
  is_over_delivered?: boolean; // delivered_units > total_units (should not happen)
}

// ==================== REQUEST INTERFACES ====================

export interface CreateServiceDeliveryRequest {
  // Required
  tenant_id: string;
  product_id: string;
  unit_type: string;
  total_units: number; // Must be > 0

  // Optional with defaults
  delivered_units?: number; // default: 0
  unit_price?: number; // default: 0
  currency_code?: string; // default: 'VND'
  status?: DeliveryStatus; // default: 'PENDING'
  service_metadata?: Record<string, any>; // default: {}
  version?: number; // default: 1

  // Optional
  subscription_id?: string | null;
}

export interface UpdateServiceDeliveryRequest {
  subscription_id?: string | null;
  unit_type?: string;
  total_units?: number;
  delivered_units?: number;
  unit_price?: number;
  currency_code?: string;
  status?: DeliveryStatus;
  service_metadata?: Record<string, any>;
}

export interface ServiceDeliveryFilters extends BaseFilters {
  tenant_id?: string;
  product_id?: string;
  subscription_id?: string;
  unit_type?: string;
  status?: DeliveryStatus;
  currency_code?: string;
  min_units?: number;
  max_units?: number;
  fully_delivered?: boolean;
  search?: string;
}

// ==================== STATISTICS ====================

export interface ServiceDeliveryStatistics {
  total_deliveries: number;
  pending_deliveries: number;
  in_progress_deliveries: number;
  completed_deliveries: number;
  cancelled_deliveries: number;
  by_status: Record<DeliveryStatus, number>;
  by_unit_type: Record<string, number>;
  by_currency: Record<string, number>;
  total_units_ordered: number;
  total_units_delivered: number;
  total_units_remaining: number;
  average_delivery_percentage: number | null;
  total_value: number; // Total value of all deliveries
  delivered_value: number; // Value of delivered units
  remaining_value: number; // Value of remaining units
  fully_delivered_count: number;
  over_delivered_count: number; // Should be 0
}

// ==================== DELIVERY PROGRESS ====================

export interface DeliveryProgress {
  delivery_id: string;
  units_to_deliver: number;
  description?: string;
  delivered_by?: string;
  metadata?: Record<string, any>;
}

// ==================== VALIDATION ====================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// ==================== ADAPTER ====================

const adapter = createAdapter<TenantServiceDelivery, CreateServiceDeliveryRequest, UpdateServiceDeliveryRequest>(
  'tenant_service_deliveries',
  '/tenant-service-deliveries',
  false // No soft delete
);

// ==================== API CLIENT ====================

export const tenantServiceDeliveriesApi = {
  /**
   * GET /tenant-service-deliveries
   */
  getAll: async (filters?: ServiceDeliveryFilters): Promise<TenantServiceDelivery[]> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    let query = supabase
      .from('tenant_service_deliveries')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters?.tenant_id) query = query.eq('tenant_id', filters.tenant_id);
    if (filters?.product_id) query = query.eq('product_id', filters.product_id);
    if (filters?.subscription_id) query = query.eq('subscription_id', filters.subscription_id);
    if (filters?.unit_type) query = query.eq('unit_type', filters.unit_type);
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.currency_code) query = query.eq('currency_code', filters.currency_code);
    if (filters?.min_units !== undefined) query = query.gte('total_units', filters.min_units);
    if (filters?.max_units !== undefined) query = query.lte('total_units', filters.max_units);

    // Pagination
    if (filters?.limit) query = query.limit(filters.limit);
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch service deliveries: ${error.message}`);
    }

    let deliveries = data || [];

    // Client-side filters
    if (filters?.fully_delivered !== undefined) {
      deliveries = deliveries.filter((d) => {
        const isFullyDelivered = d.delivered_units >= d.total_units;
        return filters.fully_delivered ? isFullyDelivered : !isFullyDelivered;
      });
    }

    return deliveries;
  },

  /**
   * GET /tenant-service-deliveries/:id
   */
  getById: async (id: string): Promise<TenantServiceDelivery> => {
    return adapter.getById(id);
  },

  /**
   * GET /tenant-service-deliveries/:id/details
   */
  getByIdWithDetails: async (id: string): Promise<ServiceDeliveryWithDetails> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    // Get delivery
    const { data: delivery, error: deliveryError } = await supabase
      .from('tenant_service_deliveries')
      .select('*')
      .eq('_id', id)
      .single();

    if (deliveryError || !delivery) {
      throw new Error(`Service delivery not found: ${deliveryError?.message || 'Unknown error'}`);
    }

    // Get product info
    let product_name: string | undefined;
    let product_code: string | undefined;
    if (delivery.product_id) {
      const { data: product } = await supabase
        .from('saas_products')
        .select('name, product_code')
        .eq('_id', delivery.product_id)
        .single();
      if (product) {
        product_name = product.name;
        product_code = product.product_code;
      }
    }

    // Get subscription info
    let subscription_status: string | undefined;
    if (delivery.subscription_id) {
      const { data: subscription } = await supabase
        .from('tenant_subscriptions')
        .select('status')
        .eq('_id', delivery.subscription_id)
        .single();
      subscription_status = subscription?.status;
    }

    // Get tenant name
    let tenant_name: string | undefined;
    if (delivery.tenant_id) {
      const { data: tenant } = await supabase
        .from('tenants')
        .select('name')
        .eq('_id', delivery.tenant_id)
        .single();
      tenant_name = tenant?.name;
    }

    // Calculate computed fields
    const remaining_units = delivery.total_units - delivery.delivered_units;
    const progress_percentage = (delivery.delivered_units / delivery.total_units) * 100;
    const total_value = delivery.total_units * delivery.unit_price;
    const delivered_value = delivery.delivered_units * delivery.unit_price;
    const remaining_value = remaining_units * delivery.unit_price;
    const is_fully_delivered = delivery.delivered_units >= delivery.total_units;
    const is_over_delivered = delivery.delivered_units > delivery.total_units;

    return {
      ...delivery,
      product_name,
      product_code,
      subscription_status,
      tenant_name,
      remaining_units,
      progress_percentage,
      total_value,
      delivered_value,
      remaining_value,
      is_fully_delivered,
      is_over_delivered,
    } as ServiceDeliveryWithDetails;
  },

  /**
   * POST /tenant-service-deliveries
   * Create with validation and defaults
   */
  create: async (data: CreateServiceDeliveryRequest): Promise<TenantServiceDelivery> => {
    // Validate
    const validation = tenantServiceDeliveriesApi.validate(data);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Apply defaults
    const requestData = {
      ...data,
      delivered_units: data.delivered_units !== undefined ? data.delivered_units : 0, // default
      unit_price: data.unit_price !== undefined ? data.unit_price : 0, // default
      currency_code: data.currency_code || 'VND', // default
      status: data.status || 'PENDING' as DeliveryStatus, // default
      service_metadata: data.service_metadata || {}, // default
      version: data.version || 1, // default
    };

    return adapter.create(requestData);
  },

  /**
   * PUT /tenant-service-deliveries/:id
   */
  update: async (id: string, data: UpdateServiceDeliveryRequest): Promise<TenantServiceDelivery> => {
    // Validate
    const validation = tenantServiceDeliveriesApi.validate(data);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    return adapter.update(id, data);
  },

  /**
   * DELETE /tenant-service-deliveries/:id
   */
  delete: async (id: string): Promise<void> => {
    return adapter.delete(id);
  },

  /**
   * GET /tenant-service-deliveries/by-tenant/:tenantId
   */
  getByTenant: async (tenantId: string): Promise<TenantServiceDelivery[]> => {
    return tenantServiceDeliveriesApi.getAll({ tenant_id: tenantId });
  },

  /**
   * GET /tenant-service-deliveries/by-product/:productId
   */
  getByProduct: async (productId: string, tenantId?: string): Promise<TenantServiceDelivery[]> => {
    return tenantServiceDeliveriesApi.getAll({
      product_id: productId,
      tenant_id: tenantId,
    });
  },

  /**
   * GET /tenant-service-deliveries/by-subscription/:subscriptionId
   */
  getBySubscription: async (subscriptionId: string): Promise<TenantServiceDelivery[]> => {
    return tenantServiceDeliveriesApi.getAll({ subscription_id: subscriptionId });
  },

  /**
   * GET /tenant-service-deliveries/pending
   */
  getPending: async (tenantId?: string): Promise<TenantServiceDelivery[]> => {
    return tenantServiceDeliveriesApi.getAll({
      tenant_id: tenantId,
      status: 'PENDING',
    });
  },

  /**
   * GET /tenant-service-deliveries/in-progress
   */
  getInProgress: async (tenantId?: string): Promise<TenantServiceDelivery[]> => {
    return tenantServiceDeliveriesApi.getAll({
      tenant_id: tenantId,
      status: 'IN_PROGRESS',
    });
  },

  /**
   * GET /tenant-service-deliveries/completed
   */
  getCompleted: async (tenantId?: string): Promise<TenantServiceDelivery[]> => {
    return tenantServiceDeliveriesApi.getAll({
      tenant_id: tenantId,
      status: 'COMPLETED',
    });
  },

  /**
   * GET /tenant-service-deliveries/cancelled
   */
  getCancelled: async (tenantId?: string): Promise<TenantServiceDelivery[]> => {
    return tenantServiceDeliveriesApi.getAll({
      tenant_id: tenantId,
      status: 'CANCELLED',
    });
  },

  /**
   * GET /tenant-service-deliveries/fully-delivered
   */
  getFullyDelivered: async (tenantId?: string): Promise<TenantServiceDelivery[]> => {
    return tenantServiceDeliveriesApi.getAll({
      tenant_id: tenantId,
      fully_delivered: true,
    });
  },

  /**
   * GET /tenant-service-deliveries/partial
   */
  getPartialDeliveries: async (tenantId?: string): Promise<TenantServiceDelivery[]> => {
    const deliveries = await tenantServiceDeliveriesApi.getAll({ tenant_id: tenantId });
    return deliveries.filter(
      (d) => d.delivered_units > 0 && d.delivered_units < d.total_units && d.status !== 'CANCELLED'
    );
  },

  /**
   * POST /tenant-service-deliveries/:id/start
   */
  start: async (id: string): Promise<TenantServiceDelivery> => {
    return tenantServiceDeliveriesApi.update(id, {
      status: 'IN_PROGRESS',
    });
  },

  /**
   * POST /tenant-service-deliveries/:id/complete
   */
  complete: async (id: string): Promise<TenantServiceDelivery> => {
    const delivery = await tenantServiceDeliveriesApi.getById(id);

    // Auto-set delivered_units to total_units if not already
    const updateData: UpdateServiceDeliveryRequest = {
      status: 'COMPLETED',
    };

    if (delivery.delivered_units < delivery.total_units) {
      updateData.delivered_units = delivery.total_units;
    }

    return tenantServiceDeliveriesApi.update(id, updateData);
  },

  /**
   * POST /tenant-service-deliveries/:id/cancel
   */
  cancel: async (id: string): Promise<TenantServiceDelivery> => {
    return tenantServiceDeliveriesApi.update(id, {
      status: 'CANCELLED',
    });
  },

  /**
   * POST /tenant-service-deliveries/:id/deliver
   * Record delivery progress
   */
  recordDelivery: async (id: string, progress: DeliveryProgress): Promise<TenantServiceDelivery> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    // Get current delivery
    const delivery = await tenantServiceDeliveriesApi.getById(id);

    // Validate delivery amount
    if (progress.units_to_deliver <= 0) {
      throw new Error('Delivery amount must be > 0');
    }

    const newDeliveredUnits = delivery.delivered_units + progress.units_to_deliver;

    // Check constraint: delivered_units <= total_units
    if (newDeliveredUnits > delivery.total_units) {
      throw new Error(
        `Cannot deliver ${progress.units_to_deliver} units. Would exceed total units (${delivery.total_units}). ` +
          `Current: ${delivery.delivered_units}, Remaining: ${delivery.total_units - delivery.delivered_units}`
      );
    }

    // Update metadata with delivery record
    const updatedMetadata = {
      ...delivery.service_metadata,
      delivery_history: [
        ...(delivery.service_metadata.delivery_history || []),
        {
          delivered_at: new Date().toISOString(),
          units_delivered: progress.units_to_deliver,
          description: progress.description,
          delivered_by: progress.delivered_by,
          metadata: progress.metadata,
        },
      ],
    };

    // Determine new status
    let newStatus = delivery.status;
    if (delivery.status === 'PENDING') {
      newStatus = 'IN_PROGRESS';
    }
    if (newDeliveredUnits >= delivery.total_units) {
      newStatus = 'COMPLETED';
    }

    // Update delivery
    const { data, error } = await supabase
      .from('tenant_service_deliveries')
      .update({
        delivered_units: newDeliveredUnits,
        status: newStatus,
        service_metadata: updatedMetadata,
        updated_at: new Date().toISOString(),
      })
      .eq('_id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to record delivery: ${error?.message || 'Unknown error'}`);
    }

    return data;
  },

  /**
   * GET /tenant-service-deliveries/statistics
   */
  getStatistics: async (tenantId?: string): Promise<ServiceDeliveryStatistics> => {
    const deliveries = await tenantServiceDeliveriesApi.getAll(tenantId ? { tenant_id: tenantId } : {});
    return calculateStatistics(deliveries);
  },

  /**
   * Client-side validation
   */
  validate: (data: Partial<CreateServiceDeliveryRequest | UpdateServiceDeliveryRequest>): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate required fields (create only)
    if ('tenant_id' in data && !data.tenant_id) {
      errors.push('Tenant ID không được để trống');
    }
    if ('product_id' in data && !data.product_id) {
      errors.push('Product ID không được để trống');
    }
    if ('unit_type' in data && !data.unit_type) {
      errors.push('Unit type không được để trống');
    }

    // Validate total_units
    if ('total_units' in data && data.total_units !== undefined) {
      if (data.total_units <= 0) {
        errors.push('Tổng số đơn vị phải > 0');
      }
    }

    // Validate delivered_units
    if ('delivered_units' in data && data.delivered_units !== undefined) {
      if (data.delivered_units < 0) {
        errors.push('Số đơn vị đã giao phải >= 0');
      }

      // Check constraint: delivered_units <= total_units
      if ('total_units' in data && data.total_units !== undefined) {
        if (data.delivered_units > data.total_units) {
          errors.push('Số đơn vị đã giao không được vượt quá tổng số đơn vị');
        }
      }
    }

    // Validate unit_price
    if ('unit_price' in data && data.unit_price !== undefined) {
      if (data.unit_price < 0) {
        errors.push('Đơn giá phải >= 0');
      }
    }

    // Validate currency_code
    if ('currency_code' in data && data.currency_code) {
      if (data.currency_code.length !== 3) {
        errors.push('Mã tiền tệ phải có 3 ký tự (VD: VND, USD)');
      }
    }

    // Validate version
    if ('version' in data && (data as any).version !== undefined) {
      const version = (data as any).version;
      if (typeof version === 'number' && version < 1) {
        errors.push('Version phải >= 1');
      }
    }

    // Warnings
    if ('delivered_units' in data && 'total_units' in data) {
      if (data.delivered_units === data.total_units && data.delivered_units! > 0) {
        warnings.push('Đã giao đủ số đơn vị, có thể chuyển trạng thái sang COMPLETED');
      }
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
 * Calculate statistics
 */
export function calculateStatistics(deliveries: TenantServiceDelivery[]): ServiceDeliveryStatistics {
  const byStatus: Record<DeliveryStatus, number> = {
    PENDING: 0,
    IN_PROGRESS: 0,
    COMPLETED: 0,
    CANCELLED: 0,
  };

  const byUnitType: Record<string, number> = {};
  const byCurrency: Record<string, number> = {};

  let pendingCount = 0;
  let inProgressCount = 0;
  let completedCount = 0;
  let cancelledCount = 0;
  let totalUnitsOrdered = 0;
  let totalUnitsDelivered = 0;
  let totalValue = 0;
  let deliveredValue = 0;
  let fullyDeliveredCount = 0;
  let overDeliveredCount = 0;
  let totalProgressPercentage = 0;
  let deliveriesWithProgress = 0;

  deliveries.forEach((delivery) => {
    // Count by status
    byStatus[delivery.status]++;

    switch (delivery.status) {
      case 'PENDING':
        pendingCount++;
        break;
      case 'IN_PROGRESS':
        inProgressCount++;
        break;
      case 'COMPLETED':
        completedCount++;
        break;
      case 'CANCELLED':
        cancelledCount++;
        break;
    }

    // Count by unit type
    byUnitType[delivery.unit_type] = (byUnitType[delivery.unit_type] || 0) + 1;

    // Count by currency
    byCurrency[delivery.currency_code] = (byCurrency[delivery.currency_code] || 0) + 1;

    // Calculate units
    totalUnitsOrdered += delivery.total_units;
    totalUnitsDelivered += delivery.delivered_units;

    // Calculate values
    totalValue += delivery.total_units * delivery.unit_price;
    deliveredValue += delivery.delivered_units * delivery.unit_price;

    // Check fully delivered
    if (delivery.delivered_units >= delivery.total_units) {
      fullyDeliveredCount++;
    }

    // Check over delivered (should not happen)
    if (delivery.delivered_units > delivery.total_units) {
      overDeliveredCount++;
    }

    // Calculate progress
    if (delivery.total_units > 0) {
      const progress = (delivery.delivered_units / delivery.total_units) * 100;
      totalProgressPercentage += progress;
      deliveriesWithProgress++;
    }
  });

  const totalUnitsRemaining = totalUnitsOrdered - totalUnitsDelivered;
  const remainingValue = totalValue - deliveredValue;
  const avgDeliveryPercentage = deliveriesWithProgress > 0 ? totalProgressPercentage / deliveriesWithProgress : null;

  return {
    total_deliveries: deliveries.length,
    pending_deliveries: pendingCount,
    in_progress_deliveries: inProgressCount,
    completed_deliveries: completedCount,
    cancelled_deliveries: cancelledCount,
    by_status: byStatus,
    by_unit_type: byUnitType,
    by_currency: byCurrency,
    total_units_ordered: totalUnitsOrdered,
    total_units_delivered: totalUnitsDelivered,
    total_units_remaining: totalUnitsRemaining,
    average_delivery_percentage: avgDeliveryPercentage,
    total_value: totalValue,
    delivered_value: deliveredValue,
    remaining_value: remainingValue,
    fully_delivered_count: fullyDeliveredCount,
    over_delivered_count: overDeliveredCount,
  };
}

/**
 * Get status label
 */
export function getStatusLabel(status: DeliveryStatus): string {
  const labels: Record<DeliveryStatus, string> = {
    PENDING: 'Chờ thực hiện',
    IN_PROGRESS: 'Đang thực hiện',
    COMPLETED: 'Hoàn thành',
    CANCELLED: 'Đã hủy',
  };
  return labels[status];
}

/**
 * Get status color
 */
export function getStatusColor(status: DeliveryStatus): string {
  const colors: Record<DeliveryStatus, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    IN_PROGRESS: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    CANCELLED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
  };
  return colors[status];
}

/**
 * Calculate progress percentage
 */
export function calculateProgress(delivery: TenantServiceDelivery): number {
  if (delivery.total_units === 0) return 0;
  return Math.min(100, (delivery.delivered_units / delivery.total_units) * 100);
}

/**
 * Get remaining units
 */
export function getRemainingUnits(delivery: TenantServiceDelivery): number {
  return Math.max(0, delivery.total_units - delivery.delivered_units);
}

/**
 * Calculate total value
 */
export function calculateTotalValue(delivery: TenantServiceDelivery): number {
  return delivery.total_units * delivery.unit_price;
}

/**
 * Calculate delivered value
 */
export function calculateDeliveredValue(delivery: TenantServiceDelivery): number {
  return delivery.delivered_units * delivery.unit_price;
}

/**
 * Calculate remaining value
 */
export function calculateRemainingValue(delivery: TenantServiceDelivery): number {
  return getRemainingUnits(delivery) * delivery.unit_price;
}

/**
 * Check if fully delivered
 */
export function isFullyDelivered(delivery: TenantServiceDelivery): boolean {
  return delivery.delivered_units >= delivery.total_units;
}

/**
 * Check if over delivered (constraint violation)
 */
export function isOverDelivered(delivery: TenantServiceDelivery): boolean {
  return delivery.delivered_units > delivery.total_units;
}

/**
 * Format currency
 */
export function formatCurrency(amount: number, currencyCode: string): string {
  const currencySymbols: Record<string, string> = {
    VND: '₫',
    USD: '$',
    EUR: '€',
  };

  const symbol = currencySymbols[currencyCode] || currencyCode;

  if (currencyCode === 'VND') {
    return `${amount.toLocaleString('vi-VN')}${symbol}`;
  }

  return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default tenantServiceDeliveriesApi;
