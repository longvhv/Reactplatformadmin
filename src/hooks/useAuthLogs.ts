/**
 * useAuthLogs Hook
 * React hook for managing auth logs
 */

import { useState, useEffect, useCallback } from 'react';
import {
  authLogsApi,
  AuthLog,
  AuthLogFilters,
  AuthLogStats,
  CreateAuthLogData,
} from '../api/authLogsApi';

export function useAuthLogs(filters?: AuthLogFilters) {
  const [logs, setLogs] = useState<AuthLog[]>([]);
  const [stats, setStats] = useState<AuthLogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch logs
  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await authLogsApi.getAll(filters);
      setLogs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load auth logs');
      console.error('Error fetching auth logs:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const data = await authLogsApi.getStats(filters);
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, [filters]);

  // Create log
  const createLog = async (data: CreateAuthLogData): Promise<AuthLog> => {
    try {
      const created = await authLogsApi.create(data);
      await fetchLogs();
      return created;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create log';
      setError(message);
      throw new Error(message);
    }
  };

  // Initial load
  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [fetchLogs, fetchStats]);

  return {
    logs,
    stats,
    loading,
    error,
    createLog,
    refresh: fetchLogs,
    refreshStats: fetchStats,
  };
}

export default useAuthLogs;
