/**
 * ApplicationOverview Component
 * Hiển thị thông tin tổng quan của application
 */

import { useState } from 'react';
import { 
  Code, 
  FileText, 
  Calendar,
  Edit,
  Check,
  X,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Application } from '@/data/applications';

interface ApplicationOverviewProps {
  application: Application;
  onUpdate: (data: Partial<Application>) => Promise<void>;
}

export function ApplicationOverview({ application, onUpdate }: ApplicationOverviewProps) {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: application.name,
    description: application.description || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate(formData);
      setEditing(false);
    } catch (err) {
      alert('Failed to update application');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: application.name,
      description: application.description || '',
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
    field,
    multiline = false
  }: { 
    icon: any; 
    label: string; 
    value?: string; 
    editable?: boolean;
    field?: string;
    multiline?: boolean;
  }) => (
    <div className="flex items-start gap-3 py-3 border-b last:border-0">
      <Icon className="w-5 h-5 text-gray-400 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        {editing && editable && field ? (
          multiline ? (
            <textarea
              value={formData[field as keyof typeof formData]}
              onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
              className="mt-1 w-full px-3 py-2 border rounded-md"
              rows={3}
            />
          ) : (
            <Input
              value={formData[field as keyof typeof formData]}
              onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
              className="mt-1"
            />
          )
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
              <Edit className="w-4 h-4" />
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
                <X className="w-4 h-4" />
                Hủy
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className="gap-2"
              >
                <Check className="w-4 h-4" />
                {saving ? 'Đang lưu...' : 'Lưu'}
              </Button>
            </div>
          )}
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <div>
              <InfoRow
                icon={Code}
                label="Mã ứng dụng"
                value={application.code}
              />
              <InfoRow
                icon={FileText}
                label="Tên ứng dụng"
                value={editing ? undefined : application.name}
                editable
                field="name"
              />
            </div>

            <div>
              <InfoRow
                icon={Calendar}
                label="Ngày tạo"
                value={formatDate(application.created_at)}
              />
              <InfoRow
                icon={Calendar}
                label="Cập nhật lần cuối"
                value={formatDate(application.updated_at)}
              />
              <InfoRow
                icon={Activity}
                label="Phiên bản"
                value={`v${application.version}`}
              />
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500">Mô tả</p>
                {editing ? (
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border rounded-md"
                    rows={4}
                    placeholder="Nhập mô tả ứng dụng..."
                  />
                ) : (
                  <p className="mt-1 text-gray-900 whitespace-pre-wrap">
                    {application.description || 'Chưa có mô tả'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Card */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Trạng thái</h2>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">
                {application.is_active ? 'Đang hoạt động' : 'Không hoạt động'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {application.is_active 
                  ? 'Ứng dụng hiện đang được sử dụng'
                  : 'Ứng dụng đã bị vô hiệu hóa'
                }
              </p>
            </div>
            <div className={`
              w-3 h-3 rounded-full
              ${application.is_active ? 'bg-green-500' : 'bg-gray-400'}
            `} />
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <p className="text-sm text-gray-500">Trạng thái</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {application.is_active ? (
              <span className="text-green-600">Active</span>
            ) : (
              <span className="text-gray-600">Inactive</span>
            )}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <p className="text-sm text-gray-500">Phiên bản</p>
          <p className="text-2xl font-bold text-indigo-600 mt-2">
            v{application.version}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <p className="text-sm text-gray-500">Mã ứng dụng</p>
          <code className="text-sm font-mono text-gray-900 mt-2 block">
            {application.code}
          </code>
        </div>
      </div>
    </div>
  );
}
