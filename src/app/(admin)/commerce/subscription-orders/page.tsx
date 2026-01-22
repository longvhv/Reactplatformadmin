/**
 * Subscription Orders Page
 * Main list page for subscription orders
 * ✅ MIGRATED: Using Next.js shim for navigation
 * ✅ Phase 3: ConfirmDialog, showToast, Fragment wrapper
 * ✅ SCHEMA ALIGNED: Matches public.subscription_orders table
 */

'use client';

import { Fragment, useState, useEffect } from 'react';
import { useRouter } from '../../../../components/shim/next-navigation';
import { Plus, Search, RefreshCw, Eye, Trash2, ShoppingCart, Clock, CheckCircle, DollarSign, List, Grid, Edit2 } from 'lucide-react';
import {
  ordersApi,
  Order,
  OrderWithDetails,
} from '../../../../api/ordersApi';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Card } from '../../../../components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../components/ui/select';
import { OrderDetailModal } from '../../../../components/orders/OrderDetailModal';
import { Badge } from '../../../../components/ui/badge';
import { useLanguage } from '../../../../providers/LanguageProvider';
import { PageLayout } from '../../../../components/layout/PageLayout';
import { StatisticsCards } from '../../../../components/common/StatisticsCards';
import { showToast } from '../../../../lib/toast';
import { ConfirmDialog } from '../../../../components/common/ConfirmDialog';
import { formatCurrency } from '../../../../lib/format';

// Stats interface
interface OrderStats {
  total: number;
  draft: number;
  pending: number;
  paid: number;
  cancelled: number;
  failed: number;
  refunded: number;
  totalRevenue: number;
  newOrders: number;
  renewalOrders: number;
  upgradeOrders: number;
  downgradeOrders: number;
  addOnOrders: number;
}

function SubscriptionOrdersPage() {
  const router = useRouter();
  const { t } = useLanguage();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Modal state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    variant?: 'default' | 'destructive';
  }>({
    open: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    applyFilters();
    calculateStats();
  }, [orders, searchTerm, statusFilter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await ordersApi.getAll();
      setOrders(data);
    } catch (error: any) {
      console.error('Error loading orders:', error);
      showToast.error('Error', 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...orders];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(order =>
        order.order_number?.toLowerCase().includes(term) ||
        (order as OrderWithDetails).tenant_name?.toLowerCase().includes(term) ||
        order.tenant_id?.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  };

  const calculateStats = () => {
    const newStats: OrderStats = {
      total: orders.length,
      draft: orders.filter(o => o.status === 'DRAFT').length,
      pending: orders.filter(o => o.status === 'PENDING').length,
      paid: orders.filter(o => o.status === 'PAID').length,
      cancelled: orders.filter(o => o.status === 'CANCELLED').length,
      failed: orders.filter(o => o.status === 'FAILED').length,
      refunded: orders.filter(o => o.status === 'REFUNDED').length,
      totalRevenue: orders
        .filter(o => o.status === 'PAID')
        .reduce((sum, o) => sum + (o.total_amount || 0), 0),
      newOrders: orders.filter(o => o.type === 'NEW').length,
      renewalOrders: orders.filter(o => o.type === 'RENEWAL').length,
      upgradeOrders: orders.filter(o => o.type === 'UPGRADE').length,
      downgradeOrders: orders.filter(o => o.type === 'DOWNGRADE').length,
      addOnOrders: orders.filter(o => o.type === 'ADD_ON').length,
    };
    setStats(newStats);
  };

  const handleDelete = (order: Order) => {
    setConfirmDialog({
      open: true,
      title: 'Delete Order',
      description: `Are you sure you want to delete order "${order.order_number}"?`,
      onConfirm: async () => {
        try {
          await ordersApi.delete(order._id);
          showToast.success('Success', 'Order deleted');
          loadOrders();
        } catch (error: any) {
          showToast.error('Error', error.message);
        }
      },
      variant: 'destructive',
    });
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string }> = {
      DRAFT: { label: t('common.draft') || 'Draft', color: 'bg-gray-100 text-gray-800' },
      PENDING: { label: t('common.pending') || 'Pending', color: 'bg-yellow-100 text-yellow-800' },
      PAID: { label: t('common.paid') || 'Paid', color: 'bg-green-100 text-green-800' },
      CANCELLED: { label: t('common.cancelled') || 'Cancelled', color: 'bg-red-100 text-red-800' },
      FAILED: { label: t('common.failed') || 'Failed', color: 'bg-red-100 text-red-800' },
      REFUNDED: { label: t('common.refunded') || 'Refunded', color: 'bg-purple-100 text-purple-800' },
    };
    const config = statusConfig[status] || statusConfig.DRAFT;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const statsCards = stats ? [
    { label: 'Total Orders', value: stats.total, color: 'indigo' as const, icon: ShoppingCart },
    { label: 'Paid', value: stats.paid, color: 'green' as const, icon: CheckCircle },
    { label: 'Pending', value: stats.pending, color: 'yellow' as const, icon: Clock },
    { label: 'Revenue', value: formatCurrency(stats.totalRevenue, orders[0]?.currency_code || 'VND'), color: 'blue' as const, icon: DollarSign },
  ] : [];

  return (
    <Fragment>
      <PageLayout
        icon={ShoppingCart}
        title="Subscription Orders"
        description="Manage subscription orders and payments"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadOrders}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <div className="flex items-center border rounded-md">
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-4 h-4" />
              </Button>
            </div>
            <Button
              size="sm"
              onClick={() => router.push('/commerce/subscription-orders/create')}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Order
            </Button>
          </div>
        }
      >
        {/* Stats */}
        {stats && <StatisticsCards stats={statsCards} columns={4} />}

        {/* Filters */}
        <Card className="p-6">
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search by order number, tenant..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.allStatuses') || 'All Statuses'}</SelectItem>
                <SelectItem value="DRAFT">{t('common.draft') || 'Draft'}</SelectItem>
                <SelectItem value="PENDING">{t('common.pending') || 'Pending'}</SelectItem>
                <SelectItem value="PAID">{t('common.paid') || 'Paid'}</SelectItem>
                <SelectItem value="CANCELLED">{t('common.cancelled') || 'Cancelled'}</SelectItem>
                <SelectItem value="FAILED">{t('common.failed') || 'Failed'}</SelectItem>
                <SelectItem value="REFUNDED">{t('common.refunded') || 'Refunded'}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <p className="text-sm text-muted-foreground">
            Showing {filteredOrders.length} of {orders.length} orders
          </p>
        </Card>

        {/* Orders Table */}
        {viewMode === 'table' ? (
          <Card className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-sm">Order Number</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Tenant</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Status</th>
                    <th className="text-right py-3 px-4 font-semibold text-sm">Amount</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Date</th>
                    <th className="text-right py-3 px-4 font-semibold text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order._id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-3 px-4">
                        <button 
                          onClick={() => router.push(`/commerce/subscription-orders/${order._id}`)}
                          className="hover:underline focus:outline-none"
                        >
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded text-indigo-600 hover:text-indigo-800">
                            {order.order_number}
                          </code>
                        </button>
                      </td>
                      <td className="py-3 px-4">
                         <button 
                          onClick={() => router.push(`/commerce/subscription-orders/${order._id}`)}
                          className="hover:text-indigo-600 hover:underline focus:outline-none text-left"
                        >
                          {(order as OrderWithDetails).tenant_name || order.tenant_id}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline">{order.type}</Badge>
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(order.status)}</td>
                      <td className="py-3 px-4 text-right font-medium">
                        {formatCurrency(order.total_amount, order.currency_code)}
                      </td>
                      <td className="py-3 px-4">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(order)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/commerce/subscription-orders/${order._id}`)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(order)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredOrders.length === 0 && (
                <div className="text-center py-12">
                  <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No orders found</p>
                </div>
              )}
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrders.map((order) => (
              <Card 
                key={order._id} 
                className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/commerce/subscription-orders/${order._id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded text-indigo-600">
                      {order.order_number}
                    </code>
                    <p className="text-sm text-gray-600 mt-1">{(order as OrderWithDetails).tenant_name || order.tenant_id}</p>
                  </div>
                  {getStatusBadge(order.status)}
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">
                    {formatCurrency(order.total_amount, order.currency_code)}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewDetails(order);
                    }}
                  >
                    View
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </PageLayout>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          open={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedOrder(null);
          }}
        />
      )}

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
        variant={confirmDialog.variant}
      />
    </Fragment>
  );
}

// Named export for reuse
export { SubscriptionOrdersPage };

// Default export for routing
export default SubscriptionOrdersPage;
