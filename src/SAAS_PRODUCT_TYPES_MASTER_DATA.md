# SaaS Product Types - Master Data ✅

## Tổng quan

Bảng `saas_product_types` là **Master Data** để quản lý phân loại sản phẩm SaaS thương mại của nền tảng. Thay vì tạo menu/trang quản trị riêng, sử dụng **system_categories** để khai báo loại danh mục `SAAS_PRODUCT_TYPE`.

## Database Schema: `saas_product_types`

### Cấu trúc bảng (YSQL Compliant)

| Field | Type | Null? | Default | Constraints | Mô tả |
|-------|------|-------|---------|-------------|-------|
| `_id` | UUID | NO | - | PRIMARY KEY | Định danh duy nhất UUID v7, hỗ trợ sắp xếp theo thời gian |
| `code` | VARCHAR(50) | NO | - | UNIQUE, CHECK (code ~ '^[A-Z0-9_]+$') | Mã định danh kỹ thuật (VD: APP, DOMAIN, SSL). Chỉ chữ HOA, số, gạch dưới |
| `name` | TEXT | NO | - | CHECK (LENGTH(name) > 0) | Tên hiển thị (VD: "Phần mềm ứng dụng", "Tên miền") |
| `description` | TEXT | YES | NULL | - | Mô tả chi tiết về cách hệ thống xử lý loại sản phẩm |
| `is_active` | BOOLEAN | NO | TRUE | - | Cho phép sử dụng loại sản phẩm này để tạo sản phẩm mới |
| `created_at` | TIMESTAMPTZ | NO | NOW() | - | Thời điểm tạo (UTC) |
| `updated_at` | TIMESTAMPTZ | NO | NOW() | CHECK (updated_at >= created_at) | Thời điểm cập nhật cuối (UTC) |
| `version` | BIGINT | NO | 1 | CHECK (version >= 1) | Optimistic Locking |

### Indexes

```sql
-- Tìm kiếm nhanh theo code (validate dữ liệu)
CREATE UNIQUE INDEX idx_product_types_code_lookup 
ON saas_product_types (code) WHERE is_active = TRUE;

-- Danh sách product types đang hoạt động (Admin UI)
CREATE INDEX idx_product_types_active 
ON saas_product_types (is_active, created_at DESC);

-- Audit trail
CREATE INDEX idx_product_types_created_at 
ON saas_product_types (created_at DESC);
```

### Trigger

Auto-update `updated_at` trước mỗi UPDATE:

```sql
CREATE TRIGGER trigger_saas_product_types_updated_at
    BEFORE UPDATE ON saas_product_types
    FOR EACH ROW
    EXECUTE FUNCTION update_saas_product_types_updated_at();
```

## Demo Data (15 Product Types)

Migration seed 15 loại sản phẩm SaaS phổ biến:

| Code | Name | Description | Billing Model |
|------|------|-------------|---------------|
| `APP` | Phần mềm ứng dụng | HRM, CRM, ERP | user/tháng (subscription) |
| `DOMAIN` | Tên miền | .com, .vn, .net | năm |
| `SSL` | Chứng chỉ SSL/TLS | Wildcard, EV, DV | năm hoặc subscription |
| `STORAGE` | Lưu trữ đám mây | Files, backup, CDN | GB/tháng hoặc gói cố định |
| `EMAIL` | Email doanh nghiệp | @company.com | mailbox/tháng |
| `HOSTING` | Web Hosting / VPS | Shared, VPS, Dedicated | tháng/năm |
| `API_SERVICE` | Dịch vụ API | SMS, Payment, Maps | request/quota |
| `DATABASE` | Database as a Service | PostgreSQL, MySQL, MongoDB | RAM/Storage/tháng |
| `CDN` | CDN & Băng thông | Content Delivery Network | GB transfer |
| `BACKUP` | Backup & Recovery | Auto backup, disaster recovery | dung lượng |
| `SECURITY` | Security & Firewall | WAF, DDoS, Security scan | subscription |
| `MONITORING` | Monitoring & Analytics | Server monitoring, logs, uptime | servers/tháng |
| `AI_ML` | AI/ML Services | ChatGPT, Vision API | token/request |
| `COLLABORATION` | Collaboration Tools | Video, chat, project mgmt | user/tháng |
| `ADDON` | Add-ons & Extensions | Tính năng mở rộng | riêng hoặc bundled |

## System Categories Integration

### Khai báo Category Type

Migration tự động insert vào `system_categories`:

```sql
INSERT INTO system_categories (
    code: 'SAAS_PRODUCT_TYPE',
    name: 'SaaS Product Type',
    type: 'master_data',
    category_group: 'product_catalog',
    description: 'Danh mục phân loại sản phẩm SaaS thương mại',
    is_system: TRUE,
    is_editable: FALSE,
    metadata: {
        "table_name": "saas_product_types",
        "key_field": "code",
        "display_field": "name",
        "icon": "package",
        "color": "#6366f1",
        "features": ["hierarchical", "versioned", "master_data"]
    }
)
```

### Metadata Explained

- `table_name`: Bảng lưu data thực tế
- `key_field`: Trường dùng làm khóa (code)
- `display_field`: Trường hiển thị (name)
- `icon`: Icon cho UI (lucide-react)
- `color`: Màu brand (#6366f1 - indigo)
- `features`: Đặc tính bảng (hierarchical, versioned, master_data)

## API Endpoints

Base URL: `https://{projectId}.supabase.co/functions/v1/make-server-7eedb4e0/api/core`

### 1. GET /saas-product-types
Lấy danh sách product types

**Query Params:**
- `is_active` (boolean): Filter theo trạng thái
- `search` (string): Tìm trong code hoặc name
- `limit` (number, default: 100): Số record
- `offset` (number, default: 0): Offset phân trang

**Response:**
```json
{
  "data": [
    {
      "_id": "uuid",
      "code": "APP",
      "name": "Phần mềm ứng dụng",
      "description": "Các ứng dụng SaaS...",
      "is_active": true,
      "created_at": "2026-01-12T...",
      "updated_at": "2026-01-12T...",
      "version": 1
    }
  ],
  "count": 15,
  "limit": 100,
  "offset": 0
}
```

### 2. GET /saas-product-types/:id
Lấy chi tiết product type theo ID

**Response:** Single product type object hoặc 404

### 3. GET /saas-product-types/by-code/:code
Lấy product type theo code (VD: `/saas-product-types/by-code/APP`)

**Response:** Single product type object hoặc 404

### 4. POST /saas-product-types
Tạo product type mới

**Body:**
```json
{
  "code": "NEW_TYPE",
  "name": "New Product Type",
  "description": "Optional description",
  "is_active": true
}
```

**Validation:**
- `code` phải match regex `^[A-Z0-9_]+$`
- `name` không được rỗng
- Code phải unique

**Response:** 201 Created với object mới

### 5. PUT /saas-product-types/:id
Cập nhật product type

**Body:** Partial update (không thể đổi `code`)

**Response:** 200 OK với object đã update

### 6. DELETE /saas-product-types/:id
Deactivate product type (soft delete)

**Logic:** Set `is_active = false` thay vì hard delete để giữ data integrity

**Response:** 200 OK

### 7. PATCH /saas-product-types/:id/activate
Kích hoạt lại product type

**Response:** 200 OK với object đã activate

## Code Organization

### Backend Files

1. **Migration**: `/supabase/migrations/013_create_saas_product_types_table.sql`
   - Tạo bảng
   - Indexes
   - Trigger
   - Seed 15 records
   - Insert vào system_categories

2. **API Logic**: `/supabase/functions/server/saas-product-types-api.tsx`
   - 7 CRUD functions
   - Validation
   - Error handling

3. **Routes**: `/supabase/functions/server/saas-product-types-routes.tsx`
   - Hono routes
   - Mount vào server

4. **Server**: `/supabase/functions/server/index.tsx`
   - Import và mount routes

### No Frontend UI

Không tạo menu/trang quản trị vì:
- Là Master Data (ít thay đổi)
- Quản lý qua system_categories
- Có thể query trực tiếp từ API khi cần

## Use Cases

### 1. Validate Product Type khi tạo sản phẩm

```typescript
// Check if product type exists and is active
const response = await fetch(
  `${apiUrl}/saas-product-types/by-code/APP`,
  { headers: { 'Authorization': `Bearer ${token}` } }
);

if (response.ok) {
  const productType = await response.json();
  if (productType.is_active) {
    // Allow creating product
  }
}
```

### 2. Populate dropdown trong Product Form

```typescript
const { data } = await fetch(
  `${apiUrl}/saas-product-types?is_active=true`
).then(r => r.json());

// Render select options
data.map(pt => <option value={pt.code}>{pt.name}</option>)
```

### 3. Foreign Key Reference trong saas_products

Khi tạo bảng `saas_products`:

```sql
CREATE TABLE saas_products (
    _id UUID PRIMARY KEY,
    product_type VARCHAR(50) NOT NULL,
    -- ... other fields
    
    CONSTRAINT fk_product_type 
    FOREIGN KEY (product_type) 
    REFERENCES saas_product_types(code)
    ON DELETE RESTRICT  -- Không cho xóa type đang được dùng
);
```

## Migration Instructions

### 1. Run Migration

```bash
# Execute SQL file
psql -U postgres -d your_database \
  < /supabase/migrations/013_create_saas_product_types_table.sql
```

### 2. Verify Data

```sql
-- Check product types
SELECT code, name, is_active 
FROM saas_product_types 
ORDER BY created_at;

-- Check system_categories integration
SELECT code, name, type, metadata 
FROM system_categories 
WHERE code = 'SAAS_PRODUCT_TYPE';
```

### 3. Test API

```bash
# List all product types
curl -X GET \
  "https://{projectId}.supabase.co/functions/v1/make-server-7eedb4e0/api/core/saas-product-types?is_active=true" \
  -H "Authorization: Bearer {publicAnonKey}"

# Get by code
curl -X GET \
  "https://{projectId}.supabase.co/functions/v1/make-server-7eedb4e0/api/core/saas-product-types/by-code/APP" \
  -H "Authorization: Bearer {publicAnonKey}"
```

## Design Decisions

### 1. Code as Business Key
- Sử dụng `code` (VARCHAR) thay vì `_id` (UUID) cho foreign key
- Dễ debug, readable trong database
- `code` UNIQUE + indexed

### 2. No Soft Delete
- Không có `deleted_at` như các bảng khác
- Dùng `is_active` để deactivate
- Master Data nên giữ nguyên để preserve referential integrity

### 3. Optimistic Locking
- Field `version` để tránh concurrent update conflicts
- Application layer phải increment version khi update

### 4. System Categories Integration
- Khai báo `SAAS_PRODUCT_TYPE` trong `system_categories`
- Metadata chứa mapping thông tin (table_name, key_field, etc.)
- Không cần tạo UI riêng, dùng generic category manager

### 5. Minimal Fields
- Chỉ 8 fields cốt lõi
- Không có tenant_id (GLOBAL table)
- Không có created_by/updated_by (master data)
- Tập trung vào code, name, description, is_active

## Future Enhancements

### 1. Hierarchical Product Types
Nếu cần phân cấp (VD: APP > APP_HRM > APP_HRM_RECRUIT):

```sql
ALTER TABLE saas_product_types 
ADD COLUMN parent_code VARCHAR(50) REFERENCES saas_product_types(code);

ALTER TABLE saas_product_types 
ADD COLUMN path TEXT; -- Materialized Path: /APP/APP_HRM/
```

### 2. Pricing Templates
Link product type với template giá:

```sql
ALTER TABLE saas_product_types 
ADD COLUMN pricing_model VARCHAR(50); -- SUBSCRIPTION, ONE_TIME, PAY_AS_YOU_GO
```

### 3. Localization
Đa ngôn ngữ cho name/description:

```sql
ALTER TABLE saas_product_types 
ADD COLUMN names JSONB; -- {"en": "Software", "vi": "Phần mềm"}
```

## Status: HOÀN THÀNH ✅

### Deliverables:
- ✅ Bảng `saas_product_types` với full YSQL compliance
- ✅ 15 demo records (APP, DOMAIN, SSL, STORAGE, EMAIL, etc.)
- ✅ 3 indexes (code_lookup, active, created_at)
- ✅ Trigger auto-update `updated_at`
- ✅ Insert vào `system_categories` (code: SAAS_PRODUCT_TYPE)
- ✅ 7 API endpoints CRUD đầy đủ
- ✅ Validation & error handling
- ✅ Documentation đầy đủ

### Ready to use:
1. Run migration `013_create_saas_product_types_table.sql`
2. API endpoints ready: `/api/core/saas-product-types/*`
3. System category `SAAS_PRODUCT_TYPE` available
4. Có thể reference trong `saas_products` table

### Không có UI:
- Không tạo menu/trang quản trị (theo yêu cầu)
- Quản lý qua system_categories
- CRUD qua API nếu cần
