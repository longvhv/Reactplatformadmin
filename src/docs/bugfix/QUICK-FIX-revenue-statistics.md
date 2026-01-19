# QUICK FIX: Revenue Statistics Tab

## ⚡ Vấn đề
Menu "Thống kê doanh thu" trong tenant detail bị lỗi do thiếu database table.

## ✅ Giải pháp nhanh (3 bước)

### Bước 1: Run Migration trong Supabase
1. Mở **Supabase Dashboard** → **SQL Editor**
2. Copy toàn bộ file: `/docs/migrations/037_saas_business_reports.sql`
3. Paste và click **Run**

### Bước 2: Insert Sample Data (Test)
```sql
-- Get tenant ID
SELECT _id, tenant_name FROM public.tenants LIMIT 1;

-- Insert sample data (replace YOUR_TENANT_ID)
INSERT INTO telemetry.saas_business_reports 
  (_id, partner_id, report_date, revenue_category, total_revenue, currency_code, tenant_count)
VALUES
  (gen_random_uuid(), 'YOUR_TENANT_ID', CURRENT_DATE - 1, 'Subscription', 10000000, 'VND', 15),
  (gen_random_uuid(), 'YOUR_TENANT_ID', CURRENT_DATE - 2, 'Usage Fees', 2500000, 'VND', 8),
  (gen_random_uuid(), 'YOUR_TENANT_ID', CURRENT_DATE - 3, 'Add-ons', 1500000, 'VND', 5);
```

### Bước 3: Test
1. Refresh browser
2. Navigate: **Tenants** → Select tenant → Tab **"Thống kê doanh thu"**
3. Sẽ thấy charts và statistics

## 📁 Full Documentation
Chi tiết đầy đủ tại: `/docs/bugfix/2026-01-16-revenue-statistics-database-setup.md`

---
**Status:** ✅ Fixed - Chỉ cần run migration  
**Time:** ~2 phút
