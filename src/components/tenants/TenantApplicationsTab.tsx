/**
 * TenantApplicationsTab Component
 * Displays applications assigned to a tenant
 * Design: Stripe/GitHub/Vercel-inspired applications management
 */

import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  RefreshCw,
  Filter,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Users,
  Calendar,
  Settings,
  Shield,
  Power,
  PowerOff,
  Edit,
  Trash2,
  MoreVertical,
} from 'lucide-react';
import {
  tenantApplicationsApi,
  TenantApplication,
  TenantApplicationStatistics,
  LicenseType,
  getLicenseTypeLabel,
  getLicenseTypeColor,
  getStatusBadgeColor,
  isExpired,
  isExpiringSoon,
  formatExpiryText,
  getDaysUntilExpiry,
} from '@/api/tenantApplicationsApi';
import { formatDate } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner@2.0.3';

interface TenantApplicationsTabProps {
  tenantId: string;
}

export const TenantApplicationsTab: React.FC<TenantApplicationsTabProps> = ({ tenantId }) => {
  const [applications, setApplications] = useState<TenantApplication[]>([]);
  const [statistics, setStatistics] = useState<TenantApplicationStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    is_active: undefined as boolean | undefined,
    license_type: '' as LicenseType | '',
  });
  const [selectedApp, setSelectedApp] = useState<TenantApplication | null>(null);
  const [showActions, setShowActions] = useState<string | null>(null);

  useEffect(() => {
    loadApplications();
  }, [tenantId, filter]);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const filters: any = { tenant_id: tenantId };
      
      if (filter.is_active !== undefined) {
        filters.is_active = filter.is_active;
      }
      if (filter.license_type) {
        filters.license_type = filter.license_type;
      }

      const [appsData, statsData] = await Promise.all([
        tenantApplicationsApi.getAll(filters),
        tenantApplicationsApi.getStatistics(tenantId),
      ]);

      setApplications(appsData);
      setStatistics(statsData);
    } catch (error) {
      console.error('Failed to load tenant applications:', error);
      toast.error('Không thể tải danh sách ứng dụng');
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (app: TenantApplication) => {
    try {
      await tenantApplicationsApi.activate(app._id);
      toast.success(`Đã kích hoạt ${app.app_code}`);
      loadApplications();
    } catch (error: any) {
      console.error('Failed to activate application:', error);
      toast.error('Không thể kích hoạt: ' + error.message);
    }
  };

  const handleDeactivate = async (app: TenantApplication) => {
    try {
      await tenantApplicationsApi.deactivate(app._id);
      toast.success(`Đã vô hiệu hóa ${app.app_code}`);
      loadApplications();
    } catch (error: any) {
      console.error('Failed to deactivate application:', error);
      toast.error('Không thể vô hiệu hóa: ' + error.message);
    }
  };

  const handleDelete = async (app: TenantApplication) => {
    if (!confirm(`Bạn có chắc muốn xóa ứng dụng ${app.app_code}?`)) return;

    try {
      await tenantApplicationsApi.delete(app._id);
      toast.success('Đã xóa ứng dụng');
      loadApplications();
    } catch (error: any) {
      console.error('Failed to delete application:', error);
      toast.error('Không thể xóa: ' + error.message);
    }
  };

  const handleRefresh = () => {
    loadApplications();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin" />
        <span className="ml-2 text-gray-600">Đang tải danh sách ứng dụng...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Ứng dụng</h2>
          <p className="text-sm text-gray-600 mt-1">
            Quản lý các ứng dụng được gán cho tenant
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Làm mới
          </Button>
          <Button
            variant="default"
            size="sm"
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Thêm ứng dụng
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tổng ứng dụng</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {statistics.total_apps}
                </p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Đang hoạt động</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {statistics.active_apps}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Sắp hết hạn</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">
                  {statistics.expiring_soon}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tổng Users</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">
                  {statistics.total_max_users}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Filter className="w-4 h-4" />
            <span className="font-medium">Bộ lọc:</span>
          </div>

          {/* Status Filter */}
          <select
            value={filter.is_active === undefined ? '' : filter.is_active.toString()}
            onChange={(e) => setFilter({
              ...filter,
              is_active: e.target.value === '' ? undefined : e.target.value === 'true'
            })}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="true">Đang hoạt động</option>
            <option value="false">Không hoạt động</option>
          </select>

          {/* License Type Filter */}
          <select
            value={filter.license_type}
            onChange={(e) => setFilter({ ...filter, license_type: e.target.value as LicenseType | '' })}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Tất cả loại license</option>
            <option value="TRIAL">Dùng thử</option>
            <option value="BASIC">Cơ bản</option>
            <option value="PREMIUM">Cao cấp</option>
            <option value="ENTERPRISE">Doanh nghiệp</option>
          </select>

          {(filter.is_active !== undefined || filter.license_type) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilter({ is_active: undefined, license_type: '' })}
              className="text-gray-600"
            >
              Xóa bộ lọc
            </Button>
          )}
        </div>
      </Card>

      {/* License Type Breakdown */}
      {statistics && Object.values(statistics.by_license_type).some(v => v > 0) && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Phân loại theo License
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(Object.entries(statistics.by_license_type) as [LicenseType, number][]).map(([type, count]) => (
              <div key={type} className="text-center p-4 bg-gray-50 rounded-lg">
                <Badge className={getLicenseTypeColor(type)}>
                  {getLicenseTypeLabel(type)}
                </Badge>
                <p className="text-2xl font-bold text-gray-900 mt-2">{count}</p>
                <p className="text-xs text-gray-500">ứng dụng</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Applications List */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900">
            Danh sách ứng dụng
          </h3>
        </div>

        {applications.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">Chưa có ứng dụng nào</p>
            <p className="text-sm text-gray-500 mt-1">
              Nhấn "Thêm ứng dụng" để bắt đầu
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {applications.map((app) => {
              const daysUntilExpiry = getDaysUntilExpiry(app.expires_at);
              const expired = isExpired(app.expires_at);
              const expiringSoon = isExpiringSoon(app.expires_at);

              return (
                <div key={app._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    {/* Left: App Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">
                            {app.app_code}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={getStatusBadgeColor(app.is_active)}>
                              {app.is_active ? 'Hoạt động' : 'Không hoạt động'}
                            </Badge>
                            <Badge className={getLicenseTypeColor(app.license_type)}>
                              {getLicenseTypeLabel(app.license_type)}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-3 gap-4 mt-4 ml-13">
                        {/* Max Users */}
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-xs text-gray-500">Max Users</p>
                            <p className="text-sm font-medium text-gray-900">
                              {app.max_users} users
                            </p>
                          </div>
                        </div>

                        {/* Expiry */}
                        <div className="flex items-center gap-2">
                          <Calendar className={`w-4 h-4 ${
                            expired ? 'text-red-500' :
                            expiringSoon ? 'text-orange-500' :
                            'text-gray-400'
                          }`} />
                          <div>
                            <p className="text-xs text-gray-500">Hết hạn</p>
                            <p className={`text-sm font-medium ${
                              expired ? 'text-red-600' :
                              expiringSoon ? 'text-orange-600' :
                              'text-gray-900'
                            }`}>
                              {formatExpiryText(app.expires_at)}
                            </p>
                          </div>
                        </div>

                        {/* Activated At */}
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-xs text-gray-500">
                              {app.is_active ? 'Kích hoạt lúc' : 'Vô hiệu hóa lúc'}
                            </p>
                            <p className="text-sm font-medium text-gray-900">
                              {app.is_active && app.activated_at
                                ? formatDate(app.activated_at)
                                : !app.is_active && app.deactivated_at
                                ? formatDate(app.deactivated_at)
                                : 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2">
                      {/* Toggle Active */}
                      <Button
                        variant={app.is_active ? 'outline' : 'default'}
                        size="sm"
                        onClick={() => app.is_active ? handleDeactivate(app) : handleActivate(app)}
                        className="gap-2"
                      >
                        {app.is_active ? (
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

                      {/* More Actions */}
                      <div className="relative">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowActions(showActions === app._id ? null : app._id)}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>

                        {showActions === app._id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border z-10">
                            <div className="py-1">
                              <button
                                onClick={() => {
                                  setShowActions(null);
                                  // TODO: Open edit dialog
                                }}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                              >
                                <Edit className="w-4 h-4" />
                                Chỉnh sửa
                              </button>
                              <button
                                onClick={() => {
                                  setShowActions(null);
                                  // TODO: Open settings dialog
                                }}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                              >
                                <Settings className="w-4 h-4" />
                                Cài đặt
                              </button>
                              <button
                                onClick={() => {
                                  setShowActions(null);
                                  handleDelete(app);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" />
                                Xóa
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Warning for expiring/expired apps */}
                  {(expired || expiringSoon) && (
                    <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${
                      expired ? 'bg-red-50 border border-red-200' : 'bg-orange-50 border border-orange-200'
                    }`}>
                      <AlertTriangle className={`w-4 h-4 ${expired ? 'text-red-600' : 'text-orange-600'}`} />
                      <p className={`text-sm ${expired ? 'text-red-900' : 'text-orange-900'}`}>
                        {expired
                          ? `Ứng dụng này đã hết hạn ${Math.abs(daysUntilExpiry!)} ngày trước`
                          : `Ứng dụng này sẽ hết hạn trong ${daysUntilExpiry} ngày`
                        }
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Info Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">Thông tin về ứng dụng</p>
            <p className="text-blue-700">
              Mỗi ứng dụng có license type riêng với giới hạn max users và thời gian hết hạn.
              Bạn có thể kích hoạt/vô hiệu hóa ứng dụng bất cứ lúc nào.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
