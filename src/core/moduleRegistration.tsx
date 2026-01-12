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

/**
 * Register all modules
 */
export function registerAllModules(): void {
  const registry = ModuleRegistry.getInstance();
  
  // Register modules in order
  registry.register(DashboardModule);
  registry.register(TenantsModule);
  registry.register(SystemCategoryModule);
  registry.register(UsersModule);
  registry.register(HelpModule);
  registry.register(DevDocsModule);
  registry.register(SettingsModule);
  registry.register(AuthModule);
  
  console.log('✅ All modules registered successfully');
}

// Auto-register on import
registerAllModules();
