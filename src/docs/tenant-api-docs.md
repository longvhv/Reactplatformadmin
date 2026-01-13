# Tenant Management API Documentation

## Overview
Complete REST API for multi-tenant management with hierarchical structure support, audit trails, and optimistic locking.

**Base URL:** `/api/core`

**Full URL Pattern:** `https://{PROJECT_ID}.supabase.co/functions/v1/api/core`

**Authentication:** Bearer token required for write operations

---

## Endpoints

### 1. List Tenants
```http
GET /tenants
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by status: `TRIAL`, `ACTIVE`, `SUSPENDED`, `CANCELLED` |
| `tier` | string | Filter by tier: `FREE`, `PRO`, `ENTERPRISE`, `PARTNER_*`, `PROVIDER` |
| `data_region` | string | Filter by AWS region: `ap-southeast-1`, `us-east-1`, `eu-central-1` |
| `parent_tenant_id` | string | Filter by parent ID (use `"null"` for root tenants) |
| `search` | string | Search in name or code |
| `limit` | number | Results per page (default: 50) |
| `offset` | number | Pagination offset (default: 0) |

**Response:**
```json
{
  "data": [
    {
      "_id": "uuid",
      "code": "tenant-code",
      "name": "Tenant Name",
      "parent_tenant_id": "uuid | null",
      "path": "/parent-id/tenant-id/",
      "tier": "ENTERPRISE",
      "status": "ACTIVE",
      "data_region": "ap-southeast-1",
      "compliance_level": "GDPR",
      "timezone": "UTC",
      "billing_type": "POSTPAID",
      "profile": {
        "billing_email": "billing@example.com",
        "phone": "+1234567890",
        "contact_person": "John Doe",
        "website": "https://example.com",
        "logo_url": "https://...",
        "industry": "Technology",
        "company_size": "50-200",
        "country": "Vietnam",
        "address": "123 Street",
        "tax_id": "TAX123"
      },
      "settings": {
        "max_users": 100,
        "max_storage": 500,
        "current_users": 45,
        "current_storage": 250,
        "mfa_enforced": true,
        "sso_enabled": true,
        "custom_branding": true,
        "api_access": true,
        "features": ["analytics", "reporting"]
      },
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-02T00:00:00Z",
      "created_by": "user-uuid",
      "updated_by": "user-uuid",
      "deleted_at": null,
      "deleted_by": null,
      "version": 1
    }
  ],
  "pagination": {
    "total": 100,
    "limit": 50,
    "offset": 0,
    "has_more": true
  }
}
```

---

### 2. Get Single Tenant
```http
GET /tenants/:id
```

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Tenant ID |

**Response:**
```json
{
  "data": { /* Same as list item */ }
}
```

**Error Responses:**
- `404 Not Found` - Tenant not found
- `500 Internal Server Error` - Server error

---

### 3. Create Tenant
```http
POST /tenants
```

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "code": "new-tenant",
  "name": "New Tenant",
  "parent_tenant_id": "parent-uuid | null",
  "tier": "PRO",
  "status": "TRIAL",
  "data_region": "ap-southeast-1",
  "compliance_level": "STANDARD",
  "timezone": "UTC",
  "billing_type": "POSTPAID",
  "profile": {
    "billing_email": "billing@example.com",
    "phone": "+1234567890",
    "contact_person": "John Doe"
  },
  "settings": {
    "max_users": 100,
    "max_storage": 500
  }
}
```

**Required Fields:**
- `code` - Unique slug (lowercase, alphanumeric, hyphens only)
- `name` - Display name

**Validation Rules:**
- `code`: 3-64 characters, matches `/^[a-z0-9-]+$/`
- `name`: 2-255 characters
- `billing_email`: Valid email format
- `status`: One of `TRIAL`, `ACTIVE`, `SUSPENDED`, `CANCELLED`
- `tier`: One of `FREE`, `PRO`, `ENTERPRISE`, `PARTNER_BASIC`, `PARTNER_PREMIUM`, `PARTNER_ELITE`, `PROVIDER`
- `data_region`: One of `ap-southeast-1`, `us-east-1`, `eu-central-1`
- `compliance_level`: One of `STANDARD`, `GDPR`, `HIPAA`, `PCI-DSS`
- `billing_type`: One of `PREPAID`, `POSTPAID`

**Response:**
```json
{
  "data": { /* Created tenant */ }
}
```

**Error Responses:**
- `400 Bad Request` - Validation failed
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Parent tenant not found
- `409 Conflict` - Code already exists
- `500 Internal Server Error` - Server error

---

### 4. Update Tenant
```http
PATCH /tenants/:id
```

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:** (all fields optional, partial update)
```json
{
  "name": "Updated Name",
  "tier": "ENTERPRISE",
  "status": "ACTIVE",
  "profile": {
    "billing_email": "new-billing@example.com"
  },
  "settings": {
    "max_users": 200
  },
  "version": 1
}
```

**Optimistic Locking:**
Include `version` field to prevent concurrent updates. Server will reject if version doesn't match current value.

**Response:**
```json
{
  "data": { /* Updated tenant with incremented version */ }
}
```

**Error Responses:**
- `400 Bad Request` - Validation failed
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Tenant or parent not found
- `409 Conflict` - Version conflict or code already exists
- `500 Internal Server Error` - Server error

---

### 5. Delete Tenant (Soft Delete)
```http
DELETE /tenants/:id
```

**Headers:**
```
Authorization: Bearer <token>
```

**Business Logic:**
- Cannot delete tenant with active children
- Sets `deleted_at` and `deleted_by` fields
- Tenant still exists in database but filtered out from queries

**Response:**
```json
{
  "data": { /* Deleted tenant */ },
  "message": "Tenant deleted successfully"
}
```

**Error Responses:**
- `400 Bad Request` - Tenant has children
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Tenant not found or already deleted
- `500 Internal Server Error` - Server error

---

### 6. Get Child Tenants
```http
GET /tenants/:id/children
```

**Description:** Returns direct children only (not descendants)

**Response:**
```json
{
  "data": [ /* Array of child tenants */ ]
}
```

---

### 7. Get All Descendants
```http
GET /tenants/:id/descendants
```

**Description:** Returns all descendants using materialized path

**Implementation:**
```sql
-- Finds all tenants whose path starts with parent's path
SELECT * FROM tenants 
WHERE path LIKE '/parent-id/%' 
AND _id != parent-id
AND deleted_at IS NULL
ORDER BY path;
```

**Response:**
```json
{
  "data": [ /* Array of descendant tenants */ ]
}
```

---

## Database Schema

### Table: `tenants`

**Type:** GLOBAL TABLE

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `_id` | UUID | PRIMARY KEY, NOT NULL | Unique identifier |
| `code` | VARCHAR(64) | UNIQUE, NOT NULL | Unique slug identifier |
| `name` | VARCHAR(255) | NOT NULL | Display name |
| `parent_tenant_id` | UUID | FOREIGN KEY → tenants(_id), NULLABLE | Parent tenant for hierarchy |
| `path` | TEXT | NULLABLE | Materialized path (e.g., `/parent/child/`) |
| `tier` | VARCHAR(50) | NOT NULL, DEFAULT 'FREE' | Subscription tier |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT 'TRIAL' | Lifecycle status |
| `data_region` | VARCHAR(50) | NOT NULL, DEFAULT 'ap-southeast-1' | AWS region |
| `compliance_level` | VARCHAR(20) | NOT NULL, DEFAULT 'STANDARD' | Regulatory compliance |
| `timezone` | VARCHAR(50) | NOT NULL, DEFAULT 'UTC' | Default timezone |
| `billing_type` | VARCHAR(20) | NOT NULL, DEFAULT 'POSTPAID' | Payment method |
| `profile` | JSONB | NOT NULL, DEFAULT '{}' | Contact and company info |
| `settings` | JSONB | NOT NULL, DEFAULT '{}' | Quotas and feature flags |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Last update timestamp |
| `created_by` | UUID | NULLABLE | User who created |
| `updated_by` | UUID | NULLABLE | User who last updated |
| `deleted_at` | TIMESTAMPTZ | NULLABLE | Soft delete timestamp |
| `deleted_by` | UUID | NULLABLE | User who deleted |
| `version` | BIGINT | NOT NULL, DEFAULT 1 | Optimistic locking version |

**Indexes:**
```sql
CREATE UNIQUE INDEX idx_tenants_code ON tenants(code) WHERE deleted_at IS NULL;
CREATE INDEX idx_tenants_parent ON tenants(parent_tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tenants_path ON tenants USING gist(path gist_trgm_ops);
CREATE INDEX idx_tenants_tier ON tenants(tier);
CREATE INDEX idx_tenants_status ON tenants(status);
```

---

## Hierarchical Structure

### Materialized Path Pattern

Tenants use materialized path for efficient hierarchy queries:

**Example:**
```
Root Tenant:         path = "/tenant-a-id/"
  └─ Child 1:        path = "/tenant-a-id/child-1-id/"
      └─ Grandchild: path = "/tenant-a-id/child-1-id/grandchild-id/"
```

**Benefits:**
- Fast ancestor/descendant queries
- Single query for subtree
- No recursive CTEs needed

**Queries:**
```sql
-- Get all descendants
SELECT * FROM tenants WHERE path LIKE '/parent-id/%';

-- Get depth level
SELECT *, (LENGTH(path) - LENGTH(REPLACE(path, '/', ''))) - 1 AS depth 
FROM tenants;

-- Get ancestors
SELECT * FROM tenants WHERE '/child-path/' LIKE path || '%';
```

---

## Tier Limits

| Tier | Max Users | Max Storage (GB) | API Rate Limit |
|------|-----------|------------------|----------------|
| FREE | 10 | 5 | 100/min |
| PRO | 100 | 50 | 1,000/min |
| ENTERPRISE | Unlimited | 500 | 10,000/min |
| PARTNER_BASIC | 50 | 25 | 500/min |
| PARTNER_PREMIUM | 200 | 100 | 2,000/min |
| PARTNER_ELITE | Unlimited | 1,000 | 20,000/min |
| PROVIDER | Unlimited | Unlimited | 50,000/min |

---

## Validation

### Client-Side Constants

```typescript
import { 
  TENANT_STATUSES, 
  TENANT_TIERS, 
  DATA_REGIONS, 
  COMPLIANCE_LEVELS, 
  BILLING_TYPES,
  PATTERNS,
  LENGTH,
  ERROR_MESSAGES
} from '@/constants/tenant-constants';

// Usage
if (!PATTERNS.CODE.test(code)) {
  throw new Error(ERROR_MESSAGES.CODE_INVALID);
}
```

### Server-Side Validators

```typescript
import { validateCreateTenant, validateUpdateTenant } from './tenant-validators';

const validation = validateCreateTenant(input);
if (!validation.valid) {
  return { errors: validation.errors };
}
```

---

## Error Handling

All endpoints return consistent error format:

```json
{
  "error": "Error message",
  "details": [ // Optional
    {
      "field": "code",
      "message": "Tenant code must contain only lowercase letters, numbers, and hyphens"
    }
  ]
}
```

**HTTP Status Codes:**
- `200 OK` - Success
- `201 Created` - Resource created
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Authentication required
- `404 Not Found` - Resource not found
- `409 Conflict` - Unique constraint violation or version conflict
- `500 Internal Server Error` - Server error

---

## Best Practices

1. **Always use optimistic locking** for updates by including `version` field
2. **Check for circular references** before setting `parent_tenant_id`
3. **Delete children first** before deleting parent tenants
4. **Use materialized path** for efficient hierarchy queries
5. **Validate on both client and server** for better UX and security
6. **Include audit fields** (`created_by`, `updated_by`) for compliance
7. **Use soft delete** to maintain referential integrity

---

## Examples

### Create Root Tenant
```bash
curl -X POST https://PROJECT.supabase.co/functions/v1/api/core/tenants \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "acme-corp",
    "name": "Acme Corporation",
    "tier": "ENTERPRISE",
    "profile": {
      "billing_email": "billing@acme.com",
      "phone": "+1-555-0100"
    }
  }'
```

### Create Child Tenant
```bash
curl -X POST https://PROJECT.supabase.co/functions/v1/api/core/tenants \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "acme-sales",
    "name": "Acme Sales Division",
    "parent_tenant_id": "parent-uuid-here",
    "tier": "PRO"
  }'
```

### Update with Optimistic Locking
```bash
curl -X PATCH https://PROJECT.supabase.co/functions/v1/api/core/tenants/TENANT_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Name",
    "version": 1
  }'
```

### Query Hierarchy
```bash
# Get all children
curl https://PROJECT.supabase.co/functions/v1/api/core/tenants/TENANT_ID/children

# Get all descendants
curl https://PROJECT.supabase.co/functions/v1/api/core/tenants/TENANT_ID/descendants

# Get root tenants only
curl https://PROJECT.supabase.co/functions/v1/api/core/tenants?parent_tenant_id=null
```