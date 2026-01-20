# 🚀 MASTER PLAN: MIGRATION TO NEXT.JS APP ROUTER ARCHITECTURE

## 📋 MỤC TIÊU

Migrate toàn bộ application từ React Router SPA sang Next.js App Router pattern:
- ✅ Code chính ở `/app/(admin)/`
- ✅ `/pages/` chỉ import và re-export từ `/app/`
- ✅ Sử dụng shim cho routing để dễ migrate

---

## 📊 HIỆN TRẠNG

### Total Files: ~106 pages
- **List Pages**: 28 (Users, Tenants, Products, etc.)
- **Add Pages**: 23 (AddUser, AddTenant, etc.)
- **Edit Pages**: 21 (EditUser, EditTenant, etc.)
- **Detail Pages**: 22 (UserDetail, TenantDetail, etc.)
- **Utility Pages**: 12 (Settings, Help, Docs, etc.)

### Current Stack:
- ❌ Using `react-router-dom`
- ❌ Using `useNavigate` hook
- ❌ All code in `/pages/`
- ❌ No `/app/` directory

### Target Architecture:
- ✅ Next.js App Router structure
- ✅ Using shim: `@/components/shim/next-navigation`
- ✅ Code in `/app/(admin)/` 
- ✅ Thin wrappers in `/pages/`

---

## 🏗️ ARCHITECTURE PATTERN

### Pattern 1: Full Implementation in /app/

```typescript
// /app/(admin)/admin/users/page.tsx
'use client';

/**
 * UsersPage - Full Implementation
 * ✅ CODE CHÍNH Ở ĐÂY
 */

import { useState } from 'react';
import { useRouter } from '@/components/shim/next-navigation';
// ... all imports

export default function UsersPage() {
  const router = useRouter();
  // ... FULL IMPLEMENTATION ...
  return (/* JSX */);
}

// Named export for reuse
export { UsersPage };
```

```typescript
// /pages/UsersPage.tsx
'use client';

/**
 * UsersPage - Thin Wrapper for /pages/ routing
 * ✅ CHỈ IMPORT, KHÔNG CÓ LOGIC
 */

import { UsersPage } from '@/app/(admin)/admin/users/page';

export default UsersPage;
```

### Pattern 2: Shared Component (for complex pages)

```typescript
// /app/(admin)/admin/users/UsersView.tsx
'use client';

export function UsersView() {
  // FULL IMPLEMENTATION
}
```

```typescript
// /app/(admin)/admin/users/page.tsx
'use client';

import { UsersView } from './UsersView';

export default function UsersPage() {
  return <UsersView />;
}

export { UsersView as UsersPage }; // For /pages/ to import
```

```typescript
// /pages/UsersPage.tsx
'use client';

import { UsersPage } from '@/app/(admin)/admin/users/page';
export default UsersPage;
```

---

## 📁 DIRECTORY STRUCTURE

### Target Structure:

```
/app/
  └── (admin)/
      ├── admin/           # Admin routes
      │   ├── users/
      │   │   ├── page.tsx              # List: /admin/users
      │   │   ├── create/
      │   │   │   └── page.tsx          # Add: /admin/users/create
      │   │   └── [id]/
      │   │       ├── page.tsx          # Detail: /admin/users/[id]
      │   │       └── edit/
      │   │           └── page.tsx      # Edit: /admin/users/[id]/edit
      │   ├── tenants/
      │   │   ├── page.tsx
      │   │   ├── create/page.tsx
      │   │   └── [id]/
      │   │       ├── page.tsx
      │   │       └── edit/page.tsx
      │   ├── roles/
      │   ├── permissions/
      │   └── ...
      ├── commerce/        # Commerce routes
      │   ├── products/
      │   ├── orders/
      │   └── subscriptions/
      ├── platform/        # Platform routes
      │   ├── feature-flags/
      │   ├── webhooks/
      │   └── rate-limits/
      ├── monitoring/      # Monitoring routes
      │   ├── audit-logs/
      │   ├── auth-logs/
      │   └── traffic-logs/
      └── integrations/    # Integration routes
          ├── webhooks/
          └── api-usage-logs/

/pages/                  # Thin wrappers (legacy support)
  ├── UsersPage.tsx      → import from /app/(admin)/admin/users/page
  ├── AddUserPage.tsx    → import from /app/(admin)/admin/users/create/page
  ├── TenantsPage.tsx    → import from /app/(admin)/admin/tenants/page
  └── ...
```

---

## 🎯 MIGRATION STRATEGY

### Phase 0: Setup & Infrastructure (Day 1)

**Create shim and base structure**

**Tasks:**
1. ✅ Create `/app/(admin)/` directory structure
2. ✅ Create shim at `/components/shim/next-navigation.tsx`
3. ✅ Create migration templates
4. ✅ Create helper scripts
5. ✅ Document conventions

**Deliverables:**
- Shim working for all routing hooks
- Empty `/app/` structure ready
- Templates for each page type
- Migration checklist

---

### Phase 1: Core List Pages (Days 2-3) - 28 pages

**Priority Order:**

**Batch 1.1: High Traffic (Priority 1)**
1. ✅ UsersPage
2. ✅ TenantsPage
3. ✅ RolesPage
4. ✅ ProductsPage
5. ✅ ApplicationsPage

**Batch 1.2: Admin Management**
6. PermissionsPage
7. AuditLogsPage
8. AuthLogsPage
9. SystemJobsPage
10. SystemCategoriesPage

**Batch 1.3: Commerce**
11. ProductTypesPage
12. SubscriptionOrdersPage
13. SubscriptionInvoicesPage
14. ServicePackagesPage
15. ServiceDeliveriesPage

**Batch 1.4: Platform & Config**
16. FeatureFlagsPage
17. WebhooksPage
18. RateLimitsPage
19. ReservedSlugsPage
20. LocationTypesPage

**Batch 1.5: Monitoring & Analytics**
21. TrafficLogsAnalyticsPage
22. UserRegistrationTelemetryPage
23. DigitalAssetsPage
24. TenantSubscriptionsPage
25. TenantMembersPage

**Batch 1.6: Other Lists**
26. SaasProductTypesPage
27. NotificationTemplatesPage
28. UserDelegationsPage

**Migration Steps per Page:**
1. Create `/app/(admin)/<module>/<name>/page.tsx`
2. Move FULL implementation to app
3. Replace `useNavigate` with `useRouter` (from shim)
4. Add 'use client' directive
5. Add named export
6. Test in app structure
7. Update `/pages/<Name>Page.tsx` to thin wrapper
8. Verify routing still works
9. Test all functionality

**Template:**
```typescript
// /app/(admin)/admin/users/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from '@/components/shim/next-navigation';
// ... migrate all imports

export default function UsersPage() {
  const router = useRouter(); // Changed from useNavigate
  // ... FULL IMPLEMENTATION ...
  
  // Replace navigate('/path') with router.push('/path')
  
  return (/* JSX */);
}

export { UsersPage }; // For /pages/ import
```

```typescript
// /pages/UsersPage.tsx
'use client';

import { UsersPage } from '@/app/(admin)/admin/users/page';
export default UsersPage;
```

**Success Criteria:**
- ✅ All list pages load without errors
- ✅ Navigation works via shim
- ✅ No duplication of code
- ✅ /pages/ wrappers are thin (< 10 lines)

---

### Phase 2: Add Pages (Days 4-5) - 23 pages

**All Add pages follow same structure:**

**Batch 2.1: User Management (5 pages)**
1. AddUserPage
2. AddTenantPage
3. AddRolePage
4. AddApplicationPage
5. AddPermissionPage

**Batch 2.2: Commerce (8 pages)**
6. AddProductPage
7. AddProductTypePage
8. AddOrderPage
9. AddInvoicePage
10. AddSubscriptionPage
11. AddServicePackagePage
12. AddServiceDeliveryPage
13. AddSaasProductTypePage

**Batch 2.3: Platform (6 pages)**
14. AddFeatureFlagPage
15. AddWebhookPage
16. AddReservedSlugPage
17. AddSystemCategoryPage
18. AddSystemJobPage
19. AddRegionPage

**Batch 2.4: Other (4 pages)**
20. AddNotificationPage
21. AddTrafficLogPage
22. AddUserDelegationPage
23. AddUserRegistrationPage

**Migration Pattern:**
```
/pages/AddUserPage.tsx
  ↓ MOVE TO
/app/(admin)/admin/users/create/page.tsx
  ↓ THEN
/pages/AddUserPage.tsx → thin wrapper
```

**Template:**
```typescript
// /app/(admin)/admin/users/create/page.tsx
'use client';

import { useRouter } from '@/components/shim/next-navigation';

export default function CreateUserPage() {
  const router = useRouter();
  
  const handleSubmit = async (data) => {
    // ... create logic
    router.push('/admin/users'); // Redirect after create
  };
  
  return (/* Form JSX */);
}

export { CreateUserPage as AddUserPage }; // For backward compat
```

---

### Phase 3: Edit Pages (Days 6-7) - 21 pages

**Batch 3.1-3.4: Same grouping as Add pages**

**Migration Pattern:**
```
/pages/EditUserPage.tsx
  ↓ MOVE TO
/app/(admin)/admin/users/[id]/edit/page.tsx
  ↓ USE
useParams() to get ID
```

**Template:**
```typescript
// /app/(admin)/admin/users/[id]/edit/page.tsx
'use client';

import { useRouter, useParams } from '@/components/shim/next-navigation';

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  
  // ... load user data with id
  // ... edit logic
  
  return (/* Form JSX */);
}

export { EditUserPage };
```

---

### Phase 4: Detail Pages (Days 8-9) - 22 pages

**Priority Order:**

**Batch 4.1: High Priority**
1. UserDetailPage
2. TenantDetailPage
3. ProductDetailPage
4. ApplicationDetailPage
5. RoleDetailPage

**Batch 4.2-4.4: All other detail pages**

**Migration Pattern:**
```
/pages/UserDetailPage.tsx
  ↓ MOVE TO
/app/(admin)/admin/users/[id]/page.tsx
```

**Template:**
```typescript
// /app/(admin)/admin/users/[id]/page.tsx
'use client';

import { useRouter, useParams } from '@/components/shim/next-navigation';

export default function UserDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  
  // ... load user detail
  // ... tabs, actions, etc.
  
  return (/* Detail JSX */);
}

export { UserDetailPage };
```

---

### Phase 5: Utility Pages (Day 10) - 12 pages

**Pages:**
1. SettingsPage
2. HelpPage
3. ApiDocsPage
4. DatabaseDocsPage
5. DevDocsPage
6. LegalDocumentsPage
7. NotificationTemplatesPage
8. LocationsPage
9. RegionsPage
10. UserRolesPage
11. FeatureFlagsPage (if not done)
12. WebhooksPage (if not done)

**Template:**
```typescript
// /app/(admin)/settings/page.tsx
'use client';

export default function SettingsPage() {
  // ... settings implementation
  return (/* JSX */);
}

export { SettingsPage };
```

---

### Phase 6: Cleanup & Verification (Day 11)

**Tasks:**
1. ✅ Verify ALL pages load correctly
2. ✅ Test ALL navigation flows
3. ✅ Check console for errors
4. ✅ Verify no duplicate code
5. ✅ Ensure all /pages/ wrappers are thin
6. ✅ Test deep links work
7. ✅ Test browser back/forward
8. ✅ Performance check

---

## 🔧 MIGRATION TOOLS

### Tool 1: Auto-Migration Script

```typescript
// scripts/migrate-page.ts
import fs from 'fs';
import path from 'path';

interface MigrationConfig {
  sourcePath: string;      // /pages/UsersPage.tsx
  targetPath: string;      // /app/(admin)/admin/users/page.tsx
  moduleName: string;      // UsersPage
  routePath: string;       // /admin/users
}

function migratePage(config: MigrationConfig) {
  // 1. Read source file
  const sourceContent = fs.readFileSync(config.sourcePath, 'utf-8');
  
  // 2. Transform content
  let transformed = sourceContent;
  
  // Replace react-router imports
  transformed = transformed.replace(
    /import \{ useNavigate \} from ['"]react-router['"]/g,
    "import { useRouter } from '@/components/shim/next-navigation'"
  );
  
  // Replace useNavigate with useRouter
  transformed = transformed.replace(
    /const navigate = useNavigate\(\)/g,
    'const router = useRouter()'
  );
  
  // Replace navigate() calls
  transformed = transformed.replace(
    /navigate\(['"]([^'"]+)['"]\)/g,
    "router.push('$1')"
  );
  
  // Add named export before last line
  const lines = transformed.split('\n');
  const lastExportIndex = lines.findIndex(line => line.includes('export default'));
  if (lastExportIndex > -1) {
    lines.splice(lastExportIndex, 0, `\n// Named export for /pages/ import`);
    lines.splice(lastExportIndex + 1, 0, `export { ${config.moduleName} };\n`);
  }
  
  // 3. Write to app directory
  const targetDir = path.dirname(config.targetPath);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  fs.writeFileSync(config.targetPath, lines.join('\n'));
  
  // 4. Create thin wrapper in /pages/
  const wrapper = `'use client';

/**
 * ${config.moduleName} - Thin Wrapper
 * ✅ ARCHITECTURE: Import from /app/ - Code chính ở /app/(admin)
 */

import { ${config.moduleName} } from '@${config.targetPath.replace('.tsx', '')}';

export default ${config.moduleName};
`;
  
  fs.writeFileSync(config.sourcePath, wrapper);
  
  console.log(`✅ Migrated: ${config.moduleName}`);
  console.log(`   Source: ${config.sourcePath}`);
  console.log(`   Target: ${config.targetPath}`);
}

// Usage:
migratePage({
  sourcePath: '/pages/UsersPage.tsx',
  targetPath: '/app/(admin)/admin/users/page.tsx',
  moduleName: 'UsersPage',
  routePath: '/admin/users'
});
```

### Tool 2: Verification Script

```typescript
// scripts/verify-migration.ts
import fs from 'fs';
import path from 'path';

function verifyMigration() {
  const pagesDir = './pages';
  const appDir = './app/(admin)';
  
  const results = {
    total: 0,
    thin: 0,
    thick: 0,
    missing: 0,
    errors: []
  };
  
  // Check all pages
  const pages = fs.readdirSync(pagesDir).filter(f => f.endsWith('.tsx'));
  
  pages.forEach(page => {
    results.total++;
    const pagePath = path.join(pagesDir, page);
    const content = fs.readFileSync(pagePath, 'utf-8');
    
    // Check if thin wrapper
    const isThin = content.includes('import from') && 
                   content.split('\n').length < 15 &&
                   !content.includes('useState') &&
                   !content.includes('useEffect');
    
    if (isThin) {
      results.thin++;
    } else {
      results.thick++;
      results.errors.push(`❌ ${page} is not a thin wrapper`);
    }
    
    // Check if corresponding app file exists
    // ... logic to find app file ...
  });
  
  console.log('📊 Migration Verification Results:');
  console.log(`   Total Pages: ${results.total}`);
  console.log(`   ✅ Thin Wrappers: ${results.thin}`);
  console.log(`   ❌ Thick Pages: ${results.thick}`);
  console.log(`   ⚠️  Missing App Files: ${results.missing}`);
  
  if (results.errors.length > 0) {
    console.log('\n⚠️  Issues Found:');
    results.errors.forEach(err => console.log(err));
  }
  
  return results;
}
```

### Tool 3: Route Mapper

```typescript
// scripts/map-routes.ts
// Generate route mapping document

const routeMap = {
  // List pages
  '/admin/users': '/app/(admin)/admin/users/page.tsx',
  '/admin/tenants': '/app/(admin)/admin/tenants/page.tsx',
  
  // Add pages
  '/admin/users/create': '/app/(admin)/admin/users/create/page.tsx',
  '/admin/tenants/create': '/app/(admin)/admin/tenants/create/page.tsx',
  
  // Edit pages
  '/admin/users/:id/edit': '/app/(admin)/admin/users/[id]/edit/page.tsx',
  '/admin/tenants/:id/edit': '/app/(admin)/admin/tenants/[id]/edit/page.tsx',
  
  // Detail pages
  '/admin/users/:id': '/app/(admin)/admin/users/[id]/page.tsx',
  '/admin/tenants/:id': '/app/(admin)/admin/tenants/[id]/page.tsx',
};

function generateRouteMap() {
  console.log('# Route Mapping\n');
  Object.entries(routeMap).forEach(([route, file]) => {
    console.log(`- \`${route}\` → \`${file}\``);
  });
}
```

---

## 📋 MIGRATION CHECKLIST (Per Page)

### Pre-Migration:
- [ ] Identify page type (List/Add/Edit/Detail/Utility)
- [ ] Determine target path in /app/
- [ ] Check for complex dependencies
- [ ] Note any special routing logic

### Migration:
- [ ] Create target directory structure
- [ ] Copy file to /app/(admin)/
- [ ] Add 'use client' if not present
- [ ] Replace `useNavigate` with `useRouter`
- [ ] Replace all `navigate()` with `router.push()`
- [ ] Add `useParams()` if using route params
- [ ] Add named export
- [ ] Test page loads in app structure

### Post-Migration:
- [ ] Replace /pages/ file with thin wrapper
- [ ] Verify wrapper imports correctly
- [ ] Test navigation TO this page
- [ ] Test navigation FROM this page
- [ ] Check console for errors
- [ ] Verify data loads correctly
- [ ] Test all actions/buttons work
- [ ] Commit changes

---

## 🎯 SUCCESS CRITERIA

### Per Phase:
- ✅ All pages in batch migrate successfully
- ✅ All /pages/ wrappers are thin (< 15 lines)
- ✅ No code duplication
- ✅ All tests pass
- ✅ No console errors

### Overall Project:
- ✅ 100% pages migrated (106/106)
- ✅ All /pages/ files are thin wrappers
- ✅ All code logic in /app/(admin)/
- ✅ Zero circular dependencies
- ✅ Shim working perfectly
- ✅ Ready to remove shim and deploy as Next.js

---

## 📊 TRACKING

### Progress Tracker:

| Phase | Pages | Status | Complete |
|-------|-------|--------|----------|
| Phase 0: Setup | - | ⏳ Not Started | 0% |
| Phase 1: Lists | 28 | ⏳ Not Started | 0/28 |
| Phase 2: Add | 23 | ⏳ Not Started | 0/23 |
| Phase 3: Edit | 21 | ⏳ Not Started | 0/21 |
| Phase 4: Detail | 22 | ⏳ Not Started | 0/22 |
| Phase 5: Utility | 12 | ⏳ Not Started | 0/12 |
| Phase 6: Verify | - | ⏳ Not Started | 0% |
| **TOTAL** | **106** | **⏳** | **0%** |

---

## 🚀 GETTING STARTED

**Ready to start?**

Reply with:
- **"START PHASE 0"** → Setup infrastructure first
- **"START PHASE 1"** → Migrate list pages (if setup done)
- **"MIGRATE ONE"** → Migrate one page as example first

I'll execute step-by-step with you! 🎯
