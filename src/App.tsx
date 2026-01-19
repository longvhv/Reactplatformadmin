import { PerformanceMonitor } from "./components/PerformanceMonitor";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { ThemeProvider } from "./providers/ThemeProvider";
import { LanguageProvider } from "./providers/LanguageProvider";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Suspense, useState, useEffect } from 'react';
import { LoadingFallback } from './components/LoadingFallback';
import { BundleAnalyzer } from './components/BundleAnalyzer';
import { Toaster } from 'sonner@2.0.3';

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
import { TenantDetailPage } from "./pages/TenantDetailPage";
import AddTenantPage from "./pages/AddTenantPage";
import EditTenantPage from "./pages/EditTenantPage";
import UserDetailPage from "./pages/UserDetailPage";
import EditUserPage from "./pages/EditUserPage";
import AddUserPage from "./pages/AddUserPage";
import { ApplicationDetailPage } from "./pages/ApplicationDetailPage";
import ApplicationFormPage from "./pages/ApplicationFormPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import AddProductPage from "./pages/AddProductPage";
import EditProductPage from "./pages/EditProductPage";
import ServicePackageDetailPage from "./pages/ServicePackageDetailPage";
import AddServicePackagePage from "./pages/AddServicePackagePage";
import EditServicePackagePage from "./pages/EditServicePackagePage";
import SubscriptionDetailPageFullscreen from "./pages/SubscriptionDetailPage";
import AddSubscriptionPage from "./pages/AddSubscriptionPage";

// Import module registration to register all modules
import "./core/lazyModuleRegistration";
// Import ModuleRegistry to get all routes
import { ModuleRegistry } from "./core/ModuleRegistry";

// Debug components (development only)
import { TrafficSchemaDebug } from "./components/debug/TrafficSchemaDebug";
import { SubscriptionsSchemaDebug } from "./components/debug/SubscriptionsSchemaDebug";
import { JobsSchemaDebug } from "./components/debug/JobsSchemaDebug";
import { TenantsSchemaDebug } from "./components/debug/TenantsSchemaDebug";
import { UsersSchemaDebug } from "./components/debug/UsersSchemaDebug";

// 🔍 FORCE REBUILD - 2026-01-15 - Debug missing menu items

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
      {/* Full-screen detail pages (NO AppLayout wrapper) */}
      {/* 
        ⚠️ CRITICAL FIX: Tenants routes MUST be ordered correctly!
        /them and /moi MUST come BEFORE /:id to avoid matching as an ID
      */}
      <Route path="/admin/tenants/create" element={<AddTenantPage />} />
      <Route path="/admin/tenants/new" element={<AddTenantPage />} />
      <Route path="/admin/tenants/:id/edit" element={
        <AppLayout>
          <EditTenantPage />
        </AppLayout>
      } />
      <Route path="/admin/tenants/:id" element={<TenantDetailPage />} />
      
      {/* 
        ⚠️ CRITICAL FIX: Users routes - /moi and /sua/:id MUST come BEFORE /:id
      */}
      <Route path="/admin/users/create" element={<AddUserPage />} />
      <Route path="/admin/users/:id/edit" element={<EditUserPage />} />
      <Route path="/admin/users/:id" element={<UserDetailPage />} />
      
      {/* 
        ⚠️ CRITICAL FIX: Applications routes - /moi MUST come BEFORE /:id
      */}
      <Route path="/platform/applications/create" element={
        <AppLayout>
          <ApplicationFormPage />
        </AppLayout>
      } />
      <Route path="/platform/applications/:id/edit" element={
        <AppLayout>
          <ApplicationFormPage />
        </AppLayout>
      } />
      <Route path="/platform/applications/:id" element={<ApplicationDetailPage />} />
      
      {/* 
        ⚠️ CRITICAL FIX: Products routes MUST be ordered correctly!
        /create and /edit/:id MUST come BEFORE /:id to avoid matching "create"/"edit" as IDs
      */}
      <Route path="/commerce/products/create" element={
        <AppLayout>
          <AddProductPage />
        </AppLayout>
      } />
      <Route path="/commerce/products/edit/:id" element={
        <AppLayout>
          <EditProductPage />
        </AppLayout>
      } />
      <Route path="/commerce/products/:id" element={<ProductDetailPage />} />
      
      {/* 
        ⚠️ CRITICAL FIX: Service Packages routes MUST be ordered correctly!
        /add and /edit/:id MUST come BEFORE /:id to avoid matching "add"/"edit" as IDs
      */}
      <Route path="/commerce/service-packages/add" element={
        <AppLayout>
          <AddServicePackagePage />
        </AppLayout>
      } />
      <Route path="/commerce/service-packages/edit/:id" element={
        <AppLayout>
          <EditServicePackagePage />
        </AppLayout>
      } />
      <Route path="/commerce/service-packages/:id" element={<ServicePackageDetailPage />} />
      
      {/* 
        ⚠️ CRITICAL FIX: Subscriptions routes MUST be ordered correctly!
        /create MUST come BEFORE /:id to avoid matching "create" as an ID
      */}
      <Route path="/commerce/tenant-subscriptions/create" element={<AddSubscriptionPage />} />
      <Route path="/commerce/tenant-subscriptions/:id" element={<SubscriptionDetailPageFullscreen />} />
      
      {/* All other routes with AppLayout */}
      <Route path="*" element={
        <AppLayout>
          <Routes>
            {/* Default redirect to dashboard */}
            <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
            
            {/* Dynamic routes from ModuleRegistry */}
            {moduleRoutes.map((route, index) => (
              <Route 
                key={route.path ? `${route.path}-${index}` : index}
                path={route.path} 
                element={route.element} 
              />
            ))}
            
            {/* Debug routes - Development only */}
            {process.env.NODE_ENV === "development" && (
              <>
                <Route path="/debug/traffic-schema" element={<TrafficSchemaDebug />} />
                <Route path="/debug/subscriptions-schema" element={<SubscriptionsSchemaDebug />} />
                <Route path="/debug/jobs-schema" element={<JobsSchemaDebug />} />
                <Route path="/debug/tenants-schema" element={<TenantsSchemaDebug />} />
                <Route path="/debug/users-schema" element={<UsersSchemaDebug />} />
              </>
            )}
            
            {/* Catch-all route - redirect to dashboard */}
            <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
          </Routes>
          
          {/* Performance Monitor - Development only */}
          {process.env.NODE_ENV === "development" && <PerformanceMonitor />}
        </AppLayout>
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <ThemeProvider>
          <BrowserRouter>
            <QueryClientProvider client={queryClient}>
              <Suspense fallback={<LoadingFallback />}>
                <AppContent />
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
    </ErrorBoundary>
  );
}