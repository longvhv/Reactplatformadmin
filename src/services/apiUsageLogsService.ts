/**
 * API Usage Logs Service
 * Handles CRUD operations for API usage logs
 * ✅ Production-ready with Supabase integration
 */

import { supabase } from '@/utils/supabase/client';

// Types matching telemetry.api_usage_logs table
export interface ApiUsageLog {
  _id: string; // UUID primary key
  tenant_id?: string;
  app_code?: string;
  api_endpoint?: string;
  api_method?: string;
  status_code?: number;
  request_size?: number;
  response_size?: number;
  latency_ms?: number;
  api_key_id?: string;
  created_at: string;
}

export interface ApiUsageLogFilters {
  tenant_id?: string;
  app_code?: string;
  api_endpoint?: string;
  api_method?: string;
  status_code?: number;
  date_from?: string;
  date_to?: string;
}

export interface ApiUsageStats {
  total_requests: number;
  avg_latency: number;
  total_request_size: number;
  total_response_size: number;
  success_rate: number;
  error_rate: number;
  requests_by_method: Record<string, number>;
  requests_by_status: Record<string, number>;
  top_endpoints: Array<{ endpoint: string; count: number }>;
}

class ApiUsageLogsService {
  private supabase = supabase;
  private table = 'api_usage_logs';
  private schema = 'telemetry';

  /**
   * Get Supabase client configured for telemetry schema
   */
  private getClient() {
    return this.supabase.schema(this.schema);
  }

  /**
   * Fetch all API usage logs with optional filters
   * Ready for: GET /api/v1/telemetry/api-usage-logs
   */
  async getAll(filters?: ApiUsageLogFilters): Promise<ApiUsageLog[]> {
    try {
      let query = this.getClient()
        .from(this.table)
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.tenant_id) {
        query = query.eq('tenant_id', filters.tenant_id);
      }
      if (filters?.app_code) {
        query = query.eq('app_code', filters.app_code);
      }
      if (filters?.api_endpoint) {
        query = query.ilike('api_endpoint', `%${filters.api_endpoint}%`);
      }
      if (filters?.api_method) {
        query = query.eq('api_method', filters.api_method);
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
        console.error('Error fetching API usage logs:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAll:', error);
      throw error;
    }
  }

  /**
   * Get single API usage log by ID
   * Ready for: GET /api/v1/telemetry/api-usage-logs/:id
   */
  async getById(id: string): Promise<ApiUsageLog | null> {
    try {
      const { data, error } = await this.getClient()
        .from(this.table)
        .select('*')
        .eq('_id', id)
        .single();

      if (error) {
        console.error('Error fetching API usage log:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in getById:', error);
      throw error;
    }
  }

  /**
   * Create new API usage log
   * Ready for: POST /api/v1/telemetry/api-usage-logs
   */
  async create(log: Omit<ApiUsageLog, '_id' | 'created_at'>): Promise<ApiUsageLog> {
    try {
      const { data, error } = await this.getClient()
        .from(this.table)
        .insert([log])
        .select()
        .single();

      if (error) {
        console.error('Error creating API usage log:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in create:', error);
      throw error;
    }
  }

  /**
   * Update API usage log
   * Ready for: PUT /api/v1/telemetry/api-usage-logs/:id
   */
  async update(id: string, log: Partial<ApiUsageLog>): Promise<ApiUsageLog> {
    try {
      const { data, error } = await this.getClient()
        .from(this.table)
        .update(log)
        .eq('_id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating API usage log:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in update:', error);
      throw error;
    }
  }

  /**
   * Delete API usage log
   * Ready for: DELETE /api/v1/telemetry/api-usage-logs/:id
   */
  async delete(id: string): Promise<void> {
    try {
      const { error } = await this.getClient()
        .from(this.table)
        .delete()
        .eq('_id', id);

      if (error) {
        console.error('Error deleting API usage log:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in delete:', error);
      throw error;
    }
  }

  /**
   * Get API usage statistics
   * Ready for: GET /api/v1/telemetry/api-usage-logs/stats
   */
  async getStats(filters?: ApiUsageLogFilters): Promise<ApiUsageStats> {
    try {
      const logs = await this.getAll(filters);

      if (logs.length === 0) {
        return {
          total_requests: 0,
          avg_latency: 0,
          total_request_size: 0,
          total_response_size: 0,
          success_rate: 0,
          error_rate: 0,
          requests_by_method: {},
          requests_by_status: {},
          top_endpoints: [],
        };
      }

      // Calculate statistics
      const total_requests = logs.length;
      const avg_latency = logs.reduce((sum, log) => sum + (log.latency_ms || 0), 0) / total_requests;
      const total_request_size = logs.reduce((sum, log) => sum + (log.request_size || 0), 0);
      const total_response_size = logs.reduce((sum, log) => sum + (log.response_size || 0), 0);

      // Success/Error rates
      const successful = logs.filter(log => log.status_code && log.status_code >= 200 && log.status_code < 300).length;
      const failed = logs.filter(log => log.status_code && log.status_code >= 400).length;
      const success_rate = (successful / total_requests) * 100;
      const error_rate = (failed / total_requests) * 100;

      // Requests by method
      const requests_by_method: Record<string, number> = {};
      logs.forEach(log => {
        if (log.api_method) {
          requests_by_method[log.api_method] = (requests_by_method[log.api_method] || 0) + 1;
        }
      });

      // Requests by status
      const requests_by_status: Record<string, number> = {};
      logs.forEach(log => {
        if (log.status_code) {
          const statusKey = log.status_code.toString();
          requests_by_status[statusKey] = (requests_by_status[statusKey] || 0) + 1;
        }
      });

      // Top endpoints
      const endpointCounts: Record<string, number> = {};
      logs.forEach(log => {
        if (log.api_endpoint) {
          endpointCounts[log.api_endpoint] = (endpointCounts[log.api_endpoint] || 0) + 1;
        }
      });
      const top_endpoints = Object.entries(endpointCounts)
        .map(([endpoint, count]) => ({ endpoint, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return {
        total_requests,
        avg_latency: Math.round(avg_latency * 100) / 100,
        total_request_size,
        total_response_size,
        success_rate: Math.round(success_rate * 100) / 100,
        error_rate: Math.round(error_rate * 100) / 100,
        requests_by_method,
        requests_by_status,
        top_endpoints,
      };
    } catch (error) {
      console.error('Error in getStats:', error);
      throw error;
    }
  }

  /**
   * Get logs grouped by time period (for charts)
   * Ready for: GET /api/v1/telemetry/api-usage-logs/timeline
   */
  async getTimeline(
    filters?: ApiUsageLogFilters,
    groupBy: 'hour' | 'day' | 'week' | 'month' = 'day'
  ): Promise<Array<{ date: string; count: number; avg_latency: number }>> {
    try {
      const logs = await this.getAll(filters);

      // Group by time period
      const grouped: Record<string, { count: number; total_latency: number }> = {};

      logs.forEach(log => {
        const date = new Date(log.created_at);
        let key: string;

        switch (groupBy) {
          case 'hour':
            key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`;
            break;
          case 'week':
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            key = weekStart.toISOString().split('T')[0];
            break;
          case 'month':
            key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            break;
          default: // day
            key = date.toISOString().split('T')[0];
        }

        if (!grouped[key]) {
          grouped[key] = { count: 0, total_latency: 0 };
        }
        grouped[key].count += 1;
        grouped[key].total_latency += log.latency_ms || 0;
      });

      // Convert to array and calculate averages
      return Object.entries(grouped)
        .map(([date, data]) => ({
          date,
          count: data.count,
          avg_latency: Math.round((data.total_latency / data.count) * 100) / 100,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      console.error('Error in getTimeline:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const apiUsageLogsService = new ApiUsageLogsService();