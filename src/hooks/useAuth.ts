/**
 * useAuth Hook
 * Manages authentication and session management
 * 
 * MIGRATED: Now uses DataClient abstraction layer
 * - Easy to switch between Supabase and Golang API
 * - Consistent pattern across all hooks
 * - Type-safe with generics
 * 
 * Schema:
 * - users: _id, email, password_hash, status, mfa_enabled, is_verified
 * - telemetry.auth_logs: action, status, ip_address, user_agent
 * - user_sessions: session_token, device_info, is_active
 */

import { useState, useEffect, useCallback } from 'react';
import { useDataClient } from './useDataClient';

/**
 * User type (from users table)
 */
export interface User {
  _id: string;
  email: string;
  password_hash?: string; // Never expose to client
  full_name: string;
  avatar_url?: string;
  phone_number?: string;
  status: 'ACTIVE' | 'BANNED' | 'DISABLED' | 'PENDING';
  is_support_staff: boolean;
  mfa_enabled: boolean;
  mfa_secret?: string; // Never expose to client
  is_verified: boolean;
  locale: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

/**
 * Session type (from user_sessions table)
 */
export interface UserSession {
  _id: string;
  user_id: string;
  session_token: string;
  device_name?: string;
  device_type?: string;
  browser?: string;
  os?: string;
  ip_address?: string;
  location?: string;
  is_active: boolean;
  last_activity_at: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Auth log type (from telemetry.auth_logs)
 */
export interface AuthLog {
  _id: string;
  user_id?: string;
  tenant_id?: string;
  action: string; // 'LOGIN' | 'LOGOUT' | 'SIGNUP' | 'PASSWORD_RESET' | 'MFA_VERIFY'
  status: string; // 'SUCCESS' | 'FAILURE'
  ip_address?: string;
  user_agent?: string;
  browser?: string;
  os?: string;
  device_type?: string;
  location?: string;
  country_code?: string;
  error_message?: string;
  metadata?: any;
  created_at: string;
}

/**
 * Login credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
  remember?: boolean;
}

/**
 * Signup data
 */
export interface SignupData {
  email: string;
  password: string;
  full_name: string;
  phone_number?: string;
}

/**
 * Hook for authentication management
 */
export function useAuth() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Get DataClient instance
  const dataClient = useDataClient();

  /**
   * Check for existing session on mount
   */
  const checkSession = useCallback(async () => {
    if (!dataClient) {
      console.log('[useAuth] Waiting for DataClient to initialize...');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('[useAuth] Checking for existing session...');

      // Try to get session from localStorage
      const sessionToken = localStorage.getItem('session_token');
      
      if (!sessionToken) {
        console.log('[useAuth] No session token found');
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      // Query session using DataClient
      const sessionsResult = await dataClient.query<UserSession>('user_sessions', {
        filters: { 
          session_token: sessionToken,
          is_active: true,
        },
        limit: 1,
      });

      const activeSession = sessionsResult.data[0];

      if (!activeSession) {
        console.log('[useAuth] Session not found or expired');
        localStorage.removeItem('session_token');
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      // Check if session is expired
      if (activeSession.expires_at) {
        const expiresAt = new Date(activeSession.expires_at);
        if (expiresAt < new Date()) {
          console.log('[useAuth] Session expired');
          localStorage.removeItem('session_token');
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }
      }

      // Get user data
      const user = await dataClient.get<User>('users', activeSession.user_id);

      if (!user) {
        console.log('[useAuth] User not found');
        localStorage.removeItem('session_token');
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      // Check user status
      if (user.status !== 'ACTIVE') {
        console.log('[useAuth] User account is not active:', user.status);
        localStorage.removeItem('session_token');
        setIsAuthenticated(false);
        setError(`Account is ${user.status.toLowerCase()}`);
        setLoading(false);
        return;
      }

      console.log('[useAuth] Session validated for user:', user.email);

      // Set authenticated state
      setCurrentUser(user);
      setSession(activeSession);
      setIsAuthenticated(true);
      setLoading(false);

      // Update last activity
      await updateSessionActivity(activeSession._id);
    } catch (err) {
      console.error('[useAuth] Error checking session:', err);
      setError(err instanceof Error ? err.message : 'Failed to check session');
      setIsAuthenticated(false);
      setLoading(false);
    }
  }, [dataClient]);

  /**
   * Update session last activity
   */
  const updateSessionActivity = async (sessionId: string) => {
    if (!dataClient) return;

    try {
      await dataClient.update<UserSession>('user_sessions', sessionId, {
        last_activity_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error('[useAuth] Error updating session activity:', err);
      // Don't throw - this is non-critical
    }
  };

  /**
   * Login with email and password
   * 
   * TODO: In production, this should call Supabase Auth or Golang Auth API
   * For now, we simulate the flow
   */
  const login = useCallback(
    async (credentials: LoginCredentials): Promise<void> => {
      if (!dataClient) {
        throw new Error('DataClient not initialized');
      }

      setError(null);

      try {
        console.log('[useAuth] Attempting login for:', credentials.email);

        // TODO: Replace with actual auth endpoint
        // For now, we query users table directly (NOT secure for production!)
        const usersResult = await dataClient.query<User>('users', {
          filters: { email: credentials.email },
          limit: 1,
        });

        const user = usersResult.data[0];

        if (!user) {
          // Log failed attempt
          await logAuthEvent({
            action: 'LOGIN',
            status: 'FAILURE',
            error_message: 'User not found',
          });

          throw new Error('Invalid credentials');
        }

        // TODO: Verify password hash (should be done server-side!)
        // This is a PLACEHOLDER - never verify passwords client-side!

        // Check user status
        if (user.status !== 'ACTIVE') {
          await logAuthEvent({
            user_id: user._id,
            action: 'LOGIN',
            status: 'FAILURE',
            error_message: `User status is ${user.status}`,
          });

          throw new Error(`Account is ${user.status.toLowerCase()}`);
        }

        // Create session
        const newSession = await dataClient.create<UserSession>('user_sessions', {
          user_id: user._id,
          session_token: generateSessionToken(),
          device_name: navigator.userAgent,
          device_type: getDeviceType(),
          browser: getBrowser(),
          os: getOS(),
          ip_address: await getClientIP(),
          is_active: true,
          last_activity_at: new Date().toISOString(),
          expires_at: credentials.remember
            ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
            : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        });

        // Store session token
        localStorage.setItem('session_token', newSession.session_token);

        // Log successful login
        await logAuthEvent({
          user_id: user._id,
          action: 'LOGIN',
          status: 'SUCCESS',
        });

        console.log('[useAuth] Login successful for:', user.email);

        // Set authenticated state
        setCurrentUser(user);
        setSession(newSession);
        setIsAuthenticated(true);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Login failed';
        setError(message);
        console.error('[useAuth] Login error:', err);
        throw new Error(message);
      }
    },
    [dataClient]
  );

  /**
   * Logout current user
   */
  const logout = useCallback(async (): Promise<void> => {
    if (!dataClient || !session) {
      localStorage.removeItem('session_token');
      setCurrentUser(null);
      setSession(null);
      setIsAuthenticated(false);
      return;
    }

    setError(null);

    try {
      console.log('[useAuth] Logging out...');

      // Deactivate session
      await dataClient.update<UserSession>('user_sessions', session._id, {
        is_active: false,
      });

      // Log logout event
      if (currentUser) {
        await logAuthEvent({
          user_id: currentUser._id,
          action: 'LOGOUT',
          status: 'SUCCESS',
        });
      }

      // Clear local state
      localStorage.removeItem('session_token');
      setCurrentUser(null);
      setSession(null);
      setIsAuthenticated(false);

      console.log('[useAuth] Logout successful');
    } catch (err) {
      console.error('[useAuth] Logout error:', err);
      // Even if logout fails, clear local state
      localStorage.removeItem('session_token');
      setCurrentUser(null);
      setSession(null);
      setIsAuthenticated(false);
    }
  }, [dataClient, session, currentUser]);

  /**
   * Signup new user
   * 
   * TODO: Should call auth endpoint, not create user directly
   */
  const signup = useCallback(
    async (data: SignupData): Promise<User> => {
      if (!dataClient) {
        throw new Error('DataClient not initialized');
      }

      setError(null);

      try {
        console.log('[useAuth] Creating new user:', data.email);

        // Check if user already exists
        const existingResult = await dataClient.query<User>('users', {
          filters: { email: data.email },
          limit: 1,
        });

        if (existingResult.data.length > 0) {
          throw new Error('Email already registered');
        }

        // TODO: Hash password server-side!
        // This is a PLACEHOLDER - never handle passwords client-side!

        // Create user
        const newUser = await dataClient.create<User>('users', {
          email: data.email,
          full_name: data.full_name,
          phone_number: data.phone_number,
          status: 'PENDING',
          is_support_staff: false,
          mfa_enabled: false,
          is_verified: false,
          locale: 'vi-VN',
          // password_hash should be created server-side
        });

        // Log signup event
        await logAuthEvent({
          user_id: newUser._id,
          action: 'SIGNUP',
          status: 'SUCCESS',
        });

        console.log('[useAuth] User created:', newUser._id);

        return newUser;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Signup failed';
        setError(message);
        console.error('[useAuth] Signup error:', err);
        throw new Error(message);
      }
    },
    [dataClient]
  );

  /**
   * Log authentication event
   */
  const logAuthEvent = async (event: Partial<AuthLog>): Promise<void> => {
    if (!dataClient) return;

    try {
      await dataClient.create<AuthLog>('auth_logs', {
        action: event.action || 'UNKNOWN',
        status: event.status || 'UNKNOWN',
        user_id: event.user_id,
        tenant_id: event.tenant_id,
        ip_address: event.ip_address || (await getClientIP()),
        user_agent: navigator.userAgent,
        browser: getBrowser(),
        os: getOS(),
        device_type: getDeviceType(),
        error_message: event.error_message,
        metadata: event.metadata,
        created_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error('[useAuth] Error logging auth event:', err);
      // Don't throw - logging should not break auth flow
    }
  };

  /**
   * Get recent auth logs for current user
   */
  const getAuthLogs = useCallback(
    async (limit: number = 10): Promise<AuthLog[]> => {
      if (!dataClient || !currentUser) {
        return [];
      }

      try {
        const result = await dataClient.query<AuthLog>('auth_logs', {
          filters: { user_id: currentUser._id },
          orderBy: [{ field: 'created_at', direction: 'desc' }],
          limit,
        });

        return result.data;
      } catch (err) {
        console.error('[useAuth] Error fetching auth logs:', err);
        return [];
      }
    },
    [dataClient, currentUser]
  );

  /**
   * Update current user profile
   */
  const updateProfile = useCallback(
    async (updates: Partial<User>): Promise<User> => {
      if (!dataClient || !currentUser) {
        throw new Error('Not authenticated');
      }

      setError(null);

      try {
        console.log('[useAuth] Updating user profile:', currentUser._id);

        const updatedUser = await dataClient.update<User>(
          'users',
          currentUser._id,
          updates
        );

        console.log('[useAuth] Profile updated');

        setCurrentUser(updatedUser);
        return updatedUser;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update profile';
        setError(message);
        console.error('[useAuth] Error updating profile:', err);
        throw new Error(message);
      }
    },
    [dataClient, currentUser]
  );

  /**
   * Refresh current user data
   */
  const refreshUser = useCallback(async (): Promise<void> => {
    if (!dataClient || !currentUser) {
      return;
    }

    try {
      const user = await dataClient.get<User>('users', currentUser._id);
      if (user) {
        setCurrentUser(user);
      }
    } catch (err) {
      console.error('[useAuth] Error refreshing user:', err);
    }
  }, [dataClient, currentUser]);

  // Auto-check session on mount
  useEffect(() => {
    if (dataClient) {
      console.log('[useAuth] Auto-checking session...');
      checkSession();
    }
  }, [dataClient]); // Only depend on dataClient

  return {
    currentUser,
    session,
    loading,
    error,
    isAuthenticated,
    login,
    logout,
    signup,
    checkSession,
    getAuthLogs,
    updateProfile,
    refreshUser,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate random session token
 */
function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Get device type from user agent
 */
function getDeviceType(): string {
  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
}

/**
 * Get browser name from user agent
 */
function getBrowser(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('Edge')) return 'Edge';
  if (ua.includes('Opera')) return 'Opera';
  return 'Unknown';
}

/**
 * Get OS name from user agent
 */
function getOS(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Win')) return 'Windows';
  if (ua.includes('Mac')) return 'macOS';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iOS')) return 'iOS';
  return 'Unknown';
}

/**
 * Get client IP address
 * TODO: This should be done server-side
 */
async function getClientIP(): Promise<string> {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch {
    return 'unknown';
  }
}
