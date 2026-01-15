/**
 * Module Registration
 * 
 * Tập trung đăng ký tất cả modules khi app khởi động
 * Import file này trong App.tsx để tự động đăng ký modules
 */

import { ModuleRegistry } from './ModuleRegistry';

// Import all modules
import { DashboardModule } from '../modules/dashboard/index';
import { SettingsModule } from '../modules/settings/index';
import { AuthModule } from '../modules/auth/index';
import { TenantsModule } from '../modules/tenant/index';
import { SystemCategoryModule } from '../modules/system-category/index';
import { UsersModule } from '../modules/user/index';
import { UserRolesModule } from '../modules/user-roles/index';
import { HelpModule } from '../modules/help/index';
import { DevDocsModule } from '../modules/dev-docs/index';
import { TenantMembersModule } from '../modules/tenant-members/index';
import { ApplicationsModule } from '../modules/applications/index';
import { ProductsModule } from '../modules/products/index';
import { ServicePackagesModule } from '../modules/service-packages/index';
import { SubscriptionOrdersModule } from '../modules/subscription-orders/index';
import { SubscriptionInvoicesModule } from '../modules/subscription-invoices/index';
import { TenantSubscriptionsModule } from '../modules/tenant-subscriptions/index';
import { DigitalAssetsModule } from '../modules/digital-assets/index';
import { ServiceDeliveriesModule } from '../modules/service-deliveries/index';
import { RateLimitsModule } from '../modules/rate-limits/index';
import { WebhooksModule } from '../modules/webhooks/index';
import { ReservedSlugsModule } from '../modules/reserved-slugs/module';
import { SystemAnnouncementsModule } from '../modules/system-announcements/index';
import { NotificationTemplatesModule } from '../modules/notification-templates/index';
import { RolesModule } from '../modules/roles/index';
import { AuthLogsModule } from '../modules/auth-logs/index';
import { LegalDocumentsModule } from '../modules/legal-documents/index';
import { UserDelegationsModule } from '../modules/user-delegations/index';

/**
 * Register all modules
 */
export function registerAllModules(): void {
  const registry = ModuleRegistry.getInstance();
  
  // Register modules in order
  registry.register(DashboardModule);
  registry.register(TenantsModule);
  registry.register(TenantMembersModule);
  registry.register(UsersModule); // ✅ MOVED UP - Quản lý người dùng
  registry.register(UserRolesModule);
  registry.register(SystemCategoryModule);
  registry.register(ApplicationsModule);
  registry.register(ProductsModule);
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
  registry.register(NotificationTemplatesModule);
  registry.register(RolesModule);
  registry.register(AuthLogsModule);
  registry.register(LegalDocumentsModule);
  registry.register(UserDelegationsModule);
  
  console.log('✅ All modules registered successfully');
  
  // 🔍 FORCE DEBUG: Check if digital-assets and service-deliveries are registered correctly
  const digitalAssetsCheck = registry.getModule('digital-assets');
  const serviceDeliveriesCheck = registry.getModule('service-deliveries');
  
  console.log('🔍 FORCE DEBUG: Digital Assets module:', {
    id: digitalAssetsCheck?.id,
    name: digitalAssetsCheck?.name,
    enabled: digitalAssetsCheck?.enabled,
    showInSidebar: digitalAssetsCheck?.showInSidebar,
    menuItemsCount: digitalAssetsCheck?.menuItems?.length,
    menuItems: digitalAssetsCheck?.menuItems,
  });
  
  console.log('🔍 FORCE DEBUG: Service Deliveries module:', {
    id: serviceDeliveriesCheck?.id,
    name: serviceDeliveriesCheck?.name,
    enabled: serviceDeliveriesCheck?.enabled,
    showInSidebar: serviceDeliveriesCheck?.showInSidebar,
    menuItemsCount: serviceDeliveriesCheck?.menuItems?.length,
    menuItems: serviceDeliveriesCheck?.menuItems,
  });
  
  // 🔍 FORCE DEBUG: Test getAllMenuItems right after registration
  const allMenuItems = registry.getAllMenuItems();
  console.log('🔍 FORCE DEBUG: getAllMenuItems() returned', allMenuItems.length, 'items');
  console.log('🔍 FORCE DEBUG: Digital Assets in menu?', allMenuItems.find(m => m.id === 'digital-assets'));
  console.log('🔍 FORCE DEBUG: Service Deliveries in menu?', allMenuItems.find(m => m.id === 'service-deliveries'));
}

// Auto-register on import
registerAllModules();