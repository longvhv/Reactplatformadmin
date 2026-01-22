/**
 * Module Registration
 * 
 * Tập trung đăng ký tất cả modules khi app khởi động
 * Import file này trong App.tsx để tự động đăng ký modules
 * 
 * ✅ OPTIMIZED: Modules export their definitions with lazy-loaded pages internally
 */

import { ModuleRegistry } from './ModuleRegistry';

// ✅ Direct imports of module definitions (not lazy)
// Each module internally handles lazy loading of its pages
import { DashboardModule } from '../modules/dashboard/index';
import { SettingsModule } from '../modules/settings/index';
import { AuthModule } from '../modules/auth/index';
import { TenantsModule } from '../modules/tenant/index';
import { SystemCategoryModule } from '../modules/system-category/index';
import { UsersModule } from '../modules/users/index';
import { UserRolesModule } from '../modules/user-roles/index';
import { HelpModule } from '../modules/help/index';
import { DevDocsModule } from '../modules/dev-docs/index';
import { TenantMembersModule } from '../modules/tenant-members/index';
import { ApplicationsModule } from '../modules/applications/index';
import { ProductsModule } from '../modules/products/index';
import { ProductTypesModule } from '../modules/product-types/index';
import { ServicePackagesModule } from '../modules/service-packages/index';
import { SubscriptionOrdersModule } from '../modules/subscription-orders/index';
import { SubscriptionInvoicesModule } from '../modules/subscription-invoices/index';
import { TenantSubscriptionsModule } from '../modules/tenant-subscriptions/index';
import { DigitalAssetsModule } from '../modules/digital-assets/index';
import { ServiceDeliveriesModule } from '../modules/service-deliveries/index';
import { RateLimitsModule } from '../modules/rate-limits/index';
import { WebhooksModule } from '../modules/webhooks/index';
import { ReservedSlugsModule } from '../modules/reserved-slugs/index';
import { SystemAnnouncementsModule } from '../modules/system-announcements/index';
import { SystemJobsModule } from '../modules/system-jobs/index';
import { FeatureFlagsModule } from '../modules/feature-flags/index';
import { NotificationTemplatesModule } from '../modules/notification-templates/index';
import { RolesModule } from '../modules/roles/index';
import { AuthLogsModule } from '../modules/auth-logs/index';
import { AuditLogsModule } from '../modules/audit-logs/index';
import { LegalDocumentsModule } from '../modules/legal-documents/index';
import { UserDelegationsModule } from '../modules/user-delegations/index';
import { PermissionsModule } from '../modules/permissions/index';
import { UserRegistrationTelemetryModule } from '../modules/user-registration-telemetry/index';
import { TrafficLogsModule } from '../modules/traffic-logs/index';
import { ApiUsageLogsModule } from '../modules/api-usage-logs/index';
import { SaasProductTypesModule } from '../modules/saas-product-types/index';
import { LocationTypesModule } from '../modules/location-types/index';
import { LocationsModule } from '../modules/locations/index';
import { UserConsentsModule } from '../modules/user-consents/index';
import { UserDevicesModule } from '../modules/user-devices/index';
import { UserSessionsModule } from '../modules/user-sessions/index';

/**
 * Register all modules
 */
export function registerAllModules(): void {
  const registry = ModuleRegistry.getInstance();
  
  // Register modules in order
  // Note: Each module already handles lazy loading of its pages internally
  registry.register(DashboardModule);
  registry.register(TenantsModule);
  registry.register(TenantMembersModule);
  registry.register(UsersModule);
  registry.register(UserRolesModule);
  registry.register(SystemCategoryModule);
  registry.register(LocationTypesModule);
  registry.register(LocationsModule);
  registry.register(PermissionsModule);
  registry.register(ApplicationsModule);
  registry.register(ProductsModule);
  registry.register(ProductTypesModule);
  registry.register(SaasProductTypesModule);
  registry.register(ServicePackagesModule);
  registry.register(SubscriptionOrdersModule);
  registry.register(SubscriptionInvoicesModule);
  registry.register(TenantSubscriptionsModule);
  registry.register(DigitalAssetsModule);
  registry.register(ServiceDeliveriesModule);
  registry.register(RateLimitsModule);
  registry.register(WebhooksModule);
  registry.register(ReservedSlugsModule);
  registry.register(SystemAnnouncementsModule);
  registry.register(SystemJobsModule);
  registry.register(FeatureFlagsModule);
  registry.register(NotificationTemplatesModule);
  registry.register(RolesModule);
  registry.register(AuthLogsModule);
  registry.register(AuditLogsModule);
  registry.register(LegalDocumentsModule);
  registry.register(UserDelegationsModule);
  registry.register(SettingsModule);
  registry.register(AuthModule);
  registry.register(HelpModule);
  registry.register(DevDocsModule);
  registry.register(UserRegistrationTelemetryModule);
  registry.register(TrafficLogsModule);
  registry.register(ApiUsageLogsModule);
  registry.register(UserConsentsModule);
  registry.register(UserDevicesModule);
  registry.register(UserSessionsModule);
  
  console.log('✅ All 42 modules registered successfully');
}

// Auto-register on import
registerAllModules();