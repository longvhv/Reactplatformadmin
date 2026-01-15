# Bug Fix: Product Detail Page - "Không tìm thấy sản phẩm"

**Ngày:** 2026-01-15  
**Mức độ:** High  
**Trạng thái:** ✅ Fixed

## Vấn đề

Khi click vào 1 sản phẩm từ trang danh sách để xem chi tiết, hệ thống báo lỗi: **"Không tìm thấy sản phẩm"**.

## Nguyên nhân

Có nhiều nguyên nhân có thể gây ra lỗi này:

### 1. **Table name không đúng** ✅ ĐÃ FIX
- `/api/productsApi.ts` dùng sai tên table
- Đã sửa từ `'products'` sang `'saas_products'`

### 2. **Dữ liệu chưa có trong database** 
- Table `saas_products` tồn tại nhưng chưa có data
- Cần seed data hoặc tạo sản phẩm mới

### 3. **Field mapping không khớp**
- API response có field khác với schema
- Đã verify: Field `_id` được dùng đúng

## Các cải tiến đã thực hiện

### 1. **Enhanced Error Display**

Thêm state `error` riêng biệt trong ProductDetailPage:

```typescript
if (error) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Package className="w-16 h-16 text-red-400 mb-4" />
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Lỗi khi tải sản phẩm
      </h2>
      <p className="text-red-600 mb-4">
        {error}
      </p>
      <div className="flex gap-2">
        <Button onClick={() => navigate('/core/products')} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại danh sách
        </Button>
        <Button onClick={refresh}>
          Thử lại
        </Button>
      </div>
    </div>
  );
}
```

### 2. **Hiển thị Product ID trong error message**

```typescript
if (!product) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Package className="w-16 h-16 text-gray-400 mb-4" />
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Không tìm thấy sản phẩm
      </h2>
      <p className="text-gray-600 mb-4">
        Sản phẩm với ID "{id}" không tồn tại hoặc đã bị xóa.
      </p>
      <Button onClick={() => navigate('/core/products')}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Quay lại danh sách
      </Button>
    </div>
  );
}
```

### 3. **Debug Logging**

Thêm console.log để track flow:

**ProductsPage.tsx:**
```typescript
const handleViewDetails = (product: SaaSProduct) => {
  console.log('[ProductsPage] Navigate to product:', product._id, product);
  if (!product._id) {
    toast.error('ID sản phẩm không hợp lệ');
    return;
  }
  navigate(`/core/products/${product._id}`);
};
```

**SupabaseAdapter.ts:**
```typescript
async getById(id: string): Promise<T> {
  try {
    console.log(`[${this.tableName}] Fetching by id:`, id);
    
    let query = supabase
      .from(this.tableName)
      .select('*')
      .eq('_id', id);
    
    if (this.supportsSoftDelete) {
      query = query.is('deleted_at', null);
    }

    const { data, error } = await query.single();

    if (error) {
      console.error(`[${this.tableName}] Error in getById:`, error);
      this.handleError(error, 'fetch by id');
    }

    console.log(`[${this.tableName}] Fetched data:`, data);
    return this.mapFromDb(data) as T;
  } catch (error) {
    console.error(`[${this.tableName}] Exception in getById:`, error);
    this.handleError(error, 'fetch by id');
  }
}
```

### 4. **Validation trong ProductsPage**

Kiểm tra `product._id` trước khi navigate:

```typescript
if (!product._id) {
  toast.error('ID sản phẩm không hợp lệ');
  return;
}
```

## Cách debug

### Bước 1: Check Console Logs

Mở Browser DevTools Console và xem logs:

```
[ProductsPage] Navigate to product: <uuid> {...}
[saas_products] Fetching by id: <uuid>
[saas_products] Fetched data: {...}
```

### Bước 2: Verify Supabase Data

Vào Supabase Dashboard → Table Editor → `saas_products`:
- Kiểm tra có data không
- Kiểm tra field `_id` có giá trị UUID
- Kiểm tra field `deleted_at` là NULL

### Bước 3: Check Network Tab

DevTools → Network → Filter by `saas_products`:
- Xem request có đi đúng không
- Xem response data có về không
- Check HTTP status code

### Bước 4: Manual Test Query

Trong Supabase SQL Editor:

```sql
SELECT * FROM saas_products WHERE _id = '<uuid-from-url>';
```

## Các tình huống lỗi

### Case 1: "PGRST116: The result contains 0 rows"
**Nguyên nhân:** Không tìm thấy record với `_id` đó  
**Giải pháp:** Kiểm tra ID có đúng không, hoặc record đã bị xóa

### Case 2: "PGRST205: Could not find table"
**Nguyên nhân:** Tên table sai  
**Giải pháp:** Đã fix - dùng `saas_products`

### Case 3: "Multiple rows returned"
**Nguyên nhân:** Có nhiều rows cùng `_id` (vi phạm constraint)  
**Giải pháp:** Fix database integrity

### Case 4: Network Error
**Nguyên nhân:** Supabase connection failed  
**Giải pháp:** Check internet, Supabase credentials

## Checklist để verify fix

- [x] Fix table name từ `products` → `saas_products`
- [x] Thêm error handling với message rõ ràng
- [x] Hiển thị product ID trong error message
- [x] Thêm debug logging
- [x] Validation product._id trước khi navigate
- [x] Thêm button "Thử lại" cho error state
- [ ] Verify có data trong `saas_products` table
- [ ] Test với product ID thực tế
- [ ] Test với product ID không tồn tại
- [ ] Test với ID invalid (không phải UUID)

## Files đã sửa

1. `/api/productsApi.ts` - Fix table name
2. `/api/adapters/supabase.ts` - Thêm debug logs
3. `/pages/ProductDetailPage.tsx` - Improve error handling
4. `/pages/ProductsPage.tsx` - Thêm validation và logging

## Lưu ý

⚠️ **QUAN TRỌNG:** Nếu vẫn còn lỗi sau khi fix, hãy:
1. Check console logs để xem error message cụ thể
2. Verify có data trong Supabase `saas_products` table
3. Check network tab để xem API response

## Related Issues

- [FIXED-2026-01-15-products-table-name.md](./FIXED-2026-01-15-products-table-name.md)
