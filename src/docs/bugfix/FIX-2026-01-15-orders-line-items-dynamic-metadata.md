# FIX: Orders Line Items Dynamic Metadata Support

**Date:** 2026-01-15  
**Status:** ✅ COMPLETED  
**Module:** Orders (subscription_orders)  
**Impact:** HIGH - Enhanced Line Items Editor with full metadata support

---

## 📋 Tổng quan

Nâng cấp phần nhập `items_snapshot` của đơn hàng để hỗ trợ đầy đủ cấu trúc JSONB với dynamic metadata fields dựa trên `item_type` và `product_type`.

---

## 🎯 Vấn đề

Trước đây, `LineItemsEditor` chỉ hỗ trợ một số metadata fields cơ bản và không dynamic. Cần mở rộng để:

1. **Dynamic Metadata Fields**: Hiển thị các trường metadata khác nhau tùy theo item_type và product_type
2. **Validation Logic**: Validate các trường bắt buộc theo từng loại item
3. **Better UX**: Gợi ý rõ ràng về các trường bắt buộc và tùy chọn

---

## ✅ Giải pháp thực hiện

### 1. Nâng cấp LineItemsEditor Component

**File:** `/components/orders/LineItemsEditor.tsx`

#### 1.1. Thêm Dynamic Metadata Rendering

```typescript
// Helper to render metadata fields based on item_type and product_type
const renderMetadataFields = (item: LineItem, index: number) => {
  const fields: JSX.Element[] = [];

  // PLAN metadata fields
  if (item.item_type === 'PLAN') {
    // Chu kỳ (MONTHLY, QUARTERLY, YEARLY, LIFETIME)
    // Thời gian (duration in months)
  }

  // PRODUCT metadata fields based on product_type
  if (item.item_type === 'PRODUCT') {
    switch (item.product_type) {
      case 'SSL':
        // Domain áp dụng (domain)
        // Thời hạn (validity in years)
        break;
      
      case 'DOMAIN':
        // Tên miền (domain)
        // Nhà đăng ký (registrar)
        break;
      
      case 'LICENSE':
        // Mã license (license_key)
        // Số lượng user (seats)
        break;
      
      case 'SERVICE':
        // Loại dịch vụ (service_type)
        // Số giờ (hours)
        break;
      
      case 'CONSULTING':
        // Chuyên gia (consultant)
        // Số giờ (hours) - bắt buộc
        break;
      
      case 'TRAINING':
        // Khóa học (course) - bắt buộc
        // Số giờ (hours) - bắt buộc
        // Số học viên (participants)
        break;
      
      case 'OTHER':
      default:
        // Mô tả (description)
        break;
    }
    
    // Common field: Ghi chú (notes)
  }

  return fields;
};
```

#### 1.2. Thêm Validation Logic

```typescript
const validateLineItems = (items: LineItem[]): { isValid: boolean; errors: string[] } => {
  const allErrors: string[] = [];
  const itemErrors: Record<number, string[]> = {};

  items.forEach((item, index) => {
    const errors: string[] = [];

    // Basic validation
    if (!item.name.trim()) {
      errors.push(`Item ${index + 1}: Tên là bắt buộc`);
    }
    if (item.price <= 0) {
      errors.push(`Item ${index + 1}: Giá phải lớn hơn 0`);
    }
    if (item.quantity <= 0) {
      errors.push(`Item ${index + 1}: Số lượng phải lớn hơn 0`);
    }

    // PLAN specific validation
    if (item.item_type === 'PLAN') {
      if (!item.metadata?.cycle) {
        errors.push(`Item ${index + 1}: Chu kỳ là bắt buộc cho PLAN`);
      }
    }

    // PRODUCT specific validation
    if (item.item_type === 'PRODUCT') {
      switch (item.product_type) {
        case 'SSL':
        case 'DOMAIN':
          if (!item.metadata?.domain?.trim()) {
            errors.push(`Item ${index + 1}: Domain/Tên miền là bắt buộc`);
          }
          break;
        
        case 'CONSULTING':
        case 'TRAINING':
          if (!item.metadata?.hours || Number(item.metadata.hours) <= 0) {
            errors.push(`Item ${index + 1}: Số giờ là bắt buộc`);
          }
          break;
      }

      // TRAINING specific
      if (item.product_type === 'TRAINING') {
        if (!item.metadata?.course?.trim()) {
          errors.push(`Item ${index + 1}: Tên khóa học là bắt buộc`);
        }
      }
    }

    if (errors.length > 0) {
      itemErrors[index] = errors;
      allErrors.push(...errors);
    }
  });

  setValidationErrors(itemErrors);
  const isValid = allErrors.length === 0;
  
  // Notify parent component
  if (onValidationChange) {
    onValidationChange(isValid, allErrors);
  }

  return { isValid, errors: allErrors };
};
```

#### 1.3. Interface Update

```typescript
interface LineItemsEditorProps {
  items: LineItem[];
  onChange: (items: LineItem[]) => void;
  disabled?: boolean;
  onValidationChange?: (isValid: boolean, errors: string[]) => void;
}
```

### 2. Cập nhật OrderFormV2

**File:** `/components/orders/OrderFormV2.tsx`

#### 2.1. Thêm Validation State

```typescript
// Validation state for line items
const [itemsValid, setItemsValid] = useState(true);
const [itemsErrors, setItemsErrors] = useState<string[]>([]);
```

#### 2.2. Integration với LineItemsEditor

```typescript
<LineItemsEditor
  items={items}
  onChange={setItems}
  disabled={loading}
  onValidationChange={(isValid, errors) => {
    setItemsValid(isValid);
    setItemsErrors(errors);
  }}
/>
```

#### 2.3. Submit Validation

```typescript
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  
  // Validate items
  if (items.length === 0) {
    alert('Vui lòng thêm ít nhất 1 line item');
    return;
  }

  // Check validation from LineItemsEditor
  if (!itemsValid) {
    alert(`Có lỗi trong line items:\n${itemsErrors.join('\n')}`);
    return;
  }

  // ... submit logic
};
```

---

## 📊 Cấu trúc JSONB items_snapshot

### Ví dụ PLAN Item

```json
{
  "item_type": "PLAN",
  "id": "uuid-goi-pro",
  "name": "Gói Pro (Tháng)",
  "price": 1000000,
  "quantity": 1,
  "metadata": {
    "cycle": "MONTHLY",
    "duration": 12
  }
}
```

### Ví dụ PRODUCT Items

#### SSL Certificate

```json
{
  "item_type": "PRODUCT",
  "id": "uuid-san-pham-ssl",
  "name": "Chứng chỉ SSL Wildcard",
  "product_type": "SSL",
  "price": 500000,
  "quantity": 1,
  "metadata": {
    "domain": "*.app.hust.edu.vn",
    "validity": 1
  }
}
```

#### Service/Consulting

```json
{
  "item_type": "PRODUCT",
  "id": "uuid-goi-tu-van",
  "name": "Tư vấn chuyên sâu",
  "product_type": "CONSULTING",
  "price": 2000000,
  "quantity": 3,
  "metadata": {
    "consultant": "Nguyễn Văn A",
    "hours": 10
  }
}
```

#### Training

```json
{
  "item_type": "PRODUCT",
  "id": "uuid-dao-tao",
  "name": "Đào tạo React Advanced",
  "product_type": "TRAINING",
  "price": 5000000,
  "quantity": 1,
  "metadata": {
    "course": "React Advanced với TypeScript",
    "hours": 20,
    "participants": 15
  }
}
```

---

## 🎨 Metadata Fields theo Item Type

### PLAN (Gói cước)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `cycle` | select | ✅ Yes | MONTHLY, QUARTERLY, YEARLY, LIFETIME |
| `duration` | number | ❌ No | Thời gian tính bằng tháng |

### PRODUCT - SSL

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `domain` | string | ✅ Yes | Domain áp dụng (*.example.com) |
| `validity` | number | ❌ No | Thời hạn (năm) |
| `notes` | string | ❌ No | Ghi chú thêm |

### PRODUCT - DOMAIN

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `domain` | string | ✅ Yes | Tên miền (example.com) |
| `registrar` | string | ❌ No | Nhà đăng ký |
| `notes` | string | ❌ No | Ghi chú thêm |

### PRODUCT - LICENSE

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `license_key` | string | ❌ No | Mã license |
| `seats` | number | ❌ No | Số lượng user |
| `notes` | string | ❌ No | Ghi chú thêm |

### PRODUCT - SERVICE

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `service_type` | string | ❌ No | Loại dịch vụ |
| `hours` | number | ❌ No | Số giờ |
| `notes` | string | ❌ No | Ghi chú thêm |

### PRODUCT - CONSULTING

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `consultant` | string | ❌ No | Tên chuyên gia |
| `hours` | number | ✅ Yes | Số giờ tư vấn |
| `notes` | string | ❌ No | Ghi chú thêm |

### PRODUCT - TRAINING

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `course` | string | ✅ Yes | Tên khóa học |
| `hours` | number | ✅ Yes | Số giờ đào tạo |
| `participants` | number | ❌ No | Số học viên |
| `notes` | string | ❌ No | Ghi chú thêm |

### PRODUCT - OTHER

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `description` | string | ❌ No | Mô tả chi tiết |
| `notes` | string | ❌ No | Ghi chú thêm |

---

## ✅ Testing Checklist

- [x] Hiển thị đúng metadata fields khi chọn PLAN
- [x] Hiển thị đúng metadata fields khi chọn PRODUCT với các product_type khác nhau
- [x] Validation hoạt động cho các trường bắt buộc
- [x] Submit bị chặn khi có validation errors
- [x] Alert hiển thị chi tiết lỗi validation
- [x] Auto-calculate order type dựa trên line items
- [x] JSONB được lưu đúng format vào database

---

## 🔄 Migration Guide cho Golang Backend

Khi migrate sang Golang API, cần:

1. **Request DTO**:
```go
type LineItem struct {
    ItemType    string                 `json:"item_type"`    // "PLAN" | "PRODUCT"
    ID          string                 `json:"id"`
    Name        string                 `json:"name"`
    Price       float64                `json:"price"`
    Quantity    int                    `json:"quantity"`
    ProductType *string                `json:"product_type,omitempty"` // Only for PRODUCT
    Metadata    map[string]interface{} `json:"metadata"`
}
```

2. **Validation**:
```go
func (li *LineItem) Validate() error {
    if li.ItemType == "PLAN" {
        if li.Metadata["cycle"] == nil || li.Metadata["cycle"] == "" {
            return errors.New("cycle is required for PLAN items")
        }
    }
    
    if li.ItemType == "PRODUCT" {
        switch li.ProductType {
        case "SSL", "DOMAIN":
            if li.Metadata["domain"] == nil || li.Metadata["domain"] == "" {
                return errors.New("domain is required for SSL/DOMAIN products")
            }
        case "CONSULTING", "TRAINING":
            if li.Metadata["hours"] == nil {
                return errors.New("hours is required for CONSULTING/TRAINING products")
            }
        }
        
        if li.ProductType == "TRAINING" {
            if li.Metadata["course"] == nil || li.Metadata["course"] == "" {
                return errors.New("course is required for TRAINING products")
            }
        }
    }
    
    return nil
}
```

---

## 📝 Files Changed

1. **Enhanced:**
   - `/components/orders/LineItemsEditor.tsx` - Dynamic metadata fields + validation
   - `/components/orders/OrderFormV2.tsx` - Validation integration

2. **Types (unchanged):**
   - `/api/ordersApi.ts` - LineItem, ProductType, LineItemType already defined

---

## 🎯 Benefits

### ✅ User Experience

- ⚡ **Smart Forms**: Chỉ hiển thị fields liên quan đến item type được chọn
- 🛡️ **Client-side Validation**: Phát hiện lỗi ngay trước khi submit
- 💡 **Clear Hints**: Hiển thị rõ ràng trường nào bắt buộc, trường nào tùy chọn
- 🎨 **Better Layout**: Grid responsive 1/2/3 columns tùy theo screen size

### ✅ Data Quality

- 📊 **Structured Data**: JSONB metadata có cấu trúc rõ ràng theo từng loại
- ✔️ **Required Fields**: Đảm bảo các trường quan trọng luôn có giá trị
- 🔍 **Type Safety**: TypeScript interfaces đảm bảo type-safe

### ✅ Developer Experience

- 🔧 **Easy to Extend**: Thêm product_type mới rất dễ dàng
- 📚 **Well Documented**: Có đầy đủ examples và validation rules
- 🎯 **Golang Ready**: Cấu trúc sẵn sàng cho backend migration

---

## 🚀 Next Steps (Optional Enhancements)

1. **Visual Indicators**: Thêm icon/color cho từng product_type
2. **Presets**: Quick-add buttons cho common line items
3. **Copy/Clone**: Duplicate line item nhanh chóng
4. **Reorder**: Drag & drop để sắp xếp line items
5. **Bulk Actions**: Thay đổi metadata cho nhiều items cùng lúc

---

## 📚 Related Documentation

- [ORDER_MODELS.md](/docs/golang-models/ORDER_MODELS.md)
- [Orders CRUD Complete](/docs/bugfix/CHECK-2026-01-15-orders-crud-complete.md)
- [Subscription Orders Schema](/docs/bugfix/SUBSCRIPTION_ORDERS_SCHEMA_MIGRATION_COMPLETE.md)

---

**Kết luận:** ✅ COMPLETED - LineItemsEditor đã được nâng cấp thành công với dynamic metadata fields và comprehensive validation, sẵn sàng cho production và migration sang Golang backend.
