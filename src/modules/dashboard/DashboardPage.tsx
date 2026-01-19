/**
 * Dashboard Page - Modern & Professional
 * Clean design with module quick access
 */

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
import { Link } from 'react-router';
import { Card } from '../../components/ui/card';
import { MENU_GROUPS } from '../../constants/menu-config';

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

export function DashboardPage() {
  // Quick stats - Có thể connect với API sau
  const quickStats: QuickStat[] = [
    {
      label: 'Tổng người dùng',
      value: '2,847',
      change: '+12.5%',
      trend: 'up',
      icon: Users,
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
    },
    {
      label: 'Tổ chức',
      value: '142',
      change: '+8.2%',
      trend: 'up',
      icon: Building2,
      color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20',
    },
    {
      label: 'Đơn hàng',
      value: '1,234',
      change: '+23.1%',
      trend: 'up',
      icon: ShoppingCart,
      color: 'text-green-600 bg-green-50 dark:bg-green-900/20',
    },
    {
      label: 'Doanh thu',
      value: '₫1.2M',
      change: '+15.3%',
      trend: 'up',
      icon: TrendingUp,
      color: 'text-primary bg-primary-50 dark:bg-primary-900/20',
    },
  ];

  // Module quick access - Auto từ menu config
  const moduleCards: ModuleCard[] = [
    {
      id: 'users',
      title: 'Quản lý Người dùng',
      description: 'Quản lý tài khoản, quyền hạn và ủy quyền',
      path: '/admin/users',
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      badge: 'Quan trọng',
    },
    {
      id: 'tenants',
      title: 'Quản lý Tổ chức',
      description: 'Quản lý tenants và cấu hình multi-tenancy',
      path: '/admin/tenants',
      icon: Building2,
      color: 'from-purple-500 to-purple-600',
    },
    {
      id: 'applications',
      title: 'Ứng dụng',
      description: 'Quản lý applications và capabilities',
      path: '/platform/applications',
      icon: Grid3x3,
      color: 'from-primary-500 to-primary-600',
    },
    {
      id: 'products',
      title: 'Sản phẩm',
      description: 'Quản lý catalog sản phẩm và dịch vụ',
      path: '/commerce/products',
      icon: Package,
      color: 'from-green-500 to-green-600',
    },
    {
      id: 'orders',
      title: 'Đơn đăng ký',
      description: 'Quản lý subscription orders và invoices',
      path: '/commerce/subscription-orders',
      icon: ShoppingCart,
      color: 'from-orange-500 to-orange-600',
    },
    {
      id: 'audit',
      title: 'Nhật ký Kiểm toán',
      description: 'Theo dõi activities và security logs',
      path: '/admin/audit-logs',
      icon: Activity,
      color: 'from-red-500 to-red-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-14 h-14 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
            <LayoutDashboard className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
              Dashboard
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Chào mừng trở lại! Đây là tổng quan về hệ thống của bạn.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat) => (
          <Card key={stat.label} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {stat.value}
                </p>
                <div className={`inline-flex items-center text-sm font-medium ${
                  stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  <TrendingUp className={`w-4 h-4 mr-1 ${
                    stat.trend === 'down' ? 'rotate-180' : ''
                  }`} />
                  {stat.change}
                </div>
              </div>
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Module Quick Access */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Truy cập nhanh
          </h2>
          <Link 
            to="/admin/users" 
            className="text-sm text-primary hover:text-primary-700 font-medium inline-flex items-center gap-1"
          >
            Xem tất cả
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {moduleCards.map((module) => (
            <Link
              key={module.id}
              to={module.path}
              className="group"
            >
              <Card className="p-6 h-full transition-all hover:shadow-lg hover:scale-[1.02] hover:border-primary/50">
                <div className="flex flex-col h-full">
                  {/* Icon & Badge */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${module.color} shadow-lg`}>
                      <module.icon className="w-6 h-6 text-white" />
                    </div>
                    {module.badge && (
                      <span className="px-2 py-1 text-xs font-medium bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 rounded-full">
                        {module.badge}
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-primary transition-colors">
                      {module.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {module.description}
                    </p>
                  </div>

                  {/* Arrow */}
                  <div className="mt-4 flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 group-hover:text-primary transition-colors">
                    Truy cập
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* All Modules Overview */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Tất cả modules
        </h2>
        
        <div className="space-y-6">
          {MENU_GROUPS.filter(group => group.id !== 'main').map((group) => (
            <Card key={group.id} className="p-6">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
                {group.label}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {group.items.map((item) => (
                  <Link
                    key={item.id}
                    to={item.path}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary hover:bg-primary-50/50 dark:hover:bg-primary-900/10 transition-all group"
                  >
                    <div className="p-2 rounded-md bg-gray-100 dark:bg-gray-800 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30 transition-colors">
                      <item.icon className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-primary transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-primary transition-colors">
                        {item.label}
                      </p>
                    </div>
                    {item.badge && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Activities (Placeholder) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Hoạt động gần đây
          </h2>
          <Link 
            to="/admin/audit-logs" 
            className="text-sm text-primary hover:text-primary-700 font-medium inline-flex items-center gap-1"
          >
            Xem tất cả
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <Card className="p-6">
          <div className="space-y-4">
            {[
              { action: 'Tạo mới người dùng', user: 'Admin', time: '5 phút trước' },
              { action: 'Cập nhật tenant', user: 'John Doe', time: '15 phút trước' },
              { action: 'Thêm sản phẩm mới', user: 'Jane Smith', time: '1 giờ trước' },
              { action: 'Xóa đơn hàng', user: 'Admin', time: '2 giờ trước' },
            ].map((activity, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-800">
                    <Clock className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {activity.action}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      bởi {activity.user}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {activity.time}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default DashboardPage;