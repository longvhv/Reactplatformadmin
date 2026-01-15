# 🚀 Complete API Reference

**Version:** 1.0.0  
**Last Updated:** January 14, 2026  
**Base URL:** `https://api.vhvplatform.com/v1`

---

## 📋 Table of Contents

1. [Authentication](#authentication)
2. [Tenants API](#tenants-api) - 8 endpoints
3. [Users API](#users-api) - 10 endpoints
4. [Applications API](#applications-api) - 8 endpoints
5. [Rate Limits API](#rate-limits-api) - 8 endpoints
6. [Subscriptions API](#subscriptions-api) - 8 endpoints
7. [Service Packages API](#service-packages-api) - 8 endpoints
8. [Announcements API](#announcements-api) - 8 endpoints
9. [App Routes API](#app-routes-api) - 6 endpoints
10. [Orders API](#orders-api) - 6 endpoints
11. [Roles API](#roles-api) - 8 endpoints

**Total: 78+ API Endpoints**

---

## 🔐 Authentication

### **JWT Bearer Token**

All API requests require authentication using JWT Bearer token:

```bash
Authorization: Bearer YOUR_JWT_TOKEN
```

### **Get Access Token**

```http
POST /v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secret123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 3600,
    "user": {
      "_id": "uuid",
      "email": "user@example.com",
      "name": "John Doe"
    }
  }
}
```

---

## 🏢 Tenants API

### **List Tenants**

```http
GET /v1/tenants?page=1&limit=20&status=active
```

**Query Parameters:**
- `page` (int, optional): Page number (default: 1)
- `limit` (int, optional): Items per page (default: 20, max: 100)
- `status` (string, optional): Filter by status (active, inactive, suspended)
- `search` (string, optional): Search by name or slug

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "01934a2f-1111-2222-3333-444444444444",
      "name": "Acme Corporation",
      "slug": "acme-corp",
      "email": "admin@acme.com",
      "status": "active",
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2026-01-14T10:00:00Z"
    }
  ],
  "meta": {
    "total": 45,
    "page": 1,
    "limit": 20,
    "total_pages": 3
  }
}
```

---

### **Get Tenant by ID**

```http
GET /v1/tenants/{tenant_id}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "01934a2f-1111-2222-3333-444444444444",
    "name": "Acme Corporation",
    "slug": "acme-corp",
    "email": "admin@acme.com",
    "phone": "+1 (555) 123-4567",
    "address": "123 Business St, SF, CA 94103",
    "status": "active",
    "metadata": {
      "industry": "Technology",
      "size": "50-200 employees"
    },
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2026-01-14T10:00:00Z"
  }
}
```

---

### **Create Tenant**

```http
POST /v1/tenants
Content-Type: application/json

{
  "name": "Acme Corporation",
  "slug": "acme-corp",
  "email": "admin@acme.com",
  "status": "active"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "_id": "01934a2f-1111-2222-3333-444444444444",
    "name": "Acme Corporation",
    "slug": "acme-corp",
    "email": "admin@acme.com",
    "status": "active",
    "created_at": "2026-01-14T10:00:00Z",
    "updated_at": "2026-01-14T10:00:00Z"
  }
}
```

---

### **Update Tenant**

```http
PATCH /v1/tenants/{tenant_id}
Content-Type: application/json

{
  "name": "Acme Corporation Inc.",
  "phone": "+1 (555) 999-8888"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "01934a2f-1111-2222-3333-444444444444",
    "name": "Acme Corporation Inc.",
    "phone": "+1 (555) 999-8888",
    "updated_at": "2026-01-14T10:30:00Z"
  }
}
```

---

### **Delete Tenant**

```http
DELETE /v1/tenants/{tenant_id}
```

**Response (204 No Content)**

---

### **Suspend Tenant**

```http
POST /v1/tenants/{tenant_id}/suspend
Content-Type: application/json

{
  "reason": "Payment overdue"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "01934a2f-1111-2222-3333-444444444444",
    "status": "suspended",
    "suspended_at": "2026-01-14T11:00:00Z",
    "suspension_reason": "Payment overdue"
  }
}
```

---

### **Activate Tenant**

```http
POST /v1/tenants/{tenant_id}/activate
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "01934a2f-1111-2222-3333-444444444444",
    "status": "active",
    "activated_at": "2026-01-14T12:00:00Z"
  }
}
```

---

### **Get Tenant Statistics**

```http
GET /v1/tenants/{tenant_id}/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_users": 145,
    "active_users": 120,
    "total_applications": 8,
    "api_requests_today": 45234,
    "storage_used_gb": 12.5,
    "subscription": {
      "plan": "premium",
      "status": "active",
      "next_billing_date": "2026-02-14"
    }
  }
}
```

---

## 👥 Users API

### **List Users**

```http
GET /v1/users?page=1&limit=20&tenant_id={tenant_id}
```

**Query Parameters:**
- `page` (int, optional): Page number
- `limit` (int, optional): Items per page
- `tenant_id` (uuid, optional): Filter by tenant
- `role` (string, optional): Filter by role
- `status` (string, optional): Filter by status

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "uuid",
      "email": "john@acme.com",
      "name": "John Doe",
      "role": "admin",
      "tenant_id": "uuid",
      "status": "active",
      "last_login": "2026-01-14T09:00:00Z",
      "created_at": "2024-06-01T10:00:00Z"
    }
  ],
  "meta": {
    "total": 145,
    "page": 1,
    "limit": 20
  }
}
```

---

### **Create User**

```http
POST /v1/users
Content-Type: application/json

{
  "email": "jane@acme.com",
  "name": "Jane Smith",
  "password": "SecurePass123!",
  "tenant_id": "uuid",
  "role": "member"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "_id": "uuid",
    "email": "jane@acme.com",
    "name": "Jane Smith",
    "tenant_id": "uuid",
    "role": "member",
    "status": "active",
    "created_at": "2026-01-14T10:00:00Z"
  }
}
```

---

### **Update User**

```http
PATCH /v1/users/{user_id}
Content-Type: application/json

{
  "name": "Jane Doe",
  "role": "admin"
}
```

---

### **Delete User**

```http
DELETE /v1/users/{user_id}
```

**Response (204 No Content)**

---

### **Assign Role**

```http
POST /v1/users/{user_id}/roles
Content-Type: application/json

{
  "role_id": "uuid"
}
```

---

## 🎯 Applications API

### **List Applications**

```http
GET /v1/applications?page=1&limit=20
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "uuid",
      "name": "CRM System",
      "code": "crm",
      "description": "Customer relationship management",
      "status": "active",
      "icon_url": "https://cdn.example.com/icons/crm.svg",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### **Create Application**

```http
POST /v1/applications
Content-Type: application/json

{
  "name": "Project Manager",
  "code": "pm",
  "description": "Project management tool",
  "status": "active"
}
```

---

### **Enable Application for Tenant**

```http
POST /v1/applications/{app_id}/tenants/{tenant_id}/enable
```

**Response:**
```json
{
  "success": true,
  "message": "Application enabled for tenant"
}
```

---

## ⏱️ Rate Limits API

### **List Rate Limits**

```http
GET /v1/rate-limits?tenant_id={tenant_id}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "uuid",
      "tenant_id": "uuid",
      "endpoint": "/api/v1/users",
      "method": "POST",
      "limit": 100,
      "window": 3600,
      "strategy": "sliding_window",
      "enabled": true
    }
  ]
}
```

---

### **Create Rate Limit**

```http
POST /v1/rate-limits
Content-Type: application/json

{
  "tenant_id": "uuid",
  "endpoint": "/api/v1/tenants",
  "method": "POST",
  "limit": 50,
  "window": 3600,
  "strategy": "sliding_window"
}
```

---

### **Check Rate Limit**

```http
GET /v1/rate-limits/check?tenant_id={tenant_id}&endpoint=/api/v1/users&method=GET
```

**Response:**
```json
{
  "success": true,
  "data": {
    "allowed": true,
    "limit": 100,
    "remaining": 85,
    "reset_at": "2026-01-14T11:00:00Z"
  }
}
```

---

## 🔄 Subscriptions API

### **List Subscriptions**

```http
GET /v1/subscriptions?tenant_id={tenant_id}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "uuid",
      "tenant_id": "uuid",
      "package_id": "uuid",
      "status": "active",
      "start_date": "2024-01-15",
      "end_date": "2025-01-15",
      "auto_renew": true,
      "price": 99.99,
      "currency": "USD"
    }
  ]
}
```

---

### **Create Subscription**

```http
POST /v1/subscriptions
Content-Type: application/json

{
  "tenant_id": "uuid",
  "package_id": "uuid",
  "start_date": "2026-01-15",
  "auto_renew": true
}
```

---

### **Cancel Subscription**

```http
POST /v1/subscriptions/{subscription_id}/cancel
Content-Type: application/json

{
  "reason": "Switching to different plan",
  "cancel_at_period_end": true
}
```

---

## 📢 Announcements API

### **List Announcements**

```http
GET /v1/announcements?status=published&priority=high
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "uuid",
      "title": "System Maintenance",
      "content": "Scheduled maintenance on Jan 20",
      "priority": "high",
      "status": "published",
      "start_date": "2026-01-20T00:00:00Z",
      "end_date": "2026-01-20T04:00:00Z",
      "created_at": "2026-01-14T10:00:00Z"
    }
  ]
}
```

---

### **Create Announcement**

```http
POST /v1/announcements
Content-Type: application/json

{
  "title": "New Feature Launch",
  "content": "We're excited to announce...",
  "priority": "medium",
  "status": "draft",
  "start_date": "2026-01-15T00:00:00Z"
}
```

---

## 📦 Service Packages API

### **List Packages**

```http
GET /v1/packages
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "uuid",
      "name": "Premium Plan",
      "code": "premium",
      "price": 99.99,
      "currency": "USD",
      "billing_cycle": "monthly",
      "features": {
        "max_users": 100,
        "max_storage_gb": 100,
        "api_rate_limit": 10000
      },
      "status": "active"
    }
  ]
}
```

---

## 🛣️ App Routes API

### **List App Routes**

```http
GET /v1/app-routes?tenant_id={tenant_id}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "uuid",
      "tenant_id": "uuid",
      "application_id": "uuid",
      "path": "/crm/*",
      "target_url": "https://crm.acme.com",
      "enabled": true,
      "priority": 1
    }
  ]
}
```

---

## 🛒 Orders API

### **List Orders**

```http
GET /v1/orders?tenant_id={tenant_id}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "uuid",
      "tenant_id": "uuid",
      "order_number": "ORD-2026-0001",
      "total_amount": 99.99,
      "currency": "USD",
      "status": "completed",
      "payment_method": "credit_card",
      "created_at": "2026-01-14T10:00:00Z"
    }
  ]
}
```

---

## 🛡️ Roles API

### **List Roles**

```http
GET /v1/roles?tenant_id={tenant_id}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "uuid",
      "name": "Administrator",
      "code": "admin",
      "tenant_id": "uuid",
      "permissions": [
        "users.read",
        "users.write",
        "tenants.manage"
      ],
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

## 📊 Common Response Codes

| Code | Description |
|------|-------------|
| 200 | Success - Request completed |
| 201 | Created - Resource created successfully |
| 204 | No Content - Successful deletion |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Invalid or missing token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 422 | Validation Error - Invalid data |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

---

## 🔄 Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ]
  }
}
```

---

**Version:** 1.0.0  
**Last Updated:** January 14, 2026  
**Total Endpoints:** 78+
