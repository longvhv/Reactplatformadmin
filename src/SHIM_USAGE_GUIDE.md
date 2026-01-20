# 📘 SHIM USAGE GUIDE

## 🎯 Purpose

The shim layer provides Next.js-compatible navigation hooks while using React Router. This allows gradual migration to Next.js App Router without breaking existing functionality.

---

## 📦 Available Hooks

### 1. useRouter()

Next.js-compatible router hook.

#### Usage:
```typescript
import { useRouter } from '@/components/shim/next-navigation';

function MyComponent() {
  const router = useRouter();
  
  // Navigate to a page
  router.push('/admin/users');
  
  // Replace (no history entry)
  router.replace('/admin/dashboard');
  
  // Go back
  router.back();
  
  // Go forward
  router.forward();
  
  // Refresh page
  router.refresh();
  
  // Get current pathname
  console.log(router.pathname); // "/admin/users"
}
```

#### Migration from react-router-dom:
```typescript
// ❌ OLD (react-router-dom)
import { useNavigate } from 'react-router-dom';

function MyComponent() {
  const navigate = useNavigate();
  navigate('/admin/users');
  navigate('/admin/users', { replace: true });
  navigate(-1);
}

// ✅ NEW (shim)
import { useRouter } from '@/components/shim/next-navigation';

function MyComponent() {
  const router = useRouter();
  router.push('/admin/users');
  router.replace('/admin/users');
  router.back();
}
```

---

### 2. useParams()

Extract route parameters from dynamic routes.

#### Usage:
```typescript
import { useParams } from '@/components/shim/next-navigation';

// Route: /admin/users/[id]
// URL: /admin/users/123

function UserDetailPage() {
  const params = useParams<{ id: string }>();
  const userId = params?.id; // "123"
  
  return <div>User ID: {userId}</div>;
}
```

#### Works with:
- React Router style: `/admin/users/:id`
- Next.js style: `/admin/users/[id]`

---

### 3. usePathname()

Get current pathname.

#### Usage:
```typescript
import { usePathname } from '@/components/shim/next-navigation';

function MyComponent() {
  const pathname = usePathname();
  console.log(pathname); // "/admin/users"
  
  return <div>Current page: {pathname}</div>;
}
```

---

### 4. useSearchParams()

Access URL query parameters.

#### Usage:
```typescript
import { useSearchParams } from '@/components/shim/next-navigation';

// URL: /admin/users?search=john&page=2

function UsersPage() {
  const searchParams = useSearchParams();
  
  const search = searchParams.get('search'); // "john"
  const page = searchParams.get('page');     // "2"
  
  return <div>Search: {search}, Page: {page}</div>;
}
```

---

## 📁 File Structure

### Implementation in /app/

```typescript
// /app/(admin)/admin/users/page.tsx
'use client';

import { useRouter, useParams } from '@/components/shim/next-navigation';

function UsersPage() {
  const router = useRouter();
  const params = useParams();
  
  // Your component logic here
  
  return <div>Users Page</div>;
}

// ✅ IMPORTANT: Named export for reuse
export { UsersPage };

// ✅ Default export for routing
export default UsersPage;
```

### Wrapper in /pages/

```typescript
// /pages/UsersPage.tsx
'use client';

/**
 * UsersPage - Thin Wrapper
 * ✅ Imports from /app/ - No logic here
 */

import { UsersPage as UsersPageComponent } from '@/app/(admin)/admin/users/page';

export default function UsersPage() {
  return <UsersPageComponent />;
}
```

---

## 🔄 Complete Migration Example

### Before (React Router):

```typescript
// /pages/UsersPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersApi } from '@/api/usersApi';

export default function UsersPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  
  useEffect(() => {
    loadUsers();
  }, []);
  
  const loadUsers = async () => {
    const data = await usersApi.getAll();
    setUsers(data);
  };
  
  const handleAddClick = () => {
    navigate('/admin/users/create');
  };
  
  return (
    <div>
      <button onClick={handleAddClick}>Add User</button>
      {/* User list */}
    </div>
  );
}
```

### After (With Shim):

**Step 1: Create implementation in /app/**

```typescript
// /app/(admin)/admin/users/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/components/shim/next-navigation'; // ✅ Changed
import { usersApi } from '@/api/usersApi';

function UsersPage() {
  const router = useRouter(); // ✅ Changed from useNavigate
  const [users, setUsers] = useState([]);
  
  useEffect(() => {
    loadUsers();
  }, []);
  
  const loadUsers = async () => {
    const data = await usersApi.getAll();
    setUsers(data);
  };
  
  const handleAddClick = () => {
    router.push('/admin/users/create'); // ✅ Changed from navigate()
  };
  
  return (
    <div>
      <button onClick={handleAddClick}>Add User</button>
      {/* User list */}
    </div>
  );
}

// ✅ Named export
export { UsersPage };

// ✅ Default export
export default UsersPage;
```

**Step 2: Update wrapper in /pages/**

```typescript
// /pages/UsersPage.tsx
'use client';

import { UsersPage as UsersPageComponent } from '@/app/(admin)/admin/users/page';

export default function UsersPage() {
  return <UsersPageComponent />;
}
```

---

## 🗺️ Dynamic Routes Example

### Detail Page with [id]:

```typescript
// /app/(admin)/admin/users/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from '@/components/shim/next-navigation';
import { usersApi } from '@/api/usersApi';

function UserDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const userId = params?.id;
  
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    if (userId) {
      loadUser(userId);
    }
  }, [userId]);
  
  const loadUser = async (id: string) => {
    const data = await usersApi.getById(id);
    setUser(data);
  };
  
  const handleBack = () => {
    router.back();
  };
  
  return (
    <div>
      <button onClick={handleBack}>Back</button>
      <h1>User: {user?.name}</h1>
    </div>
  );
}

export { UserDetailPage };
export default UserDetailPage;
```

---

## ✅ Migration Checklist

When migrating a page:

- [ ] Create new file in `/app/(admin)/[path]/page.tsx`
- [ ] Add `'use client'` directive at top
- [ ] Change imports:
  - [ ] `useNavigate` → `useRouter`
  - [ ] Import from `@/components/shim/next-navigation`
- [ ] Update hook calls:
  - [ ] `const navigate = useNavigate()` → `const router = useRouter()`
  - [ ] `navigate('/path')` → `router.push('/path')`
  - [ ] `navigate('/path', { replace: true })` → `router.replace('/path')`
  - [ ] `navigate(-1)` → `router.back()`
- [ ] Add exports:
  - [ ] Named export: `export { ComponentName }`
  - [ ] Default export: `export default ComponentName`
- [ ] Update `/pages/` file to thin wrapper
- [ ] Test navigation works
- [ ] Verify no console errors

---

## 🚨 Common Mistakes

### ❌ Mistake 1: Putting logic in wrapper

```typescript
// /pages/UsersPage.tsx - WRONG!
export default function UsersPage() {
  const [users, setUsers] = useState([]); // ❌ NO!
  useEffect(() => { ... }); // ❌ NO!
  return <div>...</div>;
}
```

### ✅ Correct: Keep wrapper thin

```typescript
// /pages/UsersPage.tsx - CORRECT!
import { UsersPage } from '@/app/(admin)/admin/users/page';
export default UsersPage; // ✅ Just re-export
```

---

### ❌ Mistake 2: Forgetting named export

```typescript
// /app/(admin)/admin/users/page.tsx - WRONG!
export default function UsersPage() { ... } // ❌ Only default
```

### ✅ Correct: Both exports

```typescript
// /app/(admin)/admin/users/page.tsx - CORRECT!
function UsersPage() { ... }
export { UsersPage };      // ✅ Named
export default UsersPage;  // ✅ Default
```

---

### ❌ Mistake 3: Wrong import path

```typescript
// Wrong
import { useRouter } from 'next/navigation'; // ❌ Real Next.js
import { useRouter } from '@/lib/router';    // ❌ Custom
```

### ✅ Correct: Use shim

```typescript
import { useRouter } from '@/components/shim/next-navigation'; // ✅
```

---

## 🎓 Best Practices

1. **Always use shim hooks** - Don't mix with react-router-dom
2. **Test after migration** - Verify all navigation works
3. **Keep wrappers thin** - No logic in /pages/
4. **Use TypeScript** - Type your params properly
5. **Document edge cases** - Note any special behavior
6. **Test deep links** - Verify params work correctly

---

## 🔄 When Ready for Real Next.js

When you're ready to migrate to real Next.js:

1. **Remove shim**:
   - Delete `/components/shim/`
   - Delete `/components/shim/AppRoutes.tsx`

2. **Update imports**:
   ```typescript
   // Change all:
   import { useRouter } from '@/components/shim/next-navigation';
   
   // To:
   import { useRouter } from 'next/navigation';
   ```

3. **Remove /pages/ directory**:
   - Delete entire `/pages/` folder
   - Only `/app/` remains

4. **Update App.tsx**:
   - Remove React Router setup
   - Use Next.js routing

That's it! Everything will work the same! 🎉

---

## 📚 Additional Resources

- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [React Router Migration Guide](https://reactrouter.com/en/main/upgrading/v6)
- `/NEXTJS_MIGRATION_MASTER_PLAN.md` - Full migration plan
- `/MIGRATION_PROGRESS.md` - Track progress

---

**Happy Migrating!** 🚀
