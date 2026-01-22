# 📋 Kế Hoạch Kiểm Tra và Fix Navigation

## 🎯 Mục Tiêu
Kiểm tra và fix toàn bộ navigation issues trong dự án sau khi migration hoàn tất 100%.

## 📊 Tình Trạng Hiện Tại

### ✅ Đã Hoàn Thành
- [x] Migration 100% files trong `/app/(admin)` - thay thế tất cả `@/` imports
- [x] Shim navigation được implement tại `/components/shim/next-navigation.tsx`
- [x] Custom event 'app-navigate' để kích hoạt React Router
- [x] 11/29 files navigation đã được fix (38%)

### ⏳ Cần Hoàn Thành
- [ ] Fix 18 files navigation còn lại (62%)
- [ ] Test toàn bộ 120+ routes
- [ ] Implement 4 mock APIs thành APIs thực tế
- [ ] Verify stopPropagation logic trên các bảng dữ liệu

---

## 🔧 PHASE 1: Fix Navigation Imports (Remaining 18 Files)

### Priority 1: Core Management (8 files) 🔴

#### Roles Management
- [ ] `/app/(admin)/platform/roles/create/page.tsx`
- [ ] `/app/(admin)/platform/roles/edit/[id]/page.tsx`

#### Users Management  
- [ ] `/app/(admin)/platform/users/create/page.tsx`
- [ ] `/app/(admin)/platform/users/edit/[id]/page.tsx`

#### Tenant Rate Limits
- [ ] `/app/(admin)/platform/tenant-rate-limits/page.tsx`
- [ ] `/app/(admin)/platform/tenant-rate-limits/create/page.tsx`
- [ ] `/app/(admin)/platform/tenant-rate-limits/edit/[id]/page.tsx`

#### Legal Documents
- [ ] `/app/(admin)/platform/legal-documents/page.tsx`

### Priority 2: User Features (12 files) 🟡

#### User Consents
- [ ] `/app/(admin)/platform/user-consents/page.tsx`
- [ ] `/app/(admin)/platform/user-consents/create/page.tsx`
- [ ] `/app/(admin)/platform/user-consents/edit/[id]/page.tsx`

#### User Sessions
- [ ] `/app/(admin)/platform/user-sessions/page.tsx`
- [ ] `/app/(admin)/platform/user-sessions/create/page.tsx`
- [ ] `/app/(admin)/platform/user-sessions/edit/[id]/page.tsx`

#### User Roles
- [ ] `/app/(admin)/platform/user-roles/page.tsx`
- [ ] `/app/(admin)/platform/user-roles/create/page.tsx`
- [ ] `/app/(admin)/platform/user-roles/edit/[id]/page.tsx`

#### User Devices
- [ ] `/app/(admin)/platform/user-devices/page.tsx`
- [ ] `/app/(admin)/platform/user-devices/create/page.tsx`
- [ ] `/app/(admin)/platform/user-devices/edit/[id]/page.tsx`

### Priority 3: Other Pages (2 files) 🟢

- [ ] `/app/(admin)/platform/legal-documents/[id]/page.tsx`
- [ ] `/app/(admin)/subscriptions/invoices/[id]/page.tsx`

### Fix Pattern
```typescript
// ❌ BEFORE
import { useRouter, useParams } from 'next/navigation';

// ✅ AFTER - Sử dụng shim
import { useRouter, useParams } from '../../../components/shim/next-navigation';
// Hoặc tùy độ sâu của path
import { useRouter, useParams } from '../../../../components/shim/next-navigation';
```

---

## 🧪 PHASE 2: Navigation Testing Plan

### 2.1 Test Categories

#### A. Sidebar Navigation Test (30 routes)
Routes cần test khi click từ sidebar:

**Admin Section**
- [ ] `/admin/dashboard`
- [ ] `/admin/roles` → Verify click vào tên vai trò → detail page
- [ ] `/admin/roles/create`
- [ ] `/admin/permissions`
- [ ] `/admin/tenants`
- [ ] `/admin/tenants/create`
- [ ] `/admin/users/[id]`
- [ ] `/admin/audit-logs`
- [ ] `/admin/audit-logs/[id]`
- [ ] `/admin/system-logs`
- [ ] `/admin/auth-logs`

**Platform Section**
- [ ] `/platform/users`
- [ ] `/platform/users/create`
- [ ] `/platform/users/edit/[id]`
- [ ] `/platform/roles`
- [ ] `/platform/roles/create`
- [ ] `/platform/roles/edit/[id]`
- [ ] `/platform/permissions`
- [ ] `/platform/permissions/create`
- [ ] `/platform/applications`
- [ ] `/platform/applications/[id]`
- [ ] `/platform/feature-flags`
- [ ] `/platform/webhooks`
- [ ] `/platform/legal-documents`
- [ ] `/platform/notification-templates`
- [ ] `/platform/system-announcements`

**Commerce Section**
- [ ] `/commerce/products`
- [ ] `/commerce/products/create`
- [ ] `/commerce/invoices`
- [ ] `/commerce/subscriptions`

**Tools Section**
- [ ] `/tools/bulk-operations`
- [ ] `/tools/data-cleanup`
- [ ] `/tools/import-export`

#### B. Table Row Click Test (15 components)
Verify click vào row trong bảng dữ liệu → detail page:

- [ ] RolesList → Role Detail
- [ ] UsersTable → User Detail
- [ ] TenantsTable → Tenant Detail
- [ ] ApplicationsTable → Application Detail
- [ ] ProductsTable → Product Detail
- [ ] InvoicesTable → Invoice Detail
- [ ] WebhooksTable → Webhook Detail
- [ ] AuditLogTable → Audit Log Detail
- [ ] TrafficLogsTable → Traffic Log Detail
- [ ] SystemJobsTable → System Job Detail
- [ ] FeatureFlagsTable → Feature Flag Detail
- [ ] LegalDocumentsTable → Legal Document Detail
- [ ] NotificationTemplatesTable → Notification Template Detail
- [ ] UserConsentForm → User Consent Detail
- [ ] UserSessionsTable → User Session Detail

#### C. Form Navigation Test (10 forms)
Verify navigation sau khi submit form:

- [ ] RoleForm → Save → Navigate to roles list
- [ ] UserForm → Save → Navigate to users list
- [ ] TenantForm → Save → Navigate to tenants list
- [ ] ApplicationForm → Save → Navigate to applications list
- [ ] ProductForm → Save → Navigate to products list
- [ ] InvoiceForm → Save → Navigate to invoices list
- [ ] WebhookForm → Save → Navigate to webhooks list
- [ ] FeatureFlagForm → Save → Navigate to feature flags list
- [ ] LegalDocumentForm → Save → Navigate to legal documents list
- [ ] NotificationTemplateForm → Save → Navigate to notification templates list

#### D. Breadcrumb Navigation Test (5 patterns)
- [ ] Click breadcrumb → Navigate to parent page
- [ ] List → Detail → Edit → Back to Detail → Back to List
- [ ] Nested routes: /admin/tenants/[id]/subscriptions
- [ ] Dynamic routes: /platform/users/[id]
- [ ] Create/Edit routes: /platform/roles/create

### 2.2 Test Checklist Per Route

Cho mỗi route, kiểm tra:

```markdown
Route: [PATH]
- [ ] Click từ sidebar → Page loads correctly
- [ ] URL matches expected path
- [ ] No redirect to dashboard
- [ ] No console errors (navigation)
- [ ] Data loads correctly
- [ ] Buttons/Links work (Edit, Delete, Create)
- [ ] Breadcrumb displays correctly
- [ ] Back button works
- [ ] Form submission redirects correctly
- [ ] Table row click navigates correctly (if applicable)
- [ ] stopPropagation works on action buttons in tables (if applicable)
```

### 2.3 Automated Testing Script

Tạo script để tự động test navigation:

```javascript
// /scripts/test-navigation.js
const routes = [
  '/admin/dashboard',
  '/admin/roles',
  '/platform/users',
  // ... all routes
];

async function testRoute(route) {
  console.log(`Testing: ${route}`);
  
  // 1. Click sidebar link
  const link = document.querySelector(`[href="${route}"]`);
  if (!link) {
    console.error(`❌ Link not found: ${route}`);
    return false;
  }
  
  link.click();
  
  // 2. Wait for navigation
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // 3. Check URL
  if (window.location.pathname !== route) {
    console.error(`❌ Wrong URL: expected ${route}, got ${window.location.pathname}`);
    return false;
  }
  
  // 4. Check for errors
  const errors = console.error.calls || [];
  if (errors.length > 0) {
    console.error(`❌ Console errors found:`, errors);
    return false;
  }
  
  console.log(`✅ ${route} - PASSED`);
  return true;
}

// Run all tests
async function runTests() {
  const results = [];
  for (const route of routes) {
    const passed = await testRoute(route);
    results.push({ route, passed });
  }
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  console.log(`\n📊 Results: ${passed}/${total} passed (${Math.round(passed/total*100)}%)`);
  
  return results;
}
```

---

## 🔌 PHASE 3: Implement Real APIs

### 3.1 Settings API

**File:** `/api/settingsApi.ts`

```typescript
import { apiClient } from './adapters';

export interface GeneralSettings {
  siteName: string;
  siteUrl: string;
  contactEmail: string;
  description?: string;
  logo?: string;
}

export interface SecuritySettings {
  mfaEnabled: boolean;
  sessionTimeout: number;
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
  };
  ipWhitelist?: string[];
}

export const settingsApi = {
  // General Settings
  getGeneral: async (): Promise<GeneralSettings> => {
    return apiClient.get('/api/settings/general');
  },
  
  updateGeneral: async (data: GeneralSettings): Promise<GeneralSettings> => {
    return apiClient.put('/api/settings/general', data);
  },
  
  // Security Settings
  getSecurity: async (): Promise<SecuritySettings> => {
    return apiClient.get('/api/settings/security');
  },
  
  updateSecurity: async (data: SecuritySettings): Promise<SecuritySettings> => {
    return apiClient.put('/api/settings/security', data);
  },
};
```

### 3.2 Bulk Operations API

**File:** `/api/bulkOperationsApi.ts`

```typescript
import { apiClient } from './adapters';

export interface BulkOperation {
  operation: 'update' | 'delete' | 'export';
  target: string; // Collection name
  filter?: Record<string, any>;
  data?: Record<string, any>;
}

export interface BulkOperationResult {
  success: boolean;
  affected: number;
  errors?: string[];
  downloadUrl?: string; // For export operations
}

export const bulkOperationsApi = {
  execute: async (operation: BulkOperation): Promise<BulkOperationResult> => {
    return apiClient.post('/api/bulk-operations/execute', operation);
  },
  
  getHistory: async (): Promise<BulkOperationResult[]> => {
    return apiClient.get('/api/bulk-operations/history');
  },
  
  validateOperation: async (operation: BulkOperation): Promise<{ valid: boolean; estimatedAffected: number }> => {
    return apiClient.post('/api/bulk-operations/validate', operation);
  },
};
```

### 3.3 Data Cleanup API

**File:** `/api/dataCleanupApi.ts`

```typescript
import { apiClient } from './adapters';

export interface CleanupSuggestion {
  type: string;
  title: string;
  description: string;
  count: number;
  severity: 'low' | 'medium' | 'high';
}

export interface CleanupResult {
  type: string;
  deleted: number;
  errors?: string[];
}

export const dataCleanupApi = {
  getSuggestions: async (): Promise<CleanupSuggestion[]> => {
    return apiClient.get('/api/data-cleanup/suggestions');
  },
  
  cleanup: async (type: string): Promise<CleanupResult> => {
    return apiClient.post('/api/data-cleanup/execute', { type });
  },
  
  cleanupOldData: async (days: number): Promise<CleanupResult> => {
    return apiClient.post('/api/data-cleanup/old-data', { days });
  },
  
  cleanupDeletedRecords: async (): Promise<CleanupResult> => {
    return apiClient.post('/api/data-cleanup/deleted-records');
  },
  
  cleanupOrphanedRecords: async (): Promise<CleanupResult> => {
    return apiClient.post('/api/data-cleanup/orphaned-records');
  },
};
```

### 3.4 Import/Export API

**File:** `/api/importExportApi.ts`

```typescript
import { apiClient } from './adapters';

export type ExportFormat = 'csv' | 'json' | 'xlsx';
export type ImportFormat = 'csv' | 'json' | 'xlsx';

export interface ExportOptions {
  format: ExportFormat;
  collection?: string;
  filter?: Record<string, any>;
  fields?: string[];
}

export interface ImportOptions {
  format: ImportFormat;
  collection: string;
  mapping?: Record<string, string>;
  skipErrors?: boolean;
}

export interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors?: Array<{ row: number; error: string }>;
}

export const importExportApi = {
  // Export
  exportData: async (options: ExportOptions): Promise<Blob> => {
    const response = await apiClient.post('/api/import-export/export', options, {
      responseType: 'blob'
    });
    return response;
  },
  
  // Import
  importData: async (file: File, options: ImportOptions): Promise<ImportResult> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('options', JSON.stringify(options));
    
    return apiClient.post('/api/import-export/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  // Templates
  getImportTemplate: async (collection: string, format: ExportFormat): Promise<Blob> => {
    const response = await apiClient.get(`/api/import-export/template/${collection}`, {
      params: { format },
      responseType: 'blob'
    });
    return response;
  },
  
  // Validate import file
  validateImport: async (file: File, options: ImportOptions): Promise<{ valid: boolean; errors?: string[] }> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('options', JSON.stringify(options));
    
    return apiClient.post('/api/import-export/validate', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
};
```

### 3.5 API Implementation Timeline

| API | Priority | Estimated Time | Dependencies |
|-----|----------|----------------|--------------|
| settingsApi | 🔴 High | 2-3 hours | Database schema, backend endpoints |
| bulkOperationsApi | 🟡 Medium | 4-5 hours | Validation logic, backend endpoints |
| dataCleanupApi | 🟡 Medium | 3-4 hours | Cleanup logic, backend endpoints |
| importExportApi | 🟢 Low | 5-6 hours | File handling, parser libraries |

**Total: 14-18 hours**

---

## 🛡️ PHASE 4: Verify StopPropagation Logic

### 4.1 Tables cần kiểm tra

```typescript
// Pattern: Click vào row → Navigate to detail
// Click vào action button → stopPropagation → Show dialog

const tablesToVerify = [
  'RolesList',
  'UsersTable', 
  'TenantsTable',
  'ApplicationsTable',
  'ProductsTable',
  'InvoiceTable',
  'WebhookTable',
  'AuditLogTable',
  'TrafficLogsTable',
  'SystemJobsTable',
  'FeatureFlagsTable',
];
```

### 4.2 Verify Pattern

```typescript
// ✅ CORRECT Implementation
<tr onClick={() => router.push(`/detail/${row.id}`)}>
  <td>{row.name}</td>
  <td>
    <button 
      onClick={(e) => {
        e.stopPropagation(); // Prevent row click
        handleEdit(row.id);
      }}
    >
      Edit
    </button>
    <button 
      onClick={(e) => {
        e.stopPropagation(); // Prevent row click
        handleDelete(row.id);
      }}
    >
      Delete
    </button>
  </td>
</tr>

// ❌ WRONG - Missing stopPropagation
<tr onClick={() => router.push(`/detail/${row.id}`)}>
  <td>{row.name}</td>
  <td>
    <button onClick={() => handleEdit(row.id)}>Edit</button>
  </td>
</tr>
```

### 4.3 Test Cases

Cho mỗi table:

```markdown
Table: [COMPONENT_NAME]
- [ ] Click vào row → Navigate to detail page
- [ ] Click vào Edit button → stopPropagation → Open edit dialog/navigate to edit page
- [ ] Click vào Delete button → stopPropagation → Show confirmation dialog
- [ ] Click vào View button → stopPropagation → Navigate to detail page
- [ ] Click vào checkbox → stopPropagation → Select row
- [ ] No navigation occurs when clicking action buttons
```

---

## 📈 PHASE 5: Testing Workflow

### 5.1 Manual Testing Workflow

**Day 1-2: Fix Navigation Imports (8 hours)**
- Fix Priority 1 files (8 files)
- Fix Priority 2 files (12 files)
- Fix Priority 3 files (2 files)

**Day 3: Test Core Navigation (6 hours)**
- Test Sidebar Navigation (30 routes)
- Test Table Row Clicks (15 components)
- Document issues found

**Day 4: Test Forms & Breadcrumbs (4 hours)**
- Test Form Navigation (10 forms)
- Test Breadcrumb Navigation (5 patterns)
- Document issues found

**Day 5-6: Implement APIs (12 hours)**
- Implement settingsApi (3 hours)
- Implement bulkOperationsApi (4 hours)
- Implement dataCleanupApi (3 hours)
- Implement importExportApi (6 hours) - can be done later

**Day 7: Verify & Fix (4 hours)**
- Verify stopPropagation logic
- Fix any issues found
- Final testing

### 5.2 Automated Testing Workflow

```bash
# 1. Run navigation tests
npm run test:navigation

# 2. Run table click tests
npm run test:tables

# 3. Run form navigation tests
npm run test:forms

# 4. Generate report
npm run test:report
```

---

## 📝 Issue Tracking Template

```markdown
## Navigation Issue: [ROUTE_PATH]

**Severity:** 🔴 Critical / 🟡 Medium / 🟢 Low

**Description:**
[Mô tả chi tiết vấn đề]

**Expected Behavior:**
[Hành vi mong đợi]

**Actual Behavior:**
[Hành vi thực tế]

**Steps to Reproduce:**
1. [Bước 1]
2. [Bước 2]
3. [Bước 3]

**Root Cause:**
[Nguyên nhân gốc rễ]

**Fix:**
[Cách fix]

**Verification:**
- [ ] Fix implemented
- [ ] Tested manually
- [ ] No console errors
- [ ] No regressions
```

---

## ✅ Success Criteria

### Must Have (P0)
- [ ] 100% navigation imports fixed (18 files)
- [ ] All 30 sidebar routes work correctly
- [ ] All 15 table row clicks work correctly
- [ ] No redirect to dashboard issues
- [ ] No console navigation errors

### Should Have (P1)
- [ ] All 10 form navigations work correctly
- [ ] All 5 breadcrumb patterns work correctly
- [ ] settingsApi implemented
- [ ] bulkOperationsApi implemented
- [ ] dataCleanupApi implemented

### Nice to Have (P2)
- [ ] importExportApi implemented
- [ ] Automated navigation tests
- [ ] StopPropagation verified on all tables
- [ ] Performance optimization
- [ ] Error boundaries added

---

## 📊 Progress Tracking

### Navigation Fixes
- Fixed: 11/29 (38%)
- Remaining: 18/29 (62%)
- Target: 29/29 (100%)

### Routes Testing
- Tested: 0/120+ (0%)
- Target: 120/120 (100%)

### APIs Implementation
- Completed: 0/4 (0%)
- Target: 4/4 (100%)

---

## 🎯 Next Immediate Actions

1. **Today:** Fix Priority 1 navigation imports (8 files)
2. **Tomorrow:** Fix Priority 2 & 3 navigation imports (14 files)
3. **Day 3:** Test sidebar navigation (30 routes)
4. **Day 4:** Test table clicks & forms
5. **Day 5-6:** Implement APIs
6. **Day 7:** Final verification

---

**Created:** 2026-01-21  
**Status:** 📋 READY TO START  
**Owner:** Development Team
