/**
 * User Roles API Client
 * 
 * ✅ FIXED 2026-01-14:
 * - Added all missing fields (8 fields): scope, scope_id, granted_by, granted_at, expires_at, is_active, created_at, updated_at
 * - Fixed field names: assigned_at → granted_at, assigned_by → granted_by
 * - Added scope system fields (scope, scope_id)
 * - Match 100% database schema (13 fields)
 */
import { createAdapter, BaseFilters } from './adapters';

// ==================== TYPES ====================

/**
 * Scope types for user role assignments
 * - global: System-wide role
 * - tenant: Tenant-specific role
 * - department: Department-specific role
 * - project: Project-specific role
 */
export type UserRoleScope = 'global' | 'tenant' | 'department' | 'project';

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
};

export default userRolesApi;