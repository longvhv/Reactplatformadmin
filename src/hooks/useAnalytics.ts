/**
 * useAnalytics Hook
 * Manages analytics and usage data aggregation
 * 
 * MIGRATED: Now uses DataClient abstraction layer
 * - Easy to switch between Supabase and Golang API
 * - Consistent pattern across all hooks
 * - Type-safe with generics
 * 
 * Schema:
 * - usage_events: event_type, quantity, unit, metadata
 * - telemetry.api_usage_logs: api_endpoint, status_code, latency_ms
 * - telemetry.traffic_logs: path, method, status_code, latency_ms
 * - telemetry.content_view_logs: object_type, view_duration
 */

import { useState, useEffect, useCallback } from 'react';
import { useDataClient } from './useDataClient';

/**
 * Usage Event type (from usage_events table)
 */
export interface UsageEvent {
  _id: string;
  tenant_id?: string;
  subscription_id?: string;
  app_code?: string;
  event_type: string;
  quantity?: number;
  unit?: string;
  metadata?: any;
  data_region?: string;
  timestamp: string;
}

/**
 * API Usage Log type (from telemetry.api_usage_logs)
 */
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

/**
 * Traffic Log type (from telemetry.traffic_logs)
 */
export interface TrafficLog {
  _id: string;
  tenant_id?: string;
  user_id?: string;
  app_code?: string;
  method?: string;
  domain?: string;
  path?: string;
  status_code?: number;
  latency_ms?: number;
  request_size?: number;
  response_size?: number;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

/**
 * Analytics metrics aggregated data
 */
export interface AnalyticsMetrics {
  // Usage metrics
  total_events: number;
  events_by_type: Record<string, number>;
  total_quantity: number;
  
  // API metrics
  total_api_calls: number;
  api_calls_by_endpoint: Record<string, number>;
  avg_latency_ms: number;
  error_rate: number;
  
  // Traffic metrics
  total_requests: number;
  requests_by_path: Record<string, number>;
  traffic_by_day: Array<{ date: string; count: number }>;
  
  // Performance
  p95_latency: number;
  p99_latency: number;
  slowest_endpoints: Array<{ endpoint: string; avg_latency: number }>;
}

/**
 * Date range for analytics queries
 */
export interface DateRange {
  start: string; // ISO date
  end: string; // ISO date
}

/**
 * Hook for analytics and usage tracking
 * @param tenantId - The ID of the tenant
 * @param dateRange - Date range for analytics
 */
export function useAnalytics(tenantId?: string, dateRange?: DateRange) {
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [usageEvents, setUsageEvents] = useState<UsageEvent[]>([]);
  const [apiLogs, setApiLogs] = useState<ApiUsageLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get DataClient instance
  const dataClient = useDataClient();

  /**
   * Load analytics data
   */
  const loadAnalytics = useCallback(async () => {
    // Skip if no tenant ID
    if (!tenantId) {
      setMetrics(null);
      return;
    }

    // Guard: Wait for dataClient to be ready
    if (!dataClient) {
      console.log('[useAnalytics] Waiting for DataClient to initialize...');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('[useAnalytics] Loading analytics for tenant:', tenantId);

      // Try cache first
      const cacheKey = `analytics_${tenantId}_${dateRange?.start}_${dateRange?.end}`;
      const cachedData = localStorage.getItem(cacheKey);
      
      if (cachedData) {
        const cached = JSON.parse(cachedData);
        const cacheAge = Date.now() - cached.timestamp;

        // Use cache if less than 5 minutes old
        if (cacheAge < 5 * 60 * 1000) {
          setMetrics(cached.metrics);
          setUsageEvents(cached.usageEvents);
          setApiLogs(cached.apiLogs);
          setLoading(false);

          // Continue to fetch in background
          fetchFromDataSource(true);
          return;
        }
      }

      // Fetch from data source
      await fetchFromDataSource(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load analytics';
      setError(message);
      console.error('[useAnalytics] Error loading analytics:', err);
      setLoading(false);
    }
  }, [tenantId, dateRange, dataClient]);

  /**
   * Fetch from data source using DataClient
   */
  const fetchFromDataSource = async (isBackgroundUpdate: boolean) => {
    if (!dataClient || !tenantId) {
      if (!isBackgroundUpdate) {
        setLoading(false);
      }
      return;
    }

    try {
      // Build date filters
      const dateFilters: Record<string, any> = {};
      if (dateRange?.start) {
        dateFilters.timestamp_gte = dateRange.start;
      }
      if (dateRange?.end) {
        dateFilters.timestamp_lte = dateRange.end;
      }

      // Fetch usage events
      const usageResult = await dataClient.query<UsageEvent>('usage_events', {
        filters: {
          tenant_id: tenantId,
          ...dateFilters,
        },
        orderBy: [{ field: 'timestamp', direction: 'desc' }],
        limit: 1000, // Get recent events for analysis
      });

      console.log('[useAnalytics] Loaded usage events:', usageResult.data.length);

      // Fetch API usage logs
      const apiResult = await dataClient.query<ApiUsageLog>('api_usage_logs', {
        filters: {
          tenant_id: tenantId,
          ...dateFilters,
        },
        orderBy: [{ field: 'created_at', direction: 'desc' }],
        limit: 1000,
      });

      console.log('[useAnalytics] Loaded API logs:', apiResult.data.length);

      // Calculate metrics
      const calculatedMetrics = calculateMetrics(usageResult.data, apiResult.data);

      // Update cache
      const cacheKey = `analytics_${tenantId}_${dateRange?.start}_${dateRange?.end}`;
      localStorage.setItem(
        cacheKey,
        JSON.stringify({
          metrics: calculatedMetrics,
          usageEvents: usageResult.data,
          apiLogs: apiResult.data,
          timestamp: Date.now(),
        })
      );

      // Update state
      setMetrics(calculatedMetrics);
      setUsageEvents(usageResult.data);
      setApiLogs(apiResult.data);

      if (!isBackgroundUpdate) {
        setLoading(false);
      }
    } catch (err) {
      console.error('[useAnalytics] Fetch error:', err);
      
      if (!isBackgroundUpdate) {
        throw err;
      }
    }
  };

  /**
   * Track new usage event
   */
  const trackEvent = useCallback(
    async (event: {
      event_type: string;
      quantity?: number;
      unit?: string;
      metadata?: any;
      app_code?: string;
    }): Promise<UsageEvent> => {
      if (!dataClient) {
        throw new Error('DataClient not initialized');
      }

      if (!tenantId) {
        throw new Error('No tenant ID provided');
      }

      setError(null);

      try {
        console.log('[useAnalytics] Tracking event:', event.event_type);

        const newEvent = await dataClient.create<UsageEvent>('usage_events', {
          tenant_id: tenantId,
          timestamp: new Date().toISOString(),
          ...event,
        });

        console.log('[useAnalytics] Event tracked:', newEvent._id);

        // Optimistic update
        setUsageEvents((prev) => [newEvent, ...prev]);

        // Invalidate cache
        const cacheKey = `analytics_${tenantId}_${dateRange?.start}_${dateRange?.end}`;
        localStorage.removeItem(cacheKey);

        return newEvent;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to track event';
        setError(message);
        console.error('[useAnalytics] Error tracking event:', err);
        throw new Error(message);
      }
    },
    [tenantId, dateRange, dataClient]
  );

  /**
   * Get events by type
   */
  const getEventsByType = useCallback(
    (eventType: string): UsageEvent[] => {
      return usageEvents.filter((e) => e.event_type === eventType);
    },
    [usageEvents]
  );

  /**
   * Get API calls by endpoint
   */
  const getApiCallsByEndpoint = useCallback(
    (endpoint: string): ApiUsageLog[] => {
      return apiLogs.filter((log) => log.api_endpoint === endpoint);
    },
    [apiLogs]
  );

  /**
   * Get error logs
   */
  const getErrorLogs = useCallback((): ApiUsageLog[] => {
    return apiLogs.filter((log) => log.status_code && log.status_code >= 400);
  }, [apiLogs]);

  /**
   * Get slow requests
   */
  const getSlowRequests = useCallback(
    (thresholdMs: number = 1000): ApiUsageLog[] => {
      return apiLogs.filter(
        (log) => log.latency_ms && log.latency_ms > thresholdMs
      );
    },
    [apiLogs]
  );

  /**
   * Export analytics data to CSV
   */
  const exportToCSV = useCallback((): string => {
    if (!usageEvents.length && !apiLogs.length) {
      return '';
    }

    const headers = [
      'Type',
      'Timestamp',
      'Event/Endpoint',
      'Quantity/Status',
      'Unit/Latency',
      'Metadata',
    ].join(',');

    const usageRows = usageEvents.map((e) =>
      [
        'USAGE',
        e.timestamp,
        e.event_type,
        e.quantity || '',
        e.unit || '',
        JSON.stringify(e.metadata || {}),
      ].join(',')
    );

    const apiRows = apiLogs.map((log) =>
      [
        'API',
        log.created_at,
        log.api_endpoint || '',
        log.status_code || '',
        log.latency_ms || '',
        '',
      ].join(',')
    );

    return [headers, ...usageRows, ...apiRows].join('\n');
  }, [usageEvents, apiLogs]);

  /**
   * Reload analytics from server
   */
  const refresh = useCallback(async () => {
    if (tenantId) {
      const cacheKey = `analytics_${tenantId}_${dateRange?.start}_${dateRange?.end}`;
      localStorage.removeItem(cacheKey);
    }
    await loadAnalytics();
  }, [tenantId, dateRange, loadAnalytics]);

  // Auto-load on mount and when tenantId/dataClient change
  useEffect(() => {
    if (tenantId && dataClient) {
      console.log('[useAnalytics] Auto-loading analytics for:', tenantId);
      loadAnalytics();
    }
  }, [tenantId, dataClient]); // Only depend on tenantId and dataClient

  // Reload when date range changes
  useEffect(() => {
    if (tenantId && dataClient) {
      loadAnalytics();
    }
  }, [dateRange?.start, dateRange?.end]);

  return {
    metrics,
    usageEvents,
    apiLogs,
    loading,
    error,
    loadAnalytics,
    trackEvent,
    getEventsByType,
    getApiCallsByEndpoint,
    getErrorLogs,
    getSlowRequests,
    exportToCSV,
    refresh,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate metrics from raw data
 */
function calculateMetrics(
  usageEvents: UsageEvent[],
  apiLogs: ApiUsageLog[]
): AnalyticsMetrics {
  // Usage metrics
  const eventsByType: Record<string, number> = {};
  let totalQuantity = 0;

  usageEvents.forEach((event) => {
    eventsByType[event.event_type] = (eventsByType[event.event_type] || 0) + 1;
    if (event.quantity) {
      totalQuantity += event.quantity;
    }
  });

  // API metrics
  const apiCallsByEndpoint: Record<string, number> = {};
  let totalLatency = 0;
  let errorCount = 0;
  const latencies: number[] = [];

  apiLogs.forEach((log) => {
    if (log.api_endpoint) {
      apiCallsByEndpoint[log.api_endpoint] =
        (apiCallsByEndpoint[log.api_endpoint] || 0) + 1;
    }

    if (log.latency_ms) {
      totalLatency += log.latency_ms;
      latencies.push(log.latency_ms);
    }

    if (log.status_code && log.status_code >= 400) {
      errorCount++;
    }
  });

  const avgLatency = apiLogs.length > 0 ? totalLatency / apiLogs.length : 0;
  const errorRate = apiLogs.length > 0 ? errorCount / apiLogs.length : 0;

  // Calculate percentiles
  latencies.sort((a, b) => a - b);
  const p95Index = Math.floor(latencies.length * 0.95);
  const p99Index = Math.floor(latencies.length * 0.99);
  const p95Latency = latencies[p95Index] || 0;
  const p99Latency = latencies[p99Index] || 0;

  // Find slowest endpoints
  const endpointLatencies: Record<string, { sum: number; count: number }> = {};
  apiLogs.forEach((log) => {
    if (log.api_endpoint && log.latency_ms) {
      if (!endpointLatencies[log.api_endpoint]) {
        endpointLatencies[log.api_endpoint] = { sum: 0, count: 0 };
      }
      endpointLatencies[log.api_endpoint].sum += log.latency_ms;
      endpointLatencies[log.api_endpoint].count++;
    }
  });

  const slowestEndpoints = Object.entries(endpointLatencies)
    .map(([endpoint, { sum, count }]) => ({
      endpoint,
      avg_latency: sum / count,
    }))
    .sort((a, b) => b.avg_latency - a.avg_latency)
    .slice(0, 10);

  // Traffic by day (simplified)
  const trafficByDay: Array<{ date: string; count: number }> = [];
  // TODO: Group by day

  return {
    total_events: usageEvents.length,
    events_by_type: eventsByType,
    total_quantity: totalQuantity,
    total_api_calls: apiLogs.length,
    api_calls_by_endpoint: apiCallsByEndpoint,
    avg_latency_ms: avgLatency,
    error_rate: errorRate,
    total_requests: apiLogs.length,
    requests_by_path: apiCallsByEndpoint,
    traffic_by_day: trafficByDay,
    p95_latency: p95Latency,
    p99_latency: p99Latency,
    slowest_endpoints: slowestEndpoints,
  };
}
