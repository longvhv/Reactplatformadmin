# Webhooks Stats Error - Chi tiết lỗi và Schema Analysis

**Ngày**: 2026-01-16  
**Loại**: Bug Analysis  
**Mức độ**: ⚠️ Medium - Table/Schema không tồn tại  
**Trạng thái**: 🔍 Analyzed - Cần tạo table/schema

---

## 🐛 Lỗi hiện tại

```javascript
Error getting webhooks stats: {
  "message": "Unknown error",
  "code": "N/A",
  "details": null,
  "hint": null
}
```

---

## 📊 Chi tiết Query - getWebhooksStats()

### File nguồn
**Location**: `/services/dashboardService.ts:359-406`

### 3 Queries được thực hiện

#### Query 1: Active Webhooks Count
```typescript
const { count: activeCount, error: activeError } = await supabase
  .from('webhooks')                    // ❌ TABLE: public.webhooks
  .select('*', { count: 'exact', head: true })
  .eq('enabled', true)
  .eq('is_deleted', false);
```

**Schema**: `public` (default)  
**Table**: `webhooks`  
**Columns yêu cầu**:
- `enabled` (boolean)
- `is_deleted` (boolean)

---

#### Query 2: Unhealthy Webhooks Count
```typescript
const { count: unhealthyCount, error: unhealthyError } = await supabase
  .from('webhooks')                    // ❌ TABLE: public.webhooks
  .select('*', { count: 'exact', head: true })
  .eq('enabled', true)
  .neq('health_status', 'healthy')
  .eq('is_deleted', false);
```

**Schema**: `public` (default)  
**Table**: `webhooks`  
**Columns yêu cầu**:
- `enabled` (boolean)
- `health_status` (varchar/text) - có thể là 'healthy', 'unhealthy', etc.
- `is_deleted` (boolean)

---

#### Query 3: Total Deliveries Count
```typescript
const { count: deliveriesCount, error: deliveriesError } = await supabase
  .schema('telemetry')                 // ❌ SCHEMA: telemetry
  .from('webhook_delivery_logs')       // ❌ TABLE: telemetry.webhook_delivery_logs
  .select('*', { count: 'exact', head: true });
```

**Schema**: `telemetry` (custom schema)  
**Table**: `webhook_delivery_logs`  
**Columns yêu cầu**: Không cần specific columns (chỉ COUNT)

---

## 🗃️ Schema/Table cần tạo trong Supabase

### ✅ KHÔNG ĐƯỢC TẠO MIGRATION FILES

**⚠️ QUAN TRỌNG**: Theo quy định trong instructions:
> You should not write migration files or DDL statements into code files because these cannot be run in the Make environment.

### 📝 Tài liệu cho người dùng tự tạo

Người dùng cần tạo **2 tables** trong Supabase UI:

---

### Table 1: `public.webhooks`

**Schema**: `public`  
**Table name**: `webhooks`

#### Columns tối thiểu:

| Column | Type | Nullable | Default | Index |
|--------|------|----------|---------|-------|
| `id` | uuid | NO | gen_random_uuid() | PRIMARY KEY |
| `tenant_id` | uuid | YES | - | INDEX |
| `name` | varchar(255) | NO | - | - |
| `url` | text | NO | - | - |
| `enabled` | boolean | NO | true | INDEX |
| `is_deleted` | boolean | NO | false | INDEX |
| `health_status` | varchar(50) | NO | 'healthy' | INDEX |
| `created_at` | timestamptz | NO | now() | - |
| `updated_at` | timestamptz | NO | now() | - |

#### Policies (RLS):
```sql
-- Nếu bật RLS, cần enable và tạo policies phù hợp
-- Hoặc tắt RLS cho table này trong phase development
```

---

### Table 2: `telemetry.webhook_delivery_logs`

**⚠️ ĐẶC BIỆT**: Cần tạo schema `telemetry` trước nếu chưa có!

#### Bước 1: Tạo schema (nếu chưa có)
```sql
CREATE SCHEMA IF NOT EXISTS telemetry;
```

#### Bước 2: Tạo table

**Schema**: `telemetry`  
**Table name**: `webhook_delivery_logs`

| Column | Type | Nullable | Default | Index |
|--------|------|----------|---------|-------|
| `id` | uuid | NO | gen_random_uuid() | PRIMARY KEY |
| `webhook_id` | uuid | NO | - | INDEX, FK -> public.webhooks(id) |
| `tenant_id` | uuid | YES | - | INDEX |
| `status` | varchar(50) | NO | - | INDEX |
| `response_time_ms` | integer | YES | - | - |
| `status_code` | integer | YES | - | INDEX |
| `delivered_at` | timestamptz | NO | now() | INDEX |
| `payload` | jsonb | YES | - | - |
| `error_message` | text | YES | - | - |

#### Policies (RLS):
```sql
-- Tương tự, cần xem xét RLS policies
```

---

## 🔄 Workflow cho người dùng

### Cách 1: Supabase UI (Recommended cho Make environment)

1. **Mở Supabase Dashboard**
2. **Vào "Table Editor"**
3. **Tạo schema `telemetry`** (nếu chưa có):
   - Click "SQL Editor"
   - Run: `CREATE SCHEMA IF NOT EXISTS telemetry;`
4. **Tạo table `public.webhooks`**:
   - New Table
   - Điền columns theo bảng trên
5. **Tạo table `telemetry.webhook_delivery_logs`**:
   - New Table (chọn schema = telemetry)
   - Điền columns theo bảng trên

### Cách 2: SQL Script (Quick setup)

**Chú ý**: User có thể copy/paste vào SQL Editor của Supabase

```sql
-- 1. Tạo schema telemetry
CREATE SCHEMA IF NOT EXISTS telemetry;

-- 2. Tạo table public.webhooks
CREATE TABLE IF NOT EXISTS public.webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  name varchar(255) NOT NULL,
  url text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  is_deleted boolean NOT NULL DEFAULT false,
  health_status varchar(50) NOT NULL DEFAULT 'healthy',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes cho performance
CREATE INDEX IF NOT EXISTS idx_webhooks_enabled ON public.webhooks(enabled);
CREATE INDEX IF NOT EXISTS idx_webhooks_is_deleted ON public.webhooks(is_deleted);
CREATE INDEX IF NOT EXISTS idx_webhooks_health_status ON public.webhooks(health_status);
CREATE INDEX IF NOT EXISTS idx_webhooks_tenant_id ON public.webhooks(tenant_id);

-- 3. Tạo table telemetry.webhook_delivery_logs
CREATE TABLE IF NOT EXISTS telemetry.webhook_delivery_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id uuid NOT NULL,
  tenant_id uuid,
  status varchar(50) NOT NULL,
  response_time_ms integer,
  status_code integer,
  delivered_at timestamptz NOT NULL DEFAULT now(),
  payload jsonb,
  error_message text
);

-- Foreign key
ALTER TABLE telemetry.webhook_delivery_logs 
  ADD CONSTRAINT fk_webhook_delivery_logs_webhook
  FOREIGN KEY (webhook_id) REFERENCES public.webhooks(id) ON DELETE CASCADE;

-- Indexes cho performance
CREATE INDEX IF NOT EXISTS idx_webhook_delivery_logs_webhook_id ON telemetry.webhook_delivery_logs(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_delivery_logs_tenant_id ON telemetry.webhook_delivery_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_webhook_delivery_logs_status ON telemetry.webhook_delivery_logs(status);
CREATE INDEX IF NOT EXISTS idx_webhook_delivery_logs_delivered_at ON telemetry.webhook_delivery_logs(delivered_at);
CREATE INDEX IF NOT EXISTS idx_webhook_delivery_logs_status_code ON telemetry.webhook_delivery_logs(status_code);

-- 4. Optional: Disable RLS for development (enable in production)
ALTER TABLE public.webhooks DISABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry.webhook_delivery_logs DISABLE ROW LEVEL SECURITY;
```

---

## 📈 Expected Result sau khi tạo tables

### Before (hiện tại):
```javascript
Error getting webhooks stats: {
  "message": "Unknown error",
  "code": "N/A",
  "details": null,
  "hint": null
}

// Dashboard stats webhooks section:
{
  active: 0,
  unhealthy: 0,
  total_deliveries: 0
}
```

### After (khi tables đã tồn tại):
```javascript
// ✅ No error

// Dashboard stats webhooks section (với sample data):
{
  active: 12,           // Số webhooks enabled=true AND is_deleted=false
  unhealthy: 3,         // Số webhooks enabled=true AND health_status != 'healthy'
  total_deliveries: 1847  // Tổng số records trong telemetry.webhook_delivery_logs
}
```

---

## 🎯 Tại sao lỗi xảy ra?

### Root Cause:
1. **Supabase database chưa có table `public.webhooks`**
   - Query 1 và 2 đều fail vì table không tồn tại
2. **Supabase database chưa có schema `telemetry`** hoặc **table `telemetry.webhook_delivery_logs`**
   - Query 3 fail vì schema/table không tồn tại

### Error flow:
```
dashboardService.getWebhooksStats()
  → Query 1: supabase.from('webhooks') → ❌ Table not found
    → activeError thrown
      → catch block
        → console.error('Error getting webhooks stats', {...})
          → return { active: 0, unhealthy: 0, total_deliveries: 0 }
```

---

## 🔗 Related Files

### Code files:
- `/services/dashboardService.ts` - Lines 359-406 (getWebhooksStats method)
- `/hooks/useWebhooks.ts` - Uses webhooksApi.getStats()
- `/components/tenants/TenantWebhooksTab.tsx` - UI component

### Golang API (future):
- `/golang-api/handlers/webhooks_handler.go:667` - GetWebhookStatistics endpoint
- `/golang-api/handlers/tenant_details_handler.go:192` - Tenant webhooks count

### Documentation:
- `/docs/developer/webhooks-api-reference.md` - API spec cho /webhooks/stats

---

## ✅ Action Items cho User

### Immediate (để fix lỗi):
1. [ ] Tạo schema `telemetry` trong Supabase (nếu chưa có)
2. [ ] Tạo table `public.webhooks` với schema ở trên
3. [ ] Tạo table `telemetry.webhook_delivery_logs` với schema ở trên
4. [ ] Refresh dashboard để verify stats hoạt động

### Optional (để test với data):
5. [ ] Insert một số sample webhooks:
```sql
INSERT INTO public.webhooks (tenant_id, name, url, enabled, health_status) VALUES
  ('01234567-89ab-cdef-0123-456789abcdef', 'Test Webhook 1', 'https://example.com/hook1', true, 'healthy'),
  ('01234567-89ab-cdef-0123-456789abcdef', 'Test Webhook 2', 'https://example.com/hook2', true, 'unhealthy'),
  ('01234567-89ab-cdef-0123-456789abcdef', 'Test Webhook 3', 'https://example.com/hook3', false, 'healthy');
```

6. [ ] Insert một số sample delivery logs:
```sql
INSERT INTO telemetry.webhook_delivery_logs (webhook_id, tenant_id, status, status_code) VALUES
  ((SELECT id FROM public.webhooks LIMIT 1), '01234567-89ab-cdef-0123-456789abcdef', 'success', 200),
  ((SELECT id FROM public.webhooks LIMIT 1), '01234567-89ab-cdef-0123-456789abcdef', 'failed', 500);
```

---

## 📚 Tham khảo

### Supabase docs:
- [Creating tables](https://supabase.com/docs/guides/database/tables)
- [Schema management](https://supabase.com/docs/guides/database/schemas)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

### App architecture:
- Current: Frontend → Supabase direct
- Future: Frontend → Golang API → Supabase/Postgres

---

## 🎓 Kiến thức bổ sung

### Tại sao dùng schema `telemetry`?
- Separation of concerns: Logs và telemetry data tách biệt khỏi business data
- Better organization: Grouping related tables
- Security: Có thể apply different RLS policies cho schema khác nhau
- Performance: Query optimization dễ dàng hơn

### Best practices cho webhook delivery logs:
- ✅ Store in separate schema (telemetry)
- ✅ Index on webhook_id, status, delivered_at
- ✅ Consider partitioning for large datasets (future optimization)
- ✅ Implement data retention policy (auto-delete old logs)

---

**Tổng kết**: Lỗi này là **expected behavior** khi tables chưa được tạo trong Supabase. Đây không phải bug trong code mà là missing infrastructure. Code đã handle error correctly và return zero stats.
