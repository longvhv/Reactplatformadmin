# Subscription Orders - Database Schema

## 📋 Overview

Database schema documentation for **Subscription Orders** (`subscription_orders`) table.

---

## 🗂️ Table: `subscription_orders`

### Purpose
Lưu trữ thông tin đơn hàng đăng ký gói dịch vụ của tenant. Đảm bảo tính toàn vẹn dữ liệu về giá và quyền lợi thông qua **Package Snapshot**.

---

## 📊 Table Structure

```sql
CREATE TABLE subscription_orders (
    -- I. ĐỊNH DANH & TENANCY (IDENTITY & TENANCY)
    _id UUID PRIMARY KEY,                   -- UUID v7 sinh từ ứng dụng
    tenant_id UUID NOT NULL,                -- FK to tenants._id
    package_id UUID NOT NULL,               -- FK to service_packages._id
    
    -- II. THÔNG TIN ĐƠN HÀNG (ORDER INFORMATION)
    order_number VARCHAR(50) NOT NULL,      -- Mã đơn hàng nghiệp vụ (ORD-2025-001)
    total_amount NUMERIC(19, 4) NOT NULL DEFAULT 0,  -- Tổng tiền
    currency_code VARCHAR(3) NOT NULL DEFAULT 'VND', -- Mã tiền tệ (ISO 4217)
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',   -- Trạng thái đơn hàng
    payment_method VARCHAR(30),             -- Phương thức thanh toán
    
    -- III. DỮ LIỆU SNAPSHOT (SNAPSHOT DATA)
    package_snapshot JSONB NOT NULL DEFAULT '{}',    -- Bảo toàn thông tin gói
    
    -- IV. QUẢN TRỊ & AUDIT (MANAGEMENT & AUDIT)
    version BIGINT NOT NULL DEFAULT 1,      -- Optimistic locking
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,                 -- Soft delete
    
    -- CONSTRAINTS
    CONSTRAINT fk_order_tenant FOREIGN KEY (tenant_id) 
        REFERENCES tenants(_id),
    CONSTRAINT fk_order_package FOREIGN KEY (package_id) 
        REFERENCES service_packages(_id),
    CONSTRAINT uq_order_number UNIQUE (order_number),
    CONSTRAINT chk_order_amount CHECK (total_amount >= 0),
    CONSTRAINT chk_order_currency CHECK (LENGTH(currency_code) = 3),
    CONSTRAINT chk_order_status CHECK (status IN ('PENDING', 'PAID', 'CANCELLED', 'FAILED'))
);
```

---

## 📋 Column Details

### I. Định danh & Tenancy

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| `_id` | UUID | NO | - | **Primary Key**. UUID v7 sinh từ application |
| `tenant_id` | UUID | NO | - | **Foreign Key** to `tenants._id`. Tenant sở hữu đơn hàng |
| `package_id` | UUID | NO | - | **Foreign Key** to `service_packages._id`. Gói dịch vụ được đặt mua |

**Business Rules:**
- ✅ `_id` phải unique và sinh bởi UUID v7
- ✅ `tenant_id` bắt buộc và phải tồn tại trong bảng `tenants`
- ✅ `package_id` bắt buộc và phải tồn tại trong bảng `service_packages`

---

### II. Thông tin đơn hàng

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| `order_number` | VARCHAR(50) | NO | - | Mã đơn hàng nghiệp vụ (ORD-2025-001) |
| `total_amount` | NUMERIC(19,4) | NO | 0 | Tổng tiền đơn hàng |
| `currency_code` | VARCHAR(3) | NO | 'VND' | Mã tiền tệ ISO 4217 (VND, USD, EUR) |
| `status` | VARCHAR(20) | NO | 'PENDING' | Trạng thái: PENDING, PAID, CANCELLED, FAILED |
| `payment_method` | VARCHAR(30) | YES | NULL | Phương thức thanh toán (CREDIT_CARD, BANK_TRANSFER, MOMO, etc.) |

**Business Rules:**
- ✅ `order_number` phải unique trong toàn bộ hệ thống
- ✅ `total_amount` không được âm (CHECK constraint)
- ✅ `currency_code` phải có đúng 3 ký tự (ISO 4217)
- ✅ `status` chỉ nhận 4 giá trị: PENDING, PAID, CANCELLED, FAILED

**Status Flow:**
```
PENDING (Chờ thanh toán)
   ↓
   ├─→ PAID (Đã thanh toán) ✓
   ├─→ CANCELLED (Đã hủy)
   └─→ FAILED (Thất bại)
```

---

### III. Dữ liệu Snapshot

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| `package_snapshot` | JSONB | NO | '{}' | **Snapshot đầy đủ** của service package tại thời điểm đặt hàng |

**Purpose:**
- 🎯 **Bảo toàn giá**: Lưu trữ `price_amount`, `currency_code`, `billing_cycle` tại thời điểm mua
- 🎯 **Bảo toàn quyền lợi**: Lưu trữ `entitlements_config`, `features` để tạo subscription chính xác
- 🎯 **Audit trail**: Có thể xem lại gói dịch vụ như thế nào khi khách hàng đặt mua

**Example Snapshot:**
```json
{
  "_id": "01940824-f123-7890-abcd-1234567890ab",
  "code": "hrm-pro",
  "name": "HRM Professional",
  "price_amount": 2990000,
  "currency_code": "VND",
  "billing_cycle": "MONTHLY",
  "entitlements_config": {
    "apps": {
      "hrm": {
        "enabled": true,
        "features": {
          "employee_management": true,
          "payroll": true,
          "advanced_reports": true
        }
      }
    }
  },
  "max_users": 50,
  "max_storage": 100,
  "trial_days": 14
}
```

---

### IV. Quản trị & Audit

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| `version` | BIGINT | NO | 1 | **Optimistic locking**. Tăng mỗi lần update |
| `created_at` | TIMESTAMPTZ | NO | NOW() | Timestamp tạo đơn hàng |
| `updated_at` | TIMESTAMPTZ | NO | NOW() | Timestamp cập nhật gần nhất |
| `deleted_at` | TIMESTAMPTZ | YES | NULL | **Soft delete**. NULL = active, NOT NULL = deleted |

**Optimistic Locking:**
```sql
-- Khi update, kiểm tra version
UPDATE subscription_orders 
SET status = 'PAID', version = version + 1, updated_at = NOW()
WHERE _id = $1 AND version = $2;

-- Nếu affected_rows = 0 → version conflict → rollback
```

---

## 🔍 Indexes

### 1. Primary Key Index
```sql
-- Tự động tạo bởi PRIMARY KEY constraint
CREATE UNIQUE INDEX subscription_orders_pkey ON subscription_orders(_id);
```

### 2. Tenant Lookup Index
```sql
-- Hỗ trợ tenant xem lịch sử đơn hàng (DESC = mới nhất lên đầu)
CREATE INDEX idx_orders_tenant_lookup 
ON subscription_orders (tenant_id, created_at DESC) 
WHERE deleted_at IS NULL;
```

**Use Case:**
```sql
-- Tenant xem lịch sử đơn hàng của mình
SELECT * FROM subscription_orders 
WHERE tenant_id = '...' AND deleted_at IS NULL 
ORDER BY created_at DESC;
```

### 3. Pending Status Index
```sql
-- Hỗ trợ Admin/Worker quét các đơn hàng chưa thanh toán
CREATE INDEX idx_orders_pending_status 
ON subscription_orders (status, created_at) 
WHERE status = 'PENDING' AND deleted_at IS NULL;
```

**Use Case:**
```sql
-- Worker job quét đơn hàng PENDING quá hạn
SELECT * FROM subscription_orders 
WHERE status = 'PENDING' AND deleted_at IS NULL 
AND created_at < NOW() - INTERVAL '24 hours';
```

### 4. Order Number Search Index
```sql
-- Tìm kiếm nhanh theo mã đơn hàng nghiệp vụ
CREATE UNIQUE INDEX idx_orders_number_search 
ON subscription_orders (order_number) 
WHERE deleted_at IS NULL;
```

**Use Case:**
```sql
-- Customer tra cứu đơn hàng theo order_number
SELECT * FROM subscription_orders 
WHERE order_number = 'ORD-2025-001234' AND deleted_at IS NULL;
```

---

## 🔗 Relationships

### Parent Tables
```
tenants (1) ──────< subscription_orders (N)
service_packages (1) ──────< subscription_orders (N)
```

### Child Tables
```
subscription_orders (1) ──────< tenant_subscriptions (N)
subscription_orders (1) ──────< subscription_invoices (N)
```

---

## 📐 Data Integrity Rules

### 1. Referential Integrity
- ✅ `tenant_id` phải tồn tại trong `tenants` table
- ✅ `package_id` phải tồn tại trong `service_packages` table
- ⚠️ Không cascade delete (phải soft delete)

### 2. Business Logic Constraints
- ✅ `total_amount >= 0` (không cho phép số âm)
- ✅ `currency_code` phải có độ dài = 3 (ISO 4217)
- ✅ `status` chỉ nhận 4 giá trị hợp lệ
- ✅ `order_number` phải unique toàn bộ hệ thống

### 3. Soft Delete Rules
- ✅ Khi xóa, set `deleted_at = NOW()`
- ✅ Tất cả queries phải filter `WHERE deleted_at IS NULL`
- ✅ Indexes partial để không index các records đã xóa

---

## 📊 Storage Estimates

### Row Size Calculation
```
UUID (16 bytes) × 3        = 48 bytes
VARCHAR(50)                = 50 bytes
NUMERIC(19,4)              = 12 bytes
VARCHAR(3)                 = 3 bytes
VARCHAR(20)                = 20 bytes
VARCHAR(30)                = 30 bytes
JSONB (avg 2KB)            = 2048 bytes
BIGINT                     = 8 bytes
TIMESTAMPTZ × 3            = 24 bytes
--------------------------------
Total per row ≈ 2,243 bytes ≈ 2.2 KB
```

### Storage Projections
| Orders | Storage | Notes |
|--------|---------|-------|
| 1,000 | ~2.2 MB | Small startup |
| 10,000 | ~22 MB | Growing SaaS |
| 100,000 | ~220 MB | Medium SaaS |
| 1,000,000 | ~2.2 GB | Large SaaS |

---

## 🔄 Lifecycle

### 1. Order Creation
```sql
INSERT INTO subscription_orders (
    _id, tenant_id, package_id, order_number, 
    total_amount, currency_code, status, package_snapshot
) VALUES (
    gen_uuid_v7(), 
    'tenant-uuid', 
    'package-uuid', 
    'ORD-2025-001234',
    2990000,
    'VND',
    'PENDING',
    (SELECT row_to_json(p.*) FROM service_packages p WHERE p._id = 'package-uuid')
);
```

### 2. Payment Confirmation
```sql
UPDATE subscription_orders 
SET status = 'PAID', 
    payment_method = 'CREDIT_CARD',
    version = version + 1, 
    updated_at = NOW()
WHERE _id = $1 AND version = $2;
```

### 3. Order Cancellation
```sql
UPDATE subscription_orders 
SET status = 'CANCELLED', 
    version = version + 1, 
    updated_at = NOW()
WHERE _id = $1 AND status = 'PENDING';
```

### 4. Soft Delete
```sql
UPDATE subscription_orders 
SET deleted_at = NOW(), 
    updated_at = NOW()
WHERE _id = $1;
```

---

## 🎯 Query Patterns

### Pattern 1: List tenant's orders
```sql
SELECT 
    o._id,
    o.order_number,
    o.total_amount,
    o.currency_code,
    o.status,
    o.created_at,
    p.name AS package_name
FROM subscription_orders o
JOIN service_packages p ON o.package_id = p._id
WHERE o.tenant_id = $1 AND o.deleted_at IS NULL
ORDER BY o.created_at DESC
LIMIT 20;
```

### Pattern 2: Get order with full details
```sql
SELECT 
    o.*,
    t.name AS tenant_name,
    p.name AS package_name,
    p.code AS package_code
FROM subscription_orders o
LEFT JOIN tenants t ON o.tenant_id = t._id
LEFT JOIN service_packages p ON o.package_id = p._id
WHERE o._id = $1 AND o.deleted_at IS NULL;
```

### Pattern 3: Revenue statistics
```sql
SELECT 
    currency_code,
    status,
    COUNT(*) AS order_count,
    SUM(total_amount) AS total_revenue
FROM subscription_orders
WHERE deleted_at IS NULL
GROUP BY currency_code, status;
```

---

## 📚 Related Documentation

- [Orders API](./ORDERS_API.md)
- [Orders Use Cases](./ORDERS_USECASES.md)
- [Orders ERD](./ORDERS_ERD.md)
- [Service Packages Schema](./PACKAGES_SCHEMA.md)

---

**Version:** 1.0.0  
**Last Updated:** 2025-01-13  
**Maintainer:** VHV Platform Team
