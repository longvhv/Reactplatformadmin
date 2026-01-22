/**
 * Traffic Logs API
 * Manages telemetry data for traffic monitoring and analytics
 * 
 * ✅ UPDATED 2026-01-16: Added telemetry schema prefix
 * Schema: telemetry.traffic_logs
 */

import { supabase } from '../utils/supabase/client';

export interface TrafficLog {
  _id: string;
  tenant_id?: string | null;
  user_id?: string | null;
  app_code?: string | null;
  method?: string | null;
  domain?: string | null;
  path?: string | null;
  status_code?: number | null;
  latency_ms?: number | null;
  request_size?: number | null;
  response_size?: number | null;
  ip_address?: string | null;
  user_agent?: string | null;
  data_region?: string | null;
  timestamp: string;
}

export interface TrafficLogFilters {
  search?: string;
  method?: string;
  status_code?: number;
  app_code?: string;
  domain?: string;
  data_region?: string;
  tenant_id?: string;
  user_id?: string;
  start_date?: string;
  end_date?: string;
  min_latency?: number;
  max_latency?: number;
  limit?: number;
  offset?: number;
}

export interface TrafficLogCreateData {
  tenant_id?: string | null;
  user_id?: string | null;
  app_code?: string | null;
  method?: string | null;
  domain?: string | null;
  path?: string | null;
  status_code?: number | null;
  latency_ms?: number | null;
  request_size?: number | null;
  response_size?: number | null;
  ip_address?: string | null;
  user_agent?: string | null;
  data_region?: string | null;
}

export interface TrafficLogUpdateData extends Partial<TrafficLogCreateData> {}

export interface TrafficLogStats {
  total: number;
  byMethod: Record<string, number>;
  byStatus: Record<string, number>;
  byRegion: Record<string, number>;
  byApp: Record<string, number>;
  avgLatency: number;
  totalRequests: number;
  totalDataTransferred: number;
  last24Hours: number;
  last7Days: number;
  last30Days: number;
  errorRate: number;
  successRate: number;
}

/**
 * Fetch all traffic logs with optional filters
 */
export const getTrafficLogs = async (
  filters?: TrafficLogFilters
): Promise<TrafficLog[]> => {
  try {
    let query = supabase
      .schema('telemetry')
      .from('traffic_logs')
      .select('*')
      .order('timestamp', { ascending: false });

    if (filters?.method) {
      query = query.eq('method', filters.method);
    }

    if (filters?.status_code) {
      query = query.eq('status_code', filters.status_code);
    }

    if (filters?.app_code) {
      query = query.eq('app_code', filters.app_code);
    }

    if (filters?.domain) {
      query = query.ilike('domain', `%${filters.domain}%`);
    }

    if (filters?.data_region) {
      query = query.eq('data_region', filters.data_region);
    }

    if (filters?.tenant_id) {
      query = query.eq('tenant_id', filters.tenant_id);
    }

    if (filters?.user_id) {
      query = query.eq('user_id', filters.user_id);
    }

    if (filters?.search) {
      query = query.or(
        `path.ilike.%${filters.search}%,domain.ilike.%${filters.search}%,ip_address.ilike.%${filters.search}%`
      );
    }

    if (filters?.start_date) {
      query = query.gte('timestamp', filters.start_date);
    }

    if (filters?.end_date) {
      query = query.lte('timestamp', filters.end_date);
    }

    if (filters?.min_latency) {
      query = query.gte('latency_ms', filters.min_latency);
    }

    if (filters?.max_latency) {
      query = query.lte('latency_ms', filters.max_latency);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters?.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching traffic logs:', error);
    throw error;
  }
};

/**
 * Fetch a single traffic log by ID
 */
export const getTrafficLogById = async (
  id: string
): Promise<TrafficLog | null> => {
  try {
    const { data, error } = await supabase
      .schema('telemetry')
      .from('traffic_logs')
      .select('*')
      .eq('_id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching traffic log:', error);
    throw error;
  }
};

/**
 * Create a new traffic log
 */
export const createTrafficLog = async (
  logData: TrafficLogCreateData
): Promise<TrafficLog> => {
  try {
    const { data, error } = await supabase
      .schema('telemetry')
      .from('traffic_logs')
      .insert(logData)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating traffic log:', error);
    throw error;
  }
};

/**
 * Update an existing traffic log
 */
export const updateTrafficLog = async (
  id: string,
  logData: TrafficLogUpdateData
): Promise<TrafficLog> => {
  try {
    const { data, error } = await supabase
      .schema('telemetry')
      .from('traffic_logs')
      .update(logData)
      .eq('_id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating traffic log:', error);
    throw error;
  }
};

/**
 * Delete a traffic log
 */
export const deleteTrafficLog = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .schema('telemetry')
      .from('traffic_logs')
      .delete()
      .eq('_id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting traffic log:', error);
    throw error;
  }
};

/**
 * Get traffic statistics
 */
export const getTrafficStats = async (
  filters?: Pick<TrafficLogFilters, 'start_date' | 'end_date' | 'tenant_id' | 'app_code'>
): Promise<TrafficLogStats> => {
  try {
    let query = supabase
      .schema('telemetry')
      .from('traffic_logs')
      .select('_id, method, status_code, data_region, app_code, latency_ms, request_size, response_size, timestamp');

    if (filters?.tenant_id) {
      query = query.eq('tenant_id', filters.tenant_id);
    }

    if (filters?.app_code) {
      query = query.eq('app_code', filters.app_code);
    }

    if (filters?.start_date) {
      query = query.gte('timestamp', filters.start_date);
    }

    if (filters?.end_date) {
      query = query.lte('timestamp', filters.end_date);
    }

    const { data, error } = await query;

    if (error) throw error;

    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const stats: TrafficLogStats = {
      total: data?.length || 0,
      byMethod: {},
      byStatus: {},
      byRegion: {},
      byApp: {},
      avgLatency: 0,
      totalRequests: 0,
      totalDataTransferred: 0,
      last24Hours: 0,
      last7Days: 0,
      last30Days: 0,
      errorRate: 0,
      successRate: 0,
    };

    let totalLatency = 0;
    let latencyCount = 0;
    let errorCount = 0;
    let successCount = 0;

    data?.forEach((log) => {
      // Count by method
      if (log.method) {
        stats.byMethod[log.method] = (stats.byMethod[log.method] || 0) + 1;
      }

      // Count by status code
      if (log.status_code) {
        const statusRange = `${Math.floor(log.status_code / 100)}xx`;
        stats.byStatus[statusRange] = (stats.byStatus[statusRange] || 0) + 1;

        if (log.status_code >= 400) {
          errorCount++;
        } else if (log.status_code >= 200 && log.status_code < 300) {
          successCount++;
        }
      }

      // Count by region
      if (log.data_region) {
        stats.byRegion[log.data_region] = (stats.byRegion[log.data_region] || 0) + 1;
      }

      // Count by app
      if (log.app_code) {
        stats.byApp[log.app_code] = (stats.byApp[log.app_code] || 0) + 1;
      }

      // Calculate average latency
      if (log.latency_ms !== null && log.latency_ms !== undefined) {
        totalLatency += log.latency_ms;
        latencyCount++;
      }

      // Calculate total data transferred
      stats.totalDataTransferred += (log.request_size || 0) + (log.response_size || 0);

      // Time-based counts
      const logDate = new Date(log.timestamp);
      if (logDate >= last24Hours) {
        stats.last24Hours++;
      }
      if (logDate >= last7Days) {
        stats.last7Days++;
      }
      if (logDate >= last30Days) {
        stats.last30Days++;
      }
    });

    stats.avgLatency = latencyCount > 0 ? Math.round(totalLatency / latencyCount) : 0;
    stats.totalRequests = data?.length || 0;
    stats.errorRate = stats.total > 0 ? Math.round((errorCount / stats.total) * 100) : 0;
    stats.successRate = stats.total > 0 ? Math.round((successCount / stats.total) * 100) : 0;

    return stats;
  } catch (error) {
    console.error('Error fetching traffic stats:', error);
    throw error;
  }
};

/**
 * Get HTTP methods (unique values)
 */
export const getHttpMethods = async (): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .schema('telemetry')
      .from('traffic_logs')
      .select('method')
      .not('method', 'is', null);

    if (error) throw error;

    const methods = Array.from(
      new Set(data?.map((item) => item.method).filter(Boolean))
    ) as string[];

    return methods.sort();
  } catch (error) {
    console.error('Error fetching HTTP methods:', error);
    throw error;
  }
};

/**
 * Get app codes (unique values)
 */
export const getAppCodes = async (): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .schema('telemetry')
      .from('traffic_logs')
      .select('app_code')
      .not('app_code', 'is', null);

    if (error) throw error;

    const appCodes = Array.from(
      new Set(data?.map((item) => item.app_code).filter(Boolean))
    ) as string[];

    return appCodes.sort();
  } catch (error) {
    console.error('Error fetching app codes:', error);
    throw error;
  }
};

/**
 * Get data regions (unique values)
 */
export const getDataRegions = async (): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .schema('telemetry')
      .from('traffic_logs')
      .select('data_region')
      .not('data_region', 'is', null);

    if (error) throw error;

    const regions = Array.from(
      new Set(data?.map((item) => item.data_region).filter(Boolean))
    ) as string[];

    return regions.sort();
  } catch (error) {
    console.error('Error fetching data regions:', error);
    throw error;
  }
};

/**
 * Get traffic trend data for charts
 */
export const getTrafficTrend = async (
  days: number = 30,
  filters?: Pick<TrafficLogFilters, 'tenant_id' | 'app_code' | 'method' | 'data_region'>
): Promise<{ date: string; count: number; avgLatency: number }[]> => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let query = supabase
      .schema('telemetry')
      .from('traffic_logs')
      .select('timestamp, latency_ms')
      .gte('timestamp', startDate.toISOString());

    if (filters?.tenant_id) {
      query = query.eq('tenant_id', filters.tenant_id);
    }

    if (filters?.app_code) {
      query = query.eq('app_code', filters.app_code);
    }

    if (filters?.method) {
      query = query.eq('method', filters.method);
    }

    if (filters?.data_region) {
      query = query.eq('data_region', filters.data_region);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Group by date
    const dateMap: Record<string, { count: number; totalLatency: number }> = {};
    data?.forEach((log) => {
      const date = new Date(log.timestamp).toISOString().split('T')[0];
      if (!dateMap[date]) {
        dateMap[date] = { count: 0, totalLatency: 0 };
      }
      dateMap[date].count++;
      dateMap[date].totalLatency += log.latency_ms || 0;
    });

    // Convert to array and sort
    const trend = Object.entries(dateMap)
      .map(([date, { count, totalLatency }]) => ({
        date,
        count,
        avgLatency: count > 0 ? Math.round(totalLatency / count) : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return trend;
  } catch (error) {
    console.error('Error fetching traffic trend:', error);
    throw error;
  }
};

/**
 * Get status code distribution
 */
export const getStatusCodeDistribution = async (
  filters?: Pick<TrafficLogFilters, 'start_date' | 'end_date' | 'tenant_id' | 'app_code'>
): Promise<Record<string, number>> => {
  try {
    let query = supabase
      .schema('telemetry')
      .from('traffic_logs')
      .select('status_code')
      .not('status_code', 'is', null);

    if (filters?.tenant_id) {
      query = query.eq('tenant_id', filters.tenant_id);
    }

    if (filters?.app_code) {
      query = query.eq('app_code', filters.app_code);
    }

    if (filters?.start_date) {
      query = query.gte('timestamp', filters.start_date);
    }

    if (filters?.end_date) {
      query = query.lte('timestamp', filters.end_date);
    }

    const { data, error } = await query;

    if (error) throw error;

    const distribution: Record<string, number> = {};
    data?.forEach((log) => {
      if (log.status_code) {
        const code = log.status_code.toString();
        distribution[code] = (distribution[code] || 0) + 1;
      }
    });

    return distribution;
  } catch (error) {
    console.error('Error fetching status code distribution:', error);
    throw error;
  }
};

// ==================== API CLIENT ====================

/**
 * Traffic Logs API Client
 * Unified object export for consistent usage pattern
 */
export const trafficLogsApi = {
  // CRUD Operations
  getAll: getTrafficLogs,
  getById: getTrafficLogById,
  create: createTrafficLog,
  update: updateTrafficLog,
  delete: deleteTrafficLog,

  // Statistics & Analytics
  getStats: getTrafficStats,
  getTrend: getTrafficTrend,
  getStatusCodeDistribution,

  // Metadata
  getHttpMethods,
  getAppCodes,
  getDataRegions,
};

export default trafficLogsApi;