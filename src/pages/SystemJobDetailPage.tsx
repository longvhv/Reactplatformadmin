/**
 * System Job Detail Page
 * Displays details of a specific system job
 * 
 * ✅ MIGRATED to Phase 3 Standards (2026-01-18):
 * - Replaced confirm() with ConfirmDialog
 * - Using showToast (toast from sonner) for all notifications
 * - Wrapped in Fragment
 * - Using PageLayout with icon/title/description
 * - Using StatisticsCards for statistics
 * - Full dark mode support
 */

import { Fragment, useState, useEffect } from 'react';
import { useTranslation } from '../providers/LanguageProvider';
import { useNavigate, useParams } from 'react-router';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Play,
  Pause,
  RotateCw,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Briefcase,
} from 'lucide-react';
import {
  systemJobsApi,
  SystemJob,
} from '../api/systemJobsApi';
import { SystemJobStatusBadge } from '../components/system-jobs/SystemJobStatusBadge';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner@2.0.3';
import { showToast } from '@/lib/toast';
import { PageLayout } from '@/components/layout/PageLayout';
import { StatisticsCards } from '@/components/common/StatisticsCards';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';

export default function SystemJobDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [job, setJob] = useState<SystemJob | null>(null);
  const [loading, setLoading] = useState(true);
  
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

  const loadJob = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await systemJobsApi.getById(id);
      if (data) {
        setJob(data);
      } else {
        toast.error(t('systemJobs.notFound'));
        navigate('/platform/system-jobs');
      }
    } catch (error) {
      console.error('Error loading job:', error);
      toast.error(t('systemJobs.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJob();
  }, [id]);

  const handleExecute = async () => {
    if (!id) return;
    try {
      await systemJobsApi.execute(id);
      toast.success(t('systemJobs.executeSuccess'));
      loadJob();
    } catch (error) {
      console.error('Error executing job:', error);
      toast.error(t('systemJobs.executeError'));
    }
  };

  const handlePause = async () => {
    if (!id) return;
    try {
      await systemJobsApi.pause(id);
      toast.success(t('systemJobs.pauseSuccess'));
      loadJob();
    } catch (error) {
      console.error('Error pausing job:', error);
      toast.error(t('systemJobs.pauseError'));
    }
  };

  const handleResume = async () => {
    if (!id) return;
    try {
      await systemJobsApi.resume(id);
      toast.success(t('systemJobs.resumeSuccess'));
      loadJob();
    } catch (error) {
      console.error('Error resuming job:', error);
      toast.error(t('systemJobs.resumeError'));
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    
    setConfirmDialog({
      open: true,
      title: t('systemJobs.deleteTitle'),
      description: t('systemJobs.deleteConfirm'),
      onConfirm: async () => {
        try {
          await systemJobsApi.delete(id);
          showToast.success(t('systemJobs.deleteSuccess'));
          navigate('/platform/system-jobs');
        } catch (error) {
          console.error('Error deleting job:', error);
          showToast.error(t('systemJobs.deleteError'));
        }
        setConfirmDialog({ ...confirmDialog, open: false });
      },
    });
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '-';
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'normal':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner />
      </div>
    );
  }

  if (!job) {
    return null;
  }

  const successRate =
    job.run_count > 0
      ? Math.round((job.success_count / job.run_count) * 100)
      : 0;
      
  const statisticsData = [
    { 
      label: t('systemJobs.runCount'), 
      value: job.run_count, 
      color: 'blue' as const, 
      icon: Clock 
    },
    { 
      label: t('systemJobs.successCount'), 
      value: job.success_count, 
      color: 'green' as const, 
      icon: CheckCircle 
    },
    { 
      label: t('systemJobs.failureCount'), 
      value: job.failure_count, 
      color: 'red' as const, 
      icon: XCircle 
    },
    { 
      label: t('systemJobs.successRate'), 
      value: `${successRate}%`, 
      color: 'indigo' as const, 
      icon: AlertCircle 
    },
  ];

  return (
    <Fragment>
      <PageLayout
        icon={Briefcase}
        title={job.job_name}
        description={job.description || t('systemJobs.detail')}
        actions={
          <div className="flex gap-3">
            {job.status === 'paused' ? (
              <Button variant="outline" onClick={handleResume}>
                <Play className="h-4 w-4 mr-2" />
                {t('systemJobs.resume')}
              </Button>
            ) : job.status === 'running' ? (
              <Button variant="outline" onClick={handlePause}>
                <Pause className="h-4 w-4 mr-2" />
                {t('systemJobs.pause')}
              </Button>
            ) : (
              <Button variant="outline" onClick={handleExecute}>
                <Play className="h-4 w-4 mr-2" />
                {t('systemJobs.execute')}
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate(`/platform/system-jobs/${job.id}/edit`)}>
              <Edit className="h-4 w-4 mr-2" />
              {t('common.edit')}
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              {t('common.delete')}
            </Button>
          </div>
        }
      >
        {/* Basic Information */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            {t('tenants.basicInformation')}
          </h2>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {t('systemJobs.jobType')}
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                {t(`systemJobs.jobTypes.${job.job_type}`) || job.job_type}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {t('systemJobs.status')}
              </dt>
              <dd className="mt-1">
                <SystemJobStatusBadge status={job.status} />
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {t('systemJobs.priority')}
              </dt>
              <dd className="mt-1">
                <Badge className={getPriorityColor(job.priority)}>
                  {t(`systemJobs.priorityValues.${job.priority}`)}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {t('systemJobs.scheduleType')}
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                {job.schedule_type
                  ? t(`systemJobs.scheduleTypes.${job.schedule_type}`)
                  : '-'}
              </dd>
            </div>
            {job.cron_expression && (
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {t('systemJobs.cronExpression')}
                </dt>
                <dd className="mt-1 text-sm font-mono text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                  {job.cron_expression}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {t('systemJobs.isActive')}
              </dt>
              <dd className="mt-1">
                <Badge className={job.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                  {job.is_active ? t('common.yes') : t('common.no')}
                </Badge>
              </dd>
            </div>
          </dl>
        </Card>

        {/* Execution Statistics */}
        <StatisticsCards stats={statisticsData} columns={4} className="mb-0 border-none shadow-sm" />

        {/* Last Run Information */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            {t('systemJobs.lastRunAt')}
          </h2>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {t('systemJobs.lastRunAt')}
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                {formatDateTime(job.last_run_at)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {t('systemJobs.nextRunAt')}
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                {formatDateTime(job.next_run_at)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {t('systemJobs.lastRunDuration')}
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                {formatDuration(job.last_run_duration)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {t('systemJobs.lastRunStatus')}
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                {job.last_run_status || '-'}
              </dd>
            </div>
            {job.last_run_error && (
              <div className="md:col-span-2">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {t('systemJobs.lastRunError')}
                </dt>
                <dd className="mt-1 text-sm text-red-600 dark:text-red-400 font-mono bg-red-50 dark:bg-red-900/20 p-3 rounded">
                  {job.last_run_error}
                </dd>
              </div>
            )}
          </dl>
        </Card>

        {/* Metadata */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            Metadata
          </h2>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {t('systemJobs.createdBy')}
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                {job.created_by || '-'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {t('common.createdAt')}
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                {formatDateTime(job.created_at)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {t('common.updatedAt')}
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                {formatDateTime(job.updated_at)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                ID
              </dt>
              <dd className="mt-1 text-sm font-mono text-gray-900 dark:text-gray-100">
                {job.id}
              </dd>
            </div>
          </dl>
        </Card>
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