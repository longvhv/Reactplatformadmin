# Products Module - Complete Use Cases Documentation

## 📋 Overview

18 comprehensive use cases covering product management lifecycle in SaaS platform.

---

## UC-001: Create Product

**Actor:** Admin/Product Manager  
**Precondition:** User has product management permissions  
**Postcondition:** New product created and available

**Main Flow:**
1. User navigates to Products page
2. User clicks "Create Product"
3. System displays product creation form
4. User fills in required fields:
   - Tenant ID (auto-selected)
   - Product code (lowercase, numbers, hyphens)
   - Product name
   - Product type (APP/DOMAIN/SSL/SERVICE)
   - Base price
   - Currency (ISO 4217)
   - Description (optional)
5. System validates input data
6. System checks for duplicate code in tenant
7. System creates product with status ACTIVE
8. System returns product details

**API Call:**
```bash
POST /api/v1/products
{
  "tenant_id": "uuid",
  "code": "hrm-basic",
  "name": "HRM Basic Package",
  "product_type": "APP",
  "base_price": 500000,
  "currency": "VND",
  "description": "Basic HR management features"
}
```

**Business Rules:**
- BR-001: Code must be unique per tenant
- BR-002: Price cannot be negative
- BR-003: Currency must be 3 characters (ISO 4217)

---

## UC-002: List Products

**Actor:** Any authenticated user  
**Precondition:** User belongs to tenant  
**Postcondition:** Products list displayed

**Main Flow:**
1. User navigates to Products page
2. System loads products for user's tenant
3. User applies optional filters:
   - Product type
   - Active status
   - Search by name/code
4. System returns filtered products list
5. User sees paginated results (50 per page)

**API Call:**
```bash
GET /api/v1/products?tenant_id=uuid&product_type=APP&is_active=true&limit=50
```

---

## UC-003: View Product Details

**Actor:** Any authenticated user  
**Precondition:** Product exists  
**Postcondition:** Product details displayed with statistics

**Main Flow:**
1. User clicks on product from list
2. System fetches product details
3. System loads product statistics:
   - Packages count (total & active)
   - Subscriptions count (total & active)
   - Revenue data (total & monthly)
4. System displays 4 tabs:
   - Overview (basic info)
   - Statistics (metrics)
   - Packages (related packages)
   - Revenue (financial data)

**API Calls:**
```bash
GET /api/v1/products/{id}
GET /api/v1/products/{id}/stats
GET /api/v1/products/{id}/packages
GET /api/v1/products/{id}/revenue?months=6
```

---

## UC-004: Update Product

**Actor:** Admin/Product Manager  
**Precondition:** Product exists, user has permissions  
**Postcondition:** Product updated, version incremented

**Main Flow:**
1. User opens product detail page
2. User clicks "Edit"
3. System displays editable form
4. User modifies fields:
   - Name
   - Description
   - Base price
   - Currency
5. System validates changes
6. System increments version number
7. System updates updated_at timestamp
8. System returns success

**API Call:**
```bash
PATCH /api/v1/products/{id}
{
  "name": "HRM Pro Package (Updated)",
  "base_price": 750000,
  "description": "Enhanced HR features"
}
```

**Alternative Flows:**
- A1: Concurrent update detected → Return 409 Conflict
- A2: Invalid data → Return 400 Bad Request

**Business Rules:**
- BR-004: Version increments on each update
- BR-005: product_type cannot be changed
- BR-006: Code cannot be changed (immutable)

---

## UC-005: Toggle Product Status

**Actor:** Admin  
**Precondition:** Product exists  
**Postcondition:** Product status changed

**Main Flow:**
1. User opens product detail page
2. User clicks "Activate" or "Deactivate"
3. System prompts for confirmation
4. User confirms action
5. System updates is_active field
6. System increments version
7. If deactivated:
   - System checks for active packages
   - System warns if packages exist
8. System returns updated status

**API Call:**
```bash
PATCH /api/v1/products/{id}/status
{
  "is_active": false
}
```

**Business Rules:**
- BR-007: Deactivated products hide from new package creation
- BR-008: Existing packages/subscriptions unaffected
- BR-009: Can be reactivated anytime

---

## UC-006: Delete Product (Soft Delete)

**Actor:** Admin  
**Precondition:** User has delete permissions  
**Postcondition:** Product soft deleted

**Main Flow:**
1. User opens product detail page
2. User clicks "Delete" from dropdown
3. System checks for dependencies:
   - Active packages
   - Active subscriptions
4. System displays warning dialog
5. User confirms deletion
6. System sets deleted_at = NOW()
7. System redirects to products list

**API Call:**
```bash
DELETE /api/v1/products/{id}
```

**Alternative Flows:**
- A1: Active dependencies exist → Show warning, require force delete
- A2: User cancels → No action taken

**Business Rules:**
- BR-010: Soft delete preserves data for 90 days
- BR-011: Deleted products excluded from queries
- BR-012: Can be recovered within 90 days

---

## UC-007: Duplicate Product

**Actor:** Admin/Product Manager  
**Precondition:** Source product exists  
**Postcondition:** New product created as copy

**Main Flow:**
1. User opens product detail page
2. User clicks "Duplicate" from dropdown
3. System prompts for new code and name
4. User enters:
   - New product code
   - New product name
5. System validates uniqueness
6. System copies all fields from source:
   - Product type
   - Description
   - Base price
   - Currency
   - Metadata
7. System creates new product with new ID
8. System redirects to new product page

**API Call:**
```bash
POST /api/v1/products/{id}/duplicate
{
  "code": "hrm-basic-copy",
  "name": "HRM Basic (Copy)"
}
```

**Use Case:** Quick product variant creation

---

## UC-008: View Product Statistics

**Actor:** Any authenticated user  
**Precondition:** Product exists  
**Postcondition:** Comprehensive statistics displayed

**Main Flow:**
1. User opens product detail page
2. User clicks "Statistics" tab
3. System fetches and displays:
   - **Packages Metrics:**
     - Total packages
     - Active packages
   - **Subscription Metrics:**
     - Total subscriptions
     - Active subscriptions
   - **Revenue Metrics:**
     - Total revenue
     - Monthly revenue
4. System presents data in cards layout

**API Call:**
```bash
GET /api/v1/products/{id}/stats
```

**Response Example:**
```json
{
  "product_id": "uuid",
  "code": "hrm-basic",
  "packages_count": 5,
  "active_packages": 4,
  "subscriptions_count": 150,
  "active_subscriptions": 142,
  "total_revenue": 75000000,
  "monthly_revenue": 6250000
}
```

---

## UC-009: View Product Packages

**Actor:** Any authenticated user  
**Precondition:** Product exists  
**Postcondition:** Related packages list displayed

**Main Flow:**
1. User opens product detail page
2. User clicks "Packages" tab
3. System fetches all packages using this product
4. System displays table with columns:
   - Package name & code
   - Billing cycle
   - Price
   - Active status
   - Subscribers count
   - Created date
5. User can click package to view details

**API Call:**
```bash
GET /api/v1/products/{id}/packages
```

**Business Value:** Understand product utilization

---

## UC-010: View Product Revenue

**Actor:** Admin/Finance  
**Precondition:** Product has subscriptions  
**Postcondition:** Revenue analytics displayed

**Main Flow:**
1. User opens product detail page
2. User clicks "Revenue" tab
3. User selects time range (3/6/12 months)
4. System fetches revenue data:
   - Monthly revenue
   - Subscription count per month
   - New subscribers per month
5. System displays:
   - Summary cards (totals)
   - Bar chart (visual)
   - Detailed table (breakdown)

**API Call:**
```bash
GET /api/v1/products/{id}/revenue?months=6
```

**Response Example:**
```json
[
  {
    "month": "2024-01",
    "revenue": 12500000,
    "subscriptions": 25,
    "new_subscribers": 5
  },
  ...
]
```

---

## UC-011: Search Products

**Actor:** Any authenticated user  
**Precondition:** None  
**Postcondition:** Filtered products displayed

**Main Flow:**
1. User enters search query
2. System searches in:
   - Product name (case-insensitive)
   - Product code (case-insensitive)
3. System returns matching products
4. User sees results highlighted

**Query Pattern:**
```sql
WHERE (LOWER(name) LIKE '%query%' OR LOWER(code) LIKE '%query%')
```

---

## UC-012: Filter Products by Type

**Actor:** Any authenticated user  
**Precondition:** None  
**Postcondition:** Filtered products displayed

**Main Flow:**
1. User selects product type from dropdown:
   - APP (Applications)
   - DOMAIN (Domain names)
   - SSL (SSL Certificates)
   - SERVICE (Professional services)
2. System filters products list
3. User sees only selected type

**Business Value:** Organize product catalog

---

## UC-013: Update Product Metadata

**Actor:** Admin  
**Precondition:** Product exists  
**Postcondition:** Metadata updated without version increment

**Main Flow:**
1. User opens product edit form
2. User expands "Advanced Settings"
3. User edits JSON metadata
4. System validates JSON syntax
5. System updates metadata field
6. System does NOT increment version

**API Call:**
```bash
PATCH /api/v1/products/{id}
{
  "metadata": {
    "features": ["feature1", "feature2"],
    "max_users": 100
  }
}
```

**Business Rules:**
- BR-013: Metadata changes are non-breaking
- BR-014: Metadata flexible for extensibility

---

## UC-014: Export Products List

**Actor:** Admin  
**Precondition:** Products exist  
**Postcondition:** CSV file downloaded

**Main Flow:**
1. User clicks "Export" button
2. System fetches all products (no pagination)
3. System generates CSV with columns:
   - Code, Name, Type, Base Price, Currency, Status
4. System downloads file: `products-{date}.csv`

**Business Value:** Backup, analysis, reporting

---

## UC-015: Bulk Update Prices

**Actor:** Admin  
**Precondition:** Multiple products selected  
**Postcondition:** Prices updated for all

**Main Flow:**
1. User selects products (checkboxes)
2. User clicks "Bulk Actions" → "Update Prices"
3. System prompts for:
   - Adjustment type (percentage/fixed)
   - Adjustment value
4. User confirms action
5. System updates each product:
   - Calculates new price
   - Increments version
   - Updates updated_at
6. System shows summary

**Business Value:** Seasonal pricing, promotions

---

## UC-016: Product Lifecycle Management

**States:** ACTIVE → INACTIVE → DELETED

**Transitions:**
```
[ACTIVE] ──toggle──> [INACTIVE]
[INACTIVE] ──toggle──> [ACTIVE]
[ACTIVE] ──delete──> [DELETED]
[INACTIVE] ──delete──> [DELETED]
[DELETED] ──recover (90 days)──> [INACTIVE]
```

**Business Rules:**
- BR-015: New products start as ACTIVE
- BR-016: INACTIVE products hidden from catalog
- BR-017: DELETED products auto-purged after 90 days

---

## UC-017: Validate Product Code

**Actor:** System  
**Precondition:** User enters product code  
**Postcondition:** Validation feedback displayed

**Validation Rules:**
1. **Format:** `^[a-z0-9-]+$`
   - Only lowercase letters
   - Numbers allowed
   - Hyphens allowed
   - No spaces, underscores, or special chars
2. **Length:** 1-50 characters
3. **Uniqueness:** Within tenant scope
4. **Reserved:** Cannot use system-reserved codes

**Examples:**
- ✅ Valid: `hrm-basic`, `office-365`, `ssl-wildcard`
- ❌ Invalid: `HRM_Basic`, `Office 365`, `ssl.wildcard`

---

## UC-018: Product Analytics Dashboard

**Actor:** Admin/Manager  
**Precondition:** Products exist  
**Postcondition:** Analytics displayed

**Main Flow:**
1. User opens Analytics page
2. System calculates metrics:
   - **By Type:**
     - Total products per type
     - Average price per type
     - Total value per type
   - **By Status:**
     - Active vs Inactive count
   - **Revenue:**
     - Top 10 products by revenue
     - Revenue trend over time
3. System displays charts and tables

**Business Value:** Strategic decision making

---

## Summary

**Total Use Cases:** 18  
**Categories:**
- Product Management: 7
- Analytics & Reporting: 5
- Bulk Operations: 2
- System Operations: 4

**Business Rules Defined:** 17  
**API Endpoints Coverage:** 10/10 ✅

---

**Status:** ✅ Production Ready  
**Last Updated:** January 2024
