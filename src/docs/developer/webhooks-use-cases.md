# Webhooks - Use Cases

**Version:** 1.0  
**Last Updated:** 2026-01-14  
**Status:** ✅ Production Ready

## Table of Contents

1. [Overview](#overview)
2. [Use Case List](#use-case-list)
3. [Detailed Use Cases](#detailed-use-cases)
   - [UC-WH-001: Create Webhook](#uc-wh-001-create-webhook)
   - [UC-WH-002: Deliver Event](#uc-wh-002-deliver-event)
   - [UC-WH-003: Handle Delivery Failure](#uc-wh-003-handle-delivery-failure)
   - [UC-WH-004: Test Webhook](#uc-wh-004-test-webhook)
   - [UC-WH-005: Update Webhook](#uc-wh-005-update-webhook)
   - [UC-WH-006: Delete Webhook](#uc-wh-006-delete-webhook)
   - [UC-WH-007: Reset Failures](#uc-wh-007-reset-failures)
   - [UC-WH-008: Monitor Webhook Health](#uc-wh-008-monitor-webhook-health)
   - [UC-WH-009: Rotate Secret Key](#uc-wh-009-rotate-secret-key)
   - [UC-WH-010: Verify Signature](#uc-wh-010-verify-signature)
4. [Actor Definitions](#actor-definitions)
5. [System Behaviors](#system-behaviors)

---

## Overview

This document describes all use cases for the Webhooks module. Each use case includes:

- **Actors** involved
- **Preconditions** required
- **Main flow** steps
- **Alternative flows** for different scenarios
- **Postconditions** and expected results
- **Business rules** applied
- **API endpoints** used
- **Error handling** scenarios

### Statistics

- **Total Use Cases:** 10
- **Actors:** 5 (Tenant, Admin, System, Event Dispatcher, External Endpoint)
- **API Endpoints:** 11
- **Covered Scenarios:** 35+

---

## Use Case List

| ID | Use Case Name | Primary Actor | Priority | Status |
|----|---------------|---------------|----------|--------|
| UC-WH-001 | Create Webhook | Tenant | Critical | ✅ |
| UC-WH-002 | Deliver Event | Event Dispatcher | Critical | ✅ |
| UC-WH-003 | Handle Delivery Failure | System | Critical | ✅ |
| UC-WH-004 | Test Webhook | Tenant/Admin | High | ✅ |
| UC-WH-005 | Update Webhook | Tenant | High | ✅ |
| UC-WH-006 | Delete Webhook | Tenant/Admin | Medium | ✅ |
| UC-WH-007 | Reset Failures | Admin | High | ✅ |
| UC-WH-008 | Monitor Webhook Health | Admin | High | ✅ |
| UC-WH-009 | Rotate Secret Key | System/Admin | Medium | ✅ |
| UC-WH-010 | Verify Signature | External Endpoint | Critical | ✅ |

---

## Detailed Use Cases

### UC-WH-001: Create Webhook

**ID:** UC-WH-001  
**Name:** Create New Webhook Subscription  
**Priority:** Critical  
**Frequency:** 50+ times/day

#### Actors
- **Primary:** Tenant (Developer)
- **Secondary:** System

#### Preconditions
- ✅ Tenant is authenticated
- ✅ Tenant has valid endpoint URL
- ✅ Tenant knows which events to subscribe to

#### Main Flow

1. Tenant navigates to Webhooks settings
2. Tenant clicks "Create Webhook"
3. System displays webhook creation form
4. Tenant enters:
   - Target URL (webhook endpoint)
   - Select events to subscribe to
   - (Optional) Custom secret key
5. Tenant submits form
6. System validates input:
   - URL format (must be HTTP/HTTPS)
   - At least one event selected
   - URL is reachable (optional)
7. System generates UUID v7 for webhook ID
8. System generates secret key (if not provided):
   - Format: `whsec_{uuid}`
9. System creates webhook record:
   - `is_active = TRUE`
   - `failure_count = 0`
   - `version = 1`
10. System stores webhook in database
11. System displays success message with:
    - Webhook ID
    - Secret key (show once!)
    - Instructions for implementation
12. Tenant saves secret key securely

#### Alternative Flows

**A1: Invalid URL Format**
- At step 6, URL format is invalid
- System displays error: "URL must be HTTP or HTTPS"
- Return to step 4
- Use case continues

**A2: No Events Selected**
- At step 6, no events are selected
- System displays error: "Please select at least one event"
- Return to step 4
- Use case continues

**A3: URL Unreachable (Optional Check)**
- At step 6, system attempts to reach URL
- URL returns 404 or timeout
- System displays warning: "URL may not be reachable"
- Tenant can choose to continue or fix URL
- Use case continues

#### Postconditions

**Success:**
- ✅ Webhook created with status = active
- ✅ Secret key generated and displayed
- ✅ Events subscribed correctly
- ✅ Ready to receive event notifications

**Failure:**
- ❌ No webhook created
- ❌ Error message displayed
- ❌ User can retry

#### Business Rules

| Rule | Description |
|------|-------------|
| BR-WH-001 | URL must be HTTP or HTTPS format |
| BR-WH-002 | At least one event must be subscribed |
| BR-WH-003 | Secret key shown only once at creation |
| BR-WH-004 | Webhook starts in active state |
| BR-WH-005 | HTTPS recommended for production |

#### API Endpoint

```http
POST /webhooks
Content-Type: application/json
Authorization: Bearer <token>

{
  "tenant_id": "01934c8f-0000-7c3d-8e4f-000000000001",
  "target_url": "https://example.com/webhooks",
  "subscribed_events": [
    "user.created",
    "order.paid"
  ]
}
```

**Response (201 Created):**
```json
{
  "_id": "01934c8f-1a2b-7c3d-8e4f-5a6b7c8d9e0f",
  "secret_key": "whsec_abc123xyz789...",
  "is_active": true,
  "failure_count": 0,
  "created_at": "2026-01-14T10:30:00Z"
}
```

#### Error Handling

| Error Code | HTTP Status | Description | User Message |
|------------|-------------|-------------|--------------|
| INVALID_URL | 400 | URL format invalid | "Please provide a valid HTTP/HTTPS URL" |
| EMPTY_EVENTS | 400 | No events selected | "Select at least one event to subscribe" |
| INVALID_TENANT | 404 | Tenant not found | "Invalid tenant ID" |
| DATABASE_ERROR | 500 | DB connection issue | "Service temporarily unavailable" |

#### Related Use Cases
- UC-WH-004: Test Webhook (verify setup)
- UC-WH-005: Update Webhook (modify later)

---

### UC-WH-002: Deliver Event

**ID:** UC-WH-002  
**Name:** Deliver Event to Webhook  
**Priority:** Critical  
**Frequency:** 10,000+ times/day

#### Actors
- **Primary:** Event Dispatcher (System)
- **Secondary:** External Endpoint, Database

#### Preconditions
- ✅ Event has occurred in the system
- ✅ Active webhooks exist for this event
- ✅ Network connectivity available

#### Main Flow

1. Event occurs in system (e.g., user.created)
2. Event Dispatcher receives event notification
3. System queries database:
   ```sql
   SELECT _id, target_url, secret_key, failure_count
   FROM webhooks
   WHERE is_active = TRUE
   AND 'user.created' = ANY(subscribed_events)
   ```
4. System receives list of webhooks (0..N)
5. For each webhook:
   - Build event payload:
     ```json
     {
       "event": "user.created",
       "timestamp": 1705234800,
       "data": { "user_id": "123", "email": "user@example.com" }
     }
     ```
   - Generate HMAC signature:
     ```
     signature = HMAC-SHA256(payload, secret_key)
     ```
   - Send HTTP POST to target_url with headers:
     ```
     X-Webhook-Signature: sha256={signature}
     X-Webhook-Event: user.created
     X-Webhook-Delivery-ID: {uuid}
     X-Webhook-Timestamp: {unix_timestamp}
     ```
6. External Endpoint receives request
7. External Endpoint verifies signature
8. External Endpoint processes event
9. External Endpoint responds with 2xx status
10. System logs successful delivery
11. System resets failure_count to 0

#### Alternative Flows

**A1: No Webhooks Subscribed**
- At step 4, query returns 0 webhooks
- System logs: "No webhooks subscribed to user.created"
- Use case ends successfully

**A2: Endpoint Returns 4xx Error**
- At step 9, endpoint returns 400-499 status
- System logs error response
- System increments failure_count
- System does NOT retry (client error)
- Continue to next webhook
- Use case ends

**A3: Endpoint Returns 5xx Error**
- At step 9, endpoint returns 500-599 status
- System logs error response
- System increments failure_count
- System schedules retry (see UC-WH-003)
- Continue to next webhook
- Use case ends

**A4: Endpoint Timeout**
- At step 8, endpoint doesn't respond within 30 seconds
- System cancels request
- System increments failure_count
- System schedules retry
- Continue to next webhook
- Use case ends

**A5: Network Error**
- At step 5, network connection fails
- System logs network error
- System increments failure_count
- System schedules retry
- Continue to next webhook
- Use case ends

#### Postconditions

**Success:**
- ✅ Event delivered to all subscribed webhooks
- ✅ Delivery logged
- ✅ failure_count reset to 0
- ✅ Webhook remains active

**Partial Success:**
- ✅ Event delivered to some webhooks
- ⚠️ Some webhooks failed
- ✅ Failures logged and queued for retry

**Failure:**
- ❌ All webhooks failed
- ✅ All failures logged
- ✅ Retries scheduled

#### Business Rules

| Rule | Description |
|------|-------------|
| BR-WH-006 | Only active webhooks receive events |
| BR-WH-007 | Signature must be HMAC-SHA256 |
| BR-WH-008 | Timeout after 30 seconds |
| BR-WH-009 | Retry only on 5xx errors and timeouts |
| BR-WH-010 | Reset failure_count on success |

#### Performance Requirements
- Event lookup: < 10ms
- Signature generation: < 5ms
- HTTP request timeout: 30 seconds
- Total delivery time: < 1 minute
- Queue processing: Asynchronous

#### Monitoring

```sql
-- Monitor delivery stats
SELECT 
  COUNT(*) as total_deliveries,
  COUNT(*) FILTER (WHERE success = TRUE) as successful,
  COUNT(*) FILTER (WHERE success = FALSE) as failed,
  ROUND(100.0 * COUNT(*) FILTER (WHERE success = TRUE) / COUNT(*), 2) as success_rate
FROM webhook_deliveries
WHERE delivered_at >= NOW() - INTERVAL '1 hour';
```

#### Related Use Cases
- UC-WH-003: Handle Delivery Failure (error path)
- UC-WH-010: Verify Signature (endpoint side)

---

### UC-WH-003: Handle Delivery Failure

**ID:** UC-WH-003  
**Name:** Handle Webhook Delivery Failure  
**Priority:** Critical  
**Frequency:** 200+ times/day

#### Actors
- **Primary:** System (Retry Worker)
- **Secondary:** Database, Email Service

#### Preconditions
- ✅ Webhook delivery has failed
- ✅ Failure is logged in database
- ✅ Retry worker is running

#### Main Flow

1. Webhook delivery fails (from UC-WH-002)
2. System increments failure_count:
   ```sql
   UPDATE webhooks
   SET failure_count = failure_count + 1,
       version = version + 1,
       updated_at = NOW()
   WHERE _id = $1
   RETURNING failure_count;
   ```
3. System checks failure_count
4. System calculates retry delay:
   - Attempt 1: Immediate
   - Attempt 2: 1 minute
   - Attempt 3: 5 minutes
   - Attempt 4: 15 minutes
   - Attempt 5: 1 hour
5. System queues retry job with delay
6. Retry worker picks up job
7. Retry worker attempts delivery again
8. If successful:
   - Reset failure_count to 0
   - Log success
   - Use case ends
9. If failed:
   - Increment failure_count again
   - Check threshold
   - Continue

#### Alternative Flows

**A1: Failure Threshold Reached (count >= 5)**
- At step 3, failure_count is 5 or more
- System disables webhook:
   ```sql
   UPDATE webhooks
   SET is_active = FALSE,
       version = version + 1
   WHERE _id = $1;
   ```
- System sends alert email to tenant:
   - Subject: "Webhook Disabled - Multiple Failures"
   - Include: webhook URL, failure count, recent errors
   - Action: Instructions to fix and reset
- System logs auto-disable event
- Use case ends

**A2: Webhook Deleted During Retry**
- At step 7, webhook no longer exists
- System cancels retry job
- System cleans up queue
- Use case ends

**A3: URL Changed During Retry**
- At step 7, webhook URL has changed
- System uses new URL for retry
- Continue from step 7

#### Postconditions

**Success:**
- ✅ Delivery eventually succeeds
- ✅ failure_count reset to 0
- ✅ Webhook remains active

**Failure:**
- ✅ Webhook disabled after threshold
- ✅ Tenant notified via email
- ✅ Manual intervention required

#### Business Rules

| Rule | Description |
|------|-------------|
| BR-WH-011 | Auto-disable after 5 failures |
| BR-WH-012 | Exponential backoff for retries |
| BR-WH-013 | Max 5 retry attempts |
| BR-WH-014 | Send alert email on disable |
| BR-WH-015 | Log all retry attempts |

#### Retry Schedule

| Attempt | Delay | Total Time |
|---------|-------|------------|
| 1 | 0s | 0s |
| 2 | 1m | 1m |
| 3 | 5m | 6m |
| 4 | 15m | 21m |
| 5 | 1h | 1h 21m |

#### Email Template

**Subject:** Webhook Disabled - Multiple Delivery Failures

**Body:**
```
Hello {tenant_name},

Your webhook has been automatically disabled due to multiple delivery failures.

Webhook Details:
- URL: {target_url}
- Events: {subscribed_events}
- Failure Count: {failure_count}
- Last Error: {last_error}

To reactivate:
1. Fix your webhook endpoint
2. Test the webhook
3. Reset the failure count in settings

Need help? Contact support@vhvplatform.com
```

#### Related Use Cases
- UC-WH-002: Deliver Event (triggers this)
- UC-WH-007: Reset Failures (recovery action)

---

### UC-WH-004: Test Webhook

**ID:** UC-WH-004  
**Name:** Test Webhook Endpoint  
**Priority:** High  
**Frequency:** 30+ times/day

#### Actors
- **Primary:** Tenant, Admin
- **Secondary:** System, External Endpoint

#### Preconditions
- ✅ Webhook exists
- ✅ User has permission to test
- ✅ External endpoint is ready

#### Main Flow

1. User navigates to webhook details
2. User clicks "Test Webhook" button
3. System displays test dialog:
   - Select event type (dropdown)
   - Optional: Custom test payload (JSON)
4. User selects event (e.g., "user.created")
5. User clicks "Send Test"
6. System builds test payload:
   ```json
   {
     "event": "user.created",
     "timestamp": 1705234800,
     "data": {
       "user_id": "test-123",
       "email": "test@example.com",
       "name": "Test User"
     },
     "test": true
   }
   ```
7. System signs payload with HMAC
8. System sends HTTP POST to webhook URL
9. System waits for response (30s timeout)
10. External Endpoint receives and processes
11. External Endpoint responds with 200 OK
12. System displays success message:
    - Status code: 200
    - Response time: 145ms
    - Response body (if any)
13. User confirms webhook is working

#### Alternative Flows

**A1: Endpoint Returns Error**
- At step 11, endpoint returns 4xx or 5xx
- System displays error details:
  - Status code
  - Response body
  - Suggestions for fixing
- User can retry or check endpoint
- Use case ends

**A2: Endpoint Timeout**
- At step 10, no response within 30 seconds
- System cancels request
- System displays timeout error:
  - "Request timeout after 30 seconds"
  - "Check if your endpoint is online"
- User can retry
- Use case ends

**A3: Network Error**
- At step 8, network connection fails
- System displays network error:
  - Error message
  - "Check your URL"
- User can retry
- Use case ends

**A4: Invalid Event Selected**
- At step 4, event not in subscribed_events
- System displays warning:
  - "This event is not subscribed"
  - "Test will still send"
- User can continue or cancel
- Use case continues

#### Postconditions

**Success:**
- ✅ Test request sent successfully
- ✅ Endpoint responded correctly
- ✅ User confirms webhook works
- ✅ No impact on failure_count

**Failure:**
- ✅ Error details displayed
- ✅ No impact on webhook status
- ✅ User can debug and retry

#### Business Rules

| Rule | Description |
|------|-------------|
| BR-WH-016 | Test does not affect failure_count |
| BR-WH-017 | Test payload marked with "test": true |
| BR-WH-018 | Test timeout is 30 seconds |
| BR-WH-019 | Test can send any event (even unsubscribed) |

#### API Endpoint

```http
POST /webhooks/{id}/test
Content-Type: application/json
Authorization: Bearer <token>

{
  "event": "user.created",
  "payload": {
    "user_id": "test-123",
    "email": "test@example.com"
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "status_code": 200,
  "response_time_ms": 145,
  "response_body": "OK",
  "message": "Test webhook delivered successfully"
}
```

#### Related Use Cases
- UC-WH-001: Create Webhook (verify after creation)
- UC-WH-005: Update Webhook (verify after update)

---

### UC-WH-005: Update Webhook

**ID:** UC-WH-005  
**Name:** Update Webhook Configuration  
**Priority:** High  
**Frequency:** 20+ times/day

#### Actors
- **Primary:** Tenant
- **Secondary:** System

#### Preconditions
- ✅ Webhook exists
- ✅ Tenant is authenticated
- ✅ Tenant has permission to update

#### Main Flow

1. Tenant navigates to webhook details
2. Tenant clicks "Edit Webhook"
3. System displays edit form with current values:
   - Target URL
   - Subscribed events (checkboxes)
   - Active status (toggle)
4. Tenant modifies fields:
   - Change URL to new endpoint
   - Add/remove events
   - Toggle active status
5. Tenant clicks "Save Changes"
6. System validates input:
   - URL format
   - At least one event (if active)
7. System retrieves current version
8. System updates webhook with optimistic locking:
   ```sql
   UPDATE webhooks
   SET 
     target_url = $1,
     subscribed_events = $2,
     is_active = $3,
     version = version + 1,
     updated_at = NOW()
   WHERE _id = $4
   AND version = $5
   RETURNING version;
   ```
9. System checks affected rows
10. System displays success message
11. System suggests testing webhook
12. Tenant can test immediately

#### Alternative Flows

**A1: Version Conflict**
- At step 9, 0 rows affected (someone else updated)
- System displays error:
  - "Webhook was updated by another user"
  - "Please refresh and try again"
- Tenant refreshes page
- Tenant reapplies changes
- Use case continues

**A2: Invalid URL Format**
- At step 6, new URL is invalid
- System displays error
- Return to step 4
- Use case continues

**A3: Remove All Events**
- At step 4, tenant unchecks all events
- At step 6, validation fails
- System displays error:
  - "At least one event required"
- Return to step 4
- Use case continues

**A4: No Changes Made**
- At step 5, no fields were modified
- System displays info message:
  - "No changes to save"
- Use case ends

#### Postconditions

**Success:**
- ✅ Webhook updated successfully
- ✅ Version incremented
- ✅ Changes effective immediately
- ✅ Future events use new config

**Failure:**
- ❌ Webhook unchanged
- ❌ Error message displayed
- ❌ User can retry

#### Business Rules

| Rule | Description |
|------|-------------|
| BR-WH-020 | Optimistic locking prevents conflicts |
| BR-WH-021 | URL change takes effect immediately |
| BR-WH-022 | Event changes apply to future deliveries |
| BR-WH-023 | Deactivating stops all deliveries |

#### API Endpoint

```http
PATCH /webhooks/{id}
Content-Type: application/json
Authorization: Bearer <token>

{
  "target_url": "https://new-domain.com/webhooks",
  "subscribed_events": ["user.created", "user.deleted"],
  "is_active": true,
  "version": 1
}
```

**Response (200 OK):**
```json
{
  "_id": "01934c8f-1a2b-7c3d-8e4f-5a6b7c8d9e0f",
  "target_url": "https://new-domain.com/webhooks",
  "subscribed_events": ["user.created", "user.deleted"],
  "is_active": true,
  "version": 2,
  "updated_at": "2026-01-14T11:00:00Z"
}
```

#### Related Use Cases
- UC-WH-004: Test Webhook (verify changes)
- UC-WH-009: Rotate Secret Key (security update)

---

### UC-WH-006: Delete Webhook

**ID:** UC-WH-006  
**Name:** Delete Webhook Subscription  
**Priority:** Medium  
**Frequency:** 10+ times/day

#### Actors
- **Primary:** Tenant, Admin
- **Secondary:** System

#### Preconditions
- ✅ Webhook exists
- ✅ User has permission to delete

#### Main Flow

1. User navigates to webhook details
2. User clicks "Delete Webhook" button
3. System displays confirmation dialog:
   - "Are you sure you want to delete this webhook?"
   - Webhook URL shown
   - Warning: "This action cannot be undone"
4. User confirms deletion
5. System performs hard delete:
   ```sql
   DELETE FROM webhooks WHERE _id = $1;
   ```
6. System logs deletion event
7. System displays success message
8. System redirects to webhooks list
9. Webhook no longer receives events

#### Alternative Flows

**A1: User Cancels**
- At step 4, user clicks "Cancel"
- No changes made
- Use case ends

**A2: Webhook Has Recent Deliveries**
- At step 3, system checks delivery history
- System displays additional warning:
  - "This webhook has 150 deliveries in last 24h"
  - "Consider deactivating instead of deleting"
- User can choose:
  - Deactivate (safer)
  - Delete (permanent)
- Use case continues based on choice

**A3: Webhook Already Deleted**
- At step 5, webhook not found
- System displays info message:
  - "Webhook was already deleted"
- Use case ends

#### Postconditions

**Success:**
- ✅ Webhook permanently deleted
- ✅ No longer in database
- ✅ Future events not delivered
- ✅ Deletion logged in audit trail

**Cancelled:**
- ❌ Webhook unchanged
- ✅ User returned to details page

#### Business Rules

| Rule | Description |
|------|-------------|
| BR-WH-024 | Hard delete (not soft delete) |
| BR-WH-025 | Deletion is permanent |
| BR-WH-026 | Require explicit confirmation |
| BR-WH-027 | Log deletion in audit trail |

#### API Endpoint

```http
DELETE /webhooks/{id}
Authorization: Bearer <token>
```

**Response (204 No Content)**

No response body.

#### Alternative: Deactivate Instead

For safer option, deactivate instead of delete:

```http
PATCH /webhooks/{id}
Content-Type: application/json

{
  "is_active": false,
  "version": 1
}
```

#### Related Use Cases
- UC-WH-005: Update Webhook (deactivate alternative)

---

### UC-WH-007: Reset Failures

**ID:** UC-WH-007  
**Name:** Reset Webhook Failure Count  
**Priority:** High  
**Frequency:** 15+ times/day

#### Actors
- **Primary:** Admin, Tenant
- **Secondary:** System

#### Preconditions
- ✅ Webhook exists
- ✅ Webhook is inactive (failure_count >= 5)
- ✅ Endpoint has been fixed

#### Main Flow

1. User navigates to webhook details
2. User sees webhook is disabled:
   - Status badge shows "Inactive"
   - failure_count shows "5+"
   - Warning message displayed
3. User clicks "Reset Failures" button
4. System displays confirmation:
   - "This will reactivate the webhook"
   - "Make sure your endpoint is fixed"
5. User confirms reset
6. System resets webhook:
   ```sql
   UPDATE webhooks
   SET 
     failure_count = 0,
     is_active = TRUE,
     version = version + 1,
     updated_at = NOW()
   WHERE _id = $1
   RETURNING *;
   ```
7. System displays success message:
   - "Webhook reactivated"
   - "Failure count reset to 0"
8. System suggests testing webhook
9. User tests webhook to verify
10. Webhook resumes receiving events

#### Alternative Flows

**A1: Endpoint Still Broken**
- At step 9, test fails
- System displays error
- System keeps failure_count at 0
- User must fix endpoint
- User can test again
- Use case ends with warning

**A2: Webhook Not Disabled**
- At step 2, webhook is already active
- System displays info:
  - "Webhook is already active"
  - "Failure count: {count}"
- User can still reset if needed
- Use case continues

**A3: Auto-Disable After Reset**
- After reset, webhook fails again
- failure_count increments
- Reaches 5 again
- System auto-disables again
- Admin notified of persistent issue
- Requires investigation

#### Postconditions

**Success:**
- ✅ failure_count reset to 0
- ✅ is_active set to TRUE
- ✅ Webhook resumes deliveries
- ✅ Version incremented

**Failure:**
- ✅ Webhook status unchanged
- ✅ Error message displayed

#### Business Rules

| Rule | Description |
|------|-------------|
| BR-WH-028 | Reset requires explicit action |
| BR-WH-029 | Reactivates webhook immediately |
| BR-WH-030 | Testing recommended after reset |
| BR-WH-031 | Can reset multiple times |

#### API Endpoint

```http
POST /webhooks/{id}/reset-failures
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "_id": "01934c8f-1a2b-7c3d-8e4f-5a6b7c8d9e0f",
  "is_active": true,
  "failure_count": 0,
  "version": 3,
  "updated_at": "2026-01-14T12:00:00Z"
}
```

#### Related Use Cases
- UC-WH-003: Handle Delivery Failure (causes this)
- UC-WH-004: Test Webhook (recommended after)

---

### UC-WH-008: Monitor Webhook Health

**ID:** UC-WH-008  
**Name:** Monitor Webhook Health and Performance  
**Priority:** High  
**Frequency:** Continuous (Dashboard)

#### Actors
- **Primary:** Admin, DevOps
- **Secondary:** Monitoring System

#### Main Flow

1. Admin navigates to Webhooks dashboard
2. System displays health overview:
   - Total webhooks
   - Active webhooks
   - Inactive webhooks
   - Total deliveries (24h)
   - Success rate (24h)
3. System shows real-time metrics:
   - Delivery latency (p50, p95, p99)
   - Error rate by status code
   - Top failing webhooks
4. System displays webhook list with health indicators:
   - Green: All healthy (failure_count = 0)
   - Yellow: Some failures (1-4)
   - Red: Disabled (failure_count >= 5)
5. Admin can drill down into specific webhook:
   - Recent deliveries
   - Error distribution
   - Response times
6. System provides actionable alerts:
   - "5 webhooks need attention"
   - "Success rate dropped below 95%"
7. Admin takes action as needed

#### Metrics Displayed

**Overview:**
```
Total Webhooks: 125
├── Active: 98 (78%)
└── Inactive: 27 (22%)

Deliveries (24h): 15,420
├── Successful: 15,186 (98.5%)
└── Failed: 234 (1.5%)

Average Response Time: 145ms
```

**Health Status:**
```
✅ Healthy: 93 webhooks
⚠️ Warning: 5 webhooks (1-4 failures)
❌ Critical: 27 webhooks (disabled)
```

#### Query for Health Status

```sql
SELECT 
  CASE 
    WHEN failure_count = 0 THEN 'healthy'
    WHEN failure_count < 5 THEN 'warning'
    ELSE 'critical'
  END as health_status,
  COUNT(*) as count
FROM webhooks
GROUP BY health_status;
```

#### Alerts Configuration

| Condition | Alert Level | Action |
|-----------|-------------|--------|
| Webhook disabled | Critical | Email + Slack |
| Success rate < 95% | Warning | Email |
| 10+ failures in 1h | Warning | Slack |
| Response time > 5s | Info | Log |

#### Related Use Cases
- UC-WH-003: Handle Delivery Failure (detected here)
- UC-WH-007: Reset Failures (action from here)

---

### UC-WH-009: Rotate Secret Key

**ID:** UC-WH-009  
**Name:** Rotate Webhook Secret Key  
**Priority:** Medium  
**Frequency:** Quarterly

#### Actors
- **Primary:** Admin, Security Team
- **Secondary:** System, Tenant

#### Preconditions
- ✅ Webhook exists
- ✅ Admin has security permissions
- ✅ New secret key ready

#### Main Flow

1. Admin navigates to webhook security settings
2. Admin clicks "Rotate Secret Key"
3. System generates new secret key:
   - Format: `whsec_{uuid}`
4. System displays both keys:
   - Old key: `whsec_old123...`
   - New key: `whsec_new456...`
5. System provides transition period (24 hours):
   - Both keys valid during transition
   - Allows time to update endpoint
6. Admin saves new key
7. System updates webhook:
   ```sql
   UPDATE webhooks
   SET 
     secret_key = $1,
     version = version + 1,
     updated_at = NOW()
   WHERE _id = $2;
   ```
8. Admin updates endpoint to use new key
9. Admin tests webhook with new key
10. After 24 hours, old key expires
11. Only new key is valid

#### Best Practices

**Rotation Schedule:**
- Security compliance: Every 90 days
- After breach: Immediately
- During audit: As required

**Process:**
1. Generate new key
2. Deploy to endpoint (with both keys)
3. Update webhook
4. Test thoroughly
5. Remove old key after transition

#### Related Use Cases
- UC-WH-004: Test Webhook (verify new key)
- UC-WH-010: Verify Signature (uses new key)

---

### UC-WH-010: Verify Signature

**ID:** UC-WH-010  
**Name:** Verify Webhook Signature (Endpoint Side)  
**Priority:** Critical  
**Frequency:** Every webhook delivery

#### Actors
- **Primary:** External Endpoint (Customer's Server)
- **Secondary:** System

#### Preconditions
- ✅ Endpoint receives webhook POST request
- ✅ Endpoint has secret key stored securely
- ✅ Request includes signature header

#### Main Flow

1. Endpoint receives HTTP POST request
2. Endpoint extracts headers:
   - `X-Webhook-Signature`: `sha256=abc123...`
   - `X-Webhook-Event`: `user.created`
   - `X-Webhook-Timestamp`: `1705234800`
3. Endpoint reads raw request body (JSON string)
4. Endpoint computes expected signature:
   ```typescript
   import crypto from 'crypto';
   
   const expectedSignature = crypto
     .createHmac('sha256', secretKey)
     .update(rawBody)
     .digest('hex');
   ```
5. Endpoint extracts provided signature:
   ```typescript
   const providedSignature = headers['x-webhook-signature']
     .replace('sha256=', '');
   ```
6. Endpoint compares signatures using timing-safe comparison:
   ```typescript
   const isValid = crypto.timingSafeEqual(
     Buffer.from(expectedSignature),
     Buffer.from(providedSignature)
   );
   ```
7. If valid:
   - Parse JSON payload
   - Process event
   - Return 200 OK
8. If invalid:
   - Log security warning
   - Return 401 Unauthorized
   - Do NOT process event

#### Implementation Example

```typescript
import express from 'express';
import crypto from 'crypto';

const app = express();

// Use raw body parser
app.use(express.raw({ type: 'application/json' }));

app.post('/webhooks', (req, res) => {
  // 1. Extract signature
  const signature = req.headers['x-webhook-signature'] as string;
  if (!signature) {
    return res.status(401).send('Missing signature');
  }
  
  // 2. Get raw body
  const rawBody = req.body.toString();
  
  // 3. Compute expected signature
  const secret = process.env.WEBHOOK_SECRET;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');
  
  // 4. Extract provided signature
  const providedSignature = signature.replace('sha256=', '');
  
  // 5. Timing-safe comparison
  try {
    const isValid = crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(providedSignature)
    );
    
    if (!isValid) {
      return res.status(401).send('Invalid signature');
    }
  } catch (error) {
    return res.status(401).send('Signature verification failed');
  }
  
  // 6. Parse and process
  const event = JSON.parse(rawBody);
  
  // 7. Queue for async processing
  await queue.add('process-webhook', event);
  
  // 8. Respond immediately
  res.status(200).send('OK');
});
```

#### Security Best Practices

✅ **Always verify signature** before processing  
✅ **Use timing-safe comparison** to prevent timing attacks  
✅ **Check timestamp** to prevent replay attacks  
✅ **Use raw body** (don't parse before verification)  
✅ **Log invalid attempts** for security monitoring  
✅ **Return quickly** (< 1 second)  
✅ **Process asynchronously** after verification  

#### Related Use Cases
- UC-WH-002: Deliver Event (sends signature)
- UC-WH-009: Rotate Secret Key (updates key)

---

## Actor Definitions

### 1. Tenant (Developer)
- Creates and manages webhooks
- Configures event subscriptions
- Tests webhook endpoints
- Monitors delivery success

### 2. Admin
- Monitors system health
- Resets failed webhooks
- Manages security (key rotation)
- Handles escalations

### 3. Event Dispatcher (System)
- Detects events in system
- Finds subscribed webhooks
- Delivers events asynchronously
- Handles retries

### 4. External Endpoint
- Receives webhook POSTs
- Verifies signatures
- Processes events
- Responds with status codes

### 5. Retry Worker (System)
- Monitors failed deliveries
- Schedules retries with backoff
- Auto-disables after threshold
- Sends alerts

---

## System Behaviors

### Event Types

**User Events:**
- `user.created` - New user registered
- `user.updated` - Profile updated
- `user.deleted` - Account deleted

**Order Events:**
- `order.created` - New order
- `order.paid` - Payment successful
- `order.cancelled` - Order cancelled

**Subscription Events:**
- `subscription.created` - New subscription
- `subscription.renewed` - Auto-renewed
- `subscription.cancelled` - Cancelled

### Delivery Guarantees

- **At-least-once delivery**: Events may be delivered multiple times
- **No ordering guarantee**: Events may arrive out of order
- **Best-effort reliability**: 99.9% success rate target

### Performance SLAs

- Event lookup: < 10ms
- Signature generation: < 5ms
- HTTP timeout: 30 seconds
- Retry schedule: Exponential backoff
- Success rate target: > 99%

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-14 | Initial use cases documentation |

---

**✅ Use Cases Documentation Complete - 1,200+ lines**

*Last updated: 2026-01-14*
