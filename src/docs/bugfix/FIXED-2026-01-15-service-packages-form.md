# Bug Fix: Service Packages Form - Thêm/Sửa gói dịch vụ không hoạt động

**Ngày:** 2026-01-15  
**Mức độ:** High  
**Trạng thái:** ✅ FIXED

## Vấn đề

Khi click button "Thêm gói mới" từ trang danh sách gói dịch vụ, trang bị lỗi không render được vì:
1. AddServicePackagePage chưa được implement (chỉ có import, không có return)
2. EditServicePackagePage chưa được implement
3. Chưa có ServicePackageForm component

## Nguyên nhân

### 1. **AddServicePackagePage chưa hoàn thiện**

```typescript
// ❌ TRƯỚC: Chỉ có import, không có logic
export default function AddServicePackagePage() {
  const { t } = useLanguage();
}
```

Không có return statement → React error: "Nothing was returned from render"

### 2. **EditServicePackagePage chưa hoàn thiện**

Tương tự AddServicePackagePage, chỉ có import mà không có logic implement.

### 3. **Thiếu ServicePackageForm component**

ProductForm đã có nhưng ServicePackageForm chưa được tạo. Form này cần handle:
- Package-specific fields (entitlements_config, max_users, max_storage)
- Different validation rules
- Different API endpoints

## Giải pháp

### 1. **Tạo ServicePackageForm component**

**File:** `/components/service-packages/ServicePackageForm.tsx`

**Các field chính:**
```typescript
interface FormData {
  code: string;                    // Mã gói
  name: string;                    // Tên gói
  description?: string;            // Mô tả
  saas_product_id: string;         // ID sản phẩm
  price_amount: number;            // Giá
  currency_code: string;           // Đơn vị tiền tệ
  billing_cycle: string;           // Chu kỳ thanh toán
  trial_days: number;              // Số ngày dùng thử
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  is_public: boolean;              // Hiển thị công khai
  display_order: number;           // Thứ tự hiển thị
  max_users: number | null;        // Số người dùng tối đa
  max_storage: number | null;      // Dung lượng tối đa
}
```

**Validation:**
- Code: required, không được trống
- Name: required, không được trống
- Price: >= 0
- Max users/storage: nullable (null = unlimited)

**Features:**
- Disable code edit khi edit package (code là unique identifier)
- Support dark mode
- Inline validation với error messages
- Loading states
- Cancel và Submit buttons

### 2. **Implement AddServicePackagePage**

**Luồng xử lý:**
```typescript
const handleSubmit = async (data: Partial<CreatePackageRequest>) => {
  try {
    await packagesApi.create({
      ...data,
      entitlements_config: {}, // Default empty config
    } as CreatePackageRequest);
    
    toast.success('Đã tạo gói dịch vụ mới');
    navigate('/core/service-packages');
  } catch (error: any) {
    toast.error('Không thể tạo gói dịch vụ: ' + error.message);
    throw error;
  }
};
```

**UI Structure:**
- Header với back button
- Form trong card với border
- Consistent styling với design system

### 3. **Implement EditServicePackagePage**

**Luồng xử lý:**
```typescript
// 1. Load package data
useEffect(() => {
  const loadPackage = async () => {
    const data = await packagesApi.getById(id);
    setPkg(data);
  };
  loadPackage();
}, [id]);

// 2. Handle update
const handleSubmit = async (data: Partial<CreatePackageRequest>) => {
  await packagesApi.update(id, {
    ...data,
    version: pkg?.version, // Optimistic locking
  });
  toast.success('Đã cập nhật gói dịch vụ');
  navigate('/core/service-packages');
};
```

**Error handling:**
- Loading state với spinner
- Error state redirect về danh sách
- Version conflict handling

### 4. **Fix missing imports trong AddProductPage và EditProductPage**

Các file này cũng thiếu import Button và ArrowLeft:

```typescript
import { Button } from '../components/ui/button';
import { ArrowLeft } from 'lucide-react';
```

## Files đã tạo/sửa

### Tạo mới:
1. `/components/service-packages/ServicePackageForm.tsx` - Complete form component với validation

### Cập nhật:
2. `/pages/AddServicePackagePage.tsx` - Full implementation
3. `/pages/EditServicePackagePage.tsx` - Full implementation
4. `/pages/AddProductPage.tsx` - Fix imports
5. `/pages/EditProductPage.tsx` - Fix imports

## API Integration

Sử dụng `packagesApi` từ `/api/packagesApi.ts`:

```typescript
// Create
await packagesApi.create({
  code: 'PKG-BASIC',
  name: 'Gói cơ bản',
  saas_product_id: 'uuid',
  price_amount: 100000,
  currency_code: 'VND',
  entitlements_config: {},
  // ... other fields
});

// Read
const pkg = await packagesApi.getById(id);

// Update
await packagesApi.update(id, {
  name: 'New name',
  version: currentVersion, // Optimistic locking
});

// Delete
await packagesApi.delete(id);
```

## Form Validation Rules

| Field | Rule | Error Message |
|-------|------|---------------|
| code | required, trim | "Mã gói dịch vụ là bắt buộc" |
| name | required, trim | "Tên gói dịch vụ là bắt buộc" |
| price_amount | >= 0 | "Giá phải lớn hơn hoặc bằng 0" |
| max_users | nullable, >= 0 if set | - |
| max_storage | nullable, >= 0 if set | - |

## Testing Checklist

- [x] Click "Thêm gói mới" → Vào AddServicePackagePage
- [x] Fill form và submit → Create package thành công
- [x] Click "Chỉnh sửa" từ detail page → Vào EditServicePackagePage
- [x] Form được pre-fill với data hiện tại
- [x] Update package thành công
- [x] Validation hoạt động (code required, name required, price >= 0)
- [x] Cancel button quay về danh sách
- [x] Loading states hiển thị đúng
- [x] Error states hiển thị toast
- [x] Dark mode hoạt động
- [x] AddProductPage và EditProductPage không bị lỗi import

## UI/UX Improvements

### Consistent Layout Pattern

Tất cả form pages (Add/Edit) đều follow pattern:
```tsx
<div className="p-6 max-w-4xl mx-auto">
  {/* Header */}
  <div className="flex items-center gap-4 mb-6">
    <Button variant="ghost" onClick={goBack}>
      <ArrowLeft className="w-4 h-4 mr-2" />
      Quay lại
    </Button>
    <h1 className="text-3xl font-bold">...</h1>
  </div>

  {/* Form Card */}
  <div className="bg-white dark:bg-gray-800 rounded-lg border p-8">
    <Form onSubmit={...} onCancel={...} />
  </div>
</div>
```

### Form Sections

ServicePackageForm chia thành 3 sections rõ ràng:
1. **Thông tin cơ bản** - Code, name, description
2. **Thông tin giá** - Price, currency, billing cycle, trial days, limits
3. **Cài đặt hiển thị** - Status, display order, is_public

### Inline Validation

```tsx
<Input
  className={errors.code ? 'border-red-500' : ''}
/>
{errors.code && (
  <p className="text-sm text-red-500 mt-1">{errors.code}</p>
)}
```

Error được clear khi user bắt đầu edit field.

## Best Practices Applied

### 1. **Form State Management**
- Single state object cho form data
- Separate errors state
- Clear errors on field change

### 2. **API Error Handling**
```typescript
try {
  await api.create(data);
  toast.success('Success message');
  navigate('/list');
} catch (error: any) {
  console.error('Context:', error);
  toast.error('User-friendly message: ' + error.message);
  throw error; // Re-throw cho form handler
}
```

### 3. **Loading States**
- Form submission: disable buttons, show "Đang lưu..."
- Data loading: spinner overlay
- Error: redirect hoặc retry

### 4. **Type Safety**
```typescript
import type { Package, CreatePackageRequest } from '../api/packagesApi';
```

Sử dụng proper types thay vì `any`.

### 5. **Optimistic Locking**
```typescript
await packagesApi.update(id, {
  ...data,
  version: pkg?.version, // Prevent concurrent updates
});
```

## Related Patterns

Các module khác có thể áp dụng pattern tương tự:

### ✅ Products (đã có)
- `/pages/AddProductPage.tsx`
- `/pages/EditProductPage.tsx`
- `/components/products/ProductForm.tsx`

### ✅ Service Packages (vừa fix)
- `/pages/AddServicePackagePage.tsx`
- `/pages/EditServicePackagePage.tsx`
- `/components/service-packages/ServicePackageForm.tsx`

### 🔜 Subscriptions (có thể cần)
- AddSubscriptionPage đã có
- Có thể cần SubscriptionForm

### 🔜 Tenants (có thể cần)
- AddTenantPage đã có
- Có thể cần TenantForm

## Lưu ý quan trọng

### ⚠️ Demo Data

Hiện tại sử dụng hardcoded demo IDs:
```typescript
saas_product_id: '00000000-0000-0000-0000-000000000001'
tenant_id: '00000000-0000-0000-0000-000000000001'
```

Khi integrate với Golang backend, cần:
1. Load danh sách products để user chọn
2. Lấy tenant_id từ auth context
3. Support product selector dropdown

### 💡 Future Enhancements

1. **Product Selector**: Thay vì hardcode `saas_product_id`, cho user chọn product
2. **Entitlements Config**: UI builder cho `entitlements_config` (hiện tại default empty)
3. **Features/Metadata**: JSON editor hoặc key-value pairs builder
4. **Preview**: Preview card để xem package sẽ hiển thị như thế nào
5. **Duplicate**: Clone package feature (giống products)

## Tham khảo

- ProductForm pattern: `/components/products/ProductForm.tsx`
- Packages API: `/api/packagesApi.ts`
- Service Packages adapter: `/api/adapters/servicePackagesAdapter.ts`

## Migration Path to Golang Backend

Khi chuyển sang Golang API:

```typescript
// BEFORE: Direct Supabase
const packagesApi = new ServicePackagesAdapter();

// AFTER: HTTP Client
const packagesApi = new HttpPackagesClient({
  baseURL: process.env.GOLANG_API_URL,
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

Form code không cần thay đổi vì sử dụng adapter pattern!
