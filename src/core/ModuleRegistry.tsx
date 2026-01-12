import { ReactNode } from "react";

/**
 * Interface for nested menu items (support up to 4 levels)
 */
export interface MenuItem {
  id: string;
  label: string;
  icon?: ReactNode;
  path?: string;
  children?: MenuItem[];
  badge?: string | number;
  disabled?: boolean;
}

/**
 * Interface cho định nghĩa module
 */
export interface ModuleDefinition {
  id: string;
  name: string;
  description?: string;
  icon?: ReactNode;
  routes: RouteDefinition[];
  menuItems?: MenuItem[]; // New: nested menu structure
  showInSidebar?: boolean; // New: control sidebar visibility
  reducer?: any; // Redux reducer (nếu có)
  enabled?: boolean;
}

/**
 * Type alias for backward compatibility
 */
export type ModuleConfig = ModuleDefinition;

/**
 * Interface cho định nghĩa route
 */
export interface RouteDefinition {
  path: string;
  element: ReactNode;
  title?: string;
  requiresAuth?: boolean;
}

/**
 * Module Registry - Singleton
 * 
 * Quản lý việc đăng ký và truy xuất các module trong ứng dụng.
 * Hỗ trợ tự động phát hiện và Hot Module Replacement.
 */
export class ModuleRegistry {
  private static instance: ModuleRegistry;
  private modules: Map<string, ModuleDefinition> = new Map();

  private constructor() {}

  /**
   * Lấy instance singleton
   */
  public static getInstance(): ModuleRegistry {
    if (!ModuleRegistry.instance) {
      ModuleRegistry.instance = new ModuleRegistry();
    }
    return ModuleRegistry.instance;
  }

  /**
   * Đăng ký một module mới
   */
  public register(module: ModuleDefinition): void {
    // Defensive check: ensure module is valid
    if (!module) {
      console.error('Attempted to register undefined/null module');
      return;
    }
    
    if (!module.id) {
      console.error('Attempted to register module without id:', module);
      return;
    }
    
    if (!Array.isArray(module.routes)) {
      console.error(`Module ${module.id} has invalid routes (not an array):`, module.routes);
      return;
    }
    
    if (this.modules.has(module.id)) {
      console.warn(`Module ${module.id} đã được đăng ký, đang ghi đè...`);
    }
    
    this.modules.set(module.id, {
      ...module,
      enabled: module.enabled !== false, // Mặc định enabled = true
    });
    
    console.log(`✓ Module đã đăng ký: ${module.name} (${module.id})`);
  }

  /**
   * Hủy đăng ký một module
   */
  public unregister(moduleId: string): void {
    if (this.modules.delete(moduleId)) {
      console.log(`✓ Module đã hủy đăng ký: ${moduleId}`);
    }
  }

  /**
   * Lấy một module theo ID
   */
  public getModule(moduleId: string): ModuleDefinition | undefined {
    return this.modules.get(moduleId);
  }

  /**
   * Lấy tất cả modules đã đăng ký
   */
  public getAllModules(): ModuleDefinition[] {
    return Array.from(this.modules.values());
  }

  /**
   * Lấy các modules đã kích hoạt
   */
  public getEnabledModules(): ModuleDefinition[] {
    return this.getAllModules().filter((m) => m.enabled);
  }

  /**
   * Lấy tất cả routes từ các modules đã kích hoạt
   */
  public getAllRoutes(): RouteDefinition[] {
    const routes: RouteDefinition[] = [];
    
    this.getEnabledModules().forEach((module) => {
      // Defensive check: ensure module.routes exists and is an array
      if (module && Array.isArray(module.routes)) {
        routes.push(...module.routes);
      } else {
        console.warn(`Module ${module?.id || 'unknown'} has invalid routes:`, module?.routes);
      }
    });
    
    return routes;
  }

  /**
   * Bật/tắt một module
   */
  public setModuleEnabled(moduleId: string, enabled: boolean): void {
    const module = this.modules.get(moduleId);
    if (module) {
      module.enabled = enabled;
      console.log(`✓ Module ${moduleId} ${enabled ? 'đã kích hoạt' : 'đã vô hiệu hóa'}`);
    }
  }

  /**
   * Reset registry (dùng cho testing hoặc hot reload)
   */
  public reset(): void {
    this.modules.clear();
    console.log('✓ Module Registry đã được reset');
  }
}