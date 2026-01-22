/**
 * System Job Detail Page
 * ✅ MIGRATED: Using Next.js shim for navigation
 */

'use client';

import { Fragment, useState, useEffect } from 'react';
import { useRouter, useParams } from '../../../../../../components/shim/next-navigation';
import { Cog, Play, Square, RotateCw, Trash2 } from 'lucide-react';
import { Button } from '../../../../../../components/ui/button';
import { systemJobsApi, SystemJob } from '../../../../../../api/systemJobsApi';
import { showToast } from '../../../../../../lib/toast';
import { ConfirmDialog } from '../../../../../../components/common/ConfirmDialog';
import { PageLayout } from '../../../../../../components/layout/PageLayout';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../../../../components/ui/dropdown-menu';

function SystemJobDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [job, setJob] = useState<SystemJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (id) loadJob();
  }, [id]);

  const loadJob = async () => {
    try {
      setLoading(true);
      const data = await systemJobsApi.getById(id);
      setJob(data);
    } catch (error: any) {
      showToast.error('Error', 'Failed to load job');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await systemJobsApi.delete(id);
      showToast.success('Success', 'Job deleted');
      router.push('/platform/system-jobs');
    } catch (error: any) {
      showToast.error('Error', error.message || 'Failed to delete');
    }
  };

  const handleRetry = async () => {
    try {
      await systemJobsApi.retry(id);
      showToast.success('Success', 'Job retrying');
      loadJob();
    } catch (error: any) {
      showToast.error('Error', error.message || 'Failed to retry');
    }
  };

  const handleCancel = async () => {
    try {
      await systemJobsApi.cancel(id);
      showToast.success('Success', 'Job cancelled');
      loadJob();
    } catch (error: any) {
      showToast.error('Error', error.message || 'Failed to cancel');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Cog className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Job Not Found</h2>
          <Button onClick={() => router.push('/platform/system-jobs')}>
            <Square className="w-4 h-4 mr-2" />
            Back to System Jobs
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageLayout
        icon={Cog}
        title={job.job_name}
        description={`Type: ${job.job_type}`}
        backButton={{
          label: 'Back to System Jobs',
          onClick: () => router.push('/platform/system-jobs'),
        }}
        actions={
          <div className="flex items-center gap-2">
            {job.status === 'FAILED' && (
              <Button variant="outline" size="sm" onClick={handleRetry}>
                <RotateCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            )}
            {(job.status === 'PENDING' || job.status === 'RUNNING') && (
              <Button variant="outline" size="sm" onClick={handleCancel}>
                <Square className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-red-600">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      >
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
          <dl className="space-y-4">
            <div>
              <dt className="text-sm text-gray-600 mb-1">Job Type</dt>
              <dd className="font-medium">{job.job_type}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600 mb-1">Status</dt>
              <dd>
                <span className={`px-2 py-1 rounded text-xs ${
                  job.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                  job.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                  job.status === 'RUNNING' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {job.status}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600 mb-1">Priority</dt>
              <dd>{job.priority}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600 mb-1">Created At</dt>
              <dd>{new Date(job.created_at).toLocaleString()}</dd>
            </div>
            {job.completed_at && (
              <div>
                <dt className="text-sm text-gray-600 mb-1">Completed At</dt>
                <dd>{new Date(job.completed_at).toLocaleString()}</dd>
              </div>
            )}
            {job.error_message && (
              <div>
                <dt className="text-sm text-gray-600 mb-1">Error Message</dt>
                <dd className="text-red-600 font-mono text-sm bg-red-50 p-3 rounded">
                  {job.error_message}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </PageLayout>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete System Job"
        description="Delete this job? This cannot be undone."
        onConfirm={handleDelete}
        variant="destructive"
      />
    </>
  );
}

export { SystemJobDetailPage };
export default SystemJobDetailPage;