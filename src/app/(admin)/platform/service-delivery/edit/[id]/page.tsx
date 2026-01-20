/**
 * Service Delivery Edit Form
 * ✅ MIGRATED from /pages/platform/service-delivery/edit/[id].tsx
 */
'use client';
import { Fragment, useState, useEffect } from 'react';
import { useRouter, useParams } from '@/components/shim/next-navigation';
import { Truck, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { PageLayout } from '@/components/layout/PageLayout';
import { serviceDeliveryApi } from '@/api/serviceDeliveryApi';
import { showToast } from '@/lib/toast';

function ServiceDeliveryEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [formData, setFormData] = useState({ name: '', description: '', status: 'active' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (id) loadData(); }, [id]);
  const loadData = async () => { try { const data = await serviceDeliveryApi.getById(id); setFormData(data); } catch (error: any) { showToast.error('Error', 'Failed to load'); } finally { setLoading(false); } };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await serviceDeliveryApi.update(id, formData);
      showToast.success('Success', 'Updated successfully');
      router.push('/platform/service-delivery');
    } catch (error: any) {
      showToast.error('Error', error.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

  return <Fragment><PageLayout icon={Truck} title="Edit Service Delivery" description="Update service delivery"><Card className="p-6"><form onSubmit={handleSubmit} className="space-y-4"><div><label className="block text-sm font-medium mb-2">Name</label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div><div><label className="block text-sm font-medium mb-2">Description</label><Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div><div className="flex gap-2 pt-4"><Button type="submit" disabled={saving}><Save className="w-4 h-4 mr-2" />{saving ? 'Saving...' : 'Save'}</Button><Button type="button" variant="outline" onClick={() => router.push('/platform/service-delivery')}>Cancel</Button></div></form></Card></PageLayout></Fragment>;
}
export { ServiceDeliveryEditPage };
export default ServiceDeliveryEditPage;
