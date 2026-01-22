/**
 * Digital Assets Edit Form
 * ✅ MIGRATED from /pages/content/digital-assets/edit/[id].tsx
 */
'use client';
import { Fragment, useState, useEffect } from 'react';
import { useRouter, useParams } from '@/components/shim/next-navigation';
import { Image, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { PageLayout } from '@/components/layout/PageLayout';
import { digitalAssetsApi } from '@/api/digitalAssetsApi';
import { showToast } from '@/lib/toast';

function DigitalAssetsEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [formData, setFormData] = useState({ name: '', url: '', type: 'image' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (id) loadData(); }, [id]);
  const loadData = async () => { try { const data = await digitalAssetsApi.getById(id); setFormData(data); } catch (error: any) { showToast.error('Error', 'Failed to load'); } finally { setLoading(false); } };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await digitalAssetsApi.update(id, formData);
      showToast.success('Success', 'Updated successfully');
      router.push('/content/digital-assets');
    } catch (error: any) {
      showToast.error('Error', error.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

  return <Fragment><PageLayout icon={Image} title="Edit Digital Asset" description="Update digital asset"><Card className="p-6"><form onSubmit={handleSubmit} className="space-y-4"><div><label className="block text-sm font-medium mb-2">Name</label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div><div><label className="block text-sm font-medium mb-2">URL</label><Input value={formData.url} onChange={(e) => setFormData({ ...formData, url: e.target.value })} required /></div><div className="flex gap-2 pt-4"><Button type="submit" disabled={saving}><Save className="w-4 h-4 mr-2" />{saving ? 'Saving...' : 'Save'}</Button><Button type="button" variant="outline" onClick={() => router.push('/content/digital-assets')}>Cancel</Button></div></form></Card></PageLayout></Fragment>;
}
export { DigitalAssetsEditPage };
export default DigitalAssetsEditPage;
