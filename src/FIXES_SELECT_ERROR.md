# Fixed: Select.Item Empty String Value Error

## ❌ Lỗi
```
Error: A <Select.Item /> must have a value prop that is not an empty string.
```

## ✅ Đã Fix

### 1. `/components/systemCategories/AppComponentForm.tsx`
**Before:**
```tsx
<SelectItem value="">None (Root Level)</SelectItem>
```

**After:**
```tsx
<SelectItem value="__none__">None (Root Level)</SelectItem>
```

**Logic update:**
```tsx
parentId: formData.parentId === '__none__' ? null : (formData.parentId || null)
```

### 2. `/components/tenants/TenantDepartmentsTab.tsx`
**Before:**
```tsx
<SelectItem value="">None</SelectItem>
```

**After:**
```tsx
<SelectItem value="__none__">None</SelectItem>
```

**Logic update:**
```tsx
parent_department_id: formData.parent_department_id === '__none__' ? null : (formData.parent_department_id || null)
```

## 📝 Giải Thích

Radix UI Select không cho phép `value=""` (empty string) vì:
- Empty string được dùng để clear selection và show placeholder
- Phải dùng non-empty value cho tất cả SelectItem

**Solution pattern**: Dùng `"__none__"` cho "None" option, convert về `null` khi submit.
