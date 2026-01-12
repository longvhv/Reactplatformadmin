# Migration Guide: camelCase → snake_case

## Overview

**Date**: 2026-01-09  
**Impact**: Breaking change - Tất cả column names đổi từ camelCase sang snake_case  
**Reason**: Follow PostgreSQL standard conventions và SQL best practices

---

## Database Changes

### Updated Migration Files

✅ **003_restructure_system_categories.sql**
- Primary key: `id` → `_id`
- Columns: `"createdAt"` → `created_at`, `"isSystem"` → `is_system`, etc.

✅ **004_create_regions_table.sql**
- Primary key: `id` → `_id`
- Foreign key: `"parentId"` → `parent_id`
- Columns: `"startDate"` → `start_date`, `"historyData"` → `history_data`, etc.

✅ **005_create_app_components_table.sql**
- Primary key: `id` → `_id`
- Columns: `"componentId"` → `component_id`, `"componentType"` → `component_type`, etc.

✅ **006_create_tenants_table.sql**
- Primary key: `id` → `_id`
- Columns: `"subscriptionTier"` → `subscription_tier`, `"billingEmail"` → `billing_email`, etc.

---

## Frontend Changes Required

### 1. TypeScript Interfaces

**Before:**
```typescript
interface SystemCategory {
  id: string;
  createdAt: string;
  updatedAt: string;
  isSystem: boolean;
  isEditable: boolean;
  groupCategoryId: string;
  collectionName: string;
  extraFields: any[];
}
```

**After:**
```typescript
interface SystemCategory {
  _id: string;
  created_at: string;
  updated_at: string;
  is_system: boolean;
  is_editable: boolean;
  group_category_id: string;
  collection_name: string;
  extra_fields: any[];
}
```

### 2. API Layer

**Option A: Convert at API boundary (Recommended)**
```typescript
// api/systemCategoryApi.ts
export const systemCategoryApi = {
  async getAll() {
    const response = await fetch('/api/categories');
    const data = await response.json();
    
    // Convert snake_case to camelCase for frontend
    return data.map(convertToCamelCase);
  },
  
  async create(category: SystemCategory) {
    // Convert camelCase to snake_case for backend
    const payload = convertToSnakeCase(category);
    return await fetch('/api/categories', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }
};

function convertToCamelCase(obj: any): any {
  const result: any = {};
  for (const key in obj) {
    const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
    result[camelKey] = obj[key];
  }
  return result;
}

function convertToSnakeCase(obj: any): any {
  const result: any = {};
  for (const key in obj) {
    const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    result[snakeKey] = obj[key];
  }
  return result;
}
```

**Option B: Use snake_case throughout (Simpler)**
```typescript
// Just update all interfaces to use snake_case
// No conversion needed
```

### 3. Component Props

Update all component props that reference these fields:

```typescript
// Before
<CategoryCard 
  id={category.id}
  createdAt={category.createdAt}
  isSystem={category.isSystem}
/>

// After
<CategoryCard 
  _id={category._id}
  created_at={category.created_at}
  is_system={category.is_system}
/>
```

---

## Backend Changes Required

### 1. Golang Structs

**Before:**
```go
type SystemCategory struct {
    ID              string    `json:"id" db:"id"`
    CreatedAt       time.Time `json:"createdAt" db:"createdAt"`
    UpdatedAt       time.Time `json:"updatedAt" db:"updatedAt"`
    IsSystem        bool      `json:"isSystem" db:"isSystem"`
    IsEditable      bool      `json:"isEditable" db:"isEditable"`
    GroupCategoryID string    `json:"groupCategoryId" db:"groupCategoryId"`
}
```

**After:**
```go
type SystemCategory struct {
    ID              string    `json:"_id" db:"_id"`
    CreatedAt       time.Time `json:"created_at" db:"created_at"`
    UpdatedAt       time.Time `json:"updated_at" db:"updated_at"`
    IsSystem        bool      `json:"is_system" db:"is_system"`
    IsEditable      bool      `json:"is_editable" db:"is_editable"`
    GroupCategoryID string    `json:"group_category_id" db:"group_category_id"`
}
```

### 2. SQL Queries

**Before:**
```go
query := `
    SELECT id, "createdAt", "updatedAt", "isSystem"
    FROM system_categories
    WHERE "isEditable" = $1
`
```

**After:**
```go
query := `
    SELECT _id, created_at, updated_at, is_system
    FROM system_categories
    WHERE is_editable = $1
`
```

### 3. API Responses

Option to keep camelCase in JSON responses:

```go
type SystemCategory struct {
    ID         string    `json:"id" db:"_id"`          // Different json vs db
    CreatedAt  time.Time `json:"createdAt" db:"created_at"`
    UpdatedAt  time.Time `json:"updatedAt" db:"updated_at"`
    IsSystem   bool      `json:"isSystem" db:"is_system"`
}
```

---

## Testing Checklist

### Database

- [ ] Run all migration files on clean database
- [ ] Verify all tables created with correct schema
- [ ] Check all indexes created properly
- [ ] Test foreign key constraints
- [ ] Verify triggers working (updated_at)
- [ ] Test sample data inserts

### Backend API

- [ ] Update all struct tags
- [ ] Update all SQL queries
- [ ] Test GET /api/categories
- [ ] Test POST /api/categories
- [ ] Test PUT /api/categories/:id
- [ ] Test DELETE /api/categories/:id
- [ ] Verify JSON responses match expected format

### Frontend

- [ ] Update all TypeScript interfaces
- [ ] Update API layer
- [ ] Test all CRUD operations
- [ ] Check form submissions
- [ ] Verify table displays
- [ ] Test filters and search
- [ ] Check detail views
- [ ] Test edit forms

---

## Rollback Plan

If issues occur, can temporarily add database views with old column names:

```sql
CREATE VIEW system_categories_legacy AS
SELECT 
  _id as id,
  created_at as "createdAt",
  updated_at as "updatedAt",
  is_system as "isSystem",
  is_editable as "isEditable",
  group_category_id as "groupCategoryId"
FROM system_categories;
```

Then update backend to query from `system_categories_legacy` while fixing issues.

---

## Migration Steps

### 1. Database Migration
```bash
# Backup current database
pg_dump -U postgres -d mydb > backup_before_snake_case.sql

# Run new migrations
psql -U postgres -d mydb -f 003_restructure_system_categories.sql
psql -U postgres -d mydb -f 004_create_regions_table.sql
psql -U postgres -d mydb -f 005_create_app_components_table.sql
psql -U postgres -d mydb -f 006_create_tenants_table.sql

# Verify
psql -U postgres -d mydb -c "\d system_categories"
```

### 2. Backend Update
```bash
# Update all Golang files
# Search and replace in all .go files:
# "db:\"id\"" → "db:\"_id\""
# "db:\"createdAt\"" → "db:\"created_at\""
# etc.

# Rebuild and test
go build ./...
go test ./...
```

### 3. Frontend Update
```bash
# Update all TypeScript interfaces
# Either:
# A) Add conversion functions in API layer
# B) Update all interfaces to snake_case

npm run type-check
npm run test
npm run build
```

### 4. Integration Testing
```bash
# Start backend
./backend-server

# Start frontend
npm run dev

# Run E2E tests
npm run test:e2e
```

---

## Common Issues & Solutions

### Issue 1: "column does not exist"
**Error**: `ERROR: column "createdAt" does not exist`

**Solution**: Column name changed to `created_at`. Update your query.

### Issue 2: Foreign key constraint violation
**Error**: `ERROR: insert or update on table violates foreign key constraint`

**Solution**: Foreign keys now reference `_id` instead of `id`. Update references.

### Issue 3: TypeScript type errors
**Error**: `Property 'createdAt' does not exist on type 'SystemCategory'`

**Solution**: Update interface to use snake_case or add conversion layer.

### Issue 4: JSON serialization mismatch
**Error**: Frontend expects camelCase but receives snake_case

**Solution**: 
- Option A: Add conversion in API layer
- Option B: Update backend JSON tags to use camelCase
- Option C: Update frontend to accept snake_case

---

## Recommended Approach

**For new projects**: Use snake_case everywhere (DB + API + Frontend)

**For existing projects**: Add conversion layer at API boundary
- Database: snake_case
- Backend: snake_case internally
- API JSON: camelCase (for backwards compatibility)
- Frontend: camelCase

```typescript
// Conversion utility
export const apiClient = {
  async get(url: string) {
    const response = await fetch(url);
    const data = await response.json();
    return toCamelCase(data);
  },
  async post(url: string, data: any) {
    const payload = toSnakeCase(data);
    return await fetch(url, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }
};
```

---

## Documentation Updates

Updated files:
- ✅ `/DATABASE_SCHEMA_STANDARD.md` - Full schema standard with snake_case
- ✅ `/supabase/migrations/*.sql` - All migration files updated
- ✅ `/MIGRATION_GUIDE_SNAKE_CASE.md` - This guide

---

**Questions?** Check `/DATABASE_SCHEMA_STANDARD.md` for complete reference.

**Last Updated**: 2026-01-09
