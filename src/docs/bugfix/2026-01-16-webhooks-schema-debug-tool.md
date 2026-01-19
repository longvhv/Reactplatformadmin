# Webhooks Schema Debug Tool - Hướng dẫn sử dụng

**Ngày**: 2026-01-16  
**Loại**: Debug Tool  
**Mục đích**: Troubleshoot lỗi "Error getting webhooks stats: Unknown error"

---

## 🎯 Mục đích

Debug tool này giúp verify schema của 2 tables:
- `public.webhooks`
- `telemetry.webhook_delivery_logs`

Và test tất cả 3 queries trong `dashboardService.getWebhooksStats()`.

---

## 🚀 Cách sử dụng

### Bước 1: Access Debug Page

Trong development mode, truy cập:

```
http://localhost:5173/debug/webhooks-schema
```

Hoặc trong deployed app:

```
https://your-app.supabase.co/debug/webhooks-schema
```

**⚠️ Lưu ý**: Route này chỉ hoạt động trong development mode (`process.env.NODE_ENV === "development"`)

---

### Bước 2: Click "Run Schema Verification"

Click button màu indigo để chạy tất cả tests.

---

### Bước 3: Xem kết quả

Tool sẽ chạy **6 tests**:

#### Test 1: ✅ Checking public.webhooks table
- Kiểm tra table có tồn tại không
- Hiển thị số lượng rows
- Hiển thị sample data (nếu có)
- Liệt kê tất cả columns

#### Test 2: ✅ Checking required columns
- Kiểm tra 3 columns bắt buộc:
  - `enabled` (boolean)
  - `is_deleted` (boolean)
  - `health_status` (varchar/text)

#### Test 3: ✅ Testing Query 1 (Active webhooks)
- Test query: `enabled=true AND is_deleted=false`
- Hiển thị số lượng active webhooks

#### Test 4: ✅ Testing Query 2 (Unhealthy webhooks)
- Test query: `enabled=true AND health_status != 'healthy' AND is_deleted=false`
- Hiển thị số lượng unhealthy webhooks

#### Test 5: ✅ Checking telemetry.webhook_delivery_logs
- Kiểm tra table trong schema `telemetry`
- Hiển thị số lượng delivery logs
- Hiển thị sample columns

#### Test 6: ✅ Testing Query 3 (Total deliveries)
- Test query: COUNT all rows trong `telemetry.webhook_delivery_logs`
- Hiển thị tổng số deliveries

---

### Bước 4: Đọc Summary

Nếu **ALL TESTS PASSED** ✅:
- Stats sẽ hoạt động bình thường
- Hiển thị expected stats: `{ active, unhealthy, total_deliveries }`

Nếu **SOME TESTS FAILED** ❌:
- Xem chi tiết errors ở mỗi test
- Follow "Next steps" suggestions

---

## 🔍 Các loại lỗi phổ biến

### Lỗi 1: Table không tồn tại

**Error message**:
```
❌ Error querying webhooks table: {
  message: "relation \"public.webhooks\" does not exist",
  code: "42P01"
}
```

**Giải pháp**: Bạn đã có table rồi (theo screenshot), skip lỗi này.

---

### Lỗi 2: Missing columns

**Error message**:
```
❌ Missing columns or wrong schema: {
  message: "column \"enabled\" does not exist",
  code: "42703"
}
```

**Giải pháp**: 
1. Vào Supabase UI → Table Editor → public.webhooks
2. Click "Add Column"
3. Thêm columns bị thiếu:

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| enabled | boolean | NO | true |
| is_deleted | boolean | NO | false |
| health_status | varchar(50) | NO | 'healthy' |

---

### Lỗi 3: Wrong column names (Alternative names)

**Error message**:
```
❌ enabled: NOT FOUND (tried: enabled, is_enabled, active, is_active)
```

**Giải pháp**:

Tool sẽ tự động check alternative names. Nếu tìm thấy:
```
✅ enabled: Found as "is_active"
```

Thì bạn cần update code trong `/services/dashboardService.ts`:

```typescript
// Thay vì:
.eq('enabled', true)

// Sử dụng:
.eq('is_active', true)
```

Tương tự cho `is_deleted` và `health_status`.

---

### Lỗi 4: RLS Permission denied

**Error message**:
```
❌ Error querying webhooks table: {
  message: "permission denied for table webhooks",
  code: "42501"
}
```

**Giải pháp**:

**Option 1**: Disable RLS (development only)
```sql
ALTER TABLE public.webhooks DISABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry.webhook_delivery_logs DISABLE ROW LEVEL SECURITY;
```

**Option 2**: Add RLS policy cho ANON role
```sql
CREATE POLICY "Allow anonymous read access on webhooks"
  ON public.webhooks
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous read access on webhook_delivery_logs"
  ON telemetry.webhook_delivery_logs
  FOR SELECT
  TO anon
  USING (true);
```

---

### Lỗi 5: Schema telemetry không accessible

**Error message**:
```
❌ Error querying webhook_delivery_logs: {
  message: "permission denied for schema telemetry",
  code: "42501"
}
```

**Giải pháp**:

Grant USAGE permission cho schema `telemetry`:
```sql
GRANT USAGE ON SCHEMA telemetry TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA telemetry TO anon;
```

---

## 📊 Expected Output khi thành công

```javascript
🔍 Verifying Webhooks Schema

📊 Test 1: Checking public.webhooks table...
✅ Table exists, total rows: 5
Sample row columns: ['id', 'tenant_id', 'name', 'url', 'enabled', 'is_deleted', 'health_status', 'created_at', 'updated_at']

📊 Test 2: Checking required columns...
✅ Required columns exist

📊 Test 3: Testing Query 1 (Active webhooks)...
✅ Query 1 success, active count: 3

📊 Test 4: Testing Query 2 (Unhealthy webhooks)...
✅ Query 2 success, unhealthy count: 1

📊 Test 5: Checking telemetry.webhook_delivery_logs table...
✅ Table exists, total rows: 127
Sample row columns: ['id', 'webhook_id', 'tenant_id', 'status', 'response_time_ms', ...]

📊 Test 6: Testing Query 3 (Total deliveries)...
✅ Query 3 success, deliveries count: 127

📋 SUMMARY:
====================
✅ ALL TESTS PASSED - Stats should work!
Expected stats: {
  active: 3,
  unhealthy: 1,
  total_deliveries: 127
}
```

---

## 🛠️ Technical Details

### Files created:

1. **`/utils/debug/verifyWebhooksSchema.ts`**
   - Export 2 functions:
     - `verifyWebhooksSchema()` - Main verification
     - `verifyWebhooksSchemaAlternative()` - Check alternative column names

2. **`/components/debug/WebhooksSchemaDebug.tsx`**
   - UI component với button và results display
   - Capture console logs và hiển thị trong UI
   - Color-coded results (green ✅, red ❌, yellow ⚠️)

3. **Route**: `/debug/webhooks-schema`
   - Added to `/App.tsx`
   - Development mode only

---

## 🎯 Next Steps sau khi fix

Sau khi tất cả tests passed:

1. **Refresh Dashboard page** (`/core/dashboard`)
2. **Check console logs** - Error "Error getting webhooks stats" sẽ biến mất
3. **Verify dashboard stats** - Webhooks card sẽ hiển thị số liệu thực

---

## 🔗 Related Files

### Code files:
- `/services/dashboardService.ts:359-406` - getWebhooksStats() method
- `/utils/debug/verifyWebhooksSchema.ts` - Debug utility
- `/components/debug/WebhooksSchemaDebug.tsx` - Debug UI
- `/App.tsx` - Debug route

### Documentation:
- `/docs/bugfix/2026-01-16-webhooks-stats-error-analysis.md` - Chi tiết lỗi và schema
- `/docs/bugfix/2026-01-16-webhooks-schema-debug-tool.md` - File này

---

## ⚠️ Important Notes

1. **Development only**: Debug route chỉ accessible trong dev mode
2. **Browser console**: Detailed logs vẫn được output ra console (F12)
3. **No data modification**: Tool chỉ READ data, không modify gì cả
4. **Safe to run multiple times**: Có thể chạy bao nhiêu lần cũng được

---

## 📚 Useful SQL Commands

### Check current schema:
```sql
-- List all columns in public.webhooks
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'webhooks'
ORDER BY ordinal_position;

-- List all columns in telemetry.webhook_delivery_logs
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'telemetry' AND table_name = 'webhook_delivery_logs'
ORDER BY ordinal_position;
```

### Check RLS status:
```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('webhooks', 'webhook_delivery_logs');
```

### Check existing policies:
```sql
SELECT schemaname, tablename, policyname, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('webhooks', 'webhook_delivery_logs');
```

---

**Tổng kết**: Debug tool này giúp bạn quickly identify và fix schema issues mà không cần manually check từng query trong code. Chạy tool → Xem errors → Fix theo suggestions → Re-run → Done! 🎉
