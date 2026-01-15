/**
 * Audit Logs Page
 * 
 * Trang quản lý lịch sử hoạt động và kiểm toán hệ thống
 * Features: Filter, Search, Export, Real-time updates
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { AuditLogTable } from '../components/audit-logs/AuditLogTable';
import { useAuditLogs } from '../hooks/useAuditLogs';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
  Shield,
  Search,
  Filter,
  Download,
  RefreshCw,
  Calendar,
  TrendingUp,
  Activity,
  Users,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useLanguage } from '../providers/LanguageProvider';
import { AuditLogFilters, exportAuditLogs } from '../api/auditLogApi';
import { toast } from 'sonner@2.0.3';

export default function AuditLogsPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  // Filters state
  const [filters, setFilters] = useState<AuditLogFilters>({
    limit: 50,
    offset: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch audit logs
  const { logs, total, statistics, loading, error, refresh, loadMore, hasMore } = 
    useAuditLogs({ filters, autoRefresh: true, refreshInterval: 30000 });

  // Handle search
  const handleSearch = () => {
    setFilters(prev => ({ ...prev, search: searchTerm, offset: 0 }));
  };

  // Handle filter change
  const handleFilterChange = (key: keyof AuditLogFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, offset: 0 }));
  };

  // Handle export
  const handleExport = async () => {
    try {
      toast.info('Đang xuất dữ liệu...');
      const blob = await exportAuditLogs(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Xuất dữ liệu thành công!');
    } catch (error) {
      toast.error('Lỗi khi xuất dữ liệu');
      console.error('Export error:', error);
    }
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({ limit: 50, offset: 0 });
    setSearchTerm('');
  };

  const activeFiltersCount = Object.keys(filters).filter(
    key => !['limit', 'offset'].includes(key) && filters[key as keyof AuditLogFilters]
  ).length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Shield className="w-8 h-8 text-indigo-600" />
              Lịch sử truy cập
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Theo dõi và kiểm toán mọi hoạt động trong hệ thống
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={refresh} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Làm mới
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Xuất CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Tổng sự kiện</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {statistics.total_events.toLocaleString()}
                </p>
              </div>
              <Activity className="w-8 h-8 text-indigo-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Thành công</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                  {statistics.success_count.toLocaleString()}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Thất bại</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                  {statistics.failed_count.toLocaleString()}
                </p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Người dùng</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {statistics.unique_users.toLocaleString()}
                </p>
              </div>
              <Users className="w-8 h-8 text-indigo-600" />
            </div>
          </div>
        </div>
      )}

      {/* Filters & Search */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="flex flex-col gap-4">
          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm theo hành động, tài nguyên, chi tiết..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch}>
              <Search className="w-4 h-4 mr-2" />
              Tìm kiếm
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Bộ lọc
              {activeFiltersCount > 0 && (
                <Badge className="ml-2 bg-indigo-600 text-white">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Hành động
                </label>
                <select
                  value={filters.action || ''}
                  onChange={(e) => handleFilterChange('action', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="">Tất cả</option>
                  <option value="CREATE">Tạo mới</option>
                  <option value="UPDATE">Cập nhật</option>
                  <option value="DELETE">Xóa</option>
                  <option value="VIEW">Xem</option>
                  <option value="LOGIN">Đăng nhập</option>
                  <option value="LOGOUT">Đăng xuất</option>
                  <option value="EXPORT">Xuất dữ liệu</option>
                  <option value="IMPORT">Nhập dữ liệu</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tài nguyên
                </label>
                <select
                  value={filters.resource || ''}
                  onChange={(e) => handleFilterChange('resource', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="">Tất cả</option>
                  <option value="USER">Người dùng</option>
                  <option value="TENANT">Tenant</option>
                  <option value="APPLICATION">Ứng dụng</option>
                  <option value="PRODUCT">Sản phẩm</option>
                  <option value="ORDER">Đơn hàng</option>
                  <option value="INVOICE">Hóa đơn</option>
                  <option value="SUBSCRIPTION">Đăng ký</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Trạng thái
                </label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="">Tất cả</option>
                  <option value="SUCCESS">Thành công</option>
                  <option value="FAILED">Thất bại</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Từ ngày
                </label>
                <Input
                  type="date"
                  value={filters.start_date || ''}
                  onChange={(e) => handleFilterChange('start_date', e.target.value || undefined)}
                />
              </div>

              <div className="md:col-span-4 flex justify-end gap-2">
                <Button variant="outline" onClick={clearFilters}>
                  Xóa bộ lọc
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results Info */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Hiển thị <span className="font-semibold">{logs.length}</span> trong tổng số{' '}
          <span className="font-semibold">{total.toLocaleString()}</span> bản ghi
        </p>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Table */}
      <AuditLogTable 
        logs={logs} 
        loading={loading}
        onViewDetails={(log) => navigate(`/core/audit-logs/${log._id}`)}
      />

      {/* Load More */}
      {hasMore && !loading && (
        <div className="mt-6 text-center">
          <Button variant="outline" onClick={loadMore}>
            <TrendingUp className="w-4 h-4 mr-2" />
            Tải thêm
          </Button>
        </div>
      )}
    </div>
  );
}
