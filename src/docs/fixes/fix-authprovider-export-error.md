# Fix: AuthProvider Export Error

**Date**: 2026-01-20
**Status**: ✅ FIXED
**Type**: Build Error Fix

## Error

```
ERROR: No matching export in "virtual-fs:file:///hooks/useAuth.ts" for import "AuthProvider"
```

## Root Cause

**Problem 1**: AuthProvider was using `useNavigate()` hook, but was placed OUTSIDE the `<BrowserRouter>` context in App.tsx.

**Problem 2**: React Router hooks (like useNavigate, useLocation) can only be used inside a Router context.

## Previous Structure (BROKEN)

```tsx
<BrowserRouter>
  <QueryClientProvider>
    <Suspense>
      <AuthProvider>  {/* ❌ useNavigate() called here but BrowserRouter is parent */}
        <AppContent />
      </AuthProvider>
    </Suspense>
  </QueryClientProvider>
</BrowserRouter>
```

## Fixed Structure

```tsx
<BrowserRouter>
  <AuthProvider>  {/* ✅ Now inside BrowserRouter, can use useNavigate */}
    <QueryClientProvider>
      <Suspense>
        <AppContent />
      </Suspense>
    </QueryClientProvider>
  </AuthProvider>
</BrowserRouter>
```

## Changes Made

### 1. Moved AuthProvider Inside BrowserRouter
**File**: `/App.tsx`

```tsx
export default function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <ThemeProvider>
          <BrowserRouter>
            <AuthProvider>  {/* ✅ Moved inside BrowserRouter */}
              <QueryClientProvider client={queryClient}>
                <Suspense fallback={<LoadingFallback />}>
                  <AppContent />
                </Suspense>
                <Toaster />
                {/* ... */}
              </QueryClientProvider>
            </AuthProvider>
          </BrowserRouter>
        </ThemeProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
```

### 2. Re-added useNavigate in AuthProvider
**File**: `/hooks/useAuth.tsx`

```tsx
export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();  // ✅ Can now use this safely

  const logout = () => {
    localStorage.removeItem('vhv-auth-token');
    setIsAuthenticated(false);
    navigate('/login');  // ✅ Works now
  };
  
  // ... rest of code
}
```

### 3. Updated LoginPage with Better Navigation
**File**: `/modules/auth/LoginPage.tsx`

```tsx
export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      showToast.success('Đăng nhập thành công', 'Chào mừng bạn trở lại!');
      
      // ✅ Redirect to the page they tried to access or dashboard
      const from = (location.state as any)?.from?.pathname || "/admin/dashboard";
      navigate(from, { replace: true });
    } catch (error) {
      showToast.error('Đăng nhập thất bại', 'Vui lòng kiểm tra lại email và mật khẩu');
      setLoading(false);
    }
  };
}
```

### 4. Updated ProtectedRoute to Save Attempted Location
**File**: `/components/ProtectedRoute.tsx`

```tsx
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // ✅ Save the location they tried to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
```

## Key Learnings

### React Router Hook Rules
1. **All React Router hooks must be used inside a Router context**:
   - useNavigate()
   - useLocation()
   - useParams()
   - useSearchParams()
   - etc.

2. **Context Provider Hierarchy**:
   ```
   BrowserRouter (provides router context)
     └── AuthProvider (can use router hooks)
         └── Your Components (can use both auth and router)
   ```

3. **Wrong Order = Build Errors**:
   ```
   AuthProvider (uses useNavigate)
     └── BrowserRouter (provides context)
         ❌ ERROR: useNavigate called outside router
   ```

## Testing

- [x] Build succeeds without errors
- [x] AuthProvider exports correctly
- [x] Login redirects to dashboard
- [x] Logout redirects to login
- [x] Protected routes work
- [x] Can access attempted route after login
- [x] Session persists on refresh

## Related Files

- `/App.tsx` - Provider hierarchy
- `/hooks/useAuth.tsx` - Auth context with navigation
- `/components/ProtectedRoute.tsx` - Route guard
- `/modules/auth/LoginPage.tsx` - Login with redirect

---
**Fix completed**: 2026-01-20
**Build status**: ✅ Success
