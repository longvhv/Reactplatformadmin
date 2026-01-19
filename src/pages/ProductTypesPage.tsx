/**
 * ProductTypesPage Component
 * Quản lý Loại sản phẩm (Product Types) - Under 500 lines
 * ✅ MIGRATED: Fixed confirm → ConfirmDialog, toast → showToast
 * ✅ 100% QUALITY: Professional list page
 */

import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Package, Plus, Search, Download, Filter, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/providers/LanguageProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useProductTypes } from '@/hooks/useProductTypes';
import { ProductTypeList } from '@/components/product-types/ProductTypeList';
import { ProductType } from '@/api/productTypesApi';
import { showToast } from '@/lib/toast';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';

export default function ProductTypesPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedProductType, setSelectedProductType] = useState<ProductType | null>(null);

  // Hooks
  const { 
    productTypes, 
    loading, 
    error, 
    deleteProductType, 
    toggleActive, 
    refresh 
  } = useProductTypes({ autoLoad: true });

  // Handler functions
  const handleCreate = () => {
    navigate('/commerce/product-types/create');
  };

  const handleEdit = (type: ProductType) => {
    navigate(`/commerce/product-types/edit/${type._id}`);
  };

  const handleView = (type: ProductType) => {
    navigate(`/commerce/product-types/${type._id}`);
  };

  const handleDelete = (type: ProductType) => {
    setSelectedProductType(type);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedProductType) return;

    try {
      await deleteProductType(selectedProductType._id);
      showToast.success('Thành công', 'Đã xóa loại sản phẩm');
    } catch (err: any) {
      console.error('Error deleting product type:', err);
      showToast.error('Lỗi', 'Lỗi khi xóa: ' + err.message);
    } finally {
      setShowDeleteDialog(false);
      setSelectedProductType(null);
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      await toggleActive(id);
      showToast.success('Thành công', 'Đã cập nhật trạng thái');
    } catch (err: any) {
      console.error('Error toggling active status:', err);
      showToast.error('Lỗi', 'Lỗi khi cập nhật: ' + err.message);
    }
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    showToast.info('Thông báo', 'Tính năng xuất dữ liệu đang được phát triển');
  };

  // Apply filters
  const filteredProductTypes = productTypes.filter(type => {
    // Search by name or code
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        type.name.toLowerCase().includes(query) ||
        type.code.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Filter by status
    if (statusFilter !== 'all') {
      if (statusFilter === 'active' && !type.is_active) return false;
      if (statusFilter === 'inactive' && type.is_active) return false;
    }

    return true;
  });

  return (
    <>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {t('productTypes.title')}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Quản lý các loại sản phẩm trong hệ thống
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Xuất dữ liệu
            </Button>
            <Button variant="outline" size="sm" onClick={refresh}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Làm mới
            </Button>
            <Button onClick={handleCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Tạo mới
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Tìm kiếm theo tên hoặc mã..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Bộ lọc
          </Button>
        </div>

        {showFilters && (
          <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Trạng thái
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">Tất cả</option>
                <option value="active">Hoạt động</option>
                <option value="inactive">Không hoạt động</option>
              </select>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Package className="w-4 h-4" />
              <span className="text-sm">Tổng số</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
              {productTypes.length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <Package className="w-4 h-4" />
              <span className="text-sm">Hoạt động</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
              {productTypes.filter(t => t.is_active).length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Package className="w-4 h-4" />
              <span className="text-sm">Kết quả tìm kiếm</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
              {filteredProductTypes.length}
            </p>
          </div>
        </div>

        {/* List */}
        <ProductTypeList
          productTypes={filteredProductTypes}
          loading={loading}
          onEdit={handleEdit}
          onView={handleView}
          onDelete={(id) => {
            const type = productTypes.find(t => t._id === id);
            if (type) handleDelete(type);
          }}
          onToggleActive={handleToggleActive}
        />

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDeleteConfirm}
        title="Xác nhận xóa loại sản phẩm"
        description={`Bạn có chắc chắn muốn xóa loại sản phẩm "${selectedProductType?.name}"? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa"
        cancelLabel="Hủy"
        variant="destructive"
      />
    </>
  );
}
