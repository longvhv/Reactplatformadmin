/**
 * Product Detail Page
 * View detailed information of a product
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { saasProductApi, SaaSProduct } from '../api/saasProductApi';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ArrowLeft, Edit2, Trash2, Star, Copy } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<SaaSProduct | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      loadProduct();
    }
  }, [id]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const data = await saasProductApi.getById(id!);
      setProduct(data);
    } catch (error: any) {
      toast.error('Không thể tải thông tin sản phẩm: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!product) return;
    if (!confirm(`Bạn có chắc muốn xóa sản phẩm "${product.name}"?`)) return;

    try {
      await saasProductApi.softDelete(product._id!);
      toast.success('Đã xóa sản phẩm');
      navigate('/products');
    } catch (error: any) {
      toast.error('Không thể xóa: ' + error.message);
    }
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
      <div className="p-6 flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">Không tìm thấy sản phẩm</p>
          <Button onClick={() => navigate('/core/products')} className="mt-4">
            Quay lại danh sách
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={() => navigate('/core/products')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/core/products/edit/${product._id}`)}>
            <Edit2 className="w-4 h-4 mr-2" />
            Chỉnh sửa
          </Button>
          <Button variant="outline" onClick={handleDelete} className="text-red-600 hover:text-red-700">
            <Trash2 className="w-4 h-4 mr-2" />
            Xóa
          </Button>
        </div>
      </div>

      {/* Product Info Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
        {/* Title & Badges */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {product.name}
              </h1>
              {product.is_featured && (
                <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                  <Star className="w-3 h-3 mr-1 fill-current" />
                  Featured
                </Badge>
              )}
            </div>
            <p className="text-sm font-mono text-gray-500 dark:text-gray-400">
              {product.code}
            </p>
          </div>
          <Badge className={getStatusColor(product.status)}>
            {product.status}
          </Badge>
        </div>

        {/* Description */}
        {product.description && (
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            {product.description}
          </p>
        )}

        {/* Product Type */}
        {product.product_type_code && (
          <div className="mb-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Loại sản phẩm</p>
            <Badge variant="outline">{product.product_type_code}</Badge>
          </div>
        )}

        {/* Pricing Info */}
        <div className="grid grid-cols-3 gap-6 mb-8 p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Giá</p>
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {formatPrice(product.base_price, product.currency)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Chu kỳ thanh toán</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {getBillingCycleLabel(product.billing_cycle)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Dùng thử miễn phí</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {product.trial_days > 0 ? `${product.trial_days} ngày` : 'Không có'}
            </p>
          </div>
        </div>

        {/* Features */}
        {product.features && Object.keys(product.features).length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Tính năng
            </h2>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <pre className="text-sm text-gray-700 dark:text-gray-300 overflow-x-auto">
                {JSON.stringify(product.features, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Limits */}
        {product.limits && Object.keys(product.limits).length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Giới hạn
            </h2>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <pre className="text-sm text-gray-700 dark:text-gray-300 overflow-x-auto">
                {JSON.stringify(product.limits, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-6 text-sm text-gray-600 dark:text-gray-400 pt-6 border-t dark:border-gray-700">
          <div>
            <p className="mb-1">Thứ tự hiển thị</p>
            <p className="font-semibold text-gray-900 dark:text-white">{product.display_order}</p>
          </div>
          <div>
            <p className="mb-1">Version</p>
            <p className="font-semibold text-gray-900 dark:text-white">{product.version}</p>
          </div>
          <div>
            <p className="mb-1">Ngày tạo</p>
            <p className="font-semibold text-gray-900 dark:text-white">
              {product.created_at ? new Date(product.created_at).toLocaleString('vi-VN') : '-'}
            </p>
          </div>
          <div>
            <p className="mb-1">Cập nhật lần cuối</p>
            <p className="font-semibold text-gray-900 dark:text-white">
              {product.updated_at ? new Date(product.updated_at).toLocaleString('vi-VN') : '-'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}