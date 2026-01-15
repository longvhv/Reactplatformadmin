# Subscription Orders - Use Cases & Business Scenarios

## 📋 Overview

Real-world use cases and business scenarios for **Subscription Orders** module.

---

## 🎯 Use Case Categories

1. [Order Creation & Processing](#1-order-creation--processing)
2. [Payment Flows](#2-payment-flows)
3. [Package Snapshot Protection](#3-package-snapshot-protection)
4. [Order Lifecycle Management](#4-order-lifecycle-management)
5. [Reporting & Analytics](#5-reporting--analytics)
6. [Edge Cases & Error Handling](#6-edge-cases--error-handling)
7. [Multi-Currency Support](#7-multi-currency-support)

---

## 1. Order Creation & Processing

### Use Case 1.1: Standard Package Purchase

**Scenario:** Một tenant muốn mua gói "HRM Professional" với giá 2,990,000 VND/tháng.

**Flow:**
```
1. Tenant chọn gói "HRM Professional" trên pricing page
2. System tạo order với status = PENDING
3. System lưu package_snapshot để bảo toàn giá & quyền lợi
4. Tenant được redirect đến payment gateway
5. Sau khi thanh toán thành công → Update order status = PAID
6. System tự động tạo tenant_subscription từ order
```

**API Calls:**
```bash
# Step 1: Create order
POST /api/v1/subscription-orders
{
  "tenant_id": "01940821-1234-7890-abcd-tenant00001",
  "package_id": "01940822-5678-7890-abcd-package0001",
  "order_number": "ORD-2025-001234",
  "total_amount": 2990000,
  "currency_code": "VND",
  "status": "PENDING"
}

# Step 2: Payment gateway callback
PATCH /api/v1/subscription-orders/01940824-f123-7890-abcd-1234567890ab
{
  "status": "PAID",
  "payment_method": "CREDIT_CARD",
  "version": 1
}
```

**Business Rules:**
- ✅ Order số phải unique toàn hệ thống
- ✅ Package snapshot tự động capture khi tạo order
- ✅ Chỉ cho phép tạo subscription khi order status = PAID

---

### Use Case 1.2: Upgrade Package

**Scenario:** Tenant hiện đang dùng "HRM Starter" (990k/tháng) muốn upgrade lên "HRM Professional" (2,990k/tháng).

**Flow:**
```
1. System tính toán prorated amount cho subscription hiện tại
2. Tạo order mới với total_amount = prorated_price
3. Sau khi thanh toán → Cancel subscription cũ
4. Tạo subscription mới với gói Professional
```

**Business Rules:**
- ✅ Prorated credit từ gói cũ được trừ vào order mới
- ✅ Package snapshot của gói mới được lưu trong order
- ✅ Subscription cũ bị cancel nhưng không delete

---

### Use Case 1.3: Annual Subscription Purchase

**Scenario:** Tenant mua gói "HRM Professional" theo năm với discount 20%.

**Flow:**
```
1. System apply discount: 2,990,000 × 12 × 0.8 = 28,704,000 VND
2. Tạo order với total_amount = 28,704,000
3. Package snapshot lưu billing_cycle = "YEARLY"
4. Sau thanh toán → Tạo subscription với end_at = start_at + 365 days
```

**Package Snapshot:**
```json
{
  "code": "hrm-pro-annual",
  "name": "HRM Professional - Annual",
  "price_amount": 28704000,
  "currency_code": "VND",
  "billing_cycle": "YEARLY",
  "discount_applied": 0.2,
  "original_price": 35880000
}
```

---

## 2. Payment Flows

### Use Case 2.1: Credit Card Payment (Immediate)

**Scenario:** Tenant thanh toán bằng thẻ tín dụng qua Stripe.

**Flow:**
```
1. Create order with status = PENDING
2. Redirect to Stripe Checkout
3. Stripe webhook callback → Update order status = PAID
4. System creates subscription immediately
```

**Webhook Handler:**
```javascript
// Stripe webhook endpoint
POST /webhooks/stripe
{
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "metadata": {
        "order_id": "01940824-f123-7890-abcd-1234567890ab"
      }
    }
  }
}

// Update order
PATCH /api/v1/subscription-orders/{order_id}
{
  "status": "PAID",
  "payment_method": "CREDIT_CARD",
  "version": 1
}
```

---

### Use Case 2.2: Bank Transfer (Pending Verification)

**Scenario:** Tenant chọn chuyển khoản ngân hàng, cần admin xác nhận thủ công.

**Flow:**
```
1. Create order with status = PENDING
2. System hiển thị thông tin tài khoản ngân hàng
3. Tenant chuyển khoản (1-3 ngày làm việc)
4. Admin nhận notification về payment
5. Admin xác nhận → Update order status = PAID
6. System creates subscription
```

**Admin Action:**
```bash
# Admin confirms payment
PATCH /api/v1/subscription-orders/01940824-f123-7890-abcd-1234567890ab
{
  "status": "PAID",
  "payment_method": "BANK_TRANSFER",
  "version": 1
}
```

**Business Rules:**
- ⏱️ Order PENDING quá 7 ngày → Auto-cancel
- 📧 Send email reminder sau 3 ngày nếu chưa thanh toán
- ✅ Admin có thể attach proof of payment (image)

---

### Use Case 2.3: E-wallet Payment (MoMo, ZaloPay)

**Scenario:** Tenant thanh toán qua MoMo.

**Flow:**
```
1. Create order with status = PENDING
2. Call MoMo API to create payment request
3. Redirect tenant to MoMo app
4. MoMo IPN callback → Update order status = PAID
5. System creates subscription
```

**MoMo IPN Handler:**
```javascript
POST /webhooks/momo
{
  "orderId": "ORD-2025-001234",
  "resultCode": 0, // 0 = success
  "message": "Successful"
}

// Update order
PATCH /api/v1/subscription-orders/{order_id}
{
  "status": "PAID",
  "payment_method": "MOMO",
  "version": 1
}
```

---

## 3. Package Snapshot Protection

### Use Case 3.1: Price Increase After Order

**Scenario:** Sau khi tenant tạo order, admin tăng giá gói từ 2,990k lên 3,490k.

**Flow:**
```
Day 1:
- Package price = 2,990,000 VND
- Tenant creates order → package_snapshot saves price = 2,990,000

Day 2:
- Admin increases package price to 3,490,000 VND

Day 3:
- Tenant completes payment
- System creates subscription using snapshot price = 2,990,000 ✓
- Tenant pays original price, not new price
```

**Package Snapshot:**
```json
{
  "_id": "01940822-5678-7890-abcd-package0001",
  "code": "hrm-pro",
  "name": "HRM Professional",
  "price_amount": 2990000,  // ← Original price preserved
  "currency_code": "VND",
  "snapshot_at": "2025-01-10T10:00:00Z"
}
```

**Business Rules:**
- ✅ Package snapshot is immutable after order creation
- ✅ Renewal orders use current package price, not snapshot
- ✅ Tenant always pays the price they saw at checkout

---

### Use Case 3.2: Entitlements Change After Order

**Scenario:** Admin thay đổi quyền lợi của gói sau khi tenant đã đặt hàng.

**Flow:**
```
Day 1:
- Package entitlements: { "max_users": 50, "max_storage": 100 }
- Tenant creates order → snapshot saves these entitlements

Day 2:
- Admin downgrades package: { "max_users": 30, "max_storage": 50 }

Day 3:
- Tenant completes payment
- Subscription is created with original entitlements:
  { "max_users": 50, "max_storage": 100 } ✓
```

**Package Snapshot:**
```json
{
  "entitlements_config": {
    "apps": {
      "hrm": {
        "enabled": true,
        "features": {
          "employee_management": true,
          "payroll": true,
          "advanced_reports": true
        }
      }
    }
  },
  "max_users": 50,
  "max_storage": 100
}
```

---

### Use Case 3.3: Package Deleted After Order

**Scenario:** Admin xóa (soft delete) gói dịch vụ sau khi có tenant đặt hàng.

**Flow:**
```
Day 1:
- Tenant creates order for package "HRM Advanced"
- package_snapshot is saved

Day 2:
- Admin soft deletes "HRM Advanced" package

Day 3:
- Tenant completes payment
- System can still create subscription using snapshot ✓
- Package is no longer available for new orders
```

**Business Rules:**
- ✅ Existing orders are not affected by package deletion
- ✅ Package snapshot contains all necessary data
- ✅ New tenants cannot order deleted packages

---

## 4. Order Lifecycle Management

### Use Case 4.1: Order Expiration

**Scenario:** Order PENDING quá 7 ngày chưa thanh toán.

**Flow:**
```
Day 0: Order created (status = PENDING)
Day 7: Cronjob runs → Check expired orders
Day 7: Auto-cancel order (status = CANCELLED)
```

**Cronjob Query:**
```sql
SELECT * FROM subscription_orders
WHERE status = 'PENDING'
  AND created_at < NOW() - INTERVAL '7 days'
  AND deleted_at IS NULL;
```

**Auto-cancel Action:**
```bash
PATCH /api/v1/subscription-orders/{order_id}
{
  "status": "CANCELLED",
  "version": {current_version}
}
```

**Business Rules:**
- ⏱️ PENDING timeout: 7 days
- 📧 Email reminders: Day 3, Day 5
- ✅ Tenant có thể tạo order mới sau khi bị cancel

---

### Use Case 4.2: Payment Failed

**Scenario:** Payment gateway trả về lỗi (thẻ không đủ tiền, thẻ hết hạn, etc.)

**Flow:**
```
1. Tenant submits payment
2. Payment gateway returns error
3. System updates order status = FAILED
4. Tenant receives error notification
5. Tenant có thể retry payment
```

**API Call:**
```bash
PATCH /api/v1/subscription-orders/{order_id}
{
  "status": "FAILED",
  "version": 1
}
```

**Retry Flow:**
```
1. Tenant clicks "Retry Payment"
2. System checks if order exists and status = FAILED
3. Reset status to PENDING
4. Redirect to payment gateway again
```

---

### Use Case 4.3: Order Cancellation (User-initiated)

**Scenario:** Tenant đổi ý và muốn hủy order trước khi thanh toán.

**Flow:**
```
1. Tenant clicks "Cancel Order" button
2. System updates order status = CANCELLED
3. Subscription is NOT created
4. Tenant receives cancellation confirmation email
```

**Business Rules:**
- ✅ Chỉ cho phép cancel order khi status = PENDING
- ❌ Không thể cancel order đã PAID
- ✅ Refund process (if needed) is handled separately

---

## 5. Reporting & Analytics

### Use Case 5.1: Revenue Dashboard

**Scenario:** Admin muốn xem tổng doanh thu theo tháng.

**Query:**
```sql
SELECT 
  DATE_TRUNC('month', created_at) AS month,
  currency_code,
  COUNT(*) AS order_count,
  SUM(total_amount) AS total_revenue,
  AVG(total_amount) AS avg_order_value
FROM subscription_orders
WHERE status = 'PAID'
  AND deleted_at IS NULL
  AND created_at >= '2025-01-01'
GROUP BY month, currency_code
ORDER BY month DESC;
```

**Result:**
```
| month    | currency | order_count | total_revenue | avg_order_value |
|----------|----------|-------------|---------------|-----------------|
| 2025-01  | VND      | 152         | 456,800,000   | 3,005,263      |
| 2024-12  | VND      | 138         | 412,200,000   | 2,987,681      |
```

---

### Use Case 5.2: Conversion Rate Analysis

**Scenario:** Marketing team muốn biết conversion rate từ PENDING sang PAID.

**Query:**
```sql
WITH order_stats AS (
  SELECT 
    COUNT(*) FILTER (WHERE status = 'PENDING') AS pending_count,
    COUNT(*) FILTER (WHERE status = 'PAID') AS paid_count,
    COUNT(*) FILTER (WHERE status = 'CANCELLED') AS cancelled_count,
    COUNT(*) FILTER (WHERE status = 'FAILED') AS failed_count
  FROM subscription_orders
  WHERE deleted_at IS NULL
    AND created_at >= '2025-01-01'
)
SELECT 
  *,
  ROUND(paid_count::NUMERIC / (pending_count + paid_count + cancelled_count + failed_count) * 100, 2) AS conversion_rate
FROM order_stats;
```

**Result:**
```json
{
  "pending_count": 45,
  "paid_count": 327,
  "cancelled_count": 23,
  "failed_count": 12,
  "conversion_rate": 80.29
}
```

---

### Use Case 5.3: Top Packages Report

**Scenario:** Product team muốn biết gói nào bán chạy nhất.

**Query:**
```sql
SELECT 
  p.code,
  p.name,
  COUNT(o._id) AS order_count,
  SUM(o.total_amount) AS total_revenue,
  ROUND(AVG(o.total_amount), 2) AS avg_price
FROM subscription_orders o
JOIN service_packages p ON o.package_id = p._id
WHERE o.status = 'PAID'
  AND o.deleted_at IS NULL
GROUP BY p.code, p.name
ORDER BY order_count DESC
LIMIT 10;
```

---

## 6. Edge Cases & Error Handling

### Use Case 6.1: Concurrent Payment Attempts

**Scenario:** Tenant vô tình click "Pay" button nhiều lần, tạo ra multiple payment requests.

**Solution:**
```
1. Use optimistic locking (version field)
2. Only allow ONE status transition from PENDING → PAID
3. Subsequent payment attempts receive 409 Conflict
```

**Example:**
```bash
# First payment attempt (success)
PATCH /orders/{id} { "status": "PAID", "version": 1 }
→ 200 OK, version = 2

# Second payment attempt (conflict)
PATCH /orders/{id} { "status": "PAID", "version": 1 }
→ 409 Conflict "Version mismatch"
```

---

### Use Case 6.2: Package Deleted During Checkout

**Scenario:** Admin xóa package đúng lúc tenant đang checkout.

**Solution:**
```
1. Check package existence BEFORE creating order
2. If package.deleted_at IS NOT NULL → Return 400 error
3. If order already created → package_snapshot ensures data integrity
```

**API Logic:**
```go
// Check package before creating order
package, err := getPackageByID(packageID)
if err != nil || package.DeletedAt != nil {
    return errors.New("Package not available")
}

// Create order with snapshot
order.PackageSnapshot = package
insertOrder(order)
```

---

### Use Case 6.3: Payment Gateway Timeout

**Scenario:** Payment gateway không phản hồi webhook sau 10 phút.

**Solution:**
```
1. Set order status = PENDING
2. Run periodic job to check payment status
3. After 24h without confirmation → Auto-cancel order
4. Notify admin về pending orders
```

**Cronjob:**
```sql
-- Find orders pending for > 1 hour
SELECT * FROM subscription_orders
WHERE status = 'PENDING'
  AND created_at < NOW() - INTERVAL '1 hour'
  AND deleted_at IS NULL;

-- Verify payment status with gateway
-- If paid → Update status
-- If failed → Mark as FAILED
```

---

## 7. Multi-Currency Support

### Use Case 7.1: USD Package Purchase

**Scenario:** International tenant mua gói với giá USD.

**Flow:**
```
1. Package price = 99 USD/month
2. Create order with currency_code = 'USD'
3. Payment gateway charges 99 USD
4. Order và Subscription lưu bằng USD (không convert)
```

**Order Data:**
```json
{
  "order_number": "ORD-2025-INT-001",
  "total_amount": 99.00,
  "currency_code": "USD",
  "status": "PAID",
  "payment_method": "STRIPE"
}
```

**Business Rules:**
- ✅ Mỗi order chỉ có 1 currency_code
- ✅ Subscription renewal vẫn dùng currency_code gốc
- ✅ Invoice cũng theo currency_code của order

---

### Use Case 7.2: Multi-Currency Revenue Report

**Scenario:** Admin xem revenue theo từng loại tiền tệ.

**API Call:**
```bash
GET /api/v1/subscription-orders/statistics
```

**Response:**
```json
{
  "total_orders": 1523,
  "revenue_by_currency": {
    "VND": 3728500000,
    "USD": 125000,
    "EUR": 98000
  }
}
```

**Display:**
```
Total Revenue:
- VND: 3,728,500,000 đ
- USD: $125,000
- EUR: €98,000
```

---

## 📚 Related Documentation

- [Orders Schema](./ORDERS_SCHEMA.md)
- [Orders API](./ORDERS_API.md)
- [Orders UI Components](./ORDERS_UI_COMPONENTS.md)
- [Orders ERD](./ORDERS_ERD.md)

---

**Version:** 1.0.0  
**Last Updated:** 2025-01-13  
**Maintainer:** VHV Platform Team
