/**
 * Feature Flag Detail Page
 * ✅ MIGRATED: Using Next.js shim for navigation
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from '@/components/shim/next-navigation';
import { Flag, ArrowLeft, MoreVertical, Edit, Trash2, Power, PowerOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { featureFlagsApi, FeatureFlag } from '@/api/featureFlagsApi';
import { showToast } from '@/lib/toast';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { PageLayout } from '@/components/layout/PageLayout';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function FeatureFlagDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [flag, setFlag] = useState<FeatureFlag | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (id) loadFlag();
  }, [id]);

  const loadFlag = async () => {
    try {
      setLoading(true);
      const data = await featureFlagsApi.getById(id);
      setFlag(data);
    } catch (error: any) {
      showToast.error('Error', 'Failed to load feature flag');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await featureFlagsApi.delete(id);
      showToast.success('Success', 'Feature flag deleted');
      router.push('/platform/feature-flags');
    } catch (error: any) {
      showToast.error('Error', error.message || 'Failed to delete');
    }
  };

  const handleToggle = async () => {
    if (!flag) return;
    try {
      await featureFlagsApi.update(id, { is_enabled: !flag.is_enabled });
      showToast.success('Success', `Feature flag ${flag.is_enabled ? 'disabled' : 'enabled'}`);
      loadFlag();
    } catch (error: any) {
      showToast.error('Error', error.message || 'Failed to toggle');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!flag) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Flag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Feature Flag Not Found</h2>
          <Button onClick={() => router.push('/platform/feature-flags')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Feature Flags
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageLayout
        icon={Flag}
        title={flag.flag_name}
        description={flag.description || 'Feature flag details'}
        backButton={{
          label: 'Back to Feature Flags',
          onClick: () => router.push('/platform/feature-flags'),
        }}
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/platform/feature-flags/edit/${id}`)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleToggle}>
                {flag.is_enabled ? (
                  <>
                    <PowerOff className="w-4 h-4 mr-2" />
                    Disable
                  </>
                ) : (
                  <>
                    <Power className="w-4 h-4 mr-2" />
                    Enable
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
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
          <dl className="space-y-4">
            <div>
              <dt className="text-sm text-gray-600 mb-1">Flag Key</dt>
              <dd className="font-mono text-sm bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded">
                {flag.flag_key}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600 mb-1">Status</dt>
              <dd>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  flag.is_enabled 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {flag.is_enabled ? 'Enabled' : 'Disabled'}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600 mb-1">Description</dt>
              <dd className="text-gray-900 dark:text-white">{flag.description || 'No description'}</dd>
            </div>
          </dl>
        </div>
      </PageLayout>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Feature Flag"
        description={`Delete "${flag.flag_name}"? This cannot be undone.`}
        onConfirm={handleDelete}
        variant="destructive"
      />
    </>
  );
}

export { FeatureFlagDetailPage };
export default FeatureFlagDetailPage;
