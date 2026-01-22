# Next.js Migration Shim

## Mục đích

Folder này chứa các shim files để làm cho React SPA hoạt động giống Next.js App Router, giúp việc migration sau này đơn giản và không cần sửa nhiều code.

## Cấu trúc

```
/components/shim/
├── config.ts              # Cấu hình shim mode
├── next-navigation.tsx    # Shim cho next/navigation
├── AppRoutes.tsx         # Routing system (sẽ thay bằng Next.js App Router)
└── README.md             # File này
```

## Strategy Migration (3 bước đơn giản)

### Bước 1: Development với Shim (Hiện tại)

```typescript
// config.ts
export const USE_NEXTJS_MODE = false; // Dùng React Router shim

// Components import như Next.js
import { useRouter, useParams, Link } from '../shim/next-navigation';
```

### Bước 2: Migration sang Next.js (Tương lai)

#### Option A: Dùng flag (Test từng phần)
```typescript
// config.ts
export const USE_NEXTJS_MODE = true; // Chuyển sang Next.js thật

// Thêm vào next-navigation.tsx
if (USE_NEXTJS_MODE) {
  // Import from real Next.js
  const NextNavigation = require('next/navigation');
  useRouter = NextNavigation.useRouter;
  useParams = NextNavigation.useParams;
  // ... etc
}
```

#### Option B: Direct replacement (Khi đã test xong)
```typescript
// Xóa toàn bộ file next-navigation.tsx
// Thay bằng simple re-export:
export * from 'next/navigation';
export { default as Link } from 'next/link';
```

### Bước 3: Cleanup (Sau migration)

1. Xóa folder `/components/shim/`
2. Find & Replace tất cả imports:
   - Tìm: `from '../shim/next-navigation'` hoặc `from './shim/next-navigation'`
   - Thay: `from 'next/navigation'`
3. Thay `<Link>` imports:
   - Tìm: `import { Link } from '../shim/next-navigation'`
   - Thay: `import Link from 'next/link'`

## Ưu điểm của approach này

### ✅ Zero Code Change trong Components
- Components viết code giống Next.js 100%
- Không cần refactor khi migration
- TypeScript types tương thích

### ✅ Incremental Migration
- Có thể test từng module với flag
- Rollback dễ dàng nếu có vấn đề
- Migration theo từng bước nhỏ

### ✅ Maintainability
- Tất cả shim logic tập trung ở một folder
- Dễ debug với DEBUG_SHIM flag
- Clear separation of concerns

## API Coverage

### ✅ Đã implement (Next.js compatible)

```typescript
// Hooks
useRouter()     // { push, replace, back, forward, refresh, pathname, query }
useParams()     // Lấy dynamic route params
useSearchParams() // Query string params
usePathname()   // Current pathname

// Components
<Link href="...">  // Next.js style navigation

// Server functions (shimmed)
redirect(url)   // Server-side redirect
notFound()      // Trigger 404
```

### ⚠️ Chưa implement (sẽ cần khi dùng Next.js features)

```typescript
// Server Components features
headers()       // Request headers (Server Component only)
cookies()       // Request cookies (Server Component only)
generateMetadata() // Dynamic metadata

// Image optimization
<Image />       // Next.js optimized images (dùng <img> tạm thời)
```

## Best Practices

### DO ✅

```typescript
// Import từ shim (giống Next.js)
import { useRouter, Link } from '../shim/next-navigation';

// Dùng router.push() trong client components
const router = useRouter();
router.push('/dashboard');

// Dùng Link cho navigation
<Link href="/dashboard">Go to Dashboard</Link>
```

### DON'T ❌

```typescript
// Đừng import trực tiếp từ react-router
import { useNavigate } from 'react-router'; // ❌

// Đừng dùng window.location (trừ khi cần hard reload)
window.location.href = '/dashboard'; // ❌

// Đừng dùng redirect() trong client components
redirect('/dashboard'); // ❌ Dùng router.push() thay vì
```

## Debugging

### Enable debug mode

```typescript
// config.ts
export const DEBUG_SHIM = true; // Xem logs của shim

// Console sẽ hiển thị:
// [Shim] Navigate to: /dashboard
// [Shim] ComponentName is using useRouter
```

### Common Issues

#### Issue: Navigation không hoạt động
```typescript
// Kiểm tra custom event listener
window.addEventListener('app-navigate', (e) => {
  console.log('Navigate event:', e.detail);
});
```

#### Issue: Params undefined
```typescript
// Kiểm tra ParamsProvider wrap component
<ParamsProvider params={{ id: '123' }}>
  <YourComponent />
</ParamsProvider>
```

## Timeline Migration dự kiến

```
Phase 1: Development với Shim (Hiện tại)
├── Viết components như Next.js
├── Test routing với React Router shim
└── Hoàn thiện features

Phase 2: Setup Next.js (Tuần 1-2)
├── Init Next.js 14 project
├── Copy components sang /app directory
└── Test với USE_NEXTJS_MODE = true

Phase 3: Migration (Tuần 3-4)
├── Migrate từng route
├── Test features trong Next.js
└── Fix compatibility issues

Phase 4: Cleanup (Tuần 5)
├── Xóa shim folder
├── Update imports
└── Deploy Next.js version
```

## Câu hỏi thường gặp

### Q: Tại sao không dùng trực tiếp React Router?
**A:** Để code components giống Next.js 100%, giúp migration sau này không cần refactor. Chỉ cần đổi imports.

### Q: Performance có bị ảnh hưởng?
**A:** Không. Shim chỉ là thin wrapper, overhead không đáng kể. Khi migration sang Next.js, performance còn tốt hơn.

### Q: Có cần test lại toàn bộ sau khi migration?
**A:** Regression test vẫn cần, nhưng business logic không đổi. Chỉ test routing và navigation behaviors.

### Q: Nếu cần Next.js feature chưa có trong shim?
**A:** Thêm vào shim hoặc dùng conditional import:
```typescript
import { isShimMode } from './shim/next-navigation';

if (isShimMode()) {
  // Fallback logic for shim mode
} else {
  // Use Next.js feature
}
```

---

**Last updated:** 2026-01-21
**Version:** 1.0.0
**Author:** Migration Team
