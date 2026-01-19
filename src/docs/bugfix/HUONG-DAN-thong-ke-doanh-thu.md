# Hướng dẫn Fix lỗi "Thống kê doanh thu"

## 🎯 Vấn đề

Khi click vào tab **"Thống kê doanh thu"** trong trang chi tiết Tenant, app báo lỗi do thiếu bảng database.

## ✅ Giải pháp (3 bước đơn giản)

### Bước 1: Chạy Migration trong Supabase

1. **Mở Supabase Dashboard** (link trong email setup Supabase của bạn)
2. Click vào **SQL Editor** ở menu bên trái
3. Mở file `/docs/migrations/037_saas_business_reports.sql` trong project
4. Copy toàn bộ nội dung (từ đầu đến cuối file)
5. Paste vào SQL Editor trong Supabase
6. Click nút **Run** hoặc nhấn `Ctrl+Enter`
7. Đợi ~5 giây để migration chạy xong

**✅ Kết quả:** Bạn sẽ thấy thông báo "✅ SaaS Business Reports migration completed successfully"

### Bước 2: Thêm dữ liệu mẫu để test

Vẫn trong SQL Editor, chạy đoạn code sau:

```sql
-- Bước 2.1: Lấy ID của tenant để test
SELECT _id, tenant_name, slug 
FROM public.tenants 
LIMIT 5;
```

Copy một `_id` bất kỳ (ví dụ: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)

```sql
-- Bước 2.2: Thêm dữ liệu mẫu (thay YOUR_TENANT_ID bằng _id vừa copy)
INSERT INTO telemetry.saas_business_reports 
  (_id, partner_id, report_date, revenue_category, total_revenue, currency_code, tenant_count, details_json)
VALUES
  -- Doanh thu Subscription tháng này
  (
    gen_random_uuid(),
    'YOUR_TENANT_ID',  -- ⚠️ THAY ĐỔI CHỖ NÀY
    CURRENT_DATE - INTERVAL '1 day',
    'Subscription',
    15000000,  -- 15 triệu VNĐ
    'VND',
    20,
    '{"plan": "Enterprise", "period": "monthly"}'::jsonb
  ),
  -- Doanh thu Usage Fees
  (
    gen_random_uuid(),
    'YOUR_TENANT_ID',  -- ⚠️ THAY ĐỔI CHỖ NÀY
    CURRENT_DATE - INTERVAL '2 days',
    'Usage Fees',
    3500000,  -- 3.5 triệu VNĐ
    'VND',
    12,
    '{"type": "API calls", "volume": 150000}'::jsonb
  ),
  -- Doanh thu Add-ons
  (
    gen_random_uuid(),
    'YOUR_TENANT_ID',  -- ⚠️ THAY ĐỔI CHỖ NÀY
    CURRENT_DATE - INTERVAL '3 days',
    'Add-ons',
    2000000,  -- 2 triệu VNĐ
    'VND',
    8,
    '{"features": ["Analytics", "Custom Domain"]}'::jsonb
  ),
  -- Doanh thu Professional Services
  (
    gen_random_uuid(),
    'YOUR_TENANT_ID',  -- ⚠️ THAY ĐỔI CHỖ NÀY
    CURRENT_DATE - INTERVAL '5 days',
    'Professional Services',
    8000000,  -- 8 triệu VNĐ
    'VND',
    5,
    '{"service": "Consulting", "hours": 40}'::jsonb
  ),
  -- Doanh thu Support
  (
    gen_random_uuid(),
    'YOUR_TENANT_ID',  -- ⚠️ THAY ĐỔI CHỖ NÀY
    CURRENT_DATE - INTERVAL '7 days',
    'Support',
    1500000,  -- 1.5 triệu VNĐ
    'VND',
    10,
    '{"level": "Premium", "tickets": 25}'::jsonb
  );
```

**⚠️ Quan trọng:** Nhớ thay `YOUR_TENANT_ID` bằng ID thật từ bước 2.1

### Bước 3: Test tính năng

1. **Quay lại app** và refresh trang (F5)
2. Navigate: **Tenants** (menu bên trái) → Click vào một tenant → Click tab **"Thống kê doanh thu"**
3. Bạn sẽ thấy:
   - ✅ 3 cards hiển thị tổng doanh thu, trung bình, số lượng tenants
   - ✅ Biểu đồ line chart xu hướng doanh thu
   - ✅ Biểu đồ tròn (pie chart) doanh thu theo danh mục
   - ✅ Biểu đồ cột (bar chart) doanh thu theo tiền tệ
   - ✅ Bảng chi tiết các danh mục
   - ✅ Nút Export CSV
   - ✅ Bộ lọc thời gian (7 ngày, 30 ngày, 90 ngày, 1 năm, Tất cả)

## 📊 Tính năng có trong module

### Thống kê tổng quan
- **Total Revenue**: Tổng doanh thu
- **Average Revenue**: Doanh thu trung bình
- **Total Tenants**: Tổng số tenants/customers

### Biểu đồ
- **Revenue Trend**: Xu hướng doanh thu theo thời gian (line chart)
- **Revenue by Category**: Doanh thu theo danh mục (pie chart)
- **Revenue by Currency**: Doanh thu theo loại tiền tệ (bar chart)

### Bảng chi tiết
- Danh mục (Category)
- Doanh thu (Revenue)
- Số lượng tenant (Tenant Count)
- Trung bình mỗi tenant (Avg per Tenant)

### Tính năng khác
- **Date filters**: Lọc theo 7 ngày, 30 ngày, 90 ngày, 1 năm, hoặc tất cả
- **Export CSV**: Xuất dữ liệu ra file Excel
- **Refresh**: Tải lại dữ liệu
- **Auto currency format**: Tự động format VNĐ, USD, EUR...

## 🎨 Giao diện

Design theo chuẩn **Stripe/GitHub/Vercel**:
- Màu chủ đạo: **Indigo (#6366f1)**
- Font chữ: **Inter**
- Clean, minimal, professional
- Responsive (tự động điều chỉnh trên mobile/tablet/desktop)

## 🔍 Xác minh migration đã chạy thành công

Chạy query sau trong SQL Editor:

```sql
-- Kiểm tra bảng đã được tạo
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'telemetry' 
  AND table_name = 'saas_business_reports'
) as table_exists;

-- Kiểm tra số lượng record
SELECT COUNT(*) as total_records
FROM telemetry.saas_business_reports;

-- Xem dữ liệu mẫu
SELECT 
  report_date,
  revenue_category,
  total_revenue,
  currency_code,
  tenant_count
FROM telemetry.saas_business_reports
ORDER BY report_date DESC
LIMIT 10;
```

## ❌ Lỗi thường gặp

### Lỗi 1: "relation telemetry.saas_business_reports does not exist"
**Nguyên nhân:** Chưa chạy migration  
**Giải pháp:** Chạy lại Bước 1

### Lỗi 2: "No revenue data available"
**Nguyên nhân:** Chưa có dữ liệu trong bảng  
**Giải pháp:** Chạy lại Bước 2

### Lỗi 3: Charts không hiển thị
**Nguyên nhân:** Dữ liệu không có `report_date` hoặc `total_revenue` hợp lệ  
**Giải pháp:** Kiểm tra lại dữ liệu đã insert

## 📚 Tài liệu chi tiết

### Tiếng Anh (Technical)
- **Full Documentation:** `/docs/bugfix/2026-01-16-revenue-statistics-database-setup.md`
- **Quick Fix:** `/docs/bugfix/QUICK-FIX-revenue-statistics.md`
- **Summary:** `/docs/bugfix/README-revenue-statistics.md`

### Files liên quan
- **Migration SQL:** `/docs/migrations/037_saas_business_reports.sql`
- **Service:** `/services/businessReportsService.ts`
- **Component:** `/components/tenant/RevenueStatistics.tsx`
- **Page:** `/pages/TenantDetailPage.tsx`

## 🚀 Sử dụng trong Production

### Dữ liệu thật
Sau khi test xong, bạn có thể:
1. Xóa dữ liệu mẫu: `DELETE FROM telemetry.saas_business_reports WHERE partner_id = 'YOUR_TENANT_ID';`
2. Integrate với hệ thống billing/subscription thật để tự động tạo revenue reports
3. Tạo scheduled job (cron) để tổng hợp doanh thu hàng ngày/tháng

### API Endpoints (sẵn sàng migrate sang Golang)
```
GET    /api/v1/telemetry/business-reports
GET    /api/v1/telemetry/business-reports/:id
GET    /api/v1/telemetry/business-reports/partner/:partnerId
POST   /api/v1/telemetry/business-reports
PUT    /api/v1/telemetry/business-reports/:id
DELETE /api/v1/telemetry/business-reports/:id
GET    /api/v1/telemetry/business-reports/stats/:partnerId
```

## ✅ Checklist hoàn thành

- [ ] Đã chạy migration trong Supabase SQL Editor
- [ ] Đã insert dữ liệu mẫu để test
- [ ] Đã refresh app và test tab "Thống kê doanh thu"
- [ ] Thấy được các biểu đồ và thống kê
- [ ] Export CSV hoạt động
- [ ] Date filters hoạt động
- [ ] Đã đọc tài liệu để hiểu cách integrate với production data

## 💡 Tips

- Dữ liệu mẫu có thể thay đổi `total_revenue` (đơn vị VNĐ) tùy ý
- `revenue_category` có thể là bất kỳ tên nào: "Subscription", "Usage", "Add-ons", etc.
- `currency_code` hỗ trợ mọi loại tiền tệ: VND, USD, EUR, JPY...
- `details_json` có thể lưu metadata bất kỳ dưới dạng JSON

---

**Thời gian setup:** ~5 phút  
**Trạng thái:** ✅ Sẵn sàng sử dụng  
**Hỗ trợ:** Xem tài liệu tiếng Anh ở `/docs/bugfix/` để biết thêm chi tiết
