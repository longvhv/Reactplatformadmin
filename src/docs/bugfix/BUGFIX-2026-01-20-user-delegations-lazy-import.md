# BUGFIX: User Delegations Menu Lazy Import Error

**Ngày:** 2026-01-20  
**Module:** User Delegations (Ủy quyền)  
**Issue:** Lỗi lazy import khi click vào menu "Ủy quyền"  
**Status:** ✅ **FIXED**

---

## 🐛 Problem

**Triệu chứng:**
- Click vào menu "Ủy quyền" bị lỗi:
  ```
  Error: Element type is invalid. Received a promise that resolves to: [object Object]. 
  Lazy element type must resolve to a class or function.
  ```
- Error stack trace chỉ đến tailwind-merge module
- Page không load được

**Root Cause:**
1. **Pattern `.catch()` sai cách** trong module definition:
   ```typescript
   // ❌ SAI - Pattern này trả về Promise chứ không phải component
   const UserDelegationsPage = lazy(() => 
     import('../../pages/UserDelegationsPage').catch(() => ({
       default: () => <div>Placeholder</div>
     }))
   );
   ```

2. **App router pages chưa tồn tại**: Bridge files đang import từ paths không tồn tại:
   - `/pages/UserDelegationsPage.tsx` → import từ `/app/(admin)/user-delegations/page` (không tồn tại)
   - `/pages/AddUserDelegationPage.tsx` → import từ `/app/(admin)/platform/user-delegations/create/page` (không tồn tại)

---

## ✅ Solution

### 1. Tạo App Router Pages

**Created:** `/app/(admin)/platform/user-delegations/page.tsx`
- Full-featured user delegations list page
- Statistics cards (total, active, pending, expired)
- Advanced filters (search, status, scope)
- Delegation details display with status badges
- Integration với useUserDelegations hook
- Proper error handling và toast notifications

**Created:** `/app/(admin)/platform/user-delegations/create/page.tsx`
- Create delegation form page
- User selection dropdowns (delegator & delegate)
- Tenant selection (optional)
- Scope selection (8 types: admin, manager, editor, viewer, approver, reviewer, auditor, custom)
- Date range picker
- Reason textarea
- Custom permissions JSON editor (for custom scope)
- Full validation

### 2. Fix Bridge Files

**Fixed:** `/pages/UserDelegationsPage.tsx`
```typescript
// Before
import UserDelegationsPage from '@/app/(admin)/user-delegations/page';

// After - Correct path
import UserDelegationsPage from '@/app/(admin)/platform/user-delegations/page';
export default UserDelegationsPage;
```

**Fixed:** `/pages/AddUserDelegationPage.tsx`
```typescript
// Correct path pointing to app router
import AddUserDelegationPage from '@/app/(admin)/platform/user-delegations/create/page';
export default AddUserDelegationPage;
```

### 3. Fix Module Definition

**Fixed:** `/modules/user-delegations/index.tsx`
```typescript
// ❌ BEFORE - Wrong pattern with .catch()
const UserDelegationsPage = lazy(() => 
  import('../../pages/UserDelegationsPage').catch(() => ({
    default: () => <div>Placeholder</div>
  }))
);

// ✅ AFTER - Correct lazy import pattern
const UserDelegationsPage = lazy(() => import('../../pages/UserDelegationsPage'));
const AddUserDelegationPage = lazy(() => import('../../pages/AddUserDelegationPage'));
```

---

## 📋 Files Changed

### Created:
1. `/app/(admin)/platform/user-delegations/page.tsx` - Main delegations list page
2. `/app/(admin)/platform/user-delegations/create/page.tsx` - Create delegation page
3. `/docs/bugfix/BUGFIX-2026-01-20-user-delegations-lazy-import.md` - This doc

### Modified:
1. `/pages/UserDelegationsPage.tsx` - Fixed import path
2. `/pages/AddUserDelegationPage.tsx` - Fixed import path
3. `/modules/user-delegations/index.tsx` - Removed .catch() pattern

---

## 🔍 Technical Details

### Why `.catch()` Pattern Failed

The `.catch()` pattern was wrapping the lazy import:
```typescript
lazy(() => import('...').catch(() => ({ default: Component })))
```

Problem:
- `lazy()` expects a Promise that resolves to a module with `default` export
- `.catch()` returns a new Promise that always resolves (never throws)
- When import fails, `.catch()` returns `{ default: () => <div>...</div> }`
- This creates a Promise wrapping an object, not a proper React component
- React can't render this properly → "Element type is invalid" error

### Correct Pattern

```typescript
// ✅ CORRECT - Direct lazy import
const Component = lazy(() => import('./path'));

// With Suspense fallback for loading state
<Suspense fallback={<LoadingFallback />}>
  <Component />
</Suspense>
```

### Architecture Pattern

Following the established migration pattern:

```
1. App Router (Source of Truth)
   /app/(admin)/platform/user-delegations/page.tsx
   └─ Business logic, API calls, state management

2. Bridge Files (Re-export)
   /pages/UserDelegationsPage.tsx
   └─ import from app router, re-export default

3. Module Definition (Lazy Load)
   /modules/user-delegations/index.tsx
   └─ lazy(() => import bridge file)
```

This avoids circular dependencies and maintains clean separation.

---

## 🎯 Key Features Implemented

### Main Page (`page.tsx`):
- ✅ Statistics dashboard (4 cards)
- ✅ Search by email/name
- ✅ Filter by status (all, active, pending, expired, revoked)
- ✅ Filter by scope (8 types)
- ✅ Delegation cards with full details
- ✅ Status & scope badges with icons
- ✅ Date range display
- ✅ Tenant name display
- ✅ Delete functionality
- ✅ Dark mode support

### Create Page (`create/page.tsx`):
- ✅ Delegator selection (from users table)
- ✅ Delegate selection (from users table)
- ✅ Tenant selection (optional, from tenants table)
- ✅ Scope selection (8 predefined types)
- ✅ Date range picker (start & end)
- ✅ Reason textarea (optional)
- ✅ Custom permissions JSON editor (for custom scope)
- ✅ Form validation (prevent self-delegation, date validation)
- ✅ Success/error toast notifications
- ✅ Navigation back to list after create

---

## 🧪 Testing Checklist

- [x] Click "Ủy quyền" menu item → Page loads successfully
- [ ] View delegations list with filters
- [ ] Create new delegation
- [ ] Delete delegation
- [ ] Test all status filters
- [ ] Test all scope filters
- [ ] Test search functionality
- [ ] Verify dark mode styling
- [ ] Check responsive layout

---

## 📚 Related

- Previous fix: `BUGFIX-2026-01-15-user-delegations-menu-error.md`
- Similar pattern fixes in other 6 modules (2026-01-15)
- Migration pattern doc: `/docs/migration/bridge-pattern.md`
- Hook: `/hooks/useUserDelegations.ts`
- API: `/api/userDelegationsApi.ts`

---

## 💡 Lessons Learned

1. **Never use `.catch()` with `lazy()`** - Let Suspense handle loading/error states
2. **Always create app router pages first** before bridge files
3. **Follow the 3-tier pattern**: app router → bridge → module lazy import
4. **Bridge files are dumb re-exports** - No logic, just import and export
5. **Module definitions use simple lazy imports** - No fallback logic needed

---

## ✨ Next Steps

1. Test all delegation CRUD operations
2. Add edit delegation functionality (currently only view & delete)
3. Add delegation approval workflow
4. Add delegation history/audit log
5. Implement notifications for delegation events
6. Add bulk operations (bulk approve, bulk revoke)
