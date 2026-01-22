/**
 * Bulk Operations API
 * 
 * Performs bulk operations on data collections.
 */

import { apiClient } from './adapters';

// ============================================================================
// TYPES
// ============================================================================

export type BulkOperationType = 'update' | 'delete' | 'export' | 'duplicate';

export interface BulkOperation {
  operation: BulkOperationType;
  collection: string; // e.g., 'users', 'products', 'tenants'
  filter?: Record<string, any>; // Filter criteria
  data?: Record<string, any>; // For update operations
  options?: {
    dryRun?: boolean;
    skipErrors?: boolean;
    batchSize?: number;
  };
}

export interface BulkOperationResult {
  success: boolean;
  operation: BulkOperationType;
  collection: string;
  affected: number;
  failed?: number;
  errors?: Array<{
    id: string;
    error: string;
  }>;
  downloadUrl?: string; // For export operations
  duration?: number; // in ms
  timestamp?: string;
}

export interface BulkOperationHistory {
  id: string;
  operation: BulkOperationType;
  collection: string;
  affected: number;
  failed: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  createdBy: string;
  createdAt: string;
  completedAt?: string;
}

// ============================================================================
// API METHODS
// ============================================================================

export const bulkOperationsApi = {
  /**
   * Execute bulk operation
   */
  execute: async (operation: BulkOperation): Promise<BulkOperationResult> => {
    try {
      const response = await apiClient.post<BulkOperationResult>(
        '/api/bulk-operations/execute',
        operation
      );
      return response;
    } catch (error: any) {
      console.error('Bulk operation failed:', error);
      throw error;
    }
  },
  
  /**
   * Validate operation before execution
   */
  validate: async (operation: BulkOperation): Promise<{
    valid: boolean;
    estimatedAffected: number;
    warnings?: string[];
  }> => {
    try {
      const response = await apiClient.post(
        '/api/bulk-operations/validate',
        operation
      );
      return response;
    } catch (error: any) {
      console.error('Validation failed:', error);
      return {
        valid: false,
        estimatedAffected: 0,
        warnings: [error.message || 'Validation failed'],
      };
    }
  },
  
  /**
   * Get operation history
   */
  getHistory: async (params?: {
    collection?: string;
    limit?: number;
    offset?: number;
  }): Promise<BulkOperationHistory[]> => {
    try {
      const response = await apiClient.get<BulkOperationHistory[]>(
        '/api/bulk-operations/history',
        { params }
      );
      return response;
    } catch (error: any) {
      console.error('Failed to get history:', error);
      return [];
    }
  },
  
  /**
   * Cancel running operation
   */
  cancel: async (operationId: string): Promise<{ success: boolean }> => {
    try {
      const response = await apiClient.post(
        `/api/bulk-operations/${operationId}/cancel`
      );
      return response;
    } catch (error: any) {
      console.error('Failed to cancel operation:', error);
      throw error;
    }
  },
};
