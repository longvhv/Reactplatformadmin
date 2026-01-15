/**
 * Tenant Subscriptions List Page
 * Displays all tenant subscriptions with filtering and management
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Download, Filter, Grid, List, TrendingUp } from 'lucide-react';
import { 
  getTenantSubscriptions, 
  deleteTenantSubscription,
  getTenantSubscriptionStatistics,
  TenantSubscription,
  SubscriptionFilters,
  SubscriptionStatistics,
} from '../api/tenantSubscriptionApi';
import { SubscriptionTable } from '../components/subscriptions/SubscriptionTable';
import { SubscriptionCard } from '../components/subscriptions/SubscriptionCard';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { useLanguage } from '../providers/LanguageProvider';
import { toast } from 'sonner@2.0.3';

export const TenantSubscriptionsPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const [subscriptions, setSubscriptions] = useState<TenantSubscription[]>([]);
  const [statistics, setStatistics] = useState<SubscriptionStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [showFilters, setShowFilters] = useState(false);
  
  const [filters, setFilters] = useState<SubscriptionFilters>({
    search: '',
    status: undefined,
    billing_cycle: undefined,
    payment_status: undefined,
  });

  // Fetch subscriptions
  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const data = await getTenantSubscriptions(filters);
      setSubscriptions(data);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      toast.error(t('subscriptions.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStatistics = async () => {
    try {
      const data = await getTenantSubscriptionStatistics();
      setStatistics(data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      // Silently fail for statistics
    }
  };

  useEffect(() => {
    fetchSubscriptions();
    fetchStatistics();
  }, [filters]);

  const handleDelete = async (id: string) => {
    if (!confirm(t('subscriptions.deleteConfirm'))) return;

    try {
      await deleteTenantSubscription(id);
      toast.success(t('subscriptions.deleteSuccess'));
      fetchSubscriptions();
      fetchStatistics();
    } catch (error: any) {
      console.error('Error deleting subscription:', error);
      toast.error(error?.message || t('subscriptions.deleteError'));
    }
  };

  const handleFilterChange = (key: keyof SubscriptionFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value || undefined }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: undefined,
      billing_cycle: undefined,
      payment_status: undefined,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('subscriptions.title')}</h1>
            <p className="text-gray-600 mt-1">{t('subscriptions.subtitle')}</p>
          </div>
          <Button 
            onClick={() => {
              navigate('/core/subscriptions/add');
            }}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('subscriptions.addSubscription')}
          </Button>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="border-l-4 border-l-indigo-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{t('subscriptions.totalSubscriptions')}</p>
                    <p className="text-2xl font-bold text-gray-900">{statistics.total}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-indigo-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{t('subscriptions.activeSubscriptions')}</p>
                    <p className="text-2xl font-bold text-gray-900">{statistics.active}</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">{t('subscriptions.status.active')}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{t('subscriptions.monthlyRevenue')}</p>
                    <p className="text-xl font-bold text-gray-900">
                      {formatCurrency(statistics.monthly_recurring_revenue)}
                    </p>
                  </div>
                  <span className="text-2xl">💰</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{t('subscriptions.totalRevenue')}</p>
                    <p className="text-xl font-bold text-gray-900">
                      {formatCurrency(statistics.total_revenue)}
                    </p>
                  </div>
                  <span className="text-2xl">📊</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Actions Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[300px]">
            <Input
              type="search"
              placeholder={t('subscriptions.searchPlaceholder')}
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full"
            />
          </div>

          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            {t('common.filters')}
            {Object.values(filters).filter(v => v).length > 1 && (
              <Badge className="ml-1">{Object.values(filters).filter(v => v).length - 1}</Badge>
            )}
          </Button>

          <div className="flex items-center gap-1 border border-gray-300 rounded-md">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('table')}
              className={viewMode === 'table' ? 'bg-gray-100' : ''}
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('grid')}
              className={viewMode === 'grid' ? 'bg-gray-100' : ''}
            >
              <Grid className="w-4 h-4" />
            </Button>
          </div>

          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            {t('common.export')}
          </Button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <Card className="mt-4">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('subscriptions.status')}
                  </label>
                  <select
                    value={filters.status || ''}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">{t('common.all')}</option>
                    <option value="active">{t('subscriptions.status.active')}</option>
                    <option value="trial">{t('subscriptions.status.trial')}</option>
                    <option value="suspended">{t('subscriptions.status.suspended')}</option>
                    <option value="expired">{t('subscriptions.status.expired')}</option>
                    <option value="cancelled">{t('subscriptions.status.cancelled')}</option>
                    <option value="pending">{t('subscriptions.status.pending')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('subscriptions.billingCycle')}
                  </label>
                  <select
                    value={filters.billing_cycle || ''}
                    onChange={(e) => handleFilterChange('billing_cycle', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">{t('common.all')}</option>
                    <option value="monthly">{t('subscriptions.billingCycle.monthly')}</option>
                    <option value="quarterly">{t('subscriptions.billingCycle.quarterly')}</option>
                    <option value="yearly">{t('subscriptions.billingCycle.yearly')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('subscriptions.paymentStatus')}
                  </label>
                  <select
                    value={filters.payment_status || ''}
                    onChange={(e) => handleFilterChange('payment_status', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">{t('common.all')}</option>
                    <option value="paid">{t('subscriptions.paymentStatus.paid')}</option>
                    <option value="unpaid">{t('subscriptions.paymentStatus.unpaid')}</option>
                    <option value="partially_paid">{t('subscriptions.paymentStatus.partiallyPaid')}</option>
                    <option value="failed">{t('subscriptions.paymentStatus.failed')}</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={clearFilters}>
                  {t('common.clearFilters')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Content */}
      {viewMode === 'table' ? (
        <SubscriptionTable
          subscriptions={subscriptions}
          onDelete={handleDelete}
          loading={loading}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500">{t('subscriptions.noSubscriptions')}</p>
            </div>
          ) : (
            subscriptions.map((subscription) => (
              <SubscriptionCard
                key={subscription._id}
                subscription={subscription}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default TenantSubscriptionsPage;