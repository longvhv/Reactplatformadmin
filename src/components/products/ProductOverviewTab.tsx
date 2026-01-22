/**
 * ProductOverviewTab - Product overview information
 * 
 * ✅ FIXED 2026-01-14: Updated to match new Product schema
 * ✅ MIGRATED: Now accepts SaasProduct from saasProductsApi
 */

import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Calendar, Clock, DollarSign, Tag, Package, TrendingUp, Award } from 'lucide-react';
import { SaasProduct } from '../../api/saasProductsApi';

interface ProductOverviewTabProps {
  productId: string;
  product: SaasProduct;
}

export function ProductOverviewTab({ productId, product }: ProductOverviewTabProps) {
  const getBillingCycleLabel = (cycle: string) => {
    const labels: Record<string, string> = {
      DAILY: 'Hàng ngày',
      WEEKLY: 'Hàng tuần',
      MONTHLY: 'Hàng tháng',
      QUARTERLY: 'Hàng quý',
      YEARLY: 'Hàng năm',
      LIFETIME: 'Trọn đời',
    };
    return labels[cycle] || cycle;
  };

  const getStatusBadge = (status: 'active' | 'inactive' | 'archived') => {
    const configs = {
      active: { color: 'bg-green-100 text-green-800', label: 'Hoạt động' },
      inactive: { color: 'bg-gray-100 text-gray-800', label: 'Tạm dừng' },
      archived: { color: 'bg-red-100 text-red-800', label: 'Lưu trữ' },
    };
    const config = configs[status] || configs.inactive;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Thông tin cơ bản
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 block">
              Tên sản phẩm
            </label>
            <p className="text-base text-gray-900 dark:text-white">{product.name}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 block">
              Mã sản phẩm
            </label>
            <p className="text-base font-mono text-gray-900 dark:text-white">{product.code}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 block">
              Loại sản phẩm
            </label>
            <Badge>{product.product_type_code || 'N/A'}</Badge>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 block">
              Giá cơ bản
            </label>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-gray-400" />
              <p className="text-base text-gray-900 dark:text-white">
                {product.base_price.toLocaleString('vi-VN')} {product.currency}
              </p>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 block">
              Chu kỳ thanh toán
            </label>
            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
              {getBillingCycleLabel(product.billing_cycle)}
            </Badge>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 block">
              Trạng thái
            </label>
            {getStatusBadge(product.status)}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 block">
              Thời gian dùng thử
            </label>
            <p className="text-base text-gray-900 dark:text-white">{product.trial_days} ngày</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 block">
              Thứ tự hiển thị
            </label>
            <p className="text-base text-gray-900 dark:text-white">{product.display_order}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 block">
              Sản phẩm nổi bật
            </label>
            <Badge className={product.is_featured ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}>
              {product.is_featured ? 'Có' : 'Không'}
            </Badge>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 block">
              Product ID
            </label>
            <p className="text-sm font-mono text-gray-600 dark:text-gray-400">{product._id}</p>
          </div>
        </div>

        {product.description && (
          <div className="mt-6">
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 block">
              Mô tả
            </label>
            <p className="text-base text-gray-700 dark:text-gray-300">{product.description}</p>
          </div>
        )}
      </Card>

      {/* Features */}
      {product.features && Object.keys(product.features).length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Award className="w-5 h-5" />
            Tính năng
          </h3>
          <div className="space-y-3">
            {Object.entries(product.features).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{key}</span>
                <code className="text-sm bg-white dark:bg-gray-800 px-3 py-1 rounded border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">
                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </code>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Limits */}
      {product.limits && Object.keys(product.limits).length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Giới hạn
          </h3>
          <div className="space-y-3">
            {Object.entries(product.limits).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{key}</span>
                <code className="text-sm bg-white dark:bg-gray-800 px-3 py-1 rounded border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">
                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </code>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Timestamps */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Thông tin hệ thống
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Ngày tạo</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {new Date(product.created_at).toLocaleString('vi-VN')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Cập nhật lần cuối</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {new Date(product.updated_at).toLocaleString('vi-VN')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Tag className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Version</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">v{product.version}</p>
            </div>
          </div>

          {product.created_by && (
            <div className="flex items-start gap-3">
              <Tag className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Tạo bởi</p>
                <p className="text-sm font-mono text-gray-600 dark:text-gray-400">{product.created_by}</p>
              </div>
            </div>
          )}

          {product.updated_by && (
            <div className="flex items-start gap-3">
              <Tag className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Cập nhật bởi</p>
                <p className="text-sm font-mono text-gray-600 dark:text-gray-400">{product.updated_by}</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Metadata */}
      {product.metadata && Object.keys(product.metadata).length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Metadata</h3>
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
            <pre className="text-sm text-gray-900 dark:text-white overflow-x-auto">
              {JSON.stringify(product.metadata, null, 2)}
            </pre>
          </div>
        </Card>
      )}
    </div>
  );
}