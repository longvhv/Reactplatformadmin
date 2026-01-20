# 🐘 YUGABYTEDB SETUP GUIDE

## 📋 YÊU CẦU

- YugabyteDB cluster đang chạy
- YSQL (PostgreSQL-compatible API) enabled
- Database đã được tạo
- Schema tables đã tồn tại

---

## 🚀 CÁCH SỬ DỤNG

### **Option 1: Qua ysqlsh CLI (Khuyến nghị)**

```bash
# Connect to YugabyteDB
ysqlsh -h <host> -p 5433 -U <username> -d <database>

# Run initialization script
\i scripts/yugabyte-init-tenant-data.sql

# Verify data
\i scripts/yugabyte-verify-data.sql
```

### **Option 2: Qua file**

```bash
# One command to run everything
ysqlsh -h localhost -p 5433 -U yugabyte -d your_database \
  -f scripts/yugabyte-init-tenant-data.sql

# Then verify
ysqlsh -h localhost -p 5433 -U yugabyte -d your_database \
  -f scripts/yugabyte-verify-data.sql
```

### **Option 3: Qua Docker**

```bash
# If running YugabyteDB in Docker
docker exec -it yugabyte-db ysqlsh -d your_database \
  -f /path/to/scripts/yugabyte-init-tenant-data.sql
```

---

## 📊 SCRIPT TẠO GÌ?

### **1. Extensions:**
- ✅ `uuid-ossp` - UUID generation
- ✅ `pgcrypto` - Password hashing

### **2. Application:**
- ✅ PLATFORM_ADMIN application
- ✅ Code: PLATFORM_ADMIN
- ✅ Type: INTERNAL
- ✅ Status: ACTIVE

### **3. Tenant Application:**
- ✅ Tenant: 078e19ae-af67-4452-9ccd-10e27acb2dfe
- ✅ Domain: saas.coquan.vn
- ✅ Path prefix: /

### **4. App Routes (6 routes):**
- ✅ /admin - Admin Dashboard
- ✅ /admin/products - Products Management
- ✅ /admin/users - Users Management
- ✅ /admin/tenants - Tenants Management
- ✅ /admin/orders - Orders Management
- ✅ /admin/roles - Roles & Permissions

### **5. Subscription:**
- ✅ Plan: UNLIMITED_PLAN
- ✅ Type: ENTERPRISE
- ✅ Status: ACTIVE
- ✅ Unlimited users & storage
- ✅ All features enabled

### **6. Permissions (21 permissions):**
- ✅ users.* (view, create, edit, delete)
- ✅ tenants.* (view, create, edit, delete)
- ✅ products.* (view, create, edit, delete)
- ✅ orders.* (view, create, edit, cancel)
- ✅ roles.* (view, manage)
- ✅ system.settings
- ✅ audit.view
- ✅ admin.all (Full access)

### **7. Role:**
- ✅ Name: Administrator
- ✅ Code: ADMINISTRATOR
- ✅ System role: Yes
- ✅ All 21 permissions assigned

### **8. Admin User:**
- ✅ Email: admin@saas.coquan.vn
- ✅ Password: Vhv@2026 (bcrypt hashed)
- ✅ Name: Administrator
- ✅ Status: ACTIVE
- ✅ Email verified: Yes

### **9. Tenant Member:**
- ✅ User linked to tenant
- ✅ Role: OWNER
- ✅ Status: ACTIVE

### **10. User Role:**
- ✅ Administrator role assigned
- ✅ Scoped to tenant

---

## ✅ VERIFICATION

Script tự động verify sau khi chạy. Output mong đợi:

```
============================================
📊 VERIFICATION SUMMARY
============================================

Applications:          1
Tenant Applications:   1
Tenant App Routes:     6
Tenant Subscriptions:  1
Permissions:          21
Roles:                 1
Role Permissions:     21
Users:                 1
Tenant Members:        1
User Roles:            1

============================================
🎉 INITIALIZATION COMPLETED SUCCESSFULLY!
============================================

📋 Login Information:
   Email: admin@saas.coquan.vn
   Password: Vhv@2026
   Domain: saas.coquan.vn

🚀 Ready to use!
```

Hoặc chạy riêng:

```bash
ysqlsh -h localhost -p 5433 -U yugabyte -d your_database \
  -f scripts/yugabyte-verify-data.sql
```

---

## 🔐 PASSWORD HASHING

Script sử dụng **bcrypt** để hash password:

```sql
-- Password được hash như thế này:
v_password_hash := crypt('Vhv@2026', gen_salt('bf', 10));

-- Verify password:
SELECT password_hash = crypt('Vhv@2026', password_hash) 
FROM users 
WHERE email = 'admin@saas.coquan.vn';
-- Should return: true
```

**Cost factor:** 10 (balance between security and performance)

---

## 🔧 CUSTOMIZATION

### **Thay đổi Tenant ID:**

Edit dòng này trong script:

```sql
v_tenant_id UUID := '078e19ae-af67-4452-9ccd-10e27acb2dfe';
```

### **Thay đổi Domain:**

```sql
v_domain VARCHAR := 'saas.coquan.vn';
```

### **Thay đổi Admin Email/Password:**

```sql
v_admin_email VARCHAR := 'admin@saas.coquan.vn';
v_admin_password VARCHAR := 'Vhv@2026';
```

### **Thêm Routes:**

```sql
INSERT INTO tenant_app_routes (...) VALUES
  (uuid_generate_v4(), v_tenant_id, v_app_id, 
   '/admin/new-route', 'New Route Name', 'PAGE', true, ...);
```

### **Thêm Permissions:**

```sql
INSERT INTO permissions (...) VALUES
  (uuid_generate_v4(), 'New Permission', 'resource.action', 
   'Description', 'resource', 'action', ...);
```

---

## 🐛 TROUBLESHOOTING

### **Error: extension "uuid-ossp" does not exist**

```sql
-- Run as superuser:
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### **Error: extension "pgcrypto" does not exist**

```sql
-- Run as superuser:
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

### **Error: permission denied**

```bash
# Connect with admin user:
ysqlsh -h localhost -p 5433 -U yugabyte -d your_database
```

### **Conflict errors (ON CONFLICT)**

```
Đây là normal! Script được thiết kế để idempotent.
Có thể chạy lại nhiều lần mà không bị duplicate data.
```

### **Password hash không match**

```sql
-- Check extension:
SELECT * FROM pg_extension WHERE extname = 'pgcrypto';

-- Test hashing:
SELECT crypt('test', gen_salt('bf'));
```

---

## 📝 NOTES

### **Idempotent Design:**

Script có thể chạy lại nhiều lần:
- Sử dụng `ON CONFLICT ... DO UPDATE`
- Không duplicate data
- Update existing records

### **Transaction Safety:**

Script chạy trong một transaction block (`DO $$ ... END $$`):
- All-or-nothing execution
- Rollback on error
- Data consistency guaranteed

### **UUID Generation:**

Sử dụng `uuid_generate_v4()`:
- Random UUIDs
- No collision risk
- Distributed-friendly

### **Bcrypt Password:**

- Industry standard
- Salt included
- Slow by design (prevents brute force)
- Cost factor: 10

---

## 🔍 USEFUL QUERIES

### **Check all data for tenant:**

```sql
-- All tenant data
SELECT 
  'tenant_applications' as table_name,
  COUNT(*) as count
FROM tenant_applications 
WHERE tenant_id = '078e19ae-af67-4452-9ccd-10e27acb2dfe'
UNION ALL
SELECT 'tenant_app_routes', COUNT(*) 
FROM tenant_app_routes 
WHERE tenant_id = '078e19ae-af67-4452-9ccd-10e27acb2dfe'
UNION ALL
SELECT 'tenant_members', COUNT(*) 
FROM tenant_members 
WHERE tenant_id = '078e19ae-af67-4452-9ccd-10e27acb2dfe';
```

### **Check user permissions:**

```sql
-- All permissions for admin user
SELECT 
  u.email,
  r.name as role,
  p.resource,
  p.action,
  p.name as permission
FROM users u
JOIN user_roles ur ON ur.user_id = u._id
JOIN roles r ON r._id = ur.role_id
JOIN role_permissions rp ON rp.role_id = r._id
JOIN permissions p ON p._id = rp.permission_id
WHERE u.email = 'admin@saas.coquan.vn'
ORDER BY p.resource, p.action;
```

### **Test login:**

```sql
-- Simulate login
SELECT 
  _id,
  email,
  name,
  status,
  CASE 
    WHEN password_hash = crypt('Vhv@2026', password_hash)
    THEN '✅ Login success'
    ELSE '❌ Login failed'
  END as login_result
FROM users
WHERE email = 'admin@saas.coquan.vn'
  AND status = 'ACTIVE';
```

---

## ⚡ QUICK COMMANDS

```bash
# Full setup in one command
ysqlsh -h localhost -U yugabyte -d mydb \
  -f scripts/yugabyte-init-tenant-data.sql \
  -f scripts/yugabyte-verify-data.sql

# Just initialization
ysqlsh -h localhost -U yugabyte -d mydb \
  -c '\i scripts/yugabyte-init-tenant-data.sql'

# Just verification
ysqlsh -h localhost -U yugabyte -d mydb \
  -c '\i scripts/yugabyte-verify-data.sql'

# Test password
ysqlsh -h localhost -U yugabyte -d mydb \
  -c "SELECT password_hash = crypt('Vhv@2026', password_hash) as password_ok FROM users WHERE email = 'admin@saas.coquan.vn';"
```

---

## 🎯 EXPECTED RESULTS

After successful execution:

```
✅ 1 Application created
✅ 1 Tenant application linked
✅ 6 App routes created
✅ 1 Unlimited subscription
✅ 21 Permissions created
✅ 1 Administrator role
✅ 21 Permissions assigned to role
✅ 1 Admin user created (password hashed)
✅ 1 Tenant member added
✅ 1 User role assigned

🎉 Total: 54+ records created!
```

---

**TOTAL TIME:** ~5-10 seconds  
**COMPLEXITY:** Simple ✅  
**IDEMPOTENT:** Yes 🔄  
**PRODUCTION READY:** Yes 🚀  

🎉 **READY TO USE WITH YUGABYTEDB!**
