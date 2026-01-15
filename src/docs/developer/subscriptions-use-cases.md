# 📋 Tenant Subscriptions - Use Cases Documentation

## Overview

This document outlines **16 comprehensive use cases** for the Tenant Subscriptions module, covering subscription lifecycle, access control, billing, and analytics.

**Version:** 1.0.0  
**Last Updated:** January 2024

---

## Table of Contents

### **Core Subscription Management**
1. [Create New Subscription](#uc-01-create-new-subscription)
2. [View Subscription Details](#uc-02-view-subscription-details)
3. [Update Subscription Status](#uc-03-update-subscription-status)
4. [Cancel Subscription](#uc-04-cancel-subscription)
5. [Renew Subscription](#uc-05-renew-subscription)

### **Access Control & Authorization**
6. [Check App Access Permission](#uc-06-check-app-access-permission)
7. [List Tenant's Active Subscriptions](#uc-07-list-tenants-active-subscriptions)
8. [Validate Entitlement Limits](#uc-08-validate-entitlement-limits)

### **Billing & Analytics**
9. [Calculate Subscription Revenue](#uc-09-calculate-subscription-revenue)
10. [Find Expiring Subscriptions](#uc-10-find-expiring-subscriptions)
11. [Generate Subscription Usage Report](#uc-11-generate-subscription-usage-report)

### **Package Management**
12. [Upgrade Subscription Package](#uc-12-upgrade-subscription-package)
13. [Downgrade Subscription Package](#uc-13-downgrade-subscription-package)

### **Admin & Operations**
14. [Audit Subscription History](#uc-14-audit-subscription-history)
15. [Bulk Expire Subscriptions](#uc-15-bulk-expire-subscriptions)
16. [Restore Cancelled Subscription](#uc-16-restore-cancelled-subscription)

---

## Core Subscription Management

### UC-01: Create New Subscription

**Actor:** System, Sales Team, Customer (Self-Service)  
**Trigger:** Customer purchases a service package  
**Preconditions:**
- Valid tenant exists
- Valid package exists and is active
- Package has available inventory (if applicable)

**Main Flow:**

1. System receives subscription creation request with:
   - `tenant_id`
   - `package_id`
   - Optional: custom price, start date, end date

2. System validates tenant exists and is active

3. System validates package exists, is active, and not deleted

4. System snapshots package data:
   - `price_amount` ← package.price (or custom price)
   - `currency_code` ← package.currency
   - `granted_entitlements` ← package.entitlements_config

5. System generates subscription:
   - `_id` = new UUID v7
   - `start_at` = specified date or NOW()
   - `end_at` = calculated based on billing cycle or NULL for lifetime
   - `status` = 'ACTIVE'
   - `version` = 1

6. PostgreSQL auto-generates `granted_app_codes[]` from entitlements JSONB

7. System creates subscription record in database

8. System returns created subscription with all details

**Postconditions:**
- ✅ New subscription created with status = ACTIVE
- ✅ Price/entitlements snapshot preserved
- ✅ Tenant has access to granted apps
- ✅ Audit trail created

**API Call:**

```bash
POST /api/v1/subscriptions
{
  "tenant_id": "01HN2K3M4P5Q6R7S8T9V0W1X3",
  "package_id": "01HN2K3M4P5Q6R7S8T9V0W1X4"
}
```

**Response:**

```json
{
  "_id": "01HN2K3M4P5Q6R7S8T9V0W1X2",
  "tenant_id": "01HN2K3M4P5Q6R7S8T9V0W1X3",
  "package_id": "01HN2K3M4P5Q6R7S8T9V0W1X4",
  "price_amount": 1000000.0000,
  "currency_code": "VND",
  "granted_entitlements": {...},
  "granted_app_codes": ["HRM_APP", "CRM_APP"],
  "start_at": "2024-01-01T00:00:00Z",
  "end_at": "2025-01-01T00:00:00Z",
  "status": "ACTIVE",
  "version": 1
}
```

**Business Rules:**

- ✅ Price is immutable snapshot (won't change if package price changes)
- ✅ Entitlements are immutable snapshot
- ✅ Lifetime subscriptions have `end_at = NULL`
- ✅ Default start date is NOW() if not specified
- ✅ End date must be > start date (enforced by constraint)

---

### UC-02: View Subscription Details

**Actor:** Admin, Customer Success, Customer  
**Trigger:** User requests subscription details  
**Preconditions:**
- Subscription ID is valid
- User has permission to view subscription

**Main Flow:**

1. User requests subscription by ID

2. System retrieves subscription with JOINs:
   - Tenant information (name, status)
   - Package information (code, name, billing cycle)
   - Product information (name, category)

3. System calculates dynamic fields:
   - `days_remaining` = EXTRACT(DAY FROM (end_at - NOW()))
   - `is_expired` = (end_at < NOW())

4. System returns complete subscription details

**Postconditions:**
- ✅ Complete subscription info displayed
- ✅ Related tenant/package/product info available
- ✅ Computed metrics included

**API Call:**

```bash
GET /api/v1/subscriptions/{id}/details
```

**Response:**

```json
{
  "_id": "01HN2K3M4P5Q6R7S8T9V0W1X2",
  "tenant_id": "01HN2K3M4P5Q6R7S8T9V0W1X3",
  "package_id": "01HN2K3M4P5Q6R7S8T9V0W1X4",
  "price_amount": 1000000.0000,
  "currency_code": "VND",
  "granted_entitlements": {...},
  "granted_app_codes": ["HRM_APP", "CRM_APP"],
  "start_at": "2024-01-01T00:00:00Z",
  "end_at": "2025-01-01T00:00:00Z",
  "status": "ACTIVE",
  "version": 1,
  
  "tenant_name": "ACME Corporation",
  "package_code": "ENT-ANNUAL",
  "package_name": "Enterprise Annual Plan",
  "package_billing_cycle": "ANNUAL",
  "product_name": "Business Suite",
  "days_remaining": 90,
  "is_expired": false
}
```

---

### UC-03: Update Subscription Status

**Actor:** System (Auto), Admin (Manual)  
**Trigger:** 
- Automatic: Subscription reaches end date
- Manual: Admin changes status
- Payment: Payment failed/succeeded

**Preconditions:**
- Subscription exists
- New status is valid enum value

**Main Flow:**

1. System/Admin initiates status update

2. System validates new status:
   - Must be in: ACTIVE, EXPIRED, CANCELLED, PAST_DUE

3. System updates subscription:
   - Sets `status` to new value
   - Increments `version` (optimistic locking)
   - Updates `updated_at` timestamp

4. System returns success confirmation

**Postconditions:**
- ✅ Status updated
- ✅ Version incremented
- ✅ Audit trail updated

**API Call:**

```bash
PATCH /api/v1/subscriptions/{id}
{
  "status": "PAST_DUE"
}
```

**Status Transitions:**

```
ACTIVE ────> EXPIRED (auto: end_at < NOW)
       ────> CANCELLED (manual cancel)
       ────> PAST_DUE (payment failed)

EXPIRED ───> ACTIVE (renew)
PAST_DUE ──> ACTIVE (payment received)
CANCELLED ─> (terminal, no return)
```

---

### UC-04: Cancel Subscription

**Actor:** Customer, Admin  
**Trigger:** Customer requests cancellation or admin action  
**Preconditions:**
- Subscription exists
- Subscription status is ACTIVE

**Main Flow:**

1. User/Admin requests subscription cancellation

2. System validates subscription is ACTIVE

3. System performs cancellation:
   - Sets `status = 'CANCELLED'`
   - Sets `end_at = NOW()` (immediate cancellation)
   - Sets `deleted_at = NOW()` (soft delete)
   - Increments `version`
   - Updates `updated_at`

4. System returns cancellation confirmation

5. (Optional) System triggers:
   - Notification to tenant
   - Revoke access to apps
   - Create cancellation audit log

**Postconditions:**
- ✅ Subscription cancelled
- ✅ Access revoked immediately
- ✅ Soft deleted (data preserved for audit)
- ✅ Cannot be reactivated (terminal state)

**API Call:**

```bash
POST /api/v1/subscriptions/{id}/cancel
```

**Response:**

```json
{
  "message": "Subscription cancelled successfully",
  "status": "CANCELLED",
  "end_at": "2024-10-03T12:00:00Z",
  "updated_at": "2024-10-03T12:00:00Z"
}
```

**Business Rules:**

- ✅ Cancellation is immediate
- ✅ No refunds in system (handled externally)
- ✅ Tenant loses access immediately
- ✅ Data preserved for 90 days (configurable)

---

### UC-05: Renew Subscription

**Actor:** Customer (Self-Service), Admin  
**Trigger:** Subscription approaching expiry or expired  
**Preconditions:**
- Subscription exists
- Subscription is not cancelled

**Main Flow:**

1. User/Admin requests renewal with duration (months)

2. System retrieves current subscription

3. System calculates new end date:
   - If `end_at > NOW()`: Extend from `end_at`
   - If `end_at <= NOW()` or NULL: Extend from `NOW()`
   - New end date = base date + duration months

4. System updates subscription:
   - Sets `status = 'ACTIVE'`
   - Sets `end_at = new_end_date`
   - Increments `version`
   - Updates `updated_at`

5. System returns renewal confirmation

**Postconditions:**
- ✅ Subscription renewed
- ✅ Status set to ACTIVE
- ✅ End date extended
- ✅ Access restored (if expired)

**API Call:**

```bash
POST /api/v1/subscriptions/{id}/renew
{
  "duration": 12  // months
}
```

**Response:**

```json
{
  "message": "Subscription renewed successfully",
  "status": "ACTIVE",
  "end_at": "2026-01-01T00:00:00Z",
  "updated_at": "2024-10-03T12:00:00Z"
}
```

**Renewal Logic:**

```
Current: end_at = 2024-12-31, NOW = 2024-10-01
Renew 12 months:
  → Base = 2024-12-31 (not expired yet)
  → New end_at = 2025-12-31

Current: end_at = 2024-01-31, NOW = 2024-10-01
Renew 12 months:
  → Base = 2024-10-01 (already expired)
  → New end_at = 2025-10-01
```

---

## Access Control & Authorization

### UC-06: Check App Access Permission

**Actor:** Application API Gateway, Middleware  
**Trigger:** User attempts to access an app  
**Preconditions:**
- User belongs to a tenant
- App code is valid

**Main Flow:**

1. API Gateway receives request for app access

2. System extracts:
   - `tenant_id` from user session
   - `app_code` from request (e.g., "HRM_APP")

3. System queries database with GIN index:
   ```sql
   SELECT EXISTS(
     SELECT 1 FROM tenant_subscriptions
     WHERE tenant_id = $1
     AND $2 = ANY(granted_app_codes)  -- Uses GIN index!
     AND status = 'ACTIVE'
     AND deleted_at IS NULL
     AND (end_at IS NULL OR end_at > NOW())
   )
   ```

4. System returns TRUE/FALSE in < 1ms

5. API Gateway allows/denies access based on result

**Postconditions:**
- ✅ Access granted if tenant has active subscription with app
- ✅ Access denied otherwise
- ✅ Response time < 1ms (critical for performance)

**API Call:**

```bash
GET /api/v1/subscriptions/check-access?tenant_id=xxx&app_code=HRM_APP
```

**Response:**

```json
{
  "tenant_id": "01HN2K3M4P5Q6R7S8T9V0W1X3",
  "app_code": "HRM_APP",
  "has_access": true
}
```

**Performance:**

- ✅ GIN index on `granted_app_codes[]`
- ✅ Generated column (pre-computed)
- ✅ O(log n) lookup time
- ✅ < 1ms with millions of rows

---

### UC-07: List Tenant's Active Subscriptions

**Actor:** Admin, Customer Success, Customer  
**Trigger:** User views tenant subscriptions page  
**Preconditions:**
- Tenant exists
- User has permission to view

**Main Flow:**

1. User requests list of subscriptions for tenant

2. System queries with partial index:
   ```sql
   SELECT * FROM tenant_subscriptions
   WHERE tenant_id = $1
   AND status = 'ACTIVE'
   AND deleted_at IS NULL
   ORDER BY created_at DESC
   ```

3. System returns list of active subscriptions

**Postconditions:**
- ✅ All active subscriptions listed
- ✅ Sorted by creation date
- ✅ Fast query via partial index

**API Call:**

```bash
GET /api/v1/subscriptions?tenant_id=xxx&status=ACTIVE
```

---

### UC-08: Validate Entitlement Limits

**Actor:** Application, Background Job  
**Trigger:** User performs action subject to entitlement limits  
**Preconditions:**
- Subscription exists
- Entitlement limit defined

**Main Flow:**

1. Application receives user action (e.g., "Add User")

2. System retrieves subscription's `granted_entitlements`

3. System checks current usage against limit:
   ```json
   {
     "HRM_APP": {
       "max_users": 100,  // ← Limit
       "current_users": 87  // ← Current usage (from other table)
     }
   }
   ```

4. System allows/denies action:
   - Allow if `current_users < max_users`
   - Deny if `current_users >= max_users`

5. System returns validation result

**Postconditions:**
- ✅ Action allowed/denied based on entitlement
- ✅ User notified if limit reached

**Example:**

```typescript
const subscription = await getSubscription(tenantId);
const maxUsers = subscription.granted_entitlements.HRM_APP.max_users;
const currentUsers = await countUsers(tenantId);

if (currentUsers >= maxUsers) {
  throw new Error(`User limit reached (${maxUsers}). Upgrade plan to add more users.`);
}

// Proceed with adding user
```

---

## Billing & Analytics

### UC-09: Calculate Subscription Revenue

**Actor:** Finance Team, Reporting System  
**Trigger:** Monthly/quarterly revenue calculation  
**Preconditions:**
- Subscriptions exist

**Main Flow:**

1. Finance team requests revenue report for date range

2. System queries subscriptions:
   ```sql
   SELECT 
     SUM(price_amount) as total_revenue,
     currency_code,
     COUNT(*) as subscription_count,
     status
   FROM tenant_subscriptions
   WHERE created_at BETWEEN $start_date AND $end_date
   AND deleted_at IS NULL
   GROUP BY currency_code, status
   ```

3. System calculates:
   - Total revenue by currency
   - MRR (Monthly Recurring Revenue)
   - ARR (Annual Recurring Revenue)
   - Churn rate

4. System generates revenue report

**Postconditions:**
- ✅ Revenue calculated accurately
- ✅ Multi-currency support
- ✅ Breakdown by status

---

### UC-10: Find Expiring Subscriptions

**Actor:** Customer Success Team, Renewal System  
**Trigger:** Daily/weekly scheduled job  
**Preconditions:**
- Subscriptions with expiry dates exist

**Main Flow:**

1. System runs scheduled job to find expiring subscriptions

2. System queries with partial index:
   ```sql
   SELECT * FROM tenant_subscriptions
   WHERE status = 'ACTIVE'
   AND deleted_at IS NULL
   AND end_at BETWEEN NOW() AND NOW() + INTERVAL '30 days'
   ORDER BY end_at ASC
   ```

3. System generates renewal reminders:
   - 30 days before expiry
   - 7 days before expiry
   - 1 day before expiry

4. System sends notifications to tenants

**Postconditions:**
- ✅ Expiring subscriptions identified
- ✅ Renewal reminders sent
- ✅ Proactive customer retention

**API Call:**

```bash
GET /api/v1/subscriptions/expiring?days=30
```

**Response:**

```json
[
  {
    "_id": "...",
    "tenant_name": "ACME Corp",
    "package_name": "Enterprise Plan",
    "end_at": "2024-11-01T00:00:00Z",
    "days_remaining": 29,
    "price_amount": 1000000
  }
]
```

---

### UC-11: Generate Subscription Usage Report

**Actor:** Customer, Admin  
**Trigger:** User requests usage statistics  
**Preconditions:**
- Subscription exists

**Main Flow:**

1. User requests usage report for subscription

2. System retrieves subscription data

3. System calculates usage metrics:
   ```sql
   SELECT 
     EXTRACT(DAY FROM (NOW() - start_at))::int as days_active,
     EXTRACT(DAY FROM (end_at - NOW()))::int as days_remaining,
     granted_entitlements,
     price_amount as total_spent
   FROM tenant_subscriptions
   WHERE _id = $1
   ```

4. System generates usage report with:
   - Days active
   - Days remaining
   - Entitlements used vs. available
   - Total amount spent
   - Usage percentage

**Postconditions:**
- ✅ Usage report generated
- ✅ Helps customer understand utilization
- ✅ Identifies upsell opportunities

**API Call:**

```bash
GET /api/v1/subscriptions/{id}/usage
```

---

## Package Management

### UC-12: Upgrade Subscription Package

**Actor:** Customer (Self-Service), Sales Team  
**Trigger:** Customer wants to upgrade to higher tier  
**Preconditions:**
- Current subscription exists
- Target package is higher tier

**Main Flow:**

1. Customer selects upgrade to higher package

2. System calculates:
   - Pro-rated credit from current package
   - Price difference
   - New end date

3. System creates new subscription:
   - Cancel current subscription (`status = 'CANCELLED'`)
   - Create new subscription with:
     - New package
     - New price (snapshot)
     - New entitlements (snapshot)
     - Same or extended end date

4. System processes payment for difference

5. System grants new entitlements immediately

**Postconditions:**
- ✅ Old subscription cancelled
- ✅ New subscription active
- ✅ Tenant has new entitlements
- ✅ Payment recorded

**Example:**

```
Current: Starter Plan ($50/month, 10 users)
Upgrade: Pro Plan ($100/month, 50 users)

Pro-rated credit: $25 (15 days left)
New charge: $100 - $25 = $75
New entitlements: Immediate access to 50 users
```

---

### UC-13: Downgrade Subscription Package

**Actor:** Customer  
**Trigger:** Customer wants to reduce costs  
**Preconditions:**
- Current subscription exists
- Target package is lower tier
- Current usage fits within new limits

**Main Flow:**

1. Customer selects downgrade to lower package

2. System validates:
   - Current usage <= new package limits
   - Example: Current 87 users, new limit 50 users → ERROR

3. If valid:
   - Schedule downgrade for next renewal date
   - Create pending subscription change record

4. On renewal date:
   - Cancel current subscription
   - Create new subscription with lower package

**Postconditions:**
- ✅ Downgrade scheduled
- ✅ Customer notified
- ✅ Takes effect at renewal
- ✅ No mid-cycle disruption

**Business Rules:**

- ✅ Downgrades take effect at next renewal (not immediate)
- ✅ Validate current usage fits new limits
- ✅ No refunds for mid-cycle downgrades
- ✅ Customer keeps access until renewal

---

## Admin & Operations

### UC-14: Audit Subscription History

**Actor:** Compliance Team, Admin  
**Trigger:** Audit request or dispute  
**Preconditions:**
- Subscription exists

**Main Flow:**

1. Admin requests subscription history

2. System retrieves:
   - All subscription versions (via audit table)
   - Status change history
   - Price change history
   - Entitlement snapshots

3. System generates audit trail:
   ```
   2024-01-01: Created (ACTIVE, $1000)
   2024-06-01: Renewed (ACTIVE, $1000)
   2024-09-15: Status changed to PAST_DUE
   2024-09-20: Payment received, status changed to ACTIVE
   2024-10-01: Cancelled
   ```

4. System displays timeline view

**Postconditions:**
- ✅ Complete history available
- ✅ Immutable audit trail
- ✅ Compliance satisfied

---

### UC-15: Bulk Expire Subscriptions

**Actor:** System (Scheduled Job)  
**Trigger:** Daily cron job  
**Preconditions:**
- Subscriptions with `end_at < NOW()` exist

**Main Flow:**

1. Cron job runs daily at 00:00 UTC

2. System queries expired subscriptions:
   ```sql
   SELECT * FROM tenant_subscriptions
   WHERE status = 'ACTIVE'
   AND end_at < NOW()
   AND deleted_at IS NULL
   ```

3. For each subscription:
   - Update `status = 'EXPIRED'`
   - Increment `version`
   - Update `updated_at`

4. System generates expiry notifications

**Postconditions:**
- ✅ Expired subscriptions auto-updated
- ✅ Tenants notified
- ✅ Access revoked

---

### UC-16: Restore Cancelled Subscription

**Actor:** Admin (Exception Case)  
**Trigger:** Customer requests restoration, admin approval  
**Preconditions:**
- Subscription is CANCELLED
- Within restoration window (e.g., 30 days)
- Admin approval

**Main Flow:**

1. Admin reviews cancellation request

2. Admin initiates restoration

3. System validates:
   - `deleted_at < NOW() - 30 days` (within window)
   - Package still exists and active

4. System restores subscription:
   - Clear `deleted_at` (undelete)
   - Set `status = 'ACTIVE'`
   - Optionally extend `end_at`

5. System notifies tenant

**Postconditions:**
- ✅ Subscription restored
- ✅ Access granted again
- ✅ Audit trail updated

---

## Summary of Use Cases

| # | Use Case | Actor | Complexity | Performance |
|---|----------|-------|------------|-------------|
| 1 | Create Subscription | System/Sales | Medium | < 100ms |
| 2 | View Details | Admin/Customer | Low | < 10ms |
| 3 | Update Status | System/Admin | Low | < 10ms |
| 4 | Cancel Subscription | Customer/Admin | Medium | < 50ms |
| 5 | Renew Subscription | Customer/Admin | Medium | < 50ms |
| 6 | Check Access | API Gateway | Low | **< 1ms** |
| 7 | List Tenant Subs | Admin | Low | < 10ms |
| 8 | Validate Limits | Application | Low | < 10ms |
| 9 | Calculate Revenue | Finance | Medium | < 500ms |
| 10 | Find Expiring | System | Low | < 20ms |
| 11 | Usage Report | Customer | Medium | < 50ms |
| 12 | Upgrade Package | Customer/Sales | High | < 200ms |
| 13 | Downgrade Package | Customer | High | < 200ms |
| 14 | Audit History | Compliance | Medium | < 100ms |
| 15 | Bulk Expire | System (Cron) | Medium | 1000/sec |
| 16 | Restore Cancelled | Admin | Medium | < 50ms |

---

## Business Impact

### Revenue Protection
- ✅ Immutable price snapshots prevent revenue leakage
- ✅ Pro-rated calculations for upgrades/downgrades
- ✅ Automatic expiry detection

### Customer Experience
- ✅ Self-service renewal
- ✅ Instant access upon subscription
- ✅ Proactive expiry notifications
- ✅ Transparent usage reporting

### Operational Efficiency
- ✅ Automated expiry handling
- ✅ GIN index for < 1ms access checks
- ✅ Partial indexes for fast queries
- ✅ Complete audit trail

### Compliance
- ✅ Soft delete pattern (data retention)
- ✅ Version control (optimistic locking)
- ✅ Immutable snapshots (audit trail)
- ✅ Complete history tracking

---

**Use Cases Version:** 1.0.0  
**Total Use Cases:** 16  
**Coverage:** 100% of subscription lifecycle  
**Last Updated:** January 2024
