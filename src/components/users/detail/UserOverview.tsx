/**
 * UserOverview Component  
 * Hiển thị tổng quan thông tin user
 */

import { useState } from 'react';
import { 
  Mail,
  Phone,
  Calendar,
  Clock,
  Shield,
  CheckCircle,
  XCircle,
  Edit2,
  Save,
  X as XIcon
} from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import type { User } from '../../../data/users';

interface UserOverviewProps {
  user: User;
  onUpdate: (data: Partial<User>) => Promise<void>;
}

export function UserOverview({ user, onUpdate }: UserOverviewProps) {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user.full_name,
    email: user.email,
    phone_number: user.phone_number || '',
    avatar_url: user.avatar_url || '',
    locale: user.locale,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate(formData);
      setEditing(false);
    } catch (err) {
      alert('Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      full_name: user.full_name,
      email: user.email,
      phone_number: user.phone_number || '',
      avatar_url: user.avatar_url || '',
      locale: user.locale,
    });
    setEditing(false);
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

  const InfoRow = ({ 
    icon: Icon, 
    label, 
    value, 
    editable = false,
    field 
  }: { 
    icon: any; 
    label: string; 
    value?: string; 
    editable?: boolean;
    field?: string;
  }) => (
    <div className="flex items-start gap-3 py-3 border-b last:border-0">
      <Icon className="w-5 h-5 text-gray-400 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        {editing && editable && field ? (
          <Input
            value={formData[field as keyof typeof formData]}
            onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
            className="mt-1"
          />
        ) : (
          <p className="mt-1 text-gray-900">{value || '-'}</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Basic Info Card */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">Thông tin cơ bản</h2>
          {!editing ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditing(true)}
              className="gap-2"
            >
              <Edit2 className="w-4 h-4" />
              Chỉnh sửa
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                className="gap-2"
              >
                <XIcon className="w-4 h-4" />
                Hủy
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className="gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Đang lưu...' : 'Lưu'}
              </Button>
            </div>
          )}
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <div>
              <InfoRow
                icon={UserIcon}
                label="Họ và tên"
                value={editing ? undefined : user.full_name}
                editable
                field="full_name"
              />
              <InfoRow
                icon={Mail}
                label="Email"
                value={editing ? undefined : user.email}
                editable
                field="email"
              />
              <InfoRow
                icon={Phone}
                label="Số điện thoại"
                value={editing ? undefined : user.phone_number}
                editable
                field="phone_number"
              />
            </div>

            <div>
              <InfoRow
                icon={Globe}
                label="Ngôn ngữ"
                value={editing ? undefined : user.locale}
                editable
                field="locale"
              />
              <InfoRow
                icon={Calendar}
                label="Ngày tạo"
                value={formatDate(user.created_at)}
              />
              <InfoRow
                icon={Calendar}
                label="Cập nhật lần cuối"
                value={formatDate(user.updated_at)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Metadata Card */}
      {user.metadata && Object.keys(user.metadata).length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">Metadata</h2>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(user.metadata).map(([key, value]) => (
                <div key={key} className="border-b pb-3">
                  <p className="text-sm font-medium text-gray-500 capitalize">
                    {key.replace(/_/g, ' ')}
                  </p>
                  <p className="mt-1 text-gray-900">
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stats Card */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Thống kê</h2>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-indigo-600">
                {user.status === 'ACTIVE' ? '✓' : '-'}
              </p>
              <p className="text-sm text-gray-500 mt-1">Trạng thái</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">
                {user.is_verified ? '✓' : '✗'}
              </p>
              <p className="text-sm text-gray-500 mt-1">Đã xác thực</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">
                {user.mfa_enabled ? '✓' : '✗'}
              </p>
              <p className="text-sm text-gray-500 mt-1">MFA</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">
                {user.is_support_staff ? '✓' : '✗'}
              </p>
              <p className="text-sm text-gray-500 mt-1">Support Staff</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}