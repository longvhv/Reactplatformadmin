'use client';

import { useState, useEffect, useMemo, memo, ReactNode } from "react";
import { useLocation, useNavigate } from "react-router";
import { 
  Sparkles, 
  ChevronLeft, 
  Pin,
  TrendingUp,
} from "lucide-react";
import { useTheme } from "@/providers/ThemeProvider";
import { useLanguage } from "@/providers/LanguageProvider";
import { Button } from "@/components/ui/button";
import { Header } from "./Header";
import { ModuleRegistry, MenuItem } from "../../core/ModuleRegistry.tsx";

// Define menu groups structure
interface MenuGroup {
  id: string;
  label: string;
  moduleIds: string[]; // Module IDs that belong to this group
}

const MENU_GROUPS: MenuGroup[] = [
  {
    id: 'main',
    label: 'CHÍNH',
    moduleIds: ['dashboard'],
  },
  {
    id: 'identity',
    label: 'QUẢN TRỊ & TRUY CẬP',
    moduleIds: ['tenants', 'users', 'roles', 'audit-logs', 'auth-logs', 'tenant-members', 'user-roles', 'user-delegations'],
  },
  {
    id: 'commerce',
    label: 'THƯƠNG MẠI & THANH TOÁN',
    moduleIds: ['products', 'service-packages', 'subscriptions', 'subscription-invoices', 'subscription-orders', 'tenant-subscriptions'],
  },
  {
    id: 'platform',
    label: 'NỀN TẢNG & CẤU HÌNH',
    moduleIds: ['applications', 'system-categories', 'rate-limits', 'reserved-slugs', 'system-announcements', 'notification-templates'],
  },
  {
    id: 'integrations',
    label: 'TÍCH HỢP & API',
    moduleIds: ['webhooks', 'dev-docs'],
  },
];

// Memoized Navigation Item
const NavigationItem = memo(({ route, icon, name, isPinned, onTogglePin }: {
  route: any;
  icon?: React.ReactNode;
  name: string;
  isPinned?: boolean;
  onTogglePin?: () => void;
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = location.pathname === route.path || location.pathname.startsWith(`${route.path}/`);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Use navigate for client-side navigation
    navigate(route.path);
  };

  return (
    <div className="group relative">
      <div className="relative flex items-center">
        {/* Navigation Button */}
        <button
          onClick={handleClick}
          className={`flex-1 flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-150 relative overflow-hidden ${
            isActive
              ? "bg-indigo-600 text-white"
              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
        >
          {/* Icon */}
          {icon && (
            <div className={`flex items-center justify-center flex-shrink-0 ${
              isActive ? "text-white" : "text-gray-500 dark:text-gray-400"
            }`}>
              {icon}
            </div>
          )}
          
          {/* Name */}
          <span className="flex-1 font-normal text-sm text-left truncate">
            {name}
          </span>

          {/* Trending indicator for active routes */}
          {isActive && (
            <div className="flex items-center gap-1 text-xs opacity-70">
              <TrendingUp className="h-3 w-3" />
            </div>
          )}
        </button>

        {/* Pin button - OUTSIDE navigation button */}
        {onTogglePin && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onTogglePin();
            }}
            className={`absolute right-2 p-1 rounded-lg transition-all opacity-0 group-hover:opacity-100 ${
              isPinned ? "text-yellow-500" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            }`}
          >
            <Pin className={`h-4 w-4 ${isPinned ? "fill-current" : ""}`} />
          </button>
        )}
      </div>
    </div>
  );
});

NavigationItem.displayName = 'NavigationItem';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [pinnedRoutes, setPinnedRoutes] = useState<string[]>([]);

  // Get navigation routes from ModuleRegistry
  const registryRoutes = useMemo(() => {
    const registry = ModuleRegistry.getInstance();
    const modules = registry.getEnabledModules();
    
    const menuItems: MenuItem[] = [];
    
    modules.forEach((module) => {
      // Only show modules with showInSidebar = true and menuItems
      if (module.showInSidebar && module.menuItems) {
        module.menuItems.forEach((menuItem) => {
          menuItems.push({
            ...menuItem,
            moduleId: module.id, // Add moduleId for grouping
          });
        });
      }
    });
    
    return menuItems;
  }, [t]); // Add t as dependency to re-compute when language changes

  // Group menu items by category
  const groupedMenuItems = useMemo(() => {
    const groups: Record<string, MenuItem[]> = {};
    
    MENU_GROUPS.forEach(group => {
      groups[group.id] = [];
    });
    
    registryRoutes.forEach(item => {
      // Find which group this item belongs to based on moduleId
      const group = MENU_GROUPS.find(g => 
        g.moduleIds.includes((item as any).moduleId)
      );
      
      if (group) {
        groups[group.id].push(item);
      }
    });
    
    return groups;
  }, [registryRoutes]);

  // Load saved preferences
  useEffect(() => {
    const savedPinned = localStorage.getItem('pinnedRoutes');
    const savedSidebarState = localStorage.getItem('sidebarOpen');

    if (savedPinned) {
      setPinnedRoutes(JSON.parse(savedPinned));
    }
    if (savedSidebarState !== null) {
      setSidebarOpen(JSON.parse(savedSidebarState));
    }
  }, []);

  // Toggle pin route
  const togglePinRoute = (path: string) => {
    setPinnedRoutes((prev) => {
      const newPinned = prev.includes(path)
        ? prev.filter((p) => p !== path)
        : [...prev, path];
      localStorage.setItem('pinnedRoutes', JSON.stringify(newPinned));
      return newPinned;
    });
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen((prev) => {
      const newState = !prev;
      localStorage.setItem('sidebarOpen', JSON.stringify(newState));
      return newState;
    });
  };

  // Get pinned route objects - flatten nested menu items
  const pinnedRouteObjects = useMemo(() => {
    const flattenMenuItems = (items: MenuItem[]): MenuItem[] => {
      const result: MenuItem[] = [];
      items.forEach(item => {
        if (item.path) {
          result.push(item);
        }
        if (item.children) {
          result.push(...flattenMenuItems(item.children));
        }
      });
      return result;
    };
    
    const allFlatItems = flattenMenuItems(registryRoutes);
    return allFlatItems.filter((item) => item.path && pinnedRoutes.includes(item.path));
  }, [registryRoutes, pinnedRoutes]);

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 flex flex-col`}
      >
        {/* Sidebar Header */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">VH</span>
              </div>
              <span className="font-semibold text-base text-gray-900 dark:text-white">VHV Platform</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className={`${!sidebarOpen ? "mx-auto" : ""} p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800`}
          >
            {sidebarOpen ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <Sparkles className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {/* Pinned Routes */}
          {sidebarOpen && pinnedRouteObjects.length > 0 && (
            <div className="mb-5">
              <div className="px-3 mb-1.5">
                <h3 className="flex items-center gap-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                  <Pin className="h-3 w-3" />
                  <span>Pinned</span>
                </h3>
              </div>
              <div className="space-y-0.5">
                {pinnedRouteObjects.map((route: any) => (
                  <NavigationItem
                    key={route.path}
                    route={route}
                    icon={route.icon}
                    name={route.name}
                    isPinned={true}
                    onTogglePin={() => togglePinRoute(route.path)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Grouped Navigation */}
          {sidebarOpen && MENU_GROUPS.map((group, groupIndex) => {
            const items = groupedMenuItems[group.id] || [];
            if (items.length === 0) return null;
            
            return (
              <div key={group.id} className={groupIndex > 0 ? 'mt-5' : ''}>
                {/* Group header */}
                <div className="px-3 mb-1.5">
                  <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                    {group.label}
                  </h3>
                </div>
                
                {/* Group items */}
                <div className="space-y-0.5">
                  {items.map((item) => (
                    <NavigationItem
                      key={item.path}
                      route={item}
                      icon={item.icon}
                      name={t(item.label)}
                      isPinned={pinnedRoutes.includes(item.path || '')}
                      onTogglePin={item.path ? () => togglePinRoute(item.path!) : undefined}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {/* Collapsed sidebar - icon only */}
          {!sidebarOpen && (
            <div className="space-y-2">
              {registryRoutes.map((item) => (
                <NavigationItem
                  key={item.path}
                  route={item}
                  icon={item.icon}
                  name={t(item.label)}
                />
              ))}
            </div>
          )}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header />

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}