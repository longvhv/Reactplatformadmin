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
};

export default authLogsApi;
