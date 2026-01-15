/**
 * Order Detail Modal Component
 * Displays complete information about a subscription order
 * ✅ All 12+ fields from subscription_orders table
 * ✅ Package Snapshot JSONB visualization
 * ✅ Beautiful gradient design with Indigo theme
 */

import React from 'react';
import { X, ShoppingCart, DollarSign, Package, Users, Calendar, Info, FileText, Database, Clock } from 'lucide-react';
import { OrderWithDetails } from '../../api/ordersApi';

interface OrderDetailModalProps {
  order: OrderWithDetails | null;
  isOpen: boolean;
  onClose: () => void;
}

export function OrderDetailModal({ order, isOpen, onClose }: OrderDetailModalProps) {
  if (!isOpen || !order) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
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

  const formatJSON = (obj: any) => {
    if (!obj || Object.keys(obj).length === 0) return null;
    return JSON.stringify(obj, null, 2);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      case 'FAILED':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: 'Chờ thanh toán',
      PAID: 'Đã thanh toán',
      CANCELLED: 'Đã hủy',
      FAILED: 'Thất bại',
    };
    return labels[status] || status;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Enhanced Header with Gradient */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-lg backdrop-blur">
              <ShoppingCart className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Chi tiết đơn hàng</h2>
              <p className="text-sm opacity-90 font-mono mt-1 flex items-center gap-2">
                <Database className="w-4 h-4" />
                {order.order_number}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-white/20 rounded-lg p-2 transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content with better spacing */}
        <div className="overflow-y-auto flex-1 p-6 bg-gray-50 dark:bg-gray-900">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-5">
              {/* I. Định danh & Liên kết */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2 uppercase tracking-wide">
                  <Info className="w-4 h-4 text-indigo-600" />
                  I. Định danh & Liên kết
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-start py-2 border-b border-gray-100 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">Order ID:</span>
                    <span className="font-mono text-xs text-right text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      {order._id}
                    </span>
                  </div>
                  <div className="flex justify-between items-start py-2 border-b border-gray-100 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">Tenant ID:</span>
                    <span className="font-mono text-xs text-right text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      {order.tenant_id}
                    </span>
                  </div>
                  {order.tenant_name && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">Tên Tenant:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{order.tenant_name}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-start py-2 border-b border-gray-100 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">Package ID:</span>
                    <span className="font-mono text-xs text-right text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      {order.package_id}
                    </span>
                  </div>
                  {order.package_name && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">Tên gói:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{order.package_name}</span>
                    </div>
                  )}
                  {order.package_code && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">Mã gói:</span>
                      <span className="font-mono text-xs text-gray-900 dark:text-white bg-indigo-100 dark:bg-indigo-900 px-2 py-1 rounded">
                        {order.package_code}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* II. Thông tin đơn hàng */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2 uppercase tracking-wide">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  II. Thông tin đơn hàng
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">Mã đơn hàng:</span>
                    <span className="font-mono font-bold text-gray-900 dark:text-white">{order.order_number}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">Trạng thái:</span>
                    <span className={`px-3 py-1 text-xs rounded-full font-semibold ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </div>
                  {order.payment_method && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">Phương thức thanh toán:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{order.payment_method}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* III. Tài chính - Enhanced */}
              <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-900/30 dark:via-purple-900/30 dark:to-pink-900/30 rounded-xl p-5 shadow-md border-2 border-indigo-200 dark:border-indigo-700">
                <h3 className="text-sm font-semibold text-indigo-900 dark:text-indigo-300 mb-4 flex items-center gap-2 uppercase tracking-wide">
                  <DollarSign className="w-4 h-4" />
                  III. Tài chính
                </h3>
                <div className="space-y-4">
                  <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm">
                    <div className="text-4xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">
                      {formatPrice(order.total_amount, order.currency_code)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Tổng tiền đơn hàng
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-white/50 dark:bg-gray-800/50 p-3 rounded-lg">
                      <div className="text-gray-600 dark:text-gray-400 mb-1">Số tiền</div>
                      <div className="font-mono font-bold text-gray-900 dark:text-white">
                        {order.total_amount.toLocaleString('vi-VN', { minimumFractionDigits: 4 })}
                      </div>
                    </div>
                    <div className="bg-white/50 dark:bg-gray-800/50 p-3 rounded-lg">
                      <div className="text-gray-600 dark:text-gray-400 mb-1">Mã tiền tệ</div>
                      <div className="font-mono font-bold text-gray-900 dark:text-white">{order.currency_code}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* V. Audit & Versioning */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2 uppercase tracking-wide">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  V. Audit & Versioning
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">Version:</span>
                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">v{order.version}</span>
                  </div>
                  <div className="flex justify-between items-start py-2 border-b border-gray-100 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">Tạo lúc:</span>
                    <span className="font-mono text-xs text-right text-gray-900 dark:text-white">{formatDate(order.created_at)}</span>
                  </div>
                  <div className="flex justify-between items-start py-2 border-b border-gray-100 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">Cập nhật lúc:</span>
                    <span className="font-mono text-xs text-right text-gray-900 dark:text-white">{formatDate(order.updated_at)}</span>
                  </div>
                  {order.deleted_at && (
                    <div className="flex justify-between items-start py-2">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">Xóa lúc:</span>
                      <span className="font-mono text-xs text-right text-red-600 dark:text-red-400">{formatDate(order.deleted_at)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-5">
              {/* IV. Package Snapshot - MOST IMPORTANT */}
              {order.package_snapshot && Object.keys(order.package_snapshot).length > 0 && (
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-xl p-5 shadow-lg border-2 border-blue-300 dark:border-blue-700">
                  <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-3 flex items-center gap-2 uppercase tracking-wide">
                    <Package className="w-5 h-5" />
                    IV. Package Snapshot (Bảo toàn giá & quyền lợi)
                  </h3>
                  
                  <div className="bg-blue-100/50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-3">
                    <div className="flex items-start gap-2 text-xs text-blue-800 dark:text-blue-300">
                      <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Snapshot này lưu trữ thông tin gói dịch vụ tại thời điểm đặt hàng</strong> để đảm bảo:
                        <ul className="mt-1 ml-4 list-disc space-y-0.5">
                          <li>Giá không thay đổi khi admin tăng giá</li>
                          <li>Quyền lợi không thay đổi khi gói được cập nhật</li>
                          <li>Lưu vết audit trail cho compliance</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <pre className="bg-white dark:bg-gray-900 p-4 rounded-lg text-xs overflow-x-auto border-2 border-blue-300 dark:border-blue-700 font-mono text-gray-900 dark:text-white max-h-96 overflow-y-auto shadow-inner">
                    {formatJSON(order.package_snapshot)}
                  </pre>
                </div>
              )}

              {/* Order Status Flow */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">
                  Luồng trạng thái đơn hàng
                </h3>
                <div className="space-y-3">
                  <div className={`flex items-center gap-3 p-3 rounded-lg transition-all ${order.status === 'PENDING' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400' : 'bg-gray-50 dark:bg-gray-900'}`}>
                    <div className={`w-4 h-4 rounded-full ${order.status === 'PENDING' ? 'bg-yellow-500 ring-4 ring-yellow-200' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                    <span className={`text-sm font-medium ${order.status === 'PENDING' ? 'text-yellow-900 dark:text-yellow-300' : 'text-gray-700 dark:text-gray-400'}`}>
                      PENDING - Chờ thanh toán
                    </span>
                  </div>
                  <div className={`flex items-center gap-3 p-3 rounded-lg transition-all ${order.status === 'PAID' ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-400' : 'bg-gray-50 dark:bg-gray-900'}`}>
                    <div className={`w-4 h-4 rounded-full ${order.status === 'PAID' ? 'bg-green-500 ring-4 ring-green-200' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                    <span className={`text-sm font-medium ${order.status === 'PAID' ? 'text-green-900 dark:text-green-300' : 'text-gray-700 dark:text-gray-400'}`}>
                      PAID - Đã thanh toán ✓
                    </span>
                  </div>
                  <div className={`flex items-center gap-3 p-3 rounded-lg transition-all ${order.status === 'CANCELLED' ? 'bg-gray-100 dark:bg-gray-700 border-2 border-gray-400' : 'bg-gray-50 dark:bg-gray-900'}`}>
                    <div className={`w-4 h-4 rounded-full ${order.status === 'CANCELLED' ? 'bg-gray-500 ring-4 ring-gray-200' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                    <span className={`text-sm font-medium ${order.status === 'CANCELLED' ? 'text-gray-900 dark:text-gray-300' : 'text-gray-700 dark:text-gray-400'}`}>
                      CANCELLED - Đã hủy
                    </span>
                  </div>
                  <div className={`flex items-center gap-3 p-3 rounded-lg transition-all ${order.status === 'FAILED' ? 'bg-red-50 dark:bg-red-900/20 border-2 border-red-400' : 'bg-gray-50 dark:bg-gray-900'}`}>
                    <div className={`w-4 h-4 rounded-full ${order.status === 'FAILED' ? 'bg-red-500 ring-4 ring-red-200' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                    <span className={`text-sm font-medium ${order.status === 'FAILED' ? 'text-red-900 dark:text-red-300' : 'text-gray-700 dark:text-gray-400'}`}>
                      FAILED - Thất bại
                    </span>
                  </div>
                </div>
              </div>

              {/* Database Schema Info */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-5 border border-purple-200 dark:border-purple-800">
                <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-300 mb-3 flex items-center gap-2 uppercase tracking-wide">
                  <Database className="w-4 h-4" />
                  Thông tin Database
                </h3>
                <div className="space-y-2 text-xs text-purple-800 dark:text-purple-300">
                  <div className="flex items-center gap-2">
                    <span className="font-mono bg-purple-100 dark:bg-purple-900/50 px-2 py-1 rounded">Table:</span>
                    <span className="font-semibold">subscription_orders</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono bg-purple-100 dark:bg-purple-900/50 px-2 py-1 rounded">PK:</span>
                    <span className="font-semibold">_id (UUID v7)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono bg-purple-100 dark:bg-purple-900/50 px-2 py-1 rounded">FKs:</span>
                    <span className="font-semibold">tenant_id, package_id</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono bg-purple-100 dark:bg-purple-900/50 px-2 py-1 rounded">Fields:</span>
                    <span className="font-semibold">12+ columns</span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-purple-200 dark:border-purple-800">
                    <p className="text-xs">
                      ✓ Optimistic Locking (version field)<br />
                      ✓ Soft Delete (deleted_at)<br />
                      ✓ Package Snapshot (JSONB)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Footer */}
        <div className="bg-white dark:bg-gray-800 px-6 py-4 flex justify-between items-center gap-3 border-t-2 border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            <span className="font-mono">ID: {order._id?.substring(0, 8)}...</span>
            <span className="mx-2">•</span>
            <span>Version: v{order.version}</span>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors font-medium"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}