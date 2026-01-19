/**
 * API Usage Logs Analytics Component
 * Displays analytics and statistics for API usage
 * Design inspired by Stripe/GitHub/Vercel
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../providers/LanguageProvider';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Activity, AlertCircle, CheckCircle, Clock, Database } from 'lucide-react';
import { apiUsageLogsService, ApiUsageStats, ApiUsageLogFilters } from '../../services/apiUsageLogsService';

interface ApiUsageLogsAnalyticsProps {
  filters?: ApiUsageLogFilters;
}

export const ApiUsageLogsAnalytics: React.FC<ApiUsageLogsAnalyticsProps> = ({ filters }) => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<ApiUsageStats | null>(null);
  const [timeline, setTimeline] = useState<Array<{ date: string; count: number; avg_latency: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'hour' | 'day' | 'week' | 'month'>('day');

  // Load analytics data
  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        const [statsData, timelineData] = await Promise.all([
          apiUsageLogsService.getStats(filters),
          apiUsageLogsService.getTimeline(filters, timeRange),
        ]);
        setStats(statsData);
        setTimeline(timelineData);
      } catch (error) {
        console.error('Error loading analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [filters, timeRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12 text-gray-500">
        {t('apiUsageLogs.noData')}
      </div>
    );
  }

  // Prepare data for charts
  const methodData = Object.entries(stats.requests_by_method).map(([method, count]) => ({
    method,
    count,
  }));

  const statusData = Object.entries(stats.requests_by_status).map(([status, count]) => ({
    status,
    count,
  }));

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

  // Format bytes
  const formatBytes = (bytes: number) => {
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round(bytes / Math.pow(k, i) * 100) / 100} ${sizes[i]}`;
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-indigo-100 rounded-lg p-2">
              <Activity className="h-5 w-5 text-indigo-600" />
            </div>
            <span className="text-sm text-gray-500">{t('apiUsageLogs.stats.totalRequests')}</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.total_requests.toLocaleString()}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-green-100 rounded-lg p-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <span className="text-sm text-gray-500">{t('apiUsageLogs.stats.successRate')}</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.success_rate.toFixed(1)}%</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-orange-100 rounded-lg p-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
            </div>
            <span className="text-sm text-gray-500">{t('apiUsageLogs.stats.errorRate')}</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.error_rate.toFixed(1)}%</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-100 rounded-lg p-2">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-sm text-gray-500">{t('apiUsageLogs.stats.avgLatency')}</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.avg_latency.toFixed(0)}ms</p>
        </div>
      </div>

      {/* Data Transfer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-purple-100 rounded-lg p-2">
              <Database className="h-5 w-5 text-purple-600" />
            </div>
            <span className="text-sm text-gray-500">{t('apiUsageLogs.stats.totalRequestSize')}</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{formatBytes(stats.total_request_size)}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-pink-100 rounded-lg p-2">
              <Database className="h-5 w-5 text-pink-600" />
            </div>
            <span className="text-sm text-gray-500">{t('apiUsageLogs.stats.totalResponseSize')}</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{formatBytes(stats.total_response_size)}</p>
        </div>
      </div>

      {/* Timeline Chart */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {t('apiUsageLogs.requestTimeline')}
          </h3>
          <div className="flex gap-2">
            {(['hour', 'day', 'week', 'month'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  timeRange === range
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t(`common.${range}`)}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={timeline}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: '12px' }} />
            <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
            />
            <Legend />
            <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} name={t('apiUsageLogs.requests')} />
            <Line type="monotone" dataKey="avg_latency" stroke="#8b5cf6" strokeWidth={2} name={t('apiUsageLogs.avgLatency')} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Method Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            {t('apiUsageLogs.requestsByMethod')}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={methodData}
                dataKey="count"
                nameKey="method"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={(entry) => `${entry.method}: ${entry.count}`}
              >
                {methodData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            {t('apiUsageLogs.requestsByStatus')}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={statusData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="status" stroke="#6b7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              />
              <Bar dataKey="count" fill="#6366f1" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Endpoints */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t('apiUsageLogs.topEndpoints')}
        </h3>
        <div className="space-y-3">
          {stats.top_endpoints.map((endpoint, index) => (
            <div key={endpoint.endpoint} className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-500 w-8">{index + 1}</span>
              <code className="flex-1 text-sm bg-gray-50 px-3 py-2 rounded-lg text-gray-900">
                {endpoint.endpoint}
              </code>
              <span className="text-sm font-semibold text-gray-900">{endpoint.count.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};