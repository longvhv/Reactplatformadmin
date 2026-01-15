/**
 * TenantStats Component
 * Hiển thị thống kê tổng quan của tenant
 */

import { useState, useEffect } from 'react';
import { 
  Users, 
  FolderTree, 
  MapPin, 
  Shield, 
  CreditCard,
  Activity,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Clock,
  Package
} from 'lucide-react';
import { Card } from '@/components/ui/card';

interface TenantStatsProps {
  tenantId: string;
}

interface Stats {
  tenant_id: string;
  tenant_name: string;
  tenant_code: string;
  tier: string;
  status: string;
  created_at: string;
  
  // Counts
  members_count: number;
  active_members: number;
  departments_count: number;
  user_groups_count: number;
  locations_count: number;
  roles_count: number;
  
  // Subscriptions
  active_subscriptions: number;
  monthly_revenue: number;
  total_orders: number;
  unpaid_invoices: number;
  
  // Technical
  app_routes_count: number;
  webhooks_count: number;
  rate_limits_count: number;
  sso_configs_count: number;
  
  // Usage
  storage_used_gb: number;
  api_calls_month: number;
  last_activity_at?: string;
}

export function TenantStats({ tenantId }: TenantStatsProps) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [tenantId]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Mock data instead of API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const mockStats: Stats = {
        tenant_id: tenantId,
        tenant_name: 'Demo Tenant',
        tenant_code: 'demo-tenant',
        tier: 'PRO',
        status: 'active',
        created_at: new Date().toISOString(),
        
        // Counts
        members_count: Math.floor(Math.random() * 100) + 20,
        active_members: Math.floor(Math.random() * 80) + 15,
        departments_count: Math.floor(Math.random() * 15) + 3,
        user_groups_count: Math.floor(Math.random() * 10) + 2,
        locations_count: Math.floor(Math.random() * 8) + 1,
        roles_count: Math.floor(Math.random() * 12) + 4,
        
        // Subscriptions
        active_subscriptions: Math.floor(Math.random() * 5) + 1,
        monthly_revenue: Math.floor(Math.random() * 50000) + 10000,
        total_orders: Math.floor(Math.random() * 50) + 10,
        unpaid_invoices: Math.floor(Math.random() * 3),
        
        // Technical
        app_routes_count: Math.floor(Math.random() * 10) + 2,
        webhooks_count: Math.floor(Math.random() * 8) + 1,
        rate_limits_count: Math.floor(Math.random() * 5) + 1,
        sso_configs_count: Math.floor(Math.random() * 3),
        
        // Usage
        storage_used_gb: Math.random() * 100 + 10,
        api_calls_month: Math.floor(Math.random() * 100000) + 10000,
        last_activity_at: new Date().toISOString(),
      };
      
      setStats(mockStats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Set null on error instead of crashing
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
    return <div className="text-center py-12 text-gray-500">Không thể tải thống kê</div>;
  }

  const statCards = [
    // People & Organization
    {
      title: 'Thành viên',
      value: stats.members_count,
      subtitle: `${stats.active_members} đang hoạt động`,
      icon: Users,
      color: 'blue',
      trend: stats.active_members === stats.members_count ? 'up' : 'neutral',
    },
    {
      title: 'Phòng ban',
      value: stats.departments_count,
      icon: FolderTree,
      color: 'purple',
    },
    {
      title: 'Nhóm người dùng',
      value: stats.user_groups_count,
      icon: Users,
      color: 'green',
    },
    {
      title: 'Địa điểm',
      value: stats.locations_count,
      icon: MapPin,
      color: 'red',
    },
    {
      title: 'Vai trò',
      value: stats.roles_count,
      icon: Shield,
      color: 'yellow',
    },
    
    // Billing & Subscriptions
    {
      title: 'Gói đăng ký',
      value: stats.active_subscriptions,
      subtitle: `${stats.total_orders} đơn hàng`,
      icon: Package,
      color: 'indigo',
    },
    {
      title: 'Doanh thu tháng',
      value: `$${stats.monthly_revenue.toLocaleString()}`,
      icon: CreditCard,
      color: 'green',
      trend: 'up',
    },
    {
      title: 'Hóa đơn chưa thanh toán',
      value: stats.unpaid_invoices,
      icon: CreditCard,
      color: stats.unpaid_invoices > 0 ? 'red' : 'gray',
      trend: stats.unpaid_invoices > 0 ? 'down' : 'neutral',
    },
    
    // Technical
    {
      title: 'App Routes',
      value: stats.app_routes_count,
      icon: Activity,
      color: 'cyan',
    },
    {
      title: 'Webhooks',
      value: stats.webhooks_count,
      icon: Activity,
      color: 'teal',
    },
    {
      title: 'Rate Limits',
      value: stats.rate_limits_count,
      icon: BarChart3,
      color: 'orange',
    },
    {
      title: 'SSO Configs',
      value: stats.sso_configs_count,
      icon: Shield,
      color: 'pink',
    },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; icon: string; text: string }> = {
      blue: { bg: 'bg-blue-50', icon: 'text-blue-600', text: 'text-blue-900' },
      purple: { bg: 'bg-purple-50', icon: 'text-purple-600', text: 'text-purple-900' },
      green: { bg: 'bg-green-50', icon: 'text-green-600', text: 'text-green-900' },
      red: { bg: 'bg-red-50', icon: 'text-red-600', text: 'text-red-900' },
      yellow: { bg: 'bg-yellow-50', icon: 'text-yellow-600', text: 'text-yellow-900' },
      indigo: { bg: 'bg-indigo-50', icon: 'text-indigo-600', text: 'text-indigo-900' },
      cyan: { bg: 'bg-cyan-50', icon: 'text-cyan-600', text: 'text-cyan-900' },
      teal: { bg: 'bg-teal-50', icon: 'text-teal-600', text: 'text-teal-900' },
      orange: { bg: 'bg-orange-50', icon: 'text-orange-600', text: 'text-orange-900' },
      pink: { bg: 'bg-pink-50', icon: 'text-pink-600', text: 'text-pink-900' },
      gray: { bg: 'bg-gray-50', icon: 'text-gray-600', text: 'text-gray-900' },
    };
    return colors[color] || colors.gray;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Thống kê tổng quan</h2>
        <p className="text-sm text-gray-600">
          Tổng quan về số liệu và hoạt động của tenant
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          const colors = getColorClasses(card.color);
          
          return (
            <Card key={index} className="p-5 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
                  <div className="flex items-baseline gap-2">
                    <p className={`text-3xl font-bold ${colors.text}`}>
                      {card.value}
                    </p>
                    {card.trend && (
                      <span className="flex items-center">
                        {card.trend === 'up' && (
                          <TrendingUp className="w-4 h-4 text-green-500" />
                        )}
                        {card.trend === 'down' && (
                          <TrendingDown className="w-4 h-4 text-red-500" />
                        )}
                      </span>
                    )}
                  </div>
                  {card.subtitle && (
                    <p className="text-xs text-gray-500 mt-1">{card.subtitle}</p>
                  )}
                </div>
                <div className={`p-3 rounded-lg ${colors.bg}`}>
                  <Icon className={`w-6 h-6 ${colors.icon}`} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Additional Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-indigo-50">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Sử dụng hệ thống</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Dung lượng lưu trữ</span>
              <span className="font-semibold text-gray-900">
                {stats.storage_used_gb.toFixed(2)} GB
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">API calls (tháng này)</span>
              <span className="font-semibold text-gray-900">
                {stats.api_calls_month.toLocaleString()}
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-green-50">
              <Clock className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Thông tin khác</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Ngày tạo</span>
              <span className="font-semibold text-gray-900">
                {new Date(stats.created_at).toLocaleDateString('vi-VN')}
              </span>
            </div>
            {stats.last_activity_at && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Hoạt động gần nhất</span>
                <span className="font-semibold text-gray-900">
                  {new Date(stats.last_activity_at).toLocaleDateString('vi-VN')}
                </span>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Summary Card */}
      <Card className="p-6 bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-indigo-900 mb-2">
              Tổng kết
            </h3>
            <p className="text-sm text-indigo-700">
              Tenant <span className="font-semibold">{stats.tenant_name}</span> ({stats.tenant_code})
              đang hoạt động với gói <span className="font-semibold">{stats.tier}</span>.
              Hiện có <span className="font-semibold">{stats.members_count} thành viên</span> và{' '}
              <span className="font-semibold">{stats.active_subscriptions} gói đăng ký</span> đang kích hoạt.
            </p>
          </div>
          <div className="px-4 py-2 bg-white rounded-lg border border-indigo-200">
            <div className="text-xs text-indigo-600 font-medium">Status</div>
            <div className="text-lg font-bold text-indigo-900 capitalize">{stats.status}</div>
          </div>
        </div>
      </Card>
    </div>
  );
}