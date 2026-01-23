# 📚 NEXT.JS MIGRATION - INDEX & OVERVIEW

**Project:** VHV Platform  
**Migration:** React Router → Next.js 14 App Router  
**Status:** Ready to Execute  
**Date:** 2026-01-23

---

## 📋 TÀI LIỆU MIGRATION

### 🎯 Quick Start (Cho người vội)
**File:** `/NEXTJS_MIGRATION_QUICKSTART.md`  
**Thời gian:** 15 phút  
**Nội dung:**
- 3 bước đơn giản
- Run script → Start server → Test
- Quick fixes cho lỗi thường gặp

**Khi nào dùng:** Bạn muốn migrate ngay, ít thời gian

---

### 📖 Complete Guide (Cho người muốn hiểu rõ)
**File:** `/NEXTJS_MIGRATION_GUIDE_COMPLETE.md`  
**Thời gian:** 2-4 giờ  
**Nội dung:**
- 7 bước chi tiết
- Giải thích từng bước
- Troubleshooting chi tiết
- Post-migration optimizations

**Khi nào dùng:** Bạn muốn hiểu kỹ từng bước migration

---

### ⚙️ Scripts (Automation)

#### 1. Migration Script
**File:** `/scripts/migrate-to-nextjs-complete.sh`  
**Mục đích:** Tự động migrate toàn bộ
**Thời gian:** 2-3 phút
```bash
chmod +x scripts/migrate-to-nextjs-complete.sh
./scripts/migrate-to-nextjs-complete.sh
```

**Chức năng:**
- ✅ Backup code
- ✅ Create next-navigation-nextjs.tsx
- ✅ Update shim layer
- ✅ Fix imports (to → href)
- ✅ Add 'use client' directives
- ✅ Update config to Next.js mode

#### 2. Rollback Script
**File:** `/scripts/rollback-nextjs-migration.sh`  
**Mục đích:** Khôi phục về React Router
**Thời gian:** 1 phút
```bash
./scripts/rollback-nextjs-migration.sh
```

**Chức năng:**
- 🔄 Restore backup files
- 🔄 Revert config to React Router
- 🔄 Fix imports back (href → to)
- 🔄 Remove Next.js files

#### 3. Test Script
**File:** `/scripts/test-nextjs-migration.sh`  
**Mục đích:** Validate migration thành công
**Thời gian:** 2-3 phút
```bash
./scripts/test-nextjs-migration.sh
```

**Chức năng:**
- 🧪 Check dev server
- 🧪 Test critical pages
- 🧪 Validate configuration
- 🧪 Check for common issues
- 🧪 Test build

---

## 🎯 MIGRATION WORKFLOW

```
┌─────────────────────────────────────────┐
│  PHASE 1: PREPARATION (5 min)          │
├─────────────────────────────────────────┤
│ 1. Read QUICKSTART.md                   │
│ 2. Backup code (git commit)            │
│ 3. Make scripts executable              │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  PHASE 2: EXECUTION (3 min)            │
├─────────────────────────────────────────┤
│ 4. Run migration script                 │
│ 5. Script auto-fixes issues             │
│ 6. Clear cache                          │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  PHASE 3: VALIDATION (10 min)          │
├─────────────────────────────────────────┤
│ 7. Start dev server                     │
│ 8. Test in browser                      │
│ 9. Run test script                      │
│ 10. Fix any issues                      │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  PHASE 4: FINALIZATION (5 min)         │
├─────────────────────────────────────────┤
│ 11. Test all features                   │
│ 12. Check performance                   │
│ 13. Commit changes                      │
│ 14. Celebrate! 🎉                       │
└─────────────────────────────────────────┘
```

---

## 📊 CURRENT STATUS

### Architecture

#### Before Migration (React Router)
```
Entry: App.tsx (React Router)
├── BrowserRouter
├── Routes
│   ├── Route /admin
│   ├── Route /admin/tenants
│   ├── Route /admin/users
│   └── ... (manual routes)
└── Components
    └── Shim (React Router → Next.js API)
```

#### After Migration (Next.js)
```
Entry: app/layout.tsx (Next.js)
├── File-based routing
│   ├── /app/(admin)/admin/page.tsx
│   ├── /app/(admin)/admin/tenants/page.tsx
│   ├── /app/(admin)/admin/tenants/[id]/page.tsx
│   └── ... (automatic routing)
└── Components
    └── Shim (pass-through to Next.js)
```

### Key Changes

| Aspect | Before | After |
|--------|--------|-------|
| **Entry Point** | `/App.tsx` | `/app/layout.tsx` |
| **Routing** | Manual (`<Routes>`) | File-based |
| **Navigation** | Shim (React Router) | Shim (Next.js) |
| **Config** | `USE_NEXTJS_MODE=false` | `USE_NEXTJS_MODE=true` |
| **Link Prop** | `<Link to="">` | `<Link href="">` |
| **Scripts** | `vite` | `next dev` |

---

## 🎓 KEY CONCEPTS

### 1. Shim Layer (Compatibility)

**Purpose:** Code components không cần thay đổi

**How it works:**
```typescript
// Component code (KHÔNG ĐỔI)
import { useRouter, Link } from '@/components/shim/next-navigation';

// Shim handles routing internally:
// - React Router mode: Uses react-router-dom
// - Next.js mode: Uses next/navigation
```

### 2. File next-navigation-nextjs.tsx

**Purpose:** Pure Next.js implementation của shim

**Content:**
```typescript
// Re-export Next.js navigation
export {
  useRouter,
  useParams,
  useSearchParams,
  // ...
} from 'next/navigation';

export { default as Link } from 'next/link';
```

**Usage:** Replace `/components/shim/next-navigation.tsx` with this

### 3. 'use client' Directive

**Purpose:** Mark components as Client Components

**When needed:**
- Components using hooks (useState, useEffect, etc.)
- Components using browser APIs (window, localStorage, etc.)
- Event handlers (onClick, onChange, etc.)

**Example:**
```typescript
'use client'  // ← Add this line

import { useState } from 'react';

export default function MyComponent() {
  const [state, setState] = useState();
  // ...
}
```

---

## 🚀 EXECUTION OPTIONS

### Option A: Fully Automated (RECOMMENDED)
```bash
# One command does everything
./scripts/migrate-to-nextjs-complete.sh
npm run dev
```
**Pros:** Fast, automated, consistent  
**Cons:** Less control, need to trust script

---

### Option B: Manual Step-by-Step
```bash
# Follow COMPLETE GUIDE
# Execute each step manually
# More control, slower
```
**Pros:** Full control, understand each step  
**Cons:** Slower, more chance of errors

---

### Option C: Gradual Migration
```bash
# Test on staging first
# Migrate production later
# Safest approach
```
**Pros:** Lowest risk, can rollback easily  
**Cons:** Takes longer, need staging env

---

## 🛡️ SAFETY MEASURES

### Backups

1. **Git Backup**
   ```bash
   git add .
   git commit -m "Backup before migration"
   git checkout -b nextjs-migration
   ```

2. **File Backup**
   ```bash
   # Script auto-creates
   backup-migration-YYYYMMDD-HHMMSS/
   ├── App.tsx.backup
   ├── next-navigation.tsx.backup
   └── config.ts.backup
   ```

3. **Rollback Available**
   ```bash
   ./scripts/rollback-nextjs-migration.sh
   # Restores everything in 1 minute
   ```

---

## 📈 EXPECTED IMPROVEMENTS

### Performance

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| First Load | 3-5s | 1-2s | 50-60% faster |
| Navigation | 200-500ms | 100-200ms | 50% faster |
| Bundle Size | ~800KB | ~300KB | 62% smaller |

### Developer Experience

- ✅ File-based routing (easier)
- ✅ Automatic code splitting
- ✅ Better TypeScript integration
- ✅ Built-in image optimization
- ✅ API routes (optional)

### SEO & User Experience

- ✅ Server-side rendering (SSR)
- ✅ Static site generation (SSG)
- ✅ Better Core Web Vitals
- ✅ Faster page loads
- ✅ Improved caching

---

## ⚠️ KNOWN LIMITATIONS

### During Migration

1. **Cannot use both Router modes**
   - Must commit to either React Router OR Next.js
   - Cannot mix routing approaches

2. **Some features require refactor**
   - Server Components (optional optimization)
   - Streaming (advanced feature)
   - Parallel routes (advanced feature)

3. **Build process changes**
   - From Vite to Next.js build
   - Different optimization strategies
   - May need config adjustments

---

## 🆘 SUPPORT & RESOURCES

### Documentation

| Resource | Location | Purpose |
|----------|----------|---------|
| Quick Start | `/NEXTJS_MIGRATION_QUICKSTART.md` | Fast migration |
| Complete Guide | `/NEXTJS_MIGRATION_GUIDE_COMPLETE.md` | Detailed steps |
| This Index | `/NEXTJS_MIGRATION_INDEX.md` | Overview |

### Scripts

| Script | Location | Purpose |
|--------|----------|---------|
| Migrate | `/scripts/migrate-to-nextjs-complete.sh` | Auto-migrate |
| Rollback | `/scripts/rollback-nextjs-migration.sh` | Restore |
| Test | `/scripts/test-nextjs-migration.sh` | Validate |

### External Resources

- [Next.js Docs](https://nextjs.org/docs)
- [App Router Guide](https://nextjs.org/docs/app)
- [Migration Guide](https://nextjs.org/docs/app/building-your-application/upgrading/app-router-migration)

---

## ✅ READY TO MIGRATE?

### Checklist Before Starting

- [ ] Code is committed to git
- [ ] Have 30 minutes free time
- [ ] Read QUICKSTART.md
- [ ] Scripts are executable
- [ ] Dev dependencies installed
- [ ] Backup strategy in place

### Start Migration

**Option 1 - Quick (15 min):**
```bash
./scripts/migrate-to-nextjs-complete.sh
```

**Option 2 - Careful (2-4 hours):**
Follow `/NEXTJS_MIGRATION_GUIDE_COMPLETE.md`

---

## 📞 NEED HELP?

### Common Questions

**Q: Will this break my app?**  
A: No, có rollback script. Risk thấp.

**Q: How long does it take?**  
A: 15 phút (quick) hoặc 2-4 giờ (careful)

**Q: Can I rollback?**  
A: Yes, 1 phút với rollback script

**Q: What if I get errors?**  
A: Check TROUBLESHOOTING section trong Complete Guide

---

**Last Updated:** 2026-01-23  
**Version:** 1.0.0  
**Status:** ✅ Ready for Production Migration
