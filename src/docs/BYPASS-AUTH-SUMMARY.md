# 🔓 Authentication Bypass Mode - Quick Summary

## TL;DR

**Chỉ cần email đúng là login được. Password bị ignore hoàn toàn.**

```typescript
// Tất cả đều work:
await login('admin@saas.coquan.vn', 'anything');
await login('admin@saas.coquan.vn', '');
await login('admin@saas.coquan.vn', '12345');
await login('admin@saas.coquan.vn', 'wrong-password');
```

## How to Login

### Option 1: Via Login Page

1. Vào `http://localhost:3000/login`
2. Nhập email: `admin@saas.coquan.vn`
3. Nhập bất kỳ password nào (hoặc để trống)
4. Click "Đăng nhập"
5. ✅ Done!

### Option 2: Programmatically

```typescript
const { login } = useAuthContext();
await login('admin@saas.coquan.vn', ''); // Password ignored
```

## Requirements

Chỉ cần **1 điều kiện**:
- ✅ User phải tồn tại trong table `users`

Không cần:
- ❌ User trong Supabase Auth
- ❌ Password đúng
- ❌ Email confirmation
- ❌ SUPABASE_SERVICE_ROLE_KEY

## Setup System (First Time)

Nếu chưa có data:

1. Vào `http://localhost:3000/setup`
2. Click "Initialize Tenant Data"
3. Click "Create Admin User & Assign Role"
4. Done! Bây giờ có thể login

## Technical Details

### What Happens When Login?

```
1. Check email tồn tại trong user_profiles ✓
2. Lưu user ID vào localStorage
3. Set isAuthenticated = true
4. Load user data từ database
5. Navigate to /admin/dashboard
```

### Where is Session Stored?

```javascript
localStorage.getItem('bypass-auth-user-id') // User ID
localStorage.getItem('bypass-auth-email')   // Email
```

### How to Logout?

```typescript
const { logout } = useAuthContext();
await logout(); // Clears localStorage
```

## Files Changed

| File | Change |
|------|--------|
| `/providers/AuthProvider.tsx` | Bypass password check in login() |
| `/lib/currentUser.ts` | Get user from database instead of Supabase Auth |
| `/app/login/page.tsx` | Display bypass mode indicator |

## Example Users

Sau khi chạy `/setup`, có user sau:

```
Email: admin@saas.coquan.vn
Password: Bất kỳ gì cũng được
Role: Super Admin
```

## Testing

```typescript
// Browser Console

// Check current user
const { user } = useAuthContext();
console.log(user);

// Check localStorage
console.log({
  userId: localStorage.getItem('bypass-auth-user-id'),
  email: localStorage.getItem('bypass-auth-email')
});

// Login manually
await window.authHelpers.login('admin@saas.coquan.vn', '');
```

## Security Warning

⚠️ **CHỈ DÙNG CHO DEVELOPMENT**

- Bất kỳ ai biết email đều login được
- Không có password protection
- Không có JWT token
- Không secure cho production

## Why Bypass Mode?

✅ Tránh phức tạp với Supabase Auth setup  
✅ Không cần tạo user trong Supabase Dashboard  
✅ Testing nhanh, switch user dễ dàng  
✅ Không bị lỗi 400 từ Supabase Auth  
✅ Development experience tốt hơn  

## Common Errors & Fixes

### "Tài khoản không tồn tại"

**Fix**: Chạy `/setup` để tạo user trong database

### Session mất sau refresh

**Fix**: Check localStorage có data không. Nếu null, login lại.

### User data không đúng

**Fix**: Check table `user_profiles` trong database

## Quick Commands

```bash
# Check if user exists
SELECT * FROM user_profiles WHERE email = 'admin@saas.coquan.vn';

# Create user manually (if needed)
INSERT INTO user_profiles (email, display_name, full_name)
VALUES ('admin@saas.coquan.vn', 'Admin', 'System Administrator');

# Update user info
UPDATE user_profiles 
SET display_name = 'New Name'
WHERE email = 'admin@saas.coquan.vn';
```

## Read More

- Full documentation: `/docs/auth-bypass-mode.md`
- Fix 400 error guide: `/docs/fix-auth-400-error.md`
- Current user library: `/docs/current-user-library.md`

---

**Bottom Line**: Nhập email đúng → Login thành công. Đơn giản vậy thôi! 🎉