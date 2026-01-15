import { useState, memo, useEffect } from "react";
import { NavLink, useLocation } from "react-router";
import { ChevronRight, ChevronDown, Circle } from "lucide-react";
import { MenuItem } from "../../core/ModuleRegistry";
import { Tooltip } from "../ui/Tooltip";
import { useLanguage } from "../../providers/LanguageProvider";

interface NestedMenuItemProps {
  item: MenuItem;
  level: number;
  collapsed: boolean;
  onClose: () => void;
  searchQuery?: string;
}

/**
 * Nested Menu Item Component - Enhanced Version
 * 
 * Features:
 * - Recursive nesting up to 4 levels
 * - Auto-expand when contains active route
 * - Persistent expand state (localStorage)
 * - Search term highlighting
 * - Staggered animations
 * - Context indicators
 * - Keyboard navigation support
 * - Smooth transitions
 */
export const NestedMenuItem = memo(({ item, level, collapsed, onClose, searchQuery = "" }: NestedMenuItemProps) => {
  const { t } = useLanguage();
  const location = useLocation();
  const hasChildren = item.children && item.children.length > 0;
  
  // Check if this item or any child contains the active route
  const containsActiveRoute = (menuItem: MenuItem): boolean => {
    if (menuItem.path === location.pathname) return true;
    if (menuItem.children) {
      return menuItem.children.some(child => containsActiveRoute(child));
    }
    return false;
  };

  const isActive = item.path === location.pathname;
  const hasActiveChild = hasChildren && containsActiveRoute(item);

  // Persistent expand state with auto-expand for active routes
  const storageKey = `menu-expanded-${item.id}`;
  const getInitialExpanded = () => {
    if (hasActiveChild) return true; // Auto-expand if contains active route
    const stored = localStorage.getItem(storageKey);
    return stored ? JSON.parse(stored) : false;
  };

  const [isExpanded, setIsExpanded] = useState(getInitialExpanded);

  // Save expand state to localStorage
  useEffect(() => {
    if (hasChildren) {
      localStorage.setItem(storageKey, JSON.stringify(isExpanded));
    }
  }, [isExpanded, hasChildren, storageKey]);

  // Auto-expand when route changes and contains active child
  useEffect(() => {
    if (hasActiveChild && !isExpanded) {
      setIsExpanded(true);
    }
  }, [hasActiveChild, location.pathname]);

  // Calculate indentation based on level
  const paddingLeft = collapsed ? "px-3" : `pl-${4 + level * 3}`;

  const handleClick = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    } else if (item.path) {
      onClose();
    }
  };

  // Highlight search term
  const highlightText = (text: string) => {
    if (!searchQuery || collapsed) return text;
    
    const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === searchQuery.toLowerCase() 
        ? <mark key={i} className="bg-primary/20 text-primary font-medium rounded px-0.5">{part}</mark>
        : part
    );
  };

  const content = (
    <>
      {/* Icon or Level Indicator */}
      {item.icon ? (
        <span className={`flex-shrink-0 transition-all duration-200 ${!isActive && 'group-hover:scale-110 group-hover:text-primary'}`}>
          {item.icon}
        </span>
      ) : level > 0 && !collapsed && (
        <Circle className={`w-1.5 h-1.5 flex-shrink-0 ${isActive ? 'fill-white' : 'fill-current opacity-40'}`} />
      )}

      {/* Label with highlighting */}
      {!collapsed && (
        <span className="flex-1 truncate text-sm font-medium">
          {highlightText(item.label)}
        </span>
      )}

      {/* Badge */}
      {!collapsed && item.badge && (
        <span className="px-1.5 py-0.5 text-xs rounded-md bg-primary/10 text-primary font-semibold min-w-[20px] text-center">
          {item.badge}
        </span>
      )}

      {/* Children count indicator */}
      {!collapsed && hasChildren && !isExpanded && (
        <span className="text-xs text-muted-foreground font-medium opacity-0 group-hover:opacity-100 transition-opacity">
          {item.children!.length}
        </span>
      )}

      {/* Expand/Collapse Icon */}
      {!collapsed && hasChildren && (
        <span className={`ml-auto flex-shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-0' : '-rotate-0'}`}>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </span>
      )}
    </>
  );

  const baseClasses = `
    group flex items-center gap-3 ${paddingLeft} py-2.5 rounded-xl 
    transition-all duration-200 relative overflow-hidden cursor-pointer
    ${collapsed ? 'justify-center' : ''}
    ${isActive 
      ? 'bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/20' 
      : hasActiveChild && !collapsed
        ? 'bg-secondary text-foreground border-l-2 border-primary/50'
        : 'text-foreground/70 hover:text-foreground hover:bg-secondary dark:hover:bg-secondary/50 hover:border-l-2 hover:border-primary/30'
    }
    ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}
  `;

  // Render as NavLink if has path, otherwise as button
  const element = item.path && !hasChildren ? (
    <NavLink
      to={item.path}
      onClick={handleClick}
      className={baseClasses}
    >
      {/* Active indicator gradient */}
      {isActive && (
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent animate-in fade-in-0 slide-in-from-left-2 duration-300" />
      )}
      
      {/* Hover gradient */}
      {!isActive && (
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      )}
      
      <div className="relative z-10 flex items-center gap-3 w-full">
        {content}
      </div>
    </NavLink>
  ) : (
    <button
      onClick={handleClick}
      className={baseClasses}
      disabled={item.disabled}
    >
      {/* Active child indicator */}
      {hasActiveChild && !collapsed && (
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent" />
      )}
      
      {/* Hover gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      
      <div className="relative z-10 flex items-center gap-3 w-full">
        {content}
      </div>
    </button>
  );

  return (
    <div>
      {/* Main Item */}
      {collapsed && item.icon ? (
        <Tooltip content={item.label} side="right">
          {element}
        </Tooltip>
      ) : (
        element
      )}

      {/* Children (if expanded and not collapsed) */}
      {hasChildren && isExpanded && !collapsed && (
        <div className="space-y-0.5 animate-in slide-in-from-top-1 fade-in-0 duration-200">
          {item.children!.map((child, index) => (
            <div
              key={child.id}
              style={{ 
                animationDelay: `${index * 30}ms`,
                animationFillMode: 'backwards'
              }}
              className="animate-in slide-in-from-left-2 fade-in-0 duration-200"
            >
              <NestedMenuItem
                item={child}
                level={level + 1}
                collapsed={collapsed}
                onClose={onClose}
                searchQuery={searchQuery}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

NestedMenuItem.displayName = "NestedMenuItem";