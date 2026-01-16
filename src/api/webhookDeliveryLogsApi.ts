/**
 * Webhook Delivery Logs API Client
 * Uses Adapter pattern - Ready for Golang migration
 * 
 * ✅ CREATED 2026-01-16: 100% database alignment
 * Database: webhook_delivery_logs (12 fields, delivery tracking)
 */

import { createAdapter, BaseFilters } from './adapters';

// ==================== TYPES ====================

export interface WebhookDeliveryLog {
  _id: string;
  tenant_id?: string;
  webhook_id?: string;
  event_type?: string;
  target_url?: string;
  payload?: Record<string, any>;
  response_body?: string;
  status_code?: number;
  is_success?: boolean;
  latency_ms?: number;
  attempt_number?: number;
  created_at: string;
}

export interface CreateDeliveryLogRequest {
  tenant_id?: string;
  webhook_id?: string;
  event_type?: string;
  target_url?: string;
  payload?: Record<string, any>;
  response_body?: string;
  status_code?: number;
  is_success?: boolean;
  latency_ms?: number;
  attempt_number?: number;
}

export interface DeliveryLogFilters extends BaseFilters {
  tenant_id?: string;
  webhook_id?: string;
  event_type?: string;
  is_success?: boolean;
  status_code?: number;
  attempt_number?: number;
}

export interface DeliveryStats {
  total_deliveries: number;
  successful_deliveries: number;
  failed_deliveries: number;
  success_rate: number;
  avg_latency_ms: number;
  min_latency_ms: number;
  max_latency_ms: number;
  by_status_code: Record<number, number>;
  by_event_type: Record<string, number>;
  by_attempt_number: Record<number, number>;
  recent_failures: WebhookDeliveryLog[];
}

// ==================== ADAPTER ====================

const adapter = createAdapter<WebhookDeliveryLog, CreateDeliveryLogRequest, Partial<CreateDeliveryLogRequest>>(
  'webhook_delivery_logs',
  '/webhook-delivery-logs'
);

// ==================== API CLIENT ====================

export const webhookDeliveryLogsApi = {
  /**
   * GET /webhook-delivery-logs
   */
  getAll: async (filters?: DeliveryLogFilters): Promise<WebhookDeliveryLog[]> => {
    return adapter.getAll(filters);
  },

  /**
   * GET /webhook-delivery-logs/:id
   */
  getById: async (id: string): Promise<WebhookDeliveryLog> => {
    return adapter.getById(id);
  },

  /**
   * POST /webhook-delivery-logs
   */
  create: async (data: CreateDeliveryLogRequest): Promise<WebhookDeliveryLog> => {
    return adapter.create(data);
  },

  /**
   * DELETE /webhook-delivery-logs/:id
   */
  delete: async (id: string): Promise<void> => {
    return adapter.delete(id);
  },

  /**
   * Get delivery logs by webhook ID
   */
  getByWebhook: async (webhookId: string, limit?: number): Promise<WebhookDeliveryLog[]> => {
    const logs = await adapter.getAll({ webhook_id: webhookId });
    // Sort by created_at DESC
    const sorted = logs.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return limit ? sorted.slice(0, limit) : sorted;
  },

  /**
   * Get successful deliveries
   */
  getSuccessful: async (webhookId?: string): Promise<WebhookDeliveryLog[]> => {
    return adapter.getAll({ webhook_id: webhookId, is_success: true });
  },

  /**
   * Get failed deliveries
   */
  getFailed: async (webhookId?: string): Promise<WebhookDeliveryLog[]> => {
    return adapter.getAll({ webhook_id: webhookId, is_success: false });
  },

  /**
   * Get deliveries by event type
   */
  getByEventType: async (eventType: string, webhookId?: string): Promise<WebhookDeliveryLog[]> => {
    return adapter.getAll({ webhook_id: webhookId, event_type: eventType });
  },

  /**
   * Get deliveries by status code
   */
  getByStatusCode: async (statusCode: number, webhookId?: string): Promise<WebhookDeliveryLog[]> => {
    return adapter.getAll({ webhook_id: webhookId, status_code: statusCode });
  },

  /**
   * Get retry attempts (attempt_number > 1)
   */
  getRetries: async (webhookId?: string): Promise<WebhookDeliveryLog[]> => {
    const logs = await adapter.getAll({ webhook_id: webhookId });
    return logs.filter(log => (log.attempt_number || 1) > 1);
  },

  /**
   * Get recent deliveries (last N hours)
   */
  getRecent: async (webhookId: string, hours: number = 24): Promise<WebhookDeliveryLog[]> => {
    const logs = await webhookDeliveryLogsApi.getByWebhook(webhookId);
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return logs.filter(log => new Date(log.created_at) >= cutoff);
  },

  /**
   * Get delivery statistics for webhook
   */
  getStats: async (webhookId: string, hours?: number): Promise<DeliveryStats> => {
    let logs = await webhookDeliveryLogsApi.getByWebhook(webhookId);
    
    // Filter by time range if specified
    if (hours) {
      const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
      logs = logs.filter(log => new Date(log.created_at) >= cutoff);
    }

    const successful = logs.filter(log => log.is_success === true).length;
    const failed = logs.filter(log => log.is_success === false).length;
    const total = logs.length;

    const latencies = logs
      .map(log => log.latency_ms)
      .filter((l): l is number => l !== undefined && l !== null);

    const byStatusCode: Record<number, number> = {};
    const byEventType: Record<string, number> = {};
    const byAttemptNumber: Record<number, number> = {};

    logs.forEach(log => {
      if (log.status_code) {
        byStatusCode[log.status_code] = (byStatusCode[log.status_code] || 0) + 1;
      }
      if (log.event_type) {
        byEventType[log.event_type] = (byEventType[log.event_type] || 0) + 1;
      }
      const attempt = log.attempt_number || 1;
      byAttemptNumber[attempt] = (byAttemptNumber[attempt] || 0) + 1;
    });

    const recentFailures = logs
      .filter(log => log.is_success === false)
      .slice(0, 10); // Last 10 failures

    return {
      total_deliveries: total,
      successful_deliveries: successful,
      failed_deliveries: failed,
      success_rate: total > 0 ? (successful / total) * 100 : 0,
      avg_latency_ms: latencies.length > 0 
        ? latencies.reduce((sum, l) => sum + l, 0) / latencies.length 
        : 0,
      min_latency_ms: latencies.length > 0 ? Math.min(...latencies) : 0,
      max_latency_ms: latencies.length > 0 ? Math.max(...latencies) : 0,
      by_status_code: byStatusCode,
      by_event_type: byEventType,
      by_attempt_number: byAttemptNumber,
      recent_failures: recentFailures,
    };
  },

  /**
   * Get timeline data (for charts) - deliveries per hour
   */
  getTimeline: async (webhookId: string, hours: number = 24): Promise<{
    timestamp: string;
    successful: number;
    failed: number;
    total: number;
  }[]> => {
    const logs = await webhookDeliveryLogsApi.getRecent(webhookId, hours);
    
    // Group by hour
    const groupedByHour: Record<string, { successful: number; failed: number }> = {};
    
    logs.forEach(log => {
      const hour = new Date(log.created_at);
      hour.setMinutes(0, 0, 0);
      const key = hour.toISOString();
      
      if (!groupedByHour[key]) {
        groupedByHour[key] = { successful: 0, failed: 0 };
      }
      
      if (log.is_success) {
        groupedByHour[key].successful++;
      } else {
        groupedByHour[key].failed++;
      }
    });

    // Convert to array and sort
    return Object.entries(groupedByHour)
      .map(([timestamp, counts]) => ({
        timestamp,
        successful: counts.successful,
        failed: counts.failed,
        total: counts.successful + counts.failed,
      }))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  },

  /**
   * Get latency percentiles
   */
  getLatencyPercentiles: async (webhookId: string): Promise<{
    p50: number;
    p75: number;
    p90: number;
    p95: number;
    p99: number;
  }> => {
    const logs = await webhookDeliveryLogsApi.getByWebhook(webhookId);
    const latencies = logs
      .map(log => log.latency_ms)
      .filter((l): l is number => l !== undefined && l !== null)
      .sort((a, b) => a - b);

    if (latencies.length === 0) {
      return { p50: 0, p75: 0, p90: 0, p95: 0, p99: 0 };
    }

    const getPercentile = (arr: number[], percentile: number) => {
      const index = Math.ceil((percentile / 100) * arr.length) - 1;
      return arr[Math.max(0, index)];
    };

    return {
      p50: getPercentile(latencies, 50),
      p75: getPercentile(latencies, 75),
      p90: getPercentile(latencies, 90),
      p95: getPercentile(latencies, 95),
      p99: getPercentile(latencies, 99),
    };
  },

  /**
   * Bulk delete old logs
   */
  deleteOlderThan: async (webhookId: string, days: number): Promise<number> => {
    const logs = await webhookDeliveryLogsApi.getByWebhook(webhookId);
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const toDelete = logs.filter(log => new Date(log.created_at) < cutoff);
    
    await Promise.all(
      toDelete.map(log => adapter.delete(log._id))
    );

    return toDelete.length;
  },
};

export default webhookDeliveryLogsApi;
