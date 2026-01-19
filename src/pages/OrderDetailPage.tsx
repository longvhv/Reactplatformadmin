/**
 * Order Detail Page
 * Displays comprehensive order information with tabs for overview, payment, and history
 * ✅ MIGRATED: Using PageLayout for consistent UI/UX
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { 
  ShoppingCart, ArrowLeft, Package, CreditCard, Clock, 
  AlertCircle, CheckCircle, XCircle, Loader 
} from 'lucide-react';
import { useOrderDetails, useCancelOrder, useProcessPayment, getStatusColor, getStatusLabel } from '@/api/ordersApi';
import { isReservedKeyword } from '@/lib/route-guards';
import { OrderOverviewTab } from '@/components/orders/OrderOverviewTab';
import { OrderPaymentTab } from '@/components/orders/OrderPaymentTab';
import { OrderHistoryTab } from '@/components/orders/OrderHistoryTab';
import { OrderItemsTab } from '@/components/orders/OrderItemsTab';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { showToast } from '@/lib/toast';

type TabType = 'overview' | 'items' | 'payment' | 'history';

export default function OrderDetailPage() {
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

  // Early return if reserved keyword
  if (isReservedKeyword(id)) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Đang tải thông tin đơn hàng...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md mx-auto p-8">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">
            Không tìm thấy đơn hàng
          </h2>
          <div className="mb-6 space-y-2">
            <p className="text-gray-600">
              {error || 'Đơn hàng không tồn tại hoặc đã bị xóa'}
            </p>
            {id && (
              <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                <p className="text-sm text-gray-700 font-mono">
                  Order ID: <span className="font-semibold">{id}</span>
                </p>
              </div>
            )}
          </div>
          <Button onClick={() => navigate('/commerce/subscription-orders')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại danh sách đơn hàng
          </Button>
        </div>
      </div>
    );
  }

  const handleCancelOrder = async () => {
    try {
      await cancelOrder(order._id);
      showToast.success('Thành công', 'Đã hủy đơn hàng');
      refresh();
    } catch (error) {
      console.error('Failed to cancel order:', error);
      showToast.error('Lỗi', 'Không thể hủy đơn hàng');
    }
  };

  const handleProcessPayment = async () => {
    try {
      await processPayment(order._id, { payment_method: 'CREDIT_CARD' });
      showToast.success('Thành công', 'Đã thanh toán đơn hàng');
      refresh();
    } catch (error) {
      console.error('Failed to process payment:', error);
      showToast.error('Lỗi', 'Không thể xử lý thanh toán');
    }
  };

  const tabs = [
    { id: 'overview' as TabType, label: 'Tổng quan', icon: ShoppingCart },
    { id: 'items' as TabType, label: 'Sản phẩm', icon: Package },
    { id: 'payment' as TabType, label: 'Thanh toán', icon: CreditCard },
    { id: 'history' as TabType, label: 'Lịch sử', icon: Clock },
  ];

  const StatusIcon = {
    PENDING: Clock,
    PAID: CheckCircle,
    CANCELLED: XCircle,
    FAILED: AlertCircle,
  }[order.status];

  return (
    <>
      <Card
        icon={ShoppingCart}
        title={`Đơn hàng #${order.order_number}`}
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

            {/* Action Buttons */}
            {order.status === 'PENDING' && (
              <>
                <Button
                  onClick={handleProcessPayment}
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
                  onClick={() => handleCancelOrder()}
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

            {order.subscription_created && order.subscription_id && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/commerce/tenant-subscriptions/${order.subscription_id}`)}
              >
                <Package className="w-4 h-4 mr-2" />
                Xem subscription
              </Button>
            )}
          </div>
        }
      >
        {/* Tabs */}
        <Tabs
          defaultValue={activeTab}
          onValueChange={(value) => setActiveTab(value as TabType)}
        >
          <TabsList className="grid grid-cols-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className={`
                    group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }
                  `}
                >
                  <Icon
                    className={`
                      -ml-0.5 mr-2 h-5 w-5
                      ${activeTab === tab.id ? 'text-primary' : 'text-gray-400 group-hover:text-gray-500'}
                    `}
                  />
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Tab Content */}
          <TabsContent value="overview">
            <OrderOverviewTab order={order} onRefresh={refresh} />
          </TabsContent>
          <TabsContent value="items">
            <OrderItemsTab order={order} />
          </TabsContent>
          <TabsContent value="payment">
            <OrderPaymentTab order={order} onRefresh={refresh} />
          </TabsContent>
          <TabsContent value="history">
            <OrderHistoryTab order={order} />
          </TabsContent>
        </Tabs>
      </Card>
    </>
  );
}