/**
 * System Jobs Page
 * Manage system background jobs
 * ✅ MIGRATED Phase 3: ConfirmDialog, showToast, Fragment wrapper
 */

import { Fragment, useState, useEffect } from 'react';
import { useTranslation } from '../providers/LanguageProvider';
import { useNavigate } from 'react-router';
import { Plus, RefreshCw, Search, Filter, Activity, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import {
  systemJobsApi,
  SystemJob,
  SystemJobFilters,
} from '../api/systemJobsApi';
import { SystemJobsTable } from '../components/system-jobs/SystemJobsTable';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { PageLayout } from '../components/layout/PageLayout';
import { showToast } from '../lib/toast';
import { JOB_TYPES, JOB_PRIORITIES } from '../data/system-jobs-demo';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { StatisticsCards } from '../components/common/StatisticsCards';

export default function SystemJobsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [jobs, setJobs] = useState<SystemJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [filters, setFilters] = useState<SystemJobFilters>({
    search: '',
    status: '',
    priority: '',
    job_type: '',
  });

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    variant?: 'default' | 'destructive';
  }>({
    open: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  const loadJobs = async () => {
    try {
      setLoading(true);
      const data = await systemJobsApi.getAll(filters);
      setJobs(data);
    } catch (error) {
      console.error('Error loading jobs:', error);
      showToast.error(t('systemJobs.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await systemJobsApi.getStatistics();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  useEffect(() => {
    loadJobs();
    loadStats();
  }, [filters]);

  const handleExecute = async (id: string) => {
    try {
      await systemJobsApi.execute(id);
      showToast.success(t('systemJobs.executeSuccess'));
      loadJobs();
    } catch (error) {
      console.error('Error executing job:', error);
      showToast.error(t('systemJobs.executeError'));
    }
  };

  const handlePause = async (id: string) => {
    try {
      await systemJobsApi.pause(id);
      showToast.success(t('systemJobs.pauseSuccess'));
      loadJobs();
    } catch (error) {
      console.error('Error pausing job:', error);
      showToast.error(t('systemJobs.pauseError'));
    }
  };

  const handleResume = async (id: string) => {
    try {
      await systemJobsApi.resume(id);
      showToast.success(t('systemJobs.resumeSuccess'));
      loadJobs();
    } catch (error) {
      console.error('Error resuming job:', error);
      showToast.error(t('systemJobs.resumeError'));
    }
  };

  const handleDelete = async (id: string) => {
    setConfirmDialog({
      open: true,
      title: t('systemJobs.deleteConfirmTitle'),
      description: t('systemJobs.deleteConfirmDescription'),
      onConfirm: async () => {
        try {
          await systemJobsApi.delete(id);
          showToast.success(t('systemJobs.deleteSuccess'));
          loadJobs();
          loadStats();
        } catch (error) {
          console.error('Error deleting job:', error);
          showToast.error(t('systemJobs.deleteError'));
        }
      },
      variant: 'destructive',
    });
  };

  const statsCards = stats
    ? [
        {
          label: t('systemJobs.totalJobs'),
          value: stats.total,
          color: 'indigo' as const,
          icon: Activity,
        },
        {
          label: t('systemJobs.activeJobs'),
          value: stats.byStatus?.running || 0,
          color: 'green' as const,
          icon: CheckCircle,
        },
        {
          label: t('systemJobs.pendingJobs'),
          value: stats.byStatus?.pending || 0,
          color: 'yellow' as const,
          icon: Clock,
        },
        {
          label: t('systemJobs.failedJobs'),
          value: stats.byStatus?.failed || 0,
          color: 'red' as const,
          icon: XCircle,
        },
      ]
    : [];

  return (
    <PageLayout
      icon={Activity}
      title={t('systemJobs.title')}
      description={t('systemJobs.subtitle')}
      actions={
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={() => loadJobs()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('common.refresh')}
          </Button>
          <Button size="sm" onClick={() => navigate('/platform/system-jobs/create')}>
            <Plus className="h-4 w-4 mr-2" />
            {t('systemJobs.add')}
          </Button>
        </div>
      }
    >
      {/* Stats Cards */}
      {stats && (
        <StatisticsCards stats={statsCards} />
      )}

      {/* Filters */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={t('systemJobs.searchPlaceholder')}
                value={filters.search || ''}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10"
              />
            </div>
          </div>

          <Select
            value={filters.status || 'all'}
            onValueChange={(value) =>
              setFilters({ ...filters, status: value === 'all' ? '' : value })
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('systemJobs.filterByStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('systemJobs.allStatuses')}</SelectItem>
              <SelectItem value="pending">{t('systemJobs.statusValues.pending')}</SelectItem>
              <SelectItem value="running">{t('systemJobs.statusValues.running')}</SelectItem>
              <SelectItem value="completed">{t('systemJobs.statusValues.completed')}</SelectItem>
              <SelectItem value="failed">{t('systemJobs.statusValues.failed')}</SelectItem>
              <SelectItem value="paused">{t('systemJobs.statusValues.paused')}</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.priority || 'all'}
            onValueChange={(value) =>
              setFilters({ ...filters, priority: value === 'all' ? '' : value })
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('systemJobs.filterByPriority')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('systemJobs.allPriorities')}</SelectItem>
              {JOB_PRIORITIES.map((priority) => (
                <SelectItem key={priority.value} value={priority.value}>
                  {t(`systemJobs.priorityValues.${priority.value}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.job_type || 'all'}
            onValueChange={(value) =>
              setFilters({ ...filters, job_type: value === 'all' ? '' : value })
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('systemJobs.filterByType')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('systemJobs.allTypes')}</SelectItem>
              {JOB_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {t(`systemJobs.jobTypes.${type.value}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <SystemJobsTable
          jobs={jobs}
          loading={loading}
          onExecute={handleExecute}
          onPause={handlePause}
          onResume={handleResume}
          onDelete={handleDelete}
        />
      </Card>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
        variant={confirmDialog.variant}
        confirmLabel="Xác nhận"
        cancelLabel="Hủy"
      />
    </PageLayout>
  );
}