# Supabase RLS Setup Guide
**Created**: 2026-01-16  
**Purpose**: Hướng dẫn setup Row Level Security policies cho dashboard  

## Problem
Dashboard đang query các bảng nhưng bị chặn bởi RLS policies hoặc bảng chưa tồn tại.

## Supabase RLS cho Dashboard

Để dashboard có thể đọc dữ liệu, bạn cần enable public read access cho các bảng sau:

### 1. Users Table
```sql
-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read for dashboard stats (count only)
CREATE POLICY "Allow anon read for dashboard stats"
ON public.users
FOR SELECT
TO anon
USING (true);
```

### 2. Tenants Table
```sql
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read for dashboard stats"
ON public.tenants
FOR SELECT
TO anon
USING (true);
```

### 3. Tenant Subscriptions Table
```sql
ALTER TABLE public.tenant_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read for dashboard stats"
ON public.tenant_subscriptions
FOR SELECT
TO anon
USING (true);
```

### 4. Subscription Orders Table
```sql
ALTER TABLE public.subscription_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read for dashboard stats"
ON public.subscription_orders
FOR SELECT
TO anon
USING (true);
```

### 5. Subscription Invoices Table
```sql
ALTER TABLE public.subscription_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read for dashboard stats"
ON public.subscription_invoices
FOR SELECT
TO anon
USING (true);
```

### 6. Webhooks Table
```sql
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read for dashboard stats"
ON public.webhooks
FOR SELECT
TO anon
USING (true);
```

### 7. Webhook Delivery Logs Table
```sql
ALTER TABLE public.webhook_delivery_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read for dashboard stats"
ON public.webhook_delivery_logs
FOR SELECT
TO anon
USING (true);
```

### 8. System Jobs Table
```sql
ALTER TABLE public.system_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read for dashboard stats"
ON public.system_jobs
FOR SELECT
TO anon
USING (true);
```

### 9. API Usage Logs Table
```sql
ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read for dashboard stats"
ON public.api_usage_logs
FOR SELECT
TO anon
USING (true);
```

### 10. Traffic Logs Table (Cần tạo mới)
```sql
-- Create traffic_logs table
CREATE TABLE IF NOT EXISTS public.traffic_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  app_code text,
  access_time timestamptz DEFAULT now(),
  ip_address inet,
  user_agent text,
  endpoint text,
  http_method text,
  status_code int,
  response_time_ms int,
  request_size_bytes bigint,
  response_size_bytes bigint,
  data_region text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.traffic_logs ENABLE ROW LEVEL SECURITY;

-- Allow anon read for dashboard stats
CREATE POLICY "Allow anon read for dashboard stats"
ON public.traffic_logs
FOR SELECT
TO anon
USING (true);

-- Create indexes for performance
CREATE INDEX idx_traffic_logs_access_time ON public.traffic_logs(access_time);
CREATE INDEX idx_traffic_logs_tenant_id ON public.traffic_logs(tenant_id);
CREATE INDEX idx_traffic_logs_app_code ON public.traffic_logs(app_code);
```

## Quick Setup Script
Copy toàn bộ script sau và chạy trong Supabase SQL Editor:

```sql
-- ==================== ENABLE RLS + ANON READ POLICIES ====================

-- Users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon read for dashboard stats" ON public.users FOR SELECT TO anon USING (true);

-- Tenants
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon read for dashboard stats" ON public.tenants FOR SELECT TO anon USING (true);

-- Tenant Subscriptions
ALTER TABLE public.tenant_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon read for dashboard stats" ON public.tenant_subscriptions FOR SELECT TO anon USING (true);

-- Subscription Orders
ALTER TABLE public.subscription_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon read for dashboard stats" ON public.subscription_orders FOR SELECT TO anon USING (true);

-- Subscription Invoices
ALTER TABLE public.subscription_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon read for dashboard stats" ON public.subscription_invoices FOR SELECT TO anon USING (true);

-- Webhooks
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon read for dashboard stats" ON public.webhooks FOR SELECT TO anon USING (true);

-- Webhook Delivery Logs
ALTER TABLE public.webhook_delivery_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon read for dashboard stats" ON public.webhook_delivery_logs FOR SELECT TO anon USING (true);

-- System Jobs
ALTER TABLE public.system_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon read for dashboard stats" ON public.system_jobs FOR SELECT TO anon USING (true);

-- API Usage Logs
ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon read for dashboard stats" ON public.api_usage_logs FOR SELECT TO anon USING (true);

-- Traffic Logs (Create table if not exists)
CREATE TABLE IF NOT EXISTS public.traffic_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  app_code text,
  access_time timestamptz DEFAULT now(),
  ip_address inet,
  user_agent text,
  endpoint text,
  http_method text,
  status_code int,
  response_time_ms int,
  request_size_bytes bigint,
  response_size_bytes bigint,
  data_region text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.traffic_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon read for dashboard stats" ON public.traffic_logs FOR SELECT TO anon USING (true);
CREATE INDEX IF NOT EXISTS idx_traffic_logs_access_time ON public.traffic_logs(access_time);
CREATE INDEX IF NOT EXISTS idx_traffic_logs_tenant_id ON public.traffic_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_traffic_logs_app_code ON public.traffic_logs(app_code);
```

## Security Note
⚠️ **WARNING**: Policies trên cho phép anonymous users đọc tất cả dữ liệu để hiển thị dashboard stats.

Nếu cần bảo mật cao hơn, bạn có thể:
1. Implement authentication và filter theo user
2. Tạo database view riêng cho stats
3. Migrate sang Golang backend API với JWT authentication

## After Setup
Sau khi chạy script:
1. Refresh lại trang dashboard
2. Kiểm tra console - không còn error messages
3. Dashboard sẽ hiển thị số liệu thực từ database

## References
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- Dashboard Service: `/services/dashboardService.ts`
- Bug Report: `/docs/bugfix/dashboard-missing-tables-2026-01-16.md`
