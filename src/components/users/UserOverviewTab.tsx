/**
 * UserOverviewTab Component
 * Displays user overview information
 */

import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import {
  Mail,
  Phone,
  Globe,
  Calendar,
  Clock,
  Shield,
  CheckCircle,
  Crown,
} from 'lucide-react';

interface UserOverviewTabProps {
  userId: string;
  user: {
    _id: string;
    email: string;
    full_name: string;
    avatar_url?: string;
    phone?: string;
    phone_number?: string;
    status: string;
    is_support_staff?: boolean;
    mfa_enabled?: boolean;
    is_verified?: boolean;
    email_verified?: boolean;
    locale?: string;
    metadata?: Record<string, any>;
    created_at: string;
    updated_at: string;
  };
}

export function UserOverviewTab({ userId, user }: UserOverviewTabProps) {
  const phoneNumber = user.phone || user.phone_number;
  const isVerified = user.is_verified || user.email_verified;
  
  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Thông tin cơ bản
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">
              Họ và tên
            </label>
            <p className="text-base text-gray-900">{user.full_name}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">
              Email
            </label>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-400" />
              <p className="text-base text-gray-900">{user.email}</p>
              {isVerified && (
                <CheckCircle className="w-4 h-4 text-green-600" />
              )}
            </div>
          </div>

          {phoneNumber && (
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 block">
                Số điện thoại
              </label>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <p className="text-base text-gray-900">{phoneNumber}</p>
              </div>
            </div>
          )}

          {user.locale && (
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 block">
                Ngôn ngữ
              </label>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-gray-400" />
                <p className="text-base text-gray-900">{user.locale}</p>
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">
              Trạng thái
            </label>
            <Badge
              className={
                user.status === 'ACTIVE'
                  ? 'bg-green-100 text-green-800'
                  : user.status === 'PENDING'
                  ? 'bg-yellow-100 text-yellow-800'
                  : user.status === 'SUSPENDED'
                  ? 'bg-orange-100 text-orange-800'
                  : user.status === 'LOCKED'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-800'
              }
            >
              {user.status}
            </Badge>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">
              User ID
            </label>
            <p className="text-sm font-mono text-gray-600">{user._id}</p>
          </div>
        </div>
      </Card>

      {/* Security Info */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Bảo mật</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Shield className="w-5 h-5 text-indigo-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">MFA Status</p>
              <p className="text-sm text-gray-600">
                {user.mfa_enabled ? 'Enabled' : 'Disabled'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">Email Verified</p>
              <p className="text-sm text-gray-600">
                {isVerified ? 'Yes' : 'No'}
              </p>
            </div>
          </div>

          {user.is_support_staff && (
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
              <Crown className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-purple-900">
                  Support Staff
                </p>
                <p className="text-sm text-purple-700">
                  Has elevated permissions
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Timestamps */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Lịch sử hoạt động
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">Ngày tạo</p>
              <p className="text-sm text-gray-600">
                {new Date(user.created_at).toLocaleString('vi-VN')}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {Math.floor(
                  (Date.now() - new Date(user.created_at).getTime()) /
                    (1000 * 60 * 60 * 24)
                )}{' '}
                ngày trước
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">Cập nhật lần cuối</p>
              <p className="text-sm text-gray-600">
                {new Date(user.updated_at).toLocaleString('vi-VN')}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {Math.floor(
                  (Date.now() - new Date(user.updated_at).getTime()) /
                    (1000 * 60 * 60)
                )}{' '}
                giờ trước
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Metadata */}
      {user.metadata && Object.keys(user.metadata).length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Metadata</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <pre className="text-sm text-gray-900 overflow-x-auto">
              {JSON.stringify(user.metadata, null, 2)}
            </pre>
          </div>
        </Card>
      )}
    </div>
  );
}