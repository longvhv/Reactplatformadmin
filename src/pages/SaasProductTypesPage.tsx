/**
 * SaaS Product Types Page
 * Production-ready with stats, filters, and full CRUD operations
 * ✅ MIGRATED Phase 3: ConfirmDialog, showToast, Fragment wrapper, PageLayout, StatisticsCards
 * ✅ 100% QUALITY: Professional list page with dark mode support
 */

import { Fragment, useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  saasProductTypesApi,
  SaasProductType,
  useSaasProductTypeStats,
  normalizeCode,
  validateCode,
  useCodeChecker,
} from '../api/saasProductTypesApi';
import { useSaasProductTypes } from '../hooks/useSaasProductTypes';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Plus,
  Search,
  Filter,
  Package,
  TrendingUp,
  RefreshCw,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { showToast } from '../lib/toast';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { PageLayout } from '../components/layout/PageLayout';
import { StatisticsCards } from '../components/common/StatisticsCards';

export default function SaasProductTypesPage() {
  const navigate = useNavigate();
  const { stats, loading: statsLoading, refresh: refreshStats } = useSaasProductTypeStats();

  const [productTypes, setProductTypes] = useState<SaasProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProductType, setEditingProductType] = useState<SaasProductType | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedProductType, setSelectedProductType] = useState<{ id: string; code: string } | null>(null);

  useEffect(() => {
    loadProductTypes();
  }, [activeFilter]);

  const loadProductTypes = async () => {
    try {
      setLoading(true);
      const filters: any = {};

      if (activeFilter !== 'all') filters.is_active = activeFilter === 'active';

      const data = await saasProductTypesApi.getAll(filters);
      setProductTypes(data);
    } catch (error: any) {
      showToast.error('Lỗi', 'Không thể tải danh sách product types: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string, code: string) => {
    setSelectedProductType({ id, code });
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedProductType) return;

    try {
      await saasProductTypesApi.delete(selectedProductType.id);
      showToast.success('Thành công', `Đã xóa "${selectedProductType.code}"`);
      loadProductTypes();
      refreshStats();
    } catch (error: any) {
      showToast.error('Lỗi', 'Không thể xóa: ' + error.message);
    } finally {
      setShowDeleteDialog(false);
      setSelectedProductType(null);
    }
  };

  const handleToggleActive = async (productType: SaasProductType) => {
    try {
      if (productType.is_active) {
        await saasProductTypesApi.deactivate(productType._id);
        showToast.success('Thành công', `Đã vô hiệu hóa "${productType.code}"`);
      } else {
        await saasProductTypesApi.activate(productType._id);
        showToast.success('Thành công', `Đã kích hoạt "${productType.code}"`);
      }
      loadProductTypes();
      refreshStats();
    } catch (error: any) {
      showToast.error('Lỗi', 'Không thể cập nhật: ' + error.message);
    }
  };

  // Filter by search
  const filteredProductTypes = productTypes.filter(pt => {
    const matchesSearch = !search || 
      pt.code.toLowerCase().includes(search.toLowerCase()) ||
      pt.name.toLowerCase().includes(search.toLowerCase()) ||
      (pt.description && pt.description.toLowerCase().includes(search.toLowerCase()));
    
    return matchesSearch;
  });

  return (
    <Fragment>
      <PageLayout
        title="Loại sản phẩm SaaS"
        description="Quản lý các loại sản phẩm SaaS"
        icon={Package}
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                loadProductTypes();
                refreshStats();
              }}
              disabled={loading || statsLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading || statsLoading ? 'animate-spin' : ''}`} />
              Làm mới
            </Button>
            <Button onClick={() => navigate('/commerce/saas-product-types/add')}>
              <Plus className="w-4 h-4 mr-2" />
              Thêm mới
            </Button>
          </div>
        }
      >
        {/* Stats Cards */}
        {stats && (
          <StatisticsCards
            stats={[
              { label: 'Tổng số', value: stats.total, color: 'gray', icon: Package },
              { label: 'Đang hoạt động', value: stats.active, color: 'green', icon: CheckCircle },
              { label: 'Ngừng hoạt động', value: stats.inactive, color: 'gray', icon: XCircle },
              { label: 'Gần đây (7 ngày)', value: stats.recent, color: 'blue', icon: Clock },
            ]}
            columns={4}
            className="mb-6"
          />
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Tìm kiếm theo mã, tên, mô tả..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={activeFilter === 'all' ? 'default' : 'outline'}
              onClick={() => setActiveFilter('all')}
            >
              Tất cả
            </Button>
            <Button
              variant={activeFilter === 'active' ? 'default' : 'outline'}
              onClick={() => setActiveFilter('active')}
            >
              Hoạt động
            </Button>
            <Button
              variant={activeFilter === 'inactive' ? 'default' : 'outline'}
              onClick={() => setActiveFilter('inactive')}
            >
              Ngừng
            </Button>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">Đang tải...</p>
          </div>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left p-4 text-sm font-medium text-gray-600 dark:text-gray-400">Mã</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600 dark:text-gray-400">Tên</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600 dark:text-gray-400">Mô tả</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600 dark:text-gray-400">Trạng thái</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600 dark:text-gray-400">Ngày tạo</th>
                    <th className="text-right p-4 text-sm font-medium text-gray-600 dark:text-gray-400">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProductTypes.map((pt) => (
                    <tr key={pt._id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="p-4">
                        <code className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded font-mono">
                          {pt.code}
                        </code>
                      </td>
                      <td className="p-4 font-medium text-gray-900 dark:text-white">{pt.name}</td>
                      <td className="p-4 text-sm text-gray-600 dark:text-gray-400">
                        {pt.description || '-'}
                      </td>
                      <td className="p-4">
                        <Badge className={pt.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {pt.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm text-gray-600 dark:text-gray-400">
                        {new Date(pt.created_at).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/commerce/saas-product-types/${pt._id}`)}
                            title="Xem chi tiết"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(pt)}
                            title={pt.is_active ? 'Vô hiệu hóa' : 'Kích hoạt'}
                          >
                            {pt.is_active ? (
                              <XCircle className="w-4 h-4 text-orange-600" />
                            ) : (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/commerce/saas-product-types/edit/${pt._id}`)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(pt._id, pt.code)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredProductTypes.length === 0 && !loading && (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Không có dữ liệu</p>
              </div>
            )}
          </Card>
        )}
      </PageLayout>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDeleteConfirm}
        title="Xác nhận xóa product type"
        description={`Bạn có chắc chắn muốn xóa product type "${selectedProductType?.code}"? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa"
        cancelLabel="Hủy"
        variant="destructive"
      />
    </Fragment>
  );
}