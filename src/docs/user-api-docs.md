# User Management API Documentation

## Overview
Complete REST API for user management with role-based access control, audit trails, and optimistic locking.

**Base URL:** `/api/core`

**Full URL Pattern:** `https://{PROJECT_ID}.supabase.co/functions/v1/api/core`

**Authentication:** Bearer token required for all operations

---

## Endpoints

### 1. List Users
```http
GET /users
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `role` | string | Filter by role: `SUPER_ADMIN`, `ADMIN`, `USER`, `MODERATOR`, `VIEWER` |
| `status` | string | Filter by status: `ACTIVE`, `INACTIVE`, `SUSPENDED`, `PENDING` |
| `tenant_id` | string | Filter by tenant ID (use `"null"` for platform admins) |
| `search` | string | Search in name or email |
| `limit` | number | Results per page (default: 50) |
| `offset` | number | Pagination offset (default: 0) |

**Response:**
```json
{
  "data": [
    {
      "_id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "avatar": "https://...",
      "phone": "+1234567890",
      "location": "San Francisco, CA",
      "department": "Engineering",
      "position": "Senior Developer",
      "bio": "Full-stack developer",
      "role": "USER",
      "status": "ACTIVE",
      "email_verified": true,
      "last_login_at": "2024-01-15T10:30:00Z",
      "tenant_id": "tenant-uuid",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-15T00:00:00Z",
      "created_by": "admin-uuid",
      "updated_by": "admin-uuid",
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

**Notes:**
- `password_hash` is never returned in responses
- Join with `tenants` table for tenant name

---

### 2. Get Single User
```http
GET /users/:id
```

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | User ID |

**Response:**
```json
{
  "data": { /* Same as list item */ }
}
```

**Error Responses:**
- `404 Not Found` - User not found
- `500 Internal Server Error` - Server error

---

### 3. Create User
```http
POST /users
```

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "SecurePass123!",
  "name": "Jane Smith",
  "avatar": "https://...",
  "phone": "+1234567890",
  "location": "New York, NY",
  "department": "Marketing",
  "position": "Marketing Manager",
  "bio": "Digital marketing specialist",
  "role": "USER",
  "status": "ACTIVE",
  "tenant_id": "tenant-uuid"
}
```

**Required Fields:**
- `email` - Valid email address
- `password` - Strong password (min 8 chars, uppercase, lowercase, number, special char)
- `name` - Full name

**Validation Rules:**
- `email`: 5-255 characters, valid email format, must be unique
- `password`: 8-100 characters, must match pattern `/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/`
- `name`: 2-255 characters
- `phone`: Max 20 characters, matches `/^\+?[0-9\s-()]+$/`
- `role`: One of `SUPER_ADMIN`, `ADMIN`, `USER`, `MODERATOR`, `VIEWER`
- `status`: One of `ACTIVE`, `INACTIVE`, `SUSPENDED`, `PENDING`

**Response:**
```json
{
  "data": { /* Created user (without password_hash) */ }
}
```

**Error Responses:**
- `400 Bad Request` - Validation failed
- `401 Unauthorized` - Missing or invalid token
- `409 Conflict` - Email already exists
- `500 Internal Server Error` - Server error

---

### 4. Update User
```http
PATCH /users/:id
```

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:** (all fields optional, partial update)
```json
{
  "name": "Jane Smith-Johnson",
  "phone": "+1234567891",
  "position": "Senior Marketing Manager",
  "role": "ADMIN",
  "status": "ACTIVE",
  "version": 1
}
```

**Password Update:**
```json
{
  "password": "NewSecurePass456!",
  "version": 1
}
```

**Optimistic Locking:**
Include `version` field to prevent concurrent updates. Server will reject if version doesn't match.

**Response:**
```json
{
  "data": { /* Updated user with incremented version */ }
}
```

**Error Responses:**
- `400 Bad Request` - Validation failed
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - User not found
- `409 Conflict` - Version conflict or email already exists
- `500 Internal Server Error` - Server error

---

### 5. Delete User (Soft Delete)
```http
DELETE /users/:id
```

**Headers:**
```
Authorization: Bearer <token>
```

**Business Logic:**
- Cannot delete your own account
- Sets `deleted_at` and `deleted_by` fields
- User still exists in database but filtered out from queries

**Response:**
```json
{
  "data": { /* Deleted user */ },
  "message": "User deleted successfully"
}
```

**Error Responses:**
- `400 Bad Request` - Cannot delete self
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - User not found or already deleted
- `500 Internal Server Error` - Server error

---

### 6. Get User Activity
```http
GET /users/:id/activity
```

**Description:** Returns user activity logs from `user_activities` table

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | number | Results per page (default: 50) |
| `offset` | number | Pagination offset (default: 0) |

**Response:**
```json
{
  "data": [
    {
      "_id": "uuid",
      "userId": "user-uuid",
      "action": "LOGIN",
      "description": "User logged in",
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 50,
    "limit": 50,
    "offset": 0,
    "has_more": false
  }
}
```

---

## Database Schema

### Table: `users`

**Type:** GLOBAL TABLE

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `_id` | UUID | PRIMARY KEY, NOT NULL | Unique identifier |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | Email address (login) |
| `password_hash` | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| `name` | VARCHAR(255) | NOT NULL | Full name |
| `avatar` | TEXT | NULLABLE | Avatar URL |
| `phone` | VARCHAR(20) | NULLABLE | Phone number |
| `location` | VARCHAR(255) | NULLABLE | Location/address |
| `department` | VARCHAR(100) | NULLABLE | Department name |
| `position` | VARCHAR(100) | NULLABLE | Job position/title |
| `bio` | TEXT | NULLABLE | Biography |
| `role` | VARCHAR(50) | NOT NULL, DEFAULT 'USER' | User role |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT 'ACTIVE' | Account status |
| `email_verified` | BOOLEAN | NOT NULL, DEFAULT false | Email verification status |
| `last_login_at` | TIMESTAMPTZ | NULLABLE | Last login timestamp |
| `tenant_id` | UUID | NULLABLE | Tenant for multi-tenancy (NULL = platform admin) |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Last update timestamp |
| `created_by` | UUID | NULLABLE | User who created |
| `updated_by` | UUID | NULLABLE | User who last updated |
| `deleted_at` | TIMESTAMPTZ | NULLABLE | Soft delete timestamp |
| `deleted_by` | UUID | NULLABLE | User who deleted |
| `version` | BIGINT | NOT NULL, DEFAULT 1 | Optimistic locking version |

**Indexes:**
```sql
CREATE UNIQUE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_tenant ON users(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_created_at ON users(created_at DESC);
```

---

## User Roles

| Role | Description | Typical Permissions |
|------|-------------|---------------------|
| `SUPER_ADMIN` | Platform administrator | Full system access, manage all tenants |
| `ADMIN` | Tenant administrator | Full tenant access, manage users |
| `USER` | Standard user | Basic application access |
| `MODERATOR` | Content moderator | Content management, user support |
| `VIEWER` | Read-only user | View-only access to resources |

---

## User Statuses

| Status | Description |
|--------|-------------|
| `ACTIVE` | Account is active and user can log in |
| `INACTIVE` | Account is inactive, user cannot log in |
| `SUSPENDED` | Account suspended due to violation |
| `PENDING` | Account pending activation (e.g., email verification) |

---

## Password Security

### Hashing
- Algorithm: bcrypt with 10 salt rounds
- Passwords are hashed server-side before storage
- Plain passwords are never stored in database

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (@$!%*?&)

**Regex Pattern:**
```regex
^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$
```

---

## Multi-Tenancy

### Tenant Association
- Users can belong to a tenant via `tenant_id` field
- Platform administrators have `tenant_id = NULL`
- Tenant-specific users have restricted access to their tenant's resources

### Querying
```bash
# Get all platform admins
curl https://PROJECT.supabase.co/functions/v1/api/core/users?tenant_id=null

# Get users for specific tenant
curl https://PROJECT.supabase.co/functions/v1/api/core/users?tenant_id=TENANT_UUID
```

---

## Error Handling

All endpoints return consistent error format:

```json
{
  "error": "Error message",
  "details": [ // Optional for validation errors
    {
      "field": "email",
      "message": "Invalid email format"
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
2. **Never send plain passwords** over insecure connections
3. **Validate input on both client and server** for better UX and security
4. **Use appropriate roles** for access control
5. **Monitor user activity** via activity logs
6. **Implement rate limiting** for authentication attempts
7. **Enforce strong passwords** in production
8. **Use soft delete** to maintain audit trail

---

## Examples

### Create New User
```bash
curl -X POST https://PROJECT.supabase.co/functions/v1/api/core/users \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "SecurePass123!",
    "name": "John Doe",
    "role": "USER",
    "department": "Engineering",
    "position": "Developer"
  }'
```

### Update User with Optimistic Locking
```bash
curl -X PATCH https://PROJECT.supabase.co/functions/v1/api/core/users/USER_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "ADMIN",
    "version": 1
  }'
```

### Search Users
```bash
# Search by name or email
curl "https://PROJECT.supabase.co/functions/v1/api/core/users?search=john" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Filter by role and status
curl "https://PROJECT.supabase.co/functions/v1/api/core/users?role=ADMIN&status=ACTIVE" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get User Activity
```bash
curl "https://PROJECT.supabase.co/functions/v1/api/core/users/USER_ID/activity?limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```