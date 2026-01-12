# Tenant Management API Documentation

## Overview
RESTful API cho quản lý multi-tenant SaaS platform. API này hỗ trợ CRUD operations cho tenants, subscription management, usage tracking, billing và analytics.

## Base URL
```
http://localhost:8080/api
```

## Authentication
Tất cả endpoints yêu cầu JWT token trong Authorization header:
```
Authorization: Bearer <token>
```

---

## Endpoints

### 1. Tenant Management

#### GET /tenants
Lấy danh sách tất cả tenants

**Query Parameters:**
- `status` (optional): Filter theo status (active, trial, suspended, cancelled)
- `tier` (optional): Filter theo subscription tier (free, starter, professional, enterprise)
- `limit` (optional): Số lượng kết quả mỗi trang (default: 50)
- `offset` (optional): Vị trí bắt đầu (default: 0)

**Response 200:**
```json
{
  "data": [
    {
      "id": "tenant-001",
      "name": "Acme Corporation",
      "slug": "acme-corp",
      "domain": "acme.example.com",
      "status": "active",
      "subscriptionTier": "enterprise",
      "subscriptionStartDate": "2024-01-01T00:00:00Z",
      "subscriptionEndDate": "2024-12-31T23:59:59Z",
      "maxUsers": 100,
      "currentUsers": 78,
      "maxStorage": 500,
      "currentStorage": 342,
      "features": ["sso", "api_access", "custom_domain", "priority_support"],
      "billingEmail": "billing@acme.com",
      "contactPerson": "John Doe",
      "phone": "+1-555-0100",
      "address": "123 Tech Street, San Francisco, CA",
      "metadata": {
        "industry": "Technology",
        "companySize": "100-500",
        "country": "USA"
      },
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-08T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 50,
    "offset": 0
  }
}
```

---

#### GET /tenants/{id}
Lấy thông tin chi tiết một tenant

**Path Parameters:**
- `id` (required): Tenant ID

**Response 200:**
```json
{
  "id": "tenant-001",
  "name": "Acme Corporation",
  "slug": "acme-corp",
  "domain": "acme.example.com",
  "status": "active",
  "subscriptionTier": "enterprise",
  "subscriptionStartDate": "2024-01-01T00:00:00Z",
  "subscriptionEndDate": "2024-12-31T23:59:59Z",
  "maxUsers": 100,
  "currentUsers": 78,
  "maxStorage": 500,
  "currentStorage": 342,
  "features": ["sso", "api_access", "custom_domain"],
  "billingEmail": "billing@acme.com",
  "contactPerson": "John Doe",
  "phone": "+1-555-0100",
  "metadata": {},
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-08T10:30:00Z"
}
```

**Response 404:**
```json
{
  "error": "Tenant not found"
}
```

---

#### POST /tenants
Tạo tenant mới

**Request Body:**
```json
{
  "name": "New Company Inc",
  "slug": "new-company",
  "domain": "newcompany.example.com",
  "subscriptionTier": "professional",
  "subscriptionEndDate": "2025-12-31T23:59:59Z",
  "billingEmail": "billing@newcompany.com",
  "contactPerson": "Jane Smith",
  "phone": "+1-555-0200",
  "address": "456 Business Ave, New York, NY",
  "metadata": {
    "industry": "Finance",
    "companySize": "50-100"
  }
}
```

**Validation Rules:**
- `name`: required, min 2 characters
- `slug`: required, unique, alphanumeric + hyphen only
- `subscriptionTier`: required, one of: free, starter, professional, enterprise
- `billingEmail`: required, valid email
- `contactPerson`: required
- `phone`: required

**Response 201:**
```json
{
  "id": "tenant-new-123",
  "name": "New Company Inc",
  "slug": "new-company",
  "status": "trial",
  "subscriptionTier": "professional",
  "subscriptionStartDate": "2024-01-08T00:00:00Z",
  "subscriptionEndDate": "2025-12-31T23:59:59Z",
  "maxUsers": 50,
  "currentUsers": 0,
  "maxStorage": 200,
  "currentStorage": 0,
  "features": ["api_access", "custom_branding", "analytics"],
  "billingEmail": "billing@newcompany.com",
  "contactPerson": "Jane Smith",
  "phone": "+1-555-0200",
  "createdAt": "2024-01-08T12:00:00Z",
  "updatedAt": "2024-01-08T12:00:00Z"
}
```

**Response 400:**
```json
{
  "error": "Validation failed",
  "details": {
    "slug": "Slug already exists",
    "billingEmail": "Invalid email format"
  }
}
```

---

#### PUT /tenants/{id}
Cập nhật thông tin tenant

**Path Parameters:**
- `id` (required): Tenant ID

**Request Body:**
```json
{
  "name": "Updated Company Name",
  "domain": "updated.example.com",
  "billingEmail": "new-billing@company.com",
  "contactPerson": "New Contact",
  "phone": "+1-555-9999",
  "metadata": {
    "industry": "Technology"
  }
}
```

**Response 200:**
```json
{
  "id": "tenant-001",
  "name": "Updated Company Name",
  "updatedAt": "2024-01-08T14:30:00Z"
}
```

---

#### DELETE /tenants/{id}
Xóa tenant

**Path Parameters:**
- `id` (required): Tenant ID

**Response 200:**
```json
{
  "message": "Tenant deleted successfully"
}
```

**Response 404:**
```json
{
  "error": "Tenant not found"
}
```

---

### 2. Subscription Management

#### PATCH /tenants/{id}/status
Cập nhật trạng thái tenant

**Path Parameters:**
- `id` (required): Tenant ID

**Request Body:**
```json
{
  "status": "suspended"
}
```

**Valid statuses:** active, trial, suspended, cancelled

**Response 200:**
```json
{
  "id": "tenant-001",
  "status": "suspended",
  "updatedAt": "2024-01-08T15:00:00Z"
}
```

---

#### PATCH /tenants/{id}/subscription
Nâng cấp/hạ cấp subscription

**Request Body:**
```json
{
  "tier": "enterprise",
  "endDate": "2025-12-31T23:59:59Z"
}
```

**Response 200:**
```json
{
  "id": "tenant-001",
  "subscriptionTier": "enterprise",
  "subscriptionEndDate": "2025-12-31T23:59:59Z",
  "maxUsers": 200,
  "maxStorage": 1000,
  "features": ["sso", "api_access", "custom_domain", "priority_support", "white_label"]
}
```

---

### 3. Usage Tracking

#### GET /tenants/{id}/usage
Lấy usage metrics của tenant

**Query Parameters:**
- `days` (optional): Số ngày lấy dữ liệu (default: 30)
- `startDate` (optional): Ngày bắt đầu (ISO 8601)
- `endDate` (optional): Ngày kết thúc (ISO 8601)

**Response 200:**
```json
{
  "data": [
    {
      "tenantId": "tenant-001",
      "date": "2024-01-08",
      "activeUsers": 78,
      "storageUsed": 342.5,
      "apiCalls": 125000,
      "bandwidth": 15.3
    },
    {
      "tenantId": "tenant-001",
      "date": "2024-01-07",
      "activeUsers": 75,
      "storageUsed": 340.2,
      "apiCalls": 118500,
      "bandwidth": 14.8
    }
  ]
}
```

---

#### POST /tenants/{id}/usage
Ghi nhận usage metric

**Request Body:**
```json
{
  "date": "2024-01-08",
  "activeUsers": 78,
  "storageUsed": 342.5,
  "apiCalls": 125000,
  "bandwidth": 15.3
}
```

**Response 201:**
```json
{
  "message": "Usage metric recorded successfully"
}
```

---

### 4. Billing & Invoices

#### GET /tenants/{id}/invoices
Lấy danh sách hóa đơn của tenant

**Response 200:**
```json
{
  "data": [
    {
      "id": "inv-001",
      "tenantId": "tenant-001",
      "invoiceNumber": "INV-2024-001",
      "amount": 299.00,
      "currency": "USD",
      "status": "paid",
      "billingPeriod": {
        "start": "2024-01-01",
        "end": "2024-01-31"
      },
      "items": [
        {
          "description": "Enterprise Plan - Monthly",
          "quantity": 1,
          "unitPrice": 299.00,
          "total": 299.00
        }
      ],
      "issueDate": "2024-01-01",
      "dueDate": "2024-01-15",
      "paidDate": "2024-01-10"
    }
  ]
}
```

---

#### POST /invoices
Tạo hóa đơn mới

**Request Body:**
```json
{
  "tenantId": "tenant-001",
  "invoiceNumber": "INV-2024-002",
  "amount": 299.00,
  "currency": "USD",
  "billingPeriod": {
    "start": "2024-02-01",
    "end": "2024-02-29"
  },
  "items": [
    {
      "description": "Enterprise Plan - Monthly",
      "quantity": 1,
      "unitPrice": 299.00,
      "total": 299.00
    }
  ],
  "issueDate": "2024-02-01",
  "dueDate": "2024-02-15"
}
```

**Response 201:**
```json
{
  "id": "inv-002",
  "invoiceNumber": "INV-2024-002",
  "status": "pending"
}
```

---

#### PATCH /invoices/{id}/status
Cập nhật trạng thái hóa đơn

**Request Body:**
```json
{
  "status": "paid",
  "paidDate": "2024-02-10T10:30:00Z"
}
```

**Response 200:**
```json
{
  "id": "inv-002",
  "status": "paid",
  "paidDate": "2024-02-10T10:30:00Z"
}
```

---

### 5. Analytics

#### GET /tenants/analytics
Lấy analytics tổng hợp

**Response 200:**
```json
{
  "totalTenants": 150,
  "activeTenants": 120,
  "trialTenants": 20,
  "suspendedTenants": 10,
  "totalRevenue": 45000.00,
  "mrr": 37500.00,
  "arr": 450000.00,
  "averageUsersPerTenant": 42.5,
  "totalStorageUsed": 12500.0,
  "subscriptionBreakdown": {
    "free": 30,
    "starter": 50,
    "professional": 45,
    "enterprise": 25
  }
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Validation failed",
  "details": {
    "field": "error message"
  }
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing JWT token"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

---

## Rate Limiting
- Rate limit: 1000 requests per hour per tenant
- Header `X-RateLimit-Remaining` indicates remaining requests
- Returns 429 when exceeded

---

## Webhooks
Platform supports webhooks for the following events:
- `tenant.created`
- `tenant.updated`
- `tenant.status_changed`
- `subscription.upgraded`
- `subscription.downgraded`
- `invoice.created`
- `invoice.paid`
- `usage.threshold_exceeded`

Configure webhooks in tenant settings.
