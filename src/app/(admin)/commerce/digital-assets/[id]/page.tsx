/**
 * Digital Asset Detail Page
 * ✅ MIGRATED: Using Next.js shim for navigation
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from '../../../../components/shim/next-navigation';
import { Package, ArrowLeft, MoreVertical, Edit, Trash2, Lock, Unlock } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { digitalAssetsApi, DigitalAsset } from '../../../../api/digitalAssetsApi';
import { showToast } from '../../../../lib/toast';
import { ConfirmDialog } from '../../../../components/common/ConfirmDialog';
import { PageLayout } from '../../../../components/layout/PageLayout';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../../components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../../components/ui/dialog';

function DigitalAssetDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [asset, setAsset] = useState<DigitalAsset | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (id) loadAsset();
  }, [id]);

  const loadAsset = async () => {
    try {
      setLoading(true);
      const data = await digitalAssetsApi.getById(id);
      setAsset(data);
    } catch (error: any) {
      showToast.error('Error', 'Failed to load digital asset');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await digitalAssetsApi.delete(id);
      showToast.success('Success', 'Digital asset deleted');
      router.push('/commerce/digital-assets');
    } catch (error: any) {
      showToast.error('Error', error.message || 'Failed to delete');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Asset Not Found</h2>
          <Button onClick={() => router.push('/commerce/digital-assets')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Digital Assets
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageLayout
        icon={Shield}
        title={asset.name}
        description={`Type: ${asset.asset_type}`}
        backButton={{
          label: 'Back to Digital Assets',
          onClick: () => router.push('/commerce/digital-assets'),
        }}
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/commerce/digital-assets/edit/${id}`)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Asset
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
              <dt className="text-sm text-gray-600 mb-1">Asset Type</dt>
              <dd className="font-medium capitalize">{asset.asset_type}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600 mb-1">Value</dt>
              <dd className="font-mono text-sm bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded break-all">
                {asset.asset_value}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600 mb-1">Status</dt>
              <dd>
                <span className={`px-2 py-1 rounded text-xs ${
                  asset.status === 'active' ? 'bg-green-100 text-green-800' :
                  asset.status === 'expired' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {asset.status}
                </span>
              </dd>
            </div>
            {asset.expiry_date && (
              <div>
                <dt className="text-sm text-gray-600 mb-1">Expiry Date</dt>
                <dd>{new Date(asset.expiry_date).toLocaleDateString()}</dd>
              </div>
            )}
            {asset.notes && (
              <div>
                <dt className="text-sm text-gray-600 mb-1">Notes</dt>
                <dd className="text-gray-900 dark:text-white">{asset.notes}</dd>
              </div>
            )}
          </dl>
        </div>
      </PageLayout>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Digital Asset"
        description={`Delete "${asset.name}"? This cannot be undone.`}
        onConfirm={handleDelete}
        variant="destructive"
      />
    </>
  );
}

export { DigitalAssetDetailPage };
export default DigitalAssetDetailPage;