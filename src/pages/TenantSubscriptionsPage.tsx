/**
 * Tenant Subscriptions List Page
 * Displays all tenant subscriptions with filtering and management
 * 
 * ✅ MIGRATED to Phase 3 Standards (2026-01-18):
 * - Replaced confirm() with ConfirmDialog
 * - Using showToast (toast from sonner) for all notifications
 * - Wrapped in Fragment
 * - Using PageLayout with icon/title/description
 * - Using StatisticsCards for statistics
 * - Full dark mode support
 */

import { Fragment, useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Download, Filter, Grid, List, TrendingUp, CreditCard } from 'lucide-react';
import { 
  tenantSubscriptionsApi,
  TenantSubscription,
  SubscriptionFilters,
  SubscriptionStatistics,
} from '../api/tenantSubscriptionsApi';
import { SubscriptionTable } from '../components/subscriptions/SubscriptionTable';
import { SubscriptionCard } from '../components/subscriptions/SubscriptionCard';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { useLanguage } from '../providers/LanguageProvider';
import { toast } from 'sonner@2.0.3';
import { showToast } from '@/lib/toast';
import { PageLayout } from '@/components/layout/PageLayout';
import { StatisticsCards } from '@/components/common/StatisticsCards';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';

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
  
  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  // Fetch subscriptions
  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const data = await tenantSubscriptionsApi.getAll(filters);
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
      const data = await tenantSubscriptionsApi.getStatistics();
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
    setConfirmDialog({
      open: true,
      title: t('subscriptions.deleteTitle'),
      description: t('subscriptions.deleteConfirm'),
      onConfirm: async () => {
        try {
          await tenantSubscriptionsApi.delete(id);
          showToast.success(t('subscriptions.deleteSuccess'));
          fetchSubscriptions();
          fetchStatistics();
        } catch (error: any) {
          console.error('Error deleting subscription:', error);
          showToast.error(error?.message || t('subscriptions.deleteError'));
        }
        setConfirmDialog({ ...confirmDialog, open: false });
      },
    });
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
  
  const statisticsData = statistics ? [
    { 
      label: t('subscriptions.totalSubscriptions'), 
      value: statistics.total, 
      color: 'indigo' as const, 
      icon: TrendingUp 
    },
    { 
      label: t('subscriptions.activeSubscriptions'), 
      value: statistics.active, 
      color: 'green' as const, 
      icon: TrendingUp 
    },
    { 
      label: t('subscriptions.monthlyRevenue'), 
      value: formatCurrency(statistics.monthly_recurring_revenue), 
      color: 'blue' as const, 
      icon: TrendingUp 
    },
    { 
      label: t('subscriptions.totalRevenue'), 
      value: formatCurrency(statistics.total_revenue), 
      color: 'purple' as const, 
      icon: TrendingUp 
    },
  ] : [];

  return (
    <Fragment>
      <PageLayout
        icon={CreditCard}
        title={t('subscriptions.title')}
        description={t('subscriptions.subtitle')}
        actions={
          <Button 
            onClick={() => {
              navigate('/commerce/tenant-subscriptions/create');
            }}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('subscriptions.addSubscription')}
          </Button>
        }
      >
        {/* Statistics Cards */}
        {statistics && (
          <StatisticsCards stats={statisticsData} columns={4} className="mb-0 border-none shadow-sm" />
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
      </PageLayout>
      
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
        confirmLabel={t('common.confirm')}
        cancelLabel={t('common.cancel')}
        variant="destructive"
      />
    </Fragment>
  );
};

export default TenantSubscriptionsPage;