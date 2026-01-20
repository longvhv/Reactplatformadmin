# ⚡ Quick Start: Fix "Invalid API Key" Error

> **TL;DR**: Database chưa được khởi tạo. Đi tới `/setup` → Click "Initialize Database"

---

## 🎯 Most Likely Cause

90% of "Invalid API key" errors are actually **"tables don't exist yet"**

Supabase returns this misleading error when:
- ✅ API key is valid
- ✅ Project exists
- ❌ But the table you're querying doesn't exist

---

## 🚀 Quick Fix (30 seconds)

### Option 1: Use Setup Page (Easiest)

```
1. Navigate to: /setup
2. Click: "Initialize Database" button
3. Wait: ~10-20 seconds
4. Go to: /admin/tenants
5. ✅ Should work now!
```

### Option 2: Use Quick Fix Wizard

```
1. Navigate to: /admin/quick-fix
2. Click: "Start Diagnosis"
3. Follow: Interactive steps
4. ✅ Done!
```

### Option 3: SQL Editor (Manual)

```sql
-- In Supabase Dashboard → SQL Editor
-- Copy & run the ENTIRE schema from:
-- /scripts/db/schema/01-core-tables.sql
```

---

## 🔍 Verify It's Fixed

### Test 1: Console Test
```javascript
// Open browser console, paste:
import('@supabase/supabase-js').then(async ({ createClient }) => {
  const { projectId, publicAnonKey } = await import('./utils/supabase/info');
  const supabase = createClient(
    `https://${projectId}.supabase.co`,
    publicAnonKey
  );
  const { data, error } = await supabase.from('tenants').select('*').limit(1);
  console.log(error ? '❌ Still broken' : '✅ Fixed!', { data, error });
});
```

### Test 2: Visual Check
1. Go to `/admin/tenants`
2. Should see either:
   - ✅ Tenant cards/list
   - ✅ "No tenants found" message
3. Should NOT see:
   - ❌ "Invalid API key" error
   - ❌ Infinite loading spinner

---

## 🐛 If Still Broken After Database Init

### Scenario A: RLS Policy Issue

**Symptom**: Tables exist but still getting errors

**Quick Fix**:
```sql
-- In Supabase SQL Editor
ALTER TABLE tenants DISABLE ROW LEVEL SECURITY;
```

**Proper Fix**: See `/scripts/fix-rls-policies.sql`

### Scenario B: Actual Invalid Credentials

**Check**: 
1. Open `/utils/supabase/info.tsx`
2. Go to Supabase Dashboard → Settings → API
3. Compare `projectId` and `publicAnonKey`

**Fix**: Update `/utils/supabase/info.tsx` if values don't match

---

## 📚 Detailed Guides

- **Full Troubleshooting**: `/docs/TROUBLESHOOT_INVALID_API_KEY.md`
- **Testing Guide**: `/docs/PHASE_2_TESTING_GUIDE.md`
- **RLS Policies**: `/scripts/fix-rls-policies.sql`

---

## 🆘 Emergency Checklist

Run through this in order:

```
1. [ ] Tables exist?
   → Go to Supabase Dashboard → Table Editor
   → If no tables: Run /setup page

2. [ ] RLS blocking?
   → Run: ALTER TABLE tenants DISABLE ROW LEVEL SECURITY;
   
3. [ ] Credentials correct?
   → Compare /utils/supabase/info.tsx with Dashboard → Settings → API
   
4. [ ] Project active?
   → Check Supabase Dashboard project status
   
5. [ ] Cache issue?
   → Hard refresh browser (Ctrl+Shift+R / Cmd+Shift+R)
   → Clear localStorage: localStorage.clear()
```

---

**Last Updated**: 2026-01-20  
**Estimated Fix Time**: < 1 minute (if following Quick Fix)
