# Tenants Module - Entity Relationship Diagram (ERD)

## Overview
This document provides comprehensive ERD visualization for the Tenants module and related entities.

---

## 🗺️ Complete ERD Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                          TENANTS MODULE - ERD                                 │
└──────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────┐
│         TENANTS                 │
├─────────────────────────────────┤
│ PK _id: UUID                    │
│ UK code: VARCHAR(64)            │──┐
│    data_region: VARCHAR(50)     │  │
│    compliance_level: VARCHAR(20)│  │
│ FK parent_tenant_id: UUID       │──┼───┐ Self-referencing
│    path: TEXT                   │  │   │ (hierarchy)
│    name: TEXT                   │  │   │
│    tier: VARCHAR(50)            │  │   │
│    billing_type: VARCHAR(20)    │  │   │
│    timezone: VARCHAR(50)        │  │   │
│    profile: JSONB               │  │   │
│    settings: JSONB              │  │   │
│    status: VARCHAR(20)          │  │   │
│    created_at: TIMESTAMPTZ      │  │   │
│    updated_at: TIMESTAMPTZ      │  │   │
│    deleted_at: TIMESTAMPTZ      │  │   │
│    version: BIGINT              │  │   │
└─────────────────────────────────┘  │   │
       │                              │   │
       │ 1:N                          │   │
       │                              │   │
       ▼                              │   │
┌─────────────────────────────────┐  │   │
│      TENANT_MEMBERS             │  │   │
├─────────────────────────────────┤  │   │
│ PK _id: UUID                    │  │   │
│ FK tenant_id: UUID              │◄─┘   │
│ FK user_id: UUID                │◄─────┼───────────┐
│    display_name: VARCHAR(255)   │      │           │
│    status: VARCHAR(20)          │      │           │
│    custom_data: JSONB           │      │           │
│    joined_at: TIMESTAMPTZ       │      │           │
│    created_at: TIMESTAMPTZ      │      │           │
│    updated_at: TIMESTAMPTZ      │      │           │
│    deleted_at: TIMESTAMPTZ      │      │           │
│ FK created_by: UUID             │      │           │
│    version: BIGINT              │      │           │
│ UK (tenant_id, user_id)         │      │           │
└─────────────────────────────────┘      │           │
       │                                  │           │
       │ 1:N                              │           │
       │                                  │           │
       ▼                                  │           │
┌─────────────────────────────────┐      │           │
│    DEPARTMENT_MEMBERS           │      │           │
├─────────────────────────────────┤      │           │
│ PK _id: UUID                    │      │           │
│ FK tenant_id: UUID              │◄─────┘           │
│ FK department_id: UUID          │◄─────┐           │
│ FK member_id: UUID              │──────┤           │
│    is_primary: BOOLEAN          │      │           │
│    role_in_dept: VARCHAR(100)   │      │           │
│    created_at: TIMESTAMPTZ      │      │           │
│    updated_at: TIMESTAMPTZ      │      │           │
│ UK (tenant_id,dept_id,member_id)│      │           │
└─────────────────────────────────┘      │           │
                                          │           │
┌─────────────────────────────────┐      │           │
│        DEPARTMENTS              │      │           │
├─────────────────────────────────┤      │           │
│ PK _id: UUID                    │──────┘           │
│ FK tenant_id: UUID              │◄─────────────────┘
│ FK parent_id: UUID              │──┐
│    name: TEXT                   │  │ Self-referencing
│    code: VARCHAR(50)            │  │ (hierarchy)
│    type: VARCHAR(20)            │  │
│ FK head_member_id: UUID         │  │
│    path: TEXT                   │  │
│    created_at: TIMESTAMPTZ      │  │
│    updated_at: TIMESTAMPTZ      │  │
│    deleted_at: TIMESTAMPTZ      │  │
│    version: BIGINT              │  │
└─────────────────────────────────┘  │
                                      │
                                      │
┌─────────────────────────────────┐  │
│           USERS                 │  │
├─────────────────────────────────┤  │
│ PK _id: UUID                    │──┘
│ UK email: VARCHAR(255)          │
│    password_hash: TEXT          │
│    full_name: TEXT              │
│    avatar_url: TEXT             │
│ UK phone_number: VARCHAR(20)    │
│    status: VARCHAR(20)          │
│    is_support_staff: BOOLEAN    │
│    mfa_enabled: BOOLEAN         │
│    mfa_secret: TEXT             │
│    is_verified: BOOLEAN         │
│    locale: VARCHAR(10)          │
│    metadata: JSONB              │
│    created_at: TIMESTAMPTZ      │
│    updated_at: TIMESTAMPTZ      │
│    deleted_at: TIMESTAMPTZ      │
└─────────────────────────────────┘
       │
       │ 1:N
       │
       ▼
┌─────────────────────────────────┐
│        USER_GROUPS              │
├─────────────────────────────────┤
│ PK _id: UUID                    │
│ FK tenant_id: UUID              │◄──────────┐
│    name: VARCHAR(255)           │           │
│    code: VARCHAR(50)            │           │
│    type: VARCHAR(20)            │           │
│    description: TEXT            │           │
│    is_system: BOOLEAN           │           │
│    is_active: BOOLEAN           │           │
│    dynamic_rules: JSONB         │           │
│    created_at: TIMESTAMPTZ      │           │
│    updated_at: TIMESTAMPTZ      │           │
└─────────────────────────────────┘           │
       │                                       │
       │ M:N                                   │
       │                                       │
       ▼                                       │
┌─────────────────────────────────┐           │
│      GROUP_MEMBERS              │           │
├─────────────────────────────────┤           │
│ PK _id: UUID                    │           │
│ FK tenant_id: UUID              │───────────┘
│ FK group_id: UUID               │
│ FK member_id: UUID              │
│    is_manager: BOOLEAN          │
│    joined_at: TIMESTAMPTZ       │
│ UK (tenant_id,group_id,member_id)│
└─────────────────────────────────┘


┌─────────────────────────────────┐
│         LOCATIONS               │
├─────────────────────────────────┤
│ PK _id: UUID                    │
│ FK tenant_id: UUID              │◄──────────┐
│ FK parent_id: UUID              │──┐        │
│    name: TEXT                   │  │        │
│    code: VARCHAR(50)            │  │        │
│    type: VARCHAR(20)            │  │        │
│    address: TEXT                │  │        │
│    city: VARCHAR(100)           │  │        │
│    country: VARCHAR(100)        │  │        │
│    latitude: DECIMAL(9,6)       │  │        │
│    longitude: DECIMAL(9,6)      │  │        │
│    timezone: VARCHAR(50)        │  │        │
│    is_active: BOOLEAN           │  │        │
│    custom_fields: JSONB         │  │        │
│    created_at: TIMESTAMPTZ      │  │        │
│    updated_at: TIMESTAMPTZ      │  │        │
│    deleted_at: TIMESTAMPTZ      │  │        │
│ UK (tenant_id, code)            │  │        │
└─────────────────────────────────┘  │        │
                                      │        │
                                      │        │
┌─────────────────────────────────┐  │        │
│       SSO_CONFIGS               │  │        │
├─────────────────────────────────┤  │        │
│ PK _id: UUID                    │  │        │
│ FK tenant_id: UUID              │◄─┘        │
│    provider: VARCHAR(50)        │           │
│    entity_id: TEXT              │           │
│    sso_url: TEXT                │           │
│    x509_cert: TEXT              │           │
│    is_default: BOOLEAN          │           │
│    is_active: BOOLEAN           │           │
│    metadata: JSONB              │           │
│    created_at: TIMESTAMPTZ      │           │
│    updated_at: TIMESTAMPTZ      │           │
└─────────────────────────────────┘           │
                                               │
                                               │
┌─────────────────────────────────┐           │
│      USER_DELEGATIONS           │           │
├─────────────────────────────────┤           │
│ PK _id: UUID                    │           │
│ FK tenant_id: UUID              │◄──────────┘
│ FK delegator_id: UUID           │
│ FK delegate_id: UUID            │
│    scope: VARCHAR(50)           │
│    resources: TEXT[]            │
│    valid_from: TIMESTAMPTZ      │
│    valid_to: TIMESTAMPTZ        │
│    is_active: BOOLEAN           │
│    created_at: TIMESTAMPTZ      │
│    created_by: UUID             │
│    version: BIGINT              │
└─────────────────────────────────┘


┌─────────────────────────────────┐
│         ROLES                   │
├─────────────────────────────────┤
│ PK _id: UUID                    │
│ FK tenant_id: UUID              │◄──────────┐
│    name: VARCHAR(100)           │           │
│    code: VARCHAR(50)            │           │
│    description: TEXT            │           │
│    is_system: BOOLEAN           │           │
│    is_active: BOOLEAN           │           │
│    permissions: JSONB           │           │
│    created_at: TIMESTAMPTZ      │           │
│    updated_at: TIMESTAMPTZ      │           │
│    deleted_at: TIMESTAMPTZ      │           │
│    version: BIGINT              │           │
└─────────────────────────────────┘           │
       │                                       │
       │ M:N                                   │
       │                                       │
       ▼                                       │
┌─────────────────────────────────┐           │
│        USER_ROLES               │           │
├─────────────────────────────────┤           │
│ PK _id: UUID                    │           │
│ FK tenant_id: UUID              │───────────┘
│ FK user_id: UUID                │
│ FK role_id: UUID                │
│    is_active: BOOLEAN           │
│    assigned_by: UUID            │
│    assigned_at: TIMESTAMPTZ     │
│    expires_at: TIMESTAMPTZ      │
│ UK (tenant_id,user_id,role_id)  │
└─────────────────────────────────┘
```

---

## 🔗 Relationship Descriptions

### 1. Tenants Self-Referencing (Hierarchy)
```
TENANTS 1:N TENANTS (parent_tenant_id)

Purpose: Multi-level tenant hierarchy for partners/resellers
Example: 
  Provider (tier=PROVIDER)
    └─ Partner Elite (tier=PARTNER_ELITE)
         └─ Enterprise Customer (tier=ENTERPRISE)
              └─ Branch Office (tier=ENTERPRISE)
```

**Path Structure:**
```
Provider:     /provider-id/
Partner:      /provider-id/partner-id/
Customer:     /provider-id/partner-id/customer-id/
```

### 2. Tenants → Tenant Members (1:N)
```
TENANTS 1:N TENANT_MEMBERS

Purpose: User membership in tenants
Constraint: (tenant_id, user_id) UNIQUE
Features:
  - Multi-tenancy support (1 user can join multiple tenants)
  - Status tracking (INVITED, ACTIVE, SUSPENDED, RESIGNED)
  - Custom data (JSONB) for tenant-specific user info
```

### 3. Users → Tenant Members (1:N)
```
USERS 1:N TENANT_MEMBERS

Purpose: Global users can join multiple tenants
Example:
  user@example.com can be:
    - Admin in Tenant A
    - Member in Tenant B
    - Viewer in Tenant C
```

### 4. Tenant Members → Department Members (1:N)
```
TENANT_MEMBERS 1:N DEPARTMENT_MEMBERS

Purpose: Users can belong to multiple departments
Features:
  - is_primary: Mark primary department
  - role_in_dept: Department-specific role
```

### 5. Departments Self-Referencing (Hierarchy)
```
DEPARTMENTS 1:N DEPARTMENTS (parent_id)

Purpose: Organizational hierarchy
Example:
  Engineering (DIVISION)
    ├─ Backend Team (DEPARTMENT)
    │   └─ Core API Team (TEAM)
    └─ Frontend Team (DEPARTMENT)
```

**Path Structure (Materialized Path):**
```
Engineering:     /eng-id/
Backend:         /eng-id/backend-id/
Core API:        /eng-id/backend-id/core-id/
```

### 6. Tenants → User Groups (1:N)
```
TENANTS 1:N USER_GROUPS

Purpose: Logical grouping of users
Types:
  - ORG_UNIT: Department-based groups
  - PROJECT: Project teams
  - PERMISSION: Access control groups
  - CUSTOM: Ad-hoc groups
```

### 7. User Groups → Group Members (M:N)
```
USER_GROUPS M:N TENANT_MEMBERS (through GROUP_MEMBERS)

Purpose: Flexible group membership
Features:
  - is_manager: Group admin flag
  - dynamic_rules: Auto-add based on criteria
```

### 8. Tenants → Locations (1:N)
```
TENANTS 1:N LOCATIONS

Purpose: Physical locations management
Types:
  - HEADQUARTERS: Main office
  - BRANCH: Branch office
  - OFFICE: Regular office
  - WAREHOUSE: Storage facility
  - STORE: Retail store
```

### 9. Locations Self-Referencing (Hierarchy)
```
LOCATIONS 1:N LOCATIONS (parent_id)

Purpose: Location hierarchy
Example:
  HQ - Ho Chi Minh (HEADQUARTERS)
    ├─ Office Floor 1 (OFFICE)
    ├─ Office Floor 2 (OFFICE)
    └─ Warehouse District 7 (WAREHOUSE)
```

### 10. Tenants → SSO Configs (1:N)
```
TENANTS 1:N SSO_CONFIGS

Purpose: Single Sign-On integration
Providers:
  - Google Workspace
  - Microsoft Azure AD
  - Okta
  - Custom SAML 2.0
```

### 11. Tenants → User Delegations (1:N)
```
TENANTS 1:N USER_DELEGATIONS

Purpose: Temporary permission delegation
Features:
  - Time-bound (valid_from → valid_to)
  - Scope-limited (specific resources)
  - Audit trail (created_by, version)
```

### 12. Tenants → Roles (1:N)
```
TENANTS 1:N ROLES

Purpose: Role-based access control (RBAC)
Features:
  - is_system: System roles (cannot delete)
  - permissions: JSONB structure
  - Soft delete support
```

### 13. Roles → User Roles (M:N)
```
ROLES M:N USERS (through USER_ROLES)

Purpose: Assign roles to users
Features:
  - Time-bound roles (expires_at)
  - Audit trail (assigned_by, assigned_at)
  - Active/inactive status
```

---

## 📊 Cardinality Summary

| Relationship | Type | Description |
|--------------|------|-------------|
| Tenants ↔ Tenants | 1:N | Parent-child hierarchy |
| Tenants → Tenant Members | 1:N | User membership |
| Users → Tenant Members | 1:N | Multi-tenancy |
| Tenant Members → Dept Members | 1:N | Department assignments |
| Departments ↔ Departments | 1:N | Org structure |
| Tenants → User Groups | 1:N | Group management |
| User Groups ↔ Tenant Members | M:N | Group membership |
| Tenants → Locations | 1:N | Physical locations |
| Locations ↔ Locations | 1:N | Location hierarchy |
| Tenants → SSO Configs | 1:N | SSO integration |
| Tenants → Delegations | 1:N | Permission delegation |
| Tenants → Roles | 1:N | Role definitions |
| Roles ↔ Users | M:N | Role assignments |

---

## 🔍 Key Design Patterns

### 1. Multi-Tenancy Pattern
```sql
-- Every table has tenant_id for isolation
CREATE INDEX idx_{table}_tenant 
ON {table} (tenant_id) 
WHERE deleted_at IS NULL;
```

### 2. Soft Delete Pattern
```sql
-- deleted_at for soft deletes
-- Unique indexes with WHERE clause
CREATE UNIQUE INDEX idx_users_email_active 
ON users (email) 
WHERE deleted_at IS NULL;
```

### 3. Optimistic Locking
```sql
-- version column incremented on update
UPDATE tenants 
SET name = $1, version = version + 1 
WHERE _id = $2 AND version = $3;
```

### 4. Materialized Path (Hierarchy)
```sql
-- path stores full hierarchy
-- Efficient for "get all children" queries
SELECT * FROM departments 
WHERE path LIKE '/parent-id/%';
```

### 5. JSONB for Flexibility
```sql
-- profile, settings, metadata as JSONB
-- GIN index for fast queries
CREATE INDEX idx_tenants_profile_gin 
ON tenants USING GIN (profile);

-- Query example
SELECT * FROM tenants 
WHERE profile @> '{"industry": "fintech"}';
```

### 6. Audit Trail
```sql
-- created_at, updated_at, created_by
-- Track who changed what and when
```

---

## 🎯 Query Patterns

### Get Tenant Hierarchy
```sql
-- Get all child tenants
SELECT * FROM tenants 
WHERE path LIKE '/parent-id/%' 
AND deleted_at IS NULL;
```

### Get User's Tenants
```sql
-- All tenants user belongs to
SELECT t.* FROM tenants t
JOIN tenant_members tm ON t._id = tm.tenant_id
WHERE tm.user_id = $1 
AND tm.deleted_at IS NULL
AND t.deleted_at IS NULL;
```

### Get Department Tree
```sql
-- All departments under a parent
SELECT * FROM departments 
WHERE tenant_id = $1 
AND path LIKE '/parent-id/%'
ORDER BY path;
```

### Get User's Groups
```sql
-- All groups user belongs to
SELECT g.* FROM user_groups g
JOIN group_members gm ON g._id = gm.group_id
WHERE gm.member_id = $1 
AND g.tenant_id = $2;
```

---

## 🛡️ Constraints & Validation

### Unique Constraints
```sql
-- Tenant code must be unique (subdomain)
CONSTRAINT uq_tenants_code UNIQUE (code)

-- User can only join tenant once
CONSTRAINT uq_tenant_user UNIQUE (tenant_id, user_id)

-- Email must be unique per active user
UNIQUE INDEX idx_users_email_active ON users (email) 
WHERE deleted_at IS NULL
```

### Check Constraints
```sql
-- Tier validation
CHECK (tier IN ('FREE', 'PRO', 'ENTERPRISE', ...))

-- Status validation
CHECK (status IN ('TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELLED'))

-- Email format
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')

-- Updated after created
CHECK (updated_at >= created_at)
```

### Foreign Key Constraints
```sql
-- Cascade delete for tenant data
ON DELETE CASCADE

-- Nullify for optional references
ON DELETE SET NULL
```

---

## 📈 Scalability Considerations

### Partitioning Strategy
```sql
-- Partition by tenant_id for large tables
CREATE TABLE tenant_members (...)
PARTITION BY HASH (tenant_id);
```

### Index Strategy
```sql
-- Composite indexes for common queries
CREATE INDEX idx_mem_tenant_status 
ON tenant_members (tenant_id, status) 
WHERE deleted_at IS NULL;

-- GIN for JSONB
CREATE INDEX idx_tenants_settings_gin 
ON tenants USING GIN (settings);

-- Text search
CREATE INDEX idx_users_search_trgm 
ON users USING GIN (full_name gin_trgm_ops);
```

---

## 🎨 Visual Legend

```
┌─────────────┐
│   ENTITY    │
├─────────────┤
│ PK _id      │  PK = Primary Key
│ UK code     │  UK = Unique Key
│ FK ref_id   │  FK = Foreign Key
│    field    │  Normal field
└─────────────┘

Relationships:
  ──>  One-to-Many (1:N)
  <──>  Many-to-Many (M:N)
  ──┐  Self-referencing
```

---

**Total Entities:** 13 core tables  
**Total Relationships:** 13 key relationships  
**Hierarchy Support:** 3 tables (Tenants, Departments, Locations)  
**JSONB Fields:** 7 flexible schema fields  
**Soft Delete:** All major tables support soft delete
