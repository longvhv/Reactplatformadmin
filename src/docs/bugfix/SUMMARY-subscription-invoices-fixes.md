# SUMMARY: Subscription Invoices Schema Fixes

**Date:** 2026-01-15  
**Status:** ⚠️ NEEDS IMMEDIATE ACTION  
**Compliance:** 65/100 → Target: 95/100  
**Estimated Effort:** 8-12 hours

---

## 🎯 Quick Overview

Module Subscription Invoices có **8 critical/high issues** cần fix để đạt 100% compliance với database schema `subscription_invoices`.

---

## ❌ Top 5 Critical Issues

### 1. payment_status Field Doesn't Exist (P0)
**Problem:** Code sử dụng `payment_status` field nhưng DB không có field này.  
**Fix:** Implement as derived/computed value từ `status`, `amount_paid`, `total_amount`.  
**Files:** `InvoiceTable.tsx`, `InvoiceCard.tsx`, `InvoiceForm.tsx`

### 2. Flat Fields vs JSONB Structure (P0)
**Problem:** Code dùng `customer_name`, `customer_email` thay vì `billing_info.customer_name`.  
**Fix:** Update all components để access JSONB structure đúng.  
**Files:** `InvoiceTable.tsx`, `InvoiceForm.tsx`, `SubscriptionInvoicesPage.tsx`

### 3. invoice_date Field Doesn't Exist (P0)
**Problem:** Code dùng `invoice_date` nhưng DB chỉ có `billing_period_start/end`, `created_at`.  
**Fix:** Replace với `billing_period_start` hoặc `created_at`.  
**Files:** `InvoiceTable.tsx`, `InvoiceForm.tsx`

### 4. Field Name Mismatches (P0)
**Problem:** Nhiều field names không khớp DB schema.  
**Fix:** Rename all occurrences.

| Code Uses | DB Has |
|-----------|--------|
| `currency` | `currency_code` |
| `line_items` | `items_snapshot` |
| `paid_date` | `paid_at` |
| `payment_method` | *metadata.payment_method* |
| `notes` | *metadata.notes* |

**Files:** All invoice components

### 5. Missing Required Field Validation (P1)
**Problem:** Form không validate `billing_period_start/end`, `billing_info`, `items_snapshot`.  
**Fix:** Add comprehensive validation.  
**Files:** `InvoiceForm.tsx`

---

## 📋 Quick Fix Checklist

### Immediate (Today)
- [ ] Create `/utils/invoiceHelpers.ts` với payment status utilities
- [ ] Update Invoice interface in `/api/invoiceApi.ts`
- [ ] Fix `InvoiceTable.tsx` field names
- [ ] Fix `InvoiceForm.tsx` JSONB structure

### This Week
- [ ] Update all components to use correct field names
- [ ] Add required field validation
- [ ] Add comprehensive tests
- [ ] Update documentation

---

## 🔧 Key Changes Summary

### API Types (`/api/invoiceApi.ts`)
```typescript
// ✅ Update Invoice interface
export interface Invoice {
  currency_code: string;        // Not 'currency'
  billing_info: BillingInfo;    // Not flat customer_* fields
  items_snapshot: ItemSnapshot[]; // Not 'line_items'
  billing_period_start: string; // Required
  billing_period_end: string;   // Required
  paid_at?: string;             // Not 'paid_date'
  metadata: Record<string, any>; // notes, terms go here
  // NO payment_status field
}
```

### Helpers (`/utils/invoiceHelpers.ts` - NEW)
```typescript
// ✅ Derive payment status
export function getPaymentStatus(invoice: Invoice): PaymentStatus {
  if (invoice.status === 'PAID') return 'paid';
  if (invoice.amount_paid === 0) return 'unpaid';
  if (invoice.amount_paid > 0 && invoice.amount_due > 0) return 'partially_paid';
  return 'unpaid';
}
```

### Components
```typescript
// ✅ Use JSONB access
invoice.billing_info?.customer_name

// ✅ Use correct field names
invoice.currency_code
invoice.items_snapshot
invoice.paid_at

// ✅ Use derived payment status
const badge = getPaymentStatusBadge(invoice);
```

---

## 📊 Compliance Scores

| Category | Before | After | Target |
|----------|--------|-------|--------|
| Schema Match | 60 | → 95 | 95 |
| Type Safety | 50 | → 95 | 95 |
| Validation | 70 | → 95 | 95 |
| JSONB Handling | 75 | → 95 | 95 |
| **Overall** | **65** | → **95** | **95** |

---

## 📁 Files to Update

### High Priority (8 files)
1. `/utils/invoiceHelpers.ts` - CREATE NEW
2. `/api/invoiceApi.ts` - Update types
3. `/api/subscriptionInvoiceApi.ts` - Remove deprecated exports
4. `/components/invoices/InvoiceTable.tsx` - Fix all field names
5. `/components/invoices/InvoiceCard.tsx` - Fix all field names
6. `/components/invoices/InvoiceForm.tsx` - Major refactor
7. `/pages/SubscriptionInvoicesPage.tsx` - Fix JSONB access
8. `/pages/AddInvoicePage.tsx` - May need updates (check)

---

## 🚨 Breaking Changes

### Data Structure Changes
- `payment_status` → Derived value (not stored)
- `customer_name` → `billing_info.customer_name`
- `line_items` → `items_snapshot`
- `notes` → `metadata.notes`

### Field Renames
- `currency` → `currency_code`
- `paid_date` → `paid_at`
- `invoice_date` → Use `billing_period_start` or `created_at`

### New Required Fields
- `billing_period_start` (NOT NULL)
- `billing_period_end` (NOT NULL)

---

## 🧪 Testing Focus

### Critical Tests
1. Invoice creation with JSONB billing_info
2. Invoice creation with JSONB items_snapshot
3. Payment status derivation logic
4. Billing period validation
5. JSONB field persistence

### Edge Cases
1. Empty billing_info (should default to {})
2. Empty items_snapshot (should fail validation)
3. Invalid billing period dates
4. Amount_paid > total_amount
5. Status transitions with payment status

---

## 📚 Documentation

### Primary Docs
- **Compliance Check:** `/docs/CHECK-2026-01-15-subscription-invoices-schema-compliance.md`
- **Detailed Fix Plan:** `/docs/bugfix/CHECK-2026-01-15-subscription-invoices-schema-gaps.md`
- **This Summary:** `/docs/bugfix/SUMMARY-subscription-invoices-fixes.md`

### Reference Docs
- **DB Schema:** `/docs/developer/subscription-invoices-database-schema.md`
- **API Reference:** `/docs/developer/subscription-invoices-api-reference.md`
- **Migration SQL:** `/golang-backend/migrations/016_insert_subscription_invoices_demo_data.sql`

---

## ⏰ Timeline

### Day 1 (4 hours)
- Create invoice helpers utility
- Update API types
- Fix InvoiceTable component

### Day 2 (4 hours)
- Fix InvoiceForm component (major refactor)
- Fix InvoiceCard component
- Fix page components

### Day 3 (2-4 hours)
- Add comprehensive validation
- Write tests
- Update documentation
- Code review

**Total:** 10-12 hours over 3 days

---

## ✅ Success Criteria

- [ ] All type errors resolved
- [ ] All components use correct field names
- [ ] Payment status displays correctly (derived)
- [ ] JSONB structures persist correctly
- [ ] Required fields validated
- [ ] Tests pass (coverage > 80%)
- [ ] Compliance score ≥ 95/100
- [ ] No console errors
- [ ] SonarQube passes

---

## 🎯 Next Action

**START HERE:**
1. Read detailed fix plan: `/docs/bugfix/CHECK-2026-01-15-subscription-invoices-schema-gaps.md`
2. Create `/utils/invoiceHelpers.ts` first
3. Update `/api/invoiceApi.ts` types
4. Fix components one by one
5. Test thoroughly

---

**Priority:** P0 - CRITICAL  
**Risk:** MEDIUM (Well-documented breaking changes)  
**Impact:** HIGH (Affects all invoice operations)  
**Stakeholders:** Frontend Team, Backend Team, QA

**Last Updated:** 2026-01-15  
**Author:** VHV Platform Team
