/**
 * Traffic Logs Page
 * Main page for viewing traffic logs
 * 
 * ✅ MIGRATED: Using Next.js shim for navigation
 * ✅ Phase 3: ConfirmDialog, showToast, Fragment wrapper
 * ✅ PageLayout with icon/title/description, Full dark mode support
 */

'use client';

import { Fragment, useState, useEffect } from 'react';
import { useLanguage } from '../../../../providers/LanguageProvider';
import { useRouter } from '../../../../components/shim/next-navigation';
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
} from '../../../../api/trafficLogsApi';
import { TrafficLogsTable } from '../../../../components/traffic-logs/TrafficLogsTable';
import { TrafficLogFilters } from '../../../../components/traffic-logs/TrafficLogFilters';
import { TrafficLogStats } from '../../../../components/traffic-logs/TrafficLogStats';
import { Button } from '../../../../components/ui/button';
import { Card } from '../../../../components/ui/card';
import { showToast } from '../../../../lib/toast';
import { PageLayout } from '../../../../components/layout/PageLayout';
import { ConfirmDialog } from '../../../../components/common/ConfirmDialog';

function TrafficLogsPage() {
  const { t } = useLanguage();
  const router = useRouter();

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

  useEffect(() => {
    loadData();
    loadFilterOptions();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getTrafficLogs(filters);
      setLogs(data);
    } catch (error) {
      console.error('Failed to load traffic logs:', error);
      showToast.error('Error', 'Failed to load traffic logs');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      setStatsLoading(true);
      const data = await getTrafficStats(filters);
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const loadFilterOptions = async () => {
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
      console.error('Failed to load filter options:', error);
    }
  };

  const handleRefresh = () => {
    loadData();
    if (showStats) loadStats();
  };

  const handleExport = () => {
    showToast.info('Export', 'Export feature coming soon');
  };

  const handleDelete = (id: string) => {
    setConfirmDialog({
      open: true,
      title: 'Confirm Delete',
      description: 'Are you sure you want to delete this traffic log?',
      onConfirm: async () => {
        try {
          await deleteTrafficLog(id);
          showToast.success('Success', 'Traffic log deleted');
          loadData();
        } catch (error) {
          showToast.error('Error', 'Failed to delete traffic log');
        }
      },
    });
  };

  return (
    <Fragment>
      <PageLayout
        icon={Activity}
        title="Traffic Logs"
        description="Monitor and analyze system traffic"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowStats(!showStats)}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              {showStats ? 'Hide Stats' : 'Show Stats'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        }
      >
        {/* Stats */}
        {showStats && stats && (
          <TrafficLogStats stats={stats} loading={statsLoading} />
        )}

        {/* Filters */}
        <Card className="p-6">
          <TrafficLogFilters
            filters={filters}
            onFiltersChange={setFilters}
            methods={methods}
            appCodes={appCodes}
            regions={regions}
          />
        </Card>

        {/* Traffic Logs Table */}
        <TrafficLogsTable
          logs={logs}
          loading={loading}
          onDelete={handleDelete}
          onViewDetail={(log) => router.push(`/platform/traffic-logs/${log._id}`)}
        />
      </PageLayout>

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
        variant="destructive"
      />
    </Fragment>
  );
}

// Named export for reuse
export { TrafficLogsPage };

// Default export for routing
export default TrafficLogsPage;