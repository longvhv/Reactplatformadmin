/**
 * Shim Entry Point
 * 
 * Centralized exports cho tất cả shim functionality.
 * Giúp imports đơn giản và consistent.
 * 
 * USAGE:
 * import { useRouter, Link } from '@/components/shim';
 * hoặc
 * import { useRouter, Link } from '../shim';
 */

// Navigation exports
export {
  useRouter,
  useParams,
  useSearchParams,
  usePathname,
  Link,
  redirect,
  notFound,
  ParamsProvider,
  isShimMode,
  logShimUsage,
  type ReadonlyURLSearchParams,
} from './next-navigation';

// Routing exports
export { AppRoutes } from './AppRoutes';

// Config exports (useful for conditional logic)
export { USE_NEXTJS_MODE, DEBUG_SHIM } from './config';

/**
 * MIGRATION QUICK REFERENCE:
 * 
 * When migrating to Next.js:
 * 
 * 1. Simple Find & Replace:
 *    Find:    from '../shim'
 *    Replace: from 'next/navigation'
 * 
 * 2. Link component:
 *    Find:    import { Link } from '../shim'
 *    Replace: import Link from 'next/link'
 * 
 * 3. ParamsProvider:
 *    Find:    import { ParamsProvider } from '../shim'
 *    Replace: (remove - not needed in Next.js)
 */
