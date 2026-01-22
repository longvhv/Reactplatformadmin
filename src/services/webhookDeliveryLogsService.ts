/**
 * Webhook Delivery Logs Service
 * Handles CRUD operations for webhook delivery logs
 * ✅ Production-ready with Supabase integration
 */

import { supabase } from '../utils/supabase/client';

// Types matching telemetry.webhook_delivery_logs table
export interface WebhookDeliveryLog {
  _id: string; // UUID primary key
  tenant_id?: string; // UUID
  webhook_id?: string; // UUID
  event_type?: string;
  target_url?: string;
  http_method?: string;
  status_code?: number;
  response_time_ms?: number;
  payload_size?: number;
  retry_count?: number;
  success?: boolean;
  error_message?: string;
  headers_json?: Record<string, any>;
  payload_json?: Record<string, any>;
  response_json?: Record<string, any>;
  created_at: string;
}

export interface WebhookDeliveryLogFilters {
  tenant_id?: string;
  webhook_id?: string;
  event_type?: string;
  success?: boolean;
  status_code?: number;
  date_from?: string;
  date_to?: string;
}

export interface WebhookDeliveryStats {
  total_deliveries: number;
  successful_deliveries: number;
  failed_deliveries: number;
  success_rate: number;
  avg_response_time: number;
  total_retries: number;
  by_event_type: Record<string, { count: number; success_rate: number }>;
  by_status_code: Record<string, number>;
  top_endpoints: Array<{ url: string; count: number; success_rate: number }>;
}

class WebhookDeliveryLogsService {
  private supabase = supabase;
  private table = 'webhook_delivery_logs';
  private schema = 'telemetry';

  /**
   * Get Supabase client configured for telemetry schema
   */
  private getClient() {
    return this.supabase.schema(this.schema);
  }

  /**
   * Fetch all webhook delivery logs with optional filters
   * Ready for: GET /api/v1/telemetry/webhook-delivery-logs
   */
  async getAll(filters?: WebhookDeliveryLogFilters): Promise<WebhookDeliveryLog[]> {
    try {
      let query = this.getClient()
        .from(this.table)
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.tenant_id) {
        query = query.eq('tenant_id', filters.tenant_id);
      }
      if (filters?.webhook_id) {
        query = query.eq('webhook_id', filters.webhook_id);
      }
      if (filters?.event_type) {
        query = query.eq('event_type', filters.event_type);
      }
      if (filters?.success !== undefined) {
        query = query.eq('success', filters.success);
      }
      if (filters?.status_code) {
        query = query.eq('status_code', filters.status_code);
      }
      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching webhook delivery logs:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAll:', error);
      throw error;
    }
  }

  /**
   * Get single webhook delivery log by ID
   * Ready for: GET /api/v1/telemetry/webhook-delivery-logs/:id
   */
  async getById(id: string): Promise<WebhookDeliveryLog | null> {
    try {
      const { data, error } = await this.getClient()
        .from(this.table)
        .select('*')
        .eq('_id', id)
        .single();

      if (error) {
        console.error('Error fetching webhook delivery log:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in getById:', error);
      throw error;
    }
  }

  /**
   * Create new webhook delivery log
   * Ready for: POST /api/v1/telemetry/webhook-delivery-logs
   */
  async create(log: Omit<WebhookDeliveryLog, '_id' | 'created_at'>): Promise<WebhookDeliveryLog> {
    try {
      const { data, error } = await this.getClient()
        .from(this.table)
        .insert([log])
        .select()
        .single();

      if (error) {
        console.error('Error creating webhook delivery log:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in create:', error);
      throw error;
    }
  }

  /**
   * Update webhook delivery log
   * Ready for: PUT /api/v1/telemetry/webhook-delivery-logs/:id
   */
  async update(id: string, log: Partial<WebhookDeliveryLog>): Promise<WebhookDeliveryLog> {
    try {
      const { data, error } = await this.getClient()
        .from(this.table)
        .update(log)
        .eq('_id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating webhook delivery log:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in update:', error);
      throw error;
    }
  }

  /**
   * Delete webhook delivery log
   * Ready for: DELETE /api/v1/telemetry/webhook-delivery-logs/:id
   */
  async delete(id: string): Promise<void> {
    try {
      const { error } = await this.getClient()
        .from(this.table)
        .delete()
        .eq('_id', id);

      if (error) {
        console.error('Error deleting webhook delivery log:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in delete:', error);
      throw error;
    }
  }

  /**
   * Get webhook delivery statistics
   * Ready for: GET /api/v1/telemetry/webhook-delivery-logs/stats
   */
  async getStats(filters?: WebhookDeliveryLogFilters): Promise<WebhookDeliveryStats> {
    try {
      const logs = await this.getAll(filters);

      if (logs.length === 0) {
        return {
          total_deliveries: 0,
          successful_deliveries: 0,
          failed_deliveries: 0,
          success_rate: 0,
          avg_response_time: 0,
          total_retries: 0,
          by_event_type: {},
          by_status_code: {},
          top_endpoints: [],
        };
      }

      const total_deliveries = logs.length;
      const successful_deliveries = logs.filter(log => log.success).length;
      const failed_deliveries = logs.filter(log => !log.success).length;
      const success_rate = (successful_deliveries / total_deliveries) * 100;
      const avg_response_time = logs.reduce((sum, log) => sum + (log.response_time_ms || 0), 0) / total_deliveries;
      const total_retries = logs.reduce((sum, log) => sum + (log.retry_count || 0), 0);

      // By event type
      const by_event_type: Record<string, { count: number; success_rate: number }> = {};
      logs.forEach(log => {
        if (log.event_type) {
          if (!by_event_type[log.event_type]) {
            by_event_type[log.event_type] = { count: 0, success_rate: 0 };
          }
          by_event_type[log.event_type].count += 1;
        }
      });

      // Calculate success rate per event type
      Object.keys(by_event_type).forEach(eventType => {
        const eventLogs = logs.filter(log => log.event_type === eventType);
        const successCount = eventLogs.filter(log => log.success).length;
        by_event_type[eventType].success_rate = (successCount / eventLogs.length) * 100;
      });

      // By status code
      const by_status_code: Record<string, number> = {};
      logs.forEach(log => {
        if (log.status_code) {
          const key = log.status_code.toString();
          by_status_code[key] = (by_status_code[key] || 0) + 1;
        }
      });

      // Top endpoints
      const endpointStats: Record<string, { count: number; success: number }> = {};
      logs.forEach(log => {
        if (log.target_url) {
          if (!endpointStats[log.target_url]) {
            endpointStats[log.target_url] = { count: 0, success: 0 };
          }
          endpointStats[log.target_url].count += 1;
          if (log.success) {
            endpointStats[log.target_url].success += 1;
          }
        }
      });

      const top_endpoints = Object.entries(endpointStats)
        .map(([url, stats]) => ({
          url,
          count: stats.count,
          success_rate: (stats.success / stats.count) * 100,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return {
        total_deliveries,
        successful_deliveries,
        failed_deliveries,
        success_rate: Math.round(success_rate * 100) / 100,
        avg_response_time: Math.round(avg_response_time * 100) / 100,
        total_retries,
        by_event_type,
        by_status_code,
        top_endpoints,
      };
    } catch (error) {
      console.error('Error in getStats:', error);
      throw error;
    }
  }

  /**
   * Get failed deliveries for retry
   * Ready for: GET /api/v1/telemetry/webhook-delivery-logs/failed
   */
  async getFailedDeliveries(tenantId?: string, maxRetries: number = 3): Promise<WebhookDeliveryLog[]> {
    try {
      let query = this.getClient()
        .from(this.table)
        .select('*')
        .eq('success', false)
        .lt('retry_count', maxRetries)
        .order('created_at', { ascending: false });

      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching failed deliveries:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getFailedDeliveries:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const webhookDeliveryLogsService = new WebhookDeliveryLogsService();