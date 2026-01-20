# Quick Diagnostic Checklist

**Purpose**: Nhanh chóng verify system health sau migration  
**Last Updated**: 2026-01-20

## 🚀 Quick Health Check (2 minutes)

### 1. Browser Console (30 seconds)

Open DevTools Console và check:

#### ✅ Should NOT see:
- ❌ "Multiple GoTrueClient instances detected"
- ❌ "Invalid API key" errors
- ❌ React.jsx warnings about lazy imports
- ❌ "Failed to load module" errors
- ❌ Circular dependency warnings

#### ✅ Should see:
- ✅ "🚀 Registering critical modules..."
- ✅ "✅ Critical modules registered (2/39)"
- ✅ "⏳ Loading non-critical modules..."
- ✅ "✅ All modules loaded (39/39)"

### 2. Network Tab (30 seconds)

Check Network tab:

#### ✅ Should see:
- ✅ Initial bundle loads quickly
- ✅ Lazy chunks load on navigation
- ✅ No 404 errors on module imports
- ✅ Supabase API calls succeed (200 OK)

#### ❌ Red flags:
- ❌ 404 on chunk imports
- ❌ 401/403 on Supabase calls
- ❌ Slow chunk loading (>2s)

### 3. Navigation Test (1 minute)

Test these routes:

```
1. / → Should redirect to /admin/dashboard ✅
2. /admin/dashboard → Loads dashboard ✅
3. /admin/tenants → Loads tenants list ✅
4. /admin/users → Loads users list ✅
5. /admin/roles → Loads roles list ✅
6. /platform/applications → Loads apps list ✅
```

Each should:
- ✅ Load without errors
- ✅ Show loading fallback briefly
- ✅ Display data or empty state
- ✅ No console errors

## 🔍 Detailed Diagnostic (5 minutes)

### Database Connection

Navigate to: `/test-connection`

1. Click "Run Full Diagnostics"
2. Wait for results
3. All checks should be ✅ green

Expected results:
```
✅ Configuration Check - Project ID and keys valid
✅ Database Connection - Supabase accessible
✅ Table Access - Tables exist and queryable
✅ DataClient - Client initialized correctly
```

### Auth Flow

Test login/logout:

1. Navigate to `/login`
2. Enter credentials
3. Login → Should redirect to dashboard
4. Navigate to different pages
5. Logout → Should redirect to login
6. No console errors throughout

### Module Loading

Check module registry:

```javascript
// In browser console:
import('./core/ModuleRegistry').then(({ ModuleRegistry }) => {
  const registry = ModuleRegistry.getInstance();
  console.log('Total modules:', registry.getAllModules().length);
  console.log('Total routes:', registry.getAllRoutes().length);
});
```

Expected:
```
Total modules: 39
Total routes: 110+
```

## 🐛 Common Issues & Quick Fixes

### Issue 1: "Multiple GoTrueClient instances"

**Fix**: Check if any file creates Supabase client directly

```bash
# Search for problematic pattern
grep -r "createClient(" app/ --include="*.tsx"
```

Should ONLY appear in `/lib/supabase.ts`

**Quick fix**: Replace with:
```tsx
import { getSupabaseClient } from '@/lib/supabase';
const supabase = getSupabaseClient();
```

### Issue 2: "Invalid API key"

**Diagnostic**:
```javascript
// In console:
import('./utils/supabase/info').then(info => {
  console.log('Project ID:', info.projectId);
  console.log('Key length:', info.publicAnonKey?.length);
});
```

**Fix**: Update `/utils/supabase/info.tsx` with correct values

### Issue 3: "Failed to load module"

**Diagnostic**: Check file exists
```bash
ls -la app/(admin)/admin/roles/page.tsx
```

**Common causes**:
1. File moved/deleted
2. Wrong path in module registry
3. TypeScript compilation error

**Fix**: Verify path in `/modules/[module]/index.tsx` matches actual file location

### Issue 4: "Table doesn't exist"

**Fix**: Initialize database
1. Navigate to `/setup`
2. Click "Initialize Database"
3. Wait for completion
4. Refresh and retry

### Issue 5: Lazy loading not working

**Diagnostic**:
```javascript
// Test lazy import directly
import('./app/(admin)/admin/roles/page').then(m => {
  console.log('Default export:', m.default);
  console.log('Named exports:', Object.keys(m));
});
```

Expected output:
```javascript
Default export: function RolesPage() { ... }
Named exports: ['RolesPage', 'default']
```

## 📊 Performance Metrics

### Initial Load
- ✅ First Contentful Paint: <1.5s
- ✅ Time to Interactive: <3s
- ✅ Initial bundle size: <500KB

### Navigation
- ✅ Route change: <500ms
- ✅ Lazy chunk load: <1s
- ✅ Data fetch: <2s

### Memory
- ✅ Heap size: <100MB (empty state)
- ✅ Heap size: <200MB (with data)
- ✅ No memory leaks on navigation

## 🧪 Automated Checks

### TypeScript Compilation
```bash
npx tsc --noEmit
```
Should have 0 errors

### ESLint Check
```bash
npx eslint . --ext .tsx,.ts
```
Should have minimal warnings

### Build Check
```bash
npm run build
```
Should complete without errors

## 📝 Quick Reference

### Key Files to Check

```
/lib/supabase.ts                    - Singleton client
/core/ModuleRegistry.tsx            - Module system
/core/lazyModuleRegistration.tsx    - Lazy loading
/app/(admin)/                       - Source of truth
/pages/                             - Bridge files
/modules/                           - Module definitions
```

### Useful Console Commands

```javascript
// Check Supabase connection
import('./lib/supabase').then(({ getSupabaseClient }) => {
  const client = getSupabaseClient();
  return client.from('tenants').select('count').limit(1);
});

// Check module registry
import('./core/ModuleRegistry').then(({ ModuleRegistry }) => {
  const registry = ModuleRegistry.getInstance();
  console.table(registry.getAllModules().map(m => ({
    id: m.id,
    routes: m.routes?.length || 0,
    enabled: m.enabled
  })));
});

// Check DataClient
import('./lib/data-client').then(({ getDataClient }) => {
  const client = getDataClient();
  console.log('Client type:', client.constructor.name);
  return client.query('tenants', { limit: 5 });
});
```

## ✅ Health Check Scorecard

After running diagnostics, score system health:

```
Category                    Score    Status
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Console Errors              0        ✅ Healthy
Database Connection         OK       ✅ Healthy
Auth Flow                   OK       ✅ Healthy
Module Loading              39/39    ✅ Healthy
Page Navigation             OK       ✅ Healthy
Performance                 Good     ✅ Healthy
TypeScript Compilation      0 errors ✅ Healthy
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OVERALL STATUS                       ✅ HEALTHY
```

Score interpretation:
- **100% ✅**: Production ready
- **80-99% ⚠️**: Minor issues, investigate
- **<80% ❌**: Critical issues, do not deploy

## 🔗 Related Documents

- `/docs/bugfix/BUGFIX-2026-01-20-summary.md` - Latest fixes
- `/docs/bugfix/BUGFIX-2026-01-20-gotruclient-multiple-instances-fix.md` - GoTrueClient fix
- `/docs/bugfix/BUGFIX-2026-01-20-lazy-import-pattern-guide.md` - Lazy loading guide
- `/docs/MIGRATION_COMPLETE_SUMMARY.md` - Migration overview
- `/docs/DATA_ACCESS_MIGRATION_PROGRESS.md` - Data layer status

---

**Last Health Check**: 2026-01-20  
**Status**: ✅ All systems operational  
**Next Check**: Weekly or after major changes
