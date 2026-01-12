# Frontend Migration Guide: Type Name Changes

## Overview

Changed system category type names from camelCase to UPPER_SNAKE_CASE.

## ⚠️ Breaking Changes

### Type Names

| Old Value | New Value |
|-----------|-----------|
| `SystemCategoryGroup` | `SYSTEM_CATEGORY_GROUP` |
| `SystemCategoryType` | `SYSTEM_CATEGORY_TYPE` |

---

## ✅ Fixed Files

### 1. `/api/systemCategoryApi.ts` ✅

**Interfaces:**
```typescript
// OLD
export interface SystemCategoryGroup extends SystemCategory {
  type: 'SystemCategoryGroup';
}

export interface SystemCategoryType extends SystemCategory {
  type: 'SystemCategoryType';
}

// NEW
export interface SystemCategoryGroup extends SystemCategory {
  type: 'SYSTEM_CATEGORY_GROUP';
}

export interface SystemCategoryType extends SystemCategory {
  type: 'SYSTEM_CATEGORY_TYPE';
}
```

**API Queries:**
```typescript
// OLD
.eq('type', 'SystemCategoryGroup')
.eq('type', 'SystemCategoryType')

// NEW
.eq('type', 'SYSTEM_CATEGORY_GROUP')
.eq('type', 'SYSTEM_CATEGORY_TYPE')
```

**getStatistics() function:**
```typescript
// OLD
if (item.type === 'SystemCategoryGroup') { ... }
else if (item.type === 'SystemCategoryType') { ... }

// NEW
if (item.type === 'SYSTEM_CATEGORY_GROUP') { ... }
else if (item.type === 'SYSTEM_CATEGORY_TYPE') { ... }
```

---

### 2. `/components/systemCategories/EnhancedSystemCategoryForm.tsx` ✅

**handleAddGroup():**
```typescript
// OLD
type: 'SystemCategoryGroup',

// NEW
type: 'SYSTEM_CATEGORY_GROUP',
```

---

## 🔍 Files to Check

Search for remaining references:

```bash
# Find old type names
grep -r "SystemCategoryGroup" --include="*.tsx" --include="*.ts"
grep -r "SystemCategoryType" --include="*.tsx" --include="*.ts"
```

### Potential files:
- `/components/systemCategories/CategoryFormDialog.tsx`
- `/components/systemCategories/CategoryTable.tsx`
- `/pages/SystemCategoriesPage.tsx`
- Any other components using these types

---

## 🧪 Testing Checklist

### Manual Tests:

- [ ] Load system categories page
- [ ] Verify groups load (CẤP 1: NHÓM DANH MỤC)
- [ ] Verify types load (CẤP 2: LOẠI DANH MỤC)
- [ ] Create new group
- [ ] Create new type
- [ ] Create new category instance
- [ ] Edit existing categories
- [ ] Delete categories

### Expected Results:

**Groups should show:**
- GRP_META - Meta System
- GRP_SYSTEM - Hệ thống
- GRP_BUSINESS - Nghiệp vụ
- GRP_ORGANIZATION - Tổ chức
- GRP_LOCATION - Địa lý
- GRP_APPLICATION - Ứng dụng

**Types should show (for any group):**
- Multiple TYPE_XXX entries

---

## 🔧 Migration SQL

If database has old data, run this update:

```sql
-- Update type names
UPDATE system_categories 
SET type = 'SYSTEM_CATEGORY_GROUP' 
WHERE type = 'SystemCategoryGroup';

UPDATE system_categories 
SET type = 'SYSTEM_CATEGORY_TYPE' 
WHERE type = 'SystemCategoryType';

-- Verify
SELECT type, COUNT(*) 
FROM system_categories 
GROUP BY type 
ORDER BY type;
```

---

## 📊 Expected Database State

```sql
-- Should return:
-- SYSTEM_CATEGORY_GROUP | 6
-- SYSTEM_CATEGORY_TYPE  | 9
-- TYPE_XXX              | varies

SELECT 
  type,
  COUNT(*) as count
FROM system_categories
WHERE deleted_at IS NULL
GROUP BY type
ORDER BY 
  CASE 
    WHEN type = 'SYSTEM_CATEGORY_GROUP' THEN 1
    WHEN type = 'SYSTEM_CATEGORY_TYPE' THEN 2
    ELSE 3
  END;
```

---

## 🚨 Common Issues

### Issue 1: "Không có nhóm danh mục"

**Cause**: API querying with old type name

**Fix**: Update query to use `SYSTEM_CATEGORY_GROUP`

```typescript
// ❌ Wrong
.eq('type', 'SystemCategoryGroup')

// ✅ Correct
.eq('type', 'SYSTEM_CATEGORY_GROUP')
```

### Issue 2: TypeScript type mismatch

**Cause**: Interface still using old string literal

**Fix**: Update interface:
```typescript
type: 'SYSTEM_CATEGORY_GROUP'  // not 'SystemCategoryGroup'
```

### Issue 3: Create operations failing

**Cause**: Creating records with old type value

**Fix**: Use new constant:
```typescript
type: 'SYSTEM_CATEGORY_GROUP'
```

---

## 📝 Notes

- **No data loss**: This is purely a rename operation
- **Backward incompatible**: Old queries will return no results
- **Database must be updated**: Run migration 003 first
- **Clear localStorage**: May need to clear cached data

---

## ✅ Verification Commands

```typescript
// In browser console
import { systemCategoryApi } from './api/systemCategoryApi';

// Should return 6 groups
const groups = await systemCategoryApi.getAllGroups();
console.log('Groups:', groups.length, groups);

// Should return 9+ types
const types = await systemCategoryApi.getAllTypes();
console.log('Types:', types.length, types);

// Check if data is correct
groups.forEach(g => {
  console.log(g.code, g.name, g.type);
  // type should be 'SYSTEM_CATEGORY_GROUP'
});
```

---

**Status**: ✅ API Fixed, Components Fixed  
**Date**: 2026-01-09  
**Next**: Test in browser
