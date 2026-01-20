/**
 * COMPLETION BATCH: Service Delivery Add Form
 * ✅ MIGRATED from /pages/platform/service-delivery/add.tsx
 */
'use client';
import { Fragment, useState } from 'react';
import { useRouter } from '@/components/shim/next-navigation';
import { Truck, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { PageLayout } from '@/components/layout/PageLayout';
import { serviceDeliveryApi } from '@/api/serviceDeliveryApi';
import { showToast } from '@/lib/toast';

function ServiceDeliveryAddPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ name: '', description: '', status: 'active' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await serviceDeliveryApi.create(formData);
      showToast.success('Success', 'Created successfully');
      router.push('/platform/service-delivery');
    } catch (error: any) {
      showToast.error('Error', error.message || 'Failed to create');
    } finally {
      setLoading(false);
    }
  };

  return <Fragment><PageLayout icon={Truck} title="Add Service Delivery" description="Create new service delivery"><Card className="p-6"><form onSubmit={handleSubmit} className="space-y-4"><div><label className="block text-sm font-medium mb-2">Name</label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div><div><label className="block text-sm font-medium mb-2">Description</label><Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div><div className="flex gap-2 pt-4"><Button type="submit" disabled={loading}><Save className="w-4 h-4 mr-2" />{loading ? 'Saving...' : 'Save'}</Button><Button type="button" variant="outline" onClick={() => router.push('/platform/service-delivery')}>Cancel</Button></div></form></Card></PageLayout></Fragment>;
}
export { ServiceDeliveryAddPage };
export default ServiceDeliveryAddPage;
