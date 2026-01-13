# Database Schema Comparison Analysis

**Date**: 2026-01-12  
**Purpose**: Compare Collections.md (from GitHub repo) vs DATABASE_SCHEMA_STANDARD.md (current project standard)

---

## 📊 EXECUTIVE SUMMARY

### Collections.md (Source from vhvplatform/react-framework)
- **Size**: 129 KB
- **Format**: Excel-style table (Bảng | Tên trường | Kiểu dữ liệu | Null? | Default | Constraints | Mô tả)
- **Scope**: Comprehensive SaaS B2B database design with 50+ tables
- **Database**: YugabyteDB (PostgreSQL compatible) - YSQL

### DATABASE_SCHEMA_STANDARD.md (Current Project)
- **Size**: Standard template document
- **Format**: Markdown with examples
- **Scope**: Standards and best practices
- **Database**: PostgreSQL/Supabase

---

## ✅ COMPLIANCE MATRIX

| Feature | Collections.md | DATABASE_SCHEMA_STANDARD.md | Status |
|---------|---------------|----------------------------|--------|
| **Primary Key** | `_id UUID` | `_id UUID` | ✅ 100% Match |
| **Tenancy** | `tenant_id UUID NOT NULL` | `tenant_id UUID NOT NULL` | ✅ 100% Match |
| **Audit Trail** |  |  |  |
| └─ created_at | ✅ TIMESTAMPTZ | ✅ TIMESTAMPTZ | ✅ Match |
| └─ updated_at | ✅ TIMESTAMPTZ | ✅ TIMESTAMPTZ | ✅ Match |
| └─ created_by | ✅ UUID (some tables) | ✅ UUID NULL | ⚠️ Partial |
| └─ updated_by | ❌ Missing | ✅ UUID NULL | ❌ **GAP** |
| **Soft Delete** |  |  |  |
| └─ deleted_at | ✅ TIMESTAMPTZ NULL | ✅ TIMESTAMPTZ NULL | ✅ Match |
| └─ deleted_by | ❌ Missing | ✅ UUID NULL | ❌ **GAP** |
| **Optimistic Locking** |  |  |  |
| └─ version | ✅ BIGINT DEFAULT 1 | ✅ INT DEFAULT 1 | ⚠️ Type diff |
| **Naming Convention** | snake_case | snake_case | ✅ Match |
| **Boolean Prefix** | ⚠️ Mixed (is_*, has_*) | ✅ is_/has_/can_ | ⚠️ Needs review |

---

## 🔍 DETAILED FIELD COMPARISON

### Example: `tenants` table

#### Collections.md
```sql
CREATE TABLE tenants (
  _id                   UUID PRIMARY KEY,
  code                  VARCHAR(64) NOT NULL UNIQUE,
  name                  TEXT NOT NULL,
  tenant_id             -- ❌ N/A (tenants IS source table)
  
  -- Audit
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by            -- ❌ MISSING
  updated_by            -- ❌ MISSING
  
  -- Soft delete
  deleted_at            TIMESTAMPTZ NULL,
  deleted_by            -- ❌ MISSING
  
  -- Versioning
  version               BIGINT NOT NULL DEFAULT 1,
  
  -- Business fields
  data_region           VARCHAR(50) NOT NULL DEFAULT 'ap-southeast-1',
  parent_tenant_id      UUID NULL REFERENCES tenants(_id),
  path                  TEXT,
  compliance_level      VARCHAR(20) DEFAULT 'STANDARD',
  tier                  VARCHAR(50) DEFAULT 'FREE',
  billing_type          VARCHAR(20) DEFAULT 'POSTPAID',
  timezone              VARCHAR(50) DEFAULT 'UTC',
  profile               JSONB DEFAULT '{}'::jsonb,
  settings              JSONB DEFAULT '{}'::jsonb,
  status                VARCHAR(20) DEFAULT 'TRIAL',
  active_apps           TEXT[],
  metadata              JSONB DEFAULT '{}'::jsonb
);
```

#### DATABASE_SCHEMA_STANDARD.md Template
```sql
CREATE TABLE tenants (
  -- Identity (NO tenant_id for source table)
  _id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Business fields
  name                  VARCHAR(255) NOT NULL,
  slug                  VARCHAR(100) NOT NULL UNIQUE,
  
  -- Audit trail
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  created_by            UUID NULL,          -- ✅ PRESENT
  updated_by            UUID NULL,          -- ✅ PRESENT
  
  -- Soft delete
  deleted_at            TIMESTAMPTZ NULL,
  deleted_by            UUID NULL,          -- ✅ PRESENT
  
  -- Versioning
  version               INT DEFAULT 1
);
```

---

## 🎯 KEY DIFFERENCES

### 1. Missing Audit Fields in Collections.md

**Collections.md** chỉ có:
- ✅ `created_at`
- ✅ `updated_at`
- ⚠️ `created_by` (chỉ có ở một số tables như `tenant_members`)
- ❌ `updated_by` (HOÀN TOÀN THIẾU)

**DATABASE_SCHEMA_STANDARD.md** yêu cầu đầy đủ:
- ✅ `created_at`
- ✅ `updated_at`
- ✅ `created_by`
- ✅ `updated_by`
- ✅ `deleted_by`

---

### 2. Version Field Type

- **Collections.md**: `BIGINT` (8 bytes, range -9,223,372,036,854,775,808 to +9,223,372,036,854,775,807)
- **DATABASE_SCHEMA_STANDARD.md**: `INT` (4 bytes, range -2,147,483,648 to +2,147,483,647)

**Recommendation**: Use `BIGINT` for future-proofing high-frequency updates.

---

### 3. Extended Fields in Collections.md

Collections.md has advanced features not in standard template:

#### tenants table:
- `data_region` - Geo-partitioning for compliance
- `parent_tenant_id` - Hierarchical multi-tenancy (Partners/Resellers)
- `path` - Materialized path for tree queries
- `compliance_level` - GDPR/HIPAA/PCI-DSS
- `tier` - Subscription tier
- `billing_type` - PREPAID/POSTPAID
- `profile` JSONB - Branding, logo, tax info
- `settings` JSONB - Security policies, MFA, IP whitelist
- `active_apps` TEXT[] - App permission cache

#### tenant_members table:
- `display_name` - Different name per tenant
- `custom_data` JSONB - Dynamic HR fields
- `joined_at` - Separate from created_at
- ✅ `created_by` UUID - **Present here**

---

## 📋 TABLES INVENTORY

### Collections.md Tables (50+):

#### Core & Identity
1. **tenants** - Main tenant table
2. **users** - Global user identity
3. **tenant_members** - User-Tenant relationship
4. **departments** - Organizational structure
5. **department_members** - N-N relationship
6. **user_groups** - Working groups/squads
7. **group_members** - Group membership
8. **locations** - Physical offices/branches

#### Authentication & Security
9. **user_linked_identities** - SSO/OAuth providers
10. **sessions** - Active sessions
11. **password_history** - Password rotation
12. **mfa_configs** - 2FA settings
13. **api_keys** - API authentication

#### Authorization (RBAC)
14. **roles** - Role definitions
15. **permissions** - Permission registry
16. **role_permissions** - Role-Permission mapping
17. **tenant_member_roles** - User role assignments
18. **group_role_assignments** - Group-based roles

#### Subscription & Billing
19. **service_packages** - Subscription plans
20. **package_features** - Feature definitions
21. **tenant_subscriptions** - Active subscriptions
22. **invoices** - Billing invoices
23. **invoice_items** - Line items
24. **payments** - Payment transactions
25. **payment_methods** - Stored payment methods

#### System Configuration
26. **app_configs** - Global app settings
27. **tenant_app_configs** - Tenant-specific configs (MongoDB)
28. **feature_flags** - Feature toggles
29. **notification_templates** - Email/SMS templates
30. **email_logs** - Email delivery tracking

#### Audit & Logs
31. **audit_logs** - System audit trail (ClickHouse)
32. **login_history** - Login attempts
33. **access_logs** - API access logs (ClickHouse)
34. **data_change_logs** - Data modification history

#### Integration & Webhooks
35. **webhooks** - Webhook configurations
36. **webhook_deliveries** - Delivery attempts
37. **integrations** - Third-party integrations
38. **api_rate_limits** - Rate limiting configs

#### Business Entities (Examples)
39. **products** - Product catalog (MongoDB)
40. **orders** - Order management
41. **customers** - Customer data
42. **contacts** - Contact information
43. **tasks** - Task management
44. **projects** - Project tracking
45. **documents** - Document storage metadata
46. **comments** - Comments/notes
47. **tags** - Tagging system
48. **attachments** - File attachments

And more...

---

## ⚠️ MIGRATION GAPS TO ADDRESS

### Critical Gaps (Must Fix)

1. **Missing `updated_by` field** across ALL tables in Collections.md
   - Impact: Cannot track who modified records
   - Solution: Add `updated_by UUID NULL` to all tables

2. **Missing `deleted_by` field** across ALL tables in Collections.md
   - Impact: Cannot track who deleted records
   - Solution: Add `deleted_by UUID NULL` to all tables

3. **Inconsistent `created_by` field**
   - Present in: tenant_members, some other tables
   - Missing in: tenants, users, departments, etc.
   - Solution: Add `created_by UUID NULL` to all missing tables

---

### Recommended Enhancements

4. **Add triggers for `updated_at`**
   - Collections.md defines CHECK constraint but no auto-update trigger
   - Solution: Add BEFORE UPDATE triggers

5. **Add indexes for audit fields**
   ```sql
   CREATE INDEX idx_{table}_created_by ON {table}(created_by);
   CREATE INDEX idx_{table}_updated_by ON {table}(updated_by);
   CREATE INDEX idx_{table}_deleted_by ON {table}(deleted_by);
   ```

6. **Foreign key constraints for audit fields**
   ```sql
   ALTER TABLE {table} 
   ADD CONSTRAINT fk_{table}_created_by 
   FOREIGN KEY (created_by) REFERENCES users(_id);
   ```

---

## 🎨 UNIFIED STANDARD PROPOSAL

### Merge both standards into ONE definitive schema:

```sql
-- ============================================
-- UNIFIED STANDARD TEMPLATE
-- Combines Collections.md + DATABASE_SCHEMA_STANDARD.md
-- ============================================

CREATE TABLE {table_name} (
  -- ============================================
  -- 1. IDENTITY & TENANCY
  -- ============================================
  _id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL,  -- Omit for GLOBAL tables
  
  -- ============================================
  -- 2. BUSINESS FIELDS
  -- ============================================
  code              VARCHAR(100) NOT NULL,
  name              VARCHAR(255) NOT NULL,
  status            SMALLINT DEFAULT 1,
  -- ... your specific fields
  
  -- ============================================
  -- 3. AUDIT TRAIL (COMPLETE)
  -- ============================================
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by        UUID NULL,      -- ✅ Added
  updated_by        UUID NULL,      -- ✅ Added
  
  -- ============================================
  -- 4. SOFT DELETE (COMPLETE)
  -- ============================================
  deleted_at        TIMESTAMPTZ NULL,
  deleted_by        UUID NULL,      -- ✅ Added
  
  -- ============================================
  -- 5. OPTIMISTIC LOCKING
  -- ============================================
  version           BIGINT NOT NULL DEFAULT 1,  -- ✅ Use BIGINT
  
  -- ============================================
  -- 6. CONSTRAINTS
  -- ============================================
  UNIQUE(tenant_id, code),
  CHECK (updated_at >= created_at),
  CHECK (version >= 1),
  
  CONSTRAINT fk_{table}_created_by FOREIGN KEY (created_by) REFERENCES users(_id),
  CONSTRAINT fk_{table}_updated_by FOREIGN KEY (updated_by) REFERENCES users(_id),
  CONSTRAINT fk_{table}_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(_id)
);

-- ============================================
-- 7. INDEXES
-- ============================================
-- Mandatory
CREATE INDEX idx_{table}_tenant_id ON {table}(tenant_id);
CREATE INDEX idx_{table}_deleted_at ON {table}(deleted_at);
CREATE INDEX idx_{table}_tenant_deleted ON {table}(tenant_id, deleted_at);

-- Audit trail
CREATE INDEX idx_{table}_created_by ON {table}(created_by);
CREATE INDEX idx_{table}_updated_by ON {table}(updated_by);
CREATE INDEX idx_{table}_deleted_by ON {table}(deleted_by);
CREATE INDEX idx_{table}_created_at ON {table}(created_at);

-- ============================================
-- 8. TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION update_{table}_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_{table}_updated_at
BEFORE UPDATE ON {table}
FOR EACH ROW
EXECUTE FUNCTION update_{table}_updated_at();
```

---

## 📝 NEXT STEPS

1. ✅ Create ALTER TABLE migration scripts to add missing fields
2. ✅ Update Golang backend migrations to match unified standard
3. ✅ Update Supabase migrations if needed
4. ✅ Add foreign key constraints for audit fields
5. ✅ Add indexes for performance
6. ✅ Create triggers for auto-update
7. ✅ Update application code to populate audit fields

---

**Status**: Analysis Complete ✅  
**Recommendation**: Proceed with migration scripts creation
