# System Categories - Meta Structure

## Tổng quan

Hệ thống danh mục có cấu trúc 3 cấp **tự mô tả** (self-describing), nghĩa là chính cấu trúc của hệ thống cũng được lưu trữ dưới dạng danh mục.

## Cấu trúc Meta-Level

### Nhóm Meta System (GRP_META)

Nhóm đặc biệt chứa các loại danh mục mô tả cấu trúc của chính hệ thống.

**Đặc điểm:**
- `isSystem: true` - Là danh mục hệ thống
- `isEditable: false` - Không cho phép chỉnh sửa
- `order: 0` - Hiển thị đầu tiên

### 1. SystemCategoryGroup (Nhóm danh mục)

**Mô tả:** Loại danh mục định nghĩa cấu trúc của các nhóm danh mục (Level 1)

**Thuộc tính:**
- `type`: 'SystemCategoryType'
- `code`: 'SystemCategoryGroup'
- `groupCategoryId`: 'GRP_META'
- `collectionName`: 'system_categories'
- `extraFields`: `[]` (không có trường bổ sung)

**Ý nghĩa:** Mọi bản ghi có `type='SystemCategoryGroup'` đều là một nhóm danh mục ở cấp 1.

### 2. SystemCategoryType (Loại danh mục)

**Mô tả:** Loại danh mục định nghĩa cấu trúc của các loại danh mục khác (Level 2)

**Thuộc tính:**
- `type`: 'SystemCategoryType'
- `code`: 'SystemCategoryType'
- `groupCategoryId`: 'GRP_META'
- `collectionName`: 'system_categories'
- `extraFields`: `[]` (không có trường bổ sung - vì tất cả các trường đã là cố định trong schema)

**Các trường cố định của SystemCategoryType:**
- `code`: Mã định danh duy nhất
- `name`: Tên loại danh mục
- `type`: Luôn là 'SystemCategoryType'
- `groupCategoryId`: Thuộc nhóm nào (GRP_*)
- `collectionName`: Tên bảng lưu dữ liệu (default: 'system_categories')
- `extraFields`: Mảng JSON định nghĩa các trường bổ sung cho danh mục thuộc loại này
- `status`, `isSystem`, `isEditable`, `order`, `description`: Các trường metadata

**Ý nghĩa:** Mọi bản ghi có `type='SystemCategoryType'` đều là một loại danh mục ở cấp 2.

## Kiến trúc 3 cấp

```
┌─────────────────────────────────────────────────────────────┐
│ LEVEL 1: SystemCategoryGroup (Nhóm danh mục)               │
│ - GRP_META: Meta System                                     │
│ - GRP_SYSTEM: Hệ thống                                      │
│ - GRP_BUSINESS: Nghiệp vụ                                   │
│ - GRP_ORGANIZATION: Tổ chức                                 │
│ - GRP_LOCATION: Địa lý                                      │
└─────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│ LEVEL 2: SystemCategoryType (Loại danh mục)                │
│ GRP_META:                                                    │
│   - SystemCategoryGroup (Nhóm danh mục)                     │
│   - SystemCategoryType (Loại danh mục)                      │
│                                                              │
│ GRP_SYSTEM:                                                  │
│   - TYPE_TENANT_CLASSIFICATION (Phân loại Tenant)           │
│   - TYPE_USER_ROLE (Vai trò người dùng)                     │
│   - TYPE_MODULE (Module hệ thống)                           │
│                                                              │
│ GRP_BUSINESS:                                                │
│   - TYPE_PRODUCT_CATEGORY (Danh mục sản phẩm)               │
│   - TYPE_PAYMENT_METHOD (Phương thức thanh toán)            │
│                                                              │
│ GRP_ORGANIZATION:                                            │
│   - TYPE_DEPARTMENT (Phòng ban)                             │
│                                                              │
│ GRP_LOCATION:                                                │
│   - TYPE_REGION (Vùng miền)                                 │
│   - TYPE_PROVINCE (Tỉnh/Thành phố)                          │
└─────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│ LEVEL 3: Category Instances (Danh mục cụ thể)              │
│ TYPE_TENANT_CLASSIFICATION:                                 │
│   - CAT_TENANT_ENTERPRISE (Enterprise)                      │
│   - CAT_TENANT_BUSINESS (Business)                          │
│   - CAT_TENANT_STARTER (Starter)                            │
│                                                              │
│ TYPE_PRODUCT_CATEGORY:                                      │
│   - CAT_PRODUCT_ELECTRONICS (Điện tử)                       │
│   - CAT_PRODUCT_FASHION (Thời trang)                        │
│   - CAT_PRODUCT_FOOD (Thực phẩm)                            │
│                                                              │
│ ... và nhiều danh mục khác                                  │
└─────────────────────────────────────────────────────────────┘
```

## Ví dụ Self-Describing

### Tạo Nhóm danh mục mới

Khi tạo một nhóm mới, bạn đang tạo một instance của loại `SystemCategoryGroup`:

```sql
INSERT INTO system_categories (
  code, 
  name, 
  type,  -- Sử dụng code của SystemCategoryType
  status, 
  "isSystem", 
  "isEditable", 
  "order", 
  description
) VALUES (
  'GRP_CUSTOM',
  'Custom Group',
  'SystemCategoryGroup',  -- Đây là code của loại danh mục
  1,
  false,
  true,
  10,
  'Nhóm tùy chỉnh'
);
```

### Tạo Loại danh mục mới

Khi tạo một loại mới, bạn đang tạo một instance của loại `SystemCategoryType`:

```sql
INSERT INTO system_categories (
  code,
  name,
  type,  -- Sử dụng code của SystemCategoryType
  "groupCategoryId",  -- Thuộc nhóm nào
  "collectionName",   -- Lưu ở bảng nào
  "extraFields",      -- Định nghĩa các trường bổ sung
  status,
  "isSystem",
  "isEditable",
  "order",
  description
) VALUES (
  'TYPE_CUSTOM_CATEGORY',
  'Custom Category Type',
  'SystemCategoryType',  -- Đây là code của loại danh mục
  'GRP_CUSTOM',
  'system_categories',
  '[
    {"code": "customField", "name": "Trường tùy chỉnh", "dataType": "string", "defaultValue": ""}
  ]'::jsonb,
  1,
  false,
  true,
  1,
  'Loại danh mục tùy chỉnh'
);
```

### Tạo Danh mục cụ thể

Khi tạo một danh mục, bạn đang tạo một instance của loại tùy chỉnh:

```sql
INSERT INTO system_categories (
  code,
  name,
  type,  -- Sử dụng code của loại danh mục custom
  "groupCategoryId",
  status,
  "isSystem",
  "isEditable",
  "order",
  description,
  metadata  -- Chứa các extraFields
) VALUES (
  'CAT_CUSTOM_ITEM',
  'Custom Item',
  'TYPE_CUSTOM_CATEGORY',  -- Đây là code của loại danh mục custom
  'GRP_CUSTOM',
  1,
  false,
  true,
  1,
  'Danh mục tùy chỉnh',
  '{"customField": "value"}'::jsonb
);
```

## Lợi ích của Self-Describing Structure

1. **Tính nhất quán**: Tất cả đều là danh mục, chỉ khác nhau về `type`
2. **Mở rộng dễ dàng**: Thêm loại danh mục mới không cần thay đổi schema
3. **Tự động hóa UI**: UI có thể tự động render form dựa trên `extraFields`
4. **Metadata driven**: Cấu trúc được định nghĩa bởi dữ liệu, không phải code
5. **Truy vấn đơn giản**: Chỉ cần 1 bảng cho tất cả danh mục

## Query Examples

### Lấy tất cả nhóm danh mục
```sql
SELECT * FROM system_categories 
WHERE type = 'SystemCategoryGroup' 
  AND status = 1 
ORDER BY "order";
```

### Lấy tất cả loại danh mục của một nhóm
```sql
SELECT * FROM system_categories 
WHERE type = 'SystemCategoryType' 
  AND "groupCategoryId" = 'GRP_BUSINESS'
  AND status = 1
ORDER BY "order";
```

### Lấy tất cả danh mục của một loại
```sql
SELECT * FROM system_categories 
WHERE type = 'TYPE_PRODUCT_CATEGORY'
  AND status = 1
ORDER BY "order";
```

### Lấy định nghĩa của một loại danh mục
```sql
SELECT 
  code,
  name,
  description,
  "collectionName",
  "extraFields"
FROM system_categories 
WHERE code = 'TYPE_PRODUCT_CATEGORY'
  AND type = 'SystemCategoryType';
```

## Best Practices

1. **Không xóa meta records**: Các bản ghi trong GRP_META không nên xóa
2. **isEditable = false cho meta**: Bảo vệ cấu trúc hệ thống
3. **Validate extraFields**: Đảm bảo JSON schema hợp lệ
4. **Sử dụng code làm reference**: Không dùng ID để reference
5. **Prefix naming convention**: 
   - Groups: `GRP_*`
   - Types: `TYPE_*`
   - Categories: `CAT_*`