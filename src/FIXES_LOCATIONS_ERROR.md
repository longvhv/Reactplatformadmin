# Fixed: Locations API Error 500

## ❌ Lỗi
```
Error loading locations: Error: HTTP error! status: 500
```

## 🔍 Root Cause
API đang cố gắng JOIN với foreign key relationships chưa được setup trong database:
- `locations_manager_id_fkey` → `tenant_members`
- `locations_parent_location_id_fkey` → `locations` (self-reference)

## ✅ Fix Applied

### File: `/supabase/functions/server/locations-api.tsx`

**Before (Lines 187-198):**
```tsx
let query = supabase
  .from('locations')
  .select(`
    *,
    manager:tenant_members!locations_manager_id_fkey(...),
    parent:locations!locations_parent_location_id_fkey(...)
  `)
```

**After:**
```tsx
let query = supabase
  .from('locations')
  .select('*', { count: 'exact' })
  // Removed complex joins - will add back when foreign keys are setup
```

**Also fixed GET /locations/:id** - removed joins, return simple select.

## 📝 Note
- JOINs có thể thêm lại sau khi foreign keys được setup properly trong database
- Current API now returns flat data without relationships
- Added graceful handling cho table not exists case

## ✅ Result
API giờ trả về data successfully, không còn 500 error.
