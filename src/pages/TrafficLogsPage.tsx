/**
 * Traffic Logs Page
 * List and manage traffic telemetry data
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Plus, RefreshCw, Download, BarChart3 } from 'lucide-react';
import {
  getTrafficLogs,
  deleteTrafficLog,
  getTrafficStats,
  getHttpMethods,
  getAppCodes,
  getDataRegions,
  TrafficLog,
  TrafficLogFilters as FilterType,
  TrafficLogStats as StatsType,
} from '../api/trafficLogsApi';
import { TrafficLogsTable } from '../components/traffic-logs/TrafficLogsTable';
import { TrafficLogFilters } from '../components/traffic-logs/TrafficLogFilters';
import { TrafficLogStats } from '../components/traffic-logs/TrafficLogStats';
import { Button } from '../components/ui/button';
import { toast } from 'sonner@2.0.3';

export default function TrafficLogsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [logs, setLogs] = useState<TrafficLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState<StatsType | null>(null);
  const [methods, setMethods] = useState<string[]>([]);
  const [appCodes, setAppCodes] = useState<string[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterType>({});
  const [showStats, setShowStats] = useState(true);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await getTrafficLogs({ ...filters, limit: 100 });
      setLogs(data);
    } catch (error) {
      console.error('Error loading traffic logs:', error);
      toast.error(t('trafficLogs.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      setStatsLoading(true);
      const data = await getTrafficStats({
        tenant_id: filters.tenant_id,
        app_code: filters.app_code,
        start_date: filters.start_date,
        end_date: filters.end_date,
      });
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
      toast.error(t('trafficLogs.statsError'));
    } finally {
      setStatsLoading(false);
    }
  };

  const loadOptions = async () => {
    try {
      const [methodsData, appCodesData, regionsData] = await Promise.all([
        getHttpMethods(),
        getAppCodes(),
        getDataRegions(),
      ]);
      setMethods(methodsData);
      setAppCodes(appCodesData);
      setRegions(regionsData);
    } catch (error) {
      console.error('Error loading options:', error);
    }
  };

  useEffect(() => {
    loadLogs();
    loadStats();
    loadOptions();
  }, []);

  useEffect(() => {
    loadLogs();
    loadStats();
  }, [filters]);

  const handleDelete = async (id: string) => {
    if (!confirm(t('trafficLogs.deleteConfirm'))) return;

    try {
      await deleteTrafficLog(id);
      toast.success(t('trafficLogs.deleteSuccess'));
      loadLogs();
      loadStats();
    } catch (error) {
      console.error('Error deleting log:', error);
      toast.error(t('trafficLogs.deleteError'));
    }
  };

  const handleRefresh = () => {
    loadLogs();
    loadStats();
    loadOptions();
  };

  const handleExport = () => {
    // Export logs to CSV
    const csv = [
      ['Timestamp', 'Method', 'Path', 'Status', 'Latency (ms)', 'Request Size', 'Response Size', 'IP Address'].join(','),
      ...logs.map((log) =>
        [
          log.timestamp,
          log.method,
          log.path,
          log.status_code,
          log.latency_ms,
          log.request_size,
          log.response_size,
          log.ip_address,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `traffic-logs-${new Date().toISOString()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success(t('trafficLogs.exportSuccess'));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {t('trafficLogs.title')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {t('trafficLogs.description')}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('common.refresh')}
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              {t('common.export')}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowStats(!showStats)}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              {showStats ? t('common.hideStats') : t('common.showStats')}
            </Button>
            <Button onClick={() => navigate('/core/traffic-logs/analytics')}>
              <BarChart3 className="h-4 w-4 mr-2" />
              {t('trafficLogs.viewAnalytics')}
            </Button>
          </div>
        </div>

        {/* Statistics */}
        {showStats && stats && (
          <TrafficLogStats stats={stats} loading={statsLoading} />
        )}

        {/* Filters */}
        <TrafficLogFilters
          filters={filters}
          onFilterChange={setFilters}
          methods={methods}
          appCodes={appCodes}
          regions={regions}
        />

        {/* Results Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('trafficLogs.resultsCount', { count: logs.length })}
            </p>
            {logs.length > 0 && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('trafficLogs.showingFirst', { count: Math.min(logs.length, 100) })}
              </p>
            )}
          </div>
        </div>

        {/* Logs Table */}
        <TrafficLogsTable logs={logs} loading={loading} onDelete={handleDelete} />

        {/* Load More */}
        {logs.length >= 100 && (
          <div className="flex justify-center">
            <Button variant="outline" onClick={() => {
              setFilters({ ...filters, limit: (filters.limit || 100) + 100 });
            }}>
              {t('common.loadMore')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
