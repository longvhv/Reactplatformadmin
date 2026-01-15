# Bug Fix: Products Table Name Error

**Ngày:** 2026-01-15  
**Mức độ:** Critical  
**Trạng thái:** ✅ Fixed

## Vấn đề

Khi query dữ liệu products, xuất hiện lỗi:

```
[products] Error in fetch by id: {
  "code": "PGRST205",
  "details": null,
  "hint": "Perhaps you meant the table 'public.saas_products'",
  "message": "Could not find the table 'public.products' in the schema cache"
}
```

## Nguyên nhân

API client đang sử dụng tên table sai:
- **Tên sai**: `products`
- **Tên đúng**: `saas_products`

Database schema sử dụng tên table `saas_products` nhưng adapter trong code vẫn dùng tên cũ `products`.

## Các file bị ảnh hưởng

1. `/api/productsApi.ts` - Adapter dùng tên table sai
2. `/api/ordersApi.ts` - Join query dùng tên table sai

## Giải pháp

### 1. Fix productsApi.ts

**Trước:**
```typescript
const adapter = createAdapter<Product, CreateProductRequest, UpdateProductRequest>(
  'products',
  '/products'
);
```

**Sau:**
```typescript
const adapter = createAdapter<Product, CreateProductRequest, UpdateProductRequest>(
  'saas_products',
  '/products'
);
```

### 2. Fix ordersApi.ts

**Trước:**
```typescript
const { data: product } = await supabase
  .from('products')
  .select('name')
  .eq('_id', pkg.product_id)
  .single();
```

**Sau:**
```typescript
const { data: product } = await supabase
  .from('saas_products')
  .select('name')
  .eq('_id', pkg.product_id)
  .single();
```

## Kiểm tra

Sau khi fix, verify lại:

```bash
# Trong browser console, kiểm tra:
# 1. Trang Products list
# 2. Trang Product detail
# 3. Trang Orders (nếu có join với products)
```

## Bài học

1. **Consistency**: Đảm bảo tên table trong code phải khớp 100% với database schema
2. **Migration**: Khi rename table trong database, phải update toàn bộ code references
3. **Search**: Dùng file_search để tìm tất cả references trước khi deploy

## Các table names chuẩn

| Feature | Table Name |
|---------|-----------|
| Products | `saas_products` |
| Packages | `service_packages` |
| Orders | `subscription_orders` |
| Subscriptions | `tenant_subscriptions` |
| Roles | `roles` |
| Users | `users` |
| Tenants | `tenants` |

## Related Issues

- None

## Người fix

AI Assistant - 2026-01-15
