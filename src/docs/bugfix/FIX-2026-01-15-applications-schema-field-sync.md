# Fix: Applications Schema Field Synchronization

**Date:** 2026-01-15  
**Status:** ✅ COMPLETED  
**Priority:** HIGH  
**Type:** Bug Fix - Schema Compliance

---

## 📋 SUMMARY

Fixed `ApplicationsPage.tsx`, `ApplicationDetailPage.tsx`, and `ApplicationFormPage.tsx` to use the correct database schema fields. This ensures 100% compliance with the Supabase database schema.

**Key Changes:**
1. Replace `status` (string enum) with `is_active` (boolean)
2. Remove non-existent fields: `app_type`, `is_public`, `metadata`, `version_number`
3. Keep only schema-compliant fields: `code`, `name`, `description`, `is_active`, `version`

---

## 🔍 PROBLEM DESCRIPTION

### Issue
Three page components were using legacy or non-existent fields:

1. **ApplicationsPage.tsx** - Using `status` string field instead of `is_active` boolean
2. **ApplicationDetailPage.tsx** - Using `status` string field instead of `is_active` boolean
3. **ApplicationFormPage.tsx** - Using multiple non-existent fields: `app_type`, `status`, `is_public`, `metadata`, `version_number`, and treating `version` as string instead of number

### Affected Files
- `/pages/ApplicationsPage.tsx` - List view using wrong field
- `/pages/ApplicationDetailPage.tsx` - Detail view using wrong field
- `/pages/ApplicationFormPage.tsx` - Form using multiple wrong fields

### Root Cause
The pages were written before schema standardization and never migrated to use the correct schema defined in `/api/applicationsApi.ts`.

---

## ✅ SOLUTION

### Changes Made

#### 1. `/pages/ApplicationsPage.tsx`
**Before:**
```typescript
// ❌ Wrong: Using string status field
if (activeFilter === 'active' && app.status !== 'ACTIVE') return false;
if (activeFilter === 'inactive' && app.status === 'ACTIVE') return false;

stats.active = applications.filter(a => a.status === 'ACTIVE').length;

{app.status === 'ACTIVE' ? (
  <span>Active</span>
) : app.status === 'DEPRECATED' ? (
  <span>Deprecated</span>
) : (
  <span>Inactive</span>
)}
```

**After:**
```typescript
// ✅ Correct: Using boolean is_active field
if (activeFilter === 'active' && !app.is_active) return false;
if (activeFilter === 'inactive' && app.is_active) return false;

stats.active = applications.filter(a => a.is_active).length;

{app.is_active ? (
  <span>Active</span>
) : (
  <span>Inactive</span>
)}
```

#### 2. `/pages/ApplicationDetailPage.tsx`
**Before:**
```typescript
// ❌ Wrong: Using string status field
const isActive = application.status === 'ACTIVE';
```

**After:**
```typescript
// ✅ Correct: Using boolean is_active field
const isActive = application.is_active;
```

#### 3. `/pages/ApplicationFormPage.tsx`
**Before:**
```typescript
// ❌ Wrong: Using multiple non-existent fields
const [formData, setFormData] = useState({
  code: '',
  name: '',
  description: '',
  app_type: 'WEB' as 'WEB' | 'MOBILE' | 'API' | 'SERVICE',
  status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE' | 'DEPRECATED',
  version: '1.0.0',  // ❌ String instead of number
  is_public: false,
  metadata: {} as Record<string, any>,
});

// Loading from API with wrong fields
setFormData({
  code: app.code,
  name: app.name,
  description: app.description || '',
  app_type: app.app_type,      // ❌ Non-existent
  status: app.status,            // ❌ Non-existent
  version: app.version,          // ❌ Wrong type
  is_public: app.is_public,      // ❌ Non-existent
  metadata: app.metadata || {},  // ❌ Non-existent
});
```

**After:**
```typescript
// ✅ Correct: Only schema-compliant fields
const [formData, setFormData] = useState({
  code: '',
  name: '',
  description: '',
  is_active: true,
});
const [versionNumber, setVersionNumber] = useState(1);

// Loading from API with correct fields
setFormData({
  code: app.code,
  name: app.name,
  description: app.description || '',
  is_active: app.is_active,
});
setVersionNumber(app.version);  // ✅ Separate state for version (number)
```

#### 4. Form Validation Added
```typescript
// Validate code format (UPPERCASE_SNAKE_CASE)
if (!/^[A-Z0-9_]+$/.test(formData.code)) {
  toast.error('Mã ứng dụng phải là chữ hoa, số và gạch dưới (VD: TENANT_MGMT)');
  return;
}
```

#### 5. Handler Functions Updated
**ApplicationsPage.tsx - handleToggleActive:**
```typescript
const handleToggleActive = async (id: string, currentIsActive: boolean) => {
  try {
    const app = applications.find(a => a._id === id);
    if (!app) return;

    const updatedApp = await applicationsApi.update(id, { 
      is_active: !currentIsActive,
      version: app.version,  // ✅ Required for optimistic locking
    });
    setApplications(applications.map(app => app._id === id ? updatedApp : app));
    toast.success(`Đã ${updatedApp.is_active ? 'kích hoạt' : 'vô hiệu hóa'} ứng dụng`);
  } catch (err) {
    toast.error('Failed to update status');
  }
};
```

**ApplicationFormPage.tsx - handleSubmit:**
```typescript
if (isEdit && id) {
  const updateData: UpdateApplicationRequest = {
    name: formData.name,
    description: formData.description || undefined,
    is_active: formData.is_active,
    version: versionNumber,  // ✅ Number, not string
  };
  await applicationsApi.update(id, updateData);
} else {
  const createData: CreateApplicationRequest = {
    code: formData.code,
    name: formData.name,
    description: formData.description || undefined,
    is_active: formData.is_active,
  };
  await applicationsApi.create(createData);
}
```

---

## 🎯 SCHEMA COMPLIANCE

### Database Schema (Supabase)
```sql
CREATE TABLE public.applications (
  _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,  -- ✅ Boolean field
  version BIGINT DEFAULT 1,        -- ✅ Number (BIGINT), for optimistic locking
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  updated_by UUID,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID
);
```

### TypeScript Interface
```typescript
export interface Application {
  _id: string;
  code: string;
  name: string;
  description: string | null;
  is_active: boolean;  // ✅ Boolean field
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  deleted_at: string | null;
  deleted_by: string | null;
  version: number;     // ✅ Number (BIGINT), not string
}
```

### CreateApplicationRequest
```typescript
export interface CreateApplicationRequest {
  code: string;          // ✅ Required
  name: string;          // ✅ Required
  description?: string;  // ✅ Optional
  is_active?: boolean;   // ✅ Optional (default: true in DB)
}
```

### UpdateApplicationRequest
```typescript
export interface UpdateApplicationRequest {
  name?: string;         // ✅ Optional
  description?: string;  // ✅ Optional
  is_active?: boolean;   // ✅ Optional
  version: number;       // ✅ Required for optimistic locking
}
```

---

## 📊 TESTING CHECKLIST

### Before Fix (Issues)
- ❌ Filter by "Active" status returns empty results
- ❌ Statistics show 0 active applications
- ❌ Status badges don't display correctly
- ❌ Toggle active/inactive fails with validation error
- ❌ Console shows warnings about undefined fields
- ❌ Form shows fields that don't exist in database
- ❌ Create/Edit operations fail due to schema mismatch

### After Fix (Verified)
- ✅ Filter by "Active" status works correctly
- ✅ Statistics show accurate counts
- ✅ Status badges display "Active" or "Inactive" correctly
- ✅ Toggle active/inactive updates database successfully
- ✅ No console warnings or errors
- ✅ Optimistic locking with `version` field works
- ✅ Toast notifications display correct messages
- ✅ Form only shows schema-compliant fields
- ✅ Create operation works with minimal required fields
- ✅ Edit operation preserves `version` number correctly
- ✅ Code validation enforces UPPERCASE_SNAKE_CASE format

---

## 🔗 RELATED COMPONENTS

### Already Compliant (No Changes Needed)
- ✅ `/api/applicationsApi.ts` - Correctly uses `is_active`
- ✅ `/hooks/useApplication.ts` - Correctly uses `is_active`
- ✅ `/hooks/useApplications.ts` - Correctly uses `is_active`
- ✅ `/components/applications/ApplicationForm.tsx` - Correctly uses `is_active`

### Fixed in This Update
- ✅ `/pages/ApplicationsPage.tsx` - Now uses `is_active`
- ✅ `/pages/ApplicationDetailPage.tsx` - Now uses `is_active`
- ✅ `/pages/ApplicationFormPage.tsx` - Now uses only schema-compliant fields

---

## 🚀 MIGRATION NOTES FOR GOLANG BACKEND

When migrating to Golang backend:

1. **Database field:** Keep `is_active BOOLEAN` and `version BIGINT`
2. **Go struct:**
   ```go
   type Application struct {
       ID          uuid.UUID `db:"_id" json:"_id"`
       Code        string    `db:"code" json:"code"`
       Name        string    `db:"name" json:"name"`
       Description *string   `db:"description" json:"description"`
       IsActive    bool      `db:"is_active" json:"is_active"`
       Version     int64     `db:"version" json:"version"`
       CreatedAt   time.Time `db:"created_at" json:"created_at"`
       UpdatedAt   time.Time `db:"updated_at" json:"updated_at"`
       CreatedBy   *uuid.UUID `db:"created_by" json:"created_by"`
       UpdatedBy   *uuid.UUID `db:"updated_by" json:"updated_by"`
       DeletedAt   *time.Time `db:"deleted_at" json:"deleted_at"`
       DeletedBy   *uuid.UUID `db:"deleted_by" json:"deleted_by"`
   }
   ```

3. **API Endpoints:**
   ```go
   // POST /applications
   type CreateApplicationRequest struct {
       Code        string  `json:"code" validate:"required,uppercase"`
       Name        string  `json:"name" validate:"required"`
       Description *string `json:"description,omitempty"`
       IsActive    *bool   `json:"is_active,omitempty"`
   }

   // PATCH /applications/:id
   type UpdateApplicationRequest struct {
       Name        *string `json:"name,omitempty"`
       Description *string `json:"description,omitempty"`
       IsActive    *bool   `json:"is_active,omitempty"`
       Version     int64   `json:"version"` // Required for optimistic locking
   }
   ```

4. **Validation Rules:**
   - Code: `^[A-Z0-9_]+$` (UPPERCASE_SNAKE_CASE)
   - Name: Required, max 255 characters
   - Description: Optional, TEXT
   - IsActive: Boolean, default `true`
   - Version: Required for updates (optimistic locking)

---

## 📝 COMMIT MESSAGE

```
fix: sync Applications pages with database schema

- Replace status string enum with is_active boolean field
- Remove non-existent fields (app_type, is_public, metadata)
- Fix version field type (number instead of string)
- Update filters to use boolean logic instead of string comparison
- Fix statistics calculations to use is_active
- Update toggle handlers with version field for optimistic locking
- Add proper toast notifications for state changes
- Remove deprecated status badges (DEPRECATED, etc.)
- Add code format validation (UPPERCASE_SNAKE_CASE)

Compliant with: /api/applicationsApi.ts schema
Database table: public.applications

Files changed:
- /pages/ApplicationsPage.tsx
- /pages/ApplicationDetailPage.tsx
- /pages/ApplicationFormPage.tsx
```

---

## 🎉 CONCLUSION

All three Applications pages (`ApplicationsPage`, `ApplicationDetailPage`, `ApplicationFormPage`) are now **100% compliant** with the database schema. All operations (list, filter, statistics, toggle status, create, edit) work correctly with the schema-compliant fields.

**Status:** ✅ **PRODUCTION READY**

---

## 📚 REFERENCES

- **API Client:** `/api/applicationsApi.ts`
- **Database Schema:** `/supabase/migrations/010_create_applications_table.sql`
- **Hook Implementation:** `/hooks/useApplication.ts`
- **Related Documentation:** `/docs/bugfix/APPLICATION_DETAIL_PAGE_SUPABASE_INTEGRATION.md`