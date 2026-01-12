# Quick Reference: Database Standards

## ✅ Checklist khi tạo bảng mới

```sql
CREATE TABLE {table_name} (
  -- ============================================
  -- 1. IDENTITY & TENANCY (Required)
  -- ============================================
  _id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL,
  
  -- ============================================
  -- 2. BUSINESS FIELDS (Your specific columns)
  -- ============================================
  code        VARCHAR(100) NOT NULL,
  name        VARCHAR(255) NOT NULL,
  status      SMALLINT DEFAULT 1,
  
  -- ============================================
  -- 3. AUDIT TRAIL (Required)
  -- ============================================
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  created_by  UUID NULL,
  updated_by  UUID NULL,
  
  -- ============================================
  -- 4. SOFT DELETE (Required)
  -- ============================================
  deleted_at  TIMESTAMPTZ NULL,
  deleted_by  UUID NULL,
  
  -- ============================================
  -- 5. OPTIMISTIC LOCKING (Required)
  -- ============================================
  version     INT DEFAULT 1,
  
  -- ============================================
  -- CONSTRAINTS
  -- ============================================
  UNIQUE(tenant_id, code)  -- Always include tenant_id in UNIQUE
);

-- ============================================
-- MANDATORY INDEXES
-- ============================================
CREATE INDEX idx_{table}_tenant_id ON {table}(tenant_id);
CREATE INDEX idx_{table}_deleted_at ON {table}(deleted_at);
CREATE INDEX idx_{table}_tenant_deleted ON {table}(tenant_id, deleted_at);

-- ============================================
-- TRIGGER FOR updated_at
-- ============================================
CREATE TRIGGER trigger_{table}_updated_at
BEFORE UPDATE ON {table}
FOR EACH ROW
EXECUTE FUNCTION update_{table}_updated_at();
```

---

## 📋 Naming Rules

### 1. Tables
- **Format**: `plural_snake_case`
- ✅ `users`, `system_categories`, `app_components`
- ❌ `User`, `systemCategory`, `AppComponent`

### 2. Primary Key
- **Format**: `_id`
- **Type**: `UUID`
- Always use `_id UUID PRIMARY KEY DEFAULT gen_random_uuid()`

### 3. Foreign Keys
- **Format**: `{entity_singular}_id`
- ✅ `user_id`, `parent_id`, `tenant_id`, `category_id`
- ❌ `userId`, `parentID`, `tenant`

### 4. Timestamps
- **`_at`**: Exact timestamp (TIMESTAMPTZ)
  - `created_at`, `updated_at`, `deleted_at`, `logged_in_at`
- **`_date`**: Date only (DATE)
  - `birth_date`, `start_date`, `subscription_end_date`
- **`_duration`**: Time span (INT)
  - `processing_duration_ms`, `session_duration_sec`

### 5. Booleans
- **Format**: `is_`, `has_`, `can_` + description
- ✅ `is_active`, `is_system`, `has_children`, `can_edit`
- ❌ `active`, `system`, `editable`

### 6. Junction Tables
- **Format**: `table_a_table_b`
- ✅ `users_roles`, `posts_tags`, `categories_products`
- ❌ `UserRole`, `PostTag`

---

## 🔑 Standard Fields (Required in ALL tables)

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `_id` | UUID | gen_random_uuid() | Primary key |
| `tenant_id` | UUID | (required) | Multi-tenant isolation |
| `created_at` | TIMESTAMPTZ | NOW() | Record creation time |
| `updated_at` | TIMESTAMPTZ | NOW() | Last update time (auto) |
| `created_by` | UUID | NULL | User who created |
| `updated_by` | UUID | NULL | User who last updated |
| `deleted_at` | TIMESTAMPTZ | NULL | Soft delete timestamp |
| `deleted_by` | UUID | NULL | User who deleted |
| `version` | INT | 1 | Optimistic locking |

---

## 🔍 Common Query Patterns

### Active records (tenant + not deleted)
```sql
SELECT * FROM users
WHERE tenant_id = '{tenant_id}'
  AND deleted_at IS NULL
ORDER BY created_at DESC;
```

### Soft delete
```sql
UPDATE users
SET 
  deleted_at = NOW(),
  deleted_by = '{user_id}',
  version = version + 1
WHERE _id = '{id}'
  AND tenant_id = '{tenant_id}'
  AND version = {current_version}
  AND deleted_at IS NULL;
```

### Optimistic locking update
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
  AND version = {expected_version}  -- Check!
  AND deleted_at IS NULL;

-- If affected_rows = 0: Conflict!
-- If affected_rows = 1: Success!
```

### Hierarchical query
```sql
WITH RECURSIVE tree AS (
  SELECT _id, name, parent_id, 1 as level
  FROM categories
  WHERE tenant_id = '{tenant_id}'
    AND parent_id IS NULL
    AND deleted_at IS NULL
  
  UNION ALL
  
  SELECT c._id, c.name, c.parent_id, t.level + 1
  FROM categories c
  JOIN tree t ON c.parent_id = t._id
  WHERE c.deleted_at IS NULL
)
SELECT * FROM tree ORDER BY level, name;
```

---

## 🛠️ Mandatory Indexes

```sql
-- Every table MUST have these 3 indexes:
CREATE INDEX idx_{table}_tenant_id ON {table}(tenant_id);
CREATE INDEX idx_{table}_deleted_at ON {table}(deleted_at);
CREATE INDEX idx_{table}_tenant_deleted ON {table}(tenant_id, deleted_at);

-- Plus business-specific indexes:
CREATE INDEX idx_{table}_code ON {table}(code);
CREATE INDEX idx_{table}_status ON {table}(status);
CREATE INDEX idx_{table}_foreign_key_id ON {table}(foreign_key_id);
```

---

## ⚡ Triggers

### Auto-update `updated_at`
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

---

## 🎯 Foreign Key Patterns

### Self-reference (hierarchy)
```sql
parent_id UUID REFERENCES {table}(_id) ON DELETE SET NULL
```

### Regular FK
```sql
user_id UUID NOT NULL REFERENCES users(_id) ON DELETE CASCADE
category_id UUID REFERENCES categories(_id) ON DELETE RESTRICT
```

### Junction table
```sql
CREATE TABLE users_roles (
  _id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL,
  user_id     UUID NOT NULL REFERENCES users(_id) ON DELETE CASCADE,
  role_id     UUID NOT NULL REFERENCES roles(_id) ON DELETE CASCADE,
  
  -- Prevent duplicates
  UNIQUE(tenant_id, user_id, role_id),
  
  -- Standard fields...
);
```

---

## ✅ Validation Checklist

- [ ] Table name: plural, snake_case
- [ ] Primary key: `_id UUID`
- [ ] Tenant isolation: `tenant_id UUID NOT NULL`
- [ ] Audit: `created_at`, `updated_at`, `created_by`, `updated_by`
- [ ] Soft delete: `deleted_at`, `deleted_by`
- [ ] Versioning: `version INT DEFAULT 1`
- [ ] Booleans: Start with `is_`, `has_`, `can_`
- [ ] Timestamps: Suffix `_at` or `_date`
- [ ] Foreign keys: `{entity}_id` format
- [ ] Unique constraints: Include `tenant_id`
- [ ] Indexes: tenant_id, deleted_at, business keys
- [ ] Trigger: updated_at auto-update
- [ ] Comments: Table and key columns

---

## 🚫 Common Mistakes

| ❌ Wrong | ✅ Correct | Reason |
|---------|-----------|--------|
| `id` | `_id` | Standard primary key name |
| `User` | `users` | Tables are plural, snake_case |
| `createdAt` | `created_at` | Use snake_case, not camelCase |
| `active` | `is_active` | Booleans need `is_`/`has_`/`can_` |
| `UNIQUE(code)` | `UNIQUE(tenant_id, code)` | Include tenant_id |
| No `tenant_id` | Include `tenant_id` | Required for multi-tenancy |
| No `version` | Include `version` | Required for locking |
| `ON DELETE CASCADE` everywhere | Choose appropriate action | Use SET NULL or RESTRICT when needed |

---

## 📊 Example: Complete Table

```sql
CREATE TABLE products (
  -- Identity
  _id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL,
  
  -- Business
  sku               VARCHAR(50) NOT NULL,
  name              VARCHAR(255) NOT NULL,
  description       TEXT,
  price             DECIMAL(10,2) NOT NULL,
  stock_quantity    INT DEFAULT 0,
  
  -- Relationships
  category_id       UUID NULL REFERENCES categories(_id) ON DELETE SET NULL,
  
  -- Flags
  is_active         BOOLEAN DEFAULT true,
  is_featured       BOOLEAN DEFAULT false,
  has_variants      BOOLEAN DEFAULT false,
  
  -- Metadata
  metadata          JSONB DEFAULT '{}'::jsonb,
  
  -- Audit
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  created_by        UUID NULL,
  updated_by        UUID NULL,
  
  -- Soft delete
  deleted_at        TIMESTAMPTZ NULL,
  deleted_by        UUID NULL,
  
  -- Versioning
  version           INT DEFAULT 1,
  
  -- Constraints
  UNIQUE(tenant_id, sku),
  CHECK (price >= 0),
  CHECK (stock_quantity >= 0)
);

-- Mandatory indexes
CREATE INDEX idx_products_tenant_id ON products(tenant_id);
CREATE INDEX idx_products_deleted_at ON products(deleted_at);
CREATE INDEX idx_products_tenant_deleted ON products(tenant_id, deleted_at);

-- Business indexes
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_is_active ON products(is_active);

-- Trigger
CREATE TRIGGER trigger_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_products_updated_at();
```

---

**Version**: 3.0.0  
**Last Updated**: 2026-01-09  
**Full Documentation**: `/DATABASE_SCHEMA_STANDARD.md`
