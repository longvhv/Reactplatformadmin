/**
 * Edit Role Page
 * Page for editing an existing role
 */

import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function EditRolePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/core/roles')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại danh sách
          </Button>
          
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Chỉnh Sửa Vai Trò
            </h1>
          </div>
          {id && (
            <p className="text-sm text-gray-500 mt-2">
              Role ID: {id}
            </p>
          )}
        </div>

        {/* Coming Soon Card */}
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Trang đang được phát triển
          </h2>
          <p className="text-gray-600 mb-6">
            Tính năng chỉnh sửa vai trò đang được hoàn thiện và sẽ sớm có mặt.
          </p>
          <div className="space-y-2 text-sm text-gray-500">
            <p>📝 Cập nhật tên và mô tả vai trò</p>
            <p>🔐 Thay đổi quyền hạn (permissions)</p>
            <p>🎨 Chuyển đổi loại vai trò (nếu cho phép)</p>
            <p>⏸️ Pause/Resume vai trò</p>
            <p>👥 Preview danh sách quyền hiện tại</p>
          </div>
          <Button
            onClick={() => navigate('/core/roles')}
            className="mt-6"
          >
            Quay lại danh sách vai trò
          </Button>
        </div>
      </div>
    </div>
  );
}
