/**
 * Tenant Subscriptions Page
 * ✅ MIGRATED: Using Next.js shim for navigation
 */

'use client';

import { Fragment, useState, useEffect } from 'react';
import { useRouter } from '../../../../../components/shim/next-navigation';
import { Package, Plus, Search } from 'lucide-react';
import { Button } from '../../../../../components/ui/button';
import { Input } from '../../../../../components/ui/input';
import { Card } from '../../../../../components/ui/card';
import { PageLayout } from '../../../../../components/layout/PageLayout';
import { StatisticsCards } from '../../../../../components/common/StatisticsCards';
import { subscriptionApi, TenantSubscription } from '../../../../../api/subscriptionApi';
import { showToast } from '../../../../../lib/toast';
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';

function TenantSubscriptionsPage() {
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState<TenantSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const data = await subscriptionApi.getAll();
      setSubscriptions(data);
    } catch (error: any) {
      showToast.error('Error', 'Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const filteredSubs = subscriptions.filter(sub =>
    sub.tenant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.product_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = [
    { label: 'Total', value: subscriptions.length, color: 'indigo' as const, icon: Package },
    { label: 'Active', value: subscriptions.filter(s => s.status === 'ACTIVE').length, color: 'green' as const, icon: CheckCircle },
    { label: 'Pending', value: subscriptions.filter(s => s.status === 'PENDING').length, color: 'yellow' as const, icon: Clock },
    { label: 'Expired', value: subscriptions.filter(s => s.status === 'EXPIRED').length, color: 'red' as const, icon: XCircle },
  ];

  return (
    <Fragment>
      <PageLayout
        icon={Package}
        title="Tenant Subscriptions"
        description="Manage tenant subscriptions and licenses"
        actions={
          <Button onClick={() => router.push('/admin/tenants/subscriptions/create')}>
            <Plus className="w-4 h-4 mr-2" />
            Add Subscription
          </Button>
        }
      >
        <StatisticsCards stats={stats} columns={4} />

        <Card className="p-6">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search by tenant or product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            </div>
          ) : filteredSubs.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No subscriptions found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredSubs.map((sub) => (
                <div
                  key={sub._id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => router.push(`/commerce/subscriptions/${sub._id}`)}
                >
                  <div>
                    <p className="font-medium">{sub.tenant_name}</p>
                    <p className="text-sm text-gray-500">{sub.product_name}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-2 py-1 rounded text-xs ${
                      sub.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                      sub.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {sub.status}
                    </span>
                    <Button variant="ghost" size="sm">View</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </PageLayout>
    </Fragment>
  );
}

export { TenantSubscriptionsPage };
export default TenantSubscriptionsPage;