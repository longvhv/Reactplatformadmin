/**
 * Audit Logs Service
 * Handles CRUD operations for audit logs
 * ✅ Production-ready with Supabase integration
 */

import { supabase } from '@/utils/supabase/client';

// Types matching telemetry.audit_logs table
export interface AuditLog {
  _id: string; // UUID primary key
  tenant_id?: string; // UUID
  user_id?: string; // UUID
  action_type?: string; // e.g., 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'
  resource_type?: string; // e.g., 'user', 'tenant', 'application'
  resource_id?: string; // UUID of affected resource
  ip_address?: string;
  user_agent?: string;
  changes_json?: Record<string, any>; // Before/after values
  metadata_json?: Record<string, any>; // Additional context
  severity?: string; // 'INFO', 'WARNING', 'ERROR', 'CRITICAL'
  success?: boolean;
  error_message?: string;
  created_at: string;
}

export interface AuditLogFilters {
  tenant_id?: string;
  user_id?: string;
  action_type?: string;
  resource_type?: string;
  resource_id?: string;
  severity?: string;
  success?: boolean;
  date_from?: string;
  date_to?: string;
}

export interface AuditLogStats {
  total_actions: number;
  successful_actions: number;
  failed_actions: number;
  by_action_type: Record<string, number>;
  by_resource_type: Record<string, number>;
  by_severity: Record<string, number>;
  by_user: Array<{ user_id: string; count: number }>;
  recent_critical: AuditLog[];
}

class AuditLogsService {
  private supabase = supabase;
  private table = 'audit_logs';
  private schema = 'telemetry';

  /**
   * Get Supabase client configured for telemetry schema
   */
  private getClient() {
    return this.supabase.schema(this.schema);
  }

  /**
   * Fetch all audit logs with optional filters
   * Ready for: GET /api/v1/telemetry/audit-logs
   */
  async getAll(filters?: AuditLogFilters): Promise<AuditLog[]> {
    try {
      let query = this.getClient()
        .from(this.table)
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.tenant_id) {
        query = query.eq('tenant_id', filters.tenant_id);
      }
      if (filters?.user_id) {
        query = query.eq('user_id', filters.user_id);
      }
      if (filters?.action_type) {
        query = query.eq('action_type', filters.action_type);
      }
      if (filters?.resource_type) {
        query = query.eq('resource_type', filters.resource_type);
      }
      if (filters?.resource_id) {
        query = query.eq('resource_id', filters.resource_id);
      }
      if (filters?.severity) {
        query = query.eq('severity', filters.severity);
      }
      if (filters?.success !== undefined) {
        query = query.eq('success', filters.success);
      }
      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      const { data, error } = await query;

      if (error) {
        // Handle missing table gracefully
        if (error.code === '42P01' || error.message?.includes('does not exist') || error.code === 'PGRST205') {
          console.warn('Audit logs table missing, returning empty list');
          return [];
        }
        console.error('Error fetching audit logs:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAll:', error);
      throw error;
    }
  }

  /**
   * Get single audit log by ID
   * Ready for: GET /api/v1/telemetry/audit-logs/:id
   */
  async getById(id: string): Promise<AuditLog | null> {
    try {
      const { data, error } = await this.getClient()
        .from(this.table)
        .select('*')
        .eq('_id', id)
        .single();

      if (error) {
        console.error('Error fetching audit log:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in getById:', error);
      throw error;
    }
  }

  /**
   * Create new audit log entry
   * Ready for: POST /api/v1/telemetry/audit-logs
   */
  async create(log: Omit<AuditLog, '_id' | 'created_at'>): Promise<AuditLog> {
    try {
      const { data, error } = await this.getClient()
        .from(this.table)
        .insert([log])
        .select()
        .single();

      if (error) {
        console.error('Error creating audit log:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in create:', error);
      throw error;
    }
  }

  /**
   * Log user action (helper method)
   */
  async logAction(
    action_type: string,
    resource_type: string,
    resource_id: string,
    options?: {
      tenant_id?: string;
      user_id?: string;
      changes?: Record<string, any>;
      metadata?: Record<string, any>;
      severity?: string;
      success?: boolean;
      error_message?: string;
      ip_address?: string;
      user_agent?: string;
    }
  ): Promise<AuditLog> {
    return this.create({
      action_type,
      resource_type,
      resource_id,
      tenant_id: options?.tenant_id,
      user_id: options?.user_id,
      changes_json: options?.changes,
      metadata_json: options?.metadata,
      severity: options?.severity || 'INFO',
      success: options?.success !== false,
      error_message: options?.error_message,
      ip_address: options?.ip_address,
      user_agent: options?.user_agent,
    });
  }

  /**
   * Get audit log statistics
   * Ready for: GET /api/v1/telemetry/audit-logs/stats
   */
  async getStats(filters?: AuditLogFilters): Promise<AuditLogStats> {
    try {
      const logs = await this.getAll(filters);

      if (logs.length === 0) {
        return {
          total_actions: 0,
          successful_actions: 0,
          failed_actions: 0,
          by_action_type: {},
          by_resource_type: {},
          by_severity: {},
          by_user: [],
          recent_critical: [],
        };
      }

      const total_actions = logs.length;
      const successful_actions = logs.filter(log => log.success).length;
      const failed_actions = logs.filter(log => !log.success).length;

      // By action type
      const by_action_type: Record<string, number> = {};
      logs.forEach(log => {
        if (log.action_type) {
          by_action_type[log.action_type] = (by_action_type[log.action_type] || 0) + 1;
        }
      });

      // By resource type
      const by_resource_type: Record<string, number> = {};
      logs.forEach(log => {
        if (log.resource_type) {
          by_resource_type[log.resource_type] = (by_resource_type[log.resource_type] || 0) + 1;
        }
      });

      // By severity
      const by_severity: Record<string, number> = {};
      logs.forEach(log => {
        if (log.severity) {
          by_severity[log.severity] = (by_severity[log.severity] || 0) + 1;
        }
      });

      // By user
      const userCounts: Record<string, number> = {};
      logs.forEach(log => {
        if (log.user_id) {
          userCounts[log.user_id] = (userCounts[log.user_id] || 0) + 1;
        }
      });
      const by_user = Object.entries(userCounts)
        .map(([user_id, count]) => ({ user_id, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Recent critical events
      const recent_critical = logs
        .filter(log => log.severity === 'CRITICAL' || log.severity === 'ERROR')
        .slice(0, 10);

      return {
        total_actions,
        successful_actions,
        failed_actions,
        by_action_type,
        by_resource_type,
        by_severity,
        by_user,
        recent_critical,
      };
    } catch (error) {
      console.error('Error in getStats:', error);
      throw error;
    }
  }

  /**
   * Get resource history (all actions on a specific resource)
   * Ready for: GET /api/v1/telemetry/audit-logs/resource/:type/:id
   */
  async getResourceHistory(resource_type: string, resource_id: string): Promise<AuditLog[]> {
    try {
      const { data, error } = await this.getClient()
        .from(this.table)
        .select('*')
        .eq('resource_type', resource_type)
        .eq('resource_id', resource_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching resource history:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getResourceHistory:', error);
      throw error;
    }
  }

  /**
   * Get user activity timeline
   * Ready for: GET /api/v1/telemetry/audit-logs/user/:id
   */
  async getUserActivity(user_id: string, limit: number = 100): Promise<AuditLog[]> {
    try {
      const { data, error } = await this.getClient()
        .from(this.table)
        .select('*')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching user activity:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserActivity:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const auditLogsService = new AuditLogsService();