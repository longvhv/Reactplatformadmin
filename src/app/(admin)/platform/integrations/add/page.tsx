'use client';

/**
 * Add Integration Page
 * ✅ MIGRATED from /pages/platform/integrations/add.tsx
 */

import { useState, Fragment } from 'react';
import { useRouter } from '../../../../../components/shim/next-navigation';
import { Plus, ArrowLeft } from 'lucide-react';
import { Button } from '../../../../../components/ui/button';
import { Input } from '../../../../../components/ui/input';
import { Card } from '../../../../../components/ui/card';
import { PageLayout } from '../../../../../components/layout/PageLayout';
import { integrationsApi } from '../../../../../api/integrationsApi';
import { showToast } from '../../../../../lib/toast';

function AddIntegrationPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ name: '', description: '', endpoint: '', enabled: true });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await integrationsApi.create(formData);
      showToast.success('Success', 'Created successfully');
      router.push('/platform/integrations');
    } catch (error: any) {
      showToast.error('Error', error.message || 'Failed to create');
    } finally {
      setLoading(false);
    }
  };

  return <Fragment><PageLayout icon={Plus} title="Add Integration" description="Create new integration"><Card className="p-6"><form onSubmit={handleSubmit} className="space-y-4"><div><label className="block text-sm font-medium mb-2">Name</label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div><div><label className="block text-sm font-medium mb-2">Description</label><Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div><div><label className="block text-sm font-medium mb-2">API Endpoint</label><Input value={formData.endpoint} onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })} placeholder="https://api.example.com" required /></div><div className="flex items-center gap-3"><input type="checkbox" checked={formData.enabled} onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })} className="w-4 h-4" /><label className="text-sm font-medium">Enable integration</label></div><div className="flex gap-2 pt-4"><Button type="submit" disabled={loading}><Plus className="w-4 h-4 mr-2" />{loading ? 'Saving...' : 'Save'}</Button><Button type="button" variant="outline" onClick={() => router.push('/platform/integrations')}>Cancel</Button></div></form></Card></PageLayout></Fragment>;
}
export { AddIntegrationPage };
export default AddIntegrationPage;