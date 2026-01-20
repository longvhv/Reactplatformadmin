# 🔧 HƯỚNG DẪN REFACTOR NHANH - /pages/ Sang Chuẩn

## 🎯 MỤC TIÊU

Chuyển đổi TẤT CẢ files trong `/pages/` từ:
- ❌ Files có logic code
- ❌ Dùng `react-router-dom`

Sang:
- ✅ Bridge files (chỉ import + export)
- ✅ Logic ở `/app/(admin)/`
- ✅ Dùng shim layer

---

## ⚡ CÔNG THỨC REFACTOR NHANH

### **Input:** File `/pages/ProductsPage.tsx` (có logic)
### **Output:** 
- Logic: `/app/(admin)/products/page.tsx`
- Bridge: `/pages/ProductsPage.tsx` (2 dòng)

---

## 📝 STEP-BY-STEP CHO MỖI FILE

### **VÍ DỤ: ProductsPage**

#### **BƯỚC 1: Đọc file gốc**

```bash
# Mở file
code pages/ProductsPage.tsx
```

**Nội dung hiện tại:**
```typescript
// pages/ProductsPage.tsx
import { Fragment, useState, useEffect } from 'react';
import { useNavigate } from 'react-router'; // ❌ react-router
// ... more imports

export default function ProductsPage() {
  const navigate = useNavigate(); // ❌ Logic ở đây
  const [products, setProducts] = useState([]); // ❌ State ở đây
  
  // ❌ Business logic ở đây
  const loadProducts = async () => { ... };
  
  return ( ... ); // ❌ JSX ở đây
}
```

#### **BƯỚC 2: Tạo file logic mới**

```bash
# Tạo thư mục nếu chưa có
mkdir -p app/\(admin\)/products

# Tạo file page.tsx
touch app/\(admin\)/products/page.tsx
```

#### **BƯỚC 3: Copy & Modify logic**

```typescript
// app/(admin)/products/page.tsx
'use client'; // ✅ THÊM directive này
import { Fragment, useState, useEffect } from 'react';
import { useRouter } from '@/components/shim/next-navigation'; // ✅ ĐỔI sang shim
// ... copy các imports khác y nguyên

function ProductsPage() { // ✅ Bỏ export default, dùng named function
  const router = useRouter(); // ✅ ĐỔI useNavigate → useRouter
  const [products, setProducts] = useState([]); // ✅ Copy y nguyên
  
  // ✅ Copy tất cả logic y nguyên
  const loadProducts = async () => { ... };
  
  // ✅ ĐỔI navigate → router
  // navigate('/path') → router.push('/path')
  
  return <Fragment>{/* Copy JSX y nguyên */}</Fragment>; // ✅ Wrap trong Fragment
}

// ✅ THÊM export cả hai
export { ProductsPage };
export default ProductsPage;
```

#### **BƯỚC 4: Chuyển file gốc thành bridge**

```typescript
// pages/ProductsPage.tsx
import { ProductsPage } from '@/app/(admin)/products/page';
export default ProductsPage;
```

**CHỈ 2 DÒNG!**

#### **BƯỚC 5: Test**

```bash
# Chạy dev server
npm run dev

# Truy cập page
# http://localhost:3000/products

# Kiểm tra:
# - Page render OK ✅
# - Navigation hoạt động ✅
# - Không lỗi console ✅
```

---

## 🔄 PATTERN ĐỔI IMPORTS

### **1. Navigation Hooks:**

```typescript
// ❌ CŨ
import { useNavigate, useParams, useLocation } from 'react-router';
const navigate = useNavigate();
const params = useParams();
const location = useLocation();

// ✅ MỚI
import { useRouter, useParams, useSearchParams } from '@/components/shim/next-navigation';
const router = useRouter();
const params = useParams();
const searchParams = useSearchParams();
```

### **2. Navigation Calls:**

```typescript
// ❌ CŨ
navigate('/products');
navigate('/products/123');
navigate(-1); // go back

// ✅ MỚI
router.push('/products');
router.push('/products/123');
router.back(); // go back
```

### **3. Params Access:**

```typescript
// ❌ CŨ (thường hoạt động y nguyên)
const { id } = useParams();

// ✅ MỚI (same, nhưng cần typing)
const params = useParams();
const id = params?.id as string;
```

### **4. Search Params:**

```typescript
// ❌ CŨ
const [searchParams] = useSearchParams();
const query = searchParams.get('q');

// ✅ MỚI (tương tự)
const searchParams = useSearchParams();
const query = searchParams?.get('q');
```

---

## 📋 CHECKLIST REFACTOR

### **Cho mỗi file, check:**

#### **Logic File (`/app/(admin)/...`):**
- [ ] Có `'use client';` ở đầu file
- [ ] Import từ shim: `@/components/shim/next-navigation`
- [ ] `useNavigate` → `useRouter`
- [ ] `navigate()` → `router.push()`
- [ ] `navigate(-1)` → `router.back()`
- [ ] Wrap JSX trong `<Fragment>`
- [ ] Export: `export { MyPage }; export default MyPage;`

#### **Bridge File (`/pages/...`):**
- [ ] CHỈ có 2 dòng
- [ ] Import từ `/app/(admin)/...`
- [ ] Export default

#### **Testing:**
- [ ] TypeScript compile OK
- [ ] Page renders
- [ ] Navigation works
- [ ] No console errors
- [ ] Data loads correctly

---

## 🚀 REFACTOR NHANH - TEMPLATES

### **Template 1: List Page**

**Pattern:** `pages/XxxsPage.tsx` → `app/(admin)/xxxs/page.tsx`

```bash
# 1. Tạo file
mkdir -p app/\(admin\)/products
touch app/\(admin\)/products/page.tsx

# 2. Copy logic file
# 3. Modify imports (react-router → shim)
# 4. Modify function (add exports)
# 5. Update bridge
```

### **Template 2: Detail Page**

**Pattern:** `pages/XxxDetailPage.tsx` → `app/(admin)/xxxs/[id]/page.tsx`

```bash
# 1. Tạo file
mkdir -p app/\(admin\)/products/[id]
touch app/\(admin\)/products/[id]/page.tsx

# 2. Copy logic file
# 3. Modify imports
# 4. Modify function
# 5. Update bridge
```

### **Template 3: Add Form**

**Pattern:** `pages/AddXxxPage.tsx` → `app/(admin)/xxxs/add/page.tsx`

```bash
# 1. Tạo file
mkdir -p app/\(admin\)/products/add
touch app/\(admin\)/products/add/page.tsx

# 2. Copy logic file
# 3. Modify imports
# 4. Modify function
# 5. Update bridge
```

### **Template 4: Edit Form**

**Pattern:** `pages/EditXxxPage.tsx` → `app/(admin)/xxxs/edit/[id]/page.tsx`

```bash
# 1. Tạo file
mkdir -p app/\(admin\)/products/edit/[id]
touch app/\(admin\)/products/edit/[id]/page.tsx

# 2. Copy logic file
# 3. Modify imports
# 4. Modify function
# 5. Update bridge
```

---

## 🎯 BATCH REFACTOR STRATEGY

### **Batch 1: Products Module (Example)**

**Files to refactor:**
1. ProductsPage.tsx → products/page.tsx
2. ProductDetailPage.tsx → products/[id]/page.tsx
3. AddProductPage.tsx → products/add/page.tsx
4. EditProductPage.tsx → products/edit/[id]/page.tsx

**Time:** ~20-25 minutes cho cả module

**Process:**
```bash
# 1. Tạo structure
mkdir -p app/\(admin\)/products/{add,edit/[id],[id]}

# 2. Tạo các files
touch app/\(admin\)/products/page.tsx
touch app/\(admin\)/products/[id]/page.tsx
touch app/\(admin\)/products/add/page.tsx
touch app/\(admin\)/products/edit/[id]/page.tsx

# 3. Refactor từng file (5-6 phút/file)
# 4. Update bridges
# 5. Test module
```

---

## 🔧 COMMON ISSUES & FIXES

### **Issue 1: TypeScript Errors với params**

```typescript
// ❌ Error: Type 'string | string[] | undefined'
const id = params.id;

// ✅ Fix: Type assertion
const id = params?.id as string;
```

### **Issue 2: Fragment không import**

```typescript
// ❌ Error: Fragment is not defined
return <Fragment>...</Fragment>;

// ✅ Fix: Import Fragment
import { Fragment, useState } from 'react';
```

### **Issue 3: Router push không hoạt động**

```typescript
// ❌ Error: router.push không navigate
router.push('products'); // Thiếu /

// ✅ Fix: Thêm / ở đầu
router.push('/products');
```

### **Issue 4: Circular import**

```typescript
// ❌ Error: Circular dependency
// pages/XxxPage.tsx imports from app/(admin)/xxx/page.tsx
// app/(admin)/xxx/page.tsx imports something from pages/

// ✅ Fix: Đảm bảo one-way flow
// app/(admin)/ KHÔNG BAO GIỜ import từ pages/
```

---

## 📊 TRACKING PROGRESS

### **Spreadsheet Template:**

| File | Module | Type | Status | Time | Notes |
|------|--------|------|--------|------|-------|
| ProductsPage.tsx | products | list | ✅ Done | 5 min | OK |
| ProductDetailPage.tsx | products | detail | ✅ Done | 6 min | OK |
| AddProductPage.tsx | products | add | 🔄 In Progress | - | - |
| EditProductPage.tsx | products | edit | ⏳ Pending | - | - |

### **Daily Goals:**

**Day 1 Morning:**
- [ ] Products module (4 files)
- [ ] Orders module (4 files)
- [ ] Users module (4 files)
- [ ] Tenants module (4 files)
**Total: 16 files**

**Day 1 Afternoon:**
- [ ] Subscriptions module (4 files)
- [ ] Invoices module (4 files)
- [ ] Payments module (4 files)
- [ ] Regions module (4 files)
**Total: 16 files**

---

## ⚡ AUTOMATION SCRIPT

### **Script: refactor-page.sh**

```bash
#!/bin/bash

# Usage: ./refactor-page.sh ProductsPage products list
# Args: PAGE_NAME FEATURE_PATH PAGE_TYPE

PAGE_NAME=$1
FEATURE_PATH=$2
PAGE_TYPE=$3 # list, detail, add, edit

echo "🔄 Refactoring ${PAGE_NAME}..."

# Determine target path
case $PAGE_TYPE in
  list)
    TARGET="app/(admin)/${FEATURE_PATH}/page.tsx"
    ;;
  detail)
    TARGET="app/(admin)/${FEATURE_PATH}/[id]/page.tsx"
    ;;
  add)
    TARGET="app/(admin)/${FEATURE_PATH}/add/page.tsx"
    ;;
  edit)
    TARGET="app/(admin)/${FEATURE_PATH}/edit/[id]/page.tsx"
    ;;
esac

# Create directory
mkdir -p $(dirname $TARGET)

# TODO: Add logic to copy and modify file
# (This is a template, actual implementation would be more complex)

echo "✅ Created logic file at ${TARGET}"

# Create bridge
cat > pages/${PAGE_NAME}.tsx << EOF
import { ${PAGE_NAME} } from '@/${TARGET%.tsx}';
export default ${PAGE_NAME};
EOF

echo "✅ Created bridge at pages/${PAGE_NAME}.tsx"
echo "📝 Please manually review and test the changes!"
```

---

## 💡 TIPS & BEST PRACTICES

### **1. Refactor theo module:**
- Làm hết 1 module (list, detail, add, edit) rồi mới sang module khác
- Dễ test, dễ track

### **2. Test ngay sau mỗi file:**
- Không chờ đến cuối
- Fix lỗi ngay khi phát hiện

### **3. Commit thường xuyên:**
```bash
git add .
git commit -m "refactor: migrate products module to app/(admin)"
```

### **4. Pair programming:**
- 1 người refactor, 1 người review ngay
- Catch errors sớm

### **5. Document issues:**
- Note lại các vấn đề đặc biệt
- Share với team

---

## 🎯 SUCCESS CRITERIA

### **Mỗi file được coi là DONE khi:**
- ✅ Logic file tạo ở `/app/(admin)/`
- ✅ Bridge file chỉ có 2 dòng
- ✅ TypeScript compile
- ✅ Page renders correctly
- ✅ Navigation works
- ✅ No console errors
- ✅ Reviewed by peer

---

## 📞 GETTING HELP

### **Nếu gặp khó khăn:**

1. **Check docs:**
   - `CODING_STANDARDS_NEXTJS_READY.md`
   - `QUICK_REFERENCE_CARD.md`
   - `SHIM_USAGE_GUIDE.md`

2. **Check examples:**
   - Xem files đã refactor
   - Copy pattern

3. **Ask team:**
   - Slack channel
   - Pair session
   - Code review

---

## 🎉 COMPLETION

### **Khi hoàn thành TẤT CẢ:**

1. **Validation:**
   - [ ] All 95 files refactored
   - [ ] All tests pass
   - [ ] No TypeScript errors
   - [ ] No console errors

2. **Documentation:**
   - [ ] Update PAGES_AUDIT_REPORT.md
   - [ ] Document lessons learned
   - [ ] Share with team

3. **Celebration:**
   - [ ] Team recognition
   - [ ] Update metrics
   - [ ] Plan next steps

---

**GOOD LUCK!** 🚀

**Bạn có thể làm được điều này!** 💪

**1-2 ngày để code CHUẨN 100%!** ✅
