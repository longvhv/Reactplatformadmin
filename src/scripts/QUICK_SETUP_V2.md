# ⚡ QUICK SETUP V2 - 3 PHÚT

## 🐘 YUGABYTEDB (1 command)

```bash
# Chỉ 1 dòng:
ysqlsh -h localhost -p 5433 -U yugabyte -d your_db -f scripts/yugabyte-init-v2.sql

# Login:
admin@saas.coquan.vn / Vhv@2026
```

**DONE!** ✅

---

## 🔵 SUPABASE (3 bước)

### **1. Tạo User (1 phút)**
```
Supabase Dashboard > Authentication > Users > Add User

Email: admin@saas.coquan.vn
Password: Vhv@2026
✓ Auto Confirm Email

→ COPY USER ID
```

### **2. Edit Script (30 giây)**
```sql
# File: scripts/supabase-init-v2.sql
# Line 19:

v_user_id UUID := 'PASTE_USER_ID_HERE';
```

### **3. Run SQL (1 phút)**
```
SQL Editor > New Query > Paste script > Run
```

**DONE!** ✅

---

## 📊 KẾT QUẢ

- ✅ 1 Application (PLATFORM_ADMIN)
- ✅ 33 Permissions (tree structure)
- ✅ 1 Role (Administrator with all permissions)
- ✅ 1 Tenant app (ENTERPRISE license)
- ✅ 1 Route (saas.coquan.vn)
- ✅ 1 Subscription (unlimited)
- ✅ 1 User (admin with full access)
- ✅ 1 Tenant member (OWNER)
- ✅ 1 User role (Administrator)

---

## 🔑 LOGIN

```
URL: http://localhost:3000
Email: admin@saas.coquan.vn
Password: Vhv@2026
```

---

## 💡 KHÁC BIỆT V1 vs V2

### **V1 (Old Schema):**
- ❌ Simple permissions (resource/action)
- ❌ Separate role_permissions table
- ❌ Simple tenant_app_routes (route_path)
- ❌ Basic subscription

### **V2 (New Schema):**
- ✅ Tree permissions (parent_code, path, is_group)
- ✅ Permission codes array in roles
- ✅ Domain-based routing (domain + path_prefix)
- ✅ Full billing subscription system
- ✅ Employee management (employee_code, job_title)
- ✅ Scope-based user roles (tenant/global)
- ✅ Support staff features (MFA, locale)

---

**TOTAL TIME:** 3 phút  
**DIFFICULTY:** Easy ✅  
**PRODUCTION READY:** Yes 🚀  

🎉 **GO!**
