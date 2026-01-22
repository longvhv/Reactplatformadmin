/**
 * Subscription Order Detail Page
 * ✅ UPDATED: Using SubscriptionOrderDetailModal content as full page
 * ✅ Sidebar layout matching other detail pages
 */
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from '../../../../../components/shim/next-navigation';
import { 
  ShoppingCart, 
  ArrowLeft, 
  Edit, 
  Trash2, 
  MoreVertical,
  DollarSign,
  Package,
  Users,
  Calendar,
  Info,
  FileText,
  Database,
  Clock,
  CreditCard,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
  Hash,
  Activity
} from 'lucide-react';
import { Button } from '../../../../../components/ui/button';
import { Badge } from '../../../../../components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../../components/ui/card';
import { ordersApi, Order } from '../../../../../api/ordersApi';
import { showToast } from '../../../../../lib/toast';
import { ConfirmDialog } from '../../../../../components/common/ConfirmDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../../../components/ui/dropdown-menu';

// ============================================================================
// TYPES
// ============================================================================

type TabType = 'overview' | 'items' | 'billing' | 'history';

interface SubscriptionOrder extends Order {
  tenant_name?: string;
  type?: 'NEW' | 'RENEWAL' | 'UPGRADE' | 'DOWNGRADE' | 'ADD_ON';
  status: 'DRAFT' | 'PENDING' | 'PAID' | 'CANCELLED' | 'FAILED' | 'REFUNDED';
  items_snapshot?: any[];
  billing_info?: Record<string, any>;
  payment_method?: string | null;
  payment_ref_id?: string | null;
}

// ============================================================================
// CONFIGURATIONS
// ============================================================================

const STATUS_CONFIG = {
  DRAFT: {
    label: 'Nháp',
    color: 'bg-gray-100 text-gray-800',
    icon: AlertCircle,
  },
  PENDING: {
    label: 'Chờ thanh toán',
    color: 'bg-yellow-100 text-yellow-800',
    icon: AlertCircle,
  },
  PAID: {
    label: 'Đã thanh toán',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle,
  },
  CANCELLED: {
    label: 'Đã hủy',
    color: 'bg-gray-100 text-gray-800',
    icon: XCircle,
  },
  FAILED: {
    label: 'Thất bại',
    color: 'bg-red-100 text-red-800',
    icon: XCircle,
  },
  REFUNDED: {
    label: 'Đã hoàn tiền',
    color: 'bg-purple-100 text-purple-800',
    icon: Activity,
  },
};

const TYPE_CONFIG = {
  NEW: { label: 'Mới', color: 'bg-blue-100 text-blue-800' },
  RENEWAL: { label: 'Gia hạn', color: 'bg-green-100 text-green-800' },
  UPGRADE: { label: 'Nâng cấp', color: 'bg-indigo-100 text-indigo-800' },
  DOWNGRADE: { label: 'Hạ cấp', color: 'bg-orange-100 text-orange-800' },
  ADD_ON: { label: 'Thêm tính năng', color: 'bg-purple-100 text-purple-800' },
};

const PAYMENT_METHODS: Record<string, string> = {
  CREDIT_CARD: 'Thẻ tín dụng',
  DEBIT_CARD: 'Thẻ ghi nợ',
  BANK_TRANSFER: 'Chuyển khoản ngân hàng',
  VNPAY: 'VNPay',
  MOMO: 'MoMo',
  ZALOPAY: 'ZaloPay',
  PAYPAL: 'PayPal',
  STRIPE: 'Stripe',
  CASH: 'Tiền mặt',
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const formatDate = (dateString?: string | null): string => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatPrice = (price: number, currency: string): string => {
  if (currency === 'VND') {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(price);
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const InfoRow: React.FC<{ 
  icon: React.ElementType; 
  label: string; 
  value: React.ReactNode;
}> = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center">
      <Icon className="w-5 h-5 text-indigo-600" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-xs font-medium text-gray-500 mb-1">{label}</div>
      <div className="text-sm font-semibold text-gray-900 break-words">
        {value}
      </div>
    </div>
  </div>
);

const StatusFlowDiagram: React.FC<{ currentStatus: string }> = ({ currentStatus }) => {
  const statuses = ['DRAFT', 'PENDING', 'PAID'];
  
  const getStatusStyle = (status: string) => {
    if (status === currentStatus) {
      return 'bg-indigo-600 text-white scale-110 shadow-lg';
    }
    return 'bg-gray-200 text-gray-500';
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-6 border border-indigo-200">
      <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
        <Activity className="w-4 h-4 text-indigo-600" />
        Quy trình đơn hàng
      </h4>
      <div className="flex items-center justify-between gap-2">
        {statuses.map((status, index) => {
          const StatusIcon = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.icon || AlertCircle;
          return (
            <React.Fragment key={status}>
              <div className="flex flex-col items-center gap-2 flex-1">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${getStatusStyle(status)}`}>
                  <StatusIcon className="w-6 h-6" />
                </div>
                <span className="text-xs font-medium text-center">
                  {STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.label || status}
                </span>
              </div>
              {index < statuses.length - 1 && (
                <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function OrderDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [order, setOrder] = useState<SubscriptionOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  useEffect(() => {
    if (id) loadOrder();
  }, [id]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const data = await ordersApi.getById(id);
      setOrder(data as SubscriptionOrder);
    } catch (error: any) {
      showToast.error('Error', 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await ordersApi.delete(id);
      showToast.success('Success', 'Order deleted');
      router.push('/commerce/subscription-orders');
    } catch (error: any) {
      showToast.error('Error', error.message || 'Failed to delete');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Order not found</p>
          <Button onClick={() => router.push('/commerce/subscription-orders')}>
            Back to Orders
          </Button>
        </div>
      </div>
    );
  }

  const StatusIcon = STATUS_CONFIG[order.status]?.icon || AlertCircle;

  // Sidebar groups
  const sidebarGroups = [
    {
      id: 'general',
      label: 'TỔNG QUAN',
      items: [
        { id: 'overview', label: 'Thông tin chung', icon: FileText },
        { id: 'items', label: 'Sản phẩm', icon: Package },
        { id: 'billing', label: 'Thanh toán', icon: DollarSign },
      ]
    },
    {
      id: 'audit',
      label: 'QUẢN TRỊ',
      items: [
        { id: 'history', label: 'Lịch sử', icon: Clock },
      ]
    },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Status Flow */}
            <StatusFlowDiagram currentStatus={order.status} />

            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Info className="w-5 h-5 text-indigo-600" />
                  Định danh & Liên kết
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoRow
                    icon={Hash}
                    label="Order ID"
                    value={<code className="text-xs bg-gray-200 px-2 py-1 rounded">{order._id}</code>}
                  />
                  <InfoRow
                    icon={FileText}
                    label="Mã đơn hàng"
                    value={<code className="text-base font-bold text-indigo-600">{order.order_code || order.order_number}</code>}
                  />
                  <InfoRow
                    icon={Users}
                    label="Tenant"
                    value={
                      <div>
                        <div className="font-semibold">{order.tenant_name || 'N/A'}</div>
                        <code className="text-xs text-gray-500">{order.tenant_id}</code>
                      </div>
                    }
                  />
                  {order.type && (
                    <InfoRow
                      icon={Package}
                      label="Loại đơn hàng"
                      value={
                        <Badge className={TYPE_CONFIG[order.type]?.color || 'bg-gray-100 text-gray-800'}>
                          {TYPE_CONFIG[order.type]?.label || order.type}
                        </Badge>
                      }
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Order Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  Thông tin đơn hàng
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoRow
                    icon={DollarSign}
                    label="Tổng tiền"
                    value={
                      <div className="text-2xl font-bold text-green-600">
                        {formatPrice(order.total_amount || 0, order.currency_code || 'VND')}
                      </div>
                    }
                  />
                  <InfoRow
                    icon={Activity}
                    label="Trạng thái"
                    value={
                      <div className="flex items-center gap-2">
                        <StatusIcon className="w-5 h-5" />
                        <Badge className={STATUS_CONFIG[order.status]?.color || 'bg-gray-100 text-gray-800'}>
                          {STATUS_CONFIG[order.status]?.label || order.status}
                        </Badge>
                      </div>
                    }
                  />
                  {order.payment_method && (
                    <InfoRow
                      icon={CreditCard}
                      label="Phương thức thanh toán"
                      value={
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-indigo-600" />
                          <span className="font-semibold">
                            {PAYMENT_METHODS[order.payment_method] || order.payment_method}
                          </span>
                        </div>
                      }
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'items':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="w-5 h-5 text-purple-600" />
                  Sản phẩm trong đơn hàng
                </CardTitle>
              </CardHeader>
              <CardContent>
                {order.items_snapshot && order.items_snapshot.length > 0 ? (
                  <div className="space-y-3">
                    {order.items_snapshot.map((item: any, index: number) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900">{item.name || 'N/A'}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              Số lượng: {item.qty || 1} × {formatPrice(item.price || 0, order.currency_code || 'VND')}
                            </div>
                          </div>
                          <div className="text-right font-bold text-gray-900">
                            {formatPrice((item.price || 0) * (item.qty || 1), order.currency_code || 'VND')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">Không có sản phẩm</p>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case 'billing':
        return (
          <div className="space-y-6">
            {/* Billing Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  Thông tin thanh toán
                </CardTitle>
              </CardHeader>
              <CardContent>
                {order.billing_info && Object.keys(order.billing_info).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {order.billing_info.customer_name && (
                      <div>
                        <div className="text-xs text-gray-500">Khách hàng</div>
                        <div className="font-semibold text-gray-900">{order.billing_info.customer_name}</div>
                      </div>
                    )}
                    {order.billing_info.customer_email && (
                      <div>
                        <div className="text-xs text-gray-500">Email</div>
                        <div className="font-semibold text-gray-900">{order.billing_info.customer_email}</div>
                      </div>
                    )}
                    {order.billing_info.customer_phone && (
                      <div>
                        <div className="text-xs text-gray-500">Điện thoại</div>
                        <div className="font-semibold text-gray-900">{order.billing_info.customer_phone}</div>
                      </div>
                    )}
                    {order.billing_info.company_name && (
                      <div>
                        <div className="text-xs text-gray-500">Công ty</div>
                        <div className="font-semibold text-gray-900">{order.billing_info.company_name}</div>
                      </div>
                    )}
                    {order.billing_info.address && (
                      <div className="md:col-span-2">
                        <div className="text-xs text-gray-500">Địa chỉ</div>
                        <div className="font-semibold text-gray-900">{order.billing_info.address}</div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">Chưa có thông tin thanh toán</p>
                )}
              </CardContent>
            </Card>

            {/* Financial Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Chi tiết tài chính</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-sm text-gray-600">Tạm tính</span>
                    <span className="font-semibold text-gray-900">
                      {formatPrice(order.subtotal_amount || 0, order.currency_code || 'VND')}
                    </span>
                  </div>
                  {order.discount_amount && order.discount_amount > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-sm text-gray-600">Giảm giá</span>
                      <span className="font-semibold text-red-600">
                        -{formatPrice(order.discount_amount, order.currency_code || 'VND')}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-sm text-gray-600">Thuế</span>
                    <span className="font-semibold text-gray-900">
                      {formatPrice(order.tax_amount || 0, order.currency_code || 'VND')}
                    </span>
                  </div>
                  {order.credit_applied && order.credit_applied > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-sm text-gray-600">Sử dụng tín dụng</span>
                      <span className="font-semibold text-purple-600">
                        -{formatPrice(order.credit_applied, order.currency_code || 'VND')}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-3 bg-green-50 rounded-lg px-3 mt-2">
                    <span className="text-base font-bold text-gray-900">Tổng cộng</span>
                    <span className="text-xl font-bold text-green-600">
                      {formatPrice(order.total_amount || 0, order.currency_code || 'VND')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'history':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-green-600" />
                  Audit Trail
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500">Ngày tạo</div>
                    <div className="font-semibold text-gray-900">{formatDate(order.created_at)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Cập nhật lần cuối</div>
                    <div className="font-semibold text-gray-900">{formatDate(order.updated_at)}</div>
                  </div>
                  {order.version !== undefined && (
                    <div>
                      <div className="text-xs text-gray-500">Version (Optimistic Locking)</div>
                      <Badge variant="secondary">v{order.version}</Badge>
                    </div>
                  )}
                  {order.deleted_at && (
                    <div>
                      <div className="text-xs text-gray-500">Ngày xóa</div>
                      <div className="font-semibold text-red-600">{formatDate(order.deleted_at)}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-[1600px] mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/commerce/subscription-orders')}
                  className="hover:bg-gray-100"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                
                <div className="h-8 w-px bg-gray-300" />
                
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-100">
                    <ShoppingCart className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold text-gray-900">
                      Đơn hàng #{order.order_code || order.order_number}
                    </h1>
                    <p className="text-sm text-gray-500">{order.tenant_name || order.tenant_id}</p>
                  </div>
                  <Badge className={STATUS_CONFIG[order.status]?.color || 'bg-gray-100 text-gray-800'}>
                    {STATUS_CONFIG[order.status]?.label || order.status}
                  </Badge>
                  {order.type && (
                    <Badge className={TYPE_CONFIG[order.type]?.color || 'bg-gray-100 text-gray-800'}>
                      {TYPE_CONFIG[order.type]?.label || order.type}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/commerce/subscription-orders/edit/${id}`)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => setShowDeleteDialog(true)}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content with Sidebar */}
        <div className="max-w-[1600px] mx-auto px-6 py-6">
          <div className="flex gap-6">
            {/* Sidebar Navigation */}
            <div className="w-64 flex-shrink-0">
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden sticky top-24">
                <div className="p-3 bg-gray-50 border-b border-gray-200">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Quản lý Đơn hàng
                  </p>
                </div>
                <nav className="py-3 px-2">
                  {sidebarGroups.map((group, groupIndex) => (
                    <div key={group.id} className={groupIndex > 0 ? 'mt-5' : ''}>
                      <div className="px-3 mb-1.5">
                        <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                          {group.label}
                        </h3>
                      </div>
                      
                      <div className="space-y-0.5">
                        {group.items.map((item) => {
                          const Icon = item.icon;
                          const isActive = activeTab === item.id;
                          return (
                            <button
                              key={item.id}
                              onClick={() => setActiveTab(item.id as TabType)}
                              className={`
                                w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-150
                                ${isActive 
                                  ? 'bg-indigo-600 text-white' 
                                  : 'text-gray-700 hover:bg-gray-100'
                                }
                              `}
                            >
                              <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                              <span className="font-normal">{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </nav>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 min-w-0">
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden p-6">
                {renderTabContent()}
              </div>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          title="Xóa đơn hàng"
          description="Bạn có chắc chắn muốn xóa đơn hàng này? Hành động này không thể hoàn tác."
          onConfirm={handleDelete}
          variant="destructive"
        />
      </div>
    </>
  );
}

export { OrderDetailPage };
export default OrderDetailPage;
