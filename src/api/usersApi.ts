/**
 * Users API Client
 * Uses Adapter pattern - Ready for Golang migration
 */

import { createAdapter, BaseFilters } from './adapters';

// ==================== TYPES ====================

export interface User {
  _id: string;
  email: string;
  password_hash?: string; // Should never be returned to client, but included for completeness
  full_name: string;
  avatar_url?: string;
  phone_number?: string; // Changed from phone to match database
  status: 'ACTIVE' | 'BANNED' | 'DISABLED' | 'PENDING'; // Fixed to match database constraints
  is_support_staff: boolean; // Added
  mfa_enabled: boolean; // Added
  mfa_secret?: string; // Should never be returned to client
  is_verified: boolean; // Added - database field
  locale: string; // Added
  metadata: Record<string, any>; // Not optional in database
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  // Note: database doesn't have version field, removed from interface
}

export interface CreateUserRequest {
  email: string;
  full_name: string;
  phone_number?: string; // Changed from phone
  password?: string; // Made optional since password_hash is handled server-side
  avatar_url?: string;
  is_support_staff?: boolean;
  locale?: string;
  metadata?: Record<string, any>;
}

export interface UpdateUserRequest {
  email?: string;
  full_name?: string;
  phone_number?: string; // Changed from phone
  avatar_url?: string;
  status?: 'ACTIVE' | 'BANNED' | 'DISABLED' | 'PENDING'; // Fixed values
  is_support_staff?: boolean;
  mfa_enabled?: boolean;
  locale?: string;
  metadata?: Record<string, any>;
  // Removed version since database doesn't have it
}

export interface UserFilters extends BaseFilters {
  status?: string;
  is_verified?: boolean; // Changed from email_verified
  is_support_staff?: boolean;
  mfa_enabled?: boolean;
}

// ==================== ADAPTER ====================

const adapter = createAdapter<User, CreateUserRequest, UpdateUserRequest>(
  'users',
  '/users'
);

// ==================== API CLIENT ====================

export const usersApi = {
  /**
   * GET /users
   */
  getAll: async (filters?: UserFilters): Promise<User[]> => {
    return adapter.getAll(filters);
  },

  /**
   * GET /users/:id
   */
  getById: async (id: string): Promise<User> => {
    return adapter.getById(id);
  },

  /**
   * POST /users
   */
  create: async (data: CreateUserRequest): Promise<User> => {
    return adapter.create(data);
  },

  /**
   * PATCH /users/:id
   */
  update: async (id: string, data: UpdateUserRequest): Promise<User> => {
    return adapter.update(id, data);
  },

  /**
   * DELETE /users/:id
   */
  delete: async (id: string): Promise<void> => {
    return adapter.delete(id);
  },

  /**
   * PATCH /users/:id/status
   */
  updateStatus: async (id: string, status: User['status']): Promise<User> => {
    return adapter.update(id, { status } as UpdateUserRequest);
  },

  /**
   * POST /users/:id/verify-email
   * TODO (Golang): Implement verification endpoint
   */
  verifyEmail: async (id: string, token: string): Promise<void> => {
    throw new Error('Not implemented - migrate to Golang');
  },

  /**
   * POST /users/:id/verify-phone
   * TODO (Golang): Implement verification endpoint
   */
  verifyPhone: async (id: string, code: string): Promise<void> => {
    throw new Error('Not implemented - migrate to Golang');
  },
};

export default usersApi;