# 🔌 API Implementation Guide

## 📋 Overview

Guide này giúp bạn implement 4 APIs còn thiếu sau khi đã fix xong navigation issues.

### APIs cần implement:
1. **settingsApi** - System settings management
2. **bulkOperationsApi** - Bulk data operations
3. **dataCleanupApi** - Data cleanup and maintenance
4. **importExportApi** - Import/Export functionality

---

## 📁 File Structure

```
/api/
├── settingsApi.ts          ⏳ TO CREATE
├── bulkOperationsApi.ts    ⏳ TO CREATE
├── dataCleanupApi.ts       ⏳ TO CREATE
├── importExportApi.ts      ⏳ TO CREATE
└── adapters/
    ├── base.ts             ✅ EXISTS
    ├── http.ts             ✅ EXISTS
    └── index.ts            ✅ EXISTS
```

---

## 🎯 Implementation Priority

| API | Priority | Pages Using | Time Est. |
|-----|----------|-------------|-----------|
| settingsApi | 🔴 High | `/settings/general`, `/settings/security` | 2-3h |
| bulkOperationsApi | 🟡 Medium | `/tools/bulk-operations` | 4-5h |
| dataCleanupApi | 🟡 Medium | `/tools/data-cleanup` | 3-4h |
| importExportApi | 🟢 Low | `/tools/import-export` | 5-6h |

---

## 1️⃣ Settings API

### 1.1 Create File: `/api/settingsApi.ts`

```typescript
/**
 * Settings API
 * 
 * Manages system-wide settings including general configuration and security settings.
 */

import { apiClient } from './adapters';

// ============================================================================
// TYPES
// ============================================================================

export interface GeneralSettings {
  id?: string;
  siteName: string;
  siteUrl: string;
  contactEmail: string;
  supportEmail?: string;
  description?: string;
  logo?: string;
  favicon?: string;
  timezone?: string;
  language?: string;
  currency?: string;
  dateFormat?: string;
  timeFormat?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SecuritySettings {
  id?: string;
  // MFA Settings
  mfaEnabled: boolean;
  mfaEnforced?: boolean;
  mfaMethods?: ('totp' | 'sms' | 'email')[];
  
  // Session Settings
  sessionTimeout: number; // in minutes
  sessionTimeoutWarning?: number; // in minutes before timeout
  maxActiveSessions?: number;
  
  // Password Policy
  passwordPolicy: {
    minLength: number;
    maxLength?: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    specialChars?: string;
    preventReuse?: number; // number of previous passwords to check
    expiryDays?: number; // force password change after X days
  };
  
  // IP & Access Control
  ipWhitelist?: string[];
  ipBlacklist?: string[];
  allowedCountries?: string[];
  blockedCountries?: string[];
  
  // Login Settings
  maxLoginAttempts?: number;
  lockoutDuration?: number; // in minutes
  requireEmailVerification?: boolean;
  
  // Audit
  auditLogRetention?: number; // in days
  
  createdAt?: string;
  updatedAt?: string;
}

export interface SettingsUpdateResult {
  success: boolean;
  data?: GeneralSettings | SecuritySettings;
  message?: string;
}

// ============================================================================
// API METHODS
// ============================================================================

export const settingsApi = {
  // ------------------------------------------------------------------------
  // GENERAL SETTINGS
  // ------------------------------------------------------------------------
  
  /**
   * Get general settings
   */
  getGeneral: async (): Promise<GeneralSettings> => {
    try {
      const response = await apiClient.get<GeneralSettings>('/api/settings/general');
      return response;
    } catch (error: any) {
      console.error('Failed to get general settings:', error);
      // Return defaults on error
      return {
        siteName: 'SaaS Platform',
        siteUrl: window.location.origin,
        contactEmail: 'contact@example.com',
        timezone: 'UTC',
        language: 'en',
        currency: 'USD',
      };
    }
  },
  
  /**
   * Update general settings
   */
  updateGeneral: async (data: Partial<GeneralSettings>): Promise<SettingsUpdateResult> => {
    try {
      const response = await apiClient.put<GeneralSettings>('/api/settings/general', data);
      return {
        success: true,
        data: response,
        message: 'General settings updated successfully',
      };
    } catch (error: any) {
      console.error('Failed to update general settings:', error);
      throw error;
    }
  },
  
  /**
   * Reset general settings to defaults
   */
  resetGeneral: async (): Promise<SettingsUpdateResult> => {
    try {
      const response = await apiClient.post<GeneralSettings>('/api/settings/general/reset');
      return {
        success: true,
        data: response,
        message: 'General settings reset to defaults',
      };
    } catch (error: any) {
      console.error('Failed to reset general settings:', error);
      throw error;
    }
  },
  
  // ------------------------------------------------------------------------
  // SECURITY SETTINGS
  // ------------------------------------------------------------------------
  
  /**
   * Get security settings
   */
  getSecurity: async (): Promise<SecuritySettings> => {
    try {
      const response = await apiClient.get<SecuritySettings>('/api/settings/security');
      return response;
    } catch (error: any) {
      console.error('Failed to get security settings:', error);
      // Return defaults on error
      return {
        mfaEnabled: false,
        sessionTimeout: 30,
        passwordPolicy: {
          minLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: true,
        },
      };
    }
  },
  
  /**
   * Update security settings
   */
  updateSecurity: async (data: Partial<SecuritySettings>): Promise<SettingsUpdateResult> => {
    try {
      const response = await apiClient.put<SecuritySettings>('/api/settings/security', data);
      return {
        success: true,
        data: response,
        message: 'Security settings updated successfully',
      };
    } catch (error: any) {
      console.error('Failed to update security settings:', error);
      throw error;
    }
  },
  
  /**
   * Reset security settings to defaults
   */
  resetSecurity: async (): Promise<SettingsUpdateResult> => {
    try {
      const response = await apiClient.post<SecuritySettings>('/api/settings/security/reset');
      return {
        success: true,
        data: response,
        message: 'Security settings reset to defaults',
      };
    } catch (error: any) {
      console.error('Failed to reset security settings:', error);
      throw error;
    }
  },
  
  /**
   * Test security settings (validate without saving)
   */
  testSecurity: async (data: Partial<SecuritySettings>): Promise<{ valid: boolean; errors?: string[] }> => {
    try {
      const response = await apiClient.post<{ valid: boolean; errors?: string[] }>(
        '/api/settings/security/test',
        data
      );
      return response;
    } catch (error: any) {
      console.error('Failed to test security settings:', error);
      return {
        valid: false,
        errors: [error.message || 'Validation failed'],
      };
    }
  },
};

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export const validateGeneralSettings = (data: Partial<GeneralSettings>): string[] => {
  const errors: string[] = [];
  
  if (data.siteName && data.siteName.length < 3) {
    errors.push('Site name must be at least 3 characters');
  }
  
  if (data.siteUrl && !isValidUrl(data.siteUrl)) {
    errors.push('Invalid site URL');
  }
  
  if (data.contactEmail && !isValidEmail(data.contactEmail)) {
    errors.push('Invalid contact email');
  }
  
  return errors;
};

export const validateSecuritySettings = (data: Partial<SecuritySettings>): string[] => {
  const errors: string[] = [];
  
  if (data.sessionTimeout && (data.sessionTimeout < 5 || data.sessionTimeout > 1440)) {
    errors.push('Session timeout must be between 5 and 1440 minutes');
  }
  
  if (data.passwordPolicy) {
    const { minLength, maxLength } = data.passwordPolicy;
    
    if (minLength < 6 || minLength > 128) {
      errors.push('Password minimum length must be between 6 and 128');
    }
    
    if (maxLength && maxLength < minLength) {
      errors.push('Password maximum length must be greater than minimum');
    }
  }
  
  return errors;
};

// Helper functions
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
```

### 1.2 Update Pages to Use Real API

#### `/app/(admin)/settings/general/page.tsx`

```typescript
// Replace mock API import
import { settingsApi, validateGeneralSettings } from '../../../../api/settingsApi';

// In loadSettings():
const loadSettings = async () => {
  try {
    setLoading(true);
    const data = await settingsApi.getGeneral();
    setSettings(data);
  } catch (error: any) {
    showToast.error('Error', error.message);
  } finally {
    setLoading(false);
  }
};

// In handleSave():
const handleSave = async () => {
  // Validate
  const errors = validateGeneralSettings(settings);
  if (errors.length > 0) {
    showToast.error('Validation Error', errors.join(', '));
    return;
  }
  
  try {
    setSaving(true);
    const result = await settingsApi.updateGeneral(settings);
    showToast.success('Success', result.message || 'Settings saved');
  } catch (error: any) {
    showToast.error('Error', error.message);
  } finally {
    setSaving(false);
  }
};
```

#### `/app/(admin)/settings/security/page.tsx`

```typescript
// Similar updates for security page
import { settingsApi, validateSecuritySettings } from '../../../../api/settingsApi';
```

---

## 2️⃣ Bulk Operations API

### 2.1 Create File: `/api/bulkOperationsApi.ts`

```typescript
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
```

### 2.2 Update Page

#### `/app/(admin)/tools/bulk-operations/page.tsx`

```typescript
// Replace mock
import { bulkOperationsApi, BulkOperation } from '../../../../api/bulkOperationsApi';

const handleExecute = async () => {
  // Validate first
  const validation = await bulkOperationsApi.validate({
    operation,
    collection: target,
    filter: parseFilter(value),
  });
  
  if (!validation.valid) {
    showToast.error('Invalid Operation', validation.warnings?.join(', '));
    return;
  }
  
  // Confirm
  if (!confirm(`This will affect ${validation.estimatedAffected} records. Continue?`)) {
    return;
  }
  
  try {
    setRunning(true);
    const result = await bulkOperationsApi.execute({
      operation,
      collection: target,
      filter: parseFilter(value),
    });
    
    showToast.success(
      'Success',
      `Operation completed. ${result.affected} records affected.`
    );
  } catch (error: any) {
    showToast.error('Error', error.message);
  } finally {
    setRunning(false);
  }
};
```

---

## 3️⃣ Data Cleanup API

### 3.1 Create File: `/api/dataCleanupApi.ts`

```typescript
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
```

---

## 4️⃣ Import/Export API

### 4.1 Create File: `/api/importExportApi.ts`

```typescript
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
```

---

## ✅ Implementation Checklist

### For Each API:

- [ ] **Create API file** in `/api/` folder
- [ ] **Define types** and interfaces
- [ ] **Implement methods** using apiClient
- [ ] **Add error handling**
- [ ] **Add validation** helpers
- [ ] **Update page** to use real API
- [ ] **Remove mock** implementations
- [ ] **Test** all methods
- [ ] **Add JSDoc** comments
- [ ] **Commit** changes

---

## 🧪 Testing Guide

### Manual Testing

```typescript
// In browser console

// 1. Test Settings API
import { settingsApi } from '/api/settingsApi';
const settings = await settingsApi.getGeneral();
console.log(settings);

// 2. Test Bulk Operations API
import { bulkOperationsApi } from '/api/bulkOperationsApi';
const result = await bulkOperationsApi.validate({
  operation: 'delete',
  collection: 'audit_logs',
  filter: { created_at: { $lt: '2024-01-01' } }
});
console.log(result);

// 3. Test Data Cleanup API
import { dataCleanupApi } from '/api/dataCleanupApi';
const suggestions = await dataCleanupApi.getSuggestions();
console.log(suggestions);

// 4. Test Import/Export API
import { importExportApi } from '/api/importExportApi';
await importExportApi.exportAndDownload({
  format: 'csv',
  collection: 'users',
});
```

---

## 📊 Progress Tracking

```markdown
### settingsApi (0/6 methods)
- [ ] getGeneral
- [ ] updateGeneral
- [ ] resetGeneral
- [ ] getSecurity
- [ ] updateSecurity
- [ ] testSecurity

### bulkOperationsApi (0/4 methods)
- [ ] execute
- [ ] validate
- [ ] getHistory
- [ ] cancel

### dataCleanupApi (0/6 methods)
- [ ] getSuggestions
- [ ] cleanup
- [ ] cleanupOldData
- [ ] cleanupDeletedRecords
- [ ] cleanupOrphanedRecords
- [ ] getHistory

### importExportApi (0/6 methods)
- [ ] exportData
- [ ] exportAndDownload
- [ ] importData
- [ ] validateImport
- [ ] getTemplate
- [ ] downloadTemplate
```

---

**Status:** 📋 Ready to Implement  
**Total Time:** 14-18 hours  
**Start After:** Navigation fixes complete
