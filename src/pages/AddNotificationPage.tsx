/**
 * Add System Announcement Page
 * Page for creating a new system announcement/notification
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Bell, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { AnnouncementForm } from '../components/announcements/AnnouncementForm';
import { systemAnnouncementApi, CreateSystemAnnouncementRequest } from '../api/systemAnnouncementApi';
import { toast } from 'sonner@2.0.3';

export default function AddNotificationPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: CreateSystemAnnouncementRequest) => {
    setLoading(true);
    
    try {
      console.log('📝 Creating system announcement:', data);
      
      const response = await systemAnnouncementApi.create(data);
      
      console.log('✅ System announcement created:', response);
      
      // Show success toast
      toast.success('Tạo thông báo thành công!', {
        description: `Thông báo "${data.title}" đã được tạo và đang hoạt động`,
        duration: 5000,
      });
      
      // Navigate back to list
      navigate('/core/system-announcements');
      
    } catch (error: any) {
      console.error('❌ Error creating system announcement:', error);
      
      const errorMessage = error?.message || 'Không thể tạo thông báo';
      
      toast.error('Tạo thông báo thất bại', {
        description: errorMessage,
        duration: 7000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/core/system-announcements');
  };

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
              Tạo thông báo hệ thống
            </h1>
          </div>
          
          <p className="text-gray-600 mt-2">
            Tạo thông báo mới để hiển thị cho người dùng trong hệ thống
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <AnnouncementForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            loading={loading}
          />
        </div>

        {/* Help Section */}
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            💡 Hướng dẫn sử dụng
          </h3>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <p>
                <strong>Tiêu đề:</strong> Ngắn gọn, rõ ràng về nội dung thông báo (50-100 ký tự)
              </p>
            </div>
            <div className="flex gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <p>
                <strong>Nội dung:</strong> Mô tả chi tiết, có thể dùng Markdown để định dạng
              </p>
            </div>
            <div className="flex gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <p>
                <strong>Mức độ ưu tiên:</strong> INFO (thông tin chung), WARNING (cảnh báo), CRITICAL (khẩn cấp)
              </p>
            </div>
            <div className="flex gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <p>
                <strong>Ngày bắt đầu:</strong> Thời điểm thông báo bắt đầu hiển thị
              </p>
            </div>
            <div className="flex gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <p>
                <strong>Ngày kết thúc:</strong> Tùy chọn - thông báo sẽ tự ẩn sau thời điểm này
              </p>
            </div>
          </div>
        </div>

        {/* Examples */}
        <div className="mt-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg border border-indigo-200 p-6">
          <h3 className="text-sm font-semibold text-indigo-900 mb-3">
            📋 Ví dụ về các loại thông báo
          </h3>
          <div className="space-y-3">
            <div className="bg-white/80 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-0.5 rounded">INFO</span>
                <span className="text-sm font-medium text-gray-900">Cập nhật tính năng mới</span>
              </div>
              <p className="text-xs text-gray-600 ml-14">
                Chúng tôi vừa ra mắt tính năng xuất báo cáo tự động. Xem chi tiết tại...
              </p>
            </div>
            <div className="bg-white/80 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded">WARNING</span>
                <span className="text-sm font-medium text-gray-900">Bảo trì hệ thống</span>
              </div>
              <p className="text-xs text-gray-600 ml-20">
                Hệ thống sẽ bảo trì vào 2:00 AM ngày 20/01. Dự kiến hoàn thành sau 2 giờ.
              </p>
            </div>
            <div className="bg-white/80 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded">CRITICAL</span>
                <span className="text-sm font-medium text-gray-900">Cập nhật bảo mật khẩn cấp</span>
              </div>
              <p className="text-xs text-gray-600 ml-20">
                Vui lòng cập nhật mật khẩu của bạn ngay lập tức để đảm bảo an toàn tài khoản.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
