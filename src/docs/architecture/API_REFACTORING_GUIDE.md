# 🔄 API Client Refactoring Guide

**Ngày:** January 14, 2026  
**Mục tiêu:** Refactor tất cả API clients để dễ migrate sang Golang microservices

---

## 🎯 Overview

Hệ thống mới sử dụng **Adapter Pattern** để abstraction data sources:

```
Components
    ↓
API Clients (/api/*.ts)
    ↓
Adapters (BaseAdapter, SupabaseAdapter, HttpAdapter)
    ↓
Data Source (Supabase hoặc Golang API)
```

**Lợi ích:**
- ✅ Switch giữa Supabase ↔ Golang chỉ bằng config
- ✅ Code components không thay đổi
- ✅ Consistent error handling
- ✅ Reusable CRUD operations
- ✅ Easy testing với mock adapters

---

## 📁 New File Structure

```
/api/
├── config.ts                      # ✅ Configuration & HTTP client
├── adapters/
│   ├── index.ts                   # ✅ Exports & factory
│   ├── base.ts                    # ✅ Base adapter interface
│   ├── supabase.ts                # ✅ Supabase implementation
│   └── http.ts                    # ✅ HTTP/Golang implementation
├── subscriptionApi.ts             # ✅ REFACTORED - Example
├── productsApi.ts                 # ⏳ TO BE REFACTORED
├── ordersApi.ts                   # ⏳ TO BE REFACTORED
└── ... (45+ other clients)        # ⏳ TO BE REFACTORED
```

---

## 🏗️ Architecture Components

### **1. Configuration (`/api/config.ts`)**

```typescript
/**
 * API Mode configuration
 */
export type ApiMode = 'supabase' | 'golang' | 'hybrid';
export const API_MODE = process.env.NEXT_PUBLIC_API_MODE || 'supabase';

/**
 * Golang API config
 */
export const GOLANG_API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_GOLANG_API_URL || 'http://localhost:8080/api/v1',
  timeout: 30000,
  retryCount: 3,
  retryDelay: 1000,
};

/**
 * HTTP Client with retry logic
 */
export class HttpClient {
  async get<T>(endpoint: string, params?: any): Promise<T>
  async post<T>(endpoint: string, data?: any): Promise<T>
  async patch<T>(endpoint: string, data?: any): Promise<T>
  async delete<T>(endpoint: string): Promise<T>
}
```

### **2. Base Adapter (`/api/adapters/base.ts`)**

```typescript
/**
 * Generic interface for all data sources
 */
export interface IApiAdapter<T, CreateDto, UpdateDto> {
  getAll(filters?: BaseFilters): Promise<T[]>;
  getById(id: string): Promise<T>;
  create(data: CreateDto): Promise<T>;
  update(id: string, data: UpdateDto): Promise<T>;
  delete(id: string): Promise<void>;
}

/**
 * Base filters for queries
 */
export interface BaseFilters {
  search?: string;
  limit?: number;
  offset?: number;
  order_by?: string;
  order_direction?: 'asc' | 'desc';
  [key: string]: any; // Custom filters
}
```

### **3. Supabase Adapter (`/api/adapters/supabase.ts`)**

```typescript
/**
 * Implements IApiAdapter using Supabase
 */
export class SupabaseAdapter<T, CreateDto, UpdateDto> 
  extends BaseApiAdapter<T, CreateDto, UpdateDto> {
  
  async getAll(filters?: BaseFilters): Promise<T[]> {
    const query = supabase.from(this.tableName).select('*');
    // Apply filters...
    return data;
  }
  
  // ... other CRUD methods
}
```

### **4. HTTP Adapter (`/api/adapters/http.ts`)**

```typescript
/**
 * Implements IApiAdapter using HTTP REST API (Golang)
 */
export class HttpAdapter<T, CreateDto, UpdateDto> 
  extends BaseApiAdapter<T, CreateDto, UpdateDto> {
  
  async getAll(filters?: BaseFilters): Promise<T[]> {
    return await httpClient.get(this.endpoint, filters);
  }
  
  // ... other CRUD methods
}
```

### **5. Adapter Factory (`/api/adapters/index.ts`)**

```typescript
/**
 * Creates appropriate adapter based on API_MODE
 */
export function createAdapter<T, CreateDto, UpdateDto>(
  tableName: string,
  endpoint?: string
): IApiAdapter<T, CreateDto, UpdateDto> {
  if (API_MODE === 'golang') {
    return new HttpAdapter<T, CreateDto, UpdateDto>(tableName, endpoint);
  } else {
    return new SupabaseAdapter<T, CreateDto, UpdateDto>(tableName);
  }
}
```

---

## 📝 Step-by-Step Refactoring Guide

### **Step 1: Identify API Client to Refactor**

Choose an API client from `/api/` directory:
- Start with simple ones (single table, basic CRUD)
- Move to complex ones (JOINs, business logic)

**Example:** `/api/productsApi.ts`

### **Step 2: Define TypeScript Types**

```typescript
// Keep existing types
export interface Product {
  _id: string;
  code: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE';
  // ... other fields
}

export interface CreateProductRequest {
  code: string;
  name: string;
  // ... required fields only
}

export interface UpdateProductRequest {
  code?: string;
  name?: string;
  // ... optional fields
}
```

### **Step 3: Create Adapter Instance**

Add this right after type definitions:

```typescript
import { createAdapter } from './adapters';

/**
 * Base adapter for CRUD operations
 * Automatically switches between Supabase and Golang based on API_MODE
 */
const adapter = createAdapter<Product, CreateProductRequest, UpdateProductRequest>(
  'products',              // Supabase table name
  '/products'              // Golang API endpoint
);
```

### **Step 4: Refactor Simple CRUD Methods**

**Before (Supabase direct):**
```typescript
export const productsApi = {
  async getAll(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*');
    
    if (error) throw new Error(error.message);
    return data || [];
  },
  
  async getById(id: string): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('_id', id)
      .single();
    
    if (error) throw new Error(error.message);
    return data;
  },
};
```

**After (Using adapter):**
```typescript
export const productsApi = {
  /**
   * GET /products
   * List all products
   */
  getAll: async (filters?: BaseFilters): Promise<Product[]> => {
    return adapter.getAll(filters);
  },
  
  /**
   * GET /products/:id
   * Get product by ID
   */
  getById: async (id: string): Promise<Product> => {
    return adapter.getById(id);
  },
  
  /**
   * POST /products
   * Create new product
   */
  create: async (data: CreateProductRequest): Promise<Product> => {
    return adapter.create(data);
  },
  
  /**
   * PATCH /products/:id
   * Update product
   */
  update: async (id: string, data: UpdateProductRequest): Promise<Product> => {
    return adapter.update(id, data);
  },
  
  /**
   * DELETE /products/:id
   * Soft delete product
   */
  delete: async (id: string): Promise<void> => {
    return adapter.delete(id);
  },
};
```

### **Step 5: Handle Complex Queries**

For queries with JOINs or complex filters, keep Supabase-specific code but add comments for future Golang implementation:

```typescript
export const productsApi = {
  // ... basic CRUD using adapter
  
  /**
   * GET /products with statistics
   * Complex query with JOINs - Supabase specific
   * 
   * TODO (Golang): Implement in backend with SQL JOINs
   */
  getWithStats: async (): Promise<ProductWithStats[]> => {
    // Keep current Supabase implementation
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        service_packages(count)
      `);
    
    if (error) throw new Error(error.message);
    return data;
  },
};
```

### **Step 6: Handle Business Logic**

Business logic methods stay in API client:

```typescript
export const productsApi = {
  // ... CRUD methods
  
  /**
   * Duplicate product
   * Business logic method - works with any adapter
   */
  duplicate: async (id: string): Promise<Product> => {
    // 1. Get original product
    const original = await adapter.getById(id);
    
    // 2. Create copy with modified code
    const copy = {
      ...original,
      code: `${original.code}_COPY`,
      name: `${original.name} (Copy)`,
    };
    
    // 3. Create new product
    return adapter.create(copy as CreateProductRequest);
  },
  
  /**
   * Toggle product status
   * Business logic - adapter agnostic
   */
  toggleStatus: async (id: string): Promise<Product> => {
    const product = await adapter.getById(id);
    const newStatus = product.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    return adapter.update(id, { status: newStatus } as UpdateProductRequest);
  },
};
```

---

## 🎨 Complete Example

Here's a complete refactored API client:

```typescript
/**
 * Products API Client
 * Handles all product CRUD operations
 * 
 * Architecture:
 * - Uses Adapter pattern for data source abstraction
 * - Supports Supabase (current) and Golang API (future)
 * - Switch between backends via API_MODE config
 */

import { supabase } from '@/utils/supabase/client';
import { createAdapter, BaseFilters } from './adapters';

// ==================== TYPES ====================

export interface Product {
  _id: string;
  code: string;
  name: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface CreateProductRequest {
  code: string;
  name: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface UpdateProductRequest {
  code?: string;
  name?: string;
  description?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

// ==================== ADAPTER ====================

/**
 * Base adapter for CRUD operations
 * Automatically switches between Supabase and Golang based on API_MODE
 */
const adapter = createAdapter<Product, CreateProductRequest, UpdateProductRequest>(
  'products',
  '/products'
);

// ==================== API CLIENT ====================

export const productsApi = {
  /**
   * GET /products
   * List all products with optional filters
   */
  getAll: async (filters?: BaseFilters): Promise<Product[]> => {
    return adapter.getAll(filters);
  },

  /**
   * GET /products/:id
   * Get single product by ID
   */
  getById: async (id: string): Promise<Product> => {
    return adapter.getById(id);
  },

  /**
   * POST /products
   * Create new product
   */
  create: async (data: CreateProductRequest): Promise<Product> => {
    return adapter.create(data);
  },

  /**
   * PATCH /products/:id
   * Update existing product
   */
  update: async (id: string, data: UpdateProductRequest): Promise<Product> => {
    return adapter.update(id, data);
  },

  /**
   * DELETE /products/:id
   * Soft delete product
   */
  delete: async (id: string): Promise<void> => {
    return adapter.delete(id);
  },

  /**
   * Duplicate product
   * Business logic method
   */
  duplicate: async (id: string): Promise<Product> => {
    const original = await adapter.getById(id);
    const copy = {
      code: `${original.code}_COPY`,
      name: `${original.name} (Copy)`,
      description: original.description,
      status: original.status,
    };
    return adapter.create(copy);
  },

  /**
   * Toggle product status
   * Business logic method
   */
  toggleStatus: async (id: string): Promise<Product> => {
    const product = await adapter.getById(id);
    const newStatus = product.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    return adapter.update(id, { status: newStatus });
  },

  /**
   * Get product statistics
   * Complex query - Supabase specific for now
   * 
   * TODO (Golang): Implement backend aggregation endpoint
   */
  getStatistics: async (): Promise<ProductStatistics> => {
    const { data: products } = await supabase
      .from('products')
      .select('status');

    const stats = {
      total: products?.length || 0,
      active: products?.filter(p => p.status === 'ACTIVE').length || 0,
      inactive: products?.filter(p => p.status === 'INACTIVE').length || 0,
    };

    return stats;
  },
};
```

---

## ✅ Refactoring Checklist

For each API client:

### **Types**
- [ ] Keep existing TypeScript interfaces
- [ ] Separate `Create*Request` and `Update*Request` types
- [ ] Document all fields

### **Adapter**
- [ ] Import `createAdapter` from `./adapters`
- [ ] Create adapter instance with table name and endpoint
- [ ] Pass correct generic types

### **CRUD Methods**
- [ ] `getAll()` - Use `adapter.getAll(filters)`
- [ ] `getById()` - Use `adapter.getById(id)`
- [ ] `create()` - Use `adapter.create(data)`
- [ ] `update()` - Use `adapter.update(id, data)`
- [ ] `delete()` - Use `adapter.delete(id)`

### **Complex Queries**
- [ ] Keep Supabase-specific implementation
- [ ] Add TODO comments for Golang migration
- [ ] Document business logic

### **Business Logic**
- [ ] Keep in API client layer
- [ ] Use adapter for data access
- [ ] Make adapter-agnostic

### **Documentation**
- [ ] Add JSDoc comments for all methods
- [ ] Document parameters and return types
- [ ] Note which methods are Supabase-specific

---

## 🚀 Migration Timeline

### **Phase 1: Foundation (Done ✅)**
- [x] Create `/api/config.ts` with HTTP client
- [x] Create adapter base classes
- [x] Create Supabase adapter
- [x] Create HTTP adapter
- [x] Create adapter factory

### **Phase 2: Refactor API Clients (In Progress)**
- [x] Refactor `subscriptionApi` (example)
- [ ] Refactor `productsApi`
- [ ] Refactor `ordersApi`
- [ ] Refactor `tenantsApi`
- [ ] Refactor `usersApi`
- [ ] Refactor remaining 43 clients

**Estimate:** ~30 min per client = ~24 hours total

### **Phase 3: Testing**
- [ ] Test all API clients with Supabase mode
- [ ] Add integration tests
- [ ] Verify error handling

### **Phase 4: Golang Migration (Future)**
- [ ] Deploy Golang microservices
- [ ] Set `API_MODE=golang` in config
- [ ] Test one entity at a time
- [ ] Full integration testing

---

## 💡 Tips & Best Practices

### **1. Start with Simple Clients**

Begin with clients that have basic CRUD only:
- `regionsApi`
- `systemCategoryApi`
- Simple lookup tables

### **2. Test Incrementally**

After refactoring each client:
```bash
# Test the refactored API
npm run dev
# Navigate to pages using that API
# Verify all operations work
```

### **3. Keep Complex Logic Separate**

For complex queries with JOINs:
```typescript
// ✅ GOOD - Keep Supabase-specific, add TODO
async getWithRelations(): Promise<T[]> {
  // TODO (Golang): Implement backend JOIN endpoint
  const { data } = await supabase
    .from('table')
    .select('*, related_table(*)');
  return data;
}

// ❌ BAD - Don't try to abstract JOINs in adapter
```

### **4. Document Breaking Changes**

If you need to change method signatures:
```typescript
/**
 * @deprecated Use getAll({ status: 'ACTIVE' }) instead
 */
async getActive(): Promise<T[]> {
  return this.getAll({ status: 'ACTIVE' });
}
```

### **5. Use Environment Variables**

Switch modes without code changes:
```bash
# .env.local
NEXT_PUBLIC_API_MODE=supabase  # Current
# NEXT_PUBLIC_API_MODE=golang  # Future
# NEXT_PUBLIC_GOLANG_API_URL=http://localhost:8080/api/v1
```

---

## 📊 Progress Tracking

| API Client | Table Name | Status | Notes |
|-----------|-----------|---------|-------|
| `subscriptionApi` | `tenant_subscriptions` | ✅ Done | Example implementation |
| `productsApi` | `products` | ⏳ TODO | Complex queries + business logic |
| `ordersApi` | `subscription_orders` | ⏳ TODO | Payment processing |
| `tenantsApi` | `tenants` | ⏳ TODO | Core entity |
| `usersApi` | `users` | ⏳ TODO | Core entity |
| ... | ... | ⏳ TODO | 43 more clients |

**Total:** 48 API clients  
**Done:** 1 (2%)  
**Remaining:** 47 (98%)

---

## 🔗 Related Documents

- `/docs/architecture/API_CLIENT_ARCHITECTURE.md` - Overall architecture
- `/docs/REFACTORING_COMPLETE.md` - Refactoring summary
- `/api/config.ts` - Configuration code
- `/api/adapters/` - Adapter implementations

---

## ✅ Summary

**Refactoring Pattern:**
1. Import `createAdapter`
2. Create adapter instance
3. Replace direct Supabase calls with adapter methods
4. Keep complex queries and business logic in API client
5. Add TODO comments for future Golang implementation

**Benefits:**
- ✅ Zero component changes when switching backends
- ✅ Consistent error handling
- ✅ Reusable CRUD logic
- ✅ Easy testing
- ✅ Future-proof architecture

**When to Migrate to Golang:**
Just deploy Golang services and set `API_MODE=golang` in env vars!

---

**Start refactoring today! Follow this guide for each API client.** 🚀
