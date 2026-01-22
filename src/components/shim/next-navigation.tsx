/**
 * Next.js Navigation Shim for React Router
 * 
 * MIGRATION STRATEGY:
 * - Khi migration sang Next.js, set USE_NEXTJS_MODE = true trong config.ts
 * - Hoặc thay thế toàn bộ file này bằng: export * from 'next/navigation'
 * - Code components không cần sửa gì!
 */

import { USE_NEXTJS_MODE, DEBUG_SHIM } from './config';
import React, { createContext, useContext } from 'react';

// ============================================================================
// CONDITIONAL IMPORTS
// ============================================================================

let useNavigate: any;
let useRouterParams: any;
let useRouterSearchParams: any;
let useLocation: any;
let RouterLink: any;

if (USE_NEXTJS_MODE) {
  // FUTURE: When migrating to Next.js, this will import from 'next/navigation'
  throw new Error('Next.js mode not yet configured. Set USE_NEXTJS_MODE = false');
} else {
  // Current: Use React Router
  const ReactRouter = require('react-router');
  useNavigate = ReactRouter.useNavigate;
  useRouterParams = ReactRouter.useParams;
  useRouterSearchParams = ReactRouter.useSearchParams;
  useLocation = ReactRouter.useLocation;
  RouterLink = ReactRouter.Link;
}

// ============================================================================
// PARAMS CONTEXT (for dynamic routes)
// ============================================================================

const ParamsContext = createContext<Record<string, string>>({});

export function ParamsProvider({ 
  params, 
  children 
}: { 
  params: Record<string, string>; 
  children: React.ReactNode 
}) {
  return (
    <ParamsContext.Provider value={params}>
      {children}
    </ParamsContext.Provider>
  );
}

// ============================================================================
// NAVIGATION HOOKS (Next.js API compatible)
// ============================================================================

/**
 * useRouter() - Next.js compatible router hook
 * 
 * MIGRATION NOTE: API is identical to Next.js App Router
 */
export function useRouter() {
  if (USE_NEXTJS_MODE) {
    // FUTURE: Will use real Next.js useRouter
    throw new Error('Next.js mode not yet configured');
  }
  
  const navigate = useNavigate();
  const location = useLocation();
  
  // Wrap navigate to dispatch custom event for React Router integration
  const enhancedNavigate = (href: string, options?: { replace?: boolean }) => {
    if (DEBUG_SHIM) {
      console.log('[Shim] Navigate to:', href, options);
    }
    
    // Dispatch custom event to trigger React Router
    window.dispatchEvent(
      new CustomEvent('app-navigate', { 
        detail: { href, replace: options?.replace || false } 
      })
    );
    
    navigate(href, options);
  };
  
  return {
    push: (href: string) => enhancedNavigate(href),
    replace: (href: string) => enhancedNavigate(href, { replace: true }),
    back: () => navigate(-1),
    forward: () => navigate(1),
    refresh: () => window.location.reload(),
    pathname: location.pathname,
    query: Object.fromEntries(new URLSearchParams(location.search)),
  };
}

/**
 * useParams() - Next.js compatible params hook
 * 
 * MIGRATION NOTE: API is identical to Next.js App Router
 */
export function useParams<T = Record<string, string>>(): T {
  if (USE_NEXTJS_MODE) {
    // FUTURE: Will use real Next.js useParams
    throw new Error('Next.js mode not yet configured');
  }
  
  // Merge React Router params with context params (from dynamic routes)
  const routerParams = useRouterParams();
  const contextParams = useContext(ParamsContext);
  
  return { ...routerParams, ...contextParams } as T;
}

/**
 * useSearchParams() - Next.js compatible search params hook
 * 
 * MIGRATION NOTE: API is identical to Next.js App Router
 */
export function useSearchParams() {
  if (USE_NEXTJS_MODE) {
    // FUTURE: Will use real Next.js useSearchParams
    throw new Error('Next.js mode not yet configured');
  }
  
  const [searchParams, setSearchParams] = useRouterSearchParams();
  
  // Return a tuple similar to Next.js
  return [searchParams, setSearchParams] as const;
}

/**
 * usePathname() - Next.js compatible pathname hook
 * 
 * MIGRATION NOTE: API is identical to Next.js App Router
 */
export function usePathname(): string {
  if (USE_NEXTJS_MODE) {
    // FUTURE: Will use real Next.js usePathname
    throw new Error('Next.js mode not yet configured');
  }
  
  const location = useLocation();
  return location.pathname;
}

// ============================================================================
// SERVER FUNCTIONS (shimmed for client-side)
// ============================================================================

/**
 * redirect() - Next.js server action (shimmed)
 * 
 * MIGRATION NOTE: In Next.js, this should only be used in Server Components
 */
export function redirect(url: string): never {
  if (DEBUG_SHIM) {
    console.warn('[Shim] redirect() called - prefer useRouter().push() in client components');
  }
  
  window.location.href = url;
  throw new Error('REDIRECT'); // Never returns
}

/**
 * notFound() - Next.js not-found handler (shimmed)
 * 
 * MIGRATION NOTE: In Next.js, this triggers not-found.tsx
 */
export function notFound(): never {
  throw new Error('NOT_FOUND');
}

// ============================================================================
// LINK COMPONENT (Next.js API compatible)
// ============================================================================

/**
 * Link component - Next.js compatible
 * 
 * MIGRATION NOTE: API is identical to Next.js Link
 */
export const Link = RouterLink;

// ============================================================================
// TYPE EXPORTS (for TypeScript)
// ============================================================================

export type { ReadonlyURLSearchParams } from 'react-router';

// ============================================================================
// MIGRATION HELPERS
// ============================================================================

/**
 * Helper function to check if running in shim mode
 * Useful for conditional logic during migration
 */
export function isShimMode(): boolean {
  return !USE_NEXTJS_MODE;
}

/**
 * Helper to log shim usage (for debugging during migration)
 */
export function logShimUsage(component: string, hook: string): void {
  if (DEBUG_SHIM) {
    console.log(`[Shim] ${component} is using ${hook}`);
  }
}
