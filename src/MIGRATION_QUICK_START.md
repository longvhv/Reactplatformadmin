# 🚀 MIGRATION QUICK START GUIDE

## 📋 TL;DR

**Goal:** Migrate 109 pages từ `/pages/` sang `/app/(admin)/` với shim layer  
**Rule:** Code chính ở `/app/`, pages chỉ import  
**Timeline:** 9 days, 5 phases  
**Current:** Phase 0 - Ready to start

---

## ⚡ QUICK COMMANDS

### Start Migration:
```bash
# Check current status
cat MIGRATION_PROGRESS.md

# Read full plan
cat NEXTJS_MIGRATION_MASTER_PLAN.md
```

### Phase 0 - Start Here:
```bash
# Step 1: Create shim directory
mkdir -p components/shim

# Step 2: Create app directory
mkdir -p app/\(admin\)

# Step 3: Ready for implementation
# (Tell AI: "Start Phase 0")
```

---

## 🎯 MIGRATION PATTERN

### The Simple 2-Step Process:

#### STEP 1: Create Implementation in /app/
```typescript
// /app/(admin)/admin/tenants/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from '@/components/shim/next-navigation';

function TenantsPage() {
  // ✅ FULL IMPLEMENTATION HERE
  const router = useRouter();
  // ... all your logic, state, effects

  return <div>Your component</div>;
}

// ✅ IMPORTANT: Named export for reuse
export { TenantsPage };

// ✅ Default export for routing
export default TenantsPage;
```

#### STEP 2: Update Wrapper in /pages/
```typescript
// /pages/TenantsPage.tsx
'use client';

// ✅ Import from app
import { TenantsPage as TenantsPageComponent } from '@/app/(admin)/admin/tenants/page';

// ✅ Simple wrapper - NO LOGIC
export default function TenantsPage() {
  return <TenantsPageComponent />;
}
```

**That's it!** 🎉

---

## 📁 FILE STRUCTURE

### Before:
```
/pages/
  TenantsPage.tsx          ← Has full implementation ❌
```

### After:
```
/app/(admin)/
  admin/
    tenants/
      page.tsx             ← Full implementation ✅
      [id]/
        page.tsx           ← Detail page ✅
        edit/
          page.tsx         ← Edit page ✅
      create/
        page.tsx           ← Add page ✅

/pages/
  TenantsPage.tsx          ← Thin wrapper (imports from app) ✅
```

---

## 🗺️ URL MAPPING CHEAT SHEET

| Old Page File | New App Route | URL Pattern |
|---------------|---------------|-------------|
| `TenantsPage.tsx` | `app/(admin)/admin/tenants/page.tsx` | `/admin/tenants` |
| `TenantDetailPage.tsx` | `app/(admin)/admin/tenants/[id]/page.tsx` | `/admin/tenants/:id` |
| `AddTenantPage.tsx` | `app/(admin)/admin/tenants/create/page.tsx` | `/admin/tenants/create` |
| `EditTenantPage.tsx` | `app/(admin)/admin/tenants/[id]/edit/page.tsx` | `/admin/tenants/:id/edit` |

**Pattern:**
- List page: `admin/[resource]/page.tsx`
- Detail: `admin/[resource]/[id]/page.tsx`
- Create: `admin/[resource]/create/page.tsx`
- Edit: `admin/[resource]/[id]/edit/page.tsx`

---

## ✅ CHECKLIST PER PAGE

```
Migration Checklist for: ____________Page

Phase 1: Create Implementation
- [ ] Create app file: /app/(admin)/[path]/page.tsx
- [ ] Add 'use client' directive
- [ ] Import hooks from shim: @/components/shim/next-navigation
- [ ] Move all logic from /pages/ to /app/
- [ ] Add named export: export { ComponentName }
- [ ] Add default export: export default ComponentName
- [ ] Test implementation standalone

Phase 2: Update Wrapper
- [ ] Update /pages/ file to wrapper
- [ ] Add 'use client' directive
- [ ] Import from app: @/app/(admin)/[path]/page
- [ ] Create simple wrapper (< 10 lines)
- [ ] Remove all logic from wrapper
- [ ] Test wrapper works

Phase 3: Update Routes
- [ ] Update module route definition (if needed)
- [ ] Test navigation to page
- [ ] Test params extraction (if dynamic route)
- [ ] Verify no circular imports

Phase 4: Final Check
- [ ] Build succeeds: npm run build
- [ ] No console errors
- [ ] Page loads correctly
- [ ] All actions work (CRUD)
- [ ] Navigation works (back/forward)
- [ ] Mark as complete in MIGRATION_PROGRESS.md
```

---

## 🔥 COMMON PATTERNS

### Pattern 1: List Page
```typescript
// app/(admin)/admin/tenants/page.tsx
'use client';

export function TenantsPage() {
  const [tenants, setTenants] = useState([]);
  const router = useRouter();
  
  // List logic here
  
  return <div>List view</div>;
}

export default TenantsPage;
```

### Pattern 2: Detail Page (with params)
```typescript
// app/(admin)/admin/tenants/[id]/page.tsx
'use client';

import { useParams } from '@/components/shim/next-navigation';

export function TenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  
  // Detail logic here
  
  return <div>Detail for {id}</div>;
}

export default TenantDetailPage;
```

### Pattern 3: Form Page
```typescript
// app/(admin)/admin/tenants/create/page.tsx
'use client';

import { useRouter } from '@/components/shim/next-navigation';

export function AddTenantPage() {
  const router = useRouter();
  
  const handleSubmit = async () => {
    // Submit logic
    router.push('/admin/tenants');
  };
  
  return <form>...</form>;
}

export default AddTenantPage;
```

---

## 🚨 COMMON MISTAKES TO AVOID

### ❌ DON'T: Put logic in wrapper
```typescript
// /pages/TenantsPage.tsx - WRONG!
export default function TenantsPage() {
  const [data, setData] = useState([]); // ❌ NO!
  useEffect(() => { ... }); // ❌ NO!
  return <div>...</div>;
}
```

### ✅ DO: Keep wrapper thin
```typescript
// /pages/TenantsPage.tsx - CORRECT!
import { TenantsPage as Component } from '@/app/(admin)/admin/tenants/page';

export default function TenantsPage() {
  return <Component />; // ✅ YES!
}
```

### ❌ DON'T: Forget named export
```typescript
// app/(admin)/admin/tenants/page.tsx - WRONG!
export default function TenantsPage() { ... } // ❌ Only default export
```

### ✅ DO: Export both named and default
```typescript
// app/(admin)/admin/tenants/page.tsx - CORRECT!
export function TenantsPage() { ... }  // ✅ Named export
export default TenantsPage;            // ✅ Default export
```

### ❌ DON'T: Import from react-router-dom
```typescript
import { useNavigate } from 'react-router-dom'; // ❌ NO!
```

### ✅ DO: Import from shim
```typescript
import { useRouter } from '@/components/shim/next-navigation'; // ✅ YES!
```

---

## 📊 PROGRESS TRACKING

### Update Progress:
```bash
# After completing a page, update:
vim MIGRATION_PROGRESS.md

# Mark page as done:
- [x] TenantsPage  ✅

# Update counts:
**Migrated:** 1
**Remaining:** 108
**Progress:** 0.9%
```

---

## 🧪 TESTING COMMANDS

### After Each Page:
```bash
# Type check
npm run type-check

# Build check
npm run build

# Dev server
npm run dev
# Then test page manually
```

### Checklist:
- [ ] Page loads without errors
- [ ] Data displays correctly
- [ ] Forms submit
- [ ] Navigation works
- [ ] Dynamic routes work ([id])
- [ ] No console errors

---

## 🎯 PRIORITIES

### Start With (Phase 1):
1. TenantsPage ⭐⭐⭐
2. UsersPage ⭐⭐⭐
3. DashboardPage ⭐⭐⭐
4. ProductsPage ⭐⭐
5. ApplicationsPage ⭐⭐

### High Traffic Pages:
- Tenants (list, detail)
- Users (list, detail)
- Dashboard
- Applications
- Products
- Orders

### Do Later:
- Documentation pages
- Settings pages
- Rarely used forms

---

## 💡 PRO TIPS

1. **Work in batches** - Migrate 5 pages at a time, test, commit
2. **Test immediately** - Don't wait to test many pages
3. **Copy-paste pattern** - Use the 2-step template above
4. **Check imports** - Always verify no circular deps
5. **Keep modules updated** - Update module routes as you go
6. **Git commits** - Commit after each successful batch
7. **Documentation** - Note edge cases in MIGRATION_PROGRESS.md

---

## 🆘 WHEN STUCK

### Issue: Circular dependency
**Solution:** Make sure /pages/ ONLY imports from /app/, never the reverse

### Issue: Route not working
**Solution:** 
1. Check module route definition
2. Verify path matches exactly
3. Check for typos in imports

### Issue: Params not working
**Solution:**
```typescript
// Use shim's useParams
import { useParams } from '@/components/shim/next-navigation';

const { id } = useParams<{ id: string }>();
```

### Issue: Build error
**Solution:**
1. Check for syntax errors
2. Verify all imports exist
3. Run `npm run type-check`

---

## 🎓 LEARNING RESOURCES

### Key Files to Study:
- `/NEXTJS_MIGRATION_MASTER_PLAN.md` - Full plan
- `/MIGRATION_PROGRESS.md` - Track progress
- `/components/shim/next-navigation.tsx` - Shim implementation
- `/modules/tenant/index.tsx` - Example module

### Reference Implementation:
Once first page is done, use it as template!

---

## 🚀 LET'S GO!

**Ready to start?** Say:

> "Start Phase 0 - Create shim layer"

Or jump straight to a specific page:

> "Migrate TenantsPage following the pattern"

**You got this!** 💪
