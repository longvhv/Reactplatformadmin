/**
 * Tenant Subscriptions List Page
 * 
 * Lists all tenant subscriptions with search and filter capabilities.
 * Compliant with tenant_subscriptions schema (42 fields).
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/components/shim/next-navigation';
import { CreditCard, Plus, Search, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { PageLayout } from '@/components/layout/PageLayout';
import { tenantSubscriptionsApi, TenantSubscription } from '@/api/tenantSubscriptionsApi';
import { showToast } from '@/lib/toast';

export default function TenantSubscriptionsListPage() {
  const router = useRouter();
  const [items, setItems] = useState<TenantSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredItems = items.filter(item => 
    item.subscription_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.subscription_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.plan_name && item.plan_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'trial': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'suspended': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'expired': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'pending': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
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
      <Card className="p-6">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by number, name or plan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 max-w-md"
          />
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No subscriptions found.
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-gray-700 text-gray-500 font-medium">
                <tr>
                  <th className="px-4 py-3">Subscription #</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Start Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredItems.map((item) => (
                  <tr 
                    key={item._id} 
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                    onClick={() => router.push(`/platform/tenant-subscriptions/${item._id}`)}
                  >
                    <td className="px-4 py-3 font-mono text-gray-600">
                      {item.subscription_number}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {item.subscription_name}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {item.plan_name || '-'}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {item.total_amount.toLocaleString()} {item.currency}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(item.start_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 text-xs rounded-full ${getStatusColor(item.status)}`}>
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </PageLayout>
  );
}
