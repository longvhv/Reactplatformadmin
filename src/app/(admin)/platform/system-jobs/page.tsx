/**
 * System Jobs Page
 * Manage system background jobs
 * ✅ MIGRATED: Using Next.js shim for navigation
 * ✅ Phase 3: ConfirmDialog, showToast, Fragment wrapper
 */

'use client';

import { Fragment, useState, useEffect } from 'react';
import { useLanguage } from '@/providers/LanguageProvider';
import { useRouter } from '@/components/shim/next-navigation';
import { Plus, RefreshCw, Search, Filter, Activity, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import {
  systemJobsApi,
  SystemJob,
  SystemJobFilters,
} from '@/api/systemJobsApi';
import { SystemJobsTable } from '@/components/system-jobs/SystemJobsTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageLayout } from '@/components/layout/PageLayout';
import { showToast } from '@/lib/toast';
import { JOB_TYPES, JOB_PRIORITIES } from '@/data/system-jobs-demo';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { StatisticsCards } from '@/components/common/StatisticsCards';

function SystemJobsPage() {
  const { t } = useLanguage();
  const router = useRouter();

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
      showToast.error('Error', 'Failed to load system jobs');
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

  const handleDelete = (id: string, name: string) => {
    setConfirmDialog({
      open: true,
      title: 'Delete System Job',
      description: `Are you sure you want to delete job "${name}"?`,
      onConfirm: async () => {
        try {
          await systemJobsApi.delete(id);
          showToast.success('Success', 'Job deleted');
          loadJobs();
        } catch (error) {
          showToast.error('Error', 'Failed to delete job');
        }
      },
      variant: 'destructive',
    });
  };

  const handleRetry = async (id: string) => {
    try {
      await systemJobsApi.retry(id);
      showToast.success('Success', 'Job retrying');
      loadJobs();
    } catch (error) {
      showToast.error('Error', 'Failed to retry job');
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await systemJobsApi.cancel(id);
      showToast.success('Success', 'Job cancelled');
      loadJobs();
    } catch (error) {
      showToast.error('Error', 'Failed to cancel job');
    }
  };

  const statsCards = stats ? [
    { label: 'Total Jobs', value: stats.total || 0, color: 'indigo' as const, icon: Activity },
    { label: 'Pending', value: stats.pending || 0, color: 'yellow' as const, icon: Clock },
    { label: 'Completed', value: stats.completed || 0, color: 'green' as const, icon: CheckCircle },
    { label: 'Failed', value: stats.failed || 0, color: 'red' as const, icon: XCircle },
  ] : [];

  if (loading && jobs.length === 0) {
    return (
      <Fragment>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading system jobs...</p>
          </div>
        </div>
      </Fragment>
    );
  }

  return (
    <Fragment>
      <PageLayout
        icon={Activity}
        title="System Jobs"
        description="Manage background tasks and scheduled jobs"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadJobs()}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => router.push('/platform/system-jobs/create')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Job
            </Button>
          </div>
        }
      >
        {/* Stats */}
        {stats && <StatisticsCards stats={statsCards} columns={4} />}

        {/* Filters */}
        <Card className="p-6">
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search jobs by name, type..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10"
              />
            </div>

            <Select
              value={filters.status || 'all'}
              onValueChange={(value) => setFilters({ ...filters, status: value === 'all' ? '' : value })}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="RUNNING">Running</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.priority || 'all'}
              onValueChange={(value) => setFilters({ ...filters, priority: value === 'all' ? '' : value })}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="NORMAL">Normal</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <p className="text-sm text-muted-foreground">
            Showing {jobs.length} jobs
          </p>
        </Card>

        {/* Jobs Table */}
        <SystemJobsTable
          jobs={jobs}
          loading={loading}
          onDelete={handleDelete}
          onRetry={handleRetry}
          onCancel={handleCancel}
          onViewDetail={(job) => router.push(`/platform/system-jobs/${job._id}`)}
        />
      </PageLayout>

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
        variant={confirmDialog.variant}
      />
    </Fragment>
  );
}

// Named export for reuse
export { SystemJobsPage };

// Default export for routing
export default SystemJobsPage;
