# Subscription Invoices - Database Schema Documentation

## 📋 Overview

Tài liệu chi tiết về cấu trúc bảng `subscription_invoices` - quản lý hóa đơn thanh toán định kỳ cho subscriptions.

**Key Features:**
- ✅ 18+ columns with strict financial rules
- ✅ 4 optimized indexes for performance
- ✅ JSONB for price_adjustments & metadata
- ✅ Optimistic locking (version field)
- ✅ Soft delete support
- ✅ Partner support for multi-tier distribution
- ✅ Billing period & due date tracking

---

## 🗄️ Table Structure

### Table Name: `subscription_invoices`

```sql
CREATE TABLE subscription_invoices (
    -- I. ĐỊNH DANH & LIÊN KẾT (IDENTITY & LINKING)
    _id UUID PRIMARY KEY, -- Sinh UUID v7 từ tầng Application
    tenant_id UUID NOT NULL,
    partner_id UUID, -- Dùng cho mô hình phân phối đa tầng
    subscription_id UUID NOT NULL,
    invoice_number VARCHAR(50) NOT NULL,

    -- II. TÀI CHÍNH (STRICT FINANCIAL RULES)
    amount NUMERIC(19, 4) NOT NULL DEFAULT 0,
    currency_code VARCHAR(3) NOT NULL DEFAULT 'VND',
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    
    -- III. CHU KỲ & HẠN THANH TOÁN
    billing_period_start TIMESTAMPTZ NOT NULL,
    billing_period_end TIMESTAMPTZ NOT NULL,
    due_date TIMESTAMPTZ NOT NULL,
    paid_at TIMESTAMPTZ,

    -- IV. DỮ LIỆU SNAPSHOT & MỞ RỘNG
    price_adjustments JSONB NOT NULL DEFAULT '[]',
    metadata JSONB NOT NULL DEFAULT '{}',

    -- V. QUẢN TRỊ & AUDIT
    version BIGINT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    -- RÀNG BUỘC (CONSTRAINTS)
    CONSTRAINT uq_invoice_number UNIQUE (invoice_number),
    CONSTRAINT fk_invoice_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(_id),
    CONSTRAINT fk_invoice_partner FOREIGN KEY (partner_id) REFERENCES tenants(_id),
    CONSTRAINT fk_invoice_subscription FOREIGN KEY (subscription_id) REFERENCES tenant_subscriptions(_id),
    CONSTRAINT chk_invoice_status CHECK (status IN ('DRAFT', 'OPEN', 'PAID', 'VOID', 'UNCOLLECTIBLE')),
    CONSTRAINT chk_billing_dates CHECK (billing_period_end > billing_period_start),
    CONSTRAINT chk_invoice_currency CHECK (LENGTH(currency_code) = 3),
    CONSTRAINT chk_invoice_version CHECK (version >= 1),
    CONSTRAINT chk_invoice_updated CHECK (updated_at >= created_at)
);
```

---

## 📊 Column Specifications

### I. Định danh & Liên kết (Identity & Linking)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `_id` | UUID | PRIMARY KEY | UUID v7 được sinh từ application layer |
| `tenant_id` | UUID | NOT NULL, FK | Tenant sở hữu hóa đơn |
| `partner_id` | UUID | NULLABLE, FK | Partner (đối tác phân phối), null nếu không có |
| `subscription_id` | UUID | NOT NULL, FK | Subscription tạo ra hóa đơn này |
| `invoice_number` | VARCHAR(50) | NOT NULL, UNIQUE | Mã hóa đơn duy nhất (VD: INV-2025-001234) |

**Business Rules:**
- `_id`: UUID v7 đảm bảo sortable theo thời gian
- `tenant_id`: Mọi invoice phải thuộc về một tenant
- `partner_id`: Chỉ điền khi có mô hình phân phối đa tầng (partner tạo invoice cho tenant)
- `subscription_id`: Liên kết với subscription để theo dõi recurring billing
- `invoice_number`: Format khuyến nghị `INV-YYYY-MMDD-####` hoặc `INV-YYYY-######`

---

### II. Tài chính (Financial Rules)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `amount` | NUMERIC(19,4) | NOT NULL, >= 0 | Tổng tiền hóa đơn (sau khi áp dụng price_adjustments) |
| `currency_code` | VARCHAR(3) | NOT NULL, LENGTH=3 | Mã tiền tệ ISO 4217 (VND, USD, EUR, etc.) |
| `status` | VARCHAR(20) | NOT NULL, CHECK | Trạng thái: DRAFT, OPEN, PAID, VOID, UNCOLLECTIBLE |

**Amount Precision:**
- `NUMERIC(19,4)`: Hỗ trợ số tiền lên đến 999,999,999,999,999.9999
- 4 chữ số thập phân: Đủ cho hầu hết tiền tệ (VND không cần, USD/EUR cần 2-4)
- Default 0: Đảm bảo không null

**Currency Code:**
- Phải tuân thủ ISO 4217 (3 ký tự)
- VND, USD, EUR, JPY, GBP, etc.
- Validate tại application layer

**Status Flow:**
```
DRAFT → OPEN → PAID
             ↓
           VOID
             ↓
       UNCOLLECTIBLE
```

**Status Definitions:**
- `DRAFT`: Hóa đơn nháp, chưa gửi cho tenant
- `OPEN`: Hóa đơn đã gửi, chờ thanh toán
- `PAID`: Đã thanh toán đầy đủ
- `VOID`: Đã hủy (không thu tiền)
- `UNCOLLECTIBLE`: Không thu được (sau nhiều lần nhắc nhở)

---

### III. Chu kỳ & Hạn thanh toán (Billing Period & Due Date)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `billing_period_start` | TIMESTAMPTZ | NOT NULL | Bắt đầu chu kỳ thanh toán |
| `billing_period_end` | TIMESTAMPTZ | NOT NULL, > start | Kết thúc chu kỳ thanh toán |
| `due_date` | TIMESTAMPTZ | NOT NULL | Hạn thanh toán |
| `paid_at` | TIMESTAMPTZ | NULLABLE | Thời điểm thanh toán (null nếu chưa thanh toán) |

**Business Rules:**
- `billing_period_end` MUST be > `billing_period_start` (enforced by CHECK constraint)
- Billing period thường align với subscription cycle (monthly, quarterly, yearly)
- `due_date` thường là `billing_period_end + grace_period` (VD: +7 days)
- `paid_at` chỉ được set khi status = PAID

**Example:**
```
Billing Period: 2025-01-01 to 2025-01-31 (Monthly)
Due Date: 2025-02-07 (7 days grace period)
Paid At: 2025-02-03 (Paid before due date)
```

**Overdue Detection:**
```sql
-- Overdue invoices
SELECT * FROM subscription_invoices
WHERE status = 'OPEN' 
  AND due_date < NOW()
  AND deleted_at IS NULL;
```

---

### IV. Dữ liệu Snapshot & Mở rộng (JSONB Fields)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `price_adjustments` | JSONB | NOT NULL, DEFAULT '[]' | Mảng các điều chỉnh giá (discounts, taxes, surcharges) |
| `metadata` | JSONB | NOT NULL, DEFAULT '{}' | Dữ liệu mở rộng tùy chỉnh |

**price_adjustments Structure:**

```json
[
  {
    "type": "discount",
    "reason": "Loyalty discount 10%",
    "amount": -100000,
    "percentage": 10,
    "applied_at": "2025-01-13T10:00:00Z"
  },
  {
    "type": "tax",
    "reason": "VAT 10%",
    "amount": 270000,
    "percentage": 10,
    "applied_at": "2025-01-13T10:00:00Z"
  },
  {
    "type": "surcharge",
    "reason": "Late payment fee",
    "amount": 50000,
    "percentage": null,
    "applied_at": "2025-01-15T10:00:00Z"
  }
]
```

**Adjustment Types:**
- `discount`: Giảm giá (negative amount)
- `tax`: Thuế (positive amount)
- `surcharge`: Phụ phí (positive amount)
- `credit`: Tín dụng (negative amount)
- `refund`: Hoàn tiền (negative amount)

**Calculation:**
```
Final Amount = Base Amount + Sum(price_adjustments[].amount)
```

**metadata Structure:**

```json
{
  "payment_method": "CREDIT_CARD",
  "payment_gateway": "stripe",
  "transaction_id": "ch_abc123",
  "customer_note": "Please send PDF invoice",
  "internal_note": "VIP customer",
  "tags": ["recurring", "auto-pay"],
  "custom_fields": {
    "po_number": "PO-2025-001",
    "department": "Engineering"
  }
}
```

**Use Cases:**
- Store payment gateway info
- Track custom fields without schema changes
- Add tags for filtering
- Store customer/internal notes

---

### V. Quản trị & Audit (Administration & Audit Trail)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `version` | BIGINT | NOT NULL, DEFAULT 1, >= 1 | Version cho optimistic locking |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Thời điểm tạo |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW(), >= created_at | Thời điểm cập nhật gần nhất |
| `deleted_at` | TIMESTAMPTZ | NULLABLE | Thời điểm xóa (soft delete) |

**Optimistic Locking:**
```sql
-- Update với version check
UPDATE subscription_invoices
SET 
  status = 'PAID',
  paid_at = NOW(),
  version = version + 1,
  updated_at = NOW()
WHERE _id = $1 
  AND version = $2  -- Optimistic lock check
  AND deleted_at IS NULL
RETURNING version, updated_at;

-- Nếu version không khớp → 409 Conflict
```

**Soft Delete:**
```sql
-- Soft delete
UPDATE subscription_invoices
SET deleted_at = NOW(), updated_at = NOW()
WHERE _id = $1 AND deleted_at IS NULL;

-- Query chỉ lấy non-deleted records
SELECT * FROM subscription_invoices
WHERE deleted_at IS NULL;
```

---

## 🔍 Indexes Strategy

### 1. Tenant Lookup Index

```sql
CREATE INDEX idx_invoices_tenant_lookup 
ON subscription_invoices (tenant_id, created_at DESC) 
WHERE deleted_at IS NULL;
```

**Purpose:** Tenant xem lịch sử hóa đơn (mới nhất lên đầu)

**Query Pattern:**
```sql
SELECT * FROM subscription_invoices
WHERE tenant_id = $1 AND deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 20;
```

**Performance:** O(log n) lookup + sequential scan within tenant

---

### 2. Partner Debt Tracking Index

```sql
CREATE INDEX idx_invoices_partner_debt 
ON subscription_invoices (partner_id, status) 
WHERE partner_id IS NOT NULL AND status != 'PAID';
```

**Purpose:** Đối soát công nợ cho Partner (multi-tier distribution)

**Query Pattern:**
```sql
SELECT partner_id, COUNT(*), SUM(amount)
FROM subscription_invoices
WHERE partner_id IS NOT NULL 
  AND status != 'PAID'
  AND deleted_at IS NULL
GROUP BY partner_id;
```

**Business Case:** Partner cần biết tổng công nợ chưa thanh toán

---

### 3. Overdue Tracker Index ⭐⭐⭐

```sql
CREATE INDEX idx_invoices_overdue_tracker 
ON subscription_invoices (status, due_date) 
WHERE status = 'OPEN' AND deleted_at IS NULL;
```

**Purpose:** Tìm hóa đơn quá hạn để gửi reminder

**Query Pattern:**
```sql
SELECT * FROM subscription_invoices
WHERE status = 'OPEN' 
  AND due_date < NOW()
  AND deleted_at IS NULL
ORDER BY due_date ASC;
```

**Automation:** Chạy cronjob mỗi ngày để gửi email nhắc nhở

---

### 4. Invoice Number Search Index

```sql
CREATE UNIQUE INDEX idx_invoices_number_search 
ON subscription_invoices (invoice_number) 
WHERE deleted_at IS NULL;
```

**Purpose:** Tìm kiếm nhanh theo mã hóa đơn (UI search bar)

**Query Pattern:**
```sql
SELECT * FROM subscription_invoices
WHERE invoice_number ILIKE '%2025-001%'
  AND deleted_at IS NULL;
```

**Performance:** UNIQUE index đảm bảo không trùng invoice_number

---

## 📏 Storage Estimates

### Per Invoice Row

```
Fixed columns: ~250 bytes
  - UUID (_id, tenant_id, partner_id, subscription_id): 16 * 4 = 64 bytes
  - VARCHAR(50) invoice_number: ~20 bytes
  - NUMERIC(19,4) amount: 16 bytes
  - VARCHAR(3) currency_code: 4 bytes
  - VARCHAR(20) status: 8 bytes
  - TIMESTAMPTZ * 5: 8 * 5 = 40 bytes
  - BIGINT version: 8 bytes
  - Padding: ~90 bytes

JSONB columns: Variable
  - price_adjustments: 100-500 bytes (depends on adjustments count)
  - metadata: 100-1000 bytes (depends on custom fields)

Average row size: ~600-800 bytes
```

### Database Size Estimates

| Invoices Count | Size (Without Indexes) | Size (With Indexes) | Notes |
|----------------|------------------------|---------------------|-------|
| 1,000 | ~0.8 MB | ~2 MB | Small startup |
| 10,000 | ~8 MB | ~20 MB | Medium business |
| 100,000 | ~80 MB | ~200 MB | Large enterprise |
| 1,000,000 | ~800 MB | ~2 GB | Very large scale |
| 10,000,000 | ~8 GB | ~20 GB | Multi-national corp |

**Note:** Indexes typically add 100-150% overhead

---

## 🔄 Lifecycle Queries

### Create Invoice

```sql
INSERT INTO subscription_invoices (
  _id, tenant_id, partner_id, subscription_id, invoice_number,
  amount, currency_code, status,
  billing_period_start, billing_period_end, due_date,
  price_adjustments, metadata,
  version, created_at, updated_at
) VALUES (
  '01940826-...',  -- UUID v7
  '01940821-...',  -- tenant_id
  NULL,            -- partner_id (optional)
  '01940823-...',  -- subscription_id
  'INV-2025-0113-001',
  2990000.0000,
  'VND',
  'OPEN',
  '2025-01-01 00:00:00+07',
  '2025-01-31 23:59:59+07',
  '2025-02-07 23:59:59+07',
  '[{"type":"discount","amount":-100000}]'::JSONB,
  '{"payment_method":"CREDIT_CARD"}'::JSONB,
  1,
  NOW(),
  NOW()
);
```

---

### Update Invoice Status

```sql
-- Mark as PAID
UPDATE subscription_invoices
SET 
  status = 'PAID',
  paid_at = NOW(),
  version = version + 1,
  updated_at = NOW()
WHERE _id = $1 
  AND version = $2
  AND deleted_at IS NULL
RETURNING version, updated_at;
```

---

### Get Tenant Invoices

```sql
SELECT 
  i._id,
  i.invoice_number,
  i.amount,
  i.currency_code,
  i.status,
  i.billing_period_start,
  i.billing_period_end,
  i.due_date,
  i.paid_at,
  t.name AS tenant_name,
  s.subscription_code
FROM subscription_invoices i
LEFT JOIN tenants t ON i.tenant_id = t._id
LEFT JOIN tenant_subscriptions s ON i.subscription_id = s._id
WHERE i.tenant_id = $1
  AND i.deleted_at IS NULL
ORDER BY i.created_at DESC
LIMIT 20;
```

---

### Get Overdue Invoices

```sql
SELECT 
  i.*,
  t.name AS tenant_name,
  EXTRACT(DAY FROM NOW() - i.due_date) AS days_overdue
FROM subscription_invoices i
LEFT JOIN tenants t ON i.tenant_id = t._id
WHERE i.status = 'OPEN'
  AND i.due_date < NOW()
  AND i.deleted_at IS NULL
ORDER BY i.due_date ASC;
```

---

### Revenue Statistics

```sql
SELECT 
  COUNT(*) AS total_invoices,
  SUM(amount) AS total_revenue,
  COUNT(CASE WHEN status = 'PAID' THEN 1 END) AS paid_invoices,
  COUNT(CASE WHEN status = 'OPEN' THEN 1 END) AS open_invoices,
  COUNT(CASE WHEN status = 'OPEN' AND due_date < NOW() THEN 1 END) AS overdue_invoices,
  AVG(amount) AS average_amount,
  ROUND(
    COUNT(CASE WHEN status = 'PAID' THEN 1 END)::NUMERIC / 
    COUNT(*)::NUMERIC * 100, 
    2
  ) AS collection_rate
FROM subscription_invoices
WHERE deleted_at IS NULL;
```

---

## ⚠️ Important Notes

### Price Adjustments Best Practices

1. **Always append, never modify:**
   ```sql
   -- Correct: Append new adjustment
   UPDATE subscription_invoices
   SET price_adjustments = price_adjustments || 
     '[{"type":"tax","amount":100000}]'::JSONB
   WHERE _id = $1;
   
   -- Wrong: Overwrite entire array
   UPDATE subscription_invoices
   SET price_adjustments = '[{"type":"tax","amount":100000}]'::JSONB
   WHERE _id = $1;  -- Lost history!
   ```

2. **Recalculate amount after adjustments:**
   ```sql
   -- Application logic
   base_amount = 2990000
   adjustments = [-100000, +270000]  -- discount, tax
   final_amount = base_amount + sum(adjustments) = 3160000
   ```

3. **Audit trail:**
   - Include `applied_at` timestamp
   - Include `reason` for transparency

---

### Billing Period Validation

```sql
-- Application-level validation
IF billing_period_end <= billing_period_start THEN
  RAISE EXCEPTION 'billing_period_end must be after billing_period_start';
END IF;

IF due_date < billing_period_end THEN
  RAISE WARNING 'due_date is before billing_period_end - unusual!';
END IF;
```

---

### Optimistic Locking Pattern

```go
// Golang example
func UpdateInvoice(id string, status string, currentVersion int64) error {
  result, err := db.Exec(`
    UPDATE subscription_invoices
    SET status = $1, version = version + 1, updated_at = NOW()
    WHERE _id = $2 AND version = $3 AND deleted_at IS NULL
  `, status, id, currentVersion)
  
  rowsAffected, _ := result.RowsAffected()
  if rowsAffected == 0 {
    return errors.New("Version conflict or invoice not found")
  }
  
  return nil
}
```

---

## 📚 Related Documentation

- [Invoices README](./INVOICES_README.md)
- [Invoices API](./INVOICES_API.md)
- [Invoices Use Cases](./INVOICES_USECASES.md)
- [Invoices UI Components](./INVOICES_UI_COMPONENTS.md)
- [Invoices ERD](./INVOICES_ERD.md)

---

**Version:** 1.0.0  
**Last Updated:** 2025-01-13  
**Maintainer:** VHV Platform Team
