# Fix: Supabase Auth 400 Error

## Lỗi

```
https://vewxdzhvrpxsmpmlwaqr.supabase.co/auth/v1/token?grant_type=password: 
Failed to load resource: the server responded with a status of 400 ()
```

## Nguyên nhân

Lỗi 400 từ Supabase Auth endpoint xảy ra khi:
- User chưa được tạo trong Supabase Auth
- Email/password không đúng
- Email chưa được confirm (nếu bật email confirmation)

## Giải pháp

### Option 1: Sử dụng Setup Page (Recommended)

1. Truy cập trang setup:
   ```
   http://localhost:3000/setup
   ```

2. Follow hướng dẫn trên trang:
   - **Step 1**: Initialize Tenant Data (tạo tenant, roles, permissions)
   - **Step 2**: Create Admin User trong Supabase Dashboard, sau đó paste User ID vào form

3. Sau khi hoàn tất, đăng nhập với:
   - Email: `admin@saas.coquan.vn`
   - Password: `Vhv@2026`

### Option 2: Tạo User Manually trong Supabase Dashboard

1. Mở Supabase Dashboard: https://supabase.com/dashboard/project/vewxdzhvrpxsmpmlwaqr

2. Vào **Authentication** → **Users**

3. Click **"Add user"** → **"Create new user"**

4. Nhập thông tin:
   - Email: `admin@saas.coquan.vn`
   - Password: `Vhv@2026`
   - Auto Confirm User: ✅ (check this box)

5. Click **"Create user"**

6. User đã được tạo, giờ có thể login

### Option 3: Sử dụng Supabase CLI (Advanced)

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref vewxdzhvrpxsmpmlwaqr

# Create user via SQL
supabase db execute "
  SELECT auth.create_user(
    'admin@saas.coquan.vn'::text,
    'Vhv@2026'::text
  );
"
```

## Improvements Made

### 1. Better Error Handling in AuthProvider

```typescript
// Before: Generic error
throw error;

// After: User-friendly Vietnamese error messages
if (error.message.includes('Invalid login credentials')) {
  throw new Error('Email hoặc mật khẩu không đúng. Vui lòng kiểm tra lại.');
} else if (error.message.includes('User not found')) {
  throw new Error('Tài khoản không tồn tại. Vui lòng liên hệ quản trị viên.');
}
```

### 2. Login Page với Setup Link

Updated `/app/login/page.tsx`:
- Hiển thị thông báo rõ ràng nếu user chưa tồn tại
- Thêm button "Đi tới trang Setup" để hướng dẫn user
- Better error handling với toast notification

### 3. Setup Page

Trang `/setup` đã có sẵn để:
- Initialize tenant data
- Hướng dẫn tạo admin user
- Setup toàn bộ hệ thống một cách có hệ thống

## Testing

Sau khi tạo user, test login:

```typescript
// In browser console
await window.authHelpers.createAdminUser();
// Hoặc
await window.authHelpers.createUser({
  email: 'test@example.com',
  password: 'password123',
  metadata: {
    display_name: 'Test User',
    role: 'User'
  }
});
```

## Verification

Kiểm tra user đã được tạo thành công:

1. Supabase Dashboard → Authentication → Users
2. Tìm user với email `admin@saas.coquan.vn`
3. Check trạng thái "Confirmed" = ✅

Hoặc check qua code:

```typescript
// In browser console
const { data: { session } } = await supabase.auth.getSession();
console.log('Current user:', session?.user);
```

## Troubleshooting

### Lỗi vẫn còn sau khi tạo user?

1. **Clear browser cache và cookies**
   ```
   Chrome: Settings → Privacy → Clear browsing data
   ```

2. **Check email confirmation status**
   - Vào Supabase Dashboard → Authentication → Users
   - Ensure "Email Confirmed" = true
   - Nếu false, click "..." → "Confirm email"

3. **Verify password strength**
   - Password phải có ít nhất 6 ký tự
   - Recommended: có chữ hoa, chữ thường, số, ký tự đặc biệt

4. **Check Supabase Auth settings**
   - Authentication → Settings
   - Ensure "Enable email confirmations" = OFF (cho development)
   - Hoặc manually confirm email trong dashboard

### Network errors?

Check Supabase project status:
```
https://status.supabase.com/
```

Check project URL và keys trong `/utils/supabase/info.tsx`:
```typescript
export const projectId = 'vewxdzhvrpxsmpmlwaqr';
export const publicAnonKey = '...'; // Should match Supabase dashboard
```

## Files Changed

1. `/providers/AuthProvider.tsx` - Better error handling
2. `/app/login/page.tsx` - Added setup link and better error messages
3. `/lib/authHelpers.ts` - Helper functions for user management
4. `/docs/fix-auth-400-error.md` - This documentation

## Related Documentation

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Current User Library](/docs/current-user-library.md)
- [Setup Page](/setup)
