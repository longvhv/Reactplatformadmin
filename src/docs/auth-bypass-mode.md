# Authentication Bypass Mode

## Overview

Authentication đã được cấu hình ở **BYPASS MODE** để phục vụ development. Chỉ cần email tồn tại trong database là có thể login, không cần check password.

## How It Works

### Login Flow

```typescript
// File: /providers/AuthProvider.tsx

const login = async (email: string, password: string) => {
  // 1. Check if user exists in database (users table)
  const { data: userProfile } = await supabase
    .from('users')
    .select('id, email, display_name, full_name, avatar_url')
    .eq('email', email)
    .single();

  if (!userProfile) {
    throw new Error('Tài khoản không tồn tại');
  }

  // 2. Create bypass session in localStorage
  localStorage.setItem('bypass-auth-user-id', userProfile.id);
  localStorage.setItem('bypass-auth-email', email);

  // 3. Set authenticated state
  setIsAuthenticated(true);
  const currentUser = await getCurrentUser();
  setUser(currentUser);
};
```

### Session Restoration

```typescript
// On app load, check localStorage first
const bypassUserId = localStorage.getItem('bypass-auth-user-id');
const bypassEmail = localStorage.getItem('bypass-auth-email');

if (bypassUserId && bypassEmail) {
  // Restore session without Supabase Auth
  setIsAuthenticated(true);
  const currentUser = await getCurrentUser();
  setUser(currentUser);
}
```

### User Data Retrieval

```typescript
// File: /lib/currentUser.ts

export async function getCurrentUser(): Promise<CurrentUser | null> {
  // Check bypass mode first
  const bypassUserId = localStorage.getItem('bypass-auth-user-id');
  
  if (bypassUserId) {
    // Get user from database directly
    const { data: userProfile } = await supabase
      .from('users')
      .select('*')
      .eq('id', bypassUserId)
      .single();
    
    // Return mock CurrentUser object
    return {
      id: userProfile.id,
      email: userProfile.email,
      display_name: userProfile.display_name,
      full_name: userProfile.full_name,
      avatar_url: userProfile.avatar_url,
      // ... other fields
    };
  }
  
  // Otherwise use normal Supabase auth
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
```

## Usage

### Login với bất kỳ password nào

```typescript
// Chỉ cần email tồn tại trong user_profiles table
await login('admin@saas.coquan.vn', 'anything');
await login('admin@saas.coquan.vn', '');
await login('admin@saas.coquan.vn', '123456');

// Tất cả đều work, password bị ignore hoàn toàn
```

### Check authentication

```typescript
const { isAuthenticated, user } = useAuthContext();

if (isAuthenticated) {
  console.log('Logged in as:', user?.email);
  console.log('User data:', user);
}
```

### Logout

```typescript
const { logout } = useAuthContext();

await logout();
// Clears both localStorage and Supabase session
```

## Files Modified

1. **`/providers/AuthProvider.tsx`**
   - `login()` - Bypass password check
   - `initAuth()` - Check localStorage first
   - `logout()` - Clear bypass localStorage

2. **`/lib/currentUser.ts`**
   - `getCurrentUser()` - Support bypass mode
   - Return user from database instead of Supabase Auth

3. **`/app/login/page.tsx`**
   - Display "Bypass Mode" indicator
   - Better error messages

## Benefits

✅ **No Supabase Auth Setup Required**
- Không cần tạo user trong Supabase Auth Dashboard
- Không cần SUPABASE_SERVICE_ROLE_KEY
- Không cần email confirmation

✅ **Quick Testing**
- Login với bất kỳ password nào
- Switch users nhanh chóng
- Không cần remember password

✅ **Database-Only Auth**
- Chỉ cần user tồn tại trong `user_profiles` table
- Không dependency vào Supabase Auth service
- Dễ debug và test

## Limitations

⚠️ **Security**
- KHÔNG DÙNG CHO PRODUCTION
- Bất kỳ ai biết email đều login được
- Không có password protection

⚠️ **No Real Session**
- Không có JWT token
- Session data chỉ ở localStorage
- Clear localStorage = logout

⚠️ **Limited Features**
- Không có password reset
- Không có email verification
- Không có MFA
- Không có OAuth providers

## Testing

### Test với different users

```typescript
// Admin user
await login('admin@saas.coquan.vn', '');

// Other users (if exist in database)
await login('user@example.com', '');
```

### Verify session

```typescript
// Check localStorage
console.log({
  userId: localStorage.getItem('bypass-auth-user-id'),
  email: localStorage.getItem('bypass-auth-email')
});

// Check auth state
const { user, isAuthenticated } = useAuthContext();
console.log({ user, isAuthenticated });
```

### Clear session

```typescript
// Clear localStorage manually
localStorage.removeItem('bypass-auth-user-id');
localStorage.removeItem('bypass-auth-email');

// Or use logout
const { logout } = useAuthContext();
await logout();
```

## Migration to Real Auth (Future)

Khi cần migrate sang real Supabase Auth:

1. **Remove bypass logic** từ:
   - `/providers/AuthProvider.tsx` - login(), initAuth()
   - `/lib/currentUser.ts` - getCurrentUser()

2. **Restore original code**:
   ```typescript
   const login = async (email: string, password: string) => {
     const { data, error } = await supabase.auth.signInWithPassword({
       email,
       password,
     });
     
     if (error) throw error;
     // ... rest of the code
   };
   ```

3. **Create users in Supabase Auth**:
   - Via Dashboard
   - Via Admin API
   - Via signup form

4. **Remove localStorage checks**
   - Keep only Supabase session checks

## Console Helpers

Bypass mode cũng expose helper vào console:

```typescript
// In browser console
await window.authHelpers.createAdminUser();
await window.authHelpers.createUser({
  email: 'test@example.com',
  password: 'ignored-in-bypass-mode',
  metadata: { display_name: 'Test User' }
});
```

## Troubleshooting

### Login failed với "Tài khoản không tồn tại"?

**Solution**: User chưa có trong database
```sql
-- Check user_profiles table
SELECT * FROM user_profiles WHERE email = 'admin@saas.coquan.vn';
```

Nếu không có, chạy setup:
- Truy cập `/setup`
- Hoặc insert manual vào database

### Session không persist sau refresh?

**Check localStorage**:
```javascript
console.log({
  userId: localStorage.getItem('bypass-auth-user-id'),
  email: localStorage.getItem('bypass-auth-email')
});
```

Nếu null, login lại.

### User data không hiển thị đúng?

**Check database**:
```sql
SELECT * FROM user_profiles 
WHERE id = 'bypass-auth-user-id-from-localStorage';
```

Update data nếu cần:
```sql
UPDATE user_profiles 
SET display_name = 'New Name', 
    avatar_url = 'https://...'
WHERE id = 'user-id';
```

## Related Files

- `/providers/AuthProvider.tsx` - Main auth logic
- `/lib/currentUser.ts` - User data retrieval
- `/app/login/page.tsx` - Login UI
- `/hooks/useCurrentUser.ts` - Hook to use current user
- `/lib/authHelpers.ts` - Helper functions

## Notes

- Bypass mode được implement để tránh phức tạp với Supabase Auth setup
- Chỉ phù hợp cho development và prototyping
- Production app nên dùng proper authentication với JWT tokens
- Current implementation hoàn toàn functional cho development purposes