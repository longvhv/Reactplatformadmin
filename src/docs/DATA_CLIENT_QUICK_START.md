# Data Client - Quick Start Guide

Hướng dẫn nhanh cho developers implement pattern mới.

---

## 🚀 TL;DR

**Trước** (Direct Supabase/Fetch):
```typescript
const supabase = createClient(url, key);
const { data } = await supabase.from('tenants').select('*');
```

**Sau** (Data Client Abstraction):
```typescript
import { getDataClient } from '@/lib/data-client/DataClientFactory';

const dataClient = getDataClient();
const result = await dataClient.query<Tenant>('tenants', options);
```

**Lợi ích**: Switch từ Supabase → Golang API chỉ cần đổi 1 dòng config!

---

## 📝 IMPLEMENTATION STEPS

### Step 1: Install Dependencies (Nếu cần)

```bash
# Không cần install thêm gì, sử dụng packages có sẵn
```

### Step 2: Create Data Client Files

Tạo structure sau:

```
/lib/data-client/
  ├── types.ts                    # Interfaces
  ├── SupabaseDataClient.ts       # Supabase implementation
  ├── GolangApiDataClient.ts      # Golang API implementation
  └── DataClientFactory.ts        # Factory & singleton
```

Copy code từ `/docs/DATA_ACCESS_STANDARDIZATION_PLAN.md` sections 1.1-1.4.

### Step 3: Configure Data Client

```typescript
// /app/layout.tsx (hoặc _app.tsx cho Pages Router)

import { DataClientFactory } from '@/lib/data-client/DataClientFactory';
import { projectId, publicAnonKey } from '@/utils/supabase/info';

// Add this BEFORE any component renders
if (typeof window !== 'undefined') {
  DataClientFactory.configure({
    type: 'supabase', // Sẽ đổi thành 'golang-api' sau
    supabase: {
      url: `https://${projectId}.supabase.co`,
      anonKey: publicAnonKey,
    },
  });
}
```

### Step 4: Migrate a Hook (Example: useTenants)

**TRƯỚC:**
```typescript
// /hooks/useTenants.ts (old)

import { createClient } from '@supabase/supabase-js';

export function useTenants() {
  const supabase = createClient(url, key);
  
  const loadTenants = async () => {
    const { data } = await supabase
      .from('tenants')
      .select('*')
      .eq('status', 'ACTIVE');
    
    setTenants(data);
  };
  
  // ... more code
}
```

**SAU:**
```typescript
// /hooks/useTenants.ts (new)

import { getDataClient } from '@/lib/data-client/DataClientFactory';

export function useTenants() {
  const dataClient = getDataClient();
  
  const loadTenants = async () => {
    const result = await dataClient.query<Tenant>('tenants', {
      filters: { status: 'ACTIVE' },
    });
    
    setTenants(result.data);
  };
  
  // ... more code
}
```

### Step 5: Test

```bash
# Run app
npm run dev

# Check console - should see:
# [DataClientFactory] Initialized supabase client

# Test CRUD operations in UI
```

---

## 🔧 COMMON PATTERNS

### Pattern 1: Query List with Filters

```typescript
const result = await dataClient.query<Tenant>('tenants', {
  filters: {
    status: 'ACTIVE',
    tier: 'PREMIUM',
  },
  orderBy: [
    { field: 'created_at', direction: 'desc' }
  ],
  limit: 20,
  offset: 0,
});

console.log(result.data);    // Tenant[]
console.log(result.total);   // number
console.log(result.hasMore); // boolean
```

### Pattern 2: Get Single Record

```typescript
const tenant = await dataClient.get<Tenant>('tenants', tenantId);

if (!tenant) {
  console.log('Not found');
  return;
}

console.log(tenant.name);
```

### Pattern 3: Create Record

```typescript
const newTenant = await dataClient.create<Tenant>('tenants', {
  name: 'New Tenant',
  code: 'NEW_TENANT',
  tier: 'FREE',
  status: 'ACTIVE',
});

console.log(newTenant._id); // Auto-generated UUID
```

### Pattern 4: Update Record

```typescript
const updated = await dataClient.update<Tenant>(
  'tenants',
  tenantId,
  {
    name: 'Updated Name',
    status: 'SUSPENDED',
  }
);

console.log(updated.version); // Incremented
```

### Pattern 5: Delete Record (Soft Delete)

```typescript
await dataClient.delete('tenants', tenantId);
// Sets deleted_at to current timestamp
```

### Pattern 6: Complex Query with Custom Endpoint

```typescript
const stats = await dataClient.execute<TenantStats>(
  `/tenants/${tenantId}/stats`,
  {
    method: 'GET',
    params: {
      from: '2026-01-01',
      to: '2026-01-31',
    },
  }
);
```

---

## 🎯 MIGRATION CHECKLIST (Per Hook)

- [ ] Import `getDataClient` thay vì `createClient`
- [ ] Replace `supabase.from()` với `dataClient.query()`
- [ ] Replace `fetch(API_BASE)` với `dataClient` methods
- [ ] Update error handling (nếu cần)
- [ ] Add TypeScript generics (`<Tenant>`)
- [ ] Test all CRUD operations
- [ ] Test error scenarios
- [ ] Test loading states
- [ ] Update tests (nếu có)
- [ ] Code review
- [ ] Deploy to dev/staging
- [ ] Test in production-like environment

---

## 🔍 DEBUGGING TIPS

### Issue 1: "DataClient not configured"

**Cause**: Factory chưa được configure

**Fix**: Add configuration trong app initialization:
```typescript
DataClientFactory.configure({ ... });
```

### Issue 2: Queries không trả về data

**Debug**:
```typescript
const result = await dataClient.query('tenants', options);
console.log('Query result:', result);
// Check result.data, result.total
```

### Issue 3: TypeScript errors

**Fix**: Always use generics
```typescript
// ❌ Wrong
const result = await dataClient.query('tenants');

// ✅ Correct
const result = await dataClient.query<Tenant>('tenants');
```

### Issue 4: Performance issues

**Solution**: Add caching
```typescript
const loadTenants = async () => {
  // Check cache first
  const cached = getCachedData('tenants');
  if (cached) {
    setTenants(cached);
    // Fetch in background to update
    fetchInBackground();
    return;
  }
  
  // Fetch from data source
  const result = await dataClient.query<Tenant>('tenants');
  setCachedData('tenants', result.data);
  setTenants(result.data);
};
```

---

## 🚦 SWITCH TO GOLANG API

Khi Golang API ready:

### Step 1: Update Environment

```env
# .env.local

# Change this line:
NEXT_PUBLIC_DATA_SOURCE=golang-api

# Add Golang API config:
NEXT_PUBLIC_GOLANG_API_URL=https://api.yourdomain.com/v1
NEXT_PUBLIC_GOLANG_API_KEY=your_api_key_here
```

### Step 2: Update Factory Configuration

```typescript
// /app/layout.tsx

DataClientFactory.configure({
  type: 'golang-api',
  golangApi: {
    baseUrl: process.env.NEXT_PUBLIC_GOLANG_API_URL!,
    apiKey: process.env.NEXT_PUBLIC_GOLANG_API_KEY!,
  },
});
```

### Step 3: Test

```bash
npm run dev

# Check console:
# [DataClientFactory] Initialized golang-api client

# Test all features
```

### Step 4: Monitor & Rollback if Needed

```typescript
// Quick rollback if issues:
DataClientFactory.configure({
  type: 'supabase', // Change back to supabase
  supabase: { ... },
});
```

---

## 📊 COMPARISON: OLD vs NEW

### OLD Pattern (Multiple Styles)

```typescript
// Style 1: Direct Supabase
const supabase = createClient(url, key);
const { data } = await supabase.from('tenants').select('*');

// Style 2: Edge Functions
const response = await fetch(API_BASE, {
  headers: { 'Authorization': `Bearer ${key}` }
});
const result = await response.json();

// ❌ Problems:
// - Inconsistent
// - Hard to switch data sources
// - Tight coupling
// - Difficult to mock/test
```

### NEW Pattern (Unified)

```typescript
// Single pattern for everything
const dataClient = getDataClient();
const result = await dataClient.query<Tenant>('tenants');

// ✅ Benefits:
// - Consistent across all hooks
// - Easy to switch data sources
// - Loose coupling
// - Easy to mock/test
// - Type safe
```

---

## 🧪 TESTING

### Unit Test Example

```typescript
// /hooks/__tests__/useTenants.test.ts

import { renderHook, waitFor } from '@testing-library/react';
import { useTenants } from '../useTenants';
import { DataClientFactory } from '@/lib/data-client/DataClientFactory';

// Mock data client
class MockDataClient {
  async query() {
    return {
      data: [
        { _id: '1', name: 'Tenant 1', status: 'ACTIVE' },
        { _id: '2', name: 'Tenant 2', status: 'ACTIVE' },
      ],
      total: 2,
    };
  }
}

describe('useTenants', () => {
  beforeEach(() => {
    // Inject mock
    DataClientFactory.configure({
      type: 'supabase',
      supabase: { url: 'test', anonKey: 'test' },
    });
    // Override with mock
    (DataClientFactory as any).instance = new MockDataClient();
  });

  afterEach(() => {
    DataClientFactory.reset();
  });

  it('should load tenants', async () => {
    const { result } = renderHook(() => useTenants());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.tenants).toHaveLength(2);
    expect(result.current.tenants[0].name).toBe('Tenant 1');
  });
});
```

---

## 💡 PRO TIPS

### Tip 1: Use React Query (Optional)

```typescript
import { useQuery } from '@tanstack/react-query';
import { getDataClient } from '@/lib/data-client/DataClientFactory';

export function useTenants() {
  const dataClient = getDataClient();

  return useQuery({
    queryKey: ['tenants'],
    queryFn: () => dataClient.query<Tenant>('tenants'),
  });
}

// Benefits: Auto caching, refetching, pagination, etc.
```

### Tip 2: Create Resource Hooks

```typescript
// /hooks/useResource.ts

export function useResource<T>(resource: string) {
  const dataClient = getDataClient();
  
  const query = (options) => dataClient.query<T>(resource, options);
  const get = (id) => dataClient.get<T>(resource, id);
  const create = (data) => dataClient.create<T>(resource, data);
  const update = (id, data) => dataClient.update<T>(resource, id, data);
  const remove = (id) => dataClient.delete(resource, id);
  
  return { query, get, create, update, remove };
}

// Usage:
const { query, create } = useResource<Tenant>('tenants');
```

### Tip 3: Add Request Interceptors

```typescript
// /lib/data-client/SupabaseDataClient.ts

class SupabaseDataClient {
  private beforeRequest(resource: string, operation: string) {
    console.log(`[DataClient] ${operation} ${resource}`);
    // Add logging, analytics, etc.
  }
  
  async query<T>(resource: string, options?: QueryOptions) {
    this.beforeRequest(resource, 'QUERY');
    // ... rest of implementation
  }
}
```

---

## 📚 RESOURCES

- **Full Plan**: `/docs/DATA_ACCESS_STANDARDIZATION_PLAN.md`
- **Type Definitions**: `/lib/data-client/types.ts`
- **Examples**: `/hooks/useTenants.ts` (after migration)

---

## ❓ FAQ

**Q: Có bắt buộc phải migrate tất cả hooks không?**  
A: Không, có thể migrate từng hook một. Old và new patterns có thể coexist.

**Q: Migrate mất bao lâu?**  
A: ~15-30 phút cho 1 hook đơn giản, ~1-2 giờ cho hook phức tạp.

**Q: Nếu có bug thì sao?**  
A: Rollback bằng cách revert hook về version cũ. Data client không ảnh hưởng hooks khác.

**Q: Performance có giảm không?**  
A: Không, abstraction layer rất lightweight. Có thể faster nhờ caching.

**Q: Có thể dùng cho Edge Functions không?**  
A: Có, implement `execute()` method cho custom endpoints.

**Q: Supabase RLS còn hoạt động không?**  
A: Có, RLS vẫn hoạt động bình thường với `publicAnonKey`.

---

**Happy Coding!** 🚀
