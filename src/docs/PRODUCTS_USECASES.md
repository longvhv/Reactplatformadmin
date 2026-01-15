# SaaS Products - Use Cases Documentation

## 📋 Tổng quan

Tài liệu này mô tả các use case thực tế khi làm việc với SaaS Products trong hệ thống. Bao gồm các kịch bản phổ biến từ khởi tạo, quản lý, đến tích hợp với các module khác.

---

## 🎯 Use Case Categories

1. [Product Catalog Management](#1-product-catalog-management)
2. [Pricing & Billing](#2-pricing--billing)
3. [Product Discovery & Search](#3-product-discovery--search)
4. [Product Lifecycle Management](#4-product-lifecycle-management)
5. [Multi-tenant Scenarios](#5-multi-tenant-scenarios)
6. [Integration with Other Modules](#6-integration-with-other-modules)
7. [Analytics & Reporting](#7-analytics--reporting)

---

## 1. Product Catalog Management

### UC-1.1: Tạo Product Catalog ban đầu

**Actor:** Platform Admin  
**Goal:** Khởi tạo catalog sản phẩm SaaS cho nền tảng

**Preconditions:**
- Admin đã đăng nhập
- Tenant đã được tạo
- System Categories cho product types đã được setup

**Main Flow:**

1. Admin truy cập trang Products Management
2. Click button "Add New Product"
3. Điền thông tin cơ bản:
   - Code: `hrm-starter`
   - Name: `HRM Starter Package`
   - Product Type: `PRODUCT_TYPE_APP`
   - Description: Mô tả chi tiết
4. Cấu hình pricing:
   - Base Price: `990,000 VND`
   - Billing Cycle: `MONTHLY`
   - Trial Days: `14`
5. Định nghĩa Features:
   ```json
   {
     "employee_management": true,
     "attendance_tracking": true,
     "basic_payroll": true,
     "leave_management": false,
     "performance_review": false
   }
   ```
6. Định nghĩa Limits:
   ```json
   {
     "max_employees": 20,
     "max_storage_gb": 5,
     "api_calls_per_month": 5000
   }
   ```
7. Set display properties:
   - Status: `active`
   - Is Featured: `true`
   - Display Order: `1`
8. Click "Create Product"

**API Call:**
```bash
POST /api/v1/saas-products
{
  "tenant_id": "tenant-uuid",
  "code": "hrm-starter",
  "name": "HRM Starter Package",
  "product_type_code": "PRODUCT_TYPE_APP",
  "description": "Giải pháp HRM cho doanh nghiệp nhỏ",
  "base_price": 990000,
  "currency": "VND",
  "billing_cycle": "MONTHLY",
  "trial_days": 14,
  "features": { /* ... */ },
  "limits": { /* ... */ },
  "status": "active",
  "is_featured": true,
  "display_order": 1
}
```

**Expected Result:**
- Product được tạo thành công với UUID v7
- Version = 1
- Hiển thị trong danh sách products
- Có thể được chọn khi tạo subscription

---

### UC-1.2: Tạo Product Bundle (Multi-tier Pricing)

**Actor:** Product Manager  
**Goal:** Tạo nhiều tiers cho cùng một dòng sản phẩm

**Scenario:**

Tạo 3 tiers cho HRM Product:
- Starter (20 employees)
- Professional (50 employees)
- Enterprise (unlimited employees)

**Implementation:**

```bash
# 1. Starter Tier
POST /api/v1/saas-products
{
  "code": "hrm-starter",
  "name": "HRM Starter",
  "base_price": 990000,
  "limits": { "max_employees": 20 },
  "display_order": 1
}

# 2. Professional Tier
POST /api/v1/saas-products
{
  "code": "hrm-professional",
  "name": "HRM Professional",
  "base_price": 2990000,
  "limits": { "max_employees": 50 },
  "features": { /* more features */ },
  "display_order": 2
}

# 3. Enterprise Tier
POST /api/v1/saas-products
{
  "code": "hrm-enterprise",
  "name": "HRM Enterprise",
  "base_price": 9990000,
  "limits": { "max_employees": -1 }, // -1 = unlimited
  "features": { /* all features */ },
  "display_order": 3
}
```

---

### UC-1.3: Clone Product để tạo variant mới

**Actor:** Product Manager  
**Goal:** Tạo product mới dựa trên product hiện có

**Main Flow:**

1. Lấy thông tin product gốc:
```bash
GET /api/v1/saas-products/original-product-id
```

2. Tạo product mới với thông tin tương tự:
```javascript
const originalProduct = await getProductById(originalId);

const newProduct = {
  ...originalProduct,
  code: "hrm-pro-yearly",  // New code
  name: "HRM Pro - Yearly Plan",  // New name
  billing_cycle: "YEARLY",  // Changed
  base_price: originalProduct.base_price * 12 * 0.8,  // 20% discount
  metadata: {
    ...originalProduct.metadata,
    based_on: originalProduct.code,
    discount_rate: 0.2
  }
};

await createProduct(newProduct);
```

**Use Case:**
- Tạo yearly plan từ monthly plan
- Tạo regional variants (VN, US, EU)
- Tạo promotional products

---

## 2. Pricing & Billing

### UC-2.1: Thay đổi giá sản phẩm (Price Adjustment)

**Actor:** Pricing Manager  
**Goal:** Tăng/giảm giá sản phẩm

**Preconditions:**
- Có quyền update pricing
- Đã có version hiện tại của product

**Main Flow:**

1. Lấy product hiện tại:
```bash
GET /api/v1/saas-products/{id}
# Response: { ..., "base_price": 2990000, "version": 3 }
```

2. Update giá mới:
```bash
PATCH /api/v1/saas-products/{id}
{
  "base_price": 3490000,  // Tăng 500k
  "metadata": {
    "price_change_reason": "Market adjustment Q1 2025",
    "previous_price": 2990000,
    "changed_at": "2025-01-15T10:00:00Z"
  },
  "version": 3,  // Optimistic locking
  "updated_by": "pricing-manager-id"
}
```

3. Hệ thống kiểm tra version
4. Nếu version match → update thành công, version = 4
5. Nếu version conflict → trả về 409 Conflict

**Business Rules:**
- Giá mới chỉ áp dụng cho subscription mới
- Subscription đang active giữ nguyên giá cũ (grandfather pricing)
- Lưu price history trong metadata

---

### UC-2.2: Tạo Promotional Pricing

**Actor:** Marketing Manager  
**Goal:** Tạo giá khuyến mãi cho campaign

**Scenario:** Black Friday Sale - Giảm 40% tất cả products trong 3 ngày

**Implementation Options:**

**Option 1: Tạo temporary products**
```bash
POST /api/v1/saas-products
{
  "code": "hrm-pro-blackfriday",
  "name": "HRM Pro - Black Friday Deal",
  "base_price": 1794000,  // 40% off from 2990000
  "metadata": {
    "promotion": "BLACK_FRIDAY_2025",
    "original_price": 2990000,
    "discount_rate": 0.4,
    "valid_from": "2025-11-25",
    "valid_to": "2025-11-27"
  },
  "status": "active"
}
```

**Option 2: Sử dụng metadata để mark promotional products**
```bash
PATCH /api/v1/saas-products/{id}
{
  "metadata": {
    "is_promotional": true,
    "promotion_code": "BF2025",
    "promotion_price": 1794000,
    "promotion_valid_until": "2025-11-27T23:59:59Z"
  }
}
```

**Frontend Logic:**
```javascript
function getEffectivePrice(product) {
  if (product.metadata.is_promotional) {
    const now = new Date();
    const validUntil = new Date(product.metadata.promotion_valid_until);
    
    if (now <= validUntil) {
      return product.metadata.promotion_price;
    }
  }
  
  return product.base_price;
}
```

---

### UC-2.3: Tính toán giá cho Multi-currency

**Actor:** System  
**Goal:** Hiển thị giá theo tiền tệ của user

**Scenario:**

Product có `base_price = 2990000 VND`. User từ US muốn xem giá USD.

**Implementation:**

```javascript
// 1. Store products in base currency (VND)
const product = {
  base_price: 2990000,
  currency: "VND"
};

// 2. Convert on-the-fly
const exchangeRates = {
  "VND_TO_USD": 0.000042,
  "VND_TO_EUR": 0.000038
};

function convertPrice(product, targetCurrency) {
  if (product.currency === targetCurrency) {
    return product.base_price;
  }
  
  const rateKey = `${product.currency}_TO_${targetCurrency}`;
  const rate = exchangeRates[rateKey];
  
  return Math.round(product.base_price * rate * 100) / 100;
}

// Usage
const priceUSD = convertPrice(product, "USD");  // 125.58 USD
```

**Alternative:** Store multiple currencies in metadata
```json
{
  "base_price": 2990000,
  "currency": "VND",
  "metadata": {
    "price_usd": 125,
    "price_eur": 115,
    "exchange_rate_date": "2025-01-15"
  }
}
```

---

## 3. Product Discovery & Search

### UC-3.1: Hiển thị Pricing Page

**Actor:** Anonymous User / Prospect  
**Goal:** Xem danh sách products có sẵn

**Main Flow:**

1. User truy cập `/pricing`
2. Frontend gọi API lấy featured products:
```bash
GET /api/v1/saas-products?status=active&is_featured=true&limit=10
```

3. Hiển thị products theo display_order
4. Render features comparison table

**Frontend Code:**
```javascript
async function loadPricingPage() {
  const response = await fetch(
    '/api/v1/saas-products?status=active&is_featured=true&limit=10'
  );
  const { data: products } = await response.json();
  
  // Sort by display_order
  products.sort((a, b) => a.display_order - b.display_order);
  
  return (
    <PricingGrid>
      {products.map(product => (
        <PricingCard 
          key={product._id}
          product={product}
          features={product.features}
          limits={product.limits}
        />
      ))}
    </PricingGrid>
  );
}
```

---

### UC-3.2: Search Products trong Admin Panel

**Actor:** Admin  
**Goal:** Tìm kiếm products để chỉnh sửa

**Scenarios:**

**A. Search by name:**
```bash
GET /api/v1/saas-products?search=hrm&limit=20
```

**B. Search by code:**
```bash
GET /api/v1/saas-products?search=starter&limit=20
```

**C. Filter by multiple criteria:**
```bash
GET /api/v1/saas-products?
  tenant_id=tenant-uuid&
  status=active&
  product_type_code=PRODUCT_TYPE_APP&
  is_featured=true&
  limit=50
```

**D. Full-text search trong description:**
```javascript
// Frontend debounced search
const searchProducts = debounce(async (term) => {
  const response = await fetch(
    `/api/v1/saas-products?search=${encodeURIComponent(term)}`
  );
  const { data } = await response.json();
  return data;
}, 300);
```

---

### UC-3.3: Filter Products by Features

**Actor:** Customer  
**Goal:** Tìm products có tính năng cụ thể

**Scenario:** Customer muốn tìm HRM products có tính năng "payroll"

**Implementation:**

```javascript
// 1. Lấy tất cả active products
const response = await fetch('/api/v1/saas-products?status=active');
const { data: products } = await response.json();

// 2. Filter trên client
const productsWithPayroll = products.filter(product => 
  product.features?.payroll === true
);

// OR use database query (PostgreSQL JSONB)
```

**SQL Query (nếu query trên server):**
```sql
SELECT * FROM saas_products
WHERE 
  status = 'active'
  AND deleted_at IS NULL
  AND features @> '{"payroll": true}'
ORDER BY display_order ASC;
```

---

## 4. Product Lifecycle Management

### UC-4.1: Product Status Transitions

**Status Flow:**
```
┌─────────┐
│ active  │ ←─────────────┐
└────┬────┘               │
     │                    │
     │ deactivate   activate
     ▼                    │
┌──────────┐              │
│ inactive │ ─────────────┘
└────┬─────┘
     │
     │ archive
     ▼
┌──────────┐
│ archived │ (read-only)
└──────────┘
```

**UC-4.1.1: Deactivate Product (Temporary)**

**Scenario:** Tạm dừng bán product trong khi đang fix bugs

```bash
PATCH /api/v1/saas-products/{id}
{
  "status": "inactive",
  "metadata": {
    "deactivation_reason": "Under maintenance",
    "deactivated_at": "2025-01-15T10:00:00Z",
    "expected_reactivation": "2025-01-16T10:00:00Z"
  },
  "version": 5
}
```

**Effect:**
- Không hiển thị trên pricing page
- Không thể tạo subscription mới
- Subscription hiện tại vẫn hoạt động bình thường

---

**UC-4.1.2: Archive Product (Permanent Retirement)**

**Scenario:** Ngừng bán product vĩnh viễn, chuyển sang product mới

```bash
PATCH /api/v1/saas-products/{id}
{
  "status": "archived",
  "metadata": {
    "archived_reason": "Replaced by new version",
    "replacement_product_id": "new-product-uuid",
    "archived_at": "2025-01-15T10:00:00Z",
    "last_sale_date": "2024-12-31T23:59:59Z"
  },
  "version": 8
}
```

**Effect:**
- Không thể reactivate
- Chỉ read-only
- Hiển thị thông báo migration đến product mới

---

### UC-4.2: Soft Delete vs Hard Delete

**UC-4.2.1: Soft Delete (Recommended)**

**Scenario:** Xóa product nhưng giữ lại data để audit

```bash
DELETE /api/v1/saas-products/{id}?deleted_by=admin-uuid
```

**Effect:**
- Set `deleted_at = NOW()`
- Set `deleted_by = admin-uuid`
- Không hiển thị trong queries bình thường
- Có thể restore nếu cần

**Restore Product:**
```sql
UPDATE saas_products
SET deleted_at = NULL, deleted_by = NULL
WHERE _id = :product_id;
```

---

**UC-4.2.2: Hard Delete (Rare)**

**Scenario:** Xóa hoàn toàn product (test data, duplicate nhầm)

```sql
DELETE FROM saas_products WHERE _id = :product_id;
```

**Warning:**
- Không thể restore
- Có thể vi phạm foreign key constraints
- Chỉ dùng cho test/development

---

### UC-4.3: Product Versioning & History

**Scenario:** Track changes của product qua thời gian

**Implementation:**

```javascript
// 1. Tạo product_history table (optional)
CREATE TABLE saas_products_history (
  history_id UUID PRIMARY KEY,
  product_id UUID NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL,
  changed_by UUID,
  change_type VARCHAR(20),  -- 'CREATED', 'UPDATED', 'DELETED'
  snapshot JSONB NOT NULL,   -- Toàn bộ data tại thời điểm đó
  changes JSONB              -- Chỉ những field thay đổi
);

// 2. Trigger để tự động log changes
CREATE OR REPLACE FUNCTION log_product_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO saas_products_history (
    history_id, product_id, changed_at, changed_by, 
    change_type, snapshot, changes
  ) VALUES (
    gen_random_uuid(),
    NEW._id,
    NOW(),
    NEW.updated_by,
    TG_OP,
    row_to_json(NEW),
    jsonb_build_object(
      'old', row_to_json(OLD),
      'new', row_to_json(NEW)
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER product_history_trigger
AFTER INSERT OR UPDATE ON saas_products
FOR EACH ROW EXECUTE FUNCTION log_product_changes();
```

**Query History:**
```sql
SELECT * FROM saas_products_history
WHERE product_id = :product_id
ORDER BY changed_at DESC
LIMIT 20;
```

---

## 5. Multi-tenant Scenarios

### UC-5.1: Platform có nhiều Tenants bán cùng products

**Scenario:** SaaS Platform cho phép nhiều vendors (tenants) bán products của họ

**Data Model:**

```javascript
// Tenant A (HRM Vendor)
{
  "_id": "tenant-a-uuid",
  "name": "HRM Solutions Co."
}

// Tenant A's Products
[
  {
    "_id": "product-1",
    "tenant_id": "tenant-a-uuid",
    "code": "hrm-starter",
    "name": "HRM Starter"
  },
  {
    "_id": "product-2",
    "tenant_id": "tenant-a-uuid",
    "code": "hrm-pro",
    "name": "HRM Professional"
  }
]

// Tenant B (CRM Vendor)
{
  "_id": "tenant-b-uuid",
  "name": "CRM Masters Inc."
}

// Tenant B's Products
[
  {
    "_id": "product-3",
    "tenant_id": "tenant-b-uuid",
    "code": "crm-basic",
    "name": "CRM Basic"
  }
]
```

**Queries:**

```bash
# Lấy products của Tenant A
GET /api/v1/saas-products?tenant_id=tenant-a-uuid

# Lấy products của Tenant B
GET /api/v1/saas-products?tenant_id=tenant-b-uuid
```

**Security:**
- Row-Level Security (RLS) để đảm bảo tenant chỉ thấy products của mình
- API phải validate tenant_id từ JWT token

---

### UC-5.2: Global Product Catalog (Platform-managed)

**Scenario:** Platform quản lý catalog chung, tenants chỉ subscribe

**Data Model:**

```javascript
// Platform's Global Products (tenant_id = platform_tenant_id)
[
  {
    "_id": "product-1",
    "tenant_id": "00000000-0000-0000-0000-000000000000",  // Platform
    "code": "standard-ssl",
    "name": "Standard SSL Certificate",
    "base_price": 300000,
    "currency": "VND"
  }
]

// Tenant subscriptions
{
  "subscription_id": "sub-1",
  "tenant_id": "customer-tenant-uuid",
  "product_id": "product-1",
  "status": "active"
}
```

**Query:**
```bash
# Public catalog (tất cả tenants đều thấy)
GET /api/v1/saas-products?tenant_id=00000000-0000-0000-0000-000000000000
```

---

## 6. Integration with Other Modules

### UC-6.1: Tạo Subscription từ Product

**Flow:**
```
Product Selection → Create Subscription → Generate Invoice
```

**Implementation:**

```javascript
// 1. User chọn product
const product = await getProductById(productId);

// 2. Tạo subscription
const subscription = await createSubscription({
  tenant_id: user.tenant_id,
  product_id: product._id,
  product_snapshot: {
    name: product.name,
    base_price: product.base_price,
    billing_cycle: product.billing_cycle,
    features: product.features,
    limits: product.limits
  },
  start_date: new Date(),
  billing_cycle: product.billing_cycle,
  amount: product.base_price,
  currency: product.currency,
  status: 'trial'  // Nếu có trial_days
});

// 3. Tạo invoice đầu tiên (nếu không có trial)
if (product.trial_days === 0) {
  await createInvoice({
    subscription_id: subscription._id,
    amount: product.base_price,
    due_date: addMonths(new Date(), 1),
    status: 'unpaid'
  });
}
```

**Key Points:**
- **Snapshot product data** vào subscription để tránh bị ảnh hưởng khi product thay đổi
- Apply grandfather pricing (giá cũ cho subscription cũ)

---

### UC-6.2: Upgrade/Downgrade Plan

**Scenario:** Customer muốn nâng cấp từ Starter lên Professional

**Flow:**

```javascript
// 1. Lấy subscription hiện tại
const currentSubscription = await getSubscription(subscriptionId);
const currentProduct = currentSubscription.product_snapshot;

// 2. Chọn product mới
const newProduct = await getProductById(newProductId);

// 3. Tính prorated amount
const daysRemaining = calculateDaysRemaining(currentSubscription);
const prorationCredit = (currentProduct.base_price / 30) * daysRemaining;
const newAmount = newProduct.base_price - prorationCredit;

// 4. Update subscription
await updateSubscription(subscriptionId, {
  product_id: newProduct._id,
  product_snapshot: {
    name: newProduct.name,
    base_price: newProduct.base_price,
    features: newProduct.features,
    limits: newProduct.limits
  },
  amount: newProduct.base_price,
  metadata: {
    upgrade_from: currentProduct.name,
    upgrade_at: new Date(),
    proration_credit: prorationCredit
  }
});

// 5. Tạo invoice cho khoản chênh lệch
if (newAmount > 0) {
  await createInvoice({
    subscription_id: subscriptionId,
    amount: newAmount,
    description: `Upgrade to ${newProduct.name} (prorated)`,
    due_date: new Date()
  });
}
```

---

### UC-6.3: Product Features Gate trong Application

**Scenario:** Check xem user có quyền dùng feature không dựa trên product

**Implementation:**

```javascript
// 1. Middleware để check features
async function checkFeatureAccess(featureName) {
  // Lấy subscription của user
  const subscription = await getUserActiveSubscription(userId);
  
  if (!subscription) {
    throw new Error('No active subscription');
  }
  
  // Check feature trong product snapshot
  const hasFeature = subscription.product_snapshot.features?.[featureName];
  
  if (!hasFeature) {
    throw new Error(`Feature '${featureName}' not available in your plan`);
  }
  
  return true;
}

// 2. Usage trong route
app.post('/api/payroll/run', async (req, res) => {
  try {
    await checkFeatureAccess('payroll');
    // Proceed with payroll logic
  } catch (error) {
    return res.status(403).json({ 
      error: error.message,
      upgrade_url: '/pricing'
    });
  }
});

// 3. Usage trong Frontend
function PayrollButton() {
  const hasPayroll = useFeatureAccess('payroll');
  
  if (!hasPayroll) {
    return (
      <UpgradePrompt 
        feature="Payroll"
        message="Upgrade to Professional plan to use Payroll"
      />
    );
  }
  
  return <Button onClick={runPayroll}>Run Payroll</Button>;
}
```

---

### UC-6.4: Limit Enforcement

**Scenario:** Enforce limits như max_employees, max_storage

**Implementation:**

```javascript
// 1. Check limit helper
async function checkLimit(limitName, currentValue) {
  const subscription = await getUserActiveSubscription(userId);
  const limit = subscription.product_snapshot.limits?.[limitName];
  
  // -1 = unlimited
  if (limit === -1) return true;
  
  if (currentValue >= limit) {
    throw new Error(
      `You've reached the limit of ${limit} ${limitName}. ` +
      `Please upgrade your plan.`
    );
  }
  
  return true;
}

// 2. Usage: Add employee
app.post('/api/employees', async (req, res) => {
  const currentEmployeeCount = await getEmployeeCount(tenantId);
  
  try {
    await checkLimit('max_employees', currentEmployeeCount + 1);
    // Proceed to add employee
  } catch (error) {
    return res.status(403).json({
      error: error.message,
      current: currentEmployeeCount,
      limit: subscription.product_snapshot.limits.max_employees,
      upgrade_url: '/pricing'
    });
  }
});

// 3. Usage: File upload
app.post('/api/files/upload', async (req, res) => {
  const currentStorage = await getTotalStorageUsed(tenantId);
  const fileSize = req.file.size / (1024 * 1024 * 1024); // Convert to GB
  
  await checkLimit('max_storage_gb', currentStorage + fileSize);
  // Proceed with upload
});
```

---

## 7. Analytics & Reporting

### UC-7.1: Product Performance Dashboard

**Scenario:** Admin muốn xem báo cáo hiệu suất của products

**Metrics cần track:**

```javascript
// 1. Get product statistics
GET /api/v1/saas-products/statistics

// Response:
{
  "total": 45,
  "active": 32,
  "inactive": 10,
  "archived": 3,
  "featured": 8,
  "total_revenue": 156750000
}

// 2. Get subscription count per product
SELECT 
  p._id,
  p.name,
  COUNT(s._id) as subscription_count,
  SUM(s.amount) as total_mrr,
  COUNT(*) FILTER (WHERE s.status = 'active') as active_subscriptions
FROM saas_products p
LEFT JOIN subscriptions s ON s.product_id = p._id
WHERE p.deleted_at IS NULL
GROUP BY p._id, p.name
ORDER BY total_mrr DESC;

// 3. Get conversion rate (view to purchase)
SELECT 
  p.name,
  COUNT(DISTINCT pv.user_id) as views,
  COUNT(DISTINCT s.tenant_id) as purchases,
  ROUND(
    COUNT(DISTINCT s.tenant_id)::numeric / 
    NULLIF(COUNT(DISTINCT pv.user_id), 0) * 100, 
    2
  ) as conversion_rate
FROM saas_products p
LEFT JOIN product_views pv ON pv.product_id = p._id
LEFT JOIN subscriptions s ON s.product_id = p._id
GROUP BY p.name;
```

**Dashboard Components:**
- Top selling products
- Revenue by product
- Conversion funnel
- Churn rate by product
- Feature adoption rate

---

### UC-7.2: Product Popularity Ranking

**Implementation:**

```sql
-- Create materialized view for performance
CREATE MATERIALIZED VIEW product_popularity AS
SELECT 
  p._id,
  p.code,
  p.name,
  COUNT(s._id) as total_subscriptions,
  COUNT(*) FILTER (WHERE s.status = 'active') as active_subscriptions,
  COUNT(*) FILTER (WHERE s.created_at >= NOW() - INTERVAL '30 days') as new_subscriptions_30d,
  SUM(s.amount) as total_mrr,
  AVG(CASE WHEN s.cancelled_at IS NOT NULL 
    THEN EXTRACT(epoch FROM (s.cancelled_at - s.created_at))/86400
    ELSE NULL
  END) as avg_lifetime_days
FROM saas_products p
LEFT JOIN subscriptions s ON s.product_id = p._id
WHERE p.deleted_at IS NULL AND p.status = 'active'
GROUP BY p._id, p.code, p.name;

-- Refresh periodically
REFRESH MATERIALIZED VIEW product_popularity;

-- Query popular products
SELECT * FROM product_popularity
ORDER BY total_subscriptions DESC
LIMIT 10;
```

---

### UC-7.3: Feature Usage Analytics

**Scenario:** Phân tích features nào được dùng nhiều nhất

**Implementation:**

```javascript
// 1. Track feature usage events
await logEvent({
  event_type: 'feature_used',
  feature_name: 'payroll',
  product_id: subscription.product_id,
  user_id: userId,
  tenant_id: tenantId
});

// 2. Aggregate feature usage
SELECT 
  p.name as product_name,
  fe.feature_name,
  COUNT(*) as usage_count,
  COUNT(DISTINCT fe.user_id) as unique_users
FROM feature_events fe
JOIN subscriptions s ON s.tenant_id = fe.tenant_id
JOIN saas_products p ON p._id = s.product_id
WHERE fe.created_at >= NOW() - INTERVAL '30 days'
GROUP BY p.name, fe.feature_name
ORDER BY usage_count DESC;

// 3. Identify underutilized features
SELECT 
  p.name,
  jsonb_object_keys(p.features) as feature_name,
  COALESCE(COUNT(fe._id), 0) as usage_count
FROM saas_products p
LEFT JOIN subscriptions s ON s.product_id = p._id
LEFT JOIN feature_events fe ON 
  fe.feature_name = jsonb_object_keys(p.features)
  AND fe.tenant_id = s.tenant_id
WHERE p.deleted_at IS NULL
GROUP BY p.name, feature_name
HAVING COUNT(fe._id) < 10
ORDER BY usage_count ASC;
```

**Insights:**
- Features không ai dùng → Consider removing
- Features dùng nhiều → Highlight in marketing
- Feature adoption rate → Measure onboarding success

---

## 🎓 Best Practices

### 1. Product Design

✅ **DO:**
- Sử dụng descriptive codes (e.g., `hrm-professional` thay vì `prod-123`)
- Định nghĩa features và limits rõ ràng
- Snapshot product data vào subscription
- Track price changes trong metadata
- Sử dụng display_order để control hiển thị

❌ **DON'T:**
- Hard-code product IDs trong code
- Thay đổi code sau khi đã có subscriptions
- Xóa products đang có active subscriptions
- Update giá mà không thông báo customers
- Quên set trial_days (default = 0 có thể gây nhầm lẫn)

---

### 2. Pricing Strategy

✅ **DO:**
- Sử dụng yearly billing với discount (ví dụ: 20% off)
- Offer free trial để tăng conversion
- Grandfather pricing cho loyal customers
- Clear comparison giữa các tiers
- Transparent về limits

❌ **DON'T:**
- Thay đổi giá đột ngột mà không thông báo
- Ẩn các giới hạn quan trọng
- Pricing quá phức tạp (làm khách hàng confused)
- Quá nhiều tiers (3-4 là đủ)

---

### 3. Technical Implementation

✅ **DO:**
- Luôn dùng optimistic locking (version) khi update
- Index các fields thường query (tenant_id, status, is_featured)
- Sử dụng JSONB cho flexible data (features, limits, metadata)
- Soft delete thay vì hard delete
- Cache featured products cho performance

❌ **DON'T:**
- Query products không filter tenant_id (security risk)
- Quên handle version conflicts
- Hard-code features trong application code
- Expose internal product IDs ra external API

---

## 📚 Related Documentation

- [Products Schema Documentation](./PRODUCTS_SCHEMA.md)
- [Products API Documentation](./PRODUCTS_API.md)
- [Subscription Management](./SUBSCRIPTIONS_USECASES.md)
- [Billing & Invoicing](./INVOICING_USECASES.md)

---

**Version:** 1.0.0  
**Last Updated:** 2025-01-13  
**Maintainer:** VHV Platform Team
