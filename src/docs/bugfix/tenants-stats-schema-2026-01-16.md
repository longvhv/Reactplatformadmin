# Tenants Stats Schema Mismatch Fix
**Date:** 2026-01-16
**Author:** AI Assistant
**Status:** Resolved

## Issue Description
Users reported "Table tenants not accessible or does not exist - returning zero stats".
This was technically a warning in the console, but the root cause was a failed query due to incorrect column usage.

## Root Cause Analysis
The `DashboardService` was querying `tenants` using `.eq('is_deleted', false)`.
However, the `tenants` table schema uses `deleted_at` timestamp for soft deletion, not a boolean `is_deleted`.
When Supabase receives a query for a non-existent column, it returns an error (often code `42703` - undefined_column, or similar which might be interpreted generically in the catch block).

**Incorrect Code:**
```typescript
.eq('is_deleted', false)
```

**Correct Schema (`public.tenants`):**
```sql
create table public.tenants (
  _id uuid not null default gen_random_uuid (),
  ...
  deleted_at timestamp with time zone null,
  ...
)
```

## Implementation Details

### 1. Service Update
Updated `/services/dashboardService.ts`:
- Replaced `.eq('is_deleted', false)` with `.is('deleted_at', null)` in `getTenantsStats` and `getGrowthStats`.

### 2. Debug Tool
Created a new debug component to verify the schema.
- **Path:** `/components/debug/TenantsSchemaDebug.tsx`
- **Route:** `/debug/tenants-schema`

## Verification
1. Navigate to `/debug/tenants-schema` in development mode.
2. Click "Run Check".
3. Verify that `deleted_at` is highlighted in green (or present) and `is_deleted` is NOT found.
4. Check the main dashboard to ensure tenant stats are loading.

## Related Files
- `/services/dashboardService.ts`
- `/components/debug/TenantsSchemaDebug.tsx`
- `/App.tsx`
