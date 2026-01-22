'use client';

import { useState, useEffect, useMemo, memo, ReactNode } from "react";
import { useLocation, useNavigate } from "react-router";
import { 
  Sparkles, 
  ChevronLeft, 
  Pin,
  TrendingUp,
  Search,
  X,
} from "lucide-react";
import { useTheme } from "../../providers/ThemeProvider";
import { useLanguage } from "../../providers/LanguageProvider";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Header } from "./Header";
import { Breadcrumb } from "./Breadcrumb";
import { ModuleRegistry } from "../../core/ModuleRegistry.tsx";
import { MENU_GROUPS as STATIC_MENU_GROUPS } from "../../constants/menu-config";

// Memoized Navigation Item
const NavigationItem = memo(({ route, icon, name, isPinned, onTogglePin }: {
  route: any;
  icon?: ReactNode;
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
          className={`flex-1 flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 relative overflow-hidden ${
            isActive
              ? "bg-primary text-white shadow-lg shadow-primary/30 scale-[1.02]"
              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:scale-[1.01]"
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
          <span className={`flex-1 text-base text-left truncate font-semibold ${
            isActive ? "text-white" : "text-gray-500 dark:text-gray-400"
          }`}>
            {name}
          </span>

          {/* Trending indicator for active routes */}
          {isActive && (
            <div className="flex items-center gap-1 text-xs opacity-80">
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
  const [searchQuery, setSearchQuery] = useState('');

  // Use static menu configuration (loads immediately, independent of modules)
  const menuGroups = useMemo(() => {
    return STATIC_MENU_GROUPS.map(group => ({
      ...group,
      items: group.items.map(item => ({
        ...item,
        // Convert icon component to React element
        icon: item.icon ? <item.icon className="h-5 w-5" /> : undefined,
        label: item.translationKey,
      })),
    }));
  }, []);

  // Group menu items by category (convert static config to grouped format)
  const groupedMenuItems = useMemo(() => {
    const groups: Record<string, any[]> = {};
    
    menuGroups.forEach(group => {
      groups[group.id] = group.items;
    });
    
    return groups;
  }, [menuGroups]);

  // Get all menu items as flat array for pinning
  const allMenuItems = useMemo(() => {
    return menuGroups.flatMap(group => group.items);
  }, [menuGroups]);

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

  // Get pinned route objects
  const pinnedRouteObjects = useMemo(() => {
    return allMenuItems.filter((item) => item.path && pinnedRoutes.includes(item.path));
  }, [allMenuItems, pinnedRoutes]);

  // Filter menu items based on search query
  const filteredMenuGroups = useMemo(() => {
    if (!searchQuery.trim()) {
      return { groups: menuGroups, groupedItems: groupedMenuItems };
    }

    const query = searchQuery.toLowerCase();
    const filteredGroups: Record<string, any[]> = {};
    
    menuGroups.forEach(group => {
      const matchedItems = (groupedMenuItems[group.id] || []).filter(item => {
        const translatedName = t(item.label).toLowerCase();
        return translatedName.includes(query) || 
               (item.path && item.path.toLowerCase().includes(query));
      });
      
      if (matchedItems.length > 0) {
        filteredGroups[group.id] = matchedItems;
      }
    });

    const visibleGroups = menuGroups.filter(group => filteredGroups[group.id]?.length > 0);
    
    return { groups: visibleGroups, groupedItems: filteredGroups };
  }, [searchQuery, menuGroups, groupedMenuItems, t]);

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Full Width Header */}
      <Header toggleSidebar={toggleSidebar} />

      {/* Content Area with Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Below Header */}
        <aside
          className={`${
            sidebarOpen ? "w-64" : "w-0"
          } bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 flex flex-col z-20 relative overflow-hidden`}
        >
          {/* Search Box */}
          {sidebarOpen && (
            <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-800">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder={t('common.search') || 'Tìm kiếm menu...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-9 h-9 text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:bg-white dark:focus:bg-gray-900"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-3 px-2 custom-scrollbar">
            {/* Search Results or No Results */}
            {searchQuery && (
              <div className="px-3 mb-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {filteredMenuGroups.groups.length > 0 
                    ? `${filteredMenuGroups.groups.reduce((acc, g) => acc + (filteredMenuGroups.groupedItems[g.id]?.length || 0), 0)} kết quả`
                    : 'Không tìm thấy kết quả'}
                </p>
              </div>
            )}

            {/* Pinned Routes - only show when not searching */}
            {sidebarOpen && !searchQuery && pinnedRouteObjects.length > 0 && (
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
                      name={t(route.label)}
                      isPinned={true}
                      onTogglePin={() => togglePinRoute(route.path)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Grouped Navigation */}
            {sidebarOpen && filteredMenuGroups.groups.map((group, groupIndex) => {
              const items = filteredMenuGroups.groupedItems[group.id] || [];
              if (items.length === 0) return null;
              
              return (
                <div key={group.id} className={groupIndex > 0 || (searchQuery && groupIndex === 0) ? 'mt-5' : ''}>
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
          </nav>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-950">
          {/* Content with Breadcrumb */}
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-[1600px] mx-auto px-6 py-6">
              {/* Breadcrumb - inside content area */}
              <Breadcrumb />
              
              {/* Page Content */}
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}