'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from '@/components/shim/next-navigation';
import { PageLayout } from '@/components/layout/PageLayout';
import { webhooksApi, Webhook as WebhookType } from '@/api/webhooksApi';
import { webhookDeliveryLogsApi } from '@/api/webhookDeliveryLogsApi';
import { showToast } from '@/lib/toast';
import { Webhook, Edit, Trash2, ArrowLeft, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WebhookStatsTab } from '@/components/webhooks/WebhookStatsTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';

export default function WebhookDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  
  const [webhook, setWebhook] = useState<WebhookType | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await webhooksApi.getById(id);
      setWebhook(data);
      loadStats(data._id);
    } catch (error: any) {
      console.error('Failed to load webhook:', error);
      showToast.error('Error', 'Failed to load webhook details');
      router.push('/integrations/webhooks');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async (webhookId: string) => {
    try {
      setStatsLoading(true);
      const data = await webhookDeliveryLogsApi.getStats(webhookId);
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await webhooksApi.delete(id);
      showToast.success('Success', 'Webhook deleted successfully');
      router.push('/integrations/webhooks');
    } catch (error: any) {
      showToast.error('Error', error.message || 'Failed to delete webhook');
    }
  };

  if (loading) {
    return (
      <PageLayout
        icon={Webhook}
        title="Webhook Details"
        description="Loading..."
        showBackButton
        backHref="/integrations/webhooks"
      >
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </PageLayout>
    );
  }

  if (!webhook) return null;

  return (
    <PageLayout
      icon={Webhook}
      title={webhook.name}
      description={webhook.description || 'Webhook details and statistics'}
      showBackButton
      backHref="/integrations/webhooks"
      actions={
        <div className="flex gap-2">
           <Button
            variant="outline"
            onClick={() => router.push(`/integrations/webhooks/edit/${id}`)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="destructive"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      }
    >
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
           <div className="grid md:grid-cols-3 gap-6">
             <div className="md:col-span-2 space-y-6">
               <Card>
                 <CardHeader>
                   <CardTitle>Configuration</CardTitle>
                 </CardHeader>
                 <CardContent className="space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label className="text-sm font-medium text-gray-500">URL</label>
                       <div className="flex items-center gap-2 font-mono bg-gray-50 p-2 rounded mt-1 overflow-x-auto">
                         <span className="font-bold text-indigo-600">{webhook.method}</span>
                         <span>{webhook.url}</span>
                       </div>
                     </div>
                     <div>
                       <label className="text-sm font-medium text-gray-500">Status</label>
                       <div className="mt-1">
                          {webhook.is_active ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3" /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              <XCircle className="w-3 h-3" /> Inactive
                            </span>
                          )}
                       </div>
                     </div>
                   </div>

                   <div>
                      <label className="text-sm font-medium text-gray-500">Events</label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {webhook.event_types.map(event => (
                          <span key={event} className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded border border-indigo-100">
                            {event}
                          </span>
                        ))}
                      </div>
                   </div>

                   <div>
                      <label className="text-sm font-medium text-gray-500">Auth Type</label>
                      <p className="mt-1 text-sm font-mono">{webhook.auth_type}</p>
                   </div>
                   
                   {Object.keys(webhook.headers || {}).length > 0 && (
                     <div>
                        <label className="text-sm font-medium text-gray-500">Custom Headers</label>
                        <div className="bg-gray-50 rounded p-2 mt-1">
                          {Object.entries(webhook.headers || {}).map(([k, v]) => (
                            <div key={k} className="text-xs font-mono">
                              <span className="font-semibold">{k}:</span> {v as string}
                            </div>
                          ))}
                        </div>
                     </div>
                   )}
                 </CardContent>
               </Card>
             </div>

             <div className="space-y-6">
               <Card>
                 <CardHeader>
                   <CardTitle>Details</CardTitle>
                 </CardHeader>
                 <CardContent className="space-y-4 text-sm">
                   <div>
                     <span className="text-gray-500">Created At:</span>
                     <p>{new Date(webhook.created_at).toLocaleString()}</p>
                   </div>
                   <div>
                     <span className="text-gray-500">Last Triggered:</span>
                     <p>{webhook.last_triggered_at ? new Date(webhook.last_triggered_at).toLocaleString() : 'Never'}</p>
                   </div>
                   <div>
                     <span className="text-gray-500">Success/Total:</span>
                     <p>{webhook.success_count} / {webhook.total_count}</p>
                   </div>
                    <div>
                     <span className="text-gray-500">Retry Config:</span>
                     <p className="font-mono text-xs mt-1">
                        Max Retries: {webhook.retry_config?.max_retries ?? 3}<br/>
                        Delay: {webhook.retry_config?.retry_delay ?? 1000}ms<br/>
                        Backoff: {webhook.retry_config?.backoff_multiplier ?? 2}x
                     </p>
                   </div>
                 </CardContent>
               </Card>
             </div>
           </div>
        </TabsContent>

        <TabsContent value="stats">
          <Card>
            <WebhookStatsTab 
              webhook={webhook} 
              stats={stats} 
              isLoading={statsLoading} 
              onRefresh={() => loadStats(webhook._id)} 
            />
          </Card>
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete Webhook"
        description="Are you sure you want to delete this webhook? This action cannot be undone."
        onConfirm={handleDelete}
        variant="destructive"
      />
    </PageLayout>
  );
}
