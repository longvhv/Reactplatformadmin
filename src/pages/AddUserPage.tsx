/**
 * Add User Page
 * Page for creating a new user
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function AddUserPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/core/users')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại danh sách
          </Button>
          
          <div className="flex items-center gap-3">
            <User className="w-8 h-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Tạo Người Dùng Mới
            </h1>
          </div>
        </div>

        {/* Coming Soon Card */}
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Trang đang được phát triển
          </h2>
          <p className="text-gray-600 mb-6">
            Tính năng tạo người dùng mới đang được hoàn thiện và sẽ sớm có mặt.
          </p>
          <div className="space-y-2 text-sm text-gray-500">
            <p>📝 Form nhập email và thông tin cá nhân</p>
            <p>👤 Upload avatar</p>
            <p>📞 Nhập số điện thoại</p>
            <p>🌍 Chọn ngôn ngữ (locale)</p>
            <p>🎯 Gán vai trò (roles)</p>
            <p>🔐 Thiết lập mật khẩu hoặc gửi email kích hoạt</p>
            <p>✅ Kích hoạt ngay hoặc để pending</p>
          </div>
          <Button
            onClick={() => navigate('/core/users')}
            className="mt-6"
          >
            Quay lại danh sách người dùng
          </Button>
        </div>
      </div>
    </div>
  );
}
