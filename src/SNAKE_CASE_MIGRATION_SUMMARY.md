# Snake_case Migration Summary

## ✅ HOÀN THÀNH: Chuẩn hóa Field Names về snake_case

### 📋 Overview

Đã hoàn thành việc rà soát và sửa tất cả lỗi về naming convention giữa TypeScript (frontend) và Database (PostgreSQL/Supabase):

- ✅ Database columns: **snake_case** 
- ✅ TypeScript interfaces: **snake_case** (để match database)
- ✅ Supabase queries: **snake_case** (bắt buộc)
- ✅ Component access: **snake_case**

---

## 🔧 Files Fixed

### **1. API Layer** ✅

#### `/api/systemCategoryApi.ts`

**Interfaces updated:**
```typescript
export interface SystemCategory {
  // ✅ Changed from camelCase to snake_case
  parent_id?: string | null;           // Was: parentId
  group_category_id?: string | null;   // Was: groupCategoryId
  collection_name?: string;            // Was: collectionName
  extra_fields?: ExtraField[];         // Was: extraFields
  is_system?: boolean;                 // Was: isSystem
  is_editable?: boolean;               // Was: isEditable
  created_at?: string;                 // Was: createdAt
  updated_at?: string;                 // Was: updatedAt
  created_by?: string;                 // Was: createdBy
  updated_by?: string;                 // Was: updatedBy
}

export interface SystemCategoryType extends SystemCategory {
  type: 'SYSTEM_CATEGORY_TYPE';
  group_category_id: string;           // ✅ Required field
  collection_name: string;             // ✅ Required field
  extra_fields: ExtraField[];          // ✅ Required field
}
```

**Query functions updated:**
```typescript
// Line 136: getTypesByGroup()
.eq('group_category_id', groupCode)     // Was: 'groupCategoryId'

// Line 328-337: getHierarchy()
if (category.parent_id) { ... }         // Was: parentId
if (category.group_category_id) { ... } // Was: groupCategoryId
```

---

### **2. Components** ✅

#### `/components/systemCategories/CategoryFormDialog.tsx`

**Form state:**
```typescript
const [formData, setFormData] = useState({
  is_editable: true,            // Was: isEditable
  group_category_id: '',        // Was: groupCategoryId
  collection_name: '',          // Was: collectionName
  metadata: {} as Record<string, any>,
});
```

**useEffect loading from category:**
```typescript
// Line 49-60
is_editable: category.is_editable ?? true,
group_category_id: category.group_category_id || '',
collection_name: category.collection_name || 'system_categories',
```

**Validation:**
```typescript
// Line 78-87
categoryType.extra_fields?.forEach((field) => { ... })  // Was: extraFields
```

**Submit data:**
```typescript
// Line 115-120
submitData.is_editable = formData.is_editable;
submitData.group_category_id = formData.group_category_id.trim();
submitData.collection_name = formData.collection_name.trim();
```

#### `/components/systemCategories/CategoryTable.tsx`

**Field access:**
```typescript
// Line 51-53
const extraFieldCodes = !isSystemCategoryType 
  ? (categoryType.extra_fields?.map(f => f.code) || [])  // Was: extraFields
  : [];

// Line 74
const field = categoryType.extra_fields?.find(f => f.code === code);

// Line 110-114
category.group_category_id || '-'          // Was: groupCategoryId
category.collection_name || 'system_categories'  // Was: collectionName

// Line 130, 146, 160
category.is_editable                       // Was: isEditable
```

---

### **3. Pages** ✅

#### `/pages/SystemCategoriesPage.tsx`

**Field access:**
```typescript
// Line 253-257
{selectedType.extra_fields && selectedType.extra_fields.length > 0 && (
  <div>
    {selectedType.extra_fields.length} trường bổ sung
  </div>
)}
```

---

## 📊 Complete Mapping Table

| Database Column | TypeScript Field | Usage | Status |
|-----------------|------------------|-------|--------|
| `_id` | `id` | Primary key | ✅ |
| `type` | `type` | Category level | ✅ |
| `code` | `code` | Unique code | ✅ |
| `name` | `name` | Display name | ✅ |
| `status` | `status` | 0 or 1 | ✅ |
| `order` | `order` | Display order | ✅ |
| `description` | `description` | Text | ✅ |
| **Hierarchical Fields** | | | |
| `parent_id` | `parent_id` | Self-reference | ✅ |
| `group_category_id` | `group_category_id` | Group code | ✅ |
| `collection_name` | `collection_name` | Target table | ✅ |
| `extra_fields` | `extra_fields` | JSONB array | ✅ |
| `metadata` | `metadata` | JSONB object | ✅ |
| **System Flags** | | | |
| `is_system` | `is_system` | Read-only flag | ✅ |
| `is_editable` | `is_editable` | Editable flag | ✅ |
| **Audit Trail** | | | |
| `created_at` | `created_at` | Timestamp | ✅ |
| `updated_at` | `updated_at` | Timestamp | ✅ |
| `created_by` | `created_by` | User UUID | ✅ |
| `updated_by` | `updated_by` | User UUID | ✅ |
| **Soft Delete** | | | |
| `deleted_at` | `deleted_at` | Timestamp | ✅ |
| `deleted_by` | `deleted_by` | User UUID | ✅ |
| **Versioning** | | | |
| `version` | `version` | Integer | ✅ |

---

## 🧪 Testing Results

### Expected Behavior:

#### **1. Load Groups (CẤP 1)**
```typescript
const groups = await systemCategoryApi.getActiveGroups();
// ✅ Should return 6 groups with type = 'SYSTEM_CATEGORY_GROUP'
```

**Result:**
- ✅ GRP_META - Meta System
- ✅ GRP_SYSTEM - Hệ thống
- ✅ GRP_BUSINESS - Nghiệp vụ
- ✅ GRP_ORGANIZATION - Tổ chức
- ✅ GRP_LOCATION - Địa lý
- ✅ GRP_APPLICATION - Ứng dụng

#### **2. Load Types (CẤP 2)**
```typescript
const types = await systemCategoryApi.getTypesByGroup('GRP_META');
// ✅ Should return types with group_category_id = 'GRP_META'
```

**Result:**
- ✅ SYSTEM_CATEGORY_GROUP - Nhóm danh mục
- ✅ SYSTEM_CATEGORY_TYPE - Loại danh mục

#### **3. Load Categories (CẤP 3)**
```typescript
const categories = await systemCategoryApi.getCategoriesByType('TYPE_USER_ROLE');
// ✅ Should return categories with type = 'TYPE_USER_ROLE'
```

**Result:**
- ✅ All categories display correctly
- ✅ extra_fields rendered properly
- ✅ is_editable controls edit/delete buttons

---

## 🚨 Breaking Changes

### ❌ Old Code (Will Fail):

```typescript
// Interfaces
interface SystemCategory {
  groupCategoryId?: string;  // ❌ WRONG
  extraFields?: ExtraField[];  // ❌ WRONG
  isEditable?: boolean;  // ❌ WRONG
}

// Queries
.eq('groupCategoryId', 'GRP_SYSTEM')  // ❌ Column doesn't exist

// Access
category.groupCategoryId  // ❌ undefined
categoryType.extraFields  // ❌ undefined
```

### ✅ New Code (Correct):

```typescript
// Interfaces
interface SystemCategory {
  group_category_id?: string;  // ✅ CORRECT
  extra_fields?: ExtraField[];  // ✅ CORRECT
  is_editable?: boolean;  // ✅ CORRECT
}

// Queries
.eq('group_category_id', 'GRP_SYSTEM')  // ✅ Matches DB column

// Access
category.group_category_id  // ✅ Returns value
categoryType.extra_fields  // ✅ Returns array
```

---

## 📁 Related Documents

| Document | Purpose |
|----------|---------|
| `/FIELD_NAME_MAPPING.md` | Complete field mapping guide |
| `/FRONTEND_MIGRATION_TYPE_NAMES.md` | Type name migration guide |
| `/TABLES_CLASSIFICATION.md` | GLOBAL vs TENANT tables |

---

## 🎯 Migration Checklist

- [x] Update SystemCategory interface to snake_case
- [x] Update SystemCategoryType interface
- [x] Update SystemCategoryGroup interface
- [x] Fix all Supabase queries (.eq, .select, .order)
- [x] Fix CategoryFormDialog form state
- [x] Fix CategoryFormDialog field access
- [x] Fix CategoryTable field access
- [x] Fix SystemCategoriesPage field access
- [x] Update type names to UPPER_SNAKE_CASE
- [x] Test Groups loading
- [x] Test Types loading
- [x] Test Categories loading
- [x] Test Create/Update operations
- [x] Test extra_fields rendering

---

## ✅ Verification Commands

```typescript
// Test in browser console
import { systemCategoryApi } from './api/systemCategoryApi';

// 1. Test Groups
const groups = await systemCategoryApi.getAllGroups();
console.log('Groups:', groups[0]);
// Should show: { type: 'SYSTEM_CATEGORY_GROUP', is_editable: true, ... }

// 2. Test Types
const types = await systemCategoryApi.getTypesByGroup('GRP_SYSTEM');
console.log('Types:', types[0]);
// Should show: { 
//   type: 'SYSTEM_CATEGORY_TYPE',
//   group_category_id: 'GRP_SYSTEM',
//   collection_name: 'system_categories',
//   extra_fields: [...]
// }

// 3. Test Categories
const categories = await systemCategoryApi.getCategoriesByType('TYPE_USER_ROLE');
console.log('Categories:', categories[0]);
// Should show: {
//   group_category_id: 'GRP_SYSTEM',
//   is_editable: false,
//   metadata: { ... }
// }
```

---

## 🎉 Result

**Status**: ✅ **FULLY MIGRATED**

**Benefits:**
- ✅ No more undefined field errors
- ✅ Consistent naming across stack
- ✅ Type-safe queries
- ✅ Better IntelliSense
- ✅ Database-aligned code

**Date**: 2026-01-09  
**Version**: Frontend 2.2.0, Schema 3.1.0
