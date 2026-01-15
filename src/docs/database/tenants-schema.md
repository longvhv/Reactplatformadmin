# Tenants Database Schema

## Table: `tenants`

### Purpose
Lưu trữ thông tin tenant trong hệ thống SaaS multi-tenancy

### Schema

```sql
CREATE TABLE tenants (
    -- I. ĐỊNH DANH & HẠ TẦNG
    _id UUID PRIMARY KEY,
    code VARCHAR(64) NOT NULL,
    data_region VARCHAR(50) NOT NULL DEFAULT 'ap-southeast-1',
    compliance_level VARCHAR(20) NOT NULL DEFAULT 'STANDARD',
    parent_tenant_id UUID,
    path TEXT,
    
    -- II. THÔNG TIN NGHIỆP VỤ & ĐỊA PHƯƠNG HÓA
    name TEXT NOT NULL,
    tier VARCHAR(50) NOT NULL DEFAULT 'FREE',
    billing_type VARCHAR(20) NOT NULL DEFAULT 'POSTPAID',
    timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',

    -- III. DỮ LIỆU ĐỘNG (JSONB)
    profile JSONB NOT NULL DEFAULT '{}',
    settings JSONB NOT NULL DEFAULT '{}',

    -- IV. TRẠNG THÁI & TRUY VẾT
    status VARCHAR(20) NOT NULL DEFAULT 'TRIAL',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    version BIGINT NOT NULL DEFAULT 1,

    -- V. CÁC RÀNG BUỘC (CONSTRAINTS)
    CONSTRAINT uq_tenants_code UNIQUE (code),
    CONSTRAINT chk_tenants_code_fmt CHECK (code ~ '^[a-z0-9-]+$'),
    CONSTRAINT chk_tenants_tier CHECK (tier IN (
        'FREE', 'PRO', 'ENTERPRISE',
        'PARTNER_BASIC', 'PARTNER_PREMIUM', 'PARTNER_ELITE',
        'PROVIDER'
    )),
    CONSTRAINT fk_tenants_parent FOREIGN KEY (parent_tenant_id) 
        REFERENCES tenants(_id),
    CONSTRAINT chk_tenants_status CHECK (status IN (
        'TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELLED'
    )),
    CONSTRAINT chk_tenants_region CHECK (data_region IN (
        'ap-southeast-1', 'us-east-1', 'eu-central-1'
    )),
    CONSTRAINT chk_tenants_compliance CHECK (compliance_level IN (
        'STANDARD', 'GDPR', 'HIPAA', 'PCI-DSS'
    )),
    CONSTRAINT chk_tenants_billing CHECK (billing_type IN (
        'PREPAID', 'POSTPAID'
    )),
    CONSTRAINT chk_tenants_updated CHECK (updated_at >= created_at),
    CONSTRAINT chk_tenants_version CHECK (version >= 1)
);
```

---

## Indexes

```sql
-- Index hỗ trợ xác thực và điều hướng (Login/Routing) theo subdomain/slug
CREATE UNIQUE INDEX idx_tenants_code_active 
ON tenants (code) 
WHERE deleted_at IS NULL;

-- Index GIN hỗ trợ tìm kiếm linh hoạt bên trong cấu hình Settings
CREATE INDEX idx_tenants_settings_gin 
ON tenants USING GIN (settings);

-- Index GIN hỗ trợ tìm kiếm trong Profile
CREATE INDEX idx_tenants_profile_gin 
ON tenants USING GIN (profile);

-- Index hỗ trợ báo cáo quản trị hệ thống theo khu vực và gói cước
CREATE INDEX idx_tenants_infra_stats 
ON tenants (data_region, tier, status);

-- Index hỗ trợ truy vấn cấu trúc cây đối tác phân phối (Materialized Path)
CREATE INDEX idx_tenants_path 
ON tenants (path ASC) 
WHERE deleted_at IS NULL;
```

---

## Column Details

### Identity & Infrastructure

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| _id | UUID | No | - | Primary key (UUID v7 recommended) |
| code | VARCHAR(64) | No | - | Unique slug/subdomain (lowercase, hyphens) |
| data_region | VARCHAR(50) | No | 'ap-southeast-1' | Data residency region |
| compliance_level | VARCHAR(20) | No | 'STANDARD' | Compliance requirement level |
| parent_tenant_id | UUID | Yes | NULL | Parent tenant for hierarchy |
| path | TEXT | Yes | NULL | Materialized path for tree queries |

### Business Information

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| name | TEXT | No | - | Display name |
| tier | VARCHAR(50) | No | 'FREE' | Subscription tier |
| billing_type | VARCHAR(20) | No | 'POSTPAID' | Billing model |
| timezone | VARCHAR(50) | No | 'UTC' | Default timezone |

### Dynamic Data

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| profile | JSONB | No | '{}' | Business profile (company, tax code, etc) |
| settings | JSONB | No | '{}' | Configuration (MFA, features, etc) |

### Status & Audit

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| status | VARCHAR(20) | No | 'TRIAL' | Tenant status |
| created_at | TIMESTAMPTZ | No | NOW() | Creation timestamp |
| updated_at | TIMESTAMPTZ | No | NOW() | Last update timestamp |
| deleted_at | TIMESTAMPTZ | Yes | NULL | Soft delete timestamp |
| version | BIGINT | No | 1 | Optimistic locking version |

---

## Enums

### Tier
```
FREE              - Free tier (limited features)
PRO               - Professional tier
ENTERPRISE        - Enterprise tier (full features)
PARTNER_BASIC     - Basic partner tier
PARTNER_PREMIUM   - Premium partner tier
PARTNER_ELITE     - Elite partner tier
PROVIDER          - Platform provider (admin)
```

### Status
```
TRIAL      - Trial period (limited time)
ACTIVE     - Active subscription
SUSPENDED  - Temporarily suspended (payment issue)
CANCELLED  - Cancelled (churned)
```

### Data Region
```
ap-southeast-1  - Asia Pacific (Singapore)
us-east-1       - US East (N. Virginia)
eu-central-1    - EU (Frankfurt)
```

### Compliance Level
```
STANDARD  - Standard compliance
GDPR      - GDPR compliant (EU)
HIPAA     - HIPAA compliant (Healthcare, US)
PCI-DSS   - PCI-DSS compliant (Payment)
```

### Billing Type
```
PREPAID   - Pay before use (credit system)
POSTPAID  - Pay after use (invoice)
```

---

## JSONB Schema

### Profile (Example)
```json
{
  "company_name": "ACME Corporation",
  "tax_code": "0123456789",
  "business_license": "ABC-123456",
  "address": {
    "street": "123 Main St",
    "city": "Ho Chi Minh",
    "country": "Vietnam",
    "postal_code": "700000"
  },
  "contact": {
    "email": "contact@acme.com",
    "phone": "+84 123 456 789"
  },
  "industry": "Technology",
  "size": "51-200",
  "website": "https://acme.com"
}
```

### Settings (Example)
```json
{
  "security": {
    "mfa_required": true,
    "password_policy": {
      "min_length": 12,
      "require_uppercase": true,
      "require_number": true,
      "require_special": true
    },
    "session_timeout": 3600,
    "ip_whitelist": ["1.2.3.4", "5.6.7.8"]
  },
  "features": {
    "api_access": true,
    "webhooks": true,
    "sso": true,
    "custom_domain": true
  },
  "notifications": {
    "email": true,
    "slack": true,
    "webhook_url": "https://hooks.slack.com/..."
  },
  "branding": {
    "logo_url": "https://cdn.acme.com/logo.png",
    "primary_color": "#6366f1",
    "company_name": "ACME"
  }
}
```

---

## Relationships

### Parent-Child Hierarchy
```
tenants.parent_tenant_id → tenants._id (self-referencing)
```

**Use Case:** Partner reseller structure
```
Provider Tenant (tier: PROVIDER)
  ├─ Partner A (tier: PARTNER_ELITE)
  │   ├─ Customer A1 (tier: ENTERPRISE)
  │   └─ Customer A2 (tier: PRO)
  └─ Partner B (tier: PARTNER_BASIC)
      └─ Customer B1 (tier: FREE)
```

### Materialized Path
Stored in `path` column: `/parent_id/child_id/`

**Query all descendants:**
```sql
SELECT * FROM tenants 
WHERE path LIKE '/parent_id/%' AND deleted_at IS NULL;
```

---

## Constraints Explained

### Code Format
```sql
CHECK (code ~ '^[a-z0-9-]+$')
```
- Must be lowercase
- Only alphanumeric and hyphens
- No spaces or special characters
- Example: `acme-corp`, `startup-xyz`

### Unique Code (Soft Delete Support)
```sql
CREATE UNIQUE INDEX idx_tenants_code_active 
ON tenants (code) WHERE deleted_at IS NULL;
```
- Code must be unique among active tenants
- Deleted tenants don't block code reuse

### Version Check
```sql
CHECK (version >= 1)
```
- Version starts at 1
- Increments on each update
- Used for optimistic locking

---

## Common Queries

### 1. Get Active Tenants by Region
```sql
SELECT * FROM tenants
WHERE data_region = 'ap-southeast-1'
  AND status = 'ACTIVE'
  AND deleted_at IS NULL
ORDER BY created_at DESC;
```

### 2. Search Tenants with MFA Enabled
```sql
SELECT * FROM tenants
WHERE settings->>'security'->>'mfa_required' = 'true'
  AND deleted_at IS NULL;
```

### 3. Count Tenants by Tier
```sql
SELECT tier, COUNT(*) as count
FROM tenants
WHERE deleted_at IS NULL
GROUP BY tier
ORDER BY count DESC;
```

### 4. Get Tenant Hierarchy
```sql
WITH RECURSIVE tenant_tree AS (
  -- Root tenant
  SELECT * FROM tenants WHERE _id = 'root-tenant-id'
  
  UNION ALL
  
  -- Children
  SELECT t.* FROM tenants t
  INNER JOIN tenant_tree tt ON t.parent_tenant_id = tt._id
)
SELECT * FROM tenant_tree WHERE deleted_at IS NULL;
```

### 5. Search in Profile
```sql
SELECT * FROM tenants
WHERE profile @> '{"industry": "Technology"}'
  AND deleted_at IS NULL;
```

---

## Performance Considerations

### Index Usage
1. **idx_tenants_code_active** - Primary lookup by subdomain/slug
2. **idx_tenants_settings_gin** - Fast JSONB queries on settings
3. **idx_tenants_profile_gin** - Fast JSONB queries on profile
4. **idx_tenants_infra_stats** - Multi-column for analytics
5. **idx_tenants_path** - Hierarchical queries

### Partitioning (Future)
For very large datasets (millions of tenants):
```sql
-- Partition by tier or region
CREATE TABLE tenants_free PARTITION OF tenants FOR VALUES IN ('FREE');
CREATE TABLE tenants_enterprise PARTITION OF tenants FOR VALUES IN ('ENTERPRISE');
```

---

## Security

### Row-Level Security (RLS)
```sql
-- Enable RLS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own tenant
CREATE POLICY tenant_isolation ON tenants
  FOR SELECT
  USING (auth.current_tenant_id() = _id);
```

### Data Encryption
- Profile & Settings may contain sensitive data
- Encrypt at application level before storing
- Use PostgreSQL pgcrypto for column encryption

---

## Migration Scripts

### Create Table
```sql
-- See full CREATE TABLE statement above
```

### Add New Tier
```sql
ALTER TABLE tenants DROP CONSTRAINT chk_tenants_tier;
ALTER TABLE tenants ADD CONSTRAINT chk_tenants_tier 
CHECK (tier IN (
  'FREE', 'PRO', 'ENTERPRISE',
  'PARTNER_BASIC', 'PARTNER_PREMIUM', 'PARTNER_ELITE',
  'PROVIDER', 'CUSTOM_TIER'  -- New tier
));
```

### Add New Region
```sql
ALTER TABLE tenants DROP CONSTRAINT chk_tenants_region;
ALTER TABLE tenants ADD CONSTRAINT chk_tenants_region 
CHECK (data_region IN (
  'ap-southeast-1', 'us-east-1', 'eu-central-1',
  'ap-northeast-1'  -- New region: Tokyo
));
```

---

## Backup & Recovery

### Full Backup
```bash
pg_dump -t tenants -Fc mydb > tenants_backup.dump
```

### Restore
```bash
pg_restore -d mydb tenants_backup.dump
```

### Point-in-Time Recovery
```sql
-- Archive specific tenant data
COPY (SELECT * FROM tenants WHERE _id = 'tenant-id') 
TO '/backup/tenant_id.json';
```
