# Tính năng Quản lý App Capabilities

## Tổng quan

Hệ thống quản lý tính năng (Features) và giới hạn (Limits) cho từng Application, được tích hợp vào trang chi tiết Application dưới dạng tab.

## Database Schema

### Bảng: `app_capabilities`

**Migration:** `/golang-backend/migrations/015_create_app_capabilities_table.sql`

**Cấu trúc chính:**
- `_id` (UUID) - Primary key
- `tenant_id` (UUID) - Tenant isolation
- `app_id` (UUID) - FK to applications
- `code` (VARCHAR) - Unique capability code
- `name`, `description` - Capability info
- `type` (VARCHAR) - 'FEATURE' | 'LIMIT'
- `default_value` (JSONB):
  - FEATURE: `{"enabled": true/false}`
  - LIMIT: `{"value": number, "unit": "users/GB/..."}`
- `display_order` (INTEGER)
- `is_required` (BOOLEAN)
- `validation_rules` (JSONB)
- `status` (VARCHAR) - 'active' | 'inactive' | 'archived'
- Audit trail, soft delete, optimistic locking

**Demo Data:** 
- HRM Suite: 8 features (attendance, payroll, recruitment...) + 5 limits
- CRM Suite: 6 features + 4 limits
- Project Management: 6 features + 4 limits

## API Layer

**File:** `/api/appCapabilityApi.ts`

**Key Functions:**
- `getAll(filters)` - Lấy tất cả với filters
- `getByAppId(app_id, tenant_id)` - Capabilities của 1 app
- `getFeatures(app_id)` - Chỉ features
- `getLimits(app_id)` - Chỉ limits
- `getById(id)` - Chi tiết 1 capability
- `getByCode(code, app_id, tenant_id)` - Theo code
- `create(capability)` - Tạo mới
- `update(id, updates, version)` - Cập nhật với optimistic locking
- `softDelete(id)` - Xóa mềm
- `changeStatus(id, status, version)` - Đổi trạng thái
- `codeExists(code, app_id, tenant_id)` - Check duplicate
- `getStatistics(app_id, tenant_id)` - Thống kê
- `cloneFromApp(sourceAppId, targetAppId)` - Clone capabilities

## Components

### 1. CapabilityForm
**File:** `/components/capabilities/CapabilityForm.tsx`

**Features:**
- 2 modes: Create/Edit
- Type selection: FEATURE | LIMIT
- **FEATURE mode**: Toggle switch (enabled/disabled)
- **LIMIT mode**: Number input + Unit selector
- Common units: users, employees, GB, requests/day, etc.
- Status, display order, required flag
- Validation: code format, required fields
- < 500 dòng

### 2. CapabilityTable
**File:** `/components/capabilities/CapabilityTable.tsx`

**Display:**
- Columns: Capability, Type, Default Value, Status, Actions
- Type badge: Blue (FEATURE) | Purple (LIMIT)
- Default value icons: ✓ Bật / ✗ Tắt (feature) | Number + Unit (limit)
- Actions: Edit, Delete
- < 200 dòng

## Page

### CapabilitiesManagementPage
**File:** `/pages/CapabilitiesManagementPage.tsx`

**Location:** Tab trong ApplicationDetailPage (`/core/applications/:id/capabilities`)

**Features:**
- **Statistics cards**: Total, Features, Limits, Active, Inactive
- **Search**: By name, code, description
- **Filter**: All / Features / Limits
- **CRUD**: Create, Edit, Delete capabilities
- **Toggle view**: Show form inline (không redirect)

**UI Flow:**
1. Default: Show statistics + filters + table
2. Click "Thêm Capability" → Show form inline
3. Click Edit → Show form với data loaded
4. Submit → Reload table, hide form

## Integration

### ApplicationDetailPage
**File:** `/pages/ApplicationDetailPage.tsx`

**Thêm tab mới:**
- Menu item: "Capabilities" với icon `Boxes`
- Route: `/core/applications/:id/capabilities`
- Component: `<CapabilitiesManagementPage />`

**Menu order:**
1. Tổng quan
2. Permissions
3. Tenants
4. **Capabilities** ← NEW
5. Cài đặt
6. Logs

## Cách sử dụng

### 1. Chạy migration
```bash
psql -d your_db -f golang-backend/migrations/015_create_app_capabilities_table.sql
```

### 2. Truy cập trang
- Vào `/core/applications`
- Click vào 1 Application
- Chọn tab "Capabilities"

### 3. Thêm Capability

**Thêm Feature:**
1. Click "Thêm Capability"
2. Chọn Type: "Tính năng"
3. Nhập code: `advanced-reports` (lowercase + dash)
4. Nhập name: "Báo cáo nâng cao"
5. Toggle "Bật mặc định": ON/OFF
6. Submit

**Thêm Limit:**
1. Click "Thêm Capability"
2. Chọn Type: "Giới hạn"
3. Nhập code: `max-projects`
4. Nhập name: "Số projects tối đa"
5. Nhập giá trị: `50`
6. Chọn unit: `projects`
7. Submit

### 4. Filter & Search
- **Filter by type**: Dropdown "Tất cả loại" / "Tính năng" / "Giới hạn"
- **Search**: Tìm theo name/code/description

## Data Structure Examples

### Feature Capability
```json
{
  "code": "attendance-management",
  "name": "Quản lý chấm công",
  "type": "FEATURE",
  "default_value": {
    "enabled": true
  }
}
```

### Limit Capability
```json
{
  "code": "max-employees",
  "name": "Số lượng nhân viên tối đa",
  "type": "LIMIT",
  "default_value": {
    "value": 100,
    "unit": "employees"
  }
}
```

## Code Quality

✅ Mỗi file < 500 dòng
✅ DRY principle - reusable components
✅ Type-safe TypeScript
✅ Optimistic locking (version field)
✅ Soft delete với audit trail
✅ Tuân thủ chuẩn SonarQube

## Files Created

**Migration:**
- `/golang-backend/migrations/015_create_app_capabilities_table.sql`

**API:**
- `/api/appCapabilityApi.ts`

**Components:**
- `/components/capabilities/CapabilityForm.tsx`
- `/components/capabilities/CapabilityTable.tsx`

**Pages:**
- `/pages/CapabilitiesManagementPage.tsx`

**Updated:**
- `/pages/ApplicationDetailPage.tsx` (thêm tab Capabilities)

## Best Practices

### Code Format
- Capability code: `max-employees` (lowercase + dash)
- FEATURE: Boolean enabled/disabled
- LIMIT: Number >= 0 với unit

### Common Units
```
Users: users, employees, contacts, members
Storage: GB, MB, TB
Limits: projects, tasks, deals, departments
Rate: requests/day, requests/hour, emails/month
```

---

**Version:** 1.0.0
**Date:** 2026-01-12
**Status:** ✅ Production Ready
