/**
 * System Announcements Page
 * List and manage system announcements - Under 500 lines
 * ✅ MIGRATED Phase 3: ConfirmDialog, showToast, Fragment wrapper
 */

import { Fragment, useState } from 'react';
import { useNavigate } from 'react-router';
import { 
  Plus, 
  Search, 
  Filter,
  Bell,
  AlertCircle,
  AlertTriangle,
  Info,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Loader,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import { SystemAnnouncement } from '@/api/systemAnnouncementsApi';
import { showToast } from '@/lib/toast';
import { PageLayout } from '@/components/layout/PageLayout';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { StatisticsCards } from '@/components/common/StatisticsCards';

export default function NotificationsPage() {
  const navigate = useNavigate();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'INFO' | 'WARNING' | 'CRITICAL'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ACTIVE' | 'INACTIVE'>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    variant?: 'default' | 'destructive';
  }>({
    open: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  // Hooks
  const { announcements, loading, error, deleteAnnouncement, toggleStatus, loadAnnouncements } = useAnnouncements({ autoLoad: true });

  // Apply filters
  const filteredAnnouncements = announcements.filter(ann => {
    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!ann.title.toLowerCase().includes(query) && 
          !ann.content.toLowerCase().includes(query)) {
        return false;
      }
    }

    // Priority filter
    if (priorityFilter !== 'all' && ann.priority !== priorityFilter) return false;

    // Status filter
    if (statusFilter !== 'all' && ann.status !== statusFilter) return false;

    return true;
  });

  // Stats
  const stats = {
    total: announcements.length,
    active: announcements.filter(a => a.status === 'ACTIVE').length,
    inactive: announcements.filter(a => a.status === 'INACTIVE').length,
    info: announcements.filter(a => a.priority === 'INFO').length,
    warning: announcements.filter(a => a.priority === 'WARNING').length,
    critical: announcements.filter(a => a.priority === 'CRITICAL').length,
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'INFO': return Info;
      case 'WARNING': return AlertTriangle;
      case 'CRITICAL': return AlertCircle;
      default: return Bell;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'INFO': return 'blue';
      case 'WARNING': return 'yellow';
      case 'CRITICAL': return 'red';
      default: return 'gray';
    }
  };

  const handleDelete = (announcement: SystemAnnouncement) => {
    setConfirmDialog({
      open: true,
      title: 'Xác nhận xóa',
      description: `Bạn có chắc muốn xóa thông báo "${announcement.title}"? Hành động này không thể hoàn tác.`,
      variant: 'destructive',
      onConfirm: async () => {
        try {
          await deleteAnnouncement(announcement._id);
          showToast.success('Thành công', 'Xóa thông báo thành công');
        } catch (err: any) {
          showToast.error('Lỗi', err.message || 'Xóa thất bại');
        } finally {
          setConfirmDialog({ ...confirmDialog, open: false });
        }
      },
    });
  };

  const handleToggleStatus = async (announcement: SystemAnnouncement) => {
    try {
      await toggleStatus(announcement._id);
      const newStatus = announcement.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      showToast.success('Thành công', `${newStatus === 'ACTIVE' ? 'Kích hoạt' : 'Tạm ngưng'} thông báo thành công`);
    } catch (err: any) {
      showToast.error('Lỗi', err.message || 'Cập nhật trạng thái thất bại');
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Fragment>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Đang tải thông báo...</p>
          </div>
        </div>
      </Fragment>
    );
  }

  if (error) {
    return (
      <Fragment>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Lỗi tải dữ liệu</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <Button onClick={() => loadAnnouncements()}>Thử lại</Button>
          </div>
        </div>
      </Fragment>
    );
  }

  // Stats for StatisticsCards
  const statsCards = [
    { label: 'Tổng số', value: stats.total, color: 'gray' as const, icon: Bell },
    { label: 'Đang hoạt động', value: stats.active, color: 'green' as const, icon: CheckCircle },
    { label: 'Tạm ngưng', value: stats.inactive, color: 'gray' as const, icon: XCircle },
    { label: 'INFO', value: stats.info, color: 'blue' as const, icon: Info },
    { label: 'WARNING', value: stats.warning, color: 'yellow' as const, icon: AlertTriangle },
    { label: 'CRITICAL', value: stats.critical, color: 'red' as const, icon: AlertCircle },
  ];

  return (
    <Fragment>
      <PageLayout
        icon={Bell}
        title="Thông báo hệ thống"
        description="Quản lý thông báo hiển thị cho người dùng"
        actions={
          <Button onClick={() => navigate('/platform/system-announcements/create', { replace: true })}>
            <Plus className="h-4 w-4 mr-2" />
            Tạo thông báo
          </Button>
        }
      >
        {/* Stats */}
        <StatisticsCards stats={statsCards} columns={6} />

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm theo tiêu đề, nội dung..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="all">Tất cả mức độ</option>
              <option value="INFO">INFO</option>
              <option value="WARNING">WARNING</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="INACTIVE">Tạm ngưng</option>
            </select>

            <Button variant="outline" size="sm" onClick={() => {
              setSearchQuery('');
              setPriorityFilter('all');
              setStatusFilter('all');
            }}>
              Xóa bộ lọc
            </Button>
          </div>
        </div>

        {/* Announcements List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          {filteredAnnouncements.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                {searchQuery || priorityFilter !== 'all' || statusFilter !== 'all' 
                  ? 'Không tìm thấy thông báo phù hợp' 
                  : 'Chưa có thông báo nào'}
              </p>
              {!searchQuery && priorityFilter === 'all' && statusFilter === 'all' && (
                <Button onClick={() => navigate('/platform/system-announcements/create')} className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Tạo thông báo đầu tiên
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredAnnouncements.map((announcement) => {
                const PriorityIcon = getPriorityIcon(announcement.priority);
                const priorityColor = getPriorityColor(announcement.priority);
                const isActive = announcement.status === 'ACTIVE';

                return (
                  <div key={announcement._id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-start gap-4">
                      {/* Priority Icon */}
                      <div className={`p-2 rounded-lg bg-${priorityColor}-100 dark:bg-${priorityColor}-900/20 flex-shrink-0`}>
                        <PriorityIcon className={`w-5 h-5 text-${priorityColor}-600 dark:text-${priorityColor}-400`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                            {announcement.title}
                          </h3>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                            isActive 
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' 
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {announcement.status}
                          </span>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded bg-${priorityColor}-100 text-${priorityColor}-700 dark:bg-${priorityColor}-900/30 dark:text-${priorityColor}-300`}>
                            {announcement.priority}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                          {announcement.content}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
                          <span>Bắt đầu: {formatDate(announcement.start_date)}</span>
                          {announcement.end_date && (
                            <span>Kết thúc: {formatDate(announcement.end_date)}</span>
                          )}
                          <span>Version: {announcement.version}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(announcement)}
                          title={isActive ? 'Tạm ngưng' : 'Kích hoạt'}
                        >
                          {isActive ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/platform/system-announcements/${announcement._id}/edit`, { replace: true })}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(announcement)}
                          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Info */}
        {filteredAnnouncements.length > 0 && (
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center">
            Hiển thị {filteredAnnouncements.length} / {announcements.length} thông báo
          </div>
        )}
      </PageLayout>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
        variant={confirmDialog.variant}
        confirmLabel="Xác nhận"
        cancelLabel="Hủy"
      />
    </Fragment>
  );
}