# Bug Fix: Products Routing - Thêm/Sửa sản phẩm không hoạt động

**Ngày:** 2026-01-15  
**Mức độ:** High  
**Trạng thái:** ✅ FIXED

## Vấn đề

Khi click button "Thêm sản phẩm" từ trang danh sách sản phẩm, thay vì vào trang form thêm sản phẩm, hệ thống lại redirect về trang danh sách.

## Nguyên nhân

### 1. **Route Order sai trong App.tsx**

Routes được định nghĩa như sau:
```tsx
<Route path="/core/products/:id" element={<ProductDetailPage />} />
```

Khi navigate đến `/core/products/add`, React Router match với pattern `/core/products/:id` và set `id = "add"`, dẫn đến:
- AddProductPage không được render
- ProductDetailPage được render với id="add"

### 2. **Logic redirect trong ProductDetailPage**

```typescript
useEffect(() => {
  if (id === 'new' || id === 'add' || id === 'create') {
    toast.info('Tính năng đang được phát triển');
    navigate('/core/products');
  }
}, [id, navigate]);
```

Code này tự động redirect về trang danh sách khi phát hiện id là `'add'`.

### 3. **Thiếu routes cụ thể trong App.tsx**

Routes `/core/products/add` và `/core/products/edit/:id` không được định nghĩa trong App.tsx, mặc dù:
- AddProductPage và EditProductPage đã tồn tại
- Module registry đã có routes này
- Nhưng App.tsx không có explicit routes

## Giải pháp

### 1. **Import AddProductPage và EditProductPage**

```typescript
import { ProductDetailPage } from "./pages/ProductDetailPage";
import AddProductPage from "./pages/AddProductPage";
import EditProductPage from "./pages/EditProductPage";
```

### 2. **Sắp xếp routes đúng thứ tự**

⚠️ **QUAN TRỌNG:** Routes cụ thể phải đặt TRƯỚC routes có parameter.

```tsx
{/* 
  ⚠️ CRITICAL FIX: Products routes MUST be ordered correctly!
  /add and /edit/:id MUST come BEFORE /:id to avoid matching "add"/"edit" as IDs
*/}
<Route path="/core/products/add" element={
  <AppLayout>
    <AddProductPage />
  </AppLayout>
} />
<Route path="/core/products/edit/:id" element={
  <AppLayout>
    <EditProductPage />
  </AppLayout>
} />
<Route path="/core/products/:id" element={<ProductDetailPage />} />
```

**Giải thích thứ tự:**
1. `/core/products/add` - Match exact "add" → AddProductPage
2. `/core/products/edit/:id` - Match "edit/xxx" → EditProductPage
3. `/core/products/:id` - Match bất kỳ ID nào khác → ProductDetailPage

Nếu đặt route `:id` trước, nó sẽ match "add" và "edit" như là ID.

### 3. **Xóa logic redirect không cần thiết**

ProductDetailPage - **TRƯỚC:**
```typescript
// Skip hook for special routes
const { product, loading, error, refresh } = useProduct(
  id !== 'new' && id !== 'add' && id !== 'create' ? id : undefined
);

// Handle special routes
useEffect(() => {
  if (id === 'new' || id === 'add' || id === 'create') {
    toast.info('Tính năng đang được phát triển');
    navigate('/core/products');
  }
}, [id, navigate]);
```

ProductDetailPage - **SAU:**
```typescript
// Fetch product data
const { product, loading, error, refresh } = useProduct(id);
```

Logic redirect không còn cần thiết vì routing đã đúng.

### 4. **Fix edit link**

```typescript
<DropdownMenuItem onClick={() => navigate(`/core/products/edit/${id}`)}>
  <Edit className="w-4 h-4 mr-2" />
  Chỉnh sửa
</DropdownMenuItem>
```

## Pattern áp dụng cho các module khác

Tương tự đã được fix cho:

### ✅ Service Packages
```tsx
<Route path="/core/service-packages/add" element={...} />
<Route path="/core/service-packages/edit/:id" element={...} />
<Route path="/core/service-packages/:id" element={...} />
```

### ✅ Subscriptions
```tsx
<Route path="/core/subscriptions/add" element={...} />
<Route path="/core/subscriptions/:id" element={...} />
```

### ✅ Tenants
```tsx
<Route path="/core/tenants/add" element={...} />
<Route path="/core/tenants/new" element={...} />
<Route path="/core/tenants/:id" element={...} />
```

### ✅ Applications
```tsx
<Route path="/core/applications/new" element={...} />
<Route path="/core/applications/:id" element={...} />
```

## Các routes products hiện tại

Sau khi fix, products có 3 routes:

| Route | Component | Layout | Mục đích |
|-------|-----------|--------|----------|
| `/core/products/add` | AddProductPage | AppLayout | Thêm sản phẩm mới |
| `/core/products/edit/:id` | EditProductPage | AppLayout | Sửa sản phẩm |
| `/core/products/:id` | ProductDetailPage | No layout | Xem chi tiết |

## Testing Checklist

- [x] Click "Thêm sản phẩm" → Vào AddProductPage
- [x] Click "Chỉnh sửa" từ detail page → Vào EditProductPage
- [x] Click vào sản phẩm từ danh sách → Vào ProductDetailPage
- [x] URL `/core/products/add` → AddProductPage
- [x] URL `/core/products/edit/<uuid>` → EditProductPage
- [x] URL `/core/products/<uuid>` → ProductDetailPage
- [x] Không còn redirect về trang danh sách

## Files đã sửa

1. `/App.tsx`
   - Import AddProductPage và EditProductPage
   - Thêm routes với thứ tự đúng
   - Thêm comment warning về route order

2. `/pages/ProductDetailPage.tsx`
   - Xóa logic check `id === 'add'`
   - Xóa useEffect redirect
   - Simplify useProduct hook call
   - Fix edit navigation link

## Lưu ý quan trọng

### ⚠️ Route Order là CRITICAL

React Router v7 match routes theo thứ tự từ trên xuống dưới. Routes cụ thể phải đặt trước routes generic:

**✅ ĐÚNG:**
```tsx
<Route path="/products/add" />        {/* Match exact */}
<Route path="/products/edit/:id" />   {/* Match pattern */}
<Route path="/products/:id" />        {/* Match any */}
```

**❌ SAI:**
```tsx
<Route path="/products/:id" />        {/* Match tất cả, kể cả "add" */}
<Route path="/products/add" />        {/* Không bao giờ match */}
<Route path="/products/edit/:id" />   {/* Không bao giờ match */}
```

### 💡 Best Practice

1. **Luôn đặt routes cụ thể trước:**
   - `/add` trước `/:id`
   - `/edit/:id` trước `/:id`
   - `/new` trước `/:id`

2. **Thêm comment warning:**
   ```tsx
   {/* ⚠️ CRITICAL FIX: Route order matters! */}
   ```

3. **Consistent pattern:**
   - Add: `/module/add`
   - Edit: `/module/edit/:id`
   - Detail: `/module/:id`

4. **Layout consistency:**
   - Form pages (add/edit): Wrap với AppLayout
   - Detail pages: Không wrap (full-screen)

## Related Issues

- [FIXED-2026-01-15-service-packages-routing.md](./FIXED-2026-01-15-service-packages-routing.md)
- React Router v7 documentation: https://reactrouter.com/en/main/route/route

## Tham khảo

Xem pattern tương tự đã được áp dụng cho các module khác trong `/App.tsx`.
