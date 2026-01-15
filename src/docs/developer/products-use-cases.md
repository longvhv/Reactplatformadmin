# Products - Use Cases Documentation

**Module:** Products (SaaS Products)  
**Version:** 1.0.0  
**Last Updated:** 2026-01-14

---

## Table of Contents

- [Overview](#overview)
- [Actor Definitions](#actor-definitions)
- [Use Case List](#use-case-list)
- [Detailed Use Cases](#detailed-use-cases)
- [User Journeys](#user-journeys)
- [Business Rules](#business-rules)

---

## Overview

Document này mô tả các use cases của Products module, covering admin operations, customer interactions, và integration scenarios.

### Scope

- ✅ Product Management (CRUD)
- ✅ Product Discovery & Search
- ✅ Product Pricing Management
- ✅ Product Categorization
- ✅ Statistics & Reporting

---

## Actor Definitions

### 1. System Administrator (Admin)

**Role:** Quản trị viên hệ thống  
**Permissions:** Full CRUD access  
**Responsibilities:**
- Tạo, sửa, xóa products
- Quản lý giá và metadata
- Xem reports và statistics

### 2. Customer (End User)

**Role:** Khách hàng cuối  
**Permissions:** Read-only access  
**Responsibilities:**
- Browse và search products
- Xem thông tin chi tiết product
- So sánh products và packages

### 3. API Consumer (Integration)

**Role:** Hệ thống bên ngoài tích hợp  
**Permissions:** API-based access  
**Responsibilities:**
- Sync product data
- Webhook notifications
- Automated workflows

---

## Use Case List

### Admin Use Cases

| ID | Use Case | Priority | Status |
|----|----------|----------|--------|
| UC-P01 | Create New Product | HIGH | ✅ Implemented |
| UC-P02 | Update Product Information | HIGH | ✅ Implemented |
| UC-P03 | Delete Product (Soft Delete) | MEDIUM | ✅ Implemented |
| UC-P04 | Restore Deleted Product | LOW | 🔄 Planned |
| UC-P05 | View Product Statistics | MEDIUM | ✅ Implemented |
| UC-P06 | Bulk Update Products | LOW | 🔄 Planned |
| UC-P07 | Duplicate Product | MEDIUM | 🔄 Planned |
| UC-P08 | Manage Product Metadata | HIGH | ✅ Implemented |

### Customer Use Cases

| ID | Use Case | Priority | Status |
|----|----------|----------|--------|
| UC-P11 | Browse Products by Type | HIGH | ✅ Implemented |
| UC-P12 | Search Products | HIGH | ✅ Implemented |
| UC-P13 | View Product Details | HIGH | ✅ Implemented |
| UC-P14 | Filter Products | MEDIUM | ✅ Implemented |
| UC-P15 | Compare Products | LOW | 🔄 Planned |
| UC-P16 | Add Product to Cart | MEDIUM | 🔄 Planned |

### Integration Use Cases

| ID | Use Case | Priority | Status |
|----|----------|----------|--------|
| UC-P21 | Sync Products via API | HIGH | ✅ Implemented |
| UC-P22 | Receive Webhook Notifications | MEDIUM | 🔄 Planned |
| UC-P23 | Export Products to CSV | LOW | 🔄 Planned |
| UC-P24 | Import Products from CSV | LOW | 🔄 Planned |

---

## Detailed Use Cases

### UC-P01: Create New Product

**Actor:** System Administrator  
**Goal:** Tạo sản phẩm mới trong hệ thống  
**Preconditions:** Admin đã đăng nhập với quyền product.create

#### Main Flow

1. Admin truy cập vào Products management page
2. Click button "Add Product"
3. Điền form với thông tin bắt buộc:
   - Product Code (unique, lowercase)
   - Product Name
   - Product Type (APP/DOMAIN/SSL/SERVICE)
   - Base Price
   - Currency
4. (Optional) Điền description và metadata
5. Click "Save"
6. System validates input:
   - Check code format (^[a-z0-9-]+$)
   - Check code uniqueness
   - Check price >= 0
   - Check currency length = 3
7. System generates UUID v7 for _id
8. System saves product to database
9. System returns success message với product details
10. UI chuyển đến product detail page

#### Alternative Flows

**3a. Code Already Exists:**
- System shows error: "Product code already exists"
- Admin phải nhập code khác

**3b. Invalid Code Format:**
- System shows error: "Code must be lowercase alphanumeric with hyphens only"
- Admin corrects format

**6a. Validation Fails:**
- System highlights error fields
- Shows specific validation messages
- Admin corrects và retry

#### Postconditions

- ✅ Product được tạo trong database
- ✅ Version = 1
- ✅ is_active = true by default
- ✅ created_at và updated_at được set
- ✅ Audit log được ghi nhận

#### Business Rules

- Code MUST be unique across all products
- Code format: ^[a-z0-9-]+$ (lowercase, hyphens only)
- Base price >= 0
- Currency MUST be 3-character ISO code
- Product type MUST be in (APP, DOMAIN, SSL, SERVICE)

#### API Call

```http
POST /api/v1/saas-products
Content-Type: application/json

{
  "code": "crm-enterprise",
  "name": "CRM Enterprise",
  "product_type": "APP",
  "base_price": 999000.0000,
  "currency": "VND",
  "description": "Enterprise CRM solution",
  "metadata": {
    "features": ["all_features"],
    "is_featured": true
  }
}
```

---

### UC-P02: Update Product Information

**Actor:** System Administrator  
**Goal:** Cập nhật thông tin sản phẩm hiện có  
**Preconditions:** 
- Admin đã đăng nhập với quyền product.update
- Product tồn tại và chưa bị xóa

#### Main Flow

1. Admin truy cập product detail page
2. Click "Edit" button
3. System loads current product data (including version)
4. Admin modifies fields (name, price, description, metadata, etc.)
5. Click "Save"
6. System gửi PATCH request với version hiện tại
7. Backend validates version (optimistic locking)
8. Backend updates product:
   - Increment version by 1
   - Update updated_at timestamp
   - Save changes
9. System returns updated product
10. UI displays success message
11. UI refreshes với data mới

#### Alternative Flows

**7a. Version Conflict:**
- Backend detects version mismatch
- Returns 409 Conflict
- UI shows error: "Product was modified by another user. Please refresh."
- Admin refreshes page
- Admin re-applies changes

**7b. Validation Fails:**
- Backend validates updated data
- Returns 400 Bad Request with errors
- UI highlights error fields
- Admin corrects và retry

#### Postconditions

- ✅ Product data được update
- ✅ Version tăng lên 1
- ✅ updated_at được refresh
- ✅ Audit log ghi nhận thay đổi

#### Business Rules

- MUST provide current version for optimistic locking
- Code CANNOT be changed after creation (recommended)
- Price changes should trigger pricing history log
- Metadata updates are merged (not replaced)

#### API Call

```http
PATCH /api/v1/saas-products/01940d7e-xxxx
Content-Type: application/json

{
  "name": "CRM Enterprise Plus",
  "base_price": 1299000.0000,
  "metadata": {
    "features": ["all_features", "ai_assistant"],
    "is_featured": true
  },
  "version": 1
}
```

---

### UC-P03: Delete Product (Soft Delete)

**Actor:** System Administrator  
**Goal:** Xóa mềm sản phẩm khỏi hệ thống  
**Preconditions:**
- Admin đã đăng nhập với quyền product.delete
- Product tồn tại và chưa bị xóa
- Product không có active subscriptions (optional check)

#### Main Flow

1. Admin truy cập product detail page
2. Click "Delete" button
3. System shows confirmation dialog:
   - "Are you sure you want to delete {product_name}?"
   - "This action can be undone by restoring the product."
4. Admin confirms deletion
5. System sends DELETE request
6. Backend performs soft delete:
   - Set deleted_at = NOW()
   - Keep all data intact
7. System returns success
8. UI shows success message
9. UI redirects to products list
10. Deleted product không còn hiển thị trong list

#### Alternative Flows

**6a. Product Has Active Subscriptions:**
- Backend checks for active subscriptions
- Returns 409 Conflict
- UI shows error: "Cannot delete product with active subscriptions"
- Admin must deactivate or transfer subscriptions first

**6b. Product Already Deleted:**
- Backend returns 404 Not Found
- UI shows error: "Product not found or already deleted"

#### Postconditions

- ✅ deleted_at được set = NOW()
- ✅ Product vẫn tồn tại trong database
- ✅ Queries filter WHERE deleted_at IS NULL
- ✅ Có thể restore về sau
- ✅ Audit log ghi nhận deletion

#### Business Rules

- Soft delete only (never hard delete)
- Can be restored by setting deleted_at = NULL
- Deleted products không hiển thị trong customer-facing pages
- Admin có thể view deleted products trong admin panel

#### API Call

```http
DELETE /api/v1/saas-products/01940d7e-xxxx
Authorization: Bearer {token}
```

---

### UC-P05: View Product Statistics

**Actor:** System Administrator  
**Goal:** Xem thống kê tổng quan về products  
**Preconditions:** Admin đã đăng nhập

#### Main Flow

1. Admin truy cập Products dashboard
2. System loads statistics:
   - Total products
   - Active products
   - Inactive products  
   - Archived products
   - Total revenue potential
3. System displays charts:
   - Products by type (pie chart)
   - Price distribution (histogram)
   - Featured vs Non-featured
4. Admin có thể filter by date range, type, etc.
5. Admin có thể export statistics to PDF/CSV

#### API Call

```http
GET /api/v1/saas-products/statistics
Authorization: Bearer {token}
```

#### Response

```json
{
  "data": {
    "total": 8,
    "active": 7,
    "inactive": 1,
    "archived": 0,
    "total_revenue": 2847000.0000
  }
}
```

---

### UC-P11: Browse Products by Type

**Actor:** Customer  
**Goal:** Xem danh sách products theo loại (APP, DOMAIN, etc.)  
**Preconditions:** Customer truy cập public products page

#### Main Flow

1. Customer truy cập vào Products page
2. System hiển thị filter tabs:
   - All Products
   - APPs
   - Domains
   - SSL Certificates
   - Services
3. Customer click vào tab "APPs"
4. System sends request:
   ```
   GET /api/v1/saas-products?product_type=APP&is_active=true
   ```
5. System returns list of APP products
6. UI displays products in grid/list view
7. Each product card shows:
   - Name, description
   - Base price
   - Featured badge (if applicable)
   - "View Details" button
8. Customer có thể sort by:
   - Price (low to high, high to low)
   - Popularity
   - Newest first

#### Postconditions

- ✅ Customer xem được products filtered by type
- ✅ Only active products được hiển thị
- ✅ Deleted products không hiển thị

---

### UC-P12: Search Products

**Actor:** Customer  
**Goal:** Tìm kiếm products bằng keywords  
**Preconditions:** Customer truy cập products page

#### Main Flow

1. Customer nhập keyword vào search box: "CRM"
2. System gửi search request (debounced 300ms):
   ```
   GET /api/v1/saas-products?search=CRM&is_active=true
   ```
3. Backend searches in:
   - product.name (ILIKE)
   - product.description (ILIKE)
   - product.code (ILIKE)
4. System returns matching products
5. UI highlights search keywords trong results
6. UI shows result count: "Found 3 products matching 'CRM'"
7. Customer có thể refine search với filters

#### Search Features

- ✅ Full-text search
- ✅ Case-insensitive
- ✅ Debounced input (300ms)
- ✅ Search across name, description, code
- ✅ Highlight matching keywords

---

### UC-P13: View Product Details

**Actor:** Customer  
**Goal:** Xem thông tin chi tiết của product  
**Preconditions:** Customer browsing products

#### Main Flow

1. Customer click vào product card/name
2. System navigates to `/core/products/{id}`
3. System loads product details:
   ```
   GET /api/v1/saas-products/{id}
   ```
4. UI displays comprehensive info:
   - Name, description
   - Product type badge
   - Base price
   - Currency
   - Features list (from metadata)
   - Limits/quotas (from metadata)
5. UI shows related packages (if any)
6. UI shows "Add to Cart" or "Subscribe Now" button
7. Customer có thể:
   - View packages
   - Compare with other products
   - Share product link

---

## User Journeys

### Journey 1: Admin Creates New Product Line

```
1. Admin Login
   ↓
2. Navigate to Products
   ↓
3. Click "Add Product"
   ↓
4. Fill Product Info:
   - Code: crm-professional
   - Name: CRM Professional
   - Type: APP
   - Price: 299000 VND
   ↓
5. Add Metadata:
   - Features: ["automation", "reports"]
   - Max Users: 50
   ↓
6. Save Product
   ↓
7. Create Service Packages:
   - Monthly Package
   - Yearly Package (discounted)
   ↓
8. Publish Product
```

### Journey 2: Customer Finds and Purchases Product

```
1. Customer Visits Products Page
   ↓
2. Browse APP Products
   ↓
3. Use Search: "CRM"
   ↓
4. View "CRM Professional" Details
   ↓
5. Compare with "CRM Basic"
   ↓
6. Select "CRM Professional - Yearly"
   ↓
7. Add to Cart
   ↓
8. Proceed to Checkout
   ↓
9. Complete Payment
   ↓
10. Subscription Activated
```

### Journey 3: Admin Updates Pricing

```
1. Admin Reviews Product Stats
   ↓
2. Identifies Underperforming Product
   ↓
3. Navigate to Product Detail
   ↓
4. Click "Edit"
   ↓
5. Update Base Price
   ↓
6. Add Promotional Metadata
   ↓
7. Save Changes (with version check)
   ↓
8. Create Pricing History Log
   ↓
9. Notify Existing Customers (optional)
```

---

## Business Rules

### Product Code Rules

```typescript
// ✅ Valid codes
const validCodes = [
  'crm-basic',
  'erp-enterprise-2024',
  'domain-com',
  'ssl-wildcard',
];

// ❌ Invalid codes
const invalidCodes = [
  'CRM_Basic',      // Uppercase, underscore
  'crm basic',      // Space
  'crm.basic',      // Dot
  'CRM-Basic',      // Uppercase
  '',               // Empty
];

// Validation regex
const CODE_REGEX = /^[a-z0-9-]+$/;
```

### Pricing Rules

- Base price MUST be >= 0
- Use NUMERIC(19, 4) for precision
- Currency MUST be 3-character ISO code
- Price changes should trigger audit log
- Historical prices should be tracked

### Product Type Rules

```typescript
type ProductType = 'APP' | 'DOMAIN' | 'SSL' | 'SERVICE';

// Each type has different metadata structure
const metadataByType = {
  APP: {
    features: string[],
    limits: { max_users, storage_gb },
  },
  DOMAIN: {
    domain_extension: string,
    renewal_price: number,
  },
  SSL: {
    ssl_type: 'DV' | 'OV' | 'EV',
    wildcard: boolean,
  },
  SERVICE: {
    sla: string,
    response_time: string,
  },
};
```

### Soft Delete Rules

- Never hard delete products
- Set deleted_at = NOW() for soft delete
- Deleted products không hiển thị trong customer views
- Admin có thể view và restore deleted products
- Queries MUST filter: WHERE deleted_at IS NULL

### Versioning Rules

- Every UPDATE increments version by 1
- Frontend MUST send current version
- Backend checks version before update
- If version mismatch → 409 Conflict
- Prevents concurrent update conflicts

---

## Integration Scenarios

### Scenario 1: E-commerce Platform Integration

```
External Shop ──▶ GET /api/v1/saas-products?product_type=APP
                   │
                   ▼
              Display Products in Shop
                   │
                   ▼
              Customer Selects Product
                   │
                   ▼
              POST /api/v1/orders (via webhook)
```

### Scenario 2: Webhook Notifications

```
Product Updated ──▶ Trigger product.updated event
                    │
                    ▼
             Send webhook to subscribers
                    │
                    ▼
             External CRM updates cache
```

### Scenario 3: Data Sync with Legacy System

```
Legacy System ──▶ GET /api/v1/saas-products (nightly)
                  │
                  ▼
            Compare with local data
                  │
                  ▼
            Update changed products
                  │
                  ▼
            Log sync results
```

---

## Performance Considerations

### Caching Strategy

```typescript
// Cache products list for 5 minutes
const CACHE_TTL = 300; // seconds

// Cache key pattern
const cacheKey = (filters) => 
  `products:${filters.product_type}:${filters.is_active}`;

// Invalidate cache on product update
on('product.updated', () => {
  cache.deletePattern('products:*');
});
```

### Pagination

```typescript
// Default pagination
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

// Cursor-based pagination (recommended)
GET /api/v1/saas-products?cursor={cursor}&limit=50

// Offset-based pagination (current)
GET /api/v1/saas-products?offset=0&limit=50
```

---

## Security Considerations

1. **Input Validation:**
   - Validate all input fields
   - Sanitize code để avoid injection
   - Check price bounds

2. **Authorization:**
   - Only admins can create/update/delete
   - Public read access for active products
   - API key required for programmatic access

3. **Rate Limiting:**
   - 1000 requests/hour per API key
   - 100 requests/minute per IP

4. **Audit Logging:**
   - Log all CRUD operations
   - Track who made changes
   - Log old and new values

---

## Testing Scenarios

### Unit Tests

```typescript
describe('Product Creation', () => {
  it('should create product with valid data', async () => {
    const product = await createProduct({
      code: 'test-product',
      name: 'Test Product',
      product_type: 'APP',
      base_price: 100,
      currency: 'USD',
    });
    
    expect(product._id).toBeDefined();
    expect(product.version).toBe(1);
  });
  
  it('should reject duplicate code', async () => {
    await expect(createProduct({ code: 'existing-code' }))
      .rejects.toThrow('Product code already exists');
  });
});
```

### Integration Tests

```typescript
describe('Product API', () => {
  it('should handle optimistic locking', async () => {
    const product = await createProduct(data);
    
    // Concurrent updates with same version
    const update1 = updateProduct(product._id, { name: 'V1', version: 1 });
    const update2 = updateProduct(product._id, { name: 'V2', version: 1 });
    
    await expect(Promise.all([update1, update2]))
      .rejects.toThrow('Version conflict');
  });
});
```

---

## References

- Database Schema: `/docs/developer/products-database-schema.md`
- API Reference: `/docs/developer/products-api-reference.md`
- ERD Diagram: `/docs/developer/products-erd-diagram.md`
- Frontend Components: `/pages/ProductsPage.tsx`
- Golang Handler: `/golang-api/handlers/saas_products_handler.go`
