/**
 * Product Detail Modal
 * Comprehensive modal for viewing full product details
 */

import React from 'react';
import { SaaSProduct } from '../../api/saasProductApi';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  X,
  Star,
  Calendar,
  DollarSign,
  Clock,
  Tag,
  Package,
  CheckCircle2,
  AlertCircle,
  Settings,
  Users,
  Database,
  Zap,
  Copy,
  Edit2,
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { useNavigate } from 'react-router-dom';

interface ProductDetailModalProps {
  product: SaaSProduct;
  isOpen: boolean;
  onClose: () => void;
}

export function ProductDetailModal({ product, isOpen, onClose }: ProductDetailModalProps) {
  const navigate = useNavigate();

  if (!isOpen) return null;

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

  const getBillingCycleLabel = (cycle: string) => {
    const labels: Record<string, string> = {
      DAILY: 'Ngày',
      WEEKLY: 'Tuần',
      MONTHLY: 'Tháng',
      QUARTERLY: 'Quý',
      YEARLY: 'Năm',
      LIFETIME: 'Trọn đời',
    };
    return labels[cycle] || cycle;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      case 'archived':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'inactive':
        return <AlertCircle className="w-4 h-4" />;
      case 'archived':
        return <X className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Đã sao chép ${label}`);
  };

  const handleEdit = () => {
    onClose();
    navigate(`/core/products/edit/${product._id}`);
  };

  const renderFeatures = () => {
    if (!product.features || Object.keys(product.features).length === 0) {
      return <p className="text-sm text-gray-500 dark:text-gray-400">Chưa có tính năng nào</p>;
    }

    return (
      <div className="space-y-2">
        {Object.entries(product.features).map(([key, value]) => (
          <div
            key={key}
            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
          >
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
              </span>
            </div>
            <Badge variant={value ? 'default' : 'outline'}>
              {typeof value === 'boolean' ? (value ? 'Có' : 'Không') : String(value)}
            </Badge>
          </div>
        ))}
      </div>
    );
  };

  const renderLimits = () => {
    if (!product.limits || Object.keys(product.limits).length === 0) {
      return <p className="text-sm text-gray-500 dark:text-gray-400">Không giới hạn</p>;
    }

    return (
      <div className="space-y-2">
        {Object.entries(product.limits).map(([key, value]) => {
          const numValue = Number(value);
          const displayValue = numValue === -1 ? 'Không giới hạn' : String(value);
          
          return (
            <div
              key={key}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                </span>
              </div>
              <Badge variant="outline" className="font-mono">
                {displayValue}
              </Badge>
            </div>
          );
        })}
      </div>
    );
  };

  const renderMetadata = () => {
    if (!product.metadata || Object.keys(product.metadata).length === 0) {
      return <p className="text-sm text-gray-500 dark:text-gray-400">Không có metadata</p>;
    }

    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <pre className="text-xs text-gray-700 dark:text-gray-300 overflow-x-auto">
          {JSON.stringify(product.metadata, null, 2)}
        </pre>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {product.name}
              </h2>
              {product.is_featured && (
                <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                  <Star className="w-3 h-3 mr-1 fill-current" />
                  Featured
                </Badge>
              )}
              <Badge className={getStatusColor(product.status)}>
                {getStatusIcon(product.status)}
                <span className="ml-1 capitalize">{product.status}</span>
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <code className="text-sm font-mono text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                {product.code}
              </code>
              <button
                onClick={() => copyToClipboard(product.code, 'mã sản phẩm')}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleEdit}>
              <Edit2 className="w-4 h-4 mr-2" />
              Chỉnh sửa
            </Button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-6 space-y-6">
          {/* Description */}
          {product.description && (
            <div>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {product.description}
              </p>
            </div>
          )}

          {/* Product Type */}
          {product.product_type_code && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Loại sản phẩm
                </h3>
              </div>
              <Badge variant="outline" className="font-mono">
                {product.product_type_code}
              </Badge>
            </div>
          )}

          {/* Pricing Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Base Price */}
            <div className="p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Giá cơ bản
                </p>
              </div>
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {formatPrice(product.base_price, product.currency)}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {product.currency}
              </p>
            </div>

            {/* Billing Cycle */}
            <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Chu kỳ thanh toán
                </p>
              </div>
              <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                {getBillingCycleLabel(product.billing_cycle)}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {product.billing_cycle}
              </p>
            </div>

            {/* Trial Days */}
            <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-green-600 dark:text-green-400" />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Dùng thử miễn phí
                </p>
              </div>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">
                {product.trial_days > 0 ? `${product.trial_days} ngày` : 'Không có'}
              </p>
              {product.trial_days > 0 && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Miễn phí hoàn toàn
                </p>
              )}
            </div>
          </div>

          {/* Features Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Tính năng
              </h3>
            </div>
            {renderFeatures()}
          </div>

          {/* Limits Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Database className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Giới hạn
              </h3>
            </div>
            {renderLimits()}
          </div>

          {/* Display Settings */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Cài đặt hiển thị
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Thứ tự hiển thị
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {product.display_order}
                </p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Sản phẩm nổi bật
                </p>
                <Badge variant={product.is_featured ? 'default' : 'outline'}>
                  {product.is_featured ? 'Có' : 'Không'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Metadata */}
          {product.metadata && Object.keys(product.metadata).length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Tag className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Metadata
                </h3>
              </div>
              {renderMetadata()}
            </div>
          )}

          {/* System Information */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Thông tin hệ thống
              </h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-600 dark:text-gray-400 mb-1">ID</p>
                <div className="flex items-center gap-1">
                  <code className="text-xs font-mono text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded break-all">
                    {product._id?.substring(0, 8)}...
                  </code>
                  <button
                    onClick={() => copyToClipboard(product._id || '', 'ID')}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400 mb-1">Version</p>
                <Badge variant="outline" className="font-mono">
                  v{product.version}
                </Badge>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400 mb-1">Ngày tạo</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {product.created_at
                    ? new Date(product.created_at).toLocaleDateString('vi-VN')
                    : '-'}
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400 mb-1">Cập nhật</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {product.updated_at
                    ? new Date(product.updated_at).toLocaleDateString('vi-VN')
                    : '-'}
                </p>
              </div>
            </div>

            {/* Created/Updated By */}
            {(product.created_by || product.updated_by) && (
              <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                {product.created_by && (
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 mb-1">Người tạo</p>
                    <code className="text-xs font-mono text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                      {product.created_by.substring(0, 8)}...
                    </code>
                  </div>
                )}
                {product.updated_by && (
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 mb-1">Người cập nhật</p>
                    <code className="text-xs font-mono text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                      {product.updated_by.substring(0, 8)}...
                    </code>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
