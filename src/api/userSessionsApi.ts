/**
 * User Sessions API Client
 * ✅ FIXED 2026-01-14: Schema now matches 100% with database (14 fields)
 */
import { createAdapter, BaseFilters } from './adapters';

// UserSession interface - MATCHES database schema 100%
export interface UserSession {
  // I. IDENTITY (2)
  _id: string;                          // uuid PRIMARY KEY
  user_id: string;                      // uuid FK to users
  
  // II. SESSION TOKEN (1)
  session_token: string;                // varchar(255) UNIQUE - ✅ Fixed from 'token'
  
  // III. DEVICE INFORMATION (4) - ✅ Added missing fields
  device_name?: string | null;          // varchar(255) - Device name/model
  device_type?: string | null;          // varchar(50) - desktop/mobile/tablet
  browser?: string | null;              // varchar(100) - Browser name
  os?: string | null;                   // varchar(100) - Operating system
  
  // IV. LOCATION & NETWORK (2)
  ip_address?: string | null;           // inet - IP address
  location?: string | null;             // varchar(255) - ✅ Added missing field
  
  // V. STATUS & TIMESTAMPS (5)
  is_active?: boolean | null;           // boolean DEFAULT true
  last_activity_at?: string | null;    // timestamptz DEFAULT now()
  expires_at?: string | null;           // timestamptz
  created_at?: string | null;           // timestamptz DEFAULT now()
  updated_at?: string | null;           // timestamptz DEFAULT now() - ✅ Added missing field
}

// Create request - includes only necessary fields
export interface CreateSessionRequest {
  user_id: string;
  session_token: string;                // ✅ Fixed from 'token'
  device_name?: string;                 // ✅ Added
  device_type?: string;                 // ✅ Added
  browser?: string;                     // ✅ Added
  os?: string;                          // ✅ Added
  ip_address?: string;
  location?: string;                    // ✅ Added
  expires_at?: string;
}

// Update request
export interface UpdateSessionRequest {
  device_name?: string;
  device_type?: string;
  browser?: string;
  os?: string;
  ip_address?: string;
  location?: string;
  is_active?: boolean;
  last_activity_at?: string;
  expires_at?: string;
  version?: number;
}

export interface SessionFilters extends BaseFilters {
  user_id?: string;
  is_active?: boolean;
  device_type?: string;               // ✅ Added
}

const adapter = createAdapter<UserSession, CreateSessionRequest, UpdateSessionRequest>(
  'user_sessions',
  '/user-sessions'
);

export const userSessionsApi = {
  getAll: (filters?: SessionFilters) => adapter.getAll(filters),
  getById: (id: string) => adapter.getById(id),
  create: (data: CreateSessionRequest) => adapter.create(data),
  update: (id: string, data: UpdateSessionRequest) => adapter.update(id, data),
  delete: (id: string) => adapter.delete(id),
  
  /**
   * Get sessions by user ID
   */
  getByUserId: async (userId: string): Promise<UserSession[]> => {
    return adapter.getAll({ user_id: userId });
  },
  
  /**
   * Get active sessions for a user
   */
  getActiveByUserId: async (userId: string): Promise<UserSession[]> => {
    return adapter.getAll({ user_id: userId, is_active: true });
  },
  
  /**
   * Revoke a session (set is_active to false)
   */
  revokeSession: async (id: string): Promise<UserSession> => {
    return adapter.update(id, { is_active: false });
  },
  
  /**
   * Update session activity
   */
  updateActivity: async (id: string): Promise<UserSession> => {
    return adapter.update(id, { 
      last_activity_at: new Date().toISOString() 
    });
  },
};

export default userSessionsApi;