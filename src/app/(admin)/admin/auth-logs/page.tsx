/**
 * Auth Logs Page
 * Trang quản lý lịch sử truy cập toàn hệ thống
 * ✅ MIGRATED: Using Next.js shim for navigation
 */

'use client';

import React from 'react';
import { Shield, Info } from 'lucide-react';
import { AuthLogsTable } from '@/components/auth/AuthLogsTable';

function AuthLogsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 p-[0px]">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Shield className="w-6 h-6 text-indigo-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Lịch sử truy cập</h1>
          </div>
          <p className="text-gray-600">
            Theo dõi tất cả hoạt động đăng nhập, đăng xuất và xác thực trong hệ thống
          </p>
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">Thông tin quan trọng</p>
              <p className="text-blue-700">
                Lịch sử truy cập được lưu trữ tự động và giúp bạn theo dõi các hoạt động bảo mật. 
                Dữ liệu cũ hơn 90 ngày sẽ được tự động xóa để tối ưu hiệu suất.
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <AuthLogsTable showFilters showStats />
      </div>
    </div>
  );
}

// Named export for reuse
export { AuthLogsPage };

// Default export for routing
export default AuthLogsPage;
