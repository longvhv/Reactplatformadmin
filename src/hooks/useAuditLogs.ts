/**
 * useAuditLogs Hook
 * 
 * Custom hook for managing audit logs with caching and auto-refresh
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  AuditLog, 
  AuditLogFilters, 
  AuditLogStatistics,
  getAuditLogs, 
  getAuditLogStatistics 
} from '../api/auditLogApi';

interface UseAuditLogsOptions {
  filters?: AuditLogFilters;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

interface UseAuditLogsReturn {
  logs: AuditLog[];
  total: number;
  statistics: AuditLogStatistics | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  hasMore: boolean;
}

export function useAuditLogs(options: UseAuditLogsOptions = {}): UseAuditLogsReturn {
  const { 
    filters = {}, 
    autoRefresh = false, 
    refreshInterval = 30000 
  } = options;

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [statistics, setStatistics] = useState<AuditLogStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);

  const limit = filters.limit || 50;

  const fetchLogs = useCallback(async (append = false) => {
    try {
      if (!append) {
        setLoading(true);
      }
      setError(null);

      const currentOffset = append ? offset : 0;
      
      const result = await getAuditLogs({
        ...filters,
        limit,
        offset: currentOffset,
      });

      if (append) {
        setLogs(prev => [...prev, ...result.data]);
      } else {
        setLogs(result.data);
      }
      
      setTotal(result.total);
      setOffset(currentOffset + result.data.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit logs');
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, limit, offset]);

  const fetchStatistics = useCallback(async () => {
    try {
      const stats = await getAuditLogStatistics(filters);
      setStatistics(stats);
    } catch (err) {
      console.error('Error fetching audit log statistics:', err);
    }
  }, [filters]);

  const refresh = useCallback(async () => {
    setOffset(0);
    await Promise.all([
      fetchLogs(false),
      fetchStatistics(),
    ]);
  }, [fetchLogs, fetchStatistics]);

  const loadMore = useCallback(async () => {
    await fetchLogs(true);
  }, [fetchLogs]);

  // Initial load
  useEffect(() => {
    refresh();
  }, [
    filters.tenant_id,
    filters.user_id,
    filters.action,
    filters.resource,
    filters.status,
    filters.start_date,
    filters.end_date,
    filters.search,
  ]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refresh();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refresh]);

  const hasMore = logs.length < total;

  return {
    logs,
    total,
    statistics,
    loading,
    error,
    refresh,
    loadMore,
    hasMore,
  };
}
