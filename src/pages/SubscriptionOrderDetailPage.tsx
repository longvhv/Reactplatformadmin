/**
 * Subscription Order Detail Page
 * Full-screen page displaying comprehensive subscription order information
 * Uses tab-based navigation for overview, payment, package details, and history
 * @route /core/subscription-orders/:id
 */

import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, ArrowLeft, Package, CreditCard, Clock, 
  AlertCircle, CheckCircle, XCircle, Loader, Edit2
} from 'lucide-react';
import { useOrderDetails, useCancelOrder, useProcessPayment, getStatusColor, getStatusLabel } from '../api/ordersApi';
import { OrderOverviewTab } from '../components/orders/OrderOverviewTab';
import { OrderPaymentTab } from '../components/orders/OrderPaymentTab';
import { OrderHistoryTab } from '../components/orders/OrderHistoryTab';
import { OrderPackageTab } from '../components/orders/OrderPackageTab';

type TabType = 'overview' | 'payment' | 'package' | 'history';

/**
 * SubscriptionOrderDetailPage Component
 * 
 * Features:
 * - Full-screen detail page for subscription orders
 * - Tab-based navigation (Overview, Payment, Package, History)
 * - Order status management (cancel, process payment)
 * - Real-time order data with refresh capability
 * - Link to related subscription if created
 * - Responsive design following Stripe/GitHub patterns
 */
export default function SubscriptionOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { order, loading, error, refresh } = useOrderDetails(id);
  const { cancelOrder, cancelling } = useCancelOrder();
  const { processPayment, processing } = useProcessPayment();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>('CREDIT_CARD');

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Đang tải thông tin đơn hàng...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
                <p className="text-xs text-gray-500 mt-2">
                  Kiểm tra console để xem chi tiết lỗi API
                </p>
              </div>
            )}
          </div>
          <Link
            to="/core/subscription-orders"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại danh sách đơn hàng
          </Link>
        </div>
      </div>
    );
  }

  // Handlers
  const handleCancelOrder = async () => {
    try {
      await cancelOrder(order._id);
      setShowCancelDialog(false);
      refresh();
    } catch (error) {
      console.error('Failed to cancel order:', error);
    }
  };

  const handleProcessPayment = async () => {
    try {
      await processPayment(order._id, { payment_method: paymentMethod });
      setShowPaymentDialog(false);
      refresh();
    } catch (error) {
      console.error('Failed to process payment:', error);
    }
  };

  // Tab configuration
  const tabs = [
    { id: 'overview' as TabType, label: 'Tổng quan', icon: ShoppingCart },
    { id: 'payment' as TabType, label: 'Thanh toán', icon: CreditCard },
    { id: 'package' as TabType, label: 'Gói dịch vụ', icon: Package },
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                to="/core/subscription-orders"
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Đơn hàng gói dịch vụ #{order.order_code}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  ID: {order._id}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Status Badge */}
              <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                {StatusIcon && <StatusIcon className="w-4 h-4 mr-2" />}
                {getStatusLabel(order.status)}
              </div>

              {/* Edit Button */}
              <button
                onClick={() => navigate(`/core/subscription-orders/edit/${order._id}`)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Chỉnh sửa
              </button>

              {/* Action Buttons for PENDING status */}
              {order.status === 'PENDING' && (
                <>
                  <button
                    onClick={() => setShowPaymentDialog(true)}
                    disabled={processing}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
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
                  </button>

                  <button
                    onClick={() => setShowCancelDialog(true)}
                    disabled={cancelling}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
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
                  </button>
                </>
              )}

              {/* Link to subscription if created */}
              {order.subscription_created && order.subscription_id && (
                <Link
                  to={`/core/subscriptions/${order.subscription_id}`}
                  className="inline-flex items-center px-4 py-2 border border-indigo-600 rounded-md shadow-sm text-sm font-medium text-indigo-600 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Package className="w-4 h-4 mr-2" />
                  Xem subscription
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200 mt-6">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                    ${isActive
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon
                    className={`
                      -ml-0.5 mr-2 h-5 w-5
                      ${isActive ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'}
                    `}
                  />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-6 pb-12">
          {activeTab === 'overview' && <OrderOverviewTab order={order} onRefresh={refresh} />}
          {activeTab === 'payment' && <OrderPaymentTab order={order} onRefresh={refresh} />}
          {activeTab === 'package' && <OrderPackageTab order={order} />}
          {activeTab === 'history' && <OrderHistoryTab order={order} />}
        </div>
      </div>

      {/* Cancel Order Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Xác nhận hủy đơn hàng
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Bạn có chắc chắn muốn hủy đơn hàng <strong>#{order.order_code}</strong>? 
              Hành động này không thể hoàn tác.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCancelDialog(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Đóng
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={cancelling}
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {cancelling ? 'Đang hủy...' : 'Xác nhận hủy'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Dialog */}
      {showPaymentDialog && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Xác nhận thanh toán
            </h3>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phương thức thanh toán
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="CREDIT_CARD">Thẻ tín dụng</option>
                <option value="BANK_TRANSFER">Chuyển khoản</option>
                <option value="E_WALLET">Ví điện tử</option>
                <option value="CASH">Tiền mặt</option>
              </select>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Tổng thanh toán:</span>
                <span className="font-semibold text-gray-900">
                  {new Intl.NumberFormat('vi-VN', { 
                    style: 'currency', 
                    currency: order.currency_code || 'VND'
                  }).format(order.total_amount)}
                </span>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowPaymentDialog(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleProcessPayment}
                disabled={processing}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                {processing ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}