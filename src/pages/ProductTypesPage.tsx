/**
 * ProductTypesPage Component
 * Quản lý Loại sản phẩm (Product Types) - Under 500 lines
 * ✅ CREATED 2026-01-15: Theo chuẩn design system
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
import { toast } from 'sonner@2.0.3';

export default function ProductTypesPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showFilters, setShowFilters] = useState(false);

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
    navigate('/core/product-types/new');
  };

  const handleEdit = (type: ProductType) => {
    navigate(`/core/product-types/${type._id}/edit`);
  };

  const handleView = (type: ProductType) => {
    navigate(`/core/product-types/${type._id}`);
  };

  const handleDelete = async (id: string) => {
    const type = productTypes.find(t => t._id === id);
    if (!confirm(`Bạn có chắc muốn xóa loại sản phẩm "${type?.name}"?`)) return;
    
    try {
      await deleteProductType(id);
      toast.success('Đã xóa loại sản phẩm');
    } catch (err: any) {
      console.error('Error deleting product type:', err);
      toast.error('Lỗi khi xóa: ' + err.message);
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      await toggleActive(id);
      toast.success('Đã cập nhật trạng thái');
    } catch (err: any) {
      console.error('Error toggling active status:', err);
      toast.error('Lỗi khi cập nhật: ' + err.message);
    }
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    toast.info('Tính năng xuất dữ liệu đang được phát triển');
  };

  // Apply filters
  const filteredProductTypes = productTypes.filter(type => {
    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const codeMatch = type.code.toLowerCase().includes(query);
      const nameMatch = type.name.toLowerCase().includes(query);
      const descMatch = type.description?.toLowerCase().includes(query);
      if (!codeMatch && !nameMatch && !descMatch) return false;
    }

    // Status filter
    if (statusFilter === 'active' && !type.is_active) return false;
    if (statusFilter === 'inactive' && type.is_active) return false;

    return true;
  });

  // Stats
  const stats = {
    total: productTypes.length,
    active: productTypes.filter(t => t.is_active).length,
    inactive: productTypes.filter(t => !t.is_active).length,
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-lg">
                <Package className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Quản lý Loại sản phẩm
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Quản lý các loại sản phẩm trong hệ thống
                </p>
              </div>
            </div>
            <Button onClick={handleCreate} className="gap-2">
              <Plus className="w-4 h-4" />
              Thêm loại sản phẩm
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">Tổng số</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.total}
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <div className="text-sm text-green-600 dark:text-green-400">Đang hoạt động</div>
              <div className="text-2xl font-bold text-green-700 dark:text-green-300 mt-1">
                {stats.active}
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">Không hoạt động</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.inactive}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Tìm kiếm theo mã, tên, mô tả..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Không hoạt động</option>
            </select>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button onClick={() => setShowFilters(!showFilters)} variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                Bộ lọc
              </Button>
              <Button onClick={refresh} variant="outline" size="sm" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Làm mới
              </Button>
              <Button onClick={handleExport} variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Xuất
              </Button>
            </div>
          </div>

          {/* Extended Filters (collapsed by default) */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                    Lọc theo prefix
                  </label>
                  <Input placeholder="VD: SAAS_, PHYS_" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                    Sắp xếp theo
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                    <option>Tên (A-Z)</option>
                    <option>Mã (A-Z)</option>
                    <option>Ngày tạo (mới nhất)</option>
                    <option>Ngày tạo (cũ nhất)</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-800 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Product Types List */}
        <ProductTypeList
          productTypes={filteredProductTypes}
          loading={loading}
          onAdd={handleCreate}
          onEdit={handleEdit}
          onView={handleView}
          onDelete={handleDelete}
          onToggleActive={handleToggleActive}
          onRefresh={refresh}
        />
      </div>
    </div>
  );
}
