/**
 * User Registration Logs Service
 * Handles CRUD operations for user registration logs
 * ✅ Production-ready with Supabase integration
 */

import { supabase } from '@/utils/supabase/client';

// Types matching telemetry.user_registration_logs table
export interface UserRegistrationLog {
  _id: string; // UUID primary key
  user_id?: string; // UUID - reference to registered user
  email?: string;
  registration_method?: string; // 'email', 'google', 'github', etc.
  tenant_id?: string; // UUID - initial tenant assigned
  ip_address?: string;
  user_agent?: string;
  referrer_url?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  success?: boolean;
  error_message?: string;
  metadata_json?: Record<string, any>;
  email_verified?: boolean;
  verification_sent_at?: string;
  verified_at?: string;
  created_at: string;
}

export interface UserRegistrationLogFilters {
  user_id?: string;
  email?: string;
  registration_method?: string;
  tenant_id?: string;
  success?: boolean;
  email_verified?: boolean;
  utm_source?: string;
  utm_campaign?: string;
  date_from?: string;
  date_to?: string;
}

export interface RegistrationStats {
  total_registrations: number;
  successful_registrations: number;
  failed_registrations: number;
  verified_emails: number;
  pending_verification: number;
  success_rate: number;
  verification_rate: number;
  by_method: Record<string, number>;
  by_utm_source: Record<string, number>;
  by_utm_campaign: Record<string, number>;
  by_date: Array<{ date: string; count: number }>;
}

class UserRegistrationLogsService {
  private supabase = supabase;
  private table = 'user_registration_logs';
  private schema = 'telemetry';

  /**
   * Get Supabase client configured for telemetry schema
   */
  private getClient() {
    return this.supabase.schema(this.schema);
  }

  /**
   * Fetch all registration logs with optional filters
   * Ready for: GET /api/v1/telemetry/user-registration-logs
   */
  async getAll(filters?: UserRegistrationLogFilters): Promise<UserRegistrationLog[]> {
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
      if (filters?.registration_method) {
        query = query.eq('registration_method', filters.registration_method);
      }
      if (filters?.tenant_id) {
        query = query.eq('tenant_id', filters.tenant_id);
      }
      if (filters?.success !== undefined) {
        query = query.eq('success', filters.success);
      }
      if (filters?.email_verified !== undefined) {
        query = query.eq('email_verified', filters.email_verified);
      }
      if (filters?.utm_source) {
        query = query.eq('utm_source', filters.utm_source);
      }
      if (filters?.utm_campaign) {
        query = query.eq('utm_campaign', filters.utm_campaign);
      }
      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching user registration logs:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAll:', error);
      throw error;
    }
  }

  /**
   * Get single registration log by ID
   * Ready for: GET /api/v1/telemetry/user-registration-logs/:id
   */
  async getById(id: string): Promise<UserRegistrationLog | null> {
    try {
      const { data, error } = await this.getClient()
        .from(this.table)
        .select('*')
        .eq('_id', id)
        .single();

      if (error) {
        console.error('Error fetching user registration log:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in getById:', error);
      throw error;
    }
  }

  /**
   * Create new registration log entry
   * Ready for: POST /api/v1/telemetry/user-registration-logs
   */
  async create(log: Omit<UserRegistrationLog, '_id' | 'created_at'>): Promise<UserRegistrationLog> {
    try {
      const { data, error } = await this.getClient()
        .from(this.table)
        .insert([log])
        .select()
        .single();

      if (error) {
        console.error('Error creating user registration log:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in create:', error);
      throw error;
    }
  }

  /**
   * Update registration log (e.g., mark email as verified)
   * Ready for: PUT /api/v1/telemetry/user-registration-logs/:id
   */
  async update(id: string, log: Partial<UserRegistrationLog>): Promise<UserRegistrationLog> {
    try {
      const { data, error } = await this.getClient()
        .from(this.table)
        .update(log)
        .eq('_id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating user registration log:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in update:', error);
      throw error;
    }
  }

  /**
   * Mark email as verified
   */
  async markEmailVerified(user_id: string): Promise<void> {
    try {
      const { error } = await this.getClient()
        .from(this.table)
        .update({
          email_verified: true,
          verified_at: new Date().toISOString(),
        })
        .eq('user_id', user_id);

      if (error) {
        console.error('Error marking email as verified:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in markEmailVerified:', error);
      throw error;
    }
  }

  /**
   * Get registration statistics
   * Ready for: GET /api/v1/telemetry/user-registration-logs/stats
   */
  async getStats(filters?: UserRegistrationLogFilters): Promise<RegistrationStats> {
    try {
      const logs = await this.getAll(filters);

      if (logs.length === 0) {
        return {
          total_registrations: 0,
          successful_registrations: 0,
          failed_registrations: 0,
          verified_emails: 0,
          pending_verification: 0,
          success_rate: 0,
          verification_rate: 0,
          by_method: {},
          by_utm_source: {},
          by_utm_campaign: {},
          by_date: [],
        };
      }

      const total_registrations = logs.length;
      const successful_registrations = logs.filter(log => log.success).length;
      const failed_registrations = logs.filter(log => !log.success).length;
      const verified_emails = logs.filter(log => log.email_verified).length;
      const pending_verification = logs.filter(log => log.success && !log.email_verified).length;
      const success_rate = (successful_registrations / total_registrations) * 100;
      const verification_rate = successful_registrations > 0 
        ? (verified_emails / successful_registrations) * 100 
        : 0;

      // By method
      const by_method: Record<string, number> = {};
      logs.forEach(log => {
        if (log.registration_method) {
          by_method[log.registration_method] = (by_method[log.registration_method] || 0) + 1;
        }
      });

      // By UTM source
      const by_utm_source: Record<string, number> = {};
      logs.forEach(log => {
        if (log.utm_source) {
          by_utm_source[log.utm_source] = (by_utm_source[log.utm_source] || 0) + 1;
        }
      });

      // By UTM campaign
      const by_utm_campaign: Record<string, number> = {};
      logs.forEach(log => {
        if (log.utm_campaign) {
          by_utm_campaign[log.utm_campaign] = (by_utm_campaign[log.utm_campaign] || 0) + 1;
        }
      });

      // By date
      const dateCounts: Record<string, number> = {};
      logs.forEach(log => {
        const date = new Date(log.created_at).toISOString().split('T')[0];
        dateCounts[date] = (dateCounts[date] || 0) + 1;
      });
      const by_date = Object.entries(dateCounts)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return {
        total_registrations,
        successful_registrations,
        failed_registrations,
        verified_emails,
        pending_verification,
        success_rate: Math.round(success_rate * 100) / 100,
        verification_rate: Math.round(verification_rate * 100) / 100,
        by_method,
        by_utm_source,
        by_utm_campaign,
        by_date,
      };
    } catch (error) {
      console.error('Error in getStats:', error);
      throw error;
    }
  }

  /**
   * Get pending verifications (users who signed up but haven't verified email)
   * Ready for: GET /api/v1/telemetry/user-registration-logs/pending
   */
  async getPendingVerifications(): Promise<UserRegistrationLog[]> {
    try {
      const { data, error } = await this.getClient()
        .from(this.table)
        .select('*')
        .eq('success', true)
        .eq('email_verified', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching pending verifications:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getPendingVerifications:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const userRegistrationLogsService = new UserRegistrationLogsService();