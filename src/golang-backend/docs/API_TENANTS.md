# Tenant Management API Documentation

## Overview
RESTful API for managing multi-tenant SaaS organizations, subscriptions, and usage metrics.

**Base URL**: `http://localhost:8080/api/v1`

---

## Authentication
All endpoints require JWT Bearer token in Authorization header:
```
Authorization: Bearer <jwt_token>
```

---

## Endpoints

### 1. Get All Tenants
**GET** `/tenants`

Retrieve list of all tenants with optional filtering and pagination.

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | integer | No | Page number (default: 1) |
| `limit` | integer | No | Items per page (default: 20, max: 100) |
| `status` | string | No | Filter by status: `active`, `trial`, `suspended`, `cancelled` |
| `tier` | string | No | Filter by tier: `free`, `starter`, `professional`, `enterprise` |
| `search` | string | No | Search in name, slug, email |
| `sort` | string | No | Sort field: `name`, `createdAt`, `updatedAt` |
| `order` | string | No | Sort order: `asc`, `desc` (default: `desc`) |

#### Response 200 OK
```json
{
  "success": true,
  "data": {
    "tenants": [
      {
        "id": "tenant-1704672000000",
        "name": "Acme Corporation",
        "slug": "acme-corp",
        "domain": "acme.example.com",
        "subscriptionTier": "enterprise",
        "subscriptionEndDate": "2026-12-31T23:59:59Z",
        "status": "active",
        "maxUsers": 100,
        "currentUsers": 45,
        "maxStorage": 500,
        "currentStorage": 234.5,
        "billingEmail": "billing@acme.com",
        "phone": "+1-555-0100",
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2025-01-05T14:20:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

---

### 2. Get Tenant by ID
**GET** `/tenants/:id`

Retrieve detailed information about a specific tenant.

#### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Tenant ID |

#### Response 200 OK
```json
{
  "success": true,
  "data": {
    "id": "tenant-1704672000000",
    "name": "Acme Corporation",
    "slug": "acme-corp",
    "domain": "acme.example.com",
    "subscriptionTier": "enterprise",
    "subscriptionEndDate": "2026-12-31T23:59:59Z",
    "status": "active",
    "maxUsers": 100,
    "currentUsers": 45,
    "maxStorage": 500,
    "currentStorage": 234.5,
    "billingEmail": "billing@acme.com",
    "phone": "+1-555-0100",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2025-01-05T14:20:00Z"
  }
}
```

#### Response 404 Not Found
```json
{
  "success": false,
  "error": {
    "code": "TENANT_NOT_FOUND",
    "message": "Tenant with ID 'tenant-xyz' not found"
  }
}
```

---

### 3. Create Tenant
**POST** `/tenants`

Create a new tenant organization.

#### Request Body
```json
{
  "name": "New Company Inc",
  "slug": "new-company",
  "domain": "newcompany.com",
  "subscriptionTier": "starter",
  "maxUsers": 10,
  "maxStorage": 10,
  "billingEmail": "billing@newcompany.com",
  "phone": "+1-555-0200",
  "subscriptionEndDate": "2026-01-31T23:59:59Z"
}
```

#### Validation Rules
| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `name` | string | Yes | Min: 2, Max: 100 characters |
| `slug` | string | Yes | Unique, lowercase, alphanumeric + hyphens only |
| `domain` | string | No | Valid domain format |
| `subscriptionTier` | string | Yes | Enum: `free`, `starter`, `professional`, `enterprise` |
| `maxUsers` | integer | Yes | Min: 1, Max: 10000 |
| `maxStorage` | integer | Yes | Min: 1 (GB) |
| `billingEmail` | string | Yes | Valid email format, unique |
| `phone` | string | No | Valid phone format |
| `subscriptionEndDate` | string | No | ISO 8601 date, future date |

#### Response 201 Created
```json
{
  "success": true,
  "data": {
    "id": "tenant-1736323200000",
    "name": "New Company Inc",
    "slug": "new-company",
    "domain": "newcompany.com",
    "subscriptionTier": "starter",
    "subscriptionEndDate": "2026-01-31T23:59:59Z",
    "status": "trial",
    "maxUsers": 10,
    "currentUsers": 0,
    "maxStorage": 10,
    "currentStorage": 0,
    "billingEmail": "billing@newcompany.com",
    "phone": "+1-555-0200",
    "createdAt": "2026-01-08T10:00:00Z",
    "updatedAt": "2026-01-08T10:00:00Z"
  }
}
```

#### Response 400 Bad Request
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "slug",
        "message": "Slug must contain only lowercase letters, numbers, and hyphens"
      },
      {
        "field": "billingEmail",
        "message": "Email address is already in use"
      }
    ]
  }
}
```

---

### 4. Update Tenant
**PUT** `/tenants/:id`

Update an existing tenant's information.

#### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Tenant ID |

#### Request Body
```json
{
  "name": "Acme Corporation Ltd",
  "domain": "acme-new.example.com",
  "subscriptionTier": "professional",
  "maxUsers": 150,
  "maxStorage": 750,
  "billingEmail": "billing@acme-new.com",
  "phone": "+1-555-0101",
  "subscriptionEndDate": "2027-12-31T23:59:59Z"
}
```

#### Response 200 OK
```json
{
  "success": true,
  "data": {
    "id": "tenant-1704672000000",
    "name": "Acme Corporation Ltd",
    "slug": "acme-corp",
    "domain": "acme-new.example.com",
    "subscriptionTier": "professional",
    "subscriptionEndDate": "2027-12-31T23:59:59Z",
    "status": "active",
    "maxUsers": 150,
    "currentUsers": 45,
    "maxStorage": 750,
    "currentStorage": 234.5,
    "billingEmail": "billing@acme-new.com",
    "phone": "+1-555-0101",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2026-01-08T11:15:00Z"
  }
}
```

---

### 5. Update Tenant Status
**PATCH** `/tenants/:id/status`

Update tenant status (activate, suspend, cancel).

#### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Tenant ID |

#### Request Body
```json
{
  "status": "suspended",
  "reason": "Payment overdue"
}
```

#### Valid Status Transitions
- `trial` → `active`, `cancelled`
- `active` → `suspended`, `cancelled`
- `suspended` → `active`, `cancelled`
- `cancelled` → (no transitions allowed)

#### Response 200 OK
```json
{
  "success": true,
  "data": {
    "id": "tenant-1704672000000",
    "status": "suspended",
    "updatedAt": "2026-01-08T11:30:00Z"
  }
}
```

---

### 6. Delete Tenant
**DELETE** `/tenants/:id`

Permanently delete a tenant (soft delete recommended in production).

#### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Tenant ID |

#### Response 200 OK
```json
{
  "success": true,
  "message": "Tenant successfully deleted"
}
```

#### Response 409 Conflict
```json
{
  "success": false,
  "error": {
    "code": "TENANT_HAS_ACTIVE_USERS",
    "message": "Cannot delete tenant with active users. Please remove all users first."
  }
}
```

---

### 7. Get Tenant Analytics
**GET** `/tenants/analytics`

Retrieve aggregated analytics across all tenants.

#### Response 200 OK
```json
{
  "success": true,
  "data": {
    "totalTenants": 150,
    "activeTenants": 120,
    "trialTenants": 25,
    "suspendedTenants": 5,
    "totalRevenue": 245000.00,
    "mrr": 20416.67,
    "arr": 245000.00,
    "averageUsersPerTenant": 42.5,
    "totalStorageUsed": 12450.75,
    "subscriptionBreakdown": {
      "free": 30,
      "starter": 60,
      "professional": 45,
      "enterprise": 15
    }
  }
}
```

---

### 8. Get Tenant Usage Metrics
**GET** `/tenants/:id/usage`

Retrieve usage metrics for a specific tenant.

#### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Tenant ID |

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `days` | integer | No | Number of days (default: 30, max: 365) |

#### Response 200 OK
```json
{
  "success": true,
  "data": {
    "metrics": [
      {
        "date": "2026-01-07",
        "users": 45,
        "storage": 234.5,
        "apiCalls": 12450,
        "bandwidth": 125.3
      },
      {
        "date": "2026-01-08",
        "users": 46,
        "storage": 235.2,
        "apiCalls": 13200,
        "bandwidth": 132.1
      }
    ],
    "summary": {
      "avgUsers": 45.5,
      "avgStorage": 234.85,
      "totalApiCalls": 25650,
      "totalBandwidth": 257.4
    }
  }
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `UNAUTHORIZED` | 401 | Invalid or missing authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `TENANT_NOT_FOUND` | 404 | Tenant does not exist |
| `SLUG_ALREADY_EXISTS` | 409 | Slug is already in use |
| `EMAIL_ALREADY_EXISTS` | 409 | Email is already in use |
| `TENANT_HAS_ACTIVE_USERS` | 409 | Cannot delete tenant with users |
| `INVALID_STATUS_TRANSITION` | 422 | Status transition not allowed |
| `INTERNAL_SERVER_ERROR` | 500 | Server error |

---

## Rate Limiting
- **Standard**: 100 requests per minute
- **Burst**: 200 requests per minute
- Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

---

## Webhooks
Events are sent to configured webhook URLs:

### Events
- `tenant.created`
- `tenant.updated`
- `tenant.status_changed`
- `tenant.deleted`
- `tenant.usage_threshold_exceeded`

### Webhook Payload Example
```json
{
  "event": "tenant.status_changed",
  "timestamp": "2026-01-08T11:30:00Z",
  "data": {
    "tenantId": "tenant-1704672000000",
    "previousStatus": "active",
    "newStatus": "suspended",
    "reason": "Payment overdue"
  }
}
```
