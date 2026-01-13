# ✅ Errors Fixed - Translation & Database

## 📋 Summary

Đã khắc phục 2 lỗi chính:
1. ✅ **Translation missing** - Thiếu keys `subtitle` và `searchPlaceholder` trong tenants
2. ⚠️ **Database error** - Table 'public.users' không tồn tại (cần giải thích và hướng dẫn)

---

## 1. ✅ Translation Errors FIXED

### Vấn đề
```
❌ Translation not found for key: tenants.subtitle in language: vi
❌ Translation not found for key: tenants.searchPlaceholder in language: vi
```

### Nguyên nhân
Files translation thiếu 2 keys: `subtitle` và `searchPlaceholder` trong object `tenants`

### Giải pháp
Đã thêm 2 keys này vào **TẤT CẢ 6 ngôn ngữ**:

#### Vietnamese (vi.ts)
```typescript
tenants: {
  title: 'Tenants',
  subtitle: 'Quản lý tổ chức và cấu trúc phân cấp',  // ✅ ADDED
  searchPlaceholder: 'Tìm kiếm tenant theo tên, code, domain...',  // ✅ ADDED
  // ... other keys
}
```

#### English (en.ts)
```typescript
tenants: {
  title: 'Tenant Management',
  subtitle: 'Manage organizations and subscription plans',  // ✅ Already existed
  searchPlaceholder: 'Search tenants...',  // ✅ Already existed
}
```

#### Spanish (es.ts)
```typescript
tenants: {
  title: 'Gestión de Inquilinos',
  subtitle: 'Administrar organizaciones y estructura jerárquica',  // ✅ ADDED
  searchPlaceholder: 'Buscar inquilinos por nombre, código, dominio...',  // ✅ ADDED
}
```

#### Chinese (zh.ts)
```typescript
tenants: {
  title: '租户管理',
  subtitle: '管理组织和层级结构',  // ✅ ADDED
  searchPlaceholder: '按名称、代码、域名搜索租户...',  // ✅ ADDED
}
```

#### Japanese (ja.ts)
```typescript
tenants: {
  title: 'テナント管理',
  subtitle: '組織と階層構造を管理',  // ✅ ADDED
  searchPlaceholder: '名前、コード、ドメインでテナントを検索...',  // ✅ ADDED
}
```

#### Korean (ko.ts)
```typescript
tenants: {
  title: '테넌트 관리',
  subtitle: '조직 및 계층 구조 관리',  // ✅ ADDED
  searchPlaceholder: '이름, 코드, 도메인으로 테넌트 검색...',  // ✅ ADDED
}
```

### Kết quả
✅ **Console không còn warnings về translation missing**

---

## 2. ⚠️ Database Error - Table 'public.users' Not Found

### Vấn đề
```javascript
Error fetching users: {
  code: "PGRST205",
  details: null,
  hint: null,
  message: "Could not find the table 'public.users' in the schema cache"
}
```

### Nguyên nhân - QUAN TRỌNG ⚠️

Theo hướng dẫn của Figma Make system:
> "You have access to a Supabase database, edge functions, auth, and storage. The database has a pre-defined **key value table** for you to use."

**Nghĩa là:**
- ✅ Chỉ có 1 table duy nhất: `kv_store_7eedb4e0` (Key-Value Store)
- ❌ KHÔNG có tables: `users`, `tenants`, `departments`, `user_groups`, etc.
- ❌ KHÔNG thể tạo thêm tables mới (read-only schema)

### Các files đang gặp vấn đề

#### 1. `/supabase/functions/server/users-api.tsx`
```typescript
// ❌ SAI - Cố query table 'users' không tồn tại
let query = supabase
  .from('users')  // ❌ Table này không tồn tại!
  .select('*, tenant:tenants(name)', { count: 'exact' })
  .is('deleted_at', null)
```

#### 2. `/supabase/functions/server/tenants-api.tsx`
```typescript
// ❌ SAI - Cố query table 'tenants' không tồn tại
let query = supabase
  .from('tenants')  // ❌ Table này không tồn tại!
  .select('*', { count: 'exact' })
  .is('deleted_at', null)
```

#### 3. `/supabase/functions/server/seed-data.tsx`
```typescript
// ❌ SAI - Cố insert vào tables không tồn tại
const { data: existing } = await supabase
  .from('users')  // ❌ Table này không tồn tại!
  .select('_id')
  .eq('email', user.email)
```

### Giải pháp

Có 3 cách xử lý:

#### ✅ Option 1: Sử dụng KV Store (RECOMMENDED)

Pattern đúng như trong `/supabase/functions/server/tenant-members-api.tsx`:

```typescript
import * as kv from './kv_store.tsx';

// Lưu data vào KV store
await kv.set(`users:${userId}`, userData);

// Lấy data từ KV store
const user = await kv.get(`users:${userId}`);

// Lấy tất cả users
const allUsers = await kv.getByPrefix('users:');

// Xóa user
await kv.del(`users:${userId}`);
```

**Cấu trúc keys nên dùng:**
```
users:{user_id}              -> User object
tenants:{tenant_id}          -> Tenant object
tenant_members:{member_id}   -> Tenant Member object
departments:{dept_id}        -> Department object
user_groups:{group_id}       -> User Group object
seed:status                  -> Seed data status
seed:tenants                 -> Array of seed tenants
seed:users                   -> Array of seed users
```

#### ❌ Option 2: Mock Data Only (NOT RECOMMENDED)

Disable tất cả API endpoints và chỉ dùng mock data trong localStorage:
- Xóa/comment out `users-api.tsx`, `tenants-api.tsx`, `seed-data.tsx`
- Frontend sẽ 100% dùng mock data từ `/data/mock-seed-data.ts`
- Không có persistence, data mất khi refresh

#### ⚠️ Option 3: External Database (COMPLEX)

Setup Postgres database riêng và connect qua connection string - KHÔNG khuyến khích vì:
- Phức tạp, cần setup thêm infrastructure
- Không phù hợp với Figma Make architecture
- Vi phạm guidelines của system

---

## 🔧 Recommended Action Plan

### Bước 1: Comment out problematic APIs (TEMPORARY FIX)
```typescript
// /supabase/functions/server/index.tsx

// ❌ TEMPORARY: Disable until migrated to KV store
// app.route('/api/core', tenantsAPI);
// app.route('/api/core', usersAPI);

// ✅ This one works with KV store
app.route('/api/core', tenantMembersAPI);
app.route('/api/core', departmentsAPI);
app.route('/api/core', userGroupsAPI);
app.route('/api/core', seedDataAPI);  // Needs to be rewritten
```

### Bước 2: Frontend fallback to mock data
Frontend đã có sẵn fallback mechanism:
```typescript
// pages/UsersPage.tsx
try {
  const response = await fetch(`${API_URL}/users`);
  // ...
} catch (err) {
  console.error('Error fetching users:', err);
  // ✅ Fallback to localStorage/mock data
  const cached = localStorage.getItem('users_cache');
  if (cached) {
    setUsers(JSON.parse(cached));
  }
}
```

### Bước 3: Rewrite APIs to use KV Store (PERMANENT FIX)

#### Example: Rewrite users-api.tsx

**BEFORE (❌ BROKEN):**
```typescript
const { data, error } = await supabase
  .from('users')  // ❌ Table doesn't exist
  .select('*')
```

**AFTER (✅ WORKS):**
```typescript
import * as kv from './kv_store.tsx';

// Get all users
const allUsersData = await kv.getByPrefix('users:');
const users = allUsersData.map(item => item.value);

// Get single user
const user = await kv.get(`users:${userId}`);

// Create user
await kv.set(`users:${userId}`, userData);

// Update user
const existingUser = await kv.get(`users:${userId}`);
await kv.set(`users:${userId}`, { ...existingUser, ...updates });

// Delete user (soft delete)
const user = await kv.get(`users:${userId}`);
await kv.set(`users:${userId}`, { ...user, deleted_at: new Date().toISOString() });
```

---

## 📊 Current Status

| Component | Status | Notes |
|-----------|--------|-------|
| **Translation errors** | ✅ FIXED | All 6 languages synchronized |
| **tenant-members-api** | ✅ WORKING | Uses KV store correctly |
| **departments-api** | ✅ WORKING | Uses KV store correctly |
| **user-groups-api** | ✅ WORKING | Uses KV store correctly |
| **users-api** | ❌ BROKEN | Tries to query `users` table |
| **tenants-api** | ❌ BROKEN | Tries to query `tenants` table |
| **seed-data** | ❌ BROKEN | Tries to insert into multiple tables |
| **Frontend fallback** | ✅ WORKING | Falls back to mock data |

---

## 🎯 Next Steps

### Immediate (to stop errors):
1. ✅ **DONE**: Fix translation errors
2. **TODO**: Comment out broken APIs in `/supabase/functions/server/index.tsx`
3. **TODO**: Test that frontend still works with mock data fallback

### Long-term (proper fix):
1. **TODO**: Rewrite `users-api.tsx` to use KV store
2. **TODO**: Rewrite `tenants-api.tsx` to use KV store
3. **TODO**: Rewrite `seed-data.tsx` to use KV store
4. **TODO**: Update all documentation

---

## 📝 Important Notes

### About KV Store Table
- **Table name**: `kv_store_7eedb4e0`
- **Schema**:
  ```sql
  CREATE TABLE kv_store_7eedb4e0 (
    key TEXT NOT NULL PRIMARY KEY,
    value JSONB NOT NULL
  );
  ```
- **Access**: Via `/supabase/functions/server/kv_store.tsx`
- **Protected**: ⚠️ DO NOT modify `kv_store.tsx` file

### Naming Conventions for Keys
```
{entity_type}:{entity_id}           // Individual records
{entity_type}:list                  // Full lists
{entity_type}:index:{field}:{value} // Indexes
seed:{entity_type}                  // Seed data
cache:{entity_type}:{timestamp}     // Temporary cache
```

### Best Practices
1. Always use prefixes for keys (e.g., `users:`, `tenants:`)
2. Store complete objects in JSONB value
3. Implement soft delete (set `deleted_at` field)
4. Use `getByPrefix()` for listing/filtering
5. Cache frequently accessed data in memory
6. Implement optimistic locking with `version` field

---

## ✅ Summary

- ✅ **Translation errors**: FIXED - All 6 languages synchronized
- ⚠️ **Database errors**: EXPLAINED - Need to migrate to KV store
- 📚 **Documentation**: Complete guide provided for migration
- 🎯 **Action plan**: Clear steps for both immediate and long-term fixes

**Lỗi translation đã được khắc phục hoàn toàn. Lỗi database cần refactor APIs để dùng KV store thay vì query tables không tồn tại.**
