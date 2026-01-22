/**
 * Webhook Detail Page
 * ✅ MIGRATED from /pages/platform/webhooks/[id].tsx
 */
'use client';
import { Fragment, useState, useEffect } from 'react';
import { useRouter, useParams } from '../../../../../components/shim/next-navigation';
import { Webhook, Edit, Trash2, Send } from 'lucide-react';
import { Button } from '../../../../../components/ui/button';
import { Card } from '../../../../../components/ui/card';
import { PageLayout } from '../../../../../components/layout/PageLayout';
import { webhooksApi } from '../../../../../api/webhooksApi';
import { showToast } from '../../../../../lib/toast';

function WebhookDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);

  useEffect(() => { if (id) loadData(); }, [id]);
  const loadData = async () => { try { const data = await webhooksApi.getById(id); setItem(data); } catch (error: any) { showToast.error('Error', 'Failed to load'); } finally { setLoading(false); } };

  const handleTest = async () => {
    try {
      setTesting(true);
      await webhooksApi.test(id);
      showToast.success('Success', 'Test payload sent');
    } catch (error: any) {
      showToast.error('Error', 'Failed to send test');
    } finally {
      setTesting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure?')) return;
    try {
      await webhooksApi.delete(id);
      showToast.success('Success', 'Deleted successfully');
      router.push('/platform/webhooks');
    } catch (error: any) {
      showToast.error('Error', 'Failed to delete');
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;
  if (!item) return <div className="text-center py-12">Not found</div>;

  return <Fragment><PageLayout icon={Webhook} title="Webhook Details" description="View webhook information" actions={<div className="flex gap-2"><Button onClick={handleTest} disabled={testing}><Send className="w-4 h-4 mr-2" />Test</Button><Button onClick={() => router.push(`/platform/webhooks/edit/${id}`)}><Edit className="w-4 h-4 mr-2" />Edit</Button><Button variant="destructive" onClick={handleDelete}><Trash2 className="w-4 h-4 mr-2" />Delete</Button></div>}><Card className="p-6"><div className="space-y-4"><div><h3 className="font-semibold mb-2">URL</h3><p className="text-gray-700 font-mono text-sm">{item.url}</p></div><div><h3 className="font-semibold mb-2">Events</h3><div className="flex flex-wrap gap-2">{(item.events || []).map((event: string, idx: number) => (<span key={idx} className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-sm">{event}</span>))}</div></div><div><h3 className="font-semibold mb-2">Status</h3><span className={`px-3 py-1 rounded text-sm font-semibold ${item.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{item.active ? 'Active' : 'Inactive'}</span></div></div></Card></PageLayout></Fragment>;
}
export { WebhookDetailPage };
export default WebhookDetailPage;