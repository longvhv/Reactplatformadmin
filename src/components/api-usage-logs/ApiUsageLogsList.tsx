/**
 * API Usage Logs List Component
 * Displays API usage logs with filtering and sorting
 * Design inspired by Stripe/GitHub/Vercel
 */

import React, { useState, useEffect } from 'react';
// ✅ FIX: Use simple translation hook to prevent crashes
import { useSimpleTranslation } from '../../hooks/useSimpleTranslation';
import { Search, Filter, Download, RefreshCw } from 'lucide-react';
import { apiUsageLogsService, ApiUsageLog, ApiUsageLogFilters } from '../../services/apiUsageLogsService';

interface ApiUsageLogsListProps {
  onSelectLog?: (log: ApiUsageLog) => void;
  initialFilters?: ApiUsageLogFilters;
}

export const ApiUsageLogsList: React.FC<ApiUsageLogsListProps> = ({ onSelectLog, initialFilters }) => {
  const { t } = useSimpleTranslation(); // ✅ Cannot crash
  const [logs, setLogs] = useState<ApiUsageLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<ApiUsageLogFilters>(initialFilters || {});
  const [showFilters, setShowFilters] = useState(false);

  // HTTP Methods
  const httpMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'];

  // Load logs
  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiUsageLogsService.getAll(filters);
      setLogs(data);
    } catch (err) {
      setError(t('apiUsageLogs.fetchError'));
      console.error('Error loading API usage logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [filters]);

  // Filter logs by search term
  const filteredLogs = logs.filter(log =>
    log.api_endpoint?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.app_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.api_method?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get status color
  const getStatusColor = (status?: number) => {
    if (!status) return 'text-gray-400';
    if (status >= 200 && status < 300) return 'text-green-600';
    if (status >= 300 && status < 400) return 'text-blue-600';
    if (status >= 400 && status < 500) return 'text-orange-600';
    return 'text-red-600';
  };

  // Get method color
  const getMethodColor = (method?: string) => {
    switch (method?.toUpperCase()) {
      case 'GET': return 'bg-blue-100 text-blue-700';
      case 'POST': return 'bg-green-100 text-green-700';
      case 'PUT': return 'bg-yellow-100 text-yellow-700';
      case 'PATCH': return 'bg-purple-100 text-purple-700';
      case 'DELETE': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Format bytes
  const formatBytes = (bytes?: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round(bytes / Math.pow(k, i) * 100) / 100} ${sizes[i]}`;
  };

  // Export logs
  const exportLogs = () => {
    const csv = [
      ['Timestamp', 'Method', 'Endpoint', 'Status', 'Latency (ms)', 'Request Size', 'Response Size', 'App Code'],
      ...filteredLogs.map(log => [
        log.created_at,
        log.api_method || '',
        log.api_endpoint || '',
        log.status_code?.toString() || '',
        log.latency_ms?.toString() || '',
        log.request_size?.toString() || '',
        log.response_size?.toString() || '',
        log.app_code || '',
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `api-usage-logs-${new Date().toISOString()}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder={t('common.search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Filter className="h-4 w-4" />
          {t('common.filter')}
        </button>
        <button
          onClick={loadLogs}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          {t('common.refresh')}
        </button>
        <button
          onClick={exportLogs}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Download className="h-4 w-4" />
          {t('common.export')}
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('apiUsageLogs.method')}
              </label>
              <select
                value={filters.api_method || ''}
                onChange={(e) => setFilters({ ...filters, api_method: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">{t('common.all')}</option>
                {httpMethods.map(method => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('apiUsageLogs.status')}
              </label>
              <input
                type="number"
                placeholder="200, 404, 500..."
                value={filters.status_code || ''}
                onChange={(e) => setFilters({ ...filters, status_code: e.target.value ? parseInt(e.target.value) : undefined })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('apiUsageLogs.appCode')}
              </label>
              <input
                type="text"
                placeholder="App code..."
                value={filters.app_code || ''}
                onChange={(e) => setFilters({ ...filters, app_code: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setFilters({})}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              {t('common.clearFilters')}
            </button>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredLogs.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">{t('apiUsageLogs.noRecords')}</p>
        </div>
      )}

      {/* Logs Table */}
      {filteredLogs.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('apiUsageLogs.timestamp')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('apiUsageLogs.method')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('apiUsageLogs.endpoint')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('apiUsageLogs.status')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('apiUsageLogs.latency')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('apiUsageLogs.sizes')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('apiUsageLogs.appCode')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredLogs.map((log) => (
                  <tr
                    key={log._id}
                    onClick={() => onSelectLog?.(log)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getMethodColor(log.api_method)}`}>
                        {log.api_method || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {log.api_endpoint || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${getStatusColor(log.status_code)}`}>
                        {log.status_code || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.latency_ms ? `${log.latency_ms}ms` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex flex-col">
                        <span>↑ {formatBytes(log.request_size)}</span>
                        <span>↓ {formatBytes(log.response_size)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.app_code || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary */}
      {filteredLogs.length > 0 && (
        <div className="text-sm text-gray-500 text-right">
          {t('common.showing')} {filteredLogs.length} {t('common.results')}
        </div>
      )}
    </div>
  );
};