'use client';

/**
 * Integration Detail Page
 * ✅ MIGRATED from /pages/platform/integrations/[id].tsx
 */

import { useState, useEffect, Fragment } from 'react';
import { useRouter, useParams } from '../../../../../components/shim/next-navigation';
import { Plug, ArrowLeft } from 'lucide-react';
import { Button } from '../../../../../components/ui/button';
import { Card } from '../../../../../components/ui/card';
import { PageLayout } from '../../../../../components/layout/PageLayout';
import { integrationsApi } from '../../../../../api/integrationsApi';
import { showToast } from '../../../../../lib/toast';

function IntegrationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => { if (id) loadData(); }, [id]);
  const loadData = async () => { try { const data = await integrationsApi.getById(id); setItem(data); } catch (error: any) { showToast.error('Error', 'Failed to load'); } finally { setLoading(false); } };

  const handleToggle = async () => {
    try {
      setToggling(true);
      await integrationsApi.toggle(id);
      showToast.success('Success', 'Integration toggled');
      loadData();
    } catch (error: any) {
      showToast.error('Error', 'Failed to toggle');
    } finally {
      setToggling(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure?')) return;
    try {
      await integrationsApi.delete(id);
      showToast.success('Success', 'Deleted successfully');
      router.push('/platform/integrations');
    } catch (error: any) {
      showToast.error('Error', 'Failed to delete');
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;
  if (!item) return <div className="text-center py-12">Not found</div>;

  return <Fragment><PageLayout icon={Plug} title="Integration Details" description="View integration information" actions={<div className="flex gap-2"><Button onClick={handleToggle} disabled={toggling}><Power className="w-4 h-4 mr-2" />{item.enabled ? 'Disable' : 'Enable'}</Button><Button onClick={() => router.push(`/platform/integrations/edit/${id}`)}><Edit className="w-4 h-4 mr-2" />Edit</Button><Button variant="destructive" onClick={handleDelete}><Trash2 className="w-4 h-4 mr-2" />Delete</Button></div>}><Card className="p-6"><div className="space-y-4"><div><h3 className="font-semibold mb-2">Name</h3><p className="text-gray-700">{item.name}</p></div><div><h3 className="font-semibold mb-2">Description</h3><p className="text-gray-700">{item.description || 'N/A'}</p></div><div><h3 className="font-semibold mb-2">Status</h3><span className={`px-3 py-1 rounded text-sm font-semibold ${item.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{item.enabled ? 'Enabled' : 'Disabled'}</span></div><div><h3 className="font-semibold mb-2">API Endpoint</h3><p className="text-gray-700 font-mono text-sm">{item.endpoint || 'N/A'}</p></div></div></Card></PageLayout></Fragment>;
}
export { IntegrationDetailPage };
export default IntegrationDetailPage;