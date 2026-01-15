/**
 * TenantDetailView Component
 * Hiển thị chi tiết overview của tenant
 */

import { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  Globe, 
  Shield, 
  CreditCard,
  Calendar,
  Settings,
  Edit,
  GitBranch,
  Clock,
  Database
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Tenant } from '@/data/tenants';

interface TenantDetailViewProps {
  tenant: Tenant;
}

export function TenantDetailView({ tenant }: TenantDetailViewProps) {
  const [showRawData, setShowRawData] = useState(false);

  // Parse JSONB fields
  const profile = typeof tenant.profile === 'string' 
    ? JSON.parse(tenant.profile) 
    : tenant.profile || {};
  
  const settings = typeof tenant.settings === 'string'
    ? JSON.parse(tenant.settings)
    : tenant.settings || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Tổng quan Tenant</h2>
        <p className="text-sm text-gray-600">
          Thông tin chi tiết và cấu hình của tenant
        </p>
      </div>

      {/* Basic Info */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-lg bg-indigo-50">
            <Building2 className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Thông tin cơ bản</h3>
            <p className="text-sm text-gray-500">Định danh và cấu hình chính</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">Tên Tenant</label>
            <p className="text-sm font-semibold text-gray-900 mt-1">{tenant.name}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">Code (Subdomain)</label>
            <p className="text-sm font-mono font-semibold text-gray-900 mt-1">
              {tenant.code}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">Tier</label>
            <div className="mt-1">
              <Badge variant="outline" className="font-semibold">
                {tenant.tier}
              </Badge>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">Status</label>
            <div className="mt-1">
              <Badge className={
                tenant.status === 'active' ? 'bg-green-100 text-green-800' :
                tenant.status === 'trial' ? 'bg-blue-100 text-blue-800' :
                tenant.status === 'suspended' ? 'bg-orange-100 text-orange-800' :
                'bg-gray-100 text-gray-800'
              }>
                {tenant.status}
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Infrastructure & Compliance */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-lg bg-purple-50">
            <Globe className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Hạ tầng & Tuân thủ</h3>
            <p className="text-sm text-gray-500">Vùng dữ liệu và yêu cầu tuân thủ</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              Data Region
            </label>
            <p className="text-sm font-semibold text-gray-900 mt-1">{tenant.data_region}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase flex items-center gap-1">
              <Shield className="w-3 h-3" />
              Compliance Level
            </label>
            <p className="text-sm font-semibold text-gray-900 mt-1">{tenant.compliance_level}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase flex items-center gap-1">
              <CreditCard className="w-3 h-3" />
              Billing Type
            </label>
            <p className="text-sm font-semibold text-gray-900 mt-1">{tenant.billing_type}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Timezone
            </label>
            <p className="text-sm font-semibold text-gray-900 mt-1">{tenant.timezone}</p>
          </div>
        </div>
      </Card>

      {/* Profile (JSONB) */}
      {Object.keys(profile).length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-green-50">
                <Building2 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Thông tin doanh nghiệp</h3>
                <p className="text-sm text-gray-500">Hồ sơ và thông tin liên hệ</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile.company_name && (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Tên công ty</label>
                <p className="text-sm font-semibold text-gray-900 mt-1">{profile.company_name}</p>
              </div>
            )}
            {profile.tax_code && (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Mã số thuế</label>
                <p className="text-sm font-mono font-semibold text-gray-900 mt-1">{profile.tax_code}</p>
              </div>
            )}
            {profile.industry && (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Ngành nghề</label>
                <p className="text-sm font-semibold text-gray-900 mt-1">{profile.industry}</p>
              </div>
            )}
            {profile.size && (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Quy mô</label>
                <p className="text-sm font-semibold text-gray-900 mt-1">{profile.size}</p>
              </div>
            )}
            {profile.website && (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Website</label>
                <a 
                  href={profile.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-indigo-600 hover:underline mt-1 block"
                >
                  {profile.website}
                </a>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Settings (JSONB) */}
      {Object.keys(settings).length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-blue-50">
                <Settings className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Cấu hình hệ thống</h3>
                <p className="text-sm text-gray-500">Thiết lập và tính năng</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRawData(!showRawData)}
            >
              <Database className="w-4 h-4 mr-2" />
              {showRawData ? 'Ẩn JSON' : 'Xem JSON'}
            </Button>
          </div>

          {showRawData ? (
            <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-auto max-h-96">
              {JSON.stringify(settings, null, 2)}
            </pre>
          ) : (
            <div className="space-y-4">
              {settings.security && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Bảo mật</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {settings.security.mfa_required !== undefined && (
                      <div className="flex items-center gap-2">
                        <Badge variant={settings.security.mfa_required ? 'default' : 'secondary'}>
                          MFA: {settings.security.mfa_required ? 'Bắt buộc' : 'Tùy chọn'}
                        </Badge>
                      </div>
                    )}
                    {settings.security.session_timeout && (
                      <div className="text-sm">
                        <span className="text-gray-600">Session:</span>{' '}
                        <span className="font-semibold">{settings.security.session_timeout}s</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {settings.features && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Tính năng</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(settings.features).map(([key, value]) => (
                      <Badge 
                        key={key} 
                        variant={value ? 'default' : 'secondary'}
                        className="capitalize"
                      >
                        {key.replace(/_/g, ' ')}: {value ? '✓' : '✗'}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {settings.quotas && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Hạn mức</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(settings.quotas).map(([key, value]) => (
                      <div key={key} className="text-sm">
                        <span className="text-gray-600 capitalize">{key.replace(/_/g, ' ')}:</span>{' '}
                        <span className="font-semibold">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Hierarchy */}
      {tenant.parent_tenant_id && (
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-orange-50">
              <GitBranch className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Phân cấp</h3>
              <p className="text-sm text-gray-500">Quan hệ cha - con</p>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">Parent Tenant ID</label>
            <p className="text-sm font-mono font-semibold text-gray-900 mt-1">
              {tenant.parent_tenant_id}
            </p>
            {tenant.path && (
              <>
                <label className="text-xs font-medium text-gray-500 uppercase mt-3 block">Path</label>
                <p className="text-sm font-mono text-gray-900 mt-1">{tenant.path}</p>
              </>
            )}
          </div>
        </Card>
      )}

      {/* Metadata */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-lg bg-gray-50">
            <Calendar className="w-6 h-6 text-gray-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Metadata</h3>
            <p className="text-sm text-gray-500">Thông tin hệ thống</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">Created At</label>
            <p className="text-sm font-semibold text-gray-900 mt-1">
              {new Date(tenant.created_at).toLocaleString('vi-VN')}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">Updated At</label>
            <p className="text-sm font-semibold text-gray-900 mt-1">
              {new Date(tenant.updated_at).toLocaleString('vi-VN')}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">Version</label>
            <p className="text-sm font-semibold text-gray-900 mt-1">v{tenant.version}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
