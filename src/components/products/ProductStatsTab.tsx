/**
 * ProductStatsTab - Product statistics dashboard
 */

import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Package, ShoppingCart, DollarSign, TrendingUp } from 'lucide-react';

interface ProductStatsTabProps {
  productId: string;
}

interface ProductStats {
  product_id: string;
  product_name: string;
  product_code: string;
  category: string;
  created_at: string;
  
  packages_count: number;
  active_subscriptions: number;
  total_revenue: number;
  monthly_revenue: number;
  
  active_users: number;
  total_api_calls: number;
}

export function ProductStatsTab({ productId }: ProductStatsTabProps) {
  const [stats, setStats] = useState<ProductStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [productId]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Mock data instead of API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const mockStats: ProductStats = {
        product_id: productId,
        product_name: 'Demo Product',
        product_code: 'DEMO-PROD',
        category: 'Software',
        created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        
        packages_count: Math.floor(Math.random() * 10) + 3,
        active_subscriptions: Math.floor(Math.random() * 500) + 50,
        total_revenue: Math.floor(Math.random() * 1000000) + 100000,
        monthly_revenue: Math.floor(Math.random() * 100000) + 10000,
        
        active_users: Math.floor(Math.random() * 1000) + 100,
        total_api_calls: Math.floor(Math.random() * 1000000) + 100000,
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
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-blue-50">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Tổng gói</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.packages_count}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-green-50">
              <Package className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Gói đang hoạt động</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.active_packages}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-purple-50">
              <ShoppingCart className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Subscriptions</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.subscriptions_count}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-orange-50">
              <ShoppingCart className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Subscriptions</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.active_subscriptions}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-indigo-50">
              <DollarSign className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Tổng doanh thu</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.total_revenue.toLocaleString('vi-VN')} {stats.currency}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-emerald-50">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Doanh thu tháng này</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.monthly_revenue.toLocaleString('vi-VN')} {stats.currency}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Product Info */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Thông tin sản phẩm
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Mã sản phẩm</p>
            <p className="text-base font-mono text-gray-900">{stats.code}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Loại sản phẩm</p>
            <p className="text-base text-gray-900">{stats.product_type}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Giá cơ bản</p>
            <p className="text-base text-gray-900">
              {stats.base_price.toLocaleString('vi-VN')} {stats.currency}
            </p>
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