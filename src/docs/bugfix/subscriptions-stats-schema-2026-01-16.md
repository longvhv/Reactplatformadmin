# Subscriptions Stats Schema Mismatch Fix
**Date:** 2026-01-16
**Author:** AI Assistant
**Status:** Resolved

## Issue Description
Users reported an "Error getting subscriptions stats" on the dashboard.
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
The `DashboardService` was querying `tenant_subscriptions` and `subscription_orders` using incorrect column names based on the provided schema.

1.  **Deletion Flag:** The code used `.eq('is_deleted', false)`, but the schema uses `deleted_at` (timestamp) for soft deletion.
2.  **Primary Key:** In `getRecentActivities`, the code selected `id`, but the schema uses `_id`.

**Incorrect Code:**
```typescript
.eq('is_deleted', false)
.select('id, ...')
```

**Correct Schema (`public.tenant_subscriptions`):**
```sql
create table public.tenant_subscriptions (
  _id uuid not null default gen_random_uuid (),
  ...
  deleted_at timestamp with time zone null,
  ...
)
```

## Implementation Details

### 1. Service Update
Updated `/services/dashboardService.ts`:
- Replaced `.eq('is_deleted', false)` with `.is('deleted_at', null)` in `getSubscriptionsStats` and `getRecentActivities`.
- Updated `getRecentActivities` to select `_id` instead of `id` and map it correctly.

### 2. Debug Tool
Created a new debug component to verify the schema.
- **Path:** `/components/debug/SubscriptionsSchemaDebug.tsx`
- **Route:** `/debug/subscriptions-schema`

This tool checks both `tenant_subscriptions` and `subscription_orders` for column existence and data accessibility.

## Verification
1. Navigate to `/debug/subscriptions-schema` in development mode.
2. Click "Run Check".
3. Verify that `deleted_at` is highlighted in green (or present) and `is_deleted` is NOT found.
4. Check the main dashboard to ensure subscription stats are loading.

## Related Files
- `/services/dashboardService.ts`
- `/components/debug/SubscriptionsSchemaDebug.tsx`
- `/App.tsx`
