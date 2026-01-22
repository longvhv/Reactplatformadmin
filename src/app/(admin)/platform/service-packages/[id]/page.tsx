/**
 * Service Package Detail Page
 * ✅ MIGRATED: Using Next.js shim for navigation
 */

'use client';

import { Fragment, useState, useEffect } from 'react';
import { useRouter, useParams } from '../../../../../../components/shim/next-navigation';
import { Package, Edit, Trash2 } from 'lucide-react';
import { Button } from '../../../../../../components/ui/button';
import { servicePackagesApi, ServicePackage } from '../../../../api/servicePackagesApi';
import { showToast } from '../../../../lib/toast';
import { ConfirmDialog } from '../../../../components/common/ConfirmDialog';
import { PageLayout } from '../../../../components/layout/PageLayout';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../../../components/ui/dropdown-menu';

function ServicePackageDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const [pkg, setPkg] = useState<ServicePackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (id) loadPackage();
  }, [id]);

  const loadPackage = async () => {
    try {
      setLoading(true);
      const data = await servicePackagesApi.getById(id);
      setPkg(data);
    } catch (error: any) {
      showToast.error('Error', 'Failed to load service package');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!pkg) return;
    try {
      await servicePackagesApi.delete(id, pkg.version);
      showToast.success('Success', 'Service package deleted');
      router.push('/platform/service-packages');
    } catch (error: any) {
      showToast.error('Error', error.message || 'Failed to delete');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
  }

  if (!pkg) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Service Package Not Found</h2>
          <Button onClick={() => router.push('/platform/service-packages')}><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageLayout icon={Package} title={pkg.package_name} description={pkg.description || 'Service package details'} backButton={{ label: 'Back', onClick: () => router.push('/platform/service-packages') }}
        actions={<DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" size="sm"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end"><DropdownMenuItem onClick={() => router.push(`/platform/service-packages/edit/${id}`)}><Edit className="w-4 h-4 mr-2" />Edit</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-red-600"><Trash2 className="w-4 h-4 mr-2" />Delete</DropdownMenuItem></DropdownMenuContent></DropdownMenu>}
      >
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
          <dl className="space-y-4">
            <div><dt className="text-sm text-gray-600 mb-1">Package Name</dt><dd className="font-medium">{pkg.package_name}</dd></div>
            <div><dt className="text-sm text-gray-600 mb-1">Package Code</dt><dd className="font-mono">{pkg.package_code}</dd></div>
            <div><dt className="text-sm text-gray-600 mb-1">Description</dt><dd>{pkg.description || 'N/A'}</dd></div>
            <div><dt className="text-sm text-gray-600 mb-1">Price</dt><dd className="font-medium">{pkg.price?.toFixed(2)} {pkg.currency}</dd></div>
            <div><dt className="text-sm text-gray-600 mb-1">Billing Cycle</dt><dd>{pkg.billing_cycle}</dd></div>
            <div><dt className="text-sm text-gray-600 mb-1">Status</dt><dd><span className={`px-2 py-1 rounded text-xs ${pkg.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{pkg.is_active ? 'Active' : 'Inactive'}</span></dd></div>
          </dl>
          
          <div className="mt-6">
            <h3 className="font-medium mb-3">Features Config</h3>
            <pre className="bg-gray-50 p-4 rounded text-xs overflow-auto">{JSON.stringify(pkg.features_config, null, 2)}</pre>
          </div>
          
          <div className="mt-6">
            <h3 className="font-medium mb-3">Limits Config</h3>
            <pre className="bg-gray-50 p-4 rounded text-xs overflow-auto">{JSON.stringify(pkg.limits_config, null, 2)}</pre>
          </div>
        </div>
      </PageLayout>
      <ConfirmDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog} title="Delete Service Package" description={`Delete "${pkg.package_name}"?`} onConfirm={handleDelete} variant="destructive" />
    </>
  );
}

export { ServicePackageDetailPage };
export default ServicePackageDetailPage;