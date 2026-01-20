# Fix Multiple GoTrueClient Instances Warning

**Date**: 2026-01-20  
**Issue**: Multiple GoTrueClient instances detected in browser context  
**Status**: ✅ FIXED

## Problem Description

Console warning:
```
GoTrueClient@sb-vewxdzhvrpxsmpmlwaqr-auth-token:1 (2.90.1) 2026-01-20T07:10:50.028Z 
Multiple GoTrueClient instances detected in the same browser context. 
It is not an error, but this should be avoided as it may produce undefined 
behavior when used concurrently under the same storage key.
```

## Root Cause

Hai pages đang tạo Supabase client instances mới thay vì dùng singleton:
1. `/app/(admin)/test-connection/page.tsx` (line 51)
2. `/app/(admin)/quick-fix/page.tsx` (line 49)

Code gây lỗi:
```tsx
const { createClient } = await import('@supabase/supabase-js');
const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);
```

## Solution

Đã thay thế bằng singleton pattern từ `/lib/supabase.ts`:

```tsx
import { getSupabaseClient } from '@/lib/supabase';

// Use singleton instance
const supabase = getSupabaseClient();
```

## Files Modified

### 1. `/app/(admin)/test-connection/page.tsx`
- ❌ Removed: `createClient()` call
- ✅ Added: `import { getSupabaseClient } from '@/lib/supabase'`
- ✅ Changed: Line 51 từ `createClient(...)` sang `getSupabaseClient()`

### 2. `/app/(admin)/quick-fix/page.tsx`
- ❌ Removed: `createClient()` call và unused `publicAnonKey` import
- ✅ Added: `import { getSupabaseClient } from '@/lib/supabase'`
- ✅ Changed: Line 49 từ `createClient(...)` sang `getSupabaseClient()`

## Singleton Implementation

File `/lib/supabase.ts` sử dụng global registry pattern để đảm bảo chỉ 1 instance:

```tsx
const globalForSupabase = globalThis as unknown as {
  supabaseClient: ReturnType<typeof createClient> | undefined;
  supabaseCreated: boolean;
};

export function getSupabaseClient() {
  // Return existing instance if available
  if (globalForSupabase.supabaseClient) {
    return globalForSupabase.supabaseClient;
  }
  
  // Create new instance only if not exists
  const client = createClient(
    `https://${projectId}.supabase.co`,
    publicAnonKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'sb-vewxdzhvrpxsmpmlwaqr-auth-token',
      },
    }
  );
  
  globalForSupabase.supabaseClient = client;
  return client;
}
```

## Benefits

1. ✅ **No more Multiple GoTrueClient warnings**
2. ✅ **Consistent auth state** across app
3. ✅ **Better memory usage** - single client instance
4. ✅ **Prevents race conditions** in auth operations

## Best Practice Rule

**❌ NEVER create Supabase client directly in components:**
```tsx
// BAD - Creates new instance
const supabase = createClient(url, key);
```

**✅ ALWAYS use singleton:**
```tsx
// GOOD - Uses shared instance
import { getSupabaseClient } from '@/lib/supabase';
const supabase = getSupabaseClient();
```

## Verification

Sau khi fix, check console - warning đã biến mất:
- [x] No "Multiple GoTrueClient instances" warning
- [x] Auth state consistent across pages
- [x] Login/logout works correctly

## Related Files

- `/lib/supabase.ts` - Singleton implementation
- `/utils/supabase/info.tsx` - Config values
- All components should use `getSupabaseClient()`

## Notes

- Server-side code (Supabase Edge Functions) có thể tạo clients riêng vì chúng chạy trong isolated contexts
- Singleton pattern chỉ cần thiết cho frontend code
- Warning này không block app nhưng có thể gây undefined behavior trong auth operations
