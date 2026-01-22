/**
 * Permissions API Client
 * Uses Adapter pattern - Ready for Golang migration
 * 
 * ✅ CREATED 2026-01-15: 100% matches permissions schema (15 fields)
 * Backend API: /supabase/functions/server/permissions-api.tsx
 */

import { createAdapter, BaseFilters } from './adapters';
import { getSupabaseClient } from '../lib/supabase';

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

export const permissionsApi = {
  /**
   * GET /permissions
   * Get all permissions with optional filters
   */
  getAll: async (filters?: PermissionFilters): Promise<Permission[]> => {
    const supabase = getSupabaseClient();
    let query = supabase
      .from('permissions')
      .select('*')
      .is('deleted_at', null)
      .order('code', { ascending: true });

    // Apply filters
    if (filters?.app_code) query = query.eq('app_code', filters.app_code);
    if (filters?.parent_code) query = query.eq('parent_code', filters.parent_code);
    if (filters?.is_group !== undefined) query = query.eq('is_group', filters.is_group);
    
    // Pagination
    if (filters?.limit) query = query.limit(filters.limit);
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch permissions: ${error.message}`);
    }

    let permissions = data || [];

    // Client-side search (if needed, though SQL LIKE is better)
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      permissions = permissions.filter(
        (p) => 
          p.name.toLowerCase().includes(search) || 
          p.code.toLowerCase().includes(search) ||
          p.description?.toLowerCase().includes(search)
      );
    }

    return permissions;
  },

  /**
   * GET /permissions/:id
   * Get a single permission by ID
   */
  getById: async (id: string): Promise<Permission> => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('permissions')
      .select('*')
      .eq('_id', id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch permission: ${error.message}`);
    }
    return data;
  },

  /**
   * POST /permissions
   * Create a new permission
   */
  create: async (data: CreatePermissionRequest): Promise<Permission> => {
    const supabase = getSupabaseClient();
    
    // Generate UUID client-side
    const _id = crypto.randomUUID();
    const now = new Date().toISOString();

    const requestData = {
      _id,
      ...data,
      created_at: now,
      updated_at: now,
      created_by: data.created_by || null,
      updated_by: data.created_by || null, // Initial creator is also updater
      version: 1,
      // path is handled by DB trigger usually, but if we needed to set it:
      // path: ... 
    };

    const { data: created, error } = await supabase
      .from('permissions')
      .insert([requestData])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create permission: ${error.message}`);
    }

    return created;
  },

  /**
   * PATCH /permissions/:id
   * Update an existing permission with Optimistic Locking
   */
  update: async (id: string, data: UpdatePermissionRequest & { version?: number }): Promise<Permission> => {
    const supabase = getSupabaseClient();

    // 1. Get current version if not provided (fallback)
    let currentVersion = data.version;
    if (currentVersion === undefined) {
      const { data: current, error: fetchError } = await supabase
        .from('permissions')
        .select('version')
        .eq('_id', id)
        .single();
      
      if (fetchError || !current) {
        throw new Error('Permission not found or access denied');
      }
      currentVersion = current.version;
    }

    const nextVersion = currentVersion + 1;
    const now = new Date().toISOString();

    // Prepare update data
    // Exclude 'version' from data spread to avoid confusion, though we overwrite it anyway
    const { version: _, ...fieldsToUpdate } = data;

    const updateData = {
      ...fieldsToUpdate,
      updated_at: now,
      version: nextVersion,
    };

    // 2. Perform update with version check
    const { data: updated, error } = await supabase
      .from('permissions')
      .update(updateData)
      .eq('_id', id)
      .eq('version', currentVersion)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update permission: ${error.message}`);
    }

    if (!updated) {
      throw new Error('Concurrent modification detected. Please refresh and try again.');
    }

    return updated;
  },

  /**
   * DELETE /permissions/:id
   * Soft delete a permission
   */
  delete: async (id: string, deletedBy?: string, version?: number): Promise<void> => {
    const supabase = getSupabaseClient();

    // 1. Get current version if not provided
    let currentVersion = version;
    if (currentVersion === undefined) {
      const { data: current, error: fetchError } = await supabase
        .from('permissions')
        .select('version')
        .eq('_id', id)
        .single();
      
      if (fetchError || !current) {
         // Already deleted or not found
         return; 
      }
      currentVersion = current.version;
    }

    const nextVersion = currentVersion + 1;

    // 2. Soft delete with version check
    const { error } = await supabase
      .from('permissions')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: deletedBy || null,
        updated_at: new Date().toISOString(),
        version: nextVersion
      })
      .eq('_id', id)
      .eq('version', currentVersion);

    if (error) {
      throw new Error(`Failed to delete permission: ${error.message}`);
    }
  },

  /**
   * GET /permissions/tree/:app_code
   * Get permissions as tree structure
   */
  getTree: async (appCode: string): Promise<PermissionNode[]> => {
    // Fetch all permissions for the app
    const permissions = await permissionsApi.getAll({ app_code: appCode });
    // Build tree client-side
    return permissionsApi.buildTree(permissions);
  },

  /**
   * GET /permissions/stats
   * Get permission statistics
   */
  getStats: async (filters?: PermissionFilters): Promise<PermissionStats> => {
    const permissions = await permissionsApi.getAll(filters);
    
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
