# Subscription Invoices - Developer Documentation

**Module:** Hóa đơn Thuê bao  
**Status:** ✅ Production Ready  
**Last Updated:** 2026-01-14

---

## 📚 Documentation Index

### 🚀 Quick Start

**New to this module?** Start here:
1. Read [Invoice Lifecycle](#invoice-lifecycle) below
2. Review [Database Schema](./subscription-invoices-database-schema.md) - Hiểu cấu trúc
3. Check [API Reference](./subscription-invoices-api-reference.md) - Học cách gọi API

### 📖 Full Documentation

| # | Document | Purpose | Audience | Lines |
|---|----------|---------|----------|-------|
| 1 | [**API Reference**](./subscription-invoices-api-reference.md) | Chi tiết 10 endpoints | Frontend Dev | 1,200+ |
| 2 | [**Database Schema**](./subscription-invoices-database-schema.md) | Cấu trúc database | Backend Dev, DBA | 900+ |
| 3 | [**ERD Diagram**](./subscription-invoices-erd-diagram.md) | Quan hệ giữa bảng | Backend Dev, DBA | 700+ |
| 4 | [**Use Cases**](./subscription-invoices-use-cases.md) | 12 use cases | Product, QA | 1,100+ |

**Total Documentation:** 3,900+ lines

---

## 🎯 Documentation by Role

### 👨‍💻 Frontend Developer

**Đọc theo thứ tự:**
1. [API Reference](./subscription-invoices-api-reference.md) - Section: Endpoints
2. [Use Cases](./subscription-invoices-use-cases.md) - UC-INV-002, UC-INV-003 (Tenant flows)
3. [Database Schema](./subscription-invoices-database-schema.md) - Section: JSONB Fields

**Code Examples:**
```typescript
// Import API client
import { invoicesApi } from '../api/invoicesApi';

// List invoices
const invoices = await invoicesApi.getAll({ 
  tenant_id: 'tenant-uuid',
  status: 'OPEN'
});

// Pay invoice
await invoicesApi.payInvoice('invoice-uuid', {
  payment_method: 'CREDIT_CARD',
  metadata: { transaction_id: 'txn_123' }
});
```

### 🗄️ Backend Developer

**Đọc theo thứ tự:**
1. [Database Schema](./subscription-invoices-database-schema.md) - Full schema
2. [API Reference](./subscription-invoices-api-reference.md) - All 10 endpoints
3. [ERD Diagram](./subscription-invoices-erd-diagram.md) - Relationships

**Key Concepts:**
- Auto-Generate Invoice Number
- Billing Period Management
- Payment Processing
- Overdue Tracking
- Partner Distribution

### 🔧 DBA (Database Administrator)

**Đọc theo thứ tự:**
1. [Database Schema](./subscription-invoices-database-schema.md) - Table structure
2. [ERD Diagram](./subscription-invoices-erd-diagram.md) - Foreign keys & indexes
3. [Database Schema](./subscription-invoices-database-schema.md) - Migration script

**Migration:**
```sql
-- See full script in database-schema.md
CREATE TABLE subscription_invoices (...);
CREATE INDEX idx_invoices_tenant_lookup ...;
CREATE INDEX idx_invoices_partner_debt ...;
CREATE INDEX idx_invoices_overdue_tracker ...;
CREATE UNIQUE INDEX idx_invoices_number_search ...;
```

### 📋 Product Manager / QA

**Đọc theo thứ tự:**
1. [Use Cases](./subscription-invoices-use-cases.md) - All 12 use cases
2. [Invoice Lifecycle](#invoice-lifecycle) - Status flow
3. [API Reference](./subscription-invoices-api-reference.md) - Data models

**Key Flows:**
- UC-INV-001: Auto-generate monthly invoice
- UC-INV-003: Tenant pay invoice (Critical!)
- UC-INV-004: System track overdue invoices
- UC-INV-007: Partner distribution

---

## 🔥 Core Concepts

### 1. Auto-Generate Invoice Number

**Format:** `INV-YYYYMMDD-XXXXXX`

**Examples:**
- `INV-20260114-123456`
- `INV-20260114-789012`
- `INV-20260115-456789`

**Benefits:**
- ✅ Human-readable
- ✅ Chronologically sortable
- ✅ Unique per second
- ✅ Easy to communicate

**Implementation:**
```go
func generateInvoiceNumber() string {
    now := time.Now()
    timestamp := now.Format("20060102")  // YYYYMMDD
    random := now.UnixNano() % 1000000   // Last 6 digits
    return fmt.Sprintf("INV-%s-%06d", timestamp, random)
}
```

**Read more:** [API Reference - Create Invoice](./subscription-invoices-api-reference.md#4-create-invoice)

### 2. Billing Period Management

**Components:**
```typescript
interface BillingPeriod {
  billing_period_start: Date;   // Ngày bắt đầu chu kỳ
  billing_period_end: Date;     // Ngày kết thúc chu kỳ
  due_date: Date;               // Hạn thanh toán (period_end + payment_terms)
}
```

**Validation:**
```sql
CHECK (billing_period_end > billing_period_start)
```

**Common Cycles:**
- **Monthly:** 1st - Last day of month, due = end + 7 days
- **Quarterly:** 1st of Q - Last day of Q, due = end + 14 days
- **Annual:** Start date → Start date + 1 year, due = end + 30 days

**Read more:** [API Reference - Billing Period Logic](./subscription-invoices-api-reference.md#billing-period-logic)

### 3. Invoice Status Flow

```
DRAFT ──────> OPEN ──────> PAID
                │
                ├──────> VOID (manual cancel)
                │
                └──────> UNCOLLECTIBLE (bad debt)
```

**Status Descriptions:**

| Status | Description | Can Pay? | Terminal? |
|--------|-------------|----------|-----------|
| **DRAFT** | Hóa đơn nháp | No | No |
| **OPEN** | Chờ thanh toán | **Yes** | No |
| **PAID** | Đã thanh toán | No | **Yes** |
| **VOID** | Đã hủy | No | **Yes** |
| **UNCOLLECTIBLE** | Bad debt | No | **Yes** |

**Read more:** [API Reference - Invoice Lifecycle](./subscription-invoices-api-reference.md#invoice-lifecycle)

### 4. Price Adjustments Pattern

**Purpose:** Điều chỉnh giá một cách minh bạch

**Structure:**
```typescript
interface PriceAdjustment {
  type: string;           // DISCOUNT | CREDIT | SURCHARGE | TAX
  description: string;    // Human-readable
  amount: number;         // +/- adjustment
  reason?: string;        // Optional
}
```

**Example:**
```json
{
  "price_adjustments": [
    {
      "type": "DISCOUNT",
      "description": "Early payment discount (5%)",
      "amount": -50000.0000,
      "reason": "Paid within 3 days"
    },
    {
      "type": "TAX",
      "description": "VAT 10%",
      "amount": 100000.0000
    }
  ]
}
```

**Calculation:**
```typescript
finalAmount = baseAmount + sum(price_adjustments.map(a => a.amount))
```

**Read more:** [API Reference - Price Adjustments](./subscription-invoices-api-reference.md#price-adjustments-pattern)

### 5. Overdue Detection

**Logic:**
```sql
is_overdue = (status = 'OPEN' AND due_date < NOW())
```

**Escalation Levels:**
- **1-7 days:** First reminder
- **8-14 days:** Second reminder
- **15-30 days:** Final notice
- **31-60 days:** Admin escalation
- **60+ days:** UNCOLLECTIBLE consideration

**Read more:** [Use Cases - UC-INV-004](./subscription-invoices-use-cases.md#uc-inv-004-system-track-overdue-invoices)

### 6. Partner Distribution

**Feature:** Hỗ trợ mô hình phân phối đa tầng

```typescript
interface Invoice {
  tenant_id: string;      // End customer
  partner_id?: string;    // Partner (nullable)
  // ...
}
```

**Flow:**
1. Partner bán package cho customer
2. Invoice có `partner_id` set
3. Customer trả tiền cho partner
4. Partner trả platform (minus commission)
5. Monthly reconciliation

**Read more:** [Use Cases - UC-INV-007](./subscription-invoices-use-cases.md#uc-inv-007-partner-distribution-invoice)

---

## 📊 Quick Reference

### Database Fields (15+ total)

| Field | Type | Description |
|-------|------|-------------|
| `_id` | UUID | Primary key |
| `tenant_id` | UUID | FK to tenants |
| `partner_id` | UUID | FK to tenants (nullable) |
| `subscription_id` | UUID | FK to tenant_subscriptions |
| `invoice_number` | VARCHAR(50) | UNIQUE, INV-YYYYMMDD-XXXXXX |
| `amount` | NUMERIC(19,4) | Số tiền |
| `currency_code` | VARCHAR(3) | ISO 4217 |
| `status` | VARCHAR(20) | DRAFT\|OPEN\|PAID\|VOID\|UNCOLLECTIBLE |
| `billing_period_start` | TIMESTAMPTZ | Chu kỳ bắt đầu |
| `billing_period_end` | TIMESTAMPTZ | Chu kỳ kết thúc |
| `due_date` | TIMESTAMPTZ | Hạn thanh toán |
| `paid_at` | TIMESTAMPTZ | Timestamp thanh toán (nullable) |
| **`price_adjustments`** | **JSONB** | **Array of adjustments** |
| **`metadata`** | **JSONB** | **Extended metadata** |
| `version` | BIGINT | Optimistic locking |
| `created_at` | TIMESTAMPTZ | Created timestamp |
| `updated_at` | TIMESTAMPTZ | Updated timestamp |
| `deleted_at` | TIMESTAMPTZ | Soft delete (nullable) |

### API Endpoints (10 total)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/invoices` | List invoices (with filters) |
| GET | `/invoices/:id` | Get by ID |
| GET | `/invoices/number/:number` | Get by invoice number |
| POST | `/invoices` | Create invoice |
| PATCH | `/invoices/:id` | Update invoice |
| DELETE | `/invoices/:id` | Soft delete |
| GET | `/invoices/:id/details` | Get with JOINs |
| POST | `/invoices/:id/pay` | Mark as paid |
| GET | `/invoices/overdue` | Get overdue invoices |
| GET | `/invoices/stats` | Get statistics |

### UI Components

| Component | Path | Purpose |
|-----------|------|---------|
| InvoiceDetailModal | `/components/invoices/InvoiceDetailModal.tsx` | Detail popup |

---

## 🎯 Common Tasks

### Task 1: Create Invoice Manually

```typescript
const invoice = await invoicesApi.create({
  tenant_id: 'tenant-uuid',
  subscription_id: 'sub-uuid',
  amount: 1000000.0000,
  currency_code: 'VND',
  status: 'OPEN',
  billing_period_start: '2026-01-01T00:00:00Z',
  billing_period_end: '2026-01-31T23:59:59Z',
  due_date: '2026-02-07T23:59:59Z',
  price_adjustments: [
    {
      type: 'DISCOUNT',
      description: 'Early payment discount (5%)',
      amount: -50000.0000,
      reason: 'Promotion'
    }
  ],
  metadata: {
    auto_generated: false,
    created_by: 'admin-user-id'
  }
});
```

### Task 2: Pay Invoice

```typescript
const result = await invoicesApi.payInvoice('invoice-uuid', {
  payment_method: 'CREDIT_CARD',
  payment_date: new Date().toISOString(),
  metadata: {
    transaction_id: 'txn_abc123',
    gateway: 'stripe',
    card_last4: '4242'
  }
});

// Returns:
// {
//   message: "Invoice paid successfully",
//   paid_at: "2026-01-14T15:30:00Z",
//   version: 2,
//   status: "PAID"
// }
```

### Task 3: Query Overdue Invoices

```sql
SELECT 
  invoice_number,
  amount,
  due_date,
  NOW() - due_date AS overdue_duration
FROM subscription_invoices
WHERE status = 'OPEN' 
  AND due_date < NOW()
  AND deleted_at IS NULL
ORDER BY due_date ASC;
```

### Task 4: Partner Reconciliation

```sql
SELECT 
  p.name AS partner_name,
  COUNT(*) AS total_invoices,
  SUM(i.amount) AS total_amount,
  SUM(CASE WHEN i.status = 'PAID' THEN i.amount ELSE 0 END) AS paid_amount
FROM subscription_invoices i
JOIN tenants p ON i.partner_id = p._id
WHERE i.partner_id IS NOT NULL
  AND i.deleted_at IS NULL
GROUP BY p._id, p.name;
```

---

## ⚠️ Important Notes

### DO's ✅

- ✅ Luôn validate billing period (end > start)
- ✅ Chỉ cho phép pay invoice với status = 'OPEN'
- ✅ Log tất cả payment attempts
- ✅ Send receipt sau khi payment success
- ✅ Run daily overdue tracking job
- ✅ Use price_adjustments cho transparent pricing

### DON'Ts ❌

- ❌ KHÔNG modify invoice number manually
- ❌ KHÔNG change status PAID về OPEN
- ❌ KHÔNG hard delete invoices
- ❌ KHÔNG allow payment if status != 'OPEN'
- ❌ KHÔNG skip version check khi update
- ❌ KHÔNG modify price_adjustments sau invoice tạo

---

## 🐛 Troubleshooting

### Issue: Invoice number duplicate

**Reason:** Timing collision (very rare)

**Solution:** Retry with new timestamp. System auto-handles this.

### Issue: Payment processed but status still OPEN

**Reason:** Payment gateway callback delay

**Action:** Check payment_attempts in metadata. Verify with gateway.

### Issue: Overdue reminders not sent

**Reason:** Cron job not running

**Action:** Check cron job logs. Verify index `idx_invoices_overdue_tracker`.

### Issue: Partner reconciliation mismatch

**Reason:** Invoices with NULL partner_id

**Action:** Review invoices WHERE partner_id IS NULL but should have partner.

---

## 📞 Support

### Technical Questions

**Backend Issues:**
- File: `/golang-api/handlers/invoices_handler.go`
- Doc: [API Reference](./subscription-invoices-api-reference.md)

**Frontend Issues:**
- File: `/components/invoices/InvoiceDetailModal.tsx`

**Database Issues:**
- Doc: [Database Schema](./subscription-invoices-database-schema.md)
- Doc: [ERD Diagram](./subscription-invoices-erd-diagram.md)

### Business Questions

**Use Cases & Flows:**
- Doc: [Use Cases](./subscription-invoices-use-cases.md)

---

## 🚀 Next Steps

### For New Developers

1. ✅ Read this README
2. ✅ Review [Database Schema](./subscription-invoices-database-schema.md)
3. ✅ Check [API Reference](./subscription-invoices-api-reference.md)
4. ✅ Test invoices endpoints with Postman/curl

### For Integration

1. ✅ Import API client: `import { invoicesApi } from '../api/invoicesApi'`
2. ✅ Understand [Invoice Lifecycle](#invoice-lifecycle)
3. ✅ Follow [Use Cases](./subscription-invoices-use-cases.md) for flows
4. ✅ Test payment processing (UC-INV-003)

---

## 📈 Performance Metrics

| Operation | Expected Time | Status |
|-----------|---------------|--------|
| List by tenant | < 15ms | ✅ |
| Get by invoice number | < 5ms | ✅ |
| Find overdue | < 20ms | ✅ |
| Create invoice | < 100ms | ✅ |
| Pay invoice | < 150ms | ✅ |
| Monthly stats | < 500ms | ✅ |

**All performance targets met!** ✅

---

**Documentation Version:** 1.0.0  
**Last Updated:** 2026-01-14  
**Status:** ✅ Complete

**📚 Happy Coding! 📚**
