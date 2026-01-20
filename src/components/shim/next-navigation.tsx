/**
 * Next.js Navigation Shim for React Router
 * This provides Next.js-like hooks using react-router under the hood
 */

import { 
  useNavigate, 
  useParams as useRouterParams, 
  useSearchParams as useRouterSearchParams,
  useLocation,
  Link as RouterLink
} from 'react-router';
import { useCallback } from 'react';

// Shim useRouter to match Next.js API
export function useRouter() {
  const navigate = useNavigate();
  const location = useLocation();
  
  return {
    push: (href: string) => navigate(href),
    replace: (href: string) => navigate(href, { replace: true }),
    back: () => navigate(-1),
    forward: () => navigate(1),
    refresh: () => window.location.reload(),
    pathname: location.pathname,
    query: Object.fromEntries(new URLSearchParams(location.search)),
  };
}

// Shim useParams (same as react-router)
export function useParams() {
  return useRouterParams();
}

// Shim useSearchParams
export function useSearchParams() {
  const [searchParams, setSearchParams] = useRouterSearchParams();
  
  // Return a tuple similar to Next.js
  return [searchParams, setSearchParams] as const;
}

// Shim usePathname
export function usePathname() {
  const location = useLocation();
  return location.pathname;
}

// Shim redirect
export function redirect(url: string): never {
  window.location.href = url;
  throw new Error('REDIRECT'); // Never returns
}

// Shim notFound
export function notFound(): never {
  throw new Error('NOT_FOUND');
}

// Re-export Link
export const Link = RouterLink;