# Bug Fix: Không xóa được danh mục cấp 3 ở trang Danh mục hệ thống

**Ngày**: 2026-01-15  
**Mức độ**: 🔴 Critical  
**Trang**: Danh mục hệ thống (System Categories Page)  
**Component**: CategoryTable (Cấp 3)  

---

## 📋 MÔ TẢ LỖI

### Triệu chứng:
- User không thể xóa danh mục ở bảng Cấp 3 (Level 3 Categories)
- Click nút "Xóa" (Trash icon) không có phản ứng
- Không có thông báo lỗi hiển thị

### Tái hiện lỗi:
1. Vào trang `/core/system-categories`
2. Chọn Nhóm (Group) → Chọn Loại (Type)
3. Bảng Cấp 3 hiển thị các danh mục
4. Click nút Xóa (trash icon) ở cột "Thao tác"
5. ❌ Không có gì xảy ra, danh mục không bị xóa

### Root Cause:
**Mâu thuẫn về ID field** giữa database, interface, và implementation:

```typescript
// ❌ PROBLEM 1: Database sử dụng _id
CREATE TABLE system_categories (
  _id uuid PRIMARY KEY,  -- Database dùng _id
  ...
);

// ❌ PROBLEM 2: Interface chỉ định nghĩa _id
export interface SystemCategory {
  _id?: string;  // ✅ Có _id
  // ❌ THIẾU: id field
  type: string;
  code: string;
  ...
}

// ❌ PROBLEM 3: Seed data sử dụng id
export const systemCategoriesSeed: SystemCategory[] = [
  {
    id: 'group-product',  // ❌ Dùng id thay vì _id!
    type: 'SYSTEM_CATEGORY_GROUP',
    ...
  }
];

// ❌ PROBLEM 4: Hook tạo local ID với id
const newCategory: SystemCategory = {
  ...data,
  id: `local-${Date.now()}...`,  // ❌ Dùng id!
  ...
};

// ❌ PROBLEM 5: Component assume có id
<Button onClick={() => onDelete(category.id!)} />
// ❌ category.id = undefined nếu từ database (_id)
```

### Luồng lỗi:
```
1. Database trả về: { _id: "uuid-123", ... }
2. Supabase Adapter KHÔNG map _id → id
3. Hook nhận: { _id: "uuid-123", id: undefined, ... }
4. Component gọi: onDelete(category.id!)  → onDelete(undefined!)
5. API call: DELETE /system-categories/undefined
6. ❌ 404 Not Found
```

---

## 🔧 GIẢI PHÁP

### Thay đổi 1: Thêm `id` alias vào interface

**File**: `/api/systemCategoryApi.ts`

```typescript
export interface SystemCategory {
  _id?: string;
  // ✅ THÊM: Convenience alias for _id to match common usage
  id?: string;
  type: string;
  code: string;
  name: string;
  status: CategoryStatus;
  ...
}
```

**Lý do**: 
- Database dùng `_id` (Postgres convention)
- Frontend thích dùng `id` (JavaScript convention)
- Cần support cả hai để tương thích seed data và database

### Thay đổi 2: Auto-map `_id` → `id` trong Supabase Adapter

**File**: `/api/adapters/supabase.ts`

```typescript
protected mapFromDb(row: any): any {
  if (!row) return row;

  const mapped: any = { ...row };
  
  // ✅ THÊM: Always map _id to id for convenience
  if (row._id !== undefined) {
    mapped.id = row._id;
  }
  
  // Apply custom field mapping if provided
  if (this.fieldMapping) {
    Object.entries(this.fieldMapping).forEach(([apiField, dbField]) => {
      if (row[dbField] !== undefined) {
        mapped[apiField] = row[dbField];
        if (apiField !== dbField) {
          delete mapped[dbField];
        }
      }
    });
  }

  return mapped;
}
```

**Kết quả**: Mọi object từ database đều có cả `_id` và `id`:
```typescript
// Trước: { _id: "uuid-123", code: "PRODUCT_TYPE" }
// Sau:  { _id: "uuid-123", id: "uuid-123", code: "PRODUCT_TYPE" }
```

### Thay đổi 3: Fix CategoryTable component

**File**: `/components/systemCategories/CategoryTable.tsx`

```typescript
// ❌ TRƯỚC:
<Button onClick={() => onDelete(category.id!)} />

// ✅ SAU:
<Button 
  onClick={() => onDelete(category.id || category._id!)}
  disabled={!category.id && !category._id}
/>
```

**Lý do**: Fallback to `_id` nếu `id` không có (compatibility)

### Thay đổi 4: Fix useSystemCategories hook

**File**: `/hooks/useSystemCategories.ts`

#### Update category - Match cả `id` và `_id`:
```typescript
// ❌ TRƯỚC:
const newCategories = allCategories.map(cat =>
  cat.id === id ? { ...cat, ...updated } : cat
);

// ✅ SAU:
const newCategories = allCategories.map(cat =>
  (cat.id === id || cat._id === id) ? { ...cat, ...updated } : cat
);
```

#### Delete category - Filter cả `id` và `_id`:
```typescript
// ❌ TRƯỚC:
const newCategories = allCategories.filter(cat => cat.id !== id);

// ✅ SAU:
const newCategories = allCategories.filter(cat => 
  cat.id !== id && cat._id !== id
);
```

---

## ✅ KẾT QUẢ SAU KHI FIX

### Test Case 1: Xóa danh mục từ database
```typescript
// Input: { _id: "real-uuid", id: "real-uuid", code: "CAT1" }
// Action: Click Delete
// Expected: ✅ Xóa thành công
// Actual: ✅ Xóa thành công
```

### Test Case 2: Xóa danh mục từ seed data
```typescript
// Input: { id: "group-product", code: "PRODUCT" }
// Action: Click Delete
// Expected: ✅ Xóa thành công (local only)
// Actual: ✅ Xóa thành công
```

### Test Case 3: Xóa danh mục local (created offline)
```typescript
// Input: { id: "local-123", code: "TEMP" }
// Action: Click Delete
// Expected: ✅ Xóa thành công (local only)
// Actual: ✅ Xóa thành công
```

---

## 🎯 FILES CHANGED

| File | Changes | Lines |
|------|---------|-------|
| `/api/systemCategoryApi.ts` | Add `id` alias to interface | +2 |
| `/api/adapters/supabase.ts` | Auto-map `_id` → `id` | +5 |
| `/components/systemCategories/CategoryTable.tsx` | Fallback `id \|\| _id` | +2 |
| `/hooks/useSystemCategories.ts` | Match both `id` and `_id` | +6 |

**Total**: 4 files, 15 lines changed

---

## 🧪 TESTING CHECKLIST

- [x] Delete danh mục từ database (có `_id`)
- [x] Delete danh mục từ seed data (có `id` string)
- [x] Delete danh mục tạo local (có `id` string)
- [x] Edit danh mục từ database
- [x] Edit danh mục từ seed data
- [x] Toggle status (active/inactive)
- [x] Không ảnh hưởng đến Cấp 1 (Groups)
- [x] Không ảnh hưởng đến Cấp 2 (Types)
- [x] Cache vẫn hoạt động bình thường
- [x] Fallback to local delete khi API fail

---

## 📚 LESSONS LEARNED

### 1. **Consistency in ID naming**
   - Database nên dùng `_id` (PostgreSQL convention)
   - Frontend PHẢI có alias `id` (JavaScript convention)
   - Adapter PHẢI auto-map giữa hai convention

### 2. **Seed data alignment**
   - Seed data PHẢI match với interface
   - Nếu interface có `_id`, seed cũng phải dùng `_id`
   - Hoặc adapter phải map bidirectional

### 3. **Defensive programming**
   - Component nên check `id || _id`
   - Hook nên match `cat.id === id || cat._id === id`
   - Disable button khi không có ID: `disabled={!category.id && !category._id}`

### 4. **Type safety**
   - TypeScript KHÔNG bắt lỗi `category.id!` khi `id?: string`
   - Non-null assertion `!` che giấu undefined
   - Nên dùng optional chaining: `category.id || category._id`

---

## 🔮 RECOMMENDED NEXT STEPS

### Option A: Chuẩn hóa toàn bộ về `_id`
```typescript
// Seed data:
{ _id: 'group-product', ... }

// Hook:
id: crypto.randomUUID(),  // Không cần prefix "local-"
_id: id,
```

**Pros**: Consistent với database  
**Cons**: Phải update tất cả seed data

### Option B: Giữ current solution (Recommended ✅)
- Interface có cả `_id` và `id`
- Adapter auto-map
- Component fallback

**Pros**: Tương thích backward, flexible  
**Cons**: Có duplicate field

### Option C: Migrate database sang `id`
```sql
ALTER TABLE system_categories RENAME COLUMN _id TO id;
```

**Pros**: Đơn giản, frontend-friendly  
**Cons**: Phá vỡ Postgres convention, migration risk

---

## 🚨 RELATED ISSUES

Các bảng khác CÓ THỂ gặp vấn đề tương tự nếu:
- ✅ Database dùng `_id`
- ✅ Interface không có alias `id`
- ✅ Seed data dùng `id`

**Cần kiểm tra**:
- [ ] `department_members` - Có `_id` trong DB?
- [ ] `group_members` - Có `_id` trong DB?
- [ ] `legal_documents` - Có `_id` trong DB?
- [ ] `user_groups` - Có `_id` trong DB?
- [ ] `tenant_members` - Có `_id` trong DB?

**Action**: Run audit script:
```bash
# Find all tables using _id
psql -c "SELECT table_name FROM information_schema.columns 
         WHERE column_name = '_id';"
```

---

## 📝 COMMIT MESSAGE

```
fix: unable to delete level-3 categories in System Categories page

Root cause: ID field mismatch between database (_id), interface, 
and implementation (id). Database returns _id but component expects id.

Changes:
- Add id alias to SystemCategory interface
- Auto-map _id -> id in Supabase adapter
- Update CategoryTable to fallback id || _id
- Fix hook to match both id and _id

Resolves: PROJ-XXX
```

---

## 🎓 TECHNICAL DEBT

### Short-term (1-2 sprints):
- [ ] Audit all entities using `_id` in database
- [ ] Standardize ID field naming across codebase
- [ ] Add unit tests for ID field mapping

### Long-term (3-6 months):
- [ ] Migrate to single source of truth for ID field
- [ ] Update database schema documentation
- [ ] Create coding standards for entity IDs

---

**Fixed by**: AI Assistant  
**Reviewed by**: [Pending]  
**Deployed**: [Pending]
