# Users Module - Complete API Documentation

## 📋 Table of Contents
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Basic CRUD Operations](#basic-crud-operations)
4. [Detail Endpoints](#detail-endpoints)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)

---

## Overview

### Base URL
```
/api/v1/users
```

### Response Format
All API responses follow this structure:
```json
{
  "data": {...},
  "error": "Error message if any",
  "metadata": {
    "timestamp": "2024-01-20T10:30:00Z",
    "version": "1.0"
  }
}
```

---

## Basic CRUD Operations

### 1. List Users

**Endpoint:** `GET /api/v1/users`

**Description:** Retrieve list of users with optional filtering

**Query Parameters:**
| Parameter | Type | Required | Description | Default |
|-----------|------|----------|-------------|---------|
| `status` | string | No | Filter by status | - |
| `locale` | string | No | Filter by locale | - |
| `search` | string | No | Search by email or name | - |
| `is_verified` | boolean | No | Filter by verification | - |
| `limit` | integer | No | Results per page | 50 |
| `offset` | integer | No | Pagination offset | 0 |

**Request Example:**
```bash
curl -X GET "http://localhost:8080/api/v1/users?status=ACTIVE&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response 200 OK:**
```json
[
  {
    "_id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john.doe@example.com",
    "full_name": "John Doe",
    "avatar_url": "https://cdn.example.com/avatar.jpg",
    "phone_number": "+84901234567",
    "status": "ACTIVE",
    "is_support_staff": false,
    "mfa_enabled": true,
    "is_verified": true,
    "locale": "vi-VN",
    "metadata": {
      "preferences": {
        "theme": "dark"
      }
    },
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-20T14:25:00Z"
  }
]
```

---

### 2. Get User by ID

**Endpoint:** `GET /api/v1/users/:id`

**Description:** Get detailed information about a specific user

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | User ID |

**Request Example:**
```bash
curl -X GET "http://localhost:8080/api/v1/users/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response 200 OK:**
```json
{
  "_id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "john.doe@example.com",
  "full_name": "John Doe",
  "avatar_url": "https://cdn.example.com/avatar.jpg",
  "phone_number": "+84901234567",
  "status": "ACTIVE",
  "is_support_staff": false,
  "mfa_enabled": true,
  "is_verified": true,
  "locale": "vi-VN",
  "metadata": {
    "preferences": {
      "theme": "dark",
      "notifications": {
        "email": true,
        "sms": false
      }
    },
    "onboarding": {
      "completed": true,
      "completed_at": "2024-01-15T12:00:00Z"
    }
  },
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-20T14:25:00Z"
}
```

**Response 404 Not Found:**
```json
{
  "error": "User not found"
}
```

---

### 3. Create User

**Endpoint:** `POST /api/v1/users`

**Description:** Create a new user account

**Request Body:**
```json
{
  "email": "jane.smith@example.com",
  "password": "SecurePassword123!",
  "full_name": "Jane Smith",
  "avatar_url": "https://cdn.example.com/avatar2.jpg",
  "phone_number": "+84907654321",
  "locale": "en-US",
  "metadata": {
    "source": "web_signup"
  }
}
```

**Field Validations:**
| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `email` | string | Yes | Valid email format, unique |
| `password` | string | Yes | Min 8 characters |
| `full_name` | string | Yes | Max 255 characters |
| `avatar_url` | string | No | Valid URL |
| `phone_number` | string | No | Valid phone format |
| `locale` | string | No | Default: vi-VN |
| `metadata` | object | No | Valid JSON |

**Request Example:**
```bash
curl -X POST "http://localhost:8080/api/v1/users" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "email": "jane.smith@example.com",
    "password": "SecurePassword123!",
    "full_name": "Jane Smith"
  }'
```

**Response 201 Created:**
```json
{
  "_id": "660f9511-f3ac-52e5-b827-557766551111",
  "email": "jane.smith@example.com",
  "full_name": "Jane Smith",
  "status": "PENDING",
  "is_support_staff": false,
  "mfa_enabled": false,
  "is_verified": false,
  "locale": "vi-VN",
  "metadata": {},
  "created_at": "2024-01-20T15:30:00Z",
  "updated_at": "2024-01-20T15:30:00Z"
}
```

**Response 409 Conflict:**
```json
{
  "error": "User with this email already exists"
}
```

---

### 4. Update User

**Endpoint:** `PATCH /api/v1/users/:id`

**Description:** Update user information

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | User ID |

**Request Body (all fields optional):**
```json
{
  "full_name": "John Updated Doe",
  "avatar_url": "https://cdn.example.com/new-avatar.jpg",
  "phone_number": "+84909999999",
  "locale": "en-US",
  "metadata": {
    "preferences": {
      "theme": "light"
    }
  }
}
```

**Request Example:**
```bash
curl -X PATCH "http://localhost:8080/api/v1/users/550e8400-e29b-41d4-a716-446655440000" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "full_name": "John Updated Doe"
  }'
```

**Response 200 OK:**
```json
{
  "message": "User updated successfully",
  "updated_at": "2024-01-20T16:00:00Z"
}
```

---

### 5. Update User Status

**Endpoint:** `PATCH /api/v1/users/:id/status`

**Description:** Update user account status

**Request Body:**
```json
{
  "status": "ACTIVE"
}
```

**Valid Status Values:**
- `ACTIVE` - User can login
- `PENDING` - Awaiting verification
- `DISABLED` - Temporarily disabled
- `BANNED` - Permanently banned

**Request Example:**
```bash
curl -X PATCH "http://localhost:8080/api/v1/users/550e8400-e29b-41d4-a716-446655440000/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "status": "ACTIVE"
  }'
```

**Response 200 OK:**
```json
{
  "message": "User status updated successfully",
  "status": "ACTIVE",
  "updated_at": "2024-01-20T16:15:00Z"
}
```

---

### 6. Delete User

**Endpoint:** `DELETE /api/v1/users/:id`

**Description:** Soft delete a user (sets deleted_at timestamp)

**Request Example:**
```bash
curl -X DELETE "http://localhost:8080/api/v1/users/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response 200 OK:**
```json
{
  "message": "User deleted successfully"
}
```

---

## Detail Endpoints

### 7. Get User Statistics

**Endpoint:** `GET /api/v1/users/:id/stats`

**Description:** Get comprehensive user statistics

**Response 200 OK:**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "john.doe@example.com",
  "full_name": "John Doe",
  "status": "ACTIVE",
  "is_verified": true,
  "mfa_enabled": true,
  "created_at": "2024-01-15T10:30:00Z",
  
  "tenants_count": 5,
  "active_memberships": 4,
  "primary_tenant_count": 1,
  
  "roles_count": 12,
  "groups_count": 8,
  "delegations_count": 3,
  
  "sessions_count": 45,
  "active_sessions": 2,
  "devices_count": 4,
  "last_login_at": "2024-01-20T09:30:00Z",
  "last_activity_at": "2024-01-20T14:25:00Z",
  "total_logins_count": 245,
  
  "failed_logins_count": 3,
  "last_failed_login_at": "2024-01-10T08:15:00Z"
}
```

---

### 8. Get User Activities

**Endpoint:** `GET /api/v1/users/:id/activities`

**Description:** Get paginated list of user activities

**Query Parameters:**
| Parameter | Type | Required | Description | Default |
|-----------|------|----------|-------------|---------|
| `limit` | integer | No | Results per page | 50 |
| `offset` | integer | No | Pagination offset | 0 |
| `action` | string | No | Filter by action | - |

**Response 200 OK:**
```json
[
  {
    "_id": "770g0622-g4bd-63f6-c938-668877662222",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "tenant_id": "440d7300-d18a-30c3-9605-335544339999",
    "action": "UPDATE",
    "resource": "user",
    "resource_id": "550e8400-e29b-41d4-a716-446655440000",
    "details": "Updated profile information",
    "ip_address": "1.2.3.4",
    "user_agent": "Mozilla/5.0...",
    "status": "SUCCESS",
    "event_time": "2024-01-20T14:25:00Z"
  }
]
```

---

### 9. Get User Tenants

**Endpoint:** `GET /api/v1/users/:id/tenants`

**Description:** Get list of tenants user belongs to

**Response 200 OK:**
```json
[
  {
    "tenant_id": "440d7300-d18a-30c3-9605-335544339999",
    "tenant_code": "acme-corp",
    "tenant_name": "ACME Corporation",
    "tenant_tier": "ENTERPRISE",
    "display_name": "John D.",
    "status": "ACTIVE",
    "joined_at": "2024-01-15T11:00:00Z",
    "roles_count": 3,
    "is_primary": true
  }
]
```

---

### 10. Get User Sessions

**Endpoint:** `GET /api/v1/users/:id/sessions`

**Description:** Get list of user's active sessions

**Response 200 OK:**
```json
[
  {
    "_id": "880h1733-h5ce-74g7-d049-779988773333",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "tenant_id": "440d7300-d18a-30c3-9605-335544339999",
    "device_id": "990i2844-i6df-85h8-e150-880099884444",
    "ip_address": "1.2.3.4",
    "user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    "is_active": true,
    "last_seen_at": "2024-01-20T14:25:00Z",
    "expires_at": "2024-01-27T14:25:00Z",
    "created_at": "2024-01-20T09:30:00Z"
  }
]
```

---

### 11. Get User Devices

**Endpoint:** `GET /api/v1/users/:id/devices`

**Description:** Get list of user's registered devices

**Response 200 OK:**
```json
[
  {
    "_id": "990i2844-i6df-85h8-e150-880099884444",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "device_name": "MacBook Pro",
    "device_type": "DESKTOP",
    "os": "macOS 14.2",
    "browser": "Chrome 120.0",
    "is_trusted": true,
    "last_seen_at": "2024-01-20T14:25:00Z",
    "created_at": "2024-01-15T10:30:00Z"
  }
]
```

---

### 12. Revoke Session

**Endpoint:** `DELETE /api/v1/users/:id/sessions/:session_id`

**Description:** Revoke/logout a specific user session

**Response 200 OK:**
```json
{
  "message": "Session revoked successfully"
}
```

---

### 13. Remove Device

**Endpoint:** `DELETE /api/v1/users/:id/devices/:device_id`

**Description:** Remove a registered device

**Response 200 OK:**
```json
{
  "message": "Device removed successfully"
}
```

---

## Error Handling

### Error Response Format
```json
{
  "error": "Error message describing what went wrong",
  "code": "ERROR_CODE",
  "details": {
    "field": "Specific field that caused error"
  }
}
```

### Common Error Codes

| Status Code | Error Code | Description |
|-------------|------------|-------------|
| 400 | INVALID_REQUEST | Invalid request body or parameters |
| 401 | UNAUTHORIZED | Missing or invalid authentication |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Resource not found |
| 409 | CONFLICT | Resource already exists |
| 422 | VALIDATION_ERROR | Input validation failed |
| 429 | RATE_LIMIT_EXCEEDED | Too many requests |
| 500 | INTERNAL_ERROR | Server error |

---

## Rate Limiting

### Limits
- **Anonymous requests:** 100 requests/hour
- **Authenticated requests:** 1000 requests/hour
- **Admin requests:** 5000 requests/hour

### Headers
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642689600
```

---

## Complete API Summary

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/users` | GET | List users | Yes |
| `/users/:id` | GET | Get user details | Yes |
| `/users` | POST | Create user | Yes |
| `/users/:id` | PATCH | Update user | Yes |
| `/users/:id/status` | PATCH | Update status | Yes (Admin) |
| `/users/:id` | DELETE | Delete user | Yes (Admin) |
| `/users/:id/stats` | GET | Get statistics | Yes |
| `/users/:id/activities` | GET | Get activities | Yes |
| `/users/:id/tenants` | GET | Get tenants | Yes |
| `/users/:id/sessions` | GET | Get sessions | Yes |
| `/users/:id/devices` | GET | Get devices | Yes |
| `/users/:id/sessions/:sid` | DELETE | Revoke session | Yes |
| `/users/:id/devices/:did` | DELETE | Remove device | Yes |

**Total Endpoints:** 13

---

**API Version:** 1.0  
**Last Updated:** 2024-01-20  
**Status:** Production Ready ✅
