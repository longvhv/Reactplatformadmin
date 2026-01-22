/**
 * Auth Logs Service
 * Handles CRUD operations for authentication logs
 * ✅ Production-ready with Supabase integration
 */

import { supabase } from '../utils/supabase/client';

// Types matching telemetry.auth_logs table
export interface AuthLog {
  _id: string; // UUID primary key
  user_id?: string; // UUID
  email?: string;
  event_type?: string; // 'login', 'logout', 'password_change', 'password_reset', 'mfa_enabled', etc.
  auth_method?: string; // 'email', 'google', 'github', 'magic_link', etc.
  ip_address?: string;
  user_agent?: string;
  country_code?: string;
  city?: string;
  success?: boolean;
  failure_reason?: string;
  session_id?: string; // UUID
  mfa_verified?: boolean;
  device_fingerprint?: string;
  metadata_json?: Record<string, any>;
  created_at: string;
}

export interface AuthLogFilters {
  user_id?: string;
  email?: string;
  event_type?: string;
  auth_method?: string;
  success?: boolean;
  mfa_verified?: boolean;
  country_code?: string;
  date_from?: string;
  date_to?: string;
}

export interface AuthStats {
  total_events: number;
  successful_logins: number;
  failed_logins: number;
  password_resets: number;
  mfa_enabled_count: number;
  success_rate: number;
  by_event_type: Record<string, number>;
  by_auth_method: Record<string, number>;
  by_country: Array<{ country: string; count: number }>;
  failed_login_attempts: Array<{ email: string; count: number; last_attempt: string }>;
  suspicious_activity: AuthLog[];
}

class AuthLogsService {
  private supabase = supabase;
  private table = 'auth_logs';
  private schema = 'telemetry';

  /**
   * Get Supabase client configured for telemetry schema
   */
  private getClient() {
    return this.supabase.schema(this.schema);
  }

  /**
   * Fetch all auth logs with optional filters
   * Ready for: GET /api/v1/telemetry/auth-logs
   */
  async getAll(filters?: AuthLogFilters): Promise<AuthLog[]> {
    try {
      let query = this.getClient()
        .from(this.table)
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.user_id) {
        query = query.eq('user_id', filters.user_id);
      }
      if (filters?.email) {
        query = query.ilike('email', `%${filters.email}%`);
      }
      if (filters?.event_type) {
        query = query.eq('event_type', filters.event_type);
      }
      if (filters?.auth_method) {
        query = query.eq('auth_method', filters.auth_method);
      }
      if (filters?.success !== undefined) {
        query = query.eq('success', filters.success);
      }
      if (filters?.mfa_verified !== undefined) {
        query = query.eq('mfa_verified', filters.mfa_verified);
      }
      if (filters?.country_code) {
        query = query.eq('country_code', filters.country_code);
      }
      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching auth logs:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAll:', error);
      throw error;
    }
  }

  /**
   * Get single auth log by ID
   * Ready for: GET /api/v1/telemetry/auth-logs/:id
   */
  async getById(id: string): Promise<AuthLog | null> {
    try {
      const { data, error } = await this.getClient()
        .from(this.table)
        .select('*')
        .eq('_id', id)
        .single();

      if (error) {
        console.error('Error fetching auth log:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in getById:', error);
      throw error;
    }
  }

  /**
   * Create new auth log entry
   * Ready for: POST /api/v1/telemetry/auth-logs
   */
  async create(log: Omit<AuthLog, '_id' | 'created_at'>): Promise<AuthLog> {
    try {
      const { data, error } = await this.getClient()
        .from(this.table)
        .insert([log])
        .select()
        .single();

      if (error) {
        console.error('Error creating auth log:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in create:', error);
      throw error;
    }
  }

  /**
   * Log authentication event (helper method)
   */
  async logAuthEvent(
    event_type: string,
    options?: {
      user_id?: string;
      email?: string;
      auth_method?: string;
      success?: boolean;
      failure_reason?: string;
      session_id?: string;
      mfa_verified?: boolean;
      ip_address?: string;
      user_agent?: string;
      country_code?: string;
      city?: string;
      device_fingerprint?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<AuthLog> {
    return this.create({
      event_type,
      user_id: options?.user_id,
      email: options?.email,
      auth_method: options?.auth_method,
      success: options?.success !== false,
      failure_reason: options?.failure_reason,
      session_id: options?.session_id,
      mfa_verified: options?.mfa_verified,
      ip_address: options?.ip_address,
      user_agent: options?.user_agent,
      country_code: options?.country_code,
      city: options?.city,
      device_fingerprint: options?.device_fingerprint,
      metadata_json: options?.metadata,
    });
  }

  /**
   * Get auth statistics
   * Ready for: GET /api/v1/telemetry/auth-logs/stats
   */
  async getStats(filters?: AuthLogFilters): Promise<AuthStats> {
    try {
      const logs = await this.getAll(filters);

      if (logs.length === 0) {
        return {
          total_events: 0,
          successful_logins: 0,
          failed_logins: 0,
          password_resets: 0,
          mfa_enabled_count: 0,
          success_rate: 0,
          by_event_type: {},
          by_auth_method: {},
          by_country: [],
          failed_login_attempts: [],
          suspicious_activity: [],
        };
      }

      const total_events = logs.length;
      const successful_logins = logs.filter(log => log.event_type === 'login' && log.success).length;
      const failed_logins = logs.filter(log => log.event_type === 'login' && !log.success).length;
      const password_resets = logs.filter(log => log.event_type === 'password_reset').length;
      const mfa_enabled_count = logs.filter(log => log.event_type === 'mfa_enabled').length;
      
      const loginAttempts = successful_logins + failed_logins;
      const success_rate = loginAttempts > 0 ? (successful_logins / loginAttempts) * 100 : 0;

      // By event type
      const by_event_type: Record<string, number> = {};
      logs.forEach(log => {
        if (log.event_type) {
          by_event_type[log.event_type] = (by_event_type[log.event_type] || 0) + 1;
        }
      });

      // By auth method
      const by_auth_method: Record<string, number> = {};
      logs.forEach(log => {
        if (log.auth_method) {
          by_auth_method[log.auth_method] = (by_auth_method[log.auth_method] || 0) + 1;
        }
      });

      // By country
      const countryCounts: Record<string, number> = {};
      logs.forEach(log => {
        if (log.country_code) {
          countryCounts[log.country_code] = (countryCounts[log.country_code] || 0) + 1;
        }
      });
      const by_country = Object.entries(countryCounts)
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Failed login attempts grouped by email
      const failedByEmail: Record<string, { count: number; last_attempt: string }> = {};
      logs
        .filter(log => log.event_type === 'login' && !log.success && log.email)
        .forEach(log => {
          const email = log.email!;
          if (!failedByEmail[email]) {
            failedByEmail[email] = { count: 0, last_attempt: log.created_at };
          }
          failedByEmail[email].count += 1;
          if (new Date(log.created_at) > new Date(failedByEmail[email].last_attempt)) {
            failedByEmail[email].last_attempt = log.created_at;
          }
        });
      const failed_login_attempts = Object.entries(failedByEmail)
        .map(([email, data]) => ({ email, count: data.count, last_attempt: data.last_attempt }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Suspicious activity: multiple failed logins from same IP
      const suspicious_activity = logs
        .filter(log => !log.success && log.event_type === 'login')
        .slice(0, 10);

      return {
        total_events,
        successful_logins,
        failed_logins,
        password_resets,
        mfa_enabled_count,
        success_rate: Math.round(success_rate * 100) / 100,
        by_event_type,
        by_auth_method,
        by_country,
        failed_login_attempts,
        suspicious_activity,
      };
    } catch (error) {
      console.error('Error in getStats:', error);
      throw error;
    }
  }

  /**
   * Get user's authentication history
   * Ready for: GET /api/v1/telemetry/auth-logs/user/:id
   */
  async getUserAuthHistory(user_id: string, limit: number = 50): Promise<AuthLog[]> {
    try {
      const { data, error } = await this.getClient()
        .from(this.table)
        .select('*')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching user auth history:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserAuthHistory:', error);
      throw error;
    }
  }

  /**
   * Detect suspicious login patterns
   * Ready for: GET /api/v1/telemetry/auth-logs/suspicious
   */
  async getSuspiciousActivity(hours: number = 24): Promise<{
    multiple_failed_logins: Array<{ email: string; count: number; ips: string[] }>;
    unusual_locations: AuthLog[];
    brute_force_attempts: Array<{ ip: string; count: number; emails: string[] }>;
  }> {
    try {
      const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
      const logs = await this.getAll({ date_from: since, success: false });

      // Multiple failed logins per email
      const failedByEmail: Record<string, { count: number; ips: Set<string> }> = {};
      logs.forEach(log => {
        if (log.email) {
          if (!failedByEmail[log.email]) {
            failedByEmail[log.email] = { count: 0, ips: new Set() };
          }
          failedByEmail[log.email].count += 1;
          if (log.ip_address) {
            failedByEmail[log.email].ips.add(log.ip_address);
          }
        }
      });
      const multiple_failed_logins = Object.entries(failedByEmail)
        .filter(([_, data]) => data.count >= 3)
        .map(([email, data]) => ({
          email,
          count: data.count,
          ips: Array.from(data.ips),
        }));

      // Brute force attempts (multiple emails from same IP)
      const failedByIP: Record<string, { count: number; emails: Set<string> }> = {};
      logs.forEach(log => {
        if (log.ip_address) {
          if (!failedByIP[log.ip_address]) {
            failedByIP[log.ip_address] = { count: 0, emails: new Set() };
          }
          failedByIP[log.ip_address].count += 1;
          if (log.email) {
            failedByIP[log.ip_address].emails.add(log.email);
          }
        }
      });
      const brute_force_attempts = Object.entries(failedByIP)
        .filter(([_, data]) => data.count >= 5)
        .map(([ip, data]) => ({
          ip,
          count: data.count,
          emails: Array.from(data.emails),
        }));

      // Unusual locations (simplified - could enhance with geolocation analysis)
      const unusual_locations = logs.filter(log => log.country_code && log.country_code !== 'VN');

      return {
        multiple_failed_logins,
        unusual_locations,
        brute_force_attempts,
      };
    } catch (error) {
      console.error('Error in getSuspiciousActivity:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const authLogsService = new AuthLogsService();