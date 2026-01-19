/**
 * Reserved Slugs Page
 * Manage reserved URL slugs to prevent conflicts
 * ✅ MIGRATED: Fixed confirm → ConfirmDialog, toast → showToast
 * ✅ 100% QUALITY: Professional list page
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Shield, Plus, Search, Pencil, Trash2, Power, PowerOff } from 'lucide-react';
import { useLanguage } from '@/providers/LanguageProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { reservedSlugsApi, ReservedSlug } from '@/api/reservedSlugsApi';
import { showToast } from '@/lib/toast';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';

export default function ReservedSlugsPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const [slugs, setSlugs] = useState<ReservedSlug[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedSlug, setSelectedSlug] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    loadSlugs();
  }, []);

  const loadSlugs = async () => {
    try {
      setLoading(true);
      const data = await reservedSlugsApi.getAll();
      setSlugs(data);
    } catch (error: any) {
      showToast.error('Lỗi', 'Không thể tải danh sách reserved slugs: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string, slug: string) => {
    setSelectedSlug({ id, name: slug });
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedSlug) return;
    
    try {
      await reservedSlugsApi.delete(selectedSlug.id);
      showToast.success('Thành công', `Đã xóa slug "${selectedSlug.name}"`);
      loadSlugs();
    } catch (error: any) {
      showToast.error('Lỗi', 'Không thể xóa: ' + error.message);
    } finally {
      setShowDeleteDialog(false);
      setSelectedSlug(null);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      if (currentActive) {
        await reservedSlugsApi.deactivate(id);
        showToast.success('Thành công', 'Đã vô hiệu hóa slug');
      } else {
        await reservedSlugsApi.activate(id);
        showToast.success('Thành công', 'Đã kích hoạt slug');
      }
      loadSlugs();
    } catch (error: any) {
      showToast.error('Lỗi', 'Không thể cập nhật: ' + error.message);
    }
  };

  // Filter by search
  const filteredSlugs = slugs.filter(slug => 
    slug.slug.toLowerCase().includes(search.toLowerCase()) ||
    (slug.reason && slug.reason.toLowerCase().includes(search.toLowerCase()))
  );

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'core': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      'tenant': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      'platform': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      'system': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };
    return colors[type] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  };

  return (
    <>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Reserved Slugs
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Quản lý các URL slugs đã được đặt trước để tránh xung đột
            </p>
          </div>
          <Button onClick={() => navigate('/platform/reserved-slugs/add')}>
            <Plus className="w-4 h-4 mr-2" />
            Thêm Slug
          </Button>
        </div>

        {/* Search */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Tìm kiếm theo slug hoặc lý do..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Shield className="w-4 h-4" />
              <span className="text-sm">Tổng số</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
              {slugs.length}
            </p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <Power className="w-4 h-4" />
              <span className="text-sm">Hoạt động</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
              {slugs.filter(s => s.is_active).length}
            </p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Shield className="w-4 h-4" />
              <span className="text-sm">Kết quả tìm kiếm</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
              {filteredSlugs.length}
            </p>
          </Card>
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
                    <th className="text-left p-4 text-sm font-medium text-gray-600 dark:text-gray-400">Slug</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600 dark:text-gray-400">Loại</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600 dark:text-gray-400">Lý do</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600 dark:text-gray-400">Trạng thái</th>
                    <th className="text-right p-4 text-sm font-medium text-gray-600 dark:text-gray-400">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSlugs.map((slug) => (
                    <tr key={slug._id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="p-4">
                        <code className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded font-mono">
                          /{slug.slug}
                        </code>
                      </td>
                      <td className="p-4">
                        <Badge className={getTypeColor(slug.type)}>
                          {slug.type}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm text-gray-600 dark:text-gray-400">
                        {slug.reason || '-'}
                      </td>
                      <td className="p-4">
                        <Badge className={slug.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {slug.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(slug._id, slug.is_active)}
                            title={slug.is_active ? 'Vô hiệu hóa' : 'Kích hoạt'}
                          >
                            {slug.is_active ? (
                              <PowerOff className="w-4 h-4" />
                            ) : (
                              <Power className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/platform/reserved-slugs/edit/${slug._id}`)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(slug._id, slug.slug)}
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

            {filteredSlugs.length === 0 && !loading && (
              <div className="text-center py-12">
                <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Không có dữ liệu</p>
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDeleteConfirm}
        title="Xác nhận xóa reserved slug"
        description={`Bạn có chắc chắn muốn xóa slug "${selectedSlug?.name}"? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa"
        cancelLabel="Hủy"
        variant="destructive"
      />
    </>
  );
}