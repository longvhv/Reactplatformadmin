/**
 * Edit System Announcement Page
 * Page for editing an existing system announcement/notification
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Bell, Loader, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { AnnouncementForm } from '../components/announcements/AnnouncementForm';
import { 
  systemAnnouncementApi, 
  SystemAnnouncement,
  UpdateSystemAnnouncementRequest 
} from '../api/systemAnnouncementApi';
import { toast } from 'sonner@2.0.3';

export default function EditNotificationPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [announcement, setAnnouncement] = useState<SystemAnnouncement | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load announcement data
  useEffect(() => {
    const loadAnnouncement = async () => {
      if (!id) {
        setError('ID thông báo không hợp lệ');
        setLoading(false);
        return;
      }

      try {
        console.log('📥 Loading system announcement:', id);
        
        const data = await systemAnnouncementApi.getById(id);
        
        console.log('✅ System announcement loaded:', data);
        setAnnouncement(data);
        setError(null);
        
      } catch (err: any) {
        console.error('❌ Error loading system announcement:', err);
        
        const errorMessage = err?.message || 'Không thể tải thông báo';
        setError(errorMessage);
        
        toast.error('Lỗi tải thông báo', {
          description: errorMessage,
          duration: 5000,
        });
      } finally {
        setLoading(false);
      }
    };

    loadAnnouncement();
  }, [id]);

  const handleSubmit = async (data: UpdateSystemAnnouncementRequest) => {
    if (!id || !announcement) return;
    
    setUpdating(true);
    
    try {
      console.log('📝 Updating system announcement:', id, data);
      
      const response = await systemAnnouncementApi.update(id, data);
      
      console.log('✅ System announcement updated:', response);
      
      // Show success toast
      toast.success('Cập nhật thông báo thành công!', {
        description: `Thông báo đã được cập nhật`,
        duration: 5000,
      });
      
      // Navigate back to list
      navigate('/core/system-announcements');
      
    } catch (error: any) {
      console.error('❌ Error updating system announcement:', error);
      
      let errorMessage = error?.message || 'Không thể cập nhật thông báo';
      
      // Handle version conflict (optimistic locking)
      if (error?.message?.includes('version') || error?.message?.includes('conflict')) {
        errorMessage = 'Thông báo đã được cập nhật bởi người khác. Vui lòng tải lại trang và thử lại.';
        
        toast.error('Xung đột phiên bản', {
          description: errorMessage,
          duration: 7000,
          action: {
            label: 'Tải lại',
            onClick: () => window.location.reload(),
          },
        });
      } else {
        toast.error('Cập nhật thông báo thất bại', {
          description: errorMessage,
          duration: 7000,
        });
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = () => {
    navigate('/core/system-announcements');
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Đang tải thông tin thông báo...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !announcement) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">
            Không tìm thấy thông báo
          </h2>
          <p className="text-gray-600 mb-6">
            {error || 'Thông báo không tồn tại hoặc đã bị xóa'}
          </p>
          {id && (
            <div className="mb-6 p-3 bg-gray-100 rounded-lg">
              <p className="text-sm text-gray-700 font-mono">
                Announcement ID: <span className="font-semibold">{id}</span>
              </p>
            </div>
          )}
          <Button
            onClick={() => navigate('/core/system-announcements')}
            className="inline-flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại danh sách thông báo
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={handleCancel}
            className="mb-4 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại danh sách
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Bell className="w-6 h-6 text-indigo-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Chỉnh sửa thông báo hệ thống
            </h1>
          </div>
          
          <p className="text-gray-600 mt-2">
            Cập nhật thông tin thông báo "{announcement.title}"
          </p>
          
          {/* Metadata */}
          <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <span className="font-medium">ID:</span>
              <code className="px-2 py-0.5 bg-gray-100 rounded font-mono text-xs">
                {announcement._id}
              </code>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-medium">Version:</span>
              <code className="px-2 py-0.5 bg-gray-100 rounded font-mono text-xs">
                {announcement.version}
              </code>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-medium">Trạng thái:</span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                announcement.status === 'ACTIVE' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {announcement.status}
              </span>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <AnnouncementForm
            announcement={announcement}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            loading={updating}
          />
        </div>

        {/* Version Info */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">⚠️ Lưu ý về Optimistic Locking</p>
              <p className="text-yellow-700">
                Hệ thống sử dụng version control để tránh xung đột khi nhiều người cùng chỉnh sửa. 
                Nếu thông báo đã được cập nhật bởi người khác, bạn sẽ cần tải lại trang và nhập lại thay đổi.
              </p>
            </div>
          </div>
        </div>

        {/* Audit Info */}
        <div className="mt-4 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            📊 Thông tin audit
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Ngày tạo:</span>
              <p className="font-medium text-gray-900 mt-1">
                {new Date(announcement.created_at).toLocaleString('vi-VN')}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Cập nhật lần cuối:</span>
              <p className="font-medium text-gray-900 mt-1">
                {new Date(announcement.updated_at).toLocaleString('vi-VN')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
