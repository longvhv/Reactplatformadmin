/**
 * PackageStatsTab - Package statistics dashboard
 */

import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Users, UserCheck, DollarSign, TrendingDown } from 'lucide-react';

interface PackageStatsTabProps {
  packageId: string;
}

interface PackageStats {
  package_id: string;
  package_name: string;
  package_code: string;
  product_name: string;
  created_at: string;
  
  active_subscriptions: number;
  total_subscriptions: number;
  monthly_revenue: number;
  total_revenue: number;
  
  active_users: number;
  churn_rate: string;
}

export function PackageStatsTab({ packageId }: PackageStatsTabProps) {
  const [stats, setStats] = useState<PackageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [packageId]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Mock data instead of API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const mockStats: PackageStats = {
        package_id: packageId,
        package_name: 'Demo Package',
        package_code: 'DEMO-PKG',
        product_name: 'Demo Product',
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.warn('Stats API not available');
        setStats(null);
        return;
      }
      
        created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        
        active_subscriptions: Math.floor(Math.random() * 200) + 20,
        total_subscriptions: Math.floor(Math.random() * 300) + 50,
        monthly_revenue: Math.floor(Math.random() * 50000) + 5000,
        total_revenue: Math.floor(Math.random() * 500000) + 50000,
        
        active_users: Math.floor(Math.random() * 500) + 50,
        churn_rate: (Math.random() * 10).toFixed(2) + '%',
      };
      
      setStats(mockStats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats(null);
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
        Không thể tải thống kê
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Subscriber Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-blue-50">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">T��ng khách hàng</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.total_subscriptions}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-green-50">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Đang hoạt động</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.active_subscriptions}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-indigo-50">
              <DollarSign className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Tổng doanh thu</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.total_revenue.toLocaleString('vi-VN')}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-orange-50">
              <TrendingDown className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Churn Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.churn_rate}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Revenue Detail */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Chi tiết doanh thu
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-lg bg-emerald-50">
              <DollarSign className="w-8 h-8 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Doanh thu tháng này</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.monthly_revenue.toLocaleString('vi-VN')} VND
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Package Info */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Thông tin gói
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Mã gói</p>
            <p className="text-base font-mono text-gray-900">{stats.package_code}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Tên gói</p>
            <p className="text-base text-gray-900">{stats.package_name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Tên sản phẩm</p>
            <p className="text-base text-gray-900">{stats.product_name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Ngày tạo</p>
            <p className="text-base text-gray-900">
              {new Date(stats.created_at).toLocaleDateString('vi-VN')}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}