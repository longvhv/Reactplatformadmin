/**
 * API Usage Logs API Client
 * Uses Adapter pattern - Ready for Golang migration
 * 
 * ✅ CREATED 2026-01-16: 100% database alignment
 * Database: telemetry.api_usage_logs (11 fields, API usage tracking)
 */

import { supabase } from '../utils/supabase/client';

// ==================== TYPES ====================

export interface ApiUsageLog {
  _id: string;
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

export interface CreateUsageLogRequest {
  tenant_id?: string;
  app_code?: string;
  api_endpoint?: string;
  api_method?: string;
  status_code?: number;
  request_size?: number;
  response_size?: number;
  latency_ms?: number;
  api_key_id?: string;
}

export interface UsageLogFilters {
  tenant_id?: string;
  app_code?: string;
  api_endpoint?: string;
  api_method?: string;
  status_code?: number;
  api_key_id?: string;
}

export interface ApiUsageStats {
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  success_rate: number;
  avg_latency_ms: number;
  min_latency_ms: number;
  max_latency_ms: number;
  total_request_size: number;
  total_response_size: number;
  avg_request_size: number;
  avg_response_size: number;
  by_endpoint: Record<string, number>;
  by_method: Record<string, number>;
  by_status_code: Record<number, number>;
  by_app_code: Record<string, number>;
  top_endpoints: Array<{ endpoint: string; count: number; avg_latency: number }>;
  recent_requests: ApiUsageLog[];
}

// ==================== API CLIENT ====================

export const apiUsageLogsApi = {
  /**
   * GET /api-usage-logs
   */
  getAll: async (filters?: UsageLogFilters): Promise<ApiUsageLog[]> => {
    try {
      let query = supabase.from('api_usage_logs').select('*');

      if (filters?.tenant_id) query = query.eq('tenant_id', filters.tenant_id);
      if (filters?.app_code) query = query.eq('app_code', filters.app_code);
      if (filters?.api_endpoint) query = query.eq('api_endpoint', filters.api_endpoint);
      if (filters?.api_method) query = query.eq('api_method', filters.api_method);
      if (filters?.status_code) query = query.eq('status_code', filters.status_code);
      if (filters?.api_key_id) query = query.eq('api_key_id', filters.api_key_id);

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching API usage logs:', error);
      throw error;
    }
  },

  /**
   * GET /api-usage-logs/:id
   */
  getById: async (id: string): Promise<ApiUsageLog> => {
    try {
      const { data, error } = await supabase
        .from('api_usage_logs')
        .select('*')
        .eq('_id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching API usage log:', error);
      throw error;
    }
  },

  /**
   * POST /api-usage-logs
   */
  create: async (data: CreateUsageLogRequest): Promise<ApiUsageLog> => {
    try {
      const logData = {
        _id: crypto.randomUUID(),
        ...data,
        request_size: data.request_size || 0,
        response_size: data.response_size || 0,
      };

      const { data: result, error } = await supabase
        .from('api_usage_logs')
        .insert([logData])
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error) {
      console.error('Error creating API usage log:', error);
      throw error;
    }
  },

  /**
   * DELETE /api-usage-logs/:id
   */
  delete: async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('api_usage_logs')
        .delete()
        .eq('_id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting API usage log:', error);
      throw error;
    }
  },

  /**
   * Get usage logs by tenant
   */
  getByTenant: async (tenantId: string, limit?: number): Promise<ApiUsageLog[]> => {
    try {
      let query = supabase
        .from('api_usage_logs')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (limit) query = query.limit(limit);

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching logs by tenant:', error);
      throw error;
    }
  },

  /**
   * Get successful requests (2xx status codes)
   */
  getSuccessful: async (tenantId?: string): Promise<ApiUsageLog[]> => {
    try {
      let query = supabase
        .from('api_usage_logs')
        .select('*')
        .gte('status_code', 200)
        .lt('status_code', 300);

      if (tenantId) query = query.eq('tenant_id', tenantId);

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching successful requests:', error);
      throw error;
    }
  },

  /**
   * Get failed requests (4xx, 5xx status codes)
   */
  getFailed: async (tenantId?: string): Promise<ApiUsageLog[]> => {
    try {
      let query = supabase
        .from('api_usage_logs')
        .select('*')
        .gte('status_code', 400);

      if (tenantId) query = query.eq('tenant_id', tenantId);

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching failed requests:', error);
      throw error;
    }
  },

  /**
   * Get logs by endpoint
   */
  getByEndpoint: async (endpoint: string, tenantId?: string): Promise<ApiUsageLog[]> => {
    try {
      let query = supabase
        .from('api_usage_logs')
        .select('*')
        .eq('api_endpoint', endpoint);

      if (tenantId) query = query.eq('tenant_id', tenantId);

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching logs by endpoint:', error);
      throw error;
    }
  },

  /**
   * Get logs by HTTP method
   */
  getByMethod: async (method: string, tenantId?: string): Promise<ApiUsageLog[]> => {
    try {
      let query = supabase
        .from('api_usage_logs')
        .select('*')
        .eq('api_method', method);

      if (tenantId) query = query.eq('tenant_id', tenantId);

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching logs by method:', error);
      throw error;
    }
  },

  /**
   * Get logs by API key
   */
  getByApiKey: async (apiKeyId: string): Promise<ApiUsageLog[]> => {
    try {
      const { data, error } = await supabase
        .from('api_usage_logs')
        .select('*')
        .eq('api_key_id', apiKeyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching logs by API key:', error);
      throw error;
    }
  },

  /**
   * Get recent logs (last N hours)
   */
  getRecent: async (tenantId: string, hours: number = 24): Promise<ApiUsageLog[]> => {
    try {
      const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('api_usage_logs')
        .select('*')
        .eq('tenant_id', tenantId)
        .gte('created_at', cutoff)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching recent logs:', error);
      throw error;
    }
  },

  /**
   * Get comprehensive statistics
   */
  getStats: async (tenantId: string, hours?: number): Promise<ApiUsageStats> => {
    try {
      let logs = await apiUsageLogsApi.getByTenant(tenantId);

      // Filter by time range if specified
      if (hours) {
        const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
        logs = logs.filter(log => new Date(log.created_at) >= cutoff);
      }

      const successful = logs.filter(log => 
        log.status_code && log.status_code >= 200 && log.status_code < 300
      ).length;
      const failed = logs.filter(log => 
        log.status_code && log.status_code >= 400
      ).length;
      const total = logs.length;

      const latencies = logs
        .map(log => log.latency_ms)
        .filter((l): l is number => l !== undefined && l !== null);

      const requestSizes = logs
        .map(log => log.request_size || 0)
        .filter(s => s > 0);

      const responseSizes = logs
        .map(log => log.response_size || 0)
        .filter(s => s > 0);

      const byEndpoint: Record<string, number> = {};
      const byMethod: Record<string, number> = {};
      const byStatusCode: Record<number, number> = {};
      const byAppCode: Record<string, number> = {};
      const endpointLatencies: Record<string, number[]> = {};

      logs.forEach(log => {
        if (log.api_endpoint) {
          byEndpoint[log.api_endpoint] = (byEndpoint[log.api_endpoint] || 0) + 1;
          if (log.latency_ms) {
            if (!endpointLatencies[log.api_endpoint]) {
              endpointLatencies[log.api_endpoint] = [];
            }
            endpointLatencies[log.api_endpoint].push(log.latency_ms);
          }
        }
        if (log.api_method) {
          byMethod[log.api_method] = (byMethod[log.api_method] || 0) + 1;
        }
        if (log.status_code) {
          byStatusCode[log.status_code] = (byStatusCode[log.status_code] || 0) + 1;
        }
        if (log.app_code) {
          byAppCode[log.app_code] = (byAppCode[log.app_code] || 0) + 1;
        }
      });

      // Calculate top endpoints with average latency
      const topEndpoints = Object.entries(byEndpoint)
        .map(([endpoint, count]) => {
          const latencyData = endpointLatencies[endpoint] || [];
          const avgLatency = latencyData.length > 0
            ? latencyData.reduce((sum, l) => sum + l, 0) / latencyData.length
            : 0;
          return { endpoint, count, avg_latency: avgLatency };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const recentRequests = logs.slice(0, 20);

      return {
        total_requests: total,
        successful_requests: successful,
        failed_requests: failed,
        success_rate: total > 0 ? (successful / total) * 100 : 0,
        avg_latency_ms: latencies.length > 0
          ? latencies.reduce((sum, l) => sum + l, 0) / latencies.length
          : 0,
        min_latency_ms: latencies.length > 0 ? Math.min(...latencies) : 0,
        max_latency_ms: latencies.length > 0 ? Math.max(...latencies) : 0,
        total_request_size: requestSizes.reduce((sum, s) => sum + s, 0),
        total_response_size: responseSizes.reduce((sum, s) => sum + s, 0),
        avg_request_size: requestSizes.length > 0
          ? requestSizes.reduce((sum, s) => sum + s, 0) / requestSizes.length
          : 0,
        avg_response_size: responseSizes.length > 0
          ? responseSizes.reduce((sum, s) => sum + s, 0) / responseSizes.length
          : 0,
        by_endpoint: byEndpoint,
        by_method: byMethod,
        by_status_code: byStatusCode,
        by_app_code: byAppCode,
        top_endpoints: topEndpoints,
        recent_requests: recentRequests,
      };
    } catch (error) {
      console.error('Error calculating stats:', error);
      throw error;
    }
  },

  /**
   * Get timeline data (for charts) - requests per hour
   */
  getTimeline: async (tenantId: string, hours: number = 24): Promise<{
    timestamp: string;
    successful: number;
    failed: number;
    total: number;
    avg_latency: number;
  }[]> => {
    try {
      const logs = await apiUsageLogsApi.getRecent(tenantId, hours);

      // Group by hour
      const groupedByHour: Record<string, {
        successful: number;
        failed: number;
        latencies: number[];
      }> = {};

      logs.forEach(log => {
        const hour = new Date(log.created_at);
        hour.setMinutes(0, 0, 0);
        const key = hour.toISOString();

        if (!groupedByHour[key]) {
          groupedByHour[key] = { successful: 0, failed: 0, latencies: [] };
        }

        const isSuccess = log.status_code && log.status_code >= 200 && log.status_code < 300;
        if (isSuccess) {
          groupedByHour[key].successful++;
        } else if (log.status_code && log.status_code >= 400) {
          groupedByHour[key].failed++;
        }

        if (log.latency_ms) {
          groupedByHour[key].latencies.push(log.latency_ms);
        }
      });

      // Convert to array and calculate averages
      return Object.entries(groupedByHour)
        .map(([timestamp, counts]) => ({
          timestamp,
          successful: counts.successful,
          failed: counts.failed,
          total: counts.successful + counts.failed,
          avg_latency: counts.latencies.length > 0
            ? counts.latencies.reduce((sum, l) => sum + l, 0) / counts.latencies.length
            : 0,
        }))
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    } catch (error) {
      console.error('Error getting timeline:', error);
      throw error;
    }
  },

  /**
   * Get latency percentiles
   */
  getLatencyPercentiles: async (tenantId: string): Promise<{
    p50: number;
    p75: number;
    p90: number;
    p95: number;
    p99: number;
  }> => {
    try {
      const logs = await apiUsageLogsApi.getByTenant(tenantId);
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
    } catch (error) {
      console.error('Error getting latency percentiles:', error);
      throw error;
    }
  },

  /**
   * Bulk delete old logs
   */
  deleteOlderThan: async (tenantId: string, days: number): Promise<number> => {
    try {
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

      const { error, count } = await supabase
        .from('api_usage_logs')
        .delete()
        .eq('tenant_id', tenantId)
        .lt('created_at', cutoff);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error deleting old logs:', error);
      throw error;
    }
  },

  /**
   * Count requests by tenant
   */
  countByTenant: async (tenantId: string): Promise<number> => {
    try {
      const logs = await apiUsageLogsApi.getByTenant(tenantId);
      return logs.length;
    } catch (error) {
      console.error('Error counting requests:', error);
      throw error;
    }
  },

  /**
   * Format bytes to human readable
   */
  formatBytes: (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  },
};

export default apiUsageLogsApi;
