/**
 * API Usage Log Detail Component
 * Displays detailed information about a single API usage log
 * Design inspired by Stripe/GitHub/Vercel
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, Server, Code, Activity, Database, Key, Calendar } from 'lucide-react';
import { ApiUsageLog } from '../../services/apiUsageLogsService';

interface ApiUsageLogDetailProps {
  log: ApiUsageLog;
}

export const ApiUsageLogDetail: React.FC<ApiUsageLogDetailProps> = ({ log }) => {
  const { t } = useTranslation();

  // Get status badge color
  const getStatusBadge = (status?: number) => {
    if (!status) return { color: 'bg-gray-100 text-gray-700', text: 'N/A' };
    if (status >= 200 && status < 300) return { color: 'bg-green-100 text-green-700', text: `${status} Success` };
    if (status >= 300 && status < 400) return { color: 'bg-blue-100 text-blue-700', text: `${status} Redirect` };
    if (status >= 400 && status < 500) return { color: 'bg-orange-100 text-orange-700', text: `${status} Client Error` };
    return { color: 'bg-red-100 text-red-700', text: `${status} Server Error` };
  };

  // Get method badge color
  const getMethodBadge = (method?: string) => {
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

  const statusBadge = getStatusBadge(log.status_code);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t('apiUsageLogs.detail')}
            </h3>
            <p className="text-sm text-gray-500">ID: {log._id}</p>
          </div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusBadge.color}`}>
            {statusBadge.text}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium ${getMethodBadge(log.api_method)}`}>
            {log.api_method || 'N/A'}
          </span>
          <code className="flex-1 text-sm bg-gray-50 px-3 py-2 rounded-md text-gray-900">
            {log.api_endpoint || 'N/A'}
          </code>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Activity className="h-4 w-4" />
          {t('apiUsageLogs.performance')}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <Clock className="h-4 w-4" />
              {t('apiUsageLogs.latency')}
            </div>
            <p className="text-2xl font-semibold text-gray-900">
              {log.latency_ms ? `${log.latency_ms}ms` : 'N/A'}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <Database className="h-4 w-4" />
              {t('apiUsageLogs.requestSize')}
            </div>
            <p className="text-2xl font-semibold text-gray-900">
              {formatBytes(log.request_size)}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <Database className="h-4 w-4" />
              {t('apiUsageLogs.responseSize')}
            </div>
            <p className="text-2xl font-semibold text-gray-900">
              {formatBytes(log.response_size)}
            </p>
          </div>
        </div>
      </div>

      {/* Request Details */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Server className="h-4 w-4" />
          {t('apiUsageLogs.requestDetails')}
        </h4>
        <div className="space-y-3">
          <div className="flex items-start">
            <span className="text-sm font-medium text-gray-500 w-40">{t('apiUsageLogs.endpoint')}:</span>
            <code className="flex-1 text-sm text-gray-900 bg-gray-50 px-2 py-1 rounded">
              {log.api_endpoint || 'N/A'}
            </code>
          </div>

          <div className="flex items-start">
            <span className="text-sm font-medium text-gray-500 w-40">{t('apiUsageLogs.method')}:</span>
            <span className="text-sm text-gray-900">{log.api_method || 'N/A'}</span>
          </div>

          <div className="flex items-start">
            <span className="text-sm font-medium text-gray-500 w-40">{t('apiUsageLogs.status')}:</span>
            <span className="text-sm text-gray-900">{log.status_code || 'N/A'}</span>
          </div>

          {log.app_code && (
            <div className="flex items-start">
              <span className="text-sm font-medium text-gray-500 w-40 flex items-center gap-1">
                <Code className="h-3 w-3" />
                {t('apiUsageLogs.appCode')}:
              </span>
              <span className="text-sm text-gray-900">{log.app_code}</span>
            </div>
          )}

          {log.api_key_id && (
            <div className="flex items-start">
              <span className="text-sm font-medium text-gray-500 w-40 flex items-center gap-1">
                <Key className="h-3 w-3" />
                {t('apiUsageLogs.apiKeyId')}:
              </span>
              <code className="text-sm text-gray-900 font-mono">{log.api_key_id}</code>
            </div>
          )}

          {log.tenant_id && (
            <div className="flex items-start">
              <span className="text-sm font-medium text-gray-500 w-40">{t('apiUsageLogs.tenantId')}:</span>
              <code className="text-sm text-gray-900 font-mono">{log.tenant_id}</code>
            </div>
          )}
        </div>
      </div>

      {/* Timestamp */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          {t('apiUsageLogs.timestamp')}
        </h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">{t('common.createdAt')}:</span>
            <span className="text-sm text-gray-900">{new Date(log.created_at).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
