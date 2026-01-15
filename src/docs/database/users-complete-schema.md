# Users Module - Complete Database Schema & ERD

## 📋 Table of Contents
1. [Overview](#overview)
2. [Core Tables](#core-tables)
3. [Relationship Tables](#relationship-tables)
4. [Security Tables](#security-tables)
5. [ERD Diagram](#erd-diagram)
6. [Indexes & Constraints](#indexes--constraints)

---

## Overview

### Database Architecture
- **Primary Database:** PostgreSQL 14+ / YugabyteDB
- **Analytics Database:** ClickHouse (for auth_logs)
- **Total Tables:** 10 core tables
- **Design Pattern:** Multi-tenancy with soft delete

### Key Features
- ✅ Global user accounts (can join multiple tenants)
- ✅ Multi-factor authentication (MFA) support
- ✅ Session management with device tracking
- ✅ User delegation (temporary permissions)
- ✅ Consent tracking (GDPR compliance)
- ✅ Soft delete with unique constraints

---

## Core Tables

### 1. USERS

**Purpose:** Global user accounts

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
    mfa_secret TEXT,                              -- Encrypted TOTP secret
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

-- Unique email for active users only
CREATE UNIQUE INDEX idx_users_email_active 
ON users (email) WHERE deleted_at IS NULL;

-- Trigram search for fuzzy matching
CREATE INDEX idx_users_search_trgm 
ON users USING GIN (full_name gin_trgm_ops, email gin_trgm_ops);

-- Status queries
CREATE INDEX idx_users_status_created 
ON users (status, created_at DESC);
```

**Metadata JSONB Structure:**
```json
{
  "preferences": {
    "theme": "dark",
    "language": "vi",
    "timezone": "Asia/Ho_Chi_Minh",
    "notifications": {
      "email": true,
      "sms": false,
      "push": true
    }
  },
  "onboarding": {
    "completed": true,
    "completed_at": "2024-01-15T10:30:00Z",
    "steps_completed": ["profile", "verification", "preferences"]
  },
  "profile": {
    "bio": "Software Engineer",
    "company": "Tech Corp",
    "position": "Senior Developer"
  }
}
```

---

### 2. USER_SESSIONS

**Purpose:** Track active user sessions

```sql
CREATE TABLE user_sessions (
    _id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    tenant_id UUID,                               -- Session scoped to tenant
    device_id UUID,                               -- Link to user_devices
    
    -- Session data
    session_token TEXT NOT NULL,                  -- Encrypted JWT
    ip_address VARCHAR(45) NOT NULL,              -- IPv4/IPv6
    user_agent TEXT,
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    
    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT fk_session_user 
        FOREIGN KEY (user_id) 
        REFERENCES users(_id) ON DELETE CASCADE,
    CONSTRAINT fk_session_tenant 
        FOREIGN KEY (tenant_id) 
        REFERENCES tenants(_id) ON DELETE CASCADE,
    CONSTRAINT fk_session_device 
        FOREIGN KEY (device_id) 
        REFERENCES user_devices(_id) ON DELETE SET NULL
);

-- Find active sessions by user
CREATE INDEX idx_sessions_user 
ON user_sessions (user_id, is_active, expires_at DESC);

-- Cleanup expired sessions
CREATE INDEX idx_sessions_expires 
ON user_sessions (expires_at) 
WHERE is_active = TRUE;
```

---

### 3. USER_DEVICES

**Purpose:** Track registered devices

```sql
CREATE TABLE user_devices (
    _id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    
    -- Device info
    device_name VARCHAR(255) NOT NULL,            -- "MacBook Pro", "iPhone 14"
    device_type VARCHAR(20) NOT NULL,             -- DESKTOP, MOBILE, TABLET
    device_fingerprint TEXT,                      -- Browser fingerprint
    
    -- System info
    os VARCHAR(100),                              -- "macOS 14.2", "iOS 17.1"
    browser VARCHAR(100),                         -- "Chrome 120.0", "Safari 17.1"
    
    -- Security
    is_trusted BOOLEAN NOT NULL DEFAULT FALSE,
    trusted_at TIMESTAMPTZ,
    
    -- Activity
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT fk_device_user 
        FOREIGN KEY (user_id) 
        REFERENCES users(_id) ON DELETE CASCADE,
    CONSTRAINT chk_device_type 
        CHECK (device_type IN ('DESKTOP', 'MOBILE', 'TABLET', 'UNKNOWN'))
);

-- Find user devices
CREATE INDEX idx_devices_user 
ON user_devices (user_id, last_seen_at DESC);

-- Find trusted devices
CREATE INDEX idx_devices_trusted 
ON user_devices (user_id, is_trusted) 
WHERE is_trusted = TRUE;
```

---

### 4. USER_ROLES

**Purpose:** Assign roles to users in tenants

```sql
CREATE TABLE user_roles (
    _id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    role_id UUID NOT NULL,
    
    -- Status & expiry
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    assigned_by UUID,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    
    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT fk_urole_tenant 
        FOREIGN KEY (tenant_id) 
        REFERENCES tenants(_id) ON DELETE CASCADE,
    CONSTRAINT fk_urole_user 
        FOREIGN KEY (user_id) 
        REFERENCES users(_id) ON DELETE CASCADE,
    CONSTRAINT fk_urole_role 
        FOREIGN KEY (role_id) 
        REFERENCES roles(_id) ON DELETE CASCADE,
    CONSTRAINT fk_urole_assigner 
        FOREIGN KEY (assigned_by) 
        REFERENCES users(_id) ON DELETE SET NULL,
    CONSTRAINT uq_user_role 
        UNIQUE (tenant_id, user_id, role_id)
);

-- Find user's roles in tenant
CREATE INDEX idx_uroles_user_tenant 
ON user_roles (user_id, tenant_id) 
WHERE deleted_at IS NULL AND is_active = TRUE;

-- Find users with specific role
CREATE INDEX idx_uroles_role 
ON user_roles (role_id, tenant_id) 
WHERE deleted_at IS NULL AND is_active = TRUE;

-- Cleanup expired roles
CREATE INDEX idx_uroles_expires 
ON user_roles (expires_at) 
WHERE expires_at IS NOT NULL AND is_active = TRUE;
```

---

### 5. USER_DELEGATIONS

**Purpose:** Temporary permission delegation

```sql
CREATE TABLE user_delegations (
    _id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    delegator_id UUID NOT NULL,                   -- Who delegates
    delegate_id UUID NOT NULL,                    -- Who receives
    
    -- Scope
    scope VARCHAR(50) NOT NULL,                   -- 'ALL', 'SPECIFIC_RESOURCE'
    resources TEXT[],                             -- Array of resource IDs
    permissions JSONB NOT NULL DEFAULT '{}',
    
    -- Time bounds
    valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_to TIMESTAMPTZ NOT NULL,
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    version BIGINT NOT NULL DEFAULT 1,
    deleted_at TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT fk_deleg_tenant 
        FOREIGN KEY (tenant_id) 
        REFERENCES tenants(_id) ON DELETE CASCADE,
    CONSTRAINT fk_deleg_delegator 
        FOREIGN KEY (delegator_id) 
        REFERENCES users(_id) ON DELETE CASCADE,
    CONSTRAINT fk_deleg_delegate 
        FOREIGN KEY (delegate_id) 
        REFERENCES users(_id) ON DELETE CASCADE,
    CONSTRAINT chk_deleg_dates 
        CHECK (valid_to > valid_from),
    CONSTRAINT chk_deleg_users 
        CHECK (delegator_id != delegate_id)
);

-- Find active delegations
CREATE INDEX idx_delegations_active 
ON user_delegations (delegate_id, tenant_id, valid_from, valid_to) 
WHERE is_active = TRUE AND deleted_at IS NULL;

-- Cleanup expired delegations
CREATE INDEX idx_delegations_expires 
ON user_delegations (valid_to) 
WHERE is_active = TRUE;
```

**Permissions JSONB Structure:**
```json
{
  "actions": ["read", "write", "approve"],
  "resources": {
    "documents": ["*"],
    "invoices": ["INV-2024-*"]
  },
  "constraints": {
    "max_amount": 10000,
    "departments": ["finance", "accounting"]
  }
}
```

---

### 6. USER_CONSENTS

**Purpose:** Track user consents (GDPR compliance)

```sql
CREATE TABLE user_consents (
    _id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    tenant_id UUID,
    
    -- Consent details
    consent_type VARCHAR(100) NOT NULL,           -- 'TERMS', 'PRIVACY', 'MARKETING'
    consent_version VARCHAR(20) NOT NULL,
    is_granted BOOLEAN NOT NULL,
    
    -- Context
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    -- Timestamps
    consented_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT fk_consent_user 
        FOREIGN KEY (user_id) 
        REFERENCES users(_id) ON DELETE CASCADE,
    CONSTRAINT fk_consent_tenant 
        FOREIGN KEY (tenant_id) 
        REFERENCES tenants(_id) ON DELETE CASCADE
);

-- Find user consents
CREATE INDEX idx_consents_user 
ON user_consents (user_id, consent_type, consented_at DESC);

-- Find users who consented to specific type
CREATE INDEX idx_consents_type 
ON user_consents (tenant_id, consent_type, is_granted);
```

---

## Security Tables

### 7. USER_REGISTRATION_LOGS (ClickHouse)

**Purpose:** Track user registration for analytics

```sql
CREATE TABLE user_registration_logs (
    _id UUID,
    tenant_id UUID,
    user_id UUID,
    registration_source Enum8('DIRECT' = 1, 'SSO' = 2, 'INVITE' = 3),
    data_region String,
    created_at DateTime64(3) DEFAULT now()
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(created_at)
ORDER BY (tenant_id, created_at, _id)
SETTINGS index_granularity = 8192;

-- Index for region analytics
ALTER TABLE user_registration_logs 
ADD INDEX idx_region data_region TYPE bloom_filter(0.01) GRANULARITY 1;
```

---

## ERD Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                          USERS MODULE - ERD                                   │
└──────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────┐
│           USERS                 │
├─────────────────────────────────┤
│ PK _id: UUID                    │
│ UK email: VARCHAR(255)          │──────┐
│    password_hash: TEXT          │      │
│    full_name: TEXT              │      │
│    avatar_url: TEXT             │      │
│ UK phone_number: VARCHAR(20)    │      │
│    status: VARCHAR(20)          │      │ 1:N
│    is_support_staff: BOOLEAN    │      │
│    mfa_enabled: BOOLEAN         │      │
│    mfa_secret: TEXT             │      │
│    is_verified: BOOLEAN         │      │
│    locale: VARCHAR(10)          │      │
│    metadata: JSONB              │      │
│    created_at: TIMESTAMPTZ      │      │
│    updated_at: TIMESTAMPTZ      │      │
│    deleted_at: TIMESTAMPTZ      │      │
└─────────────────────────────────┘      │
       │                                  │
       │ 1:N                              │
       │                                  ▼
       │                          ┌─────────────────────────────────┐
       │                          │      USER_SESSIONS              │
       │                          ├─────────────────────────────────┤
       │                          │ PK _id: UUID                    │
       │                          │ FK user_id: UUID                │◄─┘
       │                          │ FK tenant_id: UUID              │
       │                          │ FK device_id: UUID              │◄───┐
       │                          │    session_token: TEXT          │    │
       │                          │    ip_address: VARCHAR(45)      │    │
       │                          │    user_agent: TEXT             │    │
       │                          │    is_active: BOOLEAN           │    │
       │                          │    last_seen_at: TIMESTAMPTZ    │    │
       │                          │    expires_at: TIMESTAMPTZ      │    │
       │                          │    created_at: TIMESTAMPTZ      │    │
       │                          └─────────────────────────────────┘    │
       │                                                                  │
       │ 1:N                                                              │
       ▼                                                                  │
┌─────────────────────────────────┐                                      │
│       USER_DEVICES              │──────────────────────────────────────┘
├─────────────────────────────────┤
│ PK _id: UUID                    │
│ FK user_id: UUID                │
│    device_name: VARCHAR(255)    │
│    device_type: VARCHAR(20)     │
│    device_fingerprint: TEXT     │
│    os: VARCHAR(100)             │
│    browser: VARCHAR(100)        │
│    is_trusted: BOOLEAN          │
│    trusted_at: TIMESTAMPTZ      │
│    last_seen_at: TIMESTAMPTZ    │
│    created_at: TIMESTAMPTZ      │
└─────────────────────────────────┘


┌─────────────────────────────────┐
│         USER_ROLES              │
├─────────────────────────────────┤
│ PK _id: UUID                    │
│ FK tenant_id: UUID              │◄──────┐
│ FK user_id: UUID                │◄──────┼───────┐
│ FK role_id: UUID                │◄──────┼───┐   │
│    is_active: BOOLEAN           │       │   │   │
│ FK assigned_by: UUID            │       │   │   │
│    assigned_at: TIMESTAMPTZ     │       │   │   │
│    expires_at: TIMESTAMPTZ      │       │   │   │
│    created_at: TIMESTAMPTZ      │       │   │   │
│    updated_at: TIMESTAMPTZ      │       │   │   │
│    deleted_at: TIMESTAMPTZ      │       │   │   │
│ UK (tenant,user,role)           │       │   │   │
└─────────────────────────────────┘       │   │   │
                                           │   │   │
                                           │   │   │
┌─────────────────────────────────┐       │   │   │
│      USER_DELEGATIONS           │       │   │   │
├─────────────────────────────────┤       │   │   │
│ PK _id: UUID                    │       │   │   │
│ FK tenant_id: UUID              │───────┘   │   │
│ FK delegator_id: UUID           │───────────┘   │
│ FK delegate_id: UUID            │───────────────┘
│    scope: VARCHAR(50)           │
│    resources: TEXT[]            │
│    permissions: JSONB           │
│    valid_from: TIMESTAMPTZ      │
│    valid_to: TIMESTAMPTZ        │
│    is_active: BOOLEAN           │
│    created_at: TIMESTAMPTZ      │
│ FK created_by: UUID             │
│    version: BIGINT              │
│    deleted_at: TIMESTAMPTZ      │
└─────────────────────────────────┘


┌─────────────────────────────────┐
│       USER_CONSENTS             │
├─────────────────────────────────┤
│ PK _id: UUID                    │
│ FK user_id: UUID                │◄──────┐
│ FK tenant_id: UUID              │       │
│    consent_type: VARCHAR(100)   │       │
│    consent_version: VARCHAR(20) │       │
│    is_granted: BOOLEAN          │       │
│    ip_address: VARCHAR(45)      │       │
│    user_agent: TEXT             │       │
│    consented_at: TIMESTAMPTZ    │       │
│    expires_at: TIMESTAMPTZ      │       │
└─────────────────────────────────┘       │
                                           │
                                           │
┌─────────────────────────────────┐       │
│   USER_REGISTRATION_LOGS        │       │
│   (ClickHouse)                  │       │
├─────────────────────────────────┤       │
│    _id: UUID                    │       │
│    tenant_id: UUID              │       │
│    user_id: UUID                │───────┘
│    registration_source: Enum8   │
│    data_region: String          │
│    created_at: DateTime64       │
└─────────────────────────────────┘
```

---

## Indexes & Constraints Summary

### Unique Constraints
```sql
-- Email unique for active users
UNIQUE INDEX idx_users_email_active ON users (email) 
WHERE deleted_at IS NULL;

-- Phone unique (global)
CONSTRAINT uq_users_phone UNIQUE (phone_number);

-- One role assignment per user per tenant
CONSTRAINT uq_user_role UNIQUE (tenant_id, user_id, role_id);
```

### Search Indexes
```sql
-- Trigram fuzzy search
CREATE INDEX idx_users_search_trgm 
ON users USING GIN (full_name gin_trgm_ops, email gin_trgm_ops);

-- Status filtering
CREATE INDEX idx_users_status_created 
ON users (status, created_at DESC);
```

### Foreign Key Cascades
```sql
-- Delete user → cascade delete sessions/devices
ON DELETE CASCADE

-- Delete role → cascade delete user_roles
ON DELETE CASCADE

-- Delete delegator → cascade delete delegations
ON DELETE CASCADE
```

---

## Query Patterns

### Get User with All Sessions
```sql
SELECT 
    u.*,
    COUNT(DISTINCT us._id) as session_count,
    COUNT(DISTINCT CASE WHEN us.is_active THEN us._id END) as active_sessions
FROM users u
LEFT JOIN user_sessions us ON u._id = us.user_id
WHERE u._id = $1
GROUP BY u._id;
```

### Get User Devices
```sql
SELECT * FROM user_devices
WHERE user_id = $1
ORDER BY last_seen_at DESC;
```

### Get User Roles in Tenant
```sql
SELECT r.* 
FROM user_roles ur
JOIN roles r ON ur.role_id = r._id
WHERE ur.user_id = $1 
AND ur.tenant_id = $2
AND ur.deleted_at IS NULL
AND ur.is_active = TRUE
AND (ur.expires_at IS NULL OR ur.expires_at > NOW());
```

### Check Active Delegation
```sql
SELECT * FROM user_delegations
WHERE delegate_id = $1
AND tenant_id = $2
AND is_active = TRUE
AND deleted_at IS NULL
AND valid_from <= NOW()
AND valid_to > NOW();
```

---

**Total Tables:** 7 (PostgreSQL) + 1 (ClickHouse)  
**Total Indexes:** 20+  
**Total Constraints:** 35+  
**Storage Estimate:** ~100 MB per 10,000 users
