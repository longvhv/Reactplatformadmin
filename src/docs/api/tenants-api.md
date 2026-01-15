# Tenants API Documentation

## Overview
API để quản lý Tenants (Multi-tenancy SaaS Platform)

**Base URL:** `/api/v1/tenants`

---

## Endpoints

### 1. List Tenants
```http
GET /api/v1/tenants
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| status | string | No | Filter by status: TRIAL, ACTIVE, SUSPENDED, CANCELLED |
| tier | string | No | Filter by tier: FREE, PRO, ENTERPRISE, PARTNER_* |
| data_region | string | No | Filter by region: ap-southeast-1, us-east-1, eu-central-1 |
| search | string | No | Search in name or code |

**Response:** `200 OK`
```json
[
  {
    "_id": "550e8400-e29b-41d4-a716-446655440000",
    "code": "acme-corp",
    "name": "ACME Corporation",
    "tier": "ENTERPRISE",
    "status": "ACTIVE",
    "data_region": "ap-southeast-1",
    "compliance_level": "STANDARD",
    "billing_type": "POSTPAID",
    "timezone": "Asia/Ho_Chi_Minh",
    "profile": {
      "company_name": "ACME Corp",
      "tax_code": "0123456789",
      "address": "123 Main St"
    },
    "settings": {
      "mfa_required": true,
      "session_timeout": 3600
    },
    "parent_tenant_id": null,
    "path": null,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z",
    "version": 1
  }
]
```

---

### 2. Get Tenant by ID
```http
GET /api/v1/tenants/:id
```

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | UUID | Yes | Tenant ID |

**Response:** `200 OK`
```json
{
  "_id": "550e8400-e29b-41d4-a716-446655440000",
  "code": "acme-corp",
  "name": "ACME Corporation",
  "tier": "ENTERPRISE",
  "status": "ACTIVE",
  "data_region": "ap-southeast-1",
  "compliance_level": "STANDARD",
  "billing_type": "POSTPAID",
  "timezone": "Asia/Ho_Chi_Minh",
  "profile": {},
  "settings": {},
  "parent_tenant_id": null,
  "path": null,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z",
  "version": 1
}
```

**Error Responses:**
- `404 Not Found` - Tenant not found
- `500 Internal Server Error` - Server error

---

### 3. Create Tenant
```http
POST /api/v1/tenants
```

**Request Body:**
```json
{
  "code": "acme-corp",
  "name": "ACME Corporation",
  "tier": "ENTERPRISE",
  "status": "TRIAL",
  "data_region": "ap-southeast-1",
  "compliance_level": "STANDARD",
  "billing_type": "POSTPAID",
  "timezone": "Asia/Ho_Chi_Minh",
  "parent_tenant_id": null,
  "profile": {
    "company_name": "ACME Corp",
    "tax_code": "0123456789"
  },
  "settings": {
    "mfa_required": true
  }
}
```

**Required Fields:**
- `code` (string, pattern: `^[a-z0-9-]+$`) - Unique slug/subdomain
- `name` (string) - Tenant display name

**Optional Fields:**
- `tier` (enum) - Default: `FREE`
- `status` (enum) - Default: `TRIAL`
- `data_region` (enum) - Default: `ap-southeast-1`
- `compliance_level` (enum) - Default: `STANDARD`
- `billing_type` (enum) - Default: `POSTPAID`
- `timezone` (string) - Default: `UTC`
- `parent_tenant_id` (UUID) - For partner hierarchy
- `profile` (JSONB) - Dynamic profile data
- `settings` (JSONB) - Dynamic settings

**Response:** `201 Created`
```json
{
  "_id": "550e8400-e29b-41d4-a716-446655440000",
  "code": "acme-corp",
  "name": "ACME Corporation",
  "tier": "FREE",
  "status": "TRIAL",
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid request body
- `409 Conflict` - Code already exists
- `500 Internal Server Error` - Server error

---

### 4. Update Tenant
```http
PATCH /api/v1/tenants/:id
```

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | UUID | Yes | Tenant ID |

**Request Body:** (All fields optional)
```json
{
  "name": "ACME Corp Updated",
  "tier": "ENTERPRISE",
  "status": "ACTIVE",
  "data_region": "us-east-1",
  "compliance_level": "GDPR",
  "billing_type": "PREPAID",
  "timezone": "America/New_York",
  "profile": {
    "company_name": "ACME Corp",
    "tax_code": "9876543210"
  },
  "settings": {
    "mfa_required": true,
    "session_timeout": 7200
  }
}
```

**Response:** `200 OK`
```json
{
  "message": "Tenant updated successfully",
  "updated_at": "2024-01-15T11:30:00Z",
  "version": 2
}
```

**Error Responses:**
- `400 Bad Request` - Invalid request body
- `404 Not Found` - Tenant not found
- `500 Internal Server Error` - Server error

---

### 5. Update Tenant Status
```http
PATCH /api/v1/tenants/:id/status
```

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | UUID | Yes | Tenant ID |

**Request Body:**
```json
{
  "status": "ACTIVE"
}
```

**Valid Status Values:**
- `TRIAL` - Trial period
- `ACTIVE` - Active subscription
- `SUSPENDED` - Temporarily suspended
- `CANCELLED` - Cancelled

**Response:** `200 OK`
```json
{
  "message": "Tenant status updated successfully",
  "status": "ACTIVE",
  "updated_at": "2024-01-15T11:30:00Z",
  "version": 2
}
```

---

### 6. Delete Tenant
```http
DELETE /api/v1/tenants/:id
```

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | UUID | Yes | Tenant ID |

**Response:** `200 OK`
```json
{
  "message": "Tenant deleted successfully"
}
```

**Note:** This is a **soft delete**. The record is marked as deleted but not removed from database.

**Error Responses:**
- `404 Not Found` - Tenant not found
- `500 Internal Server Error` - Server error

---

## Data Types

### Tier Enum
```
- FREE              // Free tier
- PRO               // Pro tier
- ENTERPRISE        // Enterprise tier
- PARTNER_BASIC     // Partner basic
- PARTNER_PREMIUM   // Partner premium
- PARTNER_ELITE     // Partner elite
- PROVIDER          // Platform provider
```

### Status Enum
```
- TRIAL      // Trial period
- ACTIVE     // Active subscription
- SUSPENDED  // Temporarily suspended
- CANCELLED  // Cancelled
```

### Data Region Enum
```
- ap-southeast-1  // Singapore
- us-east-1       // US East
- eu-central-1    // EU Central
```

### Compliance Level Enum
```
- STANDARD  // Standard compliance
- GDPR      // GDPR compliant
- HIPAA     // HIPAA compliant
- PCI-DSS   // PCI-DSS compliant
```

### Billing Type Enum
```
- PREPAID   // Pay before use
- POSTPAID  // Pay after use
```

---

## Use Cases

### UC-1: Create New Tenant (Onboarding)
```bash
curl -X POST http://localhost:8080/api/v1/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "code": "startup-xyz",
    "name": "Startup XYZ",
    "tier": "FREE",
    "profile": {
      "industry": "Technology",
      "size": "1-10"
    }
  }'
```

### UC-2: Upgrade Tenant Tier
```bash
curl -X PATCH http://localhost:8080/api/v1/tenants/{id} \
  -H "Content-Type: application/json" \
  -d '{
    "tier": "ENTERPRISE",
    "status": "ACTIVE"
  }'
```

### UC-3: Suspend Tenant for Non-Payment
```bash
curl -X PATCH http://localhost:8080/api/v1/tenants/{id}/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "SUSPENDED"
  }'
```

### UC-4: Search Tenants by Region
```bash
curl "http://localhost:8080/api/v1/tenants?data_region=ap-southeast-1&status=ACTIVE"
```

### UC-5: Update Tenant Settings
```bash
curl -X PATCH http://localhost:8080/api/v1/tenants/{id} \
  -H "Content-Type: application/json" \
  -d '{
    "settings": {
      "mfa_required": true,
      "session_timeout": 3600,
      "ip_whitelist": ["1.2.3.4", "5.6.7.8"]
    }
  }'
```

---

## Best Practices

### 1. Code Naming
- Use lowercase with hyphens: `acme-corp`, `startup-xyz`
- Keep it short and memorable (max 64 chars)
- Avoid special characters except hyphens

### 2. Profile vs Settings
- **Profile**: Business data (company name, tax code, address)
- **Settings**: Configuration (MFA, session timeout, features)

### 3. Hierarchical Tenants
- Use `parent_tenant_id` for partner reseller structure
- `path` field stores materialized path for tree queries

### 4. Data Isolation
- Each tenant's data is isolated by `tenant_id`
- Use data region for GDPR compliance

### 5. Versioning
- `version` field increments on each update
- Use for optimistic locking

---

## Error Codes

| HTTP Code | Error Message | Description |
|-----------|---------------|-------------|
| 400 | Invalid request | Malformed JSON or missing required fields |
| 404 | Tenant not found | Tenant ID does not exist or is deleted |
| 409 | Tenant code already exists | Duplicate code (slug/subdomain) |
| 500 | Failed to fetch/create/update tenant | Database error |

---

## Notes

- All timestamps are in UTC
- Soft delete: Use `deleted_at` field
- JSONB fields support dynamic queries in PostgreSQL
- Version field auto-increments on updates
