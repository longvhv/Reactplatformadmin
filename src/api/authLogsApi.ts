/**
 * Auth Logs API Client
 * Uses Adapter pattern - Ready for Golang migration
 * 100% compliant with database schema
 */

import { createAdapter, BaseFilters } from './adapters';

// ============================================
// INTERFACES - 100% MATCH DATABASE SCHEMA
// ============================================

export interface AuthLog {
  _id: string;
  user_id?: string | null;  // Nullable - failed login attempts may not have user
  tenant_id?: string | null;
  action: string;  // 'login', 'logout', 'login_failed', 'password_reset', 'signup', 'token_refresh', etc.
  status: string;  // 'success', 'failed', 'blocked'
  ip_address?: string | null;
  user_agent?: string | null;
  browser?: string | null;
  os?: string | null;
  device_type?: string | null;  // 'desktop', 'mobile', 'tablet', 'other'
  location?: string | null;
  country_code?: string | null;
  error_message?: string | null;
  metadata?: Record<string, any> | null;
  created_at: string;
}

export interface CreateAuthLogRequest {
  user_id?: string | null;
  tenant_id?: string | null;
  action: string;
  status: string;
  ip_address?: string | null;
  user_agent?: string | null;
  browser?: string | null;
  os?: string | null;
  device_type?: string | null;
  location?: string | null;
  country_code?: string | null;
  error_message?: string | null;
  metadata?: Record<string, any> | null;
}

// Alias for backward compatibility
export type CreateAuthLogData = CreateAuthLogRequest;

export interface AuthLogStats {
  total_logs: number;
  successful_logins: number;
  failed_logins: number;
  blocked_attempts: number;
  unique_users: number;
  by_action: Record<string, number>;
  by_status: Record<string, number>;
  recent_failures: number;
}

export interface AuthLogFilters extends BaseFilters {
  user_id?: string;
  tenant_id?: string;
  action?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if auth log is successful
 */
export function isSuccessfulLog(log: AuthLog): boolean {
  return log.status === 'success';
}

/**
 * Check if auth log is failed
 */
export function isFailedLog(log: AuthLog): boolean {
  return log.status === 'failed';
}

/**
 * Check if auth log is blocked
 */
export function isBlockedLog(log: AuthLog): boolean {
  return log.status === 'blocked';
}

/**
 * Check if action is login-related
 */
export function isLoginAction(action: string): boolean {
  return ['login', 'login_failed'].includes(action.toLowerCase());
}

/**
 * Get action display name
 */
export function getActionDisplayName(action: string): string {
  const actionMap: Record<string, string> = {
    login: 'Đăng nhập',
    logout: 'Đăng xuất',
    login_failed: 'Đăng nhập thất bại',
    password_reset: 'Đặt lại mật khẩu',
    signup: 'Đăng ký',
    token_refresh: 'Làm mới token',
    mfa_verified: 'Xác thực 2FA',
  };
  return actionMap[action.toLowerCase()] || action;
}

/**
 * Get status display name
 */
export function getStatusDisplayName(status: string): string {
  const statusMap: Record<string, string> = {
    success: 'Thành công',
    failed: 'Thất bại',
    blocked: 'Bị chặn',
  };
  return statusMap[status.toLowerCase()] || status;
}

/**
 * Filter logs by date range
 */
export function filterLogsByDateRange(
  logs: AuthLog[],
  startDate: Date,
  endDate: Date
): AuthLog[] {
  return logs.filter((log) => {
    const logDate = new Date(log.created_at);
    return logDate >= startDate && logDate <= endDate;
  });
}

/**
 * Get logs for specific user
 */
export function getLogsByUser(logs: AuthLog[], userId: string): AuthLog[] {
  return logs.filter((log) => log.user_id === userId);
}

/**
 * Get logs for specific tenant
 */
export function getLogsByTenant(logs: AuthLog[], tenantId: string): AuthLog[] {
  return logs.filter((log) => log.tenant_id === tenantId);
}

/**
 * Get recent failed login attempts
 */
export function getRecentFailedAttempts(
  logs: AuthLog[],
  limit: number = 10
): AuthLog[] {
  return logs
    .filter((log) => isFailedLog(log) || isBlockedLog(log))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);
}

// ============================================
// API CLIENT
// ============================================

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
      successful_logins: logs.filter(log => log.action === 'login' && log.status === 'success').length,
      failed_logins: logs.filter(log => log.status === 'failed').length,
      blocked_attempts: logs.filter(log => log.status === 'blocked').length,
      unique_users: new Set(logs.map(log => log.user_id).filter(Boolean)).size,
      by_action: {},
      by_status: {},
      recent_failures: logs.filter(log => log.status === 'failed' || log.status === 'blocked').slice(0, 10).length,
    };

    // Count by action
    logs.forEach(log => {
      stats.by_action[log.action] = (stats.by_action[log.action] || 0) + 1;
    });

    // Count by status
    logs.forEach(log => {
      stats.by_status[log.status] = (stats.by_status[log.status] || 0) + 1;
    });

    return stats;
  },
};

export default authLogsApi;