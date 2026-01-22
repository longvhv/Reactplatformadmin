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

// ============================================
// CRITICAL MODULES - Load immediately
// ============================================

import { DashboardModule } from '../modules/dashboard/index';
import { AuthModule } from '../modules/auth/index';

// ============================================
// NON-CRITICAL MODULES - Lazy load
// ============================================

// Create lazy loaders for module definitions
// ⚠️ CRITICAL: These return MODULE DEFINITIONS (objects), NOT React components
const lazyModuleLoaders = {
  // Identity & Access
  tenants: () => import('../modules/tenant/index'),
  users: () => import('../modules/users/index'),
  roles: () => import('../modules/roles/index'),
  permissions: () => import('../modules/permissions/index'),
  tenantMembers: () => import('../modules/tenant-members/index'),
  userRoles: () => import('../modules/user-roles/index'),
  userDelegations: () => import('../modules/user-delegations/index'),
  userSessions: () => import('../modules/user-sessions/index'),
  userDevices: () => import('../modules/user-devices/index'),
  
  // Commerce
  products: () => import('../modules/products/index'),
  productTypes: () => import('../modules/product-types/index'),
  saasProductTypes: () => import('../modules/saas-product-types/index'),
  servicePackages: () => import('../modules/service-packages/index'),
  subscriptionOrders: () => import('../modules/subscription-orders/index'),
  subscriptionInvoices: () => import('../modules/subscription-invoices/index'),
  tenantSubscriptions: () => import('../modules/tenant-subscriptions/index'),
  digitalAssets: () => import('../modules/digital-assets/index'),
  serviceDeliveries: () => import('../modules/service-deliveries/index'),
  
  // Platform
  applications: () => import('../modules/applications/index'),
  systemCategories: () => import('../modules/system-category/index'),
  locationTypes: () => import('../modules/location-types/index'),
  locations: () => import('../modules/locations/index'),
  rateLimits: () => import('../modules/rate-limits/index'),
  reservedSlugs: () => import('../modules/reserved-slugs/index'),
  systemAnnouncements: () => import('../modules/system-announcements/index'),
  systemJobs: () => import('../modules/system-jobs/index'),
  featureFlags: () => import('../modules/feature-flags/index'),
  notificationTemplates: () => import('../modules/notification-templates/index'),
  legalDocuments: () => import('../modules/legal-documents/index'),
  
  // Integrations
  webhooks: () => import('../modules/webhooks/index'),
  apiUsageLogs: () => import('../modules/api-usage-logs/index'),
  
  // Telemetry
  userConsents: () => import('../modules/user-consents/index'),
  userRegistrationTelemetry: () => import('../modules/user-registration-telemetry/index'),
  trafficLogs: () => import('../modules/traffic-logs/index'),
  authLogs: () => import('../modules/auth-logs/index'),
  auditLogs: () => import('../modules/audit-logs/index'),
  
  // System
  settings: () => import('../modules/settings/index'),
  help: () => import('../modules/help/index'),
  devDocs: () => import('../modules/dev-docs/index'),
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
        if (!loader) {
          console.warn(`No loader found for module: ${key}`);
          return;
        }
        
        // ✅ FIX: Import module and extract the default or named export
        const moduleImport = await loader();
        
        // Try multiple ways to extract the module
        let module = moduleImport.default;
        
        // If default doesn't exist, try the module name with PascalCase + "Module" suffix
        if (!module) {
          const moduleName = key.charAt(0).toUpperCase() + key.slice(1).replace(/-([a-z])/g, (g) => g[1].toUpperCase()) + 'Module';
          module = (moduleImport as any)[moduleName];
        }
        
        // If still not found, try lowercase module name
        if (!module) {
          module = (moduleImport as any)[`${key}Module`];
        }
        
        // If still not found, try the exact key
        if (!module) {
          module = (moduleImport as any)[key];
        }
        
        // ✅ FIX: Validate that we got a valid module definition
        if (!module) {
          console.error(`Module ${key} not found in import:`, Object.keys(moduleImport));
          return;
        }
        
        if (typeof module !== 'object') {
          console.error(`Module ${key} is not an object:`, typeof module);
          return;
        }
        
        if (!module.id) {
          console.error(`Module ${key} does not have an 'id' property:`, module);
          return;
        }
        
        if (!Array.isArray(module.routes)) {
          console.error(`Module ${key} does not have valid 'routes' array:`, module.routes);
          return;
        }
        
        registry.register(module);
        loadedCount++;
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
    // ✅ FIX: Import module and extract the default or named export
    const moduleImport = await loader();
    const module = moduleImport.default || moduleImport;
    
    // ✅ FIX: Validate that we got a module definition
    if (!module || typeof module !== 'object' || !module.id || !Array.isArray(module.routes)) {
      console.error(`Invalid module loaded for ${moduleName}:`, module);
      return;
    }
    
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