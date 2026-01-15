/**
 * Webhooks API Client
 * Uses Adapter pattern - Ready for Golang migration
 * 
 * ✅ REWRITTEN 2026-01-14: Now 100% matches webhooks schema
 */

import { createAdapter, BaseFilters } from './adapters';

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
};

export default webhooksApi;
