# 🐛 BUGFIX: Reserved Slugs - Lỗi Thêm/Sửa

**Ngày:** 2026-01-15  
**Module:** Reserved Slugs  
**Issue:** Lỗi khi thêm/sửa reserved slug  
**Status:** 🔍 **INVESTIGATING** - Cần thông tin error message cụ thể

---

## 📋 THÔNG TIN CẦN THU THẬP

**Để debug chính xác, vui lòng cung cấp:**

1. **Error message** - Thông báo lỗi xuất hiện (nếu có)
2. **Console errors** - Mở DevTools (F12) → Console tab → Copy error messages
3. **Network errors** - DevTools → Network tab → Xem request failed (status code)
4. **Hành động** - Đang thêm mới hay chỉnh sửa?
5. **Dữ liệu** - Dữ liệu đang nhập vào form

---

## 🔍 CÁC VẤN ĐỀ PHỔ BIẾN & CÁCH FIX

### **Issue #1: Lỗi "items_snapshot" field**

**Triệu chứng:**
- Error khi submit form
- Console: "items_snapshot is required" hoặc "invalid type"

**Root cause:**
```typescript
// AddReservedSlugPage.tsx - Line 35
items_snapshot: {},  // ⚠️ Empty object có thể gây lỗi với một số DB
```

**Fix:**
```typescript
// Option 1: Set to null thay vì empty object
items_snapshot: null,

// Option 2: Remove field nếu không cần
// (API sẽ set default)
```

**Implementation:**

Cập nhật `/pages/AddReservedSlugPage.tsx`:

```typescript
const [formData, setFormData] = useState<CreateReservedSlugRequest>({
  slug: '',
  type: 'SYSTEM',
  match_type: 'EXACT',
  reason: '',
  is_active: true,
  // items_snapshot: {},  // ❌ REMOVE THIS
});
```

Cập nhật `/api/reservedSlugsApi.ts`:

```typescript
export interface CreateReservedSlugRequest {
  slug: string;
  type?: SlugType;
  match_type?: MatchType;
  items_snapshot?: Record<string, any>;  // ✅ Optional
  reason?: string;
  is_active?: boolean;
}

// In create function
create: async (data: CreateReservedSlugRequest): Promise<ReservedSlug> => {
  const normalizedData = {
    ...data,
    slug: data.slug.toLowerCase(),
    items_snapshot: data.items_snapshot || null,  // ✅ Default to null
  };
  return adapter.create(normalizedData);
},
```

---

### **Issue #2: Supabase Client Not Initialized**

**Triệu chứng:**
- Error: "Cannot read property 'from' of undefined"
- Error: "getSupabaseClient is not a function"

**Root cause:**
```typescript
// reservedSlugsApi.ts uses dynamic import
const { getSupabaseClient } = await import('../lib/supabase');
```

**Check:**
Xem file `/lib/supabase.ts` có tồn tại không:

```typescript
// Expected: /lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../utils/supabase/info';

const supabaseUrl = `https://${projectId}.supabase.co`;
const supabaseKey = publicAnonKey;

const supabase = createClient(supabaseUrl, supabaseKey);

export function getSupabaseClient() {
  return supabase;
}
```

**Fix nếu file không tồn tại:**

Tạo `/lib/supabase.ts`:

```typescript
/**
 * Supabase Client Singleton
 */
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../utils/supabase/info';

const supabaseUrl = `https://${projectId}.supabase.co`;
const supabaseKey = publicAnonKey;

let supabaseClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseKey);
  }
  return supabaseClient;
}

export default getSupabaseClient;
```

---

### **Issue #3: Table Schema Mismatch**

**Triệu chứng:**
- Error: "column does not exist"
- Error: "null value in column violates not-null constraint"

**Check Supabase Table Schema:**

Expected schema cho `reserved_slugs` table:

```sql
CREATE TABLE reserved_slugs (
  _id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL DEFAULT 'SYSTEM',
  match_type TEXT NOT NULL DEFAULT 'EXACT',
  items_snapshot JSONB,
  reason TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1,
  
  CONSTRAINT reserved_slugs_type_check CHECK (type IN ('SYSTEM', 'BUSINESS', 'OFFENSIVE', 'FUTURE')),
  CONSTRAINT reserved_slugs_match_type_check CHECK (match_type IN ('EXACT', 'PREFIX', 'REGEX'))
);

-- Index
CREATE INDEX idx_reserved_slugs_slug ON reserved_slugs(slug);
CREATE INDEX idx_reserved_slugs_is_active ON reserved_slugs(is_active);
CREATE INDEX idx_reserved_slugs_type ON reserved_slugs(type);
```

**Fix nếu schema khác:**

1. Vào Supabase Dashboard
2. Chọn project → Table Editor → `reserved_slugs`
3. Kiểm tra columns:
   - ✅ `_id` (UUID, Primary Key)
   - ✅ `slug` (TEXT, NOT NULL, UNIQUE)
   - ✅ `type` (TEXT, NOT NULL, có CHECK constraint)
   - ✅ `match_type` (TEXT, NOT NULL, có CHECK constraint)
   - ✅ `items_snapshot` (JSONB, nullable)
   - ✅ `reason` (TEXT, nullable)
   - ✅ `is_active` (BOOLEAN, NOT NULL, default true)
   - ✅ `version` (INTEGER, NOT NULL, default 1)
   - ✅ `created_at`, `updated_at`, `deleted_at` (TIMESTAMPTZ)

---

### **Issue #4: API Mode Configuration**

**Triệu chứng:**
- API calls fail silently
- Network tab shows 404 errors

**Check `/api/config.ts`:**

```typescript
// Expected configuration
export const API_MODE: 'supabase' | 'golang' | 'hybrid' = 'supabase';
```

**Fix nếu mode là 'golang':**

Nếu backend Golang chưa sẵn sàng, set về 'supabase':

```typescript
export const API_MODE: 'supabase' | 'golang' | 'hybrid' = 'supabase';
```

---

### **Issue #5: CORS / Network Issues**

**Triệu chứng:**
- Network tab shows CORS errors
- Status code: 0 hoặc CORS error

**Check Supabase URL:**

File `/utils/supabase/info.tsx`:

```typescript
export const projectId = 'YOUR_PROJECT_ID';  // ✅ Check this
export const publicAnonKey = 'YOUR_ANON_KEY';  // ✅ Check this
```

**Fix:**
1. Vào Supabase Dashboard → Settings → API
2. Copy đúng Project URL và anon key
3. Update `/utils/supabase/info.tsx`

---

### **Issue #6: Validation Error**

**Triệu chứng:**
- Toast error: "Please fix the slug format"
- Slug field has red border

**Root cause:**
Slug không đúng format (chỉ lowercase, numbers, hyphens)

**Valid slugs:**
- ✅ `admin`
- ✅ `super-admin`
- ✅ `admin-123`
- ❌ `Admin` (uppercase)
- ❌ `admin_panel` (underscore)
- ❌ `admin panel` (space)

**Fix:**
```typescript
// Helper functions in API
export function normalizeSlug(slug: string): string {
  return slug
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')  // Replace invalid chars with hyphen
    .replace(/-+/g, '-')          // Remove duplicate hyphens
    .replace(/^-|-$/g, '');       // Remove leading/trailing hyphens
}

export function validateSlugFormat(slug: string): { valid: boolean; error?: string } {
  if (!slug) {
    return { valid: false, error: 'Slug is required' };
  }
  
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return { 
      valid: false, 
      error: 'Slug must contain only lowercase letters, numbers, and hyphens' 
    };
  }
  
  if (slug.startsWith('-') || slug.endsWith('-')) {
    return { 
      valid: false, 
      error: 'Slug cannot start or end with hyphen' 
    };
  }
  
  if (slug.includes('--')) {
    return { 
      valid: false, 
      error: 'Slug cannot contain consecutive hyphens' 
    };
  }
  
  return { valid: true };
}
```

**Check trong API file:**

File `/api/reservedSlugsApi.ts` có export các functions này không?

```typescript
// Ở cuối file
export { normalizeSlug, validateSlugFormat };
```

---

### **Issue #7: Edit Page Version Conflict**

**Triệu chứng:**
- Toast error: "Slug was updated by someone else"
- Edit fails với 409 Conflict

**Root cause:**
Optimistic locking - version mismatch

**Expected behavior:**
- Page auto-reloads với version mới
- User cần re-apply changes

**Fix nếu không reload:**

Check `/pages/EditReservedSlugPage.tsx` line 92-93:

```typescript
if (error.message.includes('Version conflict') || error.message.includes('409')) {
  toast.error('Slug was updated by someone else. Reloading...');
  if (id) loadSlug(id);  // ✅ Must reload
}
```

---

## 🔧 RECOMMENDED FIXES

### **Fix #1: Enhanced Error Handling**

Cập nhật `/pages/AddReservedSlugPage.tsx`:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Validate slug
  const validation = validateSlugFormat(formData.slug);
  if (!validation.valid) {
    setSlugError(validation.error || '');
    toast.error('Please fix the slug format');
    return;
  }

  // Check if slug already reserved
  try {
    const check = await reservedSlugsApi.checkSlug(formData.slug);
    if (check.reserved) {
      setSlugError('This slug is already reserved');
      toast.error('Slug already exists');
      return;
    }
  } catch (error: any) {
    console.error('Error checking slug:', error);
    // ✅ Don't block creation if check fails
  }

  // Create slug
  try {
    setLoading(true);
    
    // ✅ Clean data before send
    const createData: CreateReservedSlugRequest = {
      slug: formData.slug,
      type: formData.type,
      match_type: formData.match_type,
      reason: formData.reason || undefined,  // ✅ undefined instead of empty string
      is_active: formData.is_active,
      // items_snapshot: formData.items_snapshot,  // ✅ Remove if not needed
    };
    
    const created = await reservedSlugsApi.create(createData);
    toast.success(`Reserved slug "${created.slug}" created successfully`);
    navigate(`/core/reserved-slugs/${created._id}`);
  } catch (error: any) {
    console.error('❌ Error creating slug:', error);  // ✅ Better logging
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    
    if (error.message.includes('duplicate') || error.message.includes('unique')) {
      setSlugError('This slug is already reserved');
      toast.error('Slug already exists');
    } else if (error.message.includes('violates')) {
      // Database constraint violation
      toast.error('Invalid data: ' + error.message);
    } else {
      toast.error('Failed to create reserved slug: ' + error.message);
    }
  } finally {
    setLoading(false);
  }
};
```

### **Fix #2: Better API Error Logging**

Cập nhật `/api/reservedSlugsApi.ts`:

```typescript
create: async (data: CreateReservedSlugRequest): Promise<ReservedSlug> => {
  try {
    // Normalize slug to lowercase
    const normalizedData = {
      ...data,
      slug: data.slug.toLowerCase(),
      items_snapshot: data.items_snapshot || null,  // ✅ Default to null
    };
    
    console.log('📤 Creating reserved slug:', normalizedData);  // ✅ Log request
    const result = await adapter.create(normalizedData);
    console.log('✅ Created reserved slug:', result);  // ✅ Log success
    return result;
  } catch (error: any) {
    console.error('❌ Failed to create reserved slug:', error);  // ✅ Log error
    console.error('Request data:', data);
    throw error;
  }
},
```

### **Fix #3: Add Helper Functions (if missing)**

Thêm vào cuối `/api/reservedSlugsApi.ts` nếu chưa có:

```typescript
// ==================== HELPER FUNCTIONS ====================

/**
 * Normalize slug to valid format
 */
export function normalizeSlug(slug: string): string {
  return slug
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '-')  // Replace invalid chars
    .replace(/-+/g, '-')          // Remove duplicates
    .replace(/^-|-$/g, '');       // Remove leading/trailing
}

/**
 * Validate slug format
 */
export function validateSlugFormat(slug: string): { valid: boolean; error?: string } {
  if (!slug) {
    return { valid: false, error: 'Slug is required' };
  }
  
  if (slug.length < 2) {
    return { valid: false, error: 'Slug must be at least 2 characters' };
  }
  
  if (slug.length > 100) {
    return { valid: false, error: 'Slug must be less than 100 characters' };
  }
  
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return { 
      valid: false, 
      error: 'Only lowercase letters, numbers, and hyphens allowed' 
    };
  }
  
  if (slug.startsWith('-') || slug.endsWith('-')) {
    return { 
      valid: false, 
      error: 'Cannot start or end with hyphen' 
    };
  }
  
  if (slug.includes('--')) {
    return { 
      valid: false, 
      error: 'Cannot contain consecutive hyphens' 
    };
  }
  
  return { valid: true };
}

/**
 * Get type label for display
 */
export function getTypeLabel(type: SlugType): string {
  const labels: Record<SlugType, string> = {
    SYSTEM: 'System',
    BUSINESS: 'Business',
    OFFENSIVE: 'Offensive',
    FUTURE: 'Future Use',
  };
  return labels[type];
}

/**
 * Get type color for badge
 */
export function getTypeColor(type: SlugType): string {
  const colors: Record<SlugType, string> = {
    SYSTEM: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    BUSINESS: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    OFFENSIVE: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    FUTURE: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  };
  return colors[type];
}
```

---

## 🧪 TESTING CHECKLIST

### **Test Case 1: Add New Slug (Happy Path)**

1. Navigate to `/core/reserved-slugs`
2. Click "Add New" button
3. Fill form:
   - Slug: `test-slug-001`
   - Type: SYSTEM
   - Match Type: EXACT
   - Reason: "Testing"
   - Active: ✅
4. Click "Create"
5. **Expected:** Redirect to detail page, toast success
6. **Check console:** Should see `✅ Created reserved slug:`

### **Test Case 2: Add Duplicate Slug**

1. Add new slug: `admin`
2. Try to add again: `admin`
3. **Expected:** 
   - Toast error: "Slug already exists"
   - Slug field shows error: "This slug is already reserved"
   - Form does NOT submit

### **Test Case 3: Invalid Slug Format**

1. Try slug: `Admin` (uppercase)
2. **Expected:** Auto-normalized to `admin` on blur
3. Try slug: `admin_panel` (underscore)
4. **Expected:** Auto-normalized to `admin-panel` on blur
5. Try slug: `admin panel` (space)
6. **Expected:** Auto-normalized to `admin-panel` on blur

### **Test Case 4: Edit Existing Slug**

1. Navigate to slug detail page
2. Click "Edit" button
3. Change type: SYSTEM → BUSINESS
4. Click "Save"
5. **Expected:** 
   - Redirect to detail page
   - Toast success
   - Version incremented

### **Test Case 5: Edit with Version Conflict**

1. Open slug in 2 tabs
2. Edit in Tab 1 → Save (success)
3. Edit in Tab 2 → Save
4. **Expected:** 
   - Toast error: "Slug was updated by someone else"
   - Page reloads with new data
   - User can re-apply changes

---

## 📊 DEBUG WORKFLOW

**Step 1: Enable Console Logging**
```javascript
// Open DevTools (F12)
// Console tab
// Check for errors
```

**Step 2: Check Network Tab**
```
// DevTools → Network tab
// Try to submit form
// Look for failed requests (red)
// Click request → Preview tab → See response
```

**Step 3: Check Request Payload**
```
// Network tab → Select request
// Payload tab → See what was sent
// Compare with expected CreateReservedSlugRequest
```

**Step 4: Check Response**
```
// Network tab → Select request
// Response tab → See server response
// Look for error messages
```

**Step 5: Check Supabase Logs**
```
// Supabase Dashboard → Logs
// Filter by table: reserved_slugs
// See INSERT/UPDATE operations
// Look for errors
```

---

## 🆘 CUNG CẤP THÔNG TIN ĐỂ DEBUG

**Nếu vẫn gặp lỗi, vui lòng cung cấp:**

1. **Screenshot of error** (toast message)
2. **Console errors** (DevTools → Console → copy all red errors)
3. **Network request details**:
   ```
   URL: ...
   Method: POST/PATCH
   Status: ...
   Request Payload: { ... }
   Response: { ... }
   ```
4. **Form data** bạn đang nhập
5. **Hành động** - Add hay Edit?
6. **Supabase table schema** - Screenshot from Table Editor

**Với thông tin này, tôi có thể fix chính xác vấn đề!**

---

**Status:** 🔍 **AWAITING ERROR DETAILS**  
**Next Steps:** Cung cấp error message cụ thể để debug  
**Priority:** HIGH  
**Date:** 2026-01-15
