/**
 * Type definitions for Next.js navigation shim
 * 
 * These types match Next.js App Router APIs to ensure type compatibility
 * during migration.
 */

import type { NavigateOptions } from 'react-router';

// ============================================================================
// ROUTER TYPES
// ============================================================================

/**
 * Next.js App Router - useRouter() return type
 */
export interface AppRouterInstance {
  /**
   * Navigate to the provided href.
   * @param href - The URL to navigate to
   */
  push(href: string): void;

  /**
   * Navigate to the provided href and replace the current history entry.
   * @param href - The URL to navigate to
   */
  replace(href: string): void;

  /**
   * Navigate back in history
   */
  back(): void;

  /**
   * Navigate forward in history
   */
  forward(): void;

  /**
   * Refresh the current route
   */
  refresh(): void;

  /**
   * The current pathname
   */
  pathname: string;

  /**
   * The current query parameters as an object
   */
  query: Record<string, string>;
}

// ============================================================================
// PARAMS TYPES
// ============================================================================

/**
 * Route parameters type
 * Used by useParams() hook
 */
export type RouteParams<T = Record<string, string>> = T;

/**
 * Search parameters type (readonly)
 * Used by useSearchParams() hook
 */
export type ReadonlyURLSearchParams = URLSearchParams;

// ============================================================================
// LINK TYPES
// ============================================================================

/**
 * Link component props
 * Compatible with both React Router Link and Next.js Link
 */
export interface LinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  prefetch?: boolean; // Next.js specific (ignored in shim)
  replace?: boolean;
  scroll?: boolean; // Next.js specific (ignored in shim)
  shallow?: boolean; // Next.js specific (ignored in shim)
}

// ============================================================================
// NAVIGATION EVENT TYPES
// ============================================================================

/**
 * Custom event for app navigation
 * Used by shim to communicate with React Router
 */
export interface AppNavigateEventDetail {
  href: string;
  replace: boolean;
}

export interface AppNavigateEvent extends CustomEvent<AppNavigateEventDetail> {
  detail: AppNavigateEventDetail;
}

// ============================================================================
// MODULE REGISTRY TYPES (Shim specific - will be removed in Next.js)
// ============================================================================

/**
 * Route definition for module registry
 */
export interface RouteDefinition {
  path: string;
  element: React.ReactElement;
  layout?: React.ComponentType<{ children: React.ReactNode }>;
  metadata?: {
    title?: string;
    description?: string;
  };
}

/**
 * Module definition for registry
 */
export interface ModuleDefinition {
  name: string;
  routes: RouteDefinition[];
  enabled?: boolean;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Navigation options
 */
export interface NavigationOptions {
  replace?: boolean;
  scroll?: boolean;
  shallow?: boolean;
}

/**
 * Redirect options (for server-side redirects)
 */
export type RedirectType = 'push' | 'replace';

// ============================================================================
// AUGMENT WINDOW FOR CUSTOM EVENTS
// ============================================================================

declare global {
  interface WindowEventMap {
    'app-navigate': AppNavigateEvent;
  }
}

// ============================================================================
// RE-EXPORTS from react-router (for type compatibility)
// ============================================================================

export type { NavigateOptions } from 'react-router';
