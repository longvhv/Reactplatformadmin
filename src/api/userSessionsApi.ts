/**
 * User Sessions API Client
 * Uses Adapter pattern - Ready for Golang migration
 * 
 * ✅ ENHANCED 2026-01-16: 100% database alignment + Type helpers
 * Database: user_sessions (14 fields, device tracking, security features)
 */
import { createAdapter, BaseFilters } from './adapters';

// ==================== TYPE HELPERS ====================

export const DeviceTypeHelper = {
  DESKTOP: 'desktop' as DeviceType,
  MOBILE: 'mobile' as DeviceType,
  TABLET: 'tablet' as DeviceType,
  SMART_TV: 'smart_tv' as DeviceType,
  WATCH: 'watch' as DeviceType,
  OTHER: 'other' as DeviceType,

  isDesktop: (type?: DeviceType | null) => type === 'desktop',
  isMobile: (type?: DeviceType | null) => type === 'mobile',
  isTablet: (type?: DeviceType | null) => type === 'tablet',
  isSmartTV: (type?: DeviceType | null) => type === 'smart_tv',
  isWatch: (type?: DeviceType | null) => type === 'watch',
  isOther: (type?: DeviceType | null) => type === 'other',

  // Group checks
  isMobileDevice: (type?: DeviceType | null) => type === 'mobile' || type === 'tablet' || type === 'watch',
  isDesktopDevice: (type?: DeviceType | null) => type === 'desktop',
  isTVDevice: (type?: DeviceType | null) => type === 'smart_tv',
  isPortable: (type?: DeviceType | null) => type === 'mobile' || type === 'tablet' || type === 'watch',
};

export const SessionStatusHelper = {
  isActive: (session: UserSession) => session.is_active === true,
  isInactive: (session: UserSession) => session.is_active === false,
  isExpired: (session: UserSession) => {
    if (!session.expires_at) return false;
    return new Date(session.expires_at) < new Date();
  },
  isValid: (session: UserSession) => {
    return session.is_active === true && !SessionStatusHelper.isExpired(session);
  },
  isIdle: (session: UserSession, idleMinutes: number = 30) => {
    if (!session.last_activity_at) return true;
    const idleTime = Date.now() - new Date(session.last_activity_at).getTime();
    return idleTime > idleMinutes * 60 * 1000;
  },
  getIdleMinutes: (session: UserSession) => {
    if (!session.last_activity_at) return 0;
    const idleTime = Date.now() - new Date(session.last_activity_at).getTime();
    return Math.floor(idleTime / (60 * 1000));
  },
  getRemainingMinutes: (session: UserSession) => {
    if (!session.expires_at) return Infinity;
    const remaining = new Date(session.expires_at).getTime() - Date.now();
    return Math.max(0, Math.floor(remaining / (60 * 1000)));
  },
};

// ==================== ENUMS ====================

export type DeviceType = 'desktop' | 'mobile' | 'tablet' | 'smart_tv' | 'watch' | 'other';

export const DEVICE_TYPES: DeviceType[] = ['desktop', 'mobile', 'tablet', 'smart_tv', 'watch', 'other'];

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

  /**
   * Get session by token
   */
  getByToken: async (sessionToken: string): Promise<UserSession | null> => {
    const sessions = await adapter.getAll({});
    return sessions.find(s => s.session_token === sessionToken) || null;
  },

  /**
   * Get sessions by device type
   */
  getByDeviceType: async (userId: string, deviceType: DeviceType): Promise<UserSession[]> => {
    return adapter.getAll({ user_id: userId, device_type: deviceType });
  },

  /**
   * Get mobile sessions
   */
  getMobileSessions: async (userId: string): Promise<UserSession[]> => {
    const sessions = await adapter.getAll({ user_id: userId });
    return sessions.filter(s => 
      DeviceTypeHelper.isMobileDevice(s.device_type as DeviceType)
    );
  },

  /**
   * Get desktop sessions
   */
  getDesktopSessions: async (userId: string): Promise<UserSession[]> => {
    return adapter.getAll({ user_id: userId, device_type: 'desktop' });
  },

  /**
   * Get expired sessions
   */
  getExpiredSessions: async (userId?: string): Promise<UserSession[]> => {
    const sessions = userId 
      ? await adapter.getAll({ user_id: userId })
      : await adapter.getAll({});
    
    return sessions.filter(SessionStatusHelper.isExpired);
  },

  /**
   * Get idle sessions (no activity for X minutes)
   */
  getIdleSessions: async (userId: string, idleMinutes: number = 30): Promise<UserSession[]> => {
    const sessions = await adapter.getAll({ user_id: userId, is_active: true });
    return sessions.filter(s => SessionStatusHelper.isIdle(s, idleMinutes));
  },

  /**
   * Get valid sessions (active and not expired)
   */
  getValidSessions: async (userId: string): Promise<UserSession[]> => {
    const sessions = await adapter.getAll({ user_id: userId, is_active: true });
    return sessions.filter(SessionStatusHelper.isValid);
  },

  /**
   * Revoke all sessions for a user
   */
  revokeAllUserSessions: async (userId: string): Promise<void> => {
    const sessions = await adapter.getAll({ user_id: userId, is_active: true });
    await Promise.all(
      sessions.map(session => adapter.update(session._id, { is_active: false }))
    );
  },

  /**
   * Revoke all sessions except current
   */
  revokeOtherSessions: async (userId: string, currentSessionId: string): Promise<void> => {
    const sessions = await adapter.getAll({ user_id: userId, is_active: true });
    await Promise.all(
      sessions
        .filter(s => s._id !== currentSessionId)
        .map(s => adapter.update(s._id, { is_active: false }))
    );
  },

  /**
   * Revoke sessions by device type
   */
  revokeByDeviceType: async (userId: string, deviceType: DeviceType): Promise<void> => {
    const sessions = await userSessionsApi.getByDeviceType(userId, deviceType);
    await Promise.all(
      sessions
        .filter(s => s.is_active)
        .map(s => adapter.update(s._id, { is_active: false }))
    );
  },

  /**
   * Extend session expiration
   */
  extendExpiration: async (id: string, minutes: number): Promise<UserSession> => {
    const expiresAt = new Date(Date.now() + minutes * 60 * 1000).toISOString();
    return adapter.update(id, { expires_at: expiresAt });
  },

  /**
   * Remove expiration (make session permanent until revoked)
   */
  removExpiration: async (id: string): Promise<UserSession> => {
    return adapter.update(id, { expires_at: null });
  },

  /**
   * Cleanup expired sessions (set inactive)
   */
  cleanupExpired: async (userId?: string): Promise<number> => {
    const expired = await userSessionsApi.getExpiredSessions(userId);
    await Promise.all(
      expired
        .filter(s => s.is_active)
        .map(s => adapter.update(s._id, { is_active: false }))
    );
    return expired.length;
  },

  /**
   * Cleanup idle sessions
   */
  cleanupIdle: async (userId: string, idleMinutes: number = 30): Promise<number> => {
    const idle = await userSessionsApi.getIdleSessions(userId, idleMinutes);
    await Promise.all(
      idle.map(s => adapter.update(s._id, { is_active: false }))
    );
    return idle.length;
  },

  /**
   * Get user session statistics
   */
  getUserStats: async (userId: string): Promise<{
    total: number;
    active: number;
    expired: number;
    idle: number;
    by_device: Record<string, number>;
    by_browser: Record<string, number>;
    by_os: Record<string, number>;
    total_sessions_created: number;
    last_activity?: string;
  }> => {
    const allSessions = await adapter.getAll({ user_id: userId });
    const activeSessions = allSessions.filter(s => s.is_active);

    const byDevice: Record<string, number> = {};
    const byBrowser: Record<string, number> = {};
    const byOS: Record<string, number> = {};

    activeSessions.forEach(s => {
      if (s.device_type) {
        byDevice[s.device_type] = (byDevice[s.device_type] || 0) + 1;
      }
      if (s.browser) {
        byBrowser[s.browser] = (byBrowser[s.browser] || 0) + 1;
      }
      if (s.os) {
        byOS[s.os] = (byOS[s.os] || 0) + 1;
      }
    });

    const lastActivities = activeSessions
      .map(s => s.last_activity_at)
      .filter(Boolean) as string[];
    const lastActivity = lastActivities.length > 0
      ? lastActivities.sort().reverse()[0]
      : undefined;

    const expired = allSessions.filter(SessionStatusHelper.isExpired).length;
    const idle = activeSessions.filter(s => SessionStatusHelper.isIdle(s, 30)).length;

    return {
      total: allSessions.length,
      active: activeSessions.length,
      expired,
      idle,
      by_device: byDevice,
      by_browser: byBrowser,
      by_os: byOS,
      total_sessions_created: allSessions.length,
      last_activity: lastActivity,
    };
  },

  /**
   * Get session info with status
   */
  getSessionInfo: async (id: string): Promise<{
    session: UserSession;
    isActive: boolean;
    isExpired: boolean;
    isIdle: boolean;
    isValid: boolean;
    idleMinutes: number;
    remainingMinutes: number;
  }> => {
    const session = await adapter.getById(id);
    
    return {
      session,
      isActive: SessionStatusHelper.isActive(session),
      isExpired: SessionStatusHelper.isExpired(session),
      isIdle: SessionStatusHelper.isIdle(session),
      isValid: SessionStatusHelper.isValid(session),
      idleMinutes: SessionStatusHelper.getIdleMinutes(session),
      remainingMinutes: SessionStatusHelper.getRemainingMinutes(session),
    };
  },

  /**
   * Check if session is valid
   */
  isSessionValid: async (sessionToken: string): Promise<boolean> => {
    const session = await userSessionsApi.getByToken(sessionToken);
    if (!session) return false;
    return SessionStatusHelper.isValid(session);
  },

  /**
   * Refresh session (update activity and extend expiration)
   */
  refreshSession: async (id: string, extendMinutes: number = 60): Promise<UserSession> => {
    const expiresAt = new Date(Date.now() + extendMinutes * 60 * 1000).toISOString();
    return adapter.update(id, {
      last_activity_at: new Date().toISOString(),
      expires_at: expiresAt,
    });
  },

  /**
   * Get sessions by IP address
   */
  getByIPAddress: async (userId: string, ipAddress: string): Promise<UserSession[]> => {
    const sessions = await adapter.getAll({ user_id: userId });
    return sessions.filter(s => s.ip_address === ipAddress);
  },

  /**
   * Get sessions by location
   */
  getByLocation: async (userId: string, location: string): Promise<UserSession[]> => {
    const sessions = await adapter.getAll({ user_id: userId });
    return sessions.filter(s => s.location?.includes(location));
  },

  /**
   * Detect suspicious sessions (multiple locations/IPs)
   */
  getSuspiciousSessions: async (userId: string): Promise<{
    multipleLocations: UserSession[];
    multipleIPs: UserSession[];
    unknownDevices: UserSession[];
  }> => {
    const sessions = await userSessionsApi.getValidSessions(userId);
    
    const locations = new Set(sessions.map(s => s.location).filter(Boolean));
    const ips = new Set(sessions.map(s => s.ip_address).filter(Boolean));

    return {
      multipleLocations: locations.size > 1 ? sessions.filter(s => s.location) : [],
      multipleIPs: ips.size > 3 ? sessions.filter(s => s.ip_address) : [],
      unknownDevices: sessions.filter(s => !s.device_name || !s.device_type),
    };
  },

  /**
   * Bulk revoke sessions
   */
  bulkRevoke: async (sessionIds: string[]): Promise<void> => {
    await Promise.all(
      sessionIds.map(id => adapter.update(id, { is_active: false }))
    );
  },

  /**
   * Hard delete session
   */
  hardDelete: async (id: string): Promise<void> => {
    return adapter.delete(id);
  },

  /**
   * Count active sessions
   */
  countActiveSessions: async (userId: string): Promise<number> => {
    const sessions = await adapter.getAll({ user_id: userId, is_active: true });
    return sessions.filter(SessionStatusHelper.isValid).length;
  },

  /**
   * Check if user has reached session limit
   */
  hasReachedLimit: async (userId: string, maxSessions: number = 10): Promise<boolean> => {
    const count = await userSessionsApi.countActiveSessions(userId);
    return count >= maxSessions;
  },

  /**
   * Remove oldest sessions if limit exceeded
   */
  enforceLimit: async (userId: string, maxSessions: number = 10): Promise<number> => {
    const sessions = await userSessionsApi.getValidSessions(userId);
    
    if (sessions.length <= maxSessions) return 0;

    // Sort by last_activity_at, oldest first
    const sorted = sessions.sort((a, b) => {
      const timeA = a.last_activity_at ? new Date(a.last_activity_at).getTime() : 0;
      const timeB = b.last_activity_at ? new Date(b.last_activity_at).getTime() : 0;
      return timeA - timeB;
    });

    const toRevoke = sorted.slice(0, sessions.length - maxSessions);
    await Promise.all(
      toRevoke.map(s => adapter.update(s._id, { is_active: false }))
    );

    return toRevoke.length;
  },
};

export default userSessionsApi;