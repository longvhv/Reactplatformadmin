/**
 * ProductTypeDetailPage Component
 * Chi tiết loại sản phẩm
 * ✅ MIGRATED: Using PageLayout for consistent UI/UX
 * ✅ 100% QUALITY: DropdownMenu + ConfirmDialog
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { 
  ArrowLeft, 
  Package,
  MoreVertical,
  Edit,
  Trash2,
  Activity,
  CheckCircle,
  XCircle,
  Calendar,
  Hash,
  FileText,
  Clock
} from 'lucide-react';
import { useLanguage } from '@/providers/LanguageProvider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { PageLayout } from '@/components/layout/PageLayout';
import { useProductType } from '@/hooks/useProductType';
import { productTypesApi } from '@/api/productTypesApi';
import { showToast } from '@/lib/toast';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function ProductTypeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'activity'>('details');

  const { 
    productType, 
    loading, 
    error, 
    updateProductType, 
    deleteProductType,
    toggleActive
  } = useProductType(id);

  useEffect(() => {
    if (!id) {
      navigate('/commerce/product-types');
    }
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !productType) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">{error || 'Không tìm thấy loại sản phẩm'}</p>
          <Button onClick={() => navigate('/commerce/product-types')} className="mt-4">
            {t('common.back')}
          </Button>
        </div>
      </div>
    );
  }

  const handleDeleteConfirm = async () => {
    try {
      await productTypesApi.delete(id);
      showToast.success('Thành công', 'Đã xóa loại sản phẩm');
      navigate('/commerce/product-types');
    } catch (err: any) {
      console.error('Error deleting product type:', err);
      showToast.error('Lỗi', 'Xóa loại sản phẩm thất bại: ' + err.message);
    }
    setShowDeleteDialog(false);
  };

  const handleToggleActive = async () => {
    try {
      await toggleActive();
      showToast.success('Thành công', productType.is_active ? 'Đã vô hiệu hóa' : 'Đã kích hoạt');
    } catch (err: any) {
      console.error('Error toggling status:', err);
      showToast.error('Lỗi', 'Cập nhật trạng thái thất bại: ' + err.message);
    }
  };

  const handleEdit = () => {
    navigate(`/commerce/product-types/edit/${id}`);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      <PageLayout
        icon={Package}
        title={productType.name}
        description={
          <div className="flex items-center gap-3 mt-2">
            <code className="text-sm font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-primary">
              {productType.code}
            </code>
            {productType.is_active ? (
              <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                <CheckCircle className="w-3 h-3 mr-1" />
                Hoạt động
              </Badge>
            ) : (
              <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400">
                <XCircle className="w-3 h-3 mr-1" />
                Không hoạt động
              </Badge>
            )}
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/commerce/product-types')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleEdit}>
                  <Edit className="w-4 h-4 mr-2" />
                  Chỉnh sửa
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleToggleActive}>
                  {productType.is_active ? (
                    <>
                      <XCircle className="w-4 h-4 mr-2" />
                      Vô hiệu h��a
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Kích hoạt
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setShowDeleteDialog(true)} 
                  className="text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Xóa
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      >
        {productType.description && (
          <p className="text-gray-600 dark:text-gray-400 -mt-2 mb-6">
            {productType.description}
          </p>
        )}

        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === 'details'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Chi tiết
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === 'activity'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <Activity className="w-4 h-4 inline mr-2" />
            Lịch sử
          </button>
        </div>

        {/* Content */}
        <div className="mt-6">
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Basic Information */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Thông tin cơ bản
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
                      <Hash className="w-4 h-4" />
                      Mã loại sản phẩm
                    </div>
                    <code className="text-base font-mono bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded text-primary">
                      {productType.code}
                    </code>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
                      <Package className="w-4 h-4" />
                      Tên
                    </div>
                    <p className="text-base font-medium text-gray-900 dark:text-white">
                      {productType.name}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
                      <FileText className="w-4 h-4" />
                      Mô tả
                    </div>
                    <p className="text-base text-gray-900 dark:text-white">
                      {productType.description || (
                        <span className="text-gray-400 italic">Không có mô tả</span>
                      )}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Metadata */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Thông tin hệ thống
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
                      <Calendar className="w-4 h-4" />
                      Ngày tạo
                    </div>
                    <p className="text-base text-gray-900 dark:text-white">
                      {formatDate(productType.created_at)}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
                      <Clock className="w-4 h-4" />
                      Cập nhật lần cuối
                    </div>
                    <p className="text-base text-gray-900 dark:text-white">
                      {formatDate(productType.updated_at)}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'activity' && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Lịch sử hoạt động
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                Chức năng lịch sử hoạt động đang được phát triển
              </p>
            </Card>
          )}
        </div>
      </PageLayout>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDeleteConfirm}
        title="Xác nhận xóa loại sản phẩm"
        description={`Bạn có chắc chắn muốn xóa loại sản phẩm "${productType.name}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        cancelText="Hủy"
      />
    </>
  );
}
