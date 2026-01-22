/**
 * WebhookStatsTab Component
 * Statistics tab for webhook delivery logs
 */

import React, { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp, TrendingDown, Clock, Activity, AlertCircle, CheckCircle } from 'lucide-react';
import { Webhook } from '@/api/webhooksApi';
import { DeliveryStats, webhookDeliveryLogsApi, WebhookDeliveryLog } from '@/api/webhookDeliveryLogsApi';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface WebhookStatsTabProps {
  webhook: Webhook;
  stats: DeliveryStats | null;
  isLoading: boolean;
  onRefresh: () => void;
}

const COLORS = {
  success: '#10b981',
  failure: '#ef4444',
  primary: '#6366f1',
  secondary: '#8b5cf6',
  warning: '#f59e0b',
  info: '#3b82f6',
};

export function WebhookStatsTab({ webhook, stats, isLoading, onRefresh }: WebhookStatsTabProps) {
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [percentiles, setPercentiles] = useState<any>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<24 | 168>(24); // 24h or 7 days

  useEffect(() => {
    if (webhook) {
      loadTimelineData();
      loadPercentiles();
    }
  }, [webhook, selectedPeriod]);

  const loadTimelineData = async () => {
    try {
      const data = await webhookDeliveryLogsApi.getTimeline(webhook._id, selectedPeriod);
      setTimelineData(data);
    } catch (error) {
      console.error('Error loading timeline:', error);
    }
  };

  const loadPercentiles = async () => {
    try {
      const data = await webhookDeliveryLogsApi.getLatencyPercentiles(webhook._id);
      setPercentiles(data);
    } catch (error) {
      console.error('Error loading percentiles:', error);
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
    { name: 'Successful', value: stats.successful_deliveries, color: COLORS.success },
    { name: 'Failed', value: stats.failed_deliveries, color: COLORS.failure },
  ];

  const statusCodeData = Object.entries(stats.by_status_code).map(([code, count]) => ({
    name: `${code}`,
    value: count,
    color: code.startsWith('2') ? COLORS.success : code.startsWith('4') ? COLORS.warning : COLORS.failure,
  }));

  const eventTypeData = Object.entries(stats.by_event_type)
    .map(([event, count]) => ({
      name: event,
      value: count,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10); // Top 10

  const attemptData = Object.entries(stats.by_attempt_number).map(([attempt, count]) => ({
    name: `Attempt ${attempt}`,
    value: count,
  }));

  const latencyData = percentiles ? [
    { name: 'P50', value: percentiles.p50 },
    { name: 'P75', value: percentiles.p75 },
    { name: 'P90', value: percentiles.p90 },
    { name: 'P95', value: percentiles.p95 },
    { name: 'P99', value: percentiles.p99 },
  ] : [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Thống kê giao hàng</h3>
          <p className="text-sm text-gray-500 mt-1">
            Tổng số: {stats.total_deliveries.toLocaleString()} lần giao hàng
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
            onClick={onRefresh}
            className="flex items-center gap-2 px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg"
          >
            <RefreshCw className="w-4 h-4" />
            Làm mới
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-600 text-sm mb-1">
            <CheckCircle className="w-4 h-4" />
            Thành công
          </div>
          <p className="text-2xl font-bold text-green-700">
            {stats.successful_deliveries.toLocaleString()}
          </p>
          <p className="text-xs text-green-600 mt-1">
            {stats.success_rate.toFixed(1)}% tỷ lệ thành công
          </p>
        </div>

        <div className="bg-red-50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-600 text-sm mb-1">
            <AlertCircle className="w-4 h-4" />
            Thất bại
          </div>
          <p className="text-2xl font-bold text-red-700">
            {stats.failed_deliveries.toLocaleString()}
          </p>
          <p className="text-xs text-red-600 mt-1">
            {(100 - stats.success_rate).toFixed(1)}% tỷ lệ thất bại
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
            Min: {stats.min_latency_ms}ms | Max: {stats.max_latency_ms}ms
          </p>
        </div>

        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-purple-600 text-sm mb-1">
            <Activity className="w-4 h-4" />
            Tổng giao hàng
          </div>
          <p className="text-2xl font-bold text-purple-700">
            {stats.total_deliveries.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* Timeline Chart */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">
            Lịch sử giao hàng ({selectedPeriod === 24 ? '24 giờ' : '7 ngày'})
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

        {/* Success Rate Pie Chart */}
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

        {/* Status Codes */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">Mã trạng thái HTTP</h4>
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

        {/* Event Types */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">Top 10 loại sự kiện</h4>
          {eventTypeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={eventTypeData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" fontSize={12} />
                <YAxis dataKey="name" type="category" width={100} fontSize={11} />
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

        {/* Retry Attempts */}
        {attemptData.length > 0 && (
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Số lần thử lại</h4>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={attemptData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="value" fill={COLORS.warning} name="Số lần" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Recent Failures Table */}
      {stats.recent_failures.length > 0 && (
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">
            Lỗi gần đây ({stats.recent_failures.length})
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 text-gray-600 font-medium">Thời gian</th>
                  <th className="text-left py-2 px-3 text-gray-600 font-medium">Sự kiện</th>
                  <th className="text-left py-2 px-3 text-gray-600 font-medium">Mã lỗi</th>
                  <th className="text-left py-2 px-3 text-gray-600 font-medium">Độ trễ</th>
                  <th className="text-left py-2 px-3 text-gray-600 font-medium">Lần thử</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent_failures.slice(0, 10).map((log) => (
                  <tr key={log._id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-3 text-gray-900">
                      {new Date(log.created_at).toLocaleString('vi-VN')}
                    </td>
                    <td className="py-2 px-3 text-gray-900 font-mono text-xs">
                      {log.event_type || 'N/A'}
                    </td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                        {log.status_code || 'N/A'}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-gray-900">
                      {log.latency_ms ? `${log.latency_ms}ms` : 'N/A'}
                    </td>
                    <td className="py-2 px-3 text-gray-900">
                      {log.attempt_number || 1}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default WebhookStatsTab;
