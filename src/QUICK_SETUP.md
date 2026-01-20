# ⚡ QUICK SETUP - 5 PHÚT

## 🎯 Làm theo thứ tự:

### 1. SQL Script (2 phút)
```
Supabase Dashboard > SQL Editor > New Query
Copy từ: scripts/init-tenant-data.sql
Run
```

### 2. Tạo User (1 phút)
```
Authentication > Users > Add User
Email: admin@saas.coquan.vn
Password: Vhv@2026
✓ Auto Confirm Email
Create
Copy User ID (UUID)
```

### 3. Link User (1 phút)
```sql
-- Paste User ID vào đây:
DO $$
DECLARE
  v_user_id UUID := 'PASTE_USER_ID_HERE';
  v_tenant_id UUID := '078e19ae-af67-4452-9ccd-10e27acb2dfe';
BEGIN
  INSERT INTO users (_id, email, name, status, is_verified, created_at, updated_at)
  VALUES (v_user_id, 'admin@saas.coquan.vn', 'Administrator', 'ACTIVE', true, NOW(), NOW())
  ON CONFLICT (_id) DO UPDATE SET email = EXCLUDED.email;

  INSERT INTO tenant_members (_id, tenant_id, user_id, status, joined_at, created_at, updated_at)
  VALUES (gen_random_uuid(), v_tenant_id, v_user_id, 'ACTIVE', NOW(), NOW(), NOW())
  ON CONFLICT DO NOTHING;

  INSERT INTO user_roles (_id, user_id, role_id, tenant_id, assigned_at, created_at, updated_at)
  SELECT gen_random_uuid(), v_user_id, r._id, v_tenant_id, NOW(), NOW(), NOW()
  FROM roles r WHERE r.code = 'ADMINISTRATOR'
  ON CONFLICT DO NOTHING;
END $$;
```

### 4. Test (1 phút)
```bash
npm run dev
```
Open: http://localhost:3000
Login với: admin@saas.coquan.vn / Vhv@2026

## ✅ DONE!

Đăng nhập thành công → Vào admin dashboard! 🎉
