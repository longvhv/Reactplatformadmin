# Subscription Orders - Use Cases

**Version:** 1.0  
**Last Updated:** 2026-01-14  
**Status:** ✅ Production Ready

## Table of Contents

1. [Overview](#overview)
2. [Use Case List](#use-case-list)
3. [Detailed Use Cases](#detailed-use-cases)
   - [UC-ORD-001: Create New Order](#uc-ord-001-create-new-order)
   - [UC-ORD-002: Process Payment](#uc-ord-002-process-payment)
   - [UC-ORD-003: View Order History](#uc-ord-003-view-order-history)
   - [UC-ORD-004: Cancel Order](#uc-ord-004-cancel-order)
   - [UC-ORD-005: Search Order by Number](#uc-ord-005-search-order-by-number)
   - [UC-ORD-006: Send Payment Reminders](#uc-ord-006-send-payment-reminders)
   - [UC-ORD-007: Auto-Cancel Expired Orders](#uc-ord-007-auto-cancel-expired-orders)
   - [UC-ORD-008: Generate Revenue Report](#uc-ord-008-generate-revenue-report)
   - [UC-ORD-009: Handle Payment Failure](#uc-ord-009-handle-payment-failure)
   - [UC-ORD-010: Update Order Details](#uc-ord-010-update-order-details)
   - [UC-ORD-011: View Package Analytics](#uc-ord-011-view-package-analytics)
   - [UC-ORD-012: Reconcile Orders](#uc-ord-012-reconcile-orders)
4. [Actor Definitions](#actor-definitions)
5. [System Behaviors](#system-behaviors)

---

## Overview

This document describes all use cases for the Subscription Orders module. Each use case includes:

- **Actors** involved
- **Preconditions** required
- **Main flow** steps
- **Alternative flows** for different scenarios
- **Postconditions** and expected results
- **Business rules** applied
- **API endpoints** used
- **Error handling** scenarios

### Statistics

- **Total Use Cases:** 12
- **Actors:** 5 (Customer, Admin, System, Payment Gateway, Billing System)
- **API Endpoints:** 10
- **Covered Scenarios:** 40+

---

## Use Case List

| ID | Use Case Name | Primary Actor | Priority | Status |
|----|---------------|---------------|----------|--------|
| UC-ORD-001 | Create New Order | Customer | Critical | ✅ |
| UC-ORD-002 | Process Payment | Customer | Critical | ✅ |
| UC-ORD-003 | View Order History | Customer | High | ✅ |
| UC-ORD-004 | Cancel Order | Customer/Admin | High | ✅ |
| UC-ORD-005 | Search Order by Number | Customer/Admin | Medium | ✅ |
| UC-ORD-006 | Send Payment Reminders | System | Medium | ✅ |
| UC-ORD-007 | Auto-Cancel Expired Orders | System | Medium | ✅ |
| UC-ORD-008 | Generate Revenue Report | Admin | High | ✅ |
| UC-ORD-009 | Handle Payment Failure | System | Critical | ✅ |
| UC-ORD-010 | Update Order Details | Admin | Low | ✅ |
| UC-ORD-011 | View Package Analytics | Admin | Medium | ✅ |
| UC-ORD-012 | Reconcile Orders | Billing System | Medium | ✅ |

---

## Detailed Use Cases

### UC-ORD-001: Create New Order

**ID:** UC-ORD-001  
**Name:** Create New Subscription Order  
**Priority:** Critical  
**Frequency:** 1000+ times/day

#### Actors
- **Primary:** Customer (Tenant)
- **Secondary:** System, Billing System

#### Preconditions
- ✅ Customer is authenticated
- ✅ Customer has selected a valid service package
- ✅ Service package is active and available

#### Main Flow

1. Customer browses available service packages
2. Customer selects desired package
3. System displays package details (price, features, duration)
4. Customer clicks "Subscribe" or "Purchase"
5. System validates package availability
6. System generates UUID v7 for order ID
7. System generates unique order number (Format: `ORD-YYYYMMDD-XXXXXX`)
8. System creates package snapshot (JSONB)
   - Captures current package name, price, features
   - Preserves details for historical accuracy
9. System creates order record:
   - `status = 'PENDING'`
   - `version = 1`
   - `created_at = NOW()`
10. System stores order in database
11. System redirects customer to payment page
12. System displays order summary with order number

#### Alternative Flows

**A1: Package No Longer Available**
- At step 5, if package is deleted or inactive
- System displays error: "This package is no longer available"
- Customer is redirected to package list
- Use case ends

**A2: Validation Failure**
- At step 10, if database constraint violation
- System logs error
- System displays user-friendly error message
- Customer can retry
- Use case ends

#### Postconditions

**Success:**
- ✅ Order created with status = 'PENDING'
- ✅ Order number generated and unique
- ✅ Package snapshot saved
- ✅ Customer redirected to payment
- ✅ Order appears in customer's order history

**Failure:**
- ❌ No order created
- ❌ Customer notified of error
- ❌ Error logged for investigation

#### Business Rules

| Rule | Description |
|------|-------------|
| BR-ORD-001 | Order number must be unique |
| BR-ORD-002 | Package snapshot must be complete |
| BR-ORD-003 | Initial status must be PENDING |
| BR-ORD-004 | total_amount must be >= 0 |
| BR-ORD-005 | currency_code must be 3 characters |

#### API Endpoint

```http
POST /subscription-orders
Content-Type: application/json
Authorization: Bearer <token>

{
  "tenant_id": "01934c8f-0000-7c3d-8e4f-000000000001",
  "package_id": "01934c8f-1111-7c3d-8e4f-111111111111",
  "total_amount": 1000000.0000,
  "currency_code": "VND",
  "package_snapshot": {
    "name": "Professional Plan",
    "price": 1000000,
    "duration_days": 30,
    "features": ["Unlimited Users", "24/7 Support"]
  }
}
```

**Response (201 Created):**
```json
{
  "_id": "01934c8f-1a2b-7c3d-8e4f-5a6b7c8d9e0f",
  "order_number": "ORD-20260114-123456",
  "status": "PENDING",
  "version": 1,
  "created_at": "2026-01-14T10:30:00Z"
}
```

#### Error Handling

| Error Code | HTTP Status | Description | User Message |
|------------|-------------|-------------|--------------|
| INVALID_PACKAGE | 400 | Package ID not found | "Selected package is not available" |
| VALIDATION_ERROR | 422 | Required field missing | "Please provide all required information" |
| DUPLICATE_ORDER | 409 | Order number collision | "Please try again" |
| DATABASE_ERROR | 500 | Database connection issue | "Service temporarily unavailable" |

#### Related Use Cases
- UC-ORD-002: Process Payment (next step)
- UC-ORD-004: Cancel Order (alternative action)

---

### UC-ORD-002: Process Payment

**ID:** UC-ORD-002  
**Name:** Process Payment for Order  
**Priority:** Critical  
**Frequency:** 800+ times/day

#### Actors
- **Primary:** Customer
- **Secondary:** Payment Gateway, System, Billing System

#### Preconditions
- ✅ Order exists with status = 'PENDING'
- ✅ Customer is authenticated
- ✅ Payment gateway is available

#### Main Flow

1. Customer enters payment information (credit card, bank transfer, etc.)
2. Customer submits payment
3. System validates order status = 'PENDING'
4. System calls payment gateway API
5. Payment gateway processes payment
6. Payment gateway returns success response
7. System updates order:
   - `status = 'PAID'`
   - `payment_method = 'CREDIT_CARD'` (or other method)
   - `version = version + 1`
   - `updated_at = NOW()`
8. System creates tenant subscription record
9. System generates first invoice
10. System sends email receipt to customer
11. System displays success message with order details

#### Alternative Flows

**A1: Payment Declined**
- At step 6, payment gateway returns decline
- System updates order status to 'FAILED'
- System increments version
- System sends failure notification email
- Customer sees error message with reason
- Customer can retry payment
- Use case ends

**A2: Payment Gateway Timeout**
- At step 5, payment gateway doesn't respond within 30 seconds
- System marks order as 'PENDING' (no change)
- System logs timeout error
- Customer sees "Payment processing delayed" message
- System queues order for manual review
- Use case ends

**A3: Order Not in PENDING Status**
- At step 3, order status is not 'PENDING'
- System rejects payment attempt
- Returns error: "Order cannot be paid (current status: PAID/CANCELLED/FAILED)"
- Use case ends

**A4: Version Conflict**
- At step 7, another process updated the order
- Database returns 0 rows affected
- System retries payment update (max 3 attempts)
- If still failing, escalate to admin
- Use case ends

#### Postconditions

**Success:**
- ✅ Order status = 'PAID'
- ✅ payment_method recorded
- ✅ Version incremented
- ✅ Subscription created
- ✅ Invoice generated
- ✅ Receipt sent

**Failure:**
- ✅ Order status = 'FAILED'
- ✅ Error reason recorded
- ✅ Customer notified
- ✅ Payment can be retried

#### Business Rules

| Rule | Description |
|------|-------------|
| BR-ORD-006 | Only PENDING orders can be paid |
| BR-ORD-007 | Payment method must be set when paid |
| BR-ORD-008 | Version must increment on every update |
| BR-ORD-009 | Subscription created only after payment success |
| BR-ORD-010 | Receipt must be sent within 5 minutes |

#### API Endpoint

```http
POST /subscription-orders/{order_id}/pay
Content-Type: application/json
Authorization: Bearer <token>

{
  "payment_method": "CREDIT_CARD",
  "payment_data": {
    "card_last4": "4242",
    "transaction_id": "txn_abc123",
    "gateway": "stripe"
  }
}
```

**Response (200 OK):**
```json
{
  "_id": "01934c8f-1a2b-7c3d-8e4f-5a6b7c8d9e0f",
  "order_number": "ORD-20260114-123456",
  "status": "PAID",
  "payment_method": "CREDIT_CARD",
  "version": 2,
  "updated_at": "2026-01-14T11:00:00Z"
}
```

#### Payment Gateway Integration

**Supported Gateways:**
- Stripe
- PayPal
- VNPay
- MoMo
- ZaloPay

**Payment Flow:**
```
1. Collect payment info
2. Tokenize card data (PCI compliance)
3. Call gateway API
4. Receive transaction ID
5. Store transaction reference
6. Update order status
```

#### Error Handling

| Error Code | HTTP Status | Description | User Action |
|------------|-------------|-------------|-------------|
| INVALID_STATUS | 400 | Order not PENDING | View current order status |
| PAYMENT_DECLINED | 402 | Card declined | Try different payment method |
| INSUFFICIENT_FUNDS | 402 | Not enough balance | Add funds and retry |
| GATEWAY_ERROR | 502 | Payment service down | Try again later |
| VERSION_CONFLICT | 409 | Concurrent update | Refresh and retry |

#### Performance Requirements
- Payment processing: < 5 seconds
- Status update: < 200ms
- Email sending: Asynchronous (< 5 min)

#### Related Use Cases
- UC-ORD-001: Create New Order (previous step)
- UC-ORD-009: Handle Payment Failure (error path)

---

### UC-ORD-003: View Order History

**ID:** UC-ORD-003  
**Name:** View Order History  
**Priority:** High  
**Frequency:** 500+ times/day

#### Actors
- **Primary:** Customer, Admin

#### Preconditions
- ✅ User is authenticated
- ✅ Customer has at least one order (or none to show empty state)

#### Main Flow

1. Customer navigates to "My Orders" page
2. System retrieves orders for customer's tenant
3. System applies default filters:
   - Exclude deleted orders (`deleted_at IS NULL`)
   - Sort by newest first (`ORDER BY created_at DESC`)
4. System displays paginated order list (20 per page)
5. For each order, display:
   - Order number
   - Package name (from snapshot)
   - Total amount with currency
   - Status badge
   - Created date
   - Action buttons (View Details, Pay if PENDING)
6. Customer can:
   - Click to view order details
   - Filter by status
   - Search by order number
   - Navigate pages

#### Alternative Flows

**A1: No Orders Found**
- At step 3, no orders exist for tenant
- System displays empty state with:
  - "No orders yet"
  - Button to browse packages
- Use case ends

**A2: Filter by Status**
- Customer selects status filter (PENDING, PAID, CANCELLED, FAILED)
- System adds status filter to query
- System displays filtered results
- Continue to step 5

**A3: Search by Order Number**
- Customer enters order number in search box
- System queries by order_number (ILIKE)
- System displays matching results (usually 1 or 0)
- Continue to step 5

#### Postconditions

**Success:**
- ✅ Order list displayed
- ✅ Pagination working
- ✅ Filters applied correctly
- ✅ Performance < 500ms

#### Business Rules

| Rule | Description |
|------|-------------|
| BR-ORD-011 | Only show orders for authenticated user's tenant |
| BR-ORD-012 | Never show deleted orders to customers |
| BR-ORD-013 | Admin can view all orders (with tenant filter) |
| BR-ORD-014 | Default sort: newest first |
| BR-ORD-015 | Default page size: 20 items |

#### API Endpoint

```http
GET /subscription-orders?tenant_id={id}&page=1&limit=20&status=PENDING
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "_id": "01934c8f-1a2b-7c3d-8e4f-5a6b7c8d9e0f",
      "order_number": "ORD-20260114-123456",
      "total_amount": 1000000.0000,
      "currency_code": "VND",
      "status": "PENDING",
      "package_name": "Professional Plan",
      "created_at": "2026-01-14T10:30:00Z"
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 20,
  "pages": 8
}
```

#### UI/UX Requirements

**Order List Table:**
| Column | Width | Content |
|--------|-------|---------|
| Order Number | 15% | Clickable link |
| Package | 25% | Name from snapshot |
| Amount | 15% | Formatted currency |
| Status | 12% | Color-coded badge |
| Date | 18% | Relative time |
| Actions | 15% | Buttons |

**Status Badges:**
- PENDING: Yellow background
- PAID: Green background
- CANCELLED: Gray background
- FAILED: Red background

#### Performance Optimization
- Use index: `idx_orders_tenant_lookup`
- Expected query time: < 15ms
- Total page load: < 500ms
- Cache pagination metadata

#### Related Use Cases
- UC-ORD-005: Search Order by Number (filter action)
- UC-ORD-002: Process Payment (action from PENDING order)

---

### UC-ORD-004: Cancel Order

**ID:** UC-ORD-004  
**Name:** Cancel Order  
**Priority:** High  
**Frequency:** 50+ times/day

#### Actors
- **Primary:** Customer, Admin
- **Secondary:** System

#### Preconditions
- ✅ Order exists
- ✅ Order status = 'PENDING' (only pending orders can be cancelled)
- ✅ User is authenticated
- ✅ User has permission to cancel (own order or admin)

#### Main Flow

1. Customer navigates to order details
2. Customer clicks "Cancel Order" button
3. System displays confirmation dialog:
   - "Are you sure you want to cancel this order?"
   - Order number and package name shown
4. Customer confirms cancellation
5. System validates order status = 'PENDING'
6. System updates order:
   - `status = 'CANCELLED'`
   - `version = version + 1`
   - `updated_at = NOW()`
7. System sends cancellation email to customer
8. System displays success message
9. Order list refreshed with updated status

#### Alternative Flows

**A1: Order Not PENDING**
- At step 5, order status is not 'PENDING'
- System shows error: "Only pending orders can be cancelled (current status: PAID)"
- Use case ends

**A2: Admin Force Cancel**
- Admin can cancel any order (including PAID)
- System requires admin to enter cancellation reason
- System records reason in audit log
- Continue from step 6

**A3: Customer Cancels Before Confirmation**
- At step 3, customer clicks "No" or closes dialog
- No changes made
- Use case ends

#### Postconditions

**Success:**
- ✅ Order status = 'CANCELLED'
- ✅ Version incremented
- ✅ Email sent
- ✅ Cannot be paid anymore

**Failure:**
- ❌ Order status unchanged
- ❌ Error message displayed

#### Business Rules

| Rule | Description |
|------|-------------|
| BR-ORD-016 | Only PENDING orders can be cancelled by customer |
| BR-ORD-017 | Admin can cancel any order with reason |
| BR-ORD-018 | Cancelled orders cannot be uncancelled |
| BR-ORD-019 | Cancellation triggers email notification |
| BR-ORD-020 | Cancelled orders remain in history (soft delete) |

#### API Endpoint

```http
PATCH /subscription-orders/{order_id}
Content-Type: application/json
Authorization: Bearer <token>

{
  "status": "CANCELLED",
  "version": 1
}
```

**Response (200 OK):**
```json
{
  "_id": "01934c8f-1a2b-7c3d-8e4f-5a6b7c8d9e0f",
  "order_number": "ORD-20260114-123456",
  "status": "CANCELLED",
  "version": 2,
  "updated_at": "2026-01-14T12:00:00Z"
}
```

#### Email Template

**Subject:** Order Cancelled - {order_number}

**Body:**
```
Hello {tenant_name},

Your order has been cancelled:
- Order Number: {order_number}
- Package: {package_name}
- Amount: {total_amount} {currency_code}
- Cancelled At: {updated_at}

If you didn't request this cancellation, please contact support.

Thank you,
{Company Name}
```

#### Related Use Cases
- UC-ORD-001: Create New Order (can be cancelled)
- UC-ORD-007: Auto-Cancel Expired Orders (system action)

---

### UC-ORD-005: Search Order by Number

**ID:** UC-ORD-005  
**Name:** Search Order by Number  
**Priority:** Medium  
**Frequency:** 100+ times/day

#### Actors
- **Primary:** Customer, Admin, Support Agent

#### Preconditions
- ✅ User is authenticated
- ✅ User has valid order number

#### Main Flow

1. User navigates to order search page
2. User enters order number in search box
   - Format: `ORD-YYYYMMDD-XXXXXX`
   - Case-insensitive
3. User submits search
4. System queries database by order_number
5. System uses unique index: `idx_orders_number_search`
6. System finds matching order (or none)
7. System displays order details
8. User can view full order information
9. User can take actions (Pay, Cancel, etc.)

#### Alternative Flows

**A1: Order Not Found**
- At step 6, no matching order found
- System displays: "No order found with number: {search_term}"
- Suggest checking order number format
- Use case ends

**A2: Partial Number Search**
- User enters partial order number (e.g., "ORD-20260114")
- System searches with ILIKE pattern
- System returns list of matching orders
- Continue to step 7

**A3: Fuzzy Search**
- User enters incorrect format
- System tries to extract date and sequence
- System suggests possible matches
- User selects correct order
- Continue to step 7

#### Postconditions

**Success:**
- ✅ Order found in < 5ms
- ✅ Full details displayed
- ✅ User can take actions

**Not Found:**
- ✅ Clear "not found" message
- ✅ Suggestions provided

#### Business Rules

| Rule | Description |
|------|-------------|
| BR-ORD-021 | Order number search is case-insensitive |
| BR-ORD-022 | Deleted orders excluded from search |
| BR-ORD-023 | Admin can search all orders |
| BR-ORD-024 | Customer can only search own orders |
| BR-ORD-025 | Search must use unique index |

#### API Endpoint

```http
GET /subscription-orders/number/{order_number}
Authorization: Bearer <token>
```

**Example:**
```http
GET /subscription-orders/number/ORD-20260114-123456
```

**Response (200 OK):**
```json
{
  "_id": "01934c8f-1a2b-7c3d-8e4f-5a6b7c8d9e0f",
  "order_number": "ORD-20260114-123456",
  "total_amount": 1000000.0000,
  "currency_code": "VND",
  "status": "PAID",
  "package_snapshot": {...},
  "created_at": "2026-01-14T10:30:00Z"
}
```

**Response (404 Not Found):**
```json
{
  "error": "Order not found",
  "code": "NOT_FOUND"
}
```

#### Performance
- **Index Used:** `idx_orders_number_search` (UNIQUE)
- **Query Time:** < 5ms (constant time)
- **Database Lookups:** 1

#### Use Cases in Support
- Customer calls support with order number
- Support agent searches order
- Agent can view payment status
- Agent can assist with payment issues

#### Related Use Cases
- UC-ORD-003: View Order History (alternative search method)

---

### UC-ORD-006: Send Payment Reminders

**ID:** UC-ORD-006  
**Name:** Send Payment Reminders for Pending Orders  
**Priority:** Medium  
**Frequency:** Daily (cron job)

#### Actors
- **Primary:** System (Automated Job)
- **Secondary:** Email Service

#### Preconditions
- ✅ Cron job scheduled (daily at 10:00 AM)
- ✅ Email service operational
- ✅ Pending orders exist

#### Main Flow

1. Cron job triggers at scheduled time
2. System queries pending orders:
   ```sql
   SELECT * FROM subscription_orders
   WHERE status = 'PENDING'
   AND deleted_at IS NULL
   AND created_at < NOW() - INTERVAL '1 day'
   ORDER BY created_at ASC
   ```
3. System categorizes orders by age:
   - 1-2 days old: First reminder
   - 3-7 days old: Second reminder
   - 8-14 days old: Final warning
4. For each order:
   - Fetch tenant email
   - Generate personalized reminder email
   - Send via email service
   - Log email sent
5. System updates statistics:
   - Count reminders sent
   - Track open rates
   - Monitor payment conversions
6. System logs job completion

#### Alternative Flows

**A1: No Pending Orders**
- At step 2, query returns 0 orders
- System logs: "No pending orders to remind"
- Job completes successfully
- Use case ends

**A2: Email Service Down**
- At step 4, email service unavailable
- System queues emails for retry
- System logs error
- Job continues with other orders
- Retry queue processed hourly

**A3: Invalid Tenant Email**
- At step 4, tenant email is NULL or invalid
- System logs warning
- Skip to next order
- Admin notified of data issue

#### Postconditions

**Success:**
- ✅ Reminders sent to all eligible orders
- ✅ Statistics updated
- ✅ Job logged

#### Business Rules

| Rule | Description |
|------|-------------|
| BR-ORD-026 | First reminder after 1 day |
| BR-ORD-027 | Second reminder after 3 days |
| BR-ORD-028 | Final warning after 8 days |
| BR-ORD-029 | No more than 3 reminders per order |
| BR-ORD-030 | Stop reminders if order paid/cancelled |

#### Email Templates

**First Reminder (1-2 days):**
```
Subject: Complete Your Order - {order_number}

Hi {tenant_name},

We noticed you haven't completed payment for your order:
- Order: {order_number}
- Package: {package_name}
- Amount: {total_amount} {currency_code}

Complete your payment now: {payment_link}

Questions? Reply to this email.
```

**Final Warning (8-14 days):**
```
Subject: Final Reminder - Order Will Be Cancelled

Hi {tenant_name},

This is your final reminder to complete payment for order {order_number}.

Your order will be automatically cancelled in 2 days if not paid.

Pay now: {payment_link}
```

#### Query Performance
- Uses index: `idx_orders_pending_status`
- Expected query time: < 20ms
- Typical result set: 100-500 orders

#### Monitoring
- Track email send success rate
- Monitor payment conversion rate
- Alert if > 10% email failures

#### Related Use Cases
- UC-ORD-007: Auto-Cancel Expired Orders (next step)
- UC-ORD-002: Process Payment (goal of reminders)

---

### UC-ORD-007: Auto-Cancel Expired Orders

**ID:** UC-ORD-007  
**Name:** Automatically Cancel Expired Pending Orders  
**Priority:** Medium  
**Frequency:** Daily (cron job)

#### Actors
- **Primary:** System (Automated Job)

#### Preconditions
- ✅ Cron job scheduled (daily at 11:00 AM)
- ✅ Orders exist that are > 14 days old and PENDING

#### Main Flow

1. Cron job triggers
2. System queries expired pending orders:
   ```sql
   SELECT * FROM subscription_orders
   WHERE status = 'PENDING'
   AND deleted_at IS NULL
   AND created_at < NOW() - INTERVAL '14 days'
   ```
3. For each expired order:
   - Update status to 'CANCELLED'
   - Increment version
   - Set updated_at
   - Log cancellation reason: "Auto-cancelled after 14 days"
4. System sends cancellation email to tenant
5. System updates metrics
6. System logs job completion

#### Alternative Flows

**A1: No Expired Orders**
- At step 2, query returns 0 orders
- System logs: "No expired orders to cancel"
- Job completes
- Use case ends

#### Postconditions

**Success:**
- ✅ Expired orders cancelled
- ✅ Emails sent
- ✅ Database cleaned up

#### Business Rules

| Rule | Description |
|------|-------------|
| BR-ORD-031 | Auto-cancel after 14 days |
| BR-ORD-032 | Only apply to PENDING orders |
| BR-ORD-033 | Send notification email |
| BR-ORD-034 | Log cancellation reason |

#### Performance
- Query index: `idx_orders_pending_status`
- Batch update: 100 orders at a time
- Expected runtime: < 1 minute

#### Related Use Cases
- UC-ORD-006: Send Payment Reminders (previous step)
- UC-ORD-004: Cancel Order (manual version)

---

### UC-ORD-008: Generate Revenue Report

**ID:** UC-ORD-008  
**Name:** Generate Revenue Report  
**Priority:** High  
**Frequency:** Monthly + On-demand

#### Actors
- **Primary:** Admin, Finance Team

#### Preconditions
- ✅ User has admin/finance role
- ✅ Orders exist in system

#### Main Flow

1. Admin navigates to Reports section
2. Admin selects "Revenue Report"
3. Admin chooses date range (default: current month)
4. Admin clicks "Generate Report"
5. System queries orders in date range:
   ```sql
   SELECT 
     DATE_TRUNC('month', created_at) as month,
     currency_code,
     COUNT(*) as total_orders,
     COUNT(*) FILTER (WHERE status = 'PAID') as paid_orders,
     SUM(total_amount) FILTER (WHERE status = 'PAID') as revenue
   FROM subscription_orders
   WHERE created_at >= $1 AND created_at <= $2
   AND deleted_at IS NULL
   GROUP BY month, currency_code
   ORDER BY month DESC
   ```
6. System calculates metrics:
   - Total revenue by currency
   - Order count by status
   - Average order value
   - Conversion rate (PAID / Total)
7. System generates charts:
   - Revenue over time (line chart)
   - Status breakdown (pie chart)
   - Currency distribution (bar chart)
8. System displays report
9. Admin can export to CSV/PDF

#### Business Rules

| Rule | Description |
|------|-------------|
| BR-ORD-035 | Only count PAID orders in revenue |
| BR-ORD-036 | Exclude deleted orders |
| BR-ORD-037 | Group by currency |
| BR-ORD-038 | Calculate conversion rate |

#### Related Use Cases
- UC-ORD-011: View Package Analytics

---

### UC-ORD-009: Handle Payment Failure

**ID:** UC-ORD-009  
**Name:** Handle Payment Failure  
**Priority:** Critical  
**Frequency:** 100+ times/day

#### Actors
- **Primary:** System
- **Secondary:** Customer, Payment Gateway

#### Main Flow

1. Payment gateway returns failure response
2. System receives failure code and reason
3. System updates order:
   - `status = 'FAILED'`
   - `version = version + 1`
4. System logs failure details
5. System sends failure email with:
   - Failure reason
   - Retry link
   - Alternative payment methods
6. System displays user-friendly error
7. Customer can retry payment

#### Alternative Flows

**A1: Temporary Failure (Retry)**
- Gateway returns "Temporary failure"
- System automatically retries up to 3 times
- If success, continue to UC-ORD-002
- If still failing, continue main flow

#### Business Rules

| Rule | Description |
|------|-------------|
| BR-ORD-039 | Log all failure reasons |
| BR-ORD-040 | Allow unlimited retries |
| BR-ORD-041 | Track failure patterns |

---

### UC-ORD-010: Update Order Details

**ID:** UC-ORD-010  
**Name:** Update Order Details  
**Priority:** Low  
**Frequency:** 10+ times/day

#### Actors
- **Primary:** Admin

#### Preconditions
- ✅ User has admin role
- ✅ Order exists

#### Main Flow

1. Admin views order details
2. Admin clicks "Edit"
3. Admin updates allowed fields:
   - total_amount
   - payment_method
   - status (with approval)
4. System validates changes
5. System checks version (optimistic locking)
6. System updates order with version increment
7. System logs change in audit trail
8. System displays success message

#### Business Rules

| Rule | Description |
|------|-------------|
| BR-ORD-042 | Require admin approval for status changes |
| BR-ORD-043 | Always use optimistic locking |
| BR-ORD-044 | Log all admin changes |

---

### UC-ORD-011: View Package Analytics

**ID:** UC-ORD-011  
**Name:** View Package Performance Analytics  
**Priority:** Medium  
**Frequency:** Weekly

#### Actors
- **Primary:** Admin, Product Team

#### Main Flow

1. Admin navigates to Analytics
2. System queries package statistics:
   ```sql
   SELECT 
     p.name,
     COUNT(o._id) as order_count,
     SUM(o.total_amount) FILTER (WHERE o.status = 'PAID') as revenue,
     AVG(o.total_amount) as avg_order_value
   FROM service_packages p
   LEFT JOIN subscription_orders o ON p._id = o.package_id
   GROUP BY p.name
   ORDER BY order_count DESC
   ```
3. System displays rankings:
   - Most popular packages
   - Highest revenue packages
   - Conversion rates
4. System shows trends over time

---

### UC-ORD-012: Reconcile Orders

**ID:** UC-ORD-012  
**Name:** Reconcile Orders with Accounting System  
**Priority:** Medium  
**Frequency:** Daily

#### Actors
- **Primary:** Billing System (Automated)

#### Main Flow

1. Billing system queries paid orders
2. System exports order data:
   - Order number
   - Total amount
   - Currency
   - Payment date
   - Package details
3. System generates reconciliation report
4. Billing system imports data
5. System marks orders as reconciled

---

## Actor Definitions

| Actor | Description | Permissions |
|-------|-------------|-------------|
| Customer | Tenant user purchasing packages | Create, view own, pay, cancel own pending |
| Admin | System administrator | All operations |
| System | Automated processes | Background jobs, monitoring |
| Payment Gateway | External payment processor | Payment processing only |
| Billing System | Financial reconciliation system | Read-only access |

---

## System Behaviors

### Automatic Processes

1. **Daily Reminder Job** (10:00 AM)
   - Send payment reminders
   - Track email metrics

2. **Daily Cleanup Job** (11:00 AM)
   - Auto-cancel expired orders
   - Clean up stale records

3. **Hourly Monitoring** (Every hour)
   - Check pending order counts
   - Alert if > 1000 pending

4. **Real-time Processing**
   - Payment callbacks
   - Status updates
   - Email notifications

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-14 | Initial use cases - 12 scenarios |

---

**✅ Use Cases Complete - 1,100+ lines**

*Last updated: 2026-01-14*
