# 🚀 Quick Start: Fix Navigation Issues

## ⚡ Bắt Đầu Ngay (5 phút)

### 1. Kiểm tra tình trạng hiện tại

```bash
# Kiểm tra còn bao nhiêu file cần fix
grep -r "from ['\"]next/navigation['\"]" app/\(admin\)/platform/**/*.tsx | wc -l

# Xem danh sách files
grep -r "from ['\"]next/navigation['\"]" app/\(admin\)/platform/**/*.tsx
```

### 2. Fix file đầu tiên (Example: Roles Create)

#### A. Mở file
```bash
# Mở file trong editor
code app/\(admin\)/platform/roles/create/page.tsx
```

#### B. Tìm và thay thế

**TÌM:**
```typescript
import { useRouter } from 'next/navigation';
```

**THAY BẰNG:**
```typescript
import { useRouter } from '../../../../components/shim/next-navigation';
```

**Hoặc nếu có nhiều imports:**

**TÌM:**
```typescript
import { useRouter, useParams } from 'next/navigation';
```

**THAY BẰNG:**
```typescript
import { useRouter, useParams } from '../../../../components/shim/next-navigation';
```

#### C. Xác định độ sâu đúng

```
/app/(admin)/platform/roles/create/page.tsx
└── cần đi lên 4 levels: ../../../../

/app/(admin)/platform/roles/edit/[id]/page.tsx
└── cần đi lên 5 levels: ../../../../../

/app/(admin)/settings/general/page.tsx
└── cần đi lên 4 levels: ../../../../
```

**Quick formula:**
- Đếm số `/` trong path sau `/app/(admin)/`
- Số `/` = số `../`

Example:
- `platform/roles/create` = 3 slashes = 3 `../` + 1 = `../../../../`

#### D. Save và verify

```bash
# Verify không còn import 'next/navigation'
grep "next/navigation" app/\(admin\)/platform/roles/create/page.tsx

# Should return: No matches
```

### 3. Test ngay

```typescript
// Trong browser console
1. Click "Create Role" từ sidebar
2. Check URL: should be /platform/roles/create
3. Check console: no errors
4. Fill form and save
5. Should redirect to /platform/roles
```

---

## 🔥 Fix Nhanh 8 Files Priority 1 (30 phút)

### Commands để copy-paste

```bash
# 1. Roles Create
sed -i "s|from 'next/navigation'|from '../../../../components/shim/next-navigation'|g" \
  app/\(admin\)/platform/roles/create/page.tsx

# 2. Roles Edit
sed -i "s|from 'next/navigation'|from '../../../../../components/shim/next-navigation'|g" \
  app/\(admin\)/platform/roles/edit/\[id\]/page.tsx

# 3. Users Create
sed -i "s|from 'next/navigation'|from '../../../../components/shim/next-navigation'|g" \
  app/\(admin\)/platform/users/create/page.tsx

# 4. Users Edit
sed -i "s|from 'next/navigation'|from '../../../../../components/shim/next-navigation'|g" \
  app/\(admin\)/platform/users/edit/\[id\]/page.tsx

# 5. Tenant Rate Limits List
sed -i "s|from 'next/navigation'|from '../../../../components/shim/next-navigation'|g" \
  app/\(admin\)/platform/tenant-rate-limits/page.tsx

# 6. Tenant Rate Limits Create
sed -i "s|from 'next/navigation'|from '../../../../../components/shim/next-navigation'|g" \
  app/\(admin\)/platform/tenant-rate-limits/create/page.tsx

# 7. Tenant Rate Limits Edit
sed -i "s|from 'next/navigation'|from '../../../../../../components/shim/next-navigation'|g" \
  app/\(admin\)/platform/tenant-rate-limits/edit/\[id\]/page.tsx

# 8. Legal Documents
sed -i "s|from 'next/navigation'|from '../../../../components/shim/next-navigation'|g" \
  app/\(admin\)/platform/legal-documents/page.tsx
```

**⚠️ Note:** Trên Windows, dùng PowerShell thay cho sed:

```powershell
# Example
(Get-Content app/\(admin\)/platform/roles/create/page.tsx) `
  -replace "from 'next/navigation'", "from '../../../../components/shim/next-navigation'" |
  Set-Content app/\(admin\)/platform/roles/create/page.tsx
```

### Verify tất cả

```bash
# Should return 0
grep -r "from ['\"]next/navigation['\"]" \
  app/\(admin\)/platform/roles/create/page.tsx \
  app/\(admin\)/platform/roles/edit/\[id\]/page.tsx \
  app/\(admin\)/platform/users/create/page.tsx \
  app/\(admin\)/platform/users/edit/\[id\]/page.tsx \
  app/\(admin\)/platform/tenant-rate-limits/page.tsx \
  app/\(admin\)/platform/tenant-rate-limits/create/page.tsx \
  app/\(admin\)/platform/tenant-rate-limits/edit/\[id\]/page.tsx \
  app/\(admin\)/platform/legal-documents/page.tsx \
  | wc -l
```

---

## 🧪 Quick Test Script

### Tạo file test

```bash
# Tạo file test-nav-quick.js
cat > test-nav-quick.js << 'EOF'
const routes = [
  '/platform/roles/create',
  '/platform/users/create',
  '/platform/tenant-rate-limits',
];

async function testRoute(path) {
  console.log(`Testing ${path}...`);
  
  const link = document.querySelector(`a[href="${path}"]`);
  if (!link) {
    console.error(`❌ Link not found: ${path}`);
    return false;
  }
  
  link.click();
  await new Promise(r => setTimeout(r, 1000));
  
  if (window.location.pathname !== path) {
    console.error(`❌ Failed: ${window.location.pathname} !== ${path}`);
    return false;
  }
  
  console.log(`✅ Passed: ${path}`);
  return true;
}

async function runTests() {
  for (const route of routes) {
    await testRoute(route);
  }
}

runTests();
EOF
```

### Run test trong browser console

```javascript
// Copy-paste toàn bộ file test-nav-quick.js vào console
// Hoặc:
const script = document.createElement('script');
script.src = '/test-nav-quick.js';
document.head.appendChild(script);
```

---

## 📊 Track Progress Real-time

### Tạo progress tracker

```bash
# Count remaining
echo "Remaining files: $(grep -r "from ['\"]next/navigation['\"]" app/\(admin\)/platform/**/*.tsx | wc -l)"

# Show which files
echo "Files to fix:"
grep -r "from ['\"]next/navigation['\"]" app/\(admin\)/platform/**/*.tsx | cut -d: -f1 | sort | uniq
```

### Update NAVIGATION_FIX_STATUS.md

```bash
# After fixing each file, update the status file
sed -i 's/⏳ `\/app\/(admin)\/platform\/roles\/create\/page.tsx`/✅ `\/app\/(admin)\/platform\/roles\/create\/page.tsx`/' \
  NAVIGATION_FIX_STATUS.md
```

---

## 🎯 Workflow Suggested (2 giờ để fix hết)

### Phase 1: Fix Priority 1 (30 min)
```bash
# Run all sed commands above
# Verify with grep
# Commit
git add .
git commit -m "fix: navigation imports for priority 1 files (8 files)"
```

### Phase 2: Fix Priority 2 (45 min)
```bash
# User Consents (3 files)
# User Sessions (3 files)
# User Roles (3 files)
# User Devices (3 files)

# Total: 12 files
# Commit
git add .
git commit -m "fix: navigation imports for priority 2 files (12 files)"
```

### Phase 3: Fix Priority 3 (15 min)
```bash
# Legal Documents Detail (1 file)
# Subscription Invoices Detail (1 file)

# Commit
git add .
git commit -m "fix: navigation imports for priority 3 files (2 files)"
```

### Phase 4: Test All (30 min)
```bash
# Test trong browser
# Document issues
# Fix issues nếu có
# Final commit
git add .
git commit -m "fix: navigation testing complete, all routes working"
```

---

## 🐛 Common Issues & Quick Fixes

### Issue 1: Wrong depth

**Symptom:**
```
Cannot find module '../../../../components/shim/next-navigation'
```

**Fix:**
```bash
# Count levels correctly
# /app/(admin)/platform/roles/create/page.tsx
#     1        2        3      4      file
# Need: ../../../../ (4 levels)
```

### Issue 2: Still redirecting to dashboard

**Symptom:** Click link → Redirected to `/admin/dashboard`

**Fix:**
```typescript
// Check if shim is being used
import { useRouter } from '../../../../components/shim/next-navigation';

// NOT from 'next/navigation'
```

### Issue 3: useParams not working

**Symptom:** `useParams()` returns empty object

**Fix:**
```typescript
// Make sure to import from shim
import { useRouter, useParams } from '../../../../../components/shim/next-navigation';

// Check ParamsProvider is wrapping the component
```

### Issue 4: TypeScript errors

**Symptom:** Type errors on router methods

**Fix:**
```typescript
// The shim exports the same types
// Should work without changes
const router = useRouter();
router.push('/path'); // ✅
```

---

## ✅ Success Checklist (Quick)

After fixing all files:

- [ ] `grep -r "from ['\"]next/navigation['\"]" app/(admin)/platform/**/*.tsx` returns 0 results
- [ ] Can click "Create Role" → Page loads
- [ ] Can click "Create User" → Page loads  
- [ ] Can click "Tenant Rate Limits" → Page loads
- [ ] No console errors when navigating
- [ ] Form submit redirects correctly
- [ ] TypeScript compiles: `npm run type-check`
- [ ] Linter passes: `npm run lint`

---

## 📞 Need Help?

### Debug Commands

```bash
# 1. Find all navigation imports
find app/\(admin\) -name "*.tsx" -exec grep -l "next/navigation" {} \;

# 2. Check specific file
cat app/\(admin\)/platform/roles/create/page.tsx | grep import

# 3. Verify shim exists
ls -la components/shim/next-navigation.tsx

# 4. Test shim works
node -e "console.log(require('./components/shim/next-navigation'))"
```

### Verify Shim Configuration

```typescript
// Check /components/shim/config.ts
export const USE_NEXTJS_MODE = false; // Should be false
export const DEBUG_SHIM = true; // Set to true for debugging
```

### Enable Debug Logging

```typescript
// In /components/shim/next-navigation.tsx
export const DEBUG_SHIM = true;

// Now you'll see:
// [Shim] Navigate to: /platform/users {}
// [Shim] ComponentName is using useRouter
```

---

## 🎉 Done!

Sau khi fix xong tất cả:

1. ✅ Update NAVIGATION_FIX_STATUS.md → 100%
2. ✅ Update NAVIGATION_FIX_CHECKLIST.md → Mark all done
3. ✅ Commit & push
4. ✅ Move to Phase 3: Implement APIs

---

**Time Estimate:** 2 giờ cho tất cả fixes + testing  
**Difficulty:** ⭐⭐ (Easy - chỉ cần find & replace)  
**Impact:** 🔥🔥🔥 (Critical - fix navigation issues)
