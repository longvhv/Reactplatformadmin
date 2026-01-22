/**
 * Webhook Create Form
 * ✅ MIGRATED from /pages/platform/webhooks/add.tsx
 */
'use client';
import { Fragment, useState } from 'react';
import { useRouter } from '../../../../../components/shim/next-navigation';
import { Webhook, Save } from 'lucide-react';
import { Button } from '../../../../../components/ui/button';
import { Input } from '../../../../../components/ui/input';
import { Card } from '../../../../../components/ui/card';
import { PageLayout } from '../../../../../components/layout/PageLayout';
import { webhooksApi } from '../../../../../api/webhooksApi';
import { showToast } from '../../../../../lib/toast';

function WebhookCreatePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ url: '', events: [], active: true });
  const [loading, setLoading] = useState(false);
  const availableEvents = ['user.created', 'user.updated', 'order.created', 'payment.success'];

  const toggleEvent = (event: string) => {
    const events = formData.events.includes(event) ? formData.events.filter((e: string) => e !== event) : [...formData.events, event];
    setFormData({ ...formData, events });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await webhooksApi.create(formData);
      showToast.success('Success', 'Created successfully');
      router.push('/platform/webhooks');
    } catch (error: any) {
      showToast.error('Error', error.message || 'Failed to create');
    } finally {
      setLoading(false);
    }
  };

  return <Fragment><PageLayout icon={Webhook} title="Create Webhook" description="Create new webhook"><Card className="p-6"><form onSubmit={handleSubmit} className="space-y-4"><div><label className="block text-sm font-medium mb-2">URL</label><Input value={formData.url} onChange={(e) => setFormData({ ...formData, url: e.target.value })} placeholder="https://your-app.com/webhook" required /></div><div><label className="block text-sm font-medium mb-2">Events</label><div className="space-y-2">{availableEvents.map(event => (<div key={event} className="flex items-center gap-3"><input type="checkbox" checked={formData.events.includes(event)} onChange={() => toggleEvent(event)} className="w-4 h-4" /><label className="text-sm">{event}</label></div>))}</div></div><div className="flex items-center gap-3"><input type="checkbox" checked={formData.active} onChange={(e) => setFormData({ ...formData, active: e.target.checked })} className="w-4 h-4" /><label className="text-sm font-medium">Active</label></div><div className="flex gap-2 pt-4"><Button type="submit" disabled={loading}><Save className="w-4 h-4 mr-2" />{loading ? 'Saving...' : 'Save'}</Button><Button type="button" variant="outline" onClick={() => router.push('/platform/webhooks')}>Cancel</Button></div></form></Card></PageLayout></Fragment>;
}
export { WebhookCreatePage };
export default WebhookCreatePage;
