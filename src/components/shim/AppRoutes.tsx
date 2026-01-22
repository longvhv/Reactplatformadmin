/**
 * AppRoutes Component
 * 
 * Client-side routing system that mimics Next.js App Router structure.
 * Works with module registry to dynamically load routes.
 * 
 * This is a shim layer - when migrating to real Next.js, this file will be removed.
 */

import React, { useMemo, useEffect } from 'react';
import { usePathname, ParamsProvider, useRouter } from './next-navigation';
import { ModuleRegistry, RouteDefinition } from '../../core/ModuleRegistry';
import { registerAllModules } from '../../core/moduleRegistration';

// Ensure modules are registered immediately
registerAllModules();

// ============================================================================
// ERROR BOUNDARY
// ============================================================================

class RouteErrorBoundary extends React.Component<
  { children: React.ReactNode; pathname: string; onReset: () => void },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    console.error('Route loading error:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Route error details:', error, errorInfo);
  }

  componentDidUpdate(prevProps: any) {
    // Reset error when pathname changes
    if (prevProps.pathname !== this.props.pathname && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-6">
          <div className="text-yellow-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            Trang đang được cập nhật
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            Không thể tải trang: {this.props.pathname}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
            Vui lòng thử lại sau hoặc quay về Dashboard
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Tải lại
            </button>
            <button
              onClick={this.props.onReset}
              className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors"
            >
              Về Dashboard
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// PATH MATCHING
// ============================================================================

/**
 * Match a path against a route pattern
 * Supports :param and [param] syntax (Next.js style)
 * 
 * @example
 * matchPath('/admin/users/123', '/admin/users/:id')
 * // Returns: { id: '123' }
 * 
 * matchPath('/admin/users/123', '/admin/users/[id]')
 * // Returns: { id: '123' }
 */
function matchPath(currentPath: string, routePath: string): Record<string, string> | null {
  // Normalize paths (remove trailing slash)
  const normalize = (p: string) => p.replace(/\/$/, '') || '/';
  const current = normalize(currentPath);
  const route = normalize(routePath);

  // Exact match
  if (current === route) return {};

  const currentParts = current.split('/');
  const routeParts = route.split('/');

  // Different segment count = no match
  if (currentParts.length !== routeParts.length) return null;

  const params: Record<string, string> = {};

  for (let i = 0; i < currentParts.length; i++) {
    const routePart = routeParts[i];
    const currentPart = currentParts[i];

    // Dynamic segment - React Router style (:id)
    if (routePart.startsWith(':')) {
      const paramName = routePart.slice(1);
      params[paramName] = currentPart;
    } 
    // Dynamic segment - Next.js style ([id])
    else if (routePart.startsWith('[') && routePart.endsWith(']')) {
      const paramName = routePart.slice(1, -1);
      params[paramName] = currentPart;
    } 
    // Static segment - must match exactly
    else if (routePart !== currentPart) {
      return null;
    }
  }

  return params;
}

/**
 * Sort routes by specificity
 * More specific routes (more static segments) come first
 */
function sortRoutesBySpecificity(routes: RouteDefinition[]): RouteDefinition[] {
  return [...routes].sort((a, b) => {
    const aSegments = a.path.split('/');
    const bSegments = b.path.split('/');

    // Count static segments (higher = more specific)
    const aStatic = aSegments.filter(s => !s.startsWith(':') && !s.startsWith('[')).length;
    const bStatic = bSegments.filter(s => !s.startsWith(':') && !s.startsWith('[')).length;

    if (aStatic !== bStatic) {
      return bStatic - aStatic; // More static segments first
    }

    // If same number of static segments, longer path first
    return b.path.length - a.path.length;
  });
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AppRoutes() {
  const pathname = usePathname();
  const router = useRouter();
  const [, forceUpdate] = React.useState({});
  
  // Subscribe to registry changes to update routes when modules load
  useEffect(() => {
    const registry = ModuleRegistry.getInstance();
    const unsubscribe = registry.subscribe(() => {
      forceUpdate({}); // Force re-render when modules are registered
    });
    return unsubscribe;
  }, []);
  
  // Get routes dynamically (updates when modules load)
  const routes = useMemo(() => {
    const allRoutes = ModuleRegistry.getInstance().getAllRoutes();
    return sortRoutesBySpecificity(allRoutes);
  }, [ModuleRegistry.getInstance().getAllRoutes().length]); // Re-compute when routes change

  // Handle root redirect
  useEffect(() => {
    if (pathname === '/') {
      router.replace('/admin/dashboard');
    }
  }, [pathname, router]);

  // Find matching route
  let matchedRoute: RouteDefinition | null = null;
  let params: Record<string, string> = {};

  for (const route of routes) {
    const match = matchPath(pathname, route.path);
    if (match) {
      matchedRoute = route;
      params = match;
      break;
    }
  }

  // No match - show 404
  if (!matchedRoute) {
    if (pathname === '/') return null; // Wait for redirect
    
    // Show loading state briefly before showing 404
    // (in case modules are still loading)
    if (routes.length < 10) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Đang tải modules...</p>
        </div>
      );
    }
    
    // 404 Page
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">404</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Không tìm thấy trang: {pathname}
        </p>
        <button 
          onClick={() => router.push('/admin/dashboard')}
          className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors"
        >
          Về Dashboard
        </button>
      </div>
    );
  }

  // Render matched route with params context
  return (
    <ParamsProvider params={params}>
      <RouteErrorBoundary 
        pathname={pathname} 
        onReset={() => router.push('/admin/dashboard')}
      >
        {matchedRoute.element}
      </RouteErrorBoundary>
    </ParamsProvider>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default AppRoutes;
