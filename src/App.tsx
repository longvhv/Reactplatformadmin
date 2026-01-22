// Import polyfills FIRST
import './polyfills';

// ✅ DATA CLIENT: Initialize synchronously BEFORE React renders
import './lib/data-client/init';

import { PerformanceMonitor } from "./components/PerformanceMonitor";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { ThemeProvider } from "./providers/ThemeProvider";
import { LanguageProvider } from "./providers/LanguageProvider";
import { AuthProvider } from "./providers/AuthProvider";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Suspense, useState, useEffect } from 'react';
import { LoadingFallback } from './components/LoadingFallback';
import { BundleAnalyzer } from './components/BundleAnalyzer';
import { Toaster } from 'sonner@2.0.3';
import { ProtectedRoute } from './components/ProtectedRoute';

// ✅ MIGRATION: Initialize react-i18next (Phase 1 - 2026-01-16)
import './i18n/config';

// ✅ PERFORMANCE: Configure TanStack Query for optimal caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: Data considered fresh for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Cache time: Keep unused data in cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed requests only once
      retry: 1,
      // Don't refetch on window focus (too aggressive)
      refetchOnWindowFocus: false,
      // Refetch on reconnect
      refetchOnReconnect: true,
      // Refetch on mount only if data is stale
      refetchOnMount: true,
    },
  },
});

// Import layout
import { AppLayout } from "./components/layout/AppLayout";

// Import ONLY full-screen detail pages (not in module registry)
import TenantDetailPage from "./app/(admin)/admin/tenants/[id]/page";
import AddTenantPage from "./app/(admin)/admin/tenants/create/page";
import EditTenantPage from "./app/(admin)/admin/tenants/edit/[id]/page";
import UserDetailPage from "./app/(admin)/admin/users/[id]/page";
import EditUserPage from "./app/(admin)/platform/users/edit/[id]/page";
import AddUserPage from "./app/(admin)/platform/users/create/page";
import ApplicationDetailPage from "./app/(admin)/platform/applications/[id]/page";
import ApplicationFormPage from "./app/(admin)/platform/applications/create/page";
import EditApplicationPage from "./app/(admin)/platform/applications/edit/[id]/page";
import ProductDetailPage from "./app/(admin)/commerce/products/[id]/page";
import AddProductPage from "./app/(admin)/commerce/products/create/page";
import EditProductPage from "./app/(admin)/commerce/products/edit/[id]/page";
import ServicePackageDetailPage from "./app/(admin)/platform/service-packages/[id]/page";
import AddServicePackagePage from "./app/(admin)/platform/service-packages/create/page";
import EditServicePackagePage from "./app/(admin)/platform/service-packages/edit/[id]/page";
import SubscriptionDetailPageFullscreen from "./app/(admin)/commerce/subscriptions/[id]/page";
import AddSubscriptionPage from "./app/(admin)/commerce/subscriptions/create/page";

// Import module registration to register all modules
import "./core/lazyModuleRegistration";
// Import ModuleRegistry to get all routes
import { ModuleRegistry } from "./core/ModuleRegistry";

// Import Login Page
import LoginPage from "./app/login/page";

// Debug components (development only)
import { TrafficSchemaDebug } from "./components/debug/TrafficSchemaDebug";
import { SubscriptionsSchemaDebug } from "./components/debug/SubscriptionsSchemaDebug";
import { JobsSchemaDebug } from "./components/debug/JobsSchemaDebug";
import { TenantsSchemaDebug } from "./components/debug/TenantsSchemaDebug";
import { UsersSchemaDebug } from "./components/debug/UsersSchemaDebug";

// 🔍 FORCE REBUILD - 2026-01-20 - Fix ErrorBoundary cache issue

/**
 * VHV Platform React Framework
 * 
 * Khung ứng dụng modular với:
 * - Theme dark/light
 * - React Router v7
 * - Error boundaries
 * - Performance optimizations
 * - Intelligent prefetching
 * - Real-time performance monitoring
 * 
 * 🌐 PATH STRUCTURE (Mixed Vietnamese/English):
 * - Main: /admin/*
 * - Commerce: /commerce/*
 * - Platform: /platform/*
 * - Integrations: /integrations/*
 * - Telemetry: /monitoring/*
 * - System: /system/*
 */
function AppContent() {
  // Get all routes from ModuleRegistry and subscribe to updates
  const [moduleRoutes, setModuleRoutes] = useState(() => ModuleRegistry.getInstance().getAllRoutes());
  
  useEffect(() => {
    const registry = ModuleRegistry.getInstance();
    const unsubscribe = registry.subscribe(() => {
      // Create a new array to ensure re-render
      setModuleRoutes([...registry.getAllRoutes()]);
    });
    return unsubscribe;
  }, []);
  
  return (
    <Routes>
      {/* Login Route - Public */}
      <Route path="/login" element={<LoginPage />} />
      
      {/* Full-screen detail pages with Protected Route wrapper */}
      {/* 
        ⚠️ CRITICAL FIX: Tenants routes MUST be ordered correctly!
        /them and /moi MUST come BEFORE /:id to avoid matching as an ID
      */}
      <Route path="/admin/tenants/create" element={<ProtectedRoute><AddTenantPage /></ProtectedRoute>} />
      <Route path="/admin/tenants/new" element={<ProtectedRoute><AddTenantPage /></ProtectedRoute>} />
      <Route path="/admin/tenants/:id/edit" element={
        <ProtectedRoute>
          <AppLayout>
            <EditTenantPage />
          </AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/tenants/:id" element={<ProtectedRoute><TenantDetailPage /></ProtectedRoute>} />
      
      {/* 
        ⚠️ CRITICAL FIX: Users routes - /moi and /sua/:id MUST come BEFORE /:id
      */}
      <Route path="/admin/users/create" element={<ProtectedRoute><AddUserPage /></ProtectedRoute>} />
      <Route path="/admin/users/:id/edit" element={<ProtectedRoute><EditUserPage /></ProtectedRoute>} />
      <Route path="/admin/users/:id" element={<ProtectedRoute><UserDetailPage /></ProtectedRoute>} />
      
      {/* 
        ⚠️ CRITICAL FIX: Applications routes - /moi MUST come BEFORE /:id
      */}
      <Route path="/platform/applications/create" element={
        <ProtectedRoute>
          <AppLayout>
            <ApplicationFormPage />
          </AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/platform/applications/:id/edit" element={
        <ProtectedRoute>
          <AppLayout>
            <EditApplicationPage />
          </AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/platform/applications/:id" element={<ProtectedRoute><ApplicationDetailPage /></ProtectedRoute>} />
      
      {/* 
        ⚠️ CRITICAL FIX: Products routes MUST be ordered correctly!
        /create and /edit/:id MUST come BEFORE /:id to avoid matching "create"/"edit" as IDs
      */}
      <Route path="/commerce/products/create" element={
        <ProtectedRoute>
          <AppLayout>
            <AddProductPage />
          </AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/commerce/products/edit/:id" element={
        <ProtectedRoute>
          <AppLayout>
            <EditProductPage />
          </AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/commerce/products/:id" element={<ProtectedRoute><ProductDetailPage /></ProtectedRoute>} />
      
      {/* 
        ⚠️ CRITICAL FIX: Service Packages routes MUST be ordered correctly!
        /add and /edit/:id MUST come BEFORE /:id to avoid matching "add"/"edit" as IDs
      */}
      <Route path="/commerce/service-packages/add" element={
        <ProtectedRoute>
          <AppLayout>
            <AddServicePackagePage />
          </AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/commerce/service-packages/edit/:id" element={
        <ProtectedRoute>
          <AppLayout>
            <EditServicePackagePage />
          </AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/commerce/service-packages/:id" element={<ProtectedRoute><ServicePackageDetailPage /></ProtectedRoute>} />
      
      {/* 
        ⚠️ CRITICAL FIX: Subscriptions routes MUST be ordered correctly!
        /create MUST come BEFORE /:id to avoid matching "create" as an ID
      */}
      <Route path="/commerce/tenant-subscriptions/create" element={<ProtectedRoute><AddSubscriptionPage /></ProtectedRoute>} />
      <Route path="/commerce/tenant-subscriptions/:id" element={<ProtectedRoute><SubscriptionDetailPageFullscreen /></ProtectedRoute>} />
      
      {/* Default redirect to dashboard */}
      <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
      
      {/* Dynamic routes from ModuleRegistry - wrapped with AppLayout */}
      {moduleRoutes.map((route, index) => (
        <Route 
          key={route.path ? `${route.path}-${index}` : index}
          path={route.path} 
          element={
            <ProtectedRoute>
              <AppLayout>
                {route.element}
              </AppLayout>
            </ProtectedRoute>
          } 
        />
      ))}
      
      {/* Debug routes - Development only */}
      {process.env.NODE_ENV === "development" && (
        <>
          <Route path="/debug/traffic-schema" element={
            <ProtectedRoute>
              <AppLayout>
                <TrafficSchemaDebug />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/debug/subscriptions-schema" element={
            <ProtectedRoute>
              <AppLayout>
                <SubscriptionsSchemaDebug />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/debug/jobs-schema" element={
            <ProtectedRoute>
              <AppLayout>
                <JobsSchemaDebug />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/debug/tenants-schema" element={
            <ProtectedRoute>
              <AppLayout>
                <TenantsSchemaDebug />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/debug/users-schema" element={
            <ProtectedRoute>
              <AppLayout>
                <UsersSchemaDebug />
              </AppLayout>
            </ProtectedRoute>
          } />
        </>
      )}
      
      {/* Catch-all route - redirect to dashboard */}
      <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <LanguageProvider>
          <ThemeProvider>
            <BrowserRouter>
              <QueryClientProvider client={queryClient}>
                <Suspense fallback={<LoadingFallback />}>
                  <AuthProvider>
                    <Suspense fallback={<LoadingFallback />}>
                      <AppContent />
                    </Suspense>
                  </AuthProvider>
                </Suspense>
                
                {/* Toast Notifications */}
                <Toaster 
                  position="top-right"
                  closeButton={false}
                  richColors={false}
                  expand={false}
                  duration={3000}
                />
                
                {/* React Query Devtools - Development only */}
                {process.env.NODE_ENV === "development" && <ReactQueryDevtools />}
                {/* Bundle Analyzer - Development only */}
                {process.env.NODE_ENV === "development" && <BundleAnalyzer />}
              </QueryClientProvider>
            </BrowserRouter>
          </ThemeProvider>
        </LanguageProvider>
      </Suspense>
    </ErrorBoundary>
  );
}