/**
 * NotificationDetailPage Component
 * Chi tiết thông báo hệ thống
 * ✅ MIGRATED: Using PageLayout for consistent UI/UX
 * ✅ 100% QUALITY: DropdownMenu + ConfirmDialog
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { 
  ArrowLeft, 
  Bell,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Calendar,
  Globe,
  Target,
  Activity,
  AlertCircle,
  AlertTriangle,
  Info,
  Gift
} from 'lucide-react';
import { useLanguage } from '@/providers/LanguageProvider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageLayout } from '@/components/layout/PageLayout';
import { useAnnouncement } from '@/hooks/useAnnouncement';
import { showToast } from '@/lib/toast';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function NotificationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showToggleDialog, setShowToggleDialog] = useState(false);

  const { 
    announcement, 
    loading, 
    error, 
    updateAnnouncement, 
    deleteAnnouncement,
    toggleActive 
  } = useAnnouncement(id);

  useEffect(() => {
    if (!id) {
      navigate('/platform/system-announcements');
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

  if (error || !announcement) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">{error || 'Notification not found'}</p>
          <Button onClick={() => navigate('/platform/system-announcements')} className="mt-4">
            {t('common.back')}
          </Button>
        </div>
      </div>
    );
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'INFO': return Info;
      case 'WARNING': return AlertTriangle;
      case 'CRITICAL': return AlertCircle;
      case 'PROMOTION': return Gift;
      default: return Bell;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'INFO': return { bg: 'bg-blue-100 dark:bg-blue-900/20', text: 'text-blue-600', badge: 'bg-blue-100 text-blue-800' };
      case 'WARNING': return { bg: 'bg-yellow-100 dark:bg-yellow-900/20', text: 'text-yellow-600', badge: 'bg-yellow-100 text-yellow-800' };
      case 'CRITICAL': return { bg: 'bg-red-100 dark:bg-red-900/20', text: 'text-red-600', badge: 'bg-red-100 text-red-800' };
      case 'PROMOTION': return { bg: 'bg-purple-100 dark:bg-purple-900/20', text: 'text-purple-600', badge: 'bg-purple-100 text-purple-800' };
      default: return { bg: 'bg-gray-100 dark:bg-gray-900/20', text: 'text-gray-600', badge: 'bg-gray-100 text-gray-800' };
    }
  };

  const TypeIcon = getTypeIcon(announcement.type);
  const colors = getTypeColor(announcement.type);

  const handleDeleteConfirm = async () => {
    try {
      await deleteAnnouncement();
      showToast.success('Thành công', 'Đã xóa thông báo');
      navigate('/platform/system-announcements');
    } catch (err) {
      showToast.error('Lỗi', 'Xóa thông báo thất bại');
    }
    setShowDeleteDialog(false);
  };

  const handleToggleConfirm = async () => {
    try {
      await toggleActive();
      showToast.success('Thành công', 'Đã cập nhật trạng thái');
    } catch (err) {
      showToast.error('Lỗi', 'Cập nhật trạng thái thất bại');
    }
    setShowToggleDialog(false);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      <PageLayout
        icon={Bell}
        title="Chi tiết thông báo"
        description={
          <div className="flex items-center gap-3 mt-2">
            <Badge className={colors.badge}>
              {announcement.type}
            </Badge>
            {announcement.is_active ? (
              <Badge className="bg-green-100 text-green-800">
                Active
              </Badge>
            ) : (
              <Badge className="bg-gray-100 text-gray-800">
                Inactive
              </Badge>
            )}
            <span className="text-sm text-gray-500 flex items-center gap-1">
              <Activity className="w-4 h-4" />
              v{announcement.version}
            </span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/platform/system-announcements')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/platform/system-announcements/${id}/edit`)}
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
                <DropdownMenuItem onClick={() => setShowToggleDialog(true)}>
                  {announcement.is_active ? (
                    <>
                      <EyeOff className="w-4 h-4 mr-2" />
                      Ẩn thông báo
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Hiển thị thông báo
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Titles */}
            <Card>
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold">Tiêu đề (Đa ngôn ngữ)</h2>
              </div>
              <div className="p-6 space-y-4">
                {Object.entries(announcement.titles || {}).map(([lang, title]) => (
                  <div key={lang}>
                    <div className="flex items-center gap-2 mb-2">
                      <Globe className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase">{lang}</span>
                    </div>
                    <p className="text-gray-900 dark:text-white font-medium">{title as string}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Contents */}
            <Card>
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold">Nội dung (Đa ngôn ngữ)</h2>
              </div>
              <div className="p-6 space-y-4">
                {Object.entries(announcement.contents || {}).map(([lang, content]) => (
                  <div key={lang}>
                    <div className="flex items-center gap-2 mb-2">
                      <Globe className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase">{lang}</span>
                    </div>
                    <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{content as string}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Schedule */}
            <Card>
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold">Lịch trình</h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-500">Bắt đầu</span>
                  </div>
                  <p className="text-gray-900 dark:text-white">{formatDate(announcement.start_at)}</p>
                </div>

                {announcement.end_at && (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-500">Kết thúc</span>
                    </div>
                    <p className="text-gray-900 dark:text-white">{formatDate(announcement.end_at)}</p>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Múi giờ địa phương</span>
                    <Badge className={announcement.is_local_time ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {announcement.is_local_time ? 'Có' : 'Không'}
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>

            {/* Targeting */}
            <Card>
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold">Nhắm mục tiêu</h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-500">Khu vực</span>
                  </div>
                  {announcement.target_regions && announcement.target_regions.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {announcement.target_regions.map((region, idx) => (
                        <Badge key={idx} className="bg-blue-100 text-blue-800">
                          {region}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Tất cả khu vực</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-500">Gói cước</span>
                  </div>
                  {announcement.target_plans && announcement.target_plans.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {announcement.target_plans.map((plan, idx) => (
                        <Badge key={idx} className="bg-purple-100 text-purple-800">
                          {plan}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Tất cả gói cước</p>
                  )}
                </div>
              </div>
            </Card>

            {/* Metadata */}
            <Card>
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold">Metadata</h2>
              </div>
              <div className="p-6 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Phiên bản</span>
                  <span className="font-medium">v{announcement.version}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Tạo lúc</span>
                  <span className="font-medium">{formatDate(announcement.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Cập nhật lúc</span>
                  <span className="font-medium">{formatDate(announcement.updated_at)}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </PageLayout>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDeleteConfirm}
        title="Xác nhận xóa thông báo"
        description="Bạn có chắc chắn muốn xóa thông báo này? Hành động này không thể hoàn tác."
        confirmText="Xóa"
        cancelText="Hủy"
      />

      {/* Toggle Active Confirmation Dialog */}
      <ConfirmDialog
        open={showToggleDialog}
        onOpenChange={setShowToggleDialog}
        onConfirm={handleToggleConfirm}
        title={announcement.is_active ? "Xác nhận ẩn thông báo" : "Xác nhận hiển thị thông báo"}
        description={`Bạn có chắc chắn muốn ${announcement.is_active ? 'ẩn' : 'hiển thị'} thông báo này?`}
        confirmText="Xác nhận"
        cancelText="Hủy"
      />
    </>
  );
}
