# Fix: Subscription Orders Schema Mismatch (Lần 2)

## Vấn đề
1. Click "Sửa đơn hàng" bị redirect về dashboard
2. Data có thể không hiển thị đúng vì schema mismatch

## Nguyên nhân

### 1. Route Order Sai
Trong `/modules/subscription-orders/index.tsx`, route `/:id` đứng trước `/edit/:id` nên React Router match sai.

### 2. Schema Mismatch
**Database schema thực tế** (từ migration 014):
```sql
CREATE TABLE subscription_orders (
  _id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  product_id UUID NOT NULL,  -- ❌ Không phải package_id
  customer_id UUID,
  order_code VARCHAR(50),     -- ❌ Không phải order_number
  order_date TIMESTAMPTZ,
  billing_cycle VARCHAR(20),
  base_price DECIMAL(12,2),
  discount_amount DECIMAL(12,2),
  tax_amount DECIMAL(12,2),
  total_amount DECIMAL(12,2),
  currency VARCHAR(3),        -- ❌ Không phải currency_code
  payment_status VARCHAR(20),
  payment_method VARCHAR(50),
  status VARCHAR(20),
  ...
)
```

**API Type Definition** (`/api/ordersApi.ts`):
```typescript
interface Order {
  order_number: string;        // ❌ DB có order_code
  currency_code: string;        // ❌ DB có currency
  items_snapshot: ItemSnapshot[]; // ❌ DB không có
  billing_info: BillingInfo;   // ❌ DB không có
  package_snapshot?: any;       // ❌ DB không có
}
```

## Giải pháp

### 1. ✅ Fix Route Order
Đổi thứ tự routes trong `/modules/subscription-orders/index.tsx`:
- `/core/subscription-orders` (list)
- `/core/subscription-orders/add` (add) ⬅️ Lên trước
- `/core/subscription-orders/edit/:id` (edit) ⬅️ Lên trước
- `/core/subscription-orders/:id` (detail) ⬅️ Xuống sau

### 2. ⚠️ Schema Mismatch - Chưa Fix
Cần:
- Update API type definition để match với DB schema
- Hoặc update DB migration để match với API
- Hoặc tạo mapping layer trong adapter

## Files đã sửa
1. `/modules/subscription-orders/index.tsx` - Fix route order ✅

## Files cần kiểm tra
1. `/api/ordersApi.ts` - Type definition cần update
2. `/supabase/migrations/014_create_subscription_orders_table.sql` - DB schema
3. `/pages/SubscriptionOrdersPage.tsx` - UI đang dùng fields không tồn tại

## Recommendation
**Nên chạy lại migration đúng** hoặc **tạo migration mới** để DB schema match với API definition hiện tại.

## Ngày sửa
2026-01-15
