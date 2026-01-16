# Check Applications Module - Database Schema Compliance
**Date:** 2026-01-15  
**Status:** ✅ ISSUES DETECTED - FIXES REQUIRED  
**Module:** Applications Management  
**Priority:** HIGH (Production Ready Check)

---

## 🎯 Objective
Kiểm tra toàn diện module Applications để đảm bảo phù hợp 100% với database schema sau khi đã hoàn thành fix tương tự cho module App Capabilities và Invoices.

---

## 📋 Database Schema (Source of Truth)

```sql
create table public.applications (
  _id uuid not null default gen_random_uuid (),
  code character varying(50) not null,
  name character varying(255) not null,
  description text null,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  created_by uuid null,
  updated_by uuid null,
  deleted_at timestamp with time zone null,
  deleted_by uuid null,
  version bigint not null default 1,
  constraint applications_pkey primary key (_id),
  constraint uq_applications_code unique (code),
  constraint chk_app_code_format check (((code)::text ~ '^[A-Z0-9_]+$'::text)),
  constraint chk_app_name_not_empty check ((length((name)::text) > 0)),
  constraint chk_app_updated check ((updated_at >= created_at)),
  constraint chk_app_version_valid check ((version >= 1))
) TABLESPACE pg_default;
```

---

## 🔍 Issues Phát Hiện

### ❌ CRITICAL ISSUE #1: Interface TypeScript Không Khớp Database Schema

**File:** `/api/applicationsApi.ts` (Lines 10-24)

**Vấn đề:**
```typescript
export interface Application {
  _id: string;
  code: string;
  name: string;
  description?: string;
  app_type: 'WEB' | 'MOBILE' | 'API' | 'SERVICE';  // ❌ KHÔNG TỒN TẠI trong DB
  status: 'ACTIVE' | 'INACTIVE' | 'DEPRECATED';    // ❌ KHÔNG TỒN TẠI trong DB
  version: string;                                  // ❌ SAI TYPE - DB dùng BIGINT
  is_public: boolean;                               // ❌ KHÔNG TỒN TẠI trong DB
  metadata?: Record<string, any>;                   // ❌ KHÔNG TỒN TẠI trong DB
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  version_number: number;                           // ❌ TRÙNG với version
}
```

**Database Schema có:**
- ✅ `_id` uuid
- ✅ `code` varchar(50)
- ✅ `name` varchar(255)
- ✅ `description` text
- ✅ `is_active` boolean ← **THIẾU trong interface**
- ✅ `created_at` timestamptz
- ✅ `updated_at` timestamptz
- ✅ `created_by` uuid ← **THIẾU trong interface**
- ✅ `updated_by` uuid ← **THIẾU trong interface**
- ✅ `deleted_at` timestamptz
- ✅ `deleted_by` uuid ← **THIẾU trong interface**
- ✅ `version` bigint ← **SAI TYPE trong interface (dùng string)**

**Database Schema KHÔNG có:**
- ❌ `app_type` - Không tồn tại
- ❌ `status` - Không tồn tại (DB dùng `is_active` boolean)
- ❌ `is_public` - Không tồn tại
- ❌ `metadata` - Không tồn tại

---

### ❌ CRITICAL ISSUE #2: Adapter Chưa Enable Soft Delete

**File:** `/api/applicationsApi.ts` (Lines 56-59)

**Vấn đề:**
```typescript
const adapter = createAdapter<Application, CreateApplicationRequest, UpdateApplicationRequest>(
  'applications',
  '/applications'
  // ❌ THIẾU: supportsSoftDelete: true
);
```

**Database có field `deleted_at`** nhưng adapter không enable soft delete.

**So sánh với App Capabilities (đã fix):**
```typescript
// ✅ ĐÚNG - App Capabilities đã enable
const adapter = createAdapter<AppCapability, CreateAppCapabilityRequest, UpdateAppCapabilityRequest>(
  'app_capabilities',
  '/app_capabilities',
  {
    supportsSoftDelete: true  // ✅
  }
);
```

---

### ❌ ISSUE #3: Thiếu Helper Functions

**Files Affected:**
- `/components/applications/ApplicationForm.tsx` (Line 11)
- `/components/applications/ApplicationsList.tsx` (Lines 11-13)
- `/components/applications/ApplicationDetail.tsx` (Lines 8-15)

**Functions được import nhưng KHÔNG TỒN TẠI:**
```typescript
// ❌ Import from applicationsApi - KHÔNG TỒN TẠI
import {
  isValidAppCode,                    // ❌ Chưa implement
  formatAppCode,                     // ❌ Chưa implement
  getApplicationStatusColor,         // ❌ Chưa implement
  getApplicationStatusLabel,         // ❌ Chưa implement
  useApplicationWithCapabilities,    // ❌ Chưa implement
  capabilitiesApi,                   // ❌ Import sai - nên từ appCapabilityApi
  formatCapabilityType,              // ❌ Chưa implement
  getCapabilityTypeIcon,             // ❌ Chưa implement
  formatDefaultValue,                // ❌ Chưa implement
} from '../../api/applicationsApi';
```

---

### ❌ ISSUE #4: Hook useApplication Sử Dụng Logic Sai

**File:** `/hooks/useApplication.ts` (Lines 76-95)

**Vấn đề:**
```typescript
const toggleActive = async () => {
  if (!application) return;
  
  const newStatus = application.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';  // ❌ DB không có field 'status'
  
  try {
    const updated = await applicationsApi.update(application._id, {
      status: newStatus,        // ❌ SAI - DB dùng 'is_active' boolean
      version_number: application.version_number,
    });
    // ...
  }
};
```

**Đúng phải là:**
```typescript
const toggleActive = async () => {
  if (!application) return;
  
  try {
    const updated = await applicationsApi.update(application._id, {
      is_active: !application.is_active,  // ✅ ĐÚNG
      version: application.version,       // ✅ ĐÚNG
    });
    // ...
  }
};
```

---

### ⚠️ ISSUE #5: CreateApplicationRequest Không Phù Hợp

**File:** `/api/applicationsApi.ts` (Lines 26-34)

**Current:**
```typescript
export interface CreateApplicationRequest {
  code: string;
  name: string;
  description?: string;
  app_type: 'WEB' | 'MOBILE' | 'API' | 'SERVICE';  // ❌ Không tồn tại
  version: string;                                  // ❌ SAI TYPE
  is_public?: boolean;                              // ❌ Không tồn tại
  metadata?: Record<string, any>;                   // ❌ Không tồn tại
}
```

**Should be:**
```typescript
export interface CreateApplicationRequest {
  code: string;
  name: string;
  description?: string;
  is_active?: boolean;     // ✅ Có trong DB, default true
}
```

---

### ⚠️ ISSUE #6: UpdateApplicationRequest Không Phù Hợp

**File:** `/api/applicationsApi.ts` (Lines 36-46)

**Current:**
```typescript
export interface UpdateApplicationRequest {
  code?: string;                                    // ❌ Code không được update (UNIQUE constraint)
  name?: string;
  description?: string;
  app_type?: 'WEB' | 'MOBILE' | 'API' | 'SERVICE'; // ❌ Không tồn tại
  status?: 'ACTIVE' | 'INACTIVE' | 'DEPRECATED';   // ❌ Không tồn tại
  version?: string;                                 // ❌ SAI TYPE và không nên update manually
  is_public?: boolean;                              // ❌ Không tồn tại
  metadata?: Record<string, any>;                   // ❌ Không tồn tại
  version_number: number;                           // ❌ Nên dùng tên 'version'
}
```

**Should be:**
```typescript
export interface UpdateApplicationRequest {
  name?: string;
  description?: string;
  is_active?: boolean;
  version: number;  // Required for optimistic locking
}
```

---

## ✅ Các Phần Đã Đúng

### ✅ ApplicationForm Component
- Đã sử dụng đúng các fields: `code`, `name`, `description`, `is_active`
- Validation đúng format code: `UPPERCASE_SNAKE_CASE`
- Không cho phép edit code sau khi tạo (đúng vì UNIQUE constraint)

### ✅ ApplicationsList Component  
- Hiển thị đúng `is_active` status
- Check `deleted_at` để hiển thị badge "Deleted"
- Filter theo `is_active` và `include_deleted`

### ✅ ApplicationDetail Component
- Hiển thị đúng các fields từ database
- Check `deleted_at` để ẩn actions

---

## 📊 Impact Analysis

### 🔴 High Impact:
1. **Interface mismatch** → Code hiện tại sẽ fail khi fetch data từ Supabase
2. **Soft delete chưa enable** → Delete sẽ hard delete thay vì soft delete
3. **Hook logic sai** → Toggle active sẽ fail với error

### 🟡 Medium Impact:
4. **Helper functions thiếu** → Import errors, components không render

---

## 🛠️ Required Fixes

### Fix 1: Update Application Interface
```typescript
export interface Application {
  _id: string;
  code: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  deleted_at: string | null;
  deleted_by: string | null;
  version: number;
}
```

### Fix 2: Update Request DTOs
```typescript
export interface CreateApplicationRequest {
  code: string;
  name: string;
  description?: string;
  is_active?: boolean;
}

export interface UpdateApplicationRequest {
  name?: string;
  description?: string;
  is_active?: boolean;
  version: number;
}
```

### Fix 3: Enable Soft Delete
```typescript
const adapter = createAdapter<Application, CreateApplicationRequest, UpdateApplicationRequest>(
  'applications',
  '/applications',
  {
    supportsSoftDelete: true
  }
);
```

### Fix 4: Add Helper Functions
```typescript
// Code validation
export const isValidAppCode = (code: string): boolean => {
  return /^[A-Z0-9_]+$/.test(code);
};

// Status helpers
export const getApplicationStatusLabel = (isActive: boolean): string => {
  return isActive ? 'Active' : 'Inactive';
};

// Format helpers
export const formatAppCode = (code: string): string => {
  return code;
};
```

### Fix 5: Fix useApplication Hook
```typescript
const toggleActive = async () => {
  if (!application) return;
  
  try {
    const updated = await applicationsApi.update(application._id, {
      is_active: !application.is_active,
      version: application.version,
    });
    setApplication(updated);
    toast.success(`Đã ${updated.is_active ? 'kích hoạt' : 'vô hiệu hóa'} ứng dụng`);
  } catch (err: any) {
    toast.error('Không thể thay đổi trạng thái ứng dụng');
    throw err;
  }
};
```

---

## 🔄 Comparison với App Capabilities (Reference)

App Capabilities đã được fix đúng 100%:
- ✅ Interface match database schema
- ✅ Soft delete enabled
- ✅ Đầy đủ helper functions  
- ✅ Hook logic đúng

Applications cần apply cùng pattern:
1. Interface phải match 100% với database
2. Adapter enable `supportsSoftDelete: true`
3. Không thêm fields không tồn tại trong database
4. Version phải là `number` (BIGINT) không phải `string`

---

## 📝 Next Steps

1. ✅ **Tạo báo cáo này** (DONE)
2. ⏳ Fix `/api/applicationsApi.ts`
3. ⏳ Fix `/hooks/useApplication.ts`
4. ⏳ Verify tất cả components
5. ⏳ Test CRUD operations
6. ⏳ Test soft delete behavior

---

## 🎓 Lessons Learned

**Pattern đúng (từ App Capabilities fix):**
```typescript
// 1. Interface phải match 100% database
export interface Application {
  // Chỉ các fields TỒN TẠI trong database
  // Type phải CHÍNH XÁC (bigint → number, không phải string)
}

// 2. Adapter phải enable soft delete nếu có deleted_at
const adapter = createAdapter<T, CreateDto, UpdateDto>(
  'table_name',
  '/route',
  { supportsSoftDelete: true }  // ← BẮT BUỘC nếu có deleted_at
);

// 3. Không thêm fields không tồn tại
// ❌ KHÔNG thêm app_type, status, is_public, metadata
// ✅ CHỈ dùng is_active (boolean) theo database
```

---

**Prepared by:** AI Assistant  
**Review Status:** Ready for Implementation  
**References:** 
- FIX-2026-01-15-app-capabilities-soft-delete-complete.md
- FIX-2026-01-15-invoices-soft-delete-complete.md
