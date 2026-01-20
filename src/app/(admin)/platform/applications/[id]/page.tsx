/**
 * Application Detail Page
 * ✅ MIGRATED: Using Next.js shim for navigation
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from '@/components/shim/next-navigation';
import { Server, ArrowLeft, MoreVertical, Edit, Trash2, Power, PowerOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { applicationsApi, Application } from '@/api/applicationsApi';
import { showToast } from '@/lib/toast';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { PageLayout } from '@/components/layout/PageLayout';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function ApplicationDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (id) loadApp();
  }, [id]);

  const loadApp = async () => {
    try {
      setLoading(true);
      const data = await applicationsApi.getById(id);
      setApp(data);
    } catch (error: any) {
      showToast.error('Error', 'Failed to load application');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await applicationsApi.delete(id);
      showToast.success('Success', 'Application deleted');
      router.push('/platform/applications');
    } catch (error: any) {
      showToast.error('Error', error.message || 'Failed to delete');
    }
  };

  const handleToggleActive = async () => {
    if (!app) return;
    try {
      await applicationsApi.update(id, { is_active: !app.is_active });
      showToast.success('Success', `Application ${app.is_active ? 'deactivated' : 'activated'}`);
      loadApp();
    } catch (error: any) {
      showToast.error('Error', error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Server className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Application Not Found</h2>
          <Button onClick={() => router.push('/platform/applications')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Applications
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageLayout
        icon={Server}
        title={app.name}
        description={app.description || 'Application details'}
        backButton={{
          label: 'Back to Applications',
          onClick: () => router.push('/platform/applications'),
        }}
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/platform/applications/${id}/edit`)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleToggleActive}>
                {app.is_active ? (
                  <>
                    <PowerOff className="w-4 h-4 mr-2" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <Power className="w-4 h-4 mr-2" />
                    Activate
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-red-600">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
            <h3 className="font-semibold mb-4">Application Info</h3>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-gray-600">App Code:</dt>
                <dd className="font-mono text-sm">{app.code}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Status:</dt>
                <dd>
                  <span className={`px-2 py-1 rounded text-xs ${
                    app.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {app.is_active ? 'Active' : 'Inactive'}
                  </span>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Created At:</dt>
                <dd className="text-sm">
                  {new Date(app.created_at).toLocaleDateString('vi-VN')}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </PageLayout>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Application"
        description={`Delete "${app.name}"? This cannot be undone.`}
        onConfirm={handleDelete}
        variant="destructive"
      />
    </>
  );
}

export { ApplicationDetailPage };
export default ApplicationDetailPage;
