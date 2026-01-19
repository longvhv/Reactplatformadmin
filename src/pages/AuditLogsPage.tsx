/**
 * Audit Logs Page
 * 
 * Trang quản lý lịch sử hoạt động và kiểm toán hệ thống
 * Features: Filter, Search, Export, Real-time updates
 */

import { useState } from 'react';
import { useNavigate } from 'react-router';
import { AuditLogTable } from '../components/audit-logs/AuditLogTable';
import { useAuditLogs } from '../hooks/useAuditLogs';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
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
  AlertTriangle,
} from 'lucide-react';
import { useLanguage } from '../providers/LanguageProvider';
import { AuditLogFilters, exportAuditLogs } from '../api/auditLogApi';
import { showToast } from '../lib/toast';
import { PageLayout } from '../components/layout/PageLayout';

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
      showToast.info('Đang xuất', 'Đang xuất dữ liệu...');
      const blob = await exportAuditLogs(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      showToast.success('Thành công', 'Xuất dữ liệu thành công!');
    } catch (error) {
      showToast.error('Lỗi', 'Lỗi khi xuất dữ liệu');
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
    <PageLayout
      icon={Shield}
      title="Lịch sử truy cập"
      description="Theo dõi và kiểm toán mọi hoạt động trong hệ thống"
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Xuất CSV
          </Button>
        </div>
      }
    >
      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Tổng sự kiện
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {statistics.total_events.toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600">
                <Activity className="w-6 h-6" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Thành công
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {statistics.success_count.toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/20 text-green-600">
                <CheckCircle className="w-6 h-6" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Thất bại
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {statistics.failed_count.toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/20 text-red-600">
                <XCircle className="w-6 h-6" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Người dùng
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {statistics.unique_users.toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/20 text-blue-600">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filters & Search */}
      <Card className="p-6">
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

        {/* Results Info */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Hiển thị <span className="font-semibold">{logs.length}</span> trong tổng số{' '}
            <span className="font-semibold">{total.toLocaleString()}</span> bản ghi
          </p>
        </div>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="p-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        </Card>
      )}

      {/* Table */}
      <Card>
        <AuditLogTable 
          logs={logs} 
          loading={loading}
          onViewDetails={(log) => navigate(`/admin/audit-logs/${log._id}`)}
        />
      </Card>

      {/* Load More */}
      {hasMore && !loading && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={loadMore}>
            <TrendingUp className="w-4 h-4 mr-2" />
            Tải thêm
          </Button>
        </div>
      )}
    </PageLayout>
  );
}