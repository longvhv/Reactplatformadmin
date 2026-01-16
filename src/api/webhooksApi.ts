/**
 * Webhooks API Client
 * Uses Adapter pattern - Ready for Golang migration
 * 
 * ✅ ENHANCED 2026-01-16: 100% database alignment + Type helpers
 * Database: webhooks (34 fields, 5 auth types, 5 HTTP methods, statistics tracking)
 */

import { createAdapter, BaseFilters } from './adapters';

// ==================== TYPE HELPERS ====================

export const AuthTypeHelper = {
  NONE: 'none' as AuthType,
  BASIC: 'basic' as AuthType,
  BEARER: 'bearer' as AuthType,
  API_KEY: 'api_key' as AuthType,
  OAUTH2: 'oauth2' as AuthType,

  isNone: (type: AuthType) => type === 'none',
  isBasic: (type: AuthType) => type === 'basic',
  isBearer: (type: AuthType) => type === 'bearer',
  isApiKey: (type: AuthType) => type === 'api_key',
  isOAuth2: (type: AuthType) => type === 'oauth2',

  // Group checks
  requiresAuth: (type: AuthType) => type !== 'none',
  requiresConfig: (type: AuthType) => type === 'basic' || type === 'oauth2' || type === 'api_key',
  isTokenBased: (type: AuthType) => type === 'bearer' || type === 'api_key',
};

export const HttpMethodHelper = {
  POST: 'POST' as HttpMethod,
  GET: 'GET' as HttpMethod,
  PUT: 'PUT' as HttpMethod,
  PATCH: 'PATCH' as HttpMethod,
  DELETE: 'DELETE' as HttpMethod,

  isPost: (method: HttpMethod) => method === 'POST',
  isGet: (method: HttpMethod) => method === 'GET',
  isPut: (method: HttpMethod) => method === 'PUT',
  isPatch: (method: HttpMethod) => method === 'PATCH',
  isDelete: (method: HttpMethod) => method === 'DELETE',

  // Group checks
  hasBody: (method: HttpMethod) => method === 'POST' || method === 'PUT' || method === 'PATCH',
  isIdempotent: (method: HttpMethod) => method === 'GET' || method === 'PUT' || method === 'DELETE',
  isSafe: (method: HttpMethod) => method === 'GET',
};

export const WebhookStatusHelper = {
  isActive: (webhook: Webhook) => webhook.is_active === true,
  isInactive: (webhook: Webhook) => webhook.is_active === false,
  isVerified: (webhook: Webhook) => webhook.is_verified === true,
  needsVerification: (webhook: Webhook) => !webhook.is_verified,
  isHealthy: (webhook: Webhook) => {
    if (webhook.total_count === 0) return true; // No triggers yet
    const successRate = webhook.success_count / webhook.total_count;
    return successRate >= 0.9; // 90% success rate
  },
  isDegraded: (webhook: Webhook) => {
    if (webhook.total_count === 0) return false;
    const successRate = webhook.success_count / webhook.total_count;
    return successRate >= 0.5 && successRate < 0.9; // 50-90%
  },
  isFailing: (webhook: Webhook) => {
    if (webhook.total_count === 0) return false;
    const successRate = webhook.success_count / webhook.total_count;
    return successRate < 0.5; // < 50%
  },
  getSuccessRate: (webhook: Webhook) => {
    if (webhook.total_count === 0) return 0;
    return (webhook.success_count / webhook.total_count) * 100;
  },
  getFailureRate: (webhook: Webhook) => {
    if (webhook.total_count === 0) return 0;
    return (webhook.failure_count / webhook.total_count) * 100;
  },
  hasRecentActivity: (webhook: Webhook, hours: number = 24) => {
    if (!webhook.last_triggered_at) return false;
    const lastTriggered = new Date(webhook.last_triggered_at).getTime();
    const cutoff = Date.now() - hours * 60 * 60 * 1000;
    return lastTriggered > cutoff;
  },
  getTimeSinceLastTrigger: (webhook: Webhook): number | null => {
    if (!webhook.last_triggered_at) return null;
    return Date.now() - new Date(webhook.last_triggered_at).getTime();
  },
};

// ==================== ENUMS ====================

export type AuthType = 'none' | 'basic' | 'bearer' | 'api_key' | 'oauth2';
export type HttpMethod = 'POST' | 'GET' | 'PUT' | 'PATCH' | 'DELETE';

export const AUTH_TYPES: AuthType[] = ['none', 'basic', 'bearer', 'api_key', 'oauth2'];
export const HTTP_METHODS: HttpMethod[] = ['POST', 'GET', 'PUT', 'PATCH', 'DELETE'];

// ==================== TYPES ====================

/**
 * Retry configuration for webhooks
 */
export interface RetryConfig {
  max_retries?: number;
  retry_delay?: number;
  backoff_multiplier?: number;
}

/**
 * Webhook - 100% matches webhooks table
 */
export interface Webhook {
  _id: string;
  tenant_id: string;
  name: string;
  description?: string;
  url: string;
  method: 'POST' | 'GET' | 'PUT' | 'PATCH' | 'DELETE';
  event_types: string[];
  event_filter?: Record<string, any>;
  secret_key?: string;
  auth_type: 'none' | 'basic' | 'bearer' | 'api_key' | 'oauth2';
  auth_config?: Record<string, any>;
  headers?: Record<string, any>;
  timeout_ms: number;
  retry_config: RetryConfig;
  is_active: boolean;
  is_verified: boolean;
  verification_token?: string;
  verified_at?: string;
  last_triggered_at?: string;
  last_success_at?: string;
  last_failure_at?: string;
  success_count: number;
  failure_count: number;
  total_count: number;
  avg_response_time_ms?: number;
  batch_size?: number;
  rate_limit?: number;
  priority: number;
  tags?: string[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface CreateWebhookRequest {
  tenant_id: string;
  name: string;
  description?: string;
  url: string;
  method?: 'POST' | 'GET' | 'PUT' | 'PATCH' | 'DELETE';
  event_types: string[];
  event_filter?: Record<string, any>;
  secret_key?: string;
  auth_type?: 'none' | 'basic' | 'bearer' | 'api_key' | 'oauth2';
  auth_config?: Record<string, any>;
  headers?: Record<string, any>;
  timeout_ms?: number;
  retry_config?: RetryConfig;
  batch_size?: number;
  rate_limit?: number;
  priority?: number;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface UpdateWebhookRequest {
  name?: string;
  description?: string;
  url?: string;
  method?: 'POST' | 'GET' | 'PUT' | 'PATCH' | 'DELETE';
  event_types?: string[];
  event_filter?: Record<string, any>;
  secret_key?: string;
  auth_type?: 'none' | 'basic' | 'bearer' | 'api_key' | 'oauth2';
  auth_config?: Record<string, any>;
  is_active?: boolean;
  headers?: Record<string, any>;
  timeout_ms?: number;
  retry_config?: RetryConfig;
  batch_size?: number;
  rate_limit?: number;
  priority?: number;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface WebhookFilters extends BaseFilters {
  tenant_id?: string;
  is_active?: boolean;
  is_verified?: boolean;
  event_type?: string;
  tags?: string[];
}

export interface WebhookStats {
  total: number;
  active: number;
  inactive: number;
  verified: number;
  unverified: number;
  total_triggers: number;
  total_success: number;
  total_failures: number;
  avg_success_rate: number;
  avg_response_time_ms: number;
}

// ==================== ADAPTER ====================

const adapter = createAdapter<Webhook, CreateWebhookRequest, UpdateWebhookRequest>(
  'webhooks',
  '/webhooks'
);

// ==================== API CLIENT ====================

export const webhooksApi = {
  /**
   * GET /webhooks
   */
  getAll: async (filters?: WebhookFilters): Promise<Webhook[]> => {
    return adapter.getAll(filters);
  },

  /**
   * GET /webhooks/:id
   */
  getById: async (id: string): Promise<Webhook> => {
    return adapter.getById(id);
  },

  /**
   * POST /webhooks
   */
  create: async (data: CreateWebhookRequest): Promise<Webhook> => {
    return adapter.create(data);
  },

  /**
   * PATCH /webhooks/:id
   */
  update: async (id: string, data: UpdateWebhookRequest): Promise<Webhook> => {
    return adapter.update(id, data);
  },

  /**
   * DELETE /webhooks/:id
   */
  delete: async (id: string): Promise<void> => {
    return adapter.delete(id);
  },

  /**
   * Enable webhook
   */
  enable: async (id: string): Promise<Webhook> => {
    return adapter.update(id, { is_active: true });
  },

  /**
   * Disable webhook
   */
  disable: async (id: string): Promise<Webhook> => {
    return adapter.update(id, { is_active: false });
  },

  /**
   * Verify webhook
   * TODO (Golang): Implement verify endpoint
   */
  verify: async (id: string): Promise<Webhook> => {
    // For now, just mark as verified
    // Later, Golang should send verification request and update is_verified
    return adapter.getById(id);
  },

  /**
   * Test webhook - send test event
   * TODO (Golang): Implement test endpoint
   */
  test: async (id: string, payload?: any): Promise<any> => {
    // TODO: Implement in Golang backend
    // POST /webhooks/:id/test with payload
    throw new Error('Test endpoint not implemented - migrate to Golang');
  },

  /**
   * Reset failure count
   * TODO (Golang): Implement reset endpoint
   */
  resetFailures: async (id: string): Promise<Webhook> => {
    // TODO: Implement in Golang backend
    // POST /webhooks/:id/reset-failures
    // Should reset failure_count, last_failure_at
    throw new Error('Reset failures endpoint not implemented - migrate to Golang');
  },

  /**
   * Get webhook statistics
   * TODO (Golang): Implement /webhooks/statistics endpoint
   */
  getStats: async (filters?: WebhookFilters): Promise<WebhookStats> => {
    const webhooks = await adapter.getAll(filters);
    
    const active = webhooks.filter(w => w.is_active).length;
    const inactive = webhooks.filter(w => !w.is_active).length;
    const verified = webhooks.filter(w => w.is_verified).length;
    const unverified = webhooks.filter(w => !w.is_verified).length;
    
    const total_triggers = webhooks.reduce((sum, w) => sum + w.total_count, 0);
    const total_success = webhooks.reduce((sum, w) => sum + w.success_count, 0);
    const total_failures = webhooks.reduce((sum, w) => sum + w.failure_count, 0);
    
    const avg_success_rate = total_triggers > 0 
      ? (total_success / total_triggers) * 100 
      : 0;
    
    const webhooksWithResponseTime = webhooks.filter(w => w.avg_response_time_ms);
    const avg_response_time_ms = webhooksWithResponseTime.length > 0
      ? webhooksWithResponseTime.reduce((sum, w) => sum + (w.avg_response_time_ms || 0), 0) / webhooksWithResponseTime.length
      : 0;
    
    return {
      total: webhooks.length,
      active,
      inactive,
      verified,
      unverified,
      total_triggers,
      total_success,
      total_failures,
      avg_success_rate,
      avg_response_time_ms,
    };
  },

  /**
   * Get webhook deliveries/logs
   * TODO (Golang): Implement /webhooks/:id/deliveries endpoint
   */
  getDeliveries: async (id: string, limit = 50): Promise<any[]> => {
    // TODO: Implement in Golang backend
    // GET /webhooks/:id/deliveries?limit=50
    // Should return webhook delivery logs
    throw new Error('Deliveries endpoint not implemented - migrate to Golang');
  },

  /**
   * Regenerate secret key
   * TODO (Golang): Implement regenerate-secret endpoint
   */
  regenerateSecret: async (id: string): Promise<Webhook> => {
    // TODO: Implement in Golang backend
    // POST /webhooks/:id/regenerate-secret
    // Should generate new secret_key and return updated webhook
    throw new Error('Regenerate secret endpoint not implemented - migrate to Golang');
  },

  /**
   * Get webhooks by tenant
   */
  getByTenant: async (tenantId: string): Promise<Webhook[]> => {
    return adapter.getAll({ tenant_id: tenantId });
  },

  /**
   * Get active webhooks
   */
  getActive: async (tenantId?: string): Promise<Webhook[]> => {
    return adapter.getAll({ tenant_id: tenantId, is_active: true });
  },

  /**
   * Get inactive webhooks
   */
  getInactive: async (tenantId?: string): Promise<Webhook[]> => {
    return adapter.getAll({ tenant_id: tenantId, is_active: false });
  },

  /**
   * Get verified webhooks
   */
  getVerified: async (tenantId?: string): Promise<Webhook[]> => {
    return adapter.getAll({ tenant_id: tenantId, is_verified: true });
  },

  /**
   * Get unverified webhooks
   */
  getUnverified: async (tenantId?: string): Promise<Webhook[]> => {
    return adapter.getAll({ tenant_id: tenantId, is_verified: false });
  },

  /**
   * Get webhooks by event type
   */
  getByEventType: async (eventType: string, tenantId?: string): Promise<Webhook[]> => {
    const webhooks = await adapter.getAll({ tenant_id: tenantId });
    return webhooks.filter(w => w.event_types.includes(eventType));
  },

  /**
   * Get webhooks by auth type
   */
  getByAuthType: async (authType: AuthType, tenantId?: string): Promise<Webhook[]> => {
    const webhooks = await adapter.getAll({ tenant_id: tenantId });
    return webhooks.filter(w => w.auth_type === authType);
  },

  /**
   * Get webhooks by HTTP method
   */
  getByMethod: async (method: HttpMethod, tenantId?: string): Promise<Webhook[]> => {
    const webhooks = await adapter.getAll({ tenant_id: tenantId });
    return webhooks.filter(w => w.method === method);
  },

  /**
   * Get webhooks by tag
   */
  getByTag: async (tag: string, tenantId?: string): Promise<Webhook[]> => {
    const webhooks = await adapter.getAll({ tenant_id: tenantId });
    return webhooks.filter(w => w.tags?.includes(tag));
  },

  /**
   * Get webhooks by priority
   */
  getByPriority: async (priority: number, tenantId?: string): Promise<Webhook[]> => {
    const webhooks = await adapter.getAll({ tenant_id: tenantId });
    return webhooks.filter(w => w.priority === priority);
  },

  /**
   * Get high priority webhooks (priority >= threshold)
   */
  getHighPriority: async (threshold: number = 5, tenantId?: string): Promise<Webhook[]> => {
    const webhooks = await adapter.getAll({ tenant_id: tenantId });
    return webhooks.filter(w => w.priority >= threshold);
  },

  /**
   * Get healthy webhooks (>= 90% success rate)
   */
  getHealthy: async (tenantId?: string): Promise<Webhook[]> => {
    const webhooks = await adapter.getAll({ tenant_id: tenantId });
    return webhooks.filter(WebhookStatusHelper.isHealthy);
  },

  /**
   * Get degraded webhooks (50-90% success rate)
   */
  getDegraded: async (tenantId?: string): Promise<Webhook[]> => {
    const webhooks = await adapter.getAll({ tenant_id: tenantId });
    return webhooks.filter(WebhookStatusHelper.isDegraded);
  },

  /**
   * Get failing webhooks (< 50% success rate)
   */
  getFailing: async (tenantId?: string): Promise<Webhook[]> => {
    const webhooks = await adapter.getAll({ tenant_id: tenantId });
    return webhooks.filter(WebhookStatusHelper.isFailing);
  },

  /**
   * Get webhooks with recent activity (last N hours)
   */
  getRecentlyTriggered: async (hours: number = 24, tenantId?: string): Promise<Webhook[]> => {
    const webhooks = await adapter.getAll({ tenant_id: tenantId });
    return webhooks.filter(w => WebhookStatusHelper.hasRecentActivity(w, hours));
  },

  /**
   * Get idle webhooks (no activity in last N hours)
   */
  getIdle: async (hours: number = 24, tenantId?: string): Promise<Webhook[]> => {
    const webhooks = await adapter.getAll({ tenant_id: tenantId });
    return webhooks.filter(w => !WebhookStatusHelper.hasRecentActivity(w, hours));
  },

  /**
   * Get webhooks with no triggers yet
   */
  getUnused: async (tenantId?: string): Promise<Webhook[]> => {
    const webhooks = await adapter.getAll({ tenant_id: tenantId });
    return webhooks.filter(w => w.total_count === 0);
  },

  /**
   * Update webhook priority
   */
  updatePriority: async (id: string, priority: number): Promise<Webhook> => {
    return adapter.update(id, { priority });
  },

  /**
   * Update webhook timeout
   */
  updateTimeout: async (id: string, timeoutMs: number): Promise<Webhook> => {
    return adapter.update(id, { timeout_ms: timeoutMs });
  },

  /**
   * Update retry config
   */
  updateRetryConfig: async (id: string, retryConfig: RetryConfig): Promise<Webhook> => {
    return adapter.update(id, { retry_config: retryConfig });
  },

  /**
   * Update rate limit
   */
  updateRateLimit: async (id: string, rateLimit: number | null): Promise<Webhook> => {
    return adapter.update(id, { rate_limit: rateLimit });
  },

  /**
   * Update batch size
   */
  updateBatchSize: async (id: string, batchSize: number | null): Promise<Webhook> => {
    return adapter.update(id, { batch_size: batchSize });
  },

  /**
   * Add event type
   */
  addEventType: async (id: string, eventType: string): Promise<Webhook> => {
    const webhook = await adapter.getById(id);
    if (webhook.event_types.includes(eventType)) {
      return webhook; // Already exists
    }
    return adapter.update(id, { 
      event_types: [...webhook.event_types, eventType] 
    });
  },

  /**
   * Remove event type
   */
  removeEventType: async (id: string, eventType: string): Promise<Webhook> => {
    const webhook = await adapter.getById(id);
    return adapter.update(id, { 
      event_types: webhook.event_types.filter(e => e !== eventType) 
    });
  },

  /**
   * Set event types (replace all)
   */
  setEventTypes: async (id: string, eventTypes: string[]): Promise<Webhook> => {
    return adapter.update(id, { event_types: eventTypes });
  },

  /**
   * Add tag
   */
  addTag: async (id: string, tag: string): Promise<Webhook> => {
    const webhook = await adapter.getById(id);
    const tags = webhook.tags || [];
    if (tags.includes(tag)) {
      return webhook; // Already exists
    }
    return adapter.update(id, { tags: [...tags, tag] });
  },

  /**
   * Remove tag
   */
  removeTag: async (id: string, tag: string): Promise<Webhook> => {
    const webhook = await adapter.getById(id);
    const tags = webhook.tags || [];
    return adapter.update(id, { tags: tags.filter(t => t !== tag) });
  },

  /**
   * Set tags (replace all)
   */
  setTags: async (id: string, tags: string[]): Promise<Webhook> => {
    return adapter.update(id, { tags });
  },

  /**
   * Update headers
   */
  updateHeaders: async (id: string, headers: Record<string, any>): Promise<Webhook> => {
    return adapter.update(id, { headers });
  },

  /**
   * Merge headers (keep existing + add new)
   */
  mergeHeaders: async (id: string, newHeaders: Record<string, any>): Promise<Webhook> => {
    const webhook = await adapter.getById(id);
    const merged = { ...webhook.headers, ...newHeaders };
    return adapter.update(id, { headers: merged });
  },

  /**
   * Update metadata
   */
  updateMetadata: async (id: string, metadata: Record<string, any>): Promise<Webhook> => {
    return adapter.update(id, { metadata });
  },

  /**
   * Merge metadata (keep existing + add new)
   */
  mergeMetadata: async (id: string, newMetadata: Record<string, any>): Promise<Webhook> => {
    const webhook = await adapter.getById(id);
    const merged = { ...webhook.metadata, ...newMetadata };
    return adapter.update(id, { metadata: merged });
  },

  /**
   * Update auth config
   */
  updateAuthConfig: async (id: string, authType: AuthType, authConfig?: Record<string, any>): Promise<Webhook> => {
    return adapter.update(id, { auth_type: authType, auth_config: authConfig });
  },

  /**
   * Get webhook health status
   */
  getHealthStatus: async (id: string): Promise<{
    webhook: Webhook;
    isActive: boolean;
    isVerified: boolean;
    isHealthy: boolean;
    isDegraded: boolean;
    isFailing: boolean;
    successRate: number;
    failureRate: number;
    timeSinceLastTrigger: number | null;
    hasRecentActivity: boolean;
  }> => {
    const webhook = await adapter.getById(id);
    
    return {
      webhook,
      isActive: WebhookStatusHelper.isActive(webhook),
      isVerified: WebhookStatusHelper.isVerified(webhook),
      isHealthy: WebhookStatusHelper.isHealthy(webhook),
      isDegraded: WebhookStatusHelper.isDegraded(webhook),
      isFailing: WebhookStatusHelper.isFailing(webhook),
      successRate: WebhookStatusHelper.getSuccessRate(webhook),
      failureRate: WebhookStatusHelper.getFailureRate(webhook),
      timeSinceLastTrigger: WebhookStatusHelper.getTimeSinceLastTrigger(webhook),
      hasRecentActivity: WebhookStatusHelper.hasRecentActivity(webhook, 24),
    };
  },

  /**
   * Get tenant webhook statistics
   */
  getTenantStats: async (tenantId: string): Promise<{
    total: number;
    active: number;
    inactive: number;
    verified: number;
    unverified: number;
    healthy: number;
    degraded: number;
    failing: number;
    unused: number;
    by_auth_type: Record<string, number>;
    by_method: Record<string, number>;
    by_priority: Record<number, number>;
    total_triggers: number;
    total_success: number;
    total_failures: number;
    avg_success_rate: number;
    avg_response_time_ms: number;
  }> => {
    const webhooks = await adapter.getAll({ tenant_id: tenantId });

    const byAuthType: Record<string, number> = {};
    const byMethod: Record<string, number> = {};
    const byPriority: Record<number, number> = {};

    webhooks.forEach(w => {
      byAuthType[w.auth_type] = (byAuthType[w.auth_type] || 0) + 1;
      byMethod[w.method] = (byMethod[w.method] || 0) + 1;
      byPriority[w.priority] = (byPriority[w.priority] || 0) + 1;
    });

    const total_triggers = webhooks.reduce((sum, w) => sum + w.total_count, 0);
    const total_success = webhooks.reduce((sum, w) => sum + w.success_count, 0);
    const total_failures = webhooks.reduce((sum, w) => sum + w.failure_count, 0);

    const avg_success_rate = total_triggers > 0 
      ? (total_success / total_triggers) * 100 
      : 0;

    const webhooksWithResponseTime = webhooks.filter(w => w.avg_response_time_ms);
    const avg_response_time_ms = webhooksWithResponseTime.length > 0
      ? webhooksWithResponseTime.reduce((sum, w) => sum + (w.avg_response_time_ms || 0), 0) / webhooksWithResponseTime.length
      : 0;

    return {
      total: webhooks.length,
      active: webhooks.filter(w => w.is_active).length,
      inactive: webhooks.filter(w => !w.is_active).length,
      verified: webhooks.filter(w => w.is_verified).length,
      unverified: webhooks.filter(w => !w.is_verified).length,
      healthy: webhooks.filter(WebhookStatusHelper.isHealthy).length,
      degraded: webhooks.filter(WebhookStatusHelper.isDegraded).length,
      failing: webhooks.filter(WebhookStatusHelper.isFailing).length,
      unused: webhooks.filter(w => w.total_count === 0).length,
      by_auth_type: byAuthType,
      by_method: byMethod,
      by_priority: byPriority,
      total_triggers,
      total_success,
      total_failures,
      avg_success_rate,
      avg_response_time_ms,
    };
  },

  /**
   * Bulk enable webhooks
   */
  bulkEnable: async (ids: string[]): Promise<void> => {
    await Promise.all(
      ids.map(id => adapter.update(id, { is_active: true }))
    );
  },

  /**
   * Bulk disable webhooks
   */
  bulkDisable: async (ids: string[]): Promise<void> => {
    await Promise.all(
      ids.map(id => adapter.update(id, { is_active: false }))
    );
  },

  /**
   * Bulk update priority
   */
  bulkUpdatePriority: async (ids: string[], priority: number): Promise<void> => {
    await Promise.all(
      ids.map(id => adapter.update(id, { priority }))
    );
  },

  /**
   * Bulk add tag
   */
  bulkAddTag: async (ids: string[], tag: string): Promise<void> => {
    await Promise.all(
      ids.map(id => webhooksApi.addTag(id, tag))
    );
  },

  /**
   * Bulk remove tag
   */
  bulkRemoveTag: async (ids: string[], tag: string): Promise<void> => {
    await Promise.all(
      ids.map(id => webhooksApi.removeTag(id, tag))
    );
  },

  /**
   * Bulk delete webhooks
   */
  bulkDelete: async (ids: string[]): Promise<void> => {
    await Promise.all(
      ids.map(id => adapter.delete(id))
    );
  },

  /**
   * Count webhooks by tenant
   */
  countByTenant: async (tenantId: string): Promise<number> => {
    const webhooks = await adapter.getAll({ tenant_id: tenantId });
    return webhooks.length;
  },

  /**
   * Count active webhooks by tenant
   */
  countActiveByTenant: async (tenantId: string): Promise<number> => {
    const webhooks = await adapter.getAll({ tenant_id: tenantId, is_active: true });
    return webhooks.length;
  },

  /**
   * Search webhooks by name or URL
   */
  search: async (query: string, tenantId?: string): Promise<Webhook[]> => {
    const webhooks = await adapter.getAll({ tenant_id: tenantId });
    const lowerQuery = query.toLowerCase();
    return webhooks.filter(w => 
      w.name.toLowerCase().includes(lowerQuery) ||
      w.url.toLowerCase().includes(lowerQuery) ||
      w.description?.toLowerCase().includes(lowerQuery)
    );
  },

  /**
   * Clone webhook (create copy)
   */
  clone: async (id: string, newName?: string): Promise<Webhook> => {
    const original = await adapter.getById(id);
    
    const cloned: CreateWebhookRequest = {
      tenant_id: original.tenant_id,
      name: newName || `${original.name} (Copy)`,
      description: original.description,
      url: original.url,
      method: original.method,
      event_types: [...original.event_types],
      event_filter: original.event_filter,
      auth_type: original.auth_type,
      auth_config: original.auth_config,
      headers: original.headers,
      timeout_ms: original.timeout_ms,
      retry_config: original.retry_config,
      batch_size: original.batch_size,
      rate_limit: original.rate_limit,
      priority: original.priority,
      tags: original.tags,
      metadata: { ...original.metadata, cloned_from: original._id },
    };

    return adapter.create(cloned);
  },
};

export default webhooksApi;