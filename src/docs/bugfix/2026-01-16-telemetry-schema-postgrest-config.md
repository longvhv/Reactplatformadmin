# Fix: Telemetry Schema PostgREST Configuration

**Date:** 2026-01-16  
**Issue:** `406 Not Acceptable` when accessing `telemetry.saas_business_reports`  
**Error URL:** `/rest/v1/saas_business_reports`  
**Root Cause:** Supabase PostgREST không expose `telemetry` schema mặc định

---

## 🔴 Problem

Khi gọi service:
```typescript
const { data } = await supabase
  .schema('telemetry')
  .from('saas_business_reports')
  .select('*');
```

Browser network tab shows error:
```
Request URL: https://xxx.supabase.co/rest/v1/saas_business_reports
Status: 406 Not Acceptable
```

**Why?** Supabase PostgREST chỉ expose `public` schema mặc định. Method `.schema('telemetry')` chỉ thêm header `Accept-Profile: telemetry`, nhưng PostgREST sẽ reject nếu schema chưa được config.

---

## ✅ Solution 1: Enable Telemetry Schema in Supabase (RECOMMENDED)

### Step 1: Open Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to **Settings** → **API**

### Step 2: Add Telemetry to Exposed Schemas
1. Scroll down to **"Exposed Schemas"** section
2. Current value: `public`
3. Change to: `public, telemetry`
4. Click **Save**

### Step 3: Verify
```typescript
const { data, error } = await supabase
  .schema('telemetry')
  .from('saas_business_reports')
  .select('*')
  .limit(1);

console.log('✅ Success:', data);
```

---

## ✅ Solution 2: Run Migration to Grant Permissions

**If migration not run yet:**

### Step 1: Run Migration
```sql
-- In Supabase Dashboard → SQL Editor
-- Copy and paste content from:
-- /docs/migrations/037_saas_business_reports.sql

-- Key sections:
CREATE SCHEMA IF NOT EXISTS telemetry;
CREATE TABLE telemetry.saas_business_reports (...);
GRANT USAGE ON SCHEMA telemetry TO authenticated;
GRANT SELECT, INSERT ON telemetry.saas_business_reports TO authenticated;
```

### Step 2: Verify Schema Created
```sql
-- Check if schema exists
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name = 'telemetry';

-- Check if table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'telemetry' 
AND table_name = 'saas_business_reports';

-- Check permissions
SELECT grantee, privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'telemetry'
AND table_name = 'saas_business_reports';
```

---

## ✅ Solution 3: Update PostgREST Config (Advanced)

**For self-hosted Supabase or advanced users:**

### Option A: Environment Variable
```bash
# In .env or Supabase config
PGRST_DB_SCHEMAS="public,telemetry"
```

### Option B: SQL Function
```sql
-- Create function to update PostgREST config
CREATE OR REPLACE FUNCTION public.update_postgrest_schemas()
RETURNS void AS $$
BEGIN
  ALTER DATABASE postgres SET app.settings.db_schemas TO 'public,telemetry';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute
SELECT update_postgrest_schemas();

-- Restart PostgREST service
```

---

## 🧪 Testing

### Test 1: Direct Schema Access
```typescript
import { supabase } from '@/lib/supabase';

const { data, error } = await supabase
  .schema('telemetry')
  .from('saas_business_reports')
  .select('*')
  .limit(5);

if (error) {
  console.error('❌ Error:', error);
} else {
  console.log('✅ Success:', data);
}
```

### Test 2: Service Access
```typescript
import { businessReportsService } from '@/services';

const reports = await businessReportsService.getAll({
  partner_id: 'your-tenant-id',
  date_from: '2026-01-01'
});

console.log('✅ Reports:', reports);
```

### Test 3: Browser Network Tab
Open DevTools → Network tab, you should see:
```
Request URL: https://xxx.supabase.co/rest/v1/saas_business_reports
Request Headers:
  Accept-Profile: telemetry
  Content-Profile: telemetry
Status: 200 OK
```

---

## 🔍 Debugging

### Check 1: Schema Exists?
```sql
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name = 'telemetry';
-- Expected: 1 row with 'telemetry'
```

### Check 2: Table Exists?
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'telemetry';
-- Expected: List of telemetry tables
```

### Check 3: Permissions Granted?
```sql
SELECT grantee, privilege_type
FROM information_schema.schema_privileges
WHERE schema_name = 'telemetry';
-- Expected: authenticated -> USAGE
```

### Check 4: RLS Enabled?
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'telemetry'
AND tablename = 'saas_business_reports';
-- Expected: rowsecurity = true
```

### Check 5: Policies Exist?
```sql
SELECT policyname, roles, cmd
FROM pg_policies
WHERE schemaname = 'telemetry'
AND tablename = 'saas_business_reports';
-- Expected: 3 policies (service_role, partner_read, partner_insert)
```

---

## 📝 Common Errors

### Error 1: `406 Not Acceptable`
**Cause:** Schema not exposed in PostgREST  
**Fix:** Solution 1 (Add to exposed schemas)

### Error 2: `permission denied for schema telemetry`
**Cause:** Missing GRANT USAGE  
**Fix:** Run migration line 319:
```sql
GRANT USAGE ON SCHEMA telemetry TO authenticated;
```

### Error 3: `permission denied for table saas_business_reports`
**Cause:** Missing table grants  
**Fix:** Run migration line 323:
```sql
GRANT SELECT, INSERT ON telemetry.saas_business_reports TO authenticated;
```

### Error 4: `relation "saas_business_reports" does not exist`
**Cause:** Table not created or wrong schema  
**Fix:** Run full migration 037

### Error 5: `new row violates row-level security policy`
**Cause:** RLS policy blocking access  
**Fix:** Check user is member of tenant (partner_id)
```sql
SELECT * FROM public.tenant_members 
WHERE user_id = auth.uid();
```

---

## 🎯 Quick Fix Checklist

- [ ] Step 1: Run migration `/docs/migrations/037_saas_business_reports.sql`
- [ ] Step 2: Verify schema created: `SELECT * FROM information_schema.schemata WHERE schema_name = 'telemetry'`
- [ ] Step 3: Verify table created: `SELECT * FROM telemetry.saas_business_reports LIMIT 1`
- [ ] Step 4: Enable in Supabase Dashboard → Settings → API → Exposed Schemas: `public, telemetry`
- [ ] Step 5: Hard refresh browser (Ctrl+Shift+R)
- [ ] Step 6: Test service call

---

## 📚 Related Files

- `/services/businessReportsService.ts` - Service implementation
- `/docs/migrations/037_saas_business_reports.sql` - Migration file
- `/docs/telemetry-services-complete.md` - All telemetry services overview
- `/components/tenant/RevenueStatistics.tsx` - UI component using service

---

## 🚀 After Fix

After completing steps above, your service calls should work:

```typescript
// ✅ This works now!
const stats = await businessReportsService.getRevenueStats(partnerId, {
  date_from: '2026-01-01'
});

console.log('Revenue:', stats.total_revenue);
console.log('Categories:', stats.categories);
```

---

**Status:** Ready to Deploy  
**Priority:** HIGH  
**Impact:** Blocks revenue statistics feature
