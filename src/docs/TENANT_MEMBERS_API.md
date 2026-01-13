# Tenant Members API Documentation

## Overview

Tenant Members API quản lý mối quan hệ giữa users và tenants. Mỗi user có thể là thành viên của nhiều tenants với các vai trò khác nhau (OWNER, ADMIN, MEMBER, VIEWER).

## Database Schema

### Table: tenant_members

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| _id | UUID | NO | Primary key |
| tenant_id | UUID | NO | FK → tenants(_id) |
| user_id | UUID | NO | FK → users(_id) |
| employee_code | VARCHAR(50) | YES | Mã nhân viên nội bộ |
| internal_email | VARCHAR(255) | YES | Email nội bộ công ty |
| job_title | VARCHAR(100) | YES | Chức danh |
| manager_id | UUID | YES | FK → tenant_members(_id) - Self-referencing |
| role | VARCHAR(50) | NO | Vai trò: OWNER, ADMIN, MEMBER, VIEWER |
| status | VARCHAR(20) | NO | Trạng thái: ACTIVE, RESIGNED, ONBOARDING, SUSPENDED |
| joined_at | DATE | YES | Ngày vào làm |
| left_at | DATE | YES | Ngày nghỉ việc |
| permissions | JSONB | YES | Custom permissions array |
| metadata | JSONB | YES | Additional metadata |
| created_at | TIMESTAMPTZ | NO | Timestamp creation |
| updated_at | TIMESTAMPTZ | NO | Timestamp last update |
| created_by | UUID | YES | User UUID who created |
| updated_by | UUID | YES | User UUID who updated |
| deleted_at | TIMESTAMPTZ | YES | Soft delete timestamp |
| deleted_by | UUID | YES | User UUID who deleted |
| version | BIGINT | NO | Optimistic locking version |

### Relationships

- **tenant_members.tenant_id** → tenants._id (Many-to-One)
- **tenant_members.user_id** → users._id (Many-to-One)
- **tenant_members.manager_id** → tenant_members._id (Self-referencing)

## API Endpoints

### Base URL
```
https://<project-id>.supabase.co/functions/v1/make-server-7eedb4e0/api/core
```

### Authentication
All endpoints require Bearer token authentication:
```
Authorization: Bearer <publicAnonKey>
```

---

## 1. Get All Tenant Members

### Endpoint
```
GET /tenant-members
```

### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| tenant_id | UUID | No | Filter by tenant |
| user_id | UUID | No | Filter by user |
| status | String | No | Filter by status: ACTIVE, RESIGNED, ONBOARDING, SUSPENDED |
| role | String | No | Filter by role: OWNER, ADMIN, MEMBER, VIEWER |

### Response
```json
{
  "success": true,
  "data": [
    {
      "_id": "tm_1234567890_abc123",
      "tenant_id": "tenant-uuid",
      "user_id": "user-uuid",
      "employee_code": "EMP-001",
      "internal_email": "john@company.com",
      "job_title": "Senior Developer",
      "manager_id": "manager-member-uuid",
      "role": "MEMBER",
      "status": "ACTIVE",
      "joined_at": "2024-01-15",
      "left_at": null,
      "permissions": [],
      "metadata": {},
      "created_at": "2024-01-15T00:00:00Z",
      "updated_at": "2024-01-15T00:00:00Z",
      "version": 1
    }
  ],
  "total": 1
}
```

---

## 2. Get Tenant Member by ID

### Endpoint
```
GET /tenant-members/:id
```

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | String | Yes | Tenant member ID |

### Response
```json
{
  "success": true,
  "data": {
    "_id": "tm_1234567890_abc123",
    "tenant_id": "tenant-uuid",
    "user_id": "user-uuid",
    "employee_code": "EMP-001",
    "internal_email": "john@company.com",
    "job_title": "Senior Developer",
    "manager_id": "manager-member-uuid",
    "role": "MEMBER",
    "status": "ACTIVE",
    "joined_at": "2024-01-15",
    "left_at": null,
    "permissions": [],
    "metadata": {},
    "created_at": "2024-01-15T00:00:00Z",
    "updated_at": "2024-01-15T00:00:00Z",
    "version": 1
  }
}
```

---

## 3. Create Tenant Member

### Endpoint
```
POST /tenant-members
```

### Request Body
```json
{
  "tenant_id": "tenant-uuid",
  "user_id": "user-uuid",
  "employee_code": "EMP-001",
  "internal_email": "john@company.com",
  "job_title": "Senior Developer",
  "manager_id": "manager-member-uuid",
  "role": "MEMBER",
  "status": "ACTIVE",
  "joined_at": "2024-01-15",
  "permissions": [],
  "metadata": {}
}
```

### Response
```json
{
  "success": true,
  "data": {
    "_id": "tm_1234567890_abc123",
    "tenant_id": "tenant-uuid",
    "user_id": "user-uuid",
    "employee_code": "EMP-001",
    "internal_email": "john@company.com",
    "job_title": "Senior Developer",
    "manager_id": "manager-member-uuid",
    "role": "MEMBER",
    "status": "ACTIVE",
    "joined_at": "2024-01-15",
    "left_at": null,
    "permissions": [],
    "metadata": {},
    "created_at": "2024-01-15T00:00:00Z",
    "updated_at": "2024-01-15T00:00:00Z",
    "version": 1
  },
  "message": "Tenant member created successfully"
}
```

---

## 4. Update Tenant Member

### Endpoint
```
PUT /tenant-members/:id
```

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | String | Yes | Tenant member ID |

### Request Body
```json
{
  "employee_code": "EMP-002",
  "internal_email": "john.doe@company.com",
  "job_title": "Lead Developer",
  "manager_id": "new-manager-uuid",
  "role": "ADMIN",
  "status": "ACTIVE",
  "version": 1
}
```

### Response
```json
{
  "success": true,
  "data": {
    "_id": "tm_1234567890_abc123",
    "tenant_id": "tenant-uuid",
    "user_id": "user-uuid",
    "employee_code": "EMP-002",
    "internal_email": "john.doe@company.com",
    "job_title": "Lead Developer",
    "manager_id": "new-manager-uuid",
    "role": "ADMIN",
    "status": "ACTIVE",
    "joined_at": "2024-01-15",
    "left_at": null,
    "permissions": [],
    "metadata": {},
    "created_at": "2024-01-15T00:00:00Z",
    "updated_at": "2024-01-16T00:00:00Z",
    "version": 2
  },
  "message": "Tenant member updated successfully"
}
```

---

## 5. Delete Tenant Member (Soft Delete)

### Endpoint
```
DELETE /tenant-members/:id
```

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | String | Yes | Tenant member ID |

### Response
```json
{
  "success": true,
  "message": "Tenant member deleted successfully"
}
```

---

## 6. Get Direct Reports (Subordinates)

### Endpoint
```
GET /tenant-members/:id/subordinates
```

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | String | Yes | Manager's member ID |

### Response
```json
{
  "success": true,
  "data": [
    {
      "_id": "tm_subordinate_1",
      "tenant_id": "tenant-uuid",
      "user_id": "user-uuid-1",
      "employee_code": "EMP-010",
      "job_title": "Developer",
      "manager_id": "tm_1234567890_abc123",
      "role": "MEMBER",
      "status": "ACTIVE",
      "joined_at": "2024-02-01",
      "created_at": "2024-02-01T00:00:00Z",
      "updated_at": "2024-02-01T00:00:00Z",
      "version": 1
    }
  ],
  "total": 1
}
```

---

## 7. Bulk Create Tenant Members

### Endpoint
```
POST /tenant-members/bulk
```

### Request Body
```json
{
  "members": [
    {
      "tenant_id": "tenant-uuid",
      "user_id": "user-uuid-1",
      "employee_code": "EMP-001",
      "job_title": "Developer",
      "role": "MEMBER",
      "status": "ACTIVE"
    },
    {
      "tenant_id": "tenant-uuid",
      "user_id": "user-uuid-2",
      "employee_code": "EMP-002",
      "job_title": "Senior Developer",
      "role": "ADMIN",
      "status": "ACTIVE"
    }
  ]
}
```

### Response
```json
{
  "success": true,
  "data": {
    "created": [
      {
        "_id": "tm_1234567890_abc123",
        "tenant_id": "tenant-uuid",
        "user_id": "user-uuid-1",
        "employee_code": "EMP-001",
        "job_title": "Developer",
        "role": "MEMBER",
        "status": "ACTIVE",
        "created_at": "2024-01-15T00:00:00Z",
        "updated_at": "2024-01-15T00:00:00Z",
        "version": 1
      }
    ],
    "errors": []
  },
  "message": "Created 2 tenant members"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    "tenant_id is required",
    "user_id is required"
  ]
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Tenant member not found"
}
```

### 409 Conflict
```json
{
  "success": false,
  "error": "User is already a member of this tenant"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Failed to create tenant member",
  "details": "Error message details"
}
```

---

## Business Rules

1. **Unique Constraint**: A user can only be a member of a tenant once (unique combination of tenant_id + user_id)

2. **Role Hierarchy**:
   - OWNER: Full control over tenant
   - ADMIN: Can manage members and settings
   - MEMBER: Regular member with standard permissions
   - VIEWER: Read-only access

3. **Status Values**:
   - ACTIVE: Currently working
   - ONBOARDING: New member in training period
   - SUSPENDED: Temporarily inactive
   - RESIGNED: No longer working (left_at date should be set)

4. **Soft Delete**: Records are never physically deleted, only marked as deleted with deleted_at timestamp

5. **Optimistic Locking**: Version field prevents concurrent update conflicts

6. **Manager Hierarchy**: manager_id creates a reporting structure within the tenant

7. **Audit Trail**: All creates, updates, and deletes are tracked with timestamps and user IDs

---

## Use Cases

### 1. Add New Employee to Tenant
```typescript
// 1. Create user account first
POST /api/core/users
{
  "email": "newuser@company.com",
  "name": "New User",
  "password": "SecurePassword123"
}

// 2. Add as tenant member
POST /api/core/tenant-members
{
  "tenant_id": "company-tenant-uuid",
  "user_id": "new-user-uuid",
  "employee_code": "EMP-100",
  "job_title": "Junior Developer",
  "role": "MEMBER",
  "status": "ONBOARDING",
  "joined_at": "2024-01-15"
}
```

### 2. Promote Member to Admin
```typescript
PUT /api/core/tenant-members/:member-id
{
  "role": "ADMIN",
  "version": 1
}
```

### 3. Handle Employee Resignation
```typescript
PUT /api/core/tenant-members/:member-id
{
  "status": "RESIGNED",
  "left_at": "2024-12-31",
  "version": 2
}
```

### 4. Get All Members of a Tenant
```typescript
GET /api/core/tenant-members?tenant_id=company-uuid&status=ACTIVE
```

### 5. Get User's Tenants
```typescript
GET /api/core/tenant-members?user_id=user-uuid&status=ACTIVE
```

---

## Frontend Integration

### React Component Example
```typescript
import { useState, useEffect } from 'react';

function TenantMembersList({ tenantId }) {
  const [members, setMembers] = useState([]);
  
  useEffect(() => {
    fetch(`/api/core/tenant-members?tenant_id=${tenantId}`, {
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
      }
    })
    .then(res => res.json())
    .then(data => setMembers(data.data));
  }, [tenantId]);
  
  return (
    <div>
      {members.map(member => (
        <div key={member._id}>
          {member.user_name} - {member.job_title}
        </div>
      ))}
    </div>
  );
}
```

---

## Testing

### Sample Test Data
```json
{
  "tenants": [
    { "_id": "tenant-1", "code": "acme-corp", "name": "ACME Corp" }
  ],
  "users": [
    { "_id": "user-1", "email": "john@acme.com", "name": "John Doe" },
    { "_id": "user-2", "email": "jane@acme.com", "name": "Jane Smith" }
  ],
  "tenant_members": [
    {
      "tenant_id": "tenant-1",
      "user_id": "user-1",
      "employee_code": "EMP-001",
      "job_title": "CEO",
      "role": "OWNER",
      "status": "ACTIVE"
    },
    {
      "tenant_id": "tenant-1",
      "user_id": "user-2",
      "employee_code": "EMP-002",
      "job_title": "CTO",
      "role": "ADMIN",
      "status": "ACTIVE",
      "manager_id": "member-id-of-user-1"
    }
  ]
}
```

---

## Related Documentation

- [Tenants API Documentation](./tenant-api-docs.md)
- [Users API Documentation](./user-api-docs.md)
- [Database Schema Standard](../DATABASE_SCHEMA_STANDARD.md)
- [Developer Guide - Tenants](./DEVELOPER_GUIDE_TENANTS.md)
