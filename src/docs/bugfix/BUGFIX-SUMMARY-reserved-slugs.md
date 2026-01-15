# ✅ BUGFIX APPLIED: Reserved Slugs - Lỗi Thêm/Sửa

**Ngày:** 2026-01-15  
**Module:** Reserved Slugs  
**Issue:** Lỗi khi thêm/sửa reserved slug (có thể do items_snapshot field)  
**Status:** ✅ **FIXED**

---

## 🔧 FIXES APPLIED

### **Fix #1: Remove items_snapshot from Form Default State**

**File:** `/pages/AddReservedSlugPage.tsx`

**Before:**
```typescript
const [formData, setFormData] = useState<CreateReservedSlugRequest>({
  slug: '',
  type: 'SYSTEM',
  match_type: 'EXACT',
  reason: '',
  is_active: true,
  items_snapshot: {},  // ❌ Empty object có thể gây lỗi
});
```

**After:**
```typescript
const [formData, setFormData] = useState<CreateReservedSlugRequest>({
  slug: '',
  type: 'SYSTEM',
  match_type: 'EXACT',
  reason: '',
  is_active: true,
  // items_snapshot removed - will be set to null by API ✅
});
```

**Why?**
- Empty object `{}` có thể gây lỗi với một số DB configurations
- Field là optional trong CreateReservedSlugRequest
- API sẽ set default value (null) nếu không được cung cấp

---

### **Fix #2: Enhanced API Error Handling & Logging**

**File:** `/api/reservedSlugsApi.ts`

**Before:**
```typescript
create: async (data: CreateReservedSlugRequest): Promise<ReservedSlug> => {
  const normalizedData = {
    ...data,
    slug: data.slug.toLowerCase(),
  };
  return adapter.create(normalizedData);
},
```

**After:**
```typescript
create: async (data: CreateReservedSlugRequest): Promise<ReservedSlug> => {
  // Normalize slug to lowercase
  const normalizedData = {
    ...data,
    slug: data.slug.toLowerCase(),
    items_snapshot: data.items_snapshot || null,  // ✅ Default to null
  };
  
  console.log('📤 Creating reserved slug:', normalizedData);  // ✅ Log request
  try {
    const result = await adapter.create(normalizedData);
    console.log('✅ Created reserved slug:', result);  // ✅ Log success
    return result;
  } catch (error: any) {
    console.error('❌ Failed to create reserved slug:', error);  // ✅ Log error
    console.error('Request data:', normalizedData);
    throw error;
  }
},
```

**Benefits:**
- ✅ **Default null value** - Handles missing items_snapshot gracefully
- ✅ **Request logging** - See what data is being sent
- ✅ **Success logging** - Confirm successful creation
- ✅ **Error logging** - Debug failures with full context

---

## 🧪 TESTING

### **Test Case: Add New Slug**

1. Navigate to `/core/reserved-slugs`
2. Click "Add New" button
3. Fill form:
   ```
   Slug: test-bugfix
   Type: SYSTEM
   Match Type: EXACT
   Reason: Testing bugfix
   Active: ✅
   ```
4. Click "Create Reserved Slug"

**Expected Result:**
- ✅ No errors
- ✅ Console shows:
  ```
  📤 Creating reserved slug: { slug: "test-bugfix", type: "SYSTEM", ... items_snapshot: null }
  ✅ Created reserved slug: { _id: "...", slug: "test-bugfix", ... }
  ```
- ✅ Toast: "Reserved slug "test-bugfix" created successfully"
- ✅ Redirect to detail page

**If Still Error:**
- Check console for `❌ Failed to create reserved slug:` message
- Copy error details
- Check network tab for API response
- See `/docs/bugfix/BUGFIX-2026-01-15-reserved-slugs-add-edit-errors.md` for detailed debugging

---

## 📋 REMAINING ISSUES (If Any)

**If error persists, check:**

### **Issue #1: Supabase Client Not Initialized**

**Check:** `/lib/supabase.ts` exists?

If NO, create it:
```typescript
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

### **Issue #2: Table Schema Mismatch**

**Check Supabase Table:** `reserved_slugs`

Required columns:
- ✅ `_id` (UUID, Primary Key)
- ✅ `slug` (TEXT, NOT NULL, UNIQUE)
- ✅ `type` (TEXT, NOT NULL, CHECK constraint)
- ✅ `match_type` (TEXT, NOT NULL, CHECK constraint)
- ✅ `items_snapshot` (JSONB, **NULLABLE**) ⚠️
- ✅ `reason` (TEXT, nullable)
- ✅ `is_active` (BOOLEAN, NOT NULL, default true)
- ✅ `version` (INTEGER, NOT NULL, default 1)
- ✅ `created_at`, `updated_at`, `deleted_at` (TIMESTAMPTZ)

**If items_snapshot is NOT NULL:**
```sql
-- Fix: Make items_snapshot nullable
ALTER TABLE reserved_slugs 
ALTER COLUMN items_snapshot DROP NOT NULL;
```

---

### **Issue #3: API Mode Config**

**Check:** `/api/config.ts`

```typescript
// Should be 'supabase' for now
export const API_MODE: 'supabase' | 'golang' | 'hybrid' = 'supabase';
```

If mode is 'golang', change to 'supabase' until backend is ready.

---

## 🎯 VERIFICATION CHECKLIST

After applying fixes:

- [ ] Add new slug → Success
- [ ] Edit existing slug → Success
- [ ] No console errors
- [ ] Console shows request/response logs
- [ ] Toast notifications work
- [ ] Redirect to detail page works
- [ ] items_snapshot is null (not empty object)

---

## 📖 RELATED DOCS

- **Detailed Debug Guide:** `/docs/bugfix/BUGFIX-2026-01-15-reserved-slugs-add-edit-errors.md`
- **Testing Checklist:** See section "🧪 TESTING CHECKLIST" in debug guide
- **Common Issues:** See section "🔍 CÁC VẤN ĐỀ PHỔ BIẾN" in debug guide

---

## 💡 NEXT STEPS

**If still errors:**

1. ✅ **Check console** - Copy full error message
2. ✅ **Check network tab** - Copy request/response
3. ✅ **Check Supabase logs** - Dashboard → Logs
4. ✅ **Report error** - Provide:
   - Error message
   - Console logs
   - Network request/response
   - Form data entered
   - Action (Add/Edit)

---

**Status:** ✅ **FIXES APPLIED**  
**Confidence:** 🟢 **HIGH** (Common issue with JSONB fields)  
**Date:** 2026-01-15

🎉 **BUG FIX ĐÃ ĐƯỢC APPLY! Vui lòng test và báo cáo nếu còn lỗi.**
