/**
 * Tenant Rate Limits API Client
 * Uses Adapter pattern - Ready for Golang migration
 * 
 * ✅ ENHANCED 2026-01-16: 100% database alignment + Complete implementation
 * Database: tenant_rate_limits (35 fields, complex constraints, usage tracking)
 */

import { createAdapter, BaseFilters } from './adapters';

// ==================== TYPES ====================

export type ResourceType = 'api' | 'storage' | 'database' | 'compute' | 'network' | 'email' | 'sms';
export type LimitType = 'sliding_window' | 'fixed_window' | 'token_bucket' | 'leaky_bucket';
export type LimitScope = 'tenant' | 'user' | 'ip' | 'api_key' | 'global';
export type WindowUnit = 'second' | 'minute' | 'hour' | 'day' | 'month';

export const ResourceTypeHelper = {
  API: 'api' as ResourceType,
  STORAGE: 'storage' as ResourceType,
  DATABASE: 'database' as ResourceType,
  COMPUTE: 'compute' as ResourceType,
  NETWORK: 'network' as ResourceType,
  EMAIL: 'email' as ResourceType,
  SMS: 'sms' as ResourceType,

  isAPI: (type: ResourceType) => type === 'api',
  isStorage: (type: ResourceType) => type === 'storage',
  isDatabase: (type: ResourceType) => type === 'database',
  isCompute: (type: ResourceType) => type === 'compute',
  isNetwork: (type: ResourceType) => type === 'network',
  isEmail: (type: ResourceType) => type === 'email',
  isSMS: (type: ResourceType) => type === 'sms',
};

export const LimitTypeHelper = {
  SLIDING_WINDOW: 'sliding_window' as LimitType,
  FIXED_WINDOW: 'fixed_window' as LimitType,
  TOKEN_BUCKET: 'token_bucket' as LimitType,
  LEAKY_BUCKET: 'leaky_bucket' as LimitType,

  isSlidingWindow: (type: LimitType) => type === 'sliding_window',
  isFixedWindow: (type: LimitType) => type === 'fixed_window',
  isTokenBucket: (type: LimitType) => type === 'token_bucket',
  isLeakyBucket: (type: LimitType) => type === 'leaky_bucket',
};

export const LimitScopeHelper = {
  TENANT: 'tenant' as LimitScope,
  USER: 'user' as LimitScope,
  IP: 'ip' as LimitScope,
  API_KEY: 'api_key' as LimitScope,
  GLOBAL: 'global' as LimitScope,

  isTenant: (scope: LimitScope) => scope === 'tenant',
  isUser: (scope: LimitScope) => scope === 'user',
  isIP: (scope: LimitScope) => scope === 'ip',
  isAPIKey: (scope: LimitScope) => scope === 'api_key',
  isGlobal: (scope: LimitScope) => scope === 'global',
};

export const WindowUnitHelper = {
  SECOND: 'second' as WindowUnit,
  MINUTE: 'minute' as WindowUnit,
  HOUR: 'hour' as WindowUnit,
  DAY: 'day' as WindowUnit,
  MONTH: 'month' as WindowUnit,

  isSecond: (unit: WindowUnit) => unit === 'second',
  isMinute: (unit: WindowUnit) => unit === 'minute',
  isHour: (unit: WindowUnit) => unit === 'hour',
  isDay: (unit: WindowUnit) => unit === 'day',
  isMonth: (unit: WindowUnit) => unit === 'month',
};

// ==================== MAIN INTERFACE ====================

/**
 * TenantRateLimit - 100% matches tenant_rate_limits table (35 fields)
 */
export interface TenantRateLimit {
  // I. IDENTITY & RELATIONSHIPS (3)
  _id: string;
  tenant_id: string;
  service_package_id: string | null;

  // II. LIMIT DEFINITION (7)
  limit_name: string; // varchar(255), NOT NULL
  limit_key: string; // varchar(255), NOT NULL
  resource_type: ResourceType | null; // varchar(100)
  endpoint_pattern: string | null; // varchar(500)
  max_requests: number; // integer, NOT NULL, > 0
  time_window: number; // integer, NOT NULL, > 0
  window_unit: WindowUnit; // varchar(20), default 'second'

  // III. LIMIT CONFIGURATION (4)
  burst_limit: number | null; // Must be >= max_requests if set
  concurrent_limit: number | null; // Must be > 0 if set
  limit_type: LimitType; // varchar(50), default 'sliding_window'
  limit_scope: LimitScope; // varchar(50), default 'tenant'

  // IV. BEHAVIOR (6)
  is_enabled: boolean; // default true
  is_strict: boolean; // default true
  block_duration: number | null;
  retry_after: number | null;
  custom_error_message: string | null; // text
  custom_error_code: string | null; // varchar(50)

  // V. USAGE TRACKING (4)
  current_usage: number; // integer, default 0, >= 0
  peak_usage: number; // integer, default 0, >= 0
  last_exceeded_at: string | null; // timestamp
  exceeded_count: number; // integer, default 0, >= 0

  // VI. ALERTS (2)
  alert_threshold: number | null; // 1-100 percentage, or NULL
  alert_enabled: boolean; // default false

  // VII. PRIORITY & OVERRIDE (3)
  priority: number; // integer, default 0, >= 0
  can_override: boolean; // default false
  override_until: string | null; // timestamp

  // VIII. METADATA (3)
  description: string | null; // text
  tags: string[] | null; // text[]
  metadata: Record<string, any>; // jsonb, default {}

  // IX. AUDIT TRAIL (4)
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface RateLimitWithDetails extends TenantRateLimit {
  // Computed fields
  rate_per_second?: number; // Normalized rate
  usage_percentage?: number; // current_usage / max_requests * 100
  is_exceeded?: boolean; // current_usage >= max_requests
  is_near_limit?: boolean; // usage_percentage >= alert_threshold
  time_until_reset?: number; // Seconds until window reset
  can_request?: boolean; // Based on current usage and limits
}

// ==================== REQUEST INTERFACES ====================

export interface CreateRateLimitRequest {
  // Required
  tenant_id: string;
  limit_name: string;
  limit_key: string;
  max_requests: number;
  time_window: number;

  // Optional with defaults
  window_unit?: WindowUnit; // default: 'second'
  limit_type?: LimitType; // default: 'sliding_window'
  limit_scope?: LimitScope; // default: 'tenant'
  is_enabled?: boolean; // default: true
  is_strict?: boolean; // default: true
  current_usage?: number; // default: 0
  peak_usage?: number; // default: 0
  exceeded_count?: number; // default: 0
  alert_enabled?: boolean; // default: false
  priority?: number; // default: 0
  can_override?: boolean; // default: false
  metadata?: Record<string, any>; // default: {}

  // Optional
  service_package_id?: string | null;
  resource_type?: ResourceType | null;
  endpoint_pattern?: string | null;
  burst_limit?: number | null;
  concurrent_limit?: number | null;
  block_duration?: number | null;
  retry_after?: number | null;
  custom_error_message?: string | null;
  custom_error_code?: string | null;
  alert_threshold?: number | null;
  override_until?: string | null;
  description?: string | null;
  tags?: string[] | null;
  created_by?: string | null;
}

export interface UpdateRateLimitRequest {
  service_package_id?: string | null;
  limit_name?: string;
  limit_key?: string;
  resource_type?: ResourceType | null;
  endpoint_pattern?: string | null;
  max_requests?: number;
  time_window?: number;
  window_unit?: WindowUnit;
  burst_limit?: number | null;
  concurrent_limit?: number | null;
  limit_type?: LimitType;
  limit_scope?: LimitScope;
  is_enabled?: boolean;
  is_strict?: boolean;
  block_duration?: number | null;
  retry_after?: number | null;
  custom_error_message?: string | null;
  custom_error_code?: string | null;
  alert_threshold?: number | null;
  alert_enabled?: boolean;
  priority?: number;
  can_override?: boolean;
  override_until?: string | null;
  description?: string | null;
  tags?: string[] | null;
  metadata?: Record<string, any>;
  updated_by?: string | null;
}

export interface RateLimitFilters extends BaseFilters {
  tenant_id?: string;
  service_package_id?: string;
  resource_type?: ResourceType;
  limit_type?: LimitType;
  limit_scope?: LimitScope;
  window_unit?: WindowUnit;
  is_enabled?: boolean;
  is_strict?: boolean;
  alert_enabled?: boolean;
  can_override?: boolean;
  has_alerts?: boolean;
  exceeded?: boolean;
  endpoint_pattern?: string;
  limit_key?: string;
  search?: string;
}

// ==================== STATISTICS ====================

export interface RateLimitStatistics {
  total_limits: number;
  enabled_limits: number;
  disabled_limits: number;
  exceeded_limits: number;
  with_alerts: number;
  by_resource_type: Record<ResourceType | 'null', number>;
  by_limit_type: Record<LimitType, number>;
  by_limit_scope: Record<LimitScope, number>;
  by_window_unit: Record<WindowUnit, number>;
  average_usage_percentage: number | null;
  highest_exceeded_count: number;
  total_exceeded_events: number;
}

// ==================== VALIDATION ====================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// ==================== ADAPTER ====================

const adapter = createAdapter<TenantRateLimit, CreateRateLimitRequest, UpdateRateLimitRequest>(
  'tenant_rate_limits',
  '/tenant-rate-limits',
  false // No soft delete
);

// ==================== API CLIENT ====================

export const tenantRateLimitsApi = {
  /**
   * GET /tenant-rate-limits
   */
  getAll: async (filters?: RateLimitFilters): Promise<TenantRateLimit[]> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    let query = supabase
      .from('tenant_rate_limits')
      .select('*')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters?.tenant_id) query = query.eq('tenant_id', filters.tenant_id);
    if (filters?.service_package_id) query = query.eq('service_package_id', filters.service_package_id);
    if (filters?.resource_type) query = query.eq('resource_type', filters.resource_type);
    if (filters?.limit_type) query = query.eq('limit_type', filters.limit_type);
    if (filters?.limit_scope) query = query.eq('limit_scope', filters.limit_scope);
    if (filters?.window_unit) query = query.eq('window_unit', filters.window_unit);
    if (filters?.is_enabled !== undefined) query = query.eq('is_enabled', filters.is_enabled);
    if (filters?.is_strict !== undefined) query = query.eq('is_strict', filters.is_strict);
    if (filters?.alert_enabled !== undefined) query = query.eq('alert_enabled', filters.alert_enabled);
    if (filters?.can_override !== undefined) query = query.eq('can_override', filters.can_override);
    if (filters?.endpoint_pattern) query = query.eq('endpoint_pattern', filters.endpoint_pattern);
    if (filters?.limit_key) query = query.eq('limit_key', filters.limit_key);

    // Pagination
    if (filters?.limit) query = query.limit(filters.limit);
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch rate limits: ${error.message}`);
    }

    let limits = data || [];

    // Client-side filters
    if (filters?.has_alerts) {
      limits = limits.filter((l) => l.alert_enabled && l.alert_threshold !== null);
    }
    if (filters?.exceeded) {
      limits = limits.filter((l) => l.exceeded_count > 0);
    }

    return limits;
  },

  /**
   * GET /tenant-rate-limits/:id
   */
  getById: async (id: string): Promise<TenantRateLimit> => {
    return adapter.getById(id);
  },

  /**
   * GET /tenant-rate-limits/:id/details
   */
  getByIdWithDetails: async (id: string): Promise<RateLimitWithDetails> => {
    const limit = await tenantRateLimitsApi.getById(id);

    const rate_per_second = calculateRatePerSecond(limit);
    const usage_percentage = (limit.current_usage / limit.max_requests) * 100;
    const is_exceeded = limit.current_usage >= limit.max_requests;
    const is_near_limit = limit.alert_threshold ? usage_percentage >= limit.alert_threshold : false;

    return {
      ...limit,
      rate_per_second,
      usage_percentage,
      is_exceeded,
      is_near_limit,
      can_request: limit.current_usage < limit.max_requests && limit.is_enabled,
    };
  },

  /**
   * POST /tenant-rate-limits
   * Create with validation and defaults
   */
  create: async (data: CreateRateLimitRequest): Promise<TenantRateLimit> => {
    // Validate
    const validation = tenantRateLimitsApi.validate(data);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Apply defaults
    const requestData = {
      ...data,
      window_unit: data.window_unit || 'second' as WindowUnit, // default
      limit_type: data.limit_type || 'sliding_window' as LimitType, // default
      limit_scope: data.limit_scope || 'tenant' as LimitScope, // default
      is_enabled: data.is_enabled !== undefined ? data.is_enabled : true, // default
      is_strict: data.is_strict !== undefined ? data.is_strict : true, // default
      current_usage: data.current_usage || 0, // default
      peak_usage: data.peak_usage || 0, // default
      exceeded_count: data.exceeded_count || 0, // default
      alert_enabled: data.alert_enabled !== undefined ? data.alert_enabled : false, // default
      priority: data.priority || 0, // default
      can_override: data.can_override !== undefined ? data.can_override : false, // default
      metadata: data.metadata || {}, // default
    };

    return adapter.create(requestData);
  },

  /**
   * PUT /tenant-rate-limits/:id
   */
  update: async (id: string, data: UpdateRateLimitRequest): Promise<TenantRateLimit> => {
    // Validate
    const validation = tenantRateLimitsApi.validate(data);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    return adapter.update(id, data);
  },

  /**
   * DELETE /tenant-rate-limits/:id
   */
  delete: async (id: string): Promise<void> => {
    return adapter.delete(id);
  },

  /**
   * GET /tenant-rate-limits/by-tenant/:tenantId
   */
  getByTenant: async (tenantId: string): Promise<TenantRateLimit[]> => {
    return tenantRateLimitsApi.getAll({ tenant_id: tenantId });
  },

  /**
   * GET /tenant-rate-limits/enabled
   */
  getEnabled: async (tenantId?: string): Promise<TenantRateLimit[]> => {
    return tenantRateLimitsApi.getAll({
      tenant_id: tenantId,
      is_enabled: true,
    });
  },

  /**
   * GET /tenant-rate-limits/disabled
   */
  getDisabled: async (tenantId?: string): Promise<TenantRateLimit[]> => {
    return tenantRateLimitsApi.getAll({
      tenant_id: tenantId,
      is_enabled: false,
    });
  },

  /**
   * GET /tenant-rate-limits/by-resource/:resourceType
   */
  getByResourceType: async (resourceType: ResourceType, tenantId?: string): Promise<TenantRateLimit[]> => {
    return tenantRateLimitsApi.getAll({
      tenant_id: tenantId,
      resource_type: resourceType,
    });
  },

  /**
   * GET /tenant-rate-limits/by-limit-type/:limitType
   */
  getByLimitType: async (limitType: LimitType, tenantId?: string): Promise<TenantRateLimit[]> => {
    return tenantRateLimitsApi.getAll({
      tenant_id: tenantId,
      limit_type: limitType,
    });
  },

  /**
   * GET /tenant-rate-limits/by-scope/:limitScope
   */
  getByLimitScope: async (limitScope: LimitScope, tenantId?: string): Promise<TenantRateLimit[]> => {
    return tenantRateLimitsApi.getAll({
      tenant_id: tenantId,
      limit_scope: limitScope,
    });
  },

  /**
   * GET /tenant-rate-limits/exceeded
   */
  getExceeded: async (tenantId?: string): Promise<TenantRateLimit[]> => {
    return tenantRateLimitsApi.getAll({
      tenant_id: tenantId,
      exceeded: true,
    });
  },

  /**
   * GET /tenant-rate-limits/with-alerts
   */
  getWithAlerts: async (tenantId?: string): Promise<TenantRateLimit[]> => {
    return tenantRateLimitsApi.getAll({
      tenant_id: tenantId,
      has_alerts: true,
    });
  },

  /**
   * PUT /tenant-rate-limits/:id/enable
   */
  enable: async (id: string, updatedBy?: string): Promise<TenantRateLimit> => {
    return tenantRateLimitsApi.update(id, {
      is_enabled: true,
      updated_by: updatedBy || null,
    });
  },

  /**
   * PUT /tenant-rate-limits/:id/disable
   */
  disable: async (id: string, updatedBy?: string): Promise<TenantRateLimit> => {
    return tenantRateLimitsApi.update(id, {
      is_enabled: false,
      updated_by: updatedBy || null,
    });
  },

  /**
   * POST /tenant-rate-limits/:id/reset-usage
   */
  resetUsage: async (id: string, updatedBy?: string): Promise<TenantRateLimit> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('tenant_rate_limits')
      .update({
        current_usage: 0,
        updated_by: updatedBy || null,
        updated_at: new Date().toISOString(),
      })
      .eq('_id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to reset usage: ${error?.message || 'Unknown error'}`);
    }

    return data;
  },

  /**
   * PUT /tenant-rate-limits/:id/alert-threshold
   */
  setAlertThreshold: async (id: string, threshold: number | null, updatedBy?: string): Promise<TenantRateLimit> => {
    if (threshold !== null && (threshold <= 0 || threshold > 100)) {
      throw new Error('Alert threshold must be between 1 and 100');
    }
    return tenantRateLimitsApi.update(id, {
      alert_threshold: threshold,
      updated_by: updatedBy || null,
    });
  },

  /**
   * PUT /tenant-rate-limits/:id/toggle-alert
   */
  toggleAlert: async (id: string, enabled: boolean, updatedBy?: string): Promise<TenantRateLimit> => {
    return tenantRateLimitsApi.update(id, {
      alert_enabled: enabled,
      updated_by: updatedBy || null,
    });
  },

  /**
   * PUT /tenant-rate-limits/:id/priority
   */
  setPriority: async (id: string, priority: number, updatedBy?: string): Promise<TenantRateLimit> => {
    if (priority < 0) {
      throw new Error('Priority must be >= 0');
    }
    return tenantRateLimitsApi.update(id, {
      priority,
      updated_by: updatedBy || null,
    });
  },

  /**
   * PUT /tenant-rate-limits/:id/override
   */
  setOverride: async (id: string, until: string | null, updatedBy?: string): Promise<TenantRateLimit> => {
    return tenantRateLimitsApi.update(id, {
      override_until: until,
      updated_by: updatedBy || null,
    });
  },

  /**
   * POST /tenant-rate-limits/:id/clone
   */
  clone: async (id: string, targetTenantId: string, createdBy?: string): Promise<TenantRateLimit> => {
    const source = await tenantRateLimitsApi.getById(id);

    const cloneData: CreateRateLimitRequest = {
      tenant_id: targetTenantId,
      service_package_id: source.service_package_id,
      limit_name: `${source.limit_name} (Copy)`,
      limit_key: source.limit_key,
      resource_type: source.resource_type,
      endpoint_pattern: source.endpoint_pattern,
      max_requests: source.max_requests,
      time_window: source.time_window,
      window_unit: source.window_unit,
      burst_limit: source.burst_limit,
      concurrent_limit: source.concurrent_limit,
      limit_type: source.limit_type,
      limit_scope: source.limit_scope,
      is_enabled: source.is_enabled,
      is_strict: source.is_strict,
      block_duration: source.block_duration,
      retry_after: source.retry_after,
      custom_error_message: source.custom_error_message,
      custom_error_code: source.custom_error_code,
      alert_threshold: source.alert_threshold,
      alert_enabled: source.alert_enabled,
      priority: source.priority,
      can_override: source.can_override,
      description: source.description,
      tags: source.tags,
      metadata: source.metadata,
      created_by: createdBy || null,
    };

    return tenantRateLimitsApi.create(cloneData);
  },

  /**
   * GET /tenant-rate-limits/statistics
   */
  getStatistics: async (tenantId?: string): Promise<RateLimitStatistics> => {
    const limits = await tenantRateLimitsApi.getAll(tenantId ? { tenant_id: tenantId } : {});
    return calculateStatistics(limits);
  },

  /**
   * Client-side validation
   */
  validate: (data: Partial<CreateRateLimitRequest | UpdateRateLimitRequest>): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate required fields (only for create)
    if ('tenant_id' in data && !data.tenant_id) {
      errors.push('Tenant ID không được để trống');
    }
    if ('limit_name' in data && !data.limit_name) {
      errors.push('Tên giới hạn không được để trống');
    }
    if ('limit_key' in data && !data.limit_key) {
      errors.push('Khóa giới hạn không được để trống');
    }

    // Validate max_requests
    if ('max_requests' in data && data.max_requests !== undefined) {
      if (data.max_requests <= 0) {
        errors.push('Số request tối đa phải > 0');
      }
    }

    // Validate time_window
    if ('time_window' in data && data.time_window !== undefined) {
      if (data.time_window <= 0) {
        errors.push('Cửa sổ thời gian phải > 0');
      }
    }

    // Validate burst_limit
    if ('burst_limit' in data && data.burst_limit !== null && data.burst_limit !== undefined) {
      if ('max_requests' in data && data.max_requests !== undefined) {
        if (data.burst_limit < data.max_requests) {
          errors.push('Burst limit phải >= max_requests');
        }
      }
    }

    // Validate concurrent_limit
    if ('concurrent_limit' in data && data.concurrent_limit !== null && data.concurrent_limit !== undefined) {
      if (data.concurrent_limit <= 0) {
        errors.push('Concurrent limit phải > 0');
      }
    }

    // Validate alert_threshold
    if ('alert_threshold' in data && data.alert_threshold !== null && data.alert_threshold !== undefined) {
      if (data.alert_threshold <= 0 || data.alert_threshold > 100) {
        errors.push('Alert threshold phải từ 1-100');
      }
    }

    // Validate priority
    if ('priority' in data && data.priority !== undefined) {
      if (data.priority < 0) {
        errors.push('Priority phải >= 0');
      }
    }

    // Warnings
    if ('is_strict' in data && data.is_strict === false) {
      warnings.push('Chế độ không nghiêm ngặt có thể cho phép vượt quá giới hạn');
    }
    if ('can_override' in data && data.can_override === true) {
      warnings.push('Cho phép ghi đè có thể làm giảm hiệu quả rate limiting');
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
export function calculateStatistics(limits: TenantRateLimit[]): RateLimitStatistics {
  const byResourceType: Record<ResourceType | 'null', number> = {
    api: 0,
    storage: 0,
    database: 0,
    compute: 0,
    network: 0,
    email: 0,
    sms: 0,
    null: 0,
  };

  const byLimitType: Record<LimitType, number> = {
    sliding_window: 0,
    fixed_window: 0,
    token_bucket: 0,
    leaky_bucket: 0,
  };

  const byLimitScope: Record<LimitScope, number> = {
    tenant: 0,
    user: 0,
    ip: 0,
    api_key: 0,
    global: 0,
  };

  const byWindowUnit: Record<WindowUnit, number> = {
    second: 0,
    minute: 0,
    hour: 0,
    day: 0,
    month: 0,
  };

  let enabledCount = 0;
  let disabledCount = 0;
  let exceededCount = 0;
  let withAlerts = 0;
  let totalUsagePercentage = 0;
  let limitsWithUsage = 0;
  let highestExceededCount = 0;
  let totalExceededEvents = 0;

  limits.forEach((limit) => {
    // Count by resource type
    const resourceKey = limit.resource_type || 'null';
    byResourceType[resourceKey]++;

    // Count by limit type
    byLimitType[limit.limit_type]++;

    // Count by limit scope
    byLimitScope[limit.limit_scope]++;

    // Count by window unit
    byWindowUnit[limit.window_unit]++;

    // Count enabled/disabled
    if (limit.is_enabled) {
      enabledCount++;
    } else {
      disabledCount++;
    }

    // Count exceeded
    if (limit.exceeded_count > 0) {
      exceededCount++;
      totalExceededEvents += limit.exceeded_count;
      highestExceededCount = Math.max(highestExceededCount, limit.exceeded_count);
    }

    // Count with alerts
    if (limit.alert_enabled && limit.alert_threshold !== null) {
      withAlerts++;
    }

    // Calculate usage percentage
    if (limit.max_requests > 0) {
      const usagePercentage = (limit.current_usage / limit.max_requests) * 100;
      totalUsagePercentage += usagePercentage;
      limitsWithUsage++;
    }
  });

  const avgUsagePercentage = limitsWithUsage > 0 ? totalUsagePercentage / limitsWithUsage : null;

  return {
    total_limits: limits.length,
    enabled_limits: enabledCount,
    disabled_limits: disabledCount,
    exceeded_limits: exceededCount,
    with_alerts: withAlerts,
    by_resource_type: byResourceType,
    by_limit_type: byLimitType,
    by_limit_scope: byLimitScope,
    by_window_unit: byWindowUnit,
    average_usage_percentage: avgUsagePercentage,
    highest_exceeded_count: highestExceededCount,
    total_exceeded_events: totalExceededEvents,
  };
}

/**
 * Get resource type label
 */
export function getResourceTypeLabel(type: ResourceType | null): string {
  if (!type) return 'Không xác định';
  const labels: Record<ResourceType, string> = {
    api: 'API',
    storage: 'Lưu trữ',
    database: 'Cơ sở dữ liệu',
    compute: 'Tính toán',
    network: 'Mạng',
    email: 'Email',
    sms: 'SMS',
  };
  return labels[type];
}

/**
 * Get resource type color
 */
export function getResourceTypeColor(type: ResourceType | null): string {
  if (!type) return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
  const colors: Record<ResourceType, string> = {
    api: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    storage: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    database: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    compute: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    network: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
    email: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
    sms: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  };
  return colors[type];
}

/**
 * Get limit type label
 */
export function getLimitTypeLabel(type: LimitType): string {
  const labels: Record<LimitType, string> = {
    sliding_window: 'Cửa sổ trượt',
    fixed_window: 'Cửa sổ cố định',
    token_bucket: 'Token bucket',
    leaky_bucket: 'Leaky bucket',
  };
  return labels[type];
}

/**
 * Get limit type description
 */
export function getLimitTypeDescription(type: LimitType): string {
  const descriptions: Record<LimitType, string> = {
    sliding_window: 'Đếm request trong cửa sổ thời gian trượt',
    fixed_window: 'Đếm request trong cửa sổ thời gian cố định',
    token_bucket: 'Sử dụng tokens, cho phép burst traffic',
    leaky_bucket: 'Xử lý request với tốc độ đều đặn',
  };
  return descriptions[type];
}

/**
 * Get limit scope label
 */
export function getLimitScopeLabel(scope: LimitScope): string {
  const labels: Record<LimitScope, string> = {
    tenant: 'Toàn tenant',
    user: 'Từng người dùng',
    ip: 'Địa chỉ IP',
    api_key: 'API key',
    global: 'Toàn cục',
  };
  return labels[scope];
}

/**
 * Get window unit label
 */
export function getWindowUnitLabel(unit: WindowUnit): string {
  const labels: Record<WindowUnit, string> = {
    second: 'giây',
    minute: 'phút',
    hour: 'giờ',
    day: 'ngày',
    month: 'tháng',
  };
  return labels[unit];
}

/**
 * Convert time window to seconds
 */
export function convertToSeconds(time_window: number, window_unit: WindowUnit): number {
  const multipliers: Record<WindowUnit, number> = {
    second: 1,
    minute: 60,
    hour: 3600,
    day: 86400,
    month: 2592000, // 30 days
  };
  return time_window * multipliers[window_unit];
}

/**
 * Calculate rate per second
 */
export function calculateRatePerSecond(limit: TenantRateLimit): number {
  const windowInSeconds = convertToSeconds(limit.time_window, limit.window_unit);
  return limit.max_requests / windowInSeconds;
}

/**
 * Check if limit is exceeded
 */
export function isExceeded(limit: TenantRateLimit): boolean {
  return limit.current_usage >= limit.max_requests;
}

/**
 * Check if limit is near threshold
 */
export function isNearLimit(limit: TenantRateLimit): boolean {
  if (!limit.alert_threshold) return false;
  const usagePercentage = (limit.current_usage / limit.max_requests) * 100;
  return usagePercentage >= limit.alert_threshold;
}

/**
 * Format rate for display
 */
export function formatRate(limit: TenantRateLimit): string {
  return `${limit.max_requests} request/${limit.time_window} ${getWindowUnitLabel(limit.window_unit)}`;
}

export default tenantRateLimitsApi;
