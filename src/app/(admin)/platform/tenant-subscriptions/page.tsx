/**
 * Tenant Subscriptions List Page
 * 
 * Lists all tenant subscriptions using Card layout.
 * Compliant with tenant_subscriptions schema.
 * 
 * ✅ UPDATED: Used SubscriptionCard from components library
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '../../../../components/shim/next-navigation';
import { CreditCard, Plus, Search } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { PageLayout } from '../../../../components/layout/PageLayout';
import { tenantSubscriptionsApi, TenantSubscription } from '../../../../api/tenantSubscriptionsApi';
import { SubscriptionCard } from '../../../../components/tenant-subscriptions/SubscriptionCard';
import { ConfirmDialog } from '../../../../components/common/ConfirmDialog';
import { showToast } from '../../../../lib/toast';

export default function TenantSubscriptionsListPage() {
  const router = useRouter();
  const [items, setItems] = useState<TenantSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Delete state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await tenantSubscriptionsApi.getAll();
      setItems(data);
    } catch (error: any) {
      showToast.error('Error', 'Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      // Find the item to get version
      const item = items.find(i => i._id === deleteId);
      if (item) {
        await tenantSubscriptionsApi.delete(deleteId, item.version);
        showToast.success('Success', 'Subscription deleted');
        loadItems(); // Reload list
      }
    } catch (error: any) {
      showToast.error('Error', error.message || 'Failed to delete');
    } finally {
      setDeleteId(null);
      setShowDeleteDialog(false);
    }
  };

  const handleEditClick = (id: string) => {
    router.push(`/platform/tenant-subscriptions/edit/${id}`);
  };

  const filteredItems = items.filter(item => 
    item.subscription_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.subscription_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.plan_name && item.plan_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <>
      <PageLayout
        icon={CreditCard}
        title="Tenant Subscriptions"
        description="Manage subscriptions for all tenants"
        actions={
          <Button onClick={() => router.push('/platform/tenant-subscriptions/create')}>
            <Plus className="w-4 h-4 mr-2" />
            New Subscription
          </Button>
        }
      >
        <div className="space-y-6">
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by number, name or plan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* List Content */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-white dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
              <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p>No subscriptions found.</p>
              <Button variant="link" onClick={() => router.push('/platform/tenant-subscriptions/create')}>
                Create your first subscription
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredItems.map((item) => (
                <SubscriptionCard
                  key={item._id}
                  subscription={item}
                  onDelete={handleDeleteClick}
                  onEdit={handleEditClick}
                />
              ))}
            </div>
          )}
        </div>
      </PageLayout>

      <ConfirmDialog 
        open={showDeleteDialog} 
        onOpenChange={setShowDeleteDialog} 
        title="Delete Subscription" 
        description="Are you sure you want to delete this subscription? This action cannot be undone." 
        onConfirm={confirmDelete} 
        variant="destructive" 
      />
    </>
  );
}
