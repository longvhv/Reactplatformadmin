/**
 * TenantApiUsageTab Component
 * Thống kê sử dụng API từ api_usage_logs
 */

import React, { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp, TrendingDown, Clock, Activity, AlertCircle, CheckCircle, Database, Zap } from 'lucide-react';
import { apiUsageLogsApi, ApiUsageStats } from '@/api/apiUsageLogsApi';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface TenantApiUsageTabProps {
  tenantId: string;
}

const COLORS = {
  success: '#10b981',
  failure: '#ef4444',
  primary: '#6366f1',
  secondary: '#8b5cf6',
  warning: '#f59e0b',
  info: '#3b82f6',
};

export function TenantApiUsageTab({ tenantId }: TenantApiUsageTabProps) {
  const [stats, setStats] = useState<ApiUsageStats | null>(null);
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [percentiles, setPercentiles] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<24 | 168>(24); // 24h or 7 days

  useEffect(() => {
    loadData();
  }, [tenantId, selectedPeriod]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [statsData, timeline, latencyData] = await Promise.all([
        apiUsageLogsApi.getStats(tenantId, selectedPeriod),
        apiUsageLogsApi.getTimeline(tenantId, selectedPeriod),
        apiUsageLogsApi.getLatencyPercentiles(tenantId),
      ]);
      setStats(statsData);
      setTimelineData(timeline);
      setPercentiles(latencyData);
    } catch (error) {
      console.error('Error loading API usage data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <Activity className="w-12 h-12 mb-2" />
        <p>Không có dữ liệu thống kê</p>
      </div>
    );
  }

  // Prepare data for charts
  const successRateData = [
    { name: 'Successful', value: stats.successful_requests, color: COLORS.success },
    { name: 'Failed', value: stats.failed_requests, color: COLORS.failure },
  ];

  const statusCodeData = Object.entries(stats.by_status_code).map(([code, count]) => ({
    name: `${code}`,
    value: count,
    color: code.startsWith('2') ? COLORS.success : code.startsWith('4') ? COLORS.warning : COLORS.failure,
  }));

  const methodData = Object.entries(stats.by_method)
    .map(([method, count]) => ({
      name: method,
      value: count,
    }))
    .sort((a, b) => b.value - a.value);

  const appCodeData = Object.entries(stats.by_app_code)
    .map(([app, count]) => ({
      name: app,
      value: count,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const latencyData = percentiles ? [
    { name: 'P50', value: percentiles.p50 },
    { name: 'P75', value: percentiles.p75 },
    { name: 'P90', value: percentiles.p90 },
    { name: 'P95', value: percentiles.p95 },
    { name: 'P99', value: percentiles.p99 },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Thống kê sử dụng API</h3>
          <p className="text-sm text-gray-500 mt-1">
            Tổng số: {stats.total_requests.toLocaleString()} requests
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Period Selector */}
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(Number(e.target.value) as 24 | 168)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value={24}>24 giờ qua</option>
            <option value={168}>7 ngày qua</option>
          </select>
          
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg"
          >
            <RefreshCw className="w-4 h-4" />
            Làm mới
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-600 text-sm mb-1">
            <CheckCircle className="w-4 h-4" />
            Thành công
          </div>
          <p className="text-2xl font-bold text-green-700">
            {stats.successful_requests.toLocaleString()}
          </p>
          <p className="text-xs text-green-600 mt-1">
            {stats.success_rate.toFixed(1)}%
          </p>
        </div>

        <div className="bg-red-50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-600 text-sm mb-1">
            <AlertCircle className="w-4 h-4" />
            Thất bại
          </div>
          <p className="text-2xl font-bold text-red-700">
            {stats.failed_requests.toLocaleString()}
          </p>
          <p className="text-xs text-red-600 mt-1">
            {(100 - stats.success_rate).toFixed(1)}%
          </p>
        </div>

        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-blue-600 text-sm mb-1">
            <Clock className="w-4 h-4" />
            Độ trễ TB
          </div>
          <p className="text-2xl font-bold text-blue-700">
            {Math.round(stats.avg_latency_ms)}ms
          </p>
          <p className="text-xs text-blue-600 mt-1">
            {stats.min_latency_ms}ms - {stats.max_latency_ms}ms
          </p>
        </div>

        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-purple-600 text-sm mb-1">
            <Database className="w-4 h-4" />
            Dữ liệu
          </div>
          <p className="text-lg font-bold text-purple-700">
            ↑ {apiUsageLogsApi.formatBytes(stats.total_request_size)}
          </p>
          <p className="text-xs text-purple-600 mt-1">
            ↓ {apiUsageLogsApi.formatBytes(stats.total_response_size)}
          </p>
        </div>

        <div className="bg-indigo-50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-indigo-600 text-sm mb-1">
            <Zap className="w-4 h-4" />
            Tổng requests
          </div>
          <p className="text-2xl font-bold text-indigo-700">
            {stats.total_requests.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* Timeline Chart */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">
            Lịch sử requests ({selectedPeriod === 24 ? '24 giờ' : '7 ngày'})
          </h4>
          {timelineData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return selectedPeriod === 24 
                      ? date.getHours() + ':00'
                      : `${date.getDate()}/${date.getMonth() + 1}`;
                  }}
                  fontSize={12}
                />
                <YAxis fontSize={12} />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleString('vi-VN')}
                />
                <Legend />
                <Line type="monotone" dataKey="successful" stroke={COLORS.success} name="Thành công" strokeWidth={2} />
                <Line type="monotone" dataKey="failed" stroke={COLORS.failure} name="Thất bại" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-gray-400">
              Không có dữ liệu
            </div>
          )}
        </div>

        {/* Success Rate Pie */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">Tỷ lệ thành công</h4>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={successRateData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {successRateData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* HTTP Methods */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">HTTP Methods</h4>
          {methodData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={methodData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="value" fill={COLORS.primary} name="Số lần" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-gray-400">
              Không có dữ liệu
            </div>
          )}
        </div>

        {/* Status Codes */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">HTTP Status Codes</h4>
          {statusCodeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={statusCodeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="value" name="Số lần">
                  {statusCodeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-gray-400">
              Không có dữ liệu
            </div>
          )}
        </div>

        {/* Top Endpoints */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">Top 10 API Endpoints</h4>
          {stats.top_endpoints.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.top_endpoints} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" fontSize={12} />
                <YAxis dataKey="endpoint" type="category" width={150} fontSize={10} />
                <Tooltip />
                <Bar dataKey="count" fill={COLORS.primary} name="Số requests" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-gray-400">
              Không có dữ liệu
            </div>
          )}
        </div>

        {/* Latency Percentiles */}
        {percentiles && (
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Độ trễ theo phân vị</h4>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={latencyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} label={{ value: 'ms', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value) => `${value}ms`} />
                <Bar dataKey="value" fill={COLORS.info} name="Độ trễ (ms)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* App Codes */}
        {appCodeData.length > 0 && (
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Top Applications</h4>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={appCodeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="value" fill={COLORS.secondary} name="Số requests" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Recent Requests Table */}
      {stats.recent_requests.length > 0 && (
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">
            Requests gần đây ({stats.recent_requests.length})
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 text-gray-600 font-medium">Thời gian</th>
                  <th className="text-left py-2 px-3 text-gray-600 font-medium">Endpoint</th>
                  <th className="text-left py-2 px-3 text-gray-600 font-medium">Method</th>
                  <th className="text-left py-2 px-3 text-gray-600 font-medium">Status</th>
                  <th className="text-left py-2 px-3 text-gray-600 font-medium">Độ trễ</th>
                  <th className="text-left py-2 px-3 text-gray-600 font-medium">App</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent_requests.slice(0, 20).map((log) => {
                  const isSuccess = log.status_code && log.status_code >= 200 && log.status_code < 300;
                  const isClientError = log.status_code && log.status_code >= 400 && log.status_code < 500;
                  
                  return (
                    <tr key={log._id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-3 text-gray-900 text-xs">
                        {new Date(log.created_at).toLocaleString('vi-VN')}
                      </td>
                      <td className="py-2 px-3 text-gray-900 font-mono text-xs max-w-xs truncate">
                        {log.api_endpoint || 'N/A'}
                      </td>
                      <td className="py-2 px-3">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                          {log.api_method || 'N/A'}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          isSuccess ? 'bg-green-100 text-green-700' :
                          isClientError ? 'bg-orange-100 text-orange-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {log.status_code || 'N/A'}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-gray-900">
                        {log.latency_ms ? `${log.latency_ms}ms` : 'N/A'}
                      </td>
                      <td className="py-2 px-3 text-gray-900 text-xs">
                        {log.app_code || 'N/A'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default TenantApiUsageTab;
