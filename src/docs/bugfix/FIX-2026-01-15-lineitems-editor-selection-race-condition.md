# Bug Fix: LineItemsEditor - Race Condition khi chọn Package/Product

**Ngày:** 2026-01-15  
**Mức độ:** High  
**Component:** LineItemsEditor  
**Trạng thái:** ✅ Đã fix hoàn toàn

## 🐛 Vấn đề

LineItemsEditor component có 3 lỗi liên quan đến việc chọn dữ liệu:

1. **Gói cước:** Chọn "Tên gói" không cập nhật - combobox vẫn hiện "-- Chọn gói --", các input ID và Giá không được cập nhật
2. **Loại sản phẩm:** Chọn "Loại sản phẩm" không cập nhật - combobox vẫn hiện "Khác", combobox "Tên sản phẩm" không được filter theo loại đã chọn
3. **Tên sản phẩm:** Chọn "Tên sản phẩm" không cập nhật - combobox vẫn hiện "-- Chọn sản phẩm --", các input ID, Giá và metadata fields không được cập nhật

## 🔍 Nguyên nhân

**Race Condition trong State Updates**

Khi người dùng chọn một item, code đang gọi `updateItem()` nhiều lần liên tiếp:

```typescript
// ❌ VÍ DỤ 1: Package selection
onChange={(e) => {
  const selectedPkg = packages.find(pkg => pkg._id === e.target.value);
  if (selectedPkg) {
    updateItem(index, 'id', selectedPkg._id);      // Call 1 - dựa trên state cũ
    updateItem(index, 'name', selectedPkg.name);   // Call 2 - dựa trên state cũ
    updateItem(index, 'price', selectedPkg.base_price || 0); // Call 3 - dựa trên state cũ
  }
}}

// ❌ VÍ DỤ 2: Product type change
onChange={(e) => {
  const newType = e.target.value as ProductType;
  updateItem(index, 'product_type', newType);  // Call 1
  updateItem(index, 'name', '');               // Call 2 - overwrites call 1
  updateItem(index, 'id', '');                 // Call 3 - overwrites call 2
}}
```

**Tại sao lỗi?**

React state updates are **asynchronous** và **batched**. Khi gọi `updateItem()` nhiều lần:

1. **Call 1** tạo `newItems1 = [...items]` dựa trên state cũ, update field, gọi `onChange(newItems1)`
2. **Call 2** (ngay lập tức) vẫn đọc `items` từ state cũ (chưa re-render), tạo `newItems2` cũng dựa trên state cũ, overwrites Call 1
3. **Call 3** tương tự, overwrites Call 2

Kết quả: **Chỉ update cuối cùng được giữ lại**, các updates trước bị mất.

## ✅ Giải pháp

Tạo helper function `updateItemMultiple()` để **batch update tất cả fields trong một lần**:

```typescript
// ✅ NEW: Helper function to update multiple fields at once
const updateItemMultiple = (index: number, updates: Partial<LineItem>) => {
  const newItems = [...items];
  newItems[index] = {
    ...newItems[index],
    ...updates,
    // Handle number conversions
    ...(updates.price !== undefined ? { price: Number(updates.price) } : {}),
    ...(updates.quantity !== undefined ? { quantity: Number(updates.quantity) } : {}),
  };
  onChange(newItems);
};
```

**Đặc điểm:**
- Chỉ đọc `items` state **một lần duy nhất**
- Merge tất cả updates vào object mới
- Handle type conversion cho number fields
- Gọi `onChange` **chỉ một lần**

### 1. Fix Package Selection

**Trước:**
```typescript
onChange={(e) => {
  const selectedPkg = packages.find(pkg => pkg._id === e.target.value);
  if (selectedPkg) {
    updateItem(index, 'id', selectedPkg._id);      // ❌ Race condition
    updateItem(index, 'name', selectedPkg.name);
    updateItem(index, 'price', selectedPkg.base_price || 0);
  }
}}
```

**Sau:**
```typescript
onChange={(e) => {
  console.log('🔍 DEBUG: Package selected:', e.target.value);
  const selectedPkg = packages.find(pkg => pkg._id === e.target.value);
  console.log('🔍 DEBUG: Found package:', selectedPkg);
  if (selectedPkg) {
    // ✅ Update all fields at once to avoid race condition
    updateItemMultiple(index, {
      id: selectedPkg._id,
      name: selectedPkg.name,
      price: selectedPkg.base_price || 0,
    });
  }
}}
```

### 2. Fix Product Type Selection

**Trước:**
```typescript
onChange={(e) => {
  const newType = e.target.value as ProductType;
  updateItem(index, 'product_type', newType);  // ❌ Race condition
  updateItem(index, 'name', '');
  updateItem(index, 'id', '');
}}
```

**Sau:**
```typescript
onChange={(e) => {
  console.log('🔍 DEBUG: Product type changed to:', e.target.value);
  const newType = e.target.value as ProductType;
  // ✅ Update all fields at once to avoid race condition
  updateItemMultiple(index, {
    product_type: newType,
    name: '',
    id: '',
  });
}}
```

### 3. Fix Product Selection

**Trước:**
```typescript
onChange={(e) => {
  const selectedProduct = filteredProducts.find(p => p._id === e.target.value);
  if (selectedProduct) {
    updateItem(index, 'id', selectedProduct._id);      // ❌ Race condition
    updateItem(index, 'name', selectedProduct.name);
    updateItem(index, 'price', selectedProduct.base_price || 0);
  }
}}
```

**Sau:**
```typescript
onChange={(e) => {
  console.log('🔍 DEBUG: Product selected:', e.target.value);
  const selectedProduct = filteredProducts.find(p => p._id === e.target.value);
  console.log('🔍 DEBUG: Found product:', selectedProduct);
  console.log('🔍 DEBUG: Filtered products count:', filteredProducts.length);
  if (selectedProduct) {
    // ✅ Update all fields at once to avoid race condition
    updateItemMultiple(index, {
      id: selectedProduct._id,
      name: selectedProduct.name,
      price: selectedProduct.base_price || 0,
    });
  }
}}
```

## 📁 Files đã thay đổi

1. ✅ `/components/orders/LineItemsEditor.tsx` - Thêm `updateItemMultiple()` và sửa tất cả onChange handlers

## 🎯 Kết quả

### Test Case 1: Chọn Gói cước
- ✅ Chọn gói từ dropdown
- ✅ Combobox hiển thị tên gói đã chọn
- ✅ Input "ID" tự động fill với `_id` của gói
- ✅ Input "Giá" tự động fill với `base_price` của gói
- ✅ Tất cả updates xảy ra **đồng thời trong một lần**

### Test Case 2: Chọn Loại sản phẩm
- ✅ Chọn loại sản phẩm (VD: "Chứng chỉ SSL")
- ✅ Combobox "Loại sản phẩm" hiển thị loại đã chọn
- ✅ Input "Tên sản phẩm" và "ID" được reset về empty
- ✅ Combobox "Tên sản phẩm" filter đúng theo loại đã chọn
- ✅ Metadata fields render đúng theo product_type

### Test Case 3: Chọn Tên sản phẩm
- ✅ Chọn sản phẩm từ dropdown (đã được filter theo type)
- ✅ Combobox hiển thị tên sản phẩm đã chọn
- ✅ Input "ID" tự động fill với `_id` của sản phẩm
- ✅ Input "Giá" tự động fill với `base_price` của sản phẩm
- ✅ Metadata fields render đúng với product_type của sản phẩm

## 🔬 Technical Deep Dive

### React State Update Batching

React 18+ automatically batches state updates, nhưng vẫn có race condition khi:

```typescript
// Multiple synchronous setState calls
setItems(oldItems => [...oldItems, newItem1]); // Read old state
setItems(oldItems => [...oldItems, newItem2]); // Read old state again (NOT updated yet)
// Result: Only newItem2 is added, newItem1 is lost!
```

### Solution Pattern: Batch Updates

```typescript
// ✅ GOOD: Single state update with all changes
setItems(oldItems => {
  const newItems = [...oldItems];
  newItems[index] = {
    ...newItems[index],
    field1: value1,
    field2: value2,
    field3: value3,
  };
  return newItems;
});
```

### Debug Logging

Thêm console.log để verify data flow:

```typescript
console.log('🔍 DEBUG: Package selected:', e.target.value);
console.log('🔍 DEBUG: Found package:', selectedPkg);
console.log('🔍 DEBUG: Filtered products count:', filteredProducts.length);
```

## 📚 Lessons Learned

### 1. **State Updates are Asynchronous**
- Không bao giờ assume state đã update ngay sau khi gọi setState
- Multiple setState calls có thể bị race condition

### 2. **Batch Related Updates**
- Khi cần update nhiều fields liên quan, làm trong một lần
- Tạo helper functions cho complex updates

### 3. **Type Safety với TypeScript**
```typescript
// Generic helper với type safety
const updateItemMultiple = (index: number, updates: Partial<LineItem>) => {
  // TypeScript ensures updates match LineItem shape
  // ...
};
```

### 4. **Number Type Handling**
```typescript
// Handle type conversion explicitly
...(updates.price !== undefined ? { price: Number(updates.price) } : {})
```

### 5. **Debug với Console Logs**
- Thêm console.log tạm thời để trace data flow
- Remove sau khi fix xong (hoặc wrap trong `if (process.env.NODE_ENV === 'development')`)

## 🎯 Best Practices Applied

1. ✅ **Single Responsibility**: `updateItemMultiple()` chỉ làm một việc - batch update
2. ✅ **Type Safety**: Partial<LineItem> ensures type correctness
3. ✅ **Immutability**: Spread operators preserve immutability
4. ✅ **Performance**: Reduce number of re-renders từ N lần xuống 1 lần
5. ✅ **Maintainability**: Centralized update logic, easier to debug

## 🚀 Performance Impact

**Trước:**
- 3 state updates → 3 re-renders
- Potential race conditions
- Inconsistent UI state

**Sau:**
- 1 state update → 1 re-render
- No race conditions
- Consistent UI state
- **~66% reduction in re-renders** cho mỗi selection

---

**Kinh nghiệm rút ra:**
- Luôn cẩn thận với multiple setState calls trong cùng event handler
- Batch related state updates vào một lần duy nhất
- Use helper functions để encapsulate complex update logic
- Add debug logging khi investigate state update issues
