/**
 * Subscription Orders Page
 * Main list page for subscription orders
 * ✅ MIGRATED Phase 3: ConfirmDialog, showToast, Fragment wrapper
 */

import { Fragment, useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Search, Filter, RefreshCw, Eye, Trash2, ShoppingCart, Clock, CheckCircle, XCircle, DollarSign, AlertCircle, List, Grid, Edit2, Box } from 'lucide-react';
import {
  ordersApi,
  Order,
  OrderStatus,
} from '@/api/ordersApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { OrderDetailModal } from '@/components/orders/OrderDetailModal';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '../providers/LanguageProvider';
import { PageLayout } from '../components/layout/PageLayout';
import { StatisticsCards } from '../components/common/StatisticsCards';
import { showToast } from '@/lib/toast';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';

// Types
interface LineItem {
  name: string;
  quantity: number;
  unit_price: number;
}

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

export default function SubscriptionOrdersPage() {
  const navigate = useNavigate();
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
      console.log('Orders loaded:', data);
      console.log('First order:', data[0]);
      setOrders(data);
    } catch (error: any) {
      console.error('Error loading orders:', error);
      showToast.error('Không thể tải danh sách đơn hàng: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...orders];

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(order => {
        // Search in order number
        if (order.order_number?.toLowerCase().includes(search)) return true;
        
        // Search in items snapshot
        if (order.items_snapshot && Array.isArray(order.items_snapshot)) {
          return order.items_snapshot.some((item: LineItem) => 
            item.name?.toLowerCase().includes(search)
          );
        }
        
        return false;
      });
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  };

  const calculateStats = () => {
    const stats: OrderStats = {
      total: orders.length,
      draft: orders.filter(o => o.status === 'DRAFT').length,
      pending: orders.filter(o => o.status === 'PENDING').length,
      paid: orders.filter(o => o.status === 'PAID').length,
      cancelled: orders.filter(o => o.status === 'CANCELLED').length,
      failed: orders.filter(o => o.status === 'FAILED').length,
      refunded: orders.filter(o => o.status === 'REFUNDED').length,
      totalRevenue: orders
        .filter(o => o.status === 'PAID')
        .reduce((sum, o) => sum + o.total_amount, 0),
      newOrders: orders.filter(o => o.type === 'NEW').length,
      renewalOrders: orders.filter(o => o.type === 'RENEWAL').length,
      upgradeOrders: orders.filter(o => o.type === 'UPGRADE').length,
      downgradeOrders: orders.filter(o => o.type === 'DOWNGRADE').length,
      addOnOrders: orders.filter(o => o.type === 'ADD_ON').length,
    };
    setStats(stats);
  };

  const handleViewDetails = async (order: Order) => {
    // Navigate to detail page instead of opening modal
    navigate(`/commerce/subscription-orders/${order._id}`);
  };

  const handleDelete = async (order: Order) => {
    setConfirmDialog({
      open: true,
      title: 'Xóa đơn hàng',
      description: `Bạn có chắc muốn xóa đơn hàng "${order.order_number}"?`,
      onConfirm: async () => {
        try {
          await ordersApi.delete(order._id);
          showToast.success('Thành công', 'Đã xóa đơn hàng');
          loadOrders();
        } catch (error: any) {
          console.error('Error deleting order:', error);
          showToast.error('Lỗi', 'Không thể xóa: ' + error.message);
        } finally {
          setConfirmDialog({ ...confirmDialog, open: false });
        }
      },
      variant: 'destructive',
    });
  };
  
  // Helper function to get line items summary
  const getItemsSummary = (order: Order): string => {
    if (!order.items_snapshot || !Array.isArray(order.items_snapshot) || order.items_snapshot.length === 0) {
      return 'N/A';
    }
    
    if (order.items_snapshot.length === 1) {
      return order.items_snapshot[0].name;
    }
    
    return `${order.items_snapshot[0].name} (+${order.items_snapshot.length - 1} item khác)`;
  };

  // Helper function to count total items
  const getTotalItems = (order: Order): number => {
    if (!order.items_snapshot || !Array.isArray(order.items_snapshot)) return 0;
    return order.items_snapshot.reduce((sum, item) => sum + (item.quantity || 0), 0);
  };

  const formatPrice = (price: number, currency: string) => {
    // Fallback to VND if currency is null/undefined
    const currencyCode = currency || 'VND';
    
    if (currencyCode === 'VND') {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(price);
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Helper functions for status and type
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'PAID': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'CANCELLED': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      case 'FAILED': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'REFUNDED': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Chờ xử lý';
      case 'PAID': return 'Đã thanh toán';
      case 'CANCELLED': return 'Đã hủy';
      case 'FAILED': return 'Thất bại';
      case 'REFUNDED': return 'Đã hoàn tiền';
      default: return status;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'NEW': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'RENEWAL': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'UPGRADE': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'DOWNGRADE': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'ADD_ON': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'NEW': return 'Mới';
      case 'RENEWAL': return 'Gia hạn';
      case 'UPGRADE': return 'Nâng cấp';
      case 'DOWNGRADE': return 'Hạ cấp';
      case 'ADD_ON': return 'Mở rộng';
      default: return type;
    }
  };

  return (
    <Fragment>
      <PageLayout
        title="Đơn hàng gói dịch vụ"
        description="Quản lý đơn hàng mua gói dịch vụ"
        icon={ShoppingCart}
        actions={
          <Button onClick={() => navigate('/commerce/subscription-orders/create')}>
            <Plus className="h-4 w-4 mr-2" />
            Tạo đơn hàng
          </Button>
        }
      >
        {stats && (
          <StatisticsCards
            stats={[
              { label: 'Tổng đơn', value: stats.total, color: 'gray', icon: ShoppingCart },
              { label: 'Chờ xử lý', value: stats.pending, color: 'yellow', icon: Clock },
              { label: 'Đã thanh toán', value: stats.paid, color: 'green', icon: CheckCircle },
              { label: 'Đã hủy', value: stats.cancelled, color: 'gray', icon: XCircle },
              { label: 'Thất bại', value: stats.failed, color: 'red', icon: AlertCircle },
              { label: 'Doanh thu', value: formatPrice(stats.totalRevenue, 'VND'), color: 'indigo', icon: DollarSign },
            ]}
            columns={6}
            className="mb-0 border-none shadow-sm"
          />
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Filters & Search */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Tìm theo mã đơn, tên gói..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="PENDING">Chờ xử lý</SelectItem>
                    <SelectItem value="PAID">Đã thanh toán</SelectItem>
                    <SelectItem value="CANCELLED">Đã hủy</SelectItem>
                    <SelectItem value="FAILED">Thất bại</SelectItem>
                  </SelectContent>
                </Select>

                {/* View Mode Toggle */}
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === 'table' ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => setViewMode('table')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={loadOrders}>
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Orders Display */}
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
              <p className="text-gray-500 mt-4">Đang tải...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Không có đơn hàng nào</p>
            </div>
          ) : viewMode === 'table' ? (
            // Table View
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Mã đơn hàng
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Gói dịch vụ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Số tiền
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Ngày tạo
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredOrders.map((order) => (
                      <tr 
                        key={order._id} 
                        className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                        onClick={() => handleViewDetails(order)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {order.order_number || 'N/A'}
                          </div>
                          {order.type && (
                            <Badge className={`mt-1 ${getTypeColor(order.type)}`} variant="outline">
                              {getTypeLabel(order.type)}
                            </Badge>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {getItemsSummary(order)}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                            <Box className="h-3 w-3" />
                            {getTotalItems(order)} items
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            {formatPrice(order.total_amount, order.currency_code)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={getStatusColor(order.status)}>
                            {getStatusLabel(order.status)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(order.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/commerce/subscription-orders/edit/${order._id}`);
                              }}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(order);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            // Grid View
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOrders.map((order) => (
                <Card 
                  key={order._id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleViewDetails(order)}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {order.order_number || 'N/A'}
                        </CardTitle>
                        <p className="text-sm text-gray-500 mt-1">
                          {getItemsSummary(order)}
                        </p>
                        {order.type && (
                          <Badge className={`mt-2 ${getTypeColor(order.type)}`} variant="outline">
                            {getTypeLabel(order.type)}
                          </Badge>
                        )}
                      </div>
                      <Badge className={getStatusColor(order.status)}>
                        {getStatusLabel(order.status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Số items:</span>
                        <span className="text-sm flex items-center gap-1">
                          <Box className="h-4 w-4" />
                          {getTotalItems(order)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Số tiền:</span>
                        <span className="text-sm font-semibold">
                          {formatPrice(order.total_amount, order.currency_code)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Ngày tạo:</span>
                        <span className="text-sm">
                          {formatDate(order.created_at)}
                        </span>
                      </div>
                      {order.payment_method && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Thanh toán:</span>
                          <span className="text-sm">{order.payment_method}</span>
                        </div>
                      )}
                      
                      <div className="flex gap-2 pt-3 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails(order);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Xem
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(order);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </PageLayout>

      {/* Order Detail Modal - Outside PageLayout */}
      <OrderDetailModal
        order={selectedOrder}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedOrder(null);
        }}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
        variant={confirmDialog.variant}
        confirmLabel="Xác nhận"
        cancelLabel="Hủy"
      />
    </Fragment>
  );
}