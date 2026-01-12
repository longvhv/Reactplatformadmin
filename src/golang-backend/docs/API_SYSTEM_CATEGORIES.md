# System Categories API Documentation

## Overview
This document describes the RESTful API endpoints for managing System Categories - system-level declaration categories used throughout the platform.

## Base URL
```
http://localhost:8080/api/v1
```

## Authentication
All endpoints require JWT authentication via Bearer token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## Endpoints

### 1. Get All System Categories
Retrieve all system categories with optional filtering.

**Endpoint:** `GET /system-categories`

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| type | string | No | Filter by category type |
| category_group | string | No | Filter by category group |
| status | string | No | Filter by status (active, inactive) |
| search | string | No | Search by name, code or description |
| is_system | boolean | No | Filter system-protected categories |

**Request Example:**
```http
GET /api/v1/system-categories?type=user_role&status=active
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "code": "SYS_ROLE_SUPER_ADMIN",
      "name": "Super Administrator",
      "type": "user_role",
      "category_group": "system_roles",
      "description": "Full system access across all tenants",
      "is_system": true,
      "is_editable": false,
      "order": 1,
      "status": "active",
      "metadata": {
        "permissions": ["*"],
        "level": 0
      },
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z",
      "created_by": null,
      "updated_by": null
    }
  ],
  "total": 1
}
```

---

### 2. Get System Category by ID
Retrieve a specific system category by its ID.

**Endpoint:** `GET /system-categories/:id`

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | System category ID |

**Request Example:**
```http
GET /api/v1/system-categories/1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "1",
    "code": "SYS_ROLE_SUPER_ADMIN",
    "name": "Super Administrator",
    "type": "user_role",
    "category_group": "system_roles",
    "description": "Full system access across all tenants",
    "is_system": true,
    "is_editable": false,
    "order": 1,
    "status": "active",
    "metadata": {
      "permissions": ["*"],
      "level": 0
    },
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

**Error Response (404 Not Found):**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "System category not found"
  }
}
```

---

### 3. Create System Category
Create a new system category.

**Endpoint:** `POST /system-categories`

**Request Body:**
```json
{
  "code": "SYS_CUSTOM_ROLE",
  "name": "Custom Role",
  "type": "user_role",
  "category_group": "custom_roles",
  "description": "Custom user role",
  "is_editable": true,
  "order": 10,
  "status": "active",
  "metadata": {
    "permissions": ["read", "write"]
  }
}
```

**Field Validations:**
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| code | string | Yes | Unique, uppercase, numbers and underscores only |
| name | string | Yes | Max 255 characters |
| type | string | Yes | Valid category type |
| category_group | string | Yes | Valid category group |
| description | string | No | Max 1000 characters |
| is_editable | boolean | No | Default: true |
| order | integer | No | Min: 0, Default: 0 |
| status | string | No | active or inactive, Default: active |
| metadata | object | No | Valid JSON object |

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "9",
    "code": "SYS_CUSTOM_ROLE",
    "name": "Custom Role",
    "type": "user_role",
    "category_group": "custom_roles",
    "description": "Custom user role",
    "is_system": true,
    "is_editable": true,
    "order": 10,
    "status": "active",
    "metadata": {
      "permissions": ["read", "write"]
    },
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "code": "Code already exists"
    }
  }
}
```

---

### 4. Update System Category
Update an existing system category.

**Endpoint:** `PUT /system-categories/:id`

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | System category ID |

**Request Body:**
```json
{
  "name": "Updated Role Name",
  "description": "Updated description",
  "order": 15,
  "status": "inactive",
  "metadata": {
    "permissions": ["read"]
  }
}
```

**Notes:**
- Cannot update `code` field
- Cannot update `is_system` field
- System-protected categories (is_system=true, is_editable=false) cannot be updated

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "9",
    "code": "SYS_CUSTOM_ROLE",
    "name": "Updated Role Name",
    "type": "user_role",
    "category_group": "custom_roles",
    "description": "Updated description",
    "is_system": true,
    "is_editable": true,
    "order": 15,
    "status": "inactive",
    "metadata": {
      "permissions": ["read"]
    },
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T11:00:00Z"
  }
}
```

**Error Response (403 Forbidden):**
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "This system category cannot be edited"
  }
}
```

---

### 5. Delete System Category
Delete a system category.

**Endpoint:** `DELETE /system-categories/:id`

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | System category ID |

**Notes:**
- System-protected categories (is_system=true, is_editable=false) cannot be deleted
- Will fail if category is in use

**Request Example:**
```http
DELETE /api/v1/system-categories/9
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "System category deleted successfully"
}
```

**Error Response (403 Forbidden):**
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "This system category cannot be deleted"
  }
}
```

**Error Response (409 Conflict):**
```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "System category is in use and cannot be deleted"
  }
}
```

---

### 6. Get System Category Types
Get list of available system category types.

**Endpoint:** `GET /system-categories/types`

**Request Example:**
```http
GET /api/v1/system-categories/types
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    "tenant_type",
    "user_role",
    "user_status",
    "entity_status",
    "document_type",
    "priority_level",
    "status_type"
  ]
}
```

---

### 7. Get System Category Groups
Get list of available system category groups.

**Endpoint:** `GET /system-categories/groups`

**Request Example:**
```http
GET /api/v1/system-categories/groups
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    "tenant_classification",
    "system_roles",
    "workflow_states",
    "custom_roles"
  ]
}
```

---

## Data Models

### SystemCategory
```typescript
interface SystemCategory {
  id: string;
  code: string;              // Unique identifier (uppercase, numbers, underscores)
  name: string;              // Display name
  type: string;              // Category type
  category_group: string;    // Category group classification
  description?: string;      // Optional description
  is_system: boolean;        // Always true for system categories
  is_editable: boolean;      // Whether can be edited/deleted
  order: number;             // Display order
  status: 'active' | 'inactive';
  metadata?: object;         // Additional custom data
  created_at: string;        // ISO 8601 timestamp
  updated_at: string;        // ISO 8601 timestamp
  created_by?: string;       // User ID who created
  updated_by?: string;       // User ID who last updated
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| VALIDATION_ERROR | 400 | Invalid input data |
| UNAUTHORIZED | 401 | Missing or invalid authentication |
| FORBIDDEN | 403 | Insufficient permissions or protected resource |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Resource conflict (e.g., duplicate code, in use) |
| INTERNAL_ERROR | 500 | Server error |

---

## Rate Limiting
- 100 requests per minute per user
- 1000 requests per hour per user

---

## Notes
- All timestamps are in UTC ISO 8601 format
- System-protected categories (is_system=true, is_editable=false) are core system categories that cannot be modified
- Category codes must be unique across the entire system
- Soft delete is not supported for system categories
- When deleting, ensure the category is not referenced by other entities
