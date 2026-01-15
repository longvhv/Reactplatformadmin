/**
 * Auth Logs API Client
 * Uses Adapter pattern - Ready for Golang migration
 */

import { createAdapter, BaseFilters } from './adapters';

export interface AuthLog {
  _id: string;
  user_id: string;
  event_type: 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED' | 'PASSWORD_RESET' | 'MFA_VERIFIED';
  ip_address?: string;
  user_agent?: string;
  success: boolean;
  failure_reason?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface CreateAuthLogRequest {
  user_id: string;
  event_type: 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED' | 'PASSWORD_RESET' | 'MFA_VERIFIED';
  ip_address?: string;
  user_agent?: string;
  success: boolean;
  failure_reason?: string;
  metadata?: Record<string, any>;
}

// Alias for backward compatibility
export type CreateAuthLogData = CreateAuthLogRequest;

export interface AuthLogStats {
  total_logs: number;
  successful_logins: number;
  failed_logins: number;
  unique_users: number;
  by_event_type: Record<string, number>;
  recent_failures: number;
}

export interface AuthLogFilters extends BaseFilters {
  user_id?: string;
  event_type?: string;
  success?: boolean;
  date_from?: string;
  date_to?: string;
}

const adapter = createAdapter<AuthLog, CreateAuthLogRequest, any>(
  'auth_logs',
  '/auth-logs'
);

export const authLogsApi = {
  getAll: async (filters?: AuthLogFilters): Promise<AuthLog[]> => {
    return adapter.getAll(filters);
  },

  getById: async (id: string): Promise<AuthLog> => {
    return adapter.getById(id);
  },

  create: async (data: CreateAuthLogRequest): Promise<AuthLog> => {
    return adapter.create(data);
  },

  getStats: async (filters?: AuthLogFilters): Promise<AuthLogStats> => {
    // Fetch all logs and calculate stats
    const logs = await adapter.getAll(filters);
    
    const stats: AuthLogStats = {
      total_logs: logs.length,
      successful_logins: logs.filter(log => log.event_type === 'LOGIN' && log.success).length,
      failed_logins: logs.filter(log => log.event_type === 'LOGIN_FAILED' || !log.success).length,
      unique_users: new Set(logs.map(log => log.user_id)).size,
      by_event_type: {},
      recent_failures: logs.filter(log => !log.success).slice(0, 10).length,
    };

    // Count by event type
    logs.forEach(log => {
      stats.by_event_type[log.event_type] = (stats.by_event_type[log.event_type] || 0) + 1;
    });

    return stats;
  },
};

export default authLogsApi;