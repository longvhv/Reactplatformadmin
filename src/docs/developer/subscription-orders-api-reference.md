# Subscription Orders API Reference

**Version:** 1.0  
**Last Updated:** 2026-01-14  
**Status:** ✅ Production Ready

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Base URL](#base-url)
4. [Endpoints](#endpoints)
   - [List Orders](#1-list-orders)
   - [Get Order by ID](#2-get-order-by-id)
   - [Get Order by Number](#3-get-order-by-number)
   - [Create Order](#4-create-order)
   - [Update Order](#5-update-order)
   - [Delete Order](#6-delete-order)
   - [Get Order with Details](#7-get-order-with-details)
   - [Process Payment](#8-process-payment)
   - [Get Pending Orders](#9-get-pending-orders)
   - [Get Statistics](#10-get-statistics)
5. [Data Models](#data-models)
6. [Status Flow](#status-flow)
7. [Error Handling](#error-handling)
8. [Business Logic](#business-logic)
9. [Performance Considerations](#performance-considerations)
10. [Examples](#examples)

---

## Overview

The Subscription Orders API provides endpoints for managing subscription orders in the system. This API supports:

- **Order Management:** Create, read, update, and delete orders
- **Auto-generation:** Automatic order number generation
- **Payment Processing:** Payment flow from PENDING to PAID
- **Package Snapshot:** Preserves package details at time of purchase
- **Optimistic Locking:** Version-based conflict prevention
- **Soft Delete:** Records are marked as deleted, not physically removed
- **Statistics:** Comprehensive order analytics

### Key Features

✅ **10 Production-Ready Endpoints**  
✅ **Auto-Generate Order Number** (Format: `ORD-YYYYMMDD-XXXXXX`)  
✅ **JSONB Package Snapshot** for data preservation  
✅ **Optimistic Locking** with version field  
✅ **4 Order Statuses** (PENDING, PAID, CANCELLED, FAILED)  
✅ **Payment Gateway Integration** ready  
✅ **Comprehensive Filtering** & Pagination  
✅ **Real-time Statistics**  

---

## Authentication

All API endpoints require authentication via Bearer token.

```http
Authorization: Bearer <your-jwt-token>
```

### Required Permissions

| Endpoint | Required Permission |
|----------|-------------------|
| List Orders | `orders:read` |
| Get Order | `orders:read` |
| Create Order | `orders:create` |
| Update Order | `orders:update` |
| Delete Order | `orders:delete` |
| Process Payment | `orders:payment` |
| Get Statistics | `orders:stats` |

---

## Base URL

```
Production: https://api.vhvplatform.com/v1
Staging:    https://api-staging.vhvplatform.com/v1
Development: http://localhost:8080/v1
```

---

## Endpoints

### 1. List Orders

Get a paginated list of subscription orders with optional filters.

#### Request

```http
GET /subscription-orders
```

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | string | No | Filter by status (PENDING, PAID, CANCELLED, FAILED) |
| `tenant_id` | UUID | No | Filter by tenant ID |
| `package_id` | UUID | No | Filter by package ID |
| `search` | string | No | Search by order number (case-insensitive) |
| `page` | integer | No | Page number (default: 1) |
| `limit` | integer | No | Items per page (default: 20, max: 100) |

#### Response

**Status:** `200 OK`

```json
{
  "data": [
    {
      "_id": "01934c8f-1a2b-7c3d-8e4f-5a6b7c8d9e0f",
      "tenant_id": "01934c8f-0000-7c3d-8e4f-000000000001",
      "package_id": "01934c8f-1111-7c3d-8e4f-111111111111",
      "order_number": "ORD-20260114-123456",
      "total_amount": 1000000.0000,
      "currency_code": "VND",
      "status": "PENDING",
      "payment_method": null,
      "package_snapshot": {
        "name": "Professional Plan",
        "price": 1000000,
        "duration_days": 30,
        "features": ["Feature A", "Feature B"]
      },
      "version": 1,
      "created_at": "2026-01-14T10:30:00Z",
      "updated_at": "2026-01-14T10:30:00Z",
      "deleted_at": null,
      "tenant_name": "Acme Corporation",
      "package_name": "Professional Plan",
      "package_code": "PRO-001"
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 20,
  "pages": 8
}
```

#### Example

```bash
# List all pending orders
curl -X GET "https://api.vhvplatform.com/v1/subscription-orders?status=PENDING&page=1&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Search by order number
curl -X GET "https://api.vhvplatform.com/v1/subscription-orders?search=ORD-20260114" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Filter by tenant
curl -X GET "https://api.vhvplatform.com/v1/subscription-orders?tenant_id=01934c8f-0000-7c3d-8e4f-000000000001" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 2. Get Order by ID

Retrieve detailed information about a specific order using its UUID.

#### Request

```http
GET /subscription-orders/{id}
```

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | Order ID |

#### Response

**Status:** `200 OK`

```json
{
  "_id": "01934c8f-1a2b-7c3d-8e4f-5a6b7c8d9e0f",
  "tenant_id": "01934c8f-0000-7c3d-8e4f-000000000001",
  "package_id": "01934c8f-1111-7c3d-8e4f-111111111111",
  "order_number": "ORD-20260114-123456",
  "total_amount": 1000000.0000,
  "currency_code": "VND",
  "status": "PAID",
  "payment_method": "CREDIT_CARD",
  "package_snapshot": {
    "name": "Professional Plan",
    "price": 1000000,
    "duration_days": 30,
    "features": ["Feature A", "Feature B"],
    "metadata": {
      "billing_cycle": "MONTHLY",
      "auto_renew": true
    }
  },
  "version": 2,
  "created_at": "2026-01-14T10:30:00Z",
  "updated_at": "2026-01-14T11:45:00Z",
  "deleted_at": null,
  "tenant_name": "Acme Corporation",
  "package_name": "Professional Plan",
  "package_code": "PRO-001"
}
```

#### Errors

| Status | Description |
|--------|-------------|
| `404` | Order not found |
| `500` | Internal server error |

#### Example

```bash
curl -X GET "https://api.vhvplatform.com/v1/subscription-orders/01934c8f-1a2b-7c3d-8e4f-5a6b7c8d9e0f" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 3. Get Order by Number

Retrieve an order using its unique order number (business identifier).

#### Request

```http
GET /subscription-orders/number/{number}
```

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `number` | string | Yes | Order number (e.g., ORD-20260114-123456) |

#### Response

**Status:** `200 OK`

Same as [Get Order by ID](#2-get-order-by-id)

#### Example

```bash
curl -X GET "https://api.vhvplatform.com/v1/subscription-orders/number/ORD-20260114-123456" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 4. Create Order

Create a new subscription order with auto-generated order number.

#### Request

```http
POST /subscription-orders
```

#### Request Body

```json
{
  "tenant_id": "01934c8f-0000-7c3d-8e4f-000000000001",
  "package_id": "01934c8f-1111-7c3d-8e4f-111111111111",
  "total_amount": 1000000.0000,
  "currency_code": "VND",
  "status": "PENDING",
  "payment_method": null,
  "package_snapshot": {
    "name": "Professional Plan",
    "price": 1000000,
    "duration_days": 30,
    "features": ["Feature A", "Feature B"],
    "discount": 0,
    "tax_rate": 0.1
  }
}
```

#### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `tenant_id` | UUID | **Yes** | ID of the tenant creating the order |
| `package_id` | UUID | **Yes** | ID of the service package |
| `total_amount` | decimal(19,4) | Yes | Total order amount (default: 0) |
| `currency_code` | string(3) | No | ISO 4217 currency code (default: "VND") |
| `status` | string | No | Order status (default: "PENDING") |
| `payment_method` | string | No | Payment method (nullable) |
| `package_snapshot` | JSONB | No | Package details at time of purchase (default: {}) |

#### Response

**Status:** `201 Created`

```json
{
  "_id": "01934c8f-1a2b-7c3d-8e4f-5a6b7c8d9e0f",
  "tenant_id": "01934c8f-0000-7c3d-8e4f-000000000001",
  "package_id": "01934c8f-1111-7c3d-8e4f-111111111111",
  "order_number": "ORD-20260114-789012",
  "total_amount": 1000000.0000,
  "currency_code": "VND",
  "status": "PENDING",
  "payment_method": null,
  "package_snapshot": {
    "name": "Professional Plan",
    "price": 1000000,
    "duration_days": 30,
    "features": ["Feature A", "Feature B"]
  },
  "version": 1,
  "created_at": "2026-01-14T12:00:00Z",
  "updated_at": "2026-01-14T12:00:00Z",
  "deleted_at": null
}
```

#### Auto-Generated Fields

The system automatically generates:

1. **`_id`** - UUID v7 (time-ordered)
2. **`order_number`** - Format: `ORD-YYYYMMDD-XXXXXX`
   - `YYYYMMDD`: Date (e.g., 20260114)
   - `XXXXXX`: Last 6 digits of Unix timestamp for uniqueness
3. **`version`** - Set to 1
4. **`created_at`** - Current timestamp
5. **`updated_at`** - Current timestamp

#### Example

```bash
curl -X POST "https://api.vhvplatform.com/v1/subscription-orders" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "01934c8f-0000-7c3d-8e4f-000000000001",
    "package_id": "01934c8f-1111-7c3d-8e4f-111111111111",
    "total_amount": 1000000.0000,
    "currency_code": "VND",
    "package_snapshot": {
      "name": "Professional Plan",
      "price": 1000000,
      "duration_days": 30
    }
  }'
```

---

### 5. Update Order

Update order information with optimistic locking (version check).

#### Request

```http
PATCH /subscription-orders/{id}
```

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | Order ID |

#### Request Body

```json
{
  "status": "PAID",
  "payment_method": "CREDIT_CARD",
  "total_amount": 1100000.0000,
  "version": 1
}
```

#### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | string | No | New status (PENDING, PAID, CANCELLED, FAILED) |
| `payment_method` | string | No | Payment method |
| `total_amount` | decimal | No | Updated total amount |
| `version` | integer | **Yes** | Current version for optimistic locking |

#### Response

**Status:** `200 OK`

Returns the updated order (same structure as Get Order)

#### Optimistic Locking

The `version` field prevents concurrent update conflicts:

```
1. Client A reads order with version=1
2. Client B reads order with version=1
3. Client A updates with version=1 → Success, version becomes 2
4. Client B updates with version=1 → Fails with 409 Conflict
```

#### Errors

| Status | Description |
|--------|-------------|
| `400` | Invalid request (no fields to update) |
| `404` | Order not found |
| `409` | Version conflict (optimistic locking failed) |
| `500` | Internal server error |

#### Example

```bash
curl -X PATCH "https://api.vhvplatform.com/v1/subscription-orders/01934c8f-1a2b-7c3d-8e4f-5a6b7c8d9e0f" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "PAID",
    "payment_method": "CREDIT_CARD",
    "version": 1
  }'
```

---

### 6. Delete Order

Soft delete an order (sets `deleted_at` timestamp).

#### Request

```http
DELETE /subscription-orders/{id}
```

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | Order ID |

#### Response

**Status:** `204 No Content`

No response body.

#### Soft Delete Behavior

- Record is NOT physically removed from database
- `deleted_at` field is set to current timestamp
- `updated_at` is also updated
- Record is excluded from all queries (WHERE deleted_at IS NULL)
- Can be restored by setting `deleted_at` back to NULL

#### Example

```bash
curl -X DELETE "https://api.vhvplatform.com/v1/subscription-orders/01934c8f-1a2b-7c3d-8e4f-5a6b7c8d9e0f" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 7. Get Order with Details

Get order with complete JOIN information (tenant, package details).

#### Request

```http
GET /subscription-orders/{id}/details
```

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | Order ID |

#### Response

**Status:** `200 OK`

```json
{
  "_id": "01934c8f-1a2b-7c3d-8e4f-5a6b7c8d9e0f",
  "tenant_id": "01934c8f-0000-7c3d-8e4f-000000000001",
  "package_id": "01934c8f-1111-7c3d-8e4f-111111111111",
  "order_number": "ORD-20260114-123456",
  "total_amount": 1000000.0000,
  "currency_code": "VND",
  "status": "PAID",
  "payment_method": "CREDIT_CARD",
  "package_snapshot": {
    "name": "Professional Plan",
    "price": 1000000,
    "duration_days": 30
  },
  "version": 2,
  "created_at": "2026-01-14T10:30:00Z",
  "updated_at": "2026-01-14T11:45:00Z",
  "deleted_at": null,
  
  // Extended fields from JOINs
  "tenant_name": "Acme Corporation",
  "tenant_email": "contact@acme.com",
  "package_name": "Professional Plan",
  "package_code": "PRO-001",
  "package_price": 1000000.0000,
  "package_duration": 30
}
```

#### Use Cases

- Display complete order information in UI
- Generate invoices with tenant details
- Analytics dashboards with package information

#### Example

```bash
curl -X GET "https://api.vhvplatform.com/v1/subscription-orders/01934c8f-1a2b-7c3d-8e4f-5a6b7c8d9e0f/details" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 8. Process Payment

Process payment and update order status from PENDING to PAID.

#### Request

```http
POST /subscription-orders/{id}/pay
```

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | Order ID |

#### Request Body

```json
{
  "payment_method": "CREDIT_CARD",
  "payment_data": {
    "card_last4": "4242",
    "transaction_id": "txn_abc123xyz",
    "gateway": "stripe",
    "receipt_url": "https://..."
  }
}
```

#### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `payment_method` | string | **Yes** | Payment method used |
| `payment_data` | JSONB | No | Additional payment information |

#### Payment Methods

Supported payment methods:

- `CREDIT_CARD`
- `DEBIT_CARD`
- `BANK_TRANSFER`
- `VNPAY`
- `MOMO`
- `ZALOPAY`
- `PAYPAL`
- `STRIPE`
- `CASH`

#### Response

**Status:** `200 OK`

Returns the updated order with status changed to PAID.

#### Payment Flow

```
1. Validate order exists and status = 'PENDING'
2. Process payment via payment gateway
3. Update order:
   - Set status = 'PAID'
   - Set payment_method
   - Increment version
   - Update updated_at
4. Return updated order
```

#### Errors

| Status | Description |
|--------|-------------|
| `400` | Order not in PENDING status |
| `404` | Order not found |
| `409` | Version conflict during processing |
| `500` | Payment processing failed |

#### Example

```bash
curl -X POST "https://api.vhvplatform.com/v1/subscription-orders/01934c8f-1a2b-7c3d-8e4f-5a6b7c8d9e0f/pay" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "payment_method": "CREDIT_CARD",
    "payment_data": {
      "card_last4": "4242",
      "transaction_id": "txn_abc123xyz"
    }
  }'
```

---

### 9. Get Pending Orders

Get all orders with PENDING status (useful for reminder jobs).

#### Request

```http
GET /subscription-orders/pending
```

#### Response

**Status:** `200 OK`

```json
{
  "data": [
    {
      "_id": "01934c8f-1a2b-7c3d-8e4f-5a6b7c8d9e0f",
      "tenant_id": "01934c8f-0000-7c3d-8e4f-000000000001",
      "package_id": "01934c8f-1111-7c3d-8e4f-111111111111",
      "order_number": "ORD-20260114-123456",
      "total_amount": 1000000.0000,
      "currency_code": "VND",
      "status": "PENDING",
      "created_at": "2026-01-14T10:30:00Z"
    }
  ],
  "total": 25
}
```

#### Use Cases

- Scheduled jobs to send payment reminders
- Dashboard showing pending orders count
- Admin panel for order follow-up
- Auto-cancellation of old pending orders

#### Example

```bash
curl -X GET "https://api.vhvplatform.com/v1/subscription-orders/pending" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 10. Get Statistics

Get comprehensive statistics about orders.

#### Request

```http
GET /subscription-orders/stats
```

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tenant_id` | UUID | No | Filter statistics by tenant |

#### Response

**Status:** `200 OK`

```json
{
  "total_orders": 1500,
  "orders_by_status": {
    "PENDING": 250,
    "PAID": 1100,
    "CANCELLED": 100,
    "FAILED": 50
  },
  "total_revenue": 1500000000.0000,
  "revenue_by_currency": {
    "VND": 1400000000.0000,
    "USD": 100000.0000
  },
  "average_order_value": 1363636.3636,
  "pending_orders": 250,
  "paid_orders": 1100,
  "failed_orders": 50,
  "cancelled_orders": 100
}
```

#### Metrics Explained

| Metric | Description |
|--------|-------------|
| `total_orders` | Total number of orders (excluding deleted) |
| `orders_by_status` | Breakdown by status |
| `total_revenue` | Sum of all PAID orders |
| `revenue_by_currency` | Revenue grouped by currency |
| `average_order_value` | Total revenue / Number of paid orders |
| `pending_orders` | Count of PENDING orders |
| `paid_orders` | Count of PAID orders |
| `failed_orders` | Count of FAILED orders |
| `cancelled_orders` | Count of CANCELLED orders |

#### Example

```bash
# All statistics
curl -X GET "https://api.vhvplatform.com/v1/subscription-orders/stats" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Statistics for specific tenant
curl -X GET "https://api.vhvplatform.com/v1/subscription-orders/stats?tenant_id=01934c8f-0000-7c3d-8e4f-000000000001" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Data Models

### SubscriptionOrder

Main order object with all fields.

```typescript
interface SubscriptionOrder {
  // I. ĐỊNH DANH & TENANCY
  _id: string;              // UUID v7
  tenant_id: string;        // UUID
  package_id: string;       // UUID

  // II. THÔNG TIN ĐƠN HÀNG
  order_number: string;     // Format: ORD-YYYYMMDD-XXXXXX
  total_amount: number;     // decimal(19,4)
  currency_code: string;    // 3-char ISO 4217 (e.g., "VND", "USD")
  status: OrderStatus;      // PENDING | PAID | CANCELLED | FAILED
  payment_method?: string;  // nullable

  // III. DỮ LIỆU SNAPSHOT
  package_snapshot: Record<string, any>; // JSONB

  // IV. QUẢN TRỊ & AUDIT
  version: number;          // Optimistic locking
  created_at: string;       // ISO 8601 timestamp
  updated_at: string;       // ISO 8601 timestamp
  deleted_at?: string;      // ISO 8601 timestamp (nullable)

  // Extended fields (from JOINs)
  tenant_name?: string;
  package_name?: string;
  package_code?: string;
}
```

### OrderStatus

```typescript
enum OrderStatus {
  PENDING = 'PENDING',       // Order created, awaiting payment
  PAID = 'PAID',            // Payment successful
  CANCELLED = 'CANCELLED',   // Order cancelled by user/admin
  FAILED = 'FAILED'         // Payment failed
}
```

### Package Snapshot Structure

```typescript
interface PackageSnapshot {
  name: string;              // Package name at time of purchase
  code?: string;             // Package code
  price: number;             // Original price
  duration_days: number;     // Duration in days
  features?: string[];       // List of features
  discount?: number;         // Discount amount
  tax_rate?: number;         // Tax rate
  metadata?: Record<string, any>; // Additional data
}
```

---

## Status Flow

Order status transitions:

```
┌─────────┐
│ PENDING │ ──────────────────────────────> Start state
└────┬────┘
     │
     ├───────> (Payment Success) ──────> PAID
     │
     ├───────> (User Cancels) ─────────> CANCELLED
     │
     └───────> (Payment Fails) ────────> FAILED

Terminal States:
- PAID: Order completed successfully
- CANCELLED: Order cancelled
- FAILED: Payment failed
```

### Valid Transitions

| From | To | Condition |
|------|-----|-----------|
| PENDING | PAID | Payment successful |
| PENDING | CANCELLED | User/Admin cancels |
| PENDING | FAILED | Payment fails |

### Invalid Transitions

❌ PAID → PENDING  
❌ PAID → FAILED  
❌ CANCELLED → PAID  
❌ FAILED → PAID  

---

## Error Handling

### Standard Error Response

```json
{
  "error": "Error message description",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional context"
  }
}
```

### Common Error Codes

| HTTP Status | Error Code | Description |
|------------|------------|-------------|
| 400 | `INVALID_REQUEST` | Invalid request body or parameters |
| 400 | `INVALID_STATUS` | Order not in correct status for operation |
| 401 | `UNAUTHORIZED` | Missing or invalid authentication |
| 403 | `FORBIDDEN` | Insufficient permissions |
| 404 | `NOT_FOUND` | Order not found |
| 409 | `VERSION_CONFLICT` | Optimistic locking failure |
| 409 | `DUPLICATE_ORDER_NUMBER` | Order number already exists |
| 422 | `VALIDATION_ERROR` | Field validation failed |
| 500 | `INTERNAL_ERROR` | Server error |

### Error Examples

#### 400 - Invalid Request

```json
{
  "error": "tenant_id and package_id are required",
  "code": "INVALID_REQUEST"
}
```

#### 409 - Version Conflict

```json
{
  "error": "Order not found or version conflict (optimistic locking failed)",
  "code": "VERSION_CONFLICT",
  "details": {
    "current_version": 3,
    "provided_version": 2
  }
}
```

#### 400 - Invalid Status

```json
{
  "error": "Order status must be PENDING, current status is PAID",
  "code": "INVALID_STATUS",
  "details": {
    "current_status": "PAID",
    "required_status": "PENDING"
  }
}
```

---

## Business Logic

### Order Number Generation

Format: `ORD-YYYYMMDD-XXXXXX`

```
ORD-20260114-123456
│   │        │
│   │        └─ Last 6 digits of Unix timestamp (for uniqueness)
│   └────────── Date in YYYYMMDD format
└────────────── Prefix
```

**Properties:**
- ✅ Human-readable
- ✅ Sortable chronologically
- ✅ Unique per second
- ✅ Customer-friendly

### Package Snapshot

**Purpose:** Preserve package details at time of purchase

**Why Important:**
- Package prices may change over time
- Package features may be updated
- Need historical accuracy for invoices
- Legal requirement for transparency

**Best Practices:**

```json
{
  "name": "Professional Plan",
  "code": "PRO-001",
  "price": 1000000,
  "duration_days": 30,
  "features": [
    "Unlimited Users",
    "24/7 Support",
    "Advanced Analytics"
  ],
  "discount": {
    "type": "PERCENTAGE",
    "value": 10,
    "reason": "Early bird discount"
  },
  "tax_rate": 0.1,
  "metadata": {
    "promotion_code": "SAVE10",
    "campaign": "Q1-2026"
  }
}
```

### Optimistic Locking

**Problem:** Two users update the same order simultaneously

**Solution:** Version field

**Flow:**

```
1. User A reads order (version=1)
2. User B reads order (version=1)
3. User A updates with version=1
   → Success, version becomes 2
4. User B updates with version=1
   → Fails with 409 Conflict
   → User B must re-read and retry
```

**Implementation:**

```sql
UPDATE subscription_orders
SET 
  status = 'PAID',
  version = version + 1,
  updated_at = NOW()
WHERE _id = $1 
  AND version = $2  -- Optimistic lock check
  AND deleted_at IS NULL
```

---

## Performance Considerations

### Indexes

```sql
-- 1. Tenant lookup (most common query)
CREATE INDEX idx_orders_tenant_lookup 
ON subscription_orders (tenant_id, created_at DESC) 
WHERE deleted_at IS NULL;

-- 2. Pending orders (for jobs)
CREATE INDEX idx_orders_pending_status 
ON subscription_orders (status, created_at) 
WHERE status = 'PENDING' AND deleted_at IS NULL;

-- 3. Order number search (unique)
CREATE UNIQUE INDEX idx_orders_number_search 
ON subscription_orders (order_number) 
WHERE deleted_at IS NULL;
```

### Query Performance

| Query | Index Used | Expected Time |
|-------|-----------|---------------|
| List by tenant | `idx_orders_tenant_lookup` | < 15ms |
| Get by order number | `idx_orders_number_search` | < 5ms |
| Get pending orders | `idx_orders_pending_status` | < 20ms |
| Get by ID (PK) | Primary Key | < 3ms |

### Optimization Tips

1. **Use pagination** - Always use `page` and `limit` parameters
2. **Filter wisely** - Combine filters to reduce result set
3. **Index coverage** - All common queries use indexes
4. **Soft delete** - Use `deleted_at IS NULL` in WHERE clauses
5. **JSONB queries** - Index JSONB fields if querying frequently

---

## Examples

### Complete Order Lifecycle

#### 1. Create Order

```bash
curl -X POST "https://api.vhvplatform.com/v1/subscription-orders" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
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
  }'
```

**Response:**
```json
{
  "_id": "01934c8f-1a2b-7c3d-8e4f-5a6b7c8d9e0f",
  "order_number": "ORD-20260114-789012",
  "status": "PENDING",
  "version": 1
}
```

#### 2. Process Payment

```bash
curl -X POST "https://api.vhvplatform.com/v1/subscription-orders/01934c8f-1a2b-7c3d-8e4f-5a6b7c8d9e0f/pay" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "payment_method": "CREDIT_CARD",
    "payment_data": {
      "card_last4": "4242",
      "transaction_id": "txn_abc123"
    }
  }'
```

**Response:**
```json
{
  "_id": "01934c8f-1a2b-7c3d-8e4f-5a6b7c8d9e0f",
  "order_number": "ORD-20260114-789012",
  "status": "PAID",
  "payment_method": "CREDIT_CARD",
  "version": 2
}
```

#### 3. Get Order Details

```bash
curl -X GET "https://api.vhvplatform.com/v1/subscription-orders/01934c8f-1a2b-7c3d-8e4f-5a6b7c8d9e0f/details" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-14 | Initial release with 10 endpoints |

---

## Support

For API support, contact:
- **Email:** api-support@vhvplatform.com
- **Documentation:** https://docs.vhvplatform.com
- **Status Page:** https://status.vhvplatform.com

---

**✅ API Reference Complete - 1,200+ lines**

*Last updated: 2026-01-14*
