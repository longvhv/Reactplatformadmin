/**
 * Import/Export API
 * 
 * Handles data import and export operations.
 */

import { apiClient } from './adapters';

// ============================================================================
// TYPES
// ============================================================================

export type ExportFormat = 'csv' | 'json' | 'xlsx' | 'xml';
export type ImportFormat = 'csv' | 'json' | 'xlsx';

export interface ExportOptions {
  format: ExportFormat;
  collection: string;
  filter?: Record<string, any>;
  fields?: string[];
  includeDeleted?: boolean;
}

export interface ImportOptions {
  format: ImportFormat;
  collection: string;
  mapping?: Record<string, string>; // Map file columns to database fields
  skipErrors?: boolean;
  updateExisting?: boolean;
  delimiter?: string; // For CSV
}

export interface ImportResult {
  success: boolean;
  imported: number;
  updated?: number;
  failed: number;
  errors?: Array<{
    row: number;
    data: any;
    error: string;
  }>;
  duration?: number;
  timestamp?: string;
}

export interface ExportResult {
  url: string;
  filename: string;
  size: string;
  rows: number;
}

// ============================================================================
// API METHODS
// ============================================================================

export const importExportApi = {
  // ------------------------------------------------------------------------
  // EXPORT
  // ------------------------------------------------------------------------
  
  /**
   * Export data
   */
  exportData: async (options: ExportOptions): Promise<Blob> => {
    try {
      const response = await apiClient.post(
        '/api/import-export/export',
        options,
        {
          responseType: 'blob',
        }
      );
      return response;
    } catch (error: any) {
      console.error('Export failed:', error);
      throw error;
    }
  },
  
  /**
   * Export and download
   */
  exportAndDownload: async (options: ExportOptions): Promise<void> => {
    const blob = await importExportApi.exportData(options);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${options.collection}-${Date.now()}.${options.format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },
  
  // ------------------------------------------------------------------------
  // IMPORT
  // ------------------------------------------------------------------------
  
  /**
   * Import data from file
   */
  importData: async (
    file: File,
    options: ImportOptions
  ): Promise<ImportResult> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('options', JSON.stringify(options));
      
      const response = await apiClient.post<ImportResult>(
        '/api/import-export/import',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      return response;
    } catch (error: any) {
      console.error('Import failed:', error);
      throw error;
    }
  },
  
  /**
   * Validate import file
   */
  validateImport: async (
    file: File,
    options: ImportOptions
  ): Promise<{
    valid: boolean;
    rows: number;
    errors?: string[];
    warnings?: string[];
  }> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('options', JSON.stringify(options));
      
      const response = await apiClient.post(
        '/api/import-export/validate',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      return response;
    } catch (error: any) {
      console.error('Validation failed:', error);
      return {
        valid: false,
        rows: 0,
        errors: [error.message || 'Validation failed'],
      };
    }
  },
  
  // ------------------------------------------------------------------------
  // TEMPLATES
  // ------------------------------------------------------------------------
  
  /**
   * Get import template
   */
  getTemplate: async (
    collection: string,
    format: ExportFormat
  ): Promise<Blob> => {
    try {
      const response = await apiClient.get(
        `/api/import-export/template/${collection}`,
        {
          params: { format },
          responseType: 'blob',
        }
      );
      return response;
    } catch (error: any) {
      console.error('Failed to get template:', error);
      throw error;
    }
  },
  
  /**
   * Download template
   */
  downloadTemplate: async (
    collection: string,
    format: ExportFormat
  ): Promise<void> => {
    const blob = await importExportApi.getTemplate(collection, format);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${collection}-template.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },
};
