# 📚 VHV Platform - Golang API Reference

## Base URL
```
http://localhost:8080
```

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { /* your data */ }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description"
  }
}
```

---

## 🔐 Authentication
*Coming soon - JWT authentication*

---

## 📋 Roles API

### List All Roles
```http
GET /api/v1/roles
```

**Query Parameters:**
- `tenant_id` (string) - Filter by tenant
- `type` (string) - Filter by type: SYSTEM, CUSTOM
- `search` (string) - Search in name/description

**Example:**
```bash
curl "http://localhost:8080/api/v1/roles?tenant_id=078e19ae-af67-4452-9ccd-10e27acb2dfe&type=CUSTOM"
```

### Get Role by ID
```http
GET /api/v1/roles/:id
```

### Create Role
```http
POST /api/v1/roles
Content-Type: application/json

{
  "tenant_id": "uuid",
  "name": "string",
  "description": "string",
  "type": "CUSTOM",
  "permission_codes": ["users.read", "users.write"]
}
```

### Update Role
```http
PATCH /api/v1/roles/:id
Content-Type: application/json

{
  "name": "string",
  "description": "string",
  "permission_codes": ["users.read"]
}
```

### Delete Role
```http
DELETE /api/v1/roles/:id
```

---

## 👥 Users API

### List All Users
```http
GET /api/v1/users
```

**Query Parameters:**
- `status` (string) - ACTIVE, INACTIVE, SUSPENDED, PENDING
- `is_support_staff` (boolean)
- `mfa_enabled` (boolean)
- `locale` (string) - vi, en, es, ja, ko, zh
- `search` (string) - Search in name/email

### Get User by ID
```http
GET /api/v1/users/:id
```

### Get User by Email
```http
GET /api/v1/users/email/:email
```

### Create User
```http
POST /api/v1/users
Content-Type: application/json

{
  "email": "user@example.com",
  "full_name": "John Doe",
  "phone_number": "+84912345678",
  "status": "ACTIVE",
  "locale": "vi",
  "metadata": {
    "department": "Engineering"
  }
}
```

### Update User
```http
PATCH /api/v1/users/:id
Content-Type: application/json

{
  "full_name": "Jane Doe",
  "phone_number": "+84987654321"
}
```

### Update User Status
```http
PATCH /api/v1/users/:id/status
Content-Type: application/json

{
  "status": "SUSPENDED"
}
```

### Enable MFA
```http
POST /api/v1/users/:id/mfa/enable
```

### Disable MFA
```http
POST /api/v1/users/:id/mfa/disable
```

### Delete User
```http
DELETE /api/v1/users/:id
```

---

## 🏢 Tenants API

### List All Tenants
```http
GET /api/v1/tenants
```

**Query Parameters:**
- `tier` (string) - FREE, PRO, ENTERPRISE
- `status` (string) - TRIAL, ACTIVE, SUSPENDED, CANCELLED
- `parent_tenant_id` (string)
- `data_region` (string)
- `search` (string)

### Get Tenant by ID
```http
GET /api/v1/tenants/:id
```

### Get Tenant by Code
```http
GET /api/v1/tenants/code/:code
```

### Create Tenant
```http
POST /api/v1/tenants
Content-Type: application/json

{
  "code": "acme-corp",
  "name": "ACME Corporation",
  "tier": "ENTERPRISE",
  "status": "ACTIVE",
  "data_region": "ap-southeast-1",
  "timezone": "Asia/Ho_Chi_Minh",
  "profile": {
    "industry": "Technology",
    "employee_count": 100
  }
}
```

### Update Tenant
```http
PATCH /api/v1/tenants/:id
Content-Type: application/json

{
  "name": "ACME Corp Updated",
  "tier": "PRO"
}
```

### Delete Tenant
```http
DELETE /api/v1/tenants/:id
```

---

## 🔑 Permissions API

### List All Permissions
```http
GET /api/v1/permissions
```

**Query Parameters:**
- `category` (string) - USERS, ROLES, TENANTS, etc.
- `type` (string) - READ, WRITE, DELETE, MANAGE
- `resource_type` (string)
- `is_system` (boolean)
- `search` (string)

### Get Permissions Grouped by Category
```http
GET /api/v1/permissions/grouped
```

**Response:**
```json
{
  "success": true,
  "data": {
    "USERS": [...],
    "ROLES": [...],
    "TENANTS": [...]
  }
}
```

### Get Permission by ID
```http
GET /api/v1/permissions/:id
```

### Get Permission by Code
```http
GET /api/v1/permissions/code/:code
```

### Create Permission
```http
POST /api/v1/permissions
Content-Type: application/json

{
  "code": "users.read",
  "name": "Read Users",
  "description": "Permission to view user information",
  "category": "USERS",
  "type": "READ",
  "sort_order": 10
}
```

### Validate Permission Codes
```http
POST /api/v1/permissions/validate
Content-Type: application/json

{
  "codes": ["users.read", "users.write", "invalid.code"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "valid": false,
    "invalid": ["invalid.code"]
  }
}
```

### Update Permission
```http
PATCH /api/v1/permissions/:id
Content-Type: application/json

{
  "name": "View Users",
  "description": "Updated description"
}
```

**Note:** Cannot modify system permissions (is_system=true)

### Delete Permission
```http
DELETE /api/v1/permissions/:id
```

**Note:** Cannot delete system permissions

---

## 🏥 Health Check

### Check API Health
```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "message": "VHV Platform API is running"
}
```

---

## 🎯 Permission Categories

- **USERS** - User management permissions
- **ROLES** - Role management permissions
- **TENANTS** - Tenant management permissions
- **APPLICATIONS** - Application management permissions
- **PRODUCTS** - Product management permissions
- **PACKAGES** - Package management permissions
- **ORDERS** - Order management permissions
- **INVOICES** - Invoice management permissions
- **SUBSCRIPTIONS** - Subscription management permissions
- **WEBHOOKS** - Webhook management permissions
- **ANNOUNCEMENTS** - Announcement management permissions
- **SETTINGS** - System settings permissions
- **REPORTS** - Report management permissions
- **SYSTEM** - System administration permissions

---

## 📊 Permission Types

- **READ** - View/list resources
- **WRITE** - Create and update resources
- **DELETE** - Delete resources
- **MANAGE** - Full management (all operations)

---

## 🚨 Error Codes

- `VALIDATION_ERROR` - Request validation failed
- `NOT_FOUND` - Resource not found
- `INTERNAL_ERROR` - Internal server error
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Access denied
- `EMAIL_EXISTS` - Email already registered
- `CODE_EXISTS` - Code already exists
- `CREATE_ERROR` - Failed to create resource
- `UPDATE_ERROR` - Failed to update resource
- `DELETE_ERROR` - Failed to delete resource
- `SYSTEM_PERMISSION` - Cannot modify system permission/role

---

## 📝 Notes

1. All IDs use UUID format
2. All timestamps are in ISO 8601 format
3. Soft deletes are used (deleted_at field)
4. Optimistic locking via version field
5. All string searches are case-insensitive (ILIKE)
6. Default locale is "vi" (Vietnamese)
7. System permissions/roles cannot be modified or deleted

---

**Version:** 1.0.0  
**Last Updated:** 2026-01-20
