# 📋 SCHEMA CHANGES - V1 vs V2

## 🔄 OVERVIEW

Đây là danh sách chi tiết các thay đổi schema từ V1 sang V2.

---

## 📊 BẢNG THAY ĐỔI

### ✅ **1. applications**

#### V1:
```sql
- type (INTERNAL, EXTERNAL, etc.)
- status (ACTIVE, INACTIVE)
```

#### V2:
```sql
- is_active (boolean) ← Thay thế type + status
+ created_by, updated_by, deleted_at, deleted_by
+ version (bigint)
+ Constraint: chk_app_code_format (^[A-Z0-9_]+$)
```

**Impact:** Code phải viết HOA và chỉ gồm A-Z, 0-9, underscore

---

### ✅ **2. permissions**

#### V1:
```sql
- resource (e.g., 'users')
- action (e.g., 'view')
- name
- description
```

#### V2:
```sql
+ app_code (FK to applications.code)
+ parent_code (FK to permissions.code) ← Tree structure!
+ path (text) ← Hierarchical path
+ is_group (boolean) ← Distinguish categories
- resource, action ← Replaced by code
+ created_by, updated_by, deleted_at, deleted_by
+ version (bigint)
```

**Impact:** 
- Permissions giờ là tree structure
- Code format: 'users.view' thay vì resource='users', action='view'
- Có groups và leaf permissions

**Example:**
```sql
-- V1:
resource='users', action='view' → code='users.view'

-- V2:
parent_code=NULL, code='users', is_group=true  ← Group
parent_code='users', code='users.view', is_group=false  ← Leaf
```

---

### ✅ **3. roles**

#### V1:
```sql
- is_system (boolean)
- No direct permissions storage
- Requires role_permissions table
```

#### V2:
```sql
+ tenant_id (UUID, NOT NULL) ← Tenant-scoped!
+ type (SYSTEM/CUSTOM) ← Thay thế is_system
+ permission_codes (text[]) ← Array of permission codes!
+ version (bigint)
- No role_permissions table needed
```

**Impact:**
- **BIG CHANGE:** Permissions stored directly in roles table as array
- No need for role_permissions junction table
- Faster permission checks: `'admin.all' = ANY(permission_codes)`
- Must update array when adding/removing permissions

**Example:**
```sql
-- V1:
role → role_permissions → permissions (3 tables join)

-- V2:
role.permission_codes = ['admin.all', 'users.view', ...] (1 table)
```

---

### ❌ **4. role_permissions** (REMOVED!)

#### V1:
```sql
Table existed: role_id, permission_id
```

#### V2:
```sql
❌ TABLE REMOVED - Replaced by roles.permission_codes array
```

---

### ✅ **5. tenant_app_routes**

#### V1:
```sql
- route_path (e.g., '/admin/users')
- route_name
- route_type
- is_active
```

#### V2:
```sql
+ domain (e.g., 'saas.coquan.vn')
+ path_prefix (e.g., '/')
+ is_primary (boolean)
+ is_custom_domain (boolean)
+ ssl_status (NONE/PENDING/ACTIVE/FAILED)
+ route_scope (SPECIFIC_DOMAIN/ALL_MY_DOMAINS/INHERITED)
+ status (ACTIVE/INACTIVE/MAINTENANCE/PENDING_DNS)
+ version (bigint)
- route_path, route_name, route_type ← Removed
+ Unique constraint: (domain, path_prefix)
```

**Impact:**
- Routes are now domain-based instead of path-based
- Support custom domains
- SSL management
- Multi-domain routing

**Example:**
```sql
-- V1:
route_path = '/admin/users'

-- V2:
domain = 'saas.coquan.vn', path_prefix = '/admin'
```

---

### ✅ **6. tenant_applications**

#### V1:
```sql
- Simple activation tracking
- domain, path_prefix
```

#### V2:
```sql
+ license_type (TRIAL/BASIC/PREMIUM/ENTERPRISE)
+ max_users (integer, nullable for unlimited)
+ expires_at (timestamp, nullable)
+ settings (jsonb)
+ activated_at, deactivated_at
+ created_by, updated_by, deleted_at, deleted_by
+ version (bigint)
- domain, path_prefix ← Moved to tenant_app_routes
```

**Impact:**
- License management
- User limits
- Expiration tracking
- Flexible settings storage

---

### ✅ **7. tenant_members**

#### V1:
```sql
- Basic user membership
- role (OWNER/ADMIN/MEMBER)
- status
```

#### V2:
```sql
+ employee_code (varchar(50), unique per tenant)
+ internal_email (varchar(255))
+ job_title (varchar(100))
+ manager_id (UUID, FK to tenant_members) ← Org chart!
+ permissions (jsonb) ← Member-specific permissions
+ metadata (jsonb)
+ created_by, updated_by, deleted_by
+ version (bigint)
```

**Impact:**
- Full employee management
- Organization hierarchy (manager_id)
- Individual permission overrides
- Rich metadata

---

### ✅ **8. tenant_subscriptions**

#### V1:
```sql
- Basic subscription
- plan_name, plan_type
- start_date, end_date
- status
- is_unlimited
```

#### V2:
```sql
+ subscription_number (varchar(50), unique)
+ plan_id, order_id (UUIDs)
+ trial_end_date, renewal_date
+ billing_cycle (monthly/quarterly/yearly/custom)
+ base_price, discount_amount, tax_amount, total_amount
+ currency (varchar(3))
+ max_users, current_users
+ max_storage_gb, current_storage_gb
+ features (jsonb array)
+ limits (jsonb object)
+ payment_method, payment_status
+ last_payment_date, next_payment_date
+ billing_contact_name, billing_contact_email, billing_contact_phone
+ notes, metadata, tags
+ Many constraints for validation
```

**Impact:**
- **MASSIVE EXPANSION** - Full billing system
- Usage tracking (users, storage)
- Payment management
- Feature flags
- Rate limiting support

---

### ✅ **9. user_roles**

#### V1:
```sql
- user_id, role_id, tenant_id
- assigned_at, assigned_by
```

#### V2:
```sql
+ scope (varchar(50), default 'global')
+ scope_id (UUID, nullable)
+ granted_by (UUID)
+ granted_at, expires_at ← Role expiration!
+ is_active (boolean)
+ metadata (jsonb)
+ Unique: (user_id, role_id, scope, scope_id)
```

**Impact:**
- Scoped roles (global/tenant/project/resource)
- Role expiration
- Better audit trail
- Flexible scoping

**Example:**
```sql
-- Global role
scope='global', scope_id=NULL

-- Tenant role
scope='tenant', scope_id='tenant-uuid'

-- Project role
scope='project', scope_id='project-uuid'
```

---

### ✅ **10. users**

#### V1:
```sql
- email, password_hash
- name
- avatar_url
- status
- is_verified
```

#### V2:
```sql
+ full_name ← Renamed from 'name'
+ phone_number (unique)
+ is_support_staff (boolean) ← Staff flag
+ mfa_enabled, mfa_secret ← MFA support!
+ locale (varchar(10), default 'vi-VN')
+ metadata (jsonb)
+ deleted_at ← Soft delete
+ Constraints: email format, URL format, status values
```

**Impact:**
- MFA support
- Support staff identification
- Localization
- Phone number tracking
- Better validation

---

## 🎯 MIGRATION CHECKLIST

### **Data Migration:**

- [ ] Convert permissions: resource/action → code format
- [ ] Build permission tree structure
- [ ] Migrate role_permissions to permission_codes arrays
- [ ] Update tenant_app_routes: route_path → domain + path_prefix
- [ ] Expand tenant_subscriptions with billing info
- [ ] Add employee data to tenant_members
- [ ] Convert user.name → user.full_name
- [ ] Add user_roles scoping data

### **Application Code:**

- [ ] Update permission checks to use code format
- [ ] Update role queries (no more role_permissions join)
- [ ] Update routing logic for domain-based routes
- [ ] Add billing/subscription handling
- [ ] Add employee management features
- [ ] Add MFA support
- [ ] Update user profile with full_name

---

## 📈 PERFORMANCE IMPACT

### **Improvements:**

✅ **Roles:** Faster permission checks (array contains vs join)
✅ **Permissions:** Tree queries with path indexing
✅ **Routes:** Domain-based routing is more flexible

### **Considerations:**

⚠️ **Roles:** Array updates when permissions change
⚠️ **Subscriptions:** Large JSONB fields may need indexing
⚠️ **Members:** Manager hierarchy queries may need recursive CTEs

---

## 🔍 RECOMMENDED INDEXES

```sql
-- Permissions
CREATE INDEX idx_permissions_app_code ON permissions(app_code);
CREATE INDEX idx_permissions_parent_code ON permissions(parent_code);
CREATE INDEX idx_permissions_path ON permissions USING gin(to_tsvector('english', path));

-- Roles
CREATE INDEX idx_roles_tenant ON roles(tenant_id);
CREATE INDEX idx_roles_permission_codes ON roles USING gin(permission_codes);

-- Routes
CREATE INDEX idx_routes_domain ON tenant_app_routes(domain);
CREATE INDEX idx_routes_tenant_app ON tenant_app_routes(tenant_id, app_code);

-- Members
CREATE INDEX idx_members_manager ON tenant_members(manager_id);
CREATE INDEX idx_members_employee_code ON tenant_members(tenant_id, employee_code);

-- User Roles
CREATE INDEX idx_user_roles_scope ON user_roles(scope, scope_id);
CREATE INDEX idx_user_roles_active ON user_roles(is_active) WHERE is_active = true;

-- Subscriptions
CREATE INDEX idx_subscriptions_tenant ON tenant_subscriptions(tenant_id);
CREATE INDEX idx_subscriptions_status ON tenant_subscriptions(status);
CREATE INDEX idx_subscriptions_features ON tenant_subscriptions USING gin(features);
```

---

## 💡 BREAKING CHANGES

### **Critical:**

1. ❌ **role_permissions table removed** - Must migrate to permission_codes array
2. 🔄 **permissions.code format changed** - Update all permission checks
3. 🔄 **tenant_app_routes completely redesigned** - Update routing logic
4. 🔄 **users.name → users.full_name** - Update all queries

### **Medium:**

5. ➕ **tenant_id required in roles** - All roles now tenant-scoped
6. ➕ **app_code required in permissions** - Permissions now app-scoped
7. 🔄 **user_roles scoping system** - Update role assignment logic

### **Minor:**

8. ➕ Many new optional fields
9. ➕ New constraints and validations
10. ➕ Version tracking on most tables

---

## 🚀 UPGRADE PATH

### **Option 1: Fresh Install (Recommended)**

1. Backup old database
2. Deploy new schema
3. Run init-v2 scripts
4. Manually migrate critical data if needed

### **Option 2: In-Place Migration**

1. Create migration scripts for each table
2. Run in transaction
3. Verify data integrity
4. Update application code
5. Deploy

---

**TOTAL CHANGES:** 10 tables modified, 1 table removed  
**BREAKING CHANGES:** 7 critical  
**NEW FEATURES:** 20+  

⚠️ **Plan carefully before upgrading!**
