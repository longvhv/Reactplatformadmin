/**
 * Application Settings Component
 */

import { useState } from 'react';
import { Settings as SettingsIcon, Power, PowerOff } from 'lucide-react';
import { Button } from '../../ui/button';
import type { Application } from '../../../data/applications';

interface ApplicationSettingsProps {
  application: Application;
  onUpdate: (data: Partial<Application>) => Promise<void>;
}

export function ApplicationSettings({ application, onUpdate }: ApplicationSettingsProps) {
  const handleToggleActive = async () => {
    if (!confirm(`Bạn có chắc muốn ${application.is_active ? 'vô hiệu hóa' : 'kích hoạt'} ứng dụng này?`)) return;
    try {
      await onUpdate({ is_active: !application.is_active });
    } catch (err) {
      alert('Failed to update status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Active Status */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Trạng thái hoạt động</h2>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">
                {application.is_active ? 'Ứng dụng đang hoạt động' : 'Ứng dụng không hoạt động'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {application.is_active 
                  ? 'Ứng dụng có thể được sử dụng bởi tenants'
                  : 'Ứng dụng đã bị vô hiệu hóa, không thể sử dụng'
                }
              </p>
            </div>

            <Button
              variant={application.is_active ? 'outline' : 'default'}
              onClick={handleToggleActive}
              className="gap-2"
            >
              {application.is_active ? (
                <>
                  <PowerOff className="w-4 h-4" />
                  Vô hiệu hóa
                </>
              ) : (
                <>
                  <Power className="w-4 h-4" />
                  Kích hoạt
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Version Info */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Phiên bản</h2>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Phiên bản hiện tại</p>
              <p className="text-sm text-gray-500 mt-1">
                Mỗi lần cập nhật ứng dụng sẽ tăng phiên bản lên 1
              </p>
            </div>
            <div className="text-3xl font-bold text-indigo-600">
              v{application.version}
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-lg shadow-sm border border-red-200">
        <div className="px-6 py-4 border-b border-red-200 bg-red-50">
          <h2 className="text-lg font-semibold text-red-900">Vùng nguy hiểm</h2>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="font-medium text-gray-900">Xóa ứng dụng</p>
                <p className="text-sm text-gray-500 mt-1">
                  Xóa vĩnh viễn ứng dụng này khỏi hệ thống. Hành động này không thể hoàn tác.
                </p>
              </div>
              <Button
                variant="outline"
                className="border-red-600 text-red-600 hover:bg-red-50"
              >
                Xóa ứng dụng
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <SettingsIcon className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="font-medium text-blue-900">Lưu ý về cài đặt</p>
            <p className="text-sm text-blue-700 mt-1">
              Các thay đổi về trạng thái hoạt động sẽ ảnh hưởng ngay lập tức đến tất cả tenants đang sử dụng ứng dụng này.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}