# Bug Fix: Missing Menu Items - Module ID Mismatch

**Ngày:** 2026-01-15  
**Loại:** Bug Fix  
**Mức độ:** High  
**Trạng thái:** ✅ FIXED

## Vấn đề

Một số menu không hiển thị trong sidebar mặc dù đã được đăng ký trong `moduleRegistration.tsx`:
- ❌ Quản lý người dùng (Users)
- ❌ Danh mục hệ thống (System Categories)
- ❌ Reserved Slugs
- ❌ Ủy quyền (User Delegations)

## Root Cause Analysis

### Vấn đề 1: Module ID Mismatch

**AppLayout.tsx** sử dụng `MENU_GROUPS` để tổ chức menu theo nhóm. Mỗi group có danh sách `moduleIds` để filter modules:

```typescript
// AppLayout.tsx - OLD
const MENU_GROUPS: MenuGroup[] = [
  {
    id: 'identity',
    label: 'QUẢN TRỊ & TRUY CẬP',
    moduleIds: ['tenants', 'user', 'roles', ...],  // ❌ 'user' (sai)
  },
  {
    id: 'platform',
    label: 'NỀN TẢNG & CẤU HÌNH',
    moduleIds: ['applications', 'system-category', ...],  // ❌ 'system-category' (sai)
  },
];
```

**Nhưng actual module IDs:**

```typescript
// /modules/user/index.tsx
export const UsersModule: ModuleDefinition = {
  id: "users",  // ✅ "users" (số nhiều)
  name: "Quản lý người dùng",
  // ...
};

// /modules/system-category/index.tsx
export const SystemCategoryModule: ModuleDefinition = {
  id: "system-categories",  // ✅ "system-categories" (số nhiều)
  name: "Danh mục hệ thống",
  // ...
};
```

**Result:** AppLayout tìm `'user'` và `'system-category'` nhưng không tìm thấy vì ID thực tế là `'users'` và `'system-categories'`.

### Vấn đề 2: Missing Properties

**Reserved Slugs Module:**
```typescript
// OLD - /modules/reserved-slugs/module.tsx
export const ReservedSlugsModule: ModuleDefinition = {
  id: 'reserved-slugs',
  name: 'Reserved Slugs',
  // ❌ Missing: enabled: true
  // ❌ Missing: showInSidebar: true
  routes: [...],
  menuItems: [...],
};
```

**Result:** Module không xuất hiện trong sidebar vì thiếu `showInSidebar: true`.

### Vấn đề 3: Wrong Type

**User Delegations Module:**
```typescript
// OLD - /modules/user-delegations/index.ts
import type { Module } from '../../core/ModuleRegistry';  // ❌ Old type

export const UserDelegationsModule: Module = {  // ❌ Wrong type
  id: 'user-delegations',
  // ❌ Missing: enabled, showInSidebar
  // ❌ File extension: .ts instead of .tsx
  routes: [],
  menu: {  // ❌ Old format: 'menu' instead of 'menuItems'
    label: 'Ủy quyền',
    // ...
  },
};
```

**Result:** 
- Sử dụng type `Module` cũ thay vì `ModuleDefinition`
- File `.ts` không support JSX (icons)
- Thiếu `enabled`, `showInSidebar`
- Format `menu` cũ thay vì `menuItems`

## Solution

### Fix 1: Correct Module IDs in AppLayout

**File:** `/components/layout/AppLayout.tsx`

```typescript
// BEFORE
const MENU_GROUPS: MenuGroup[] = [
  {
    id: 'identity',
    label: 'QUẢN TRỊ & TRUY CẬP',
    moduleIds: ['tenants', 'user', 'roles', ...],  // ❌ 'user'
  },
  {
    id: 'platform',
    label: 'NỀN TẢNG & CẤU HÌNH',
    moduleIds: ['applications', 'system-category', ...],  // ❌ 'system-category'
  },
];

// AFTER
const MENU_GROUPS: MenuGroup[] = [
  {
    id: 'identity',
    label: 'QUẢN TRỊ & TRUY CẬP',
    moduleIds: ['tenants', 'users', 'roles', 'audit-logs', 'auth-logs', 'tenant-members', 'user-roles', 'user-delegations'],  // ✅ 'users' + added 'user-delegations'
  },
  {
    id: 'platform',
    label: 'NỀN TẢNG & CẤU HÌNH',
    moduleIds: ['applications', 'system-categories', 'rate-limits', 'reserved-slugs', 'system-announcements', 'notification-templates'],  // ✅ 'system-categories'
  },
];
```

**Changes:**
- ✅ `'user'` → `'users'`
- ✅ `'system-category'` → `'system-categories'`
- ✅ Added `'user-delegations'` to identity group

### Fix 2: Add Missing Properties to Reserved Slugs

**File:** `/modules/reserved-slugs/module.tsx`

```typescript
// BEFORE
export const ReservedSlugsModule: ModuleDefinition = {
  id: 'reserved-slugs',
  name: 'Reserved Slugs',
  description: 'Manage system-wide reserved slugs and keywords',
  icon: <Shield className="w-4 h-4" />,
  version: '1.0.0',
  category: 'system',
  // ❌ Missing enabled and showInSidebar
  routes: [...],
  menuItems: [...],
};

// AFTER
export const ReservedSlugsModule: ModuleDefinition = {
  id: 'reserved-slugs',
  name: 'Reserved Slugs',
  description: 'Manage system-wide reserved slugs and keywords',
  icon: <Shield className="w-4 h-4" />,
  version: '1.0.0',
  category: 'system',
  enabled: true,           // ✅ Added
  showInSidebar: true,     // ✅ Added
  routes: [...],
  menuItems: [...],
};
```

### Fix 3: Rewrite User Delegations Module

**File:** `/modules/user-delegations/index.tsx` (changed from .ts)

```typescript
// BEFORE - index.ts
import type { Module } from '../../core/ModuleRegistry';  // ❌ Old type

export const UserDelegationsModule: Module = {
  id: 'user-delegations',
  name: 'Ủy quyền',
  description: 'Quản lý ủy quyền giữa các users',
  version: '1.0.0',
  routes: [],
  menu: {  // ❌ Old format
    label: 'Ủy quyền',
    icon: Users,  // ❌ Not JSX
    path: '/core/user-delegations',
    order: 95,
    group: 'system',
  },
};

// AFTER - index.tsx
import { Suspense, lazy } from 'react';
import { UserCog } from 'lucide-react';
import type { ModuleDefinition } from '../../core/ModuleRegistry';  // ✅ New type
import { LoadingFallback } from '../../components/LoadingFallback';

const UserDelegationsPage = lazy(() => import('../../pages/UserDelegationsPage').catch(() => ({
  default: () => (
    <div className="p-8 text-center">
      <UserCog className="w-16 h-16 mx-auto mb-4 text-gray-400" />
      <h2 className="text-2xl font-bold mb-2">Ủy quyền</h2>
      <p className="text-gray-600">Tính năng quản lý ủy quyền giữa các users đang được phát triển</p>
    </div>
  )
})));

export const UserDelegationsModule: ModuleDefinition = {  // ✅ New type
  id: 'user-delegations',
  name: 'Ủy quyền',
  description: 'Quản lý ủy quyền giữa các users',
  icon: <UserCog className="w-4 h-4" />,  // ✅ JSX icon
  version: '1.0.0',
  enabled: true,           // ✅ Added
  showInSidebar: true,     // ✅ Added
  routes: [                // ✅ Added route with lazy loading
    {
      path: '/core/user-delegations',
      element: (
        <Suspense fallback={<LoadingFallback message="Đang tải..." />}>
          <UserDelegationsPage />
        </Suspense>
      ),
      title: 'User Delegations',
    },
  ],
  menuItems: [             // ✅ New format (not 'menu')
    {
      id: 'user-delegations',
      label: 'Ủy quyền',
      path: '/core/user-delegations',
      icon: <UserCog className="w-4 h-4" />,
      order: 95,
      description: 'Quản lý ủy quyền giữa các users',
    },
  ],
};
```

**Changes:**
- ✅ Changed file extension: `.ts` → `.tsx`
- ✅ Changed type: `Module` → `ModuleDefinition`
- ✅ Added `enabled: true`, `showInSidebar: true`
- ✅ Icon as JSX: `Users` → `<UserCog className="w-4 h-4" />`
- ✅ Format: `menu` → `menuItems` array
- ✅ Added route with lazy loading
- ✅ Added fallback page for coming soon

**File deleted:** `/modules/user-delegations/index.ts`

## Verification

### Check Module Registry

```typescript
const registry = ModuleRegistry.getInstance();
const modules = registry.getEnabledModules();

console.log('Registered modules:');
modules.forEach(m => {
  console.log(`- ${m.id}: ${m.name} (showInSidebar: ${m.showInSidebar})`);
});

// Expected output:
// - users: Quản lý người dùng (showInSidebar: true) ✅
// - system-categories: Danh mục hệ thống (showInSidebar: true) ✅
// - reserved-slugs: Reserved Slugs (showInSidebar: true) ✅
// - user-delegations: Ủy quyền (showInSidebar: true) ✅
```

### Check Menu Groups

```typescript
MENU_GROUPS.forEach(group => {
  console.log(`\n${group.label}:`);
  group.moduleIds.forEach(id => {
    const module = registry.getModule(id);
    console.log(`  - ${id}: ${module ? '✅ Found' : '❌ Not found'}`);
  });
});

// Expected output:
// QUẢN TRỊ & TRUY CẬP:
//   - users: ✅ Found
//   - user-delegations: ✅ Found
// NỀN TẢNG & CẤU HÌNH:
//   - system-categories: ✅ Found
//   - reserved-slugs: ✅ Found
```

### Visual Check in Sidebar

**Group: QUẢN TRỊ & TRUY CẬP**
```
✅ Tenants
✅ Quản lý người dùng       ← Now visible!
✅ Roles
✅ Audit Logs
✅ Auth Logs
✅ Tenant Members
✅ User Roles
✅ Ủy quyền                  ← Now visible!
```

**Group: NỀN TẢNG & CẤU HÌNH**
```
✅ Applications
✅ Danh mục hệ thống         ← Now visible!
✅ Rate Limits
✅ Reserved Slugs            ← Now visible!
✅ System Announcements
✅ Notification Templates
```

## Files Modified

### Modified Files
1. ✅ `/components/layout/AppLayout.tsx`
   - Fixed module IDs: `'user'` → `'users'`
   - Fixed module IDs: `'system-category'` → `'system-categories'`
   - Added `'user-delegations'` to identity group

2. ✅ `/modules/reserved-slugs/module.tsx`
   - Added `enabled: true`
   - Added `showInSidebar: true`

### Created Files
3. ✅ `/modules/user-delegations/index.tsx`
   - New file with correct ModuleDefinition format
   - Added all required properties
   - Added lazy loading with fallback page

### Deleted Files
4. ✅ `/modules/user-delegations/index.ts`
   - Removed old file with wrong format

5. ✅ `/docs/bugfix/FIX-2026-01-15-missing-menu-items-module-id-mismatch.md`
   - This documentation file

## Impact Analysis

### Before Fix
- **Missing menus:** 4 items không hiển thị
- **User confusion:** Không thấy Quản lý người dùng, Danh mục hệ thống, Reserved Slugs, Ủy quyền
- **Inconsistent:** Một số modules registered nhưng không visible

### After Fix
- ✅ **All menus visible:** Tất cả 4 items đều hiển thị đúng group
- ✅ **Consistent naming:** Module IDs match giữa definition và usage
- ✅ **Proper grouping:** Items xuất hiện đúng group logic
- ✅ **Type safety:** Tất cả modules dùng ModuleDefinition type

## Best Practices Learned

### 1. Module ID Naming Convention

**Recommendation:** Luôn dùng số nhiều cho collection resources

```typescript
// ✅ GOOD
id: 'users'           // Collection of users
id: 'products'        // Collection of products
id: 'system-categories'  // Collection of categories

// ❌ BAD
id: 'user'            // Singular
id: 'product'         // Singular
id: 'system-category' // Singular
```

### 2. Module Definition Checklist

Mỗi module PHẢI có:
```typescript
export const MyModule: ModuleDefinition = {
  // Required
  id: 'my-module',              // ✅ Unique, lowercase, kebab-case
  name: 'My Module',            // ✅ Display name
  
  // Strongly recommended
  enabled: true,                // ✅ Control visibility
  showInSidebar: true,          // ✅ Show in navigation
  icon: <Icon />,               // ✅ JSX icon component
  
  // Required for routing
  routes: [...],                // ✅ Route definitions with lazy loading
  
  // Required for sidebar
  menuItems: [...],             // ✅ Menu item definitions
  
  // Optional but recommended
  description: '...',           // ✅ Brief description
  version: '1.0.0',            // ✅ Version tracking
};
```

### 3. File Extensions

```typescript
// ✅ Use .tsx for files with JSX
/modules/my-module/index.tsx   // Contains JSX icons

// ❌ Don't use .ts for JSX
/modules/my-module/index.ts    // Can't render <Icon />
```

### 4. Menu Group Configuration

**AppLayout.tsx** menu groups phải match exactly với module IDs:

```typescript
// Step 1: Check module definition
// /modules/users/index.tsx
export const UsersModule: ModuleDefinition = {
  id: 'users',  // ← Note the actual ID
  // ...
};

// Step 2: Use EXACT same ID in menu groups
// /components/layout/AppLayout.tsx
const MENU_GROUPS: MenuGroup[] = [
  {
    id: 'identity',
    moduleIds: ['users'],  // ← Must match exactly!
  },
];
```

### 5. Type Migration

When migrating from old module format:

```typescript
// OLD FORMAT ❌
import type { Module } from '...';
export const MyModule: Module = {
  menu: { ... },  // Old
};

// NEW FORMAT ✅
import type { ModuleDefinition } from '...';
export const MyModule: ModuleDefinition = {
  menuItems: [...],  // New
  enabled: true,
  showInSidebar: true,
};
```

## Testing Checklist

- [x] All 4 missing menus now visible in sidebar
- [x] Menus appear in correct groups
- [x] Icons render correctly
- [x] Routes work when clicking menu items
- [x] No console errors
- [x] Module registry shows all modules
- [x] Menu groups filter modules correctly
- [x] Lazy loading works for all routes
- [x] Fallback pages shown while loading

## Related Issues

This fix resolves the menu visibility issue and complements:
- ✅ Orders Module route conflict fix (2026-01-15)
- ✅ Invoice Module route conflict fix (2026-01-15)
- ✅ System Announcements CRUD implementation (2026-01-15)

## Conclusion

**Root cause:** Module ID mismatch giữa module definitions và AppLayout menu groups configuration.

**Solution:** 
1. ✅ Corrected module IDs in MENU_GROUPS
2. ✅ Added missing properties (enabled, showInSidebar)
3. ✅ Migrated User Delegations to new format
4. ✅ Fixed file extensions (.ts → .tsx)

**Result:** Tất cả menus hiện đã visible và hoạt động chính xác! 🎉

**Future prevention:** 
- Use consistent naming (plural for collections)
- Always include enabled and showInSidebar
- Use .tsx for files with JSX
- Document module IDs in central location
- Add automated tests to verify menu visibility
