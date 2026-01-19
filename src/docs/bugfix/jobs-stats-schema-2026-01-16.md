# Jobs Stats Schema Mismatch Fix
**Date:** 2026-01-16
**Author:** AI Assistant
**Status:** Resolved

## Issue Description
Users reported an "Error getting jobs stats" on the dashboard.
Error details:
```json
{
  "message": "Unknown error",
  "code": "N/A",
  "details": null,
  "hint": null
}
```

## Root Cause Analysis
The `DashboardService` was querying `system_jobs` using incorrect column names based on the provided schema.

1.  **Deletion Flag:** The code used `.eq('is_deleted', false)`, but the schema does not have `is_deleted` or `deleted_at`. The table does not support soft deletes (or they are handled differently).
2.  **Active Status:** The code used `.eq('status', 'active')`, but the schema has an explicit `is_active` boolean column, and the default status is `pending`. It is more accurate to use `is_active = true` for counting "Active Jobs".

**Incorrect Code:**
```typescript
.eq('is_deleted', false)
.eq('status', 'active')
```

**Correct Schema (`public.system_jobs`):**
```sql
create table public.system_jobs (
  id uuid not null default gen_random_uuid (),
  ...
  is_active boolean null default true,
  status character varying(50) not null default 'pending'::character varying,
  ...
)
-- No is_deleted column
```

## Implementation Details

### 1. Service Update
Updated `/services/dashboardService.ts`:
- Removed `.eq('is_deleted', false)` from all job queries.
- Changed "Active Jobs" query to use `.eq('is_active', true)` instead of `.eq('status', 'active')`.

### 2. Debug Tool
Created a new debug component to verify the schema.
- **Path:** `/components/debug/JobsSchemaDebug.tsx`
- **Route:** `/debug/jobs-schema`

## Verification
1. Navigate to `/debug/jobs-schema` in development mode.
2. Click "Run Check".
3. Verify that `is_active` is highlighted in green (or present) and `is_deleted` is NOT found.
4. Check the main dashboard to ensure jobs stats are loading.

## Related Files
- `/services/dashboardService.ts`
- `/components/debug/JobsSchemaDebug.tsx`
- `/App.tsx`
