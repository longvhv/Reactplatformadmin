# 🗄️ WEBHOOKS - DATABASE SCHEMA DOCUMENTATION

> Complete database structure, indexes, constraints, and best practices

---

## 📋 **TABLE OF CONTENTS**

1. [Table Structure](#table-structure)
2. [Column Details](#column-details)
3. [Indexes Strategy](#indexes-strategy)
4. [Constraints & Validation](#constraints--validation)
5. [JSONB Structure](#jsonb-structure)
6. [Storage Estimates](#storage-estimates)
7. [Migration Scripts](#migration-scripts)
8. [Best Practices](#best-practices)

---

## 📊 **TABLE STRUCTURE**

### **webhooks Table**

```sql
CREATE TABLE webhooks (
    -- I. ĐỊNH DANH & TENANCY
    _id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    
    -- II. CẤU HÌNH KỸ THUẬT
    target_url TEXT NOT NULL,
    secret_key TEXT NOT NULL,
    subscribed_events TEXT[] NOT NULL,
    
    -- III. TRẠNG THÁI VẬN HÀNH
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    failure_count INT NOT NULL DEFAULT 0,
    
    -- IV. AUDIT & VERSIONING
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 1,

    -- V. CÁC RÀNG BUỘC (CONSTRAINTS)
    CONSTRAINT fk_webhook_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(_id) ON DELETE CASCADE,
    CONSTRAINT chk_webhook_url_fmt CHECK (target_url ~* '^https?://'),
    CONSTRAINT chk_webhook_fail_count CHECK (failure_count >= 0),
    CONSTRAINT chk_webhook_version CHECK (version >= 1)
);
```

**Table Size:** ~200 bytes per row (excluding TEXT fields)  
**Expected Volume:** 10-500 webhooks per tenant  
**Growth Rate:** ~50 new webhooks/day (estimated)

---

## 📝 **COLUMN DETAILS**

### **I. ĐỊNH DANH & TENANCY**

#### **1. `_id` (UUID PRIMARY KEY)**

- **Type:** UUID
- **Generation:** UUID v7 (recommended) from application layer
- **Purpose:** Unique identifier for webhook
- **Indexing:** B-tree (PRIMARY KEY)
- **Example:** `018d8f8f-8f8f-7f8f-8f8f-8f8f8f8f8f8f`

**Benefits of UUID v7:**
- ✅ Time-ordered (better for B-tree index performance)
- ✅ Globally unique across distributed systems
- ✅ No collision risk
- ✅ Sharding-friendly

#### **2. `tenant_id` (UUID NOT NULL)**

- **Type:** UUID
- **Purpose:** Links webhook to specific tenant (multi-tenancy isolation)
- **Foreign Key:** References `tenants(_id)`
- **Delete Behavior:** CASCADE (delete webhooks when tenant deleted)
- **Index:** Part of composite index `idx_webhooks_tenant_list`

**Query Pattern:**
```sql
-- Get all webhooks for tenant
SELECT * FROM webhooks WHERE tenant_id = ? ORDER BY created_at DESC;
```

---

### **II. CẤU HÌNH KỸ THUẬT**

#### **3. `target_url` (TEXT NOT NULL)**

- **Type:** TEXT (unlimited length)
- **Purpose:** Destination URL to send webhook HTTP POST
- **Validation:** Must match regex `^https?://`
- **Examples:**
  - ✅ `https://api.customer.com/webhooks/platform`
  - ✅ `http://localhost:3000/webhook` (dev only)
  - ❌ `ftp://example.com` (invalid protocol)
  - ❌ `not-a-url` (invalid format)

**URL Validation Regex:**
```regex
^https?://
```

**Storage:**
- Average: 50-100 characters
- Max: Unlimited (TEXT type)

#### **4. `secret_key` (TEXT NOT NULL)**

- **Type:** TEXT
- **Purpose:** Secret key for webhook signature verification
- **Generation:** Auto-generated if not provided
- **Format:** `whsec_{64-character-hex-string}`
- **Length:** 70 characters (6 prefix + 64 hex)
- **Security:** NEVER expose in API responses (except on creation)

**Generation Algorithm:**
```go
func generateSecretKey() string {
    bytes := make([]byte, 32) // 256-bit entropy
    rand.Read(bytes)
    return "whsec_" + hex.EncodeToString(bytes)
}
```

**Example:**
```
whsec_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4
```

**Security Considerations:**
- 🔒 Store as-is (no hashing needed for server-side validation)
- 🔒 Rotate periodically (every 90-180 days)
- 🔒 Never log in plaintext
- 🔒 Mask in UI (show only first 20 chars)

#### **5. `subscribed_events` (TEXT[] NOT NULL)**

- **Type:** PostgreSQL Array of TEXT
- **Purpose:** List of event types this webhook subscribes to
- **Indexing:** GIN index for fast `= ANY()` queries
- **Min Length:** 1 event (enforced at application layer)
- **Max Length:** Unlimited

**Event Format:**
```
{category}.{action}
```

**Examples:**
```sql
-- Single event
subscribed_events = ARRAY['user.created']

-- Multiple events
subscribed_events = ARRAY['user.created', 'user.updated', 'user.deleted']

-- Wildcard (all user events)
subscribed_events = ARRAY['user.*']

-- Mixed
subscribed_events = ARRAY['user.*', 'invoice.paid', 'order.created']
```

**Supported Events (50+):**

| Category | Events |
|----------|--------|
| **user** | created, updated, deleted, login, logout |
| **subscription** | created, renewed, cancelled, expired, past_due |
| **invoice** | created, sent, paid, overdue, cancelled |
| **order** | created, paid, cancelled, failed |
| **tenant** | created, updated, suspended, reactivated |
| **notification** | sent, delivered, failed |

**GIN Index Query:**
```sql
-- Find all webhooks subscribed to 'user.created'
SELECT * FROM webhooks 
WHERE is_active = TRUE 
  AND 'user.created' = ANY(subscribed_events);
```

**Performance:**
- GIN index: O(log n) lookup
- Without index: O(n) full table scan
- 100x speedup for event dispatch

---

### **III. TRẠNG THÁI VẬN HÀNH**

#### **6. `is_active` (BOOLEAN NOT NULL DEFAULT TRUE)**

- **Type:** BOOLEAN
- **Default:** TRUE
- **Purpose:** Enable/disable webhook without deleting
- **Index:** Partial index for active webhooks

**Use Cases:**
- Temporarily disable during maintenance
- Auto-disable after too many failures
- Testing/debugging

**Query Pattern:**
```sql
-- Get only active webhooks
SELECT * FROM webhooks WHERE is_active = TRUE;
```

#### **7. `failure_count` (INT NOT NULL DEFAULT 0)**

- **Type:** INTEGER
- **Default:** 0
- **Purpose:** Track consecutive webhook delivery failures
- **Range:** >= 0 (enforced by CHECK constraint)

**Failure Tracking Logic:**
```
1. Event Worker sends webhook
2. If HTTP status != 2xx:
   - INCREMENT failure_count
   - Log error
3. If HTTP status == 2xx:
   - RESET failure_count = 0
4. If failure_count > 10:
   - Consider auto-disabling (is_active = FALSE)
```

**Health Status:**
```typescript
if (failure_count === 0) {
  status = 'Healthy'; // ✅ Green
} else if (failure_count <= 5) {
  status = 'Warning'; // ⚠️ Yellow
} else {
  status = 'Unhealthy'; // ❌ Red
}
```

---

### **IV. AUDIT & VERSIONING**

#### **8. `created_at` (TIMESTAMPTZ NOT NULL DEFAULT NOW())**

- **Type:** TIMESTAMP WITH TIME ZONE
- **Default:** NOW()
- **Purpose:** Record creation timestamp
- **Timezone:** Always UTC
- **Format:** ISO 8601

**Example:**
```
2025-01-13T10:30:45.123456Z
```

#### **9. `updated_at` (TIMESTAMPTZ NOT NULL DEFAULT NOW())**

- **Type:** TIMESTAMP WITH TIME ZONE
- **Default:** NOW()
- **Purpose:** Last modification timestamp
- **Update Trigger:** Auto-update on every PATCH

**Auto-Update Trigger:**
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_webhooks_updated_at
BEFORE UPDATE ON webhooks
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

#### **10. `version` (BIGINT NOT NULL DEFAULT 1)**

- **Type:** BIGINT
- **Default:** 1
- **Purpose:** Optimistic locking for concurrent updates
- **Range:** >= 1

**Optimistic Locking Pattern:**
```sql
-- PATCH request includes current version
UPDATE webhooks 
SET 
  target_url = $1,
  version = version + 1,
  updated_at = NOW()
WHERE _id = $2 AND version = $3
RETURNING version, updated_at;

-- If 0 rows affected → version conflict
```

**Conflict Handling:**
```
Client A reads: version = 5
Client B reads: version = 5

Client A updates: SET version = 6 WHERE version = 5 ✅ Success
Client B updates: SET version = 6 WHERE version = 5 ❌ Conflict (version now 6)

Client B must reload and retry
```

---

## 🔍 **INDEXES STRATEGY**

### **1. Primary Key Index (Automatic)**

```sql
-- Automatically created with PRIMARY KEY
INDEX: webhooks_pkey ON webhooks(_id)
Type: B-tree
Usage: Unique lookup by ID
```

**Query:**
```sql
SELECT * FROM webhooks WHERE _id = '...';
```

**Performance:** O(log n) = ~10ms for 1M records

---

### **2. GIN Index on `subscribed_events` (CRITICAL)**

```sql
CREATE INDEX idx_webhooks_active_events 
ON webhooks USING GIN (subscribed_events) 
WHERE is_active = TRUE;
```

**Type:** GIN (Generalized Inverted Index)  
**Purpose:** Fast event dispatch lookup  
**Size:** ~100 bytes per webhook  
**Rebuild Time:** ~5 seconds for 100K webhooks

**Query Pattern:**
```sql
-- Event Worker: Find webhooks for 'user.created'
SELECT target_url, secret_key 
FROM webhooks 
WHERE is_active = TRUE 
  AND 'user.created' = ANY(subscribed_events);
```

**Performance:**
- With GIN: 2-5ms (O(log n))
- Without GIN: 500-1000ms (O(n) full scan)
- **100x speedup** ⚡

**Why GIN instead of B-tree?**
- B-tree: Can't index array elements efficiently
- GIN: Inverts array elements into searchable tokens
- Perfect for `= ANY()` queries

**Index Structure:**
```
Event Token → List of Webhook IDs
───────────────────────────────────
user.created  → [webhook1, webhook3, webhook5]
user.updated  → [webhook1, webhook2]
invoice.paid  → [webhook4, webhook5]
```

---

### **3. Tenant List Index**

```sql
CREATE INDEX idx_webhooks_tenant_list 
ON webhooks (tenant_id, created_at DESC);
```

**Type:** B-tree composite  
**Purpose:** List webhooks for tenant (newest first)  
**Columns:** (tenant_id ASC, created_at DESC)

**Query:**
```sql
SELECT * FROM webhooks 
WHERE tenant_id = ? 
ORDER BY created_at DESC 
LIMIT 20;
```

**Performance:** Index-only scan, no table access needed

---

## ✅ **CONSTRAINTS & VALIDATION**

### **Foreign Key Constraints**

#### **1. `fk_webhook_tenant`**

```sql
CONSTRAINT fk_webhook_tenant 
FOREIGN KEY (tenant_id) REFERENCES tenants(_id) 
ON DELETE CASCADE
```

**Behavior:**
- When tenant deleted → All webhooks auto-deleted
- Prevents orphaned webhooks
- Cascade = automatic cleanup

**Impact:**
```sql
DELETE FROM tenants WHERE _id = 'tenant-123';
-- Also deletes all webhooks with tenant_id = 'tenant-123'
```

---

### **Check Constraints**

#### **1. `chk_webhook_url_fmt`**

```sql
CONSTRAINT chk_webhook_url_fmt 
CHECK (target_url ~* '^https?://')
```

**Regex:** `^https?://` (case-insensitive)

**Valid:**
- ✅ `https://example.com`
- ✅ `http://localhost:3000`
- ✅ `HTTPS://API.COM` (case-insensitive)

**Invalid:**
- ❌ `ftp://example.com`
- ❌ `example.com`
- ❌ `//example.com`

#### **2. `chk_webhook_fail_count`**

```sql
CONSTRAINT chk_webhook_fail_count 
CHECK (failure_count >= 0)
```

**Purpose:** Prevent negative failure counts

#### **3. `chk_webhook_version`**

```sql
CONSTRAINT chk_webhook_version 
CHECK (version >= 1)
```

**Purpose:** Version must start at 1 (never 0 or negative)

---

## 📊 **STORAGE ESTIMATES**

### **Per-Row Storage Breakdown**

| Column | Type | Size | Notes |
|--------|------|------|-------|
| _id | UUID | 16 bytes | Fixed |
| tenant_id | UUID | 16 bytes | Fixed |
| target_url | TEXT | ~60 bytes | Avg 50 chars |
| secret_key | TEXT | ~75 bytes | 70 chars + overhead |
| subscribed_events | TEXT[] | ~40 bytes | Avg 3 events × 12 chars |
| is_active | BOOLEAN | 1 byte | Fixed |
| failure_count | INT | 4 bytes | Fixed |
| created_at | TIMESTAMPTZ | 8 bytes | Fixed |
| updated_at | TIMESTAMPTZ | 8 bytes | Fixed |
| version | BIGINT | 8 bytes | Fixed |
| **Row overhead** | - | ~24 bytes | PostgreSQL tuple header |
| **TOTAL** | - | **~260 bytes** | Per webhook |

### **Scaling Estimates**

| Records | Table Size | GIN Index | Total |
|---------|-----------|-----------|-------|
| 1,000 | 260 KB | 100 KB | 360 KB |
| 10,000 | 2.6 MB | 1 MB | 3.6 MB |
| 100,000 | 26 MB | 10 MB | 36 MB |
| 1,000,000 | 260 MB | 100 MB | 360 MB |

**Conclusion:** Very lightweight table, scales well to millions of webhooks

---

## 🚀 **MIGRATION SCRIPTS**

### **Initial Migration**

```sql
-- File: migrations/001_create_webhooks_table.sql

BEGIN;

CREATE TABLE webhooks (
    _id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    target_url TEXT NOT NULL,
    secret_key TEXT NOT NULL,
    subscribed_events TEXT[] NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    failure_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 1,
    
    CONSTRAINT fk_webhook_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(_id) ON DELETE CASCADE,
    CONSTRAINT chk_webhook_url_fmt CHECK (target_url ~* '^https?://'),
    CONSTRAINT chk_webhook_fail_count CHECK (failure_count >= 0),
    CONSTRAINT chk_webhook_version CHECK (version >= 1)
);

-- Create GIN index for event lookup
CREATE INDEX idx_webhooks_active_events 
ON webhooks USING GIN (subscribed_events) 
WHERE is_active = TRUE;

-- Create tenant list index
CREATE INDEX idx_webhooks_tenant_list 
ON webhooks (tenant_id, created_at DESC);

-- Create trigger for auto-updating updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_webhooks_updated_at
BEFORE UPDATE ON webhooks
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

COMMIT;
```

### **Rollback Migration**

```sql
-- File: migrations/001_create_webhooks_table_rollback.sql

BEGIN;

DROP TRIGGER IF EXISTS update_webhooks_updated_at ON webhooks;
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP INDEX IF EXISTS idx_webhooks_tenant_list;
DROP INDEX IF EXISTS idx_webhooks_active_events;
DROP TABLE IF EXISTS webhooks CASCADE;

COMMIT;
```

---

## 📚 **BEST PRACTICES**

### **✅ DO:**

1. **Use UUID v7 for `_id`**
   - Time-ordered for better B-tree performance
   - Generate from application layer

2. **Always include event in `subscribed_events`**
   - Use array notation: `ARRAY['event1', 'event2']`
   - Never empty array

3. **Validate URL format**
   - Check `^https?://` before INSERT
   - Prevent injection attacks

4. **Use optimistic locking**
   - Always send current `version` in PATCH
   - Handle conflict gracefully

5. **Monitor failure_count**
   - Alert when > 5
   - Auto-disable when > 10

### **❌ DON'T:**

1. **Don't store plaintext secrets in logs**
   - Mask secret_key in application logs
   - Never log in error messages

2. **Don't update without version check**
   - Always use optimistic locking
   - Prevents concurrent update conflicts

3. **Don't delete webhooks directly**
   - Hard delete is permanent
   - Consider adding `deleted_at` for soft delete

4. **Don't use sequential IDs**
   - UUIDs prevent enumeration attacks
   - Better for distributed systems

---

## 🔧 **MAINTENANCE**

### **Vacuum & Analyze**

```sql
-- Weekly maintenance
VACUUM ANALYZE webhooks;

-- Check bloat
SELECT 
  schemaname, tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size
FROM pg_tables
WHERE tablename = 'webhooks';
```

### **Reindex**

```sql
-- Monthly GIN index rebuild (if needed)
REINDEX INDEX CONCURRENTLY idx_webhooks_active_events;
```

---

**Last Updated:** 2025-01-13  
**Version:** 1.0.0  
**Schema Status:** ✅ Production Ready

