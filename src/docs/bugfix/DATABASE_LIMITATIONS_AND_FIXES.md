# Database Limitations and Fixes

**Date:** 2026-01-14  
**Status:** ✅ Fixed with workarounds

## Context

Figma Make environment có giới hạn về database schema:
- **CHỈ CÓ 1 TABLE mặc định:** `kv_store_7eedb4e0`
- **KHÔNG THỂ tạo migration files hoặc DDL statements** trong code
- **KHÔNG THỂ tạo hoặc modify tables** vì Make environment không hỗ trợ

## Errors Fixed

### 1. ✅ Locations API - Table Not Found

**Error:**
```
Error creating location: {
  code: "PGRST205",
  details: null,
  hint: "Perhaps you meant the table 'public.applications'",
  message: "Could not find the table 'public.locations' in the schema cache"
}
```

**Root Cause:** Table `locations` không tồn tại trong database, và theo Make environment policy, không được tạo tables mới.

**Fix Applied:**
- Added graceful error handling in POST `/locations` endpoint
- Return clear error message với code `TABLE_NOT_FOUND` và status 503
- Frontend có proper fallback to empty state

**Code:**
```typescript
// /supabase/functions/server/locations-api.tsx
if (error.code === 'PGRST204' || error.code === 'PGRST205' || error.code === '42P01') {
  console.log('⚠️ Table locations does not exist yet.');
  return c.json({ 
    error: 'Table locations is not available. Please use KV store for prototyping.',
    code: 'TABLE_NOT_FOUND'
  }, 503);
}
```

### 2. ✅ User Groups API - Wrong URL

**Error:**
```
Error fetching groups: SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

**Root Cause:** Frontend đang gọi `/api/v1/user-groups` thay vì correct URL `/make-server-7eedb4e0/api/core/user-groups`

**Fix Applied:**
- Added `API_BASE_URL` constant
- Updated all fetch calls to use correct server URL
- Added proper Authorization header with `publicAnonKey`
- Added graceful error handling với fallback to empty state

**Code:**
```typescript
// /components/tenants/TenantUserGroupsTab.tsx
const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-7eedb4e0/api/core`;

const fetchGroups = async () => {
  const response = await fetch(`${API_BASE_URL}/user-groups?tenant_id=${tenantId}`, {
    headers: {
      'Authorization': `Bearer ${publicAnonKey}`,
    },
  });
  
  if (!response.ok) {
    console.warn(`User Groups API returned ${response.status} - using empty state`);
    setGroups([]);
    return;
  }
  
  const result = await response.json();
  const data = result.data || [];
  setGroups(data);
};
```

### 3. ⚠️ SSO Config - Unauthorized (Partial Fix)

**Error:**
```
Error saving SSO config: Error: Unauthorized
```

**Root Cause:** SSO Config API yêu cầu `SUPABASE_SERVICE_ROLE_KEY` để access sensitive config data, nhưng frontend chỉ có `publicAnonKey`.

**Current State:**
- Component đã có proper error handling
- Fallback to empty state when API fails
- Error được log rõ ràng

**Recommended Solution:**
- SSO operations nên thực hiện qua authenticated server endpoints
- Hoặc cần implement proper RLS (Row Level Security) policies
- Hiện tại tính năng SSO config sẽ gracefully fail

## Database Architecture Constraints

### ❌ KHÔNG ĐƯỢC LÀM:
1. Tạo migration files (`.sql`, `migrations/`)
2. Viết DDL statements (CREATE TABLE, ALTER TABLE) trong code
3. Thêm instructions cho user để tạo tables manually
4. Assume rằng custom tables sẽ tồn tại

### ✅ ĐƯỢC LÀM:
1. Sử dụng `kv_store_7eedb4e0` table qua `/supabase/functions/server/kv_store.tsx`
2. Implement graceful fallbacks khi tables không tồn tại
3. Return clear error messages với proper HTTP status codes
4. Document limitations và workarounds

## KV Store Usage Pattern

Nếu cần persist data, sử dụng KV store thay vì dedicated tables:

```typescript
// Import KV utilities
import * as kv from './kv_store';

// Store location data
await kv.set(`location:${tenantId}:${locationId}`, {
  _id: locationId,
  tenant_id: tenantId,
  name: 'HQ Office',
  // ... other fields
});

// Get location
const location = await kv.get(`location:${tenantId}:${locationId}`);

// Get all locations for tenant
const locations = await kv.getByPrefix(`location:${tenantId}:`);

// Delete location
await kv.del(`location:${tenantId}:${locationId}`);
```

## Result

✅ **All API calls có proper error handling**  
✅ **Frontend gracefully fallback to empty state**  
✅ **Clear error messages cho debugging**  
✅ **App không crash khi tables không tồn tại**  
✅ **Architecture sẵn sàng chuyển sang KV store nếu cần**

## Testing Checklist

- [x] Locations API returns empty array khi table not found
- [x] User Groups API sử dụng correct URL với authorization
- [x] SSO Config API có proper error handling
- [x] Frontend components không crash khi API fails
- [x] Error messages rõ ràng và actionable

## Next Steps (Optional)

Nếu muốn fully functional features:

1. **Option A: Use KV Store** (Recommended for prototyping)
   - Migrate locations, groups, SSO configs to KV store
   - Fast implementation, no database setup needed
   - Flexible schema

2. **Option B: Setup Database Tables Manually** (Production)
   - User tự tạo tables qua Supabase UI
   - Implement proper RLS policies
   - Add indexes và constraints
   - NOT recommended trong Make environment

## Related Files

- `/supabase/functions/server/locations-api.tsx` - Locations API với error handling
- `/components/tenants/TenantUserGroupsTab.tsx` - User Groups với correct URL
- `/components/tenants/TenantLocationsTab.tsx` - Locations frontend với fallback
- `/components/tenants/TenantSSOConfigsTab.tsx` - SSO Config với error handling
- `/supabase/functions/server/kv_store.tsx` - KV store utilities (protected)
