# React Lazy Import Pattern Guide for App Router Pages

**Date**: 2026-01-20  
**Topic**: Best practices cho lazy loading Next.js 14 App Router pages trong React SPA  
**Status**: ✅ DOCUMENTED

## Current Architecture

Dự án này đang migration từ React SPA sang Next.js 14 App Router:
- **Source of truth**: Code chính nằm ở `/app/(admin)/`
- **Bridge files**: `/pages/` directory chỉ import và re-export từ `/app/`
- **Module system**: ModuleRegistry lazy loads các modules từ `/modules/`

## App Router Pages Export Pattern

### Current Pattern (CORRECT)

Các App Router pages đang export cả named và default:

```tsx
// /app/(admin)/admin/roles/page.tsx

'use client';

function RolesPage() {
  // Component logic...
  return <div>...</div>;
}

// Named export for reuse
export { RolesPage };

// Default export for routing
export default RolesPage;
```

**✅ This is perfectly valid in React/Next.js**

### Why Both Exports?

1. **Default export**: Required by Next.js App Router file-based routing
2. **Named export**: Allows importing component by name for testing/reuse
3. **No conflict**: React.lazy() specifically looks for default export

## Lazy Import Pattern

### Module Registry Pattern (CURRENT - CORRECT)

```tsx
// /modules/roles/index.tsx

import { lazy } from 'react';

const RolesPage = lazy(() => 
  import("../../app/(admin)/admin/roles/page")
);
```

**✅ This correctly imports the default export**

React.lazy() automatically:
1. Imports the module
2. Looks for `default` export
3. Ignores named exports

### Bridge File Pattern (CURRENT - CORRECT)

```tsx
// /pages/RolesPage.tsx

import RolesPage from '@/app/(admin)/admin/roles/page';
export default RolesPage;
```

**✅ Simple re-export of default**

## Common Anti-Patterns

### ❌ WRONG: Explicit default extraction
```tsx
// Unnecessary - React.lazy() does this automatically
const RolesPage = lazy(() => 
  import("../../app/(admin)/admin/roles/page")
    .then(module => ({ default: module.default }))
);
```

### ❌ WRONG: Named export in lazy()
```tsx
// This will fail - lazy() needs default
const RolesPage = lazy(() => 
  import("../../app/(admin)/admin/roles/page")
    .then(module => module.RolesPage) // ❌ Wrong
);
```

### ❌ WRONG: No default export in source
```tsx
// Source file without default export
export function RolesPage() { ... } // Only named
// ❌ lazy() will fail - needs default export
```

## React.jsx Warnings

Nếu gặp React.jsx warnings về lazy import, thường do:

### 1. Missing Default Export
```tsx
// ❌ BAD - No default export
export function MyPage() { ... }

// ✅ GOOD - Has default export
function MyPage() { ... }
export default MyPage;
```

### 2. Circular Dependencies
```tsx
// ❌ BAD - Page imports from module, module imports page
// /app/page.tsx
import { Something } from '@/modules/...'

// /modules/index.tsx  
import Page from '@/app/page'  // ❌ Circular!
```

### 3. SSR vs Client Mismatch
```tsx
// ❌ BAD - Mixing server and client components
'use client';  // Client component
import ServerComponent from './server';  // Imports server component
```

## Verification Checklist

Để verify lazy import pattern đúng:

- [ ] Source page có `'use client'` directive (nếu cần client features)
- [ ] Source page có **default export**
- [ ] Module registry dùng `lazy(() => import('...'))`
- [ ] Bridge files dùng simple `import/export default`
- [ ] Không có circular dependencies
- [ ] Suspense wrapper bao quanh lazy components

## Example: Complete Pattern

### 1. App Router Page
```tsx
// /app/(admin)/admin/roles/page.tsx
'use client';

import { useState } from 'react';

function RolesPage() {
  const [roles, setRoles] = useState([]);
  return <div>Roles List</div>;
}

// Named export (optional, for testing)
export { RolesPage };

// Default export (required)
export default RolesPage;
```

### 2. Module Definition
```tsx
// /modules/roles/index.tsx
import { lazy, Suspense } from 'react';
import { ModuleDefinition } from '@/core/ModuleRegistry';
import { LoadingFallback } from '@/components/LoadingFallback';

// Lazy load page
const RolesPage = lazy(() => 
  import('../../app/(admin)/admin/roles/page')
);

export const RolesModule: ModuleDefinition = {
  id: 'roles',
  routes: [
    {
      path: '/admin/roles',
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <RolesPage />
        </Suspense>
      ),
    },
  ],
};
```

### 3. Bridge File
```tsx
// /pages/RolesPage.tsx
import RolesPage from '@/app/(admin)/admin/roles/page';
export default RolesPage;
```

## Performance Benefits

Lazy loading provides:
1. **Smaller initial bundle** - Core code only
2. **Faster startup** - Less to parse/execute
3. **On-demand loading** - Load features when needed
4. **Better caching** - Separate chunks per module

## Migration Notes

Khi migrate pages sang pattern này:

1. ✅ Move logic to `/app/(admin)/[path]/page.tsx`
2. ✅ Add `'use client'` nếu dùng hooks/state
3. ✅ Export both named and default
4. ✅ Update module registry lazy import
5. ✅ Create simple bridge file in `/pages/`
6. ✅ Wrap in Suspense with fallback

## Debugging Tips

Nếu lazy import không work:

1. **Check console for import errors**
   ```
   Failed to load module: roles
   ```

2. **Verify file exists at correct path**
   ```bash
   ls -la app/(admin)/admin/roles/page.tsx
   ```

3. **Check for TypeScript errors**
   ```bash
   npx tsc --noEmit
   ```

4. **Verify default export exists**
   ```tsx
   // In browser console:
   import('./app/(admin)/admin/roles/page').then(m => console.log(m.default))
   ```

## Related Documents

- `/docs/MIGRATION_COMPLETE_SUMMARY.md` - Overall migration status
- `/docs/CODING_STANDARDS_NEXTJS_READY.md` - Coding standards
- `/MASTER_REFACTOR_PLAN.md` - Refactor strategy

## Conclusion

Current lazy import pattern là **CORRECT và OPTIMAL**:
- ✅ App Router pages export both named & default
- ✅ Module registry lazy loads from app directory
- ✅ Bridge files simple re-export
- ✅ No circular dependencies
- ✅ Proper Suspense boundaries

Không cần thay đổi gì thêm về lazy import pattern. Nếu có React warnings, chúng likely do các issues khác (xem Debugging Tips section).
