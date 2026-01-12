/**
 * Navigation Utilities
 * Helper functions for navigation-related operations
 */

import type { Route, MenuItem } from '../types';

/**
 * Filter routes based on search query
 */
export function filterRoutes(routes: Route[], query: string): Route[] {
  if (!query) return routes;
  
  const lowerQuery = query.toLowerCase();
  return routes.filter(route => {
    const titleMatch = route.title?.toLowerCase().includes(lowerQuery);
    const pathMatch = route.path.toLowerCase().includes(lowerQuery);
    return titleMatch || pathMatch;
  });
}

/**
 * Find route by path
 */
export function findRouteByPath(routes: Route[], path: string): Route | undefined {
  return routes.find(route => route.path === path);
}

/**
 * Get breadcrumb items from current path
 */
export function getBreadcrumbItems(path: string): string[] {
  return path.split('/').filter(Boolean);
}

/**
 * Check if route is active
 */
export function isRouteActive(currentPath: string, routePath: string): boolean {
  return currentPath === routePath;
}

/**
 * Flatten nested menu items
 */
export function flattenMenuItems(items: MenuItem[]): MenuItem[] {
  return items.reduce<MenuItem[]>((acc, item) => {
    acc.push(item);
    if (item.children) {
      acc.push(...flattenMenuItems(item.children));
    }
    return acc;
  }, []);
}

/**
 * Filter menu items based on search query
 */
export function filterMenuItems(items: MenuItem[], query: string): MenuItem[] {
  if (!query) return items;
  
  const lowerQuery = query.toLowerCase();
  
  return items.reduce<MenuItem[]>((acc, item) => {
    const labelMatch = item.label.toLowerCase().includes(lowerQuery);
    const pathMatch = item.path?.toLowerCase().includes(lowerQuery);
    const hasMatchingChildren = item.children?.some(child =>
      child.label.toLowerCase().includes(lowerQuery)
    );
    
    if (labelMatch || pathMatch || hasMatchingChildren) {
      const filteredItem = { ...item };
      if (item.children && hasMatchingChildren) {
        filteredItem.children = filterMenuItems(item.children, query);
      }
      acc.push(filteredItem);
    }
    
    return acc;
  }, []);
}

/**
 * Get menu item by id
 */
export function findMenuItemById(items: MenuItem[], id: string): MenuItem | undefined {
  for (const item of items) {
    if (item.id === id) return item;
    if (item.children) {
      const found = findMenuItemById(item.children, id);
      if (found) return found;
    }
  }
  return undefined;
}
