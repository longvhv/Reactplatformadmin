# Dashboard Missing Tables Bug Report
**Date**: 2026-01-16  
**Severity**: Medium  
**Status**: Documented

## Issue
Dashboard service đang cố gắng query nhiều bảng không tồn tại hoặc không có quyền truy cập trong Supabase database.

## Error Log
```
Error getting tenants stats: { "message": "" }
Error getting webhooks stats: { "message": "" }
Error getting users stats: { "message": "" }
Error getting subscriptions stats: { "message": "" }
Error getting jobs stats: { "message": "" }
Error getting traffic stats: {
  "code": "PGRST205",
  "details": null,
  "hint": "Perhaps you meant the table 'public.auth_logs'",
  "message": "Could not find the table 'public.traffic_logs' in the schema cache"
}
```

## Root Cause
Các bảng sau không tồn tại hoặc không có RLS policy trong Supabase:
1. ❌ `users` - table exists nhưng không có quyền truy cập
2. ❌ `tenants` - table exists nhưng không có quyền truy cập
3. ❌ `webhooks` - table exists nhưng không có quyền truy cập
4. ❌ `tenant_subscriptions` - table exists nhưng không có quyền truy cập
5. ❌ `system_jobs` - table exists nhưng không có quyền truy cập
6. ❌ `traffic_logs` - table không tồn tại (confirmed)

## Current Workaround
Service đã implement try-catch để return 0 values khi query fail, tránh crash app.

## Permanent Solution (TODO)
### Option 1: Tạo tables và RLS policies trong Supabase
```sql
-- Create traffic_logs table
CREATE TABLE IF NOT EXISTS public.traffic_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  app_code text,
  access_time timestamptz DEFAULT now(),
  ip_address text,
  user_agent text,
  endpoint text,
  http_method text,
  status_code int,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.traffic_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policy (allow anon read for dashboard stats)
CREATE POLICY "Allow anon read for dashboard stats"
ON public.traffic_logs
FOR SELECT
TO anon
USING (true);

-- Tương tự cho các tables khác nếu cần
```

### Option 2: Migrate sang Golang backend API (RECOMMENDED)
- Implement các endpoints:
  - `GET /api/v1/dashboard/overview`
  - `GET /api/v1/dashboard/stats/users`
  - `GET /api/v1/dashboard/stats/tenants`
  - `GET /api/v1/dashboard/stats/subscriptions`
  - `GET /api/v1/dashboard/stats/webhooks`
  - `GET /api/v1/dashboard/stats/jobs`
  - `GET /api/v1/dashboard/stats/traffic`
  - `GET /api/v1/dashboard/charts`
  - `GET /api/v1/dashboard/activities`

## Files Affected
- `/services/dashboardService.ts` - Service layer với try-catch
- `/modules/dashboard/DashboardPage.tsx` - UI page
- `/api/dashboardApi.ts` - API client (chưa implement)

## Next Steps
1. ✅ Document bug trong `/docs/bugfix/`
2. ✅ Add better error logging
3. ⏳ User cần tạo tables trong Supabase hoặc
4. ⏳ Implement Golang backend endpoints
