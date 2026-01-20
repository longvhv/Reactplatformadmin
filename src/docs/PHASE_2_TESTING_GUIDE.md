# Phase 2 - Testing Guide

## ✅ What to Check

### 1. Console Logs (Critical!)

Open browser console and look for these logs **in order**:

```
[useDataClient] Configured successfully
[useTenants] DataClient ready, triggering load
[useTenants] Fetching tenants from data source...
[SupabaseDataClient] Query on tenants
[useTenants] Loaded tenants: X
```

**If you DON'T see these logs**, there's an initialization problem.

---

### 2. Expected Console Logs Flow

#### On Page Load:
1. ✅ `[useDataClient] Configured successfully`
   - DataClient factory is configured with Supabase
   
2. ✅ `[useTenants] DataClient ready, triggering load`
   - Hook detected dataClient is available
   
3. ✅ `[useTenants] Fetching tenants from data source...`
   - Starting to fetch data
   
4. ✅ `[SupabaseDataClient] Query on tenants`
   - Actual Supabase query executing
   
5. ✅ `[useTenants] Loaded tenants: 4`
   - Data loaded successfully (number = tenant count)

---

### 3. Troubleshooting

#### Problem: "No tenants found" but database has data

**Check Console for:**

❌ **No logs at all**
- **Cause**: DataClient not initialized
- **Fix**: Check `/components/providers/DataClientProvider.tsx` is in app layout

❌ **Log: "Waiting for DataClient to initialize..."**
- **Cause**: DataClient configuration failed
- **Check**: 
  - `/utils/supabase/info.tsx` - projectId and publicAnonKey exist?
  - Browser console errors?

❌ **Log: "DataClient not ready yet"**
- **Cause**: Race condition - hook called before client ready
- **Fix**: Already handled by second useEffect

❌ **Log: "Query error" or "Failed to fetch tenants"**
- **Cause**: Database error
- **Check**:
  - Database is running?
  - RLS policies allow read?
  - Table `tenants` exists?

---

### 4. Database Check

#### Quick SQL to verify data exists:

```sql
-- Check if tenants table exists
SELECT COUNT(*) FROM tenants WHERE deleted_at IS NULL;

-- If 0, you need to seed data
```

#### Seed Data via UI:

1. Go to `/setup` page
2. Click "Initialize Tenant Data" button
3. Wait for success message
4. Refresh `/admin/tenants` page

---

### 5. Manual Testing Checklist

#### Load Tenants
- [ ] Open `/admin/tenants`
- [ ] See loading spinner
- [ ] See tenant cards/list
- [ ] Check console: "Loaded tenants: X"

#### Filter by Status
- [ ] Click "Status" dropdown
- [ ] Select "ACTIVE"
- [ ] List updates
- [ ] Check console: Query with filter

#### Filter by Tier
- [ ] Click "Tier" dropdown  
- [ ] Select "FREE"
- [ ] List updates
- [ ] Check console: Query with filter

#### Create Tenant
- [ ] Click "Add Tenant" button
- [ ] Fill form (name + code minimum)
- [ ] Click Save
- [ ] Check console: "Created tenant: uuid"
- [ ] New tenant appears in list

#### Update Tenant
- [ ] Click Edit on a tenant
- [ ] Change name
- [ ] Click Save
- [ ] Check console: "Updated tenant: uuid"
- [ ] Name updates in list

#### Delete Tenant
- [ ] Click Delete on a tenant
- [ ] Confirm
- [ ] Check console: "Deleted tenant: uuid"
- [ ] Tenant removed from list

---

### 6. Network Tab Check

Open DevTools → Network tab:

#### Expected Requests:

**On Page Load:**
1. Request to `tenants` table
   - Method: POST (Supabase uses POST for queries)
   - URL: `https://[project].supabase.co/rest/v1/tenants`
   - Status: 200 OK
   - Response: Array of tenant objects

**On Create:**
1. Request to `tenants` table
   - Method: POST
   - Payload: New tenant data
   - Status: 201 Created

**On Update:**
1. Request to `tenants` table
   - Method: PATCH
   - Payload: Updated fields + version check
   - Status: 200 OK

**On Delete:**
1. Request to `tenants` table
   - Method: PATCH
   - Payload: `{ deleted_at: timestamp }`
   - Status: 200 OK

---

### 7. Cache Behavior

#### First Load:
- Queries database
- Stores in localStorage: `tenants_cache`
- Sets timestamp

#### Second Load (within 5 min):
- Reads from cache immediately
- Shows cached data
- Fetches in background to update

#### After 5 min:
- Cache expired
- Fresh database query

**To test cache:**
1. Load page → Check Network tab (1 request)
2. Refresh immediately → Check Network tab (still 1 request, served from cache)
3. Check console: Should see "Using cache"

---

### 8. Error Scenarios to Test

#### Scenario 1: Database Offline
- **Action**: Stop Supabase / disconnect internet
- **Expected**: 
  - Error message in UI
  - Falls back to cached data if available
  - Console log: "Fetch error"

#### Scenario 2: Invalid Filter
- **Action**: Manually call with bad filter value
- **Expected**: Empty result, no crash

#### Scenario 3: Duplicate Code
- **Action**: Create tenant with existing code
- **Expected**: Database unique constraint error
- **Expected**: Error message in UI

---

### 9. Performance Check

#### Expected Timings:

- **First load**: < 500ms (database query)
- **Cached load**: < 50ms (localStorage read)
- **Create**: < 300ms
- **Update**: < 300ms
- **Delete**: < 200ms

**To measure:**
```javascript
console.time('load-tenants');
// ... load operation
console.timeEnd('load-tenants');
```

---

### 10. Quick Debug Commands

#### In Browser Console:

```javascript
// Check if DataClient is configured
import { DataClientFactory } from '@/lib/data-client';
DataClientFactory.getConfig();

// Check localStorage cache
JSON.parse(localStorage.getItem('tenants_cache'));

// Clear cache
localStorage.removeItem('tenants_cache');

// Manual query test
const { getDataClient } = await import('@/lib/data-client');
const client = getDataClient();
const result = await client.query('tenants', { limit: 5 });
console.log(result);
```

---

## 🎯 SUCCESS CRITERIA

All these must be TRUE:

1. ✅ Console shows all expected logs
2. ✅ Tenant list displays data
3. ✅ Create works
4. ✅ Update works
5. ✅ Delete works
6. ✅ Filters work
7. ✅ Cache works (fast second load)
8. ✅ No errors in console
9. ✅ Network tab shows correct requests
10. ✅ UI updates optimistically

---

## 🚨 Common Issues & Fixes

### Issue 1: Infinite Loading
**Symptom**: Spinner never stops  
**Cause**: loadTenants not completing  
**Fix**: Check console for error, check database connection

### Issue 2: "No tenants found" but data exists
**Symptom**: Empty state shows  
**Cause**: Query returning empty array  
**Fix**: 
- Check filters aren't too restrictive
- Check RLS policies
- Check SQL in SupabaseDataClient

### Issue 3: Create succeeds but list doesn't update
**Symptom**: Created but not visible  
**Cause**: Optimistic update not working  
**Fix**: Check setTenants call in createTenant

### Issue 4: Cache never expires
**Symptom**: Old data persists  
**Cause**: Timestamp comparison wrong  
**Fix**: Check cache age calculation (5 * 60 * 1000)

---

## 📝 Report Template

When reporting issues, include:

```
**Page**: /admin/tenants
**Action**: [What you tried to do]
**Expected**: [What should happen]
**Actual**: [What actually happened]

**Console Logs**:
[Paste relevant logs]

**Network Tab**:
Request URL: 
Status Code:
Response: [First 200 chars]

**Environment**:
Browser: 
Database: Supabase / Local
Data in DB: Yes / No / Unknown
```

---

**Last Updated**: 2026-01-20  
**Phase**: 2 - Pilot Migration  
**Hook**: useTenants
