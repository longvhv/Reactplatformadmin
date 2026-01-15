/**
 * Add System Announcement Page
 * Page for creating a new system announcement/notification
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function AddNotificationPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/core/system-announcements')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại danh sách
          </Button>
          
          <div className="flex items-center gap-3">
            <Bell className="w-8 h-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Tạo thông báo hệ thống
            </h1>
          </div>
        </div>

        {/* Coming Soon Card */}
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Trang đang được phát triển
          </h2>
          <p className="text-gray-600 mb-6">
            Tính năng tạo thông báo hệ thống mới đang được hoàn thiện và sẽ sớm có mặt.
          </p>
          <div className="space-y-2 text-sm text-gray-500">
            <p>📝 Form nhập tiêu đề đa ngôn ngữ (vi, en, ja, ko, zh, es)</p>
            <p>📄 Nhập nội dung thông báo đa ngôn ngữ</p>
            <p>🎨 Chọn loại thông báo (INFO, WARNING, CRITICAL, PROMOTION)</p>
            <p>📅 Thiết lập thời gian bắt đầu/kết thúc</p>
            <p>🎯 Chọn đối tượng nhận (tất cả users, specific tenants)</p>
            <p>✅ Kích hoạt ngay hoặc lên lịch</p>
          </div>
          <Button
            onClick={() => navigate('/core/system-announcements')}
            className="mt-6"
          >
            Quay lại danh sách thông báo
          </Button>
        </div>
      </div>
    </div>
  );
}
