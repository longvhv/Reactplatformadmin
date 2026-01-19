/**
 * Traffic Logs Page
 * Main page for viewing traffic logs
 * 
 * ✅ MIGRATED to Phase 3 Standards (2026-01-18):
 * - Replaced confirm() with ConfirmDialog
 * - Using showToast for all notifications
 * - Wrapped in Fragment
 * - Using PageLayout with icon/title/description
 * - Full dark mode support
 */

import { Fragment, useState, useEffect } from 'react';
import { useTranslation } from '../providers/LanguageProvider';
import { useNavigate } from 'react-router';
import { RefreshCw, Download, BarChart3, Activity, Globe, Zap, TrendingUp } from 'lucide-react';
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
import { Card } from '../components/ui/card';
import { showToast } from '../lib/toast';
import { PageLayout } from '../components/layout/PageLayout';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

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
  
  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await getTrafficLogs({ ...filters, limit: 100 });
      setLogs(data);
    } catch (error) {
      console.error('Error loading traffic logs:', error);
      showToast.error(t('trafficLogs.fetchError'));
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
      showToast.error(t('trafficLogs.statsError'));
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
    setConfirmDialog({
      open: true,
      title: t('trafficLogs.deleteTitle'),
      description: t('trafficLogs.deleteConfirm'),
      onConfirm: async () => {
        try {
          await deleteTrafficLog(id);
          showToast.success(t('trafficLogs.deleteSuccess'));
          loadLogs();
          loadStats();
        } catch (error) {
          console.error('Error deleting log:', error);
          showToast.error(t('trafficLogs.deleteError'));
        }
        setConfirmDialog({ ...confirmDialog, open: false });
      },
    });
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

    showToast.success(t('trafficLogs.exportSuccess'));
  };

  return (
    <Fragment>
      <PageLayout
        icon={Activity}
        title={t('trafficLogs.title')}
        description={t('trafficLogs.description')}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('common.refresh')}
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              {t('common.export')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowStats(!showStats)}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              {showStats ? t('common.hideStats') : t('common.showStats')}
            </Button>
            <Button size="sm" onClick={() => navigate('/platform/traffic-logs/analytics')}>
              <BarChart3 className="h-4 w-4 mr-2" />
              {t('trafficLogs.viewAnalytics')}
            </Button>
          </div>
        }
      >
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
        <Card className="p-4">
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
        </Card>

        {/* Logs Table */}
        <Card>
          <TrafficLogsTable logs={logs} loading={loading} onDelete={handleDelete} />
        </Card>

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
      </PageLayout>
      
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
        confirmLabel={t('common.confirm')}
        cancelLabel={t('common.cancel')}
        variant="destructive"
      />
    </Fragment>
  );
}