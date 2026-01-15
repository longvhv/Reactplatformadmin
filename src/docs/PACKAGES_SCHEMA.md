# Service Packages - Database Schema Documentation

## 📋 Tổng quan

Tài liệu này mô tả chi tiết database schema của bảng **`service_packages`** - bảng quản lý các gói dịch vụ (subscription plans/tiers) trong hệ thống SaaS.

**Service Package** là các tier/plan khác nhau của một sản phẩm (Starter, Pro, Enterprise, etc.) với pricing và entitlements riêng biệt.

---

## 📊 Table Structure

### Table Name: `service_packages`

```sql
CREATE TABLE service_packages (
    -- I. Định danh & Liên kết
    _id UUID PRIMARY KEY,
    saas_product_id UUID NOT NULL,
    
    -- II. Thông tin thương mại
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- III. Tài chính (Pricing)
    price_amount NUMERIC(19, 4) NOT NULL DEFAULT 0,
    currency_code VARCHAR(3) NOT NULL DEFAULT 'VND',
    
    -- IV. Cấu hình quyền hạn (Entitlements)
    entitlements_config JSONB NOT NULL DEFAULT '{}',
    
    -- V. Trạng thái vận hành
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- VI. Display & Ordering
    display_order INTEGER DEFAULT 0,
    trial_days INTEGER DEFAULT 0,
    billing_cycle VARCHAR(20) DEFAULT 'MONTHLY',
    
    -- VII. Resource Limits (Optional)
    max_users INTEGER,
    max_storage INTEGER,
    
    -- VIII. Flexible Data
    features JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    
    -- IX. Audit & Versioning
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    version BIGINT NOT NULL DEFAULT 1,
    created_by UUID,
    updated_by UUID,
    deleted_by UUID,
    
    -- X. Constraints
    CONSTRAINT fk_package_product FOREIGN KEY (saas_product_id) 
        REFERENCES saas_products(_id),
    CONSTRAINT uq_package_code UNIQUE (code),
    CONSTRAINT chk_package_code_format CHECK (code ~ '^[a-z0-9-]+$'),
    CONSTRAINT chk_package_price CHECK (price_amount >= 0),
    CONSTRAINT chk_package_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'ARCHIVED'))
);
```

---

## 📐 Column Specifications

### I. Định danh & Liên kết

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| `_id` | UUID | NO | uuid_generate_v7() | Primary key, UUID v7 for better performance |
| `saas_product_id` | UUID | NO | - | Foreign key → `saas_products._id` |

**Business Rules:**
- `_id`: UUID v7 được generate từ application layer
- `saas_product_id`: Mỗi package phải thuộc về một product hợp lệ
- **Relationship**: 1 Product → N Packages (One-to-Many)

---

### II. Thông tin thương mại

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| `code` | VARCHAR(50) | NO | - | Unique code (e.g., `hrm-starter`, `crm-pro`) |
| `name` | VARCHAR(255) | NO | - | Display name (e.g., "HRM Starter Plan") |
| `description` | TEXT | YES | NULL | Detailed description for marketing |

**Business Rules:**
- `code`: Lowercase alphanumeric + hyphens only (`^[a-z0-9-]+$`)
- `code`: Globally unique across all packages
- `name`: Human-readable, can include spaces and special chars
- `description`: Markdown-compatible for rich content

**Examples:**
```json
{
  "code": "hrm-professional",
  "name": "HRM Professional Plan",
  "description": "Best for medium-sized companies with 50-200 employees. Includes all core features plus advanced reporting."
}
```

---

### III. Tài chính (Pricing)

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| `price_amount` | NUMERIC(19,4) | NO | 0 | Price amount (precision: 4 decimal places) |
| `currency_code` | VARCHAR(3) | NO | 'VND' | ISO 4217 currency code (VND, USD, EUR) |

**Business Rules:**
- `price_amount`: Must be >= 0 (non-negative)
- `price_amount`: Supports micro-pricing (up to 4 decimals: 0.0001)
- `currency_code`: ISO 4217 standard (3-letter codes)
- Price is per billing cycle (MONTHLY, YEARLY, etc.)

**Examples:**
```json
{
  "price_amount": 2990000.0000,
  "currency_code": "VND"
}
// Monthly price: 2,990,000 VND

{
  "price_amount": 99.9900,
  "currency_code": "USD"
}
// Monthly price: $99.99 USD
```

---

### IV. Cấu hình quyền hạn (Entitlements)

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| `entitlements_config` | JSONB | NO | '{}' | Configuration of apps, features, and quotas |

**Structure:**
```json
{
  "apps": {
    "hrm": {
      "enabled": true,
      "features": {
        "employee_management": true,
        "payroll": true,
        "attendance": false
      },
      "limits": {
        "max_employees": 50,
        "max_departments": 10
      }
    },
    "crm": {
      "enabled": false
    }
  },
  "shared_quotas": {
    "storage_gb": 100,
    "api_calls_per_month": 100000,
    "users": 50
  }
}
```

**Business Rules:**
- JSONB format allows flexible schema
- Can nest app-specific entitlements
- Can define global shared quotas
- Values can be boolean, number, string, or object
- Indexed with GIN index for fast querying

**Query Examples:**
```sql
-- Find packages that include HRM app
SELECT * FROM service_packages
WHERE entitlements_config @> '{"apps": {"hrm": {"enabled": true}}}';

-- Find packages with > 100 employees
SELECT * FROM service_packages
WHERE (entitlements_config->'shared_quotas'->>'users')::int > 100;
```

---

### V. Trạng thái vận hành

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| `status` | VARCHAR(20) | NO | 'ACTIVE' | Lifecycle status |
| `is_public` | BOOLEAN | NO | TRUE | Visibility on public pricing page |

**Status Values:**
- `ACTIVE`: Available for new subscriptions
- `INACTIVE`: Hidden, existing subs continue
- `ARCHIVED`: Legacy, no new subs, existing can't renew

**is_public Values:**
- `TRUE`: Shows on public pricing page
- `FALSE`: Hidden, only available via direct link or admin

**State Machine:**
```
ACTIVE ⇄ INACTIVE → ARCHIVED
  ↓         ↓
is_public: true/false
```

**Business Rules:**
- New packages default to ACTIVE + public
- Can toggle is_public independently of status
- ARCHIVED packages cannot be reactivated
- Existing subscriptions continue regardless of status

---

### VI. Display & Ordering

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| `display_order` | INTEGER | YES | 0 | Sort order on pricing page (lower = first) |
| `trial_days` | INTEGER | YES | 0 | Number of free trial days |
| `billing_cycle` | VARCHAR(20) | YES | 'MONTHLY' | Billing frequency |

**billing_cycle Values:**
- `DAILY`: Daily billing (rare)
- `WEEKLY`: Weekly billing
- `MONTHLY`: Most common
- `QUARTERLY`: Every 3 months
- `YEARLY`: Annual billing (often discounted)
- `LIFETIME`: One-time payment, forever access

**Examples:**
```json
{
  "display_order": 1,
  "trial_days": 14,
  "billing_cycle": "MONTHLY"
}
// Shows first on pricing page
// 14-day free trial
// Billed monthly
```

**Common Patterns:**
```
Starter:  display_order = 1
Pro:      display_order = 2
Enterprise: display_order = 3
```

---

### VII. Resource Limits (Optional)

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| `max_users` | INTEGER | YES | NULL | Maximum number of users/seats |
| `max_storage` | INTEGER | YES | NULL | Maximum storage in GB |

**Business Rules:**
- `NULL` = Unlimited
- Positive integer = Hard limit
- Can be overridden per subscription

**Examples:**
```json
// Starter Plan
{
  "max_users": 10,
  "max_storage": 10
}

// Enterprise Plan (unlimited)
{
  "max_users": null,
  "max_storage": null
}
```

---

### VIII. Flexible Data

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| `features` | JSONB | YES | '{}' | Feature flags (for display purposes) |
| `metadata` | JSONB | YES | '{}' | Additional custom data |

**features** - For UI display:
```json
{
  "highlighted": ["24/7 Support", "Advanced Analytics", "API Access"],
  "included": {
    "support_level": "priority",
    "sla_uptime": "99.9%",
    "onboarding": true
  },
  "badge": "Most Popular"
}
```

**metadata** - For internal use:
```json
{
  "marketing": {
    "target_segment": "SME",
    "competitor_comparison": "better_than_zoho"
  },
  "internal": {
    "cost_basis": 500000,
    "profit_margin": 0.83
  }
}
```

---

### IX. Audit & Versioning

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| `created_at` | TIMESTAMPTZ | NO | NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NO | NOW() | Last update timestamp |
| `deleted_at` | TIMESTAMPTZ | YES | NULL | Soft delete timestamp |
| `version` | BIGINT | NO | 1 | Optimistic locking version |
| `created_by` | UUID | YES | NULL | User who created |
| `updated_by` | UUID | YES | NULL | User who last updated |
| `deleted_by` | UUID | YES | NULL | User who deleted |

**Optimistic Locking Pattern:**
```sql
-- When updating
UPDATE service_packages
SET name = 'New Name', 
    version = version + 1
WHERE _id = $1 AND version = $2;

-- If version mismatch → 0 rows affected → conflict error
```

**Soft Delete Pattern:**
```sql
-- Soft delete
UPDATE service_packages
SET deleted_at = NOW(), deleted_by = $1
WHERE _id = $2;

-- Query excludes soft-deleted
SELECT * FROM service_packages WHERE deleted_at IS NULL;
```

---

## 🔍 Indexes

### 1. Primary Key Index
```sql
-- Automatically created
CREATE UNIQUE INDEX service_packages_pkey ON service_packages (_id);
```

### 2. Foreign Key Index
```sql
-- Index hỗ trợ tìm kiếm tất cả các gói thuộc một sản phẩm
CREATE INDEX idx_packages_product ON service_packages (saas_product_id) 
WHERE deleted_at IS NULL;
```
**Usage:** Find all packages of a product
```sql
SELECT * FROM service_packages 
WHERE saas_product_id = 'uuid' AND deleted_at IS NULL;
```

### 3. Unique Code Index
```sql
-- Index hỗ trợ tra cứu nhanh gói qua mã (checkout/purchase)
CREATE UNIQUE INDEX idx_packages_code_lookup ON service_packages (code) 
WHERE deleted_at IS NULL;
```
**Usage:** Lookup package by code
```sql
SELECT * FROM service_packages 
WHERE code = 'hrm-pro' AND deleted_at IS NULL;
```

### 4. GIN Index on Entitlements (JSONB)
```sql
-- Index GIN hỗ trợ tìm kiếm bên trong JSONB
CREATE INDEX idx_packages_entitlements ON service_packages 
USING GIN (entitlements_config);
```
**Usage:** Query by entitlements
```sql
-- Find packages with CRM app enabled
SELECT * FROM service_packages
WHERE entitlements_config @> '{"apps": {"crm": {"enabled": true}}}';
```

### 5. Composite Index for Public Packages
```sql
-- Index hỗ trợ lọc các gói đang hoạt động và công khai
CREATE INDEX idx_packages_active_public ON service_packages (status, is_public) 
WHERE status = 'ACTIVE' AND is_public = TRUE AND deleted_at IS NULL;
```
**Usage:** Public pricing page query
```sql
SELECT * FROM service_packages
WHERE status = 'ACTIVE' AND is_public = TRUE AND deleted_at IS NULL
ORDER BY display_order ASC;
```

### 6. GIN Index on Features (JSONB)
```sql
-- Optional: If querying features frequently
CREATE INDEX idx_packages_features ON service_packages 
USING GIN (features);
```

### 7. Display Order Index
```sql
-- For sorting on pricing page
CREATE INDEX idx_packages_display_order ON service_packages (display_order)
WHERE deleted_at IS NULL;
```

---

## ✅ Constraints

### Primary Key
```sql
CONSTRAINT service_packages_pkey PRIMARY KEY (_id)
```

### Foreign Key
```sql
CONSTRAINT fk_package_product 
FOREIGN KEY (saas_product_id) REFERENCES saas_products(_id)
```
**On Delete Behavior:** Recommend `ON DELETE CASCADE` or `ON DELETE RESTRICT`

### Unique Constraints
```sql
CONSTRAINT uq_package_code UNIQUE (code)
```
**Business Rule:** Package codes must be globally unique

### Check Constraints

#### 1. Code Format
```sql
CONSTRAINT chk_package_code_format CHECK (code ~ '^[a-z0-9-]+$')
```
**Allowed:** `hrm-starter`, `crm-pro-2024`, `enterprise-v2`  
**Rejected:** `HRM Starter`, `crm_pro`, `Enterprise!`

#### 2. Price Non-Negative
```sql
CONSTRAINT chk_package_price CHECK (price_amount >= 0)
```
**Allowed:** 0 (free), 999.99  
**Rejected:** -100

#### 3. Status Values
```sql
CONSTRAINT chk_package_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'ARCHIVED'))
```
**Allowed:** ACTIVE, INACTIVE, ARCHIVED  
**Rejected:** PENDING, DRAFT, PUBLISHED

---

## 🔒 Data Validation Rules

### Application-Level Validations

```typescript
interface ServicePackageInput {
  saas_product_id: string;  // Required, must be valid UUID
  code: string;             // Required, lowercase alphanumeric + hyphens
  name: string;             // Required, max 255 chars
  description?: string;     // Optional
  price_amount: number;     // Required, >= 0, max 4 decimals
  currency_code: string;    // Required, 3 letters (ISO 4217)
  entitlements_config: object; // Required, valid JSON
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'; // Required
  is_public: boolean;       // Required
  display_order?: number;   // Optional, integer
  trial_days?: number;      // Optional, >= 0
  billing_cycle?: string;   // Optional, valid cycle
  max_users?: number;       // Optional, positive integer or null
  max_storage?: number;     // Optional, positive integer or null
  features?: object;        // Optional, valid JSON
  metadata?: object;        // Optional, valid JSON
}
```

### Validation Functions

```typescript
// Validate code format
function validateCode(code: string): boolean {
  return /^[a-z0-9-]+$/.test(code);
}

// Validate currency code
function validateCurrency(code: string): boolean {
  const validCurrencies = ['VND', 'USD', 'EUR', 'GBP', 'JPY', 'SGD'];
  return validCurrencies.includes(code);
}

// Validate billing cycle
function validateBillingCycle(cycle: string): boolean {
  const validCycles = ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'LIFETIME'];
  return validCycles.includes(cycle);
}

// Validate entitlements structure
function validateEntitlements(config: any): boolean {
  // Must be object
  if (typeof config !== 'object' || config === null) return false;
  
  // If has apps, must be object
  if (config.apps && typeof config.apps !== 'object') return false;
  
  // Validate each app config
  for (const [appCode, appConfig] of Object.entries(config.apps || {})) {
    if (typeof appConfig !== 'object') return false;
    // Additional validation...
  }
  
  return true;
}
```

---

## 📊 Common Query Patterns

### 1. Get All Active Public Packages (Pricing Page)
```sql
SELECT 
  sp.*,
  p.name as product_name,
  p.code as product_code
FROM service_packages sp
JOIN saas_products p ON p._id = sp.saas_product_id
WHERE sp.status = 'ACTIVE' 
  AND sp.is_public = TRUE 
  AND sp.deleted_at IS NULL
  AND p.deleted_at IS NULL
ORDER BY sp.display_order ASC, sp.price_amount ASC;
```

### 2. Get Packages by Product
```sql
SELECT * FROM service_packages
WHERE saas_product_id = $1 
  AND deleted_at IS NULL
ORDER BY display_order ASC;
```

### 3. Get Package by Code (Checkout)
```sql
SELECT * FROM service_packages
WHERE code = $1 AND deleted_at IS NULL;
```

### 4. Search Packages
```sql
SELECT * FROM service_packages
WHERE deleted_at IS NULL
  AND (
    name ILIKE '%' || $1 || '%' 
    OR code ILIKE '%' || $1 || '%'
    OR description ILIKE '%' || $1 || '%'
  )
ORDER BY display_order ASC
LIMIT 50;
```

### 5. Get Packages with Specific Entitlement
```sql
-- Packages that include payroll feature
SELECT * FROM service_packages
WHERE entitlements_config @> '{"apps": {"hrm": {"features": {"payroll": true}}}}'
  AND deleted_at IS NULL;
```

### 6. Get Packages by Price Range
```sql
SELECT * FROM service_packages
WHERE price_amount BETWEEN $1 AND $2
  AND currency_code = $3
  AND deleted_at IS NULL
ORDER BY price_amount ASC;
```

### 7. Get Statistics
```sql
SELECT 
  COUNT(*) as total_packages,
  COUNT(*) FILTER (WHERE status = 'ACTIVE') as active_packages,
  AVG(price_amount) as avg_price,
  MIN(price_amount) as min_price,
  MAX(price_amount) as max_price
FROM service_packages
WHERE deleted_at IS NULL;
```

---

## 🔐 Security Considerations

### 1. Row-Level Security (RLS)

```sql
-- Enable RLS
ALTER TABLE service_packages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see public packages or their tenant's packages
CREATE POLICY packages_select_policy ON service_packages
FOR SELECT
USING (
  is_public = TRUE 
  OR saas_product_id IN (
    SELECT _id FROM saas_products 
    WHERE tenant_id = current_setting('app.tenant_id')::uuid
  )
);

-- Policy: Only admins can modify packages
CREATE POLICY packages_modify_policy ON service_packages
FOR ALL
USING (
  current_setting('app.user_role') = 'admin'
);
```

### 2. Sensitive Data

**Price Visibility:**
- Public packages: Prices visible to all
- Private packages: Prices only visible to authenticated users

**Entitlements:**
- Never expose internal cost calculations
- Show features, not internal limits

### 3. Audit Trail

```sql
-- Track all changes
CREATE TABLE service_packages_audit (
  audit_id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  package_id UUID NOT NULL,
  action VARCHAR(10) NOT NULL, -- INSERT, UPDATE, DELETE
  old_data JSONB,
  new_data JSONB,
  changed_by UUID,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger function
CREATE OR REPLACE FUNCTION log_package_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO service_packages_audit (package_id, action, old_data, new_data, changed_by)
    VALUES (NEW._id, 'UPDATE', row_to_json(OLD), row_to_json(NEW), NEW.updated_by);
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO service_packages_audit (package_id, action, old_data)
    VALUES (OLD._id, 'DELETE', row_to_json(OLD));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_log_package_changes
AFTER UPDATE OR DELETE ON service_packages
FOR EACH ROW EXECUTE FUNCTION log_package_changes();
```

---

## 🎯 Performance Optimization

### 1. Materialized View for Pricing Page
```sql
CREATE MATERIALIZED VIEW mv_public_packages AS
SELECT 
  sp._id,
  sp.code,
  sp.name,
  sp.description,
  sp.price_amount,
  sp.currency_code,
  sp.trial_days,
  sp.billing_cycle,
  sp.features,
  sp.display_order,
  p.name as product_name,
  p.code as product_code
FROM service_packages sp
JOIN saas_products p ON p._id = sp.saas_product_id
WHERE sp.status = 'ACTIVE' 
  AND sp.is_public = TRUE 
  AND sp.deleted_at IS NULL
  AND p.deleted_at IS NULL
ORDER BY sp.display_order ASC;

-- Refresh periodically
REFRESH MATERIALIZED VIEW mv_public_packages;
```

### 2. Caching Strategy
- Cache public packages for 5 minutes
- Cache product packages for 1 minute
- Invalidate on package update

### 3. Query Optimization
- Always include `deleted_at IS NULL` in WHERE clause
- Use indexes for frequently filtered columns
- Limit result sets with LIMIT/OFFSET

---

## 📚 Related Documentation

- [Service Packages API Documentation](./PACKAGES_API.md)
- [Service Packages Use Cases](./PACKAGES_USECASES.md)
- [Service Packages ERD](./PACKAGES_ERD.md)
- [Service Packages UI Components](./PACKAGES_UI_COMPONENTS.md)
- [SaaS Products Schema](./PRODUCTS_SCHEMA.md)
- [Database Design](./Database.md)

---

**Version:** 1.0.0  
**Last Updated:** 2025-01-13  
**Maintainer:** VHV Platform Team
