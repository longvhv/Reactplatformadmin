/**
 * Dashboard Page - Modern & Professional
 * Clean design with module quick access
 * 
 * ✅ MIGRATED: Using Next.js shim for navigation
 */

'use client';

import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  Package, 
  ShoppingCart,
  Grid3x3,
  Activity,
  TrendingUp,
  Clock,
  ArrowRight,
  type LucideIcon
} from 'lucide-react';
import { useRouter } from '@/components/shim/next-navigation';
import { Card } from '@/components/ui/card';
import { MENU_GROUPS } from '@/constants/menu-config';

interface QuickStat {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: LucideIcon;
  color: string;
}

interface ModuleCard {
  id: string;
  title: string;
  description: string;
  path: string;
  icon: LucideIcon;
  color: string;
  badge?: string;
}

function DashboardPage() {
  const router = useRouter();

  // Quick stats - Có thể connect với API sau
  const quickStats: QuickStat[] = [
    {
      label: 'Tổng người dùng',
      value: '2,847',
      change: '+12.5%',
      trend: 'up',
      icon: Users,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      label: 'Tenants hoạt động',
      value: '124',
      change: '+8.3%',
      trend: 'up',
      icon: Building2,
      color: 'text-green-600 bg-green-50',
    },
    {
      label: 'Sản phẩm',
      value: '456',
      change: '+5.2%',
      trend: 'up',
      icon: Package,
      color: 'text-purple-600 bg-purple-50',
    },
    {
      label: 'Đơn hàng',
      value: '1,289',
      change: '+15.8%',
      trend: 'up',
      icon: ShoppingCart,
      color: 'text-orange-600 bg-orange-50',
    },
  ];

  // Featured modules - Lấy từ menu config
  const featuredModules: ModuleCard[] = [
    {
      id: 'users',
      title: 'Quản lý Người dùng',
      description: 'Quản lý tài khoản người dùng và phân quyền',
      path: '/admin/users',
      icon: Users,
      color: 'text-blue-600 bg-blue-50',
      badge: 'Hot',
    },
    {
      id: 'tenants',
      title: 'Quản lý Tenants',
      description: 'Quản lý tenants và cấu hình tổ chức',
      path: '/admin/tenants',
      icon: Building2,
      color: 'text-green-600 bg-green-50',
    },
    {
      id: 'products',
      title: 'Quản lý Sản phẩm',
      description: 'Quản lý danh mục sản phẩm và dịch vụ',
      path: '/commerce/products',
      icon: Package,
      color: 'text-purple-600 bg-purple-50',
    },
    {
      id: 'applications',
      title: 'Ứng dụng',
      description: 'Quản lý ứng dụng và tích hợp',
      path: '/platform/applications',
      icon: Grid3x3,
      color: 'text-indigo-600 bg-indigo-50',
    },
    {
      id: 'audit-logs',
      title: 'Audit Logs',
      description: 'Theo dõi hoạt động và bảo mật',
      path: '/admin/audit-logs',
      icon: Activity,
      color: 'text-red-600 bg-red-50',
    },
    {
      id: 'traffic-logs',
      title: 'Traffic Logs',
      description: 'Giám sát và phân tích lưu lượng',
      path: '/platform/traffic-logs',
      icon: TrendingUp,
      color: 'text-cyan-600 bg-cyan-50',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <LayoutDashboard className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Chào mừng trở lại! Xem tổng quan hệ thống của bạn
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-medium ${
                    stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <TrendingUp className="w-4 h-4" />
                    {stat.change}
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {stat.label}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Featured Modules */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Modules chính
            </h2>
            <button 
              onClick={() => router.push('/admin/settings')}
              className="text-primary hover:text-primary/80 font-medium text-sm flex items-center gap-1"
            >
              Xem tất cả
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredModules.map((module) => {
              const Icon = module.icon;
              return (
                <Card
                  key={module.id}
                  className="p-6 hover:shadow-lg transition-shadow cursor-pointer group"
                  onClick={() => router.push(module.path)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-lg ${module.color} flex items-center justify-center`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    {module.badge && (
                      <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-medium rounded">
                        {module.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-primary transition-colors">
                    {module.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {module.description}
                  </p>
                  <div className="flex items-center text-primary text-sm font-medium group-hover:gap-2 transition-all">
                    Truy cập
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Hoạt động gần đây
            </h2>
          </div>
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Chưa có hoạt động nào</p>
            <p className="text-sm mt-1">Hoạt động của bạn sẽ hiển thị ở đây</p>
          </div>
        </Card>
      </div>
    </div>
  );
}

// Named export for reuse
export { DashboardPage };

// Default export for routing
export default DashboardPage;
