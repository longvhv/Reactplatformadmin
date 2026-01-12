# Tables Classification - VHV Platform

## Phân loại bảng theo Multi-Tenancy

---

## 🌍 GLOBAL TABLES (Shared Data)

Dữ liệu **chung** cho toàn hệ thống, **KHÔNG** phân theo tenant.

### Đặc điểm:
- ❌ **KHÔNG có** `tenant_id`
- ✅ Dữ liệu dùng chung (read-only hoặc admin-only modify)
- ✅ Tất cả tenant đều truy cập cùng data
- ✅ Vẫn có: `_id`, audit trail, soft delete, versioning

### Danh sách bảng GLOBAL:

| Table | Description | Primary Use |
|-------|-------------|-------------|
| **`regions`** | Quốc gia, tỉnh, huyện, xã | Địa chỉ, shipping |
| `currencies` | Danh sách tiền tệ | Pricing, payments |
| `timezones` | Múi giờ thế giới | Scheduling |
| `languages` | Ngôn ngữ hỗ trợ | i18n, localization |
| `countries` | Danh sách quốc gia | Registration |
| `industries` | Ngành nghề | Tenant profile |

### Template:
```sql
CREATE TABLE {global_table} (
  -- Identity (NO tenant_id)
  _id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  code        VARCHAR(100) UNIQUE NOT NULL,
  name        VARCHAR(255) NOT NULL,
  
  -- Audit
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  created_by  UUID NULL,
  updated_by  UUID NULL,
  
  -- Soft delete
  deleted_at  TIMESTAMPTZ NULL,
  deleted_by  UUID NULL,
  
  -- Versioning
  version     INT DEFAULT 1
);

-- Indexes (NO tenant_id)
CREATE INDEX idx_{table}_deleted_at ON {table}(deleted_at);
CREATE INDEX idx_{table}_code ON {table}(code);
```

### Query Example:
```sql
-- Tất cả tenant đều query như nhau
SELECT * FROM regions 
WHERE type = 'PROVINCE' 
  AND deleted_at IS NULL;
```

---

## 🏢 TENANT-SPECIFIC TABLES (Private Data)

Dữ liệu **riêng** của từng tenant, **CÔ LẬP** hoàn toàn.

### Đặc điểm:
- ✅ **BẮT BUỘC có** `tenant_id UUID NOT NULL`
- ✅ Mỗi tenant chỉ thấy data của mình
- ✅ UNIQUE constraints phải include `tenant_id`
- ✅ Phải có index trên `tenant_id`

### Danh sách bảng TENANT-SPECIFIC:

| Table | Description | tenant_id Required |
|-------|-------------|-------------------|
| **`tenants`** | Danh sách công ty/tổ chức | ➖ (is source) |
| **`system_categories`** | Danh mục hệ thống (có thể custom) | ✅ Yes |
| **`app_components`** | Cấu hình UI components | ✅ Yes |
| `users` | Người dùng | ✅ Yes |
| `roles` | Vai trò | ✅ Yes |
| `permissions` | Quyền hạn | ✅ Yes |
| `products` | Sản phẩm | ✅ Yes |
| `orders` | Đơn hàng | ✅ Yes |
| `invoices` | Hóa đơn | ✅ Yes |
| `customers` | Khách hàng | ✅ Yes |
| `transactions` | Giao dịch | ✅ Yes |

### Template:
```sql
CREATE TABLE {tenant_table} (
  -- Identity & Tenancy
  _id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL,  -- Required!
  
  code        VARCHAR(100) NOT NULL,
  name        VARCHAR(255) NOT NULL,
  
  -- Audit
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  created_by  UUID NULL,
  updated_by  UUID NULL,
  
  -- Soft delete
  deleted_at  TIMESTAMPTZ NULL,
  deleted_by  UUID NULL,
  
  -- Versioning
  version     INT DEFAULT 1,
  
  -- Constraints with tenant_id
  UNIQUE(tenant_id, code)
);

-- Mandatory indexes
CREATE INDEX idx_{table}_tenant_id ON {table}(tenant_id);
CREATE INDEX idx_{table}_deleted_at ON {table}(deleted_at);
CREATE INDEX idx_{table}_tenant_deleted ON {table}(tenant_id, deleted_at);
```

### Query Example:
```sql
-- Mỗi tenant chỉ thấy data của mình
SELECT * FROM products 
WHERE tenant_id = '{current_tenant_id}'
  AND deleted_at IS NULL;
```

---

## 🔍 Decision Tree: GLOBAL hay TENANT-SPECIFIC?

```
┌─────────────────────────────────────┐
│ Dữ liệu này có thuộc về tenant nào │
│ cụ thể không?                       │
└────────────┬────────────────────────┘
             │
        ┌────┴────┐
        │   NO    │
        └────┬────┘
             ▼
    ┌─────────────────┐
    │ GLOBAL TABLE    │
    │ (No tenant_id)  │
    └─────────────────┘
    Examples:
    - regions
    - currencies
    - timezones
    
        ┌────┴────┐
        │  YES    │
        └────┬────┘
             ▼
    ┌─────────────────┐
    │ TENANT TABLE    │
    │ (Has tenant_id) │
    └─────────────────┘
    Examples:
    - users
    - products
    - orders
```

---

## 📊 Current Database Status

| # | Table | Type | tenant_id | Status |
|---|-------|------|-----------|--------|
| 1 | `tenants` | Source | ➖ | ✅ |
| 2 | `system_categories` | Tenant | ✅ | ✅ |
| 3 | `regions` | **Global** | **❌** | ✅ **Fixed** |
| 4 | `app_components` | Tenant | ✅ | ✅ |

---

## ⚠️ Common Mistakes

### ❌ Sai: Thêm tenant_id vào GLOBAL table
```sql
-- regions là dữ liệu chung, KHÔNG cần tenant_id
CREATE TABLE regions (
  _id         UUID PRIMARY KEY,
  tenant_id   UUID NOT NULL,  -- ❌ WRONG!
  code        VARCHAR(50),
  name        VARCHAR(255)
);
```

### ✅ Đúng: GLOBAL table không có tenant_id
```sql
-- regions dùng chung cho tất cả tenant
CREATE TABLE regions (
  _id         UUID PRIMARY KEY,
  -- NO tenant_id ✅
  code        VARCHAR(50) UNIQUE,
  name        VARCHAR(255)
);
```

---

### ❌ Sai: Quên tenant_id trong TENANT table
```sql
-- users phải có tenant_id
CREATE TABLE users (
  _id       UUID PRIMARY KEY,
  email     VARCHAR(255),
  -- Missing tenant_id ❌ WRONG!
);
```

### ✅ Đúng: TENANT table phải có tenant_id
```sql
-- Mỗi tenant có users riêng
CREATE TABLE users (
  _id       UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,  -- ✅ Required
  email     VARCHAR(255),
  
  UNIQUE(tenant_id, email)  -- ✅ Include tenant_id
);
```

---

## 🔐 Row Level Security (RLS)

### GLOBAL tables: Không cần RLS
```sql
-- Tất cả tenant đều đọc được
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;

CREATE POLICY public_read ON regions
  FOR SELECT
  USING (true);  -- Everyone can read

CREATE POLICY admin_write ON regions
  FOR ALL
  USING (current_setting('app.role') = 'admin');  -- Only admin can modify
```

### TENANT tables: BẮT BUỘC RLS
```sql
-- Chỉ thấy data của tenant mình
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON users
  USING (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE POLICY service_role_all ON users
  USING (current_setting('app.role') = 'service_role');
```

---

## 📝 System Tenant

Một số bảng có thể cần **system tenant** cho shared categories:

```sql
-- System tenant UUID (fixed)
'00000000-0000-0000-0000-000000000000'
```

### Example: `system_categories`
- **Has `tenant_id`** (vì có thể mỗi tenant tùy chỉnh)
- **System data** dùng system tenant ID
- **Custom data** dùng tenant ID riêng

```sql
-- System shared categories
INSERT INTO system_categories (tenant_id, code, name, ...) 
VALUES ('00000000-0000-0000-0000-000000000000', 'GRP_META', ...);

-- Tenant custom categories
INSERT INTO system_categories (tenant_id, code, name, ...)
VALUES ('{real_tenant_id}', 'CUSTOM_CAT', ...);
```

---

## 🚀 Best Practices

### 1. Default to TENANT-SPECIFIC
Nếu không chắc → **Thêm `tenant_id`**. Dễ remove sau hơn là thêm vào sau.

### 2. GLOBAL tables cần cẩn thận
- Chỉ dùng cho data **thực sự** dùng chung
- Cân nhắc quyền write (thường là admin-only)
- Cache-friendly (ít thay đổi)

### 3. Indexes
```sql
-- GLOBAL table
CREATE INDEX idx_{table}_code ON {table}(code);
CREATE INDEX idx_{table}_deleted_at ON {table}(deleted_at);

-- TENANT table
CREATE INDEX idx_{table}_tenant_id ON {table}(tenant_id);  -- Mandatory!
CREATE INDEX idx_{table}_deleted_at ON {table}(deleted_at);
CREATE INDEX idx_{table}_tenant_deleted ON {table}(tenant_id, deleted_at);  -- Composite
```

### 4. UNIQUE constraints
```sql
-- GLOBAL: code là unique toàn cục
code VARCHAR(100) UNIQUE NOT NULL

-- TENANT: code unique trong tenant
UNIQUE(tenant_id, code)
```

---

## 📚 Related Documents

- **`/DATABASE_SCHEMA_STANDARD.md`** - Full standard with both types
- **`/QUICK_REFERENCE.md`** - Quick checklist
- **Migrations**:
  - `003_restructure_system_categories.sql` - TENANT table
  - `004_create_regions_table.sql` - **GLOBAL table** ✅
  - `005_create_app_components_table.sql` - TENANT table
  - `006_create_tenants_table.sql` - Source table

---

**Version**: 1.0.0  
**Last Updated**: 2026-01-09  
**Status**: ✅ Regions fixed (removed tenant_id)
