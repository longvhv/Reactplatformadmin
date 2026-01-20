# 🔧 Troubleshooting: Invalid API Key Error

## Error Message
```
[SupabaseDataClient] Query error on tenants: {
  "message": "Invalid API key",
  "hint": "Double check your Supabase `anon` or `service_role` API key."
}
```

---

## 🎯 Quick Diagnosis

The "Invalid API key" error from Supabase usually means **ONE** of these 3 things:

### 1️⃣ **Database Tables Don't Exist Yet** (Most Common) ⭐

**Symptom**: Fresh Supabase project, no tables created

**How to Check**:
- Go to Supabase Dashboard → Table Editor
- Look for `tenants`, `users`, `tenant_members` tables
- If you see "No tables found" → This is your problem

**How to Fix**:
1. Navigate to `/setup` page in your app
2. Click **"Initialize Database"** button
3. Wait for success message
4. Refresh `/admin/tenants` page

---

### 2️⃣ **Row Level Security (RLS) Blocking Access**

**Symptom**: Tables exist but queries are blocked

**How to Check**:
```sql
-- Run in Supabase SQL Editor
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'tenants';
```

If `rowsecurity` = `true` but you have no policies → RLS is blocking

**How to Fix** (Choose One):

#### Option A: Disable RLS (Quick, Development Only)
```sql
-- In Supabase SQL Editor
ALTER TABLE tenants DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_members DISABLE ROW LEVEL SECURITY;
```

⚠️ **WARNING**: Only for development/testing! Not secure for production.

#### Option B: Add Proper Policies (Recommended)
```sql
-- Allow anonymous read access
CREATE POLICY "Allow anon read tenants"
  ON tenants FOR SELECT
  TO anon
  USING (deleted_at IS NULL);

-- Allow anonymous insert (for testing)
CREATE POLICY "Allow anon insert tenants"
  ON tenants FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anonymous update (for testing)
CREATE POLICY "Allow anon update tenants"
  ON tenants FOR UPDATE
  TO anon
  USING (deleted_at IS NULL);
```

**Full SQL Script**: See `/scripts/fix-rls-policies.sql`

---

### 3️⃣ **Actual Invalid Credentials**

**Symptom**: Project ID or API key is wrong

**How to Check**:
1. Open `/utils/supabase/info.tsx`
2. Note the `projectId` and `publicAnonKey`
3. Go to [Supabase Dashboard](https://app.supabase.com) → Settings → API
4. Compare values:
   - **Project URL**: Should be `https://{projectId}.supabase.co`
   - **Anon public key**: Should match `publicAnonKey`

**How to Fix**:
1. If values don't match → Update `/utils/supabase/info.tsx` with correct values
2. If project doesn't exist → Create new Supabase project
3. If project is paused → Resume it in dashboard

---

## 🚀 Step-by-Step Fix Guide

### Method 1: Use Quick Fix Wizard (Recommended)

1. Navigate to `/admin/quick-fix` in your browser
2. Click **"Start Diagnosis"**
3. Follow the wizard - it will automatically detect the issue
4. Apply the suggested fix

### Method 2: Manual Diagnosis

#### Step 1: Verify Configuration
```javascript
// Open browser console, paste this:
import('./utils/supabase/info').then(({ projectId, publicAnonKey }) => {
  console.log('Project ID:', projectId);
  console.log('Key length:', publicAnonKey.length);
  console.log('Key starts with:', publicAnonKey.substring(0, 20));
});
```

**Expected**:
- Project ID: ~20 characters (e.g., "vewxdzhvrpxsmpmlwaqr")
- Key length: ~200+ characters
- Key starts with: "eyJhbGciOiJIUzI1NiI..."

#### Step 2: Test Direct Connection
```javascript
// In browser console:
import('@supabase/supabase-js').then(async ({ createClient }) => {
  const { projectId, publicAnonKey } = await import('./utils/supabase/info');
  const supabase = createClient(
    `https://${projectId}.supabase.co`,
    publicAnonKey
  );
  
  const { data, error } = await supabase.from('tenants').select('_id').limit(1);
  console.log('Result:', { data, error });
});
```

**Possible Results**:
- ✅ `data: []` or `data: [...]` → Connection works! (Issue is elsewhere)
- ❌ `error: "Invalid API key"` → Credentials problem (Fix #3)
- ❌ `error: "relation ... does not exist"` → Tables missing (Fix #1)
- ❌ `error: "permission denied"` or mentions "RLS" → Policy problem (Fix #2)

#### Step 3: Check Supabase Dashboard

1. Go to https://app.supabase.com
2. Find your project (match project ID)
3. Check project status:
   - 🟢 **Active** → Good
   - ⏸️ **Paused** → Resume it
   - ❌ **Deleted** → Recreate or use different project

4. Go to **Table Editor**:
   - Tables exist? → RLS issue (Fix #2)
   - No tables? → Need initialization (Fix #1)

5. Go to **Settings → API**:
   - Copy project URL and anon key
   - Verify they match `/utils/supabase/info.tsx`

---

## 🧪 Testing After Fix

### Test 1: Direct Query
```javascript
// Browser console
import('@lib/data-client').then(async ({ getDataClient }) => {
  const client = getDataClient();
  const result = await client.query('tenants', { limit: 5 });
  console.log('Tenants:', result);
});
```

### Test 2: Use Diagnostic Page
1. Go to `/admin/test-connection`
2. Click **"Run Full Diagnostics"**
3. All steps should show ✅

### Test 3: Load Tenants Page
1. Navigate to `/admin/tenants`
2. Should see tenant list (or "No tenants found" if database is empty)
3. No errors in console

---

## 📊 Decision Tree

```
Is "Invalid API key" error shown?
│
├─ YES → Check Supabase Dashboard
│   │
│   ├─ Project exists?
│   │   ├─ YES → Tables exist?
│   │   │   ├─ YES → RLS enabled?
│   │   │   │   ├─ YES → FIX #2 (Add policies or disable RLS)
│   │   │   │   └─ NO  → FIX #3 (Check credentials)
│   │   │   └─ NO  → FIX #1 (Initialize database)
│   │   └─ NO  → FIX #3 (Create project or update credentials)
│   │
└─ NO → Different error (check other docs)
```

---

## 🆘 Still Not Working?

### Check These:

1. **Browser Console Logs**
   - Open DevTools → Console
   - Look for detailed error messages
   - Share logs for debugging

2. **Network Tab**
   - Open DevTools → Network
   - Filter by "supabase.co"
   - Check request/response for errors
   - Look for 401, 403, or 500 status codes

3. **Supabase Logs**
   - Dashboard → Logs → API Logs
   - Look for failed requests
   - Note the error details

4. **Environment Variables** (if using server-side)
   - Check `.env.local` file exists
   - Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set
   - Restart dev server after changes

---

## 📝 Report Template

If still stuck, provide this info:

```
**Error**: Invalid API key

**Steps Tried**:
- [ ] Checked `/utils/supabase/info.tsx`
- [ ] Verified project exists in dashboard
- [ ] Checked tables exist
- [ ] Checked RLS policies
- [ ] Ran diagnostics at `/admin/test-connection`

**Dashboard Info**:
- Project Status: [Active/Paused/Unknown]
- Tables Exist: [Yes/No]
- RLS Enabled: [Yes/No]

**Console Output**:
[Paste relevant console logs here]

**Network Response**:
[Paste 401/403 response from Network tab]
```

---

**Last Updated**: 2026-01-20  
**Related Docs**:
- `/docs/PHASE_2_TESTING_GUIDE.md` - Complete testing guide
- `/scripts/fix-rls-policies.sql` - SQL scripts for RLS
- `/admin/quick-fix` - Interactive fix wizard
- `/admin/test-connection` - Diagnostic tool
