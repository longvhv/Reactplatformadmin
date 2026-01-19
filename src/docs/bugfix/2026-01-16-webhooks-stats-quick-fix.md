# QUICK FIX: Webhooks Stats Error

**Ngày**: 2026-01-16  
**Lỗi**: `Error getting webhooks stats: { "message": "Unknown error", "code": "N/A" }`  
**Status**: ✅ Debug tool created - Ready to troubleshoot

---

## 🎯 TL;DR - Quick Fix Steps

Bạn ĐÃ CÓ tables rồi (`public.webhooks` và `telemetry.webhook_delivery_logs`), nhưng vẫn lỗi.

Vấn đề có thể là:
1. ❌ **Thiếu columns** (`enabled`, `is_deleted`, `health_status`)
2. ❌ **Sai tên columns** (vd: `is_active` thay vì `enabled`)
3. ❌ **RLS permissions** chặn ANON key
4. ❌ **Schema permissions** không cho access `telemetry` schema

---

## 🚀 Cách fix NHANH NHẤT

### Bước 1: Chạy Debug Tool

Truy cập:
```
http://localhost:5173/debug/webhooks-schema
```

Click **"Run Schema Verification"** button.

---

### Bước 2: Đọc kết quả

Debug tool sẽ tự động:
- ✅ Check tables có tồn tại
- ✅ Check columns có đúng tên
- ✅ Test cả 3 queries
- ✅ Suggest alternative column names
- ✅ Hiển thị detailed errors

---

### Bước 3: Fix theo suggestions

Tool sẽ chỉ CHÍNH XÁC vấn đề là gì và cách fix.

Ví dụ:

**Nếu thiếu column `enabled`**:
```sql
ALTER TABLE public.webhooks 
ADD COLUMN enabled boolean NOT NULL DEFAULT true;
```

**Nếu column tên khác (vd: `is_active`)**:
Update code hoặc rename column.

**Nếu RLS chặn**:
```sql
ALTER TABLE public.webhooks DISABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry.webhook_delivery_logs DISABLE ROW LEVEL SECURITY;
```

---

## 📋 Most Likely Issue

Dựa trên error message "Unknown error" với code "N/A", khả năng cao nhất là:

### **Issue: Missing Required Columns**

Table `public.webhooks` có thể thiếu 1 trong 3 columns:
- `enabled` (boolean)
- `is_deleted` (boolean)  
- `health_status` (varchar)

---

## 🔧 Giải pháp nhanh: Add Missing Columns

Copy/paste SQL này vào Supabase SQL Editor:

```sql
-- Check columns hiện tại
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'webhooks'
ORDER BY ordinal_position;

-- Nếu thiếu columns, add chúng:
-- (Chỉ chạy nếu column chưa tồn tại, nếu đã có thì skip)

ALTER TABLE public.webhooks 
ADD COLUMN IF NOT EXISTS enabled boolean NOT NULL DEFAULT true;

ALTER TABLE public.webhooks 
ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false;

ALTER TABLE public.webhooks 
ADD COLUMN IF NOT EXISTS health_status varchar(50) NOT NULL DEFAULT 'healthy';

-- Create indexes cho performance
CREATE INDEX IF NOT EXISTS idx_webhooks_enabled 
  ON public.webhooks(enabled);
CREATE INDEX IF NOT EXISTS idx_webhooks_is_deleted 
  ON public.webhooks(is_deleted);
CREATE INDEX IF NOT EXISTS idx_webhooks_health_status 
  ON public.webhooks(health_status);

-- Verify
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'webhooks'
  AND column_name IN ('enabled', 'is_deleted', 'health_status');
```

---

## ✅ Verification

Sau khi chạy SQL trên:

1. **Refresh debug tool** (`/debug/webhooks-schema`)
2. **Click "Run Schema Verification"** lại
3. **Should see**: ✅ ALL TESTS PASSED
4. **Refresh dashboard** (`/core/dashboard`)
5. **Error gone!** 🎉

---

## 🔍 Alternative: Manual Check

Nếu không muốn dùng debug tool, check manually:

### 1. Vào Supabase UI → Table Editor
- Select `public.webhooks` table
- Check columns list

### 2. Verify có đủ 3 columns:
- [ ] `enabled` (boolean, default: true)
- [ ] `is_deleted` (boolean, default: false)
- [ ] `health_status` (varchar/text, default: 'healthy')

### 3. Nếu thiếu, add columns qua UI:
- Click "+" button → Add column
- Điền thông tin theo bảng ở trên

---

## 📊 Expected Result

Sau khi fix:

**Dashboard console logs**:
```javascript
// ❌ TRƯỚC:
Error getting webhooks stats: {
  "message": "Unknown error",
  "code": "N/A",
  "details": null,
  "hint": null
}

// ✅ SAU:
// (No error log)
```

**Dashboard webhooks card**:
```javascript
{
  active: 3,           // Số webhooks enabled=true, is_deleted=false
  unhealthy: 1,        // Số webhooks health_status != 'healthy'
  total_deliveries: 127 // Tổng logs trong telemetry.webhook_delivery_logs
}
```

---

## 📁 Files Reference

### Debug Tool:
- Route: `/debug/webhooks-schema`
- Component: `/components/debug/WebhooksSchemaDebug.tsx`
- Utility: `/utils/debug/verifyWebhooksSchema.ts`

### Source Code:
- Query code: `/services/dashboardService.ts:359-406`

### Documentation:
- **Full analysis**: `/docs/bugfix/2026-01-16-webhooks-stats-error-analysis.md`
- **Debug tool guide**: `/docs/bugfix/2026-01-16-webhooks-schema-debug-tool.md`
- **This file**: `/docs/bugfix/2026-01-16-webhooks-stats-quick-fix.md` ⬅️ YOU ARE HERE

---

## 💡 Pro Tips

1. **Always run debug tool first** - Saves time vs manual checking
2. **Check browser console (F12)** - More detailed logs
3. **Use `IF NOT EXISTS`** - Safe to re-run SQL multiple times
4. **Index columns** - Performance optimization
5. **Disable RLS in dev** - Enable in production với proper policies

---

## 🎓 Understanding the Error

**Tại sao lỗi "Unknown error" với "code: N/A"?**

Khi Supabase query fails nhưng error object không có `.message` hoặc `.code`:
```typescript
catch (error: any) {
  console.error('Error getting webhooks stats:', {
    message: error?.message || 'Unknown error',  // ← No message = "Unknown error"
    code: error?.code || 'N/A',                  // ← No code = "N/A"
  });
}
```

Điều này thường xảy ra khi:
- Query syntax sai (thiếu column)
- Type mismatch (column type không đúng)
- Network timeout
- Unexpected Supabase client error

Debug tool sẽ catch detailed error và hiển thị chính xác issue.

---

**Bottom line**: Chạy debug tool → Fix theo suggestions → Done! 🚀
