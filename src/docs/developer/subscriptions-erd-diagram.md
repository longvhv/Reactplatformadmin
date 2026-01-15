# 📊 Tenant Subscriptions - Entity Relationship Diagram (ERD)

## Overview

This document provides comprehensive ERD documentation for the **Tenant Subscriptions** module, showing relationships with Tenants, Service Packages, and Products.

**Version:** 1.0.0  
**Last Updated:** January 2024

---

## Complete ERD

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         SUBSCRIPTION MANAGEMENT SYSTEM                              │
│                         Entity Relationship Diagram                                 │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐                ┌────────────────────────────────┐                ┌──────────────────────┐
│     PRODUCTS         │                │    SERVICE_PACKAGES            │                │      TENANTS         │
├──────────────────────┤                ├────────────────────────────────┤                ├──────────────────────┤
│ _id (PK)             │                │ _id (PK)                       │                │ _id (PK)             │
│ code (UK)            │◄───────────────┤ product_id (FK) ───────────────┤                │ code (UK)            │
│ name                 │       1        │ code (UK)                      │                │ name                 │
│ description          │       :        │ name                           │         1      │ slug (UK)            │
│ category             │       N        │ description                    │         :      │ status               │
│ is_active            │                │ price                          │         N      │ tier                 │
│ version              │                │ currency                       │                │ max_users            │
│ created_at           │                │ billing_cycle                  │                │ settings             │
│ updated_at           │                │ entitlements_config (JSONB)    │                │ version              │
│ deleted_at           │                │ is_active                      │                │ created_at           │
└──────────────────────┘                │ version                        │                │ updated_at           │
                                        │ created_at                     │                │ deleted_at           │
                                        │ updated_at                     │                └──────────────────────┘
                                        │ deleted_at                     │                          │
                                        └────────────────────────────────┘                          │
                                                    │                                               │
                                                    │ 1                                             │
                                                    │                                               │
                                                    │                                               │
                                                    │ N                                             │ 1
                                                    ▼                                               ▼
                                        ┌────────────────────────────────────────────────────────────────┐
                                        │           TENANT_SUBSCRIPTIONS (Central Table)                 │
                                        ├────────────────────────────────────────────────────────────────┤
                                        │ _id (PK)                                                       │
                                        │ tenant_id (FK) ────────────────────────────────────────────────┤
                                        │ package_id (FK) ───────────────────────────────────────────────┤
                                        │                                                                │
                                        │ -- FINANCIAL SNAPSHOT (Immutable)                              │
                                        │ price_amount (NUMERIC)  ←── Snapshot from service_packages     │
                                        │ currency_code (VARCHAR) ←── Snapshot from service_packages     │
                                        │                                                                │
                                        │ -- ENTITLEMENTS SNAPSHOT (Immutable)                           │
                                        │ granted_entitlements (JSONB) ←── Snapshot from packages        │
                                        │ granted_app_codes (TEXT[])   ←── GENERATED from JSONB          │
                                        │                                                                │
                                        │ -- LIFECYCLE MANAGEMENT                                        │
                                        │ start_at (TIMESTAMPTZ)                                         │
                                        │ end_at (TIMESTAMPTZ)     ←── NULL = Lifetime                   │
                                        │ status (VARCHAR)         ←── ACTIVE/EXPIRED/CANCELLED/PAST_DUE │
                                        │                                                                │
                                        │ -- AUDIT & VERSION                                             │
                                        │ version (BIGINT)         ←── Optimistic locking                │
                                        │ created_at (TIMESTAMPTZ)                                       │
                                        │ updated_at (TIMESTAMPTZ)                                       │
                                        │ deleted_at (TIMESTAMPTZ) ←── Soft delete                       │
                                        └────────────────────────────────────────────────────────────────┘
                                                                │
                                                                │
                                        ┌───────────────────────┴────────────────────────┐
                                        │                                                │
                                        ▼ 3 INDEXES                                      │
                        ┌─────────────────────────────────────┐                          │
                        │  idx_subs_granted_apps (GIN)        │                          │
                        │  ON granted_app_codes               │                          │
                        │  Purpose: Ultra-fast access checks  │                          │
                        │  Query: WHERE 'APP' = ANY(...)      │                          │
                        │  Speed: < 1ms                       │                          │
                        └─────────────────────────────────────┘                          │
                                                                                         │
                        ┌─────────────────────────────────────┐                          │
                        │  idx_subs_tenant_active (Partial)   │                          │
                        │  ON tenant_id                       │                          │
                        │  WHERE status='ACTIVE' AND          │                          │
                        │        deleted_at IS NULL           │                          │
                        │  Purpose: Tenant active subs        │                          │
                        └─────────────────────────────────────┘                          │
                                                                                         │
                        ┌─────────────────────────────────────┐                          │
                        │  idx_subs_expiry_scan (Partial)     │                          │
                        │  ON (status, end_at)                │                          │
                        │  WHERE end_at IS NOT NULL           │                          │
                        │  Purpose: Expiry scanning           │                          │
                        └─────────────────────────────────────┘                          │
                                                                                         │
                                        ┌────────────────────────────────────────────────┘
                                        │
                                        ▼ FUTURE TABLES (Not implemented yet)
                        ┌─────────────────────────────────────┐
                        │  SUBSCRIPTION_ORDERS                │
                        │  _id (PK)                           │
                        │  tenant_id (FK)                     │
                        │  package_id (FK)                    │
                        │  order_number (UK)                  │
                        │  total_amount                       │
                        │  status                             │
                        │  package_snapshot (JSONB)           │
                        └─────────────────────────────────────┘
```

---

## Detailed Entity Definitions

### 1. PRODUCTS (Referenced Entity)

**Purpose:** Master catalog of product offerings

| Column | Type | Key | Nullable | Description |
|--------|------|-----|----------|-------------|
| _id | UUID | PK | No | Product ID |
| code | VARCHAR | UK | No | Unique product code (e.g., "BUSINESS_SUITE") |
| name | VARCHAR | - | No | Display name |
| description | TEXT | - | Yes | Product description |
| category | VARCHAR | - | Yes | Product category |
| is_active | BOOLEAN | - | No | Active status |

**Relationships:**

- **1:N** with `service_packages` (One product has many packages)

---

### 2. SERVICE_PACKAGES (Referenced Entity)

**Purpose:** Pricing tiers and entitlement configurations

| Column | Type | Key | Nullable | Description |
|--------|------|-----|----------|-------------|
| _id | UUID | PK | No | Package ID |
| product_id | UUID | FK | No | → products._id |
| code | VARCHAR | UK | No | Package code (e.g., "ENT-ANNUAL") |
| name | VARCHAR | - | No | Package name |
| price | NUMERIC | - | No | Package price |
| currency | VARCHAR | - | No | Currency code (ISO 4217) |
| billing_cycle | VARCHAR | - | No | MONTHLY/QUARTERLY/ANNUAL/LIFETIME |
| entitlements_config | JSONB | - | No | Entitlements definition |
| is_active | BOOLEAN | - | No | Active status |

**Relationships:**

- **N:1** with `products` (Many packages belong to one product)
- **1:N** with `tenant_subscriptions` (One package has many subscriptions)

**Entitlements Config Example:**

```json
{
  "HRM_APP": {
    "max_users": 100,
    "features": ["attendance", "payroll"]
  },
  "CRM_APP": {
    "max_contacts": 5000
  }
}
```

---

### 3. TENANTS (Referenced Entity)

**Purpose:** Customer/tenant organizations

| Column | Type | Key | Nullable | Description |
|--------|------|-----|----------|-------------|
| _id | UUID | PK | No | Tenant ID |
| code | VARCHAR | UK | No | Unique tenant code |
| name | VARCHAR | - | No | Organization name |
| slug | VARCHAR | UK | No | URL slug |
| status | VARCHAR | - | No | ACTIVE/SUSPENDED/CHURNED |
| tier | VARCHAR | - | Yes | Customer tier |
| max_users | INTEGER | - | Yes | User limit |

**Relationships:**

- **1:N** with `tenant_subscriptions` (One tenant has many subscriptions)

---

### 4. TENANT_SUBSCRIPTIONS (Central Entity)

**Purpose:** Links tenants to packages with pricing/entitlements snapshot

| Column | Type | Key | Nullable | Default | Description |
|--------|------|-----|----------|---------|-------------|
| **Identity & Relations** |
| _id | UUID | PK | No | - | Subscription ID |
| tenant_id | UUID | FK | No | - | → tenants._id |
| package_id | UUID | FK | No | - | → service_packages._id |
| **Financial Snapshot** |
| price_amount | NUMERIC(19,4) | - | No | 0 | Snapshot from package |
| currency_code | VARCHAR(3) | - | No | 'VND' | Snapshot from package |
| **Entitlements Snapshot** |
| granted_entitlements | JSONB | - | No | '{}' | Snapshot from package |
| granted_app_codes | TEXT[] | GEN | No | - | Auto-generated from JSONB |
| **Lifecycle** |
| start_at | TIMESTAMPTZ | - | No | NOW() | Subscription start |
| end_at | TIMESTAMPTZ | - | Yes | NULL | Subscription end (NULL = lifetime) |
| status | VARCHAR(20) | - | No | 'ACTIVE' | Current status |
| **Audit** |
| version | BIGINT | - | No | 1 | Optimistic locking |
| created_at | TIMESTAMPTZ | - | No | NOW() | Record creation |
| updated_at | TIMESTAMPTZ | - | No | NOW() | Last modification |
| deleted_at | TIMESTAMPTZ | - | Yes | NULL | Soft delete timestamp |

**Relationships:**

- **N:1** with `tenants` (Many subscriptions belong to one tenant)
- **N:1** with `service_packages` (Many subscriptions reference one package)

---

## Relationship Cardinality

### Products ↔ Service Packages

```
┌──────────┐     1      ┌─────────────────┐
│ Products │─────<──────│ Service_Packages│
└──────────┘            └─────────────────┘
```

**Type:** One-to-Many  
**Constraint:** `service_packages.product_id → products._id`

- One product (e.g., "Business Suite") has multiple packages (Free, Starter, Pro, Enterprise)
- One package belongs to exactly one product

---

### Service Packages ↔ Tenant Subscriptions

```
┌─────────────────┐     1      ┌──────────────────────┐
│ Service_Packages│─────<──────│ Tenant_Subscriptions │
└─────────────────┘            └──────────────────────┘
```

**Type:** One-to-Many  
**Constraint:** `tenant_subscriptions.package_id → service_packages._id`

- One package can be subscribed to by many tenants
- One subscription references exactly one package (immutable snapshot)

**Important:** Subscription snapshots price/entitlements at purchase time

---

### Tenants ↔ Tenant Subscriptions

```
┌─────────┐     1      ┌──────────────────────┐
│ Tenants │─────<──────│ Tenant_Subscriptions │
└─────────┘            └──────────────────────┘
```

**Type:** One-to-Many  
**Constraint:** `tenant_subscriptions.tenant_id → tenants._id`

- One tenant can have multiple subscriptions (e.g., multiple products, upgrades, renewals)
- One subscription belongs to exactly one tenant

**Business Rule:** A tenant can have multiple ACTIVE subscriptions for different packages

---

## Snapshot Pattern (Critical!)

### Why Snapshots?

**Problem:** Package prices/entitlements change over time

```
Timeline:
2024-01-01: Package "Pro" costs $100, max_users=50
2024-06-01: Package "Pro" updated to $120, max_users=100
2024-12-01: What price did Customer A pay? What entitlements did they get?
```

**Solution:** Snapshot at subscription creation time

```sql
-- When creating subscription
INSERT INTO tenant_subscriptions (
  tenant_id, package_id,
  price_amount,        -- ← Copy from package.price
  currency_code,       -- ← Copy from package.currency
  granted_entitlements -- ← Copy from package.entitlements_config
) 
SELECT 
  $tenant_id,
  $package_id,
  sp.price,                    -- Snapshot current price
  sp.currency,                 -- Snapshot current currency
  sp.entitlements_config       -- Snapshot current entitlements
FROM service_packages sp
WHERE sp._id = $package_id;
```

**Result:**

```
┌─────────────────────┐              ┌──────────────────────────┐
│ service_packages    │              │ tenant_subscriptions     │
├─────────────────────┤              ├──────────────────────────┤
│ _id: pkg-123        │              │ package_id: pkg-123      │
│ price: 120 (NEW)    │              │ price_amount: 100 (OLD)  │◄─ Snapshot!
│ entitlements: {...} │  CREATE      │ granted_entitlements     │◄─ Snapshot!
└─────────────────────┘  ────────►   └──────────────────────────┘
                         2024-01-01   Preserves what customer
                                      actually purchased
```

**Benefits:**

1. ✅ Historical pricing preserved
2. ✅ Customer gets exactly what they paid for
3. ✅ No retroactive entitlement changes
4. ✅ Audit trail complete
5. ✅ Billing disputes impossible

---

## Generated Column Pattern

### The Problem

**Slow Query (without generated column):**

```sql
-- Check if tenant has HRM_APP access
SELECT * FROM tenant_subscriptions
WHERE tenant_id = '...'
AND granted_entitlements ? 'HRM_APP';  -- JSONB operator

-- Problem: Sequential scan on JSONB, very slow
```

### The Solution: Generated Column + GIN Index

```sql
-- Define generated column
granted_app_codes TEXT[] GENERATED ALWAYS AS (
    ARRAY(SELECT jsonb_object_keys(granted_entitlements))
) STORED

-- Add GIN index
CREATE INDEX idx_subs_granted_apps 
ON tenant_subscriptions USING GIN (granted_app_codes);
```

**How it works:**

```
JSONB:                         Generated Array:
{                              ['HRM_APP', 'CRM_APP', 'FINANCE_APP']
  "HRM_APP": {...},               ↑
  "CRM_APP": {...},    ───────────┘
  "FINANCE_APP": {...}    Auto-extracted by PostgreSQL
}
```

**Fast Query (with generated column):**

```sql
-- Ultra-fast access check
SELECT * FROM tenant_subscriptions
WHERE tenant_id = '...'
AND 'HRM_APP' = ANY(granted_app_codes);  -- Uses GIN index!

-- Performance: < 1ms with millions of rows
```

**Visualization:**

```
┌────────────────────────────────────────────────────┐
│ tenant_subscriptions Table                         │
├────────────────────────────────────────────────────┤
│ _id: sub-123                                       │
│ granted_entitlements: {"HRM_APP":{...}, "CRM":{...}}│
│                          │                         │
│                          │ PostgreSQL auto-extracts│
│                          ▼                         │
│ granted_app_codes: ['HRM_APP', 'CRM_APP']          │◄─── GIN INDEX
│                          │                         │
│                          └─ Fast lookups!          │
└────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

### Subscription Creation Flow

```
┌─────────┐                ┌──────────────┐                ┌──────────────────┐
│ Tenant  │                │   Package    │                │  Subscription    │
│ (Input) │                │   (Source)   │                │   (Created)      │
└────┬────┘                └──────┬───────┘                └────────┬─────────┘
     │                            │                                 │
     │ 1. Select package          │                                 │
     ├────────────────────────────►                                 │
     │                            │                                 │
     │                            │ 2. Read package details         │
     │                            ├─────────────────────────────────►
     │                            │   - price                       │
     │                            │   - currency                    │
     │                            │   - entitlements_config         │
     │                            │                                 │
     │                            │ 3. CREATE subscription          │
     │                            │    WITH snapshots:              │
     │                            │    ├─ price_amount ← price      │
     │                            │    ├─ currency_code ← currency  │
     │                            │    └─ granted_entitlements ←    │
     │                            │       entitlements_config       │
     │                            │                                 │
     │                            │ 4. PostgreSQL auto-generates:   │
     │                            │    granted_app_codes[]          │
     │                            │                                 │
     │ 5. Subscription created    │                                 │
     │◄───────────────────────────┴─────────────────────────────────┤
     │   {                                                          │
     │     price_amount: [snapshot],                                │
     │     granted_entitlements: [snapshot],                        │
     │     granted_app_codes: [auto-generated]                      │
     │   }                                                          │
     │                                                              │
```

---

### Access Control Check Flow

```
┌──────────┐            ┌──────────────────────┐            ┌─────────────┐
│ API Call │            │ tenant_subscriptions │            │  GIN Index  │
└────┬─────┘            └──────────┬───────────┘            └──────┬──────┘
     │                             │                               │
     │ Check: Does tenant X        │                               │
     │ have access to HRM_APP?     │                               │
     ├─────────────────────────────►                               │
     │                             │                               │
     │                             │ Query:                        │
     │                             │ WHERE tenant_id = X           │
     │                             │ AND 'HRM_APP' = ANY(          │
     │                             │   granted_app_codes           │
     │                             │ )                             │
     │                             ├───────────────────────────────►
     │                             │                               │
     │                             │   GIN Index lookup            │
     │                             │   (< 1ms)                     │
     │                             │◄──────────────────────────────┤
     │                             │                               │
     │ Response: TRUE/FALSE        │                               │
     │◄────────────────────────────┤                               │
     │                             │                               │
```

---

## Index Strategy Visualization

### 1. GIN Index on granted_app_codes

```
Table:                          GIN Index:
┌─────────────────────────┐     ┌──────────────────────────┐
│ Subscription A          │     │ 'HRM_APP' → [A, B, D]    │
│ granted_app_codes:      │────►│ 'CRM_APP' → [A, C]       │
│ ['HRM_APP', 'CRM_APP']  │     │ 'FINANCE' → [B, D]       │
├─────────────────────────┤     └──────────────────────────┘
│ Subscription B          │            │
│ granted_app_codes:      │────────────┘
│ ['HRM_APP', 'FINANCE']  │
├─────────────────────────┤
│ Subscription C          │
│ granted_app_codes:      │
│ ['CRM_APP']             │
└─────────────────────────┘

Query: WHERE 'HRM_APP' = ANY(granted_app_codes)
→ Index lookup: 'HRM_APP' → [A, B, D]
→ Result: Subscriptions A, B, D (instant!)
```

---

### 2. Partial Index on tenant_id (Active Only)

```
All Subscriptions:              Partial Index (Active Only):
┌─────────────────────┐         ┌─────────────────────┐
│ Sub A: ACTIVE       │────────►│ Tenant X → [A, C]   │
│ tenant_id: X        │         │ Tenant Y → [D]      │
├─────────────────────┤         └─────────────────────┘
│ Sub B: CANCELLED    │         (Not in index)
│ tenant_id: X        │         
├─────────────────────┤         
│ Sub C: ACTIVE       │────────►(In index)
│ tenant_id: X        │
├─────────────────────┤
│ Sub D: ACTIVE       │────────►(In index)
│ tenant_id: Y        │
└─────────────────────┘

Benefits:
- 5-10x smaller than full index
- Only indexes what we query most
- Faster lookups
```

---

### 3. Partial Index on Expiry (Non-Lifetime Only)

```
All Subscriptions:              Partial Index (end_at NOT NULL):
┌─────────────────────┐         ┌──────────────────────────┐
│ Sub A: end_at NULL  │         (Not in index - lifetime)  │
│ (Lifetime)          │         
├─────────────────────┤         
│ Sub B:              │────────►│ ACTIVE, 2024-12-31 → B   │
│ end_at: 2024-12-31  │         │ ACTIVE, 2025-06-30 → C   │
├─────────────────────┤         │ EXPIRED, 2024-01-15 → D  │
│ Sub C:              │────────►└──────────────────────────┘
│ end_at: 2025-06-30  │
├─────────────────────┤
│ Sub D:              │────────►(In index)
│ end_at: 2024-01-15  │
└─────────────────────┘

Perfect for:
- Expiry scanning background jobs
- Finding soon-to-expire subscriptions
```

---

## Constraints Visualization

### Foreign Key Constraints

```
┌─────────────────────┐
│   tenants           │
│   _id: tenant-123   │◄────────┐
└─────────────────────┘         │
                                │ FK: tenant_id
                                │
┌─────────────────────────────────────────┐
│   tenant_subscriptions                  │
│   tenant_id: tenant-123 ────────────────┤
│   package_id: pkg-456 ──────────────────┼─────┐
└─────────────────────────────────────────┘     │
                                                │ FK: package_id
                                                │
                                ┌───────────────▼─────────┐
                                │ service_packages        │
                                │ _id: pkg-456            │
                                └─────────────────────────┘

Rules:
- Cannot insert subscription with invalid tenant_id
- Cannot insert subscription with invalid package_id
- Cannot delete tenant/package if subscriptions exist (default NO ACTION)
```

---

### Check Constraints

```
┌─────────────────────────────────────────────────────────┐
│ tenant_subscriptions                                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ price_amount: 1000000                                   │
│ ↓                                                       │
│ CHECK (price_amount >= 0) ✅                           │
│                                                         │
│ status: 'ACTIVE'                                        │
│ ↓                                                       │
│ CHECK (status IN ('ACTIVE', 'EXPIRED',                  │
│                   'CANCELLED', 'PAST_DUE')) ✅         │
│                                                         │
│ start_at: 2024-01-01                                    │
│ end_at: 2025-01-01                                      │
│ ↓                                                       │
│ CHECK (end_at IS NULL OR end_at > start_at) ✅         │
│                                                         │
└─────────────────────────────────────────────────────────┘

Example violations:
❌ price_amount = -100         → Rejected
❌ status = 'INVALID'          → Rejected
❌ end_at = 2023-01-01         → Rejected (before start_at)
   start_at = 2024-01-01
```

---

## Complete Relationship Summary

| From Table | To Table | Relationship | Cardinality | Constraint |
|------------|----------|--------------|-------------|------------|
| tenant_subscriptions | tenants | Many-to-One | N:1 | fk_subs_tenant |
| tenant_subscriptions | service_packages | Many-to-One | N:1 | fk_subs_package |
| service_packages | products | Many-to-One | N:1 | fk_package_product |

**Data Flow:**

```
Product → Packages → Subscriptions → Tenants
  1    :    N      :     N         :    1

Example:
"Business Suite" (1 Product)
  └─ "Free Plan" (Package 1)
  │   └─ 100 subscriptions → 100 tenants
  └─ "Pro Plan" (Package 2)
      └─ 50 subscriptions → 50 tenants
```

---

## SQL View for Common Joins

### Subscription Detail View

```sql
CREATE VIEW v_subscription_details AS
SELECT 
    ts._id,
    ts.tenant_id,
    ts.package_id,
    ts.price_amount,
    ts.currency_code,
    ts.granted_entitlements,
    ts.granted_app_codes,
    ts.start_at,
    ts.end_at,
    ts.status,
    
    -- Tenant details
    t.code as tenant_code,
    t.name as tenant_name,
    t.status as tenant_status,
    
    -- Package details
    sp.code as package_code,
    sp.name as package_name,
    sp.billing_cycle,
    
    -- Product details
    p.code as product_code,
    p.name as product_name,
    p.category as product_category,
    
    -- Computed fields
    CASE 
        WHEN ts.end_at IS NULL THEN 'Lifetime'
        WHEN ts.end_at > NOW() THEN 'Active'
        ELSE 'Expired'
    END as subscription_type,
    
    EXTRACT(DAY FROM (ts.end_at - NOW()))::int as days_remaining,
    EXTRACT(DAY FROM (NOW() - ts.start_at))::int as days_active
    
FROM tenant_subscriptions ts
JOIN tenants t ON ts.tenant_id = t._id
JOIN service_packages sp ON ts.package_id = sp._id
JOIN products p ON sp.product_id = p._id
WHERE ts.deleted_at IS NULL;
```

**Usage:**

```sql
-- Simple query with all joined data
SELECT * FROM v_subscription_details
WHERE tenant_code = 'ACME_CORP';
```

---

**ERD Version:** 1.0.0  
**Diagram Tool:** ASCII Art (for portability)  
**Last Updated:** January 2024  
**Maintained By:** Platform Team
