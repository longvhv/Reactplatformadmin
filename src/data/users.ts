/**
 * Users Data Layer
 * 
 * User management data structures aligned with go-framework database schema
 */

// User role types
export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'USER' | 'MODERATOR' | 'VIEWER';

// User status types
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING';

// Main User interface matching go-framework schema
export interface User {
  // Primary fields
  _id: string;  // UUID PRIMARY KEY
  email: string;  // VARCHAR(255) UNIQUE NOT NULL
  password_hash: string;  // VARCHAR(255) NOT NULL
  name: string;  // VARCHAR(255) NOT NULL
  
  // Profile fields
  avatar?: string;  // TEXT NULLABLE
  phone?: string;  // VARCHAR(20) NULLABLE
  location?: string;  // VARCHAR(255) NULLABLE
  department?: string;  // VARCHAR(100) NULLABLE
  position?: string;  // VARCHAR(100) NULLABLE
  bio?: string;  // TEXT NULLABLE
  
  // Account settings
  role: UserRole;  // VARCHAR(50) NOT NULL, default 'USER'
  status: UserStatus;  // VARCHAR(20) NOT NULL, default 'ACTIVE'
  email_verified: boolean;  // BOOLEAN NOT NULL, default false
  last_login_at?: string;  // TIMESTAMPTZ NULLABLE
  
  // Multi-tenant support
  tenant_id?: string;  // UUID NULLABLE (NULL = platform admin)
  
  // Audit trail (go-framework standard)
  created_at: string;  // TIMESTAMPTZ NOT NULL
  updated_at: string;  // TIMESTAMPTZ NOT NULL
  created_by?: string;  // UUID NULLABLE
  updated_by?: string;  // UUID NULLABLE
  deleted_at?: string;  // TIMESTAMPTZ NULLABLE (soft delete)
  deleted_by?: string;  // UUID NULLABLE
  
  // Optimistic locking
  version: number;  // BIGINT NOT NULL, default 1
}

// Create user input (for API)
export interface CreateUserInput {
  email: string;
  password: string;  // Plain password (will be hashed server-side)
  name: string;
  avatar?: string;
  phone?: string;
  location?: string;
  department?: string;
  position?: string;
  bio?: string;
  role?: UserRole;
  status?: UserStatus;
  tenant_id?: string;
}

// Update user input (for API)
export interface UpdateUserInput {
  email?: string;
  password?: string;  // Plain password (will be hashed server-side)
  name?: string;
  avatar?: string;
  phone?: string;
  location?: string;
  department?: string;
  position?: string;
  bio?: string;
  role?: UserRole;
  status?: UserStatus;
  email_verified?: boolean;
  version?: number;  // For optimistic locking
}

// User list item (for frontend display)
export interface UserListItem extends Omit<User, 'password_hash'> {
  // Computed fields
  displayName: string;
  isOnline?: boolean;
  lastSeenAt?: string;
}

// User stats
export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  suspended: number;
  pending: number;
  admins: number;
  users: number;
  newThisMonth: number;
}
