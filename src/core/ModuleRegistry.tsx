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
  order?: number; // ✅ FIX: Add order field for sorting
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
  order?: number; // ✅ FIX: Add order field for module sorting
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
  private listeners: Set<() => void> = new Set();

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
   * Subscribe to registry changes
   */
  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
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
    this.notifyListeners();
  }

  /**
   * Hủy đăng ký một module
   */
  public unregister(moduleId: string): void {
    if (this.modules.delete(moduleId)) {
      console.log(`✓ Module đã hủy đăng ký: ${moduleId}`);
      this.notifyListeners();
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
        // ✅ Filter out any invalid routes (undefined, null, or missing required fields)
        const validRoutes = module.routes.filter(route => 
          route && 
          typeof route === 'object' && 
          route.path && 
          route.element !== undefined && 
          route.element !== null
        );
        
        if (validRoutes.length !== module.routes.length) {
          console.warn(
            `Module ${module.id} has ${module.routes.length - validRoutes.length} invalid routes filtered out`
          );
        }
        
        routes.push(...validRoutes);
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
      this.notifyListeners();
    }
  }

  /**
   * Reset registry (dùng cho testing hoặc hot reload)
   */
  public reset(): void {
    this.modules.clear();
    console.log('✓ Module Registry đã được reset');
    this.notifyListeners();
  }

  /**
   * Get all menu items from registered modules
   * Returns flattened list of menu items sorted by order
   */
  public getAllMenuItems(): MenuItem[] {
    const menuItems: (MenuItem & { order?: number })[] = [];
    
    const enabledModules = this.getEnabledModules();
    console.log('🔍 DEBUG getAllMenuItems: Enabled modules:', enabledModules.map(m => ({ 
      id: m.id, 
      showInSidebar: m.showInSidebar, 
      menuItemsCount: m.menuItems?.length,
      menuItems: m.menuItems 
    })));
    
    enabledModules.forEach((module) => {
      // Only include modules that should show in sidebar
      if (module.showInSidebar !== false && Array.isArray(module.menuItems)) {
        console.log(`🔍 DEBUG getAllMenuItems: Module "${module.id}" - showInSidebar: ${module.showInSidebar}, menuItems:`, module.menuItems);
        module.menuItems.forEach((item) => {
          menuItems.push({
            ...item,
            order: (item as any).order ?? (module as any).order ?? 999,
          });
        });
      } else {
        console.log(`🔍 DEBUG getAllMenuItems: Module "${module.id}" SKIPPED - showInSidebar: ${module.showInSidebar}, hasMenuItems: ${Array.isArray(module.menuItems)}, menuItemsCount: ${module.menuItems?.length}`);
      }
    });
    
    console.log('🔍 DEBUG getAllMenuItems: Final menu items:', menuItems);
    
    // Sort by order
    return menuItems.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  }
}