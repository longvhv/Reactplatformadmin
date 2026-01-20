# 🚀 INITIALIZATION GUIDE V2

## 📋 CẤU TRÚC SCHEMA MỚI

### **Thay đổi chính:**

1. **applications** - Đơn giản hơn, chỉ có `is_active`
2. **permissions** - Tree structure với parent_code, path, is_group
3. **roles** - Có `permission_codes` array thay vì bảng role_permissions
4. **tenant_app_routes** - Domain + path_prefix thay vì route_path
5. **tenant_subscriptions** - Cấu trúc đầy đủ billing info
6. **tenant_members** - Có employee_code, job_title, manager_id
7. **user_roles** - Có scope system với expires_at
8. **users** - full_name, is_support_staff, mfa_enabled

---

## 🐘 YUGABYTEDB SETUP

### **1. Chạy Script:**

```bash
ysqlsh -h localhost -p 5433 -U yugabyte -d your_database \
  -f scripts/yugabyte-init-v2.sql
```

### **2. Features:**

- ✅ Auto hash password với bcrypt
- ✅ Tạo 33 permissions (tree structure)
- ✅ Administrator role với tất cả permissions
- ✅ Unlimited subscription
- ✅ Admin user với password: Vhv@2026
- ✅ Full verification

### **3. Login:**

```
Email: admin@saas.coquan.vn
Password: Vhv@2026
```

---

## 🔵 SUPABASE SETUP

### **Bước 1: Tạo User trong Supabase Auth**

1. Mở Supabase Dashboard
2. Vào **Authentication** > **Users**
3. Click **Add User** > **Create new user**
4. Nhập:
   ```
   Email: admin@saas.coquan.vn
   Password: Vhv@2026
   ✓ Auto Confirm Email
   ```
5. Click **Create user**
6. **Copy User ID** (UUID) - Ví dụ: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`

### **Bước 2: Chỉnh sửa Script**

Mở file `scripts/supabase-init-v2.sql` và thay đổi dòng 19:

```sql
-- Từ:
v_user_id UUID := 'USER_ID_HERE';

-- Thành (paste User ID từ bước 1):
v_user_id UUID := 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
```

### **Bước 3: Chạy Script**

1. Trong Supabase Dashboard
2. Vào **SQL Editor**
3. New Query
4. Copy toàn bộ nội dung file `scripts/supabase-init-v2.sql` (đã edit)
5. Paste và click **Run**

### **Bước 4: Verify**

Kiểm tra output - Should see:

```
✅ Applications: 1
✅ Permissions: 33
✅ Roles: 1
✅ Tenant Applications: 1
✅ Tenant Routes: 1
✅ Subscriptions: 1
✅ Users: 1
✅ Tenant Members: 1
✅ User Roles: 1

🎉 INITIALIZATION COMPLETED!
```

---

## 📊 DỮ LIỆU ĐƯỢC TẠO

### **1. Application: PLATFORM_ADMIN**
```sql
code: PLATFORM_ADMIN
name: Platform Admin
is_active: true
```

### **2. Permissions Tree (33 permissions):**

```
admin/
  ├─ admin.all (Full Admin Access)
  ├─ admin.settings (System Settings)
  └─ admin.audit (Audit Logs)

users/
  ├─ users.view
  ├─ users.create
  ├─ users.edit
  ├─ users.delete
  └─ users.export

tenants/
  ├─ tenants.view
  ├─ tenants.create
  ├─ tenants.edit
  ├─ tenants.delete
  └─ tenants.settings

products/
  ├─ products.view
  ├─ products.create
  ├─ products.edit
  ├─ products.delete
  └─ products.pricing

orders/
  ├─ orders.view
  ├─ orders.create
  ├─ orders.edit
  ├─ orders.cancel
  └─ orders.refund

roles/
  ├─ roles.view
  ├─ roles.create
  ├─ roles.edit
  ├─ roles.delete
  └─ roles.assign
```

### **3. Role: Administrator**
```sql
tenant_id: 078e19ae-af67-4452-9ccd-10e27acb2dfe
type: SYSTEM
permission_codes: [all 33 permissions]
```

### **4. Tenant Application:**
```sql
app_code: PLATFORM_ADMIN
license_type: ENTERPRISE
max_users: NULL (unlimited)
expires_at: NULL (never expires)
settings: {"features": ["all"], "custom_domain": true, "api_access": true}
```

### **5. Tenant Route:**
```sql
domain: saas.coquan.vn
path_prefix: /
is_primary: true
is_custom_domain: true
ssl_status: ACTIVE
route_scope: SPECIFIC_DOMAIN
```

### **6. Subscription:**
```sql
subscription_name: Unlimited Enterprise Plan
plan_name: UNLIMITED_ENTERPRISE
status: active
billing_cycle: yearly
max_users: 999999 (virtually unlimited)
max_storage_gb: 999999
features: [all_features, unlimited_users, unlimited_storage, ...]
base_price: 0 (free for platform admin)
```

### **7. User:**
```sql
email: admin@saas.coquan.vn
full_name: System Administrator
status: ACTIVE
is_support_staff: true
is_verified: true
locale: vi-VN
```

### **8. Tenant Member:**
```sql
employee_code: ADMIN001
internal_email: admin@saas.coquan.vn
job_title: System Administrator
role: OWNER
status: ACTIVE
permissions: ["admin.all"]
```

### **9. User Role:**
```sql
role: Administrator (SYSTEM)
scope: tenant
expires_at: NULL (never expires)
is_active: true
```

---

## 🔐 PASSWORD MANAGEMENT

### **YugabyteDB:**
- Password **hashed with bcrypt** in database
- Cost factor: 10
- Can verify: `password_hash = crypt('Vhv@2026', password_hash)`

### **Supabase:**
- Password managed by **Supabase Auth**
- Set in Auth Dashboard when creating user
- `users.password_hash` is NULL (not used)
- Authentication handled by Supabase Auth API

---

## ✅ VERIFICATION QUERIES

### **Check All Permissions for User:**

```sql
SELECT 
  u.email,
  r.name as role,
  r.permission_codes
FROM users u
JOIN user_roles ur ON ur.user_id = u._id
JOIN roles r ON r._id = ur.role_id
WHERE u.email = 'admin@saas.coquan.vn'
  AND ur.is_active = true;
```

### **Check Permission Tree:**

```sql
SELECT 
  code,
  parent_code,
  path,
  is_group,
  name
FROM permissions
WHERE app_code = 'PLATFORM_ADMIN'
ORDER BY path;
```

### **Check Tenant Routes:**

```sql
SELECT 
  domain,
  path_prefix,
  app_code,
  is_primary,
  status,
  route_scope
FROM tenant_app_routes
WHERE tenant_id = '078e19ae-af67-4452-9ccd-10e27acb2dfe';
```

### **Check Subscription:**

```sql
SELECT 
  subscription_name,
  plan_name,
  status,
  max_users,
  current_users,
  max_storage_gb,
  features
FROM tenant_subscriptions
WHERE tenant_id = '078e19ae-af67-4452-9ccd-10e27acb2dfe';
```

---

## 🔧 CUSTOMIZATION

### **Thêm Permission Mới:**

```sql
-- Add root group
INSERT INTO permissions (code, app_code, parent_code, path, is_group, name, description)
VALUES ('reports', 'PLATFORM_ADMIN', NULL, '/reports', true, 'Reports', 'Reporting module');

-- Add child permissions
INSERT INTO permissions (code, app_code, parent_code, path, is_group, name, description)
VALUES 
  ('reports.view', 'PLATFORM_ADMIN', 'reports', '/reports/view', false, 'View Reports', 'View all reports'),
  ('reports.export', 'PLATFORM_ADMIN', 'reports', '/reports/export', false, 'Export Reports', 'Export report data');

-- Update Administrator role
UPDATE roles
SET permission_codes = array_append(permission_codes, 'reports.view'),
    permission_codes = array_append(permission_codes, 'reports.export'),
    version = version + 1
WHERE tenant_id = '078e19ae-af67-4452-9ccd-10e27acb2dfe'
  AND type = 'SYSTEM'
  AND name = 'Administrator';
```

### **Tạo Custom Role:**

```sql
INSERT INTO roles (
  _id,
  tenant_id,
  name,
  description,
  type,
  permission_codes,
  created_at,
  updated_at,
  version
) VALUES (
  gen_random_uuid(),
  '078e19ae-af67-4452-9ccd-10e27acb2dfe',
  'Content Editor',
  'Can manage products and orders',
  'CUSTOM',
  ARRAY['products.view', 'products.create', 'products.edit', 'orders.view'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  1
);
```

### **Thêm Route Mới:**

```sql
INSERT INTO tenant_app_routes (
  _id,
  tenant_id,
  app_code,
  domain,
  path_prefix,
  is_primary,
  is_custom_domain,
  ssl_status,
  status,
  route_scope
) VALUES (
  gen_random_uuid(),
  '078e19ae-af67-4452-9ccd-10e27acb2dfe',
  'PLATFORM_ADMIN',
  'admin.yourcompany.com',
  '/dashboard',
  false,
  true,
  'PENDING',
  'PENDING_DNS',
  'SPECIFIC_DOMAIN'
);
```

---

## 🐛 TROUBLESHOOTING

### **Supabase: "USER_ID_HERE" Error**

```
❌ ERROR: Please replace USER_ID_HERE with actual user ID from Supabase Auth!
```

**Solution:** 
1. Tạo user trong Auth Dashboard first
2. Copy User ID
3. Replace trong script line 19

### **YugabyteDB: Extension Error**

```sql
-- Run as superuser:
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

### **Permission Codes Array Issue**

```sql
-- Check current permissions
SELECT permission_codes FROM roles 
WHERE tenant_id = '078e19ae-af67-4452-9ccd-10e27acb2dfe';

-- Update if needed
UPDATE roles
SET permission_codes = (
  SELECT array_agg(code)
  FROM permissions
  WHERE app_code = 'PLATFORM_ADMIN'
)
WHERE tenant_id = '078e19ae-af67-4452-9ccd-10e27acb2dfe';
```

---

## 📈 PERFORMANCE NOTES

### **Permission Codes Array:**
- Fast lookup: `'admin.all' = ANY(permission_codes)`
- No join needed to check permissions
- Trade-off: Must update array when permissions change

### **Tree Structure:**
- Use `path` for hierarchy queries
- `is_group` separates categories from actual permissions
- Can query all children: `WHERE path LIKE '/users%'`

### **Indexes Recommended:**

```sql
-- Permission lookups
CREATE INDEX idx_permissions_app_code ON permissions(app_code);
CREATE INDEX idx_permissions_parent_code ON permissions(parent_code);
CREATE INDEX idx_permissions_path ON permissions USING gin(path gin_trgm_ops);

-- User role lookups
CREATE INDEX idx_user_roles_user_tenant ON user_roles(user_id, tenant_id);
CREATE INDEX idx_user_roles_active ON user_roles(is_active) WHERE is_active = true;

-- Route lookups
CREATE INDEX idx_routes_domain ON tenant_app_routes(domain);
CREATE INDEX idx_routes_tenant_app ON tenant_app_routes(tenant_id, app_code);
```

---

## 🎯 QUICK REFERENCE

### **YugabyteDB:**
```bash
# Run init
ysqlsh -h localhost -U yugabyte -d mydb -f scripts/yugabyte-init-v2.sql

# Login
Email: admin@saas.coquan.vn
Password: Vhv@2026 (bcrypt hashed)
```

### **Supabase:**
```bash
# Steps:
1. Create user in Auth (admin@saas.coquan.vn / Vhv@2026)
2. Copy User ID
3. Edit script line 19
4. Run in SQL Editor

# Login
Email: admin@saas.coquan.vn
Password: Vhv@2026 (via Supabase Auth)
```

---

**TOTAL RECORDS:** 50+ created  
**PERMISSIONS:** 33 (6 groups + 27 actions)  
**TIME:** ~5-10 seconds  
**IDEMPOTENT:** ✅ Yes  

🎉 **READY TO USE!**
