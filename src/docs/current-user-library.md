# Current User Library

Thư viện để truy xuất và quản lý thông tin người dùng hiện tại đang đăng nhập.

## Features

- ✅ Lấy thông tin user từ Supabase Auth
- ✅ Auto-refresh khi auth state thay đổi
- ✅ Hỗ trợ avatar và display name
- ✅ Caching để tối ưu performance
- ✅ TypeScript support đầy đủ
- ✅ Loading và error states

## Usage

### 1. Hook - useCurrentUser (Recommended)

Hook React để sử dụng trong components:

```tsx
import { useCurrentUser } from '@/hooks/useCurrentUser';

function MyComponent() {
  const { 
    user,           // Current user object
    profile,        // Extended profile from database
    displayName,    // Formatted display name
    initials,       // User initials for avatar
    avatarUrl,      // Avatar URL
    loading,        // Loading state
    error,          // Error state
    refresh         // Function to refresh user data
  } = useCurrentUser();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <img src={avatarUrl} alt={displayName} />
      <h1>Welcome, {displayName}!</h1>
      <p>{user?.email}</p>
    </div>
  );
}
```

### 2. Library Functions

Direct functions để sử dụng trong utilities hoặc server-side:

```typescript
import { 
  getCurrentUser, 
  getUserProfile,
  getUserDisplayName,
  getUserInitials,
  getUserAvatarUrl 
} from '@/lib/currentUser';

// Get current user
const user = await getCurrentUser();
console.log(user?.email);

// Get user profile with extended info
const profile = await getUserProfile(user?.id);
console.log(profile?.full_name);

// Get display name
const displayName = getUserDisplayName(user);
console.log(displayName); // "John Doe" or "john@example.com"

// Get initials for avatar
const initials = getUserInitials(user);
console.log(initials); // "JD"

// Get avatar URL
const avatarUrl = getUserAvatarUrl(user);
console.log(avatarUrl); // "https://..."
```

### 3. Update User Data

```typescript
import { updateUserMetadata, updateUserProfile } from '@/lib/currentUser';

// Update user metadata (Supabase Auth)
await updateUserMetadata({
  display_name: 'John Doe',
  avatar_url: 'https://example.com/avatar.jpg',
});

// Update user profile (Database table)
await updateUserProfile(userId, {
  full_name: 'John Doe',
  phone: '+1234567890',
});
```

## Integration trong Components

### Header Component

```tsx
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

export function Header() {
  const { displayName, initials, avatarUrl } = useCurrentUser();

  return (
    <header>
      <Avatar>
        <AvatarImage src={avatarUrl} alt={displayName} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <span>{displayName}</span>
    </header>
  );
}
```

### User Profile Dropdown

```tsx
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuthContext } from '@/providers/AuthProvider';

export function UserProfileDropdown() {
  const { displayName, initials, avatarUrl, user, profile } = useCurrentUser();
  const { logout } = useAuthContext();

  const userRole = profile?.metadata?.role || 'User';
  const userEmail = user?.email || 'user@example.com';

  return (
    <div>
      <Avatar>
        <AvatarImage src={avatarUrl} alt={displayName} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <h4>{displayName}</h4>
      <p>{userEmail}</p>
      <Badge>{userRole}</Badge>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

## AuthProvider Integration

AuthProvider đã được cập nhật để tự động lấy thông tin user từ Supabase:

```tsx
import { useAuthContext } from '@/providers/AuthProvider';

function MyComponent() {
  const { 
    isAuthenticated, 
    user,      // CurrentUser object
    login, 
    logout, 
    loading 
  } = useAuthContext();

  // user object contains:
  // - id
  // - email
  // - display_name
  // - full_name
  // - avatar_url
  // - user_metadata

  return (
    <div>
      {isAuthenticated ? (
        <p>Logged in as {user?.email}</p>
      ) : (
        <button onClick={() => login(email, password)}>Login</button>
      )}
    </div>
  );
}
```

## User Data Priority

Display name được lấy theo thứ tự ưu tiên:
1. `display_name` - Tên hiển thị tùy chỉnh
2. `full_name` - Tên đầy đủ
3. `username` - Username
4. `email` - Email (phần trước @)
5. `'User'` - Fallback mặc định

Avatar được lấy từ:
1. `avatar_url` trong user object
2. `metadata.avatar_url` trong user metadata
3. `undefined` - Sẽ hiển thị initials

## Auto-refresh

Hook `useCurrentUser` tự động refresh khi:
- User đăng nhập (SIGNED_IN)
- Token được refresh (TOKEN_REFRESHED)
- User data được cập nhật (USER_UPDATED)
- User đăng xuất (SIGNED_OUT)

## Best Practices

1. **Sử dụng hook trong React components**:
   ```tsx
   const { displayName, avatarUrl } = useCurrentUser();
   ```

2. **Sử dụng library functions cho utilities**:
   ```typescript
   const user = await getCurrentUser();
   ```

3. **Check loading state**:
   ```tsx
   if (loading) return <Spinner />;
   ```

4. **Handle error state**:
   ```tsx
   if (error) return <ErrorMessage error={error} />;
   ```

5. **Refresh khi cần**:
   ```tsx
   const { refresh } = useCurrentUser();
   await refresh(); // Manually refresh user data
   ```

## TypeScript Types

```typescript
interface CurrentUser extends User {
  display_name?: string;
  avatar_url?: string;
  full_name?: string;
  username?: string;
}

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  display_name?: string;
  avatar_url?: string;
  username?: string;
  phone?: string;
  created_at?: string;
  updated_at?: string;
  metadata?: Record<string, any>;
}

interface UseCurrentUserReturn {
  user: CurrentUser | null;
  profile: UserProfile | null;
  displayName: string;
  initials: string;
  avatarUrl: string | undefined;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}
```

## Files Structure

```
/lib
  /currentUser.ts        # Core library functions
  /index.ts              # Central exports

/hooks
  /useCurrentUser.ts     # React hook

/providers
  /AuthProvider.tsx      # Auth context (updated)

/components
  /layout
    /Header.tsx          # Header with user info
    /UserProfileDropdown.tsx  # User dropdown menu
```

## Migration Notes

Trước đây Header và UserProfileDropdown sử dụng hardcoded data:

```tsx
// ❌ Old way (hardcoded)
const user = {
  name: "John Doe",
  email: "john@example.com"
};

// ✅ New way (dynamic)
const { displayName, avatarUrl } = useCurrentUser();
```

## Testing

Để test với mock user:

```typescript
// Set user metadata when creating user
await supabase.auth.admin.createUser({
  email: 'test@example.com',
  password: 'password123',
  user_metadata: {
    display_name: 'Test User',
    full_name: 'Test User Full Name',
    avatar_url: 'https://example.com/avatar.jpg',
    role: 'Administrator',
  },
  email_confirm: true
});
```

## Related Documentation

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [React Hooks Best Practices](https://react.dev/reference/react)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
