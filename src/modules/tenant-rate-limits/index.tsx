/**
 * Tenant Rate Limits Module
 * Module definition for API throttling management
 * 
 * 🌐 Path: /platform/tenant-rate-limits
 */

import { ModuleDefinition } from "../../core/ModuleRegistry";
import { lazy, Suspense } from "react";
import { LoadingFallback } from "../../components/LoadingFallback";
import { Activity } from "lucide-react";

// Lazy-loaded pages
const RateLimitsPage = lazy(() => import("../../app/(admin)/platform/tenant-rate-limits/page"));
const CreateRateLimitPage = lazy(() => import("../../app/(admin)/platform/tenant-rate-limits/create/page"));
const EditRateLimitPage = lazy(() => import("../../app/(admin)/platform/tenant-rate-limits/edit/[id]/page"));

export const TenantRateLimitsModule: ModuleDefinition = {
  id: "tenant-rate-limits",
  name: "Rate Limits",
  description: "Manage API quotas and throttling",
  version: "1.0.0",
  enabled: true,
  showInSidebar: true,
  order: 90, // Placed after Feature Flags
  icon: <Activity className="w-4 h-4" />,
  
  routes: [
    {
      path: "/platform/tenant-rate-limits",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <RateLimitsPage />
        </Suspense>
      ),
      title: "Rate Limits",
    },
    {
      path: "/platform/tenant-rate-limits/create",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <CreateRateLimitPage />
        </Suspense>
      ),
      title: "Create Rate Limit",
    },
    {
      path: "/platform/tenant-rate-limits/edit/:id",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <EditRateLimitPage />
        </Suspense>
      ),
      title: "Edit Rate Limit",
    },
  ],
  
  menuItems: [
    {
      id: "tenant-rate-limits",
      label: "Rate Limits",
      icon: <Activity className="w-5 h-5" />,
      path: "/platform/tenant-rate-limits",
      order: 1,
    },
  ],
};

export default TenantRateLimitsModule;