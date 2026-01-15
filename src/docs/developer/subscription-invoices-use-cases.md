# Subscription Invoices - Use Cases Documentation

**Module:** Hóa đơn Thuê bao  
**Last Updated:** 2026-01-14

---

## 📋 Table of Contents

1. [UC-INV-001: Auto-Generate Monthly Invoice](#uc-inv-001-auto-generate-monthly-invoice)
2. [UC-INV-002: Tenant View Invoice History](#uc-inv-002-tenant-view-invoice-history)
3. [UC-INV-003: Tenant Pay Invoice](#uc-inv-003-tenant-pay-invoice)
4. [UC-INV-004: System Track Overdue Invoices](#uc-inv-004-system-track-overdue-invoices)
5. [UC-INV-005: Admin Void Invoice](#uc-inv-005-admin-void-invoice)
6. [UC-INV-006: Admin Mark Uncollectible](#uc-inv-006-admin-mark-uncollectible)
7. [UC-INV-007: Partner Distribution Invoice](#uc-inv-007-partner-distribution-invoice)
8. [UC-INV-008: Apply Price Adjustments](#uc-inv-008-apply-price-adjustments)
9. [UC-INV-009: Search Invoice by Number](#uc-inv-009-search-invoice-by-number)
10. [UC-INV-010: Generate Monthly Revenue Report](#uc-inv-010-generate-monthly-revenue-report)
11. [UC-INV-011: Partner Reconciliation](#uc-inv-011-partner-reconciliation)
12. [UC-INV-012: Handle Payment Failure](#uc-inv-012-handle-payment-failure)

---

## UC-INV-001: Auto-Generate Monthly Invoice

**Actor:** System (Cron Job)  
**Trigger:** Monthly billing cycle starts (e.g., 1st of month)  
**Preconditions:**
- Subscription is ACTIVE
- Previous invoice (if any) is PAID or doesn't exist

### Main Flow

1. **System** scans all ACTIVE subscriptions where billing_cycle = 'MONTHLY'
2. **System** filters subscriptions that need new invoice:
   - No invoice exists for current month, OR
   - Last invoice is PAID
3. For each subscription, **System**:
   - Retrieves subscription details (tenant_id, package_id, price_snapshot)
   - Calculates billing period:
     ```
     billing_period_start = 2026-01-01T00:00:00Z
     billing_period_end   = 2026-01-31T23:59:59Z
     due_date            = 2026-02-07T23:59:59Z  (7 days payment terms)
     ```
   - Generates invoice_number: `INV-20260101-123456`
   - Creates invoice with status = 'OPEN'
4. **System** sends invoice email to tenant with:
   - Invoice PDF attachment
   - Payment link
   - Due date reminder
5. **System** logs invoice creation

### Alternative Flows

**Alt 1: Subscription Expired**
- If subscription.status != 'ACTIVE'
- Skip invoice generation
- Log: "Subscription {id} is not active"

**Alt 2: Previous Invoice Unpaid**
- If last invoice.status = 'OPEN' AND overdue > 30 days
- Suspend subscription
- Don't generate new invoice
- Send escalation email to admin

### Postconditions

- Invoice created with status = 'OPEN'
- Email sent to tenant
- Audit log created

### Business Rules

1. Invoice amount = subscription.price_snapshot (immutable)
2. Payment terms = 7 days (configurable)
3. One invoice per billing period per subscription
4. Invoice number unique across system

### Technical Notes

```typescript
// Pseudo-code
async function generateMonthlyInvoices() {
  const subscriptions = await db.query(`
    SELECT s.*
    FROM tenant_subscriptions s
    WHERE s.status = 'ACTIVE'
      AND s.billing_cycle = 'MONTHLY'
      AND NOT EXISTS (
        SELECT 1 FROM subscription_invoices i
        WHERE i.subscription_id = s._id
          AND i.billing_period_start >= DATE_TRUNC('month', NOW())
      )
  `);
  
  for (const sub of subscriptions) {
    const invoice = await createInvoice({
      tenant_id: sub.tenant_id,
      subscription_id: sub._id,
      amount: sub.price_snapshot,
      currency_code: sub.currency_code,
      billing_period_start: startOfMonth(),
      billing_period_end: endOfMonth(),
      due_date: endOfMonth().add(7, 'days'),
      status: 'OPEN',
    });
    
    await sendInvoiceEmail(invoice);
  }
}
```

---

## UC-INV-002: Tenant View Invoice History

**Actor:** Tenant User  
**Trigger:** User clicks "Invoices" menu  
**Preconditions:**
- User is authenticated
- User has tenant role

### Main Flow

1. **User** navigates to Invoices page
2. **System** retrieves invoices for user's tenant:
   ```sql
   SELECT * FROM subscription_invoices
   WHERE tenant_id = ? AND deleted_at IS NULL
   ORDER BY created_at DESC
   ```
3. **System** displays invoice list with columns:
   - Invoice Number
   - Amount
   - Status (color-coded)
   - Billing Period
   - Due Date
   - Paid At (if PAID)
4. **User** can filter by:
   - Status (DRAFT, OPEN, PAID, VOID)
   - Date range
   - Subscription
5. **User** clicks invoice to view details

### Alternative Flows

**Alt 1: No Invoices Found**
- Display empty state
- Show message: "No invoices found"
- Offer link to active subscriptions

**Alt 2: Overdue Invoice**
- Highlight overdue invoices in red
- Show "X days overdue" badge
- Display "Pay Now" button prominently

### Postconditions

- Invoice list displayed
- Filters applied correctly
- User can view/download invoices

---

## UC-INV-003: Tenant Pay Invoice

**Actor:** Tenant User  
**Trigger:** User clicks "Pay Now" on OPEN invoice  
**Preconditions:**
- Invoice status = 'OPEN'
- User is authorized to pay for tenant

### Main Flow

1. **User** clicks "Pay Now" button
2. **System** displays payment modal with:
   - Invoice details (number, amount, due date)
   - Payment methods (Credit Card, Bank Transfer, Wallet)
3. **User** selects payment method: "Credit Card"
4. **User** enters payment details
5. **User** clicks "Confirm Payment"
6. **System** processes payment via payment gateway
7. **Payment Gateway** returns success response
8. **System** calls `/invoices/:id/pay` API:
   ```json
   {
     "payment_method": "CREDIT_CARD",
     "payment_date": "2026-01-14T15:30:00Z",
     "metadata": {
       "transaction_id": "txn_abc123",
       "gateway": "stripe",
       "card_last4": "4242"
     }
   }
   ```
9. **API** updates invoice:
   - status = 'PAID'
   - paid_at = NOW()
   - metadata += payment info
10. **System** sends receipt email
11. **System** displays success message: "Payment successful! Receipt sent to your email."

### Alternative Flows

**Alt 1: Payment Failed**
- Payment gateway returns error
- Display error message: "Payment failed. Please try again."
- Invoice remains OPEN
- Log payment attempt in metadata

**Alt 2: Invoice Already Paid**
- Status check fails (status != 'OPEN')
- Display message: "This invoice has already been paid."
- Redirect to invoice details

**Alt 3: Concurrent Payment**
- Another user/system paid invoice simultaneously
- API returns 409 Conflict
- Display: "This invoice was just paid. Refreshing..."
- Refresh invoice details

### Postconditions

- Invoice status = 'PAID'
- paid_at timestamp set
- Payment info stored in metadata
- Receipt email sent
- Subscription remains ACTIVE

### Business Rules

1. Only OPEN invoices can be paid
2. Payment is atomic (all-or-nothing)
3. Duplicate payment prevented by status check
4. Receipt sent within 1 minute of payment

---

## UC-INV-004: System Track Overdue Invoices

**Actor:** System (Daily Cron Job)  
**Trigger:** Runs daily at 9:00 AM UTC  
**Preconditions:** None

### Main Flow

1. **System** queries overdue invoices:
   ```sql
   SELECT * FROM subscription_invoices
   WHERE status = 'OPEN' AND due_date < NOW()
   ORDER BY due_date ASC
   ```
2. For each overdue invoice, **System** calculates:
   - `overdue_days = (NOW() - due_date).days`
3. **System** categorizes by severity:
   - **1-7 days:** First reminder
   - **8-14 days:** Second reminder
   - **15-30 days:** Final notice
   - **31-60 days:** Escalation to admin
   - **60+ days:** Mark as UNCOLLECTIBLE candidate
4. **System** sends appropriate email:
   - Day 1-7: "Friendly reminder: Invoice {number} is overdue"
   - Day 8-14: "Second notice: Please pay invoice {number}"
   - Day 15-30: "Final notice: Payment required for {number}"
   - Day 31+: Admin escalation email
5. **System** updates metadata with reminder history:
   ```json
   {
     "reminders_sent": [
       {"date": "2026-01-15", "type": "first"},
       {"date": "2026-01-22", "type": "second"}
     ]
   }
   ```
6. **System** logs daily report:
   - Total overdue invoices
   - Total overdue amount
   - Breakdown by severity

### Alternative Flows

**Alt 1: Subscription Suspension**
- If invoice overdue > 30 days AND subscription.status = 'ACTIVE'
- Update subscription.status = 'PAST_DUE'
- Disable tenant access to services
- Send suspension email

**Alt 2: Payment Received During Job**
- Invoice status changed to PAID
- Skip sending reminder
- Log: "Invoice {id} paid during overdue job"

### Postconditions

- Reminder emails sent
- Metadata updated
- Suspensions applied if needed
- Admin alerted for severe cases

### Business Rules

1. Max 3 reminders before escalation
2. Suspension after 30 days overdue
3. UNCOLLECTIBLE consideration after 60 days
4. All actions logged for audit

---

## UC-INV-005: Admin Void Invoice

**Actor:** Admin User  
**Trigger:** Admin needs to cancel an invoice  
**Preconditions:**
- User has admin role
- Invoice exists and not deleted

### Main Flow

1. **Admin** searches for invoice by number: "INV-20260114-123456"
2. **System** displays invoice details
3. **Admin** clicks "Void Invoice" button
4. **System** displays confirmation modal:
   - Warning: "This action cannot be undone"
   - Reason field (required)
5. **Admin** enters reason: "Duplicate invoice created in error"
6. **Admin** confirms
7. **System** calls `PATCH /invoices/:id`:
   ```json
   {
     "status": "VOID",
     "metadata": {
       "void_reason": "Duplicate invoice created in error",
       "voided_by": "admin-user-id",
       "voided_at": "2026-01-14T16:00:00Z"
     },
     "version": 1
   }
   ```
8. **System** updates invoice status = 'VOID'
9. **System** sends notification email to tenant
10. **System** logs admin action

### Alternative Flows

**Alt 1: Invoice Already PAID**
- Cannot void PAID invoices (business rule)
- Display error: "Cannot void a paid invoice. Please issue a credit note instead."

**Alt 2: Version Conflict**
- Invoice was modified by another process
- API returns 409 Conflict
- Display: "Invoice was modified. Please refresh and try again."

### Postconditions

- Invoice status = 'VOID'
- Void reason stored in metadata
- Tenant notified
- Admin action audited

---

## UC-INV-006: Admin Mark Uncollectible

**Actor:** Admin User  
**Trigger:** Invoice cannot be collected after multiple attempts  
**Preconditions:**
- Invoice status = 'OPEN'
- Invoice overdue > 60 days
- Collection attempts exhausted

### Main Flow

1. **Admin** reviews overdue report
2. **Admin** selects invoice to write off
3. **Admin** clicks "Mark as Uncollectible"
4. **System** requires:
   - Confirmation checkbox
   - Reason: "All collection attempts failed"
   - Notes: "Contacted customer 5 times, no response"
5. **Admin** submits
6. **System** updates:
   - status = 'UNCOLLECTIBLE'
   - metadata += write-off info
7. **System** creates accounting entry for bad debt
8. **System** notifies finance team

### Postconditions

- Invoice status = 'UNCOLLECTIBLE'
- Bad debt recorded
- Finance team notified
- Subscription suspended/cancelled

---

## UC-INV-007: Partner Distribution Invoice

**Actor:** System  
**Trigger:** Partner creates subscription for end customer  
**Preconditions:**
- Partner is registered and approved
- End customer (tenant) exists

### Main Flow

1. **Partner** sells package to end customer via partner portal
2. **Partner** creates subscription for customer
3. **System** generates invoice with:
   - tenant_id = end customer ID
   - partner_id = partner ID ← Key difference
   - amount = package price
   - status = 'OPEN'
4. **System** sends invoice to end customer
5. **End Customer** pays partner directly (offline)
6. **Partner** marks invoice as paid in partner portal
7. **System** updates invoice:
   - status = 'PAID'
   - paid_at = NOW()
   - metadata.payment_method = 'PARTNER_TRANSFER'
   - metadata.partner_commission = calculated commission
8. **System** records partner commission owed

### Postconditions

- Invoice created with partner_id
- Customer has access to service
- Partner commission calculated
- Monthly reconciliation includes this invoice

---

## UC-INV-008: Apply Price Adjustments

**Actor:** Admin/System  
**Trigger:** Need to adjust invoice amount  
**Preconditions:**
- Invoice exists (any status)

### Main Flow

1. **Admin** opens invoice details
2. **Admin** clicks "Add Price Adjustment"
3. **System** displays adjustment form:
   - Type: [DISCOUNT | CREDIT | SURCHARGE | TAX]
   - Description: (required)
   - Amount: (positive or negative)
   - Reason: (optional)
4. **Admin** enters:
   - Type: "DISCOUNT"
   - Description: "Early payment discount (5%)"
   - Amount: -50000
   - Reason: "Paid within 3 days"
5. **Admin** saves
6. **System** updates:
   ```json
   {
     "price_adjustments": [
       {
         "type": "DISCOUNT",
         "description": "Early payment discount (5%)",
         "amount": -50000.0000,
         "reason": "Paid within 3 days"
       }
     ]
   }
   ```
7. **System** recalculates total (if needed)
8. **System** displays updated invoice

### Business Rules

1. Adjustments are immutable once added
2. Multiple adjustments can be applied
3. Total amount can go negative (for credit notes)
4. All adjustments logged for audit

---

## UC-INV-009: Search Invoice by Number

**Actor:** Customer Support / Tenant  
**Trigger:** User enters invoice number in search  
**Preconditions:** User authenticated

### Main Flow

1. **User** enters invoice number: "INV-20260114-123456"
2. **System** calls `GET /invoices/number/INV-20260114-123456`
3. **System** returns invoice details
4. **System** displays full invoice info with:
   - Header: Invoice number, status
   - Financial: Amount, currency, adjustments
   - Billing period: Start/end dates
   - Payment: Due date, paid_at
   - Links: Download PDF, payment portal

### Alternative Flows

**Alt 1: Invoice Not Found**
- Display: "Invoice INV-20260114-123456 not found"
- Offer: "Check the number and try again"

**Alt 2: Permission Denied**
- Tenant trying to access another tenant's invoice
- Return 403 Forbidden
- Display: "You don't have permission to view this invoice"

---

## UC-INV-010: Generate Monthly Revenue Report

**Actor:** Finance Team  
**Trigger:** Monthly report generation (1st of month)  
**Preconditions:** Previous month completed

### Main Flow

1. **Finance** navigates to Reports → Revenue
2. **Finance** selects month: "January 2026"
3. **System** calls `GET /invoices/stats`
4. **System** aggregates data:
   ```sql
   SELECT 
     COUNT(*) as total_invoices,
     SUM(amount) as total_amount,
     SUM(CASE WHEN status='PAID' THEN amount ELSE 0 END) as collected,
     SUM(CASE WHEN status='OPEN' THEN amount ELSE 0 END) as outstanding
   FROM subscription_invoices
   WHERE created_at >= '2026-01-01' AND created_at < '2026-02-01'
   ```
5. **System** displays metrics:
   - Total invoices: 1,500
   - Total amount: 1,500,000,000 VND
   - Collected: 1,200,000,000 VND (80%)
   - Outstanding: 300,000,000 VND (20%)
   - Overdue: 50,000,000 VND
6. **Finance** exports to Excel/PDF

---

## UC-INV-011: Partner Reconciliation

**Actor:** Finance Team  
**Trigger:** Monthly partner reconciliation  
**Preconditions:** Month ended

### Main Flow

1. **Finance** navigates to Partners → Reconciliation
2. **Finance** selects partner: "Partner ABC"
3. **Finance** selects month: "January 2026"
4. **System** queries invoices:
   ```sql
   SELECT * FROM subscription_invoices
   WHERE partner_id = ? AND created_at BETWEEN ? AND ?
   ```
5. **System** calculates:
   - Total invoices: 50
   - Total amount: 50,000,000 VND
   - Paid invoices: 45
   - Paid amount: 45,000,000 VND
   - Partner commission: 4,500,000 VND (10%)
   - Platform revenue: 40,500,000 VND (90%)
6. **System** generates reconciliation report
7. **Finance** approves and pays partner

---

## UC-INV-012: Handle Payment Failure

**Actor:** System  
**Trigger:** Payment gateway returns failure  
**Preconditions:**
- Invoice status = 'OPEN'
- Payment attempt initiated

### Main Flow

1. **User** attempts payment
2. **Payment Gateway** returns error: "Card declined"
3. **System** catches error
4. **System** updates invoice metadata:
   ```json
   {
     "payment_attempts": [
       {
         "timestamp": "2026-01-14T15:30:00Z",
         "method": "CREDIT_CARD",
         "status": "FAILED",
         "error": "Card declined",
         "gateway_code": "card_declined"
       }
     ]
   }
   ```
5. **System** displays error to user: "Payment failed: Card declined. Please try another card."
6. **System** sends email: "Payment failed for invoice {number}"
7. **Invoice** remains OPEN
8. **User** can retry payment

### Business Rules

1. No limit on payment attempts
2. All attempts logged for fraud detection
3. After 3 failures, suggest bank transfer
4. Invoice status unchanged on failure

---

## 📊 Use Case Summary

| ID | Use Case | Actor | Complexity | Priority |
|----|----------|-------|------------|----------|
| UC-INV-001 | Auto-Generate Invoice | System | High | Critical |
| UC-INV-002 | View Invoice History | Tenant | Low | High |
| UC-INV-003 | Pay Invoice | Tenant | Medium | Critical |
| UC-INV-004 | Track Overdue | System | Medium | High |
| UC-INV-005 | Void Invoice | Admin | Low | Medium |
| UC-INV-006 | Mark Uncollectible | Admin | Medium | Low |
| UC-INV-007 | Partner Distribution | System | High | High |
| UC-INV-008 | Price Adjustments | Admin | Low | Medium |
| UC-INV-009 | Search by Number | User | Low | Medium |
| UC-INV-010 | Revenue Report | Finance | Medium | High |
| UC-INV-011 | Partner Reconciliation | Finance | Medium | High |
| UC-INV-012 | Payment Failure | System | Low | High |

---

**Last Updated:** 2026-01-14  
**Total Use Cases:** 12  
**Status:** ✅ Production Ready
