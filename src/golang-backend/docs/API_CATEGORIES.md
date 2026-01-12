# Category Management API

## Overview
RESTful API endpoints for managing system classification categories. Categories are used for organizing and classifying various entities in the system (tenant types, user roles, document types, etc.).

## Base URL
```
http://localhost:8080/api/v1
```

## Authentication
All endpoints require JWT authentication unless otherwise specified.

**Header:**
```
Authorization: Bearer <jwt_token>
```

---

## Endpoints

### 1. Get All Categories
Retrieve all categories with optional filtering.

**Endpoint:** `GET /categories`

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| type | string | No | Filter by category type |
| status | string | No | Filter by status (active/inactive) |
| parent_id | string | No | Filter by parent category ID (use "null" for root categories) |
| search | string | No | Search in name, code, and description |
| page | integer | No | Page number (default: 1) |
| limit | integer | No | Items per page (default: 20, max: 100) |
| sort | string | No | Sort field (default: order) |
| order | string | No | Sort order: asc/desc (default: asc) |

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid-1",
        "code": "TENANT_ENTERPRISE",
        "name": "Enterprise Tenant",
        "type": "tenant_type",
        "description": "Large organization with advanced features",
        "parent_id": null,
        "order": 1,
        "status": "active",
        "metadata": {
          "icon": "building",
          "color": "#6366f1"
        },
        "created_at": "2024-01-15T10:00:00Z",
        "updated_at": "2024-01-15T10:00:00Z",
        "created_by": "user-uuid",
        "updated_by": "user-uuid"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "total_pages": 3
    }
  }
}
```

**cURL Example:**
```bash
curl -X GET "http://localhost:8080/api/v1/categories?type=tenant_type&status=active" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 2. Get Category by ID
Retrieve a single category by its ID.

**Endpoint:** `GET /categories/:id`

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Category UUID |

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid-1",
    "code": "TENANT_ENTERPRISE",
    "name": "Enterprise Tenant",
    "type": "tenant_type",
    "description": "Large organization with advanced features",
    "parent_id": null,
    "order": 1,
    "status": "active",
    "metadata": {
      "icon": "building",
      "color": "#6366f1"
    },
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T10:00:00Z",
    "created_by": "user-uuid",
    "updated_by": "user-uuid"
  }
}
```

**Error Response:** `404 Not Found`
```json
{
  "success": false,
  "error": {
    "code": "CATEGORY_NOT_FOUND",
    "message": "Category not found"
  }
}
```

**cURL Example:**
```bash
curl -X GET "http://localhost:8080/api/v1/categories/uuid-1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 3. Create Category
Create a new category.

**Endpoint:** `POST /categories`

**Request Body:**
```json
{
  "code": "USER_MANAGER",
  "name": "Manager",
  "type": "user_role",
  "description": "Team management access",
  "parent_id": null,
  "order": 2,
  "status": "active",
  "metadata": {
    "permissions": ["read", "write", "manage_team"]
  }
}
```

**Field Validations:**
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| code | string | Yes | Unique, uppercase letters, numbers and underscores only, max 100 chars |
| name | string | Yes | Min 1, max 255 chars |
| type | string | Yes | Max 100 chars |
| description | string | No | Max 1000 chars |
| parent_id | string | No | Valid category UUID |
| order | integer | No | Min 0, default 0 |
| status | string | No | Enum: active/inactive, default active |
| metadata | object | No | Valid JSON object |

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "uuid-new",
    "code": "USER_MANAGER",
    "name": "Manager",
    "type": "user_role",
    "description": "Team management access",
    "parent_id": null,
    "order": 2,
    "status": "active",
    "metadata": {
      "permissions": ["read", "write", "manage_team"]
    },
    "created_at": "2024-01-20T15:30:00Z",
    "updated_at": "2024-01-20T15:30:00Z",
    "created_by": "user-uuid",
    "updated_by": "user-uuid"
  }
}
```

**Error Response:** `400 Bad Request`
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "code",
        "message": "Code must contain only uppercase letters, numbers and underscores"
      }
    ]
  }
}
```

**Error Response:** `409 Conflict`
```json
{
  "success": false,
  "error": {
    "code": "CODE_EXISTS",
    "message": "Category code already exists"
  }
}
```

**cURL Example:**
```bash
curl -X POST "http://localhost:8080/api/v1/categories" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "USER_MANAGER",
    "name": "Manager",
    "type": "user_role",
    "description": "Team management access",
    "order": 2,
    "status": "active"
  }'
```

---

### 4. Update Category
Update an existing category.

**Endpoint:** `PUT /categories/:id`

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Category UUID |

**Request Body:**
```json
{
  "name": "Senior Manager",
  "description": "Senior team management access with extended permissions",
  "order": 1,
  "status": "active",
  "metadata": {
    "permissions": ["read", "write", "manage_team", "approve_requests"]
  }
}
```

**Note:** All fields are optional. Only provided fields will be updated. The `code` field cannot be changed after creation.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid-1",
    "code": "USER_MANAGER",
    "name": "Senior Manager",
    "description": "Senior team management access with extended permissions",
    "type": "user_role",
    "parent_id": null,
    "order": 1,
    "status": "active",
    "metadata": {
      "permissions": ["read", "write", "manage_team", "approve_requests"]
    },
    "created_at": "2024-01-20T15:30:00Z",
    "updated_at": "2024-01-22T10:15:00Z",
    "created_by": "user-uuid",
    "updated_by": "user-uuid"
  }
}
```

**cURL Example:**
```bash
curl -X PUT "http://localhost:8080/api/v1/categories/uuid-1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Senior Manager",
    "description": "Senior team management access with extended permissions"
  }'
```

---

### 5. Partial Update Category
Partially update a category using PATCH.

**Endpoint:** `PATCH /categories/:id`

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Category UUID |

**Request Body:**
```json
{
  "status": "inactive"
}
```

**Response:** `200 OK` (same as PUT response)

**cURL Example:**
```bash
curl -X PATCH "http://localhost:8080/api/v1/categories/uuid-1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "inactive"}'
```

---

### 6. Delete Category
Delete a category by ID.

**Endpoint:** `DELETE /categories/:id`

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Category UUID |

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Category deleted successfully"
}
```

**Error Response:** `409 Conflict`
```json
{
  "success": false,
  "error": {
    "code": "CATEGORY_IN_USE",
    "message": "Cannot delete category that is in use or has child categories"
  }
}
```

**cURL Example:**
```bash
curl -X DELETE "http://localhost:8080/api/v1/categories/uuid-1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 7. Get Category Types
Get list of unique category types in the system.

**Endpoint:** `GET /categories/types`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    "tenant_type",
    "user_role",
    "user_status",
    "document_type",
    "priority_level",
    "status_type"
  ]
}
```

**cURL Example:**
```bash
curl -X GET "http://localhost:8080/api/v1/categories/types" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 8. Bulk Operations
Bulk create/update/delete categories.

**Endpoint:** `POST /categories/bulk`

**Request Body:**
```json
{
  "action": "create",
  "items": [
    {
      "code": "PRIORITY_HIGH",
      "name": "High Priority",
      "type": "priority_level",
      "order": 1,
      "metadata": {"color": "#ef4444"}
    },
    {
      "code": "PRIORITY_MEDIUM",
      "name": "Medium Priority",
      "type": "priority_level",
      "order": 2,
      "metadata": {"color": "#f59e0b"}
    }
  ]
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "created": 2,
    "failed": 0,
    "results": [
      {
        "code": "PRIORITY_HIGH",
        "status": "success",
        "id": "uuid-new-1"
      },
      {
        "code": "PRIORITY_MEDIUM",
        "status": "success",
        "id": "uuid-new-2"
      }
    ]
  }
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| CATEGORY_NOT_FOUND | 404 | Category with given ID not found |
| CODE_EXISTS | 409 | Category code already exists |
| VALIDATION_ERROR | 400 | Input validation failed |
| CATEGORY_IN_USE | 409 | Category cannot be deleted (in use or has children) |
| UNAUTHORIZED | 401 | Missing or invalid JWT token |
| FORBIDDEN | 403 | User lacks permission for this operation |
| INTERNAL_ERROR | 500 | Server error |

---

## Data Models

### Category
```go
type Category struct {
    ID          string                 `json:"id"`
    Code        string                 `json:"code"`
    Name        string                 `json:"name"`
    Type        string                 `json:"type"`
    Description *string                `json:"description"`
    ParentID    *string                `json:"parent_id"`
    Order       int                    `json:"order"`
    Status      string                 `json:"status"`
    Metadata    map[string]interface{} `json:"metadata"`
    CreatedAt   time.Time              `json:"created_at"`
    UpdatedAt   time.Time              `json:"updated_at"`
    CreatedBy   *string                `json:"created_by"`
    UpdatedBy   *string                `json:"updated_by"`
}
```

---

## Notes
- Category codes are immutable after creation
- Deleting a category with children will fail
- Categories with `parent_id` form a hierarchical structure
- The `metadata` field allows flexible JSON data storage
- Soft delete is not implemented; deletions are permanent
