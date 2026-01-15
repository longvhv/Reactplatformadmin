# 🔌 WEBHOOKS - API DOCUMENTATION

> Complete API reference với examples, error handling, và integration guide

---

## 📋 **API ENDPOINTS OVERVIEW**

| # | Method | Endpoint | Description | Unique |
|---|--------|----------|-------------|--------|
| 1 | GET | `/api/v1/webhooks` | List all webhooks | - |
| 2 | GET | `/api/v1/webhooks/:id` | Get webhook details | - |
| 3 | POST | `/api/v1/webhooks` | Create webhook | Auto-gen secret |
| 4 | PATCH | `/api/v1/webhooks/:id` | Update webhook | Optimistic lock |
| 5 | DELETE | `/api/v1/webhooks/:id` | Delete webhook | Hard delete |
| 6 | GET | `/api/v1/tenants/:tenant_id/webhooks` | Get tenant webhooks | - |
| 7 | GET | `/api/v1/webhooks/statistics` | Get statistics | 7 metrics |
| 8 | POST | `/api/v1/webhooks/:id/test` | **Test webhook** | ⭐ UNIQUE |
| 9 | POST | `/api/v1/webhooks/:id/reset-failures` | **Reset failures** | ⭐ UNIQUE |
| 10 | POST | `/api/v1/webhooks/generate-secret` | **Generate secret** | ⭐ UNIQUE |

**Total Endpoints:** 10 (3 unique utilities)

---

## 🔐 **AUTHENTICATION**

All API requests require authentication:

```http
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Example:**
```bash
curl -H "Authorization: Bearer eyJhbGc..." \
     -H "Content-Type: application/json" \
     https://api.yourplatform.com/api/v1/webhooks
```

---

## 📡 **ENDPOINT DETAILS**

### **1. GET /api/v1/webhooks**

List all webhooks với pagination và filters.

#### **Request**

```http
GET /api/v1/webhooks?tenant_id={uuid}&is_active=true&event=user.created&page=1&limit=20
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tenant_id` | UUID | No | Filter by tenant |
| `is_active` | boolean | No | Filter by active status |
| `event` | string | No | Filter by subscribed event |
| `unhealthy` | boolean | No | Filter unhealthy (failure_count > 5) |
| `search` | string | No | Search by target URL |
| `page` | integer | No | Page number (default: 1) |
| `limit` | integer | No | Items per page (default: 20) |

#### **Response**

**Status:** 200 OK

```json
[
  {
    "_id": "018d8f8f-8f8f-7f8f-8f8f-8f8f8f8f8f8f",
    "tenant_id": "550e8400-e29b-41d4-a716-446655440000",
    "target_url": "https://api.customer.com/webhooks/platform",
    "secret_key": "whsec_a1b2c3d4e5f6...",
    "subscribed_events": ["user.created", "user.updated", "invoice.paid"],
    "is_active": true,
    "failure_count": 0,
    "created_at": "2025-01-13T10:30:45.123Z",
    "updated_at": "2025-01-13T10:30:45.123Z",
    "version": 1,
    "tenant_name": "Acme Corporation"
  }
]
```

#### **cURL Example**

```bash
curl -X GET "https://api.yourplatform.com/api/v1/webhooks?is_active=true&limit=10" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json"
```

#### **Error Response**

**Status:** 500 Internal Server Error

```json
{
  "error": "Failed to fetch webhooks: database connection timeout"
}
```

---

### **2. GET /api/v1/webhooks/:id**

Get webhook by ID với full details.

#### **Request**

```http
GET /api/v1/webhooks/018d8f8f-8f8f-7f8f-8f8f-8f8f8f8f8f8f
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | Webhook ID |

#### **Response**

**Status:** 200 OK

```json
{
  "_id": "018d8f8f-8f8f-7f8f-8f8f-8f8f8f8f8f8f",
  "tenant_id": "550e8400-e29b-41d4-a716-446655440000",
  "target_url": "https://api.customer.com/webhooks/platform",
  "secret_key": "whsec_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4",
  "subscribed_events": ["user.created", "user.updated", "user.deleted"],
  "is_active": true,
  "failure_count": 2,
  "created_at": "2025-01-13T10:30:45.123Z",
  "updated_at": "2025-01-13T15:20:30.456Z",
  "version": 3,
  "tenant_name": "Acme Corporation"
}
```

#### **cURL Example**

```bash
curl -X GET "https://api.yourplatform.com/api/v1/webhooks/018d8f8f-8f8f-7f8f-8f8f-8f8f8f8f8f8f" \
  -H "Authorization: Bearer {token}"
```

#### **Error Responses**

**Status:** 404 Not Found

```json
{
  "error": "Webhook not found"
}
```

---

### **3. POST /api/v1/webhooks**

Create new webhook. Secret key auto-generated if not provided.

#### **Request**

```http
POST /api/v1/webhooks
Content-Type: application/json

{
  "tenant_id": "550e8400-e29b-41d4-a716-446655440000",
  "target_url": "https://api.customer.com/webhooks/platform",
  "subscribed_events": ["user.created", "invoice.paid"],
  "is_active": true
}
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `tenant_id` | UUID | **Yes** | Tenant ID |
| `target_url` | string | **Yes** | Destination URL (http/https) |
| `subscribed_events` | string[] | **Yes** | Event list (min: 1) |
| `secret_key` | string | No | Custom secret (auto-gen if empty) |
| `is_active` | boolean | No | Active status (default: true) |

**URL Validation:**
- Must start with `http://` or `https://`
- Examples: ✅ `https://example.com` ❌ `ftp://example.com`

#### **Response**

**Status:** 201 Created

```json
{
  "_id": "018d8f8f-8f8f-7f8f-8f8f-8f8f8f8f8f8f",
  "secret_key": "whsec_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4",
  "created_at": "2025-01-13T10:30:45.123Z",
  "updated_at": "2025-01-13T10:30:45.123Z",
  "message": "Webhook created successfully. Please save the secret key securely."
}
```

⚠️ **CRITICAL:** `secret_key` chỉ return 1 lần! Save ngay hoặc mất vĩnh viễn!

#### **cURL Example**

```bash
curl -X POST "https://api.yourplatform.com/api/v1/webhooks" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "550e8400-e29b-41d4-a716-446655440000",
    "target_url": "https://api.customer.com/webhooks",
    "subscribed_events": ["user.created", "user.updated"],
    "is_active": true
  }'
```

#### **Error Responses**

**Status:** 400 Bad Request

```json
{
  "error": "Invalid request: subscribed_events is required and must have at least 1 event"
}
```

**Status:** 400 Bad Request

```json
{
  "error": "Invalid target URL format. Must start with http:// or https://"
}
```

---

### **4. PATCH /api/v1/webhooks/:id**

Update webhook with optimistic locking.

#### **Request**

```http
PATCH /api/v1/webhooks/018d8f8f-8f8f-7f8f-8f8f-8f8f8f8f8f8f
Content-Type: application/json

{
  "target_url": "https://new-url.com/webhook",
  "subscribed_events": ["user.created", "invoice.paid", "order.created"],
  "is_active": false,
  "version": 3
}
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `target_url` | string | No | New destination URL |
| `secret_key` | string | No | Rotate secret key |
| `subscribed_events` | string[] | No | Update event list |
| `is_active` | boolean | No | Toggle active status |
| `version` | integer | **Yes** | Current version (optimistic lock) |

⚠️ **Optimistic Locking:** Must provide current `version`. If version mismatch → 409 Conflict.

#### **Response**

**Status:** 200 OK

```json
{
  "message": "Webhook updated successfully",
  "version": 4,
  "updated_at": "2025-01-13T15:45:30.789Z"
}
```

#### **cURL Example**

```bash
curl -X PATCH "https://api.yourplatform.com/api/v1/webhooks/018d8f8f-8f8f-7f8f-8f8f-8f8f8f8f8f8f" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "is_active": false,
    "version": 3
  }'
```

#### **Error Responses**

**Status:** 409 Conflict

```json
{
  "error": "Version conflict or webhook not found. Please reload and try again."
}
```

**Status:** 400 Bad Request

```json
{
  "error": "No fields to update"
}
```

---

### **5. DELETE /api/v1/webhooks/:id**

Hard delete webhook (permanent).

#### **Request**

```http
DELETE /api/v1/webhooks/018d8f8f-8f8f-7f8f-8f8f-8f8f8f8f8f8f
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | Webhook ID to delete |

⚠️ **WARNING:** This is a **hard delete** (permanent). No soft delete trong webhooks table.

#### **Response**

**Status:** 204 No Content

(Empty body)

#### **cURL Example**

```bash
curl -X DELETE "https://api.yourplatform.com/api/v1/webhooks/018d8f8f-8f8f-7f8f-8f8f-8f8f8f8f8f8f" \
  -H "Authorization: Bearer {token}"
```

#### **Error Responses**

**Status:** 404 Not Found

```json
{
  "error": "Webhook not found"
}
```

---

### **6. GET /api/v1/tenants/:tenant_id/webhooks**

Get all webhooks for specific tenant.

#### **Request**

```http
GET /api/v1/tenants/550e8400-e29b-41d4-a716-446655440000/webhooks?is_active=true
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tenant_id` | UUID | Yes | Tenant ID |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `is_active` | boolean | No | Filter by active status |

#### **Response**

**Status:** 200 OK

```json
[
  {
    "_id": "018d8f8f-8f8f-7f8f-8f8f-8f8f8f8f8f8f",
    "tenant_id": "550e8400-e29b-41d4-a716-446655440000",
    "target_url": "https://webhook1.customer.com",
    "subscribed_events": ["user.created"],
    "is_active": true,
    "failure_count": 0,
    "version": 1
  },
  {
    "_id": "018d9a9a-9a9a-8a9a-9a9a-9a9a9a9a9a9a",
    "tenant_id": "550e8400-e29b-41d4-a716-446655440000",
    "target_url": "https://webhook2.customer.com",
    "subscribed_events": ["invoice.paid", "order.created"],
    "is_active": true,
    "failure_count": 2,
    "version": 5
  }
]
```

#### **cURL Example**

```bash
curl -X GET "https://api.yourplatform.com/api/v1/tenants/550e8400-e29b-41d4-a716-446655440000/webhooks" \
  -H "Authorization: Bearer {token}"
```

---

### **7. GET /api/v1/webhooks/statistics**

Get webhook statistics for analytics dashboard.

#### **Request**

```http
GET /api/v1/webhooks/statistics
```

(No parameters)

#### **Response**

**Status:** 200 OK

```json
{
  "total_webhooks": 152,
  "active_webhooks": 138,
  "inactive_webhooks": 14,
  "healthy_webhooks": 125,
  "unhealthy_webhooks": 13,
  "average_failures": 2.3
}
```

**Metrics Explained:**

| Metric | Description |
|--------|-------------|
| `total_webhooks` | Total count |
| `active_webhooks` | `is_active = TRUE` |
| `inactive_webhooks` | `is_active = FALSE` |
| `healthy_webhooks` | `failure_count <= 5` |
| `unhealthy_webhooks` | `failure_count > 5` |
| `average_failures` | AVG(failure_count) |

#### **cURL Example**

```bash
curl -X GET "https://api.yourplatform.com/api/v1/webhooks/statistics" \
  -H "Authorization: Bearer {token}"
```

---

### **8. POST /api/v1/webhooks/:id/test ⭐**

**Test webhook** by sending test event. UNIQUE ENDPOINT!

#### **Request**

```http
POST /api/v1/webhooks/018d8f8f-8f8f-7f8f-8f8f-8f8f8f8f8f8f/test
Content-Type: application/json

{
  "event": "test.webhook",
  "payload": {
    "message": "Testing webhook integration",
    "timestamp": 1705334400
  }
}
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `event` | string | **Yes** | Test event name |
| `payload` | object | **Yes** | Test data to send |

**What Happens:**
1. Platform sends HTTP POST to `target_url`
2. Headers included:
   - `Content-Type: application/json`
   - `X-Webhook-Secret: {secret_key}`
   - `X-Webhook-Event: test.webhook`
3. Body:
```json
{
  "event": "test.webhook",
  "timestamp": 1705334400,
  "test": true,
  "data": { ...payload }
}
```

#### **Response**

**Status:** 200 OK

```json
{
  "success": true,
  "status_code": 200,
  "message": "Webhook test completed",
  "payload": {
    "event": "test.webhook",
    "timestamp": 1705334400,
    "test": true,
    "data": {
      "message": "Testing webhook integration",
      "timestamp": 1705334400
    }
  }
}
```

**Success Criteria:**
- `success: true` → HTTP status 2xx received
- `success: false` → HTTP error or timeout

#### **cURL Example**

```bash
curl -X POST "https://api.yourplatform.com/api/v1/webhooks/018d8f8f-8f8f-7f8f-8f8f-8f8f8f8f8f8f/test" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "test.webhook",
    "payload": {
      "message": "Hello from webhook test!"
    }
  }'
```

#### **Error Responses**

**Status:** 200 OK (but success: false)**

```json
{
  "success": false,
  "message": "Webhook test failed: connection timeout"
}
```

---

### **9. POST /api/v1/webhooks/:id/reset-failures ⭐**

**Reset failure count** to 0. UNIQUE ENDPOINT!

#### **Request**

```http
POST /api/v1/webhooks/018d8f8f-8f8f-7f8f-8f8f-8f8f8f8f8f8f/reset-failures
```

(No request body)

**Use Case:** Customer fixed their endpoint, reset failure count để re-enable healthy status.

#### **Response**

**Status:** 200 OK

```json
{
  "message": "Failure count reset successfully",
  "version": 6,
  "updated_at": "2025-01-13T16:00:00.000Z"
}
```

**Changes:**
- `failure_count = 0`
- `version = version + 1`
- `updated_at = NOW()`

#### **cURL Example**

```bash
curl -X POST "https://api.yourplatform.com/api/v1/webhooks/018d8f8f-8f8f-7f8f-8f8f-8f8f8f8f8f8f/reset-failures" \
  -H "Authorization: Bearer {token}"
```

#### **Error Responses**

**Status:** 404 Not Found

```json
{
  "error": "Webhook not found"
}
```

---

### **10. POST /api/v1/webhooks/generate-secret ⭐**

**Generate new secret key** (utility endpoint). UNIQUE!

#### **Request**

```http
POST /api/v1/webhooks/generate-secret
```

(No request body, no authentication required for this utility)

**Use Case:**
- Generate secret before creating webhook
- Preview secret format
- Testing secret generation algorithm

#### **Response**

**Status:** 200 OK

```json
{
  "secret_key": "whsec_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4",
  "message": "Secret key generated. Please save it securely."
}
```

**Secret Format:**
- Prefix: `whsec_`
- Length: 70 characters (6 prefix + 64 hex)
- Entropy: 256-bit (cryptographically secure)

#### **cURL Example**

```bash
curl -X POST "https://api.yourplatform.com/api/v1/webhooks/generate-secret"
```

---

## 🔄 **COMMON WORKFLOWS**

### **Workflow 1: Create & Test Webhook**

```bash
# Step 1: Generate secret (optional)
SECRET=$(curl -X POST "https://api.yourplatform.com/api/v1/webhooks/generate-secret" | jq -r '.secret_key')

# Step 2: Create webhook
WEBHOOK_ID=$(curl -X POST "https://api.yourplatform.com/api/v1/webhooks" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d "{
    \"tenant_id\": \"550e8400-e29b-41d4-a716-446655440000\",
    \"target_url\": \"https://myapp.com/webhook\",
    \"secret_key\": \"$SECRET\",
    \"subscribed_events\": [\"user.created\"],
    \"is_active\": true
  }" | jq -r '._id')

# Step 3: Test webhook
curl -X POST "https://api.yourplatform.com/api/v1/webhooks/$WEBHOOK_ID/test" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "test.webhook",
    "payload": {"test": true}
  }'
```

### **Workflow 2: Update with Optimistic Locking**

```bash
# Step 1: Get current webhook
WEBHOOK=$(curl -X GET "https://api.yourplatform.com/api/v1/webhooks/$WEBHOOK_ID" \
  -H "Authorization: Bearer {token}")
  
CURRENT_VERSION=$(echo $WEBHOOK | jq -r '.version')

# Step 2: Update with version check
curl -X PATCH "https://api.yourplatform.com/api/v1/webhooks/$WEBHOOK_ID" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d "{
    \"is_active\": false,
    \"version\": $CURRENT_VERSION
  }"
```

### **Workflow 3: Monitor & Reset Failures**

```bash
# Step 1: Get webhook
WEBHOOK=$(curl -X GET "https://api.yourplatform.com/api/v1/webhooks/$WEBHOOK_ID" \
  -H "Authorization: Bearer {token}")

FAILURE_COUNT=$(echo $WEBHOOK | jq -r '.failure_count')

# Step 2: If unhealthy, reset
if [ $FAILURE_COUNT -gt 5 ]; then
  curl -X POST "https://api.yourplatform.com/api/v1/webhooks/$WEBHOOK_ID/reset-failures" \
    -H "Authorization: Bearer {token}"
fi
```

---

## 🚨 **ERROR HANDLING**

### **Error Response Format**

All errors follow consistent format:

```json
{
  "error": "Detailed error message with context"
}
```

### **HTTP Status Codes**

| Code | Meaning | When |
|------|---------|------|
| 200 | OK | Success (GET, PATCH, POST test/reset) |
| 201 | Created | Success (POST create) |
| 204 | No Content | Success (DELETE) |
| 400 | Bad Request | Invalid input, validation error |
| 401 | Unauthorized | Missing/invalid auth token |
| 404 | Not Found | Webhook ID not found |
| 409 | Conflict | Version mismatch (optimistic locking) |
| 500 | Internal Server Error | Database/server error |

---

## 📊 **RATE LIMITS**

| Endpoint | Limit | Window |
|----------|-------|--------|
| GET (list) | 100 req/min | Per user |
| GET (by ID) | 200 req/min | Per user |
| POST (create) | 20 req/min | Per tenant |
| PATCH | 50 req/min | Per user |
| DELETE | 20 req/min | Per user |
| Test webhook | 10 req/min | Per webhook |
| Reset failures | 20 req/min | Per user |

**Rate Limit Headers:**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1705334520
```

---

**Last Updated:** 2025-01-13  
**API Version:** v1  
**Status:** ✅ Production Ready

