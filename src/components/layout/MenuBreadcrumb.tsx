import { memo, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { ModuleRegistry, MenuItem } from "../../core/ModuleRegistry";

/**
 * Menu Breadcrumb Component
 * 
 * Displays breadcrumb trail based on current route in nested menu
 * Shows the hierarchy path: Module > Level 1 > Level 2 > Level 3
 */
export const MenuBreadcrumb = memo(() => {
  const location = useLocation();
  const registry = ModuleRegistry.getInstance();

  const breadcrumbs = useMemo(() => {
    const modules = registry.getEnabledModules();
    const path: Array<{ label: string; icon?: React.ReactNode }> = [];

    // Find the module and menu item that matches current route
    for (const module of modules) {
      if (!module.menuItems) continue;

      const findPath = (items: MenuItem[], parentPath: typeof path = []): boolean => {
        for (const item of items) {
          const currentPath = [...parentPath, { label: item.label, icon: item.icon }];

          if (item.path === location.pathname) {
            path.push(...currentPath);
            return true;
          }

          if (item.children && findPath(item.children, currentPath)) {
            return true;
          }
        }
        return false;
      };

      if (findPath(module.menuItems, [{ label: module.name, icon: module.icon }])) {
        break;
      }
    }

    return path;
  }, [location.pathname, registry]);

  if (breadcrumbs.length === 0) return null;

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground px-6 py-3 border-b border-border bg-card/50">
      {breadcrumbs.map((crumb, index) => (
        <div key={index} className="flex items-center gap-2">
          {index > 0 && <ChevronRight className="w-4 h-4" />}
          <div className="flex items-center gap-1.5">
            {crumb.icon && <span className="opacity-70">{crumb.icon}</span>}
            <span className={index === breadcrumbs.length - 1 ? "text-foreground font-medium" : ""}>
              {crumb.label}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
});

MenuBreadcrumb.displayName = "MenuBreadcrumb";
