/**
 * Product Card Component
 * Display product info in card format
 * ✅ FIXED 2026-01-15: Using productsApi (correct schema)
 */

import React from 'react';
import { SaasProduct } from '../../api/saasProductsApi';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Edit2, Trash2, Star, Copy, Eye } from 'lucide-react';

interface ProductCardProps {
  product: SaasProduct;
  onEdit?: (product: SaasProduct) => void;
  onDelete?: (product: SaasProduct) => void;
  onViewDetails?: (product: SaasProduct) => void;
  onDuplicate?: (product: SaasProduct) => void;
  onToggleFeatured?: (product: SaasProduct) => void;
}

export function ProductCard({
  product,
  onEdit,
  onDelete,
  onViewDetails,
  onDuplicate,
  onToggleFeatured,
}: ProductCardProps) {
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

  return (
    <div className="group relative bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow">
      {/* Featured Badge */}
      {product.is_featured && (
        <div className="absolute top-4 right-4">
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
            <Star className="w-3 h-3 mr-1" />
            Featured
          </Badge>
        </div>
      )}

      {/* Product Type */}
      {product.product_type_code && (
        <div className="mb-2">
          <Badge variant="outline" className="text-xs">
            {product.product_type_code}
          </Badge>
        </div>
      )}

      {/* Product Name & Code */}
      <div className="mb-3">
        <button
          onClick={() => onViewDetails?.(product)}
          className="text-lg font-semibold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left mb-1 w-full"
        >
          {product.name}
        </button>
        <p className="text-sm font-mono text-gray-500 dark:text-gray-400">
          {product.code}
        </p>
      </div>

      {/* Description */}
      {product.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
          {product.description}
        </p>
      )}

      {/* Price & Billing */}
      <div className="mb-4">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            {formatPrice(product.base_price, product.currency)}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            / {getBillingCycleLabel(product.billing_cycle)}
          </span>
        </div>
        {product.trial_days > 0 && (
          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
            Dùng thử {product.trial_days} ngày miễn phí
          </p>
        )}
      </div>

      {/* Status */}
      <div className="mb-4">
        <Badge className={getStatusColor(product.status)}>
          {product.status}
        </Badge>
      </div>

      {/* Features Preview */}
      {product.features && Object.keys(product.features).length > 0 && (
        <div className="mb-4 text-xs text-gray-500 dark:text-gray-400">
          {Object.keys(product.features).length} tính năng
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {onViewDetails && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewDetails(product)}
            className="flex-1"
          >
            <Eye className="w-4 h-4 mr-1" />
            Xem
          </Button>
        )}
        {onEdit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(product)}
          >
            <Edit2 className="w-4 h-4" />
          </Button>
        )}
        {onDuplicate && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDuplicate(product)}
          >
            <Copy className="w-4 h-4" />
          </Button>
        )}
        {onToggleFeatured && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleFeatured(product)}
          >
            <Star className={`w-4 h-4 ${product.is_featured ? 'fill-yellow-500 text-yellow-500' : ''}`} />
          </Button>
        )}
        {onDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(product)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}