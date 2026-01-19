# Traffic Stats Schema Mismatch Fix
**Date:** 2026-01-16
**Author:** AI Assistant
**Status:** Resolved

## Issue Description
Users reported an "Error getting traffic stats" on the dashboard.
Error details:
```json
{
  "message": "Unknown error",
  "code": "N/A",
  "details": null,
  "hint": null
}
```
This error occurred because the dashboard service was querying a non-existent column.

## Root Cause Analysis
The `DashboardService` was querying the `telemetry.traffic_logs` table using the column `access_time`.
However, the actual database schema for `telemetry.traffic_logs` uses `timestamp` for the time column.

**Incorrect Code:**
```typescript
.gte('access_time', todayStart.toISOString())
```

**Correct Schema:**
```sql
create table telemetry.traffic_logs (
  ...
  timestamp timestamp with time zone not null default now(),
  ...
)
```

## Implementation Details

### 1. Service Update
Updated `/services/dashboardService.ts` to replace all instances of `access_time` with `timestamp`.

Affected methods:
- `getTrafficStats()`: Fixed today's traffic, month's traffic, and unique visitors queries.
- `getTrafficByDate()`: Fixed the time series chart data query.

### 2. Debug Tool
Created a new debug component to verify the schema and connectivity.
- **Path:** `/components/debug/TrafficSchemaDebug.tsx`
- **Route:** `/debug/traffic-schema`

This tool attempts to fetch a single record from `telemetry.traffic_logs` and inspects the returned object keys to confirm column names.

## Verification
1. Navigate to `/debug/traffic-schema` in development mode.
2. Click "Run Check".
3. Verify that `timestamp` is highlighted in green and `access_time` is not found.
4. Check the main dashboard to ensure traffic stats are now loading correctly.

## Related Files
- `/services/dashboardService.ts`
- `/components/debug/TrafficSchemaDebug.tsx`
- `/App.tsx`
