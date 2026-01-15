/**
 * Package Detail Modal Component
 * Displays complete information about a service package
 * Follows design patterns from ProductDetailModal
 */

import React from 'react';
import { X, Package, DollarSign, Settings, Users, Database, Calendar, Info, Eye, EyeOff, ArrowUpCircle, Shield } from 'lucide-react';
import { Package as ServicePackage } from '../../api/packagesApi';

interface PackageDetailModalProps {
  package: ServicePackage | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PackageDetailModal({ package: pkg, isOpen, onClose }: PackageDetailModalProps) {
  if (!isOpen || !pkg) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price: number, currency: string) => {
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

  const formatJSON = (obj: any) => {
    if (!obj || Object.keys(obj).length === 0) return null;
    return JSON.stringify(obj, null, 2);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'INACTIVE':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'ARCHIVED':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getBillingCycleLabel = (cycle?: string) => {
    const labels: Record<string, string> = {
      DAILY: 'Hàng ngày',
      WEEKLY: 'Hàng tuần',
      MONTHLY: 'Hàng tháng',
      QUARTERLY: 'Hàng quý',
      YEARLY: 'Hàng năm',
      LIFETIME: 'Trọn đời',
    };
    return labels[cycle || 'MONTHLY'] || cycle || 'Hàng tháng';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6" />
            <div>
              <h2 className="text-xl font-bold">{pkg.name}</h2>
              <p className="text-sm opacity-90 font-mono">{pkg.code}</p>
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

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* I. Định danh & Liên kết */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  I. Định danh & Liên kết
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Package ID:</span>
                    <span className="font-mono text-xs text-gray-900 dark:text-white">{pkg._id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Product ID:</span>
                    <span className="font-mono text-xs text-gray-900 dark:text-white">{pkg.saas_product_id}</span>
                  </div>
                  {pkg.product_name && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Sản phẩm:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{pkg.product_name}</span>
                    </div>
                  )}
                  {pkg.product_code && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Mã sản phẩm:</span>
                      <span className="font-mono text-xs text-gray-900 dark:text-white">{pkg.product_code}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* II. Thông tin thương mại */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  II. Thông tin thương mại
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Mã gói:</span>
                    <span className="font-mono text-gray-900 dark:text-white">{pkg.code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Tên gói:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{pkg.name}</span>
                  </div>
                  {pkg.description && (
                    <div className="pt-2">
                      <span className="text-gray-600 dark:text-gray-400 block mb-1">Mô tả:</span>
                      <p className="text-gray-900 dark:text-white text-sm leading-relaxed bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
                        {pkg.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* III. Tài chính (Pricing) */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg p-4 border border-indigo-200 dark:border-indigo-800">
                <h3 className="text-sm font-semibold text-indigo-900 dark:text-indigo-300 mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  III. Tài chính (Pricing)
                </h3>
                <div className="space-y-3">
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                    <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                      {formatPrice(pkg.price_amount, pkg.currency_code)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {getBillingCycleLabel(pkg.billing_cycle)}
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Số tiền:</span>
                    <span className="font-mono text-gray-900 dark:text-white">{pkg.price_amount.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Mã tiền tệ:</span>
                    <span className="font-mono text-gray-900 dark:text-white">{pkg.currency_code}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Chu kỳ thanh toán:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{getBillingCycleLabel(pkg.billing_cycle)}</span>
                  </div>
                  {pkg.trial_days !== undefined && pkg.trial_days > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Dùng thử miễn phí:</span>
                      <span className="font-medium text-green-600 dark:text-green-400">{pkg.trial_days} ngày</span>
                    </div>
                  )}
                </div>
              </div>

              {/* V. Trạng thái vận hành */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  V. Trạng thái vận hành
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Trạng thái:</span>
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(pkg.status)}`}>
                      {pkg.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Hiển thị công khai:</span>
                    <div className="flex items-center gap-2">
                      {pkg.is_public ? (
                        <>
                          <Eye className="w-4 h-4 text-green-600 dark:text-green-400" />
                          <span className="text-green-600 dark:text-green-400 font-medium">Công khai</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          <span className="text-gray-600 dark:text-gray-400 font-medium">Riêng tư</span>
                        </>
                      )}
                    </div>
                  </div>
                  {pkg.display_order !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Thứ tự hiển thị:</span>
                      <span className="font-medium text-gray-900 dark:text-white">#{pkg.display_order}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* VII. Resource Limits */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  VII. Giới hạn tài nguyên
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Số người dùng tối đa:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {pkg.max_users ? pkg.max_users.toLocaleString() : 'Không giới hạn'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Dung lượng tối đa:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {pkg.max_storage ? `${pkg.max_storage} GB` : 'Không giới hạn'}
                    </span>
                  </div>
                </div>
              </div>

              {/* IV. Cấu hình quyền hạn (Entitlements) */}
              {pkg.entitlements_config && Object.keys(pkg.entitlements_config).length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                  <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    IV. Cấu hình quyền hạn (Entitlements)
                  </h3>
                  <pre className="bg-white dark:bg-gray-800 p-3 rounded text-xs overflow-x-auto border border-blue-200 dark:border-blue-700 font-mono text-gray-900 dark:text-white max-h-64 overflow-y-auto">
                    {formatJSON(pkg.entitlements_config)}
                  </pre>
                </div>
              )}

              {/* VIII. Features */}
              {pkg.features && Object.keys(pkg.features).length > 0 && (
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                  <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-300 mb-3 flex items-center gap-2">
                    <ArrowUpCircle className="w-4 h-4" />
                    VIII. Tính năng nổi bật (Features)
                  </h3>
                  <pre className="bg-white dark:bg-gray-800 p-3 rounded text-xs overflow-x-auto border border-purple-200 dark:border-purple-700 font-mono text-gray-900 dark:text-white max-h-48 overflow-y-auto">
                    {formatJSON(pkg.features)}
                  </pre>
                </div>
              )}

              {/* VIII. Metadata */}
              {pkg.metadata && Object.keys(pkg.metadata).length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    VIII. Metadata (Dữ liệu bổ sung)
                  </h3>
                  <pre className="bg-white dark:bg-gray-800 p-3 rounded text-xs overflow-x-auto border border-gray-200 dark:border-gray-700 font-mono text-gray-900 dark:text-white max-h-48 overflow-y-auto">
                    {formatJSON(pkg.metadata)}
                  </pre>
                </div>
              )}

              {/* IX. Audit & Versioning */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  IX. Audit & Versioning
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Version:</span>
                    <span className="font-mono text-gray-900 dark:text-white">v{pkg.version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Tạo lúc:</span>
                    <span className="font-mono text-xs text-gray-900 dark:text-white">{formatDate(pkg.created_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Cập nhật lúc:</span>
                    <span className="font-mono text-xs text-gray-900 dark:text-white">{formatDate(pkg.updated_at)}</span>
                  </div>
                  {pkg.deleted_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Xóa lúc:</span>
                      <span className="font-mono text-xs text-red-600 dark:text-red-400">{formatDate(pkg.deleted_at)}</span>
                    </div>
                  )}
                  {pkg.created_by && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Tạo bởi:</span>
                      <span className="font-mono text-xs text-gray-900 dark:text-white">{pkg.created_by}</span>
                    </div>
                  )}
                  {pkg.updated_by && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Cập nhật bởi:</span>
                      <span className="font-mono text-xs text-gray-900 dark:text-white">{pkg.updated_by}</span>
                    </div>
                  )}
                  {pkg.deleted_by && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Xóa bởi:</span>
                      <span className="font-mono text-xs text-red-600 dark:text-red-400">{pkg.deleted_by}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 flex justify-end gap-3 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}