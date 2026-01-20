# ⚡ QUICK REFERENCE CARD - NextJS Ready Coding

## 🎯 3 NGUYÊN TẮC VÀNG

1. **Logic ở `/app/(admin)/`** ✅
2. **Dùng Shim Layer** ✅  
3. **Bridge ở `/pages/`** ✅

---

## 📁 CẤU TRÚC FILE

```
/app/(admin)/products/
├── page.tsx              ← LOGIC Ở ĐÂY
├── [id]/page.tsx         ← LOGIC Ở ĐÂY
├── add/page.tsx          ← LOGIC Ở ĐÂY
└── edit/[id]/page.tsx    ← LOGIC Ở ĐÂY

/pages/products/
├── index.tsx             ← CHỈ import + export
├── [id].tsx              ← CHỈ import + export
├── add.tsx               ← CHỈ import + export
└── edit/[id].tsx         ← CHỉ import + export
```

---

## ✅ CODE MẪU - Logic Page

```typescript
// /app/(admin)/products/page.tsx
'use client';
import { Fragment, useState } from 'react';
import { useRouter } from '@/components/shim/next-navigation'; // ⚡ SHIM!

function ProductsPage() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  
  // All logic here...
  
  return <Fragment>{/* UI */}</Fragment>;
}

export { ProductsPage };
export default ProductsPage;
```

---

## ✅ CODE MẪU - Bridge Page

```typescript
// /pages/products/index.tsx
import { ProductsPage } from '@/app/(admin)/products/page';
export default ProductsPage;
```

**CHỈ 2 DÒNG!**

---

## 🚀 QUICK START - Tạo Page Mới

### **Bước 1: Tạo Logic**
```bash
touch app/(admin)/my-feature/page.tsx
```

### **Bước 2: Code Logic**
```typescript
'use client';
import { Fragment } from 'react';
import { useRouter } from '@/components/shim/next-navigation';

function MyFeaturePage() {
  const router = useRouter();
  return <Fragment>{/* UI */}</Fragment>;
}

export { MyFeaturePage };
export default MyFeaturePage;
```

### **Bước 3: Tạo Bridge**
```bash
touch pages/my-feature/index.tsx
```

### **Bước 4: Code Bridge**
```typescript
import { MyFeaturePage } from '@/app/(admin)/my-feature/page';
export default MyFeaturePage;
```

**XONG!**

---

## 📋 CHECKLIST - Mỗi Page Mới

### **Logic File (`/app/(admin)/`):**
- [ ] `'use client';` ở đầu
- [ ] Import từ `@/components/shim/next-navigation`
- [ ] Wrap trong `<Fragment>`
- [ ] Export: `export { MyPage }; export default MyPage;`

### **Bridge File (`/pages/`):**
- [ ] Import từ `/app/(admin)/`
- [ ] Export default
- [ ] CHỈ 2 dòng code

### **Testing:**
- [ ] Page render OK
- [ ] Navigation hoạt động
- [ ] Không lỗi console
- [ ] TypeScript compile

---

## ❌ ĐỪNG LÀM

```typescript
// ❌ SAI - Import từ react-router-dom
import { useNavigate } from 'react-router-dom';

// ❌ SAI - Logic ở /pages/
// /pages/products/index.tsx
function ProductsPage() {
  const [items, setItems] = useState([]); // SAI!
}

// ❌ SAI - Quên 'use client'
import { useState } from 'react';
function MyPage() { ... }

// ❌ SAI - Quên export named
export default MyPage; // Thiếu export { MyPage }
```

---

## ✅ LUÔN LÀM

```typescript
// ✅ ĐÚNG - Import từ shim
import { useRouter, useParams } from '@/components/shim/next-navigation';

// ✅ ĐÚNG - Logic ở /app/(admin)/
// /app/(admin)/products/page.tsx
'use client';
function ProductsPage() {
  const [items, setItems] = useState([]);
}

// ✅ ĐÚNG - Có 'use client'
'use client';
import { useState } from 'react';
function MyPage() { ... }

// ✅ ĐÚNG - Export cả hai
export { MyPage };
export default MyPage;
```

---

## 🔧 COMMON HOOKS

### **Navigation:**
```typescript
import { useRouter } from '@/components/shim/next-navigation';
const router = useRouter();

router.push('/path');
router.back();
router.replace('/path');
```

### **Route Params:**
```typescript
import { useParams } from '@/components/shim/next-navigation';
const params = useParams();
const id = params?.id as string;
```

### **Search Params:**
```typescript
import { useSearchParams } from '@/components/shim/next-navigation';
const searchParams = useSearchParams();
const query = searchParams?.get('q');
```

---

## 📝 TEMPLATES

### **List Page:**
```typescript
'use client';
import { Fragment, useState, useEffect } from 'react';
import { useRouter } from '@/components/shim/next-navigation';
import { PageLayout } from '@/components/layout/PageLayout';

function ListPage() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => { loadData(); }, []);
  const loadData = async () => {
    try {
      setLoading(true);
      // Load items
    } finally {
      setLoading(false);
    }
  };
  
  return <Fragment><PageLayout>{/* UI */}</PageLayout></Fragment>;
}

export { ListPage };
export default ListPage;
```

### **Detail Page:**
```typescript
'use client';
import { Fragment, useState, useEffect } from 'react';
import { useRouter, useParams } from '@/components/shim/next-navigation';
import { PageLayout } from '@/components/layout/PageLayout';

function DetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => { if (id) loadData(); }, [id]);
  const loadData = async () => {
    try {
      // Load by id
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) return <div>Loading...</div>;
  if (!item) return <div>Not found</div>;
  
  return <Fragment><PageLayout>{/* UI */}</PageLayout></Fragment>;
}

export { DetailPage };
export default DetailPage;
```

### **Form Page:**
```typescript
'use client';
import { Fragment, useState, useEffect } from 'react';
import { useRouter, useParams } from '@/components/shim/next-navigation';
import { PageLayout } from '@/components/layout/PageLayout';

function FormPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  
  useEffect(() => { if (id) loadData(); }, [id]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (id) {
        // Update
      } else {
        // Create
      }
      router.push('/list');
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) return <div>Loading...</div>;
  
  return <Fragment><PageLayout><form onSubmit={handleSubmit}>{/* Form */}</form></PageLayout></Fragment>;
}

export { FormPage };
export default FormPage;
```

---

## 🎯 REMEMBER

### **LUÔN:**
✅ Logic ở `/app/(admin)/`  
✅ Dùng shim cho navigation  
✅ Export cả hai kiểu  
✅ Thêm `'use client';`  
✅ Wrap trong `<Fragment>`  

### **KHÔNG BAO GIỜ:**
❌ Logic ở `/pages/`  
❌ Dùng `react-router-dom`  
❌ Quên export named  
❌ Quên `'use client';`  
❌ Tạo circular dependency  

---

## 🚨 CODE REVIEW

### **Check Before PR:**
- [ ] Logic ở đúng chỗ
- [ ] Shim layer used
- [ ] Export đầy đủ
- [ ] TypeScript OK
- [ ] Tests pass
- [ ] No console errors

---

## 📞 HELP

**Tài liệu:**
- `CODING_STANDARDS_NEXTJS_READY.md` - Full standards
- `SHIM_USAGE_GUIDE.md` - Shim guide
- `TEAM_HANDOFF_GUIDE.md` - Team guide

**Examples:**
- 110+ pages trong `/app/(admin)/`
- Mọi pattern đã có example

---

**VERSION:** 1.0  
**DATE:** 2026-01-19  
**STATUS:** MANDATORY  

**IN TỜ NÀY RA VÀ DÁN LÊNỲ BÀN!** 📌

**CODE CHUẨN = MIGRATION DỄ!** 🚀✅
