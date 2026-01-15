# Reserved Slugs Management System

## Tổng quan
Hệ thống quản lý Reserved Slugs hoàn chỉnh để quản lý các slug/keyword không được phép sử dụng trong toàn hệ thống.

## Tính năng chính

### ✅ 1. Quản lý Reserved Slugs
- **CRUD đầy đủ**: Create, Read, Update, Delete
- **Soft delete**: Xóa mềm với deleted_at
- **Optimistic locking**: Version control để tránh conflict
- **Validation**: Format slug (lowercase, numbers, hyphens only)
- **Check slug**: API để kiểm tra slug có bị reserve không

### ✅ 2. Phân loại Slug
**4 loại (Type):**
- `SYSTEM` - System/technical slugs (admin, api, auth, etc.)
- `BUSINESS` - Business-related slugs (core, app, portal, etc.)
- `OFFENSIVE` - Offensive/inappropriate words
- `FUTURE` - Reserved for future use

**3 cách match (Match Type):**
- `EXACT` - Exact match only
- `PREFIX` - Match if starts with slug
- `REGEX` - Regular expression pattern

### ✅ 3. UI/UX Features
- **Stats cards**: Total, Active, Inactive, Offensive counts
- **Filters**: By type, status, search
- **Batch operations**: Activate/deactivate, delete
- **Detail view**: Full information with metadata
- **Real-time validation**: Slug format check on blur

## Cấu trúc Database

### Table: `reserved_slugs`

```sql
CREATE TABLE reserved_slugs (
    -- Identity
    _id UUID PRIMARY KEY,
    
    -- Slug Info
    slug VARCHAR(100) NOT NULL UNIQUE,
    type VARCHAR(20) NOT NULL DEFAULT 'SYSTEM',
    match_type VARCHAR(20) NOT NULL DEFAULT 'EXACT',
    
    -- Context & Snapshot
    items_snapshot JSONB NOT NULL DEFAULT '{}',
    reason TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    -- Audit & Versioning
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 1,
    deleted_at TIMESTAMPTZ NULL
);
```

### Constraints
- `uq_reserved_slug` - Slug must be unique
- `chk_reserved_slug_format` - Only lowercase, numbers, hyphens
- `chk_reserved_type` - Type must be in (SYSTEM, BUSINESS, OFFENSIVE, FUTURE)
- `chk_match_type` - Match type must be in (EXACT, PREFIX, REGEX)
- `chk_reserved_dates` - updated_at >= created_at
- `chk_reserved_version` - version >= 1

### Indexes
- `idx_reserved_slugs_slug` - Fast slug lookup
- `idx_reserved_slugs_type` - Filter by type
- `idx_reserved_slugs_active` - Filter by is_active
- `idx_reserved_slugs_match_type` - Filter by match type
- `idx_reserved_slugs_type_active` - Composite index
- `idx_reserved_slugs_snapshot` - GIN index for JSONB
- `idx_reserved_slugs_deleted` - Soft delete support

### Seed Data
Migration tự động seed 35+ common reserved slugs:
- System: admin, api, auth, login, logout, signup, dashboard, etc.
- Business: core, app, portal, console
- Offensive: fuck, shit, damn, ass
- Testing: test, demo, sample

## Files Created

### 1. Migration
- `/supabase/migrations/024_create_reserved_slugs_table.sql`

### 2. API Client
- `/api/reservedSlugsApi.ts` - Full API with adapter pattern

### 3. Pages
- `/pages/ReservedSlugsPage.tsx` - List page with stats
- `/pages/AddReservedSlugPage.tsx` - Create new slug
- `/pages/EditReservedSlugPage.tsx` - Edit existing slug
- `/pages/ReservedSlugDetailPage.tsx` - View detail

### 4. Module
- `/modules/reserved-slugs/index.tsx` - Route configuration
- `/modules/reserved-slugs/module.tsx` - Module definition

### 5. Integration
- `/core/moduleRegistration.tsx` - Updated to include module
- `/components/layout/Sidebar.tsx` - Added navigation item

## Routing

All routes prefixed with `/core/`:

- `/core/reserved-slugs` - List page
- `/core/reserved-slugs/add` - Add new slug
- `/core/reserved-slugs/edit/:id` - Edit slug
- `/core/reserved-slugs/:id` - Detail view

## API Operations

### Get All Slugs
```typescript
const slugs = await reservedSlugsApi.getAll({
  type: 'SYSTEM',
  is_active: true
});
```

### Get Slug by ID
```typescript
const slug = await reservedSlugsApi.getById(id);
```

### Check if Slug is Reserved
```typescript
const { reserved, slug } = await reservedSlugsApi.checkSlug('admin');
if (reserved) {
  console.log('Slug is reserved!');
}
```

### Create Slug
```typescript
const slug = await reservedSlugsApi.create({
  slug: 'my-keyword',
  type: 'BUSINESS',
  match_type: 'EXACT',
  reason: 'Reserved for business use',
  is_active: true
});
```

### Update Slug
```typescript
const updated = await reservedSlugsApi.update(id, {
  type: 'SYSTEM',
  is_active: false,
  version: 1
});
```

### Delete Slug (Soft Delete)
```typescript
await reservedSlugsApi.delete(id);
```

### Activate/Deactivate
```typescript
await reservedSlugsApi.activate(id);
await reservedSlugsApi.deactivate(id);
```

### Get Stats
```typescript
const stats = await reservedSlugsApi.getStats();
// {
//   total: 35,
//   active: 30,
//   inactive: 5,
//   byType: { SYSTEM: 25, BUSINESS: 4, OFFENSIVE: 4, FUTURE: 2 },
//   byMatchType: { EXACT: 33, PREFIX: 2, REGEX: 0 }
// }
```

### Batch Create
```typescript
const slugs = await reservedSlugsApi.createBatch([
  { slug: 'keyword1', type: 'SYSTEM' },
  { slug: 'keyword2', type: 'BUSINESS' }
]);
```

## React Hooks

### useReservedSlugs
```typescript
const { slugs, loading, error, refresh } = useReservedSlugs({
  type: 'SYSTEM',
  is_active: true
});
```

### useSlugCheck
```typescript
const { checking, reserved, reservedSlug, check } = useSlugCheck('admin');

// Manual check
await check('my-slug');
```

### useReservedSlugStats
```typescript
const { stats, loading, error, refresh } = useReservedSlugStats();
```

## Helper Functions

### validateSlugFormat
```typescript
const { valid, error } = validateSlugFormat('my-slug');
if (!valid) {
  console.error(error);
}
```

### normalizeSlug
```typescript
const normalized = normalizeSlug('My Slug!!!');
// Returns: 'my-slug'
```

### getTypeColor
```typescript
const color = getTypeColor('SYSTEM');
// Returns: 'bg-blue-100 text-blue-800 ...'
```

### getTypeLabel
```typescript
const label = getTypeLabel('SYSTEM');
// Returns: 'System'
```

### getMatchTypeLabel
```typescript
const label = getMatchTypeLabel('EXACT');
// Returns: 'Exact match'
```

### getMatchTypeIcon
```typescript
const icon = getMatchTypeIcon('PREFIX');
// Returns: '→'
```

## Validation Rules

### Slug Format
- Only lowercase letters (a-z)
- Numbers (0-9)
- Hyphens (-)
- Cannot start or end with hyphen
- Cannot have consecutive hyphens
- Max 100 characters

### Examples
✅ Valid:
- `admin`
- `api-v2`
- `my-keyword-123`

❌ Invalid:
- `Admin` (uppercase)
- `-admin` (starts with hyphen)
- `admin-` (ends with hyphen)
- `admin--panel` (consecutive hyphens)
- `admin_panel` (underscore not allowed)
- `my keyword` (space not allowed)

## Usage Examples

### 1. Add a New Reserved Slug

1. Navigate to `/core/reserved-slugs`
2. Click **[Add Slug]**
3. Fill form:
   - Slug: `my-keyword`
   - Type: `BUSINESS`
   - Match Type: `EXACT`
   - Reason: `Reserved for business use`
   - Active: ✅
4. Click **[Create Reserved Slug]**

### 2. Check if Slug is Available

```typescript
// In your form validation
const checkSlugAvailability = async (slug: string) => {
  const { reserved } = await reservedSlugsApi.checkSlug(slug);
  if (reserved) {
    return 'This slug is reserved and cannot be used';
  }
  return null;
};
```

### 3. Bulk Import Slugs

```typescript
const slugsToImport = [
  { slug: 'keyword1', type: 'BUSINESS', reason: 'Business use' },
  { slug: 'keyword2', type: 'SYSTEM', reason: 'System use' },
  // ... more slugs
];

const created = await reservedSlugsApi.createBatch(slugsToImport);
console.log(`Created ${created.length} slugs`);
```

### 4. Integrate Slug Check in User Input

```typescript
import { useSlugCheck } from '../api/reservedSlugsApi';

function MyForm() {
  const [username, setUsername] = useState('');
  const { reserved, checking } = useSlugCheck(username);

  return (
    <div>
      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      {checking && <span>Checking...</span>}
      {reserved && <span className="text-red-600">Username is reserved</span>}
    </div>
  );
}
```

## Match Type Behaviors

### EXACT Match
```typescript
slug: 'admin'
match_type: 'EXACT'

// Blocks:
'admin'

// Allows:
'admin-panel'
'my-admin'
'admin123'
```

### PREFIX Match
```typescript
slug: 'admin'
match_type: 'PREFIX'

// Blocks:
'admin'
'admin-panel'
'admin123'
'adminxyz'

// Allows:
'my-admin'
'panel-admin'
```

### REGEX Match
```typescript
slug: '^admin(-.*)?$'
match_type: 'REGEX'

// Blocks:
'admin'
'admin-panel'
'admin-anything'

// Allows:
'my-admin'
'admin123' (doesn't match pattern)
```

## How to Run Migration

### Step 1: Run Migration in Supabase
1. Go to **Supabase Dashboard** → **SQL Editor**
2. Copy content from `/supabase/migrations/024_create_reserved_slugs_table.sql`
3. Paste and **Run**
4. Verify: `SELECT COUNT(*) FROM reserved_slugs;` → Should return 35+

### Step 2: Test the Feature
1. Navigate to `/core/reserved-slugs`
2. You should see 35+ pre-seeded slugs
3. Stats cards should show:
   - Total: 35+
   - Active: 35+
   - System: 25+
   - Offensive: 4+

### Step 3: Test CRUD Operations
1. **Create**: Add a new slug
2. **Read**: View slug details
3. **Update**: Edit slug type/status
4. **Delete**: Delete a slug (soft delete)

## Optimistic Locking

The system uses version control to prevent concurrent update conflicts:

```typescript
// User A loads slug (version: 1)
const slug = await reservedSlugsApi.getById(id);

// User A updates
await reservedSlugsApi.update(id, {
  type: 'BUSINESS',
  version: 1 // Send current version
});
// Success! Version becomes 2

// User B tries to update with old version
await reservedSlugsApi.update(id, {
  type: 'SYSTEM',
  version: 1 // Old version
});
// ❌ Error: Version conflict!
// Page auto-reloads with latest data
```

## Security Considerations

### Input Sanitization
- Slug format validated on both client and server
- Type and match_type constrained by enum
- JSONB metadata properly escaped

### Access Control
⚠️ **TODO**: Add RLS policy for production

```sql
ALTER TABLE reserved_slugs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read"
ON reserved_slugs FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow admin write"
ON reserved_slugs FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');
```

### Audit Trail
- `created_at` tracked automatically
- `updated_at` updated via trigger
- `version` incremented on each update
- `deleted_at` for soft delete audit

## Performance Optimization

### Database
- Indexes on commonly queried fields
- GIN index for JSONB queries
- Partial indexes (WHERE deleted_at IS NULL)

### Frontend
- React Query / SWR for caching (optional)
- Debounced slug check (300ms)
- Lazy loading for pages
- Optimistic UI updates

## Golang Migration Readiness

### API Endpoints to Implement

```go
// Reserved Slugs
GET    /api/reserved-slugs
GET    /api/reserved-slugs/:id
GET    /api/reserved-slugs/check/:slug
POST   /api/reserved-slugs
PATCH  /api/reserved-slugs/:id
DELETE /api/reserved-slugs/:id

// Operations
POST   /api/reserved-slugs/:id/activate
POST   /api/reserved-slugs/:id/deactivate
GET    /api/reserved-slugs/stats

// Batch
POST   /api/reserved-slugs/batch
```

### Request/Response Types
TypeScript types in `/api/reservedSlugsApi.ts` can be converted to Go structs:

```go
type ReservedSlug struct {
    ID            uuid.UUID      `json:"_id"`
    Slug          string         `json:"slug"`
    Type          string         `json:"type"`
    MatchType     string         `json:"match_type"`
    ItemsSnapshot map[string]any `json:"items_snapshot"`
    Reason        *string        `json:"reason"`
    IsActive      bool           `json:"is_active"`
    CreatedAt     time.Time      `json:"created_at"`
    UpdatedAt     time.Time      `json:"updated_at"`
    Version       int64          `json:"version"`
    DeletedAt     *time.Time     `json:"deleted_at"`
}
```

## Testing Checklist

### Create
- [ ] Form validation works
- [ ] Slug normalization on blur
- [ ] Duplicate slug check
- [ ] Success creates in DB
- [ ] Redirects to detail page

### Read
- [ ] List loads all slugs
- [ ] Filters work (type, status)
- [ ] Search works
- [ ] Stats cards display correctly
- [ ] Detail page shows all info

### Update
- [ ] Form loads existing data
- [ ] Type/match type can be changed
- [ ] Reason can be updated
- [ ] Optimistic locking works
- [ ] Version conflict handled

### Delete
- [ ] Soft delete (deleted_at set)
- [ ] Confirmation dialog shows
- [ ] Redirects after delete
- [ ] Can't see deleted slugs in list

### Activate/Deactivate
- [ ] Toggle active status
- [ ] Stats update
- [ ] Badge changes color

## Known Limitations

1. **No bulk operations UI**: Must use API directly
2. **No slug import/export**: Would be useful for large datasets
3. **No RLS policy**: Need to add for production
4. **No audit log view**: Only shows created_at/updated_at

## Next Steps (Optional Enhancements)

1. **Bulk Operations UI**
   - Select multiple slugs
   - Bulk activate/deactivate
   - Bulk delete

2. **Import/Export**
   - CSV import
   - JSON export
   - Template download

3. **Advanced Filtering**
   - Date range filter
   - Created by filter
   - Metadata search

4. **Slug Usage Analytics**
   - Show where slug is used
   - Track rejection count
   - Popular slugs chart

5. **RLS Policy**
   - Role-based access
   - Tenant isolation (if needed)

## Troubleshooting

### Issue: Migration fails with "relation already exists"
**Solution**: Drop table first or use `IF NOT EXISTS`

### Issue: Slug check returns false positive
**Solution**: Make sure is_active=true and deleted_at IS NULL in check query

### Issue: Version conflict not handled
**Solution**: EditPage should catch error and auto-reload

### Issue: Sidebar item not showing
**Solution**: Clear browser cache and refresh

## Changelog

### 2026-01-15 - Initial Release
- ✅ Created migration 024
- ✅ Created API client with full CRUD
- ✅ Created all pages (List, Add, Edit, Detail)
- ✅ Created module routes
- ✅ Added to navigation
- ✅ Seeded 35+ common slugs
- ✅ Full documentation

## Authors
- AI Assistant
- Based on vhvplatform/react-framework

## Support
For issues, check:
1. This documentation
2. Migration file comments
3. API client JSDoc comments
