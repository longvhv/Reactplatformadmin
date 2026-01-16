/**
 * Permissions API Client
 * Uses Adapter pattern - Ready for Golang migration
 * 
 * ✅ CREATED 2026-01-15: 100% matches permissions schema (15 fields)
 * Backend API: /supabase/functions/server/permissions-api.tsx
 */

import { createAdapter, BaseFilters } from './adapters';

// ==================== TYPES ====================

/**
 * Permission - 100% matches permissions table (15 fields)
 */
export interface Permission {
  // Identity (3)
  _id: string;
  app_code: string;                  // FK to applications(code)
  code: string;                      // Unique, e.g., "HRM_VIEW_EMPLOYEES"
  
  // Hierarchy (2)
  parent_code?: string | null;       // FK to permissions(code) - self-reference
  path?: string;                     // Materialized path (auto-calculated by trigger)
  
  // Type & Info (2)
  is_group: boolean;                 // true = group/folder, false = permission
  name: string;                      // Display name
  
  // Optional (1)
  description?: string | null;
  
  // Audit (7)
  created_at: string;                // timestamptz not null
  updated_at: string;                // timestamptz not null
  created_by?: string | null;        // UUID FK to users
  updated_by?: string | null;        // UUID FK to users
  deleted_at?: string | null;        // timestamptz - Soft delete
  deleted_by?: string | null;        // UUID FK to users
  version: number;                   // bigint not null default 1
}

/**
 * Permission with children (for tree view)
 */
export interface PermissionNode extends Permission {
  children?: PermissionNode[];
}

/**
 * Create Permission Request
 */
export interface CreatePermissionRequest {
  app_code: string;
  code: string;
  parent_code?: string | null;
  is_group: boolean;
  name: string;
  description?: string | null;
  created_by?: string;               // User who creates
}

/**
 * Update Permission Request
 */
export interface UpdatePermissionRequest {
  app_code?: string;
  code?: string;
  parent_code?: string | null;
  is_group?: boolean;
  name?: string;
  description?: string | null;
  updated_by?: string;               // User who updates
}

/**
 * Permission Filters
 */
export interface PermissionFilters extends BaseFilters {
  app_code?: string;
  parent_code?: string;
  is_group?: boolean;
  search?: string;
}

/**
 * Permission Statistics
 */
export interface PermissionStats {
  total: number;
  by_app: Record<string, number>;
  groups: number;
  permissions: number;
  root_count: number;
}

// ==================== API CLIENT ====================

const adapter = createAdapter<Permission, CreatePermissionRequest, UpdatePermissionRequest>(
  'permissions',
  '/api/core/permissions'
);

export const permissionsApi = {
  /**
   * GET /permissions
   * Get all permissions with optional filters
   */
  getAll: async (filters?: PermissionFilters): Promise<Permission[]> => {
    return adapter.getAll(filters);
  },

  /**
   * GET /permissions/:id
   * Get a single permission by ID
   */
  getById: async (id: string): Promise<Permission> => {
    return adapter.getById(id);
  },

  /**
   * POST /permissions
   * Create a new permission
   */
  create: async (data: CreatePermissionRequest): Promise<Permission> => {
    return adapter.create(data);
  },

  /**
   * PATCH /permissions/:id
   * Update an existing permission
   */
  update: async (id: string, data: UpdatePermissionRequest): Promise<Permission> => {
    return adapter.update(id, data);
  },

  /**
   * DELETE /permissions/:id
   * Soft delete a permission
   */
  delete: async (id: string): Promise<void> => {
    return adapter.delete(id);
  },

  /**
   * GET /permissions/tree/:app_code
   * Get permissions as tree structure
   */
  getTree: async (appCode: string): Promise<PermissionNode[]> => {
    // This endpoint might be different from the adapter pattern
    // Call backend API directly
    const response = await fetch(`/api/core/permissions/tree/${appCode}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch permissions tree: ${response.statusText}`);
    }
    const result = await response.json();
    return result.data || [];
  },

  /**
   * GET /permissions/stats
   * Get permission statistics (if backend supports)
   */
  getStats: async (filters?: PermissionFilters): Promise<PermissionStats> => {
    const permissions = await adapter.getAll(filters);
    
    // Calculate stats from data
    const stats: PermissionStats = {
      total: permissions.length,
      by_app: {},
      groups: 0,
      permissions: 0,
      root_count: 0,
    };

    permissions.forEach(perm => {
      // Count by app
      stats.by_app[perm.app_code] = (stats.by_app[perm.app_code] || 0) + 1;
      
      // Count groups vs permissions
      if (perm.is_group) {
        stats.groups++;
      } else {
        stats.permissions++;
      }
      
      // Count root permissions (no parent)
      if (!perm.parent_code) {
        stats.root_count++;
      }
    });

    return stats;
  },

  /**
   * Helper: Build tree from flat list
   */
  buildTree: (permissions: Permission[]): PermissionNode[] => {
    const map = new Map<string, PermissionNode>();
    const roots: PermissionNode[] = [];

    // Create map
    permissions.forEach(perm => {
      map.set(perm.code, { ...perm, children: [] });
    });

    // Build tree
    permissions.forEach(perm => {
      const node = map.get(perm.code)!;
      if (perm.parent_code && map.has(perm.parent_code)) {
        const parent = map.get(perm.parent_code)!;
        parent.children = parent.children || [];
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  },

  /**
   * Helper: Get all children of a permission (recursive)
   */
  getDescendants: (permissions: Permission[], code: string): Permission[] => {
    const descendants: Permission[] = [];
    const children = permissions.filter(p => p.parent_code === code);
    
    children.forEach(child => {
      descendants.push(child);
      descendants.push(...permissionsApi.getDescendants(permissions, child.code));
    });
    
    return descendants;
  },

  /**
   * Helper: Check if permission has children
   */
  hasChildren: (permissions: Permission[], code: string): boolean => {
    return permissions.some(p => p.parent_code === code);
  },

  /**
   * Helper: Get permission path breadcrumb
   */
  getBreadcrumb: (permissions: Permission[], code: string): Permission[] => {
    const breadcrumb: Permission[] = [];
    let current = permissions.find(p => p.code === code);
    
    while (current) {
      breadcrumb.unshift(current);
      current = current.parent_code 
        ? permissions.find(p => p.code === current!.parent_code) 
        : undefined;
    }
    
    return breadcrumb;
  },
};

export default permissionsApi;
