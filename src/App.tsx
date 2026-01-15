import { PerformanceMonitor } from "./components/PerformanceMonitor";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { ThemeProvider } from "./providers/ThemeProvider";
import { LanguageProvider } from "./providers/LanguageProvider";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Import layout
import { AppLayout } from "./components/layout/AppLayout";

// Import ONLY full-screen detail pages (not in module registry)
import { TenantDetailPage } from "./pages/TenantDetailPage";
import AddTenantPage from "./pages/AddTenantPage";
import UserDetailPage from "./pages/UserDetailPage";
import EditUserPage from "./pages/EditUserPage";
import { ApplicationDetailPage } from "./pages/ApplicationDetailPage";
import ApplicationFormPage from "./pages/ApplicationFormPage";
import { ProductDetailPage } from "./pages/ProductDetailPage";
import AddProductPage from "./pages/AddProductPage";
import EditProductPage from "./pages/EditProductPage";
import ServicePackageDetailPage from "./pages/ServicePackageDetailPage";
import AddServicePackagePage from "./pages/AddServicePackagePage";
import EditServicePackagePage from "./pages/EditServicePackagePage";
import SubscriptionDetailPageFullscreen from "./pages/SubscriptionDetailPage";
import AddSubscriptionPage from "./pages/AddSubscriptionPage";
import SubscriptionOrderDetailPage from "./pages/SubscriptionOrderDetailPage";

// Import module registration to register all modules
import "./core/moduleRegistration";
// Import ModuleRegistry to get all routes
import { ModuleRegistry } from "./core/ModuleRegistry";

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
 */
function AppContent() {
  // Get all routes from ModuleRegistry
  const registry = ModuleRegistry.getInstance();
  const moduleRoutes = registry.getAllRoutes();
  
  return (
    <Routes>
      {/* Full-screen detail pages (NO AppLayout wrapper) */}
      {/* 
        ⚠️ CRITICAL FIX: Tenants routes MUST be ordered correctly!
        /add and /new MUST come BEFORE /:id to avoid matching as an ID
      */}
      <Route path="/core/tenants/add" element={<AddTenantPage />} />
      <Route path="/core/tenants/new" element={<AddTenantPage />} />
      <Route path="/core/tenants/:id" element={<TenantDetailPage />} />
      <Route path="/core/users/:id" element={<UserDetailPage />} />
      <Route path="/core/users/:id/edit" element={<EditUserPage />} />
      
      {/* 
        ⚠️ CRITICAL FIX: Applications routes - /new MUST come BEFORE /:id
      */}
      <Route path="/core/applications/new" element={
        <AppLayout>
          <ApplicationFormPage />
        </AppLayout>
      } />
      <Route path="/core/applications/:id" element={<ApplicationDetailPage />} />
      
      {/* 
        ⚠️ CRITICAL FIX: Products routes MUST be ordered correctly!
        /add and /edit/:id MUST come BEFORE /:id to avoid matching "add"/"edit" as IDs
      */}
      <Route path="/core/products/add" element={
        <AppLayout>
          <AddProductPage />
        </AppLayout>
      } />
      <Route path="/core/products/edit/:id" element={
        <AppLayout>
          <EditProductPage />
        </AppLayout>
      } />
      <Route path="/core/products/:id" element={<ProductDetailPage />} />
      
      {/* 
        ⚠️ CRITICAL FIX: Service Packages routes MUST be ordered correctly!
        /add and /edit/:id MUST come BEFORE /:id to avoid matching "add"/"edit" as IDs
      */}
      <Route path="/core/service-packages/add" element={
        <AppLayout>
          <AddServicePackagePage />
        </AppLayout>
      } />
      <Route path="/core/service-packages/edit/:id" element={
        <AppLayout>
          <EditServicePackagePage />
        </AppLayout>
      } />
      <Route path="/core/service-packages/:id" element={<ServicePackageDetailPage />} />
      
      {/* 
        ⚠️ CRITICAL FIX: Subscriptions routes MUST be ordered correctly!
        /add MUST come BEFORE /:id to avoid matching "add" as an ID
      */}
      <Route path="/core/subscriptions/add" element={<AddSubscriptionPage />} />
      <Route path="/core/subscriptions/:id" element={<SubscriptionDetailPageFullscreen />} />
      <Route path="/core/subscription-orders/:id" element={<SubscriptionOrderDetailPage />} />
      
      {/* All other routes with AppLayout */}
      <Route path="*" element={
        <AppLayout>
          <Routes>
            {/* Default redirect to dashboard */}
            <Route path="/" element={<Navigate to="/core/dashboard" replace />} />
            
            {/* Dynamic routes from ModuleRegistry */}
            {moduleRoutes.map((route, index) => (
              <Route 
                key={route.path || index}
                path={route.path} 
                element={route.element} 
              />
            ))}
            
            {/* Catch-all route - redirect to dashboard */}
            <Route path="*" element={<Navigate to="/core/dashboard" replace />} />
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
            <AppContent />
          </BrowserRouter>
        </ThemeProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}