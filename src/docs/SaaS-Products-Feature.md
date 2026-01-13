# Tính năng Quản lý Sản phẩm SaaS

## Tổng quan

Hệ thống quản lý sản phẩm SaaS hoàn chỉnh với CRUD operations, search, filter, và view modes.

## Database Schema

### Bảng: `saas_products`

**Migration:** `/golang-backend/migrations/014_create_saas_products_table.sql`

**Cấu trúc chính:**
- `_id` (UUID) - Primary key
- `tenant_id` (UUID) - Tenant isolation
- `code` (VARCHAR) - Unique product code (snake-case)
- `name`, `description` - Product info
- `product_type_code` (VARCHAR) - Liên kết với `saas_product_types`
- `base_price`, `currency`, `billing_cycle` - Pricing
- `trial_days` (INTEGER) - Free trial period
- `features` (JSONB) - Dynamic features
- `limits` (JSONB) - Usage limits
- `status` (VARCHAR) - 'active' | 'inactive' | 'archived'
- `is_featured` (BOOLEAN)
- `display_order` (INTEGER)
- Audit trail: created_at, updated_at, created_by, updated_by
- Soft delete: deleted_at, deleted_by
- Optimistic locking: version

**Demo Data:** 20 sản phẩm demo (HRM Suite, CRM Suite, E-commerce, etc.)

## API Layer

**File:** `/api/saasProductApi.ts`

**Functions:**
- `getAll(filters)` - Lấy tất cả với filters
- `getActive(tenant_id)` - Chỉ active products
- `getFeatured(tenant_id)` - Products nổi bật
- `getByType(product_type_code)` - Theo loại
- `getById(id)` - Chi tiết 1 product
- `getByCode(code, tenant_id)` - Theo code
- `create(product)` - Tạo mới
- `update(id, updates, version)` - Cập nhật với optimistic locking
- `softDelete(id, deleted_by)` - Xóa mềm
- `restore(id)` - Khôi phục
- `hardDelete(id)` - Xóa vĩnh viễn
- `changeStatus(id, status, version)` - Đổi trạng thái
- `toggleFeatured(id, version)` - Toggle featured
- `updateDisplayOrder(id, order, version)` - Sắp xếp
- `codeExists(code, tenant_id, excludeId)` - Kiểm tra duplicate
- `getStatistics(tenant_id)` - Thống kê
- `search(searchTerm, tenant_id)` - Tìm kiếm
- `duplicate(id, newCode, newName)` - Nhân bản

## Components

### 1. ProductCard
**File:** `/components/products/ProductCard.tsx`
- Hiển thị product ở dạng card
- Actions: View, Edit, Delete, Duplicate, Toggle Featured
- Show: price, billing cycle, trial days, status, featured badge

### 2. ProductTable
**File:** `/components/products/ProductTable.tsx`
- Hiển thị products dạng bảng
- Columns: Product info, Type, Price, Billing cycle, Status, Actions
- Responsive, có loading state

### 3. ProductForm
**File:** `/components/products/ProductForm.tsx`
- Form tái sử dụng cho Create/Edit
- Validation: code format (lowercase + dash), required fields
- Dynamic features/limits (key-value pairs with JSON support)
- < 500 dòng code

## Pages

### 1. ProductsPage
**Path:** `/core/products`
**File:** `/pages/ProductsPage.tsx`

**Features:**
- 2 view modes: Table & Grid
- Search (name, code, description)
- Filters: Status, Featured
- Actions: Add, Edit, Delete, View, Duplicate, Toggle Featured

### 2. ProductDetailPage
**Path:** `/core/products/:id`
**File:** `/pages/ProductDetailPage.tsx`

**Hiển thị:**
- Full product info
- Pricing details
- Features & Limits (JSON formatted)
- Metadata (created_at, updated_at, version)

### 3. AddProductPage
**Path:** `/core/products/add`
**File:** `/pages/AddProductPage.tsx`

- Form tạo sản phẩm mới
- Auto-assign demo tenant_id

### 4. EditProductPage
**Path:** `/core/products/edit/:id`
**File:** `/pages/EditProductPage.tsx`

- Form sửa sản phẩm
- Load existing data
- Optimistic locking protection

## Module Registration

**File:** `/modules/products/index.tsx`
- Lazy-loaded pages
- Sidebar menu: "Sản phẩm" với icon Package
- Order: 40

**File:** `/core/moduleRegistration.tsx`
- Đã đăng ký ProductsModule

## Routing

**File:** `/App.tsx`
```
/core/products          → ProductsPage
/core/products/:id      → ProductDetailPage
/core/products/add      → AddProductPage
/core/products/edit/:id → EditProductPage
```

## Kiến trúc Code

### Nguyên tắc
✅ Mỗi file < 500 dòng
✅ Tuân thủ DRY principle (reusable components)
✅ API layer riêng biệt
✅ Type safety (TypeScript)
✅ Optimistic locking (version field)
✅ Soft delete (audit trail)

### Performance
- Lazy loading cho pages
- Efficient filters (WHERE clauses)
- GIN indexes cho JSONB fields
- Conditional indexes (WHERE deleted_at IS NULL)

### Security
- Tenant isolation (tenant_id)
- Input validation (code format check)
- XSS prevention (React auto-escape)

## Cách sử dụng

### 1. Chạy migration
```bash
# Apply migration 014
psql -d your_db -f golang-backend/migrations/014_create_saas_products_table.sql
```

### 2. Truy cập trang
- Vào sidebar → Click "Sản phẩm"
- URL: `/core/products`

### 3. Thêm sản phẩm mới
- Click "Thêm sản phẩm"
- Nhập code (chỉ lowercase, số, dash)
- Điền thông tin, features, limits
- Submit

### 4. Quản lý
- Search/Filter
- Toggle view (Table/Grid)
- Edit/Delete/Duplicate
- Toggle featured status

## Best Practices

### Code Format
- Product code: `hrm-suite-pro` (lowercase + dash)
- Price: Positive number
- Trial days: >= 0

### Features & Limits
```json
// Features example
{
  "modules": ["attendance", "payroll"],
  "integrations": ["slack", "google"],
  "support": "24/7"
}

// Limits example
{
  "max_employees": 100,
  "max_departments": 20,
  "storage_gb": 50
}
```

## Files Created

**Migration:**
- `/golang-backend/migrations/014_create_saas_products_table.sql`

**API:**
- `/api/saasProductApi.ts`

**Components:**
- `/components/products/ProductCard.tsx`
- `/components/products/ProductTable.tsx`
- `/components/products/ProductForm.tsx`

**Pages:**
- `/pages/ProductsPage.tsx`
- `/pages/ProductDetailPage.tsx`
- `/pages/AddProductPage.tsx`
- `/pages/EditProductPage.tsx`

**Module:**
- `/modules/products/index.tsx`

**Updated:**
- `/App.tsx`
- `/core/moduleRegistration.tsx`

---

**Version:** 1.0.0
**Date:** 2026-01-12
**Status:** ✅ Production Ready
