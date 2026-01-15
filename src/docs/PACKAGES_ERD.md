# Service Packages - Entity Relationship Diagram (ERD)

## 📋 Overview

ERD documentation for **Service Packages** module and relationships with other entities.

---

## 🗺️ Complete ERD Diagram

```
┌──────────────────────────────────┐
│       saas_products              │
├──────────────────────────────────┤
│ PK  _id              UUID        │
│     tenant_id        UUID        │
│     code             VARCHAR(50) │
│     name             TEXT        │
│     base_price       NUMERIC     │
│     ...                          │
└──────────────────────────────────┘
           │ 1
           │
           │ N
           ▼
┌──────────────────────────────────┐
│     service_packages             │
├──────────────────────────────────┤
│ PK  _id              UUID        │
│ FK  saas_product_id  UUID        │ → saas_products._id
│ UK  code             VARCHAR(50) │
│     name             VARCHAR(255)│
│     price_amount     NUMERIC     │
│     currency_code    VARCHAR(3)  │
│     entitlements     JSONB       │
│     status           VARCHAR(20) │
│     is_public        BOOLEAN     │
│     display_order    INTEGER     │
│     trial_days       INTEGER     │
│     billing_cycle    VARCHAR(20) │
│     max_users        INTEGER     │
│     max_storage      INTEGER     │
│     features         JSONB       │
│     metadata         JSONB       │
│     version          BIGINT      │
│     ...                          │
└──────────────────────────────────┘
           │ 1
           │
           │ N
           ▼
┌──────────────────────────────────┐
│   tenant_subscriptions           │
├──────────────────────────────────┤
│ PK  _id              UUID        │
│ FK  tenant_id        UUID        │
│ FK  package_id       UUID        │ → service_packages._id
│     package_snapshot JSONB       │
│     price_amount     NUMERIC     │
│     currency_code    VARCHAR(3)  │
│     start_date       TIMESTAMP   │
│     end_date         TIMESTAMP   │
│     status           VARCHAR(20) │
│     ...                          │
└──────────────────────────────────┘
```

---

## 📊 Key Relationships

### 1. saas_products → service_packages (1:N)

**Type:** One-to-Many  
**FK:** `service_packages.saas_product_id → saas_products._id`

**Description:**
- One product can have multiple packages (tiers)
- Each package belongs to exactly one product

**Example:**
```
HRM Product
├── HRM Starter Package
├── HRM Professional Package
└── HRM Enterprise Package
```

---

### 2. service_packages → tenant_subscriptions (1:N)

**Type:** One-to-Many  
**FK:** `tenant_subscriptions.package_id → service_packages._id`

**Description:**
- One package can be used by many tenants
- Package snapshot preserved in subscription

**Snapshot Strategy:**
```json
{
  "package_snapshot": {
    "code": "hrm-pro",
    "name": "HRM Professional",
    "price_amount": 2990000,
    "entitlements_config": {...}
  }
}
```

---

## 🔍 Indexes

```sql
-- Product packages
CREATE INDEX idx_packages_product ON service_packages (saas_product_id);

-- Code lookup
CREATE UNIQUE INDEX idx_packages_code ON service_packages (code);

-- Public active packages
CREATE INDEX idx_packages_active_public ON service_packages (status, is_public);

-- Entitlements search
CREATE INDEX idx_packages_entitlements ON service_packages USING GIN (entitlements_config);
```

---

## 📚 Related Documentation

- [Packages Schema](./PACKAGES_SCHEMA.md)
- [Packages API](./PACKAGES_API.md)
- [Products ERD](./PRODUCTS_ERD.md)

---

**Version:** 1.0.0  
**Last Updated:** 2025-01-13  
**Maintainer:** VHV Platform Team
