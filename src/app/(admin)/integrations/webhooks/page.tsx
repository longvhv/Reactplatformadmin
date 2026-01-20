/**
 * Webhooks Page
 * Manage webhook endpoints
 * ✅ MIGRATED: Using Next.js shim for navigation
 */

'use client';

import { Fragment, useState, useEffect } from 'react';
import { useRouter } from '@/components/shim/next-navigation';
import { webhooksApi } from '@/api/webhooksApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { PageLayout } from '@/components/layout/PageLayout';
import { StatisticsCards } from '@/components/common/StatisticsCards';
import { Plus, Search, Webhook, CheckCircle, XCircle, Activity } from 'lucide-react';
import { showToast } from '@/lib/toast';
import { useLanguage } from '@/providers/LanguageProvider';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';

function WebhooksPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', description: '', onConfirm: () => {} });

  useEffect(() => {
    loadWebhooks();
  }, []);

  const loadWebhooks = async () => {
    try {
      setLoading(true);
      const data = await webhooksApi.getAll();
      setWebhooks(data);
    } catch (error: any) {
      showToast.error('Error', 'Failed to load webhooks');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string, url: string) => {
    setConfirmDialog({
      open: true,
      title: 'Delete Webhook',
      description: `Delete webhook "${url}"?`,
      onConfirm: async () => {
        try {
          await webhooksApi.delete(id);
          showToast.success('Success', 'Webhook deleted');
          loadWebhooks();
        } catch (error) {
          showToast.error('Error', 'Failed to delete');
        }
      },
    });
  };

  const stats = [
    { label: 'Total Webhooks', value: webhooks.length, color: 'indigo' as const, icon: Webhook },
    { label: 'Active', value: webhooks.filter(w => w.is_active).length, color: 'green' as const, icon: CheckCircle },
    { label: 'Inactive', value: webhooks.filter(w => !w.is_active).length, color: 'gray' as const, icon: XCircle },
  ];

  return (
    <Fragment>
      <PageLayout
        icon={Webhook}
        title="Webhooks"
        description="Manage webhook endpoints and integrations"
        actions={
          <Button onClick={() => router.push('/integrations/webhooks/create')} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Webhook
          </Button>
        }
      >
        <StatisticsCards stats={stats} columns={3} />

        <Card className="p-6">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search webhooks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            </div>
          ) : webhooks.length === 0 ? (
            <div className="text-center py-12">
              <Webhook className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No webhooks found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {webhooks.map((webhook) => (
                <div key={webhook._id} className="flex items-center justify-between p-4 border rounded hover:bg-gray-50">
                  <div>
                    <p className="font-medium">{webhook.url}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded ${webhook.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {webhook.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <span className="text-sm text-gray-500">{webhook.event_type || 'All Events'}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => router.push(`/integrations/webhooks/${webhook._id}`)}>
                      View
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => router.push(`/integrations/webhooks/edit/${webhook._id}`)}>
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(webhook._id, webhook.url)}>
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </PageLayout>

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
        variant="destructive"
      />
    </Fragment>
  );
}

export { WebhooksPage };
export default WebhooksPage;
