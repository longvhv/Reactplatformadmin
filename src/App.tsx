import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { LanguageProvider } from "./providers/LanguageProvider";
import { ThemeProvider } from "./providers/ThemeProvider";

// Register all modules (MUST be imported before using ModuleRegistry)
import "./core/moduleRegistration";

// Import pages
import { DashboardPage } from "./modules/dashboard/DashboardPage";
import { SettingsPage } from "./pages/SettingsPage";
import { HelpPage } from "./pages/HelpPage";
import { DevDocsPage } from "./pages/DevDocsPage";
import { TenantsPage } from "./pages/TenantsPage";
import { AddTenantPage } from "./pages/AddTenantPage";
import { EditTenantPage } from "./pages/EditTenantPage";
import { TenantDetailPage } from "./pages/TenantDetailPage";
import SystemCategoriesPage from "./pages/SystemCategoriesPage"; // Default export
import { AddSystemCategoryPage } from "./pages/AddSystemCategoryPage";
import { EditSystemCategoryPage } from "./pages/EditSystemCategoryPage";
import { AppComponentsPage } from "./pages/AppComponentsPage";
import { AddAppComponentPage } from "./pages/AddAppComponentPage";
import { EditAppComponentPage } from "./pages/EditAppComponentPage";
import { RegionsPage } from "./pages/RegionsPage";
import { AddRegionPage } from "./pages/AddRegionPage";
import { EditRegionPage } from "./pages/EditRegionPage";
import { PerformanceMonitor } from "./components/PerformanceMonitor";

// Import users management (create placeholder if doesn't exist)
const UsersPage = () => <div className="p-6"><h1>Users Management (Coming Soon)</h1></div>;

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
    <AppLayout>
      <Routes>
        {/* Default redirect to dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* Dashboard routes */}
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/dev-docs" element={<DevDocsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/tenants" element={<TenantsPage />} />
        <Route path="/tenants/add" element={<AddTenantPage />} />
        <Route path="/tenants/edit/:id" element={<EditTenantPage />} />
        <Route path="/tenants/:id" element={<TenantDetailPage />} />
        <Route path="/system-categories" element={<SystemCategoriesPage />} />
        <Route path="/system-categories/add" element={<AddSystemCategoryPage />} />
        <Route path="/system-categories/edit/:id" element={<EditSystemCategoryPage />} />
        <Route path="/app-components" element={<AppComponentsPage />} />
        <Route path="/app-components/add" element={<AddAppComponentPage />} />
        <Route path="/app-components/edit/:id" element={<EditAppComponentPage />} />
        <Route path="/regions" element={<RegionsPage />} />
        <Route path="/regions/add" element={<AddRegionPage />} />
        <Route path="/regions/edit/:id" element={<EditRegionPage />} />
        <Route path="/tenants" element={<TenantsPage />} />
        
        {/* Catch-all route - redirect to dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      
      {/* Performance Monitor - Development only */}
      {process.env.NODE_ENV === "development" && <PerformanceMonitor />}
    </AppLayout>
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