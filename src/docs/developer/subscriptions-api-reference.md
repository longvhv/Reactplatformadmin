# 📘 Tenant Subscriptions API Reference

## Overview

**Base URL:** `/api/v1/subscriptions`  
**Version:** 1.0.0  
**Authentication:** Required (Bearer Token)

The Tenant Subscriptions API allows you to manage subscription relationships between tenants and service packages, including entitlements, access control, renewal, and cancellation.

---

## Table of Contents

1. [Endpoints Overview](#endpoints-overview)
2. [Data Models](#data-models)
3. [CRUD Operations](#crud-operations)
4. [Detail Operations](#detail-operations)
5. [Error Handling](#error-handling)
6. [Examples](#examples)

---

## Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| **GET** | `/subscriptions` | List all subscriptions with filters |
| **GET** | `/subscriptions/:id` | Get subscription by ID |
| **POST** | `/subscriptions` | Create new subscription |
| **PATCH** | `/subscriptions/:id` | Update subscription |
| **DELETE** | `/subscriptions/:id` | Delete (soft) subscription |
| **GET** | `/subscriptions/:id/details` | Get subscription with full details |
| **GET** | `/subscriptions/:id/usage` | Get subscription usage statistics |
| **POST** | `/subscriptions/:id/cancel` | Cancel subscription |
| **POST** | `/subscriptions/:id/renew` | Renew subscription |
| **GET** | `/subscriptions/check-access` | Check app access |
| **GET** | `/subscriptions/expiring` | Get expiring subscriptions |

---

## Data Models

### TenantSubscription

```json
{
  "_id": "01HN2K3M4P5Q6R7S8T9V0W1X2",
  "tenant_id": "01HN2K3M4P5Q6R7S8T9V0W1X3",
  "package_id": "01HN2K3M4P5Q6R7S8T9V0W1X4",
  "price_amount": 1000000.0000,
  "currency_code": "VND",
  "granted_entitlements": {
    "HRM_APP": {
      "max_users": 100,
      "features": ["attendance", "payroll", "leave"]
    },
    "CRM_APP": {
      "max_contacts": 5000,
      "features": ["pipeline", "automation"]
    }
  },
  "granted_app_codes": ["HRM_APP", "CRM_APP"],
  "start_at": "2024-01-01T00:00:00Z",
  "end_at": "2025-01-01T00:00:00Z",
  "status": "ACTIVE",
  "version": 1,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z",
  "deleted_at": null
}
```

### SubscriptionWithDetails

Extends `TenantSubscription` with additional fields:

```json
{
  // ... all TenantSubscription fields
  "tenant_name": "ACME Corporation",
  "package_code": "ENT-ANNUAL",
  "package_name": "Enterprise Annual Plan",
  "package_billing_cycle": "ANNUAL",
  "product_name": "Business Suite",
  "days_remaining": 90,
  "is_expired": false
}
```

### SubscriptionUsageStats

```json
{
  "subscription_id": "01HN2K3M4P5Q6R7S8T9V0W1X2",
  "tenant_id": "01HN2K3M4P5Q6R7S8T9V0W1X3",
  "package_id": "01HN2K3M4P5Q6R7S8T9V0W1X4",
  "status": "ACTIVE",
  "start_date": "2024-01-01T00:00:00Z",
  "end_date": "2025-01-01T00:00:00Z",
  "days_active": 275,
  "days_remaining": 90,
  "entitlements_used": {
    "HRM_APP": { "users_count": 87 }
  },
  "total_spent": 1000000.0000
}
```

---

## CRUD Operations

### 1. List Subscriptions

**Endpoint:** `GET /subscriptions`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tenant_id` | UUID | No | Filter by tenant ID |
| `package_id` | UUID | No | Filter by package ID |
| `status` | String | No | Filter by status (ACTIVE, EXPIRED, CANCELLED, PAST_DUE) |
| `limit` | Integer | No | Number of results (default: 50) |
| `offset` | Integer | No | Offset for pagination (default: 0) |

**Request Example:**

```bash
GET /api/v1/subscriptions?tenant_id=01HN2K3M4P5Q6R7S8T9V0W1X3&status=ACTIVE&limit=10
```

**Response:** `200 OK`

```json
[
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
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
]
```

---

### 2. Get Subscription by ID

**Endpoint:** `GET /subscriptions/:id`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | Subscription ID |

**Request Example:**

```bash
GET /api/v1/subscriptions/01HN2K3M4P5Q6R7S8T9V0W1X2
```

**Response:** `200 OK`

```json
{
  "_id": "01HN2K3M4P5Q6R7S8T9V0W1X2",
  "tenant_id": "01HN2K3M4P5Q6R7S8T9V0W1X3",
  "package_id": "01HN2K3M4P5Q6R7S8T9V0W1X4",
  "price_amount": 1000000.0000,
  "currency_code": "VND",
  "granted_entitlements": {
    "HRM_APP": {
      "max_users": 100,
      "features": ["attendance", "payroll"]
    }
  },
  "granted_app_codes": ["HRM_APP"],
  "start_at": "2024-01-01T00:00:00Z",
  "end_at": "2025-01-01T00:00:00Z",
  "status": "ACTIVE",
  "version": 1,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

**Error Responses:**

- `404 Not Found` - Subscription not found
- `400 Bad Request` - Invalid subscription ID format

---

### 3. Create Subscription

**Endpoint:** `POST /subscriptions`

**Request Body:**

```json
{
  "tenant_id": "01HN2K3M4P5Q6R7S8T9V0W1X3",
  "package_id": "01HN2K3M4P5Q6R7S8T9V0W1X4",
  "price_amount": 1000000.0000,  // Optional, defaults to package price
  "currency_code": "VND",         // Optional, defaults to package currency
  "granted_entitlements": {...},  // Optional, defaults to package entitlements
  "start_at": "2024-01-01T00:00:00Z",  // Optional, defaults to NOW()
  "end_at": "2025-01-01T00:00:00Z"     // Optional, null = lifetime
}
```

**Required Fields:**

- `tenant_id` - Must be valid tenant ID
- `package_id` - Must be valid active package ID

**Request Example:**

```bash
POST /api/v1/subscriptions
Content-Type: application/json

{
  "tenant_id": "01HN2K3M4P5Q6R7S8T9V0W1X3",
  "package_id": "01HN2K3M4P5Q6R7S8T9V0W1X4"
}
```

**Response:** `201 Created`

```json
{
  "_id": "01HN2K3M4P5Q6R7S8T9V0W1X2",
  "tenant_id": "01HN2K3M4P5Q6R7S8T9V0W1X3",
  "package_id": "01HN2K3M4P5Q6R7S8T9V0W1X4",
  "price_amount": 1000000.0000,
  "currency_code": "VND",
  "granted_entitlements": {...},
  "granted_app_codes": ["HRM_APP"],
  "start_at": "2024-01-01T00:00:00Z",
  "end_at": null,
  "status": "ACTIVE",
  "version": 1,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

**Error Responses:**

- `400 Bad Request` - Invalid request data or tenant/package not found
- `500 Internal Server Error` - Failed to create subscription

**Business Logic:**

1. **Validates tenant exists** and is not deleted
2. **Validates package exists**, is active, and not deleted
3. **Auto-snapshots** price, currency, and entitlements from package
4. **Auto-generates** `granted_app_codes` from entitlements JSONB
5. Sets `status = 'ACTIVE'` by default

---

### 4. Update Subscription

**Endpoint:** `PATCH /subscriptions/:id`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | Subscription ID |

**Request Body (all fields optional):**

```json
{
  "status": "ACTIVE",  // ACTIVE, EXPIRED, CANCELLED, PAST_DUE
  "end_at": "2025-06-01T00:00:00Z",
  "granted_entitlements": {...}
}
```

**Request Example:**

```bash
PATCH /api/v1/subscriptions/01HN2K3M4P5Q6R7S8T9V0W1X2
Content-Type: application/json

{
  "status": "PAST_DUE"
}
```

**Response:** `200 OK`

```json
{
  "message": "Subscription updated successfully",
  "updated_at": "2024-10-03T12:00:00Z"
}
```

**Error Responses:**

- `400 Bad Request` - Invalid status or no fields to update
- `404 Not Found` - Subscription not found
- `500 Internal Server Error` - Failed to update

**Business Logic:**

- Increments `version` for optimistic locking
- Updates `updated_at` timestamp
- Validates status enum

---

### 5. Delete Subscription

**Endpoint:** `DELETE /subscriptions/:id`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | Subscription ID |

**Request Example:**

```bash
DELETE /api/v1/subscriptions/01HN2K3M4P5Q6R7S8T9V0W1X2
```

**Response:** `200 OK`

```json
{
  "message": "Subscription cancelled successfully"
}
```

**Error Responses:**

- `404 Not Found` - Subscription not found or already deleted
- `500 Internal Server Error` - Failed to delete

**Business Logic:**

- **Soft delete** - Sets `deleted_at = NOW()`
- Sets `status = 'CANCELLED'`
- Updates `updated_at`
- Does NOT physically delete record

---

## Detail Operations

### 6. Get Subscription with Details

**Endpoint:** `GET /subscriptions/:id/details`

**Description:** Returns subscription with tenant, package, and product information via JOINs.

**Request Example:**

```bash
GET /api/v1/subscriptions/01HN2K3M4P5Q6R7S8T9V0W1X2/details
```

**Response:** `200 OK`

```json
{
  "_id": "01HN2K3M4P5Q6R7S8T9V0W1X2",
  "tenant_id": "01HN2K3M4P5Q6R7S8T9V0W1X3",
  "package_id": "01HN2K3M4P5Q6R7S8T9V0W1X4",
  "price_amount": 1000000.0000,
  "currency_code": "VND",
  "granted_entitlements": {...},
  "granted_app_codes": ["HRM_APP"],
  "start_at": "2024-01-01T00:00:00Z",
  "end_at": "2025-01-01T00:00:00Z",
  "status": "ACTIVE",
  "version": 1,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z",
  
  // Additional fields from JOINs
  "tenant_name": "ACME Corporation",
  "package_code": "ENT-ANNUAL",
  "package_name": "Enterprise Annual Plan",
  "package_billing_cycle": "ANNUAL",
  "product_name": "Business Suite",
  "days_remaining": 90,
  "is_expired": false
}
```

**SQL Query:**

```sql
SELECT 
  ts.*,
  t.name as tenant_name,
  sp.code as package_code,
  sp.name as package_name,
  sp.billing_cycle as package_billing_cycle,
  p.name as product_name,
  EXTRACT(DAY FROM (ts.end_at - NOW()))::int as days_remaining,
  (ts.end_at < NOW()) as is_expired
FROM tenant_subscriptions ts
JOIN tenants t ON ts.tenant_id = t._id
JOIN service_packages sp ON ts.package_id = sp._id
JOIN products p ON sp.product_id = p._id
WHERE ts._id = $1 AND ts.deleted_at IS NULL
```

---

### 7. Get Subscription Usage Statistics

**Endpoint:** `GET /subscriptions/:id/usage`

**Description:** Returns detailed usage statistics for analytics.

**Request Example:**

```bash
GET /api/v1/subscriptions/01HN2K3M4P5Q6R7S8T9V0W1X2/usage
```

**Response:** `200 OK`

```json
{
  "subscription_id": "01HN2K3M4P5Q6R7S8T9V0W1X2",
  "tenant_id": "01HN2K3M4P5Q6R7S8T9V0W1X3",
  "package_id": "01HN2K3M4P5Q6R7S8T9V0W1X4",
  "status": "ACTIVE",
  "start_date": "2024-01-01T00:00:00Z",
  "end_date": "2025-01-01T00:00:00Z",
  "days_active": 275,
  "days_remaining": 90,
  "entitlements_used": {
    "HRM_APP": {
      "max_users": 100,
      "current_users": 87
    }
  },
  "total_spent": 1000000.0000
}
```

**SQL Query:**

```sql
SELECT 
  _id, tenant_id, package_id, status, start_at, end_at,
  granted_entitlements, price_amount,
  EXTRACT(DAY FROM (NOW() - start_at))::int as days_active,
  EXTRACT(DAY FROM (end_at - NOW()))::int as days_remaining
FROM tenant_subscriptions
WHERE _id = $1 AND deleted_at IS NULL
```

---

### 8. Cancel Subscription

**Endpoint:** `POST /subscriptions/:id/cancel`

**Description:** Cancels an active subscription immediately.

**Request Example:**

```bash
POST /api/v1/subscriptions/01HN2K3M4P5Q6R7S8T9V0W1X2/cancel
```

**Response:** `200 OK`

```json
{
  "message": "Subscription cancelled successfully",
  "status": "CANCELLED",
  "end_at": "2024-10-03T12:00:00Z",
  "updated_at": "2024-10-03T12:00:00Z"
}
```

**Error Responses:**

- `404 Not Found` - Subscription not found or already cancelled
- `500 Internal Server Error` - Failed to cancel

**Business Logic:**

1. Sets `status = 'CANCELLED'`
2. Sets `end_at = NOW()`
3. Increments `version`
4. Updates `updated_at`
5. Only cancels if current `status = 'ACTIVE'`

**SQL Query:**

```sql
UPDATE tenant_subscriptions 
SET status = 'CANCELLED', 
    end_at = NOW(),
    updated_at = NOW(), 
    version = version + 1
WHERE _id = $1 AND deleted_at IS NULL AND status = 'ACTIVE'
RETURNING status, end_at, updated_at
```

---

### 9. Renew Subscription

**Endpoint:** `POST /subscriptions/:id/renew`

**Description:** Extends subscription for additional months.

**Request Body:**

```json
{
  "duration": 12,  // Number of months to extend
  "end_at": "2026-01-01T00:00:00Z"  // Optional explicit end date
}
```

**Request Example:**

```bash
POST /api/v1/subscriptions/01HN2K3M4P5Q6R7S8T9V0W1X2/renew
Content-Type: application/json

{
  "duration": 12
}
```

**Response:** `200 OK`

```json
{
  "message": "Subscription renewed successfully",
  "status": "ACTIVE",
  "end_at": "2026-01-01T00:00:00Z",
  "updated_at": "2024-10-03T12:00:00Z"
}
```

**Error Responses:**

- `400 Bad Request` - Invalid duration or request data
- `404 Not Found` - Subscription not found
- `500 Internal Server Error` - Failed to renew

**Business Logic:**

1. If `end_at > NOW()`: Extends from `end_at`
2. If `end_at <= NOW()` or NULL: Extends from `NOW()`
3. Sets `status = 'ACTIVE'`
4. Calculates `new_end_at = base_date + duration months`

**Renewal Logic:**

```go
baseDate := time.Now()
if currentEndAt != nil && currentEndAt.After(time.Now()) {
    baseDate = *currentEndAt
}
newEndAt := baseDate.AddDate(0, duration, 0)
```

---

### 10. Check App Access

**Endpoint:** `GET /subscriptions/check-access`

**Description:** Checks if tenant has access to specific app. Ultra-fast via GIN index.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tenant_id` | UUID | Yes | Tenant ID |
| `app_code` | String | Yes | App code (e.g., "HRM_APP") |

**Request Example:**

```bash
GET /api/v1/subscriptions/check-access?tenant_id=01HN2K3M4P5Q6R7S8T9V0W1X3&app_code=HRM_APP
```

**Response:** `200 OK`

```json
{
  "tenant_id": "01HN2K3M4P5Q6R7S8T9V0W1X3",
  "app_code": "HRM_APP",
  "has_access": true
}
```

**SQL Query (GIN Index Optimized):**

```sql
SELECT EXISTS(
  SELECT 1 FROM tenant_subscriptions
  WHERE tenant_id = $1 
  AND status = 'ACTIVE'
  AND deleted_at IS NULL
  AND $2 = ANY(granted_app_codes)  -- Uses GIN index
  AND (end_at IS NULL OR end_at > NOW())
)
```

**Performance:** < 1ms with GIN index on `granted_app_codes`

---

### 11. Get Expiring Subscriptions

**Endpoint:** `GET /subscriptions/expiring`

**Description:** Returns subscriptions expiring within specified days.

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `days` | Integer | No | 30 | Days until expiry |

**Request Example:**

```bash
GET /api/v1/subscriptions/expiring?days=30
```

**Response:** `200 OK`

```json
[
  {
    "_id": "01HN2K3M4P5Q6R7S8T9V0W1X2",
    "tenant_id": "01HN2K3M4P5Q6R7S8T9V0W1X3",
    "package_id": "01HN2K3M4P5Q6R7S8T9V0W1X4",
    "price_amount": 1000000.0000,
    "currency_code": "VND",
    "granted_entitlements": {...},
    "granted_app_codes": ["HRM_APP"],
    "start_at": "2024-01-01T00:00:00Z",
    "end_at": "2024-11-01T00:00:00Z",
    "status": "ACTIVE",
    "version": 1,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z",
    
    "tenant_name": "ACME Corporation",
    "package_code": "ENT-ANNUAL",
    "package_name": "Enterprise Annual Plan",
    "days_remaining": 29
  }
]
```

**SQL Query:**

```sql
SELECT 
  ts.*,
  t.name as tenant_name,
  sp.code as package_code,
  sp.name as package_name,
  EXTRACT(DAY FROM (ts.end_at - NOW()))::int as days_remaining
FROM tenant_subscriptions ts
JOIN tenants t ON ts.tenant_id = t._id
JOIN service_packages sp ON ts.package_id = sp._id
WHERE ts.deleted_at IS NULL
AND ts.status = 'ACTIVE'
AND ts.end_at IS NOT NULL
AND ts.end_at BETWEEN NOW() AND NOW() + INTERVAL '$1 days'
ORDER BY ts.end_at ASC
```

---

## Error Handling

### Standard Error Response

```json
{
  "error": "Detailed error message"
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| `200` | Success |
| `201` | Created successfully |
| `400` | Bad request - Invalid input data |
| `404` | Not found - Resource doesn't exist |
| `500` | Internal server error |

### Common Error Messages

```json
// Invalid UUID format
{
  "error": "Invalid subscription ID format"
}

// Subscription not found
{
  "error": "Subscription not found"
}

// Tenant not found during creation
{
  "error": "Tenant not found or inactive"
}

// Package not found during creation
{
  "error": "Package not found or inactive"
}

// Invalid status
{
  "error": "Invalid status"
}

// No fields to update
{
  "error": "No fields to update"
}
```

---

## Examples

### Example 1: Create Subscription with Auto-Snapshot

```bash
# Request
POST /api/v1/subscriptions
Content-Type: application/json

{
  "tenant_id": "01HN2K3M4P5Q6R7S8T9V0W1X3",
  "package_id": "01HN2K3M4P5Q6R7S8T9V0W1X4"
}

# Response
{
  "_id": "01HN2K3M4P5Q6R7S8T9V0W1X2",
  "tenant_id": "01HN2K3M4P5Q6R7S8T9V0W1X3",
  "package_id": "01HN2K3M4P5Q6R7S8T9V0W1X4",
  "price_amount": 1000000.0000,      // Auto-snapshot from package
  "currency_code": "VND",              // Auto-snapshot from package
  "granted_entitlements": {            // Auto-snapshot from package
    "HRM_APP": {
      "max_users": 100,
      "features": ["attendance", "payroll"]
    }
  },
  "granted_app_codes": ["HRM_APP"],    // Auto-generated from JSONB
  "start_at": "2024-10-03T12:00:00Z",  // Auto-set to NOW()
  "end_at": null,                       // Lifetime subscription
  "status": "ACTIVE",
  "version": 1,
  "created_at": "2024-10-03T12:00:00Z",
  "updated_at": "2024-10-03T12:00:00Z"
}
```

### Example 2: Check Access for App

```bash
# Request
GET /api/v1/subscriptions/check-access?tenant_id=01HN2K3M4P5Q6R7S8T9V0W1X3&app_code=HRM_APP

# Response (has access)
{
  "tenant_id": "01HN2K3M4P5Q6R7S8T9V0W1X3",
  "app_code": "HRM_APP",
  "has_access": true
}

# Response (no access)
{
  "tenant_id": "01HN2K3M4P5Q6R7S8T9V0W1X3",
  "app_code": "FINANCE_APP",
  "has_access": false
}
```

### Example 3: Renew Subscription

```bash
# Request
POST /api/v1/subscriptions/01HN2K3M4P5Q6R7S8T9V0W1X2/renew
Content-Type: application/json

{
  "duration": 12
}

# Response
{
  "message": "Subscription renewed successfully",
  "status": "ACTIVE",
  "end_at": "2026-01-01T00:00:00Z",  // Extended by 12 months
  "updated_at": "2024-10-03T12:00:00Z"
}
```

---

## Performance Optimization

### GIN Index for Access Checks

The `granted_app_codes` column is a **generated column** with a **GIN index** for ultra-fast array containment checks:

```sql
-- Generated column
granted_app_codes TEXT[] GENERATED ALWAYS AS (
    ARRAY(SELECT jsonb_object_keys(granted_entitlements))
) STORED

-- GIN Index
CREATE INDEX idx_subs_granted_apps 
ON tenant_subscriptions USING GIN (granted_app_codes);
```

**Query Performance:**

```sql
-- Ultra-fast: Uses GIN index
SELECT * FROM tenant_subscriptions 
WHERE 'HRM_APP' = ANY(granted_app_codes);

-- Execution time: < 1ms with millions of rows
```

### Partial Indexes

```sql
-- Active subscriptions by tenant
CREATE INDEX idx_subs_tenant_active 
ON tenant_subscriptions (tenant_id) 
WHERE status = 'ACTIVE' AND deleted_at IS NULL;

-- Expiry scanning
CREATE INDEX idx_subs_expiry_scan 
ON tenant_subscriptions (status, end_at) 
WHERE end_at IS NOT NULL;
```

---

## Best Practices

### 1. Always Snapshot Package Data

When creating subscriptions, price and entitlements are **immutable snapshots**:

```typescript
// ✅ Good: Package changes don't affect existing subscriptions
const subscription = await createSubscription({
  tenant_id: "...",
  package_id: "..."
  // Price/entitlements auto-snapshot at creation time
});
```

### 2. Use Check Access for Authorization

```typescript
// ✅ Good: Ultra-fast access check via GIN index
const { has_access } = await checkAccess(tenantId, "HRM_APP");
if (!has_access) {
  return res.status(403).json({ error: "Access denied" });
}
```

### 3. Handle Expiry Gracefully

```typescript
// ✅ Good: Fetch expiring subscriptions for renewal reminders
const expiring = await getExpiringSubscriptions(30);
expiring.forEach(sub => {
  sendRenewalReminder(sub.tenant_id, sub.days_remaining);
});
```

---

## Status Transitions

```
ACTIVE ──────┬──> EXPIRED (end_at < NOW)
             ├──> CANCELLED (manual cancel)
             └──> PAST_DUE (payment failed)

EXPIRED ─────> ACTIVE (renew)
CANCELLED ───> (No transition - terminal state)
PAST_DUE ────> ACTIVE (payment received)
```

---

**API Version:** 1.0.0  
**Last Updated:** January 2024  
**Maintainer:** Platform Team
