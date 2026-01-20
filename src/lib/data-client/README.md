# Data Client Library

Abstraction layer for data access operations. Switch seamlessly between Supabase and Golang API.

---

## 📦 Files

- **`types.ts`** - Type definitions and interfaces
- **`SupabaseDataClient.ts`** - Supabase implementation (current)
- **`GolangApiDataClient.ts`** - Golang API implementation (future)
- **`DataClientFactory.ts`** - Singleton factory to manage instances
- **`index.ts`** - Main exports

---

## 🚀 Quick Start

### 1. Initialization (Already Done)

The DataClientFactory is initialized in `/components/providers/DataClientProvider.tsx`:

```typescript
DataClientFactory.configure({
  type: 'supabase',
  supabase: {
    url: `https://${projectId}.supabase.co`,
    anonKey: publicAnonKey,
  },
});
```

### 2. Usage in Hooks

```typescript
import { getDataClient } from '@/lib/data-client';
import type { Tenant } from '@/data/tenants';

export function useTenants() {
  const dataClient = getDataClient();

  const loadTenants = async () => {
    const result = await dataClient.query<Tenant>('tenants', {
      filters: { status: 'ACTIVE' },
      orderBy: [{ field: 'created_at', direction: 'desc' }],
      limit: 20,
    });
    
    console.log(result.data); // Tenant[]
    console.log(result.total); // number
  };

  // ... more code
}
```

---

## 📖 API Reference

### Query Operations

#### `query<T>(resource, options)`

Query multiple records.

```typescript
const result = await dataClient.query<Tenant>('tenants', {
  filters: { 
    status: 'ACTIVE',
    tier: 'PREMIUM' 
  },
  orderBy: [{ field: 'created_at', direction: 'desc' }],
  limit: 20,
  offset: 0,
});

// result.data: Tenant[]
// result.total: number
// result.hasMore: boolean
// result.nextOffset: number | undefined
```

#### `get<T>(resource, id)`

Get a single record by ID.

```typescript
const tenant = await dataClient.get<Tenant>('tenants', tenantId);

if (!tenant) {
  console.log('Not found');
}
```

### Mutation Operations

#### `create<T>(resource, data)`

Create a new record.

```typescript
const newTenant = await dataClient.create<Tenant>('tenants', {
  name: 'New Tenant',
  code: 'NEW_TENANT',
  tier: 'FREE',
  status: 'ACTIVE',
});

// _id, created_at, version are auto-generated
```

#### `update<T>(resource, id, data)`

Update an existing record (with optimistic locking).

```typescript
const updated = await dataClient.update<Tenant>('tenants', tenantId, {
  name: 'Updated Name',
  status: 'SUSPENDED',
});

// version is auto-incremented
```

#### `delete(resource, id)`

Soft delete a record.

```typescript
await dataClient.delete('tenants', tenantId);
// Sets deleted_at to current timestamp
```

### Advanced Operations

#### `execute<T>(endpoint, options)`

Execute custom RPC or endpoint.

```typescript
const stats = await dataClient.execute<TenantStats>(
  'get_tenant_stats',
  {
    body: { tenant_id: tenantId },
  }
);
```

---

## 🎯 Filter Options

### Simple Filters

```typescript
{
  filters: {
    status: 'ACTIVE',
    tier: 'PREMIUM',
  }
}
```

### Advanced Filters

```typescript
{
  filters: [
    { field: 'status', operator: 'eq', value: 'ACTIVE' },
    { field: 'created_at', operator: 'gte', value: '2026-01-01' },
    { field: 'name', operator: 'ilike', value: '%search%' },
  ]
}
```

### Available Operators

- `eq` - Equal
- `neq` - Not equal
- `gt` - Greater than
- `gte` - Greater than or equal
- `lt` - Less than
- `lte` - Less than or equal
- `like` - Pattern match (case-sensitive)
- `ilike` - Pattern match (case-insensitive)
- `in` - In array
- `is` - IS (for NULL checks)
- `not` - Not equal

---

## 🔧 Configuration

### Current: Supabase

```typescript
DataClientFactory.configure({
  type: 'supabase',
  supabase: {
    url: 'https://xxx.supabase.co',
    anonKey: 'xxx',
  },
});
```

### Future: Golang API

```typescript
DataClientFactory.configure({
  type: 'golang-api',
  golangApi: {
    baseUrl: 'https://api.yourdomain.com/v1',
    apiKey: 'xxx',
  },
});
```

**No code changes needed in hooks!** Just update configuration.

---

## 🧪 Testing

### Mock DataClient

```typescript
import { DataClientFactory } from '@/lib/data-client';

// Create mock
const mockClient = {
  query: jest.fn().mockResolvedValue({
    data: [{ _id: '1', name: 'Test' }],
    total: 1,
  }),
  get: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  execute: jest.fn(),
};

// Inject mock
DataClientFactory.configure({ type: 'supabase', supabase: { url: '', anonKey: '' } });
(DataClientFactory as any).instance = mockClient;

// Test hook
const { result } = renderHook(() => useTenants());
// ...
```

---

## ⚠️ Important Notes

### Optimistic Locking

All updates use optimistic locking via the `version` field:

```typescript
// This will fail if another user updated the record
await dataClient.update('tenants', id, { name: 'New Name' });
// Throws OptimisticLockError if version mismatch
```

### Soft Deletes

All deletes are soft deletes (set `deleted_at`):

```typescript
await dataClient.delete('tenants', id);
// Record still exists with deleted_at timestamp

// Query excludes soft-deleted by default
const result = await dataClient.query('tenants');

// Include soft-deleted
const result = await dataClient.query('tenants', {
  includeDeleted: true,
});
```

### Field Constraints

Based on `/docs/Tables.md`:

- `_id` - UUID (auto-generated on create)
- `created_at` - Timestamp (auto-set on create)
- `updated_at` - Timestamp (auto-set on update)
- `deleted_at` - Timestamp (set on soft delete)
- `version` - Bigint (starts at 1, increments on update)
- `created_by`, `updated_by`, `deleted_by` - User UUIDs

---

## 📚 Related Documentation

- **Full Plan**: `/docs/DATA_ACCESS_STANDARDIZATION_PLAN.md`
- **Quick Start**: `/docs/DATA_CLIENT_QUICK_START.md`
- **Roadmap**: `/docs/DATA_ACCESS_IMPLEMENTATION_ROADMAP.md`
- **Database Schema**: `/docs/Tables.md`

---

## ✅ Phase 1 Complete!

- ✅ Types defined
- ✅ SupabaseDataClient implemented
- ✅ GolangApiDataClient skeleton created
- ✅ DataClientFactory created
- ✅ Initialized in app
- ✅ Ready to use in hooks

**Next**: Phase 2 - Migrate pilot hooks (useTenants, useTenant)
