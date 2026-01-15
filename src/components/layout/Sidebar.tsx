/**
 * Sidebar Component with Grouped Navigation
 * Professional sidebar with hierarchical groups, similar to Stripe/Linear/GitHub design
 */

import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import {
  LayoutDashboard,
  Building2,
  Users,
  Shield,
  Package,
  Gift,
  RefreshCcw,
  ShoppingCart,
  Target,
  Route,
  Clock,
  Megaphone,
  Webhook,
  Key,
  FileText,
  Activity,
  Settings,
  Folder,
  ChevronLeft,
} from 'lucide-react';

// Menu item type
interface MenuItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: number | string;
  description?: string;
}

// Menu group type
interface MenuGroup {
  id: string;
  label: string;
  items: MenuItem[];
}

// Menu configuration with grouped structure
const MENU_GROUPS: MenuGroup[] = [
  {
    id: 'main',
    label: 'CHÍNH',
    items: [
      {
        label: 'Tổng Quan',
        path: '/core/dashboard',
        icon: <LayoutDashboard className="w-5 h-5" />,
      },
    ],
  },
  {
    id: 'identity',
    label: 'QUẢN TRỊ & TRUY CẬP',
    items: [
      {
        label: 'Tenants',
        path: '/core/tenants',
        icon: <Building2 className="w-5 h-5" />,
      },
      {
        label: 'Người Dùng',
        path: '/core/users',
        icon: <Users className="w-5 h-5" />,
      },
      {
        label: 'Vai Trò',
        path: '/core/roles',
        icon: <Shield className="w-5 h-5" />,
      },
      {
        label: 'Lịch Sử Truy Cập',
        path: '/core/audit-logs',
        icon: <Activity className="w-5 h-5" />,
      },
    ],
  },
  {
    id: 'commerce',
    label: 'THƯƠNG MẠI & THANH TOÁN',
    items: [
      {
        label: 'Sản Phẩm',
        path: '/core/products',
        icon: <Package className="w-5 h-5" />,
      },
      {
        label: 'Gói Dịch Vụ',
        path: '/core/packages',
        icon: <Gift className="w-5 h-5" />,
      },
      {
        label: 'Đăng Ký',
        path: '/core/subscriptions',
        icon: <RefreshCcw className="w-5 h-5" />,
      },
      {
        label: 'Đơn Hàng',
        path: '/core/orders',
        icon: <ShoppingCart className="w-5 h-5" />,
      },
    ],
  },
  {
    id: 'platform',
    label: 'NỀN TẢNG & CẤU HÌNH',
    items: [
      {
        label: 'Ứng Dụng',
        path: '/core/applications',
        icon: <Target className="w-5 h-5" />,
      },
      {
        label: 'Danh Mục Hệ Thống',
        path: '/core/system-categories',
        icon: <Folder className="w-5 h-5" />,
      },
      {
        label: 'App Routes',
        path: '/core/app-routes',
        icon: <Route className="w-5 h-5" />,
      },
      {
        label: 'Giới Hạn Tốc Độ',
        path: '/core/rate-limits',
        icon: <Clock className="w-5 h-5" />,
      },
      {
        label: 'Reserved Slugs',
        path: '/core/reserved-slugs',
        icon: <Shield className="w-5 h-5" />,
      },
      {
        label: 'Thông Báo',
        path: '/core/announcements',
        icon: <Megaphone className="w-5 h-5" />,
      },
    ],
  },
  {
    id: 'integrations',
    label: 'TÍCH HỢP & API',
    items: [
      {
        label: 'Webhooks',
        path: '/core/webhooks',
        icon: <Webhook className="w-5 h-5" />,
        badge: 'ACTIVE',
      },
      {
        label: 'API Keys',
        path: '/core/api-keys',
        icon: <Key className="w-5 h-5" />,
      },
    ],
  },
  {
    id: 'analytics',
    label: 'PHÂN TÍCH & BÁO CÁO',
    items: [
      {
        label: 'Báo Cáo',
        path: '/core/reports',
        icon: <FileText className="w-5 h-5" />,
      },
      {
        label: 'Nhật Ký Kiểm Toán',
        path: '/core/audit-logs',
        icon: <Activity className="w-5 h-5" />,
      },
    ],
  },
];

export function Sidebar() {
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Close mobile sidebar on navigation
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  const isActiveRoute = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-50 transition-transform duration-300 lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        } w-64`}
      >
        {/* Header */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600">
              <span className="text-white font-bold text-sm">VH</span>
            </div>
            <span className="text-base font-semibold text-gray-900">VHV Platform</span>
          </div>
          <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {/* Menu groups */}
          {MENU_GROUPS.map((group, groupIndex) => (
            <div key={group.id} className={groupIndex > 0 ? 'mt-5' : ''}>
              {/* Group header - uppercase, small text, light gray */}
              <div className="px-3 mb-1.5">
                <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                  {group.label}
                </h3>
              </div>

              {/* Group items */}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = isActiveRoute(item.path);

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center justify-between px-3 py-2 rounded-md transition-all duration-150 group ${
                        isActive
                          ? 'bg-indigo-600 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      title={item.description}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-500'}`}>
                          {item.icon}
                        </div>
                        <span className="text-sm font-normal truncate">{item.label}</span>
                      </div>
                      {item.badge !== undefined && (
                        <span
                          className={`px-2 py-0.5 text-[11px] font-semibold rounded-full flex-shrink-0 ml-2 ${
                            typeof item.badge === 'string'
                              ? isActive 
                                ? 'bg-indigo-700 text-white'
                                : 'bg-indigo-100 text-indigo-700'
                              : isActive
                              ? 'bg-indigo-700 text-white'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-200 p-2 space-y-0.5">
          <Link
            to="/core/settings"
            className={`flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-150 ${
              isActiveRoute('/core/settings')
                ? 'bg-indigo-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span className="text-sm">Cài Đặt</span>
          </Link>

          <Link
            to="/core/profile"
            className={`flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-150 ${
              isActiveRoute('/core/profile')
                ? 'bg-indigo-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span className="text-sm">Hồ Sơ</span>
          </Link>
        </div>
      </aside>

      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="fixed top-4 left-4 z-30 lg:hidden p-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
      >
        <svg
          className="w-6 h-6 text-gray-700"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>
    </>
  );
}