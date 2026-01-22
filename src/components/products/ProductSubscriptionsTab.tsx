/**
 * ProductSubscriptionsTab - List of subscriptions using this product
 * ✅ Professional UI with dark mode support
 */

import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { CreditCard, ExternalLink, Search } from 'lucide-react';
import { useRouter } from '../shim/next-navigation';

interface ProductSubscriptionsTabProps {
  productId: string;
}

interface Subscription {
  _id: string;
  subscription_number: string;
  subscription_name: string;
  tenant_id: string;
  tenant_name?: string;
  status: string;
  billing_cycle: string;
  total_amount: number;
  currency: string;
  start_date: string;
  end_date: string;
}

export function ProductSubscriptionsTab({ productId }: ProductSubscriptionsTabProps) {
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadSubscriptions();
  }, [productId]);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      // TODO: Fetch subscriptions by product_id when API is ready
      setSubscriptions([]);
    } catch (error) {
      console.error('Error loading subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSubscriptions = subscriptions.filter(sub =>
    sub.subscription_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.subscription_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (sub.tenant_name && sub.tenant_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      suspended: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      expired: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400',
      trial: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    };
    return colors[status.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Subscriptions</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Active subscriptions using this product
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search subscriptions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Subscriptions List */}
      {filteredSubscriptions.length === 0 ? (
        <Card className="p-8">
          <div className="text-center">
            <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Subscriptions
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm ? 'No subscriptions match your search.' : 'No subscriptions are using this product yet.'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredSubscriptions.map((subscription) => (
            <Card key={subscription._id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {subscription.subscription_name}
                    </h4>
                    <Badge className={getStatusColor(subscription.status)}>
                      {subscription.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-mono">{subscription.subscription_number}</span>
                    {subscription.tenant_name && (
                      <span>{subscription.tenant_name}</span>
                    )}
                    <span>{subscription.billing_cycle}</span>
                    <span className="font-medium">
                      {subscription.total_amount} {subscription.currency}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/admin/subscriptions/${subscription._id}`)}
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProductSubscriptionsTab;
