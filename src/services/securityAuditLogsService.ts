/**
 * Security Audit Logs Service
 * Handles CRUD operations for security audit logs
 * ✅ Production-ready with Supabase integration
 */

import { supabase } from '../utils/supabase/client';

// Types matching telemetry.security_audit_logs table
export interface SecurityAuditLog {
  _id: string; // UUID primary key
  tenant_id?: string; // UUID
  user_id?: string; // UUID
  event_category?: string; // 'access_control', 'data_access', 'config_change', 'security_incident'
  event_type?: string; // Specific event within category
  severity?: string; // 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
  resource_type?: string;
  resource_id?: string;
  action_taken?: string;
  before_value?: Record<string, any>;
  after_value?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  threat_detected?: boolean;
  threat_type?: string; // 'sql_injection', 'xss', 'brute_force', 'unauthorized_access'
  blocked?: boolean;
  compliance_tags?: string[]; // ['GDPR', 'HIPAA', 'SOC2', 'PCI-DSS']
  metadata_json?: Record<string, any>;
  created_at: string;
}

export interface SecurityAuditLogFilters {
  tenant_id?: string;
  user_id?: string;
  event_category?: string;
  event_type?: string;
  severity?: string;
  threat_detected?: boolean;
  blocked?: boolean;
  compliance_tags?: string[];
  date_from?: string;
  date_to?: string;
}

export interface SecurityAuditStats {
  total_events: number;
  threats_detected: number;
  threats_blocked: number;
  by_severity: Record<string, number>;
  by_event_category: Record<string, number>;
  by_threat_type: Record<string, number>;
  compliance_events: Record<string, number>;
  recent_critical: SecurityAuditLog[];
  top_targeted_resources: Array<{ resource_type: string; count: number }>;
}

class SecurityAuditLogsService {
  private supabase = supabase;
  private table = 'security_audit_logs';
  private schema = 'telemetry';

  /**
   * Get Supabase client configured for telemetry schema
   */
  private getClient() {
    return this.supabase.schema(this.schema);
  }

  /**
   * Fetch all security audit logs with optional filters
   * Ready for: GET /api/v1/telemetry/security-audit-logs
   */
  async getAll(filters?: SecurityAuditLogFilters): Promise<SecurityAuditLog[]> {
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
      if (filters?.event_category) {
        query = query.eq('event_category', filters.event_category);
      }
      if (filters?.event_type) {
        query = query.eq('event_type', filters.event_type);
      }
      if (filters?.severity) {
        query = query.eq('severity', filters.severity);
      }
      if (filters?.threat_detected !== undefined) {
        query = query.eq('threat_detected', filters.threat_detected);
      }
      if (filters?.blocked !== undefined) {
        query = query.eq('blocked', filters.blocked);
      }
      if (filters?.compliance_tags && filters.compliance_tags.length > 0) {
        query = query.overlaps('compliance_tags', filters.compliance_tags);
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
          console.warn('Security audit logs table missing, returning empty list');
          return [];
        }
        console.error('Error fetching security audit logs:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAll:', error);
      throw error;
    }
  }

  /**
   * Get single security audit log by ID
   * Ready for: GET /api/v1/telemetry/security-audit-logs/:id
   */
  async getById(id: string): Promise<SecurityAuditLog | null> {
    try {
      const { data, error } = await this.getClient()
        .from(this.table)
        .select('*')
        .eq('_id', id)
        .single();

      if (error) {
        console.error('Error fetching security audit log:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in getById:', error);
      throw error;
    }
  }

  /**
   * Create new security audit log entry
   * Ready for: POST /api/v1/telemetry/security-audit-logs
   */
  async create(log: Omit<SecurityAuditLog, '_id' | 'created_at'>): Promise<SecurityAuditLog> {
    try {
      const { data, error } = await this.getClient()
        .from(this.table)
        .insert([log])
        .select()
        .single();

      if (error) {
        console.error('Error creating security audit log:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in create:', error);
      throw error;
    }
  }

  /**
   * Log security event (helper method)
   */
  async logSecurityEvent(
    event_category: string,
    event_type: string,
    options?: {
      tenant_id?: string;
      user_id?: string;
      severity?: string;
      resource_type?: string;
      resource_id?: string;
      action_taken?: string;
      before_value?: Record<string, any>;
      after_value?: Record<string, any>;
      threat_detected?: boolean;
      threat_type?: string;
      blocked?: boolean;
      compliance_tags?: string[];
      ip_address?: string;
      user_agent?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<SecurityAuditLog> {
    return this.create({
      event_category,
      event_type,
      tenant_id: options?.tenant_id,
      user_id: options?.user_id,
      severity: options?.severity || 'MEDIUM',
      resource_type: options?.resource_type,
      resource_id: options?.resource_id,
      action_taken: options?.action_taken,
      before_value: options?.before_value,
      after_value: options?.after_value,
      threat_detected: options?.threat_detected,
      threat_type: options?.threat_type,
      blocked: options?.blocked,
      compliance_tags: options?.compliance_tags,
      ip_address: options?.ip_address,
      user_agent: options?.user_agent,
      metadata_json: options?.metadata,
    });
  }

  /**
   * Get security audit statistics
   * Ready for: GET /api/v1/telemetry/security-audit-logs/stats
   */
  async getStats(filters?: SecurityAuditLogFilters): Promise<SecurityAuditStats> {
    try {
      const logs = await this.getAll(filters);

      if (logs.length === 0) {
        return {
          total_events: 0,
          threats_detected: 0,
          threats_blocked: 0,
          by_severity: {},
          by_event_category: {},
          by_threat_type: {},
          compliance_events: {},
          recent_critical: [],
          top_targeted_resources: [],
        };
      }

      const total_events = logs.length;
      const threats_detected = logs.filter(log => log.threat_detected).length;
      const threats_blocked = logs.filter(log => log.blocked).length;

      // By severity
      const by_severity: Record<string, number> = {};
      logs.forEach(log => {
        if (log.severity) {
          by_severity[log.severity] = (by_severity[log.severity] || 0) + 1;
        }
      });

      // By event category
      const by_event_category: Record<string, number> = {};
      logs.forEach(log => {
        if (log.event_category) {
          by_event_category[log.event_category] = (by_event_category[log.event_category] || 0) + 1;
        }
      });

      // By threat type
      const by_threat_type: Record<string, number> = {};
      logs.forEach(log => {
        if (log.threat_type) {
          by_threat_type[log.threat_type] = (by_threat_type[log.threat_type] || 0) + 1;
        }
      });

      // Compliance events
      const compliance_events: Record<string, number> = {};
      logs.forEach(log => {
        if (log.compliance_tags) {
          log.compliance_tags.forEach(tag => {
            compliance_events[tag] = (compliance_events[tag] || 0) + 1;
          });
        }
      });

      // Recent critical events
      const recent_critical = logs
        .filter(log => log.severity === 'CRITICAL')
        .slice(0, 10);

      // Top targeted resources
      const resourceCounts: Record<string, number> = {};
      logs.forEach(log => {
        if (log.resource_type) {
          resourceCounts[log.resource_type] = (resourceCounts[log.resource_type] || 0) + 1;
        }
      });
      const top_targeted_resources = Object.entries(resourceCounts)
        .map(([resource_type, count]) => ({ resource_type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return {
        total_events,
        threats_detected,
        threats_blocked,
        by_severity,
        by_event_category,
        by_threat_type,
        compliance_events,
        recent_critical,
        top_targeted_resources,
      };
    } catch (error) {
      console.error('Error in getStats:', error);
      throw error;
    }
  }

  /**
   * Get active threats (unblocked threats in last N hours)
   * Ready for: GET /api/v1/telemetry/security-audit-logs/active-threats
   */
  async getActiveThreats(hours: number = 24): Promise<SecurityAuditLog[]> {
    try {
      const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

      const { data, error } = await this.getClient()
        .from(this.table)
        .select('*')
        .eq('threat_detected', true)
        .eq('blocked', false)
        .gte('created_at', since)
        .order('severity', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching active threats:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getActiveThreats:', error);
      throw error;
    }
  }

  /**
   * Get compliance report for specific standard
   * Ready for: GET /api/v1/telemetry/security-audit-logs/compliance/:standard
   */
  async getComplianceReport(
    standard: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<{
    standard: string;
    total_events: number;
    by_event_category: Record<string, number>;
    by_severity: Record<string, number>;
    events: SecurityAuditLog[];
  }> {
    try {
      const filters: SecurityAuditLogFilters = {
        compliance_tags: [standard],
        date_from: dateFrom,
        date_to: dateTo,
      };

      const events = await this.getAll(filters);

      const by_event_category: Record<string, number> = {};
      const by_severity: Record<string, number> = {};

      events.forEach(log => {
        if (log.event_category) {
          by_event_category[log.event_category] = (by_event_category[log.event_category] || 0) + 1;
        }
        if (log.severity) {
          by_severity[log.severity] = (by_severity[log.severity] || 0) + 1;
        }
      });

      return {
        standard,
        total_events: events.length,
        by_event_category,
        by_severity,
        events,
      };
    } catch (error) {
      console.error('Error in getComplianceReport:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const securityAuditLogsService = new SecurityAuditLogsService();