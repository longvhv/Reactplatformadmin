# 📡 Applications API Documentation

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

Applications API provides endpoints for managing technical application definitions and capabilities with:
- ✅ Code format validation (UPPERCASE for apps, lowercase for capabilities)
- ✅ Composite unique constraints (app_code + capability code)
- ✅ Soft delete pattern (audit trail)
- ✅ JSONB default values (flexible schema)
- ✅ Type safety (BOOLEAN | NUMBER)

---

## 📦 Data Models

### **Application**

```typescript
{
  "_id": "uuid",                              // UUID v7
  "code": "HRM_RECRUIT",                      // UPPERCASE_SNAKE_CASE
  "name": "HRM - Recruitment Module",
  "description": "Recruitment and candidate management",
  "is_active": true,
  "created_at": "2026-01-13T10:00:00Z",
  "updated_at": "2026-01-13T10:00:00Z",
  "deleted_at": null,                         // null = active
  "version": 1
}
```

**Code Format Rules:**
- Must be UPPERCASE letters, numbers, and underscores only
- Examples: `HRM_RECRUIT`, `CRM_SALES_V2`, `ACCOUNTING_2024`
- Invalid: `hrm-recruit` (lowercase), `HRM.RECRUIT` (dot), `HRM Recruit` (space)

---

### **AppCapability**

```typescript
{
  "_id": "uuid",                              // UUID v7
  "app_code": "HRM_RECRUIT",                  // FK to applications
  "code": "max_users",                        // lowercase_snake_case
  "name": "Maximum Users",
  "type": "NUMBER",                           // BOOLEAN | NUMBER
  "default_value": 10,                        // JSONB value
  "description": "Maximum number of users allowed",
  "is_active": true,
  "created_at": "2026-01-13T10:00:00Z",
  "updated_at": "2026-01-13T10:00:00Z",
  "deleted_at": null,
  "version": 1
}
```

**Capability Code Format Rules:**
- Must be lowercase letters, numbers, and underscores only
- Examples: `max_users`, `storage_gb`, `api_calls_limit`
- Invalid: `MAX_USERS` (uppercase), `max-users` (dash), `max.users` (dot)

**Capability Types:**
- `BOOLEAN` - True/False values (e.g., `enable_ai_matching`)
- `NUMBER` - Numeric values (e.g., `max_users`, `storage_gb`)

---

### **ApplicationWithCapabilities**

```typescript
{
  ...Application,
  "capabilities": [
    {
      "_id": "uuid",
      "app_code": "HRM_RECRUIT",
      "code": "max_users",
      "name": "Maximum Users",
      "type": "NUMBER",
      "default_value": 10,
      "is_active": true
    },
    {
      "_id": "uuid",
      "app_code": "HRM_RECRUIT",
      "code": "enable_ai_matching",
      "name": "AI Candidate Matching",
      "type": "BOOLEAN",
      "default_value": false,
      "is_active": true
    }
  ]
}
```

---

## 🛣️ Endpoints

### **APPLICATIONS ENDPOINTS**

---

### **1. List Applications**

```http
GET /api/v1/applications
```

**Description:** Get list of all applications with filtering options.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `is_active` | boolean | No | Filter by active status |
| `include_deleted` | boolean | No | Include soft-deleted records (default: false) |
| `limit` | integer | No | Number of results (default: 50) |
| `offset` | integer | No | Pagination offset (default: 0) |

**Response:** `200 OK`

```json
[
  {
    "_id": "01934a2f-8b6c-7890-1234-56789abcdef0",
    "code": "HRM_RECRUIT",
    "name": "HRM - Recruitment Module",
    "description": "Recruitment and candidate management",
    "is_active": true,
    "created_at": "2026-01-13T10:00:00Z",
    "updated_at": "2026-01-13T10:00:00Z",
    "version": 1
  },
  {
    "_id": "01934a2f-8b6c-7890-1234-56789abcdef1",
    "code": "CRM_SALES",
    "name": "CRM - Sales Module",
    "description": "Sales pipeline and customer management",
    "is_active": true,
    "created_at": "2026-01-13T09:00:00Z",
    "updated_at": "2026-01-13T09:00:00Z",
    "version": 1
  }
]
```

**cURL Example:**

```bash
curl -X GET "https://api.example.com/api/v1/applications?is_active=true&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### **2. Get Application by Code**

```http
GET /api/v1/applications/code/{code}
```

**Description:** Get a single application by its unique code.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `code` | string | Yes | Application code (e.g., `HRM_RECRUIT`) |

**Response:** `200 OK`

```json
{
  "_id": "01934a2f-8b6c-7890-1234-56789abcdef0",
  "code": "HRM_RECRUIT",
  "name": "HRM - Recruitment Module",
  "description": "Recruitment and candidate management",
  "is_active": true,
  "created_at": "2026-01-13T10:00:00Z",
  "updated_at": "2026-01-13T10:00:00Z",
  "version": 1
}
```

**Error Response:** `404 Not Found`

```json
{
  "error": "Application not found"
}
```

**cURL Example:**

```bash
curl -X GET "https://api.example.com/api/v1/applications/code/HRM_RECRUIT" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### **3. Get Application by ID**

```http
GET /api/v1/applications/{id}
```

**Description:** Get a single application by UUID.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | uuid | Yes | Application UUID |

**Response:** `200 OK`

```json
{
  "_id": "01934a2f-8b6c-7890-1234-56789abcdef0",
  "code": "HRM_RECRUIT",
  "name": "HRM - Recruitment Module",
  "description": "Recruitment and candidate management",
  "is_active": true,
  "created_at": "2026-01-13T10:00:00Z",
  "updated_at": "2026-01-13T10:00:00Z",
  "version": 1
}
```

**Error Response:** `400 Bad Request`

```json
{
  "error": "Invalid application ID format"
}
```

---

### **4. Get Application with Capabilities**

```http
GET /api/v1/applications/code/{code}/with-capabilities
```

**Description:** Get application along with all its capabilities.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `code` | string | Yes | Application code |

**Response:** `200 OK`

```json
{
  "_id": "01934a2f-8b6c-7890-1234-56789abcdef0",
  "code": "HRM_RECRUIT",
  "name": "HRM - Recruitment Module",
  "description": "Recruitment and candidate management",
  "is_active": true,
  "created_at": "2026-01-13T10:00:00Z",
  "updated_at": "2026-01-13T10:00:00Z",
  "version": 1,
  "capabilities": [
    {
      "_id": "01934a2f-1111-2222-3333-444444444444",
      "app_code": "HRM_RECRUIT",
      "code": "max_users",
      "name": "Maximum Users",
      "type": "NUMBER",
      "default_value": 10,
      "description": "Maximum number of users allowed",
      "is_active": true,
      "created_at": "2026-01-13T10:05:00Z",
      "updated_at": "2026-01-13T10:05:00Z",
      "version": 1
    },
    {
      "_id": "01934a2f-2222-3333-4444-555555555555",
      "app_code": "HRM_RECRUIT",
      "code": "enable_ai_matching",
      "name": "AI Candidate Matching",
      "type": "BOOLEAN",
      "default_value": false,
      "description": "Enable AI-powered candidate matching",
      "is_active": true,
      "created_at": "2026-01-13T10:06:00Z",
      "updated_at": "2026-01-13T10:06:00Z",
      "version": 1
    }
  ]
}
```

**Usage:** Use this endpoint to display full application details with all capabilities in admin UI.

**cURL Example:**

```bash
curl -X GET "https://api.example.com/api/v1/applications/code/HRM_RECRUIT/with-capabilities" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### **5. Create Application**

```http
POST /api/v1/applications
```

**Description:** Create a new application.

**Request Body:**

```json
{
  "code": "HRM_RECRUIT",
  "name": "HRM - Recruitment Module",
  "description": "Recruitment and candidate management",
  "is_active": true
}
```

**Field Validation:**
- `code` (required): UPPERCASE_SNAKE_CASE format
- `name` (required): Non-empty string (max 255 chars)
- `description` (optional): Text description
- `is_active` (optional): Default = `true`

**Response:** `201 Created`

```json
{
  "_id": "01934a2f-8b6c-7890-1234-56789abcdef0",
  "code": "HRM_RECRUIT",
  "name": "HRM - Recruitment Module",
  "description": "Recruitment and candidate management",
  "is_active": true,
  "created_at": "2026-01-13T10:00:00Z",
  "updated_at": "2026-01-13T10:00:00Z",
  "version": 1
}
```

**Error Response:** `400 Bad Request`

```json
{
  "error": "Invalid code format. Use uppercase letters, numbers, and underscores only (e.g., HRM_RECRUIT)"
}
```

**Error Response:** `409 Conflict`

```json
{
  "error": "Application code already exists"
}
```

**cURL Example:**

```bash
curl -X POST "https://api.example.com/api/v1/applications" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "HRM_RECRUIT",
    "name": "HRM - Recruitment Module",
    "description": "Recruitment and candidate management",
    "is_active": true
  }'
```

---

### **6. Update Application**

```http
PATCH /api/v1/applications/code/{code}
```

**Description:** Update an existing application (partial update).

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `code` | string | Yes | Application code |

**Request Body:** (All fields optional)

```json
{
  "name": "HRM - Recruitment & Onboarding",
  "description": "Updated description with onboarding features",
  "is_active": false
}
```

**Response:** `200 OK`

```json
{
  "message": "Application updated successfully",
  "updated_at": "2026-01-13T11:00:00Z"
}
```

**Note:** `version` is automatically incremented on each update.

**Error Response:** `404 Not Found`

```json
{
  "error": "Application not found"
}
```

**cURL Example:**

```bash
curl -X PATCH "https://api.example.com/api/v1/applications/code/HRM_RECRUIT" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "HRM - Recruitment & Onboarding",
    "is_active": true
  }'
```

---

### **7. Delete Application (Soft Delete)**

```http
DELETE /api/v1/applications/code/{code}
```

**Description:** Soft delete an application (sets `deleted_at` timestamp).

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `code` | string | Yes | Application code |

**Response:** `200 OK`

```json
{
  "message": "Application deleted successfully",
  "deleted_at": "2026-01-13T12:00:00Z"
}
```

**Behavior:**
- Sets `deleted_at = NOW()`
- Application excluded from normal queries (indexes have `WHERE deleted_at IS NULL`)
- Can be restored by setting `deleted_at = NULL` via database

**Error Response:** `404 Not Found`

```json
{
  "error": "Application not found or already deleted"
}
```

**cURL Example:**

```bash
curl -X DELETE "https://api.example.com/api/v1/applications/code/OLD_APP" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### **CAPABILITIES ENDPOINTS**

---

### **8. List Capabilities by Application**

```http
GET /api/v1/applications/code/{app_code}/capabilities
```

**Description:** Get all capabilities for a specific application.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `app_code` | string | Yes | Application code |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `is_active` | boolean | No | Filter by active status |

**Response:** `200 OK`

```json
[
  {
    "_id": "01934a2f-1111-2222-3333-444444444444",
    "app_code": "HRM_RECRUIT",
    "code": "max_users",
    "name": "Maximum Users",
    "type": "NUMBER",
    "default_value": 10,
    "description": "Maximum number of users allowed",
    "is_active": true,
    "created_at": "2026-01-13T10:05:00Z",
    "updated_at": "2026-01-13T10:05:00Z",
    "version": 1
  },
  {
    "_id": "01934a2f-2222-3333-4444-555555555555",
    "app_code": "HRM_RECRUIT",
    "code": "storage_gb",
    "name": "Storage Limit (GB)",
    "type": "NUMBER",
    "default_value": 5,
    "description": "Storage limit in gigabytes",
    "is_active": true,
    "created_at": "2026-01-13T10:06:00Z",
    "updated_at": "2026-01-13T10:06:00Z",
    "version": 1
  }
]
```

**cURL Example:**

```bash
curl -X GET "https://api.example.com/api/v1/applications/code/HRM_RECRUIT/capabilities?is_active=true" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### **9. Create Capability**

```http
POST /api/v1/applications/code/{app_code}/capabilities
```

**Description:** Create a new capability for an application.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `app_code` | string | Yes | Application code |

**Request Body:**

```json
{
  "code": "max_users",
  "name": "Maximum Users",
  "type": "NUMBER",
  "default_value": 10,
  "description": "Maximum number of users allowed",
  "is_active": true
}
```

**Field Validation:**
- `code` (required): lowercase_snake_case format
- `name` (required): Non-empty string (max 255 chars)
- `type` (required): Must be `BOOLEAN` or `NUMBER`
- `default_value` (required): JSONB value matching type
- `description` (optional): Text description
- `is_active` (optional): Default = `true`

**Type-Specific Default Values:**

| Type | Valid Default Values | Examples |
|------|---------------------|----------|
| `BOOLEAN` | `true`, `false` | `true`, `false` |
| `NUMBER` | Any number | `10`, `100`, `5.5` |

**Response:** `201 Created`

```json
{
  "_id": "01934a2f-1111-2222-3333-444444444444",
  "app_code": "HRM_RECRUIT",
  "code": "max_users",
  "name": "Maximum Users",
  "type": "NUMBER",
  "default_value": 10,
  "description": "Maximum number of users allowed",
  "is_active": true,
  "created_at": "2026-01-13T10:05:00Z",
  "updated_at": "2026-01-13T10:05:00Z",
  "version": 1
}
```

**Error Response:** `400 Bad Request`

```json
{
  "error": "Invalid code format. Use lowercase letters, numbers, and underscores only (e.g., max_users)"
}
```

**Error Response:** `400 Bad Request`

```json
{
  "error": "Invalid type. Must be BOOLEAN or NUMBER"
}
```

**Error Response:** `409 Conflict`

```json
{
  "error": "Capability code already exists for this application"
}
```

**cURL Example:**

```bash
curl -X POST "https://api.example.com/api/v1/applications/code/HRM_RECRUIT/capabilities" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "max_users",
    "name": "Maximum Users",
    "type": "NUMBER",
    "default_value": 10,
    "description": "Maximum number of users allowed"
  }'
```

---

### **10. Update Capability**

```http
PATCH /api/v1/capabilities/{id}
```

**Description:** Update an existing capability (partial update).

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | uuid | Yes | Capability UUID |

**Request Body:** (All fields optional)

```json
{
  "name": "Maximum Active Users",
  "type": "NUMBER",
  "default_value": 20,
  "description": "Updated description",
  "is_active": true
}
```

**Response:** `200 OK`

```json
{
  "message": "Capability updated successfully",
  "updated_at": "2026-01-13T11:00:00Z"
}
```

**Note:** `version` is automatically incremented on each update.

**Error Response:** `400 Bad Request`

```json
{
  "error": "Invalid capability ID format"
}
```

**Error Response:** `404 Not Found`

```json
{
  "error": "Capability not found"
}
```

**cURL Example:**

```bash
curl -X PATCH "https://api.example.com/api/v1/capabilities/01934a2f-1111-2222-3333-444444444444" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "default_value": 20,
    "is_active": true
  }'
```

---

### **11. Delete Capability (Soft Delete)**

```http
DELETE /api/v1/capabilities/{id}
```

**Description:** Soft delete a capability (sets `deleted_at` timestamp).

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | uuid | Yes | Capability UUID |

**Response:** `200 OK`

```json
{
  "message": "Capability deleted successfully",
  "deleted_at": "2026-01-13T12:00:00Z"
}
```

**Behavior:**
- Sets `deleted_at = NOW()`
- Capability excluded from normal queries
- Can be restored by setting `deleted_at = NULL` via database

**Error Response:** `404 Not Found`

```json
{
  "error": "Capability not found or already deleted"
}
```

**cURL Example:**

```bash
curl -X DELETE "https://api.example.com/api/v1/capabilities/01934a2f-1111-2222-3333-444444444444" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📚 Examples

### **Example 1: Create HRM Application with Capabilities**

```typescript
// 1. Create application
const app = await fetch('/api/v1/applications', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ADMIN_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    code: 'HRM_RECRUIT',
    name: 'HRM - Recruitment Module',
    description: 'Recruitment and candidate management',
    is_active: true
  })
});

const appData = await app.json();
console.log('Created app:', appData._id);

// 2. Add capabilities
const capabilities = [
  {
    code: 'max_users',
    name: 'Maximum Users',
    type: 'NUMBER',
    default_value: 10
  },
  {
    code: 'storage_gb',
    name: 'Storage Limit (GB)',
    type: 'NUMBER',
    default_value: 5
  },
  {
    code: 'enable_ai_matching',
    name: 'AI Candidate Matching',
    type: 'BOOLEAN',
    default_value: false
  }
];

for (const cap of capabilities) {
  const response = await fetch(`/api/v1/applications/code/HRM_RECRUIT/capabilities`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ADMIN_TOKEN',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(cap)
  });
  
  const capData = await response.json();
  console.log('Created capability:', capData.code);
}
```

---

### **Example 2: Display Application Details in Admin UI**

```typescript
// Fetch application with all capabilities
async function displayAppDetails(code: string) {
  const response = await fetch(`/api/v1/applications/code/${code}/with-capabilities`);
  const app = await response.json();
  
  console.log('Application:', app.name);
  console.log('Code:', app.code);
  console.log('Status:', app.is_active ? 'Active' : 'Inactive');
  console.log('\nCapabilities:');
  
  app.capabilities.forEach(cap => {
    console.log(`  - ${cap.name} (${cap.code})`);
    console.log(`    Type: ${cap.type}`);
    console.log(`    Default: ${cap.default_value}`);
  });
}

displayAppDetails('HRM_RECRUIT');
```

**Output:**
```
Application: HRM - Recruitment Module
Code: HRM_RECRUIT
Status: Active

Capabilities:
  - Maximum Users (max_users)
    Type: NUMBER
    Default: 10
  - Storage Limit (GB) (storage_gb)
    Type: NUMBER
    Default: 5
  - AI Candidate Matching (enable_ai_matching)
    Type: BOOLEAN
    Default: false
```

---

### **Example 3: Use Capabilities in Package Configuration**

```typescript
// Service package references application capabilities
const packageConfig = {
  code: 'BASIC_PLAN',
  name: 'Basic Plan',
  entitlements_config: {
    HRM_RECRUIT: {
      max_users: 5,          // Override default (10)
      storage_gb: 2,         // Override default (5)
      enable_ai_matching: false  // Use default
    },
    CRM_SALES: {
      max_contacts: 100,
      enable_analytics: false
    }
  }
};

// When tenant subscribes to this package, they get these capability values
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
| `400` | Bad Request | Invalid UUID, code format, missing fields |
| `401` | Unauthorized | Missing or invalid auth token |
| `404` | Not Found | Application/capability not found |
| `409` | Conflict | Duplicate code |
| `500` | Internal Server Error | Database error |

### **Common Errors**

**1. Invalid Code Format (Application)**

```json
{
  "error": "Invalid code format. Use uppercase letters, numbers, and underscores only (e.g., HRM_RECRUIT)"
}
```

**2. Invalid Code Format (Capability)**

```json
{
  "error": "Invalid code format. Use lowercase letters, numbers, and underscores only (e.g., max_users)"
}
```

**3. Duplicate Code**

```json
{
  "error": "Application code already exists"
}
```

```json
{
  "error": "Capability code already exists for this application"
}
```

**4. Invalid Type**

```json
{
  "error": "Invalid type. Must be BOOLEAN or NUMBER"
}
```

**5. Application Not Found**

```json
{
  "error": "Application not found"
}
```

---

## 🎯 Best Practices

### **1. Code Naming Conventions**

**Applications:**
- Use UPPERCASE_SNAKE_CASE
- Prefix with module name (e.g., `HRM_RECRUIT`, `CRM_SALES`)
- Be descriptive but concise

**Capabilities:**
- Use lowercase_snake_case
- Use clear, actionable names (e.g., `max_users`, `enable_ai_matching`)
- Avoid abbreviations unless commonly understood

---

### **2. Capability Types**

**Use BOOLEAN for:**
- Feature toggles (e.g., `enable_ai_matching`, `allow_exports`)
- On/off switches
- Permissions

**Use NUMBER for:**
- Limits (e.g., `max_users`, `storage_gb`)
- Quotas (e.g., `api_calls_limit`)
- Thresholds

---

### **3. Default Values**

Set realistic defaults:
```json
{
  "code": "max_users",
  "type": "NUMBER",
  "default_value": 10  // Reasonable default for small teams
}
```

Not:
```json
{
  "default_value": 999999  // ❌ Unrealistic
}
```

---

### **4. Soft Delete Pattern**

Always use soft delete for audit trail:
```bash
# Soft delete (preferred)
DELETE /applications/code/OLD_APP

# Hard delete (use database only if absolutely necessary)
DELETE FROM applications WHERE code = 'OLD_APP'
```

---

## 📊 Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `GET /applications` (Admin) | 100 req/min | Per user |
| `POST /applications` (Admin) | 10 req/min | Global |
| `PATCH /applications/:code` (Admin) | 30 req/min | Global |
| `DELETE /applications/:code` (Admin) | 10 req/min | Global |

---

**API Version:** 1.0.0  
**Last Updated:** January 13, 2026  
**Maintainer:** Platform Team
