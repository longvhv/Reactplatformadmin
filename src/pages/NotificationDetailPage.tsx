/**
 * NotificationDetailPage Component
 * Chi tiết thông báo hệ thống - Under 400 lines
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { useAnnouncement } from '@/hooks/useAnnouncement';

export default function NotificationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [showActions, setShowActions] = useState(false);

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
      navigate('/core/system-announcements');
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

  if (error || !announcement) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">{error || 'Notification not found'}</p>
          <Button onClick={() => navigate('/notifications')} className="mt-4">
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
      case 'INFO': return { bg: 'bg-blue-100', text: 'text-blue-600', badge: 'bg-blue-100 text-blue-800' };
      case 'WARNING': return { bg: 'bg-yellow-100', text: 'text-yellow-600', badge: 'bg-yellow-100 text-yellow-800' };
      case 'CRITICAL': return { bg: 'bg-red-100', text: 'text-red-600', badge: 'bg-red-100 text-red-800' };
      case 'PROMOTION': return { bg: 'bg-purple-100', text: 'text-purple-600', badge: 'bg-purple-100 text-purple-800' };
      default: return { bg: 'bg-gray-100', text: 'text-gray-600', badge: 'bg-gray-100 text-gray-800' };
    }
  };

  const TypeIcon = getTypeIcon(announcement.type);
  const colors = getTypeColor(announcement.type);

  const handleDelete = async () => {
    if (!confirm('Bạn có chắc muốn xóa thông báo này?')) return;
    try {
      await deleteAnnouncement();
      navigate('/notifications');
    } catch (err) {
      alert('Xóa thông báo thất bại');
    }
  };

  const handleToggleActive = async () => {
    if (!confirm(`Bạn có chắc muốn ${announcement.is_active ? 'ẩn' : 'hiển thị'} thông báo này?`)) return;
    try {
      await toggleActive();
    } catch (err) {
      alert('Cập nhật trạng thái thất bại');
    }
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/notifications')}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Quay lại
              </Button>

              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-lg ${colors.bg} flex items-center justify-center`}>
                  <TypeIcon className={`w-8 h-8 ${colors.text}`} />
                </div>

                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-gray-900">
                      Chi tiết thông báo
                    </h1>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.badge}`}>
                      {announcement.type}
                    </span>
                    {announcement.is_active ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Inactive
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Activity className="w-4 h-4" />
                      v{announcement.version}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/notifications/${id}/edit`)}
                className="gap-2"
              >
                <Edit className="w-4 h-4" />
                Chỉnh sửa
              </Button>

              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowActions(!showActions)}
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>

                {showActions && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border z-10">
                    <div className="py-1">
                      <button
                        onClick={handleToggleActive}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                      >
                        {announcement.is_active ? (
                          <>
                            <EyeOff className="w-4 h-4" />
                            Ẩn thông báo
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4" />
                            Hiển thị thông báo
                          </>
                        )}
                      </button>
                      <button
                        onClick={handleDelete}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Xóa
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Titles */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b">
                <h2 className="text-lg font-semibold">Tiêu đề (Đa ngôn ngữ)</h2>
              </div>
              <div className="p-6 space-y-4">
                {Object.entries(announcement.titles || {}).map(([lang, title]) => (
                  <div key={lang}>
                    <div className="flex items-center gap-2 mb-2">
                      <Globe className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700 uppercase">{lang}</span>
                    </div>
                    <p className="text-gray-900 font-medium">{title as string}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Contents */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b">
                <h2 className="text-lg font-semibold">Nội dung (Đa ngôn ngữ)</h2>
              </div>
              <div className="p-6 space-y-4">
                {Object.entries(announcement.contents || {}).map(([lang, content]) => (
                  <div key={lang}>
                    <div className="flex items-center gap-2 mb-2">
                      <Globe className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700 uppercase">{lang}</span>
                    </div>
                    <p className="text-gray-900 whitespace-pre-wrap">{content as string}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Schedule */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b">
                <h2 className="text-lg font-semibold">Lịch trình</h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-500">Bắt đầu</span>
                  </div>
                  <p className="text-gray-900">{formatDate(announcement.start_at)}</p>
                </div>

                {announcement.end_at && (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-500">Kết thúc</span>
                    </div>
                    <p className="text-gray-900">{formatDate(announcement.end_at)}</p>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Múi giờ địa phương</span>
                    <span className={`
                      px-2 py-0.5 rounded-full text-xs font-medium
                      ${announcement.is_local_time 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                      }
                    `}>
                      {announcement.is_local_time ? 'Có' : 'Không'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Targeting */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b">
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
                        <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                          {region}
                        </span>
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
                        <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                          {plan}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Tất cả gói cước</p>
                  )}
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b">
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}