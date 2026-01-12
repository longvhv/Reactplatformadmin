# Field Name Mapping: Database ↔ Frontend

## Database Schema (snake_case)

All database columns use **snake_case** naming convention:

```sql
CREATE TABLE system_categories (
  _id                 UUID PRIMARY KEY,
  tenant_id           UUID NOT NULL,
  type                VARCHAR(100) NOT NULL,
  code                VARCHAR(100) NOT NULL,
  name                VARCHAR(255) NOT NULL,
  status              INT2 DEFAULT 1,
  "order"             INTEGER DEFAULT 0,
  description         TEXT,
  
  -- Hierarchical & custom fields
  parent_id           VARCHAR(100),
  group_category_id   VARCHAR(100),
  collection_name     VARCHAR(100),
  extra_fields        JSONB DEFAULT '[]'::jsonb,
  metadata            JSONB DEFAULT '{}'::jsonb,
  
  -- System flags
  is_system           BOOLEAN DEFAULT false,
  is_editable         BOOLEAN DEFAULT true,
  
  -- Audit
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  created_by          UUID NULL,
  updated_by          UUID NULL,
  
  -- Soft delete
  deleted_at          TIMESTAMPTZ NULL,
  deleted_by          UUID NULL,
  
  -- Versioning
  version             INT DEFAULT 1
);
```

---

## TypeScript Interface (snake_case to match DB)

**DECISION**: Use snake_case in interfaces to match database exactly.

```typescript
export interface SystemCategory {
  id?: string;
  type: string;
  code: string;
  name: string;
  status: CategoryStatus;
  
  // Hierarchical & custom fields
  parent_id?: string | null;
  group_category_id?: string | null;
  collection_name?: string;
  extra_fields?: ExtraField[];
  description?: string;
  metadata?: Record<string, any>;
  
  // System flags
  is_system?: boolean;
  is_editable?: boolean;
  
  // Display
  order?: number;
  
  // Audit
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
  
  // Soft delete
  deleted_at?: string | null;
  deleted_by?: string | null;
  
  // Versioning
  version?: number;
}
```

---

## Supabase Query Rules

### ✅ Correct: Use exact database column names

```typescript
// Queries MUST use snake_case (database column names)
const { data, error } = await supabase
  .from('system_categories')
  .select('*')
  .eq('group_category_id', 'GRP_SYSTEM')  // ✅ Correct
  .eq('is_editable', true)                 // ✅ Correct
  .order('created_at', { ascending: false }); // ✅ Correct
```

### ❌ Wrong: Using camelCase

```typescript
// This will FAIL - Supabase doesn't auto-convert
const { data, error } = await supabase
  .from('system_categories')
  .select('*')
  .eq('groupCategoryId', 'GRP_SYSTEM')  // ❌ Column doesn't exist!
  .eq('isEditable', true)               // ❌ Column doesn't exist!
  .order('createdAt');                  // ❌ Column doesn't exist!
```

---

## Complete Mapping Table

| Database Column (snake_case) | TypeScript Field | Notes |
|------------------------------|------------------|-------|
| `_id` | `id` | Primary key (shortened for convenience) |
| `tenant_id` | `tenant_id` | Multi-tenancy |
| `type` | `type` | Category level |
| `code` | `code` | Unique identifier |
| `name` | `name` | Display name |
| `status` | `status` | 0 or 1 |
| `order` | `order` | Display order |
| `description` | `description` | Text description |
| **Hierarchical** | | |
| `parent_id` | `parent_id` | Self-reference |
| `group_category_id` | `group_category_id` | Group code |
| `collection_name` | `collection_name` | Target table |
| `extra_fields` | `extra_fields` | JSONB array |
| `metadata` | `metadata` | JSONB object |
| **System Flags** | | |
| `is_system` | `is_system` | Read-only |
| `is_editable` | `is_editable` | Can modify |
| **Audit Trail** | | |
| `created_at` | `created_at` | Timestamp |
| `updated_at` | `updated_at` | Timestamp |
| `created_by` | `created_by` | User UUID |
| `updated_by` | `updated_by` | User UUID |
| **Soft Delete** | | |
| `deleted_at` | `deleted_at` | Timestamp |
| `deleted_by` | `deleted_by` | User UUID |
| **Versioning** | | |
| `version` | `version` | Optimistic lock |

---

## Common Patterns

### 1. Select with specific columns

```typescript
// ✅ Use snake_case
const { data } = await supabase
  .from('system_categories')
  .select('_id, code, name, group_category_id, is_editable, created_at');
```

### 2. Filter queries

```typescript
// ✅ All column names in snake_case
const { data } = await supabase
  .from('system_categories')
  .select('*')
  .eq('type', 'SYSTEM_CATEGORY_TYPE')
  .eq('group_category_id', 'GRP_SYSTEM')
  .eq('is_system', false)
  .is('deleted_at', null)
  .order('order', { ascending: true });
```

### 3. Insert/Update

```typescript
// ✅ Object keys must match database columns exactly
const { data } = await supabase
  .from('system_categories')
  .insert({
    code: 'TYPE_NEW',
    name: 'New Type',
    type: 'SYSTEM_CATEGORY_TYPE',
    group_category_id: 'GRP_SYSTEM',
    collection_name: 'system_categories',
    extra_fields: [],
    is_system: false,
    is_editable: true,
    status: 1,
    order: 0,
  })
  .select()
  .single();
```

### 4. Update

```typescript
// ✅ Update fields using snake_case
const { data } = await supabase
  .from('system_categories')
  .update({
    name: 'Updated Name',
    is_editable: false,
    updated_at: new Date().toISOString(),
    version: current_version + 1,
  })
  .eq('_id', id)
  .eq('version', current_version)
  .select()
  .single();
```

---

## Response Data

Supabase returns data with **exact database column names**:

```typescript
// Response from Supabase
const response = {
  _id: 'uuid',
  type: 'SYSTEM_CATEGORY_TYPE',
  code: 'TYPE_USER_ROLE',
  name: 'User Role',
  group_category_id: 'GRP_SYSTEM',      // snake_case
  collection_name: 'system_categories',  // snake_case
  is_system: true,                       // snake_case
  is_editable: false,                    // snake_case
  created_at: '2024-01-09T10:00:00Z',   // snake_case
  updated_at: '2024-01-09T10:00:00Z',   // snake_case
};

// Access directly with snake_case
console.log(response.group_category_id);  // ✅ 'GRP_SYSTEM'
console.log(response.is_editable);        // ✅ false
```

---

## Migration Checklist

When updating code to use snake_case:

### API Layer (`/api/*.ts`)
- [ ] Interface field names → snake_case
- [ ] Query `.eq()` → snake_case column names
- [ ] Query `.select()` → snake_case column names
- [ ] Query `.order()` → snake_case column names
- [ ] Insert objects → snake_case keys
- [ ] Update objects → snake_case keys

### Components (`/components/**/*.tsx`)
- [ ] Form state → snake_case field names
- [ ] Access data properties → snake_case
- [ ] Submit data objects → snake_case keys
- [ ] Display fields → update property access

### Pages (`/pages/**/*.tsx`)
- [ ] State types → use updated interfaces
- [ ] API call results → access with snake_case
- [ ] Pass props → use snake_case

---

## Example: Before & After

### ❌ Before (Incorrect - using camelCase)

```typescript
// Interface
interface SystemCategory {
  groupCategoryId?: string;  // ❌ Wrong
  collectionName?: string;   // ❌ Wrong
  isEditable?: boolean;      // ❌ Wrong
  createdAt?: string;        // ❌ Wrong
}

// Query
.eq('groupCategoryId', 'GRP_SYSTEM')  // ❌ Fails - column doesn't exist

// Access
console.log(category.groupCategoryId);  // ❌ undefined
```

### ✅ After (Correct - using snake_case)

```typescript
// Interface
interface SystemCategory {
  group_category_id?: string;  // ✅ Correct
  collection_name?: string;    // ✅ Correct
  is_editable?: boolean;       // ✅ Correct
  created_at?: string;         // ✅ Correct
}

// Query
.eq('group_category_id', 'GRP_SYSTEM')  // ✅ Works

// Access
console.log(category.group_category_id);  // ✅ 'GRP_SYSTEM'
```

---

## Alternative: Conversion Layer (Not Recommended)

If you absolutely need camelCase in frontend:

```typescript
// Helper to convert snake_case → camelCase
function toCamelCase(obj: any): any {
  const result: any = {};
  for (const key in obj) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = obj[key];
  }
  return result;
}

// Helper to convert camelCase → snake_case
function toSnakeCase(obj: any): any {
  const result: any = {};
  for (const key in obj) {
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    result[snakeKey] = obj[key];
  }
  return result;
}
```

**⚠️ NOT RECOMMENDED**: Adds complexity, performance overhead, and potential bugs. Better to use snake_case everywhere.

---

**Recommendation**: **Use snake_case throughout** to match database exactly. This is the simplest and most reliable approach.

**Version**: 1.0.0  
**Date**: 2026-01-09  
**Status**: ✅ Standard Practice
