/**
 * Digital Assets Add Form
 * ✅ MIGRATED from /pages/content/digital-assets/add.tsx
 */
'use client';
import { Fragment, useState } from 'react';
import { useRouter } from '@/components/shim/next-navigation';
import { Image, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { PageLayout } from '@/components/layout/PageLayout';
import { digitalAssetsApi } from '@/api/digitalAssetsApi';
import { showToast } from '@/lib/toast';

function DigitalAssetsAddPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ name: '', url: '', type: 'image' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await digitalAssetsApi.create(formData);
      showToast.success('Success', 'Created successfully');
      router.push('/content/digital-assets');
    } catch (error: any) {
      showToast.error('Error', error.message || 'Failed to create');
    } finally {
      setLoading(false);
    }
  };

  return <Fragment><PageLayout icon={Image} title="Add Digital Asset" description="Upload new digital asset"><Card className="p-6"><form onSubmit={handleSubmit} className="space-y-4"><div><label className="block text-sm font-medium mb-2">Name</label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div><div><label className="block text-sm font-medium mb-2">URL</label><Input value={formData.url} onChange={(e) => setFormData({ ...formData, url: e.target.value })} required /></div><div className="flex gap-2 pt-4"><Button type="submit" disabled={loading}><Save className="w-4 h-4 mr-2" />{loading ? 'Saving...' : 'Save'}</Button><Button type="button" variant="outline" onClick={() => router.push('/content/digital-assets')}>Cancel</Button></div></form></Card></PageLayout></Fragment>;
}
export { DigitalAssetsAddPage };
export default DigitalAssetsAddPage;
