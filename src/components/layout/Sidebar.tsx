/**
 * Sidebar Component with Grouped Navigation
 * Professional sidebar with hierarchical groups, similar to Stripe/Linear/GitHub design
 */

import { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router';
import {
  ChevronLeft,
  Settings,
} from 'lucide-react';
import { ModuleRegistry } from '../../core/ModuleRegistry';

// Menu item type
interface MenuItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: number | string;
  description?: string;
  order?: number;
}

// Menu group type
interface MenuGroup {
  id: string;
  label: string;
  items: MenuItem[];
}

/**
 * Function to determine menu group based on order
 */
function getMenuGroup(order: number): string {
  if (order < 10) return 'main';           // 0-9: Dashboard
  if (order < 30) return 'identity';        // 10-29: Tenants, Users, Roles
  if (order < 50) return 'commerce';        // 30-49: Products, Services, Orders, Invoices
  if (order < 70) return 'platform';        // 50-69: Applications, System Categories
  if (order < 90) return 'integrations';    // 70-89: (Reserved for future)
  if (order < 110) return 'settings';       // 90-109: System Announcements, Templates, Settings
  return 'analytics';                       // 110+: Help, Audit logs
}

/**
 * Group labels mapping
 */
const GROUP_LABELS: Record<string, string> = {
  main: 'CHÍNH',
  identity: 'QUẢN TRỊ & TRUY CẬP',
  commerce: 'THƯƠNG MẠI & THANH TOÁN',
  platform: 'NỀN TẢNG & CẤU HÌNH',
  integrations: 'TÍCH HỢP & API',
  analytics: 'PHÂN TÍCH & BÁO CÁO',
  settings: 'CẤU HÌNH HỆ THỐNG',
};

export function Sidebar() {
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [modulesReady, setModulesReady] = useState(false);
  
  console.log('🔍 DEBUG: Sidebar component RENDERED! modulesReady:', modulesReady);
  
  // Wait for modules to be registered
  useEffect(() => {
    console.log('🔍 DEBUG: Sidebar useEffect RUNNING - setting up timer');
    // Give moduleRegistration time to complete
    const timer = setTimeout(() => {
      console.log('🔍 DEBUG: Timer fired! Setting modulesReady = true');
      setModulesReady(true);
      console.log('🔍 DEBUG Sidebar: Modules ready, triggering useMemo recalculation');
    }, 100);
    
    return () => {
      console.log('🔍 DEBUG: Sidebar useEffect CLEANUP');
      clearTimeout(timer);
    };
  }, []);

  // Get menu items from ModuleRegistry
  const MENU_GROUPS = useMemo(() => {
    console.log('🔍 DEBUG Sidebar useMemo: Running... modulesReady =', modulesReady);
    
    if (!modulesReady) {
      console.log('🔍 DEBUG Sidebar useMemo: Modules not ready yet, returning empty groups');
      return [];
    }
    
    const registry = ModuleRegistry.getInstance();
    const menuItems = registry.getAllMenuItems();
    
    console.log('🔍 DEBUG Sidebar: All menu items from registry:', menuItems);
    console.log('🔍 DEBUG Sidebar: Digital Assets found?', menuItems.find(m => m.label?.includes('Tài Sản')));
    console.log('🔍 DEBUG Sidebar: Service Deliveries found?', menuItems.find(m => m.label?.includes('Dịch Vụ')));

    // Group menu items by their order
    const groupedItems: Record<string, MenuItem[]> = {};

    menuItems.forEach((item) => {
      const order = (item as any).order ?? 999;
      const groupId = getMenuGroup(order);
      
      console.log(`🔍 DEBUG Sidebar: Item "${item.label}" - order: ${order}, group: ${groupId}`);

      if (!groupedItems[groupId]) {
        groupedItems[groupId] = [];
      }

      groupedItems[groupId].push({
        label: item.label,
        path: item.path || '#',
        icon: item.icon || null,
        badge: item.badge,
        description: (item as any).description,
        order,
      });
    });
    
    console.log('🔍 DEBUG: Grouped items:', groupedItems);

    // Convert to MenuGroup array in order
    const groups: MenuGroup[] = [];
    const groupOrder = ['main', 'identity', 'commerce', 'platform', 'integrations', 'analytics', 'settings'];

    groupOrder.forEach((groupId) => {
      if (groupedItems[groupId] && groupedItems[groupId].length > 0) {
        groups.push({
          id: groupId,
          label: GROUP_LABELS[groupId] || groupId.toUpperCase(),
          items: groupedItems[groupId].sort((a, b) => (a.order ?? 999) - (b.order ?? 999)),
        });
      }
    });
    
    console.log('🔍 DEBUG: Final groups:', groups);

    return groups;
  }, [modulesReady]);

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