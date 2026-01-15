# 📡 Tenant Rate Limits API Documentation

**Version:** 1.0.0  
**Base URL:** `/api/v1`  
**Authentication:** Bearer Token (required for admin endpoints)

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Data Models](#data-models)
3. [Endpoints](#endpoints)
4. [Examples](#examples)
5. [Error Handling](#error-handling)

---

## 🎯 Overview

Tenant Rate Limits API provides endpoints for managing API rate limiting configurations to protect the system from overuse and ensure fair resource allocation:
- ✅ Per-tenant rate limiting (prevent noisy neighbor problem)
- ✅ Per-API group limits (different limits for different endpoints)
- ✅ Package-based default limits
- ✅ Time window configuration (seconds)
- ✅ Composite unique constraints (tenant_id + api_group)

---

## 📦 Data Models

### **TenantRateLimit**

```typescript
{
  "_id": "uuid",                              // UUID v7
  "tenant_id": "uuid",                        // FK to tenants
  "package_id": "uuid",                       // FK to packages (optional)
  "api_group": "reports",                     // API group identifier
  "limit_count": 100,                         // Max requests
  "window_seconds": 60,                       // Time window in seconds
  "is_active": true,
  "created_at": "2026-01-14T10:00:00Z",
  "updated_at": "2026-01-14T10:00:00Z",
  "version": 1
}
```

**Field Descriptions:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | UUID | Yes | Primary key (UUID v7 recommended) |
| `tenant_id` | UUID | Yes | Tenant this limit applies to |
| `package_id` | UUID | No | Service package (for default limits) |
| `api_group` | VARCHAR(50) | Yes | API group identifier (e.g., "reports", "exports") |
| `limit_count` | INT | Yes | Maximum number of requests allowed |
| `window_seconds` | INT | Yes | Time window in seconds (default: 60) |
| `is_active` | BOOLEAN | Yes | Whether limit is active (default: true) |
| `created_at` | TIMESTAMPTZ | Auto | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | Auto | Last update timestamp |
| `version` | BIGINT | Auto | Optimistic locking version |

**API Groups:**
- `reports` - Report generation endpoints
- `exports` - Data export endpoints
- `imports` - Bulk import endpoints
- `analytics` - Analytics queries
- `webhooks` - Webhook delivery
- `ai` - AI-powered features
- `general` - General API endpoints

---

## 🛣️ Endpoints

### **1. List Rate Limits**

```http
GET /api/v1/tenant-rate-limits
```

**Description:** Get list of all rate limit configurations with filtering.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tenant_id` | uuid | No | Filter by tenant ID |
| `package_id` | uuid | No | Filter by package ID |
| `api_group` | string | No | Filter by API group |
| `is_active` | boolean | No | Filter by active status |
| `limit` | integer | No | Number of results (default: 50) |
| `offset` | integer | No | Pagination offset (default: 0) |

**Response:** `200 OK`

```json
[
  {
    "_id": "01934a2f-8b6c-7890-1234-56789abcdef0",
    "tenant_id": "01934a2f-1111-2222-3333-444444444444",
    "package_id": "01934a2f-5555-6666-7777-888888888888",
    "api_group": "reports",
    "limit_count": 100,
    "window_seconds": 60,
    "is_active": true,
    "created_at": "2026-01-14T10:00:00Z",
    "updated_at": "2026-01-14T10:00:00Z",
    "version": 1
  },
  {
    "_id": "01934a2f-8b6c-7890-1234-56789abcdef1",
    "tenant_id": "01934a2f-1111-2222-3333-444444444444",
    "package_id": null,
    "api_group": "exports",
    "limit_count": 10,
    "window_seconds": 3600,
    "is_active": true,
    "created_at": "2026-01-14T09:00:00Z",
    "updated_at": "2026-01-14T09:00:00Z",
    "version": 1
  }
]
```

**cURL Example:**

```bash
curl -X GET "https://api.example.com/api/v1/tenant-rate-limits?tenant_id=01934a2f-1111-2222-3333-444444444444&is_active=true" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### **2. Get Rate Limit by ID**

```http
GET /api/v1/tenant-rate-limits/{id}
```

**Description:** Get a single rate limit configuration by UUID.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | uuid | Yes | Rate limit UUID |

**Response:** `200 OK`

```json
{
  "_id": "01934a2f-8b6c-7890-1234-56789abcdef0",
  "tenant_id": "01934a2f-1111-2222-3333-444444444444",
  "package_id": "01934a2f-5555-6666-7777-888888888888",
  "api_group": "reports",
  "limit_count": 100,
  "window_seconds": 60,
  "is_active": true,
  "created_at": "2026-01-14T10:00:00Z",
  "updated_at": "2026-01-14T10:00:00Z",
  "version": 1
}
```

**Error Response:** `404 Not Found`

```json
{
  "error": "Rate limit not found"
}
```

**cURL Example:**

```bash
curl -X GET "https://api.example.com/api/v1/tenant-rate-limits/01934a2f-8b6c-7890-1234-56789abcdef0" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### **3. Get Rate Limit by Tenant and API Group**

```http
GET /api/v1/tenant-rate-limits/lookup
```

**Description:** Get rate limit for specific tenant and API group (used by API Gateway).

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tenant_id` | uuid | Yes | Tenant ID |
| `api_group` | string | Yes | API group name |

**Response:** `200 OK`

```json
{
  "_id": "01934a2f-8b6c-7890-1234-56789abcdef0",
  "tenant_id": "01934a2f-1111-2222-3333-444444444444",
  "api_group": "reports",
  "limit_count": 100,
  "window_seconds": 60,
  "is_active": true
}
```

**Error Response:** `404 Not Found`

```json
{
  "error": "No rate limit configured for this tenant and API group"
}
```

**Usage:** This endpoint is called by API Gateway middleware to check limits before processing requests.

**cURL Example:**

```bash
curl -X GET "https://api.example.com/api/v1/tenant-rate-limits/lookup?tenant_id=01934a2f-1111-2222-3333-444444444444&api_group=reports" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### **4. List Rate Limits by Tenant**

```http
GET /api/v1/tenants/{tenant_id}/rate-limits
```

**Description:** Get all rate limit configurations for a specific tenant.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tenant_id` | uuid | Yes | Tenant UUID |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `is_active` | boolean | No | Filter by active status |

**Response:** `200 OK`

```json
[
  {
    "_id": "01934a2f-8b6c-7890-1234-56789abcdef0",
    "api_group": "reports",
    "limit_count": 100,
    "window_seconds": 60,
    "is_active": true
  },
  {
    "_id": "01934a2f-8b6c-7890-1234-56789abcdef1",
    "api_group": "exports",
    "limit_count": 10,
    "window_seconds": 3600,
    "is_active": true
  }
]
```

**Usage:** Display all rate limits in tenant management dashboard.

**cURL Example:**

```bash
curl -X GET "https://api.example.com/api/v1/tenants/01934a2f-1111-2222-3333-444444444444/rate-limits" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### **5. Create Rate Limit**

```http
POST /api/v1/tenant-rate-limits
```

**Description:** Create a new rate limit configuration.

**Request Body:**

```json
{
  "tenant_id": "01934a2f-1111-2222-3333-444444444444",
  "package_id": "01934a2f-5555-6666-7777-888888888888",
  "api_group": "reports",
  "limit_count": 100,
  "window_seconds": 60,
  "is_active": true
}
```

**Field Validation:**
- `tenant_id` (required): Valid UUID
- `package_id` (optional): Valid UUID or null
- `api_group` (required): Non-empty string (max 50 chars)
- `limit_count` (required): Positive integer
- `window_seconds` (required): Positive integer (default: 60)
- `is_active` (optional): Boolean (default: true)

**Response:** `201 Created`

```json
{
  "_id": "01934a2f-8b6c-7890-1234-56789abcdef0",
  "tenant_id": "01934a2f-1111-2222-3333-444444444444",
  "package_id": "01934a2f-5555-6666-7777-888888888888",
  "api_group": "reports",
  "limit_count": 100,
  "window_seconds": 60,
  "is_active": true,
  "created_at": "2026-01-14T10:00:00Z",
  "updated_at": "2026-01-14T10:00:00Z",
  "version": 1
}
```

**Error Response:** `400 Bad Request`

```json
{
  "error": "limit_count must be a positive integer"
}
```

**Error Response:** `409 Conflict`

```json
{
  "error": "Rate limit already exists for this tenant and API group"
}
```

**cURL Example:**

```bash
curl -X POST "https://api.example.com/api/v1/tenant-rate-limits" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "01934a2f-1111-2222-3333-444444444444",
    "api_group": "reports",
    "limit_count": 100,
    "window_seconds": 60
  }'
```

---

### **6. Update Rate Limit**

```http
PATCH /api/v1/tenant-rate-limits/{id}
```

**Description:** Update an existing rate limit configuration (partial update).

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | uuid | Yes | Rate limit UUID |

**Request Body:** (All fields optional)

```json
{
  "limit_count": 200,
  "window_seconds": 120,
  "is_active": true
}
```

**Response:** `200 OK`

```json
{
  "message": "Rate limit updated successfully",
  "updated_at": "2026-01-14T11:00:00Z"
}
```

**Note:** `version` is automatically incremented on each update.

**Error Response:** `404 Not Found`

```json
{
  "error": "Rate limit not found"
}
```

**cURL Example:**

```bash
curl -X PATCH "https://api.example.com/api/v1/tenant-rate-limits/01934a2f-8b6c-7890-1234-56789abcdef0" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "limit_count": 200,
    "is_active": true
  }'
```

---

### **7. Delete Rate Limit**

```http
DELETE /api/v1/tenant-rate-limits/{id}
```

**Description:** Delete a rate limit configuration.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | uuid | Yes | Rate limit UUID |

**Response:** `200 OK`

```json
{
  "message": "Rate limit deleted successfully"
}
```

**Error Response:** `404 Not Found`

```json
{
  "error": "Rate limit not found"
}
```

**cURL Example:**

```bash
curl -X DELETE "https://api.example.com/api/v1/tenant-rate-limits/01934a2f-8b6c-7890-1234-56789abcdef0" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### **8. Bulk Create Rate Limits**

```http
POST /api/v1/tenant-rate-limits/bulk
```

**Description:** Create multiple rate limits at once (useful for package setup).

**Request Body:**

```json
{
  "tenant_id": "01934a2f-1111-2222-3333-444444444444",
  "package_id": "01934a2f-5555-6666-7777-888888888888",
  "limits": [
    {
      "api_group": "reports",
      "limit_count": 100,
      "window_seconds": 60
    },
    {
      "api_group": "exports",
      "limit_count": 10,
      "window_seconds": 3600
    },
    {
      "api_group": "imports",
      "limit_count": 5,
      "window_seconds": 3600
    }
  ]
}
```

**Response:** `201 Created`

```json
{
  "created": 3,
  "rate_limits": [
    {
      "_id": "01934a2f-8b6c-7890-1234-56789abcdef0",
      "api_group": "reports",
      "limit_count": 100
    },
    {
      "_id": "01934a2f-8b6c-7890-1234-56789abcdef1",
      "api_group": "exports",
      "limit_count": 10
    },
    {
      "_id": "01934a2f-8b6c-7890-1234-56789abcdef2",
      "api_group": "imports",
      "limit_count": 5
    }
  ]
}
```

**Usage:** Automatically set up rate limits when tenant subscribes to a package.

**cURL Example:**

```bash
curl -X POST "https://api.example.com/api/v1/tenant-rate-limits/bulk" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "01934a2f-1111-2222-3333-444444444444",
    "limits": [
      {"api_group": "reports", "limit_count": 100, "window_seconds": 60},
      {"api_group": "exports", "limit_count": 10, "window_seconds": 3600}
    ]
  }'
```

---

## 📚 Examples

### **Example 1: Set Up Rate Limits for New Tenant**

```typescript
// When tenant subscribes to Basic Plan
const setupTenantRateLimits = async (tenantId: string, packageId: string) => {
  const response = await fetch('/api/v1/tenant-rate-limits/bulk', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ADMIN_TOKEN',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      tenant_id: tenantId,
      package_id: packageId,
      limits: [
        {
          api_group: 'reports',
          limit_count: 100,
          window_seconds: 60
        },
        {
          api_group: 'exports',
          limit_count: 10,
          window_seconds: 3600
        },
        {
          api_group: 'analytics',
          limit_count: 1000,
          window_seconds: 3600
        }
      ]
    })
  });
  
  const result = await response.json();
  console.log(`Created ${result.created} rate limits`);
};
```

---

### **Example 2: API Gateway Middleware - Check Rate Limit**

```typescript
// Middleware to enforce rate limits
const rateLimitMiddleware = async (req, res, next) => {
  const tenantId = req.headers['x-tenant-id'];
  const apiGroup = getApiGroup(req.path); // e.g., "reports"
  
  // Get limit configuration
  const limitConfig = await fetch(
    `/api/v1/tenant-rate-limits/lookup?tenant_id=${tenantId}&api_group=${apiGroup}`
  );
  
  if (!limitConfig.ok) {
    // No limit configured, allow request
    return next();
  }
  
  const { limit_count, window_seconds } = await limitConfig.json();
  
  // Check Redis for current usage
  const key = `rate_limit:${tenantId}:${apiGroup}`;
  const current = await redis.incr(key);
  
  if (current === 1) {
    await redis.expire(key, window_seconds);
  }
  
  if (current > limit_count) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      limit: limit_count,
      window: window_seconds,
      retry_after: await redis.ttl(key)
    });
  }
  
  // Set headers
  res.setHeader('X-RateLimit-Limit', limit_count);
  res.setHeader('X-RateLimit-Remaining', limit_count - current);
  res.setHeader('X-RateLimit-Reset', Date.now() + (window_seconds * 1000));
  
  next();
};
```

---

### **Example 3: Admin Dashboard - Display Tenant Limits**

```typescript
// Fetch and display all limits for a tenant
const displayTenantLimits = async (tenantId: string) => {
  const response = await fetch(`/api/v1/tenants/${tenantId}/rate-limits`);
  const limits = await response.json();
  
  console.log('Tenant Rate Limits:');
  limits.forEach(limit => {
    console.log(`  ${limit.api_group}: ${limit.limit_count} requests / ${limit.window_seconds}s`);
  });
};

displayTenantLimits('01934a2f-1111-2222-3333-444444444444');
```

**Output:**
```
Tenant Rate Limits:
  reports: 100 requests / 60s
  exports: 10 requests / 3600s
  analytics: 1000 requests / 3600s
```

---

### **Example 4: Upgrade Package - Increase Limits**

```typescript
// When tenant upgrades from Basic to Premium
const upgradeRateLimits = async (tenantId: string) => {
  // Get current limits
  const response = await fetch(`/api/v1/tenants/${tenantId}/rate-limits`);
  const limits = await response.json();
  
  // Update each limit to Premium values
  for (const limit of limits) {
    let newCount = limit.limit_count;
    
    // Double the limits for Premium
    if (limit.api_group === 'reports') newCount = 200;
    if (limit.api_group === 'exports') newCount = 50;
    if (limit.api_group === 'analytics') newCount = 5000;
    
    await fetch(`/api/v1/tenant-rate-limits/${limit._id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': 'Bearer ADMIN_TOKEN',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        limit_count: newCount
      })
    });
  }
  
  console.log('Rate limits upgraded to Premium');
};
```

---

## ⚠️ Error Handling

### **Standard Error Response**

```json
{
  "error": "Error message description"
}
```

### **HTTP Status Codes**

| Code | Description | Example |
|------|-------------|---------|
| `200` | Success | Successful GET, PATCH, DELETE |
| `201` | Created | Successful POST |
| `400` | Bad Request | Invalid data, missing fields |
| `401` | Unauthorized | Missing or invalid auth token |
| `404` | Not Found | Rate limit not found |
| `409` | Conflict | Duplicate (tenant_id + api_group) |
| `429` | Too Many Requests | Rate limit exceeded |
| `500` | Internal Server Error | Database error |

### **Common Errors**

**1. Invalid Limit Count**

```json
{
  "error": "limit_count must be a positive integer"
}
```

**2. Invalid Window Seconds**

```json
{
  "error": "window_seconds must be a positive integer"
}
```

**3. Duplicate Rate Limit**

```json
{
  "error": "Rate limit already exists for this tenant and API group"
}
```

**4. Tenant Not Found**

```json
{
  "error": "Tenant not found"
}
```

**5. Rate Limit Exceeded (429)**

```json
{
  "error": "Rate limit exceeded",
  "limit": 100,
  "window": 60,
  "retry_after": 45
}
```

**Response Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1705226400000
Retry-After: 45
```

---

## 🎯 Best Practices

### **1. API Group Naming**

Use clear, consistent names:
```
✅ Good:
reports
exports
imports
analytics
webhooks
ai_features

❌ Bad:
rpt
exp
data
stuff
```

---

### **2. Window Seconds**

**Common patterns:**
- **Per minute:** `60` seconds
- **Per hour:** `3600` seconds
- **Per day:** `86400` seconds

**Example:**
```json
{
  "api_group": "reports",
  "limit_count": 100,
  "window_seconds": 60      // 100 requests per minute
}

{
  "api_group": "exports",
  "limit_count": 10,
  "window_seconds": 3600    // 10 exports per hour
}
```

---

### **3. Limit Count**

Set realistic limits based on:
- API endpoint cost (CPU, memory, database queries)
- Package tier (Basic < Premium < Enterprise)
- Business requirements

**Example tiers:**

| API Group | Basic | Premium | Enterprise |
|-----------|-------|---------|------------|
| Reports | 100/min | 500/min | 5000/min |
| Exports | 10/hour | 50/hour | 500/hour |
| Analytics | 1000/hour | 5000/hour | Unlimited |

---

### **4. Package-Based Limits**

Set `package_id` for default limits:
```typescript
// Create default limits for a package
const createPackageDefaults = async (packageId: string) => {
  await fetch('/api/v1/tenant-rate-limits', {
    method: 'POST',
    body: JSON.stringify({
      tenant_id: null,           // null = applies to all tenants with this package
      package_id: packageId,
      api_group: 'reports',
      limit_count: 100,
      window_seconds: 60
    })
  });
};

// Override for specific tenant
const overrideTenantLimit = async (tenantId: string) => {
  await fetch('/api/v1/tenant-rate-limits', {
    method: 'POST',
    body: JSON.stringify({
      tenant_id: tenantId,       // Specific tenant
      package_id: null,          // Overrides package default
      api_group: 'reports',
      limit_count: 500,          // Higher limit
      window_seconds: 60
    })
  });
};
```

---

## 📊 Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `GET /tenant-rate-limits` (Admin) | 100 req/min | Per user |
| `POST /tenant-rate-limits` (Admin) | 30 req/min | Global |
| `PATCH /tenant-rate-limits/:id` (Admin) | 30 req/min | Global |
| `DELETE /tenant-rate-limits/:id` (Admin) | 10 req/min | Global |
| `GET /tenant-rate-limits/lookup` (Gateway) | 10000 req/min | Global |

---

**API Version:** 1.0.0  
**Last Updated:** January 14, 2026  
**Maintainer:** Platform Team
