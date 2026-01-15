# Service Packages Module - Complete Use Cases Documentation

## 📋 Overview

16 comprehensive use cases covering service package management lifecycle in SaaS platform.

---

## UC-001: Create Service Package

**Actor:** Admin/Product Manager  
**Precondition:** Product exists, user has permissions  
**Postcondition:** New package created and available

**Main Flow:**
1. User navigates to Packages page
2. User clicks "Create Package"
3. System displays package creation form
4. User fills required fields:
   - Product ID (dropdown selection)
   - Package code (lowercase, numbers, hyphens)
   - Package name
   - Billing cycle (MONTHLY/QUARTERLY/YEARLY/LIFETIME)
   - Price
   - Currency (ISO 4217)
   - Entitlements config (JSON editor)
   - Public status (checkbox)
5. System validates input data
6. System checks for duplicate code
7. System verifies product exists and is active
8. System creates package with status ACTIVE
9. System returns package details

**API Call:**
```bash
POST /api/v1/packages
{
  "product_id": "uuid",
  "code": "hrm-basic-monthly",
  "name": "HRM Basic - Monthly",
  "billing_cycle": "MONTHLY",
  "price": 500000,
  "currency": "VND",
  "entitlements_config": {
    "features": {"recruitment": true},
    "limits": {"max_users": 50}
  }
}
```

**Business Rules:**
- BR-001: Code must be globally unique
- BR-002: Product must exist and be active
- BR-003: Price cannot be negative

---

## UC-002: List Service Packages

**Actor:** Any authenticated user  
**Precondition:** None  
**Postcondition:** Packages list displayed

**Main Flow:**
1. User navigates to Packages page
2. System loads all packages
3. User applies optional filters:
   - Product
   - Billing cycle
   - Active status
   - Public status
   - Search by name/code
4. System returns filtered packages list
5. User sees paginated results (50 per page)

**API Call:**
```bash
GET /api/v1/packages?product_id=uuid&billing_cycle=MONTHLY&is_active=true&limit=50
```

---

## UC-003: View Package Details

**Actor:** Any authenticated user  
**Precondition:** Package exists  
**Postcondition:** Package details displayed with statistics

**Main Flow:**
1. User clicks on package from list
2. System fetches package details
3. System loads package statistics:
   - Total subscribers
   - Active subscribers
   - Total revenue
   - Monthly revenue
   - Churn rate
4. System displays 4 tabs:
   - Overview (basic info + entitlements)
   - Statistics (metrics)
   - Subscribers (customer list)
   - Revenue (financial data)

**API Calls:**
```bash
GET /api/v1/packages/{id}
GET /api/v1/packages/{id}/stats
GET /api/v1/packages/{id}/subscribers
GET /api/v1/packages/{id}/revenue?months=6
```

---

## UC-004: Update Service Package

**Actor:** Admin/Product Manager  
**Precondition:** Package exists, user has permissions  
**Postcondition:** Package updated, version incremented

**Main Flow:**
1. User opens package detail page
2. User clicks "Edit"
3. System displays editable form
4. User modifies fields:
   - Name
   - Description
   - Billing cycle (if no subscribers)
   - Price
   - Currency
   - Entitlements
5. System validates changes
6. System checks for active subscribers
7. If price changed → Warn about existing subscribers
8. System increments version number
9. System updates updated_at timestamp
10. System returns success

**API Call:**
```bash
PATCH /api/v1/packages/{id}
{
  "name": "HRM Basic - Monthly (Updated)",
  "price": 600000,
  "entitlements_config": {...}
}
```

**Alternative Flows:**
- A1: Has active subscribers + price change → Show warning
- A2: Billing cycle change with subscribers → Block update

**Business Rules:**
- BR-004: Version increments on each update
- BR-005: Price changes don't affect existing subscriptions
- BR-006: Billing cycle locked if subscribers exist

---

## UC-005: Toggle Package Status

**Actor:** Admin  
**Precondition:** Package exists  
**Postcondition:** Package status changed

**Main Flow:**
1. User opens package detail page
2. User clicks "Activate" or "Deactivate"
3. System prompts for confirmation
4. User confirms action
5. System updates is_active field
6. System increments version
7. If deactivated:
   - System checks for active subscribers
   - System warns about impact
8. System returns updated status

**API Call:**
```bash
PATCH /api/v1/packages/{id}/status
{
  "is_active": false
}
```

**Business Rules:**
- BR-007: Deactivated packages hide from pricing page
- BR-008: Existing subscriptions unaffected
- BR-009: Can be reactivated anytime

---

## UC-006: Delete Package (Soft Delete)

**Actor:** Admin  
**Precondition:** User has delete permissions  
**Postcondition:** Package soft deleted

**Main Flow:**
1. User opens package detail page
2. User clicks "Delete" from dropdown
3. System checks for dependencies:
   - Active subscriptions
   - Revenue history
4. System displays warning dialog
5. User confirms deletion
6. System sets deleted_at = NOW()
7. System redirects to packages list

**API Call:**
```bash
DELETE /api/v1/packages/{id}
```

**Alternative Flows:**
- A1: Active subscriptions exist → Show warning, require force delete
- A2: User cancels → No action taken

**Business Rules:**
- BR-010: Soft delete preserves data for 90 days
- BR-011: Deleted packages excluded from queries
- BR-012: Subscriptions remain valid after package deleted

---

## UC-007: Duplicate Package

**Actor:** Admin/Product Manager  
**Precondition:** Source package exists  
**Postcondition:** New package created as copy

**Main Flow:**
1. User opens package detail page
2. User clicks "Duplicate" from dropdown
3. System prompts for new code and name
4. User enters:
   - New package code
   - New package name
5. System validates uniqueness
6. System copies all fields from source:
   - Product ID
   - Billing cycle
   - Description
   - Price
   - Currency
   - Entitlements
7. System creates new package with new ID
8. System redirects to new package page

**API Call:**
```bash
POST /api/v1/packages/{id}/duplicate
{
  "code": "hrm-basic-monthly-copy",
  "name": "HRM Basic - Monthly (Copy)"
}
```

**Use Case:** Quick package variant creation

---

## UC-008: View Package Statistics

**Actor:** Any authenticated user  
**Precondition:** Package exists  
**Postcondition:** Comprehensive statistics displayed

**Main Flow:**
1. User opens package detail page
2. User clicks "Statistics" tab
3. System fetches and displays:
   - **Subscriber Metrics:**
     - Total subscribers
     - Active subscribers
   - **Revenue Metrics:**
     - Total revenue
     - Monthly revenue
   - **Health Metrics:**
     - Churn rate (percentage)
4. System presents data in cards layout

**API Call:**
```bash
GET /api/v1/packages/{id}/stats
```

**Response Example:**
```json
{
  "package_id": "uuid",
  "code": "hrm-basic-monthly",
  "total_subscribers": 150,
  "active_subscribers": 142,
  "total_revenue": 75000000,
  "monthly_revenue": 6250000,
  "churn_rate": 5.3
}
```

---

## UC-009: View Package Subscribers

**Actor:** Any authenticated user  
**Precondition:** Package exists  
**Postcondition:** Subscribers list displayed

**Main Flow:**
1. User opens package detail page
2. User clicks "Subscribers" tab
3. User optionally filters by status:
   - ACTIVE
   - EXPIRED
   - CANCELLED
   - PAST_DUE
4. System fetches all subscribers of this package
5. System displays table with columns:
   - Tenant name & ID
   - Subscription status
   - Start date
   - End date
   - Price paid
6. User can click tenant to view details

**API Call:**
```bash
GET /api/v1/packages/{id}/subscribers?status=ACTIVE
```

**Business Value:** Understand customer base

---

## UC-010: View Package Revenue

**Actor:** Admin/Finance  
**Precondition:** Package has subscriptions  
**Postcondition:** Revenue analytics displayed

**Main Flow:**
1. User opens package detail page
2. User clicks "Revenue" tab
3. User selects time range (3/6/12 months)
4. System fetches revenue data:
   - Monthly revenue
   - Subscription count per month
   - New subscribers per month
   - Churned subscribers per month
5. System displays:
   - Summary cards (totals)
   - Bar chart (visual)
   - Detailed table (breakdown)

**API Call:**
```bash
GET /api/v1/packages/{id}/revenue?months=6
```

**Response Example:**
```json
[
  {
    "month": "2024-01",
    "revenue": 12500000,
    "subscriptions": 25,
    "new_subscribers": 5,
    "churned": 2
  }
]
```

---

## UC-011: Search Packages

**Actor:** Any authenticated user  
**Precondition:** None  
**Postcondition:** Filtered packages displayed

**Main Flow:**
1. User enters search query
2. System searches in:
   - Package name (case-insensitive)
   - Package code (case-insensitive)
3. System returns matching packages
4. User sees results highlighted

**Query Pattern:**
```sql
WHERE (LOWER(name) LIKE '%query%' OR LOWER(code) LIKE '%query%')
```

---

## UC-012: Filter Packages by Billing Cycle

**Actor:** Any authenticated user  
**Precondition:** None  
**Postcondition:** Filtered packages displayed

**Main Flow:**
1. User selects billing cycle from dropdown:
   - MONTHLY
   - QUARTERLY
   - YEARLY
   - LIFETIME
2. System filters packages list
3. User sees only selected cycle

**Business Value:** Organize pricing tiers

---

## UC-013: Update Entitlements Config

**Actor:** Admin  
**Precondition:** Package exists  
**Postcondition:** Entitlements updated

**Main Flow:**
1. User opens package edit form
2. User expands "Entitlements" section
3. User edits JSON configuration
4. System validates JSON syntax
5. System validates schema (optional)
6. System updates entitlements_config field
7. System increments version

**API Call:**
```bash
PATCH /api/v1/packages/{id}
{
  "entitlements_config": {
    "features": {"crm": true, "hrm": true},
    "limits": {"max_users": 100}
  }
}
```

**Business Rules:**
- BR-013: Entitlements changes require version bump
- BR-014: Existing subscriptions snapshot entitlements

---

## UC-014: Toggle Public Status

**Actor:** Admin  
**Precondition:** Package exists  
**Postcondition:** Public status changed

**Main Flow:**
1. User opens package detail page
2. User toggles "Public" switch
3. System prompts for confirmation
4. User confirms action
5. System updates is_public field
6. System increments version
7. If made public:
   - Package appears on pricing page
8. If made private:
   - Package hidden from public view
   - Existing subscribers unaffected

**Business Rules:**
- BR-015: Private packages for special deals
- BR-016: Public packages shown on pricing page

---

## UC-015: Compare Packages

**Actor:** Customer/Admin  
**Precondition:** Multiple packages exist  
**Postcondition:** Comparison view displayed

**Main Flow:**
1. User selects 2-4 packages to compare
2. System fetches package details
3. System displays side-by-side comparison:
   - Price
   - Billing cycle
   - Features (from entitlements)
   - Limits
4. User can make informed decision

**Business Value:** Help customers choose right package

---

## UC-016: Package Pricing Strategy

**Billing Cycle Discounts:**

```typescript
// Standard pricing patterns
const calculatePrice = (basePrice: number, cycle: string) => {
  const strategies = {
    MONTHLY: basePrice,
    QUARTERLY: basePrice * 3 * 0.95,  // 5% discount
    YEARLY: basePrice * 12 * 0.85,    // 15% discount
    LIFETIME: basePrice * 120         // 10 years upfront
  };
  return strategies[cycle];
};
```

**Example:**
```
Base Price: 1,000,000 VND/month

MONTHLY:   1,000,000 VND/month
QUARTERLY: 2,850,000 VND/3 months (950,000/month - save 5%)
YEARLY:    10,200,000 VND/year (850,000/month - save 15%)
LIFETIME:  120,000,000 VND (one-time payment)
```

---

## Summary

**Total Use Cases:** 16  
**Categories:**
- Package Management: 7
- Analytics & Reporting: 4
- Customer Management: 2
- Pricing Strategy: 3

**Business Rules Defined:** 16  
**API Endpoints Coverage:** 10/10 ✅

---

**Status:** ✅ Production Ready  
**Last Updated:** January 2024
