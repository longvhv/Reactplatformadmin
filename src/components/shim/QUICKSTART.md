# 🚀 Quick Start Guide - Shim Migration Strategy

## TL;DR - Cách migration cực kỳ đơn giản

### Hiện tại (Development):
```typescript
// Viết code như Next.js
import { useRouter, Link } from '../shim/next-navigation';
```

### Khi migration sang Next.js:
```bash
# Option 1: Automatic (Recommended)
node components/shim/migration-helper.js --migrate

# Option 2: Manual Find & Replace
# Tìm:  from '../shim/next-navigation'
# Thay: from 'next/navigation'
```

**Không cần sửa logic code! Chỉ đổi imports!**

---

## 📋 Checklist Migration

### Phase 1: Preparation ✅
- [x] Setup shim với config
- [x] Viết components với Next.js API
- [x] Test routing với shim
- [x] Đảm bảo all imports dùng shim

### Phase 2: Next.js Setup (Khi sẵn sàng)
- [ ] Init Next.js 14 project: `npx create-next-app@latest`
- [ ] Copy components sang `/app` directory
- [ ] Update `config.ts`: `USE_NEXTJS_MODE = true`
- [ ] Test một vài routes

### Phase 3: Migration
- [ ] Run migration helper: `--check` → `--migrate`
- [ ] Update imports (automatic hoặc manual)
- [ ] Test toàn bộ application
- [ ] Fix issues nếu có

### Phase 4: Cleanup
- [ ] Remove `/components/shim/` folder
- [ ] Remove shim-related dependencies
- [ ] Update documentation

---

## 🎯 Key Benefits

### 1. Zero Refactoring
```typescript
// Code này KHÔNG CẦN SỬA khi migration
function MyComponent() {
  const router = useRouter();
  const params = useParams();
  
  return (
    <Link href="/dashboard">
      Go to Dashboard
    </Link>
  );
}
```

### 2. Type Safety
```typescript
// TypeScript types match Next.js exactly
const router: AppRouterInstance = useRouter();
const params: RouteParams<{ id: string }> = useParams();
```

### 3. Incremental Migration
```typescript
// Test từng phần với flag
if (USE_NEXTJS_MODE) {
  // Next.js behavior
} else {
  // Shim behavior
}
```

---

## 💡 Common Patterns

### Navigation
```typescript
import { useRouter } from '../shim/next-navigation';

const router = useRouter();

// Client-side navigation
router.push('/dashboard');
router.replace('/dashboard');
router.back();

// Giữ nguyên khi migration!
```

### Dynamic Routes
```typescript
import { useParams } from '../shim/next-navigation';

const params = useParams<{ id: string }>();
console.log(params.id); // Works in both shim and Next.js
```

### Links with stopPropagation
```typescript
import { Link } from '../shim/next-navigation';

<Link 
  href="/roles/123" 
  onClick={(e) => e.stopPropagation()}
>
  View Role
</Link>
```

---

## 🐛 Troubleshooting

### Issue: "Cannot find module 'next/navigation'"
**Solution:** Đang dùng shim mode, không cần Next.js installed. Đảm bảo `USE_NEXTJS_MODE = false`.

### Issue: Navigation không hoạt động
**Solution:** Kiểm tra custom event:
```typescript
window.addEventListener('app-navigate', (e) => {
  console.log('Navigate:', e.detail);
});
```

### Issue: Params undefined
**Solution:** Đảm bảo route có `ParamsProvider`:
```typescript
<ParamsProvider params={{ id: '123' }}>
  <YourComponent />
</ParamsProvider>
```

---

## 📞 Support

- 📖 Docs: `/components/shim/README.md`
- 🔧 Migration Helper: `node components/shim/migration-helper.js --help`
- 🐛 Debug: Set `DEBUG_SHIM = true` in `config.ts`

---

**Version:** 1.0.0  
**Last Updated:** 2026-01-21
