/**
 * User Roles API Client
 * Uses Adapter pattern - Ready for Golang migration
 * 
 * ✅ ENHANCED 2026-01-16: 100% database alignment + Type helpers
 * Database: user_roles (13 fields, scope system, expiration, RBAC)
 */
import { createAdapter, BaseFilters } from './adapters';

// ==================== TYPE HELPERS ====================

export const UserRoleScopeHelper = {
  GLOBAL: 'global' as UserRoleScope,
  TENANT: 'tenant' as UserRoleScope,
  DEPARTMENT: 'department' as UserRoleScope,
  PROJECT: 'project' as UserRoleScope,

  isGlobal: (scope: UserRoleScope) => scope === 'global',
  isTenant: (scope: UserRoleScope) => scope === 'tenant',
  isDepartment: (scope: UserRoleScope) => scope === 'department',
  isProject: (scope: UserRoleScope) => scope === 'project',
  
  // Group checks
  isOrganizationLevel: (scope: UserRoleScope) => scope === 'global' || scope === 'tenant',
  isTeamLevel: (scope: UserRoleScope) => scope === 'department' || scope === 'project',
  requiresScopeId: (scope: UserRoleScope) => scope !== 'global',
  requiresTenantId: (scope: UserRoleScope) => scope === 'tenant' || scope === 'department' || scope === 'project',
};

// ==================== TYPES ====================

/**
 * Scope types for user role assignments
 * - global: System-wide role
 * - tenant: Tenant-specific role
 * - department: Department-specific role
 * - project: Project-specific role
 */
export type UserRoleScope = 'global' | 'tenant' | 'department' | 'project';

export const USER_ROLE_SCOPES: UserRoleScope[] = ['global', 'tenant', 'department', 'project'];

/**
 * UserRole Interface
 * Match 100% database schema
 */
export interface UserRole {
  _id: string;
  user_id: string;
  role_id: string;
  tenant_id?: string | null;
  scope: UserRoleScope;
  scope_id?: string | null;
  granted_by?: string | null;
  granted_at?: string | null;
  expires_at?: string | null;
  is_active?: boolean | null;
  metadata?: Record<string, any> | null;
  created_at?: string | null;
  updated_at?: string | null;
  
  // ✅ Joined fields from query (for display)
  user_email?: string;
  user_full_name?: string;
  role_name?: string;
  role_slug?: string;
  granted_by_name?: string;
}

export interface CreateUserRoleRequest {
  user_id: string;
  role_id: string;
  tenant_id?: string | null;
  scope?: UserRoleScope;
  scope_id?: string | null;
  granted_by?: string | null;
  granted_at?: string | null;
  expires_at?: string | null;
  is_active?: boolean;
  metadata?: Record<string, any>;
}

export interface UpdateUserRoleRequest {
  scope?: UserRoleScope;
  scope_id?: string | null;
  expires_at?: string | null;
  is_active?: boolean;
  metadata?: Record<string, any>;
}

export interface UserRoleFilters extends BaseFilters {
  user_id?: string;
  role_id?: string;
  tenant_id?: string;
  scope?: UserRoleScope;
  is_active?: boolean;
}

// ==================== ADAPTER ====================

const adapter = createAdapter<UserRole, CreateUserRoleRequest, UpdateUserRoleRequest>(
  'user_roles',
  '/user-roles'
);

// ==================== API CLIENT ====================

export const userRolesApi = {
  /**
   * GET /user-roles
   * List all user roles with filters
   */
  getAll: (filters?: UserRoleFilters): Promise<UserRole[]> => {
    return adapter.getAll(filters);
  },

  /**
   * GET /user-roles/:id
   * Get user role by ID
   */
  getById: (id: string): Promise<UserRole> => {
    return adapter.getById(id);
  },

  /**
   * POST /user-roles
   * Create new user role
   */
  create: (data: CreateUserRoleRequest): Promise<UserRole> => {
    return adapter.create(data);
  },

  /**
   * PATCH /user-roles/:id
   * Update user role
   */
  update: (id: string, data: UpdateUserRoleRequest): Promise<UserRole> => {
    return adapter.update(id, data);
  },

  /**
   * DELETE /user-roles/:id
   * Delete user role (soft delete)
   */
  delete: (id: string): Promise<void> => {
    return adapter.delete(id);
  },

  /**
   * GET /user-roles?user_id={userId}
   * Get roles by user
   */
  getByUserId: (user_id: string): Promise<UserRole[]> => {
    return adapter.getAll({ user_id });
  },

  /**
   * GET /user-roles?role_id={roleId}
   * Get users with specific role
   */
  getByRoleId: (role_id: string): Promise<UserRole[]> => {
    return adapter.getAll({ role_id });
  },

  /**
   * GET /user-roles?tenant_id={tenantId}
   * Get roles by tenant
   */
  getByTenantId: (tenant_id: string): Promise<UserRole[]> => {
    return adapter.getAll({ tenant_id });
  },

  /**
   * Activate user role
   */
  activate: async (id: string): Promise<UserRole> => {
    return adapter.update(id, { is_active: true });
  },

  /**
   * Deactivate user role
   */
  deactivate: async (id: string): Promise<UserRole> => {
    return adapter.update(id, { is_active: false });
  },

  /**
   * Check if role assignment is expired
   */
  isExpired: (userRole: UserRole): boolean => {
    if (!userRole.expires_at) return false;
    return new Date(userRole.expires_at) < new Date();
  },

  /**
   * Get active roles only
   */
  getActive: (filters?: UserRoleFilters): Promise<UserRole[]> => {
    return adapter.getAll({ ...filters, is_active: true });
  },

  /**
   * Get roles by scope
   */
  getByScope: async (userId: string, scope: UserRoleScope): Promise<UserRole[]> => {
    return adapter.getAll({ user_id: userId, scope });
  },

  /**
   * Get global roles for a user
   */
  getGlobalRoles: async (userId: string): Promise<UserRole[]> => {
    return adapter.getAll({ user_id: userId, scope: 'global' });
  },

  /**
   * Get tenant roles for a user
   */
  getTenantRoles: async (userId: string, tenantId?: string): Promise<UserRole[]> => {
    const filters: any = { user_id: userId, scope: 'tenant' };
    if (tenantId) filters.tenant_id = tenantId;
    return adapter.getAll(filters);
  },

  /**
   * Get department roles for a user
   */
  getDepartmentRoles: async (userId: string, departmentId?: string): Promise<UserRole[]> => {
    const filters: any = { user_id: userId, scope: 'department' };
    if (departmentId) filters.scope_id = departmentId;
    return adapter.getAll(filters);
  },

  /**
   * Get project roles for a user
   */
  getProjectRoles: async (userId: string, projectId?: string): Promise<UserRole[]> => {
    const filters: any = { user_id: userId, scope: 'project' };
    if (projectId) filters.scope_id = projectId;
    return adapter.getAll(filters);
  },

  /**
   * Grant role to user
   */
  grantRole: async (data: {
    user_id: string;
    role_id: string;
    tenant_id?: string;
    scope?: UserRoleScope;
    scope_id?: string;
    granted_by?: string;
    expires_at?: string;
  }): Promise<UserRole> => {
    return adapter.create({
      ...data,
      granted_at: new Date().toISOString(),
      is_active: true,
    });
  },

  /**
   * Revoke role from user
   */
  revokeRole: async (userRoleId: string): Promise<void> => {
    return adapter.delete(userRoleId);
  },

  /**
   * Extend role expiration
   */
  extendExpiration: async (id: string, newExpiresAt: string): Promise<UserRole> => {
    return adapter.update(id, { expires_at: newExpiresAt });
  },

  /**
   * Remove expiration (make permanent)
   */
  makePermament: async (id: string): Promise<UserRole> => {
    return adapter.update(id, { expires_at: null });
  },

  /**
   * Get expired roles
   */
  getExpiredRoles: async (userId?: string): Promise<UserRole[]> => {
    const roles = userId 
      ? await adapter.getAll({ user_id: userId })
      : await adapter.getAll({});
    
    const now = new Date();
    return roles.filter(role => 
      role.expires_at && new Date(role.expires_at) < now
    );
  },

  /**
   * Get expiring soon roles (within days)
   */
  getExpiringSoon: async (userId: string, days: number = 7): Promise<UserRole[]> => {
    const roles = await adapter.getAll({ user_id: userId, is_active: true });
    const now = new Date();
    const threshold = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    
    return roles.filter(role => {
      if (!role.expires_at) return false;
      const expiresAt = new Date(role.expires_at);
      return expiresAt > now && expiresAt <= threshold;
    });
  },

  /**
   * Check if user has role
   */
  hasRole: async (userId: string, roleId: string, scope?: UserRoleScope): Promise<boolean> => {
    const filters: any = { user_id: userId, role_id: roleId, is_active: true };
    if (scope) filters.scope = scope;
    
    const roles = await adapter.getAll(filters);
    
    // Check if any non-expired role exists
    const now = new Date();
    return roles.some(role => 
      !role.expires_at || new Date(role.expires_at) > now
    );
  },

  /**
   * Check if user has any of the roles
   */
  hasAnyRole: async (userId: string, roleIds: string[]): Promise<boolean> => {
    const roles = await adapter.getAll({ user_id: userId, is_active: true });
    const now = new Date();
    
    return roles.some(role => 
      roleIds.includes(role.role_id) &&
      (!role.expires_at || new Date(role.expires_at) > now)
    );
  },

  /**
   * Get user statistics
   */
  getUserStats: async (userId: string): Promise<{
    total: number;
    active: number;
    expired: number;
    expiring_soon: number;
    by_scope: Record<UserRoleScope, number>;
  }> => {
    const roles = await adapter.getAll({ user_id: userId });
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const byScope: Record<string, number> = {
      global: 0,
      tenant: 0,
      department: 0,
      project: 0,
    };

    let expired = 0;
    let expiringSoon = 0;

    roles.forEach(role => {
      byScope[role.scope] = (byScope[role.scope] || 0) + 1;

      if (role.expires_at) {
        const expiresAt = new Date(role.expires_at);
        if (expiresAt < now) {
          expired++;
        } else if (expiresAt <= sevenDaysFromNow) {
          expiringSoon++;
        }
      }
    });

    return {
      total: roles.length,
      active: roles.filter(r => r.is_active).length,
      expired,
      expiring_soon: expiringSoon,
      by_scope: byScope as Record<UserRoleScope, number>,
    };
  },

  /**
   * Bulk grant roles
   */
  bulkGrant: async (userIds: string[], roleId: string, grantedBy?: string): Promise<void> => {
    await Promise.all(
      userIds.map(userId => 
        userRolesApi.grantRole({
          user_id: userId,
          role_id: roleId,
          granted_by: grantedBy,
        })
      )
    );
  },

  /**
   * Bulk revoke roles
   */
  bulkRevoke: async (userRoleIds: string[]): Promise<void> => {
    await Promise.all(
      userRoleIds.map(id => adapter.delete(id))
    );
  },

  /**
   * Cleanup expired roles
   */
  cleanupExpired: async (): Promise<number> => {
    const expired = await userRolesApi.getExpiredRoles();
    await Promise.all(
      expired.map(role => adapter.update(role._id, { is_active: false }))
    );
    return expired.length;
  },
};

export default userRolesApi;