# Tenants Module - Complete Database Schema Documentation

## 📋 Table of Contents
1. [Overview](#overview)
2. [Core Tables](#core-tables)
3. [Relationship Tables](#relationship-tables)
4. [Supporting Tables](#supporting-tables)
5. [Indexes](#indexes)
6. [Constraints](#constraints)
7. [Triggers & Functions](#triggers--functions)

---

## Overview

### Database Architecture
- **Primary Database:** PostgreSQL 14+ / YugabyteDB
- **Analytics Database:** ClickHouse (for logs)
- **Total Tables:** 13 core tables
- **Total Indexes:** 35+ indexes
- **Storage Engine:** Native PostgreSQL

### Design Principles
1. **Multi-tenancy:** Every table has `tenant_id` for isolation
2. **Soft Delete:** `deleted_at` timestamp for safe deletion
3. **Optimistic Locking:** `version` column for concurrency control
4. **Audit Trail:** `created_at`, `updated_at`, `created_by` tracking
5. **Flexibility:** JSONB fields for custom data
6. **Hierarchy:** Materialized path for tree structures

---

## Core Tables

### 1. TENANTS

**Purpose:** Main tenant entity for multi-tenant SaaS platform

```sql
CREATE TABLE tenants (
    -- I. IDENTITY & INFRASTRUCTURE
    _id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(64) NOT NULL,                    -- Subdomain/slug
    data_region VARCHAR(50) NOT NULL DEFAULT 'ap-southeast-1',
    compliance_level VARCHAR(20) NOT NULL DEFAULT 'STANDARD',
    parent_tenant_id UUID,                        -- Hierarchy support
    path TEXT,                                    -- Materialized path
    
    -- II. BUSINESS INFO & LOCALIZATION
    name TEXT NOT NULL,
    tier VARCHAR(50) NOT NULL DEFAULT 'FREE',
    billing_type VARCHAR(20) NOT NULL DEFAULT 'POSTPAID',
    timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
    
    -- III. DYNAMIC DATA (JSONB)
    profile JSONB NOT NULL DEFAULT '{}',          -- Company info
    settings JSONB NOT NULL DEFAULT '{}',         -- Configuration
    
    -- IV. STATUS & AUDIT
    status VARCHAR(20) NOT NULL DEFAULT 'TRIAL',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    version BIGINT NOT NULL DEFAULT 1,
    
    -- V. CONSTRAINTS
    CONSTRAINT uq_tenants_code UNIQUE (code),
    CONSTRAINT chk_tenants_code_fmt CHECK (code ~ '^[a-z0-9-]+$'),
    CONSTRAINT chk_tenants_tier CHECK (tier IN (
        'FREE', 'PRO', 'ENTERPRISE',
        'PARTNER_BASIC', 'PARTNER_PREMIUM', 'PARTNER_ELITE',
        'PROVIDER'
    )),
    CONSTRAINT fk_tenants_parent 
        FOREIGN KEY (parent_tenant_id) 
        REFERENCES tenants(_id) ON DELETE SET NULL,
    CONSTRAINT chk_tenants_status 
        CHECK (status IN ('TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELLED')),
    CONSTRAINT chk_tenants_region 
        CHECK (data_region IN ('ap-southeast-1', 'us-east-1', 'eu-central-1')),
    CONSTRAINT chk_tenants_compliance 
        CHECK (compliance_level IN ('STANDARD', 'GDPR', 'HIPAA', 'PCI-DSS')),
    CONSTRAINT chk_tenants_billing 
        CHECK (billing_type IN ('PREPAID', 'POSTPAID')),
    CONSTRAINT chk_tenants_updated 
        CHECK (updated_at >= created_at),
    CONSTRAINT chk_tenants_version 
        CHECK (version >= 1)
);
```

**Field Descriptions:**

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `_id` | UUID | Primary key | `550e8400-e29b-41d4-a716-446655440000` |
| `code` | VARCHAR(64) | Unique subdomain slug | `acme-corp` |
| `data_region` | VARCHAR(50) | Data residency region | `ap-southeast-1` |
| `compliance_level` | VARCHAR(20) | Regulatory compliance | `GDPR`, `HIPAA` |
| `parent_tenant_id` | UUID | Parent in hierarchy | NULL (root) or UUID |
| `path` | TEXT | Materialized path | `/parent-id/child-id/` |
| `name` | TEXT | Display name | `ACME Corporation` |
| `tier` | VARCHAR(50) | Subscription tier | `ENTERPRISE` |
| `billing_type` | VARCHAR(20) | Payment model | `POSTPAID` |
| `timezone` | VARCHAR(50) | Default timezone | `Asia/Ho_Chi_Minh` |
| `profile` | JSONB | Company details | `{"tax_code": "0123456789"}` |
| `settings` | JSONB | Configuration | `{"mfa_required": true}` |
| `status` | VARCHAR(20) | Current status | `ACTIVE` |
| `version` | BIGINT | Optimistic locking | 5 |

**Profile JSONB Structure:**
```json
{
  "company_name": "ACME Corp",
  "tax_code": "0123456789",
  "industry": "fintech",
  "size": "51-200",
  "website": "https://acme.com",
  "logo_url": "https://cdn.acme.com/logo.png"
}
```

**Settings JSONB Structure:**
```json
{
  "security": {
    "mfa_required": true,
    "session_timeout": 3600,
    "password_policy": {
      "min_length": 12,
      "require_special": true
    }
  },
  "features": {
    "api_access": true,
    "webhooks": true,
    "sso": true
  },
  "quotas": {
    "max_users": 100,
    "max_storage_gb": 50,
    "api_calls_per_day": 10000
  }
}
```

---

### 2. USERS

**Purpose:** Global user accounts (can join multiple tenants)

```sql
CREATE TABLE users (
    -- I. IDENTITY
    _id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    password_hash TEXT,                           -- Argon2id hash
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    phone_number VARCHAR(20),
    
    -- II. SECURITY
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    is_support_staff BOOLEAN NOT NULL DEFAULT FALSE,
    mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    mfa_secret TEXT,                              -- Encrypted
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- III. PREFERENCES
    locale VARCHAR(10) NOT NULL DEFAULT 'vi-VN',
    metadata JSONB NOT NULL DEFAULT '{}',
    
    -- IV. AUDIT
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    
    -- CONSTRAINTS
    CONSTRAINT uq_users_phone UNIQUE (phone_number),
    CONSTRAINT chk_users_email_fmt 
        CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT chk_users_url_fmt 
        CHECK (avatar_url IS NULL OR avatar_url ~* '^https?://'),
    CONSTRAINT chk_users_status 
        CHECK (status IN ('ACTIVE', 'BANNED', 'DISABLED', 'PENDING')),
    CONSTRAINT chk_users_updated 
        CHECK (updated_at >= created_at)
);
```

**Metadata JSONB Structure:**
```json
{
  "preferences": {
    "theme": "dark",
    "notifications": {
      "email": true,
      "sms": false,
      "push": true
    }
  },
  "onboarding": {
    "completed": true,
    "completed_at": "2024-01-15T10:30:00Z"
  },
  "last_login": {
    "ip": "1.2.3.4",
    "device": "Chrome on macOS",
    "at": "2024-01-20T14:30:00Z"
  }
}
```

---

### 3. TENANT_MEMBERS

**Purpose:** User membership in tenants (join table with metadata)

```sql
CREATE TABLE tenant_members (
    -- I. IDENTITY & LINK
    _id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    
    -- II. OPERATIONAL
    display_name VARCHAR(255),                    -- Tenant-specific name
    status VARCHAR(20) NOT NULL DEFAULT 'INVITED',
    custom_data JSONB NOT NULL DEFAULT '{}',
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- III. AUDIT & VERSIONING
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    created_by UUID,                              -- Who invited
    version BIGINT NOT NULL DEFAULT 1,
    
    -- IV. CONSTRAINTS
    CONSTRAINT fk_mem_tenant 
        FOREIGN KEY (tenant_id) 
        REFERENCES tenants(_id) ON DELETE CASCADE,
    CONSTRAINT fk_mem_user 
        FOREIGN KEY (user_id) 
        REFERENCES users(_id) ON DELETE CASCADE,
    CONSTRAINT uq_tenant_user 
        UNIQUE (tenant_id, user_id),
    CONSTRAINT chk_mem_status 
        CHECK (status IN ('INVITED', 'ACTIVE', 'SUSPENDED', 'RESIGNED')),
    CONSTRAINT chk_mem_updated 
        CHECK (updated_at >= created_at)
);
```

**Custom Data JSONB Structure:**
```json
{
  "employee_id": "EMP001",
  "hire_date": "2024-01-15",
  "contract_type": "full-time",
  "probation_end": "2024-04-15",
  "manager_id": "uuid-of-manager"
}
```

---

### 4. DEPARTMENTS

**Purpose:** Organizational hierarchy within tenant

```sql
CREATE TABLE departments (
    -- I. IDENTITY & HIERARCHY
    _id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    parent_id UUID,                               -- Self-referencing
    
    -- II. BUSINESS DATA
    name TEXT NOT NULL,
    code VARCHAR(50),                             -- Short code
    type VARCHAR(20) NOT NULL DEFAULT 'TEAM',
    head_member_id UUID,                          -- Department head
    path TEXT,                                    -- Materialized path
    
    -- III. AUDIT & VERSIONING
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    version BIGINT NOT NULL DEFAULT 1,
    
    -- CONSTRAINTS
    CONSTRAINT fk_dept_tenant 
        FOREIGN KEY (tenant_id) 
        REFERENCES tenants(_id) ON DELETE CASCADE,
    CONSTRAINT fk_dept_parent 
        FOREIGN KEY (parent_id) 
        REFERENCES departments(_id) ON DELETE SET NULL,
    CONSTRAINT chk_dept_type 
        CHECK (type IN ('DIVISION', 'DEPARTMENT', 'TEAM')),
    CONSTRAINT chk_dept_updated 
        CHECK (updated_at >= created_at)
);
```

**Hierarchy Example:**
```
Engineering (DIVISION)              path: /eng-id/
├─ Backend (DEPARTMENT)             path: /eng-id/backend-id/
│  ├─ Core API (TEAM)               path: /eng-id/backend-id/core-id/
│  └─ Integrations (TEAM)           path: /eng-id/backend-id/int-id/
└─ Frontend (DEPARTMENT)            path: /eng-id/frontend-id/
   └─ Web App (TEAM)                path: /eng-id/frontend-id/web-id/
```

---

### 5. DEPARTMENT_MEMBERS

**Purpose:** Assign members to departments (M:N with metadata)

```sql
CREATE TABLE department_members (
    _id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    department_id UUID NOT NULL,
    member_id UUID NOT NULL,                      -- FK to tenant_members
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,    -- Primary department
    role_in_dept VARCHAR(100),                    -- Department role
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- CONSTRAINTS
    CONSTRAINT fk_dept_mem_tenant 
        FOREIGN KEY (tenant_id) 
        REFERENCES tenants(_id) ON DELETE CASCADE,
    CONSTRAINT fk_dept_mem_dept 
        FOREIGN KEY (department_id) 
        REFERENCES departments(_id) ON DELETE CASCADE,
    CONSTRAINT fk_dept_mem_member 
        FOREIGN KEY (member_id) 
        REFERENCES tenant_members(_id) ON DELETE CASCADE,
    CONSTRAINT uq_dept_member_unique 
        UNIQUE (tenant_id, department_id, member_id),
    CONSTRAINT chk_dept_mem_updated 
        CHECK (updated_at >= created_at)
);
```

---

## Supporting Tables

### 6. USER_GROUPS

**Purpose:** Flexible user grouping (projects, permissions, etc.)

```sql
CREATE TABLE user_groups (
    _id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    type VARCHAR(20) NOT NULL DEFAULT 'CUSTOM',
    description TEXT,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,     -- System groups
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    dynamic_rules JSONB NOT NULL DEFAULT '{}',    -- Auto-membership rules
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_ugrp_tenant 
        FOREIGN KEY (tenant_id) 
        REFERENCES tenants(_id) ON DELETE CASCADE,
    CONSTRAINT chk_ugrp_type 
        CHECK (type IN ('ORG_UNIT', 'PROJECT', 'PERMISSION', 'CUSTOM'))
);
```

**Dynamic Rules Example:**
```json
{
  "auto_add": {
    "conditions": [
      {"field": "custom_data.department", "operator": "eq", "value": "Engineering"},
      {"field": "status", "operator": "eq", "value": "ACTIVE"}
    ],
    "enabled": true
  }
}
```

---

### 7. LOCATIONS

**Purpose:** Physical locations (offices, warehouses, stores)

```sql
CREATE TABLE locations (
    _id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    parent_id UUID,                               -- Hierarchy
    name TEXT NOT NULL,
    code VARCHAR(50),
    type VARCHAR(20) NOT NULL DEFAULT 'OFFICE',
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    latitude DECIMAL(9,6),                        -- GPS coordinates
    longitude DECIMAL(9,6),
    timezone VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    custom_fields JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    
    CONSTRAINT fk_loc_tenant 
        FOREIGN KEY (tenant_id) 
        REFERENCES tenants(_id) ON DELETE CASCADE,
    CONSTRAINT fk_loc_parent 
        FOREIGN KEY (parent_id) 
        REFERENCES locations(_id) ON DELETE SET NULL,
    CONSTRAINT uq_loc_tenant_code 
        UNIQUE (tenant_id, code),
    CONSTRAINT chk_loc_type 
        CHECK (type IN ('HEADQUARTERS', 'BRANCH', 'OFFICE', 'WAREHOUSE', 'STORE'))
);
```

---

### 8. SSO_CONFIGS

**Purpose:** Single Sign-On integration settings

```sql
CREATE TABLE sso_configs (
    _id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    provider VARCHAR(50) NOT NULL,                -- 'google', 'okta', 'saml'
    entity_id TEXT,                               -- SAML EntityID
    sso_url TEXT,                                 -- SSO endpoint
    x509_cert TEXT,                               -- Certificate
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_sso_tenant 
        FOREIGN KEY (tenant_id) 
        REFERENCES tenants(_id) ON DELETE CASCADE
);
```

---

## Indexes

### Tenants Indexes
```sql
-- Unique active code
CREATE UNIQUE INDEX idx_tenants_code_active 
ON tenants (code) WHERE deleted_at IS NULL;

-- JSONB search
CREATE INDEX idx_tenants_settings_gin 
ON tenants USING GIN (settings);

CREATE INDEX idx_tenants_profile_gin 
ON tenants USING GIN (profile);

-- Stats & reporting
CREATE INDEX idx_tenants_infra_stats 
ON tenants (data_region, tier, status);

-- Hierarchy queries
CREATE INDEX idx_tenants_path 
ON tenants (path ASC) WHERE deleted_at IS NULL;
```

### Users Indexes
```sql
-- Unique active email
CREATE UNIQUE INDEX idx_users_email_active 
ON users (email) WHERE deleted_at IS NULL;

-- Trigram search (fuzzy)
CREATE INDEX idx_users_search_trgm 
ON users USING GIN (full_name gin_trgm_ops, email gin_trgm_ops);

-- Status queries
CREATE INDEX idx_users_status_created 
ON users (status, created_at DESC);
```

### Tenant Members Indexes
```sql
-- List tenant members
CREATE INDEX idx_mem_tenant 
ON tenant_members (tenant_id) WHERE deleted_at IS NULL;

-- User's tenants
CREATE INDEX idx_mem_user 
ON tenant_members (user_id) WHERE deleted_at IS NULL;

-- JSONB search
CREATE INDEX idx_mem_custom_data 
ON tenant_members USING GIN (custom_data);

-- Status filtering
CREATE INDEX idx_mem_status 
ON tenant_members (tenant_id, status) WHERE deleted_at IS NULL;
```

### Departments Indexes
```sql
-- Hierarchy queries (materialized path)
CREATE INDEX idx_dept_path 
ON departments (tenant_id, path text_pattern_ops) 
WHERE deleted_at IS NULL;

-- Tenant isolation
CREATE INDEX idx_dept_tenant 
ON departments (tenant_id) WHERE deleted_at IS NULL;

-- Parent lookup
CREATE INDEX idx_dept_parent 
ON departments (parent_id) WHERE deleted_at IS NULL;
```

### Department Members Indexes
```sql
-- Department roster
CREATE INDEX idx_dept_mem_lookup 
ON department_members (tenant_id, department_id);

-- Member's departments
CREATE INDEX idx_dept_mem_member 
ON department_members (tenant_id, member_id);

-- Primary department
CREATE INDEX idx_dept_mem_primary 
ON department_members (tenant_id, is_primary) 
WHERE is_primary = TRUE;
```

---

## Triggers & Functions

### Auto-update Timestamps
```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_tenants_updated_at
BEFORE UPDATE ON tenants
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Apply to all tables with updated_at
```

### Auto-update Materialized Path
```sql
CREATE OR REPLACE FUNCTION update_department_path()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.parent_id IS NULL THEN
        NEW.path = '/' || NEW._id::TEXT || '/';
    ELSE
        SELECT path || NEW._id::TEXT || '/'
        INTO NEW.path
        FROM departments
        WHERE _id = NEW.parent_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_department_path
BEFORE INSERT OR UPDATE ON departments
FOR EACH ROW
EXECUTE FUNCTION update_department_path();
```

### Get Child Departments
```sql
CREATE OR REPLACE FUNCTION get_child_departments(p_department_id UUID)
RETURNS TABLE (
    _id UUID,
    name TEXT,
    code VARCHAR(50),
    type VARCHAR(20),
    level INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE dept_tree AS (
        SELECT d._id, d.name, d.code, d.type, d.path, 0 as level
        FROM departments d
        WHERE d._id = p_department_id AND d.deleted_at IS NULL
        
        UNION ALL
        
        SELECT d._id, d.name, d.code, d.type, d.path, dt.level + 1
        FROM departments d
        INNER JOIN dept_tree dt ON d.parent_id = dt._id
        WHERE d.deleted_at IS NULL
    )
    SELECT dt._id, dt.name, dt.code, dt.type, dt.level
    FROM dept_tree dt
    ORDER BY dt.path;
END;
$$ LANGUAGE plpgsql;
```

---

## Summary

| Category | Count | Notes |
|----------|-------|-------|
| **Core Tables** | 5 | Tenants, Users, Members, Depts, Dept Members |
| **Support Tables** | 8 | Groups, Locations, SSO, Delegations, Roles, etc. |
| **Total Fields** | 120+ | Including JSONB flexible fields |
| **Indexes** | 35+ | B-tree, GIN, Unique, Partial |
| **Constraints** | 50+ | FK, Check, Unique |
| **Triggers** | 10+ | Auto-update, Path management |
| **Functions** | 5+ | Hierarchy queries, Stats |

---

**Database Size Estimate:**
- **Small Tenant (100 users):** ~50 MB
- **Medium Tenant (1,000 users):** ~500 MB
- **Large Tenant (10,000 users):** ~5 GB
- **Platform (1,000 tenants):** ~50-500 GB
