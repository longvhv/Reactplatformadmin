# Subscription Orders - API Documentation

## 📋 Overview

RESTful API documentation for **Subscription Orders** module.

**Base URL:** `/api/v1`

---

## 🔐 Authentication

All endpoints require authentication via Bearer token:

```http
Authorization: Bearer <your-access-token>
```

---

## 📍 Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/subscription-orders` | List all orders with filters |
| `GET` | `/subscription-orders/:id` | Get order by ID |
| `POST` | `/subscription-orders` | Create new order |
| `PATCH` | `/subscription-orders/:id` | Update order (optimistic locking) |
| `DELETE` | `/subscription-orders/:id` | Soft delete order |
| `GET` | `/tenants/:tenant_id/orders` | Get orders by tenant |
| `GET` | `/subscription-orders/statistics` | Get order statistics |

---

## 1. List All Orders

### Endpoint
```
GET /api/v1/subscription-orders
```

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | string | No | Filter by status (PENDING, PAID, CANCELLED, FAILED) |
| `tenant_id` | UUID | No | Filter by tenant ID |
| `search` | string | No | Search in order_number, tenant name, package name |
| `page` | integer | No | Page number (default: 1) |
| `limit` | integer | No | Items per page (default: 50) |

### Request Example

```bash
curl -X GET "http://localhost:8080/api/v1/subscription-orders?status=PENDING&page=1&limit=20" \
  -H "Authorization: Bearer <token>"
```

### Response Example

```json
[
  {
    "_id": "01940824-f123-7890-abcd-1234567890ab",
    "tenant_id": "01940821-1234-7890-abcd-tenant00001",
    "package_id": "01940822-5678-7890-abcd-package0001",
    "order_number": "ORD-2025-001234",
    "total_amount": 2990000,
    "currency_code": "VND",
    "status": "PENDING",
    "payment_method": null,
    "package_snapshot": {
      "_id": "01940822-5678-7890-abcd-package0001",
      "code": "hrm-pro",
      "name": "HRM Professional",
      "price_amount": 2990000,
      "currency_code": "VND",
      "billing_cycle": "MONTHLY"
    },
    "version": 1,
    "created_at": "2025-01-13T10:30:00Z",
    "updated_at": "2025-01-13T10:30:00Z",
    "deleted_at": null,
    "tenant_name": "Công ty ABC",
    "package_name": "HRM Professional",
    "package_code": "hrm-pro"
  }
]
```

### Response Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 401 | Unauthorized |
| 500 | Internal server error |

---

## 2. Get Order By ID

### Endpoint
```
GET /api/v1/subscription-orders/:id
```

### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | Order ID |

### Request Example

```bash
curl -X GET "http://localhost:8080/api/v1/subscription-orders/01940824-f123-7890-abcd-1234567890ab" \
  -H "Authorization: Bearer <token>"
```

### Response Example

```json
{
  "_id": "01940824-f123-7890-abcd-1234567890ab",
  "tenant_id": "01940821-1234-7890-abcd-tenant00001",
  "package_id": "01940822-5678-7890-abcd-package0001",
  "order_number": "ORD-2025-001234",
  "total_amount": 2990000,
  "currency_code": "VND",
  "status": "PAID",
  "payment_method": "CREDIT_CARD",
  "package_snapshot": {
    "_id": "01940822-5678-7890-abcd-package0001",
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
    "max_storage": 100
  },
  "version": 2,
  "created_at": "2025-01-13T10:30:00Z",
  "updated_at": "2025-01-13T11:45:00Z",
  "deleted_at": null,
  "tenant_name": "Công ty ABC",
  "package_name": "HRM Professional",
  "package_code": "hrm-pro"
}
```

### Response Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 404 | Order not found |
| 401 | Unauthorized |
| 500 | Internal server error |

---

## 3. Create Order

### Endpoint
```
POST /api/v1/subscription-orders
```

### Request Body

```json
{
  "tenant_id": "01940821-1234-7890-abcd-tenant00001",
  "package_id": "01940822-5678-7890-abcd-package0001",
  "order_number": "ORD-2025-001234",
  "total_amount": 2990000,
  "currency_code": "VND",
  "status": "PENDING",
  "payment_method": "CREDIT_CARD"
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `tenant_id` | UUID | Yes | Tenant who places the order |
| `package_id` | UUID | Yes | Service package being purchased |
| `order_number` | string | Yes | Unique order number (business key) |
| `total_amount` | number | Yes | Total order amount |
| `currency_code` | string | No | Currency code (default: VND) |
| `status` | string | No | Order status (default: PENDING) |
| `payment_method` | string | No | Payment method |

### Request Example

```bash
curl -X POST "http://localhost:8080/api/v1/subscription-orders" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "01940821-1234-7890-abcd-tenant00001",
    "package_id": "01940822-5678-7890-abcd-package0001",
    "order_number": "ORD-2025-001234",
    "total_amount": 2990000,
    "currency_code": "VND",
    "status": "PENDING"
  }'
```

### Response Example

```json
{
  "_id": "01940824-f123-7890-abcd-1234567890ab",
  "tenant_id": "01940821-1234-7890-abcd-tenant00001",
  "package_id": "01940822-5678-7890-abcd-package0001",
  "order_number": "ORD-2025-001234",
  "total_amount": 2990000,
  "currency_code": "VND",
  "status": "PENDING",
  "payment_method": null,
  "package_snapshot": {
    "_id": "01940822-5678-7890-abcd-package0001",
    "code": "hrm-pro",
    "name": "HRM Professional",
    "price_amount": 2990000
  },
  "version": 1,
  "created_at": "2025-01-13T10:30:00Z",
  "updated_at": "2025-01-13T10:30:00Z"
}
```

### Response Codes

| Code | Description |
|------|-------------|
| 201 | Created successfully |
| 400 | Invalid request body / Missing required fields |
| 401 | Unauthorized |
| 409 | Duplicate order_number |
| 500 | Internal server error |

### Notes
- ✅ **Package snapshot** is automatically captured from `service_packages` table
- ✅ System generates UUID v7 for `_id`
- ✅ `version` starts at 1
- ✅ `created_at` and `updated_at` are set to current timestamp

---

## 4. Update Order

### Endpoint
```
PATCH /api/v1/subscription-orders/:id
```

### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | Order ID |

### Request Body

```json
{
  "total_amount": 2990000,
  "status": "PAID",
  "payment_method": "CREDIT_CARD",
  "version": 1
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `total_amount` | number | No | New total amount |
| `status` | string | No | New status (PENDING, PAID, CANCELLED, FAILED) |
| `payment_method` | string | No | Payment method |
| `version` | number | **Yes** | Current version for optimistic locking |

### Request Example

```bash
curl -X PATCH "http://localhost:8080/api/v1/subscription-orders/01940824-f123-7890-abcd-1234567890ab" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "PAID",
    "payment_method": "CREDIT_CARD",
    "version": 1
  }'
```

### Response Example

```json
{
  "_id": "01940824-f123-7890-abcd-1234567890ab",
  "version": 2,
  "updated_at": "2025-01-13T11:45:00Z"
}
```

### Response Codes

| Code | Description |
|------|-------------|
| 200 | Updated successfully |
| 400 | Invalid request body |
| 404 | Order not found |
| 409 | **Version conflict** (order was modified by another user) |
| 401 | Unauthorized |
| 500 | Internal server error |

### Optimistic Locking

```
Client A reads order (version = 1)
Client B reads order (version = 1)

Client A updates (version = 1) ✓ → version becomes 2
Client B updates (version = 1) ✗ → 409 Conflict

Client B must re-fetch order (version = 2) and retry
```

---

## 5. Soft Delete Order

### Endpoint
```
DELETE /api/v1/subscription-orders/:id
```

### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | Order ID |

### Request Example

```bash
curl -X DELETE "http://localhost:8080/api/v1/subscription-orders/01940824-f123-7890-abcd-1234567890ab" \
  -H "Authorization: Bearer <token>"
```

### Response

```
204 No Content
```

### Response Codes

| Code | Description |
|------|-------------|
| 204 | Deleted successfully |
| 404 | Order not found or already deleted |
| 401 | Unauthorized |
| 500 | Internal server error |

### Notes
- ✅ This is a **soft delete**: sets `deleted_at = NOW()`
- ✅ Order remains in database but is hidden from queries
- ✅ Can be restored by setting `deleted_at = NULL` (via admin tools)

---

## 6. Get Orders By Tenant

### Endpoint
```
GET /api/v1/tenants/:tenant_id/orders
```

### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tenant_id` | UUID | Yes | Tenant ID |

### Request Example

```bash
curl -X GET "http://localhost:8080/api/v1/tenants/01940821-1234-7890-abcd-tenant00001/orders" \
  -H "Authorization: Bearer <token>"
```

### Response Example

```json
[
  {
    "_id": "01940824-f123-7890-abcd-1234567890ab",
    "tenant_id": "01940821-1234-7890-abcd-tenant00001",
    "order_number": "ORD-2025-001234",
    "total_amount": 2990000,
    "currency_code": "VND",
    "status": "PAID",
    "created_at": "2025-01-13T10:30:00Z",
    "package_name": "HRM Professional"
  },
  {
    "_id": "01940825-abcd-7890-abcd-1234567890cd",
    "tenant_id": "01940821-1234-7890-abcd-tenant00001",
    "order_number": "ORD-2025-001235",
    "total_amount": 990000,
    "currency_code": "VND",
    "status": "PENDING",
    "created_at": "2025-01-12T09:15:00Z",
    "package_name": "HRM Starter"
  }
]
```

### Response Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 401 | Unauthorized |
| 500 | Internal server error |

---

## 7. Get Order Statistics

### Endpoint
```
GET /api/v1/subscription-orders/statistics
```

### Request Example

```bash
curl -X GET "http://localhost:8080/api/v1/subscription-orders/statistics" \
  -H "Authorization: Bearer <token>"
```

### Response Example

```json
{
  "total_orders": 1523,
  "orders_by_status": {
    "PENDING": 127,
    "PAID": 1245,
    "CANCELLED": 98,
    "FAILED": 53
  },
  "total_revenue": 3728500000,
  "revenue_by_currency": {
    "VND": 3728500000,
    "USD": 125000
  },
  "average_order_value": 2447458.31,
  "pending_orders_count": 127
}
```

### Response Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 401 | Unauthorized |
| 500 | Internal server error |

---

## 🔍 Common Patterns

### Pattern 1: Create Order → Confirm Payment → Create Subscription

```bash
# Step 1: Create order
POST /api/v1/subscription-orders
{
  "tenant_id": "...",
  "package_id": "...",
  "order_number": "ORD-2025-001234",
  "total_amount": 2990000,
  "status": "PENDING"
}

# Step 2: Payment gateway callback → Update order
PATCH /api/v1/subscription-orders/{order_id}
{
  "status": "PAID",
  "payment_method": "CREDIT_CARD",
  "version": 1
}

# Step 3: Create subscription using package_snapshot
POST /api/v1/tenant-subscriptions
{
  "tenant_id": "...",
  "package_id": "...",
  "order_id": "{order_id}",
  "start_at": "2025-01-13T00:00:00Z",
  "end_at": "2025-02-13T00:00:00Z",
  "package_snapshot": "{from order.package_snapshot}"
}
```

### Pattern 2: Search Orders

```bash
# By order number
GET /api/v1/subscription-orders?search=ORD-2025-001234

# By tenant
GET /api/v1/tenants/{tenant_id}/orders

# By status
GET /api/v1/subscription-orders?status=PENDING
```

### Pattern 3: Revenue Reports

```bash
# Get statistics
GET /api/v1/subscription-orders/statistics

# Custom revenue query (via SQL)
SELECT 
  DATE_TRUNC('month', created_at) AS month,
  currency_code,
  SUM(total_amount) AS revenue
FROM subscription_orders
WHERE status = 'PAID' AND deleted_at IS NULL
GROUP BY month, currency_code
ORDER BY month DESC;
```

---

## ⚠️ Error Responses

### 400 Bad Request
```json
{
  "error": "Missing required fields: tenant_id, package_id, order_number"
}
```

### 404 Not Found
```json
{
  "error": "Order not found"
}
```

### 409 Conflict
```json
{
  "error": "Version conflict: order has been modified by another user"
}
```

### 500 Internal Server Error
```json
{
  "error": "Database error: connection timeout"
}
```

---

## 📚 Related Documentation

- [Orders Schema](./ORDERS_SCHEMA.md)
- [Orders Use Cases](./ORDERS_USECASES.md)
- [Orders UI Components](./ORDERS_UI_COMPONENTS.md)

---

**Version:** 1.0.0  
**Last Updated:** 2025-01-13  
**Maintainer:** VHV Platform Team
