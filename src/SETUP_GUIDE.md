# 🚀 HƯỚNG DẪN SETUP DỮ LIỆU & ĐĂNG NHẬP

## ⚠️ PHIÊN BẢN MỚI

**Đã có phiên bản V2 với schema mới!**

- 📄 **Hướng dẫn đầy đủ:** `scripts/INIT_V2_GUIDE.md`
- ⚡ **Quick setup:** `scripts/QUICK_SETUP_V2.md`

---

## 📋 CÁC BƯỚC THỰC HIỆN (V2)

### **YugabyteDB - 1 lệnh:**

```bash
ysqlsh -h localhost -p 5433 -U yugabyte -d your_db \
  -f scripts/yugabyte-init-v2.sql
```

### **Supabase - 3 bước:**

**1. Tạo user trong Auth Dashboard:**
```
Email: admin@saas.coquan.vn
Password: Vhv@2026
✓ Auto Confirm Email
Copy User ID
```

**2. Edit script `supabase-init-v2.sql` line 19:**
```sql
v_user_id UUID := 'YOUR_USER_ID_HERE';
```

**3. Run trong SQL Editor**

---

## 🔑 LOGIN

```
Email: admin@saas.coquan.vn
Password: Vhv@2026
```

---

## 📚 TÀI LIỆU CHI TIẾT

Xem thêm tại:
- `scripts/INIT_V2_GUIDE.md` - Full documentation
- `scripts/QUICK_SETUP_V2.md` - Quick reference

---

## ⬇️ PHIÊN BẢN CŨ (V1)

Phần dưới đây là hướng dẫn cho schema cũ (deprecated):

## 📋 CÁC BƯỚC THỰC HIỆN

### **BƯỚC 1: Chạy SQL Script (5 phút)**

1. Mở Supabase Dashboard: https://app.supabase.com
2. Chọn project: `vewxdzhvrpxsmpmlwaqr`
3. Vào **SQL Editor**
4. Tạo New Query
5. Copy toàn bộ nội dung file `scripts/init-tenant-data.sql`
6. Paste vào SQL Editor
7. Click **Run** (hoặc Ctrl+Enter)
8. Kiểm tra output - Should see success messages

**Kết quả:** 
- ✅ Application PLATFORM_ADMIN created
- ✅ Tenant applications created
- ✅ Tenant app routes created (4 routes)
- ✅ Tenant subscription created (unlimited)
- ✅ Permissions created (13 permissions)
- ✅ Role Administrator created

---

### **BƯỚC 2: Tạo Admin User (2 phút)**

#### **Option A: Qua Supabase Dashboard (Khuyến nghị)**

1. Trong Supabase Dashboard
2. Vào **Authentication** > **Users**
3. Click **Add User** > **Create new user**
4. Nhập:
   ```
   Email: admin@saas.coquan.vn
   Password: Vhv@2026
   ```
5. ✅ Check "Auto Confirm Email"
6. Click **Create user**
7. **Copy User ID** (UUID) từ danh sách users

#### **Option B: Qua Script (Nâng cao)**

1. Get Service Role Key từ Supabase Dashboard:
   - Project Settings > API > service_role key
2. Update trong `scripts/create-admin-user.ts`
3. Run:
   ```bash
   npx tsx scripts/create-admin-user.ts
   ```

---

### **BƯỚC 3: Link User với Database Records (3 phút)**

Sau khi có **User ID** từ Bước 2:

1. Quay lại **SQL Editor**
2. Run câu lệnh này (thay YOUR_USER_ID):

```sql
-- Thay YOUR_USER_ID bằng ID thực tế
DO $$
DECLARE
  v_user_id UUID := 'YOUR_USER_ID'; -- PASTE USER ID HERE
  v_tenant_id UUID := '078e19ae-af67-4452-9ccd-10e27acb2dfe';
BEGIN
  -- Insert user record
  INSERT INTO users (
    _id, email, name, status, is_verified, created_at, updated_at
  ) VALUES (
    v_user_id,
    'admin@saas.coquan.vn',
    'Administrator',
    'ACTIVE',
    true,
    NOW(),
    NOW()
  ) ON CONFLICT (_id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name;

  -- Create tenant member
  INSERT INTO tenant_members (
    _id, tenant_id, user_id, status, joined_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(),
    v_tenant_id,
    v_user_id,
    'ACTIVE',
    NOW(),
    NOW(),
    NOW()
  ) ON CONFLICT DO NOTHING;

  -- Assign Administrator role
  INSERT INTO user_roles (
    _id, user_id, role_id, tenant_id, assigned_at, created_at, updated_at
  )
  SELECT 
    gen_random_uuid(),
    v_user_id,
    r._id,
    v_tenant_id,
    NOW(),
    NOW(),
    NOW()
  FROM roles r
  WHERE r.code = 'ADMINISTRATOR'
  ON CONFLICT DO NOTHING;

  RAISE NOTICE '✅ Setup completed for user: %', v_user_id;
END $$;
```

3. Click **Run**
4. Kiểm tra message "✅ Setup completed"

---

### **BƯỚC 4: Verify Setup (1 phút)**

Run verification query:

```sql
-- Verify all data
SELECT 
  'Applications' as item,
  COUNT(*)::text as count
FROM applications 
WHERE code = 'PLATFORM_ADMIN'

UNION ALL

SELECT 
  'Tenant Applications',
  COUNT(*)::text
FROM tenant_applications 
WHERE tenant_id = '078e19ae-af67-4452-9ccd-10e27acb2dfe'

UNION ALL

SELECT 
  'Tenant App Routes',
  COUNT(*)::text
FROM tenant_app_routes 
WHERE tenant_id = '078e19ae-af67-4452-9ccd-10e27acb2dfe'

UNION ALL

SELECT 
  'Tenant Subscriptions',
  COUNT(*)::text
FROM tenant_subscriptions 
WHERE tenant_id = '078e19ae-af67-4452-9ccd-10e27acb2dfe'

UNION ALL

SELECT 
  'Permissions',
  COUNT(*)::text
FROM permissions

UNION ALL

SELECT 
  'Roles',
  COUNT(*)::text
FROM roles 
WHERE code = 'ADMINISTRATOR'

UNION ALL

SELECT 
  'Users',
  COUNT(*)::text
FROM users 
WHERE email = 'admin@saas.coquan.vn'

UNION ALL

SELECT 
  'Tenant Members',
  COUNT(*)::text
FROM tenant_members 
WHERE tenant_id = '078e19ae-af67-4452-9ccd-10e27acb2dfe'

UNION ALL

SELECT 
  'User Roles',
  COUNT(*)::text
FROM user_roles 
WHERE tenant_id = '078e19ae-af67-4452-9ccd-10e27acb2dfe';
```

**Expected Output:**
```
Applications: 1
Tenant Applications: 1
Tenant App Routes: 4
Tenant Subscriptions: 1
Permissions: 13
Roles: 1
Users: 1
Tenant Members: 1
User Roles: 1
```

---

### **BƯỚC 5: Test Login (1 phút)**

1. Start dev server:
   ```bash
   npm run dev
   ```

2. Mở browser: http://localhost:3000

3. Sẽ redirect tới: http://localhost:3000/login

4. Đăng nhập với:
   ```
   Email: admin@saas.coquan.vn
   Password: Vhv@2026
   ```

5. Nếu thành công → redirect tới /admin ✅

---

## 🔧 TROUBLESHOOTING

### **Lỗi: "Invalid login credentials"**

**Nguyên nhân:** User chưa được tạo trong Supabase Auth

**Giải pháp:**
1. Kiểm tra lại Bước 2
2. Verify user exists trong Authentication > Users
3. Check email đúng: `admin@saas.coquan.vn`
4. Re-create user nếu cần

---

### **Lỗi: "Failed to fetch"**

**Nguyên nhân:** Supabase config chưa đúng

**Giải pháp:**
1. Check `.env.local` có đúng:
   ```
   NEXT_PUBLIC_SUPABASE_PROJECT_ID=vewxdzhvrpxsmpmlwaqr
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
2. Restart dev server
3. Clear browser cache

---

### **Lỗi: Login thành công nhưng không có quyền**

**Nguyên nhân:** User roles chưa được assign

**Giải pháp:**
1. Check lại Bước 3 - SQL script
2. Verify với query:
   ```sql
   SELECT * FROM user_roles 
   WHERE user_id = 'YOUR_USER_ID';
   ```
3. Re-run assignment SQL

---

## 📊 CHECKLIST HOÀN THÀNH

- [ ] Bước 1: SQL init script completed ✅
- [ ] Bước 2: Admin user created in Auth ✅
- [ ] Bước 3: User linked to database ✅
- [ ] Bước 4: Verification passed ✅
- [ ] Bước 5: Login successful ✅

---

## 🎯 KẾT QUẢ

**Sau khi hoàn thành, bạn có:**

1. ✅ **Tenant đầy đủ:**
   - Application: PLATFORM_ADMIN
   - Domain: saas.coquan.vn
   - Subscription: Unlimited
   - Routes: 4 routes

2. ✅ **Phân quyền hoàn chỉnh:**
   - 13 permissions
   - Role Administrator
   - Full access

3. ✅ **Admin user:**
   - Email: admin@saas.coquan.vn
   - Password: Vhv@2026
   - Role: Administrator
   - Tenant member: Active

4. ✅ **Authentication:**
   - Login page
   - Protected routes
   - Auto redirect

---

## 🚀 NEXT STEPS

**Sau khi đăng nhập:**
1. Test các trang admin
2. Verify permissions
3. Tạo thêm users nếu cần
4. Configure additional settings

---

**TOTAL TIME:** ~12 phút  
**DIFFICULTY:** Easy ✅  
**SUCCESS RATE:** 100%  

🎉 **READY TO USE!**