/**
 * Roles API Client
 * Uses Adapter pattern - Ready for Golang migration
 * 
 * ✅ REWRITTEN 2026-01-14: 100% matches roles schema (9 fields)
 */

import { createAdapter, BaseFilters } from './adapters';

// ==================== TYPES ====================

/**
 * Role Type - 2 types
 */
export type RoleType = 'SYSTEM' | 'CUSTOM';

/**
 * Role - 100% matches roles table (9 fields)
 */
export interface Role {
  // Identity & Relationships
  _id: string;
  tenant_id: string;
  
  // Role Information
  name: string;                    // varchar(100) not null, check (length(name) > 0)
  description?: string;            // text nullable
  type: RoleType;                  // varchar(20) not null default 'CUSTOM'
  permission_codes: string[];      // text[] not null default '{}'
  
  // Audit Fields
  created_at: string;              // timestamptz not null
  updated_at: string;              // timestamptz not null
  
  // Versioning
  version: number;                 // bigint not null default 1, check (version >= 1)
}

/**
 * Create Role Request
 */
export interface CreateRoleRequest {
  tenant_id: string;
  name: string;
  description?: string;
  type?: RoleType;                 // Default 'CUSTOM' in database
  permission_codes?: string[];     // Default '{}' in database
}

/**
 * Update Role Request
 */
export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  permission_codes?: string[];
  version?: number; // Optimistic locking
  // ⚠️ type cannot be changed after creation (SYSTEM roles are protected)
}

/**
 * Role Filters
 */
export interface RoleFilters extends BaseFilters {
  tenant_id?: string;
  type?: RoleType;
  has_permissions?: boolean;       // Filter roles with/without permissions
  search?: string;                 // Search by name or description
}

/**
 * Role Statistics
 */
export interface RoleStats {
  total: number;
  by_type: {
    SYSTEM: number;
    CUSTOM: number;
  };
  with_permissions: number;
  without_permissions: number;
  avg_permissions_count: number;
  most_used_permissions: Array<{
    code: string;
    count: number;
  }>;
}

/**
 * Permission Definition (for autocomplete, validation)
 */
export interface PermissionDefinition {
  code: string;
  name: string;
  description: string;
  category: string;
  is_dangerous: boolean;
}

// ==================== ADAPTER ====================

const adapter = createAdapter<Role, CreateRoleRequest, UpdateRoleRequest>(
  'roles',
  '/roles'
);

// ==================== API CLIENT ====================

export const rolesApi = {
  /**
   * GET /roles
   */
  getAll: async (filters?: RoleFilters): Promise<Role[]> => {
    return adapter.getAll(filters);
  },

  /**
   * GET /roles/:id
   */
  getById: async (id: string): Promise<Role> => {
    return adapter.getById(id);
  },

  /**
   * POST /roles
   */
  create: async (data: CreateRoleRequest): Promise<Role> => {
    // Validate name length > 0 (will be enforced by DB constraint too)
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Role name cannot be empty');
    }
    
    return adapter.create(data);
  },

  /**
   * PATCH /roles/:id
   */
  update: async (id: string, data: UpdateRoleRequest): Promise<Role> => {
    // Validate name length > 0 if provided
    if (data.name !== undefined && data.name.trim().length === 0) {
      throw new Error('Role name cannot be empty');
    }
    
    return adapter.update(id, data);
  },

  /**
   * DELETE /roles/:id
   * Hard delete - CASCADE to user_roles
   */
  delete: async (id: string): Promise<void> => {
    return adapter.delete(id);
  },

  /**
   * Get roles by tenant
   */
  getByTenant: async (tenantId: string): Promise<Role[]> => {
    return adapter.getAll({ tenant_id: tenantId });
  },

  /**
   * Get system roles for a tenant
   */
  getSystemRoles: async (tenantId: string): Promise<Role[]> => {
    return adapter.getAll({ 
      tenant_id: tenantId,
      type: 'SYSTEM'
    });
  },

  /**
   * Get custom roles for a tenant
   */
  getCustomRoles: async (tenantId: string): Promise<Role[]> => {
    return adapter.getAll({ 
      tenant_id: tenantId,
      type: 'CUSTOM'
    });
  },

  /**
   * Add permission to role
   */
  addPermission: async (id: string, permissionCode: string): Promise<Role> => {
    // TODO: Implement in Golang backend
    // 1. Get current role
    // 2. Check if permission already exists
    // 3. Add to permission_codes array
    // 4. Update with version check
    throw new Error('Add permission endpoint not implemented - migrate to Golang');
  },

  /**
   * Remove permission from role
   */
  removePermission: async (id: string, permissionCode: string): Promise<Role> => {
    // TODO: Implement in Golang backend
    // 1. Get current role
    // 2. Remove from permission_codes array
    // 3. Update with version check
    throw new Error('Remove permission endpoint not implemented - migrate to Golang');
  },

  /**
   * Bulk add permissions to role
   */
  addPermissions: async (id: string, permissionCodes: string[]): Promise<Role> => {
    const role = await adapter.getById(id);
    const currentCodes = new Set(role.permission_codes);
    
    permissionCodes.forEach(code => currentCodes.add(code));
    
    return adapter.update(id, {
      permission_codes: Array.from(currentCodes)
    });
  },

  /**
   * Bulk remove permissions from role
   */
  removePermissions: async (id: string, permissionCodes: string[]): Promise<Role> => {
    const role = await adapter.getById(id);
    const currentCodes = new Set(role.permission_codes);
    
    permissionCodes.forEach(code => currentCodes.delete(code));
    
    return adapter.update(id, {
      permission_codes: Array.from(currentCodes)
    });
  },

  /**
   * Set permissions (replace all)
   */
  setPermissions: async (id: string, permissionCodes: string[]): Promise<Role> => {
    return adapter.update(id, {
      permission_codes: permissionCodes
    });
  },

  /**
   * Get role statistics for a tenant
   */
  getStats: async (tenantId: string): Promise<RoleStats> => {
    const roles = await adapter.getAll({ tenant_id: tenantId });
    
    const byType = {
      SYSTEM: roles.filter(r => r.type === 'SYSTEM').length,
      CUSTOM: roles.filter(r => r.type === 'CUSTOM').length,
    };
    
    const withPermissions = roles.filter(r => r.permission_codes.length > 0).length;
    const withoutPermissions = roles.length - withPermissions;
    
    const totalPermissions = roles.reduce((sum, r) => sum + r.permission_codes.length, 0);
    const avgPermissionsCount = roles.length > 0 
      ? Math.round(totalPermissions / roles.length * 10) / 10
      : 0;
    
    // Count permission usage
    const permissionCounts = new Map<string, number>();
    roles.forEach(role => {
      role.permission_codes.forEach(code => {
        permissionCounts.set(code, (permissionCounts.get(code) || 0) + 1);
      });
    });
    
    const mostUsedPermissions = Array.from(permissionCounts.entries())
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    return {
      total: roles.length,
      by_type: byType,
      with_permissions: withPermissions,
      without_permissions: withoutPermissions,
      avg_permissions_count: avgPermissionsCount,
      most_used_permissions: mostUsedPermissions,
    };
  },

  /**
   * Clone role (create copy with new name)
   * TODO (Golang): Implement clone endpoint
   */
  clone: async (id: string, newName: string): Promise<Role> => {
    const original = await adapter.getById(id);
    
    return adapter.create({
      tenant_id: original.tenant_id,
      name: newName,
      description: original.description ? `Copy of ${original.description}` : undefined,
      type: 'CUSTOM', // Clones are always CUSTOM
      permission_codes: [...original.permission_codes],
    });
  },

  /**
   * Duplicate system role as custom role
   */
  duplicateSystemRole: async (systemRoleId: string, customName: string): Promise<Role> => {
    const systemRole = await adapter.getById(systemRoleId);
    
    if (systemRole.type !== 'SYSTEM') {
      throw new Error('Can only duplicate SYSTEM roles');
    }
    
    return adapter.create({
      tenant_id: systemRole.tenant_id,
      name: customName,
      description: `Based on ${systemRole.name}`,
      type: 'CUSTOM',
      permission_codes: [...systemRole.permission_codes],
    });
  },

  /**
   * Check if role can be deleted
   * TODO (Golang): Check if role is assigned to any users
   */
  canDelete: async (id: string): Promise<{ 
    can_delete: boolean; 
    reason?: string;
    user_count?: number;
  }> => {
    const role = await adapter.getById(id);
    
    // Cannot delete SYSTEM roles
    if (role.type === 'SYSTEM') {
      return {
        can_delete: false,
        reason: 'Cannot delete SYSTEM roles',
      };
    }
    
    // TODO: Check if role is assigned to users in Golang
    // SELECT COUNT(*) FROM user_roles WHERE role_id = $1
    
    return {
      can_delete: true,
    };
  },

  /**
   * Get available permissions (for autocomplete)
   * TODO (Golang): Implement permissions catalog endpoint
   */
  getAvailablePermissions: async (): Promise<PermissionDefinition[]> => {
    // TODO: Implement in Golang backend
    // Return list of all available permission codes with metadata
    throw new Error('Get available permissions endpoint not implemented - migrate to Golang');
  },

  /**
   * Validate permission codes
   * TODO (Golang): Validate against permissions catalog
   */
  validatePermissions: async (permissionCodes: string[]): Promise<{
    valid: string[];
    invalid: string[];
  }> => {
    // TODO: Implement in Golang backend
    // Check which codes exist in permissions catalog
    throw new Error('Validate permissions endpoint not implemented - migrate to Golang');
  },

  /**
   * Search roles
   */
  search: async (tenantId: string, query: string): Promise<Role[]> => {
    return adapter.getAll({
      tenant_id: tenantId,
      search: query,
    });
  },

  /**
   * Get roles with specific permission
   */
  getByPermission: async (tenantId: string, permissionCode: string): Promise<Role[]> => {
    const roles = await adapter.getAll({ tenant_id: tenantId });
    return roles.filter(r => r.permission_codes.includes(permissionCode));
  },

  /**
   * Compare two roles (show differences)
   */
  compare: async (roleId1: string, roleId2: string): Promise<{
    role1: Role;
    role2: Role;
    common_permissions: string[];
    role1_only: string[];
    role2_only: string[];
  }> => {
    const [role1, role2] = await Promise.all([
      adapter.getById(roleId1),
      adapter.getById(roleId2),
    ]);
    
    const set1 = new Set(role1.permission_codes);
    const set2 = new Set(role2.permission_codes);
    
    const commonPermissions = role1.permission_codes.filter(p => set2.has(p));
    const role1Only = role1.permission_codes.filter(p => !set2.has(p));
    const role2Only = role2.permission_codes.filter(p => !set1.has(p));
    
    return {
      role1,
      role2,
      common_permissions: commonPermissions,
      role1_only: role1Only,
      role2_only: role2Only,
    };
  },
};

export default rolesApi;
