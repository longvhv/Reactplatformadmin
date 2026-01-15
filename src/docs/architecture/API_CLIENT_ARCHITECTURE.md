# 🏗️ API Client Architecture - Ready for Golang Migration

## 📋 Overview

Hệ thống API clients hiện tại được thiết kế để **dễ dàng chuyển đổi** từ Supabase sang Golang microservices trong tương lai.

**Ngày tạo:** January 14, 2026  
**Trạng thái:** Production Ready  
**Mục tiêu:** Zero-code-change migration khi chuyển sang Golang backend

---

## 🎯 Design Principles

### **1. Abstraction Layer Pattern**

```
Components (React)
    ↓
API Clients (/api/*.ts) ← ABSTRACTION LAYER
    ↓         ↓
Supabase   HTTP REST
Client     (Future)
```

**Key principle:** Components **NEVER** call data sources directly. Always go through API clients.

### **2. Interface-Driven Design**

Mỗi API client export:
- **TypeScript interfaces** - Định nghĩa data structures
- **API object** - Tập hợp methods cho CRUD operations
- **React hooks (optional)** - Wrapper để dễ dùng trong components

### **3. Single Responsibility**

Mỗi file API client chỉ quản lý **1 entity**:
- `/api/productsApi.ts` → Products only
- `/api/ordersApi.ts` → Orders only
- `/api/subscriptionApi.ts` → Subscriptions only

---

## 📁 Current Structure

```
/api/
├── config.ts                    # API configuration (base URLs, timeouts)
├── productsApi.ts              # Products CRUD
├── ordersApi.ts                # Orders + Payment processing
├── subscriptionApi.ts          # Subscriptions management
├── tenantsApi.ts               # Tenants management
├── usersApi.ts                 # Users management
├── applicationsApi.ts          # Applications management
├── servicePackageApi.ts        # Service packages
├── tenantAppRoutesApi.ts       # Tenant app routes
├── tenantRateLimitsApi.ts      # Rate limits
├── webhooksApi.ts              # Webhooks
├── userDelegationsApi.ts       # User delegations
├── rolesApi.ts                 # Roles & permissions
└── ... (48+ files)
```

---

## 🔄 Migration Strategy

### **Phase 1: Current (Supabase)**

```typescript
// /api/productsApi.ts
import { supabase } from '@/utils/supabase/client';

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
  
  // ... more methods
};
```

### **Phase 2: Future (Golang Microservices)**

```typescript
// /api/productsApi.ts
import { apiClient } from './config';

export const productsApi = {
  async getAll(): Promise<Product[]> {
    const response = await apiClient.get('/api/v1/products');
    return response.data;
  },
  
  async getById(id: string): Promise<Product> {
    const response = await apiClient.get(`/api/v1/products/${id}`);
    return response.data;
  },
  
  // ... same methods, different implementation
};
```

### **Phase 3: Hybrid (Gradual Migration)**

```typescript
// /api/config.ts
export const API_MODE = process.env.NEXT_PUBLIC_API_MODE || 'supabase'; // 'supabase' | 'golang'

// /api/productsApi.ts
import { supabase } from '@/utils/supabase/client';
import { apiClient } from './config';
import { API_MODE } from './config';

export const productsApi = {
  async getAll(): Promise<Product[]> {
    if (API_MODE === 'golang') {
      // Golang backend
      const response = await apiClient.get('/api/v1/products');
      return response.data;
    } else {
      // Supabase
      const { data, error } = await supabase
        .from('products')
        .select('*');
      
      if (error) throw new Error(error.message);
      return data || [];
    }
  },
  
  // ... other methods follow same pattern
};
```

---

## 🎨 API Client Template

Mỗi API client nên follow template này:

```typescript
/**
 * [Entity] API Client
 * Description: Manages [entity] CRUD operations
 * Data Source: Supabase (ready for Golang migration)
 */

import { supabase } from '@/utils/supabase/client';

// ==================== TYPES ====================

export interface [Entity] {
  _id: string;
  // ... other fields
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface Create[Entity]Request {
  // ... required fields for creation
}

export interface Update[Entity]Request {
  // ... optional fields for update
}

export interface [Entity]Filters {
  // ... filter parameters
  search?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

// ==================== API CLIENT ====================

export const [entity]Api = {
  /**
   * GET /[entities]
   * List all [entities] with optional filters
   */
  async getAll(filters?: [Entity]Filters): Promise<[Entity][]> {
    try {
      let query = supabase
        .from('[table_name]')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.search) {
        query = query.ilike('name', `%${filters.search}%`);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching [entities]:', error);
        throw new Error(error.message);
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAll:', error);
      throw error;
    }
  },

  /**
   * GET /[entities]/:id
   * Get single [entity] by ID
   */
  async getById(id: string): Promise<[Entity]> {
    try {
      const { data, error } = await supabase
        .from('[table_name]')
        .select('*')
        .eq('_id', id)
        .single();

      if (error) {
        console.error('Error fetching [entity]:', error);
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error('[Entity] not found');
      }

      return data;
    } catch (error) {
      console.error('Error in getById:', error);
      throw error;
    }
  },

  /**
   * POST /[entities]
   * Create new [entity]
   */
  async create(data: Create[Entity]Request): Promise<[Entity]> {
    try {
      const { data: result, error } = await supabase
        .from('[table_name]')
        .insert([data])
        .select()
        .single();

      if (error) {
        console.error('Error creating [entity]:', error);
        throw new Error(error.message);
      }

      return result;
    } catch (error) {
      console.error('Error in create:', error);
      throw error;
    }
  },

  /**
   * PATCH /[entities]/:id
   * Update existing [entity]
   */
  async update(id: string, data: Update[Entity]Request): Promise<[Entity]> {
    try {
      const { data: result, error } = await supabase
        .from('[table_name]')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('_id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating [entity]:', error);
        throw new Error(error.message);
      }

      return result;
    } catch (error) {
      console.error('Error in update:', error);
      throw error;
    }
  },

  /**
   * DELETE /[entities]/:id
   * Soft delete [entity]
   */
  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('[table_name]')
        .update({ 
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('_id', id);

      if (error) {
        console.error('Error deleting [entity]:', error);
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Error in delete:', error);
      throw error;
    }
  },
};

// ==================== REACT HOOKS (OPTIONAL) ====================

import { useState, useEffect } from 'react';

export function use[Entities](filters?: [Entity]Filters) {
  const [data, setData] = useState<[Entity][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await [entity]Api.getAll(filters);
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [JSON.stringify(filters)]);

  return { data, loading, error, refresh: fetchData };
}

export function use[Entity](id: string | undefined) {
  const [data, setData] = useState<[Entity] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await [entity]Api.getById(id);
        setData(result);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  return { data, loading, error };
}
```

---

## 🔧 Configuration System

### **/api/config.ts**

```typescript
/**
 * API Configuration
 * Centralized config for easy migration to Golang
 */

// API Mode: 'supabase' | 'golang' | 'hybrid'
export const API_MODE = (process.env.NEXT_PUBLIC_API_MODE || 'supabase') as 'supabase' | 'golang' | 'hybrid';

// Golang API Base URL (when migrated)
export const GOLANG_API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

// API Timeouts
export const API_TIMEOUT = 30000; // 30 seconds

// Retry Configuration
export const API_RETRY_COUNT = 3;
export const API_RETRY_DELAY = 1000; // 1 second

// HTTP Client (for Golang migration)
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: GOLANG_API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptors for auth, logging, etc.
apiClient.interceptors.request.use((config) => {
  // Add auth token if available
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);
```

---

## 📊 API Clients Status

| API Client | Entity | Supabase | Golang Ready | Notes |
|-----------|--------|----------|--------------|-------|
| `productsApi` | Products | ✅ | ✅ | Migrated from HTTP |
| `ordersApi` | Orders | ✅ | ✅ | Complex JOINs |
| `subscriptionApi` | Subscriptions | ✅ | ✅ | Optimistic locking |
| `tenantsApi` | Tenants | ✅ | ✅ | Ready |
| `usersApi` | Users | ✅ | ✅ | Ready |
| `applicationsApi` | Applications | ✅ | ✅ | Ready |
| `servicePackageApi` | Packages | ✅ | ✅ | Ready |
| `tenantAppRoutesApi` | App Routes | ✅ | ✅ | Ready |
| `tenantRateLimitsApi` | Rate Limits | ✅ | ✅ | Ready |
| `webhooksApi` | Webhooks | ✅ | ✅ | Ready |
| `userDelegationsApi` | Delegations | ✅ | ✅ | Ready |
| `rolesApi` | Roles | ✅ | ✅ | Ready |
| `permissionsApi` | Permissions | ✅ | ✅ | Ready |

**Total:** 48+ API clients, all ready for Golang migration

---

## 🚀 Migration Checklist

### **Before Migration:**

- [ ] Verify all API clients follow template
- [ ] Ensure TypeScript interfaces are complete
- [ ] Test all CRUD operations with Supabase
- [ ] Document complex business logic
- [ ] Add integration tests

### **During Migration:**

- [ ] Deploy Golang microservices
- [ ] Update `/api/config.ts` with Golang URL
- [ ] Switch `API_MODE` to `'hybrid'`
- [ ] Migrate one entity at a time
- [ ] Test thoroughly after each migration
- [ ] Monitor errors and performance

### **After Migration:**

- [ ] Remove Supabase code paths
- [ ] Switch `API_MODE` to `'golang'`
- [ ] Update documentation
- [ ] Archive old Supabase queries
- [ ] Celebrate! 🎉

---

## 💡 Best Practices

### **1. Always Use API Clients**

❌ **BAD:**
```typescript
// Component directly calls Supabase
const { data } = await supabase.from('products').select('*');
```

✅ **GOOD:**
```typescript
// Component uses API client
import { productsApi } from '@/api/productsApi';
const data = await productsApi.getAll();
```

### **2. Consistent Error Handling**

```typescript
try {
  const data = await productsApi.getById(id);
  // Handle success
} catch (error: any) {
  console.error('Error loading product:', error.message);
  toast.error('Không thể tải sản phẩm');
}
```

### **3. Use React Hooks When Available**

```typescript
// Instead of manually managing state:
const [products, setProducts] = useState([]);
useEffect(() => {
  productsApi.getAll().then(setProducts);
}, []);

// Use provided hooks:
const { data: products, loading, error } = useProducts();
```

### **4. Document Complex Logic**

```typescript
/**
 * Process payment and create subscription
 * 
 * Business logic:
 * 1. Update order status to PAID
 * 2. Create subscription from order
 * 3. Copy entitlements from package
 * 4. Return subscription ID
 * 
 * @throws Error if payment fails or subscription creation fails
 */
async processPayment(orderId: string, paymentMethod: string): Promise<string> {
  // Implementation...
}
```

### **5. Maintain Backward Compatibility**

When migrating to Golang, keep old method signatures:

```typescript
// ✅ GOOD - Same interface
// Supabase version
async getAll(filters?: ProductFilters): Promise<Product[]> {
  // Supabase query
}

// Golang version
async getAll(filters?: ProductFilters): Promise<Product[]> {
  // HTTP request
}

// ❌ BAD - Different interface
async getAll(page: number, limit: number): Promise<Product[]> {
  // This breaks existing code!
}
```

---

## 🔗 Related Documents

- `/docs/bugfix/BUGFIX_SUMMARY.md` - Bug fixes that led to this architecture
- `/docs/bugfix/BUGFIX_PRODUCTS.md` - Products API migration details
- `/docs/bugfix/BUGFIX_ORDERS.md` - Orders API migration details
- `/docs/bugfix/BUGFIX_SUBSCRIPTIONS.md` - Subscriptions API migration details
- `/ARCHITECTURE.md` - Overall system architecture

---

## 📞 Contact & Support

**Questions about migration?**
- Check `/docs/bugfix/` for examples
- Review existing API clients in `/api/`
- Follow the template above

**Found issues?**
- Document in `/docs/bugfix/`
- Update this guide
- Notify team

---

## ✅ Summary

**Current State:**
- ✅ All API clients use abstraction layer
- ✅ TypeScript interfaces well-defined
- ✅ Consistent error handling
- ✅ React hooks for common patterns
- ✅ Configuration system in place

**Ready for Migration:**
- ✅ Zero-code-change in components
- ✅ Switch API mode via config
- ✅ Gradual migration supported
- ✅ Full backward compatibility

**Migration Time Estimate:**
- Per entity: ~2-4 hours
- Total (48 entities): ~1-2 weeks
- With testing: ~3-4 weeks

---

**Architecture is production-ready and future-proof!** 🎉

**Khi nào cần migrate sang Golang, chỉ cần update implementation trong API clients, components không cần thay đổi!** ✨
