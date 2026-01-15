# ENHANCEMENT: Line Items Editor Improvements

**Date:** 2026-01-15  
**Status:** ✅ COMPLETED  
**Component:** `/components/orders/LineItemsEditor.tsx`

---

## 🎯 Yêu cầu

### 1. Thay đổi tiêu đề
- ❌ Cũ: "Line Items"  
- ✅ Mới: "Danh sách sản phẩm, dịch vụ"

### 2. Bỏ text trong badge
- ❌ Cũ: Badge hiển thị "Line Items Kết hợp" khi có cả PLAN và PRODUCT
- ✅ Mới: Badge để trống (`''`) khi có cả PLAN và PRODUCT

### 3. PLAN items - Tên gói với Combobox
**Requirement:**
- Cho phép chọn gói từ combobox (dropdown)
- Khi edit order với gói đã bị xóa → hiện tên gói (readonly) + warning message
- Auto-fill price khi chọn gói

**Implementation:**
```tsx
{item.item_type === 'PLAN' ? (
  (() => {
    const packageExists = packages.find(pkg => pkg._id === item.id || pkg.name === item.name);
    const isDeleted = item.id && !packageExists;

    if (isDeleted) {
      // Package was deleted - show readonly
      return (
        <div className="mt-2">
          <Input value={item.name} disabled className="bg-gray-100 text-gray-600 cursor-not-allowed" />
          <p className="text-xs text-red-600 mt-1">⚠️ Gói này đã bị xóa</p>
        </div>
      );
    } else {
      // Package exists or new item - show combobox
      return (
        <select
          value={item.id || ''}
          onChange={(e) => {
            const selectedPkg = packages.find(pkg => pkg._id === e.target.value);
            if (selectedPkg) {
              updateItem(index, 'id', selectedPkg._id);
              updateItem(index, 'name', selectedPkg.name);
              updateItem(index, 'price', selectedPkg.base_price || 0);
            }
          }}
          disabled={disabled || loadingPackages}
        >
          <option value="">-- Chọn gói --</option>
          {packages.map(pkg => (
            <option key={pkg._id} value={pkg._id}>
              {pkg.name} - {price_formatted}
            </option>
          ))}
        </select>
      );
    }
  })()
) : ...}
```

### 4. PRODUCT items - Tên sản phẩm với Combobox
**Requirement:**
- Cho phép chọn sản phẩm từ combobox (dropdown)
- Filter products theo `product_type` đã chọn
- Khi edit order với sản phẩm đã bị xóa → hiện tên sản phẩm (readonly) + warning message
- Auto-fill price khi chọn sản phẩm

**Implementation:**
```tsx
{item.item_type === 'PRODUCT' ? (
  (() => {
    // Filter products by product_type
    const filteredProducts = products.filter(p => p.product_type === item.product_type);
    const productExists = filteredProducts.find(p => p._id === item.id || p.name === item.name);
    const isDeleted = item.id && !productExists;

    if (isDeleted) {
      // Product was deleted - show readonly
      return (
        <div className="mt-2">
          <Input value={item.name} disabled className="bg-gray-100 text-gray-600 cursor-not-allowed" />
          <p className="text-xs text-red-600 mt-1">⚠️ Sản phẩm này đã bị xóa</p>
        </div>
      );
    } else {
      // Product exists or new item - show combobox
      return (
        <select
          value={item.id || ''}
          onChange={(e) => {
            const selectedProduct = filteredProducts.find(p => p._id === e.target.value);
            if (selectedProduct) {
              updateItem(index, 'id', selectedProduct._id);
              updateItem(index, 'name', selectedProduct.name);
              updateItem(index, 'price', selectedProduct.base_price || 0);
            }
          }}
          disabled={disabled || loadingProducts}
        >
          <option value="">-- Chọn sản phẩm --</option>
          {filteredProducts.map(product => (
            <option key={product._id} value={product._id}>
              {product.name} - {price_formatted}
            </option>
          ))}
        </select>
      );
    }
  })()
) : ...}
```

### 5. PRODUCT items - Thêm Product Type Selector trước Tên sản phẩm
**Requirement:**
- Thêm dropdown chọn loại sản phẩm TRƯỚC ô chọn tên sản phẩm
- Khi thay đổi product_type → reset name và id

**Implementation:**
```tsx
{/* Product Type selector (for PRODUCT items only) - MUST be first */}
{item.item_type === 'PRODUCT' && (
  <div>
    <Label>Loại sản phẩm *</Label>
    <select
      value={item.product_type || 'OTHER'}
      onChange={(e) => {
        const newType = e.target.value as ProductType;
        updateItem(index, 'product_type', newType);
        // Reset name and ID when product type changes
        updateItem(index, 'name', '');
        updateItem(index, 'id', '');
      }}
      required
      disabled={disabled}
    >
      <option value="SSL">Chứng chỉ SSL</option>
      <option value="DOMAIN">Tên miền</option>
      <option value="LICENSE">Giấy phép</option>
      <option value="SERVICE">Dịch vụ</option>
      <option value="CONSULTING">Tư vấn</option>
      <option value="TRAINING">Đào tạo</option>
      <option value="OTHER">Khác</option>
    </select>
  </div>
)}
```

---

## 📦 Data Fetching

### Service Packages
```tsx
const [packages, setPackages] = useState<ServicePackage[]>([]);
const [loadingPackages, setLoadingPackages] = useState(true);

useEffect(() => {
  servicePackages.getAll()
    .then((data) => {
      setPackages(data);
      setLoadingPackages(false);
    })
    .catch((error) => {
      console.error('Error fetching service packages:', error);
      setLoadingPackages(false);
    });
}, []);
```

### Products
```tsx
const [products, setProducts] = useState<Product[]>([]);
const [loadingProducts, setLoadingProducts] = useState(true);

useEffect(() => {
  productsApi.getAll()
    .then((data) => {
      setProducts(data);
      setLoadingProducts(false);
    })
    .catch((error) => {
      console.error('Error fetching products:', error);
      setLoadingProducts(false);
    });
}, []);
```

---

## 🔄 Workflow

### Creating new PLAN item:
1. User clicks "Thêm Gói cước (PLAN)"
2. New item added with `item_type: 'PLAN'`
3. User selects package from dropdown
4. System auto-fills:
   - `id` → package `_id`
   - `name` → package `name`
   - `price` → package `base_price`

### Creating new PRODUCT item:
1. User clicks "Thêm Sản phẩm (PRODUCT)"
2. New item added with `item_type: 'PRODUCT'`, `product_type: 'OTHER'`
3. **User selects product_type** (SSL, DOMAIN, LICENSE, etc.)
4. Dropdown shows ONLY products matching selected `product_type`
5. User selects product from filtered dropdown
6. System auto-fills:
   - `id` → product `_id`
   - `name` → product `name`
   - `price` → product `base_price`

### Editing order with deleted package/product:
1. Load order with `items_snapshot`
2. Check if package/product still exists in database
3. If NOT found:
   - Show readonly input with existing name
   - Display warning: "⚠️ Gói này đã bị xóa" / "⚠️ Sản phẩm này đã bị xóa"
   - User can still see data but cannot change package/product
   - User can still edit price, quantity, metadata

---

## 🎨 UI Changes

### Header
**Before:**
```
Line Items [Badge: Line Items Kết hợp]
```

**After:**
```
Danh sách sản phẩm, dịch vụ [Badge: (empty if mixed)]
```

### PLAN Item Card
**Before:**
```
Tên gói: [Text Input]
ID: [Text Input]
```

**After:**
```
Tên gói: [Dropdown: -- Chọn gói --]
         [or Readonly with ⚠️ if deleted]
ID: [Auto-filled, Readonly]
```

### PRODUCT Item Card
**Before:**
```
Tên sản phẩm: [Text Input]
ID: [Text Input]
Loại sản phẩm: [Dropdown]
```

**After:**
```
Loại sản phẩm: [Dropdown]  ← MOVED TO TOP
Tên sản phẩm: [Dropdown: -- Chọn sản phẩm --]
              [or Readonly with ⚠️ if deleted]
ID: [Auto-filled, Readonly]
```

---

## 🧪 Testing Scenarios

### Scenario 1: Create new order with PLAN
1. ✅ Dropdown shows all available packages
2. ✅ Selecting package auto-fills name, id, price
3. ✅ Price can be manually adjusted
4. ✅ Validation works correctly

### Scenario 2: Create new order with PRODUCT
1. ✅ Select product_type first
2. ✅ Dropdown shows ONLY products matching product_type
3. ✅ Changing product_type resets name and id
4. ✅ Selecting product auto-fills name, id, price
5. ✅ Validation works correctly

### Scenario 3: Edit order with deleted package
1. ✅ Load order successfully
2. ✅ Readonly input shows package name
3. ✅ Warning message displayed
4. ✅ Cannot change package
5. ✅ Can edit price, quantity, metadata
6. ✅ Can save order

### Scenario 4: Edit order with deleted product
1. ✅ Load order successfully
2. ✅ Readonly input shows product name
3. ✅ Warning message displayed
4. ✅ Cannot change product
5. ✅ Can edit price, quantity, metadata
6. ✅ Can save order

### Scenario 5: Mixed order (PLAN + PRODUCT)
1. ✅ Badge shows empty text (not "Kết hợp")
2. ✅ Both item types work correctly

---

## 📝 Field Changes Summary

| Field | Before | After |
|-------|--------|-------|
| **Header Title** | "Line Items" | "Danh sách sản phẩm, dịch vụ" |
| **Badge (Mixed)** | "Kết hợp" | "" (empty) |
| **PLAN Name** | Text Input | Dropdown (or Readonly if deleted) |
| **PLAN ID** | Text Input (editable) | Auto-filled (readonly) |
| **PRODUCT Type** | Below Name field | **Above Name field** (moved) |
| **PRODUCT Name** | Text Input | Dropdown filtered by type (or Readonly if deleted) |
| **PRODUCT ID** | Text Input (editable) | Auto-filled (readonly) |

---

## 🔧 Dependencies

### New Imports
```tsx
import { servicePackages, type ServicePackage } from '../../api/servicePackages';
import { productsApi, type Product } from '../../api/productsApi';
```

### New State
```tsx
const [packages, setPackages] = useState<ServicePackage[]>([]);
const [products, setProducts] = useState<Product[]>([]);
const [loadingPackages, setLoadingPackages] = useState(true);
const [loadingProducts, setLoadingProducts] = useState(true);
```

### API Calls
- `servicePackages.getAll()` - Fetch all service packages
- `productsApi.getAll()` - Fetch all products

---

## 🚀 Benefits

1. **Better UX**: Users select from existing packages/products instead of typing
2. **Data Integrity**: Auto-fill ensures correct ID and price
3. **Error Prevention**: Cannot select deleted items, but can view historical data
4. **Consistency**: Product type always shown before product selection
5. **Type Safety**: Products filtered by product_type reduces selection errors
6. **Audit Trail**: Deleted items still visible in readonly mode

---

## ⚠️ Important Notes

1. **ID field is now readonly** - Auto-filled when selecting from dropdown
2. **Price is auto-filled** - But can still be manually edited if needed
3. **Product type changes reset selection** - To ensure correct filtering
4. **Deleted items handled gracefully** - No data loss, clear warning to users
5. **Loading states** - Dropdowns disabled while fetching data

---

## 🔮 Future Enhancements

1. Add search/filter in dropdowns for large lists
2. Add "Create New" button in dropdown to quickly add package/product
3. Cache packages/products to reduce API calls
4. Add tooltips with package/product descriptions
5. Highlight recommended packages/products
6. Show stock availability for products

---

**Status:** ✅ All requirements implemented and tested successfully!
