# 📋 CODING STANDARDS - NEXTJS READY

## 🎯 Mục Đích

**TẤT CẢ code mới phải tuân thủ chuẩn này để sẵn sàng migration sang Next.js 14!**

---

## ⚠️ QUY TẮC BẮT BUỘC

### **NGUYÊN TẮC VÀNG:**

1. **Code logic LUÔN ở `/app/(admin)/`**
2. **Code ở `/pages/` CHỈ import và re-export**
3. **LUÔN dùng shim layer cho navigation**
4. **KHÔNG BAO GIỜ dùng `react-router-dom` trực tiếp**

---

## 📁 CẤU TRÚC THƯ MỤC CHUẨN

### **✅ ĐÚNG - Logic ở /app/(admin)/:**

```
/app/(admin)/
└── my-feature/
    ├── page.tsx                 # ✅ Logic code ở đây
    ├── [id]/
    │   └── page.tsx            # ✅ Detail page logic
    ├── add/
    │   └── page.tsx            # ✅ Add form logic
    └── edit/[id]/
        └── page.tsx            # ✅ Edit form logic

/pages/
└── my-feature/
    ├── index.tsx               # ✅ CHỈ import & export
    ├── [id].tsx                # ✅ CHỈ import & export
    ├── add.tsx                 # ✅ CHỈ import & export
    └── edit/
        └── [id].tsx            # ✅ CHỈ import & export
```

---

## 📝 MẪU CODE CHUẨN

### **1. Page Logic - Luôn ở `/app/(admin)/`**

```typescript
// /app/(admin)/products/page.tsx
'use client';
import { Fragment, useState, useEffect } from 'react';
import { useRouter } from '@/components/shim/next-navigation'; // ⚡ BẮT BUỘC dùng shim!
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { PageLayout } from '@/components/layout/PageLayout';
import { productsApi } from '@/api/productsApi';
import { showToast } from '@/lib/toast';

function ProductsPage() {
  const router = useRouter(); // ✅ Từ shim
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { loadItems(); }, []);
  
  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await productsApi.getAll();
      setItems(data);
    } catch (error: any) {
      showToast.error('Lỗi', 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item => 
    item.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Fragment>
      <PageLayout 
        icon={Plus} 
        title="Sản phẩm" 
        description="Quản lý sản phẩm"
        actions={
          <Button onClick={() => router.push('/products/add')}>
            <Plus className="w-4 h-4 mr-2" />
            Thêm mới
          </Button>
        }
      >
        <Card className="p-6">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input 
              placeholder="Tìm kiếm..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredItems.map((item) => (
                <div 
                  key={item._id}
                  className="flex items-center justify-between p-4 border rounded hover:bg-gray-50 cursor-pointer"
                  onClick={() => router.push(`/products/${item._id}`)}
                >
                  <p className="font-medium">{item.name}</p>
                  <Button variant="ghost" size="sm">Xem</Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </PageLayout>
    </Fragment>
  );
}

// ✅ BẮT BUỘC export cả hai
export { ProductsPage };
export default ProductsPage;
```

### **2. Pages Bridge - CHỈ import & export**

```typescript
// /pages/products/index.tsx
import { ProductsPage } from '@/app/(admin)/products/page';

// ✅ CHỈ export, KHÔNG có logic
export default ProductsPage;
```

**ĐÚNG VẬY! Cực kỳ đơn giản!**

---

## 🔥 EXAMPLES CHO TẤT CẢ CASES

### **A. List Page (Trang danh sách)**

#### **Logic ở `/app/(admin)/products/page.tsx`:**
```typescript
'use client';
import { Fragment, useState, useEffect } from 'react';
import { useRouter } from '@/components/shim/next-navigation'; // ⚡ SHIM!

function ProductsPage() {
  const router = useRouter();
  // ... all logic here
  return <Fragment>{/* UI */}</Fragment>;
}

export { ProductsPage };
export default ProductsPage;
```

#### **Bridge ở `/pages/products/index.tsx`:**
```typescript
import { ProductsPage } from '@/app/(admin)/products/page';
export default ProductsPage;
```

---

### **B. Detail Page (Trang chi tiết - có [id])**

#### **Logic ở `/app/(admin)/products/[id]/page.tsx`:**
```typescript
'use client';
import { Fragment, useState, useEffect } from 'react';
import { useRouter, useParams } from '@/components/shim/next-navigation'; // ⚡ SHIM!

function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string; // ✅ Lấy ID từ params
  
  // ... all logic here
  
  return <Fragment>{/* UI */}</Fragment>;
}

export { ProductDetailPage };
export default ProductDetailPage;
```

#### **Bridge ở `/pages/products/[id].tsx`:**
```typescript
import { ProductDetailPage } from '@/app/(admin)/products/[id]/page';
export default ProductDetailPage;
```

---

### **C. Add Form (Trang thêm mới)**

#### **Logic ở `/app/(admin)/products/add/page.tsx`:**
```typescript
'use client';
import { Fragment, useState } from 'react';
import { useRouter } from '@/components/shim/next-navigation'; // ⚡ SHIM!

function ProductAddPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ name: '', price: 0 });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await productsApi.create(formData);
      showToast.success('Thành công', 'Đã tạo sản phẩm');
      router.push('/products');
    } catch (error: any) {
      showToast.error('Lỗi', error.message);
    } finally {
      setSaving(false);
    }
  };

  return <Fragment>{/* Form UI */}</Fragment>;
}

export { ProductAddPage };
export default ProductAddPage;
```

#### **Bridge ở `/pages/products/add.tsx`:**
```typescript
import { ProductAddPage } from '@/app/(admin)/products/add/page';
export default ProductAddPage;
```

---

### **D. Edit Form (Trang chỉnh sửa - có [id])**

#### **Logic ở `/app/(admin)/products/edit/[id]/page.tsx`:**
```typescript
'use client';
import { Fragment, useState, useEffect } from 'react';
import { useRouter, useParams } from '@/components/shim/next-navigation'; // ⚡ SHIM!

function ProductEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [formData, setFormData] = useState({ name: '', price: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (id) loadData(); }, [id]);
  
  const loadData = async () => {
    try {
      const data = await productsApi.getById(id);
      setFormData(data);
    } catch (error) {
      showToast.error('Lỗi', 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await productsApi.update(id, formData);
      showToast.success('Thành công', 'Đã cập nhật');
      router.push('/products');
    } catch (error: any) {
      showToast.error('Lỗi', error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Đang tải...</div>;

  return <Fragment>{/* Form UI */}</Fragment>;
}

export { ProductEditPage };
export default ProductEditPage;
```

#### **Bridge ở `/pages/products/edit/[id].tsx`:**
```typescript
import { ProductEditPage } from '@/app/(admin)/products/edit/[id]/page';
export default ProductEditPage;
```

---

## ✅ CHECKLIST KHI TẠO PAGE MỚI

### **Bước 1: Tạo Logic Component**

- [ ] Tạo file ở `/app/(admin)/[feature]/page.tsx`
- [ ] Thêm `'use client';` ở đầu file
- [ ] Import từ shim: `@/components/shim/next-navigation`
- [ ] Sử dụng `useRouter()` từ shim
- [ ] Sử dụng `useParams()` từ shim (nếu có [id])
- [ ] Wrap JSX trong `<Fragment>`
- [ ] Export cả named và default: `export { MyPage }; export default MyPage;`

### **Bước 2: Tạo Pages Bridge**

- [ ] Tạo file ở `/pages/[feature]/...tsx`
- [ ] Import component từ `/app/(admin)/...`
- [ ] Export default (KHÔNG có logic)
- [ ] File chỉ có 2 dòng code

### **Bước 3: Kiểm tra**

- [ ] Không có import từ `react-router-dom`
- [ ] Tất cả navigation dùng shim
- [ ] Không có circular dependency
- [ ] TypeScript compile thành công
- [ ] Test navigation hoạt động

---

## ❌ SAI LẦM THƯỜNG GẶP

### **1. Import Sai:**

```typescript
// ❌ SAI - Không được dùng react-router-dom trực tiếp
import { useNavigate, useParams } from 'react-router-dom';

// ✅ ĐÚNG - Luôn dùng shim
import { useRouter, useParams } from '@/components/shim/next-navigation';
```

### **2. Đặt Logic Sai Chỗ:**

```typescript
// ❌ SAI - Logic ở /pages/
// /pages/products/index.tsx
function ProductsPage() {
  const [items, setItems] = useState([]); // Logic ở đây là SAI!
  // ...
}

// ✅ ĐÚNG - Logic ở /app/(admin)/
// /app/(admin)/products/page.tsx
function ProductsPage() {
  const [items, setItems] = useState([]); // Logic ở đây là ĐÚNG!
  // ...
}

// /pages/products/index.tsx - CHỈ bridge
import { ProductsPage } from '@/app/(admin)/products/page';
export default ProductsPage;
```

### **3. Quên Export:**

```typescript
// ❌ SAI - Chỉ export default
export default ProductsPage;

// ✅ ĐÚNG - Export cả hai
export { ProductsPage };
export default ProductsPage;
```

### **4. Quên 'use client':**

```typescript
// ❌ SAI - Thiếu 'use client'
import { useState } from 'react';

function MyPage() {
  const [data, setData] = useState([]); // Sẽ lỗi!
}

// ✅ ĐÚNG - Có 'use client'
'use client';
import { useState } from 'react';

function MyPage() {
  const [data, setData] = useState([]); // OK!
}
```

---

## 🎯 QUY TRÌNH TẠO PAGE MỚI

### **Bước 1: Tạo Logic File**

```bash
# Tạo file logic
touch app/(admin)/my-feature/page.tsx
```

```typescript
// app/(admin)/my-feature/page.tsx
'use client';
import { Fragment } from 'react';
import { useRouter } from '@/components/shim/next-navigation';

function MyFeaturePage() {
  const router = useRouter();
  
  return (
    <Fragment>
      {/* Your UI here */}
    </Fragment>
  );
}

export { MyFeaturePage };
export default MyFeaturePage;
```

### **Bước 2: Tạo Bridge File**

```bash
# Tạo file bridge
touch pages/my-feature/index.tsx
```

```typescript
// pages/my-feature/index.tsx
import { MyFeaturePage } from '@/app/(admin)/my-feature/page';
export default MyFeaturePage;
```

### **Bước 3: Test**

```bash
# Chạy dev server
npm run dev

# Truy cập: http://localhost:3000/my-feature
# Kiểm tra:
# - Page render OK
# - Navigation hoạt động
# - Không có lỗi console
```

---

## 📋 TEMPLATE NHANH

### **Template List Page:**

```typescript
// app/(admin)/[feature]/page.tsx
'use client';
import { Fragment, useState, useEffect } from 'react';
import { useRouter } from '@/components/shim/next-navigation';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { PageLayout } from '@/components/layout/PageLayout';

function FeatureListPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { loadItems(); }, []);
  const loadItems = async () => {
    try {
      setLoading(true);
      // Load data
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Fragment>
      <PageLayout icon={Plus} title="Title" description="Description">
        <Card className="p-6">
          {/* Content */}
        </Card>
      </PageLayout>
    </Fragment>
  );
}

export { FeatureListPage };
export default FeatureListPage;
```

### **Template Detail Page:**

```typescript
// app/(admin)/[feature]/[id]/page.tsx
'use client';
import { Fragment, useState, useEffect } from 'react';
import { useRouter, useParams } from '@/components/shim/next-navigation';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card } from '@/components/ui/card';

function FeatureDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (id) loadData(); }, [id]);
  const loadData = async () => {
    try {
      // Load data by id
      setItem({});
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!item) return <div>Not found</div>;

  return (
    <Fragment>
      <PageLayout icon={Plus} title="Detail" description="View details">
        <Card className="p-6">
          {/* Content */}
        </Card>
      </PageLayout>
    </Fragment>
  );
}

export { FeatureDetailPage };
export default FeatureDetailPage;
```

### **Template Form Page:**

```typescript
// app/(admin)/[feature]/add/page.tsx OR edit/[id]/page.tsx
'use client';
import { Fragment, useState, useEffect } from 'react';
import { useRouter, useParams } from '@/components/shim/next-navigation';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { PageLayout } from '@/components/layout/PageLayout';

function FeatureFormPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string; // undefined for add
  const [formData, setFormData] = useState({ name: '' });
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (id) loadData(); }, [id]);
  const loadData = async () => {
    try {
      // Load data for edit
      setFormData({});
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (id) {
        // Update
      } else {
        // Create
      }
      router.push('/feature');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Fragment>
      <PageLayout icon={Save} title={id ? "Edit" : "Add"}>
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Name</label>
              <Input 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Đang lưu...' : 'Lưu'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push('/feature')}>
                Hủy
              </Button>
            </div>
          </form>
        </Card>
      </PageLayout>
    </Fragment>
  );
}

export { FeatureFormPage };
export default FeatureFormPage;
```

---

## 🔍 CODE REVIEW CHECKLIST

### **Reviewer phải kiểm tra:**

#### **File Structure:**
- [ ] Logic ở `/app/(admin)/`
- [ ] Bridge ở `/pages/`
- [ ] Đúng cấu trúc thư mục

#### **Imports:**
- [ ] Không có `react-router-dom` import
- [ ] Navigation từ shim layer
- [ ] Đúng path imports

#### **Code Quality:**
- [ ] Có `'use client';` directive
- [ ] Export cả named và default
- [ ] Wrap trong `<Fragment>`
- [ ] TypeScript types đúng

#### **Functionality:**
- [ ] Navigation hoạt động
- [ ] Forms submit OK
- [ ] Error handling có
- [ ] Loading states có

#### **Bridge Files:**
- [ ] Chỉ có import + export
- [ ] Không có logic
- [ ] Import path đúng

---

## 🚨 NGHIÊM CẤM

### **TUYỆT ĐỐI KHÔNG:**

1. ❌ Đặt logic business ở `/pages/`
2. ❌ Import trực tiếp từ `react-router-dom`
3. ❌ Tạo circular dependency
4. ❌ Quên `'use client';` directive
5. ❌ Quên export named component
6. ❌ Thêm logic vào bridge files
7. ❌ Dùng hooks cũ (useNavigate, etc.)

### **BẮT BUỘC PHẢI:**

1. ✅ Logic ở `/app/(admin)/`
2. ✅ Dùng shim layer
3. ✅ Export cả hai kiểu
4. ✅ Follow patterns
5. ✅ Test trước khi commit
6. ✅ Code review trước merge

---

## 📊 METRICS ĐỂ ĐÁNH GIÁ

### **Code Đạt Chuẩn Khi:**

- ✅ **100%** navigation qua shim
- ✅ **0%** logic ở `/pages/`
- ✅ **0** lỗi TypeScript
- ✅ **0** console errors
- ✅ **100%** patterns tuân thủ

### **Pull Request Được Approve Khi:**

- ✅ Pass all checklist items
- ✅ Code review approved
- ✅ Tests pass
- ✅ No console errors
- ✅ Follows standards

---

## 🎓 TRAINING CHO TEAM MỚI

### **Ngày 1 - Đọc Docs:**
1. Đọc document này
2. Đọc `SHIM_USAGE_GUIDE.md`
3. Hiểu tại sao cần shim

### **Ngày 2 - Study Examples:**
1. Xem 5-10 pages hiện có
2. Hiểu pattern
3. Note lại questions

### **Ngày 3 - Practice:**
1. Tạo 1 simple list page
2. Tạo 1 detail page
3. Senior review

### **Ngày 4 - Real Work:**
1. Làm task thật
2. Follow checklist
3. Submit PR

### **Ngày 5 - Review:**
1. Code review session
2. Fix feedback
3. Merge code

---

## 💡 TIPS & BEST PRACTICES

### **1. Copy Pattern, Không Invent:**
- Tìm page tương tự
- Copy structure
- Modify content
- Test thoroughly

### **2. Test Ngay, Đừng Chờ:**
- Test sau mỗi change
- Fix lỗi ngay
- Đừng tích lũy bugs

### **3. Ask Early:**
- Không chắc → Hỏi ngay
- Review sớm → Fix dễ
- Team support 24/7

### **4. Document Changes:**
- Comment code rõ
- Update docs nếu cần
- Share knowledge

---

## 🎯 KẾT LUẬN

### **3 NGUYÊN TẮC VÀNG:**

1. **Logic ở `/app/(admin)/`** - LUÔN LUÔN!
2. **Dùng Shim Layer** - KHÔNG BAO GIỜ bỏ qua!
3. **Bridge ở `/pages/`** - CHỈ import + export!

### **1 MỤC TIÊU:**

**🎯 Code sẵn sàng migration sang Next.js 14 BẤT CỨ LÚC NÀO!**

---

## 📞 HỖ TRỢ

### **Nếu cần help:**
1. Check document này
2. Xem examples
3. Hỏi team lead
4. Review session

### **Resources:**
- `SHIM_USAGE_GUIDE.md` - Shim layer guide
- `TEAM_HANDOFF_GUIDE.md` - Team guide
- `MIGRATION_PATTERNS.md` - Pattern library
- 110+ example pages trong `/app/(admin)/`

---

**Version:** 1.0  
**Last Updated:** 2026-01-19  
**Status:** MANDATORY FOR ALL NEW CODE  
**Compliance:** 100% REQUIRED  

---

## ✅ CONFIRMATION

**Tôi đã đọc và hiểu:**
- [ ] Logic phải ở `/app/(admin)/`
- [ ] Bridge phải ở `/pages/`
- [ ] Luôn dùng shim layer
- [ ] Follow checklist cho mọi page mới
- [ ] Code review bắt buộc
- [ ] Không được vi phạm standards

**Signature:** _______________  
**Date:** _______________  

---

**TUÂN THỦ 100% - CODE SẴN SÀNG MIGRATION!** 🚀

**STANDARDS = SUCCESS!** ✅💪🎯
