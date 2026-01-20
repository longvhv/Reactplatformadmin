# 📂 SCRIPTS DIRECTORY

Thư mục chứa tất cả scripts khởi tạo database cho YugabyteDB và Supabase.

---

## 📋 FILE INDEX

### **🎯 MAIN SCRIPTS (V2 - Current)**

| File | Description | Use Case |
|------|-------------|----------|
| `yugabyte-init-v2.sql` | YugabyteDB initialization script | Production YugabyteDB setup |
| `supabase-init-v2.sql` | Supabase initialization script | Production Supabase setup |
| `QUICK_SETUP_V2.md` | Quick setup guide (3 min) | Fast reference |
| `INIT_V2_GUIDE.md` | Complete guide with examples | Full documentation |
| `SCHEMA_CHANGES.md` | V1 vs V2 comparison | Migration planning |

### **📚 DOCUMENTATION**

| File | Description |
|------|-------------|
| `README.md` | This file |
| `YUGABYTE_SETUP.md` | YugabyteDB detailed guide (V1) |

### **🗂️ LEGACY (V1 - Deprecated)**

| File | Description | Status |
|------|-------------|--------|
| `init-tenant-data.sql` | Supabase V1 script | ⚠️ Deprecated |
| `yugabyte-init-tenant-data.sql` | YugabyteDB V1 script | ⚠️ Deprecated |
| `yugabyte-verify-data.sql` | Verification script | ⚠️ Deprecated |
| `create-admin-user.ts` | TypeScript user creator | ⚠️ Deprecated |
| `setup.sh` | Bash setup script | ⚠️ Deprecated |

---

## 🚀 QUICK START

### **For YugabyteDB:**

```bash
ysqlsh -h localhost -p 5433 -U yugabyte -d your_db \
  -f scripts/yugabyte-init-v2.sql
```

**Result:** Admin user created with password hashed in database.

---

### **For Supabase:**

**Step 1:** Create user in Auth Dashboard
```
Email: admin@saas.coquan.vn
Password: Vhv@2026
```

**Step 2:** Edit `supabase-init-v2.sql` line 19
```sql
v_user_id UUID := 'YOUR_USER_ID';
```

**Step 3:** Run in SQL Editor

**Result:** Database records linked to Auth user.

---

## 📊 WHAT GETS CREATED

### **Common (Both Databases):**

- ✅ 1 Application (PLATFORM_ADMIN)
- ✅ 33 Permissions (tree structure with 6 groups)
- ✅ 1 Role (Administrator with all permissions)
- ✅ 1 Tenant Application (ENTERPRISE license)
- ✅ 1 Tenant Route (saas.coquan.vn)
- ✅ 1 Subscription (unlimited)
- ✅ 1 User (admin)
- ✅ 1 Tenant Member (OWNER)
- ✅ 1 User Role (Administrator)

### **Permissions Tree:**

```
📁 admin/ (3 permissions)
   ├─ admin.all - Full Admin Access
   ├─ admin.settings - System Settings
   └─ admin.audit - Audit Logs

📁 users/ (5 permissions)
   ├─ users.view
   ├─ users.create
   ├─ users.edit
   ├─ users.delete
   └─ users.export

📁 tenants/ (5 permissions)
   ├─ tenants.view
   ├─ tenants.create
   ├─ tenants.edit
   ├─ tenants.delete
   └─ tenants.settings

📁 products/ (5 permissions)
   ├─ products.view
   ├─ products.create
   ├─ products.edit
   ├─ products.delete
   └─ products.pricing

📁 orders/ (5 permissions)
   ├─ orders.view
   ├─ orders.create
   ├─ orders.edit
   ├─ orders.cancel
   └─ orders.refund

📁 roles/ (5 permissions)
   ├─ roles.view
   ├─ roles.create
   ├─ roles.edit
   ├─ roles.delete
   └─ roles.assign
```

**Total:** 6 groups + 27 leaf permissions = 33 records

---

## 🔐 LOGIN CREDENTIALS

```
Email: admin@saas.coquan.vn
Password: Vhv@2026
Domain: saas.coquan.vn
Tenant ID: 078e19ae-af67-4452-9ccd-10e27acb2dfe
```

---

## 🔍 VERIFICATION QUERIES

### **Check All Data:**

```sql
SELECT 'Applications' as item, COUNT(*)::text as count
FROM applications WHERE code = 'PLATFORM_ADMIN'
UNION ALL
SELECT 'Permissions', COUNT(*)::text FROM permissions
UNION ALL
SELECT 'Roles', COUNT(*)::text FROM roles 
WHERE tenant_id = '078e19ae-af67-4452-9ccd-10e27acb2dfe'
UNION ALL
SELECT 'Tenant Apps', COUNT(*)::text FROM tenant_applications
WHERE tenant_id = '078e19ae-af67-4452-9ccd-10e27acb2dfe'
UNION ALL
SELECT 'Routes', COUNT(*)::text FROM tenant_app_routes
WHERE tenant_id = '078e19ae-af67-4452-9ccd-10e27acb2dfe'
UNION ALL
SELECT 'Subscriptions', COUNT(*)::text FROM tenant_subscriptions
WHERE tenant_id = '078e19ae-af67-4452-9ccd-10e27acb2dfe'
UNION ALL
SELECT 'Users', COUNT(*)::text FROM users
WHERE email = 'admin@saas.coquan.vn'
UNION ALL
SELECT 'Members', COUNT(*)::text FROM tenant_members
WHERE tenant_id = '078e19ae-af67-4452-9ccd-10e27acb2dfe'
UNION ALL
SELECT 'User Roles', COUNT(*)::text FROM user_roles
WHERE tenant_id = '078e19ae-af67-4452-9ccd-10e27acb2dfe';
```

**Expected:**
```
Applications: 1
Permissions: 33
Roles: 1
Tenant Apps: 1
Routes: 1
Subscriptions: 1
Users: 1
Members: 1
User Roles: 1
```

### **Check User Permissions:**

```sql
SELECT 
  u.email,
  r.name as role,
  r.permission_codes
FROM users u
JOIN user_roles ur ON ur.user_id = u._id
JOIN roles r ON r._id = ur.role_id
WHERE u.email = 'admin@saas.coquan.vn';
```

**Expected:** Administrator role with all 33 permission codes

---

## 🆚 V1 vs V2 DIFFERENCES

### **Major Changes:**

1. **Permissions:** Simple (resource/action) → Tree structure (parent/child)
2. **Roles:** role_permissions table → permission_codes array
3. **Routes:** route_path → domain + path_prefix
4. **Subscriptions:** Basic → Full billing system
5. **Members:** Simple → Employee management
6. **User Roles:** Simple → Scoped with expiration

See `SCHEMA_CHANGES.md` for detailed comparison.

---

## 📝 CUSTOMIZATION

### **Add New Permission:**

```sql
-- Add to existing group
INSERT INTO permissions (
  code, app_code, parent_code, path, is_group, name, description
) VALUES (
  'users.impersonate',
  'PLATFORM_ADMIN',
  'users',
  '/users/impersonate',
  false,
  'Impersonate Users',
  'Login as another user'
);

-- Update Administrator role
UPDATE roles
SET permission_codes = array_append(permission_codes, 'users.impersonate'),
    version = version + 1
WHERE tenant_id = '078e19ae-af67-4452-9ccd-10e27acb2dfe'
  AND type = 'SYSTEM';
```

### **Create Custom Role:**

```sql
INSERT INTO roles (
  _id, tenant_id, name, description, type, permission_codes
) VALUES (
  gen_random_uuid(),
  '078e19ae-af67-4452-9ccd-10e27acb2dfe',
  'Content Manager',
  'Manage products and orders',
  'CUSTOM',
  ARRAY['products.view', 'products.create', 'products.edit', 
        'orders.view', 'orders.create']
);
```

### **Add New Route:**

```sql
INSERT INTO tenant_app_routes (
  _id, tenant_id, app_code, domain, path_prefix, 
  is_primary, ssl_status, status, route_scope
) VALUES (
  gen_random_uuid(),
  '078e19ae-af67-4452-9ccd-10e27acb2dfe',
  'PLATFORM_ADMIN',
  'admin.mycompany.com',
  '/api',
  false,
  'PENDING',
  'PENDING_DNS',
  'SPECIFIC_DOMAIN'
);
```

---

## 🐛 TROUBLESHOOTING

### **YugabyteDB:**

**Problem:** Extensions not found
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

**Problem:** Permission denied
```bash
# Login as superuser
ysqlsh -h localhost -U yugabyte -d postgres
```

### **Supabase:**

**Problem:** USER_ID_HERE not replaced
```
ERROR: Please replace USER_ID_HERE...
```
**Solution:** Edit line 19 in script with actual User ID from Auth

**Problem:** User not found
```
ERROR: User does not exist
```
**Solution:** Create user in Auth Dashboard first

---

## 📚 RELATED DOCS

- `/SETUP_GUIDE.md` - Main setup guide
- `/QUICK_SETUP.md` - Quick reference (V1)
- `QUICK_SETUP_V2.md` - Quick reference (V2)
- `INIT_V2_GUIDE.md` - Complete V2 documentation
- `SCHEMA_CHANGES.md` - Migration guide

---

## 🎯 RECOMMENDED READING ORDER

1. **First Time Setup:**
   - `QUICK_SETUP_V2.md` (3 min)
   - Run appropriate script
   - Done! ✅

2. **Need More Details:**
   - `INIT_V2_GUIDE.md` (full guide)
   - Verify with queries
   - Customize as needed

3. **Migration from V1:**
   - `SCHEMA_CHANGES.md` (understand changes)
   - Plan migration strategy
   - Test in staging first

---

## ⏱️ EXECUTION TIME

| Task | YugabyteDB | Supabase |
|------|------------|----------|
| Script execution | ~5-10 sec | ~3-5 sec |
| Manual setup | 0 min | 2 min (create user) |
| **Total** | **~1 min** | **~3 min** |

---

## ✅ SUCCESS CRITERIA

After running scripts, you should have:

- [x] Application created with code PLATFORM_ADMIN
- [x] 33 permissions in tree structure
- [x] 1 Administrator role with all permissions
- [x] Tenant application with ENTERPRISE license
- [x] Route configured for saas.coquan.vn
- [x] Unlimited subscription active
- [x] Admin user with email admin@saas.coquan.vn
- [x] Tenant member with OWNER role
- [x] User role assigned (Administrator)
- [x] Can login successfully ✅

---

## 🚀 NEXT STEPS

After successful initialization:

1. **Test Login:** http://localhost:3000/login
2. **Verify Permissions:** Check admin can access all pages
3. **Create Additional Users:** Add team members
4. **Configure Settings:** Customize tenant settings
5. **Add Custom Permissions:** Extend as needed

---

**SCRIPTS VERSION:** 2.0  
**LAST UPDATED:** January 2026  
**STATUS:** Production Ready ✅  

🎉 **Ready to initialize your database!**
