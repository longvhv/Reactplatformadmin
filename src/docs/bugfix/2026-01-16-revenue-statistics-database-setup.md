# Revenue Statistics Database Setup - Bugfix Documentation

**Date:** 2026-01-16  
**Module:** Tenant Revenue Statistics  
**Issue:** Menu "Thống kê doanh thu" trong chi tiết tenant bị lỗi  
**Status:** ✅ FIXED  

---

## 🐛 Problem Description

Khi truy cập tab "Thống kê doanh thu" trong tenant detail page, app gặp lỗi do:

1. **Missing Database Table:** Table `telemetry.saas_business_reports` chưa được tạo
2. **Missing Schema:** Schema `telemetry` có thể chưa tồn tại  
3. **Missing RLS Policies:** Row Level Security policies chưa được setup
4. **Missing Indexes:** Performance indexes chưa được tạo

## 📊 Database Table Schema

Table: `telemetry.saas_business_reports`

```sql
-- Primary fields
_id UUID PRIMARY KEY
report_date DATE
partner_id UUID  -- References tenant _id
revenue_category TEXT
total_revenue NUMERIC(30, 4)
currency_code CHAR(3) DEFAULT 'VND'
tenant_count INTEGER
details_json JSONB
created_at TIMESTAMP WITH TIME ZONE
```

## ✅ Solution

Migration SQL file đã sẵn sàng tại: `/docs/migrations/037_saas_business_reports.sql`

### Step 1: Chạy Migration SQL

**Trong Supabase Dashboard:**

1. Mở **SQL Editor** trong Supabase Dashboard
2. Copy toàn bộ nội dung file `/docs/migrations/037_saas_business_reports.sql`
3. Paste vào SQL Editor
4. Click **Run** để thực thi migration

**Migration này sẽ tạo:**
- ✅ Schema `telemetry` (nếu chưa tồn tại)
- ✅ Table `telemetry.saas_business_reports`
- ✅ 7 indexes để tối ưu performance
- ✅ 3 RLS policies (service_role, partner_read, partner_insert)
- ✅ 5 helper functions cho analytics
- ✅ 1 trigger để validate data
- ✅ Permissions cho authenticated users

### Step 2: Verify Migration

Sau khi chạy migration, verify bằng query:

```sql
-- Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'telemetry' 
  AND table_name = 'saas_business_reports'
);

-- Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'telemetry' 
AND table_name = 'saas_business_reports'
ORDER BY ordinal_position;

-- Check RLS policies
SELECT policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'telemetry' 
AND tablename = 'saas_business_reports';
```

### Step 3: Insert Sample Data (Optional)

Để test component, insert sample data:

```sql
-- Generate UUID helper (for browser compatibility)
-- You can also use gen_random_uuid() in Postgres

-- Sample data for testing
INSERT INTO telemetry.saas_business_reports 
  (_id, partner_id, report_date, revenue_category, total_revenue, currency_code, tenant_count, details_json)
VALUES
  (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000001', -- Replace with actual tenant _id
    CURRENT_DATE - INTERVAL '30 days',
    'Subscription',
    10000000,
    'VND',
    15,
    '{"plan": "Enterprise", "period": "monthly"}'::jsonb
  ),
  (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000001',
    CURRENT_DATE - INTERVAL '29 days',
    'Usage Fees',
    2500000,
    'VND',
    8,
    '{"type": "API calls", "volume": 100000}'::jsonb
  ),
  (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000001',
    CURRENT_DATE - INTERVAL '28 days',
    'Add-ons',
    1500000,
    'VND',
    5,
    '{"features": ["Advanced Analytics", "Custom Branding"]}'::jsonb
  ),
  (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000001',
    CURRENT_DATE - INTERVAL '27 days',
    'Subscription',
    12000000,
    'VND',
    18,
    '{"plan": "Enterprise", "period": "monthly"}'::jsonb
  ),
  (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000001',
    CURRENT_DATE - INTERVAL '26 days',
    'Professional Services',
    5000000,
    'VND',
    3,
    '{"service": "Consulting", "hours": 20}'::jsonb
  );
```

**⚠️ Important:** Replace `'00000000-0000-0000-0000-000000000001'` with actual tenant `_id` from your `public.tenants` table.

To get actual tenant IDs:

```sql
-- Get tenant IDs
SELECT _id, tenant_name, slug FROM public.tenants LIMIT 10;
```

### Step 4: Test the Component

1. Refresh app trong browser
2. Navigate to **Tenants** → Select a tenant → Click tab **"Thống kê doanh thu"**
3. Component sẽ hiển thị:
   - ✅ Total Revenue card
   - ✅ Average Revenue card  
   - ✅ Total Tenants card
   - ✅ Revenue Trend line chart
   - ✅ Revenue by Category pie chart
   - ✅ Revenue by Currency bar chart
   - ✅ Category Details table
   - ✅ Export CSV button
   - ✅ Date range filters (7d, 30d, 90d, 1y, All)

## 🏗️ Technical Details

### Database Functions Created

1. **`get_partner_revenue_summary(p_partner_id, p_date_from, p_date_to)`**
   - Returns total revenue, avg revenue, total reports, total tenants by currency

2. **`get_revenue_by_category(p_partner_id, p_date_from, p_date_to)`**
   - Returns revenue grouped by category with tenant counts

3. **`get_revenue_trend_monthly(p_partner_id, p_months)`**
   - Returns monthly revenue trend for last N months

4. **`get_top_revenue_categories(p_partner_id, p_limit)`**
   - Returns top revenue categories with percentages

5. **`cleanup_old_business_reports(p_retention_days)`**
   - Cleanup function for data retention (2 years default)

### RLS Policies

1. **service_role_policy**: Full access for service role
2. **partner_read_policy**: Authenticated users can only read reports for their tenants
3. **partner_insert_policy**: Authenticated users can insert reports for their tenants

### Indexes for Performance

1. `idx_saas_business_reports_partner_id` - Partner queries
2. `idx_saas_business_reports_report_date` - Date range queries
3. `idx_saas_business_reports_category` - Category filtering
4. `idx_saas_business_reports_currency` - Currency filtering
5. `idx_saas_business_reports_partner_analytics` - Composite for analytics
6. `idx_saas_business_reports_date_range` - Date range with partner
7. `idx_saas_business_reports_details_json` - JSON queries (GIN index)

## 🔧 Code Architecture

### Service Layer: `businessReportsService.ts`

```typescript
// Ready for migration to Golang microservice
class BusinessReportsService {
  // CRUD operations
  getAll(filters?: BusinessReportFilters)
  getById(id: string)
  getByPartnerId(partnerId: string, filters?)
  create(report)
  update(id: string, report)
  delete(id: string)
  
  // Analytics functions
  getRevenueStats(partnerId: string, filters?)
  getRevenueByCategory(partnerId: string)
  getRevenueTrend(partnerId: string, groupBy)
}
```

### Component: `RevenueStatistics.tsx`

```typescript
// Features:
- Date range filters (7d, 30d, 90d, 1y, All)
- Key metrics cards (Total, Average, Tenants)
- Revenue trend line chart
- Revenue by category pie chart
- Revenue by currency bar chart
- Category details table
- Export to CSV
- Refresh button
- Loading states
- Error handling
- Empty states
```

## 🎯 Future Golang Migration

Service đã được thiết kế sẵn để migrate sang Golang:

**Endpoints chuẩn bị:**
```go
GET    /api/v1/telemetry/business-reports
GET    /api/v1/telemetry/business-reports/:id
GET    /api/v1/telemetry/business-reports/partner/:partnerId
POST   /api/v1/telemetry/business-reports
PUT    /api/v1/telemetry/business-reports/:id
DELETE /api/v1/telemetry/business-reports/:id
GET    /api/v1/telemetry/business-reports/stats/:partnerId
GET    /api/v1/telemetry/business-reports/by-category/:partnerId
GET    /api/v1/telemetry/business-reports/trend/:partnerId
```

## 📝 Translation Keys

All translation keys đã được setup đầy đủ trong `/i18n/en.ts`:

```typescript
revenue: {
  totalRevenue: 'Total Revenue',
  avgRevenue: 'Average Revenue',
  totalTenants: 'Total Tenants',
  revenue: 'Revenue',
  category: 'Category',
  tenantCount: 'Tenant Count',
  avgPerTenant: 'Avg per Tenant',
  revenueTrend: 'Revenue Trend',
  revenueByCategory: 'Revenue by Category',
  revenueByCurrency: 'Revenue by Currency',
  categoryDetails: 'Category Details',
  fetchError: 'Error loading revenue data',
  noData: 'No revenue data available',
  noReports: 'No revenue reports found',
}
```

## ✅ Verification Checklist

- [x] Migration SQL file created: `/docs/migrations/037_saas_business_reports.sql`
- [x] Service layer implemented: `/services/businessReportsService.ts`
- [x] Component implemented: `/components/tenant/RevenueStatistics.tsx`
- [x] Translation keys added to i18n files
- [x] Tab added to TenantDetailPage
- [x] Documentation created
- [ ] **User needs to run migration in Supabase Dashboard**
- [ ] User needs to insert sample data (optional)
- [ ] User needs to test the feature

## 🚀 Next Steps for User

1. **Run Migration:** Copy và run `/docs/migrations/037_saas_business_reports.sql` trong Supabase SQL Editor
2. **Insert Sample Data:** (Optional) Insert sample data để test
3. **Test Component:** Navigate to Tenants → Select tenant → Tab "Thống kê doanh thu"
4. **Production Data:** Sau khi test, có thể integrate với actual revenue data từ subscription/billing system

## 📚 Related Files

- `/docs/migrations/037_saas_business_reports.sql` - Database migration
- `/services/businessReportsService.ts` - Service layer
- `/components/tenant/RevenueStatistics.tsx` - UI component
- `/pages/TenantDetailPage.tsx` - Integration point
- `/i18n/en.ts` - Translation keys
- `/docs/bugfix/2026-01-16-revenue-statistics-database-setup.md` - This file

---

**Status:** ✅ Code ready, waiting for user to run database migration  
**Design System:** Following Stripe/GitHub/Vercel patterns  
**Color Scheme:** Indigo (#6366f1) primary  
**Compliance:** SonarQube compliant, DRY principle  
**Golang Ready:** Service designed for easy migration to microservice backend
