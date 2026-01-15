# SaaS Products - Database Schema Documentation

## 📋 Tổng quan

Bảng `saas_products` lưu trữ thông tin về các sản phẩm SaaS (phần mềm dịch vụ) trong hệ thống. Đây là bảng Master Data cốt lõi để định nghĩa các dòng sản phẩm thương mại, phân biệt hoàn toàn với hàng hóa kinh doanh của khách hàng (như POS, CRM).

**Tên bảng:** `saas_products`  
**Database:** YugabyteDB/PostgreSQL  
**Schema:** `public`  
**Table Type:** GLOBAL (Multi-tenant)

---

## 🗂️ Cấu trúc bảng

### Chi tiết các cột

| Tên trường (Field) | Kiểu dữ liệu | Null? | Mặc định (Default) | Ràng buộc (Constraints) & Logic Kiểm tra | Mô tả |
|-------------------|--------------|-------|-------------------|------------------------------------------|-------|
| **_id** | UUID | NO | | `PRIMARY KEY` | Định danh duy nhất chuẩn **UUID v7**, hỗ trợ sắp xếp theo thời gian và tối ưu sharding |
| **tenant_id** | UUID | NO | | `NOT NULL`, Index | ID của tenant sở hữu sản phẩm này. Hỗ trợ multi-tenancy |
| **code** | VARCHAR(50) | NO | | `UNIQUE`, `CHECK (code ~ '^[a-z0-9-]+$')` | Mã dòng sản phẩm (Slug). VD: `hrm-suite`, `crm-platform`. Chỉ chữ thường, số và gạch ngang |
| **name** | TEXT | NO | | `CHECK (length(name) > 0)` | Tên sản phẩm hiển thị |
| **description** | TEXT | YES | NULL | | Mô tả chi tiết sản phẩm. Dùng TEXT để không giới hạn độ dài |
| **product_type_code** | VARCHAR(50) | YES | NULL | | Mã loại sản phẩm (tham chiếu đến system_categories với group='GRP_PRODUCT_TYPE') |
| **base_price** | NUMERIC(19,4) | NO | 0 | `CHECK (base_price >= 0)` | Giá niêm yết cơ bản. Sử dụng **NUMERIC** để đảm bảo chính xác tuyệt đối trong tài chính |
| **currency** | VARCHAR(3) | NO | 'VND' | `CHECK (length(currency) = 3)` | Mã tiền tệ theo chuẩn ISO 4217 (VND, USD,...) |
| **billing_cycle** | VARCHAR(20) | NO | 'MONTHLY' | `CHECK (billing_cycle IN ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'LIFETIME'))` | Chu kỳ thanh toán |
| **trial_days** | INTEGER | NO | 0 | `CHECK (trial_days >= 0)` | Số ngày dùng thử miễn phí |
| **features** | JSONB | NO | '{}' | | Danh sách tính năng của sản phẩm (dạng key-value JSON) |
| **limits** | JSONB | NO | '{}' | | Giới hạn sử dụng (số user, storage, API calls,...) |
| **status** | VARCHAR(20) | NO | 'active' | `CHECK (status IN ('active', 'inactive', 'archived'))` | Trạng thái kinh doanh sản phẩm |
| **is_featured** | BOOLEAN | NO | FALSE | | Đánh dấu sản phẩm nổi bật (hiển thị ưu tiên) |
| **display_order** | INTEGER | NO | 0 | | Thứ tự hiển thị (số nhỏ hơn hiển thị trước) |
| **metadata** | JSONB | NO | '{}' | | Chứa các thông tin động, thuộc tính riêng biệt tùy theo loại sản phẩm |
| **created_at** | TIMESTAMPTZ | NO | NOW() | | Thời điểm tạo bản ghi (chuẩn UTC) |
| **updated_at** | TIMESTAMPTZ | NO | NOW() | | Thời điểm cập nhật cuối cùng |
| **created_by** | UUID | YES | NULL | | ID người tạo |
| **updated_by** | UUID | YES | NULL | | ID người cập nhật cuối |
| **deleted_at** | TIMESTAMPTZ | YES | NULL | | Hỗ trợ **Soft Delete** để bảo toàn dữ liệu lịch sử |
| **deleted_by** | UUID | YES | NULL | | ID người xóa (soft delete) |
| **version** | BIGINT | NO | 1 | `CHECK (version >= 1)` | Sử dụng cho **Optimistic Locking**, ngăn chặn ghi đè dữ liệu đồng thời |

---

## 📊 Sơ đồ ERD (Entity Relationship Diagram)

```
┌─────────────────────────────────────────────────────────────────────┐
│                          saas_products                              │
├─────────────────────────────────────────────────────────────────────┤
│ PK  _id                    UUID                                     │
│     tenant_id              UUID                     (FK → tenants)  │
│ UK  code                   VARCHAR(50)                              │
│     name                   TEXT                                     │
│     description            TEXT                                     │
│     product_type_code      VARCHAR(50)              (FK → system_categories) │
│     base_price             NUMERIC(19,4)                            │
│     currency               VARCHAR(3)                               │
│     billing_cycle          VARCHAR(20)                              │
│     trial_days             INTEGER                                  │
│     features               JSONB                                    │
│     limits                 JSONB                                    │
│     status                 VARCHAR(20)                              │
│     is_featured            BOOLEAN                                  │
│     display_order          INTEGER                                  │
│     metadata               JSONB                                    │
│     created_at             TIMESTAMPTZ                              │
│     updated_at             TIMESTAMPTZ                              │
│     created_by             UUID                                     │
│     updated_by             UUID                                     │
│     deleted_at             TIMESTAMPTZ                              │
│     deleted_by             UUID                                     │
│     version                BIGINT                                   │
└─────────────────────────────────────────────────────────────────────┘
                          │
                          │ 1
                          │
                          │ N
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       service_packages                              │
├─────────────────────────────────────────────────────────────────────┤
│ PK  _id                    UUID                                     │
│ FK  saas_product_id        UUID                 (→ saas_products)   │
│     code                   VARCHAR(50)                              │
│     name                   VARCHAR(255)                             │
│     price_amount           NUMERIC(19,4)                            │
│     currency_code          VARCHAR(3)                               │
│     entitlements_config    JSONB                                    │
│     status                 VARCHAR(20)                              │
│     ...                                                             │
└─────────────────────────────────────────────────────────────────────┘
```

### Quan hệ với các bảng khác

1. **saas_products → tenants** (N:1)
   - Mỗi sản phẩm thuộc về một tenant
   - Foreign Key: `tenant_id` → `tenants._id`

2. **saas_products → system_categories** (N:1)
   - Loại sản phẩm được định nghĩa trong system_categories
   - Soft Foreign Key: `product_type_code` → `system_categories.code` (WHERE group_category_id = 'GRP_PRODUCT_TYPE')

3. **saas_products → service_packages** (1:N)
   - Một sản phẩm có thể có nhiều gói dịch vụ (packages)
   - Foreign Key: `service_packages.saas_product_id` → `saas_products._id`

4. **saas_products → subscription_orders** (1:N)
   - Sản phẩm được đặt trong các đơn hàng
   - Foreign Key: `subscription_orders.product_id` → `saas_products._id`

---

## 🔐 Indexes và Performance

### Indexes được tạo

```sql
-- 1. Primary Key Index (tự động)
-- Index trên _id (UUID v7) hỗ trợ truy vấn nhanh và sharding

-- 2. Unique Index trên code (với soft delete filter)
CREATE UNIQUE INDEX idx_saas_products_code 
ON saas_products (code, tenant_id) 
WHERE deleted_at IS NULL;

-- 3. Index hỗ trợ lọc theo tenant và status
CREATE INDEX idx_saas_products_tenant_status 
ON saas_products (tenant_id, status) 
WHERE deleted_at IS NULL;

-- 4. Index hỗ trợ lọc sản phẩm active theo loại
CREATE INDEX idx_saas_products_active_type 
ON saas_products (product_type_code, status) 
WHERE deleted_at IS NULL AND status = 'active';

-- 5. Index hỗ trợ sắp xếp theo display_order
CREATE INDEX idx_saas_products_display_order 
ON saas_products (display_order, created_at) 
WHERE deleted_at IS NULL;

-- 6. Index GIN để truy vấn sâu vào metadata
CREATE INDEX idx_saas_products_metadata 
ON saas_products USING GIN (metadata);

-- 7. Index GIN để truy vấn features
CREATE INDEX idx_saas_products_features 
ON saas_products USING GIN (features);

-- 8. Index GIN để truy vấn limits
CREATE INDEX idx_saas_products_limits 
ON saas_products USING GIN (limits);

-- 9. Index cho featured products
CREATE INDEX idx_saas_products_featured 
ON saas_products (is_featured, display_order) 
WHERE deleted_at IS NULL AND is_featured = TRUE;
```

### Chiến lược tối ưu

1. **UUID v7**: Sử dụng UUID v7 thay vì UUID v4 để tối ưu B-tree index và giảm fragmentation
2. **Soft Delete Filter**: Tất cả index đều có `WHERE deleted_at IS NULL` để tránh scan records đã xóa
3. **GIN Index**: Sử dụng GIN index cho JSONB fields (metadata, features, limits) để truy vấn nhanh
4. **Composite Index**: Index kết hợp (tenant_id, status) để tối ưu query phổ biến nhất
5. **Partial Index**: Index `is_featured` chỉ cho records featured = TRUE (tiết kiệm space)

---

## 🎯 Ví dụ dữ liệu

### Example 1: Basic SaaS Product

```json
{
  "_id": "01934f7c-8a2e-7890-b123-456789abcdef",
  "tenant_id": "01934f7c-1234-5678-9abc-def012345678",
  "code": "hrm-pro",
  "name": "HRM Professional",
  "description": "Giải pháp quản lý nhân sự toàn diện cho doanh nghiệp vừa và nhỏ",
  "product_type_code": "PRODUCT_TYPE_APP",
  "base_price": 2990000.00,
  "currency": "VND",
  "billing_cycle": "MONTHLY",
  "trial_days": 14,
  "features": {
    "employee_management": true,
    "attendance_tracking": true,
    "payroll": true,
    "leave_management": true,
    "performance_review": false
  },
  "limits": {
    "max_employees": 50,
    "max_storage_gb": 10,
    "api_calls_per_month": 10000
  },
  "status": "active",
  "is_featured": true,
  "display_order": 1,
  "metadata": {
    "badge": "Popular",
    "color": "#6366f1",
    "icon_url": "https://cdn.example.com/icons/hrm.png"
  },
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z",
  "version": 1
}
```

### Example 2: Domain Product

```json
{
  "_id": "01934f7c-8a2e-7890-b123-456789abcdff",
  "tenant_id": "01934f7c-1234-5678-9abc-def012345678",
  "code": "domain-vn",
  "name": "Domain .VN",
  "description": "Tên miền quốc gia Việt Nam (.vn, .com.vn, .net.vn)",
  "product_type_code": "PRODUCT_TYPE_DOMAIN",
  "base_price": 300000.00,
  "currency": "VND",
  "billing_cycle": "YEARLY",
  "trial_days": 0,
  "features": {
    "dns_management": true,
    "auto_renewal": true,
    "privacy_protection": false
  },
  "limits": {
    "max_dns_records": 100
  },
  "status": "active",
  "is_featured": false,
  "display_order": 10,
  "metadata": {
    "tld": ".vn",
    "registry": "VNNIC"
  },
  "created_at": "2024-01-15T11:00:00Z",
  "updated_at": "2024-01-15T11:00:00Z",
  "version": 1
}
```

---

## 🔄 Quy trình Optimistic Locking

### Cách hoạt động

1. **Read**: Client đọc record và nhận được `version` hiện tại (ví dụ: version = 5)
2. **Update**: Client gửi update request kèm theo `version = 5`
3. **Check**: Server kiểm tra `WHERE _id = ? AND version = 5`
4. **Update**: Nếu match, update và tăng version lên 6
5. **Conflict**: Nếu không match (version đã thay đổi), trả về lỗi 409 Conflict

### SQL Example

```sql
-- Update with optimistic locking
UPDATE saas_products 
SET 
  name = 'New Name',
  base_price = 3990000,
  version = version + 1,
  updated_at = NOW()
WHERE 
  _id = '01934f7c-8a2e-7890-b123-456789abcdef' 
  AND version = 5
  AND deleted_at IS NULL
RETURNING *;

-- Nếu không update được row nào → Version conflict!
```

---

## 📝 Business Rules

### Status Transitions

```
┌──────────┐
│  active  │ ←──────────┐
└────┬─────┘            │
     │                  │
     │ can_deactivate   │ can_activate
     ▼                  │
┌──────────┐           │
│ inactive │ ──────────┘
└────┬─────┘
     │
     │ can_archive
     ▼
┌──────────┐
│ archived │ (read-only, không thể activate lại)
└──────────┘
```

### Validation Rules

1. **Code Format**: Chỉ chứa lowercase, số, và dấu gạch ngang (regex: `^[a-z0-9-]+$`)
2. **Code Uniqueness**: Unique trong scope của tenant (tenant_id + code)
3. **Price**: Không được âm (`base_price >= 0`)
4. **Currency**: Phải là 3 ký tự (ISO 4217)
5. **Billing Cycle**: Phải thuộc enum ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'LIFETIME']
6. **Trial Days**: Không được âm (`trial_days >= 0`)
7. **Status**: Phải thuộc ['active', 'inactive', 'archived']

---

## 🚀 Query Patterns phổ biến

### 1. Lấy tất cả products active của tenant

```sql
SELECT * FROM saas_products
WHERE tenant_id = :tenant_id
  AND status = 'active'
  AND deleted_at IS NULL
ORDER BY display_order ASC, created_at DESC;
```

### 2. Lấy featured products

```sql
SELECT * FROM saas_products
WHERE tenant_id = :tenant_id
  AND status = 'active'
  AND is_featured = TRUE
  AND deleted_at IS NULL
ORDER BY display_order ASC
LIMIT 10;
```

### 3. Search products by name/code

```sql
SELECT * FROM saas_products
WHERE tenant_id = :tenant_id
  AND (
    name ILIKE '%:search%' 
    OR description ILIKE '%:search%'
    OR code ILIKE '%:search%'
  )
  AND deleted_at IS NULL
ORDER BY display_order ASC;
```

### 4. Lọc theo product type

```sql
SELECT * FROM saas_products
WHERE tenant_id = :tenant_id
  AND product_type_code = :product_type
  AND status = 'active'
  AND deleted_at IS NULL
ORDER BY display_order ASC;
```

### 5. Query features với JSONB

```sql
-- Tìm products có feature payroll
SELECT * FROM saas_products
WHERE features @> '{"payroll": true}'
  AND deleted_at IS NULL;

-- Tìm products có max_employees >= 100
SELECT * FROM saas_products
WHERE (limits->>'max_employees')::int >= 100
  AND deleted_at IS NULL;
```

---

## 🔒 Security Considerations

1. **Row-Level Security (RLS)**: Nên enable RLS để đảm bảo tenant chỉ thấy products của mình
2. **Soft Delete**: Không hard delete để giữ audit trail và reference integrity
3. **Version Control**: Luôn check version khi update để tránh race condition
4. **Input Validation**: Validate tất cả input trước khi insert/update
5. **Price Precision**: Dùng NUMERIC thay vì FLOAT để tránh rounding errors

---

## 📚 References

- [Database Design Documentation](./Database.md)
- [System Categories Schema](./SYSTEM_CATEGORIES_SCHEMA.md)
- [Products API Documentation](./PRODUCTS_API.md)
- [Products Use Cases](./PRODUCTS_USECASES.md)

---

**Version:** 1.0.0  
**Last Updated:** 2025-01-13  
**Maintainer:** VHV Platform Team
