/**
 * Audit Log API Client
 * Uses Adapter pattern - Ready for Golang migration
 */

import { createAdapter, BaseFilters } from './adapters';

export interface AuditLog {
  _id: string;
  tenant_id?: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  action: string;
  resource: string;
  resource_id?: string;
  status?: string;
  changes?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  impersonator_id?: string;
  impersonator_name?: string;
  metadata?: Record<string, any>;
  created_at: string;
  event_time: string;
}

export interface CreateAuditLogRequest {
  tenant_id?: string;
  user_id: string;
  action: string;
  resource: string;
  resource_id?: string;
  status?: string;
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
  status?: string;
  start_date?: string;
  end_date?: string;
}

export interface AuditLogStatistics {
  total: number;
  total_events: number;
  success_count: number;
  failed_count: number;
  unique_users: number;
  byAction: Record<string, number>;
  byResource: Record<string, number>;
  byUser: Record<string, number>;
}

export interface AuditLogsResponse {
  data: AuditLog[];
  total: number;
  offset: number;
  limit: number;
}

const adapter = createAdapter<AuditLog, CreateAuditLogRequest, any>(
  'audit_logs',
  '/audit-logs',
  false,
  true // Use mock adapter since audit_logs table doesn't exist
);

export const auditLogApi = {
  getAll: async (filters?: AuditLogFilters): Promise<AuditLog[]> => {
    const logs = await adapter.getAll(filters);
    return logs.map(log => ({
      ...log,
      event_time: log.event_time || log.created_at,
      status: log.status || 'SUCCESS', // Default for legacy/mock data
    }));
  },

  getById: async (id: string): Promise<AuditLog> => {
    const log = await adapter.getById(id);
    return {
      ...log,
      event_time: log.event_time || log.created_at,
      status: log.status || 'SUCCESS',
    };
  },

  create: async (data: CreateAuditLogRequest): Promise<AuditLog> => {
    return adapter.create(data);
  },
  
  // Extended methods for hooks
  getAuditLogs: async (filters?: AuditLogFilters): Promise<AuditLogsResponse> => {
    const data = await adapter.getAll(filters);
    return {
      data,
      total: data.length,
      offset: filters?.offset || 0,
      limit: filters?.limit || 50,
    };
  },
  
  getAuditLogStatistics: async (filters?: AuditLogFilters): Promise<AuditLogStatistics> => {
    const data = await adapter.getAll(filters);
    
    const byAction: Record<string, number> = {};
    const byResource: Record<string, number> = {};
    const byUser: Record<string, number> = {};
    let successCount = 0;
    let failedCount = 0;
    const uniqueUsers = new Set<string>();
    
    data.forEach(log => {
      byAction[log.action] = (byAction[log.action] || 0) + 1;
      byResource[log.resource] = (byResource[log.resource] || 0) + 1;
      byUser[log.user_id] = (byUser[log.user_id] || 0) + 1;
      
      if (log.status === 'SUCCESS') successCount++;
      if (log.status === 'FAILED') failedCount++;
      if (log.user_id) uniqueUsers.add(log.user_id);
    });
    
    return {
      total: data.length,
      total_events: data.length,
      success_count: successCount,
      failed_count: failedCount,
      unique_users: uniqueUsers.size,
      byAction,
      byResource,
      byUser,
    };
  },
};

// Export individual functions for backward compatibility
export const getAuditLogs = auditLogApi.getAuditLogs;
export const getAuditLogById = auditLogApi.getById;
export const getAuditLogStatistics = auditLogApi.getAuditLogStatistics;
export const parseAuditLogDetails = (log: AuditLog) => {
  return {
    ...log,
    parsedChanges: log.changes ? JSON.stringify(log.changes, null, 2) : null,
    parsedMetadata: log.metadata ? JSON.stringify(log.metadata, null, 2) : null,
    // Ensure event_time is present
    event_time: log.event_time || log.created_at,
  };
};

// Export audit logs to CSV/JSON
export const exportAuditLogs = async (
  filters?: AuditLogFilters,
  format: 'csv' | 'json' = 'csv'
): Promise<Blob> => {
  const logs = await adapter.getAll(filters);
  
  if (format === 'json') {
    const jsonData = JSON.stringify(logs, null, 2);
    return new Blob([jsonData], { type: 'application/json' });
  }
  
  // CSV export
  const headers = ['ID', 'Tenant ID', 'User ID', 'Action', 'Resource', 'Resource ID', 'IP Address', 'Created At'];
  const rows = logs.map(log => [
    log._id,
    log.tenant_id || '',
    log.user_id,
    log.action,
    log.resource,
    log.resource_id || '',
    log.ip_address || '',
    log.created_at,
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');
  
  return new Blob([csvContent], { type: 'text/csv' });
};

export default auditLogApi;