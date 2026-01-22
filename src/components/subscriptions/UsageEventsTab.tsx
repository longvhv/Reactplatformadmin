/**
 * UsageEventsTab Component
 * Displays usage events for a subscription
 * Design: Stripe/GitHub/Vercel-inspired usage metrics
 */

import React, { useState, useEffect } from 'react';
import {
  Activity,
  TrendingUp,
  BarChart3,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Clock,
  MapPin,
  Code,
  Zap,
} from 'lucide-react';
import {
  usageEventsApi,
  UsageEvent,
  UsageStatistics,
  getEventTypeLabel,
  getEventTypeColor,
  formatQuantity,
} from '../../api/usageEventsApi';
import { formatDate } from '../../lib/format';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';

interface UsageEventsTabProps {
  subscriptionId: string;
}

export const UsageEventsTab: React.FC<UsageEventsTabProps> = ({ subscriptionId }) => {
  const [events, setEvents] = useState<UsageEvent[]>([]);
  const [statistics, setStatistics] = useState<UsageStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    event_type: '',
    app_code: '',
    days: 30,
  });

  useEffect(() => {
    loadUsageEvents();
  }, [subscriptionId, filter]);

  const loadUsageEvents = async () => {
    setLoading(true);
    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - filter.days);

      const filters: any = {
        subscription_id: subscriptionId,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        limit: 100,
      };

      if (filter.event_type) {
        filters.event_type = filter.event_type;
      }
      if (filter.app_code) {
        filters.app_code = filter.app_code;
      }

      const [eventsData, statsData] = await Promise.all([
        usageEventsApi.getAll(filters),
        usageEventsApi.getStatistics(filters),
      ]);

      setEvents(eventsData);
      setStatistics(statsData);
    } catch (error) {
      console.error('Failed to load usage events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadUsageEvents();
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Exporting usage events...');
  };

  // Get unique event types and app codes for filters
  const uniqueEventTypes = Array.from(new Set(events.map(e => e.event_type).filter(Boolean)));
  const uniqueAppCodes = Array.from(new Set(events.map(e => e.app_code).filter(Boolean)));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin" />
        <span className="ml-2 text-gray-600">Đang tải dữ liệu sử dụng...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tình trạng sử dụng</h2>
          <p className="text-sm text-gray-600 mt-1">
            Theo dõi mức độ sử dụng dịch vụ của bạn
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
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Xuất
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tổng sự kiện</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {statistics.total_events.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tổng lượng</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {statistics.total_quantity.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Loại sự kiện</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {Object.keys(statistics.by_event_type).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ứng dụng</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {Object.keys(statistics.by_app_code).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Code className="w-6 h-6 text-orange-600" />
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

          {/* Time Range */}
          <select
            value={filter.days}
            onChange={(e) => setFilter({ ...filter, days: Number(e.target.value) })}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value={7}>7 ngày qua</option>
            <option value={30}>30 ngày qua</option>
            <option value={90}>90 ngày qua</option>
            <option value={365}>1 năm qua</option>
          </select>

          {/* Event Type */}
          <select
            value={filter.event_type}
            onChange={(e) => setFilter({ ...filter, event_type: e.target.value })}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Tất cả loại sự kiện</option>
            {uniqueEventTypes.map((type) => (
              <option key={type} value={type}>
                {getEventTypeLabel(type!)}
              </option>
            ))}
          </select>

          {/* App Code */}
          <select
            value={filter.app_code}
            onChange={(e) => setFilter({ ...filter, app_code: e.target.value })}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Tất cả ứng dụng</option>
            {uniqueAppCodes.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>

          {(filter.event_type || filter.app_code) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilter({ ...filter, event_type: '', app_code: '' })}
              className="text-gray-600"
            >
              Xóa bộ lọc
            </Button>
          )}
        </div>
      </Card>

      {/* Usage by Event Type */}
      {statistics && Object.keys(statistics.by_event_type).length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Thống kê theo loại sự kiện
          </h3>
          <div className="space-y-3">
            {Object.entries(statistics.by_event_type).map(([type, data]) => (
              <div key={type} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <Badge className={getEventTypeColor(type)}>
                    {getEventTypeLabel(type)}
                  </Badge>
                  <span className="text-sm text-gray-600">
                    {data.count} sự kiện
                  </span>
                </div>
                <div className="text-sm font-medium text-gray-900">
                  {formatQuantity(data.total_quantity, data.unit)}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Events Timeline */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900">
            Lịch sử sử dụng
          </h3>
        </div>

        {events.length === 0 ? (
          <div className="p-12 text-center">
            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">Chưa có dữ liệu sử dụng</p>
            <p className="text-sm text-gray-500 mt-1">
              Các sự kiện sử dụng sẽ được hiển thị tại đây
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thời gian
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Loại sự kiện
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ứng dụng
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Số lượng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Khu vực
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {events.map((event) => (
                  <tr key={event._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900">
                          {formatDate(event.timestamp)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={getEventTypeColor(event.event_type || '')}>
                        {getEventTypeLabel(event.event_type || 'unknown')}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Code className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {event.app_code || '-'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="text-sm font-medium text-gray-900">
                        {formatQuantity(event.quantity, event.unit)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {event.data_region ? (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4" />
                          {event.data_region}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Info Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <Zap className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">Thông tin về dữ liệu sử dụng</p>
            <p className="text-blue-700">
              Dữ liệu sử dụng được cập nhật theo thời gian thực và được lưu trữ trong {filter.days} ngày qua. 
              Sử dụng bộ lọc để xem chi tiết theo loại sự kiện, ứng dụng hoặc khoảng thời gian cụ thể.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
