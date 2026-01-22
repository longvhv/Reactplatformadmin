/**
 * Product Table Component
 * Display products in table format with actions
 * ✅ FIXED 2026-01-15: Using productsApi (correct schema)
 */

import React from 'react';
import { SaasProduct } from '../../api/saasProductsApi';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Edit2, Trash2, Star, Copy } from 'lucide-react';
import { useLanguage } from '../../providers/LanguageProvider';

interface ProductTableProps {
  products: SaasProduct[];
  onEdit?: (product: SaasProduct) => void;
  onDelete?: (product: SaasProduct) => void;
  onView?: (product: SaasProduct) => void;
  onDuplicate?: (product: SaasProduct) => void;
  onToggleFeatured?: (product: SaasProduct) => void;
  loading?: boolean;
}

export function ProductTable({
  products,
  onEdit,
  onDelete,
  onView,
  onDuplicate,
  onToggleFeatured,
  loading,
}: ProductTableProps) {
  const { t } = useLanguage();

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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">{t('products.noProducts')}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-900">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {t('products.product')}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {t('products.productType')}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {t('servicePackages.price')}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {t('servicePackages.billingCycle')}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {t('products.status')}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {t('common.actions')}
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {products.map((product) => (
            <tr 
              key={product._id} 
              className="hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer transition-colors"
              onClick={() => onView?.(product)}
            >
              <td className="px-4 py-4">
                <div className="flex items-center gap-2">
                  {product.is_featured && (
                    <Star className="w-4 h-4 fill-yellow-500 text-yellow-500 flex-shrink-0" />
                  )}
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left">
                      {product.name}
                    </div>
                    <div className="text-sm font-mono text-gray-500 dark:text-gray-400">
                      {product.code}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-4">
                {product.product_type_code ? (
                  <Badge variant="outline" className="text-xs">
                    {product.product_type_code}
                  </Badge>
                ) : (
                  <span className="text-sm text-gray-400">-</span>
                )}
              </td>
              <td className="px-4 py-4">
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  {formatPrice(product.base_price, product.currency)}
                </div>
              </td>
              <td className="px-4 py-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {getBillingCycleLabel(product.billing_cycle)}
                </span>
              </td>
              <td className="px-4 py-4">
                <Badge className={getStatusColor(product.status)}>
                  {product.status}
                </Badge>
              </td>
              <td className="px-4 py-4">
                <div className="flex gap-1">
                  {onEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(product);
                      }}
                      title="Chỉnh sửa"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  )}
                  {onDuplicate && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicate(product);
                      }}
                      title="Nhân bản"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  )}
                  {onToggleFeatured && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFeatured(product);
                      }}
                      title={product.is_featured ? 'Bỏ nổi bật' : 'Đánh dấu nổi bật'}
                    >
                      <Star className={`w-4 h-4 ${product.is_featured ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(product);
                      }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400"
                      title="Xóa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}