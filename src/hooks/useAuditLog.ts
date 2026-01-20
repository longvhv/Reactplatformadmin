/**
 * useAuditLog Hook
 * Generic audit log reader for all tenant activities
 * 
 * MIGRATED: Now uses DataClient abstraction layer
 * - Easy to switch between Supabase and Golang API
 * - Consistent pattern across all hooks
 * - Type-safe with generics
 * 
 * NOTE: Different from useTenantActivities (which is tenant-specific)
 * This hook provides generic audit log querying capabilities
 * 
 * Schema:
 * - telemetry.audit_logs: action, resource, user_id, details
 */

import { useState, useCallback } from 'react';
import { useDataClient } from './useDataClient';

/**
 * Audit Log type (from telemetry.audit_logs table)
 */
export interface AuditLog {
  _id: string;
  tenant_id?: string;
  user_id?: string;
  impersonator_id?: string;
  event_time: string;
  action?: string; // 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', etc.
  resource?: string; // 'tenant', 'user', 'role', etc.
  resource_id?: string;
  details?: any; // JSON with change details
  ip_address?: string;
  user_agent?: string;
  status?: string; // 'SUCCESS', 'FAILURE'
}

/**
 * Audit log filters
 */
export interface AuditLogFilters {
  tenant_id?: string;
  user_id?: string;
  action?: string;
  resource?: string;
  resource_id?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
}

/**
 * Audit log query options
 */
export interface AuditLogQueryOptions extends AuditLogFilters {
  limit?: number;
  offset?: number;
}

/**
 * Audit log summary stats
 */
export interface AuditLogSummary {
  total_events: number;
  by_action: Record<string, number>;
  by_resource: Record<string, number>;
  by_user: Record<string, number>;
  success_count: number;
  failure_count: number;
  unique_users: number;
  unique_resources: number;
}

/**
 * Hook for audit log querying
 */
export function useAuditLog() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [summary, setSummary] = useState<AuditLogSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState<number | undefined>();

  // Get DataClient instance
  const dataClient = useDataClient();

  /**
   * Query audit logs
   */
  const queryLogs = useCallback(
    async (options: AuditLogQueryOptions = {}): Promise<AuditLog[]> => {
      // Guard: Wait for dataClient to be ready
      if (!dataClient) {
        console.log('[useAuditLog] Waiting for DataClient to initialize...');
        return [];
      }

      setLoading(true);
      setError(null);

      try {
        console.log('[useAuditLog] Querying audit logs with options:', options);

        // Build filters
        const queryFilters: Record<string, any> = {};
        
        if (options.tenant_id) queryFilters.tenant_id = options.tenant_id;
        if (options.user_id) queryFilters.user_id = options.user_id;
        if (options.action) queryFilters.action = options.action;
        if (options.resource) queryFilters.resource = options.resource;
        if (options.resource_id) queryFilters.resource_id = options.resource_id;
        if (options.status) queryFilters.status = options.status;
        if (options.start_date) queryFilters.event_time_gte = options.start_date;
        if (options.end_date) queryFilters.event_time_lte = options.end_date;

        // Query using DataClient
        const result = await dataClient.query<AuditLog>('audit_logs', {
          filters: queryFilters,
          orderBy: [{ field: 'event_time', direction: 'desc' }],
          limit: options.limit || 100,
          offset: options.offset || 0,
        });

        console.log('[useAuditLog] Loaded audit logs:', result.data.length);

        // Calculate summary
        const calculatedSummary = calculateSummary(result.data);

        // Update state
        setLogs(result.data);
        setSummary(calculatedSummary);
        setTotal(result.total);
        setLoading(false);

        return result.data;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to query audit logs';
        setError(message);
        console.error('[useAuditLog] Error querying audit logs:', err);
        setLoading(false);
        throw new Error(message);
      }
    },
    [dataClient]
  );

  /**
   * Get audit logs for specific tenant
   */
  const getByTenant = useCallback(
    async (tenantId: string, limit?: number): Promise<AuditLog[]> => {
      return queryLogs({ tenant_id: tenantId, limit });
    },
    [queryLogs]
  );

  /**
   * Get audit logs for specific user
   */
  const getByUser = useCallback(
    async (userId: string, limit?: number): Promise<AuditLog[]> => {
      return queryLogs({ user_id: userId, limit });
    },
    [queryLogs]
  );

  /**
   * Get audit logs for specific resource
   */
  const getByResource = useCallback(
    async (resource: string, resourceId?: string, limit?: number): Promise<AuditLog[]> => {
      return queryLogs({ resource, resource_id: resourceId, limit });
    },
    [queryLogs]
  );

  /**
   * Get audit logs for specific action
   */
  const getByAction = useCallback(
    async (action: string, limit?: number): Promise<AuditLog[]> => {
      return queryLogs({ action, limit });
    },
    [queryLogs]
  );

  /**
   * Get recent audit logs
   */
  const getRecent = useCallback(
    async (limit: number = 50): Promise<AuditLog[]> => {
      return queryLogs({ limit });
    },
    [queryLogs]
  );

  /**
   * Get audit logs for date range
   */
  const getByDateRange = useCallback(
    async (startDate: string, endDate: string, limit?: number): Promise<AuditLog[]> => {
      return queryLogs({ start_date: startDate, end_date: endDate, limit });
    },
    [queryLogs]
  );

  /**
   * Get failed operations
   */
  const getFailures = useCallback(
    async (limit?: number): Promise<AuditLog[]> => {
      return queryLogs({ status: 'FAILURE', limit });
    },
    [queryLogs]
  );

  /**
   * Get user activity timeline
   */
  const getUserTimeline = useCallback(
    async (userId: string, limit?: number): Promise<AuditLog[]> => {
      return queryLogs({
        user_id: userId,
        limit: limit || 100,
      });
    },
    [queryLogs]
  );

  /**
   * Get resource change history
   */
  const getResourceHistory = useCallback(
    async (resource: string, resourceId: string, limit?: number): Promise<AuditLog[]> => {
      return queryLogs({
        resource,
        resource_id: resourceId,
        limit: limit || 100,
      });
    },
    [queryLogs]
  );

  /**
   * Export logs to CSV
   */
  const exportToCSV = useCallback((): string => {
    if (!logs.length) {
      return '';
    }

    const headers = [
      'Timestamp',
      'Tenant ID',
      'User ID',
      'Action',
      'Resource',
      'Resource ID',
      'Status',
      'IP Address',
      'Details',
    ].join(',');

    const rows = logs.map((log) =>
      [
        log.event_time,
        log.tenant_id || '',
        log.user_id || '',
        log.action || '',
        log.resource || '',
        log.resource_id || '',
        log.status || '',
        log.ip_address || '',
        JSON.stringify(log.details || {}),
      ].join(',')
    );

    return [headers, ...rows].join('\n');
  }, [logs]);

  /**
   * Clear current logs
   */
  const clear = useCallback(() => {
    setLogs([]);
    setSummary(null);
    setTotal(undefined);
    setError(null);
  }, []);

  return {
    logs,
    summary,
    loading,
    error,
    total,
    queryLogs,
    getByTenant,
    getByUser,
    getByResource,
    getByAction,
    getRecent,
    getByDateRange,
    getFailures,
    getUserTimeline,
    getResourceHistory,
    exportToCSV,
    clear,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate audit log summary statistics
 */
function calculateSummary(logs: AuditLog[]): AuditLogSummary {
  const summary: AuditLogSummary = {
    total_events: logs.length,
    by_action: {},
    by_resource: {},
    by_user: {},
    success_count: 0,
    failure_count: 0,
    unique_users: 0,
    unique_resources: 0,
  };

  const uniqueUsers = new Set<string>();
  const uniqueResources = new Set<string>();

  logs.forEach((log) => {
    // Count by action
    if (log.action) {
      summary.by_action[log.action] = (summary.by_action[log.action] || 0) + 1;
    }

    // Count by resource
    if (log.resource) {
      summary.by_resource[log.resource] = (summary.by_resource[log.resource] || 0) + 1;
      uniqueResources.add(log.resource);
    }

    // Count by user
    if (log.user_id) {
      summary.by_user[log.user_id] = (summary.by_user[log.user_id] || 0) + 1;
      uniqueUsers.add(log.user_id);
    }

    // Count by status
    if (log.status === 'SUCCESS') {
      summary.success_count++;
    } else if (log.status === 'FAILURE') {
      summary.failure_count++;
    }
  });

  summary.unique_users = uniqueUsers.size;
  summary.unique_resources = uniqueResources.size;

  return summary;
}
