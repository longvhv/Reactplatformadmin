/**
 * User Registration Telemetry Page
 * View and analyze user registration logs
 * 
 * ✅ MIGRATED to Phase 3 Standards (2026-01-18):
 * - Replaced confirm() with ConfirmDialog
 * - Using showToast (toast from sonner) for all notifications
 * - Wrapped in Fragment
 * - Using PageLayout with icon/title/description
 * - Using StatisticsCards component
 * - Full dark mode support
 */

import { Fragment, useState, useEffect } from 'react';
import { useTranslation } from '../providers/LanguageProvider'; // ✅ FIX: Use custom implementation
import { useNavigate } from 'react-router';
import { Plus, RefreshCw, Search, Download, Calendar, UserPlus } from 'lucide-react';
import {
  getUserRegistrationLogs,
  deleteUserRegistrationLog,
  getUserRegistrationStats,
  getRegistrationSources,
  getDataRegions,
  UserRegistrationLog,
  UserRegistrationFilters,
  UserRegistrationStats,
} from '../api/userRegistrationLogsApi';
import { UserRegistrationTable } from '../components/user-registration/UserRegistrationTable';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { StatisticsCards } from '../components/common/StatisticsCards';
import { toast } from 'sonner@2.0.3';
import { showToast } from '@/lib/toast';
import { PageLayout } from '@/components/layout/PageLayout';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export default function UserRegistrationTelemetryPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [logs, setLogs] = useState<UserRegistrationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<UserRegistrationStats | null>(null);
  const [sources, setSources] = useState<string[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [filters, setFilters] = useState<UserRegistrationFilters>({
    search: '',
    registration_source: '',
    data_region: '',
  });
  
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
      const data = await getUserRegistrationLogs(filters);
      setLogs(data);
    } catch (error) {
      console.error('Error loading logs:', error);
      toast.error(t('userRegistration.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await getUserRegistrationStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadOptions = async () => {
    try {
      const [sourcesData, regionsData] = await Promise.all([
        getRegistrationSources(),
        getDataRegions(),
      ]);
      setSources(sourcesData);
      setRegions(regionsData);
    } catch (error) {
      console.error('Error loading options:', error);
    }
  };

  useEffect(() => {
    loadLogs();
    loadStats();
    loadOptions();
  }, [filters]);

  const handleDelete = async (id: string) => {
    setConfirmDialog({
      open: true,
      title: t('userRegistration.deleteTitle'),
      description: t('userRegistration.deleteConfirm'),
      onConfirm: async () => {
        try {
          await deleteUserRegistrationLog(id);
          showToast.success(t('userRegistration.deleteSuccess'));
          loadLogs();
          loadStats();
        } catch (error) {
          console.error('Error deleting log:', error);
          showToast.error(t('userRegistration.deleteError'));
        }
        setConfirmDialog({ ...confirmDialog, open: false });
      },
    });
  };

  const statsCards = stats
    ? [
        {
          title: t('userRegistration.totalRegistrations'),
          value: stats.total,
          icon: '👥',
          trend: undefined,
        },
        {
          title: t('userRegistration.last24Hours'),
          value: stats.last24Hours,
          icon: '⏱️',
          trend: undefined,
        },
        {
          title: t('userRegistration.last7Days'),
          value: stats.last7Days,
          icon: '📅',
          trend: undefined,
        },
        {
          title: t('userRegistration.last30Days'),
          value: stats.last30Days,
          icon: '📊',
          trend: undefined,
        },
      ]
    : [];

  // Prepare chart data
  const sourceChartData = stats
    ? Object.entries(stats.bySource).map(([name, value]) => ({
        name,
        value,
      }))
    : [];

  const regionChartData = stats
    ? Object.entries(stats.byRegion).map(([name, value]) => ({
        name,
        value,
      }))
    : [];

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

  return (
    <Fragment>
      <PageLayout
        icon={UserPlus}
        title={t('userRegistration.title')}
        description={t('userRegistration.subtitle')}
        actions={
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => loadLogs()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('common.refresh')}
            </Button>
            <Button onClick={() => navigate('/admin/registration-analytics/create')}>
              <Plus className="h-4 w-4 mr-2" />
              {t('userRegistration.add')}
            </Button>
          </div>
        }
      >
        {/* Statistics */}
        {stats && <StatisticsCards cards={statsCards} />}

        {/* Charts */}
        {stats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Registration by Source */}
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
              <h3 className="text-lg font-semibold mb-4">
                {t('userRegistration.bySource')}
              </h3>
              {sourceChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={sourceChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {sourceChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-gray-500">
                  {t('userRegistration.noData')}
                </div>
              )}
            </div>

            {/* Registration by Region */}
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
              <h3 className="text-lg font-semibold mb-4">
                {t('userRegistration.byRegion')}
              </h3>
              {regionChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={regionChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {regionChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-gray-500">
                  {t('userRegistration.noData')}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={t('userRegistration.searchPlaceholder')}
                value={filters.search || ''}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10"
              />
            </div>
          </div>

          <Select
            value={filters.registration_source || 'all'}
            onValueChange={(value) =>
              setFilters({
                ...filters,
                registration_source: value === 'all' ? '' : value,
              })
            }
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder={t('userRegistration.filterBySource')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('userRegistration.allSources')}</SelectItem>
              {sources.map((source) => (
                <SelectItem key={source} value={source}>
                  {source}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.data_region || 'all'}
            onValueChange={(value) =>
              setFilters({ ...filters, data_region: value === 'all' ? '' : value })
            }
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder={t('userRegistration.filterByRegion')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('userRegistration.allRegions')}</SelectItem>
              {regions.map((region) => (
                <SelectItem key={region} value={region}>
                  {region}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <UserRegistrationTable logs={logs} loading={loading} onDelete={handleDelete} />
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