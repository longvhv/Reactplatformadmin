/**
 * System Jobs Page
 * List and manage system jobs
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Plus, RefreshCw, Search, Filter } from 'lucide-react';
import {
  systemJobsApi,
  SystemJob,
  SystemJobFilters,
} from '../api/systemJobsApi';
import { SystemJobsTable } from '../components/system-jobs/SystemJobsTable';
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
import { JOB_TYPES, JOB_PRIORITIES } from '../data/system-jobs-demo';

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

  const loadJobs = async () => {
    try {
      setLoading(true);
      const data = await systemJobsApi.getAll(filters);
      setJobs(data);
    } catch (error) {
      console.error('Error loading jobs:', error);
      toast.error(t('systemJobs.fetchError'));
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
      toast.success(t('systemJobs.executeSuccess'));
      loadJobs();
    } catch (error) {
      console.error('Error executing job:', error);
      toast.error(t('systemJobs.executeError'));
    }
  };

  const handlePause = async (id: string) => {
    try {
      await systemJobsApi.pause(id);
      toast.success(t('systemJobs.pauseSuccess'));
      loadJobs();
    } catch (error) {
      console.error('Error pausing job:', error);
      toast.error(t('systemJobs.pauseError'));
    }
  };

  const handleResume = async (id: string) => {
    try {
      await systemJobsApi.resume(id);
      toast.success(t('systemJobs.resumeSuccess'));
      loadJobs();
    } catch (error) {
      console.error('Error resuming job:', error);
      toast.error(t('systemJobs.resumeError'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('systemJobs.deleteConfirm'))) return;

    try {
      await systemJobsApi.delete(id);
      toast.success(t('systemJobs.deleteSuccess'));
      loadJobs();
      loadStats();
    } catch (error) {
      console.error('Error deleting job:', error);
      toast.error(t('systemJobs.deleteError'));
    }
  };

  const statsCards = stats
    ? [
        {
          title: t('systemJobs.totalJobs'),
          value: stats.total,
          icon: '📋',
          trend: undefined,
        },
        {
          title: t('systemJobs.activeJobs'),
          value: stats.byStatus?.running || 0,
          icon: '▶️',
          trend: undefined,
        },
        {
          title: t('systemJobs.pendingJobs'),
          value: stats.byStatus?.pending || 0,
          icon: '⏸️',
          trend: undefined,
        },
        {
          title: t('systemJobs.failedJobs'),
          value: stats.byStatus?.failed || 0,
          icon: '❌',
          trend: undefined,
        },
      ]
    : [];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {t('systemJobs.title')}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {t('systemJobs.subtitle')}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => loadJobs()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('common.refresh')}
          </Button>
          <Button onClick={() => navigate('/core/system-jobs/new')}>
            <Plus className="h-4 w-4 mr-2" />
            {t('systemJobs.add')}
          </Button>
        </div>
      </div>

      {/* Statistics */}
      {stats && <StatisticsCards cards={statsCards} />}

      {/* Filters */}
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

      {/* Table */}
      <SystemJobsTable
        jobs={jobs}
        loading={loading}
        onExecute={handleExecute}
        onPause={handlePause}
        onResume={handleResume}
        onDelete={handleDelete}
      />
    </div>
  );
}