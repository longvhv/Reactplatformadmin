# System Categories Database Schema

## Overview
3-Level hierarchy system for managing categories: **Group → Type → Category**

## Database Table: `system_categories`

### Primary Key
- `_id`: UUID (auto-generated primary key)

### Important Fields

#### Field Storage Strategy
⚠️ **CRITICAL**: Reference fields store **CODE**, not UUID!

| Field | Type | Storage Format | Example |
|-------|------|----------------|---------|
| `_id` | UUID | Auto-generated UUID | `5b3e27fb-660b-4469-b74b-f89e106c9d69` |
| `code` | VARCHAR | Unique code string | `GRP_META`, `TYPE_PRODUCT`, `CAT_BASIC` |
| `group_category_id` | VARCHAR | **Stores CODE** | `GRP_META` ❌ NOT UUID |
| `parent_id` | VARCHAR | **Stores CODE** | `TYPE_PRODUCT` ❌ NOT UUID |
| `status` | INT2 | 0 or 1 | `1` (active), `0` (inactive) |

### Why Store CODE instead of UUID?

**Advantages:**
1. ✅ **Human-readable** relationships in database
2. ✅ **Stable references** - codes don't change, UUIDs might regenerate
3. ✅ **Easy debugging** - can see relationships without joins
4. ✅ **Import/Export friendly** - codes are meaningful across environments

**Example:**
```sql
-- ✅ CORRECT: Using CODE
SELECT * FROM system_categories 
WHERE group_category_id = 'GRP_META';

-- ❌ WRONG: Using UUID
SELECT * FROM system_categories 
WHERE group_category_id = '5b3e27fb-660b-4469-b74b-f89e106c9d69';
```

## Hierarchy Structure

### Level 1: Category Groups
```typescript
{
  _id: "uuid-123",
  type: "SYSTEM_CATEGORY_GROUP",
  code: "GRP_META",
  name: "Meta Data",
  status: 1
}
```

### Level 2: Category Types
```typescript
{
  _id: "uuid-456",
  type: "SYSTEM_CATEGORY_TYPE",
  code: "TYPE_PRODUCT",
  name: "Product Type",
  group_category_id: "GRP_META",  // ✅ Stores CODE
  collection_name: "products",
  extra_fields: [...],
  status: 1
}
```

### Level 3: Category Instances
```typescript
{
  _id: "uuid-789",
  type: "TYPE_PRODUCT",
  code: "CAT_SAAS",
  name: "SaaS Product",
  group_category_id: "GRP_META",  // ✅ Stores CODE
  parent_id: null,
  status: 1
}
```

## API Usage

### ✅ CORRECT: Query by CODE
```typescript
// Get types by group CODE
const types = await systemCategoryApi.getTypesByGroup('GRP_META');

// Filter directly by CODE
supabase
  .from('system_categories')
  .select('*')
  .eq('group_category_id', 'GRP_META')
```

### ❌ WRONG: Query by UUID
```typescript
// DON'T DO THIS - Will return empty results
const types = await systemCategoryApi.getTypesByGroup('5b3e27fb-...');
```

## Migration Notes

If you need to change from UUID to CODE storage:

```sql
-- Example migration (NOT NEEDED - already correct)
UPDATE system_categories
SET group_category_id = (
  SELECT code FROM system_categories g 
  WHERE g._id = system_categories.group_category_id::uuid
)
WHERE type = 'SYSTEM_CATEGORY_TYPE';
```

## Related Files
- `/api/systemCategoryApi.ts` - API implementation
- `/hooks/useSystemCategories.ts` - React hooks
- `/components/systemCategories/` - UI components
