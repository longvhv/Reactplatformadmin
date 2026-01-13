import { SystemAnnouncementsPage } from "./pages/SystemAnnouncementsPage";
import { NotificationTemplatesPage } from "./pages/NotificationTemplatesPage";
import { PerformanceMonitor } from "./components/PerformanceMonitor";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./providers/ThemeProvider";
import { LanguageProvider } from "./providers/LanguageProvider";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Import all page components
import { AppLayout } from "./components/layout/AppLayout";
import { DashboardPage } from "./modules/dashboard/DashboardPage";
import UsersPage from "./pages/UsersPage";
import UserDetailPage from "./pages/UserDetailPage";
import { DevDocsPage } from "./pages/DevDocsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { HelpPage } from "./pages/HelpPage";
import TenantsPage from "./pages/TenantsPage";
import { TenantDetailPage } from "./pages/TenantDetailPage";
import AddTenantPage from "./pages/AddTenantPage";
import EditTenantPage from "./pages/EditTenantPage";
import { SystemCategoriesPage } from "./pages/SystemCategoriesPage";
import { AddSystemCategoryPage } from "./pages/AddSystemCategoryPage";
import { EditSystemCategoryPage } from "./pages/EditSystemCategoryPage";
import { AppComponentsPage } from "./pages/AppComponentsPage";
import { AddAppComponentPage } from "./pages/AddAppComponentPage";
import { EditAppComponentPage } from "./pages/EditAppComponentPage";
import { RegionsPage } from "./pages/RegionsPage";
import { AddRegionPage } from "./pages/AddRegionPage";
import { EditRegionPage } from "./pages/EditRegionPage";
import { ApplicationsPage } from "./pages/ApplicationsPage";
import { ApplicationDetailPage } from "./pages/ApplicationDetailPage";
import { ProductsPage } from "./pages/ProductsPage";
import { ProductDetailPage } from "./pages/ProductDetailPage";
import { AddProductPage } from "./pages/AddProductPage";
import { EditProductPage } from "./pages/EditProductPage";
import { ServicePackagesPage } from "./pages/ServicePackagesPage";
import { AddServicePackagePage } from "./pages/AddServicePackagePage";
import { EditServicePackagePage } from "./pages/EditServicePackagePage";
import { SubscriptionOrdersPage } from "./pages/SubscriptionOrdersPage";
import { OrderDetailPage } from "./pages/OrderDetailPage";
import { AddOrderPage } from "./pages/AddOrderPage";
import { EditOrderPage } from "./pages/EditOrderPage";
import { SubscriptionInvoicesPage } from "./pages/SubscriptionInvoicesPage";
import { InvoiceDetailPage } from "./pages/InvoiceDetailPage";
import { AddInvoicePage } from "./pages/AddInvoicePage";
import { EditInvoicePage } from "./pages/EditInvoicePage";
import { TenantSubscriptionsPage } from "./pages/TenantSubscriptionsPage";
import { SubscriptionDetailPage } from "./pages/SubscriptionDetailPage";
import { AddSubscriptionPage } from "./pages/AddSubscriptionPage";
import { EditSubscriptionPage } from "./pages/EditSubscriptionPage";

// Import module registration to register all modules
import "./core/moduleRegistration";

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
  return (
    <Routes>
      {/* Full-screen detail pages (NO AppLayout wrapper) */}
      <Route path="/core/tenants/:id" element={<TenantDetailPage />} />
      <Route path="/core/users/:id" element={<UserDetailPage />} />
      <Route path="/core/applications/:id/*" element={<ApplicationDetailPage />} />
      
      {/* All other routes with AppLayout */}
      <Route path="*" element={
        <AppLayout>
          <Routes>
            {/* Default redirect to dashboard */}
            <Route path="/" element={<Navigate to="/core/dashboard" replace />} />
            
            {/* Core application routes - all pages start with /core/ */}
            <Route path="/core/dashboard" element={<DashboardPage />} />
            <Route path="/core/users" element={<UsersPage />} />
            <Route path="/core/dev-docs" element={<DevDocsPage />} />
            <Route path="/core/settings" element={<SettingsPage />} />
            <Route path="/core/help" element={<HelpPage />} />
            
            {/* Tenant routes */}
            <Route path="/core/tenants" element={<TenantsPage />} />
            <Route path="/core/tenants/new" element={<AddTenantPage />} />
            <Route path="/core/tenants/edit/:id" element={<EditTenantPage />} />
            
            {/* System Categories */}
            <Route path="/core/system-categories" element={<SystemCategoriesPage />} />
            <Route path="/core/system-categories/add" element={<AddSystemCategoryPage />} />
            <Route path="/core/system-categories/edit/:id" element={<EditSystemCategoryPage />} />
            
            {/* App Components */}
            <Route path="/core/app-components" element={<AppComponentsPage />} />
            <Route path="/core/app-components/add" element={<AddAppComponentPage />} />
            <Route path="/core/app-components/edit/:id" element={<EditAppComponentPage />} />
            
            {/* Regions */}
            <Route path="/core/regions" element={<RegionsPage />} />
            <Route path="/core/regions/add" element={<AddRegionPage />} />
            <Route path="/core/regions/edit/:id" element={<EditRegionPage />} />
            
            {/* Applications */}
            <Route path="/core/applications" element={<ApplicationsPage />} />
            
            {/* Products */}
            <Route path="/core/products" element={<ProductsPage />} />
            <Route path="/core/products/:id" element={<ProductDetailPage />} />
            <Route path="/core/products/add" element={<AddProductPage />} />
            <Route path="/core/products/edit/:id" element={<EditProductPage />} />
            
            {/* Service Packages */}
            <Route path="/core/service-packages" element={<ServicePackagesPage />} />
            <Route path="/core/service-packages/add" element={<AddServicePackagePage />} />
            <Route path="/core/service-packages/edit/:id" element={<EditServicePackagePage />} />
            
            {/* Subscription Orders */}
            <Route path="/core/subscription-orders" element={<SubscriptionOrdersPage />} />
            <Route path="/core/subscription-orders/:id" element={<OrderDetailPage />} />
            <Route path="/core/subscription-orders/add" element={<AddOrderPage />} />
            <Route path="/core/subscription-orders/edit/:id" element={<EditOrderPage />} />
            
            {/* Subscription Invoices */}
            <Route path="/core/subscription-invoices" element={<SubscriptionInvoicesPage />} />
            <Route path="/core/subscription-invoices/:id" element={<InvoiceDetailPage />} />
            <Route path="/core/subscription-invoices/add" element={<AddInvoicePage />} />
            <Route path="/core/subscription-invoices/edit/:id" element={<EditInvoicePage />} />
            
            {/* Tenant Subscriptions */}
            <Route path="/core/tenant-subscriptions" element={<TenantSubscriptionsPage />} />
            <Route path="/core/tenant-subscriptions/:id" element={<SubscriptionDetailPage />} />
            <Route path="/core/tenant-subscriptions/add" element={<AddSubscriptionPage />} />
            <Route path="/core/tenant-subscriptions/edit/:id" element={<EditSubscriptionPage />} />
            
            {/* System Announcements */}
            <Route path="/core/system-announcements" element={<SystemAnnouncementsPage />} />
            
            {/* Notification Templates */}
            <Route path="/core/notification-templates" element={<NotificationTemplatesPage />} />
            
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