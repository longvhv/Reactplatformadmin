/**
 * Rate Limits Module
 * Rate Limiting Configuration Management
 * 
 * 🌐 Path: /platform/rate-limits
 */

import { lazy, Suspense } from 'react';
import { ModuleDefinition } from '../../core/ModuleRegistry';
import { LoadingFallback } from '../../components/LoadingFallback';
import { Zap } from 'lucide-react';

// Lazy-loaded pages
const RateLimitsPage = lazy(() => import('../../app/(admin)/rate-limits/page'));

/**
 * Rate Limits Module Definition
 * 
 * Features:
 * - Global rate limits management
 * - Multi-tenant support
 * - Resource-based limits (API, Storage, Database, Email, etc.)
 * - Usage tracking
 * - Alert configuration
 * 
 * Note: menuItems label and routes title use translation keys that will be resolved at runtime
 */
export const RateLimitsModule: ModuleDefinition = {
  id: "rate-limits",
  name: "Rate Limits",
  version: "1.0.0",
  enabled: true,
  showInSidebar: true,
  order: 47,
  
  menuItems: [
    {
      id: "rate-limits",
      label: "navigation.rateLimits",
      path: "/platform/rate-limits",
      icon: <Zap className="w-5 h-5" />,
      order: 47,
    },
  ],

  routes: [
    {
      path: "/platform/rate-limits",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <RateLimitsPage />
        </Suspense>
      ),
      title: "Rate Limits",
    },
  ],
};

export default RateLimitsModule;