/**
 * App Component API
 * Manages application component hierarchy
 */

// ============================================
// TYPES & INTERFACES
// ============================================

export type ComponentType = 'layout' | 'module' | 'page' | 'widget' | 'form';

export interface AppComponent {
  id?: string;
  code: string;
  name: string;
  type: string; // Always 'TYPE_COMPONENT'
  componentId: string;
  componentType: ComponentType;
  route?: string;
  icon?: string;
  parentId?: string | null;
  permissions?: string[];
  isVisible?: boolean;
  order?: number;
  status?: number;
  description?: string;
  metadata?: Record<string, any>;
  isSystem?: boolean;
  isEditable?: boolean;
  tenantId?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AppComponentWithParent extends AppComponent {
  parent?: AppComponent | null;
  children?: AppComponent[];
  level?: number;
  path?: string[]; // Array of parent codes
}

export interface AppComponentTreeNode extends AppComponent {
  children: AppComponentTreeNode[];
  level: number;
  hasChildren: boolean;
}

export interface NavigationItem {
  code: string;
  name: string;
  route?: string;
  icon?: string;
  permissions?: string[];
  children?: NavigationItem[];
}

// ============================================
// HELPERS
// ============================================

export class ComponentTypeHelper {
  static readonly LAYOUT: ComponentType = 'layout';
  static readonly MODULE: ComponentType = 'module';
  static readonly PAGE: ComponentType = 'page';
  static readonly WIDGET: ComponentType = 'widget';
  static readonly FORM: ComponentType = 'form';

  static getTypeName(type: ComponentType): string {
    const names: Record<ComponentType, string> = {
      layout: 'Layout',
      module: 'Module',
      page: 'Page',
      widget: 'Widget',
      form: 'Form',
    };
    return names[type] || type;
  }

  static getTypeDescription(type: ComponentType): string {
    const descriptions: Record<ComponentType, string> = {
      layout: 'Thành phần bố cục (header, sidebar, footer)',
      module: 'Module chính (menu cấp 1)',
      page: 'Trang con (menu cấp 2, 3)',
      widget: 'Widget tái sử dụng (cards, charts)',
      form: 'Form tái sử dụng',
    };
    return descriptions[type] || type;
  }

  static isNavigable(component: AppComponent): boolean {
    return !!component.route && component.isVisible && component.status === 1;
  }

  static hasPermission(component: AppComponent, userPermissions: string[]): boolean {
    if (!component.permissions || component.permissions.length === 0) {
      return true;
    }
    
    // Check if user has any of the required permissions
    return component.permissions.some(perm => 
      userPermissions.includes(perm) || userPermissions.includes('*')
    );
  }

  static getIconComponent(iconName?: string): string {
    return iconName || 'Box';
  }
}

// ============================================
// API BASE URL (Mock for now - TODO: implement backend)
// ============================================

const API_BASE_URL = '/api/app-components';

// Mock data for development
let mockComponents: AppComponent[] = [];

// Initialize with some mock data
const initMockData = () => {
  if (mockComponents.length === 0) {
    mockComponents = [
      {
        id: '1',
        code: 'COMP_HEADER',
        name: 'Header',
        type: 'TYPE_COMPONENT',
        componentId: 'header',
        componentType: 'layout',
        icon: 'LayoutPanelTop',
        order: 1,
        status: 1,
        isSystem: true,
        isEditable: true,
        isVisible: true,
        description: 'Application header and top navigation',
      },
      {
        id: '2',
        code: 'COMP_SIDEBAR',
        name: 'Sidebar',
        type: 'TYPE_COMPONENT',
        componentId: 'sidebar',
        componentType: 'layout',
        icon: 'LayoutPanelLeft',
        order: 2,
        status: 1,
        isSystem: true,
        isEditable: true,
        isVisible: true,
        description: 'Application sidebar navigation',
      },
      {
        id: '3',
        code: 'COMP_DASHBOARD',
        name: 'Dashboard',
        type: 'TYPE_COMPONENT',
        componentId: 'dashboard',
        componentType: 'module',
        route: '/dashboard',
        icon: 'LayoutDashboard',
        order: 10,
        status: 1,
        isSystem: true,
        isEditable: false,
        isVisible: true,
        permissions: ['read'],
        description: 'Main dashboard module',
      },
      {
        id: '4',
        code: 'COMP_CATEGORIES',
        name: 'System Categories',
        type: 'TYPE_COMPONENT',
        componentId: 'system-categories',
        componentType: 'module',
        route: '/system-categories',
        icon: 'FolderTree',
        order: 20,
        status: 1,
        isSystem: true,
        isEditable: false,
        isVisible: true,
        permissions: ['admin'],
        description: 'System category management',
      },
    ];
  }
};

// ============================================
// API NAMESPACE (for backward compatibility)
// ============================================

export const appComponentApi = {
  async getAll(params?: { search?: string; componentType?: ComponentType }): Promise<AppComponent[]> {
    initMockData();
    
    let filtered = [...mockComponents];
    
    if (params?.search) {
      const search = params.search.toLowerCase();
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(search) ||
        c.code.toLowerCase().includes(search) ||
        c.componentId.toLowerCase().includes(search)
      );
    }
    
    if (params?.componentType) {
      filtered = filtered.filter(c => c.componentType === params.componentType);
    }
    
    return filtered.sort((a, b) => (a.order || 0) - (b.order || 0));
  },

  async getById(id: string): Promise<AppComponent> {
    initMockData();
    const component = mockComponents.find(c => c.id === id);
    if (!component) {
      throw new Error('Component not found');
    }
    return component;
  },

  async create(data: Partial<AppComponent>): Promise<AppComponent> {
    initMockData();
    
    const newComponent: AppComponent = {
      id: Date.now().toString(),
      code: data.code || '',
      name: data.name || '',
      type: 'TYPE_COMPONENT',
      componentId: data.componentId || '',
      componentType: data.componentType || 'page',
      route: data.route,
      icon: data.icon,
      parentId: data.parentId,
      permissions: data.permissions,
      isVisible: data.isVisible ?? true,
      order: data.order ?? mockComponents.length,
      status: data.status ?? 1,
      description: data.description,
      metadata: data.metadata,
      isSystem: data.isSystem ?? false,
      isEditable: data.isEditable ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    mockComponents.push(newComponent);
    return newComponent;
  },

  async update(id: string, data: Partial<AppComponent>): Promise<AppComponent> {
    initMockData();
    
    const index = mockComponents.findIndex(c => c.id === id);
    if (index === -1) {
      throw new Error('Component not found');
    }
    
    mockComponents[index] = {
      ...mockComponents[index],
      ...data,
      id,
      updatedAt: new Date().toISOString(),
    };
    
    return mockComponents[index];
  },

  async delete(id: string): Promise<void> {
    initMockData();
    
    const index = mockComponents.findIndex(c => c.id === id);
    if (index === -1) {
      throw new Error('Component not found');
    }
    
    if (mockComponents[index].isSystem && !mockComponents[index].isEditable) {
      throw new Error('Cannot delete system component');
    }
    
    mockComponents.splice(index, 1);
  },

  async getTree(params?: { rootType?: ComponentType }): Promise<AppComponentTreeNode[]> {
    initMockData();
    
    let roots = mockComponents.filter(c => !c.parentId);
    
    if (params?.rootType) {
      roots = roots.filter(c => c.componentType === params.rootType);
    }
    
    const buildTree = (component: AppComponent, level: number = 0): AppComponentTreeNode => {
      const children = mockComponents
        .filter(c => c.parentId === component.id)
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map(child => buildTree(child, level + 1));
      
      return {
        ...component,
        children,
        level,
        hasChildren: children.length > 0,
      };
    };
    
    return roots
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map(root => buildTree(root));
  },

  async getNavigation(permissions: string[] = ['read']): Promise<NavigationItem[]> {
    initMockData();
    
    const modules = mockComponents
      .filter(c => c.componentType === 'module' && c.isVisible && c.status === 1)
      .filter(c => ComponentTypeHelper.hasPermission(c, permissions));
    
    const result: NavigationItem[] = [];
    
    for (const module of modules) {
      const navItem: NavigationItem = {
        code: module.code,
        name: module.name,
        route: module.route,
        icon: module.icon,
        permissions: module.permissions,
      };
      
      const children = mockComponents
        .filter(c => c.parentId === module.id && c.isVisible && c.status === 1)
        .filter(c => ComponentTypeHelper.hasPermission(c, permissions))
        .sort((a, b) => (a.order || 0) - (b.order || 0));
      
      if (children.length > 0) {
        navItem.children = children.map(child => ({
          code: child.code,
          name: child.name,
          route: child.route,
          icon: child.icon,
          permissions: child.permissions,
        }));
      }
      
      result.push(navItem);
    }
    
    return result.sort((a, b) => {
      const moduleA = modules.find(m => m.code === a.code);
      const moduleB = modules.find(m => m.code === b.code);
      return (moduleA?.order || 0) - (moduleB?.order || 0);
    });
  },
};