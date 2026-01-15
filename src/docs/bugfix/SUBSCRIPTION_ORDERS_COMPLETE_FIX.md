# Subscription Orders - Complete Fix

## Tổng quan các vấn đề

### 1. ✅ Route Order Fix
**Vấn đề:** Click "Sửa đơn hàng" bị redirect về dashboard  
**Nguyên nhân:** Route `/:id` đứng trước `/edit/:id`  
**Giải pháp:** Đã fix trong `/modules/subscription-orders/index.tsx`

### 2. ⚠️ Schema Mismatch
**Vấn đề:** Data không hiển thị đúng vì field names khác nhau  
**Nguyên nhân:** DB schema (migration 014) khác với API type definition

#### So sánh Schema

| API Field | DB Field (Old) | Status |
|-----------|----------------|--------|
| `order_number` | `order_code` | ❌ Khác |
| `currency_code` | `currency` | ❌ Khác |
| `subtotal_amount` | N/A | ❌ Thiếu |
| `items_snapshot` | N/A | ❌ Thiếu |
| `billing_info` | N/A | ❌ Thiếu |
| `po_number` | N/A | ❌ Thiếu |
| `type` | N/A | ❌ Thiếu |
| `credit_applied` | N/A | ❌ Thiếu |
| `payment_ref_id` | `payment_reference` | ❌ Khác |

### 3. ❓ RLS Policy
**Status:** Bảng `subscription_orders` KHÔNG CÓ RLS nên không gặp vấn đề như `roles`

## Giải pháp

### Bước 1: Chạy Migration (QUAN TRỌNG)
Vào Supabase Dashboard → SQL Editor, chạy:
```sql
-- File: /supabase/migrations/023_update_subscription_orders_schema.sql
```

Migration này sẽ:
- ✅ Add các columns mới: `order_number`, `currency_code`, `items_snapshot`, `billing_info`, etc.
- ✅ Migrate data từ columns cũ sang columns mới
- ✅ Giữ nguyên columns cũ để backward compatibility

### Bước 2: Kiểm tra Data
Sau khi chạy migration, kiểm tra:
```sql
SELECT 
  order_number, 
  order_code,
  currency_code,
  currency,
  items_snapshot,
  billing_info
FROM subscription_orders
LIMIT 5;
```

### Bước 3: Test UI
1. Vào trang `/core/subscription-orders`
2. Kiểm tra:
   - ✅ Data hiển thị đúng
   - ✅ Click "Sửa" không bị redirect
   - ✅ Click "Xem chi tiết" hoạt động
   - ✅ Stats cards hiển thị số liệu

## Files đã thay đổi

### 1. `/modules/subscription-orders/index.tsx`
**Thay đổi:** Đổi thứ tự routes  
**Status:** ✅ Done

### 2. `/supabase/migrations/023_update_subscription_orders_schema.sql`
**Thay đổi:** Add columns mới, migrate data  
**Status:** ⚠️ Cần chạy trong Supabase Dashboard

### 3. `/docs/bugfix/SUBSCRIPTION_ORDERS_COMPLETE_FIX.md`
**Thay đổi:** Documentation  
**Status:** ✅ Done

## Next Steps (Tùy chọn)

### Option A: Chạy Migration (Recommended)
- Pro: Schema match 100%, không cần code thay đổi
- Con: Cần access Supabase Dashboard

### Option B: Update Adapter với Field Mapping
- Pro: Không cần migration, chỉ code changes
- Con: Performance overhead, phức tạp hơn

### Option C: Update API Type Definition
- Pro: Đơn giản
- Con: Breaking changes cho code đang dùng API này

## Recommendation
**👉 Chạy migration (Option A)** vì:
1. API type definition đã đúng chuẩn
2. UI code đã viết theo API
3. Migration sẽ giữ backward compatibility

## Ngày sửa
2026-01-15

## Tác giả
AI Assistant
