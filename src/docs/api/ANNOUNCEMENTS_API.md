# 📡 System Announcements API Documentation

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

System Announcements API provides endpoints for managing system-wide announcements with:
- ✅ Multi-language support (JSONB i18n)
- ✅ Targeted delivery (by region, plan)
- ✅ Read tracking (user engagement)
- ✅ Statistics & analytics
- ✅ Pull-based architecture

---

## 📦 Data Models

### **Announcement**

```typescript
{
  "_id": "uuid",                              // UUID v7
  "titles": {                                 // JSONB - Multi-language
    "en": "System Maintenance",
    "vi": "Bảo trì hệ thống",
    "ja": "システムメンテナンス"
  },
  "contents": {                               // JSONB - Multi-language
    "en": "We will perform maintenance...",
    "vi": "Chúng tôi sẽ bảo trì..."
  },
  "type": "INFO",                             // INFO | WARNING | CRITICAL | PROMOTION
  "target_regions": ["US", "EU", "APAC"],     // Empty = all regions
  "target_plans": ["PRO", "ENTERPRISE"],      // Empty = all plans
  "is_active": true,
  "is_local_time": false,
  "start_at": "2026-01-13T00:00:00Z",
  "end_at": "2026-01-20T00:00:00Z",          // null = no expiry
  "version": 1,
  "created_at": "2026-01-13T10:00:00Z",
  "updated_at": "2026-01-13T10:00:00Z"
}
```

### **AnnouncementWithStats**

```typescript
{
  ...Announcement,
  "read_count": 1250,        // Users who read
  "total_users": 5000        // Total users in system
}
```

### **ReadStats**

```typescript
{
  "announcement_id": "uuid",
  "read_count": 1250,
  "total_users": 5000,
  "read_percentage": 25.00,
  "unread_count": 3750
}
```

---

## 🛣️ Endpoints

### **1. List Announcements**

```http
GET /api/v1/announcements
```

**Description:** Get list of all announcements with filtering options.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `is_active` | boolean | No | Filter by active status |
| `type` | string | No | Filter by type (INFO/WARNING/CRITICAL/PROMOTION) |
| `limit` | integer | No | Number of results (default: 50) |
| `offset` | integer | No | Pagination offset (default: 0) |

**Response:** `200 OK`

```json
[
  {
    "_id": "01934a2f-8b6c-7890-1234-56789abcdef0",
    "titles": {
      "en": "New Feature Available",
      "vi": "Tính năng mới"
    },
    "contents": {
      "en": "Check out our new dashboard...",
      "vi": "Xem dashboard mới của chúng tôi..."
    },
    "type": "INFO",
    "target_regions": [],
    "target_plans": [],
    "is_active": true,
    "is_local_time": false,
    "start_at": "2026-01-13T00:00:00Z",
    "end_at": null,
    "version": 1,
    "created_at": "2026-01-13T08:00:00Z",
    "updated_at": "2026-01-13T08:00:00Z"
  }
]
```

**cURL Example:**

```bash
curl -X GET "https://api.example.com/api/v1/announcements?is_active=true&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### **2. Get Active Announcements (Pull-based)**

```http
GET /api/v1/announcements/active
```

**Description:** Get active announcements for current user (filtered by time, targeting, and read status).

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `user_id` | uuid | No | User ID to filter out already-read announcements |
| `region` | string | No | User's region for targeting (e.g., "US", "EU") |
| `plan` | string | No | User's plan for targeting (e.g., "PRO", "ENTERPRISE") |

**Response:** `200 OK`

```json
[
  {
    "_id": "01934a2f-8b6c-7890-1234-56789abcdef0",
    "titles": {
      "en": "System Maintenance",
      "vi": "Bảo trì hệ thống"
    },
    "contents": {
      "en": "We will perform maintenance on Jan 15...",
      "vi": "Chúng tôi sẽ bảo trì vào ngày 15/1..."
    },
    "type": "WARNING",
    "target_regions": ["US", "EU"],
    "target_plans": ["PRO", "ENTERPRISE"],
    "is_active": true,
    "start_at": "2026-01-13T00:00:00Z",
    "end_at": "2026-01-15T00:00:00Z",
    "version": 1
  }
]
```

**Logic:**
1. Filter by `is_active = TRUE`
2. Filter by `start_at <= NOW() AND (end_at IS NULL OR end_at > NOW())`
3. Filter by `target_regions` (if provided)
4. Filter by `target_plans` (if provided)
5. Exclude announcements in `user_announcement_reads` (if `user_id` provided)

**cURL Example:**

```bash
curl -X GET "https://api.example.com/api/v1/announcements/active?user_id=USER_UUID&region=US&plan=PRO"
```

---

### **3. Get Announcement by ID**

```http
GET /api/v1/announcements/{id}
```

**Description:** Get a single announcement by UUID.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | uuid | Yes | Announcement UUID |

**Response:** `200 OK`

```json
{
  "_id": "01934a2f-8b6c-7890-1234-56789abcdef0",
  "titles": {
    "en": "System Maintenance",
    "vi": "Bảo trì hệ thống"
  },
  "contents": {
    "en": "Detailed maintenance information...",
    "vi": "Thông tin chi tiết về bảo trì..."
  },
  "type": "WARNING",
  "target_regions": ["US"],
  "target_plans": ["ENTERPRISE"],
  "is_active": true,
  "is_local_time": false,
  "start_at": "2026-01-13T00:00:00Z",
  "end_at": "2026-01-15T00:00:00Z",
  "version": 1,
  "created_at": "2026-01-13T08:00:00Z",
  "updated_at": "2026-01-13T08:00:00Z"
}
```

**Error Response:** `404 Not Found`

```json
{
  "error": "Announcement not found"
}
```

---

### **4. Get Announcement with Statistics**

```http
GET /api/v1/announcements/{id}/stats
```

**Description:** Get announcement with read count and total users.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | uuid | Yes | Announcement UUID |

**Response:** `200 OK`

```json
{
  "_id": "01934a2f-8b6c-7890-1234-56789abcdef0",
  "titles": { "en": "System Maintenance" },
  "contents": { "en": "Maintenance details..." },
  "type": "WARNING",
  "is_active": true,
  "start_at": "2026-01-13T00:00:00Z",
  "end_at": "2026-01-15T00:00:00Z",
  "read_count": 1250,      // Users who read this announcement
  "total_users": 5000,     // Total users in system
  "version": 1
}
```

**Usage:** Admin dashboard to see engagement metrics.

---

### **5. Create Announcement**

```http
POST /api/v1/announcements
```

**Description:** Create a new system announcement.

**Request Body:**

```json
{
  "titles": {
    "en": "New Feature Launch",
    "vi": "Ra mắt tính năng mới",
    "ja": "新機能リリース"
  },
  "contents": {
    "en": "We're excited to announce...",
    "vi": "Chúng tôi hân hạnh công bố...",
    "ja": "発表できることを嬉しく思います..."
  },
  "type": "PROMOTION",                      // Optional, default: "INFO"
  "target_regions": ["US", "EU", "APAC"],   // Optional, empty = all
  "target_plans": ["PRO", "ENTERPRISE"],    // Optional, empty = all
  "is_active": true,                        // Optional, default: true
  "is_local_time": false,                   // Optional, default: false
  "start_at": "2026-01-13T00:00:00Z",       // Optional, default: NOW()
  "end_at": "2026-01-20T00:00:00Z"          // Optional, default: null (no expiry)
}
```

**Response:** `201 Created`

```json
{
  "_id": "01934a2f-8b6c-7890-1234-56789abcdef0",
  "titles": { "en": "New Feature Launch", "vi": "Ra mắt tính năng mới" },
  "contents": { "en": "We're excited...", "vi": "Chúng tôi hân hạnh..." },
  "type": "PROMOTION",
  "target_regions": ["US", "EU", "APAC"],
  "target_plans": ["PRO", "ENTERPRISE"],
  "is_active": true,
  "is_local_time": false,
  "start_at": "2026-01-13T00:00:00Z",
  "end_at": "2026-01-20T00:00:00Z",
  "version": 1,
  "created_at": "2026-01-13T10:00:00Z",
  "updated_at": "2026-01-13T10:00:00Z"
}
```

**cURL Example:**

```bash
curl -X POST "https://api.example.com/api/v1/announcements" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "titles": {"en": "New Feature", "vi": "Tính năng mới"},
    "contents": {"en": "Check it out!", "vi": "Hãy thử ngay!"},
    "type": "PROMOTION"
  }'
```

---

### **6. Update Announcement**

```http
PATCH /api/v1/announcements/{id}
```

**Description:** Update an existing announcement (partial update).

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | uuid | Yes | Announcement UUID |

**Request Body:** (All fields optional)

```json
{
  "titles": {
    "en": "Updated Title",
    "vi": "Tiêu đề cập nhật"
  },
  "is_active": false,                 // Deactivate announcement
  "end_at": "2026-01-15T00:00:00Z"   // Update expiry date
}
```

**Response:** `200 OK`

```json
{
  "message": "Announcement updated successfully",
  "updated_at": "2026-01-13T11:00:00Z"
}
```

**Note:** `version` is automatically incremented on each update.

---

### **7. Delete Announcement**

```http
DELETE /api/v1/announcements/{id}
```

**Description:** Delete an announcement permanently.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | uuid | Yes | Announcement UUID |

**Response:** `200 OK`

```json
{
  "message": "Announcement deleted successfully"
}
```

**Error Response:** `404 Not Found`

```json
{
  "error": "Announcement not found"
}
```

**Warning:** This will cascade delete all `user_announcement_reads` records.

---

### **8. Mark Announcement as Read**

```http
POST /api/v1/announcements/{id}/mark-read
```

**Description:** Mark an announcement as read by a user (upsert pattern).

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | uuid | Yes | Announcement UUID |

**Request Body:**

```json
{
  "user_id": "01934a2f-1111-2222-3333-444444444444"
}
```

**Response:** `200 OK`

```json
{
  "_id": "01934a2f-5555-6666-7777-888888888888",
  "tenant_id": "01934a2f-aaaa-bbbb-cccc-dddddddddddd",
  "user_id": "01934a2f-1111-2222-3333-444444444444",
  "announcement_id": "01934a2f-8b6c-7890-1234-56789abcdef0",
  "read_at": "2026-01-13T11:30:00Z",
  "version": 1
}
```

**Behavior:**
- **First call:** Creates new read record
- **Subsequent calls:** Updates `read_at` timestamp (idempotent)
- Uses `ON CONFLICT (user_id, announcement_id) DO UPDATE`

**cURL Example:**

```bash
curl -X POST "https://api.example.com/api/v1/announcements/ANNOUNCEMENT_UUID/mark-read" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "USER_UUID"}'
```

---

### **9. Get Read Statistics**

```http
GET /api/v1/announcements/{id}/read-stats
```

**Description:** Get detailed read statistics for an announcement.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | uuid | Yes | Announcement UUID |

**Response:** `200 OK`

```json
{
  "announcement_id": "01934a2f-8b6c-7890-1234-56789abcdef0",
  "read_count": 1250,
  "total_users": 5000,
  "read_percentage": 25.00,
  "unread_count": 3750
}
```

**Calculations:**
- `read_percentage = (read_count / total_users) * 100`
- `unread_count = total_users - read_count`

**Usage:** Admin analytics dashboard.

---

## 📚 Examples

### **Example 1: Display Active Announcements on User Login**

```typescript
// Frontend: Fetch active announcements for user
async function fetchUserAnnouncements(userId: string, region: string, plan: string) {
  const response = await fetch(
    `/api/v1/announcements/active?user_id=${userId}&region=${region}&plan=${plan}`
  );
  const announcements = await response.json();
  
  // Display in banner
  announcements.forEach(announcement => {
    showBanner({
      title: announcement.titles['vi'] || announcement.titles['en'],
      content: announcement.contents['vi'] || announcement.contents['en'],
      type: announcement.type,
      onDismiss: () => markAsRead(announcement._id, userId)
    });
  });
}

// Mark as read when user dismisses
async function markAsRead(announcementId: string, userId: string) {
  await fetch(`/api/v1/announcements/${announcementId}/mark-read`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId })
  });
}
```

---

### **Example 2: Admin Creates Targeted Announcement**

```typescript
// Admin creates announcement for Enterprise users in US region
async function createMaintenanceAnnouncement() {
  const response = await fetch('/api/v1/announcements', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ADMIN_TOKEN',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      titles: {
        en: 'Scheduled Maintenance - Enterprise Tier',
        vi: 'Bảo trì định kỳ - Gói Enterprise'
      },
      contents: {
        en: 'We will perform maintenance on Jan 15, 2026 from 2:00 AM to 4:00 AM PST...',
        vi: 'Chúng tôi sẽ bảo trì vào ngày 15/1/2026 từ 2:00 sáng đến 4:00 sáng PST...'
      },
      type: 'WARNING',
      target_regions: ['US'],
      target_plans: ['ENTERPRISE'],
      is_active: true,
      start_at: '2026-01-14T00:00:00Z',
      end_at: '2026-01-15T12:00:00Z'
    })
  });
  
  const announcement = await response.json();
  console.log('Created:', announcement._id);
}
```

---

### **Example 3: Admin Monitors Engagement**

```typescript
// Admin checks how many users have read the announcement
async function checkEngagement(announcementId: string) {
  const response = await fetch(`/api/v1/announcements/${announcementId}/read-stats`);
  const stats = await response.json();
  
  console.log(`Engagement Rate: ${stats.read_percentage}%`);
  console.log(`Read: ${stats.read_count} / ${stats.total_users}`);
  console.log(`Unread: ${stats.unread_count}`);
  
  // If low engagement, consider resending
  if (stats.read_percentage < 20) {
    console.warn('Low engagement! Consider re-activating or changing type to CRITICAL');
  }
}
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
| `400` | Bad Request | Invalid UUID, missing required fields |
| `401` | Unauthorized | Missing or invalid auth token |
| `404` | Not Found | Announcement not found |
| `500` | Internal Server Error | Database error, server error |

### **Common Errors**

**1. Invalid UUID Format**

```json
{
  "error": "Invalid announcement ID format"
}
```

**2. Missing Required Fields**

```json
{
  "error": "Invalid request data: titles is required"
}
```

**3. Announcement Not Found**

```json
{
  "error": "Announcement not found"
}
```

**4. User Not Found**

```json
{
  "error": "User not found"
}
```

---

## 🎯 Best Practices

### **1. i18n Strategy**

Always provide at least English (`en`) as fallback:

```json
{
  "titles": {
    "en": "Default English Title",    // ✅ Required fallback
    "vi": "Tiêu đề tiếng Việt",
    "ja": "日本語タイトル"
  }
}
```

Client-side locale selection:

```typescript
const title = announcement.titles[userLocale] 
  || announcement.titles['en'] 
  || Object.values(announcement.titles)[0];
```

---

### **2. Targeting Strategy**

Empty arrays = show to ALL users:

```json
{
  "target_regions": [],    // Show globally
  "target_plans": []       // Show to all plans
}
```

Specific targeting:

```json
{
  "target_regions": ["US", "EU"],           // Only US & EU
  "target_plans": ["PRO", "ENTERPRISE"]     // Only PRO & ENTERPRISE
}
```

---

### **3. Pull-based Pattern**

Frontend should call `/announcements/active` on:
- User login
- Page refresh
- Periodic polling (e.g., every 5 minutes)

```typescript
// Poll every 5 minutes
setInterval(() => {
  fetchActiveAnnouncements(userId, region, plan);
}, 5 * 60 * 1000);
```

---

### **4. Expiry Management**

Set `end_at` for time-sensitive announcements:

```json
{
  "start_at": "2026-01-13T00:00:00Z",
  "end_at": "2026-01-15T00:00:00Z"    // Auto-expires
}
```

Or use `is_active` for manual control:

```json
{
  "is_active": false    // Manually deactivate
}
```

---

## 🚀 Performance Tips

1. **Use GIN indexes** for targeting queries (100x faster)
2. **Use partial index** for active announcements (90% smaller)
3. **Cache active announcements** on frontend (5-minute TTL)
4. **Batch mark-as-read** if user dismisses multiple announcements
5. **Paginate admin lists** using `limit` & `offset`

---

## 📊 Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `GET /announcements/active` | 100 req/min | Per user |
| `POST /announcements/:id/mark-read` | 20 req/min | Per user |
| `POST /announcements` (Admin) | 10 req/min | Global |
| `PATCH /announcements/:id` (Admin) | 30 req/min | Global |

---

**API Version:** 1.0.0  
**Last Updated:** January 13, 2026  
**Maintainer:** Platform Team
