# Products - Database Schema Documentation

**Module:** Products (SaaS Products)  
**Version:** 1.0.0  
**Last Updated:** 2026-01-14  
**Schema Source:** `/docs/DatabaseCommand.md` (Lines 1868-1919)

---

## Table of Contents

- [Overview](#overview)
- [Schema Definition](#schema-definition)
- [Field Reference](#field-reference)
- [Indexes](#indexes)
- [Constraints](#constraints)
- [Business Rules](#business-rules)
- [Migration Scripts](#migration-scripts)

---

## Overview

The `saas_products` table lưu trữ danh mục các dòng sản phẩm thương mại của nền tảng SaaS. Bảng này quản lý metadata và thông tin giá cả cho các sản phẩm như APP, DOMAIN, SSL, SERVICE.

### Key Features

- ✅ **Product Types**: Hỗ trợ 4 loại sản phẩm (APP, DOMAIN, SSL, SERVICE)
- ✅ **Pricing**: Strict money rules với `NUMERIC(19, 4)`
- ✅ **Soft Delete**: Hỗ trợ xóa mềm với `deleted_at`
- ✅ **Versioning**: Optimistic locking với `version`
- ✅ **Metadata**: JSONB cho dữ liệu động
- ✅ **Audit Trail**: Đầy đủ `created_at`, `updated_at`, `deleted_at`

---

## Schema Definition

### Table: `saas_products`

```sql
CREATE TABLE saas_products (
    -- I. Định danh (Identity)
    _id UUID PRIMARY KEY,
    
    -- II. Thông tin nghiệp vụ (Business Data)
    code VARCHAR(50) NOT NULL,
    name TEXT NOT NULL,
    product_type VARCHAR(20) NOT NULL DEFAULT 'APP',
    description TEXT,
    
    -- III. Tài chính (Strict Money Rules)
    base_price NUMERIC(19, 4) NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'VND',
    
    -- IV. Trạng thái & Dữ liệu động
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    metadata JSONB NOT NULL DEFAULT '{}',
    
    -- V. Audit & Versioning (Standard Mixins)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    version BIGINT NOT NULL DEFAULT 1,

    -- VI. Các ràng buộc (Constraints)
    CONSTRAINT uq_saas_products_code UNIQUE (code),
    CONSTRAINT chk_saas_products_code_fmt CHECK (code ~ '^[a-z0-9-]+$'),
    CONSTRAINT chk_saas_products_type CHECK (product_type IN ('APP', 'DOMAIN', 'SSL', 'SERVICE')),
    CONSTRAINT chk_saas_products_price CHECK (base_price >= 0),
    CONSTRAINT chk_saas_products_currency_len CHECK (LENGTH(currency) = 3),
    CONSTRAINT chk_saas_products_name_len CHECK (LENGTH(name) > 0)
);
```

---

## Field Reference

### I. Identity Fields

| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| `_id` | UUID | NO | - | Primary key, UUID v7 khuyến nghị |

### II. Business Fields

| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| `code` | VARCHAR(50) | NO | - | Mã sản phẩm duy nhất, format: `^[a-z0-9-]+$` |
| `name` | TEXT | NO | - | Tên sản phẩm hiển thị |
| `product_type` | VARCHAR(20) | NO | 'APP' | Loại sản phẩm (APP/DOMAIN/SSL/SERVICE) |
| `description` | TEXT | YES | NULL | Mô tả chi tiết sản phẩm |

#### Product Type Enum

```typescript
type ProductType = 'APP' | 'DOMAIN' | 'SSL' | 'SERVICE';
```

**Values:**
- `APP` - Ứng dụng SaaS (CRM, ERP, HRM, etc.)
- `DOMAIN` - Tên miền (.com, .vn, .io, etc.)
- `SSL` - Chứng chỉ SSL/TLS
- `SERVICE` - Dịch vụ bổ sung (Support, Consulting, etc.)

### III. Financial Fields

| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| `base_price` | NUMERIC(19, 4) | NO | 0 | Giá cơ bản, độ chính xác 4 chữ số thập phân |
| `currency` | VARCHAR(3) | NO | 'VND' | Mã tiền tệ ISO 4217 (VND, USD, EUR) |

**Pricing Rules:**
- Sử dụng `NUMERIC(19, 4)` thay vì FLOAT để tránh lỗi làm tròn
- Hỗ trợ tới 15 chữ số nguyên + 4 chữ số thập phân
- `base_price >= 0` (không cho phép giá âm)
- Currency phải có đúng 3 ký tự

**Examples:**
```json
{
  "base_price": 999000.0000,
  "currency": "VND"
}
{
  "base_price": 29.9900,
  "currency": "USD"
}
```

### IV. Status & Dynamic Data

| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| `is_active` | BOOLEAN | NO | TRUE | Sản phẩm có đang hoạt động không |
| `metadata` | JSONB | NO | '{}' | Dữ liệu động, custom attributes |

**Metadata Structure (Suggested):**
```json
{
  "icon": "package",
  "color": "#6366f1",
  "features": ["feature1", "feature2"],
  "limits": {
    "max_users": 100,
    "storage_gb": 50
  },
  "display_order": 1,
  "is_featured": false,
  "tags": ["popular", "enterprise"],
  "seo": {
    "title": "Product Title",
    "description": "SEO description",
    "keywords": ["saas", "crm"]
  }
}
```

### V. Audit & Versioning

| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| `created_at` | TIMESTAMPTZ | NO | NOW() | Timestamp tạo bản ghi |
| `updated_at` | TIMESTAMPTZ | NO | NOW() | Timestamp cập nhật gần nhất |
| `deleted_at` | TIMESTAMPTZ | YES | NULL | Timestamp xóa mềm (soft delete) |
| `version` | BIGINT | NO | 1 | Version cho optimistic locking |

**Versioning Strategy:**
- Mỗi lần UPDATE, `version` tăng 1
- Frontend gửi `version` hiện tại khi UPDATE
- Backend kiểm tra version conflict
- Nếu conflict → HTTP 409 Conflict

---

## Indexes

### 1. Primary Key Index (Implicit)

```sql
-- Tự động tạo khi khai báo PRIMARY KEY
ALTER TABLE saas_products ADD PRIMARY KEY (_id);
```

### 2. Code Lookup Index

```sql
-- Index hỗ trợ tìm kiếm nhanh theo mã sản phẩm (Routing/Checkout)
CREATE UNIQUE INDEX idx_saas_products_code 
ON saas_products (code) 
WHERE deleted_at IS NULL;
```

**Use Case:** Tra cứu sản phẩm theo code khi checkout/mua hàng

### 3. Active Products by Type

```sql
-- Index hỗ trợ lọc danh sách sản phẩm đang kinh doanh theo loại
CREATE INDEX idx_saas_products_active_type 
ON saas_products (product_type, is_active) 
WHERE deleted_at IS NULL;
```

**Use Case:** Hiển thị danh sách APP đang active, filter sidebar

### 4. Metadata GIN Index

```sql
-- Index GIN để hỗ trợ truy vấn sâu vào JSONB metadata
CREATE INDEX idx_saas_products_metadata 
ON saas_products USING GIN (metadata);
```

**Use Case:** Query sản phẩm có tag "enterprise", có feature "sso"

**Example Queries:**
```sql
-- Tìm sản phẩm có tag "enterprise"
SELECT * FROM saas_products 
WHERE metadata @> '{"tags": ["enterprise"]}';

-- Tìm sản phẩm featured
SELECT * FROM saas_products 
WHERE metadata->>'is_featured' = 'true';

-- Tìm sản phẩm có max_users >= 100
SELECT * FROM saas_products 
WHERE (metadata->'limits'->>'max_users')::int >= 100;
```

---

## Constraints

### 1. Unique Constraints

```sql
CONSTRAINT uq_saas_products_code UNIQUE (code)
```

**Purpose:** Đảm bảo mỗi product code là duy nhất toàn hệ thống

### 2. Check Constraints

#### Code Format Check

```sql
CONSTRAINT chk_saas_products_code_fmt CHECK (code ~ '^[a-z0-9-]+$')
```

**Valid Examples:**
- ✅ `crm-basic`
- ✅ `erp-enterprise-2024`
- ✅ `domain-com`
- ❌ `CRM_Basic` (uppercase)
- ❌ `crm basic` (space)
- ❌ `crm.basic` (dot)

#### Product Type Check

```sql
CONSTRAINT chk_saas_products_type CHECK (product_type IN ('APP', 'DOMAIN', 'SSL', 'SERVICE'))
```

#### Price Check

```sql
CONSTRAINT chk_saas_products_price CHECK (base_price >= 0)
```

#### Currency Length Check

```sql
CONSTRAINT chk_saas_products_currency_len CHECK (LENGTH(currency) = 3)
```

**Valid:** USD, VND, EUR, GBP  
**Invalid:** US, $ , DOLLAR

#### Name Length Check

```sql
CONSTRAINT chk_saas_products_name_len CHECK (LENGTH(name) > 0)
```

---

## Business Rules

### 1. Product Code Rules

- **Format:** Lowercase alphanumeric + hyphens only
- **Uniqueness:** Toàn hệ thống (không phân tenant)
- **Immutability:** Code KHÔNG nên thay đổi sau khi tạo
- **Length:** Tối đa 50 ký tự
- **Naming Convention:** `{product-type}-{tier}-{variant}`

**Examples:**
```
crm-basic
crm-professional  
crm-enterprise
domain-com
domain-vn
ssl-basic
ssl-wildcard
support-premium
```

### 2. Pricing Rules

- **Precision:** 4 decimal places (0.0001)
- **Non-negative:** Giá phải >= 0
- **Currency:** Mã ISO 4217 3 ký tự
- **Base Price:** Giá gốc chưa VAT/discount

### 3. Soft Delete Rules

- Khi xóa: Set `deleted_at = NOW()`
- Không thực sự xóa record khỏi database
- Queries phải filter `WHERE deleted_at IS NULL`
- Có thể restore bằng cách set `deleted_at = NULL`

### 4. Versioning Rules

- Mỗi UPDATE tăng version lên 1
- Frontend phải gửi current version
- Backend check version conflict
- Nếu conflict → trả về 409 Conflict

---

## Migration Scripts

### Create Table

```sql
-- File: /sql/create_saas_products_table.sql

CREATE TABLE IF NOT EXISTS saas_products (
    _id UUID PRIMARY KEY,
    code VARCHAR(50) NOT NULL,
    name TEXT NOT NULL,
    product_type VARCHAR(20) NOT NULL DEFAULT 'APP',
    description TEXT,
    base_price NUMERIC(19, 4) NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'VND',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    version BIGINT NOT NULL DEFAULT 1,
    
    CONSTRAINT uq_saas_products_code UNIQUE (code),
    CONSTRAINT chk_saas_products_code_fmt CHECK (code ~ '^[a-z0-9-]+$'),
    CONSTRAINT chk_saas_products_type CHECK (product_type IN ('APP', 'DOMAIN', 'SSL', 'SERVICE')),
    CONSTRAINT chk_saas_products_price CHECK (base_price >= 0),
    CONSTRAINT chk_saas_products_currency_len CHECK (LENGTH(currency) = 3),
    CONSTRAINT chk_saas_products_name_len CHECK (LENGTH(name) > 0)
);

-- Create indexes
CREATE UNIQUE INDEX idx_saas_products_code 
ON saas_products (code) 
WHERE deleted_at IS NULL;

CREATE INDEX idx_saas_products_active_type 
ON saas_products (product_type, is_active) 
WHERE deleted_at IS NULL;

CREATE INDEX idx_saas_products_metadata 
ON saas_products USING GIN (metadata);

-- Add comments
COMMENT ON TABLE saas_products IS 'Lưu trữ danh mục các dòng sản phẩm thương mại của nền tảng SaaS';
COMMENT ON COLUMN saas_products._id IS 'UUID v7 primary key';
COMMENT ON COLUMN saas_products.code IS 'Mã sản phẩm duy nhất, format: ^[a-z0-9-]+$';
COMMENT ON COLUMN saas_products.product_type IS 'Loại sản phẩm: APP, DOMAIN, SSL, SERVICE';
COMMENT ON COLUMN saas_products.base_price IS 'Giá cơ bản với độ chính xác 4 chữ số thập phân';
COMMENT ON COLUMN saas_products.metadata IS 'JSONB cho custom attributes';
COMMENT ON COLUMN saas_products.version IS 'Version cho optimistic locking';
```

### Seed Data

```sql
-- File: /sql/seed_saas_products.sql

INSERT INTO saas_products (_id, code, name, product_type, description, base_price, currency, is_active, metadata) VALUES
-- APP Products
('01940d7e-1234-7890-abcd-000000000001', 'crm-basic', 'CRM Basic', 'APP', 'Giải pháp quản lý khách hàng cơ bản', 99000.00, 'VND', true, 
 '{"features": ["contact_management", "basic_reports"], "limits": {"max_users": 5, "storage_gb": 10}, "display_order": 1, "is_featured": false}'::jsonb),

('01940d7e-1234-7890-abcd-000000000002', 'crm-professional', 'CRM Professional', 'APP', 'Giải pháp CRM chuyên nghiệp', 299000.00, 'VND', true,
 '{"features": ["advanced_reports", "automation", "integrations"], "limits": {"max_users": 50, "storage_gb": 100}, "display_order": 2, "is_featured": true}'::jsonb),

('01940d7e-1234-7890-abcd-000000000003', 'crm-enterprise', 'CRM Enterprise', 'APP', 'Giải pháp CRM doanh nghiệp lớn', 999000.00, 'VND', true,
 '{"features": ["all_features", "custom_dev", "priority_support"], "limits": {"max_users": -1, "storage_gb": 500}, "display_order": 3, "is_featured": true}'::jsonb),

-- DOMAIN Products
('01940d7e-1234-7890-abcd-000000000004', 'domain-com', 'Domain .com', 'DOMAIN', 'Tên miền quốc tế .com', 300000.00, 'VND', true,
 '{"domain_extension": ".com", "renewal_price": 350000, "display_order": 10}'::jsonb),

('01940d7e-1234-7890-abcd-000000000005', 'domain-vn', 'Domain .vn', 'DOMAIN', 'Tên miền Việt Nam .vn', 400000.00, 'VND', true,
 '{"domain_extension": ".vn", "renewal_price": 450000, "display_order": 11}'::jsonb),

-- SSL Products  
('01940d7e-1234-7890-abcd-000000000006', 'ssl-basic', 'SSL Basic', 'SSL', 'Chứng chỉ SSL cơ bản', 50000.00, 'VND', true,
 '{"ssl_type": "DV", "warranty": "10000USD", "wildcard": false, "display_order": 20}'::jsonb),

('01940d7e-1234-7890-abcd-000000000007', 'ssl-wildcard', 'SSL Wildcard', 'SSL', 'Chứng chỉ SSL Wildcard', 500000.00, 'VND', true,
 '{"ssl_type": "OV", "warranty": "100000USD", "wildcard": true, "display_order": 21}'::jsonb),

-- SERVICE Products
('01940d7e-1234-7890-abcd-000000000008', 'support-premium', 'Premium Support', 'SERVICE', 'Hỗ trợ ưu tiên 24/7', 199000.00, 'VND', true,
 '{"sla": "99.9%", "response_time": "1h", "channels": ["phone", "email", "chat"], "display_order": 30}'::jsonb);
```

### Rollback Script

```sql
-- File: /sql/rollback_saas_products.sql

DROP INDEX IF EXISTS idx_saas_products_metadata;
DROP INDEX IF EXISTS idx_saas_products_active_type;
DROP INDEX IF EXISTS idx_saas_products_code;
DROP TABLE IF EXISTS saas_products CASCADE;
```

---

## Related Tables

### Relationships

```
saas_products (1) ─────< (N) service_packages
                          └─ Foreign Key: saas_product_id
```

**service_packages table:**
- Các gói cước/plan cụ thể của product
- Ví dụ: CRM Basic có gói Monthly, Yearly
- Foreign Key: `saas_product_id REFERENCES saas_products(_id)`

---

## Query Examples

### 1. Get All Active Products

```sql
SELECT * FROM saas_products 
WHERE is_active = true 
  AND deleted_at IS NULL
ORDER BY product_type, metadata->>'display_order';
```

### 2. Get Products by Type

```sql
SELECT * FROM saas_products 
WHERE product_type = 'APP'
  AND deleted_at IS NULL;
```

### 3. Search Products

```sql
SELECT * FROM saas_products 
WHERE (name ILIKE '%crm%' OR description ILIKE '%crm%')
  AND deleted_at IS NULL;
```

### 4. Get Featured Products

```sql
SELECT * FROM saas_products 
WHERE metadata->>'is_featured' = 'true'
  AND is_active = true
  AND deleted_at IS NULL
ORDER BY (metadata->>'display_order')::int ASC;
```

### 5. Get Product with Packages

```sql
SELECT 
  p.*,
  json_agg(sp.*) as packages
FROM saas_products p
LEFT JOIN service_packages sp ON sp.saas_product_id = p._id
WHERE p._id = $1 AND p.deleted_at IS NULL
GROUP BY p._id;
```

---

## Best Practices

### 1. Always Use UUID v7

```typescript
import { uuidv7 } from 'uuidv7';

const productId = uuidv7(); // Time-sortable UUID
```

### 2. Handle Soft Deletes

```sql
-- ❌ Wrong
SELECT * FROM saas_products WHERE _id = $1;

-- ✅ Correct
SELECT * FROM saas_products 
WHERE _id = $1 AND deleted_at IS NULL;
```

### 3. Use Optimistic Locking

```typescript
// Frontend gửi version hiện tại
await updateProduct(id, {
  name: "New Name",
  version: 5
});

// Backend check version
UPDATE saas_products 
SET name = $1, version = version + 1
WHERE _id = $2 AND version = $3;
-- Nếu version không khớp → conflict
```

### 4. Validate Product Type

```typescript
const VALID_TYPES = ['APP', 'DOMAIN', 'SSL', 'SERVICE'] as const;
type ProductType = typeof VALID_TYPES[number];

function validateProductType(type: string): type is ProductType {
  return VALID_TYPES.includes(type as ProductType);
}
```

### 5. Price Handling

```typescript
// ❌ Wrong: Using JavaScript Number (loses precision)
const price = 999000.0000; 

// ✅ Correct: Use string or Decimal library
import Decimal from 'decimal.js';
const price = new Decimal('999000.0000');
```

---

## Performance Considerations

### Index Usage

```sql
-- ✅ Good: Uses idx_saas_products_code
SELECT * FROM saas_products WHERE code = 'crm-basic';

-- ✅ Good: Uses idx_saas_products_active_type
SELECT * FROM saas_products 
WHERE product_type = 'APP' AND is_active = true;

-- ✅ Good: Uses idx_saas_products_metadata (GIN)
SELECT * FROM saas_products 
WHERE metadata @> '{"tags": ["enterprise"]}';

-- ❌ Slow: Full table scan
SELECT * FROM saas_products WHERE name ILIKE '%basic%';
```

### Pagination

```sql
-- ✅ Use LIMIT/OFFSET with indexes
SELECT * FROM saas_products 
WHERE deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 20 OFFSET 0;
```

---

## Security Considerations

1. **Input Validation:** Always validate code format before INSERT
2. **Price Validation:** Ensure base_price >= 0
3. **Type Validation:** Check product_type against enum
4. **SQL Injection:** Use parameterized queries
5. **JSONB Injection:** Validate metadata structure

---

## Monitoring & Metrics

### Suggested Metrics

```sql
-- Total products by type
SELECT product_type, COUNT(*) 
FROM saas_products 
WHERE deleted_at IS NULL
GROUP BY product_type;

-- Active vs Inactive
SELECT is_active, COUNT(*) 
FROM saas_products 
WHERE deleted_at IS NULL
GROUP BY is_active;

-- Average price by type
SELECT product_type, AVG(base_price), currency
FROM saas_products 
WHERE deleted_at IS NULL
GROUP BY product_type, currency;
```

---

## Changelog

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-01-14 | System | Initial schema documentation |

---

## References

- Database Schema: `/docs/DatabaseCommand.md` (Lines 1868-1919)
- API Documentation: `/docs/developer/products-api-reference.md`
- ERD Diagram: `/docs/developer/products-erd-diagram.md`
- Use Cases: `/docs/developer/products-use-cases.md`
- Golang Handler: `/golang-api/handlers/saas_products_handler.go`
