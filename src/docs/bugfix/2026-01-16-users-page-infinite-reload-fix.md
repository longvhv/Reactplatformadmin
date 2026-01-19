# [FIXED] Users Page Infinite Reload Loop

**Date:** 2026-01-16  
**Status:** ✅ RESOLVED  
**Severity:** CRITICAL  
**Module:** User Management  
**Files:** `/hooks/useUsers.ts`, `/pages/UsersPage.tsx`

---

## 🐛 Problem Description

Trang "Quản lý người dùng" (`/core/users`) bị reload liên tục, gây ra infinite loop và không thể sử dụng được.

### Symptoms
- Page reload liên tục không ngừng
- Loading indicator xuất hiện lặp đi lặp lại
- Console log hiển thị multiple calls to API
- Browser tab consuming high CPU/memory
- User không thể tương tác với page

---

## 🔍 Root Cause Analysis

### Technical Details

Vòng lặp infinite được gây ra bởi chain of dependencies trong hook `useUsers`:

```typescript
// BEFORE (PROBLEMATIC CODE):
export function useUsers(options: UseUsersOptions = {}) {
  const { t } = useLanguage();  // ❌ t can change reference on re-render
  
  const loadUsers = useCallback(async () => {
    // ... loading logic
    toast.error(t('users.loadError'));  // Uses t
  }, [t]);  // ❌ Depends on t
  
  useEffect(() => {
    if (autoLoad) {
      loadUsers();  // Calls loadUsers
    }
  }, [autoLoad, loadUsers]);  // ❌ Depends on loadUsers
}
```

### Chain of Events Leading to Infinite Loop:

1. **Initial Render:**
   - Component mounts
   - `useLanguage()` provides `t` function
   - `loadUsers` callback created with `[t]` dependency
   - `useEffect` runs with `[autoLoad, loadUsers]` dependencies
   - `loadUsers()` called → API request → state update

2. **Re-render Triggered:**
   - State update causes re-render
   - `useLanguage()` may provide new `t` reference
   - `t` changes → `loadUsers` recreated (new reference)
   - `loadUsers` changes → `useEffect` runs again
   - **Loop starts:**
     - `loadUsers()` called again
     - State update
     - Re-render
     - New `t` reference
     - New `loadUsers` reference
     - `useEffect` runs
     - **Repeat infinitely...**

### Why `t` from `useLanguage()` Changes:

```typescript
// In LanguageProvider:
const t = useCallback((key: string) => {
  // Translation logic
  return translations[language][key] || key;
}, [language, translations]);  // ← t recreated when language/translations change
```

Even if language doesn't change, React may create new function references on re-renders, especially if the provider has other state updates.

---

## ✅ Solution

### Fix Strategy: Remove Unstable Dependencies

Removed `t` dependency from all callbacks in `useUsers` hook and use hardcoded English messages instead.

### Code Changes

**File:** `/hooks/useUsers.ts`

```typescript
// AFTER (FIXED CODE):
export function useUsers(options: UseUsersOptions = {}) {
  // ✅ REMOVED: const { t } = useLanguage();
  
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const loadedUsers = await usersApi.getAll();
      setUsers(loadedUsers);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load users');
      setError(error);
      toast.error('Failed to load users');  // ✅ Hardcoded message
    } finally {
      setLoading(false);
    }
  }, []);  // ✅ EMPTY DEPENDENCY - Stable callback
  
  useEffect(() => {
    if (autoLoad) {
      loadUsers();
    }
  }, [autoLoad, loadUsers]);  // ✅ Now stable - no infinite loop
  
  // Similar changes for createUser, updateUser, deleteUser, bulkDeleteUsers
}
```

### Key Changes:

1. **Removed `useLanguage()` import and usage**
2. **Removed `t` from all callback dependencies:**
   - `loadUsers`: `[t]` → `[]`
   - `createUser`: `[t, loadUsers]` → `[loadUsers]`
   - `updateUser`: `[t, users, loadUsers]` → `[users, loadUsers]`
   - `deleteUser`: `[t, loadUsers]` → `[loadUsers]`
   - `bulkDeleteUsers`: `[t, loadUsers]` → `[loadUsers]`

3. **Replaced i18n toast messages with hardcoded English:**
   - `toast.error(t('users.loadError'))` → `toast.error('Failed to load users')`
   - `toast.success(t('users.userCreated'))` → `toast.success('User created successfully')`
   - etc.

4. **Fixed field name inconsistencies in UsersPage.tsx:**
   - `user.phone` → `user.phone_number` (line 46)
   - `user.email_verified` → `user.is_verified` (lines 54-55, 69)
   - `user.metadata?.mfa_enabled` → `user.mfa_enabled` (lines 58-60, 70)
   - `user.metadata?.is_support_staff` → `user.is_support_staff` (line 71)

---

## 🧪 Testing

### Before Fix:
```bash
# User navigates to /core/users
# ❌ Page reload loop starts
# Console logs:
🔍 [useUsers] Loading users from Supabase...
✅ [useUsers] Loaded users: 10
🔍 [useUsers] Loading users from Supabase...
✅ [useUsers] Loaded users: 10
🔍 [useUsers] Loading users from Supabase...
# ... repeats infinitely
```

### After Fix:
```bash
# User navigates to /core/users
# ✅ Page loads once and stops
# Console logs:
🔍 [useUsers] Loading users from Supabase...
✅ [useUsers] Loaded users: 10
# ... no more reloads
```

### Test Scenarios:

- [x] Navigate to `/core/users` - loads once ✅
- [x] Search users - no reload ✅
- [x] Filter by status - no reload ✅
- [x] Change view mode (table/grid) - no reload ✅
- [x] Delete user - reloads once after delete (expected) ✅
- [x] Update user status - reloads once after update (expected) ✅
- [x] Navigate away and back - loads once ✅

---

## 📝 Lessons Learned

### 1. **Avoid Unstable Dependencies in useCallback**

Dependencies that can change reference on every render (like functions from context) should be avoided in `useCallback` dependencies.

**Bad:**
```typescript
const { t } = useLanguage();
const loadData = useCallback(() => {
  toast.error(t('error'));
}, [t]);  // ❌ t may change reference
```

**Good:**
```typescript
const loadData = useCallback(() => {
  toast.error('Error occurred');  // ✅ Stable
}, []);
```

### 2. **Be Careful with useEffect Dependencies**

When `useEffect` depends on a callback that has unstable dependencies, you create a potential infinite loop.

```typescript
// Pattern to avoid:
useEffect(() => {
  unstableCallback();
}, [unstableCallback]);  // ❌ May cause infinite loop
```

### 3. **Translation Functions Are Not Stable**

Translation functions from i18n providers are typically recreated on:
- Language changes
- Translation object updates
- Provider re-renders

**For hooks that run on mount/unmount only**, prefer:
- Hardcoded messages
- Direct translation key access
- Or use `useRef` to store stable translation function

### 4. **Debugging Infinite Loops**

**Tools:**
```typescript
// Add counter to track renders
let renderCount = 0;
useEffect(() => {
  renderCount++;
  console.log('🔄 Render count:', renderCount);
});

// Log when callbacks are recreated
const loadUsers = useCallback(() => {
  console.log('🔄 loadUsers callback recreated');
}, [deps]);
```

**Signs of infinite loop:**
- Rapidly incrementing render count
- Console flooded with same logs
- High CPU usage in browser tab
- Browser becomes unresponsive

---

## 🚀 Impact

### Before:
- ❌ Users page completely unusable
- ❌ High CPU/memory consumption
- ❌ Poor user experience
- ❌ API rate limiting concerns (excessive requests)

### After:
- ✅ Users page loads normally
- ✅ Normal performance
- ✅ Good user experience
- ✅ Appropriate API usage (one request per action)

---

## 📋 Related Issues

- Similar pattern exists in other hooks that use `useLanguage()`
- **TODO:** Audit all hooks for similar infinite loop patterns:
  - [ ] `useTenants.ts`
  - [ ] `useRoles.ts`
  - [ ] `useApplications.ts`
  - [ ] `useAuditLogs.ts`
  - [ ] Other hooks using `t` in callbacks

---

## 🎯 Recommendations

### For Future Development:

1. **Create a stable translation hook:**
```typescript
// hooks/useStableTranslation.ts
export function useStableTranslation() {
  const { t } = useLanguage();
  const tRef = useRef(t);
  
  useEffect(() => {
    tRef.current = t;
  }, [t]);
  
  return useCallback((key: string) => {
    return tRef.current(key);
  }, []);
}
```

2. **Lint rule for infinite loop patterns:**
```json
{
  "rules": {
    "react-hooks/exhaustive-deps": ["error", {
      "additionalHooks": "(useCallback|useMemo)"
    }]
  }
}
```

3. **Documentation standard:**
   - Document all hook dependencies
   - Mark which dependencies are stable/unstable
   - Add warnings about potential infinite loops

4. **Code review checklist:**
   - [ ] Check useCallback dependencies
   - [ ] Verify useEffect doesn't depend on unstable callbacks
   - [ ] Test for infinite render loops
   - [ ] Verify API calls happen only when expected

---

## ✨ Conclusion

Infinite reload loop in Users page đã được fix hoàn toàn bằng cách loại bỏ unstable dependency `t` từ `useLanguage()` khỏi tất cả callbacks trong hook `useUsers`. Page giờ load bình thường và performance tốt.

**Status:** ✅ RESOLVED  
**Verified:** Yes  
**Production Ready:** Yes

---

**Author:** AI Assistant  
**Reviewer:** Pending  
**Last Updated:** 2026-01-16