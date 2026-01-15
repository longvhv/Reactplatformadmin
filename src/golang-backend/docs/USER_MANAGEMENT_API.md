# 👤 User Management API Documentation

## 📋 **Overview**

API quản lý người dùng (User Management) cho phép thực hiện các thao tác CRUD, authentication, authorization và quản lý profile người dùng trong hệ thống.

**Base URL:** `/api/users`  
**Authentication:** Required (Bearer Token)  
**Rate Limit:** 100 requests/minute  

---

## 🏗️ **Architecture**

```
┌─────────────┐
│   Handler   │ → HTTP Request/Response, Validation
└──────┬──────┘
       │
┌──────▼──────┐
│   Service   │ → Business Logic, Transaction Management
└──────┬──────┘
       │
┌──────▼──────┐
│  Database   │ → PostgreSQL với soft delete
└─────────────┘
```

### **Layers:**

1. **Handler Layer** (`api/users_handler.go`)
   - HTTP request parsing
   - Input validation
   - Response formatting
   - Error handling

2. **Service Layer** (`services/user_service.go`)
   - Business logic
   - Data validation
   - Transaction management
   - Error wrapping

3. **Model Layer** (`models/user.go`)
   - Data structures
   - DTOs (Data Transfer Objects)
   - Constants

---

## 📊 **Database Schema**

```sql
CREATE TABLE users (
  -- I. ĐỊNH DANH (IDENTITY)
  _id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255),
  full_name     TEXT NOT NULL,
  avatar_url    TEXT,
  phone_number  VARCHAR(20) UNIQUE,

  -- II. TRẠNG THÁI & BẢO MẬT
  status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
                  CHECK (status IN ('ACTIVE', 'BANNED', 'DISABLED', 'PENDING')),
  is_support_staff BOOLEAN NOT NULL DEFAULT FALSE,
  mfa_enabled     BOOLEAN NOT NULL DEFAULT FALSE,
  mfa_secret      TEXT,
  is_verified     BOOLEAN NOT NULL DEFAULT FALSE,

  -- III. CẤU HÌNH
  locale        VARCHAR(10) NOT NULL DEFAULT 'vi-VN',
  metadata      JSONB NOT NULL DEFAULT '{}',

  -- IV. AUDIT
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone_number);
CREATE INDEX idx_users_status ON users(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NOT NULL;
```

---

## 🔐 **User Model**

```go
type User struct {
    ID             string                 `json:"_id"`
    Email          string                 `json:"email"`
    PasswordHash   *string                `json:"-"` // Hidden
    FullName       string                 `json:"full_name"`
    AvatarURL      *string                `json:"avatar_url,omitempty"`
    PhoneNumber    *string                `json:"phone_number,omitempty"`
    Status         string                 `json:"status"`
    IsSupportStaff bool                   `json:"is_support_staff"`
    MFAEnabled     bool                   `json:"mfa_enabled"`
    MFASecret      *string                `json:"-"` // Hidden
    IsVerified     bool                   `json:"is_verified"`
    Locale         string                 `json:"locale"`
    Metadata       map[string]interface{} `json:"metadata"`
    CreatedAt      time.Time              `json:"created_at"`
    UpdatedAt      time.Time              `json:"updated_at"`
    DeletedAt      *time.Time             `json:"deleted_at,omitempty"`
}
```

---

## 📡 **API Endpoints**

### **1. List Users**

```http
GET /api/users
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | integer | No | Page number (default: 1) |
| `limit` | integer | No | Items per page (default: 20, max: 100) |
| `search` | string | No | Search in name, email, phone |
| `status` | string | No | Filter by status: ACTIVE, BANNED, DISABLED, PENDING |
| `verified` | boolean | No | Filter by email verification |
| `support_staff` | boolean | No | Filter support staff |
| `mfa` | boolean | No | Filter MFA enabled users |
| `created_from` | datetime | No | Filter users created after date |
| `created_to` | datetime | No | Filter users created before date |
| `sort_by` | string | No | Sort field: created_at, updated_at, email, full_name |
| `sort_order` | string | No | Sort direction: asc, desc |

**Response:**

```json
{
  "data": [
    {
      "_id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "full_name": "Nguyễn Văn A",
      "avatar_url": "https://cdn.example.com/avatar.jpg",
      "phone_number": "+84901234567",
      "status": "ACTIVE",
      "is_support_staff": false,
      "mfa_enabled": true,
      "is_verified": true,
      "locale": "vi-VN",
      "metadata": {},
      "created_at": "2026-01-15T10:30:00Z",
      "updated_at": "2026-01-15T10:30:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "total_pages": 8,
    "has_next": true,
    "has_prev": false
  }
}
```

**Example:**

```bash
curl -X GET "https://api.example.com/api/users?page=1&limit=20&status=ACTIVE&verified=true" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### **2. Get User by ID**

```http
GET /api/users/{id}
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | User ID |

**Response:**

```json
{
  "_id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "full_name": "Nguyễn Văn A",
  "avatar_url": "https://cdn.example.com/avatar.jpg",
  "phone_number": "+84901234567",
  "status": "ACTIVE",
  "is_support_staff": false,
  "mfa_enabled": true,
  "is_verified": true,
  "locale": "vi-VN",
  "metadata": {
    "department": "Engineering",
    "hire_date": "2025-01-01"
  },
  "created_at": "2026-01-15T10:30:00Z",
  "updated_at": "2026-01-15T10:30:00Z"
}
```

**Errors:**

- `400` - Invalid user ID format
- `404` - User not found

---

### **3. Get User by Email**

```http
GET /api/users/email/{email}
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `email` | string | Yes | User email |

**Response:** Same as Get User by ID

---

### **4. Create User**

```http
POST /api/users
```

**Request Body:**

```json
{
  "email": "newuser@example.com",
  "password": "SecurePassword123!",
  "full_name": "Nguyễn Văn B",
  "avatar_url": "https://cdn.example.com/avatar2.jpg",
  "phone_number": "+84909876543",
  "locale": "vi-VN",
  "metadata": {
    "department": "Sales"
  }
}
```

**Validation Rules:**

| Field | Rules |
|-------|-------|
| `email` | Required, valid email format, max 255 chars, unique |
| `password` | Required, min 8 chars, max 128 chars |
| `full_name` | Required, min 1 char, max 255 chars |
| `avatar_url` | Optional, valid URL, max 2048 chars |
| `phone_number` | Optional, max 20 chars, unique |
| `locale` | Optional, one of: vi-VN, en-US, zh-CN, ja-JP, ko-KR, th-TH |
| `metadata` | Optional, valid JSON object |

**Response:**

```json
{
  "_id": "660e8400-e29b-41d4-a716-446655440000",
  "email": "newuser@example.com",
  "full_name": "Nguyễn Văn B",
  "avatar_url": "https://cdn.example.com/avatar2.jpg",
  "phone_number": "+84909876543",
  "status": "ACTIVE",
  "is_support_staff": false,
  "mfa_enabled": false,
  "is_verified": false,
  "locale": "vi-VN",
  "metadata": {
    "department": "Sales"
  },
  "created_at": "2026-01-15T11:00:00Z",
  "updated_at": "2026-01-15T11:00:00Z"
}
```

**Errors:**

- `400` - Invalid request body or validation error
- `409` - Email or phone number already exists

---

### **5. Update User**

```http
PATCH /api/users/{id}
```

**Request Body (all fields optional):**

```json
{
  "full_name": "Nguyễn Văn C",
  "avatar_url": "https://cdn.example.com/new-avatar.jpg",
  "phone_number": "+84912345678",
  "status": "DISABLED",
  "is_support_staff": true,
  "is_verified": true,
  "locale": "en-US",
  "metadata": {
    "department": "Engineering",
    "role": "Senior Developer"
  }
}
```

**Response:** Updated user object

**Errors:**

- `400` - Invalid request or no fields to update
- `404` - User not found

---

### **6. Delete User (Soft Delete)**

```http
DELETE /api/users/{id}
```

**Response:**

```json
{
  "message": "User deleted successfully",
  "id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Errors:**

- `400` - Invalid user ID
- `404` - User not found

---

### **7. Search Users**

```http
GET /api/users/search?q={query}
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` | string | Yes | Search query |
| `limit` | integer | No | Max results (default: 10) |

**Search Fields:**
- Full name (ILIKE)
- Email (ILIKE)
- Phone number (ILIKE)

**Response:**

```json
{
  "data": [
    {
      "_id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "full_name": "Nguyễn Văn A",
      ...
    }
  ],
  "query": "Nguyễn"
}
```

---

### **8. Change Password**

```http
PATCH /api/users/{id}/password
```

**Request Body:**

```json
{
  "old_password": "OldPassword123!",
  "new_password": "NewSecurePassword456!"
}
```

**Response:**

```json
{
  "message": "Password changed successfully"
}
```

**Errors:**

- `401` - Invalid old password
- `400` - Invalid request

---

### **9. Verify User**

```http
POST /api/users/{id}/verify
```

**Response:**

```json
{
  "message": "User verified successfully"
}
```

---

### **10. Toggle MFA**

```http
PATCH /api/users/{id}/mfa
```

**Request Body:**

```json
{
  "enabled": true
}
```

**Response:**

```json
{
  "message": "MFA updated successfully",
  "mfa_enabled": true
}
```

---

### **11. Bulk Actions**

```http
POST /api/users/bulk
```

**Request Body:**

```json
{
  "user_ids": [
    "550e8400-e29b-41d4-a716-446655440000",
    "660e8400-e29b-41d4-a716-446655440001"
  ],
  "action": "disable"
}
```

**Actions:**
- `delete` - Soft delete users
- `disable` - Set status to DISABLED
- `enable` - Set status to ACTIVE
- `verify` - Mark as verified
- `ban` - Ban users
- `unban` - Unban users

**Response:**

```json
{
  "message": "Bulk disable completed",
  "affected": 2
}
```

---

## 📈 **Statistics Endpoint**

```http
GET /api/users/statistics
```

**Response:**

```json
{
  "total_users": 1250,
  "active_users": 1100,
  "banned_users": 20,
  "disabled_users": 100,
  "pending_users": 30,
  "verified_users": 1000,
  "unverified_users": 250,
  "mfa_enabled_users": 450,
  "support_staff": 25,
  "new_users_today": 15,
  "new_users_week": 87,
  "new_users_month": 324
}
```

---

## 🔒 **Security Features**

### **Password Security:**
- Bcrypt hashing (cost: 10)
- Min length: 8 characters
- Max length: 128 characters
- Never returned in API responses

### **Email Security:**
- Case-insensitive storage
- Email verification required for sensitive operations
- Unique constraint

### **Phone Security:**
- Unique constraint
- Can be used for 2FA/recovery

### **MFA (Multi-Factor Authentication):**
- TOTP (Time-based One-Time Password)
- Google Authenticator compatible
- Secret stored encrypted

### **Soft Delete:**
- Users are never hard-deleted
- `deleted_at` timestamp for audit trail
- Filtered from normal queries

---

## 🎯 **User Status Flow**

```
PENDING → (verify email) → ACTIVE
ACTIVE → (admin action) → DISABLED
ACTIVE → (violation) → BANNED
DISABLED → (reactivate) → ACTIVE
BANNED → (appeal approved) → ACTIVE
```

**Status Descriptions:**

| Status | Description | Can Login? |
|--------|-------------|------------|
| `ACTIVE` | Normal active user | ✅ Yes |
| `PENDING` | Email not verified | ❌ No |
| `DISABLED` | Temporarily disabled | ❌ No |
| `BANNED` | Permanently banned | ❌ No |

---

## ⚠️ **Error Codes**

| Code | Message | Description |
|------|---------|-------------|
| `400` | Bad Request | Invalid input data |
| `401` | Unauthorized | Invalid credentials or token |
| `403` | Forbidden | Insufficient permissions |
| `404` | Not Found | User not found |
| `409` | Conflict | Email/phone already exists |
| `422` | Unprocessable Entity | Validation failed |
| `429` | Too Many Requests | Rate limit exceeded |
| `500` | Internal Server Error | Server error |

---

## 🧪 **Testing**

### **Create Test User:**

```bash
curl -X POST https://api.example.com/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "full_name": "Test User",
    "locale": "vi-VN"
  }'
```

### **List Active Users:**

```bash
curl -X GET "https://api.example.com/api/users?status=ACTIVE&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### **Search Users:**

```bash
curl -X GET "https://api.example.com/api/users/search?q=Nguyễn&limit=5" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🚀 **Performance Tips**

1. **Use Pagination:**
   - Always specify `page` and `limit`
   - Default limit is 20, max is 100

2. **Optimize Queries:**
   - Use specific filters instead of search when possible
   - Leverage indexes on email, phone, status

3. **Caching:**
   - Cache user profiles for 5 minutes
   - Invalidate on update/delete

4. **Bulk Operations:**
   - Use bulk endpoints for multiple users
   - Max 100 users per bulk request

---

## 📚 **Related Documentation**

- [Database Schema Standard](../../../DATABASE_SCHEMA_STANDARD.md)
- [Authentication Flow](./AUTH_FLOW.md)
- [Role-Based Access Control](./RBAC.md)
- [API Rate Limiting](./RATE_LIMITING.md)

---

**Version:** 1.0.0  
**Last Updated:** January 15, 2026  
**Maintainer:** Development Team
