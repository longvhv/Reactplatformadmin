/**
 * AuthLogsTable Component
 * Reusable component hiển thị lịch sử truy cập
 * Dùng chung cho: Global, Tenant, User
 */

import React, { useState } from 'react';
import { useAuthLogs } from '../../hooks/useAuthLogs';
import { AuthLogFilters } from '../../api/authLogsApi';
import {
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  MapPin,
  Calendar,
  Filter,
  Download,
  RefreshCw,
} from 'lucide-react';

import { useTranslation } from 'react-i18next';

interface AuthLogsTableProps {
  userId?: string;
  tenantId?: string;
  limit?: number;
  showFilters?: boolean;
  showStats?: boolean;
}

export function AuthLogsTable({
  userId,
  tenantId,
  limit = 100,
  showFilters = true,
  showStats = true,
}: AuthLogsTableProps) {
  const [filters, setFilters] = useState<AuthLogFilters>({
    user_id: userId,
    tenant_id: tenantId,
    limit,
  });

  const { logs, stats, loading, refresh } = useAuthLogs(filters);

  const { t } = useTranslation();

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'blocked':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      default:
        return <Shield className="w-4 h-4 text-gray-600" />;
    }
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'failed':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'blocked':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  // Get action badge color
  const getActionColor = (action: string) => {
    switch (action) {
      case 'login':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'logout':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      case 'login_failed':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'password_reset':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'signup':
        return 'bg-green-50 text-green-700 border-green-200';
      default:
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
  };

  // Get device icon
  const getDeviceIcon = (deviceType?: string) => {
    switch (deviceType) {
      case 'desktop':
        return <Monitor className="w-4 h-4" />;
      case 'mobile':
        return <Smartphone className="w-4 h-4" />;
      case 'tablet':
        return <Tablet className="w-4 h-4" />;
      default:
        return <Globe className="w-4 h-4" />;
    }
  };

  // Format date
  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return d.toLocaleDateString('vi-VN') + ' ' + d.toLocaleTimeString('vi-VN');
  };

  // Handle filter change
  const handleFilterChange = (key: string, value: any) => {
    setFilters({ ...filters, [key]: value || undefined });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-500">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      {showStats && stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Tổng số</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_logs}</p>
              </div>
              <Shield className="w-8 h-8 text-gray-400" />
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700">Thành công</p>
                <p className="text-2xl font-bold text-green-900">{stats.successful_logins}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700">Thất bại</p>
                <p className="text-2xl font-bold text-red-900">{stats.failed_logins}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-700">Bị chặn</p>
                <p className="text-2xl font-bold text-orange-900">{stats.blocked_attempts}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Filter className="w-4 h-4" />
              Bộ lọc:
            </div>
            <select
              value={filters.action || ''}
              onChange={(e) => handleFilterChange('action', e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Tất cả hành động</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
              <option value="login_failed">Login Failed</option>
              <option value="password_reset">Password Reset</option>
              <option value="token_refresh">Token Refresh</option>
            </select>
            <select
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="success">{t('common.success')}</option>
              <option value="failed">{t('common.failed')}</option>
              <option value="blocked">{t('common.blocked')}</option>
            </select>
            <button
              onClick={refresh}
              className="ml-auto inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Làm mới
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Thời gian
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Hành động
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Trạng thái
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Thiết bị
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Vị trí
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  IP
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {logs.map((log) => (
                <tr key={log._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">{formatDate(log.created_at)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getActionColor(
                        log.action
                      )}`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(log.status)}
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                          log.status
                        )}`}
                      >
                        {log.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-sm text-gray-900">
                        {getDeviceIcon(log.device_type)}
                        <span>{log.browser || 'Unknown'}</span>
                      </div>
                      <span className="text-xs text-gray-500">{log.os || 'Unknown OS'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-gray-900">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>{log.location || 'Unknown'}</span>
                      {log.country_code && (
                        <span className="text-xs text-gray-500">({log.country_code})</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-900 font-mono">{log.ip_address}</span>
                    {log.error_message && (
                      <p className="text-xs text-red-600 mt-1">{log.error_message}</p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {logs.length === 0 && (
          <div className="text-center py-12">
            <Shield className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">Chưa có lịch sử truy cập</p>
          </div>
        )}
      </div>

      {/* Pagination info */}
      {logs.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Hiển thị {logs.length} bản ghi</span>
          {logs.length >= (filters.limit || 100) && (
            <span className="text-orange-600">Đã đạt giới hạn hiển thị</span>
          )}
        </div>
      )}
    </div>
  );
}

export default AuthLogsTable;