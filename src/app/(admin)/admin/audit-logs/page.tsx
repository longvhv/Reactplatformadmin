/**
 * Audit Logs Page
 * 
 * Trang quản lý lịch sử hoạt động và kiểm toán hệ thống
 * Features: Filter, Search, Export, Real-time updates
 * ✅ MIGRATED: Using Next.js shim for navigation
 */

'use client';

import { useState } from 'react';
import { useRouter } from '@/components/shim/next-navigation';
import { AuditLogTable } from '@/components/audit-logs/AuditLogTable';
import { useAuditLogs } from '@/hooks/useAuditLogs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { useLanguage } from '@/providers/LanguageProvider';
import { AuditLogFilters, exportAuditLogs } from '@/api/auditLogApi';
import { showToast } from '@/lib/toast';
import { PageLayout } from '@/components/layout/PageLayout';

function AuditLogsPage() {
  const router = useRouter();
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

  // Stats
  const stats = statistics ? [
    { label: 'Total Logs', value: total || 0, color: 'indigo' as const, icon: Activity },
    { label: 'Success', value: statistics.success || 0, color: 'green' as const, icon: CheckCircle },
    { label: 'Failed', value: statistics.failed || 0, color: 'red' as const, icon: XCircle },
    { label: 'Warning', value: statistics.warning || 0, color: 'yellow' as const, icon: AlertTriangle },
  ] : [];

  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading audit logs...</p>
        </div>
      </div>
    );
  }

  return (
    <PageLayout
      icon={Shield}
      title={t('navigation.auditLogs')}
      description="System activity and audit trail"
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      }
    >
      {/* Stats Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stat.value.toLocaleString()}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${
                    stat.color === 'indigo' ? 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600' :
                    stat.color === 'green' ? 'bg-green-100 dark:bg-green-900/20 text-green-600' :
                    stat.color === 'red' ? 'bg-red-100 dark:bg-red-900/20 text-red-600' :
                    'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600'
                  }`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Search & Filters */}
      <Card className="p-6">
        <div className="flex gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search logs by action, user, IP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10"
            />
          </div>
          <Button onClick={handleSearch}>
            <Search className="w-4 h-4 mr-2" />
            Search
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>

        {showFilters && (
          <div className="pt-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Action</label>
                <select
                  className="w-full px-3 py-2 border rounded-md"
                  onChange={(e) => handleFilterChange('action', e.target.value || undefined)}
                >
                  <option value="">All Actions</option>
                  <option value="CREATE">Create</option>
                  <option value="UPDATE">Update</option>
                  <option value="DELETE">Delete</option>
                  <option value="LOGIN">Login</option>
                  <option value="LOGOUT">Logout</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <select
                  className="w-full px-3 py-2 border rounded-md"
                  onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                >
                  <option value="">All Status</option>
                  <option value="SUCCESS">Success</option>
                  <option value="FAILED">Failed</option>
                  <option value="WARNING">Warning</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Date Range</label>
                <select
                  className="w-full px-3 py-2 border rounded-md"
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value) {
                      const date = new Date();
                      date.setDate(date.getDate() - parseInt(value));
                      handleFilterChange('startDate', date.toISOString());
                    } else {
                      handleFilterChange('startDate', undefined);
                    }
                  }}
                >
                  <option value="">All Time</option>
                  <option value="1">Last 24 hours</option>
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                </select>
              </div>
            </div>
          </div>
        )}

        <p className="text-sm text-muted-foreground mt-4">
          Showing {logs.length} of {total || 0} logs
        </p>
      </Card>

      {/* Audit Logs Table */}
      <AuditLogTable
        logs={logs}
        loading={loading}
        onViewDetail={(log) => router.push(`/admin/audit-logs/${log._id}`)}
      />

      {/* Load More */}
      {hasMore && (
        <div className="flex justify-center mt-6">
          <Button
            variant="outline"
            onClick={loadMore}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Load More'}
          </Button>
        </div>
      )}
    </PageLayout>
  );
}

// Named export for reuse
export { AuditLogsPage };

// Default export for routing
export default AuditLogsPage;
