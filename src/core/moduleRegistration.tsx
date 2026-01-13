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
import { HelpModule } from '../modules/help/index';
import { DevDocsModule } from '../modules/dev-docs/index';
import { TenantMembersModule } from '../modules/tenant-members/index';
import { ApplicationsModule } from '../modules/applications/index';
import { ProductsModule } from '../modules/products/index';
import { ServicePackagesModule } from '../modules/service-packages/index';
import { SubscriptionOrdersModule } from '../modules/subscription-orders/index';
import { SubscriptionInvoicesModule } from '../modules/subscription-invoices/index';
import { TenantSubscriptionsModule } from '../modules/tenant-subscriptions/index';
import { SystemAnnouncementsModule } from '../modules/system-announcements/index';
import { NotificationTemplatesModule } from '../modules/notification-templates/index';

/**
 * Register all modules
 */
export function registerAllModules(): void {
  const registry = ModuleRegistry.getInstance();
  
  // Register modules in order
  registry.register(DashboardModule);
  registry.register(TenantsModule);
  registry.register(TenantMembersModule);
  registry.register(SystemCategoryModule);
  registry.register(ApplicationsModule);
  registry.register(ProductsModule);
  registry.register(ServicePackagesModule);
  registry.register(SubscriptionOrdersModule);
  registry.register(SubscriptionInvoicesModule);
  registry.register(TenantSubscriptionsModule);
  registry.register(SystemAnnouncementsModule);
  registry.register(NotificationTemplatesModule);
  registry.register(UsersModule);
  registry.register(HelpModule);
  registry.register(DevDocsModule);
  registry.register(SettingsModule);
  registry.register(AuthModule);
  
  console.log('✅ All modules registered successfully');
}

// Auto-register on import
registerAllModules();