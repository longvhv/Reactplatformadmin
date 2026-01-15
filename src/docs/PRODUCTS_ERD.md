# SaaS Products - Entity Relationship Diagram (ERD)

## 📋 Tổng quan

Tài liệu này mô tả chi tiết ERD (Entity Relationship Diagram) của module **SaaS Products** và các quan hệ với các module khác trong hệ thống.

---

## 🗺️ Complete ERD Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              tenants                                     │
├─────────────────────────────────────────────────────────────────────────┤
│ PK  _id                     UUID                                        │
│     code                    VARCHAR(50)                                 │
│     name                    VARCHAR(255)                                │
│     status                  VARCHAR(20)                                 │
│     ...                                                                 │
└─────────────────────────────────────────────────────────────────────────┘
                          │ 1
                          │
                          │ N
                          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          saas_products                                   │
├─────────────────────────────────────────────────────────────────────────┤
│ PK  _id                     UUID                                        │
│ FK  tenant_id               UUID          → tenants._id                 │
│ UK  code                    VARCHAR(50)                                 │
│     name                    TEXT                                        │
│     description             TEXT                                        │
│ FK  product_type_code       VARCHAR(50)   → system_categories.code     │
│     base_price              NUMERIC(19,4)                               │
│     currency                VARCHAR(3)                                  │
│     billing_cycle           VARCHAR(20)                                 │
│     trial_days              INTEGER                                     │
│     features                JSONB                                       │
│     limits                  JSONB                                       │
│     status                  VARCHAR(20)                                 │
│     is_featured             BOOLEAN                                     │
│     display_order           INTEGER                                     │
│     metadata                JSONB                                       │
│     created_at              TIMESTAMPTZ                                 │
│     updated_at              TIMESTAMPTZ                                 │
│     created_by              UUID                                        │
│     updated_by              UUID                                        │
│     deleted_at              TIMESTAMPTZ                                 │
│     deleted_by              UUID                                        │
│     version                 BIGINT                                      │
└─────────────────────────────────────────────────────────────────────────┘
                          │ 1                    │ 1
                          │                      │
                          │ N                    │ N
                          ▼                      ▼
┌──────────────────────────────────┐   ┌──────────────────────────────────┐
│     service_packages             │   │   subscription_orders            │
├──────────────────────────────────┤   ├──────────────────────────────────┤
│ PK  _id              UUID        │   │ PK  _id              UUID        │
│ FK  saas_product_id  UUID        │   │ FK  tenant_id        UUID        │
│     code             VARCHAR(50) │   │ FK  product_id       UUID        │
│     name             VARCHAR(255)│   │     product_snapshot JSONB       │
│     price_amount     NUMERIC     │   │     start_date       TIMESTAMP   │
│     entitlements     JSONB       │   │     end_date         TIMESTAMP   │
│     ...                          │   │     amount           NUMERIC     │
└──────────────────────────────────┘   │     status           VARCHAR(20) │
                                       │     ...                          │
                                       └──────────────────────────────────┘
                                                    │ 1
                                                    │
                                                    │ N
                                                    ▼
                                       ┌──────────────────────────────────┐
                                       │   subscription_invoices          │
                                       ├──────────────────────────────────┤
                                       │ PK  _id              UUID        │
                                       │ FK  subscription_id  UUID        │
                                       │     invoice_number   VARCHAR(50) │
                                       │     amount           NUMERIC     │
                                       │     status           VARCHAR(20) │
                                       │     due_date         TIMESTAMP   │
                                       │     ...                          │
                                       └──────────────────────────────────┘
```

---

## 📊 Entity Relationships

### 1. tenants → saas_products (1:N)

**Relationship Type:** One-to-Many  
**Foreign Key:** `saas_products.tenant_id → tenants._id`

**Description:**
- Một tenant có thể tạo nhiều products
- Mỗi product thuộc về một tenant duy nhất
- Multi-tenancy: Mỗi tenant có catalog riêng

**Business Rules:**
- Khi xóa tenant → Cascade soft delete tất cả products của tenant đó
- Tenant phải active để tạo products mới
- Product code phải unique trong scope của tenant

**SQL Constraint:**
```sql
ALTER TABLE saas_products 
ADD CONSTRAINT fk_product_tenant 
FOREIGN KEY (tenant_id) REFERENCES tenants(_id) 
ON DELETE CASCADE;

CREATE UNIQUE INDEX idx_products_tenant_code 
ON saas_products (tenant_id, code) 
WHERE deleted_at IS NULL;
```

---

### 2. system_categories → saas_products (1:N)

**Relationship Type:** One-to-Many (Soft FK)  
**Soft Foreign Key:** `saas_products.product_type_code → system_categories.code`

**Description:**
- Product types được định nghĩa trong system_categories
- Category group: `GRP_PRODUCT_TYPE`
- Ví dụ types: `PRODUCT_TYPE_APP`, `PRODUCT_TYPE_DOMAIN`, `PRODUCT_TYPE_SSL`

**Example Categories:**

```sql
-- System Categories cho Product Types
INSERT INTO system_categories VALUES
  (uuid_generate_v7(), 'GRP_PRODUCT_TYPE', 'PRODUCT_TYPE_APP', 'Application', 'Software applications'),
  (uuid_generate_v7(), 'GRP_PRODUCT_TYPE', 'PRODUCT_TYPE_DOMAIN', 'Domain', 'Domain names'),
  (uuid_generate_v7(), 'GRP_PRODUCT_TYPE', 'PRODUCT_TYPE_SSL', 'SSL Certificate', 'SSL certificates'),
  (uuid_generate_v7(), 'GRP_PRODUCT_TYPE', 'PRODUCT_TYPE_SERVICE', 'Service', 'Consulting services');
```

**Business Rules:**
- Product type là optional (nullable)
- Dùng để group products trong UI
- Dùng để filter và analytics

---

### 3. saas_products → service_packages (1:N)

**Relationship Type:** One-to-Many  
**Foreign Key:** `service_packages.saas_product_id → saas_products._id`

**Description:**
- Một product có thể có nhiều packages (tiers)
- Package là bundle với entitlements cụ thể
- Ví dụ: HRM Product có Starter, Pro, Enterprise packages

**Hierarchy:**
```
SaaS Product (HRM Suite)
├── Starter Package ($990/month)
│   └── Entitlements: 20 employees, basic features
├── Professional Package ($2,990/month)
│   └── Entitlements: 50 employees, advanced features
└── Enterprise Package ($9,990/month)
    └── Entitlements: unlimited employees, all features
```

**Business Rules:**
- Package phải reference một product hợp lệ
- Package price có thể khác product base_price
- Khi delete product → Cascade delete packages

**SQL Constraint:**
```sql
ALTER TABLE service_packages 
ADD CONSTRAINT fk_package_product 
FOREIGN KEY (saas_product_id) REFERENCES saas_products(_id) 
ON DELETE CASCADE;

CREATE INDEX idx_packages_product 
ON service_packages (saas_product_id);
```

---

### 4. saas_products → subscription_orders (1:N)

**Relationship Type:** One-to-Many  
**Foreign Key:** `subscription_orders.product_id → saas_products._id`

**Description:**
- Customer đặt mua product → tạo subscription order
- Order lưu **snapshot** của product tại thời điểm mua
- Grandfather pricing: Giá cũ được giữ nguyên cho subscriptions cũ

**Snapshot Strategy:**

```json
{
  "subscription_id": "uuid",
  "product_id": "uuid",
  "product_snapshot": {
    "code": "hrm-pro",
    "name": "HRM Professional",
    "base_price": 2990000,
    "features": { "payroll": true, ... },
    "limits": { "max_employees": 50, ... }
  },
  "amount": 2990000,
  "status": "active"
}
```

**Why Snapshot?**
- Product price có thể thay đổi
- Product features có thể thay đổi
- Subscription phải giữ nguyên điều khoản tại thời điểm mua
- Compliance và audit trail

**Business Rules:**
- Không thể xóa product đang có active subscriptions
- Phải archive product trước khi xóa
- Snapshot không bao giờ update (immutable)

---

### 5. subscription_orders → subscription_invoices (1:N)

**Relationship Type:** One-to-Many  
**Foreign Key:** `subscription_invoices.subscription_id → subscription_orders._id`

**Description:**
- Mỗi subscription sinh ra nhiều invoices theo billing cycle
- Invoice được tạo tự động theo recurring schedule
- Ví dụ: Monthly subscription → 12 invoices/year

**Example Flow:**

```
1. Customer subscribes to HRM Pro (Monthly)
   → subscription_order created
   
2. System generates invoices:
   → Invoice #1: Jan 2024 - 2,990,000đ
   → Invoice #2: Feb 2024 - 2,990,000đ
   → Invoice #3: Mar 2024 - 2,990,000đ
   ...

3. Customer upgrades to Enterprise
   → New subscription_order created
   → Proration invoice generated
   → Old subscription marked as 'upgraded'
```

---

## 🔄 Data Flow Diagrams

### Flow 1: Create Product & Subscribe

```
┌──────────┐
│  Admin   │
└────┬─────┘
     │
     │ 1. Create Product
     ▼
┌─────────────────┐
│  saas_products  │
│  (HRM Pro)      │
└────┬────────────┘
     │
     │ 2. Optional: Create Packages
     ▼
┌─────────────────┐
│ service_packages│
│ (Starter, Pro)  │
└─────────────────┘

┌──────────┐
│ Customer │
└────┬─────┘
     │
     │ 3. Select Product
     │ 4. Create Subscription
     ▼
┌──────────────────────┐
│ subscription_orders  │
│ + product_snapshot   │
└────┬─────────────────┘
     │
     │ 5. Generate Invoices
     ▼
┌──────────────────────┐
│ subscription_invoices│
└──────────────────────┘
```

### Flow 2: Product Price Update (No Impact on Existing Subscriptions)

```
┌──────────┐
│  Admin   │
└────┬─────┘
     │
     │ 1. Update Product Price
     │    Old: 2,990,000đ
     │    New: 3,490,000đ
     ▼
┌─────────────────────┐
│  saas_products      │
│  base_price: 3.49M  │
│  version: 2         │
└─────────────────────┘
     │
     │ 2. New subscriptions use new price
     │
     ▼
┌──────────────────────────┐
│ New Subscription Orders  │
│ amount: 3,490,000đ       │
│ product_snapshot.price:  │
│   3,490,000đ             │
└──────────────────────────┘

┌──────────────────────────┐
│ Old Subscription Orders  │
│ amount: 2,990,000đ       │  ← Không thay đổi
│ product_snapshot.price:  │
│   2,990,000đ             │
└──────────────────────────┘
```

---

## 📐 Cardinality Summary

| Relationship | From | To | Type | Cardinality |
|--------------|------|-----|------|-------------|
| Tenant owns Products | tenants | saas_products | Strong | 1:N |
| Product has Type | system_categories | saas_products | Weak (Soft FK) | 1:N |
| Product has Packages | saas_products | service_packages | Strong | 1:N |
| Product has Orders | saas_products | subscription_orders | Strong | 1:N |
| Order has Invoices | subscription_orders | subscription_invoices | Strong | 1:N |

---

## 🔐 Referential Integrity

### Strong Foreign Keys (ON DELETE CASCADE)

```sql
-- Tenant → Products
ALTER TABLE saas_products 
ADD CONSTRAINT fk_product_tenant 
FOREIGN KEY (tenant_id) REFERENCES tenants(_id) 
ON DELETE CASCADE;

-- Product → Packages
ALTER TABLE service_packages 
ADD CONSTRAINT fk_package_product 
FOREIGN KEY (saas_product_id) REFERENCES saas_products(_id) 
ON DELETE CASCADE;
```

### Soft Foreign Keys (ON DELETE RESTRICT)

```sql
-- Product → Orders (Cannot delete product with active orders)
ALTER TABLE subscription_orders 
ADD CONSTRAINT fk_order_product 
FOREIGN KEY (product_id) REFERENCES saas_products(_id) 
ON DELETE RESTRICT;
```

### No Foreign Keys (Soft Reference)

```sql
-- Product Type (Referenced by code, not ID)
-- No foreign key constraint
-- Allows flexibility in system_categories
```

---

## 🎯 Indexing Strategy

### Primary Keys
```sql
-- All tables use UUID v7 as primary key
CREATE TABLE saas_products (
  _id UUID PRIMARY KEY DEFAULT uuid_generate_v7()
);
```

### Foreign Key Indexes
```sql
-- Index on tenant_id for multi-tenant queries
CREATE INDEX idx_products_tenant ON saas_products (tenant_id);

-- Index on product_id in orders
CREATE INDEX idx_orders_product ON subscription_orders (product_id);

-- Index on subscription_id in invoices
CREATE INDEX idx_invoices_subscription ON subscription_invoices (subscription_id);
```

### Unique Indexes
```sql
-- Unique code per tenant
CREATE UNIQUE INDEX idx_products_tenant_code 
ON saas_products (tenant_id, code) 
WHERE deleted_at IS NULL;
```

### Composite Indexes
```sql
-- Filter by tenant and status
CREATE INDEX idx_products_tenant_status 
ON saas_products (tenant_id, status) 
WHERE deleted_at IS NULL;

-- Filter active products by type
CREATE INDEX idx_products_type_status 
ON saas_products (product_type_code, status) 
WHERE deleted_at IS NULL AND status = 'active';
```

### JSONB Indexes (GIN)
```sql
-- Query features
CREATE INDEX idx_products_features 
ON saas_products USING GIN (features);

-- Query limits
CREATE INDEX idx_products_limits 
ON saas_products USING GIN (limits);

-- Query metadata
CREATE INDEX idx_products_metadata 
ON saas_products USING GIN (metadata);
```

---

## 🔍 Query Examples

### 1. Get all products of a tenant with their packages

```sql
SELECT 
  p.*,
  json_agg(sp.*) AS packages
FROM saas_products p
LEFT JOIN service_packages sp ON sp.saas_product_id = p._id
WHERE p.tenant_id = :tenant_id
  AND p.deleted_at IS NULL
GROUP BY p._id
ORDER BY p.display_order ASC;
```

### 2. Get product with active subscriptions count

```sql
SELECT 
  p.*,
  COUNT(so._id) FILTER (WHERE so.status = 'active') AS active_subscriptions,
  SUM(so.amount) AS total_revenue
FROM saas_products p
LEFT JOIN subscription_orders so ON so.product_id = p._id
WHERE p.deleted_at IS NULL
GROUP BY p._id
ORDER BY active_subscriptions DESC;
```

### 3. Get products by feature

```sql
-- Find products with 'payroll' feature enabled
SELECT * FROM saas_products
WHERE features @> '{"payroll": true}'
  AND deleted_at IS NULL;

-- Find products with max_employees >= 100
SELECT * FROM saas_products
WHERE (limits->>'max_employees')::int >= 100
  AND deleted_at IS NULL;
```

### 4. Get product with full subscription history

```sql
SELECT 
  p.*,
  json_build_object(
    'total_subscriptions', COUNT(so._id),
    'active_subscriptions', COUNT(so._id) FILTER (WHERE so.status = 'active'),
    'total_revenue', SUM(so.amount),
    'recent_orders', json_agg(
      json_build_object(
        'id', so._id,
        'amount', so.amount,
        'status', so.status,
        'created_at', so.created_at
      ) ORDER BY so.created_at DESC
    ) FILTER (WHERE so._id IS NOT NULL)
  ) AS subscription_stats
FROM saas_products p
LEFT JOIN subscription_orders so ON so.product_id = p._id
WHERE p._id = :product_id
GROUP BY p._id;
```

---

## 🛡️ Data Integrity Rules

### 1. Soft Delete Cascade

```sql
-- When tenant is deleted, soft delete all products
CREATE OR REPLACE FUNCTION soft_delete_tenant_products()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    UPDATE saas_products 
    SET deleted_at = NEW.deleted_at, deleted_by = NEW.deleted_by
    WHERE tenant_id = NEW._id AND deleted_at IS NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_soft_delete_tenant_products
AFTER UPDATE ON tenants
FOR EACH ROW
EXECUTE FUNCTION soft_delete_tenant_products();
```

### 2. Prevent Delete Active Products

```sql
-- Cannot delete product with active subscriptions
CREATE OR REPLACE FUNCTION prevent_delete_active_product()
RETURNS TRIGGER AS $$
DECLARE
  active_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO active_count
  FROM subscription_orders
  WHERE product_id = OLD._id AND status = 'active';
  
  IF active_count > 0 THEN
    RAISE EXCEPTION 'Cannot delete product with % active subscriptions', active_count;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_delete_active_product
BEFORE DELETE ON saas_products
FOR EACH ROW
EXECUTE FUNCTION prevent_delete_active_product();
```

### 3. Audit Trail

```sql
-- Log all product changes
CREATE TABLE saas_products_audit (
  audit_id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  product_id UUID NOT NULL,
  action VARCHAR(10) NOT NULL,  -- INSERT, UPDATE, DELETE
  old_data JSONB,
  new_data JSONB,
  changed_by UUID,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION log_product_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO saas_products_audit (product_id, action, new_data, changed_by)
    VALUES (NEW._id, 'INSERT', row_to_json(NEW), NEW.created_by);
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO saas_products_audit (product_id, action, old_data, new_data, changed_by)
    VALUES (NEW._id, 'UPDATE', row_to_json(OLD), row_to_json(NEW), NEW.updated_by);
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO saas_products_audit (product_id, action, old_data)
    VALUES (OLD._id, 'DELETE', row_to_json(OLD));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_log_product_changes
AFTER INSERT OR UPDATE OR DELETE ON saas_products
FOR EACH ROW
EXECUTE FUNCTION log_product_changes();
```

---

## 📚 Related Documentation

- [Products Schema Documentation](./PRODUCTS_SCHEMA.md)
- [Products API Documentation](./PRODUCTS_API.md)
- [Products Use Cases](./PRODUCTS_USECASES.md)
- [UI Components Documentation](./PRODUCTS_UI_COMPONENTS.md)
- [Database Design](./Database.md)

---

**Version:** 1.0.0  
**Last Updated:** 2025-01-13  
**Maintainer:** VHV Platform Team
