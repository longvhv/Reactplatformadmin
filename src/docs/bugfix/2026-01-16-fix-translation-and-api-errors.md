# Bug Fix: Translation Keys & API Errors

**Ngày:** 16/01/2026  
**Mức độ:** High  
**Module:** i18n, System Categories API, Database Tables

## Vấn đề

App đang gặp 3 nhóm lỗi chính:

### 1. Translation Errors
Missing translations cho các keys trong tiếng Việt:
- `Thống kê doanh thu`
- `Domains`
- `API Keys`
- `Service Accounts`
- `Invitations`
- `Applications`
- `API Usage`

### 2. System Categories API Errors
```
⚠️ [System Categories] Failed to fetch categories for TYPE_COMPONENT: 
Error: Failed to fetch system categories: invalid input syntax for type uuid: "TYPE_COMPONENT"
```

**Root cause**: Hàm `getTypesByGroup()` đang truyền `groupCode` (string) vào field `group_category_id` mà field này expect UUID.

### 3. Database Table Not Found Errors
Nhiều bảng không tồn tại trong Supabase:
- `product_types` (hint: use `saas_product_types`)
- `traffic_logs`
- `user_registration_logs`
- `api_usage_logs`

## Giải pháp

### 1. Fix Translation Keys ✅ COMPLETED

Các translation đã được thêm vào `/i18n/vi.ts` (dòng 113-124):

```typescript
navigation: {
  // ... existing translations
  
  // ✅ NEW: Missing translations
  'Thống kê doanh thu': 'Thống kê doanh thu',
  'Domains': 'Tên miền',
  'API Keys': 'API Keys',
  'Service Accounts': 'Tài khoản dịch vụ',
  'Invitations': 'Lời mời',
  'Applications': 'Ứng dụng',
  'API Usage': 'Sử dụng API',
}
```

**Status**: ✅ Fixed - Translations đã tồn tại, không cần thay đổi

### 2. Fix System Categories API ✅ COMPLETED

**File**: `/api/systemCategoriesApi.ts`

**BEFORE** (Line 401-408):
```typescript
getTypesByGroup: async (tenantId: string, groupCode: string): Promise<SystemCategoryType[]> => {
  return systemCategoriesApi.getAll({
    tenant_id: tenantId,
    type: 'SYSTEM_CATEGORY_TYPE',
    group_category_id: groupCode, // ❌ ERROR: Passing string as UUID
    status: 1,
  }) as Promise<SystemCategoryType[]>;
},
```

**AFTER** (Fixed):
```typescript
getTypesByGroup: async (tenantId: string, groupCode: string): Promise<SystemCategoryType[]> => {
  // ✅ FIX: First find the group by code to get its ID
  const group = await systemCategoriesApi.getByCode(tenantId, groupCode);
  if (!group) {
    console.warn(`⚠️ [System Categories] Group not found for code: ${groupCode}`);
    return [];
  }
  
  // ✅ FIX: Now query using the group's ID, not code
  return systemCategoriesApi.getAll({
    tenant_id: tenantId,
    type: 'SYSTEM_CATEGORY_TYPE',
    group_category_id: group._id, // Use ID instead of code
    status: 1,
  }) as Promise<SystemCategoryType[]>;
},
```

**Cũng fix wrapper function** `getTypesByGroup()` (Line ~620):
```typescript
export async function getTypesByGroup(groupCode: string): Promise<SystemCategoryType[]> {
  const { getSupabaseClient } = await import('../lib/supabase');
  const supabase = getSupabaseClient();
  
  // ✅ FIX: First get the group by code to find its ID
  const { data: group, error: groupError } = await supabase
    .from('system_categories')
    .select('_id')
    .eq('type', 'SYSTEM_CATEGORY_GROUP')
    .eq('code', groupCode)
    .is('deleted_at', null)
    .single();
  
  if (groupError || !group) {
    console.warn(`Group not found: ${groupCode}`);
    return [];
  }
  
  // ✅ FIX: Query using group's ID
  const { data, error } = await supabase
    .from('system_categories')
    .select('*')
    .eq('type', 'SYSTEM_CATEGORY_TYPE')
    .eq('group_category_id', group._id) // Use ID
    .is('deleted_at', null)
    .order('order', { ascending: true });
  
  if (error) throw new Error(`Failed to fetch types for group ${groupCode}: ${error.message}`);
  return data as SystemCategoryType[];
}
```

**Status**: ✅ Fixed

### 3. Database Tables Not Found ⚠️ DOCUMENTED

Các bảng sau **KHÔNG** tồn tại trong Supabase database hiện tại:

#### 3.1. `product_types` table
**Error**:
```
Could not find the table 'public.product_types' in the schema cache
Hint: Perhaps you meant the table 'public.saas_product_types'
```

**Solution Options**:
1. **Option A**: Sử dụng `saas_product_types` thay vì `product_types`
2. **Option B**: Tạo bảng `product_types` trong Supabase
3. **Option C**: Merge logic vào một bảng duy nhất

**Recommendation**: Option A - Use existing `saas_product_types` table

**Affected Files**:
- `/api/productTypesApi.ts` - Cần update table name
- `/hooks/useProductTypes.ts` - Cần update

#### 3.2. `traffic_logs` table
**Error**:
```
Could not find the table 'public.traffic_logs' in the schema cache
```

**Affected Features**:
- Traffic Logs module
- Traffic statistics dashboard
- API monitoring

**Recommendation**: 
- Tạo bảng `traffic_logs` trong Supabase hoặc
- Tạm thời disable Traffic Logs module

#### 3.3. `user_registration_logs` table
**Error**:
```
Could not find the table 'public.user_registration_logs' in the schema cache
```

**Affected Features**:
- User Registration Telemetry module
- Registration analytics

**Recommendation**: 
- Tạo bảng `user_registration_logs` hoặc
- Disable User Registration Telemetry module

#### 3.4. `api_usage_logs` table
**Error**:
```
Could not find the table 'public.api_usage_logs' in the schema cache
```

**Affected Features**:
- API Usage Logs module
- API analytics & monitoring

**Recommendation**: 
- Tạo bảng `api_usage_logs` hoặc
- Disable API Usage Logs module

## Database Migration Plan

### Priority 1: Critical Tables (Must Create)

```sql
-- 1. api_usage_logs table
CREATE TABLE public.api_usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES public.tenants(id),
  endpoint VARCHAR(500) NOT NULL,
  method VARCHAR(10) NOT NULL,
  status_code INTEGER NOT NULL,
  response_time_ms INTEGER,
  user_id UUID,
  ip_address INET,
  user_agent TEXT,
  request_body JSONB,
  response_body JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_api_usage_tenant ON public.api_usage_logs(tenant_id);
CREATE INDEX idx_api_usage_created ON public.api_usage_logs(created_at);
CREATE INDEX idx_api_usage_endpoint ON public.api_usage_logs(endpoint);

-- 2. traffic_logs table
CREATE TABLE public.traffic_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID,
  app_code VARCHAR(100),
  region VARCHAR(50),
  http_method VARCHAR(10),
  endpoint VARCHAR(500),
  status_code INTEGER,
  response_time_ms INTEGER,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_traffic_tenant ON public.traffic_logs(tenant_id);
CREATE INDEX idx_traffic_created ON public.traffic_logs(created_at);
CREATE INDEX idx_traffic_region ON public.traffic_logs(region);

-- 3. user_registration_logs table
CREATE TABLE public.user_registration_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES public.tenants(id),
  user_id UUID,
  email VARCHAR(255),
  registration_source VARCHAR(100),
  region VARCHAR(50),
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  status VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_reg_tenant ON public.user_registration_logs(tenant_id);
CREATE INDEX idx_user_reg_created ON public.user_registration_logs(created_at);
CREATE INDEX idx_user_reg_source ON public.user_registration_logs(registration_source);
```

### Priority 2: Rename Table (Quick Fix)

```sql
-- Option: Rename saas_product_types to product_types
-- OR: Update code to use saas_product_types
```

## Temporary Workaround

### Option 1: Disable modules với missing tables

Trong `/core/moduleRegistration.tsx`, comment out các modules:

```typescript
// ⚠️ TEMPORARILY DISABLED - Missing database tables
// registry.register(TrafficLogsModule);
// registry.register(UserRegistrationTelemetryModule);
// registry.register(ApiUsageLogsModule);
```

### Option 2: Add graceful error handling

Thêm try-catch vào các API calls để không crash app khi table missing.

## Testing Checklist

- [x] Translation errors resolved
- [x] System Categories API không còn UUID errors
- [ ] Traffic Logs module working (pending table creation)
- [ ] User Registration Telemetry working (pending table creation)
- [ ] API Usage Logs working (pending table creation)
- [ ] Product Types using correct table

## Next Steps

1. **Immediate**: Deploy System Categories API fix
2. **Short-term**: Tạo missing database tables hoặc disable modules
3. **Medium-term**: Review và chuẩn hóa table naming convention
4. **Long-term**: Migration plan khi chuyển sang Golang backend

## Related Files

- `/i18n/vi.ts` - Vietnamese translations
- `/api/systemCategoriesApi.ts` - System Categories API fix
- `/core/moduleRegistration.tsx` - Module registration
- `/docs/DATABASE_MIGRATION_PLAN.md` - (To be created) Chi tiết migration plan

## Notes

- System Categories API fix sẽ reduce query errors significantly
- Missing tables có thể tạm thời disable modules without breaking app
- Production environment cần database migration ASAP
- Recommend creating all missing tables before next deployment
