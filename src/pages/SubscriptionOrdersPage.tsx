/**
 * Subscription Orders List Page
 * Display and manage subscription orders
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { subscriptionOrderApi, SubscriptionOrder, OrderFilters } from '../api/subscriptionOrderApi';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { OrderTable } from '../components/orders/OrderTable';
import { OrderCard } from '../components/orders/OrderCard';
import { Plus, Search, Grid, List } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { useLanguage } from '../providers/LanguageProvider';

export function SubscriptionOrdersPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [orders, setOrders] = useState<SubscriptionOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<OrderFilters>({
    tenant_id: '00000000-0000-0000-0000-000000000001',
  });

  useEffect(() => {
    loadOrders();
  }, [filters]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await subscriptionOrderApi.getAll(filters);
      setOrders(data);
    } catch (error: any) {
      toast.error(t('subscriptionOrders.loadError', { error: error.message }));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchTerm.trim()) {
      setFilters({ ...filters, search: searchTerm });
    } else {
      const { search, ...rest } = filters;
      setFilters(rest);
    }
  };

  const handleDelete = async (order: SubscriptionOrder) => {
    if (!confirm(t('subscriptionOrders.confirmDeleteMessage', { code: order.order_code }))) return;

    try {
      await subscriptionOrderApi.softDelete(order._id!);
      toast.success(t('subscriptionOrders.orderDeleted'));
      loadOrders();
    } catch (error: any) {
      toast.error(t('subscriptionOrders.deleteError', { error: error.message }));
    }
  };

  const handleEdit = (order: SubscriptionOrder) => {
    navigate(`/core/subscription-orders/edit/${order._id}`);
  };

  const filteredOrders = searchTerm
    ? orders.filter(
        (o) =>
          o.order_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          o.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          o.customer_email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : orders;

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {t('subscriptionOrders.title')}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {t('subscriptionOrders.manageOrders')}
              </p>
            </div>
            <Button onClick={() => navigate('/core/subscription-orders/add')}>
              <Plus className="h-4 w-4 mr-2" />
              {t('subscriptionOrders.addOrder')}
            </Button>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder={t('subscriptionOrders.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={filters.status || ''}
                onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800"
              >
                <option value="">{t('subscriptionOrders.allStatuses')}</option>
                <option value="active">{t('subscriptionOrders.statusActive')}</option>
                <option value="pending">{t('subscriptionOrders.statusPending')}</option>
                <option value="cancelled">{t('subscriptionOrders.statusCancelled')}</option>
                <option value="expired">{t('subscriptionOrders.statusExpired')}</option>
                <option value="suspended">{t('subscriptionOrders.statusSuspended')}</option>
              </select>

              <select
                value={filters.payment_status || ''}
                onChange={(e) => setFilters({ ...filters, payment_status: e.target.value as any })}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800"
              >
                <option value="">{t('subscriptionOrders.allPaymentStatuses')}</option>
                <option value="paid">{t('subscriptionOrders.paymentPaid')}</option>
                <option value="pending">{t('subscriptionOrders.paymentPending')}</option>
                <option value="failed">{t('subscriptionOrders.paymentFailed')}</option>
                <option value="refunded">{t('subscriptionOrders.paymentRefunded')}</option>
              </select>

              <div className="flex items-center gap-1 border border-gray-300 dark:border-gray-600 rounded-md">
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('subscriptionOrders.totalOrders')}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{orders.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('subscriptionOrders.activeOrders')}</p>
            <p className="text-2xl font-bold text-green-600">{orders.filter(o => o.status === 'active').length}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('subscriptionOrders.paidOrders')}</p>
            <p className="text-2xl font-bold text-blue-600">{orders.filter(o => o.payment_status === 'paid').length}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('subscriptionOrders.pendingPayment')}</p>
            <p className="text-2xl font-bold text-yellow-600">{orders.filter(o => o.payment_status === 'pending').length}</p>
          </div>
        </div>

        {/* Orders List/Grid */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
          {viewMode === 'table' ? (
            <OrderTable
              orders={filteredOrders}
              onEdit={handleEdit}
              onDelete={handleDelete}
              loading={loading}
            />
          ) : (
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOrders.map((order) => (
                <OrderCard
                  key={order._id}
                  order={order}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}