/**
 * TenantOverview Component
 * Hiển thị thông tin tổng quan của tenant
 */

import { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  Globe, 
  Mail, 
  Phone, 
  Calendar,
  Shield,
  Server,
  Clock,
  Edit,
  Check,
  X
} from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import type { Tenant } from '../../../data/tenants';

interface TenantOverviewProps {
  tenant: Tenant;
  onUpdate: (data: Partial<Tenant>) => Promise<void>;
}

export function TenantOverview({ tenant, onUpdate }: TenantOverviewProps) {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: tenant.name,
    timezone: tenant.timezone,
    profile: tenant.profile || {},
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate(formData);
      setEditing(false);
    } catch (err) {
      alert('Failed to update tenant');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: tenant.name,
      timezone: tenant.timezone,
      profile: tenant.profile || {},
    });
    setEditing(false);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
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
            value={field.includes('.') 
              ? formData.profile[field.split('.')[1]] || ''
              : formData[field as keyof typeof formData] as string
            }
            onChange={(e) => {
              if (field.includes('.')) {
                const profileField = field.split('.')[1];
                setFormData({
                  ...formData,
                  profile: { ...formData.profile, [profileField]: e.target.value }
                });
              } else {
                setFormData({ ...formData, [field]: e.target.value });
              }
            }}
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
                icon={Building2}
                label="Tên công ty"
                value={editing ? undefined : tenant.name}
                editable
                field="name"
              />
              <InfoRow
                icon={Globe}
                label="Website"
                value={editing ? undefined : tenant.profile?.website}
                editable
                field="profile.website"
              />
              <InfoRow
                icon={Mail}
                label="Email"
                value={editing ? undefined : tenant.profile?.billing_email}
                editable
                field="profile.billing_email"
              />
              <InfoRow
                icon={Phone}
                label="Điện thoại"
                value={editing ? undefined : tenant.profile?.phone}
                editable
                field="profile.phone"
              />
            </div>

            <div>
              <InfoRow
                icon={MapPin}
                label="Địa chỉ"
                value={editing ? undefined : tenant.profile?.address}
                editable
                field="profile.address"
              />
              <InfoRow
                icon={Building2}
                label="Mã số thuế"
                value={editing ? undefined : tenant.profile?.tax_code}
                editable
                field="profile.tax_code"
              />
              <InfoRow
                icon={Building2}
                label="Ngành nghề"
                value={editing ? undefined : tenant.profile?.industry}
                editable
                field="profile.industry"
              />
              <InfoRow
                icon={Building2}
                label="Quy mô"
                value={editing ? undefined : tenant.profile?.company_size}
                editable
                field="profile.company_size"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Technical Info Card */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Thông tin kỹ thuật</h2>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <div>
              <InfoRow
                icon={Server}
                label="Data Region"
                value={tenant.data_region || '-'}
              />
              <InfoRow
                icon={Shield}
                label="Compliance Level"
                value={tenant.compliance_level || '-'}
              />
              <InfoRow
                icon={Clock}
                label="Timezone"
                value={editing ? undefined : tenant.timezone}
                editable
                field="timezone"
              />
            </div>

            <div>
              <InfoRow
                icon={Calendar}
                label="Ngày tạo"
                value={tenant.created_at ? formatDate(tenant.created_at) : '-'}
              />
              <InfoRow
                icon={Calendar}
                label="Cập nhật lần cuối"
                value={tenant.updated_at ? formatDate(tenant.updated_at) : '-'}
              />
              <InfoRow
                icon={Building2}
                label="Version"
                value={tenant.version?.toString() || '1'}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Card */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Thống kê</h2>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-indigo-600">
                {tenant.member_count || 0}
              </p>
              <p className="text-sm text-gray-500 mt-1">Thành viên</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">
                {tenant.settings?.limits?.max_users || 0}
              </p>
              <p className="text-sm text-gray-500 mt-1">Giới hạn users</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">
                {tenant.settings?.limits?.storage_gb || 0} GB
              </p>
              <p className="text-sm text-gray-500 mt-1">Storage</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">
                {tenant.billing_type || 'N/A'}
              </p>
              <p className="text-sm text-gray-500 mt-1">Billing</p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Card */}
      {tenant.settings?.features && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">Tính năng</h2>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(tenant.settings.features).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  {value ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <X className="w-5 h-5 text-gray-400" />
                  )}
                  <span className="text-sm capitalize">
                    {key.replace(/_/g, ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}