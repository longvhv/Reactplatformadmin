/**
 * Reserved Slug Detail Page
 * View-only page with full information
 * ✅ MIGRATED: Using PageLayout for consistent UI/UX
 * ✅ 100% QUALITY: DropdownMenu + ConfirmDialog
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  reservedSlugsApi,
  ReservedSlug,
  getTypeColor,
  getTypeLabel,
  getMatchTypeLabel,
  getMatchTypeIcon,
} from '../api/reservedSlugsApi';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { ArrowLeft, Edit, Trash2, RefreshCw, Shield, CheckCircle, XCircle, MoreVertical, Clock } from 'lucide-react';
import { PageLayout } from '../components/layout/PageLayout';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { showToast } from '../lib/toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';

export default function ReservedSlugDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [slug, setSlug] = useState<ReservedSlug | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (id) {
      loadSlug(id);
    }
  }, [id]);

  const loadSlug = async (slugId: string) => {
    try {
      setLoading(true);
      const data = await reservedSlugsApi.getById(slugId);
      setSlug(data);
    } catch (error: any) {
      console.error('Error loading slug:', error);
      showToast.error('Lỗi', 'Không thể tải slug: ' + error.message);
      navigate('/platform/reserved-slugs');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!slug || !id) return;
    
    try {
      await reservedSlugsApi.delete(id);
      showToast.success('Thành công', `Đã xóa slug "${slug.slug}"`);
      navigate('/platform/reserved-slugs');
    } catch (error: any) {
      showToast.error('Lỗi', 'Xóa slug thất bại: ' + error.message);
    }
    setShowDeleteDialog(false);
  };

  const handleToggleActive = async () => {
    if (!slug || !id) return;
    
    try {
      if (slug.is_active) {
        await reservedSlugsApi.deactivate(id);
        showToast.success('Thành công', 'Đã vô hiệu hóa slug');
      } else {
        await reservedSlugsApi.activate(id);
        showToast.success('Thành công', 'Đã kích hoạt slug');
      }
      loadSlug(id);
    } catch (error: any) {
      showToast.error('Lỗi', 'Cập nhật trạng thái thất bại: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!slug) return null;

  return (
    <>
      <PageLayout
        icon={Shield}
        title={slug.slug}
        description={
          <div className="flex items-center gap-3 mt-2">
            {slug.is_active ? (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                Active
              </Badge>
            ) : (
              <Badge className="bg-gray-100 text-gray-800">
                <XCircle className="w-3 h-3 mr-1" />
                Inactive
              </Badge>
            )}
            <Badge className={getTypeColor(slug.type)}>
              {getTypeLabel(slug.type)}
            </Badge>
            <span className="text-sm text-gray-500">
              v{slug.version}
            </span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/platform/reserved-slugs')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/platform/reserved-slugs/${id}/edit`)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Chỉnh sửa
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleToggleActive}>
                  {slug.is_active ? (
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
        <div className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cơ bản</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Slug ID</Label>
                  <p className="font-mono text-sm mt-1">{slug._id}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Slug</Label>
                  <p className="font-mono font-semibold mt-1">{slug.slug}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Loại</Label>
                  <div className="mt-1">
                    <Badge className={getTypeColor(slug.type)}>
                      {getTypeLabel(slug.type)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Kiểu khớp</Label>
                  <p className="font-mono mt-1">
                    {getMatchTypeIcon(slug.match_type)} {getMatchTypeLabel(slug.match_type)}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Trạng thái</Label>
                  <div className="mt-1">
                    {slug.is_active ? (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Hoạt động
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-800">
                        <XCircle className="h-3 w-3 mr-1" />
                        Không hoạt động
                      </Badge>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Phiên bản</Label>
                  <p className="mt-1">v{slug.version}</p>
                </div>
              </div>

              {slug.reason && (
                <div>
                  <Label className="text-muted-foreground">Lý do</Label>
                  <p className="mt-1 text-sm">{slug.reason}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Metadata / Snapshot */}
          {slug.items_snapshot && Object.keys(slug.items_snapshot).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Metadata Snapshot</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto">
                  {JSON.stringify(slug.items_snapshot, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* Audit Info */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin kiểm toán</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
                    <Clock className="w-4 h-4" />
                    Tạo lúc
                  </div>
                  <p className="text-sm">{new Date(slug.created_at).toLocaleString('vi-VN')}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
                    <Clock className="w-4 h-4" />
                    Cập nhật lúc
                  </div>
                  <p className="text-sm">{new Date(slug.updated_at).toLocaleString('vi-VN')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Match Type Explanation */}
          <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
            <CardHeader>
              <CardTitle className="text-base">Cách hoạt động</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-blue-800 dark:text-blue-300 space-y-2">
                {slug.match_type === 'EXACT' && (
                  <p>
                    <strong>Khớp chính xác:</strong> Slug này chỉ chặn các kết quả khớp chính xác. 
                    Ví dụ: "{slug.slug}" bị chặn, nhưng "{slug.slug}-panel" hoặc "my-{slug.slug}" được phép.
                  </p>
                )}
                {slug.match_type === 'PREFIX' && (
                  <p>
                    <strong>Khớp tiền tố:</strong> Slug này chặn bất kỳ thứ gì bắt đầu bằng nó. 
                    Ví dụ: "{slug.slug}", "{slug.slug}-panel", "{slug.slug}123" đều bị chặn.
                  </p>
                )}
                {slug.match_type === 'REGEX' && (
                  <p>
                    <strong>Mẫu Regex:</strong> Slug này sử dụng biểu thức chính quy để khớp phức tạp. 
                    Mẫu "{slug.slug}" được đánh giá dựa trên chuỗi đầu vào.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </PageLayout>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDeleteConfirm}
        title="Xác nhận xóa slug"
        description={`Bạn có chắc chắn muốn xóa slug "${slug.slug}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        cancelText="Hủy"
      />
    </>
  );
}