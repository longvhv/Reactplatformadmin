/**
 * Tenant Rate Limits API Client
 * Manages rate limiting configurations per tenant
 * 
 * ✅ COMPLIANT with public.tenant_rate_limits schema (docs/Tables.md)
 * ✅ NO Versioning (No optimistic locking)
 * ✅ NO Soft Delete (Hard delete only)
 */

import { createAdapter, BaseFilters } from './adapters';

// ==================== TYPES ====================

export type WindowUnit = 'second' | 'minute' | 'hour' | 'day' | 'month';
export type LimitType = 'sliding_window' | 'fixed_window' | 'token_bucket' | 'leaky_bucket';
export type ResourceType = 'api' | 'storage' | 'database' | 'compute' | 'network' | 'email' | 'sms';
export type LimitScope = 'tenant' | 'user' | 'ip' | 'api_key' | 'global';

export interface TenantRateLimit {
  // Identity
  _id: string;
  tenant_id: string;
  service_package_id?: string;
  
  // Configuration
  limit_name: string;
  limit_key: string;
  resource_type?: ResourceType;
  endpoint_pattern?: string;
  
  // Limits
  max_requests: number;      // > 0
  time_window: number;       // > 0
  window_unit: WindowUnit;
  burst_limit?: number;
  concurrent_limit?: number;
  
  // Strategy
  limit_type: LimitType;
  limit_scope: LimitScope;
  
  // Behavior
  is_enabled: boolean;
  is_strict: boolean;
  block_duration?: number;
  retry_after?: number;
  custom_error_message?: string;
  custom_error_code?: string;
  
  // Usage & Stats
  current_usage: number;
  peak_usage: number;
  last_exceeded_at?: string;
  exceeded_count: number;
  
  // Alerting
  alert_threshold?: number;
  alert_enabled: boolean;
  
  // Management
  priority: number;
  can_override: boolean;
  override_until?: string;
  
  // Metadata & Audit
  description?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  
  // NO version field
}

export interface CreateRateLimitRequest {
  tenant_id: string;
  service_package_id?: string;
  limit_name: string;
  limit_key: string;
  resource_type?: ResourceType;
  endpoint_pattern?: string;
  
  max_requests: number;
  time_window: number;
  window_unit?: WindowUnit;
  burst_limit?: number;
  concurrent_limit?: number;
  
  limit_type?: LimitType;
  limit_scope?: LimitScope;
  
  is_enabled?: boolean;
  is_strict?: boolean;
  block_duration?: number;
  retry_after?: number;
  custom_error_message?: string;
  custom_error_code?: string;
  
  alert_threshold?: number;
  alert_enabled?: boolean;
  priority?: number;
  can_override?: boolean;
  override_until?: string;
  
  description?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface UpdateRateLimitRequest {
  // All fields except _id, tenant_id, created_* can be updated
  service_package_id?: string;
  limit_name?: string;
  limit_key?: string;
  resource_type?: ResourceType;
  endpoint_pattern?: string;
  
  max_requests?: number;
  time_window?: number;
  window_unit?: WindowUnit;
  burst_limit?: number;
  concurrent_limit?: number;
  
  limit_type?: LimitType;
  limit_scope?: LimitScope;
  
  is_enabled?: boolean;
  is_strict?: boolean;
  block_duration?: number;
  retry_after?: number;
  custom_error_message?: string;
  custom_error_code?: string;
  
  alert_threshold?: number;
  alert_enabled?: boolean;
  priority?: number;
  can_override?: boolean;
  override_until?: string;
  
  description?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface RateLimitFilters extends BaseFilters {
  tenant_id?: string;
  resource_type?: ResourceType;
  is_enabled?: boolean;
  search?: string;
  limit_type?: LimitType;
  limit_scope?: LimitScope;
  alert_enabled?: boolean;
}

// ==================== ADAPTER ====================

const adapter = createAdapter<TenantRateLimit, CreateRateLimitRequest, UpdateRateLimitRequest>(
  'tenant_rate_limits',
  '/tenant-rate-limits',
  { supportsSoftDelete: false } // Explicitly disable soft delete
);

// ==================== API CLIENT ====================

export const tenantRateLimitsApi = {
  getAll: (filters?: RateLimitFilters) => adapter.getAll(filters),
  getById: (id: string) => adapter.getById(id),
  create: (data: CreateRateLimitRequest) => adapter.create(data),
  update: (id: string, data: UpdateRateLimitRequest) => adapter.update(id, data),
  delete: (id: string) => adapter.delete(id),
  
  // Specific methods
  getByTenant: (tenantId: string) => adapter.getAll({ tenant_id: tenantId }),
  
  enable: async (id: string) => {
    return adapter.update(id, { is_enabled: true });
  },

  disable: async (id: string) => {
    return adapter.update(id, { is_enabled: false });
  },
  
  resetUsage: async (id: string) => {
    // This typically requires a specific backend endpoint as it resets counters
    // For now we map to an update, but logically this might need a custom endpoint
    // If backend doesn't support resetting usage via update, this might fail or do nothing
    // Assuming we can reset by setting current_usage = 0 if exposed, 
    // but typically usage is read-only. 
    // TODO: Implement custom endpoint for reset
    // return adapter.post(`/${id}/reset`);
    // Fallback:
    return adapter.update(id, { metadata: { last_reset: new Date().toISOString() } }); 
  },

  toggleAlert: async (id: string, enabled: boolean) => {
    return adapter.update(id, { alert_enabled: enabled });
  },

  setAlertThreshold: async (id: string, threshold: number | null) => {
    return adapter.update(id, { alert_threshold: threshold === null ? undefined : threshold });
  },

  setPriority: async (id: string, priority: number) => {
    return adapter.update(id, { priority });
  },

  setOverride: async (id: string, until: string | null) => {
    return adapter.update(id, { 
      can_override: !!until,
      override_until: until === null ? undefined : until 
    });
  },

  // Mock statistics for now
  getStatistics: async (tenantId?: string) => {
    const limits = await adapter.getAll(tenantId ? { tenant_id: tenantId } : {});
    
    return {
      total: limits.length,
      enabled: limits.filter(l => l.is_enabled).length,
      disabled: limits.filter(l => !l.is_enabled).length,
      api: limits.filter(l => l.resource_type === 'api').length,
      storage: limits.filter(l => l.resource_type === 'storage').length,
      database: limits.filter(l => l.resource_type === 'database').length,
      compute: limits.filter(l => l.resource_type === 'compute').length,
      network: limits.filter(l => l.resource_type === 'network').length,
      email: limits.filter(l => l.resource_type === 'email').length,
      sms: limits.filter(l => l.resource_type === 'sms').length,
      alertsEnabled: limits.filter(l => l.alert_enabled).length,
      exceeded: limits.filter(l => l.exceeded_count > 0).length,
    };
  }
};

// Types aliases for hooks
export type CreateRateLimitData = CreateRateLimitRequest;
export type UpdateRateLimitData = UpdateRateLimitRequest;
