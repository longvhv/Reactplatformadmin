/**
 * NotificationsPage Component
 * Quản lý System Announcements - Under 500 lines
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter,
  Download,
  Bell,
  AlertCircle,
  AlertTriangle,
  Info,
  Gift,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Calendar
} from 'lucide-react';
import { useLanguage } from '@/providers/LanguageProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAnnouncements } from '@/hooks/useAnnouncements';

export default function NotificationsPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'INFO' | 'WARNING' | 'CRITICAL' | 'PROMOTION'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAnnouncements, setSelectedAnnouncements] = useState<string[]>([]);

  // Hooks
  const { announcements, loading, error, deleteAnnouncement, updateAnnouncement } = useAnnouncements({ autoLoad: true });

  // Apply filters
  const filteredAnnouncements = announcements.filter(ann => {
    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const titleMatch = Object.values(ann.titles || {}).some((title: any) => 
        title.toLowerCase().includes(query)
      );
      const contentMatch = Object.values(ann.contents || {}).some((content: any) => 
        content.toLowerCase().includes(query)
      );
      if (!titleMatch && !contentMatch) return false;
    }

    // Type filter
    if (typeFilter !== 'all' && ann.type !== typeFilter) return false;

    // Status filter
    if (statusFilter === 'active' && !ann.is_active) return false;
    if (statusFilter === 'inactive' && ann.is_active) return false;

    return true;
  });

  // Stats
  const stats = {
    total: announcements.length,
    active: announcements.filter(a => a.is_active).length,
    info: announcements.filter(a => a.type === 'INFO').length,
    warning: announcements.filter(a => a.type === 'WARNING').length,
    critical: announcements.filter(a => a.type === 'CRITICAL').length,
    promotion: announcements.filter(a => a.type === 'PROMOTION').length,
  };

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
      case 'INFO': return 'blue';
      case 'WARNING': return 'yellow';
      case 'CRITICAL': return 'red';
      case 'PROMOTION': return 'purple';
      default: return 'gray';
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('announcements.confirmDelete'))) return;
    try {
      await deleteAnnouncement(id);
    } catch (err) {
      alert('Failed to delete announcement');
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await updateAnnouncement(id, { is_active: !isActive });
    } catch (err) {
      alert('Failed to update status');
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

  const getTitle = (titles: any) => {
    return titles?.vi || titles?.en || Object.values(titles || {})[0] || 'No title';
  };

  const getContent = (contents: any) => {
    return contents?.vi || contents?.en || Object.values(contents || {})[0] || 'No content';
  };

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Thông báo hệ thống
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Quản lý thông báo và announcements cho người dùng
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {/* Export */}}
              >
                <Download className="w-4 h-4" />
                Export
              </Button>
              <Button
                size="sm"
                className="gap-2"
                onClick={() => navigate('/core/system-announcements/new')}
              >
                <Plus className="w-4 h-4" />
                Tạo thông báo
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <p className="text-xs text-gray-500">Tổng số</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <p className="text-xs text-gray-500">Hoạt động</p>
            <p className="text-xl font-bold text-green-600 mt-1">{stats.active}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <p className="text-xs text-gray-500">Info</p>
            <p className="text-xl font-bold text-blue-600 mt-1">{stats.info}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <p className="text-xs text-gray-500">Warning</p>
            <p className="text-xl font-bold text-yellow-600 mt-1">{stats.warning}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <p className="text-xs text-gray-500">Critical</p>
            <p className="text-xl font-bold text-red-600 mt-1">{stats.critical}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <p className="text-xs text-gray-500">Promotion</p>
            <p className="text-xl font-bold text-purple-600 mt-1">{stats.promotion}</p>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Tìm theo tiêu đề, nội dung..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
            </Button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loại thông báo
                </label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="all">Tất cả</option>
                  <option value="INFO">Info</option>
                  <option value="WARNING">Warning</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="PROMOTION">Promotion</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trạng thái
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="all">Tất cả</option>
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Không hoạt động</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Announcements List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {filteredAnnouncements.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">Không tìm thấy thông báo</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAnnouncements.map((ann) => {
              const TypeIcon = getTypeIcon(ann.type);
              const color = getTypeColor(ann.type);
              
              return (
                <div key={ann._id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`
                        p-3 rounded-lg
                        ${color === 'blue' ? 'bg-blue-100' : ''}
                        ${color === 'yellow' ? 'bg-yellow-100' : ''}
                        ${color === 'red' ? 'bg-red-100' : ''}
                        ${color === 'purple' ? 'bg-purple-100' : ''}
                      `}>
                        <TypeIcon className={`
                          w-6 h-6
                          ${color === 'blue' ? 'text-blue-600' : ''}
                          ${color === 'yellow' ? 'text-yellow-600' : ''}
                          ${color === 'red' ? 'text-red-600' : ''}
                          ${color === 'purple' ? 'text-purple-600' : ''}
                        `} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => navigate(`/core/system-announcements/${ann._id}`)}
                                className="text-lg font-semibold text-gray-900 hover:text-indigo-600 transition-colors"
                              >
                                {getTitle(ann.titles)}
                              </button>
                              
                              <span className={`
                                px-2 py-0.5 rounded-full text-xs font-medium
                                ${color === 'blue' ? 'bg-blue-100 text-blue-800' : ''}
                                ${color === 'yellow' ? 'bg-yellow-100 text-yellow-800' : ''}
                                ${color === 'red' ? 'bg-red-100 text-red-800' : ''}
                                ${color === 'purple' ? 'bg-purple-100 text-purple-800' : ''}
                              `}>
                                {ann.type}
                              </span>

                              {ann.is_active ? (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Active
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  Inactive
                                </span>
                              )}
                            </div>

                            <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                              {getContent(ann.contents)}
                            </p>

                            <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(ann.start_at)}
                              </span>
                              {ann.end_at && (
                                <span>→ {formatDate(ann.end_at)}</span>
                              )}
                              <span>v{ann.version}</span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="relative group ml-4">
                            <button className="p-1 hover:bg-gray-100 rounded">
                              <MoreVertical className="w-4 h-4 text-gray-400" />
                            </button>
                            
                            <div className="hidden group-hover:block absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border z-10">
                              <div className="py-1">
                                <button
                                  onClick={() => navigate(`/core/system-announcements/edit/${ann._id}`)}
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                                >
                                  <Edit className="w-4 h-4" />
                                  Chỉnh sửa
                                </button>
                                <button
                                  onClick={() => handleToggleActive(ann._id, ann.is_active)}
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                                >
                                  {ann.is_active ? (
                                    <>
                                      <EyeOff className="w-4 h-4" />
                                      Ẩn
                                    </>
                                  ) : (
                                    <>
                                      <Eye className="w-4 h-4" />
                                      Hiển thị
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={() => handleDelete(ann._id)}
                                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Xóa
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}