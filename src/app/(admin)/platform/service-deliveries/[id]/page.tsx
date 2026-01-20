/**
 * Service Delivery Detail Page
 * ✅ MIGRATED: Using Next.js shim for navigation
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from '@/components/shim/next-navigation';
import { Truck, ArrowLeft, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { serviceDeliveriesApi, ServiceDelivery } from '@/api/serviceDeliveriesApi';
import { showToast } from '@/lib/toast';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { PageLayout } from '@/components/layout/PageLayout';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

function ServiceDeliveryDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const [delivery, setDelivery] = useState<ServiceDelivery | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => { if (id) loadDelivery(); }, [id]);

  const loadDelivery = async () => {
    try {
      setLoading(true);
      const data = await serviceDeliveriesApi.getById(id);
      setDelivery(data);
    } catch (error: any) {
      showToast.error('Error', 'Failed to load service delivery');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await serviceDeliveriesApi.delete(id);
      showToast.success('Success', 'Service delivery deleted');
      router.push('/platform/service-deliveries');
    } catch (error: any) {
      showToast.error('Error', error.message || 'Failed to delete');
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;

  if (!delivery) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Truck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Service Delivery Not Found</h2>
          <Button onClick={() => router.push('/platform/service-deliveries')}><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageLayout icon={Truck} title={delivery.name || 'Service Delivery'} description="Service delivery details" backButton={{ label: 'Back', onClick: () => router.push('/platform/service-deliveries') }}
        actions={<DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" size="sm"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end"><DropdownMenuItem onClick={() => router.push(`/platform/service-deliveries/edit/${id}`)}><Edit className="w-4 h-4 mr-2" />Edit</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-red-600"><Trash2 className="w-4 h-4 mr-2" />Delete</DropdownMenuItem></DropdownMenuContent></DropdownMenu>}
      >
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
          <dl className="space-y-4">
            <div><dt className="text-sm text-gray-600 mb-1">Delivery Name</dt><dd className="font-medium">{delivery.name}</dd></div>
            <div><dt className="text-sm text-gray-600 mb-1">Status</dt><dd><span className={`px-2 py-1 rounded text-xs ${delivery.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : delivery.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>{delivery.status}</span></dd></div>
            <div><dt className="text-sm text-gray-600 mb-1">Created At</dt><dd>{new Date(delivery.created_at).toLocaleDateString()}</dd></div>
          </dl>
        </div>
      </PageLayout>
      <ConfirmDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog} title="Delete Service Delivery" description={`Delete "${delivery.name}"?`} onConfirm={handleDelete} variant="destructive" />
    </>
  );
}

export { ServiceDeliveryDetailPage };
export default ServiceDeliveryDetailPage;
