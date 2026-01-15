# Products - ERD Diagram

**Module:** Products (SaaS Products)  
**Version:** 1.0.0  
**Last Updated:** 2026-01-14

---

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      saas_products                          │
├─────────────────────────────────────────────────────────────┤
│ PK  _id                 UUID                                │
│     code                VARCHAR(50)  UNIQUE                 │
│     name                TEXT                                │
│     product_type        VARCHAR(20)  ∈ {APP,DOMAIN,SSL,SERVICE}│
│     description         TEXT         NULL                   │
│     base_price          NUMERIC(19,4) >= 0                  │
│     currency            VARCHAR(3)   LEN=3                  │
│     is_active           BOOLEAN      DEFAULT TRUE           │
│     metadata            JSONB        DEFAULT '{}'           │
│     created_at          TIMESTAMPTZ  DEFAULT NOW()          │
│     updated_at          TIMESTAMPTZ  DEFAULT NOW()          │
│     deleted_at          TIMESTAMPTZ  NULL (soft delete)     │
│     version             BIGINT       DEFAULT 1              │
└─────────────────────────────────────────────────────────────┘
                         │
                         │ 1:N
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    service_packages                         │
├─────────────────────────────────────────────────────────────┤
│ PK  _id                 UUID                                │
│ FK  saas_product_id     UUID   → saas_products._id          │
│     code                VARCHAR(50)                         │
│     name                VARCHAR(255)                        │
│     description         TEXT                                │
│     price_amount        NUMERIC(19,4)                       │
│     currency_code       VARCHAR(3)                          │
│     billing_cycle       VARCHAR(20)                         │
│     trial_days          INTEGER                             │
│     entitlements_config JSONB                               │
│     status              VARCHAR(20)                         │
│     is_public           BOOLEAN                             │
│     created_at          TIMESTAMPTZ                         │
│     updated_at          TIMESTAMPTZ                         │
│     deleted_at          TIMESTAMPTZ                         │
│     version             BIGINT                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Relationships

### 1. saas_products → service_packages (1:N)

**Relationship Type:** One-to-Many  
**Foreign Key:** `service_packages.saas_product_id` → `saas_products._id`

**Business Logic:**
- Một sản phẩm (product) có thể có nhiều gói cước (packages)
- Ví dụ: "CRM Professional" có 3 packages: Monthly, Yearly, Lifetime
- Packages kế thừa `product_type` từ parent product

**Example:**
```
saas_products
├─ CRM Professional (_id: xxx-001)
│  ├─ service_packages
│  │  ├─ CRM Pro Monthly  (saas_product_id: xxx-001)
│  │  ├─ CRM Pro Yearly   (saas_product_id: xxx-001)
│  │  └─ CRM Pro Lifetime (saas_product_id: xxx-001)
│
├─ Domain .com (_id: xxx-002)
│  ├─ service_packages
│  │  ├─ Domain 1 Year   (saas_product_id: xxx-002)
│  │  └─ Domain 3 Years  (saas_product_id: xxx-002)
```

---

## Indexes Visualization

```
saas_products
├─ idx_pk_saas_products (_id) [PRIMARY KEY]
├─ idx_saas_products_code (code WHERE deleted_at IS NULL) [UNIQUE]
├─ idx_saas_products_active_type (product_type, is_active WHERE deleted_at IS NULL)
└─ idx_saas_products_metadata (metadata) [GIN]

service_packages
├─ idx_pk_service_packages (_id) [PRIMARY KEY]
├─ idx_packages_product (saas_product_id WHERE deleted_at IS NULL)
├─ idx_packages_code_lookup (code WHERE deleted_at IS NULL) [UNIQUE]
├─ idx_packages_entitlements (entitlements_config) [GIN]
└─ idx_packages_public_active (is_public, status WHERE deleted_at IS NULL)
```

---

## Data Flow Diagram

### Product Creation Flow

```
┌──────────┐       ┌─────────────────┐       ┌──────────────────┐
│  Admin   │──1──▶ │ Create Product  │──2──▶ │  saas_products   │
│   UI     │       │     Request     │       │      Table       │
└──────────┘       └─────────────────┘       └──────────────────┘
                            │
                            │ 3. Success
                            ▼
                   ┌─────────────────┐
                   │  Create Package │
                   │     (Optional)  │
                   └─────────────────┘
                            │
                            ▼
                   ┌──────────────────┐
                   │ service_packages │
                   │      Table       │
                   └──────────────────┘
```

### Product Purchase Flow

```
┌──────────┐       ┌─────────────────┐       ┌──────────────────┐
│ Customer │──1──▶ │  Browse Products│──2──▶ │  saas_products   │
│          │       │  (Active Only)  │       │  WHERE is_active │
└──────────┘       └─────────────────┘       │    = TRUE        │
                            │                └──────────────────┘
                            │ 3. Select Product
                            ▼
                   ┌─────────────────┐       ┌──────────────────┐
                   │  View Packages  │──4──▶ │ service_packages │
                   │                 │       │  WHERE saas_      │
                   └─────────────────┘       │  product_id = ?  │
                            │                └──────────────────┘
                            │ 5. Choose Package
                            ▼
                   ┌─────────────────┐
                   │  Create Order   │
                   └─────────────────┘
```

---

## Metadata JSONB Structure

### saas_products.metadata

```json
{
  "icon": "package",              // Icon name for UI
  "color": "#6366f1",             // Brand color
  "features": [                   // Highlighted features
    "feature1", 
    "feature2"
  ],
  "limits": {                     // Default limits
    "max_users": 100,
    "storage_gb": 50
  },
  "display_order": 1,             // Sort order in listings
  "is_featured": false,           // Show in featured section
  "tags": [                       // Searchable tags
    "popular", 
    "enterprise"
  ],
  "seo": {                        // SEO metadata
    "title": "Product Title",
    "description": "SEO description",
    "keywords": ["saas", "crm"]
  },
  "billing_cycles": [             // Available billing options
    "monthly",
    "yearly"
  ],
  "trial_available": true,        // Has free trial
  "trial_days": 14                // Trial duration
}
```

### service_packages.entitlements_config

```json
{
  "apps": {                       // App access configuration
    "crm": {
      "enabled": true,
      "version": "professional"
    },
    "hrm": {
      "enabled": false
    }
  },
  "features": {                   // Feature flags
    "advanced_reports": true,
    "api_access": true,
    "white_label": false
  },
  "limits": {                     // Usage limits
    "max_users": 50,
    "max_contacts": 10000,
    "storage_gb": 100,
    "api_calls_per_month": 100000
  },
  "integrations": {               // Third-party integrations
    "google": true,
    "microsoft": true,
    "salesforce": false
  },
  "support": {                    // Support tier
    "level": "priority",
    "response_time": "4h",
    "channels": ["email", "phone", "chat"]
  }
}
```

---

## Constraints Summary

### saas_products

| Constraint | Type | Description |
|------------|------|-------------|
| `PK _id` | PRIMARY KEY | Unique identifier |
| `uq_saas_products_code` | UNIQUE | Code must be unique |
| `chk_saas_products_code_fmt` | CHECK | Code format: `^[a-z0-9-]+$` |
| `chk_saas_products_type` | CHECK | Type must be APP/DOMAIN/SSL/SERVICE |
| `chk_saas_products_price` | CHECK | Price must be >= 0 |
| `chk_saas_products_currency_len` | CHECK | Currency must be 3 chars |
| `chk_saas_products_name_len` | CHECK | Name cannot be empty |

### service_packages

| Constraint | Type | Description |
|------------|------|-------------|
| `PK _id` | PRIMARY KEY | Unique identifier |
| `fk_package_product` | FOREIGN KEY | References saas_products(_id) |
| `uq_package_code` | UNIQUE | Package code must be unique |
| `chk_package_code_format` | CHECK | Code format: `^[a-z0-9-]+$` |
| `chk_package_price` | CHECK | Price >= 0 |
| `chk_package_status` | CHECK | Status in ACTIVE/INACTIVE/ARCHIVED |

---

## Cascade Behavior

### ON DELETE

```sql
-- service_packages references saas_products
CONSTRAINT fk_package_product 
  FOREIGN KEY (saas_product_id) 
  REFERENCES saas_products(_id)
  -- Default: NO ACTION
```

**Recommended Strategy:**
- Use **soft delete** for `saas_products`
- When product is deleted → Set `deleted_at = NOW()`
- Packages remain but parent product is hidden
- Can restore product by setting `deleted_at = NULL`

**Alternative (Hard Delete):**
```sql
-- If implementing hard delete
CONSTRAINT fk_package_product 
  FOREIGN KEY (saas_product_id) 
  REFERENCES saas_products(_id)
  ON DELETE CASCADE  -- Xóa luôn packages
  -- OR
  ON DELETE RESTRICT -- Không cho xóa nếu còn packages
```

---

## Query Patterns

### 1. Get Product with Packages

```sql
SELECT 
  p.*,
  COUNT(sp._id) as package_count,
  json_agg(
    json_build_object(
      '_id', sp._id,
      'code', sp.code,
      'name', sp.name,
      'price_amount', sp.price_amount,
      'billing_cycle', sp.billing_cycle
    )
  ) FILTER (WHERE sp._id IS NOT NULL) as packages
FROM saas_products p
LEFT JOIN service_packages sp 
  ON sp.saas_product_id = p._id 
  AND sp.deleted_at IS NULL
WHERE p._id = $1 
  AND p.deleted_at IS NULL
GROUP BY p._id;
```

### 2. Get Active Products by Type with Package Count

```sql
SELECT 
  p.*,
  COUNT(sp._id) as active_package_count
FROM saas_products p
LEFT JOIN service_packages sp 
  ON sp.saas_product_id = p._id 
  AND sp.deleted_at IS NULL
  AND sp.status = 'ACTIVE'
WHERE p.product_type = $1
  AND p.is_active = true
  AND p.deleted_at IS NULL
GROUP BY p._id
ORDER BY p.metadata->>'display_order' ASC;
```

### 3. Search Products with Packages

```sql
SELECT DISTINCT
  p.*
FROM saas_products p
LEFT JOIN service_packages sp 
  ON sp.saas_product_id = p._id
WHERE (
    p.name ILIKE $1 
    OR p.description ILIKE $1
    OR sp.name ILIKE $1
  )
  AND p.deleted_at IS NULL
ORDER BY p.created_at DESC;
```

---

## Performance Optimization

### Index Usage

```sql
-- ✅ Uses idx_saas_products_code
EXPLAIN SELECT * FROM saas_products WHERE code = 'crm-basic';

-- ✅ Uses idx_saas_products_active_type
EXPLAIN SELECT * FROM saas_products 
WHERE product_type = 'APP' AND is_active = true;

-- ✅ Uses idx_packages_product
EXPLAIN SELECT * FROM service_packages 
WHERE saas_product_id = 'xxx-001';
```

### Denormalization Strategy

**Consider denormalizing for read-heavy scenarios:**

```sql
-- Add package_count to saas_products
ALTER TABLE saas_products ADD COLUMN package_count INTEGER DEFAULT 0;

-- Update via trigger
CREATE OR REPLACE FUNCTION update_product_package_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE saas_products
  SET package_count = (
    SELECT COUNT(*) 
    FROM service_packages 
    WHERE saas_product_id = NEW.saas_product_id 
      AND deleted_at IS NULL
  )
  WHERE _id = NEW.saas_product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_package_count
AFTER INSERT OR UPDATE OR DELETE ON service_packages
FOR EACH ROW
EXECUTE FUNCTION update_product_package_count();
```

---

## Versioning & Concurrency

### Optimistic Locking

```sql
-- Update with version check
UPDATE saas_products
SET 
  name = $1,
  base_price = $2,
  version = version + 1,
  updated_at = NOW()
WHERE _id = $3 
  AND version = $4  -- Check current version
  AND deleted_at IS NULL
RETURNING *;

-- If affected_rows = 0 → Version conflict (409 Conflict)
```

---

## Migration Path

### From Legacy Schema

```sql
-- If migrating from old schema
INSERT INTO saas_products (
  _id, code, name, product_type, description, 
  base_price, currency, is_active, metadata
)
SELECT 
  uuid_generate_v7(),
  LOWER(REGEXP_REPLACE(code, '[^a-zA-Z0-9]+', '-', 'g')),
  name,
  'APP',  -- Default type
  description,
  price::numeric(19,4),
  'VND',
  status = 'active',
  jsonb_build_object(
    'legacy_id', id,
    'migrated_at', NOW()
  )
FROM legacy_products
WHERE deleted = false;
```

---

## References

- Database Schema: `/docs/developer/products-database-schema.md`
- API Documentation: `/docs/developer/products-api-reference.md`
- Use Cases: `/docs/developer/products-use-cases.md`
- Service Packages ERD: `/docs/developer/packages-erd-diagram.md`
