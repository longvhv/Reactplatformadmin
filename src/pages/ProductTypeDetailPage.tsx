/**
 * ProductTypeDetailPage Component
 * Chi tiết loại sản phẩm - Under 500 lines
 * ✅ CREATED 2026-01-15: Production-ready detail page
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
import { useProductType } from '@/hooks/useProductType';
import { productTypesApi } from '@/api/productTypesApi';
import { toast } from 'sonner@2.0.3';
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

  const [showActions, setShowActions] = useState(false);
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
      navigate('/core/product-types');
    }
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !productType) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">{error || 'Không tìm thấy loại sản phẩm'}</p>
          <Button onClick={() => navigate('/core/product-types')} className="mt-4">
            {t('common.back')}
          </Button>
        </div>
      </div>
    );
  }

  const handleDelete = async () => {
    if (!confirm(`Bạn có chắc muốn xóa loại sản phẩm "${productType.name}"?`)) return;
    try {
      await deleteProductType();
      toast.success('Đã xóa loại sản phẩm');
      navigate('/core/product-types');
    } catch (err: any) {
      console.error('Error deleting product type:', err);
      toast.error('Xóa loại sản phẩm thất bại: ' + err.message);
    }
  };

  const handleToggleActive = async () => {
    try {
      await toggleActive();
      toast.success(productType.is_active ? 'Đã vô hiệu hóa' : 'Đã kích hoạt');
    } catch (err: any) {
      console.error('Error toggling status:', err);
      toast.error('Cập nhật trạng thái thất bại: ' + err.message);
    }
  };

  const handleEdit = () => {
    navigate(`/core/product-types/${id}/edit`);
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Back Button */}
          <button
            onClick={() => navigate('/core/product-types')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại danh sách</span>
          </button>

          {/* Title Bar */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-lg">
                <Package className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {productType.name}
                  </h1>
                  {productType.is_active ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                      <CheckCircle className="w-3 h-3" />
                      Hoạt động
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400">
                      <XCircle className="w-3 h-3" />
                      Không hoạt động
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <code className="text-sm font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-indigo-600 dark:text-indigo-400">
                    {productType.code}
                  </code>
                </div>
                {productType.description && (
                  <p className="text-gray-600 dark:text-gray-400 mt-2 max-w-2xl">
                    {productType.description}
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <DropdownMenu open={showActions} onOpenChange={setShowActions}>
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
                      Vô hiệu hóa
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Kích hoạt
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Xóa
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mt-6 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('details')}
              className={`px-4 py-2 border-b-2 transition-colors ${
                activeTab === 'details'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
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
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <Activity className="w-4 h-4 inline mr-2" />
              Lịch sử
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'details' && (
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Thông tin cơ bản
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
                    <Hash className="w-4 h-4" />
                    Mã loại sản phẩm
                  </div>
                  <code className="text-base font-mono bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded text-indigo-600 dark:text-indigo-400">
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
            </div>

            {/* Metadata */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
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
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
                    <Hash className="w-4 h-4" />
                    Version
                  </div>
                  <p className="text-base font-mono text-gray-900 dark:text-white">
                    v{productType.version}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
                    <Hash className="w-4 h-4" />
                    ID
                  </div>
                  <code className="text-xs font-mono text-gray-600 dark:text-gray-400">
                    {productType._id}
                  </code>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Lịch sử hoạt động
            </h2>
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Lịch sử hoạt động sẽ được hiển thị ở đây</p>
              <p className="text-sm mt-1">Tính năng đang được phát triển</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
