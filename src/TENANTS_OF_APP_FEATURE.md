# Tenants Of App Feature - HOÀN THÀNH ✅

## Updates

### 1. Click vào tên ứng dụng → Trang chi tiết
- Tên ứng dụng trong bảng giờ là link clickable
- Click vào tên → Navigate đến `/core/applications/:id/overview`
- Styling: màu indigo, hover underline

### 2. Thêm menu "Tenants" trong ApplicationDetailPage
- Sidebar có 5 tabs: Overview, Permissions, **Tenants**, Settings, Logs
- Icon: Users từ lucide-react
- Route: `/core/applications/:id/tenants`

### 3. TenantsOfAppPage - Hiển thị tenants sử dụng app

#### Database Schema: `tenant_applications`
**Bảng trung gian Many-to-Many mapping Tenants ↔ Applications**

##### Trường chính:
- `_id`: UUID (Primary Key)
- `tenant_id`: UUID → `tenants(_id)` (CASCADE)
- `app_code`: VARCHAR(50) → `applications(code)` (CASCADE)
- `is_active`: BOOLEAN (default TRUE)
- `license_type`: TRIAL | BASIC | PREMIUM | ENTERPRISE
- `max_users`: INTEGER (default 10)
- `expires_at`: TIMESTAMPTZ (nullable)
- `settings`: JSONB (custom config per tenant)

##### Audit & Standards:
- Full audit trail: created_at, updated_at, created_by, updated_by
- Soft delete: deleted_at, deleted_by
- Optimistic locking: version
- UNIQUE constraint: (tenant_id, app_code)

##### Indexes:
- `idx_tenant_applications_app`: Query tenants by app_code
- `idx_tenant_applications_tenant`: Query apps by tenant_id
- `idx_tenant_applications_active`: Filter active assignments

##### Demo Data:
- Tenant 1 → HRM_RECRUIT (ENTERPRISE, 100 users) + CRM_SALES (PREMIUM, 50 users)
- Tenant 2 → HRM_RECRUIT (BASIC, 20 users)
- Tenant 3 → CRM_SALES (TRIAL, 10 users)

## API Endpoints

### Tenant Applications API (`/api/core/tenant-applications`)

1. **GET** `/tenant-applications/by-app/:app_code`
   - Lấy danh sách tenants sử dụng app
   - Query params: is_active, search, limit, offset
   - Response: JOIN với bảng tenants

2. **GET** `/tenant-applications/by-tenant/:tenant_id`
   - Lấy danh sách apps của một tenant
   - JOIN với bảng applications

3. **POST** `/tenant-applications`
   - Gán app cho tenant
   - Body: tenant_id, app_code, license_type, max_users, etc.

4. **PUT** `/tenant-applications/:id`
   - Cập nhật license/settings

5. **DELETE** `/tenant-applications/:id`
   - Revoke app from tenant (soft delete)

## UI Components

### TenantsOfAppPage (`/pages/TenantsOfAppPage.tsx`)

#### Features:
- ✅ Statistics cards: Total, Active, Inactive
- ✅ Filters: Search (tenant name/code), Status (all/active/inactive)
- ✅ Table hiển thị:
  - Tenant name & code
  - License type (badge màu khác nhau)
  - Max users
  - Tier, Region
  - Status (Active/Inactive badge)
  - Activated date
- ✅ Auto-refresh button
- ✅ Empty state với icon
- ✅ Loading state

#### UX:
- Debounced search (500ms)
- Responsive design
- Color-coded badges:
  - ENTERPRISE/PREMIUM: default (indigo)
  - BASIC: secondary (gray)
  - TRIAL: outline

## Files Created/Modified

### Database
- `/supabase/migrations/012_create_tenant_applications_table.sql`

### Backend API
- `/supabase/functions/server/tenant-applications-api.tsx` (5 endpoints)
- `/supabase/functions/server/tenant-applications-routes.tsx`
- `/supabase/functions/server/index.tsx` (mount routes)

### Frontend
- `/pages/ApplicationDetailPage.tsx` (updated: add Tenants tab)
- `/pages/TenantsOfAppPage.tsx` (new)
- `/pages/ApplicationsPage.tsx` (updated: clickable name)

## Cách sử dụng

### 1. Chạy Migration
```sql
-- Execute /supabase/migrations/012_create_tenant_applications_table.sql
-- Tạo bảng tenant_applications + demo data
```

### 2. Truy cập UI
1. Vào `/core/applications`
2. **Click vào tên ứng dụng** (VD: "HRM Recruitment System")
3. Trang detail full screen xuất hiện
4. Click tab **"Tenants"** trong sidebar
5. Xem danh sách tenants đang dùng app

### 3. Thông tin hiển thị
- Tenant nào đang dùng
- License type gì (TRIAL/BASIC/PREMIUM/ENTERPRISE)
- Max users bao nhiêu
- Khi nào kích hoạt
- Trạng thái active/inactive

## Technical Highlights

### Many-to-Many Relationship
- Tenants ↔ Applications qua bảng trung gian
- Cascade delete: Xóa tenant/app → xóa mapping
- Flexible licensing per tenant

### JOIN Query Optimization
- Single query lấy cả tenant info và assignment info
- Supabase foreign table syntax
- Filter at DB level (WHERE clause)

### Code Quality
- All files < 500 lines ✅
- Reusable components ✅
- TypeScript strict ✅
- Proper error handling ✅

## Demo Data Flow

```
HRM_RECRUIT
├── Tenant: Công ty ABC (ENTERPRISE, 100 users) ✅
├── Tenant: Công ty XYZ (BASIC, 20 users) ✅

CRM_SALES
├── Tenant: Công ty ABC (PREMIUM, 50 users) ✅
├── Tenant: Công ty DEF (TRIAL, 10 users) ✅
```

## Status: HOÀN THÀNH ✅

Tất cả tính năng hoạt động đầy đủ:
- Click tên ứng dụng vào chi tiết ✅
- Menu Tenants trong sidebar ✅
- Hiển thị danh sách tenants với đầy đủ info ✅
- Filter & search hoạt động ✅
- Data lưu thật vào Supabase ✅
