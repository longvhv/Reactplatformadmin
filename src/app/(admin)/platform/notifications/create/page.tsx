'use client';

/**
 * Create Notification Page  
 * ✅ MIGRATED from /pages/platform/notifications/add.tsx
 */

import { useState, Fragment } from 'react';
import { useRouter } from '../../../../../components/shim/next-navigation';
import { Bell, Plus } from 'lucide-react';
import { Button } from '../../../../../components/ui/button';
import { Input } from '../../../../../components/ui/input';
import { Card } from '../../../../../components/ui/card';
import { PageLayout } from '../../../../../components/layout/PageLayout';
import { notificationsApi } from '../../../../../api/notificationsApi';
import { showToast } from '../../../../../lib/toast';

function CreateNotificationPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ title: '', message: '', type: 'info' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await notificationsApi.create(formData);
      showToast.success('Success', 'Created successfully');
      router.push('/platform/notifications');
    } catch (error: any) {
      showToast.error('Error', error.message || 'Failed to create');
    } finally {
      setLoading(false);
    }
  };

  return <Fragment><PageLayout icon={Bell} title="Create Notification" description="Create new notification"><Card className="p-6"><form onSubmit={handleSubmit} className="space-y-4"><div><label className="block text-sm font-medium mb-2">Title</label><Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required /></div><div><label className="block text-sm font-medium mb-2">Message</label><Input value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} /></div><div className="flex gap-2 pt-4"><Button type="submit" disabled={loading}><Plus className="w-4 h-4 mr-2" />{loading ? 'Saving...' : 'Save'}</Button><Button type="button" variant="outline" onClick={() => router.push('/platform/notifications')}>Cancel</Button></div></form></Card></PageLayout></Fragment>;
}
export { CreateNotificationPage };
export default CreateNotificationPage;
