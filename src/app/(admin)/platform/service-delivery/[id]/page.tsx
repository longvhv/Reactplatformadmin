/**
 * Service Delivery Detail Page
 * ✅ MIGRATED from /pages/platform/service-delivery/[id].tsx
 */
'use client';
import { Fragment, useState, useEffect } from 'react';
import { useRouter, useParams } from '../../../../../components/shim/next-navigation';
import { Truck, Edit, Trash2 } from 'lucide-react';
import { Button } from '../../../../../components/ui/button';
import { Card } from '../../../../../components/ui/card';
import { PageLayout } from '../../../../../components/layout/PageLayout';
import { serviceDeliveryApi } from '../../../../../api/serviceDeliveryApi';
import { showToast } from '../../../../../lib/toast';

function ServiceDeliveryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (id) loadData(); }, [id]);
  const loadData = async () => { try { const data = await serviceDeliveryApi.getById(id); setItem(data); } catch (error: any) { showToast.error('Error', 'Failed to load'); } finally { setLoading(false); } };

  const handleDelete = async () => {
    if (!confirm('Are you sure?')) return;
    try {
      await serviceDeliveryApi.delete(id);
      showToast.success('Success', 'Deleted successfully');
      router.push('/platform/service-delivery');
    } catch (error: any) {
      showToast.error('Error', 'Failed to delete');
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;
  if (!item) return <div className="text-center py-12">Not found</div>;

  return <Fragment><PageLayout icon={Truck} title="Service Delivery Details" description="View service delivery information" actions={<div className="flex gap-2"><Button onClick={() => router.push(`/platform/service-delivery/edit/${id}`)}><Edit className="w-4 h-4 mr-2" />Edit</Button><Button variant="destructive" onClick={handleDelete}><Trash2 className="w-4 h-4 mr-2" />Delete</Button></div>}><Card className="p-6"><div className="space-y-4"><div><h3 className="font-semibold mb-2">Name</h3><p className="text-gray-700">{item.name}</p></div><div><h3 className="font-semibold mb-2">Description</h3><p className="text-gray-700">{item.description || 'N/A'}</p></div><div><h3 className="font-semibold mb-2">Status</h3><p className="text-gray-700">{item.status}</p></div></div></Card></PageLayout></Fragment>;
}
export { ServiceDeliveryDetailPage };
export default ServiceDeliveryDetailPage;