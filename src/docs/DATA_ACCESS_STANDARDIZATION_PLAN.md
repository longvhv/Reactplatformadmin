# Data Access Layer - Kế hoạch Chuẩn hóa
## Mục tiêu: Dễ dàng migrate từ Supabase → Golang API

---

## 🎯 MỤC TIÊU

1. ✅ **Hoạt động ổn định** với Supabase hiện tại (anon key)
2. ✅ **Dễ dàng migrate** sang Golang API sau này
3. ✅ **Consistency** - Tất cả hooks theo cùng 1 pattern
4. ✅ **Testability** - Dễ mock và test
5. ✅ **Type Safety** - Full TypeScript support
6. ✅ **Zero downtime migration** - Switch từ Supabase → Golang không cần rewrite hooks

---

## 📊 HIỆN TRẠNG

### Pattern 1: Supabase Client (useTenants)
```typescript
const supabase = createClient(SUPABASE_URL, publicAnonKey);
const { data } = await supabase.from('tenants').select('*');
```

### Pattern 2: Edge Functions API (useTenant, useTenantMembers)
```typescript
const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-7eedb4e0/api/core/tenants`;
const response = await fetch(API_BASE, {
  headers: { 'Authorization': `Bearer ${publicAnonKey}` }
});
```

### Vấn đề:
- ❌ **Không nhất quán** - 2 patterns khác nhau
- ❌ **Khó migrate** - Phải sửa từng hook khi chuyển sang Golang API
- ❌ **Coupling cao** - Hooks biết quá nhiều về data source

---

## 🏗️ KIẾN TRÚC MỤC TIÊU

```
┌─────────────────────────────────────────────┐
│      React Components / Pages               │
└──────────────────┬──────────────────────────┘
                   │ uses
┌──────────────────▼──────────────────────────┐
│        Custom Hooks Layer                   │
│  (useTenants, useUsers, useRoles, etc.)     │
│  - State management                         │
│  - Caching                                  │
│  - Error handling                           │
└──────────────────┬──────────────────────────┘
                   │ uses
┌──────────────────▼──────────────────────────┐
│      Data Client (Abstract Interface)       │
│        IDataClient                          │
│  - query<T>(resource, filters)              │
│  - get<T>(resource, id)                     │
│  - create<T>(resource, data)                │
│  - update<T>(resource, id, data)            │
│  - delete(resource, id)                     │
└──────────────────┬──────────────────────────┘
                   │ implements
       ┌───────────┴─────────────┐
       │                         │
┌──────▼──────────┐   ┌──────────▼──────────┐
│  Supabase       │   │   Golang API        │
│  DataClient     │   │   DataClient        │
│  (hiện tại)     │   │   (tương lai)       │
└─────────────────┘   └─────────────────────┘
```

---

## 📝 IMPLEMENTATION PLAN

### Phase 1: Tạo Abstraction Layer (1-2 ngày)

#### 1.1 Interface Definition
```typescript
// /lib/data-client/types.ts

export interface QueryOptions {
  filters?: Record<string, any>;
  orderBy?: { field: string; direction: 'asc' | 'desc' }[];
  limit?: number;
  offset?: number;
  select?: string | string[];
}

export interface QueryResult<T> {
  data: T[];
  total?: number;
  hasMore?: boolean;
}

export interface IDataClient {
  // Query multiple records
  query<T>(
    resource: string,
    options?: QueryOptions
  ): Promise<QueryResult<T>>;

  // Get single record
  get<T>(
    resource: string,
    id: string
  ): Promise<T | null>;

  // Create record
  create<T>(
    resource: string,
    data: Partial<T>
  ): Promise<T>;

  // Update record
  update<T>(
    resource: string,
    id: string,
    data: Partial<T>
  ): Promise<T>;

  // Delete record (soft delete)
  delete(
    resource: string,
    id: string
  ): Promise<void>;

  // Advanced: Execute custom query
  execute<T>(
    endpoint: string,
    options?: {
      method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
      body?: any;
      params?: Record<string, string>;
    }
  ): Promise<T>;
}
```

#### 1.2 Supabase Implementation
```typescript
// /lib/data-client/SupabaseDataClient.ts

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { IDataClient, QueryOptions, QueryResult } from './types';

export class SupabaseDataClient implements IDataClient {
  private client: SupabaseClient;

  constructor(url: string, anonKey: string) {
    this.client = createClient(url, anonKey);
  }

  async query<T>(
    resource: string,
    options?: QueryOptions
  ): Promise<QueryResult<T>> {
    let query = this.client
      .from(resource)
      .select(this.buildSelect(options?.select), { count: 'exact' })
      .is('deleted_at', null);

    // Apply filters
    if (options?.filters) {
      query = this.applyFilters(query, options.filters);
    }

    // Apply sorting
    if (options?.orderBy) {
      options.orderBy.forEach(({ field, direction }) => {
        query = query.order(field, { ascending: direction === 'asc' });
      });
    }

    // Apply pagination
    if (options?.limit !== undefined) {
      const offset = options.offset || 0;
      query = query.range(offset, offset + options.limit - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error(`[SupabaseDataClient] Query error on ${resource}:`, error);
      throw new Error(error.message || `Failed to query ${resource}`);
    }

    return {
      data: (data || []) as T[],
      total: count || undefined,
      hasMore: options?.limit 
        ? (count || 0) > (options.offset || 0) + options.limit
        : false,
    };
  }

  async get<T>(resource: string, id: string): Promise<T | null> {
    const { data, error } = await this.client
      .from(resource)
      .select('*')
      .eq('_id', id)
      .is('deleted_at', null)
      .single();

    if (error) {
      // PGRST116 = not found
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error(`[SupabaseDataClient] Get error on ${resource}:`, error);
      throw new Error(error.message || `Failed to get ${resource}`);
    }

    return data as T;
  }

  async create<T>(resource: string, data: Partial<T>): Promise<T> {
    const insertData = {
      _id: crypto.randomUUID(),
      ...data,
      created_at: new Date().toISOString(),
      version: 1,
    };

    const { data: result, error } = await this.client
      .from(resource)
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error(`[SupabaseDataClient] Create error on ${resource}:`, error);
      throw new Error(error.message || `Failed to create ${resource}`);
    }

    return result as T;
  }

  async update<T>(
    resource: string,
    id: string,
    data: Partial<T>
  ): Promise<T> {
    // Get current version for optimistic locking
    const current = await this.get<any>(resource, id);
    if (!current) {
      throw new Error(`${resource} not found`);
    }

    const updateData: any = {
      ...data,
      updated_at: new Date().toISOString(),
      version: current.version + 1,
    };

    // Remove immutable fields
    delete updateData._id;
    delete updateData.created_at;
    delete updateData.created_by;

    const { data: result, error } = await this.client
      .from(resource)
      .update(updateData)
      .eq('_id', id)
      .eq('version', current.version)
      .select()
      .single();

    if (error) {
      console.error(`[SupabaseDataClient] Update error on ${resource}:`, error);
      throw new Error(error.message || `Failed to update ${resource}`);
    }

    return result as T;
  }

  async delete(resource: string, id: string): Promise<void> {
    const { error } = await this.client
      .from(resource)
      .update({
        deleted_at: new Date().toISOString(),
      })
      .eq('_id', id)
      .is('deleted_at', null);

    if (error) {
      console.error(`[SupabaseDataClient] Delete error on ${resource}:`, error);
      throw new Error(error.message || `Failed to delete ${resource}`);
    }
  }

  async execute<T>(
    endpoint: string,
    options?: {
      method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
      body?: any;
      params?: Record<string, string>;
    }
  ): Promise<T> {
    // For custom RPC calls or complex queries
    const { data, error } = await this.client.rpc(endpoint, options?.body);

    if (error) {
      console.error(`[SupabaseDataClient] Execute error on ${endpoint}:`, error);
      throw new Error(error.message || `Failed to execute ${endpoint}`);
    }

    return data as T;
  }

  // Helper methods
  private buildSelect(select?: string | string[]): string {
    if (!select) return '*';
    if (Array.isArray(select)) return select.join(',');
    return select;
  }

  private applyFilters(query: any, filters: Record<string, any>): any {
    Object.entries(filters).forEach(([key, value]) => {
      if (value === undefined || value === 'all') return;
      
      // Handle special operators
      if (typeof value === 'object' && value !== null) {
        // { operator: 'gt', value: 10 }
        const { operator, value: filterValue } = value;
        query = query[operator](key, filterValue);
      } else {
        // Simple equality
        query = query.eq(key, value);
      }
    });
    return query;
  }
}
```

#### 1.3 Golang API Implementation (Skeleton)
```typescript
// /lib/data-client/GolangApiDataClient.ts

import type { IDataClient, QueryOptions, QueryResult } from './types';

export class GolangApiDataClient implements IDataClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.apiKey = apiKey;
  }

  async query<T>(
    resource: string,
    options?: QueryOptions
  ): Promise<QueryResult<T>> {
    const url = this.buildUrl(`/${resource}`, options);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to query ${resource}: ${response.statusText}`);
    }

    const result = await response.json();
    
    // Golang API format: { data: [...], total: 100, has_more: true }
    return {
      data: result.data || [],
      total: result.total,
      hasMore: result.has_more,
    };
  }

  async get<T>(resource: string, id: string): Promise<T | null> {
    const response = await fetch(`${this.baseUrl}/${resource}/${id}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Failed to get ${resource}: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data || result;
  }

  async create<T>(resource: string, data: Partial<T>): Promise<T> {
    const response = await fetch(`${this.baseUrl}/${resource}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to create ${resource}: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data || result;
  }

  async update<T>(
    resource: string,
    id: string,
    data: Partial<T>
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}/${resource}/${id}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to update ${resource}: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data || result;
  }

  async delete(resource: string, id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${resource}/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete ${resource}: ${response.statusText}`);
    }
  }

  async execute<T>(
    endpoint: string,
    options?: {
      method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
      body?: any;
      params?: Record<string, string>;
    }
  ): Promise<T> {
    const url = this.buildUrl(endpoint, { filters: options?.params });
    
    const response = await fetch(url, {
      method: options?.method || 'GET',
      headers: this.getHeaders(),
      body: options?.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`Failed to execute ${endpoint}: ${response.statusText}`);
    }

    return response.json();
  }

  // Helper methods
  private getHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  private buildUrl(path: string, options?: QueryOptions): string {
    const url = new URL(`${this.baseUrl}${path}`);
    
    // Add filters as query params
    if (options?.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== 'all') {
          url.searchParams.append(key, String(value));
        }
      });
    }

    // Add sorting
    if (options?.orderBy && options.orderBy.length > 0) {
      const orderBy = options.orderBy
        .map(({ field, direction }) => `${field}:${direction}`)
        .join(',');
      url.searchParams.append('order_by', orderBy);
    }

    // Add pagination
    if (options?.limit !== undefined) {
      url.searchParams.append('limit', String(options.limit));
    }
    if (options?.offset !== undefined) {
      url.searchParams.append('offset', String(options.offset));
    }

    // Add select fields
    if (options?.select) {
      const fields = Array.isArray(options.select)
        ? options.select.join(',')
        : options.select;
      url.searchParams.append('fields', fields);
    }

    return url.toString();
  }
}
```

#### 1.4 Factory & Configuration
```typescript
// /lib/data-client/DataClientFactory.ts

import { IDataClient } from './types';
import { SupabaseDataClient } from './SupabaseDataClient';
import { GolangApiDataClient } from './GolangApiDataClient';

type DataSourceType = 'supabase' | 'golang-api';

interface DataClientConfig {
  type: DataSourceType;
  supabase?: {
    url: string;
    anonKey: string;
  };
  golangApi?: {
    baseUrl: string;
    apiKey: string;
  };
}

export class DataClientFactory {
  private static instance: IDataClient | null = null;
  private static config: DataClientConfig | null = null;

  static configure(config: DataClientConfig): void {
    this.config = config;
    this.instance = null; // Reset instance when config changes
  }

  static getClient(): IDataClient {
    if (this.instance) {
      return this.instance;
    }

    if (!this.config) {
      // Default config from environment
      this.config = this.getDefaultConfig();
    }

    switch (this.config.type) {
      case 'supabase':
        if (!this.config.supabase) {
          throw new Error('Supabase config is required');
        }
        this.instance = new SupabaseDataClient(
          this.config.supabase.url,
          this.config.supabase.anonKey
        );
        break;

      case 'golang-api':
        if (!this.config.golangApi) {
          throw new Error('Golang API config is required');
        }
        this.instance = new GolangApiDataClient(
          this.config.golangApi.baseUrl,
          this.config.golangApi.apiKey
        );
        break;

      default:
        throw new Error(`Unknown data source type: ${this.config.type}`);
    }

    console.log(`[DataClientFactory] Initialized ${this.config.type} client`);
    return this.instance;
  }

  static reset(): void {
    this.instance = null;
    this.config = null;
  }

  private static getDefaultConfig(): DataClientConfig {
    const type = (process.env.NEXT_PUBLIC_DATA_SOURCE || 'supabase') as DataSourceType;

    if (type === 'supabase') {
      return {
        type: 'supabase',
        supabase: {
          url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
          anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        },
      };
    }

    if (type === 'golang-api') {
      return {
        type: 'golang-api',
        golangApi: {
          baseUrl: process.env.NEXT_PUBLIC_GOLANG_API_URL || '',
          apiKey: process.env.NEXT_PUBLIC_GOLANG_API_KEY || '',
        },
      };
    }

    throw new Error(`Invalid data source type: ${type}`);
  }
}

// Export singleton getter
export const getDataClient = () => DataClientFactory.getClient();
```

---

### Phase 2: Migrate Hooks (2-3 ngày)

#### 2.1 Updated useTenants Hook
```typescript
// /hooks/useTenants.ts

import { useState, useEffect, useCallback } from 'react';
import { getDataClient } from '@/lib/data-client/DataClientFactory';
import type { Tenant, TenantStatus, TenantTier } from '@/data/tenants';

interface UseTenantsParams {
  status?: TenantStatus | 'all';
  tier?: TenantTier | 'all';
  autoLoad?: boolean;
  limit?: number;
  offset?: number;
}

export function useTenants(params: UseTenantsParams = {}) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState<number | undefined>();

  const dataClient = getDataClient();

  const loadTenants = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Check cache first
      const cachedData = localStorage.getItem('tenants_cache');
      if (cachedData) {
        const cached = JSON.parse(cachedData);
        const cacheAge = Date.now() - cached.timestamp;
        
        if (cacheAge < 5 * 60 * 1000) { // 5 minutes
          setTenants(cached.data);
          setTotal(cached.total);
          setLoading(false);
          
          // Fetch in background to update cache
          fetchFromDataSource(true);
          return;
        }
      }

      // Fetch from data source
      await fetchFromDataSource(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load tenants';
      setError(message);
      console.error('[useTenants] Error:', err);
      
      // Try using cached data on error
      const cachedData = localStorage.getItem('tenants_cache');
      if (cachedData) {
        const cached = JSON.parse(cachedData);
        setTenants(cached.data);
        setTotal(cached.total);
      }
    } finally {
      setLoading(false);
    }
  }, [params.status, params.tier, params.limit, params.offset]);

  const fetchFromDataSource = async (isBackgroundUpdate: boolean) => {
    try {
      const result = await dataClient.query<Tenant>('tenants', {
        filters: {
          status: params.status,
          tier: params.tier,
        },
        orderBy: [{ field: 'created_at', direction: 'desc' }],
        limit: params.limit,
        offset: params.offset,
      });

      // Update state
      setTenants(result.data);
      setTotal(result.total);

      // Update cache
      localStorage.setItem('tenants_cache', JSON.stringify({
        data: result.data,
        total: result.total,
        timestamp: Date.now(),
      }));

      if (!isBackgroundUpdate) {
        setLoading(false);
      }
    } catch (err) {
      if (!isBackgroundUpdate) {
        throw err;
      }
      console.error('[useTenants] Background fetch error:', err);
    }
  };

  const createTenant = useCallback(async (data: Partial<Tenant>): Promise<Tenant> => {
    setError(null);
    try {
      const newTenant = await dataClient.create<Tenant>('tenants', data);
      setTenants(prev => [newTenant, ...prev]);
      return newTenant;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create tenant';
      setError(message);
      throw new Error(message);
    }
  }, []);

  const updateTenant = useCallback(async (
    id: string,
    data: Partial<Tenant>
  ): Promise<Tenant> => {
    setError(null);
    try {
      const updated = await dataClient.update<Tenant>('tenants', id, data);
      setTenants(prev => prev.map(t => t._id === id ? updated : t));
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update tenant';
      setError(message);
      throw new Error(message);
    }
  }, []);

  const deleteTenant = useCallback(async (id: string): Promise<void> => {
    setError(null);
    try {
      await dataClient.delete('tenants', id);
      setTenants(prev => prev.filter(t => t._id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete tenant';
      setError(message);
      throw new Error(message);
    }
  }, []);

  const getTenant = useCallback(async (id: string): Promise<Tenant | null> => {
    setError(null);
    try {
      return await dataClient.get<Tenant>('tenants', id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get tenant';
      setError(message);
      return null;
    }
  }, []);

  useEffect(() => {
    if (params.autoLoad !== false) {
      loadTenants();
    }
  }, [loadTenants, params.autoLoad]);

  return {
    tenants,
    loading,
    error,
    total,
    loadTenants,
    createTenant,
    updateTenant,
    deleteTenant,
    getTenant,
    refreshTenant: loadTenants,
  };
}
```

#### 2.2 Migration Checklist

**Hooks cần migrate:**
- [ ] `/hooks/useTenants.ts` ✅ (example above)
- [ ] `/hooks/useTenant.ts`
- [ ] `/hooks/useTenantMembers.ts`
- [ ] `/hooks/useUsers.ts`
- [ ] `/hooks/useUser.ts`
- [ ] `/hooks/useRoles.ts`
- [ ] `/hooks/usePermissions.ts`
- [ ] ... (~20-30 hooks total)

**Pattern để migrate:**

Trước:
```typescript
const { data } = await supabase.from('resource').select('*');
// hoặc
const response = await fetch(API_BASE);
```

Sau:
```typescript
const result = await dataClient.query<T>('resource', options);
```

---

### Phase 3: Configuration & Environment (1 ngày)

#### 3.1 Environment Variables

```env
# .env.local

# Data Source Configuration
# Options: 'supabase' | 'golang-api'
NEXT_PUBLIC_DATA_SOURCE=supabase

# Supabase Configuration (current)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx

# Golang API Configuration (future)
# NEXT_PUBLIC_GOLANG_API_URL=https://api.yourdomain.com/v1
# NEXT_PUBLIC_GOLANG_API_KEY=xxx
```

#### 3.2 App Initialization

```typescript
// /app/layout.tsx hoặc /pages/_app.tsx

import { DataClientFactory } from '@/lib/data-client/DataClientFactory';
import { projectId, publicAnonKey } from '@/utils/supabase/info';

// Initialize data client on app startup
DataClientFactory.configure({
  type: (process.env.NEXT_PUBLIC_DATA_SOURCE as any) || 'supabase',
  supabase: {
    url: `https://${projectId}.supabase.co`,
    anonKey: publicAnonKey,
  },
  // golangApi sẽ config sau khi có Golang API
});
```

---

### Phase 4: Testing & Validation (2-3 ngày)

#### 4.1 Unit Tests

```typescript
// /lib/data-client/__tests__/SupabaseDataClient.test.ts

import { SupabaseDataClient } from '../SupabaseDataClient';

describe('SupabaseDataClient', () => {
  let client: SupabaseDataClient;

  beforeEach(() => {
    client = new SupabaseDataClient('url', 'key');
  });

  it('should query records with filters', async () => {
    const result = await client.query('tenants', {
      filters: { status: 'ACTIVE' },
      limit: 10,
    });
    
    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
  });

  // More tests...
});
```

#### 4.2 Integration Tests

```typescript
// /hooks/__tests__/useTenants.test.ts

import { renderHook, waitFor } from '@testing-library/react';
import { useTenants } from '../useTenants';

describe('useTenants', () => {
  it('should load tenants on mount', async () => {
    const { result } = renderHook(() => useTenants());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.tenants).toBeDefined();
  });

  // More tests...
});
```

---

## 🚀 MIGRATION TIMELINE

### Week 1: Setup & Foundation
- **Day 1-2**: Implement abstraction layer (IDataClient, SupabaseDataClient)
- **Day 3**: Implement DataClientFactory and configuration
- **Day 4**: Write unit tests for data clients
- **Day 5**: Implement GolangApiDataClient skeleton

### Week 2: Hooks Migration (Batch 1)
- **Day 1**: Migrate core hooks (useTenants, useTenant)
- **Day 2**: Migrate user hooks (useUsers, useUser)
- **Day 3**: Migrate role/permission hooks
- **Day 4**: Migrate tenant member hooks
- **Day 5**: Testing & bug fixes

### Week 3: Hooks Migration (Batch 2)
- **Day 1-3**: Migrate remaining hooks (~15-20 hooks)
- **Day 4**: Integration testing
- **Day 5**: Performance testing & optimization

### Week 4: Documentation & Cleanup
- **Day 1-2**: Update documentation
- **Day 3**: Code review & refactoring
- **Day 4**: Final testing
- **Day 5**: Deploy & monitor

---

## 📈 MIGRATION STRATEGY

### Strategy 1: Big Bang (Không khuyến nghị)
- Migrate tất cả hooks cùng lúc
- ❌ Rủi ro cao
- ❌ Khó debug
- ✅ Nhanh hơn nếu thành công

### Strategy 2: Incremental (Khuyến nghị) ✅
- Migrate từng hook một hoặc theo nhóm
- ✅ Rủi ro thấp
- ✅ Dễ rollback
- ✅ Dễ test và debug
- ❌ Mất thời gian hơn

**Incremental Plan:**
1. **Phase 1**: Migrate 2-3 hooks pilot (useTenants, useTenant)
2. **Test thoroughly**: Đảm bảo hoạt động 100%
3. **Phase 2**: Migrate thêm 5-7 hooks
4. **Test & validate**: Check performance, errors
5. **Phase 3**: Migrate remaining hooks
6. **Final validation**: End-to-end testing

---

## 🎯 CHECKLIST TRƯỚC KHI MIGRATE SANG GOLANG API

Khi có Golang API ready:

### 1. Golang API Requirements
- [ ] RESTful endpoints cho tất cả resources
- [ ] Authentication với Bearer token
- [ ] Response format consistency:
  ```json
  {
    "data": [...],
    "total": 100,
    "has_more": true
  }
  ```
- [ ] Error handling format:
  ```json
  {
    "error": {
      "code": "ERR_CODE",
      "message": "Error message",
      "details": {}
    }
  }
  ```
- [ ] Pagination support (limit/offset)
- [ ] Filtering support
- [ ] Sorting support
- [ ] CORS configured

### 2. Frontend Changes
- [ ] Update `.env` với Golang API URL và key
- [ ] Change `NEXT_PUBLIC_DATA_SOURCE=golang-api`
- [ ] Test all CRUD operations
- [ ] Test error scenarios
- [ ] Performance comparison với Supabase
- [ ] Monitor logs cho errors

### 3. Deployment
- [ ] Deploy Golang API to production
- [ ] Test connectivity từ frontend
- [ ] Gradual rollout (10% → 50% → 100%)
- [ ] Monitor performance metrics
- [ ] Have rollback plan ready

---

## 💡 BEST PRACTICES

### 1. Error Handling
```typescript
try {
  const result = await dataClient.query('resource', options);
  // Handle success
} catch (err) {
  // Log error with context
  console.error('[HookName] Operation failed:', {
    operation: 'query',
    resource: 'resource',
    error: err,
  });
  
  // Set user-friendly error message
  setError('Failed to load data. Please try again.');
  
  // Try fallback (cache, default data, etc.)
  const cachedData = localStorage.getItem('cache_key');
  if (cachedData) {
    setData(JSON.parse(cachedData));
  }
}
```

### 2. Caching Strategy
```typescript
// Cache with expiration
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getCachedData = (key: string) => {
  const cached = localStorage.getItem(key);
  if (!cached) return null;
  
  const { data, timestamp } = JSON.parse(cached);
  const age = Date.now() - timestamp;
  
  if (age > CACHE_TTL) {
    localStorage.removeItem(key);
    return null;
  }
  
  return data;
};

const setCachedData = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify({
    data,
    timestamp: Date.now(),
  }));
};
```

### 3. Optimistic Updates
```typescript
const updateItem = async (id: string, updates: any) => {
  // Optimistic update
  setItems(prev => prev.map(item => 
    item._id === id ? { ...item, ...updates } : item
  ));

  try {
    const updated = await dataClient.update('resource', id, updates);
    // Update with server response
    setItems(prev => prev.map(item => 
      item._id === id ? updated : item
    ));
  } catch (err) {
    // Rollback on error
    setItems(prev => prev); // Trigger re-fetch
    await loadItems(); // Re-fetch from server
    throw err;
  }
};
```

### 4. Type Safety
```typescript
// Always use generics for type safety
const result = await dataClient.query<Tenant>('tenants', options);
// result.data is typed as Tenant[]

const tenant = await dataClient.get<Tenant>('tenants', id);
// tenant is typed as Tenant | null

const created = await dataClient.create<Tenant>('tenants', data);
// created is typed as Tenant
```

---

## 📚 TÀI LIỆU THAM KHẢO

Sau khi implement:

- **API Reference**: `/docs/developer/data-client-api.md`
- **Migration Guide**: `/docs/developer/data-client-migration.md`
- **Testing Guide**: `/docs/developer/data-client-testing.md`
- **Golang API Spec**: `/docs/api/golang-api-spec.md`

---

## ✅ SUCCESS CRITERIA

Migration được coi là thành công khi:

1. ✅ **All hooks migrated** - Tất cả hooks dùng DataClient
2. ✅ **Tests passing** - 100% tests pass
3. ✅ **No regressions** - Không có bugs mới
4. ✅ **Performance maintained** - Performance không giảm
5. ✅ **Easy to switch** - Đổi data source chỉ cần 1 config change
6. ✅ **Documentation complete** - Docs đầy đủ và rõ ràng
7. ✅ **Team trained** - Team hiểu và sử dụng được pattern mới

---

## 🎉 BENEFITS

Sau khi hoàn thành migration:

✅ **Flexibility** - Dễ dàng switch giữa Supabase ↔ Golang API  
✅ **Consistency** - Tất cả hooks theo cùng 1 pattern  
✅ **Testability** - Mock DataClient để test dễ dàng  
✅ **Maintainability** - Code rõ ràng, dễ maintain  
✅ **Scalability** - Dễ dàng thêm data sources mới  
✅ **Type Safety** - Full TypeScript support  
✅ **Performance** - Caching và optimization dễ dàng hơn  

---

**Last Updated**: 2026-01-20  
**Status**: 📝 Planning Phase  
**Target**: Q1 2026 Migration Complete
