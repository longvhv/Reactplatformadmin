/**
 * SubscriptionUsageTab - Display subscription usage statistics
 */

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Activity, Calendar, DollarSign, TrendingUp } from 'lucide-react';

interface SubscriptionUsageTabProps {
  subscriptionId: string;
}

interface UsageStats {
  subscription_id: string;
  tenant_id: string;
  package_id: string;
  status: string;
  start_date: string;
  end_date?: string;
  days_active: number;
  days_remaining?: number;
  entitlements_used: Record<string, any>;
  total_spent: number;
}

export function SubscriptionUsageTab({ subscriptionId }: SubscriptionUsageTabProps) {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsageStats();
  }, [subscriptionId]);

  const fetchUsageStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/subscriptions/${subscriptionId}/usage`);
      if (!response.ok) throw new Error('Failed to fetch usage stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching usage stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <Card className="p-6 text-center text-gray-500">
        Không thể tải thống kê sử dụng
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Usage Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-blue-50">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Ngày hoạt động</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.days_active}
              </p>
              <p className="text-xs text-gray-500">ngày</p>
            </div>
          </div>
        </Card>

        {stats.days_remaining !== undefined && (
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-orange-50">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Ngày còn lại</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.days_remaining}
                </p>
                <p className="text-xs text-gray-500">ngày</p>
              </div>
            </div>
          </Card>
        )}

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-green-50">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Tổng chi phí</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.total_spent.toLocaleString('vi-VN')}
              </p>
              <p className="text-xs text-gray-500">VND</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-purple-50">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Trạng thái</p>
              <p className="text-xl font-bold text-gray-900">
                {stats.status}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Duration Card */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Thời gian sử dụng
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-1">Ngày bắt đầu</p>
            <p className="text-base font-semibold text-gray-900">
              {new Date(stats.start_date).toLocaleString('vi-VN')}
            </p>
          </div>
          {stats.end_date && (
            <div>
              <p className="text-sm text-gray-600 mb-1">Ngày kết thúc</p>
              <p className="text-base font-semibold text-gray-900">
                {new Date(stats.end_date).toLocaleString('vi-VN')}
              </p>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {stats.days_remaining !== undefined && stats.days_active > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Tiến độ sử dụng</span>
              <span className="text-sm font-semibold text-gray-900">
                {Math.round((stats.days_active / (stats.days_active + stats.days_remaining)) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-indigo-600 h-3 rounded-full transition-all"
                style={{
                  width: `${Math.min((stats.days_active / (stats.days_active + stats.days_remaining)) * 100, 100)}%`,
                }}
              />
            </div>
          </div>
        )}
      </Card>

      {/* Entitlements Used */}
      {stats.entitlements_used && Object.keys(stats.entitlements_used).length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quyền lợi đã sử dụng
          </h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <pre className="text-sm text-gray-900 overflow-x-auto">
              {JSON.stringify(stats.entitlements_used, null, 2)}
            </pre>
          </div>
        </Card>
      )}

      {/* Additional Info */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Thông tin chi tiết
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">Subscription ID</span>
            <span className="text-sm font-mono text-gray-900">{stats.subscription_id}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">Tenant ID</span>
            <span className="text-sm font-mono text-gray-900">{stats.tenant_id}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">Package ID</span>
            <span className="text-sm font-mono text-gray-900">{stats.package_id}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
