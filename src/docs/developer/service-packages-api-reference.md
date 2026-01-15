# Service Packages - API Reference

## Base URL

```
Production: https://api.yourdomain.com/v1
Development: http://localhost:8080/v1
```

## Authentication

All API requests require authentication using JWT tokens:

```
Authorization: Bearer <your-jwt-token>
```

## Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/packages` | List all service packages |
| GET | `/packages/{id}` | Get package details |
| POST | `/packages` | Create new package |
| PUT | `/packages/{id}` | Update package |
| DELETE | `/packages/{id}` | Delete package (soft delete) |
| GET | `/packages/stats` | Get packages statistics |
| POST | `/packages/{id}/clone` | Clone existing package |

---

## 1. List Service Packages

Get a list of all service packages with optional filtering.

### HTTP Request

```
GET /packages
```

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `product_id` | string (UUID) | No | Filter by product ID |
| `status` | string | No | Filter by status: ACTIVE, INACTIVE, ARCHIVED |
| `is_public` | boolean | No | Filter by public status |
| `search` | string | No | Search in name and code |
| `limit` | integer | No | Limit results (default: 50, max: 100) |
| `offset` | integer | No | Offset results (default: 0) |

### Response

```json
[
  {
    "_id": "01234567-89ab-cdef-0123-456789abcdef",
    "product_id": "fedcba98-7654-3210-fedc-ba9876543210",
    "code": "hrm-pro-monthly",
    "name": "HRM Pro - Monthly",
    "description": "Professional HRM solution for medium businesses",
    "price_amount": 999000.00,
    "currency_code": "VND",
    "entitlements_config": {
      "apps": [
        {
          "app_code": "HRM_APP",
          "features": {
            "attendance_tracking": true,
            "payroll_management": true
          },
          "limits": {
            "max_employees": 100,
            "storage_gb": 50
          }
        }
      ],
      "global_limits": {
        "max_users": 20,
        "support_level": "PRIORITY"
      }
    },
    "status": "ACTIVE",
    "is_public": true,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z",
    "deleted_at": null,
    "version": 1
  }
]
```

### Example Request

```bash
curl -X GET "https://api.yourdomain.com/v1/packages?status=ACTIVE&limit=10" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"
```

### Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Missing or invalid token |
| 500 | Internal Server Error |

---

## 2. Get Package Details

Get detailed information about a specific service package.

### HTTP Request

```
GET /packages/{id}
```

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string (UUID) | Yes | Package ID |

### Response

```json
{
  "_id": "01234567-89ab-cdef-0123-456789abcdef",
  "product_id": "fedcba98-7654-3210-fedc-ba9876543210",
  "code": "hrm-pro-monthly",
  "name": "HRM Pro - Monthly",
  "description": "Professional HRM solution for medium businesses",
  "price_amount": 999000.00,
  "currency_code": "VND",
  "entitlements_config": {
    "apps": [
      {
        "app_code": "HRM_APP",
        "app_name": "Quản lý Nhân sự",
        "features": {
          "attendance_tracking": true,
          "leave_management": true,
          "payroll_management": true,
          "performance_review": false
        },
        "limits": {
          "max_employees": 100,
          "max_departments": 10,
          "storage_gb": 50
        }
      }
    ],
    "global_limits": {
      "max_users": 20,
      "api_calls_per_month": 500000,
      "support_level": "PRIORITY"
    }
  },
  "status": "ACTIVE",
  "is_public": true,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-20T14:25:00Z",
  "deleted_at": null,
  "version": 3
}
```

### Example Request

```bash
curl -X GET "https://api.yourdomain.com/v1/packages/01234567-89ab-cdef-0123-456789abcdef" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"
```

### Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 404 | Not Found - Package does not exist |
| 401 | Unauthorized |
| 500 | Internal Server Error |

---

## 3. Create Service Package

Create a new service package.

### HTTP Request

```
POST /packages
```

### Request Body

```json
{
  "product_id": "fedcba98-7654-3210-fedc-ba9876543210",
  "code": "startup-package-monthly",
  "name": "Startup Package - Monthly",
  "description": "Perfect for startups and small teams",
  "price_amount": 299000.00,
  "currency_code": "VND",
  "entitlements_config": {
    "apps": [
      {
        "app_code": "HRM_APP",
        "features": {
          "attendance_tracking": true,
          "leave_management": true
        },
        "limits": {
          "max_employees": 20,
          "storage_gb": 10
        }
      }
    ],
    "global_limits": {
      "max_users": 5,
      "support_level": "EMAIL"
    }
  },
  "is_public": true
}
```

### Field Validation

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `product_id` | string (UUID) | Yes | Must exist in products table |
| `code` | string | Yes | 1-50 chars, lowercase, numbers, hyphens only, unique |
| `name` | string | Yes | 1-255 chars |
| `description` | string | No | Max 10000 chars |
| `price_amount` | number | Yes | >= 0, max 15 digits before decimal |
| `currency_code` | string | No | Exactly 3 chars, default: VND |
| `entitlements_config` | object | No | Valid JSON object, default: {} |
| `is_public` | boolean | No | Default: true |

### Response

```json
{
  "_id": "12345678-90ab-cdef-1234-567890abcdef",
  "product_id": "fedcba98-7654-3210-fedc-ba9876543210",
  "code": "startup-package-monthly",
  "name": "Startup Package - Monthly",
  "description": "Perfect for startups and small teams",
  "price_amount": 299000.00,
  "currency_code": "VND",
  "entitlements_config": {
    "apps": [...],
    "global_limits": {...}
  },
  "status": "ACTIVE",
  "is_public": true,
  "created_at": "2024-01-25T09:15:00Z",
  "updated_at": "2024-01-25T09:15:00Z",
  "deleted_at": null,
  "version": 1
}
```

### Example Request

```bash
curl -X POST "https://api.yourdomain.com/v1/packages" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "fedcba98-7654-3210-fedc-ba9876543210",
    "code": "startup-package-monthly",
    "name": "Startup Package - Monthly",
    "price_amount": 299000.00,
    "currency_code": "VND"
  }'
```

### Status Codes

| Code | Description |
|------|-------------|
| 201 | Created successfully |
| 400 | Bad Request - Validation error |
| 401 | Unauthorized |
| 409 | Conflict - Code already exists |
| 500 | Internal Server Error |

---

## 4. Update Service Package

Update an existing service package.

### HTTP Request

```
PUT /packages/{id}
```

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string (UUID) | Yes | Package ID |

### Request Body

```json
{
  "name": "HRM Pro - Monthly (Updated)",
  "price_amount": 1099000.00,
  "status": "ACTIVE",
  "entitlements_config": {
    "apps": [
      {
        "app_code": "HRM_APP",
        "features": {
          "attendance_tracking": true,
          "payroll_management": true,
          "performance_review": true
        },
        "limits": {
          "max_employees": 150,
          "storage_gb": 75
        }
      }
    ],
    "global_limits": {
      "max_users": 30,
      "support_level": "PRIORITY_24_7"
    }
  },
  "version": 3
}
```

### Field Validation

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `code` | string | No | 1-50 chars, lowercase, numbers, hyphens only |
| `name` | string | No | 1-255 chars |
| `description` | string | No | Max 10000 chars |
| `price_amount` | number | No | >= 0 |
| `currency_code` | string | No | Exactly 3 chars |
| `entitlements_config` | object | No | Valid JSON object |
| `status` | string | No | ACTIVE, INACTIVE, or ARCHIVED |
| `is_public` | boolean | No | true or false |
| `version` | integer | Yes | Must match current version (Optimistic Locking) |

### Response

Returns the updated package object (same structure as GET).

### Example Request

```bash
curl -X PUT "https://api.yourdomain.com/v1/packages/01234567-89ab-cdef-0123-456789abcdef" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "price_amount": 1099000.00,
    "status": "ACTIVE",
    "version": 3
  }'
```

### Status Codes

| Code | Description |
|------|-------------|
| 200 | Updated successfully |
| 400 | Bad Request - Validation error |
| 401 | Unauthorized |
| 404 | Not Found - Package does not exist |
| 409 | Conflict - Version mismatch (someone else updated it) |
| 500 | Internal Server Error |

---

## 5. Delete Service Package

Soft delete a service package. The package is marked as deleted but not removed from the database.

### HTTP Request

```
DELETE /packages/{id}
```

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string (UUID) | Yes | Package ID |

### Response

```
HTTP 204 No Content
```

### Example Request

```bash
curl -X DELETE "https://api.yourdomain.com/v1/packages/01234567-89ab-cdef-0123-456789abcdef" \
  -H "Authorization: Bearer <token>"
```

### Status Codes

| Code | Description |
|------|-------------|
| 204 | Deleted successfully |
| 401 | Unauthorized |
| 404 | Not Found - Package does not exist or already deleted |
| 500 | Internal Server Error |

---

## 6. Get Package Statistics

Get aggregated statistics about service packages.

### HTTP Request

```
GET /packages/stats
```

### Response

```json
{
  "total": 45,
  "active": 32,
  "inactive": 8,
  "archived": 5,
  "public": 38,
  "private": 7,
  "by_status": {
    "ACTIVE": 32,
    "INACTIVE": 8,
    "ARCHIVED": 5
  },
  "total_revenue": 125500000.00
}
```

### Example Request

```bash
curl -X GET "https://api.yourdomain.com/v1/packages/stats" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"
```

### Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 401 | Unauthorized |
| 500 | Internal Server Error |

---

## 7. Clone Service Package

Create a copy of an existing service package with a new code.

### HTTP Request

```
POST /packages/{id}/clone
```

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string (UUID) | Yes | Source package ID |

### Request Body

```json
{
  "code": "hrm-pro-monthly-2024"
}
```

### Field Validation

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `code` | string | Yes | 1-50 chars, lowercase, numbers, hyphens only, unique |

### Response

Returns a new package object with:
- New `_id`
- Specified `code`
- Name suffixed with " (Copy)"
- Status set to "INACTIVE"
- All other fields copied from source package

```json
{
  "_id": "abcdef01-2345-6789-abcd-ef0123456789",
  "product_id": "fedcba98-7654-3210-fedc-ba9876543210",
  "code": "hrm-pro-monthly-2024",
  "name": "HRM Pro - Monthly (Copy)",
  "description": "Professional HRM solution for medium businesses",
  "price_amount": 999000.00,
  "currency_code": "VND",
  "entitlements_config": {...},
  "status": "INACTIVE",
  "is_public": true,
  "created_at": "2024-01-26T11:00:00Z",
  "updated_at": "2024-01-26T11:00:00Z",
  "deleted_at": null,
  "version": 1
}
```

### Example Request

```bash
curl -X POST "https://api.yourdomain.com/v1/packages/01234567-89ab-cdef-0123-456789abcdef/clone" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "hrm-pro-monthly-2024"
  }'
```

### Status Codes

| Code | Description |
|------|-------------|
| 201 | Cloned successfully |
| 400 | Bad Request - Invalid code or validation error |
| 401 | Unauthorized |
| 404 | Not Found - Source package does not exist |
| 409 | Conflict - Code already exists |
| 500 | Internal Server Error |

---

## Error Response Format

All error responses follow this format:

```json
{
  "error": "Detailed error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "field_name",
    "reason": "validation_reason"
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource conflict (duplicate code, version mismatch) |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Rate Limiting

API requests are rate-limited based on your subscription plan:

| Plan | Requests per Minute | Requests per Hour |
|------|---------------------|-------------------|
| Free | 10 | 100 |
| Pro | 100 | 5,000 |
| Enterprise | 1,000 | 50,000 |

Rate limit headers are included in all responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1706270400
```

---

## Best Practices

1. **Use Filtering**: Always use filters to reduce payload size when listing packages.

2. **Handle Pagination**: Use `limit` and `offset` for large datasets.

3. **Version Control**: Always send the current `version` when updating to prevent conflicts.

4. **Validate JSONB**: Validate `entitlements_config` structure before sending to ensure consistency.

5. **Use HTTPS**: Always use HTTPS in production.

6. **Cache Responses**: Cache GET requests appropriately (recommend 5 minutes for package list).

7. **Error Handling**: Always handle all possible HTTP status codes.

---

## Code Examples

### JavaScript/TypeScript

```typescript
// List packages
async function listPackages(status?: string) {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  
  const response = await fetch(`https://api.yourdomain.com/v1/packages?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) throw new Error('Failed to fetch packages');
  return response.json();
}

// Create package
async function createPackage(data: CreatePackageRequest) {
  const response = await fetch('https://api.yourdomain.com/v1/packages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }
  
  return response.json();
}

// Update package with optimistic locking
async function updatePackage(id: string, updates: UpdatePackageRequest) {
  const response = await fetch(`https://api.yourdomain.com/v1/packages/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  });
  
  if (response.status === 409) {
    throw new Error('Version conflict - package was modified by another user');
  }
  
  if (!response.ok) throw new Error('Failed to update package');
  return response.json();
}
```

### Python

```python
import requests

BASE_URL = "https://api.yourdomain.com/v1"
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

# List packages
def list_packages(status=None):
    params = {"status": status} if status else {}
    response = requests.get(f"{BASE_URL}/packages", headers=headers, params=params)
    response.raise_for_status()
    return response.json()

# Create package
def create_package(data):
    response = requests.post(f"{BASE_URL}/packages", headers=headers, json=data)
    response.raise_for_status()
    return response.json()

# Clone package
def clone_package(source_id, new_code):
    response = requests.post(
        f"{BASE_URL}/packages/{source_id}/clone",
        headers=headers,
        json={"code": new_code}
    )
    response.raise_for_status()
    return response.json()
```

---

## Webhook Events

The following webhook events are triggered for service packages:

| Event | Description | Payload |
|-------|-------------|---------|
| `package.created` | New package created | Full package object |
| `package.updated` | Package updated | Full package object |
| `package.deleted` | Package soft deleted | Package ID only |
| `package.cloned` | Package cloned | Both source and new package objects |

---

## Changelog

### Version 1.0.0 (2024-01-14)
- Initial API release
- Support for CRUD operations
- Clone and statistics endpoints
- Optimistic locking with version field

---

## Support

For API support, please contact:
- Email: api-support@yourdomain.com
- Slack: #api-support
- Documentation: https://docs.yourdomain.com
