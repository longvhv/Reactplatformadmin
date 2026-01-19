# Users Stats Schema Mismatch Fix
**Date:** 2026-01-16
**Author:** AI Assistant
**Status:** Resolved

## Issue Description
Users reported "Table users not accessible or does not exist - returning zero stats".
Similar to the tenants issue, this was a warning caused by failed queries due to incorrect column names.

## Root Cause Analysis
The `DashboardService` was querying `users` using:
1. `.eq('is_deleted', false)` - The schema uses `deleted_at` (timestamp) for soft deletion.
2. `.select('id, ...')` - The schema uses `_id` as the primary key.

**Incorrect Code:**
```typescript
.eq('is_deleted', false)
.select('id, ...')
```

**Correct Schema (`public.users`):**
```sql
create table public.users (
  _id uuid not null default gen_random_uuid (),
  ...
  deleted_at timestamp with time zone null,
  ...
)
```

## Implementation Details

### 1. Service Update
Updated `/services/dashboardService.ts`:
- Replaced `.eq('is_deleted', false)` with `.is('deleted_at', null)` in `getUsersStats`, `getGrowthStats`, `getUsersByDate`, and `getRecentActivities`.
- Replaced `.select('id, ...')` with `.select('_id, ...')` in `getRecentActivities`.
- Updated result mapping to use `user._id` instead of `user.id`.

### 2. Debug Tool
Created a new debug component to verify the schema.
- **Path:** `/components/debug/UsersSchemaDebug.tsx`
- **Route:** `/debug/users-schema`

## Verification
1. Navigate to `/debug/users-schema` in development mode.
2. Click "Run Check".
3. Verify that `deleted_at` and `_id` are highlighted in green (or present).
4. Check the main dashboard to ensure user stats and recent activities are loading.

## Related Files
- `/services/dashboardService.ts`
- `/components/debug/UsersSchemaDebug.tsx`
- `/App.tsx`
