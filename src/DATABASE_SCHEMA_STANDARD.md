# Database Schema Standards - VHV Platform

## Chuẩn thiết kế Database - Tuân thủ 100%

---

## A. QUY TẮC ĐẶT TÊN (NAMING CONVENTIONS)

### 1. Tên Bảng / Collection
**Quy tắc**: Danh từ **SỐ NHIỀU** (Plural), `snake_case`

✅ **Đúng**: `users`, `system_categories`, `app_components`, `regions`, `tenants`  
❌ **Sai**: `User`, `systemCategory`, `AppComponent`, `region`, `tenant`

### 2. Khóa chính (Primary Key)
**Quy tắc**: Thống nhất tên là `_id` trên toàn bộ hệ thống  
**Kiểu**: Chuỗi UUID (String)

```sql
_id UUID PRIMARY KEY DEFAULT gen_random_uuid()
```

### 3. Khóa ngoại (Foreign Key)
**Quy tắc**: `tên_thực_thể_số_ít` + `_id`

✅ **Đúng**: 
- `parent_id` (tham chiếu đến parent)
- `tenant_id` (tham chiếu đến tenant)
- `user_id` (tham chiếu đến user)
- `category_id` (tham chiếu đến category)
- `region_id` (tham chiếu đến region)

❌ **Sai**: `parentID`, `parent`, `tenant`, `userId`

### 4. Trường Thời gian (Date/Time)
Phân biệt rõ hậu tố (Suffix) để biết độ chính xác:

#### `_at`: Thời điểm chính xác (Timestamp UTC)
```sql
created_at    TIMESTAMPTZ DEFAULT NOW()
updated_at    TIMESTAMPTZ DEFAULT NOW()
deleted_at    TIMESTAMPTZ NULL
expires_at    TIMESTAMPTZ NULL
logged_in_at  TIMESTAMPTZ NULL
```

#### `_date`: Ngày tháng theo lịch (Date only)
```sql
birth_date             DATE
billing_start_date     DATE
subscription_end_date  DATE
```

#### `_duration`: Khoảng thời gian (giây/ms)
```sql
processing_duration_ms  INT
session_duration_sec    INT
```

### 5. Trường Boolean (Bật/Tắt)
**Phải bắt đầu bằng động từ nghi vấn** (Is, Has, Can) để code đọc lên như một câu văn.

**Quy tắc**: 
- `is_` + tính từ
- `has_` + danh từ
- `can_` + động từ

✅ **Đúng**:
```sql
is_active       BOOLEAN DEFAULT true   -- "User is active"
is_system       BOOLEAN DEFAULT false  -- "Category is system"
is_editable     BOOLEAN DEFAULT true   -- "Record is editable"
is_visible      BOOLEAN DEFAULT true   -- "Component is visible"
is_deleted      BOOLEAN DEFAULT false  -- "Item is deleted"

has_children    BOOLEAN DEFAULT false  -- "Node has children"
has_permission  BOOLEAN DEFAULT false  -- "User has permission"
has_avatar      BOOLEAN DEFAULT false  -- "Profile has avatar"

can_edit        BOOLEAN DEFAULT false  -- "User can edit"
can_delete      BOOLEAN DEFAULT false  -- "User can delete"
can_publish     BOOLEAN DEFAULT false  -- "User can publish"
```

❌ **Sai**: `active`, `system`, `editable`, `visible`, `deleted`

### 6. Bảng trung gian (Junction Table - Many-to-Many)
**Quy tắc**: `bảng_a` + `_` + `bảng_b` (Sắp xếp theo chiều nào chính)

✅ **Đúng**:
- `users_roles` (User có nhiều Role)
- `posts_tags` (Post có nhiều Tag)
- `categories_products` (Category có nhiều Product)

❌ **Sai**: `UserRole`, `PostTag`, `user_role_mapping`

---

## B. CÁC TRƯỜNG TIÊU CHUẨN (STANDARD MIXINS)

**QUAN TRỌNG**: Phân biệt 2 loại bảng:

### 🌍 GLOBAL TABLES (Shared Data - NO tenant_id)
Bảng chứa dữ liệu **chung** cho toàn hệ thống, **KHÔNG** thuộc về tenant nào cụ thể.

**Examples**: 
- `regions` (Quốc gia, tỉnh thành - dùng chung)
- `currencies` (Danh sách tiền tệ)
- `timezones` (Múi giờ)
- `languages` (Ngôn ngữ)

**Template**:
```sql
CREATE TABLE {global_table} (
  -- Identity (NO tenant_id)
  _id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Business fields
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

-- Indexes (NO tenant_id index)
CREATE INDEX idx_{table}_deleted_at ON {table}(deleted_at);
CREATE INDEX idx_{table}_code ON {table}(code);
```

---

### 🏢 TENANT-SPECIFIC TABLES (Private Data - REQUIRE tenant_id)
Bảng chứa dữ liệu **riêng** của từng tenant, cần **cô lập** dữ liệu.

**Examples**:
- `users` (Người dùng của mỗi công ty)
- `orders` (Đơn hàng)
- `products` (Sản phẩm)
- `invoices` (Hóa đơn)
- `system_categories` (Có thể mỗi tenant tùy chỉnh riêng)

**BẮT BUỘC**: Mọi bảng tenant-specific đều phải có đầy đủ các trường sau.

### Template đầy đủ:

```sql
CREATE TABLE {table_name} (
  -- ============================================
  -- 1. IDENTITY & TENANCY
  -- ============================================
  _id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL,  -- Multi-tenancy
  
  -- ============================================
  -- 2. BUSINESS FIELDS
  -- ============================================
  -- Your specific columns here...
  code        VARCHAR(100) UNIQUE NOT NULL,
  name        VARCHAR(255) NOT NULL,
  status      SMALLINT DEFAULT 1,
  
  -- ============================================
  -- 3. AUDIT TRAIL
  -- ============================================
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  created_by  UUID NULL,
  updated_by  UUID NULL,
  
  -- ============================================
  -- 4. SOFT DELETE
  -- ============================================
  deleted_at  TIMESTAMPTZ NULL,
  deleted_by  UUID NULL,
  
  -- ============================================
  -- 5. OPTIMISTIC LOCKING
  -- ============================================
  version     INT DEFAULT 1
);

-- Mandatory indexes
CREATE INDEX idx_{table}_tenant_id ON {table}(tenant_id);
CREATE INDEX idx_{table}_deleted_at ON {table}(deleted_at);
```

### 1. Nhóm định danh & Tenancy (Identity)

```sql
_id         UUID PRIMARY KEY,  -- Định danh bản ghi
tenant_id   UUID NOT NULL      -- Định danh khách hàng (Sharding/Filtering)
```

**Lưu ý**: `tenant_id` phải được index ở hầu hết các bảng để đảm bảo performance khi query "Dữ liệu của công ty A".

```sql
CREATE INDEX idx_{table}_tenant_id ON {table}(tenant_id);
```

### 2. Nhóm Audit (Truy vết)

```sql
created_at  TIMESTAMPTZ DEFAULT NOW(),
updated_at  TIMESTAMPTZ DEFAULT NOW(),
created_by  UUID NULL,  -- User ID người tạo
updated_by  UUID NULL   -- User ID người sửa cuối cùng
```

**Auto-update trigger** cho `updated_at`:

```sql
CREATE OR REPLACE FUNCTION update_{table}_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_{table}_updated_at
BEFORE UPDATE ON {table}
FOR EACH ROW
EXECUTE FUNCTION update_{table}_updated_at();
```

### 3. Nhóm Soft Delete (Xóa mềm)

**Không dùng `DELETE FROM table`**. Dùng "Xóa mềm" để có thể khôi phục khi User lỡ tay.

```sql
deleted_at  TIMESTAMPTZ NULL, -- NULL: Chưa xóa. Có giá trị: Đã xóa lúc...
deleted_by  UUID NULL         -- Ai xóa?
```

**Logic Query**: Luôn phải kèm điều kiện `WHERE deleted_at IS NULL` trong các câu SELECT mặc định.

```sql
-- Lấy active records
SELECT * FROM users 
WHERE tenant_id = 'xxx' AND deleted_at IS NULL;

-- Soft delete
UPDATE users 
SET deleted_at = NOW(), deleted_by = '{user_id}', version = version + 1
WHERE _id = 'xxx' AND version = {current_version};

-- Restore
UPDATE users 
SET deleted_at = NULL, deleted_by = NULL, version = version + 1
WHERE _id = 'xxx';
```

**Index cho soft delete**:
```sql
CREATE INDEX idx_{table}_deleted_at ON {table}(deleted_at);
```

### 4. Nhóm Versioning (Cho Optimistic Locking)

Để tránh việc 2 người cùng sửa 1 dòng dữ liệu và ghi đè nhau.

```sql
version     INT DEFAULT 1
```

**Logic Update**:
```sql
UPDATE {table} 
SET 
  name = 'new_value',
  updated_at = NOW(),
  updated_by = '{user_id}',
  version = version + 1
WHERE _id = 'xxx' 
  AND version = {old_version}  -- Optimistic lock check
  AND deleted_at IS NULL;

-- Check affected rows:
-- If 0 rows affected: Conflict! Someone else updated it.
-- If 1 row affected: Success!
```

---

## C. FOREIGN KEY PATTERNS

### Self-reference (Hierarchical)

```sql
CREATE TABLE categories (
  _id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL,
  
  parent_id   UUID NULL REFERENCES categories(_id) ON DELETE SET NULL,
  -- hoặc
  parent_id   UUID NULL REFERENCES categories(_id) ON DELETE CASCADE,
  
  -- ... standard fields
);
```

### Regular foreign key

```sql
CREATE TABLE orders (
  _id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL,
  
  user_id     UUID NOT NULL REFERENCES users(_id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES products(_id) ON DELETE RESTRICT,
  
  -- ... standard fields
);
```

### Junction table (Many-to-Many)

```sql
CREATE TABLE users_roles (
  _id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL,
  
  user_id     UUID NOT NULL REFERENCES users(_id) ON DELETE CASCADE,
  role_id     UUID NOT NULL REFERENCES roles(_id) ON DELETE CASCADE,
  
  -- Prevent duplicates
  UNIQUE(tenant_id, user_id, role_id),
  
  -- ... standard fields
);

CREATE INDEX idx_users_roles_user_id ON users_roles(user_id);
CREATE INDEX idx_users_roles_role_id ON users_roles(role_id);
```

---

## D. INDEX STRATEGY

### Mandatory indexes (Mọi bảng)

```sql
-- Primary key (auto-indexed)
-- _id: Already indexed as PRIMARY KEY

-- Multi-tenancy
CREATE INDEX idx_{table}_tenant_id ON {table}(tenant_id);

-- Soft delete queries
CREATE INDEX idx_{table}_deleted_at ON {table}(deleted_at);

-- Common composite
CREATE INDEX idx_{table}_tenant_deleted ON {table}(tenant_id, deleted_at);
```

### Business logic indexes

```sql
-- Unique business key
CREATE INDEX idx_{table}_code ON {table}(code);
CREATE INDEX idx_{table}_slug ON {table}(slug);

-- Status filtering
CREATE INDEX idx_{table}_status ON {table}(status);

-- Foreign keys
CREATE INDEX idx_{table}_user_id ON {table}(user_id);
CREATE INDEX idx_{table}_category_id ON {table}(category_id);

-- Date range queries
CREATE INDEX idx_{table}_created_at ON {table}(created_at);
```

### JSONB indexes

```sql
-- GIN index for JSONB columns
CREATE INDEX idx_{table}_metadata ON {table} USING gin(metadata);
CREATE INDEX idx_{table}_settings ON {table} USING gin(settings);
```

---

## E. MIGRATION FILE STRUCTURE

```sql
-- ============================================
-- Migration: {Table Name}
-- Description: {Purpose}
-- Author: VHV Platform
-- Date: YYYY-MM-DD
-- ============================================

-- ============================================
-- CREATE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS {table_name} (
  -- Identity & Tenancy
  _id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL,
  
  -- Business fields
  code        VARCHAR(100) NOT NULL,
  name        VARCHAR(255) NOT NULL,
  status      SMALLINT DEFAULT 1,
  
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
  
  -- Constraints
  UNIQUE(tenant_id, code)
);

-- ============================================
-- CREATE INDEXES
-- ============================================
-- Mandatory indexes
CREATE INDEX idx_{table}_tenant_id ON {table}(tenant_id);
CREATE INDEX idx_{table}_deleted_at ON {table}(deleted_at);
CREATE INDEX idx_{table}_tenant_deleted ON {table}(tenant_id, deleted_at);

-- Business indexes
CREATE INDEX idx_{table}_code ON {table}(code);
CREATE INDEX idx_{table}_status ON {table}(status);

-- ============================================
-- CREATE TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION update_{table}_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_{table}_updated_at
BEFORE UPDATE ON {table}
FOR EACH ROW
EXECUTE FUNCTION update_{table}_updated_at();

-- ============================================
-- ADD COMMENTS
-- ============================================
COMMENT ON TABLE {table} IS '{Description}';
COMMENT ON COLUMN {table}._id IS 'Primary key (UUID)';
COMMENT ON COLUMN {table}.tenant_id IS 'Multi-tenant isolation';
COMMENT ON COLUMN {table}.version IS 'Optimistic locking version';

-- ============================================
-- INSERT SAMPLE DATA (Optional)
-- ============================================
-- INSERT INTO {table} (...) VALUES (...);

-- ============================================
-- VERIFY MIGRATION
-- ============================================
SELECT COUNT(*) as total FROM {table};
```

---

## F. COMMON QUERY PATTERNS

### 1. Active records (với tenant isolation)

```sql
SELECT * FROM users
WHERE tenant_id = '{tenant_id}'
  AND deleted_at IS NULL
ORDER BY created_at DESC;
```

### 2. Soft delete

```sql
-- Delete
UPDATE users
SET 
  deleted_at = NOW(),
  deleted_by = '{user_id}',
  version = version + 1
WHERE _id = '{id}'
  AND tenant_id = '{tenant_id}'
  AND version = {current_version}
  AND deleted_at IS NULL;

-- Restore
UPDATE users
SET 
  deleted_at = NULL,
  deleted_by = NULL,
  updated_at = NOW(),
  updated_by = '{user_id}',
  version = version + 1
WHERE _id = '{id}'
  AND tenant_id = '{tenant_id}'
  AND deleted_at IS NOT NULL;
```

### 3. Optimistic locking update

```sql
UPDATE products
SET 
  name = '{new_name}',
  price = {new_price},
  updated_at = NOW(),
  updated_by = '{user_id}',
  version = version + 1
WHERE _id = '{id}'
  AND tenant_id = '{tenant_id}'
  AND version = {expected_version}
  AND deleted_at IS NULL;

-- Check SQL result:
-- affected_rows = 0: Conflict (reload and retry)
-- affected_rows = 1: Success
```

### 4. Hierarchical query (Recursive CTE)

```sql
WITH RECURSIVE tree AS (
  -- Root nodes
  SELECT _id, name, parent_id, 1 as level
  FROM categories
  WHERE tenant_id = '{tenant_id}'
    AND parent_id IS NULL
    AND deleted_at IS NULL
  
  UNION ALL
  
  -- Children
  SELECT c._id, c.name, c.parent_id, t.level + 1
  FROM categories c
  JOIN tree t ON c.parent_id = t._id
  WHERE c.tenant_id = '{tenant_id}'
    AND c.deleted_at IS NULL
)
SELECT * FROM tree ORDER BY level, name;
```

### 5. Multi-tenant aggregate

```sql
SELECT 
  tenant_id,
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE deleted_at IS NULL) as active_users,
  COUNT(*) FILTER (WHERE deleted_at IS NOT NULL) as deleted_users
FROM users
GROUP BY tenant_id;
```

---

## G. ROW LEVEL SECURITY (RLS)

### Enable RLS cho tenant isolation

```sql
ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their tenant's data
CREATE POLICY tenant_isolation ON {table}
  USING (tenant_id = current_setting('app.current_tenant')::UUID);

-- Policy: Service role can see all
CREATE POLICY service_role_all ON {table}
  USING (current_setting('app.role') = 'service_role');
```

### Set tenant context

```sql
-- At connection start
SET app.current_tenant = '{tenant_id}';
SET app.current_user = '{user_id}';

-- Then queries automatically filter by tenant
SELECT * FROM users;  -- Only returns current tenant's users
```

---

## H. VALIDATION RULES

### ✅ Checklist khi tạo bảng mới

- [ ] Tên bảng: plural, snake_case
- [ ] Primary key: `_id UUID`
- [ ] Tenant isolation: `tenant_id UUID NOT NULL`
- [ ] Audit fields: `created_at`, `updated_at`, `created_by`, `updated_by`
- [ ] Soft delete: `deleted_at`, `deleted_by`
- [ ] Versioning: `version INT DEFAULT 1`
- [ ] Boolean fields: Bắt đầu bằng `is_`, `has_`, `can_`
- [ ] Timestamp fields: Suffix `_at` hoặc `_date`
- [ ] Foreign keys: `{entity}_id` format
- [ ] Index: `tenant_id`, `deleted_at`, business keys
- [ ] Trigger: `updated_at` auto-update
- [ ] Comments: Table và key columns
- [ ] Constraints: UNIQUE phải bao gồm `tenant_id`

---

## I. EXAMPLES

### Example 1: Simple table

```sql
CREATE TABLE products (
  -- Identity
  _id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL,
  
  -- Business
  sku         VARCHAR(50) NOT NULL,
  name        VARCHAR(255) NOT NULL,
  price       DECIMAL(10,2) NOT NULL,
  stock       INT DEFAULT 0,
  is_active   BOOLEAN DEFAULT true,
  
  -- Category relationship
  category_id UUID NULL REFERENCES categories(_id) ON DELETE SET NULL,
  
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
  
  -- Constraints
  UNIQUE(tenant_id, sku),
  CHECK (price >= 0),
  CHECK (stock >= 0)
);

CREATE INDEX idx_products_tenant_id ON products(tenant_id);
CREATE INDEX idx_products_deleted_at ON products(deleted_at);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_sku ON products(sku);
```

### Example 2: Junction table

```sql
CREATE TABLE users_roles (
  -- Identity
  _id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL,
  
  -- Relationships
  user_id     UUID NOT NULL REFERENCES users(_id) ON DELETE CASCADE,
  role_id     UUID NOT NULL REFERENCES roles(_id) ON DELETE CASCADE,
  
  -- Additional data
  granted_at  TIMESTAMPTZ DEFAULT NOW(),
  granted_by  UUID NULL,
  expires_at  TIMESTAMPTZ NULL,
  
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
  
  -- Prevent duplicates
  UNIQUE(tenant_id, user_id, role_id)
);

CREATE INDEX idx_users_roles_tenant_id ON users_roles(tenant_id);
CREATE INDEX idx_users_roles_user_id ON users_roles(user_id);
CREATE INDEX idx_users_roles_role_id ON users_roles(role_id);
CREATE INDEX idx_users_roles_deleted_at ON users_roles(deleted_at);
```

---

**Version**: 3.0.0 - Full Compliance  
**Last Updated**: 2026-01-09  
**Breaking Changes**: Added `tenant_id`, `deleted_by`, `version` to all tables