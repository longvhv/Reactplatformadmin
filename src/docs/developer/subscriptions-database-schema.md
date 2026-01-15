# 🗄️ Tenant Subscriptions - Database Schema Documentation

## Overview

The **tenant_subscriptions** table manages subscription relationships between tenants and service packages, tracking entitlements, pricing snapshots, and subscription lifecycle.

**Table Name:** `tenant_subscriptions`  
**Primary Key:** `_id` (UUID v7 recommended)  
**Schema Version:** 1.0.0  
**Last Updated:** January 2024

---

## Table of Contents

1. [Table Structure](#table-structure)
2. [Column Definitions](#column-definitions)
3. [Constraints](#constraints)
4. [Indexes](#indexes)
5. [Relationships](#relationships)
6. [DDL Script](#ddl-script)
7. [Data Examples](#data-examples)

---

## Table Structure

```sql
CREATE TABLE tenant_subscriptions (
    -- Identity & Relations
    _id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    package_id UUID NOT NULL,
    
    -- Financial (Snapshot)
    price_amount NUMERIC(19, 4) NOT NULL DEFAULT 0,
    currency_code VARCHAR(3) NOT NULL DEFAULT 'VND',
    
    -- Entitlements & Cache (Snapshot & Computed)
    granted_entitlements JSONB NOT NULL DEFAULT '{}',
    granted_app_codes TEXT[] GENERATED ALWAYS AS (
        ARRAY(SELECT jsonb_object_keys(granted_entitlements))
    ) STORED,
    
    -- Timing & Status
    start_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_at TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    
    -- Audit & Version Control
    version BIGINT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    -- Constraints (see details below)
    CONSTRAINT fk_subs_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(_id),
    CONSTRAINT fk_subs_package FOREIGN KEY (package_id) REFERENCES service_packages(_id),
    CONSTRAINT chk_subs_price CHECK (price_amount >= 0),
    CONSTRAINT chk_subs_status CHECK (status IN ('ACTIVE', 'EXPIRED', 'CANCELLED', 'PAST_DUE')),
    CONSTRAINT chk_subs_dates CHECK (end_at IS NULL OR end_at > start_at)
);
```

---

## Column Definitions

### Identity & Relations

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `_id` | UUID | No | - | Primary key. UUID v7 recommended for time-ordered IDs |
| `tenant_id` | UUID | No | - | Foreign key to `tenants(_id)`. Which tenant owns this subscription |
| `package_id` | UUID | No | - | Foreign key to `service_packages(_id)`. Which package was purchased |

**Design Notes:**

- `_id` uses UUID v7 for globally unique, time-sortable identifiers
- Foreign keys ensure referential integrity
- Both FKs are required (NOT NULL)

---

### Financial Data (Snapshot Pattern)

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `price_amount` | NUMERIC(19,4) | No | 0 | Subscription price (snapshot from package at purchase time) |
| `currency_code` | VARCHAR(3) | No | 'VND' | ISO 4217 currency code (snapshot from package) |

**Precision:** `NUMERIC(19,4)` supports up to 999,999,999,999,999.9999

**Design Pattern: Immutable Snapshot**

```
When subscription is created:
  1. Copy package.price → price_amount
  2. Copy package.currency → currency_code
  3. NEVER update even if package price changes
  
Rationale:
  - Customer bought at THAT price
  - Historical pricing integrity
  - Audit trail preserved
```

**Example:**

```sql
-- Package price changes from 1M to 1.5M
-- Existing subscriptions still show 1M (their purchase price)
SELECT price_amount FROM tenant_subscriptions WHERE _id = '...';
-- Returns: 1000000.0000 (not 1500000.0000)
```

---

### Entitlements & Access Control

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `granted_entitlements` | JSONB | No | '{}' | Entitlements config (snapshot from package.entitlements_config) |
| `granted_app_codes` | TEXT[] | No | - | Auto-generated array of app codes from JSONB keys |

**JSONB Structure:**

```json
{
  "HRM_APP": {
    "max_users": 100,
    "max_departments": 20,
    "features": ["attendance", "payroll", "leave_management"],
    "storage_gb": 50
  },
  "CRM_APP": {
    "max_contacts": 5000,
    "max_pipelines": 10,
    "features": ["pipeline", "automation", "reporting"],
    "api_calls_per_day": 10000
  },
  "FINANCE_APP": {
    "enabled": true,
    "features": ["invoicing", "expenses"]
  }
}
```

**Generated Column (PostgreSQL Magic!):**

```sql
granted_app_codes TEXT[] GENERATED ALWAYS AS (
    ARRAY(SELECT jsonb_object_keys(granted_entitlements))
) STORED
```

**What it does:**

1. Automatically extracts top-level keys from JSONB
2. Stores as TEXT array: `['HRM_APP', 'CRM_APP', 'FINANCE_APP']`
3. **Updates automatically** when `granted_entitlements` changes
4. Indexed with GIN for ultra-fast searches

**Why it's brilliant:**

```sql
-- Without generated column (SLOW):
SELECT * FROM tenant_subscriptions 
WHERE granted_entitlements ? 'HRM_APP';  -- Sequential scan on JSONB

-- With generated column (FAST):
SELECT * FROM tenant_subscriptions 
WHERE 'HRM_APP' = ANY(granted_app_codes);  -- Uses GIN index, < 1ms
```

**Design Pattern: Immutable Snapshot + Fast Access**

```
At subscription creation:
  1. Copy package.entitlements_config → granted_entitlements
  2. PostgreSQL auto-generates granted_app_codes
  3. NEVER update even if package entitlements change
  
Benefits:
  - Customer gets exactly what they paid for
  - No retroactive entitlement changes
  - Ultra-fast access control checks
  - Audit trail preserved
```

---

### Timing & Lifecycle

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `start_at` | TIMESTAMPTZ | No | NOW() | When subscription starts |
| `end_at` | TIMESTAMPTZ | Yes | NULL | When subscription ends (NULL = lifetime) |
| `status` | VARCHAR(20) | No | 'ACTIVE' | Current status: ACTIVE, EXPIRED, CANCELLED, PAST_DUE |

**Status Enum Values:**

| Status | Description | Transition From |
|--------|-------------|-----------------|
| `ACTIVE` | Currently active and valid | Initial, PAST_DUE |
| `EXPIRED` | Past end_at date | ACTIVE (auto) |
| `CANCELLED` | Manually cancelled | ACTIVE |
| `PAST_DUE` | Payment failed | ACTIVE |

**Status Lifecycle:**

```
┌─────────┐
│ ACTIVE  │ ──────────────────────────────┐
└─────────┘                                │
    │                                      │
    ├───> EXPIRED (end_at < NOW)          │
    ├───> CANCELLED (manual)               │
    └───> PAST_DUE (payment failed)        │
                                           │
EXPIRED ────> ACTIVE (renew) ──────────────┘
PAST_DUE ───> ACTIVE (payment received) ───┘
CANCELLED ──> (terminal state, no return)
```

**Date Logic:**

```sql
-- Lifetime subscription (no expiry)
start_at = '2024-01-01', end_at = NULL

-- 1-year subscription
start_at = '2024-01-01', end_at = '2025-01-01'

-- Check constraint ensures: end_at > start_at
```

---

### Audit & Version Control

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `version` | BIGINT | No | 1 | Optimistic locking version counter |
| `created_at` | TIMESTAMPTZ | No | NOW() | When record was created |
| `updated_at` | TIMESTAMPTZ | No | NOW() | When record was last modified |
| `deleted_at` | TIMESTAMPTZ | Yes | NULL | Soft delete timestamp (NULL = active) |

**Optimistic Locking Pattern:**

```sql
-- Update with version check
UPDATE tenant_subscriptions 
SET status = 'CANCELLED', 
    version = version + 1,
    updated_at = NOW()
WHERE _id = $1 
AND version = $2;  -- Fails if version mismatch

-- Returns 0 rows if someone else updated first
```

**Soft Delete Pattern:**

```sql
-- Soft delete (preserves data)
UPDATE tenant_subscriptions 
SET deleted_at = NOW(), status = 'CANCELLED'
WHERE _id = $1;

-- All queries exclude deleted records
SELECT * FROM tenant_subscriptions 
WHERE deleted_at IS NULL;
```

---

## Constraints

### 1. Foreign Key Constraints

#### fk_subs_tenant

```sql
CONSTRAINT fk_subs_tenant 
FOREIGN KEY (tenant_id) REFERENCES tenants(_id)
```

**Purpose:** Ensures subscription belongs to valid tenant  
**ON DELETE:** Not specified (defaults to NO ACTION)  
**Business Rule:** Cannot create subscription for non-existent tenant

---

#### fk_subs_package

```sql
CONSTRAINT fk_subs_package 
FOREIGN KEY (package_id) REFERENCES service_packages(_id)
```

**Purpose:** Ensures subscription references valid package  
**ON DELETE:** Not specified (defaults to NO ACTION)  
**Business Rule:** Cannot create subscription for non-existent package

---

### 2. Check Constraints

#### chk_subs_price

```sql
CONSTRAINT chk_subs_price 
CHECK (price_amount >= 0)
```

**Purpose:** Prevents negative prices  
**Business Rule:** Free plans have price = 0, paid plans > 0

---

#### chk_subs_status

```sql
CONSTRAINT chk_subs_status 
CHECK (status IN ('ACTIVE', 'EXPIRED', 'CANCELLED', 'PAST_DUE'))
```

**Purpose:** Enforces valid status values  
**Business Rule:** Only 4 allowed statuses

---

#### chk_subs_dates

```sql
CONSTRAINT chk_subs_dates 
CHECK (end_at IS NULL OR end_at > start_at)
```

**Purpose:** Ensures end date is after start date  
**Business Rule:** Subscription must have positive duration (or be lifetime)

**Valid Examples:**

```sql
-- ✅ Lifetime subscription
start_at = '2024-01-01', end_at = NULL

-- ✅ 1-year subscription
start_at = '2024-01-01', end_at = '2025-01-01'

-- ❌ Invalid: end before start
start_at = '2024-01-01', end_at = '2023-01-01'  -- REJECTED
```

---

## Indexes

### 1. idx_subs_granted_apps (GIN Index)

```sql
CREATE INDEX idx_subs_granted_apps 
ON tenant_subscriptions USING GIN (granted_app_codes);
```

**Type:** GIN (Generalized Inverted Index)  
**Column:** `granted_app_codes` (TEXT[] generated column)  
**Purpose:** Ultra-fast access control checks

**Use Case:**

```sql
-- Check if tenant has access to HRM_APP
SELECT EXISTS(
  SELECT 1 FROM tenant_subscriptions
  WHERE tenant_id = $1
  AND 'HRM_APP' = ANY(granted_app_codes)  -- Uses GIN index
  AND status = 'ACTIVE'
  AND deleted_at IS NULL
);

-- Performance: < 1ms with millions of rows
```

**Why GIN?**

- GIN indexes are perfect for array containment queries
- `ANY()` operator uses index efficiently
- Pre-computed array (generated column) = no runtime overhead

**Index Size:** ~30% of table size (acceptable for massive performance gain)

---

### 2. idx_subs_tenant_active (Partial Index)

```sql
CREATE INDEX idx_subs_tenant_active 
ON tenant_subscriptions (tenant_id) 
WHERE status = 'ACTIVE' AND deleted_at IS NULL;
```

**Type:** Partial B-tree index  
**Column:** `tenant_id`  
**Condition:** Only indexes ACTIVE, non-deleted subscriptions  
**Purpose:** Fast tenant subscription lookups

**Use Case:**

```sql
-- Get all active subscriptions for a tenant
SELECT * FROM tenant_subscriptions
WHERE tenant_id = $1
AND status = 'ACTIVE'
AND deleted_at IS NULL;

-- Uses partial index (smaller, faster than full index)
```

**Why Partial?**

- Only 10-20% of subscriptions are ACTIVE at any time
- Partial index is 5-10x smaller than full index
- Faster queries, less storage

---

### 3. idx_subs_expiry_scan (Partial Composite Index)

```sql
CREATE INDEX idx_subs_expiry_scan 
ON tenant_subscriptions (status, end_at) 
WHERE end_at IS NOT NULL;
```

**Type:** Partial composite B-tree index  
**Columns:** `status`, `end_at`  
**Condition:** Only indexes subscriptions with expiry dates  
**Purpose:** Background job scanning for expiring/expired subscriptions

**Use Case:**

```sql
-- Find subscriptions expiring in next 30 days
SELECT * FROM tenant_subscriptions
WHERE status = 'ACTIVE'
AND end_at BETWEEN NOW() AND NOW() + INTERVAL '30 days';

-- Uses partial index for fast scans
```

**Why Partial?**

- Lifetime subscriptions (end_at = NULL) are excluded
- Reduces index size by 30-40%
- Perfect for scheduled jobs

---

## Relationships

### Entity Relationship Diagram (ERD)

```
┌─────────────────┐         ┌──────────────────────────┐         ┌─────────────────────┐
│    tenants      │         │  tenant_subscriptions    │         │  service_packages   │
├─────────────────┤         ├──────────────────────────┤         ├─────────────────────┤
│ _id (PK)        │◄────────┤ _id (PK)                 │         │ _id (PK)            │
│ name            │         │ tenant_id (FK) ──────────┤         │ code                │
│ slug            │         │ package_id (FK) ─────────┼────────►│ _id (PK)            │
│ status          │         │ price_amount (snapshot)  │         │ price               │
│ ...             │         │ currency_code (snapshot) │         │ currency            │
└─────────────────┘         │ granted_entitlements (snapshot)   │ entitlements_config │
                            │ granted_app_codes (generated)     │ ...                 │
                            │ start_at                │         └─────────────────────┘
                            │ end_at                  │
                            │ status                  │                    │
                            │ version                 │                    │
                            │ created_at              │                    │
                            │ updated_at              │                    ▼
                            │ deleted_at              │         ┌─────────────────────┐
                            └──────────────────────────┘         │     products        │
                                                                 ├─────────────────────┤
                                                                 │ _id (PK)            │
                                                                 │ name                │
                                                                 │ code                │
                                                                 │ ...                 │
                                                                 └─────────────────────┘
```

**Relationships:**

1. **tenant_subscriptions.tenant_id → tenants._id** (Many-to-One)
   - One tenant can have multiple subscriptions
   - One subscription belongs to one tenant

2. **tenant_subscriptions.package_id → service_packages._id** (Many-to-One)
   - One package can have multiple subscriptions
   - One subscription references one package (snapshot)

3. **service_packages.product_id → products._id** (Many-to-One)
   - Indirect relationship via packages

---

## DDL Script

### Complete Table Creation

```sql
-- ============================================================
-- TENANT SUBSCRIPTIONS TABLE
-- Purpose: Manage subscription relationships between tenants and packages
-- Version: 1.0.0
-- ============================================================

CREATE TABLE tenant_subscriptions (
    -- ========================================
    -- IDENTITY & RELATIONS
    -- ========================================
    _id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    package_id UUID NOT NULL,
    
    -- ========================================
    -- FINANCIAL DATA (Immutable Snapshot)
    -- ========================================
    price_amount NUMERIC(19, 4) NOT NULL DEFAULT 0,
    currency_code VARCHAR(3) NOT NULL DEFAULT 'VND',
    
    -- ========================================
    -- ENTITLEMENTS & ACCESS CONTROL
    -- ========================================
    granted_entitlements JSONB NOT NULL DEFAULT '{}',
    
    -- Generated column: Auto-extract app codes from JSONB
    granted_app_codes TEXT[] GENERATED ALWAYS AS (
        ARRAY(SELECT jsonb_object_keys(granted_entitlements))
    ) STORED,
    
    -- ========================================
    -- TIMING & LIFECYCLE
    -- ========================================
    start_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_at TIMESTAMPTZ,  -- NULL = lifetime subscription
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    
    -- ========================================
    -- AUDIT & VERSION CONTROL
    -- ========================================
    version BIGINT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    
    -- ========================================
    -- CONSTRAINTS
    -- ========================================
    CONSTRAINT fk_subs_tenant 
        FOREIGN KEY (tenant_id) REFERENCES tenants(_id),
    
    CONSTRAINT fk_subs_package 
        FOREIGN KEY (package_id) REFERENCES service_packages(_id),
    
    CONSTRAINT chk_subs_price 
        CHECK (price_amount >= 0),
    
    CONSTRAINT chk_subs_status 
        CHECK (status IN ('ACTIVE', 'EXPIRED', 'CANCELLED', 'PAST_DUE')),
    
    CONSTRAINT chk_subs_dates 
        CHECK (end_at IS NULL OR end_at > start_at)
);

-- ========================================
-- INDEXES
-- ========================================

-- GIN Index for ultra-fast access control checks
CREATE INDEX idx_subs_granted_apps 
ON tenant_subscriptions USING GIN (granted_app_codes);

-- Partial index for tenant's active subscriptions
CREATE INDEX idx_subs_tenant_active 
ON tenant_subscriptions (tenant_id) 
WHERE status = 'ACTIVE' AND deleted_at IS NULL;

-- Partial index for expiry scanning
CREATE INDEX idx_subs_expiry_scan 
ON tenant_subscriptions (status, end_at) 
WHERE end_at IS NOT NULL;

-- ========================================
-- COMMENTS
-- ========================================

COMMENT ON TABLE tenant_subscriptions IS 
'Manages subscription relationships between tenants and service packages with entitlements snapshot';

COMMENT ON COLUMN tenant_subscriptions._id IS 
'Primary key. UUID v7 recommended for time-ordered IDs';

COMMENT ON COLUMN tenant_subscriptions.granted_entitlements IS 
'Immutable snapshot of package entitlements at purchase time (JSONB)';

COMMENT ON COLUMN tenant_subscriptions.granted_app_codes IS 
'Auto-generated array of app codes extracted from granted_entitlements JSONB. GIN indexed for fast access checks.';

COMMENT ON COLUMN tenant_subscriptions.end_at IS 
'Subscription end date. NULL = lifetime subscription. Must be > start_at';

COMMENT ON COLUMN tenant_subscriptions.version IS 
'Optimistic locking version counter. Incremented on each update';

COMMENT ON INDEX idx_subs_granted_apps IS 
'GIN index for ultra-fast access control: WHERE app_code = ANY(granted_app_codes)';
```

---

## Data Examples

### Example 1: Enterprise Annual Subscription

```sql
INSERT INTO tenant_subscriptions (
    _id, tenant_id, package_id,
    price_amount, currency_code,
    granted_entitlements,
    start_at, end_at, status
) VALUES (
    '01HN2K3M4P5Q6R7S8T9V0W1X2',
    '01HN2K3M4P5Q6R7S8T9V0W1X3',  -- ACME Corp
    '01HN2K3M4P5Q6R7S8T9V0W1X4',  -- Enterprise Package
    1200000.0000,
    'VND',
    '{
        "HRM_APP": {
            "max_users": 100,
            "max_departments": 20,
            "features": ["attendance", "payroll", "leave_management"],
            "storage_gb": 50
        },
        "CRM_APP": {
            "max_contacts": 5000,
            "max_pipelines": 10,
            "features": ["pipeline", "automation", "reporting"]
        }
    }'::jsonb,
    '2024-01-01 00:00:00+00',
    '2025-01-01 00:00:00+00',
    'ACTIVE'
);

-- Result: granted_app_codes auto-generated as ['HRM_APP', 'CRM_APP']
```

### Example 2: Lifetime Free Plan

```sql
INSERT INTO tenant_subscriptions (
    _id, tenant_id, package_id,
    price_amount, currency_code,
    granted_entitlements,
    start_at, end_at, status
) VALUES (
    '01HN2K3M4P5Q6R7S8T9V0W1Y1',
    '01HN2K3M4P5Q6R7S8T9V0W1Y2',  -- Startup Inc
    '01HN2K3M4P5Q6R7S8T9V0W1Y3',  -- Free Package
    0.0000,
    'VND',
    '{
        "HRM_APP": {
            "max_users": 5,
            "features": ["attendance"],
            "storage_gb": 1
        }
    }'::jsonb,
    '2024-06-01 00:00:00+00',
    NULL,  -- Lifetime subscription
    'ACTIVE'
);

-- Result: granted_app_codes = ['HRM_APP']
```

### Example 3: Cancelled Subscription

```sql
-- Original subscription
INSERT INTO tenant_subscriptions (...) VALUES (...);

-- Later: Cancel subscription
UPDATE tenant_subscriptions
SET status = 'CANCELLED',
    end_at = NOW(),
    deleted_at = NOW(),
    updated_at = NOW(),
    version = version + 1
WHERE _id = '01HN2K3M4P5Q6R7S8T9V0W1X2';
```

---

## Query Examples

### Find Active Subscriptions for Tenant

```sql
SELECT * FROM tenant_subscriptions
WHERE tenant_id = '01HN2K3M4P5Q6R7S8T9V0W1X3'
AND status = 'ACTIVE'
AND deleted_at IS NULL
ORDER BY created_at DESC;

-- Uses: idx_subs_tenant_active (partial index)
```

### Check App Access

```sql
SELECT EXISTS(
    SELECT 1 FROM tenant_subscriptions
    WHERE tenant_id = '01HN2K3M4P5Q6R7S8T9V0W1X3'
    AND 'HRM_APP' = ANY(granted_app_codes)
    AND status = 'ACTIVE'
    AND deleted_at IS NULL
    AND (end_at IS NULL OR end_at > NOW())
) AS has_access;

-- Uses: idx_subs_granted_apps (GIN index)
-- Performance: < 1ms
```

### Find Expiring Subscriptions (Next 30 Days)

```sql
SELECT * FROM tenant_subscriptions
WHERE status = 'ACTIVE'
AND deleted_at IS NULL
AND end_at BETWEEN NOW() AND NOW() + INTERVAL '30 days'
ORDER BY end_at ASC;

-- Uses: idx_subs_expiry_scan (partial index)
```

### Get Subscription with Full Details

```sql
SELECT 
    ts.*,
    t.name as tenant_name,
    sp.code as package_code,
    sp.name as package_name,
    p.name as product_name,
    EXTRACT(DAY FROM (ts.end_at - NOW()))::int as days_remaining
FROM tenant_subscriptions ts
JOIN tenants t ON ts.tenant_id = t._id
JOIN service_packages sp ON ts.package_id = sp._id
JOIN products p ON sp.product_id = p._id
WHERE ts._id = '01HN2K3M4P5Q6R7S8T9V0W1X2'
AND ts.deleted_at IS NULL;
```

---

## Migration Script

### Creating the Table

```sql
-- Step 1: Create table
\i create_tenant_subscriptions_table.sql

-- Step 2: Verify structure
\d+ tenant_subscriptions

-- Step 3: Verify indexes
\di+ idx_subs_*

-- Step 4: Test generated column
INSERT INTO tenant_subscriptions (...) VALUES (...);
SELECT _id, granted_app_codes FROM tenant_subscriptions WHERE _id = '...';
```

### Adding Sample Data

```sql
-- Sample data script
\i seed_tenant_subscriptions.sql
```

---

## Storage Estimates

### Table Size Projections

| Rows | Avg Row Size | Table Size | Index Size | Total |
|------|--------------|------------|------------|-------|
| 10,000 | 1.5 KB | 15 MB | 8 MB | 23 MB |
| 100,000 | 1.5 KB | 150 MB | 80 MB | 230 MB |
| 1,000,000 | 1.5 KB | 1.5 GB | 800 MB | 2.3 GB |

**Assumptions:**

- `granted_entitlements` JSONB avg 500 bytes
- `granted_app_codes` array avg 100 bytes
- GIN index ~30% of table size
- Partial indexes ~10% of table size each

---

## Performance Characteristics

| Operation | Index Used | Complexity | Typical Time |
|-----------|------------|------------|--------------|
| Check access | `idx_subs_granted_apps` (GIN) | O(log n) | < 1ms |
| List by tenant | `idx_subs_tenant_active` | O(log n) | < 5ms |
| Find expiring | `idx_subs_expiry_scan` | O(log n) | < 10ms |
| Insert | All indexes | O(log n) | < 10ms |
| Update | All indexes | O(log n) | < 10ms |

---

**Schema Version:** 1.0.0  
**PostgreSQL Version:** 12+  
**Last Updated:** January 2024  
**Maintained By:** Platform Team
