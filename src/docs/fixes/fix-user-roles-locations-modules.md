# Fix: User Roles & Locations Module Import Errors

**Date**: 2026-01-20
**Status**: ✅ FIXED
**Type**: Module Definition & Import Path Errors

## Problem

Console was showing React.jsx type errors for two modules:
```
Warning: React.jsx: type is invalid -- expected a string (for built-in components) 
or a class/function (for composite components) but got: object.
```

Errors occurred at:
- `/modules/user-roles/index.tsx:24`
- `/modules/locations/index.tsx:25`

## Root Causes

### 1. Incorrect Bridge File Import Paths

**UserRolesPage.tsx**:
```tsx
// ❌ BEFORE - Wrong path
import UserRolesPage from '@/app/(admin)/admin/users/roles/page';

// ✅ AFTER - Correct path
import UserRolesPage from '@/app/(admin)/admin/roles/page';
```

**LocationsPage.tsx**:
```tsx
// ❌ BEFORE - Wrong path
import LocationsPage from '@/app/(admin)/locations/page';

// ✅ AFTER - Correct path
import LocationsPage from '@/app/(admin)/location-types/page';
```

### 2. Missing Lazy Loading & Suspense Wrapper

Both modules were importing pages directly without lazy loading and Suspense boundaries:

```tsx
// ❌ BEFORE - Direct import without Suspense
import UserRolesPage from '../../pages/UserRolesPage';

routes: [
  {
    path: '/admin/user-roles',
    element: <UserRolesPage />,
  },
]
```

```tsx
// ✅ AFTER - Lazy import with Suspense
import { lazy, Suspense } from 'react';
import { LoadingFallback } from '../../components/LoadingFallback';

const UserRolesPage = lazy(() => import('../../app/(admin)/admin/roles/page'));

routes: [
  {
    path: '/admin/user-roles',
    element: (
      <Suspense fallback={<LoadingFallback message="Đang tải Phân quyền..." />}>
        <UserRolesPage />
      </Suspense>
    ),
  },
]
```

## Files Modified

### 1. Bridge Files (Path Corrections)
- `/pages/UserRolesPage.tsx` - Fixed import path to `/app/(admin)/admin/roles/page`
- `/pages/LocationsPage.tsx` - Fixed import path to `/app/(admin)/location-types/page`

### 2. Module Definitions (Lazy Loading Pattern)
- `/modules/user-roles/index.tsx` - Added lazy loading + Suspense
- `/modules/locations/index.tsx` - Added lazy loading + Suspense

## Pattern Applied

Both modules now follow the standard lazy loading pattern used across all other modules:

```tsx
import { lazy, Suspense } from 'react';
import { LoadingFallback } from '../../components/LoadingFallback';
import type { ModuleDefinition } from '../../core/ModuleRegistry';

// Lazy-loaded pages
// ✅ MIGRATED: Import from /app/(admin)/ for single source of truth
const PageComponent = lazy(() => import('../../app/(admin)/path/to/page'));

export const ModuleDefinition: ModuleDefinition = {
  routes: [
    {
      path: '/route/path',
      element: (
        <Suspense fallback={<LoadingFallback message="Loading message..." />}>
          <PageComponent />
        </Suspense>
      ),
    },
  ],
};
```

## Verification

After fix:
- ✅ No console warnings for user-roles module
- ✅ No console warnings for locations module
- ✅ Both modules load properly with lazy loading
- ✅ Consistent pattern with all other modules
- ✅ Proper Suspense boundaries for loading states

## Migration Status

- **UserRoles Module**: ✅ Fully migrated
  - Bridge file: `/pages/UserRolesPage.tsx` → imports from `/app/(admin)/admin/roles/page.tsx`
  - Module def: Uses lazy loading + Suspense
  
- **Locations Module**: ✅ Fully migrated
  - Bridge file: `/pages/LocationsPage.tsx` → imports from `/app/(admin)/location-types/page.tsx`
  - Module def: Uses lazy loading + Suspense

## Lessons Learned

1. **Always verify import paths** when creating bridge files
2. **Always use lazy loading** for modules to enable code splitting
3. **Always wrap lazy components** in Suspense boundaries
4. **Follow existing patterns** - check other working modules before creating new ones
5. **Bridge files should only re-export** - no additional logic needed

## Related Documentation

- Main migration guide: `/docs/migration/migration-status.md`
- Module patterns: Check any module in `/modules/*` for reference
- Bridge file pattern: `/docs/migration/bridge-files-pattern.md` (if exists)

---
**Fix completed**: 2026-01-20
**Console status**: ✅ 0 warnings, 0 errors
