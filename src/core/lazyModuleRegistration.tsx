/**
 * Lazy Module Registration
 * 
 * Performance-optimized module loading:
 * - Critical modules load immediately (Dashboard, Auth)
 * - Other modules load on-demand
 * - Reduces initial bundle size significantly
 * 
 * ✅ OPTIMIZED: Lazy loading for non-critical modules
 */

import { ModuleRegistry } from './ModuleRegistry';
import { lazy } from 'react';

// ============================================
// CRITICAL MODULES - Load immediately
// ============================================

import { DashboardModule } from '../modules/dashboard/index';
import { AuthModule } from '../modules/auth/index';

// ============================================
// NON-CRITICAL MODULES - Lazy load
// ============================================

// Create lazy loaders for module definitions
const lazyModuleLoaders = {
  // Identity & Access
  tenants: () => import('../modules/tenant/index').then(m => m.TenantsModule),
  users: () => import('../modules/user/index').then(m => m.UsersModule),
  roles: () => import('../modules/roles/index').then(m => m.RolesModule),
  permissions: () => import('../modules/permissions/index').then(m => m.PermissionsModule),
  tenantMembers: () => import('../modules/tenant-members/index').then(m => m.TenantMembersModule),
  userRoles: () => import('../modules/user-roles/index').then(m => m.UserRolesModule),
  userDelegations: () => import('../modules/user-delegations/index').then(m => m.UserDelegationsModule),
  
  // Commerce
  products: () => import('../modules/products/index').then(m => m.ProductsModule),
  productTypes: () => import('../modules/product-types/index').then(m => m.ProductTypesModule),
  saasProductTypes: () => import('../modules/saas-product-types/index').then(m => m.SaasProductTypesModule),
  servicePackages: () => import('../modules/service-packages/index').then(m => m.ServicePackagesModule),
  subscriptionOrders: () => import('../modules/subscription-orders/index').then(m => m.SubscriptionOrdersModule),
  subscriptionInvoices: () => import('../modules/subscription-invoices/index').then(m => m.SubscriptionInvoicesModule),
  tenantSubscriptions: () => import('../modules/tenant-subscriptions/index').then(m => m.TenantSubscriptionsModule),
  digitalAssets: () => import('../modules/digital-assets/index').then(m => m.DigitalAssetsModule),
  serviceDeliveries: () => import('../modules/service-deliveries/index').then(m => m.ServiceDeliveriesModule),
  
  // Platform
  applications: () => import('../modules/applications/index').then(m => m.ApplicationsModule),
  systemCategories: () => import('../modules/system-category/index').then(m => m.SystemCategoryModule),
  locationTypes: () => import('../modules/location-types/index').then(m => m.LocationTypesModule),
  locations: () => import('../modules/locations/index').then(m => m.LocationsModule),
  rateLimits: () => import('../modules/rate-limits/index').then(m => m.RateLimitsModule),
  reservedSlugs: () => import('../modules/reserved-slugs/module').then(m => m.ReservedSlugsModule),
  systemAnnouncements: () => import('../modules/system-announcements/index').then(m => m.SystemAnnouncementsModule),
  systemJobs: () => import('../modules/system-jobs/index').then(m => m.SystemJobsModule),
  featureFlags: () => import('../modules/feature-flags/index').then(m => m.FeatureFlagsModule),
  notificationTemplates: () => import('../modules/notification-templates/index').then(m => m.NotificationTemplatesModule),
  legalDocuments: () => import('../modules/legal-documents/index').then(m => m.LegalDocumentsModule),
  
  // Integrations
  webhooks: () => import('../modules/webhooks/index').then(m => m.WebhooksModule),
  apiUsageLogs: () => import('../modules/api-usage-logs/index').then(m => m.ApiUsageLogsModule),
  
  // Telemetry
  userRegistrationTelemetry: () => import('../modules/user-registration-telemetry/index').then(m => m.UserRegistrationTelemetryModule),
  trafficLogs: () => import('../modules/traffic-logs/index').then(m => m.TrafficLogsModule),
  authLogs: () => import('../modules/auth-logs/index').then(m => m.AuthLogsModule),
  auditLogs: () => import('../modules/audit-logs/index').then(m => m.AuditLogsModule),
  
  // System
  settings: () => import('../modules/settings/index').then(m => m.SettingsModule),
  help: () => import('../modules/help/index').then(m => m.HelpModule),
  devDocs: () => import('../modules/dev-docs/index').then(m => m.DevDocsModule),
};

/**
 * Register critical modules immediately
 */
export function registerCriticalModules(): void {
  const registry = ModuleRegistry.getInstance();
  
  console.log('🚀 Registering critical modules...');
  
  // Only register essential modules for initial render
  registry.register(DashboardModule);
  registry.register(AuthModule);
  
  console.log('✅ Critical modules registered (2/39)');
}

/**
 * Register non-critical modules lazily
 * Called after initial render to improve startup time
 */
export async function registerNonCriticalModules(): Promise<void> {
  const registry = ModuleRegistry.getInstance();
  
  console.log('⏳ Loading non-critical modules...');
  
  // Load modules in batches for better UX
  const batches = [
    // Batch 1: Identity & Access (most commonly used)
    ['tenants', 'users', 'roles', 'permissions'],
    
    // Batch 2: Commerce
    ['products', 'servicePackages', 'subscriptionOrders', 'subscriptionInvoices'],
    
    // Batch 3: Platform & Configuration
    ['applications', 'systemCategories', 'webhooks'],
    
    // Batch 4: Telemetry & Logs
    ['authLogs', 'auditLogs', 'trafficLogs', 'apiUsageLogs'],
    
    // Batch 5: Everything else
    Object.keys(lazyModuleLoaders).filter(key => 
      !['tenants', 'users', 'roles', 'permissions', 'products', 'servicePackages', 
        'subscriptionOrders', 'subscriptionInvoices', 'applications', 'systemCategories',
        'webhooks', 'authLogs', 'auditLogs', 'trafficLogs', 'apiUsageLogs'].includes(key)
    ),
  ];
  
  let loadedCount = 2; // Already loaded critical modules
  
  for (const batch of batches) {
    // Load batch in parallel
    const batchPromises = batch.map(async (key) => {
      try {
        const loader = lazyModuleLoaders[key as keyof typeof lazyModuleLoaders];
        if (loader) {
          const module = await loader();
          registry.register(module);
          loadedCount++;
        }
      } catch (error) {
        console.error(`Failed to load module: ${key}`, error);
      }
    });
    
    await Promise.all(batchPromises);
    
    // Small delay between batches to avoid blocking main thread
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  
  console.log(`✅ All modules loaded (${loadedCount}/39)`);
}

/**
 * Register specific module on-demand
 */
export async function registerModuleOnDemand(moduleName: keyof typeof lazyModuleLoaders): Promise<void> {
  const registry = ModuleRegistry.getInstance();
  const loader = lazyModuleLoaders[moduleName];
  
  if (!loader) {
    console.warn(`Module ${moduleName} not found`);
    return;
  }
  
  try {
    const module = await loader();
    registry.register(module);
    console.log(`✅ Module ${moduleName} loaded on-demand`);
  } catch (error) {
    console.error(`Failed to load module ${moduleName}:`, error);
  }
}

// ============================================
// Auto-register critical modules on import
// ============================================

registerCriticalModules();

// Register non-critical modules after a short delay
// This allows the app to render faster initially
if (typeof window !== 'undefined') {
  // Use requestIdleCallback if available, otherwise setTimeout
  const scheduleLoad = (window.requestIdleCallback || window.setTimeout).bind(window);
  
  scheduleLoad(() => {
    registerNonCriticalModules().catch(error => {
      console.error('Failed to load non-critical modules:', error);
    });
  });
}
