/**
 * Audit Log API Client
 * Uses Adapter pattern - Ready for Golang migration
 */

import { createAdapter, BaseFilters } from './adapters';

export interface AuditLog {
  _id: string;
  tenant_id?: string;
  user_id: string;
  action: string;
  resource: string;
  resource_id?: string;
  changes?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface CreateAuditLogRequest {
  tenant_id?: string;
  user_id: string;
  action: string;
  resource: string;
  resource_id?: string;
  changes?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, any>;
}

export interface AuditLogFilters extends BaseFilters {
  tenant_id?: string;
  user_id?: string;
  action?: string;
  resource?: string;
  date_from?: string;
  date_to?: string;
}

const adapter = createAdapter<AuditLog, CreateAuditLogRequest, any>(
  'audit_logs',
  '/audit-logs'
);

export const auditLogApi = {
  getAll: async (filters?: AuditLogFilters): Promise<AuditLog[]> => {
    return adapter.getAll(filters);
  },

  getById: async (id: string): Promise<AuditLog> => {
    return adapter.getById(id);
  },

  create: async (data: CreateAuditLogRequest): Promise<AuditLog> => {
    return adapter.create(data);
  },
};

export default auditLogApi;
