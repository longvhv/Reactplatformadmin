/**
 * ProductDetailPage Component
 * Main detail page for product with tabbed navigation
 * 
 * ✅ FIXED 2026-01-14: Updated to use 'status' field instead of 'is_active'
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import {
  ArrowLeft,
  Package,
  Edit,
  Trash2,
  Power,
  Copy,
  MoreVertical,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Import tabs
import { ProductOverviewTab } from '@/components/products/ProductOverviewTab';
import { ProductStatsTab } from '@/components/products/ProductStatsTab';
import { ProductPackagesTab } from '@/components/products/ProductPackagesTab';
import { ProductRevenueTab } from '@/components/products/ProductRevenueTab';

// Import API hooks
import { useProduct, useProductMutations, Product } from '@/api/productsApi';
import { productsApi } from '@/api/productsApi';

import { toast } from 'react-toastify';

function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Fetch product data
  const { product, loading, error, refresh } = useProduct(id);

  const { updateProduct, deleteProduct: deleteProductMutation } = useProductMutations();
  const [activeTab, setActiveTab] = useState('overview');

  const handleToggleStatus = async () => {
    if (!product) return;

    const newStatus = product.status === 'active' ? 'inactive' : 'active';
    if (!confirm(`Bạn có chắc muốn ${newStatus === 'active' ? 'kích hoạt' : 'tắt'} sản phẩm này?`)) {
      return;
    }

    try {
      await updateProduct(id!, { status: newStatus, version: product.version });
      await refresh();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Không thể cập nhật trạng thái. Vui lòng thử lại.');
    }
  };

  const handleDuplicate = async () => {
    if (!product) return;

    const newCode = prompt('Nhập mã sản phẩm mới:', `${product.code}-copy`);
    if (!newCode) return;

    const newName = prompt('Nhập tên sản phẩm mới:', `${product.name} (Copy)`);
    if (!newName) return;

    try {
      const newProduct = await productsApi.create({
        tenant_id: product.tenant_id,
        code: newCode,
        name: newName,
        description: product.description,
        product_type_code: product.product_type_code,
        base_price: product.base_price,
        currency: product.currency,
        billing_cycle: product.billing_cycle,
        trial_days: product.trial_days,
        features: product.features,
        limits: product.limits,
        status: product.status,
        is_featured: false,
        display_order: product.display_order,
        metadata: product.metadata,
      });
      navigate(`/core/products/${newProduct._id}`);
    } catch (error) {
      console.error('Error duplicating product:', error);
      alert('Không thể nhân bản sản phẩm. Vui lòng thử lại.');
    }
  };

  const handleDelete = async () => {
    if (!product) return;

    if (
      !confirm(
        `Bạn có chắc muốn xóa sản phẩm "${product.name}"? Hành động này không thể hoàn tác.`
      )
    ) {
      return;
    }

    try {
      await deleteProductMutation(id!);
      navigate('/core/products');
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Không thể xóa sản phẩm. Vui lòng thử lại.');
    }
  };

  const getProductTypeLabel = (typeCode?: string) => {
    if (!typeCode) return 'N/A';
    
    const typeLabels: Record<string, string> = {
      'app': 'Application',
      'domain': 'Domain',
      'ssl': 'SSL Certificate',
      'service': 'Service',
    };
    
    return typeLabels[typeCode.toLowerCase()] || typeCode;
  };

  const getProductTypeBadge = (typeCode?: string) => {
    if (!typeCode) return <Badge className="bg-gray-100 text-gray-800">N/A</Badge>;
    
    const configs: Record<string, { color: string; label: string }> = {
      'app': { color: 'bg-blue-100 text-blue-800', label: 'Application' },
      'domain': { color: 'bg-purple-100 text-purple-800', label: 'Domain' },
      'ssl': { color: 'bg-green-100 text-green-800', label: 'SSL Certificate' },
      'service': { color: 'bg-orange-100 text-orange-800', label: 'Service' },
    };

    const config = configs[typeCode.toLowerCase()] || { color: 'bg-gray-100 text-gray-800', label: typeCode };
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getStatusBadge = (status: 'active' | 'inactive' | 'archived') => {
    const configs = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      archived: 'bg-red-100 text-red-800',
    };
    return configs[status] || configs.inactive;
  };

  const getStatusLabel = (status: 'active' | 'inactive' | 'archived') => {
    const labels = {
      active: 'Hoạt động',
      inactive: 'Tạm dừng',
      archived: 'Lưu trữ',
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Package className="w-16 h-16 text-red-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Lỗi khi tải sản phẩm
        </h2>
        <p className="text-red-600 mb-4">
          {error}
        </p>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/core/products')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại danh sách
          </Button>
          <Button onClick={refresh}>
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Package className="w-16 h-16 text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Không tìm thấy sản phẩm
        </h2>
        <p className="text-gray-600 mb-4">
          Sản phẩm với ID "{id}" không tồn tại hoặc đã bị xóa.
        </p>
        <Button onClick={() => navigate('/core/products')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/core/products')}
              className="text-gray-600"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleToggleStatus}
                className={
                  product.status === 'active'
                    ? 'text-orange-600 border-orange-300'
                    : 'text-green-600 border-green-300'
                }
              >
                <Power className="w-4 h-4 mr-2" />
                {product.status === 'active' ? 'Tắt' : 'Kích hoạt'}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate(`/core/products/edit/${id}`)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Chỉnh sửa
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDuplicate}>
                    <Copy className="w-4 h-4 mr-2" />
                    Nhân bản
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Xóa
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 rounded-lg bg-indigo-100 flex items-center justify-center">
                <Package className="w-8 h-8 text-indigo-600" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900 truncate">
                  {product.name}
                </h1>
                {getProductTypeBadge(product.product_type_code)}
                <Badge
                  className={
                    getStatusBadge(product.status)
                  }
                >
                  {getStatusLabel(product.status)}
                </Badge>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="font-mono">{product.code}</span>
                <span>•</span>
                <span>
                  {product.base_price.toLocaleString('vi-VN')} {product.currency}
                </span>
                <span>•</span>
                <span>ID: {product._id}</span>
              </div>

              {product.description && (
                <p className="mt-2 text-sm text-gray-700 line-clamp-2">
                  {product.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Tổng quan</TabsTrigger>
            <TabsTrigger value="stats">Thống kê</TabsTrigger>
            <TabsTrigger value="packages">Gói dịch vụ</TabsTrigger>
            <TabsTrigger value="revenue">Doanh thu</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <ProductOverviewTab productId={id!} product={product} />
          </TabsContent>

          <TabsContent value="stats">
            <ProductStatsTab productId={id!} />
          </TabsContent>

          <TabsContent value="packages">
            <ProductPackagesTab productId={id!} />
          </TabsContent>

          <TabsContent value="revenue">
            <ProductRevenueTab productId={id!} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export { ProductDetailPage };
export default ProductDetailPage;