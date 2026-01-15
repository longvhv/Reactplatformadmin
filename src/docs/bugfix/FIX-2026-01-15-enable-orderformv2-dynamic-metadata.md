# FIX: Enable OrderFormV2 with Dynamic Metadata Line Items

**Date:** 2026-01-15  
**Status:** ✅ COMPLETED  
**Module:** Orders - Line Items Editor  
**Impact:** HIGH - Feature enablement

---

## 📋 Vấn đề

User báo không thấy cập nhật phần **Sản phẩm / Dịch vụ (items_snapshot)** trong form edit đơn hàng với dynamic metadata fields như:
- Domain (cho SSL/DOMAIN)
- Số giờ (cho CONSULTING/TRAINING/SERVICE)
- License key (cho LICENSE)
- Và các metadata khác theo `product_type`

Hình ảnh user gửi cho thấy form cũ chỉ có 4 fields cơ bản:
- Tên sản phẩm
- Product ID
- Đơn giá
- Số lượng

---

## 🔍 Root Cause Analysis

### Phát hiện

1. **OrderFormV2** đã được implement hoàn chỉnh với **LineItemsEditor**
2. **LineItemsEditor** đã có đầy đủ dynamic metadata fields theo item_type và product_type
3. **NHƯNG** các pages vẫn đang sử dụng **OrderForm** (old) thay vì **OrderFormV2** (new)

### Files Check

#### ✅ Component đã có sẵn:
- `/components/orders/OrderFormV2.tsx` - Form mới với LineItemsEditor
- `/components/orders/LineItemsEditor.tsx` - Editor với dynamic metadata

#### ❌ Pages đang dùng sai:
- `/pages/AddOrderPage.tsx` - Đang import `OrderForm` (old)
- `/pages/EditOrderPage.tsx` - Đang import `OrderForm` (old)

### Code Evidence

#### Before (Pages sử dụng OrderForm cũ):

```typescript
// /pages/EditOrderPage.tsx
import { OrderForm } from '../components/orders/OrderForm';

// /pages/AddOrderPage.tsx
import { OrderForm } from '../components/orders/OrderForm';
```

#### OrderForm (old) structure:
```typescript
// Chỉ có ItemSnapshot cơ bản
const [items, setItems] = useState<ItemSnapshot[]>(
  order?.items_snapshot || [
    { product_id: '', name: '', price: 0, qty: 1 }
  ]
);
```

**Không có:**
- ❌ item_type (PLAN/PRODUCT)
- ❌ product_type (SSL/DOMAIN/LICENSE/etc.)
- ❌ Dynamic metadata fields
- ❌ Validation logic cho từng loại sản phẩm

---

## ✅ Giải pháp thực hiện

### 1. Update EditOrderPage

**File:** `/pages/EditOrderPage.tsx`

```typescript
/**
 * Edit Subscription Order Page
 * ✅ UPDATED 2026-01-15: Switched to OrderFormV2 with LineItemsEditor support
 */

import { OrderFormV2 } from '../components/orders/OrderFormV2'; // ✅ CHANGED

export default function EditOrderPage() {
  // ... existing code ...
  
  return (
    <FormPageLayout
      mode="edit"
      title="Chỉnh sửa đơn hàng"
      description={`Cập nhật thông tin đơn hàng #${order.order_number || id}`}
      icon={ShoppingCart}
      backPath="/core/subscription-orders"
      backLabel="Quay lại danh sách"
    >
      <OrderFormV2  {/* ✅ CHANGED from OrderForm */}
        order={order}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/core/subscription-orders')}
        loading={loading}
      />
    </FormPageLayout>
  );
}
```

### 2. Update AddOrderPage

**File:** `/pages/AddOrderPage.tsx`

```typescript
/**
 * Add Subscription Order Page
 * ✅ UPDATED 2026-01-15: Switched to OrderFormV2 with LineItemsEditor support
 */

import { OrderFormV2 } from '../components/orders/OrderFormV2'; // ✅ CHANGED

export default function AddOrderPage() {
  // ... existing code ...
  
  return (
    <FormPageLayout
      mode="add"
      title="Tạo đơn hàng mới"
      description="Tạo đơn hàng subscription cho tenant"
      icon={ShoppingCart}
      backPath="/core/subscription-orders"
      backLabel="Quay lại danh sách"
    >
      <OrderFormV2  {/* ✅ CHANGED from OrderForm */}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/core/subscription-orders')}
        loading={loading}  {/* ✅ Fixed prop name from isLoading */}
      />
    </FormPageLayout>
  );
}
```

---

## 🎯 Features Enabled

### OrderFormV2 Structure

```
┌─────────────────────────────────────────┐
│ I. THÔNG TIN CƠ BẢN                    │
│  • Mã đơn hàng                          │
│  • Số PO                                │
│  • Trạng thái                           │
│  • Mã tiền tệ                           │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ II. DANH SÁCH LINE ITEMS ✅ NEW        │
│                                         │
│  [Gói cước] (item_type: PLAN)          │
│   • Tên gói *                           │
│   • ID                                  │
│   • Giá *                               │
│   • Số lượng *                          │
│   • Chu kỳ * (MONTHLY/QUARTERLY/etc.)  │
│   • Ghi chú                             │
│                                         │
│  [Sản phẩm] (item_type: PRODUCT)       │
│   • Tên sản phẩm *                      │
│   • ID                                  │
│   • Loại sản phẩm * (dropdown)         │
│   • Giá *                               │
│   • Số lượng *                          │
│                                         │
│   ⚡ DYNAMIC METADATA (theo loại):     │
│                                         │
│   🔐 SSL:                               │
│      • Domain áp dụng *                 │
│      • Thời hạn (năm)                   │
│                                         │
│   🌐 DOMAIN:                            │
│      • Tên miền *                       │
│      • Nhà đăng ký                      │
│                                         │
│   🔑 LICENSE:                           │
│      • Mã license                       │
│      • Số lượng user                    │
│                                         │
│   🛠️ SERVICE:                           │
│      • Loại dịch vụ                     │
│      • Số giờ                           │
│                                         │
│   💼 CONSULTING:                        │
│      • Chuyên gia                       │
│      • Số giờ *                         │
│                                         │
│   📚 TRAINING:                          │
│      • Khóa học *                       │
│      • Số giờ *                         │
│      • Giảng viên                       │
│                                         │
│   📦 OTHER:                             │
│      • Mô tả                            │
│                                         │
│   📝 All types:                         │
│      • Ghi chú                          │
│                                         │
│  [+ Thêm item] button                  │
│   • Thêm gói cước                       │
│   • Thêm sản phẩm                       │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ III. ĐIỀU CHỈNH TÀI CHÍNH              │
│  • Thuế                                 │
│  • Giảm giá                             │
│  • Credit áp dụng                       │
│  • Summary (Subtotal, Tax, Discount,   │
│    Credit, Total)                       │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ IV. THÔNG TIN THANH TOÁN               │
│  • Phương thức                          │
│  • Mã tham chiếu                        │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ V. THÔNG TIN BILLING                   │
│  • Tên khách hàng                       │
│  • Email                                │
│  • Số điện thoại                        │
│  • Tên công ty                          │
│  • Mã số thuế                           │
│  • Địa chỉ                              │
└─────────────────────────────────────────┘

[Lưu]  [Hủy]
```

### LineItemsEditor Features

#### 1. **Auto-detect Order Type**
```typescript
const orderType = determineOrderType(items);
// SUBSCRIPTION: Có PLAN
// ONE_TIME: Chỉ có PRODUCT
// MIXED: Có cả PLAN và PRODUCT
```

Hiển thị badge:
- 🔵 **Gói cước** (SUBSCRIPTION)
- 🟣 **Mua lẻ** (ONE_TIME)
- 🟠 **Kết hợp** (MIXED)

#### 2. **Dynamic Metadata Fields**

Metadata fields thay đổi theo `product_type`:

| Product Type | Required Fields | Optional Fields |
|--------------|----------------|-----------------|
| SSL | domain * | validity (năm) |
| DOMAIN | domain * | registrar |
| LICENSE | - | license_key, seats |
| SERVICE | - | service_type, hours |
| CONSULTING | hours * | consultant |
| TRAINING | course *, hours * | instructor |
| OTHER | - | description |

**All types:** notes (optional)

#### 3. **Validation Logic**

```typescript
// Basic validation
- Name không được trống
- Price > 0
- Quantity > 0

// PLAN validation
- cycle là bắt buộc (MONTHLY, QUARTERLY, YEARLY, etc.)

// PRODUCT validation by type
- SSL: domain bắt buộc
- DOMAIN: domain bắt buộc
- CONSULTING: hours bắt buộc và > 0
- TRAINING: course và hours bắt buộc
```

Validation errors hiển thị real-time và block submit nếu có lỗi.

#### 4. **UI/UX Features**

- ✅ Card-based layout cho mỗi line item
- ✅ Icon khác nhau cho PLAN (📦) và PRODUCT (🛍️)
- ✅ Color-coded badges
- ✅ Inline validation với error messages
- ✅ Dropdown menu để thêm PLAN hoặc PRODUCT
- ✅ Delete button cho mỗi item (disabled khi chỉ còn 1 item)
- ✅ Auto-calculate subtotal
- ✅ Responsive grid layout

---

## 📊 Data Structure

### LineItem Interface

```typescript
interface LineItem {
  item_type: 'PLAN' | 'PRODUCT';
  product_type?: 'SSL' | 'DOMAIN' | 'LICENSE' | 'SERVICE' | 'CONSULTING' | 'TRAINING' | 'OTHER';
  id: string;
  name: string;
  price: number;
  quantity: number;
  metadata: {
    // PLAN metadata
    cycle?: 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUALLY' | 'ANNUALLY' | 'BIENNIALLY';
    
    // PRODUCT metadata (dynamic based on product_type)
    domain?: string;
    validity?: string;
    registrar?: string;
    license_key?: string;
    seats?: string;
    service_type?: string;
    hours?: string;
    consultant?: string;
    course?: string;
    instructor?: string;
    description?: string;
    notes?: string;
  };
}
```

### Example Items Snapshot

```json
{
  "items_snapshot": [
    {
      "item_type": "PLAN",
      "id": "plan_pro",
      "name": "Gói Pro (Tháng)",
      "price": 990000,
      "quantity": 1,
      "metadata": {
        "cycle": "MONTHLY",
        "notes": "Bao gồm 100GB storage"
      }
    },
    {
      "item_type": "PRODUCT",
      "product_type": "SSL",
      "id": "ssl_wildcard",
      "name": "Chứng chỉ SSL Wildcard",
      "price": 2000000,
      "quantity": 1,
      "metadata": {
        "domain": "*.example.com",
        "validity": "1",
        "notes": "Comodo SSL"
      }
    },
    {
      "item_type": "PRODUCT",
      "product_type": "CONSULTING",
      "id": "consulting_senior",
      "name": "Tư vấn Senior",
      "price": 1500000,
      "quantity": 10,
      "metadata": {
        "consultant": "Nguyễn Văn A",
        "hours": "10",
        "notes": "Tư vấn kiến trúc hệ thống"
      }
    }
  ]
}
```

---

## 🔄 Migration Path

### Old OrderForm → New OrderFormV2

| Old (OrderForm) | New (OrderFormV2) |
|-----------------|-------------------|
| `ItemSnapshot[]` | `LineItem[]` |
| `product_id`, `name`, `price`, `qty` | `item_type`, `product_type`, `id`, `name`, `price`, `quantity`, `metadata` |
| No validation | Comprehensive validation |
| Static fields | Dynamic metadata fields |
| Simple list | Card-based editor with icons |

### Backward Compatibility

**Old ItemSnapshot:**
```typescript
interface ItemSnapshot {
  product_id: string;
  name: string;
  price: number;
  qty: number;
}
```

Can be converted to LineItem:
```typescript
{
  item_type: 'PRODUCT',
  product_type: 'OTHER',
  id: itemSnapshot.product_id,
  name: itemSnapshot.name,
  price: itemSnapshot.price,
  quantity: itemSnapshot.qty,
  metadata: {}
}
```

---

## ✅ Testing Checklist

### Create Order
- [x] Thêm line item PLAN với cycle MONTHLY
- [x] Thêm line item PRODUCT SSL với domain
- [x] Thêm line item PRODUCT CONSULTING với hours
- [x] Thêm line item PRODUCT TRAINING với course + hours
- [x] Validation chặn khi thiếu required fields
- [x] Submit tạo order với items_snapshot JSONB đầy đủ

### Edit Order
- [x] Load existing order với items_snapshot
- [x] Display line items đúng với metadata
- [x] Chỉnh sửa metadata fields
- [x] Thêm/xóa line items
- [x] Submit update với items_snapshot mới

### Validation
- [x] Name trống → error
- [x] Price <= 0 → error
- [x] Quantity <= 0 → error
- [x] PLAN thiếu cycle → error
- [x] SSL thiếu domain → error
- [x] CONSULTING thiếu hours → error
- [x] TRAINING thiếu course hoặc hours → error

### UI/UX
- [x] Icons hiển thị đúng (PLAN vs PRODUCT)
- [x] Badge order type update real-time
- [x] Dropdown menu "Thêm item" hoạt động
- [x] Delete button disabled khi chỉ còn 1 item
- [x] Subtotal calculate tự động
- [x] Validation errors hiển thị inline

---

## 📝 Files Changed

### Updated:
1. **`/pages/EditOrderPage.tsx`**
   - Changed import from `OrderForm` to `OrderFormV2`
   - Updated comment header

2. **`/pages/AddOrderPage.tsx`**
   - Changed import from `OrderForm` to `OrderFormV2`
   - Fixed prop name: `isLoading` → `loading`
   - Updated comment header

### Existing (no changes):
3. **`/components/orders/OrderFormV2.tsx`** ✅ Already implemented
4. **`/components/orders/LineItemsEditor.tsx`** ✅ Already implemented
5. **`/api/ordersApi.ts`** ✅ Types already defined

### Deprecated (kept for reference):
6. **`/components/orders/OrderForm.tsx`** - Old form, không còn sử dụng

---

## 🚀 Next Steps (Optional)

### 1. Delete Old OrderForm (sau khi test thoroughly)
```bash
rm /components/orders/OrderForm.tsx
```

### 2. Add Product/Service Lookup
Integrate với Products API để auto-fill metadata:
```typescript
const handleSelectProduct = (productId: string) => {
  const product = await productsApi.getById(productId);
  setItem({
    ...item,
    name: product.name,
    price: product.price,
    product_type: product.type,
    metadata: product.default_metadata
  });
};
```

### 3. Add Templates
Pre-defined line item templates:
```typescript
const TEMPLATES = {
  'ssl-wildcard': {
    item_type: 'PRODUCT',
    product_type: 'SSL',
    name: 'SSL Wildcard Certificate',
    price: 2000000,
    metadata: { validity: '1' }
  },
  // ...
};
```

---

## 📚 Related Documentation

- [Line Items Dynamic Metadata Fix](/docs/bugfix/FIX-2026-01-15-orders-line-items-dynamic-metadata.md) - Initial implementation
- [Subscription Orders Schema](/docs/SCHEMA_subscription_orders.md)
- [Orders API Documentation](/docs/API_orders.md)

---

**Kết luận:** ✅ COMPLETED - OrderFormV2 với LineItemsEditor dynamic metadata đã được enable thành công trong cả Add và Edit Order pages. User giờ có thể nhập đầy đủ metadata cho từng loại sản phẩm/dịch vụ theo yêu cầu.
