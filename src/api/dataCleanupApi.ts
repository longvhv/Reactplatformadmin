/**
 * Data Cleanup API
 * 
 * Manages data cleanup and maintenance operations.
 */

import { apiClient } from './adapters';

// ============================================================================
// TYPES
// ============================================================================

export type CleanupType = 
  | 'old_data'
  | 'deleted_records'
  | 'orphaned_records'
  | 'duplicate_records'
  | 'expired_sessions'
  | 'unused_assets';

export interface CleanupSuggestion {
  type: CleanupType;
  title: string;
  description: string;
  count: number;
  estimatedSize?: string; // e.g., "2.5 MB"
  severity: 'low' | 'medium' | 'high';
  collections?: string[];
}

export interface CleanupOptions {
  type: CleanupType;
  dryRun?: boolean;
  days?: number; // For old_data cleanup
  collections?: string[]; // Limit to specific collections
}

export interface CleanupResult {
  success: boolean;
  type: CleanupType;
  deleted: number;
  freedSpace?: string; // e.g., "2.5 MB"
  errors?: Array<{
    collection: string;
    error: string;
  }>;
  duration?: number;
  timestamp?: string;
}

// ============================================================================
// API METHODS
// ============================================================================

export const dataCleanupApi = {
  /**
   * Get cleanup suggestions
   */
  getSuggestions: async (): Promise<CleanupSuggestion[]> => {
    try {
      const response = await apiClient.get<CleanupSuggestion[]>(
        '/api/data-cleanup/suggestions'
      );
      return response;
    } catch (error: any) {
      console.error('Failed to get suggestions:', error);
      // Return mock data for development
      return [
        {
          type: 'old_data',
          title: 'Old Audit Logs',
          description: 'Audit logs older than 90 days',
          count: 1250,
          estimatedSize: '5.2 MB',
          severity: 'low',
          collections: ['audit_logs'],
        },
        {
          type: 'deleted_records',
          title: 'Soft-Deleted Records',
          description: 'Records marked as deleted but not purged',
          count: 45,
          estimatedSize: '0.8 MB',
          severity: 'medium',
          collections: ['users', 'tenants'],
        },
        {
          type: 'expired_sessions',
          title: 'Expired Sessions',
          description: 'User sessions that have expired',
          count: 320,
          estimatedSize: '1.2 MB',
          severity: 'medium',
          collections: ['user_sessions'],
        },
      ];
    }
  },
  
  /**
   * Execute cleanup
   */
  cleanup: async (options: CleanupOptions): Promise<CleanupResult> => {
    try {
      const response = await apiClient.post<CleanupResult>(
        '/api/data-cleanup/execute',
        options
      );
      return response;
    } catch (error: any) {
      console.error('Cleanup failed:', error);
      throw error;
    }
  },
  
  /**
   * Cleanup old data
   */
  cleanupOldData: async (days: number): Promise<CleanupResult> => {
    return dataCleanupApi.cleanup({
      type: 'old_data',
      days,
    });
  },
  
  /**
   * Cleanup soft-deleted records
   */
  cleanupDeletedRecords: async (): Promise<CleanupResult> => {
    return dataCleanupApi.cleanup({
      type: 'deleted_records',
    });
  },
  
  /**
   * Cleanup orphaned records
   */
  cleanupOrphanedRecords: async (): Promise<CleanupResult> => {
    return dataCleanupApi.cleanup({
      type: 'orphaned_records',
    });
  },
  
  /**
   * Cleanup duplicate records
   */
  cleanupDuplicates: async (): Promise<CleanupResult> => {
    return dataCleanupApi.cleanup({
      type: 'duplicate_records',
    });
  },
  
  /**
   * Get cleanup history
   */
  getHistory: async (params?: {
    limit?: number;
    offset?: number;
  }): Promise<CleanupResult[]> => {
    try {
      const response = await apiClient.get<CleanupResult[]>(
        '/api/data-cleanup/history',
        { params }
      );
      return response;
    } catch (error: any) {
      console.error('Failed to get history:', error);
      return [];
    }
  },
};
