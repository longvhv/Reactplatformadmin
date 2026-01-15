# Webhooks API Reference

**Version:** 1.0  
**Last Updated:** 2026-01-14  
**Status:** ✅ Production Ready

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Base URL](#base-url)
4. [Endpoints](#endpoints)
   - [List Webhooks](#1-list-webhooks)
   - [Get Webhook by ID](#2-get-webhook-by-id)
   - [Create Webhook](#3-create-webhook)
   - [Update Webhook](#4-update-webhook)
   - [Delete Webhook](#5-delete-webhook)
   - [Test Webhook](#6-test-webhook)
   - [Get Deliveries](#7-get-webhook-deliveries)
   - [Get Active Webhooks](#8-get-active-webhooks)
   - [Get Webhooks by Event](#9-get-webhooks-by-event)
   - [Get Statistics](#10-get-webhook-statistics)
   - [Reset Failure Count](#11-reset-failure-count)
5. [Data Models](#data-models)
6. [Event Types](#event-types)
7. [Webhook Signing](#webhook-signing)
8. [Error Handling](#error-handling)
9. [Best Practices](#best-practices)
10. [Examples](#examples)

---

## Overview

The Webhooks API allows you to manage webhook subscriptions for receiving real-time event notifications. This API supports:

- **Event Subscriptions:** Subscribe to multiple event types
- **Auto-retry:** Automatic retry on delivery failures
- **Signature Verification:** HMAC-SHA256 signed payloads
- **Failure Tracking:** Monitor webhook health
- **Optimistic Locking:** Version-based conflict prevention
- **Event Filtering:** Subscribe to specific events only

### Key Features

✅ **11 Production-Ready Endpoints**  
✅ **Auto-Generate Secret Keys** for webhook signing  
✅ **ARRAY Support** for multiple event subscriptions  
✅ **Failure Tracking** with auto-disable after threshold  
✅ **Optimistic Locking** with version field  
✅ **Event-based Filtering** for efficient delivery  
✅ **Statistics & Analytics**  

---

## Authentication

All API endpoints require authentication via Bearer token.

```http
Authorization: Bearer <your-jwt-token>
```

### Required Permissions

| Endpoint | Required Permission |
|----------|-------------------|
| List Webhooks | `webhooks:read` |
| Get Webhook | `webhooks:read` |
| Create Webhook | `webhooks:create` |
| Update Webhook | `webhooks:update` |
| Delete Webhook | `webhooks:delete` |
| Test Webhook | `webhooks:test` |
| Reset Failures | `webhooks:manage` |

---

## Base URL

```
Production: https://api.vhvplatform.com/v1
Staging:    https://api-staging.vhvplatform.com/v1
Development: http://localhost:8080/v1
```

---

## Endpoints

### 1. List Webhooks

Get a paginated list of webhooks with optional filters.

#### Request

```http
GET /webhooks
```

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tenant_id` | UUID | No | Filter by tenant ID |
| `is_active` | boolean | No | Filter by active status |
| `event` | string | No | Filter by subscribed event |
| `page` | integer | No | Page number (default: 1) |
| `limit` | integer | No | Items per page (default: 20) |

#### Response

**Status:** `200 OK`

```json
{
  "data": [
    {
      "_id": "01934c8f-1a2b-7c3d-8e4f-5a6b7c8d9e0f",
      "tenant_id": "01934c8f-0000-7c3d-8e4f-000000000001",
      "target_url": "https://example.com/webhooks",
      "secret_key": "whsec_abc123...",
      "subscribed_events": [
        "user.created",
        "user.updated",
        "order.paid"
      ],
      "is_active": true,
      "failure_count": 0,
      "created_at": "2026-01-14T10:30:00Z",
      "updated_at": "2026-01-14T10:30:00Z",
      "version": 1,
      "tenant_name": "Acme Corporation"
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 20,
  "pages": 2
}
```

#### Example

```bash
# List all webhooks for a tenant
curl -X GET "https://api.vhvplatform.com/v1/webhooks?tenant_id=01934c8f-0000-7c3d-8e4f-000000000001" \
  -H "Authorization: Bearer YOUR_TOKEN"

# List only active webhooks
curl -X GET "https://api.vhvplatform.com/v1/webhooks?is_active=true" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Filter by event
curl -X GET "https://api.vhvplatform.com/v1/webhooks?event=user.created" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 2. Get Webhook by ID

Retrieve detailed information about a specific webhook.

#### Request

```http
GET /webhooks/{id}
```

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | Webhook ID |

#### Response

**Status:** `200 OK`

```json
{
  "_id": "01934c8f-1a2b-7c3d-8e4f-5a6b7c8d9e0f",
  "tenant_id": "01934c8f-0000-7c3d-8e4f-000000000001",
  "target_url": "https://example.com/webhooks",
  "secret_key": "whsec_abc123...",
  "subscribed_events": [
    "user.created",
    "user.updated",
    "order.paid"
  ],
  "is_active": true,
  "failure_count": 0,
  "created_at": "2026-01-14T10:30:00Z",
  "updated_at": "2026-01-14T10:30:00Z",
  "version": 1,
  "tenant_name": "Acme Corporation"
}
```

#### Errors

| Status | Description |
|--------|-------------|
| `404` | Webhook not found |
| `500` | Internal server error |

#### Example

```bash
curl -X GET "https://api.vhvplatform.com/v1/webhooks/01934c8f-1a2b-7c3d-8e4f-5a6b7c8d9e0f" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 3. Create Webhook

Create a new webhook subscription.

#### Request

```http
POST /webhooks
```

#### Request Body

```json
{
  "tenant_id": "01934c8f-0000-7c3d-8e4f-000000000001",
  "target_url": "https://example.com/webhooks",
  "secret_key": "whsec_your_secret_key",
  "subscribed_events": [
    "user.created",
    "user.updated",
    "order.paid"
  ]
}
```

#### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `tenant_id` | UUID | **Yes** | ID of the tenant |
| `target_url` | string | **Yes** | Webhook endpoint URL (must be HTTPS in production) |
| `secret_key` | string | No | Secret key for signing (auto-generated if not provided) |
| `subscribed_events` | string[] | **Yes** | Array of event names to subscribe to |

#### Response

**Status:** `201 Created`

```json
{
  "_id": "01934c8f-1a2b-7c3d-8e4f-5a6b7c8d9e0f",
  "tenant_id": "01934c8f-0000-7c3d-8e4f-000000000001",
  "target_url": "https://example.com/webhooks",
  "secret_key": "whsec_abc123xyz789...",
  "subscribed_events": [
    "user.created",
    "user.updated",
    "order.paid"
  ],
  "is_active": true,
  "failure_count": 0,
  "created_at": "2026-01-14T10:30:00Z",
  "updated_at": "2026-01-14T10:30:00Z",
  "version": 1
}
```

#### Auto-Generated Fields

1. **`_id`** - UUID v7
2. **`secret_key`** - Format: `whsec_{uuid}` (if not provided)
3. **`is_active`** - Set to `true`
4. **`failure_count`** - Set to `0`
5. **`version`** - Set to `1`
6. **`created_at`** - Current timestamp
7. **`updated_at`** - Current timestamp

#### Example

```bash
curl -X POST "https://api.vhvplatform.com/v1/webhooks" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "01934c8f-0000-7c3d-8e4f-000000000001",
    "target_url": "https://example.com/webhooks",
    "subscribed_events": ["user.created", "order.paid"]
  }'
```

---

### 4. Update Webhook

Update webhook configuration with optimistic locking.

#### Request

```http
PATCH /webhooks/{id}
```

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | Webhook ID |

#### Request Body

```json
{
  "target_url": "https://new-domain.com/webhooks",
  "subscribed_events": [
    "user.created",
    "user.deleted",
    "order.paid",
    "order.cancelled"
  ],
  "is_active": true,
  "version": 1
}
```

#### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `target_url` | string | No | New webhook URL |
| `secret_key` | string | No | New secret key |
| `subscribed_events` | string[] | No | Updated event subscriptions |
| `is_active` | boolean | No | Active status |
| `version` | integer | **Yes** | Current version for optimistic locking |

#### Response

**Status:** `200 OK`

Returns the updated webhook (same structure as Get Webhook)

#### Optimistic Locking

The `version` field prevents concurrent update conflicts:

```
1. Client A reads webhook with version=1
2. Client B reads webhook with version=1
3. Client A updates with version=1 → Success, version becomes 2
4. Client B updates with version=1 → Fails with 409 Conflict
```

#### Errors

| Status | Description |
|--------|-------------|
| `400` | Invalid request (no fields to update) |
| `404` | Webhook not found |
| `409` | Version conflict (optimistic locking failed) |
| `500` | Internal server error |

#### Example

```bash
curl -X PATCH "https://api.vhvplatform.com/v1/webhooks/01934c8f-1a2b-7c3d-8e4f-5a6b7c8d9e0f" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subscribed_events": ["user.created", "user.deleted"],
    "version": 1
  }'
```

---

### 5. Delete Webhook

Delete a webhook (hard delete).

#### Request

```http
DELETE /webhooks/{id}
```

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | Webhook ID |

#### Response

**Status:** `204 No Content`

No response body.

#### Example

```bash
curl -X DELETE "https://api.vhvplatform.com/v1/webhooks/01934c8f-1a2b-7c3d-8e4f-5a6b7c8d9e0f" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 6. Test Webhook

Send a test event to the webhook endpoint.

#### Request

```http
POST /webhooks/{id}/test
```

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | Webhook ID |

#### Request Body

```json
{
  "event": "user.created",
  "payload": {
    "user_id": "123",
    "email": "test@example.com",
    "name": "Test User"
  }
}
```

#### Response

**Status:** `200 OK`

```json
{
  "success": true,
  "status_code": 200,
  "message": "Test webhook delivered successfully",
  "timestamp": 1705234800
}
```

#### Test Payload Structure

```json
{
  "event": "user.created",
  "timestamp": 1705234800,
  "data": {
    "user_id": "123",
    "email": "test@example.com"
  },
  "test": true
}
```

#### Example

```bash
curl -X POST "https://api.vhvplatform.com/v1/webhooks/01934c8f-1a2b-7c3d-8e4f-5a6b7c8d9e0f/test" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "user.created",
    "payload": {"user_id": "123"}
  }'
```

---

### 7. Get Webhook Deliveries

Get delivery history for a webhook.

#### Request

```http
GET /webhooks/{id}/deliveries
```

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | Webhook ID |

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `limit` | integer | No | Limit (default: 50, max: 200) |

#### Response

**Status:** `200 OK`

```json
{
  "data": [
    {
      "_id": "01934c8f-2a3b-7c3d-8e4f-5a6b7c8d9e0f",
      "webhook_id": "01934c8f-1a2b-7c3d-8e4f-5a6b7c8d9e0f",
      "event": "user.created",
      "payload": {
        "user_id": "123",
        "email": "user@example.com"
      },
      "status_code": 200,
      "response_body": "OK",
      "success": true,
      "attempt": 1,
      "delivered_at": "2026-01-14T10:35:00Z"
    }
  ],
  "total": 156,
  "note": "Showing last 50 deliveries"
}
```

#### Example

```bash
curl -X GET "https://api.vhvplatform.com/v1/webhooks/01934c8f-1a2b-7c3d-8e4f-5a6b7c8d9e0f/deliveries?limit=100" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 8. Get Active Webhooks

Get all webhooks with `is_active = true`.

#### Request

```http
GET /webhooks/active
```

#### Response

**Status:** `200 OK`

```json
{
  "data": [
    {
      "_id": "01934c8f-1a2b-7c3d-8e4f-5a6b7c8d9e0f",
      "tenant_id": "01934c8f-0000-7c3d-8e4f-000000000001",
      "target_url": "https://example.com/webhooks",
      "subscribed_events": ["user.created"],
      "is_active": true,
      "failure_count": 0
    }
  ],
  "total": 42
}
```

#### Use Cases

- System health monitoring
- Event dispatcher lookup
- Active subscription count

#### Example

```bash
curl -X GET "https://api.vhvplatform.com/v1/webhooks/active" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 9. Get Webhooks by Event

Get all active webhooks subscribed to a specific event.

#### Request

```http
GET /webhooks/by-event
```

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `event` | string | **Yes** | Event name |

#### Response

**Status:** `200 OK`

```json
{
  "event": "user.created",
  "data": [
    {
      "_id": "01934c8f-1a2b-7c3d-8e4f-5a6b7c8d9e0f",
      "tenant_id": "01934c8f-0000-7c3d-8e4f-000000000001",
      "target_url": "https://example.com/webhooks",
      "secret_key": "whsec_abc123...",
      "subscribed_events": ["user.created", "user.updated"],
      "is_active": true,
      "failure_count": 0
    }
  ],
  "total": 5
}
```

#### Use Cases

- Event dispatcher: Find all webhooks to notify
- Analytics: See which webhooks subscribe to specific events
- Debugging: Verify event subscriptions

#### Example

```bash
curl -X GET "https://api.vhvplatform.com/v1/webhooks/by-event?event=user.created" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 10. Get Webhook Statistics

Get comprehensive statistics about webhooks.

#### Request

```http
GET /webhooks/stats
```

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tenant_id` | UUID | No | Filter statistics by tenant |

#### Response

**Status:** `200 OK`

```json
{
  "total_webhooks": 125,
  "active_webhooks": 98,
  "inactive_webhooks": 27,
  "total_deliveries": 15420,
  "failed_deliveries": 234,
  "success_rate": 98.48,
  "event_counts": {
    "user.created": 45,
    "user.updated": 38,
    "order.paid": 52,
    "order.cancelled": 15,
    "subscription.renewed": 28
  }
}
```

#### Metrics Explained

| Metric | Description |
|--------|-------------|
| `total_webhooks` | Total number of webhooks |
| `active_webhooks` | Webhooks with is_active = true |
| `inactive_webhooks` | Webhooks with is_active = false |
| `total_deliveries` | Total webhook deliveries attempted |
| `failed_deliveries` | Number of failed deliveries |
| `success_rate` | Percentage of successful deliveries |
| `event_counts` | Number of webhooks per event type |

#### Example

```bash
# All statistics
curl -X GET "https://api.vhvplatform.com/v1/webhooks/stats" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Statistics for specific tenant
curl -X GET "https://api.vhvplatform.com/v1/webhooks/stats?tenant_id=01934c8f-0000-7c3d-8e4f-000000000001" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 11. Reset Failure Count

Reset the failure count for a webhook and reactivate it.

#### Request

```http
POST /webhooks/{id}/reset-failures
```

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | Webhook ID |

#### Response

**Status:** `200 OK`

Returns the updated webhook with `failure_count = 0` and `is_active = true`

#### Use Cases

- Manual recovery after fixing webhook endpoint
- Testing after webhook updates
- Clearing false positive failures

#### Example

```bash
curl -X POST "https://api.vhvplatform.com/v1/webhooks/01934c8f-1a2b-7c3d-8e4f-5a6b7c8d9e0f/reset-failures" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Data Models

### Webhook

Main webhook object with all fields.

```typescript
interface Webhook {
  // I. ĐỊNH DANH & TENANCY
  _id: string;              // UUID v7
  tenant_id: string;        // UUID

  // II. CẤU HÌNH KỸ THUẬT
  target_url: string;       // Webhook endpoint URL
  secret_key: string;       // Secret for HMAC signing
  subscribed_events: string[]; // Array of event names

  // III. TRẠNG THÁI VẬN HÀNH
  is_active: boolean;       // Active status
  failure_count: number;    // Number of consecutive failures

  // IV. AUDIT & VERSIONING
  created_at: string;       // ISO 8601 timestamp
  updated_at: string;       // ISO 8601 timestamp
  version: number;          // Optimistic locking

  // Extended fields (from JOINs)
  tenant_name?: string;
}
```

---

## Event Types

### Standard Events

#### User Events
- `user.created` - New user registered
- `user.updated` - User profile updated
- `user.deleted` - User account deleted
- `user.login` - User logged in
- `user.logout` - User logged out

#### Order Events
- `order.created` - New order created
- `order.paid` - Order payment successful
- `order.cancelled` - Order cancelled
- `order.failed` - Order payment failed

#### Subscription Events
- `subscription.created` - New subscription
- `subscription.renewed` - Subscription renewed
- `subscription.cancelled` - Subscription cancelled
- `subscription.expired` - Subscription expired

#### Tenant Events
- `tenant.created` - New tenant registered
- `tenant.updated` - Tenant settings updated
- `tenant.suspended` - Tenant suspended
- `tenant.activated` - Tenant activated

### Custom Events

You can define custom events using dot notation:
- Format: `{category}.{action}`
- Examples: `product.launched`, `campaign.started`, `report.generated`

---

## Webhook Signing

All webhook payloads are signed using HMAC-SHA256 for security.

### Signature Generation

```typescript
import crypto from 'crypto';

function generateSignature(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}
```

### Signature Verification

```typescript
function verifySignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = generateSignature(payload, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

### HTTP Headers

```http
POST /your-webhook-endpoint HTTP/1.1
Host: example.com
Content-Type: application/json
X-Webhook-Signature: sha256=abc123...
X-Webhook-Event: user.created
X-Webhook-Delivery-ID: uuid
X-Webhook-Timestamp: 1705234800
```

### Payload Structure

```json
{
  "event": "user.created",
  "timestamp": 1705234800,
  "data": {
    "user_id": "123",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

---

## Error Handling

### Standard Error Response

```json
{
  "error": "Error message description",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional context"
  }
}
```

### Common Error Codes

| HTTP Status | Error Code | Description |
|------------|------------|-------------|
| 400 | `INVALID_REQUEST` | Invalid request body or parameters |
| 400 | `EMPTY_EVENTS` | subscribed_events cannot be empty |
| 400 | `INVALID_URL` | target_url must be HTTPS |
| 401 | `UNAUTHORIZED` | Missing or invalid authentication |
| 403 | `FORBIDDEN` | Insufficient permissions |
| 404 | `NOT_FOUND` | Webhook not found |
| 409 | `VERSION_CONFLICT` | Optimistic locking failure |
| 422 | `VALIDATION_ERROR` | Field validation failed |
| 500 | `INTERNAL_ERROR` | Server error |

### Retry Logic

Webhooks are retried automatically on failure:

1. **Retry Schedule:**
   - Attempt 1: Immediate
   - Attempt 2: After 1 minute
   - Attempt 3: After 5 minutes
   - Attempt 4: After 15 minutes
   - Attempt 5: After 1 hour

2. **Failure Threshold:**
   - After 5 consecutive failures, webhook is automatically disabled (`is_active = false`)
   - `failure_count` is incremented on each failure
   - Reset to 0 on successful delivery

3. **Manual Recovery:**
   - Use `/webhooks/{id}/reset-failures` to reset and reactivate

---

## Best Practices

### 1. Security

✅ **Always use HTTPS** in production  
✅ **Verify webhook signatures** on your endpoint  
✅ **Rotate secret keys** periodically  
✅ **Validate payload structure** before processing  
✅ **Use IP whitelisting** if possible  

### 2. Performance

✅ **Respond quickly** (< 1 second)  
✅ **Process asynchronously** (queue the job, return 200)  
✅ **Implement idempotency** (handle duplicate deliveries)  
✅ **Set appropriate timeout** on your endpoint  

### 3. Monitoring

✅ **Log all webhook deliveries**  
✅ **Monitor failure rates**  
✅ **Set up alerts** for high failure counts  
✅ **Track delivery latency**  

### 4. Event Subscriptions

✅ **Subscribe only to needed events**  
✅ **Use specific events** instead of wildcards  
✅ **Review subscriptions** regularly  
✅ **Remove unused webhooks**  

---

## Examples

### Complete Webhook Lifecycle

#### 1. Create Webhook

```bash
curl -X POST "https://api.vhvplatform.com/v1/webhooks" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "01934c8f-0000-7c3d-8e4f-000000000001",
    "target_url": "https://example.com/webhooks",
    "subscribed_events": ["user.created", "order.paid"]
  }'
```

**Response:**
```json
{
  "_id": "01934c8f-1a2b-7c3d-8e4f-5a6b7c8d9e0f",
  "secret_key": "whsec_abc123xyz789...",
  "is_active": true
}
```

#### 2. Test Webhook

```bash
curl -X POST "https://api.vhvplatform.com/v1/webhooks/01934c8f-1a2b-7c3d-8e4f-5a6b7c8d9e0f/test" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "user.created",
    "payload": {"user_id": "123"}
  }'
```

#### 3. Monitor Deliveries

```bash
curl -X GET "https://api.vhvplatform.com/v1/webhooks/01934c8f-1a2b-7c3d-8e4f-5a6b7c8d9e0f/deliveries" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 4. Handle Failures

```bash
# Reset failure count
curl -X POST "https://api.vhvplatform.com/v1/webhooks/01934c8f-1a2b-7c3d-8e4f-5a6b7c8d9e0f/reset-failures" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Webhook Endpoint Implementation

```typescript
import express from 'express';
import crypto from 'crypto';

const app = express();
app.use(express.raw({ type: 'application/json' }));

app.post('/webhooks', (req, res) => {
  // 1. Verify signature
  const signature = req.headers['x-webhook-signature'];
  const payload = req.body.toString();
  const secret = process.env.WEBHOOK_SECRET;
  
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  if (signature !== `sha256=${expectedSignature}`) {
    return res.status(401).send('Invalid signature');
  }
  
  // 2. Parse event
  const event = JSON.parse(payload);
  
  // 3. Queue for async processing
  await queue.add('process-webhook', event);
  
  // 4. Respond immediately
  res.status(200).send('OK');
});
```

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-14 | Initial release with 11 endpoints |

---

## Support

For API support, contact:
- **Email:** api-support@vhvplatform.com
- **Documentation:** https://docs.vhvplatform.com
- **Status Page:** https://status.vhvplatform.com

---

**✅ API Reference Complete - 1,400+ lines**

*Last updated: 2026-01-14*
