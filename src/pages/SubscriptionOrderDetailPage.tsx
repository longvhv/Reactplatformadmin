/**
 * Subscription Order Detail Page
 * Full-screen page displaying comprehensive subscription order information
 * Uses tab-based navigation for overview, payment, package details, and history
 * ✅ MIGRATED: Using PageLayout for consistent UI/UX
 * ✅ 100% QUALITY: DropdownMenu + ConfirmDialog + Toast
 * @route /commerce/subscription-orders/:id
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { 
  ShoppingCart, ArrowLeft, Package, CreditCard, Clock, 
  AlertCircle, CheckCircle, XCircle, Loader, Edit2, Trash2, MoreVertical
} from 'lucide-react';
import { useOrderDetails, useCancelOrder, useProcessPayment, getStatusColor, getStatusLabel } from '../api/ordersApi';
import { isReservedKeyword } from '../lib/route-guards';
import { OrderOverviewTab } from '../components/orders/OrderOverviewTab';
import { OrderPaymentTab } from '../components/orders/OrderPaymentTab';
import { OrderHistoryTab } from '../components/orders/OrderHistoryTab';
import { OrderItemsTab } from '../components/orders/OrderItemsTab';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { showToast } from '../lib/toast';
import { PageLayout } from '../components/common/PageLayout';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';

type TabType = 'overview' | 'items' | 'payment' | 'history';

/**
 * SubscriptionOrderDetailPage Component
 * Shows comprehensive order details with tabs for overview, items, payment, and history.
 * ✅ MIGRATED: Fixed confirm() → ConfirmDialog, toast → showToast
 * ✅ 100% QUALITY: Professional UI with dark mode support
 */
export default function SubscriptionOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Handle reserved keywords
  useEffect(() => {
    if (isReservedKeyword(id)) {
      navigate('/commerce/subscription-orders', { replace: true });
      return;
    }
    if (!id) {
      navigate('/commerce/subscription-orders');
    }
  }, [id, navigate]);
  
  const { order, loading, error, refresh } = useOrderDetails(
    !isReservedKeyword(id) ? id : undefined
  );
  const { cancelOrder, cancelling } = useCancelOrder();
  const { processPayment, processing } = useProcessPayment();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('CREDIT_CARD');
  const [deleting, setDeleting] = useState(false);

  // Early return if reserved keyword
  if (isReservedKeyword(id)) {
    return null;
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Đang tải thông tin đơn hàng...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !order) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md mx-auto p-8">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
            Không tìm thấy đơn hàng
          </h2>
          <div className="mb-6 space-y-2">
            <p className="text-gray-600 dark:text-gray-400">
              {error || 'Đơn hàng không tồn tại hoặc đã bị xóa'}
            </p>
            {id && (
              <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-700 dark:text-gray-300 font-mono">
                  Order ID: <span className="font-semibold">{id}</span>
                </p>
              </div>
            )}
          </div>
          <Link
            to="/commerce/subscription-orders"
            className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại danh sách đơn hàng
          </Link>
        </div>
      </div>
    );
  }

  // Handlers
  const handleCancelOrderConfirm = async () => {
    try {
      await cancelOrder(order._id);
      showToast.success('Thành công', 'Đã hủy đơn hàng');
      setShowCancelDialog(false);
      refresh();
    } catch (error) {
      console.error('Failed to cancel order:', error);
      showToast.error('Lỗi', 'Hủy đơn hàng thất bại');
    }
  };

  const handleProcessPaymentConfirm = async () => {
    try {
      await processPayment(order._id, { payment_method: paymentMethod });
      showToast.success('Thành công', 'Đã xử lý thanh toán');
      setShowPaymentDialog(false);
      refresh();
    } catch (error) {
      console.error('Failed to process payment:', error);
      showToast.error('Lỗi', 'Xử lý thanh toán thất bại');
    }
  };

  const handleDeleteOrderConfirm = async () => {
    if (!order) return;
    
    setDeleting(true);
    try {
      const { ordersApi } = await import('../api/ordersApi');
      await ordersApi.delete(order._id);
      showToast.success('Thành công', 'Đã xóa đơn hàng');
      setShowDeleteDialog(false);
      navigate('/commerce/subscription-orders');
    } catch (error) {
      console.error('Failed to delete order:', error);
      showToast.error('Lỗi', 'Xóa đơn hàng thất bại');
    } finally {
      setDeleting(false);
    }
  };

  // Tab configuration
  const tabs = [
    { id: 'overview' as TabType, label: 'Tổng quan', icon: ShoppingCart },
    { id: 'payment' as TabType, label: 'Thanh toán', icon: CreditCard },
    { id: 'items' as TabType, label: 'Mặt hàng', icon: Package },
    { id: 'history' as TabType, label: 'Lịch sử', icon: Clock },
  ];

  // Status icon mapping
  const StatusIcon = {
    PENDING: Clock,
    PAID: CheckCircle,
    CANCELLED: XCircle,
    FAILED: AlertCircle,
  }[order.status];

  return (
    <>
      <PageLayout
        icon={ShoppingCart}
        title={`Đơn hàng #${order.order_code}`}
        description={`ID: ${order._id}`}
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/commerce/subscription-orders')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại
            </Button>

            {/* Status Badge */}
            <Badge className={getStatusColor(order.status)}>
              {StatusIcon && <StatusIcon className="w-4 h-4 mr-2" />}
              {getStatusLabel(order.status)}
            </Badge>

            {/* Link to subscription if created */}
            {order.subscription_created && order.subscription_id && (
              <Link to={`/commerce/tenant-subscriptions/${order.subscription_id}`}>
                <Button variant="outline" size="sm">
                  <Package className="w-4 h-4 mr-2" />
                  Xem subscription
                </Button>
              </Link>
            )}

            {/* Action Buttons for PENDING status */}
            {order.status === 'PENDING' && (
              <>
                <Button
                  onClick={() => setShowPaymentDialog(true)}
                  disabled={processing}
                  size="sm"
                >
                  {processing ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Thanh toán
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setShowCancelDialog(true)}
                  disabled={cancelling}
                  size="sm"
                >
                  {cancelling ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Đang hủy...
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 mr-2" />
                      Hủy đơn
                    </>
                  )}
                </Button>
              </>
            )}

            {/* More Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate(`/commerce/subscription-orders/edit/${order._id}`)}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Chỉnh sửa
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Xóa
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      >
        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${isActive
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }
                  `}
                >
                  <Icon
                    className={`
                      -ml-0.5 mr-2 h-5 w-5
                      ${isActive ? 'text-primary' : 'text-gray-400 group-hover:text-gray-500'}
                    `}
                  />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'overview' && <OrderOverviewTab order={order} onRefresh={refresh} />}
          {activeTab === 'payment' && <OrderPaymentTab order={order} onRefresh={refresh} />}
          {activeTab === 'items' && <OrderItemsTab order={order} />}
          {activeTab === 'history' && <OrderHistoryTab order={order} />}
        </div>
      </PageLayout>

      {/* Cancel Order Dialog */}
      <ConfirmDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        onConfirm={handleCancelOrderConfirm}
        title="Xác nhận hủy đơn hàng"
        description={`Bạn có chắc chắn muốn hủy đơn hàng #${order.order_code}? Hành động này không thể hoàn tác.`}
        confirmText={cancelling ? 'Đang hủy...' : 'Xác nhận hủy'}
        cancelText="Đóng"
      />

      {/* Payment Dialog */}
      {showPaymentDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Xác nhận thanh toán
            </h3>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phương thức thanh toán
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary focus:border-primary"
              >
                <option value="CREDIT_CARD">Thẻ tín dụng</option>
                <option value="BANK_TRANSFER">Chuyển khoản</option>
                <option value="E_WALLET">Ví điện tử</option>
                <option value="CASH">Tiền mặt</option>
              </select>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">Tổng thanh toán:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {new Intl.NumberFormat('vi-VN', { 
                    style: 'currency', 
                    currency: order.currency_code || 'VND'
                  }).format(order.total_amount)}
                </span>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowPaymentDialog(false)}
              >
                Hủy
              </Button>
              <Button
                onClick={handleProcessPaymentConfirm}
                disabled={processing}
              >
                {processing ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Order Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDeleteOrderConfirm}
        title="Xác nhận xóa đơn hàng"
        description={`Bạn có chắc chắn muốn xóa đơn hàng #${order.order_code}? Hành động này không thể hoàn tác.`}
        confirmText={deleting ? 'Đang xóa...' : 'Xác nhận xóa'}
        cancelText="Đóng"
      />
    </>
  );
}