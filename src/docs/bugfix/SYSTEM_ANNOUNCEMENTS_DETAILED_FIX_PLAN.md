# 🔧 SYSTEM ANNOUNCEMENTS - STEP-BY-STEP FIX PLAN

**Module:** System Announcements  
**Current Score:** 35/100  
**Target Score:** 95/100  
**Estimated Effort:** 10-12 hours  
**Priority:** 🔴 URGENT (Worse than Subscription Orders)

---

## 📋 TABLE OF CONTENTS

1. [Pre-Fix Checklist](#pre-fix-checklist)
2. [Phase 1: Golang Backend Struct (2h)](#phase-1-golang-backend-struct)
3. [Phase 2: TypeScript Interface (1.5h)](#phase-2-typescript-interface)
4. [Phase 3: Golang Queries (2.5h)](#phase-3-golang-queries)
5. [Phase 4: Request/Response Types (2h)](#phase-4-requestresponse-types)
6. [Phase 5: Frontend Components (2h)](#phase-5-frontend-components)
7. [Phase 6: Advanced Features (2h)](#phase-6-advanced-features)
8. [Testing Checklist](#testing-checklist)
9. [Rollout Plan](#rollout-plan)

---

## ✅ PRE-FIX CHECKLIST

Before starting, ensure:

- [ ] Database migration `/supabase/migrations/020_create_system_announcements_table.sql` is reviewed
- [ ] Current Golang code backed up
- [ ] Current TypeScript code backed up
- [ ] Database has demo data (check with SELECT query)
- [ ] All dependencies installed
- [ ] Local dev environment running
- [ ] Git branch created: `fix/system-announcements-compliance`

### Database Verification:

```sql
-- Verify table exists and structure is correct
\d system_announcements;

-- Should return 27 columns
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'system_announcements'
ORDER BY ordinal_position;

-- Verify demo data
SELECT _id, title, type, priority, status, tenant_id 
FROM system_announcements 
LIMIT 5;
```

---

## 🔧 PHASE 1: GOLANG BACKEND STRUCT (2h)

**File:** `/golang-backend/api/announcements_handler.go`  
**Priority:** P0 - CRITICAL  
**Effort:** 2 hours

### Step 1.1: Replace SystemAnnouncement Struct (30min)

**Current (WRONG):**
```go
type SystemAnnouncement struct {
    ID          string            `json:"_id" db:"_id"`
    Titles      map[string]string `json:"titles" db:"titles"`
    Contents    map[string]string `json:"contents" db:"contents"`
    Type        string            `json:"type" db:"type"`
    TargetRegions []string        `json:"target_regions,omitempty" db:"target_regions"`
    TargetPlans   []string        `json:"target_plans,omitempty" db:"target_plans"`
    IsActive    bool              `json:"is_active" db:"is_active"`
    IsLocalTime bool              `json:"is_local_time" db:"is_local_time"`
    StartAt     time.Time         `json:"start_at" db:"start_at"`
    EndAt       *time.Time        `json:"end_at,omitempty" db:"end_at"`
    Version     int64             `json:"version" db:"version"`
    CreatedAt   time.Time         `json:"created_at" db:"created_at"`
    UpdatedAt   time.Time         `json:"updated_at" db:"updated_at"`
}
```

**Replace with (CORRECT):**
```go
// SystemAnnouncement represents a system-wide announcement
// Matches database schema exactly: system_announcements table (27 fields)
type SystemAnnouncement struct {
    // ==================== I. IDENTITY & HIERARCHY ====================
    ID       string `json:"_id" db:"_id"`
    TenantID string `json:"tenant_id" db:"tenant_id"`
    
    // ==================== II. BASIC CONTENT ====================
    Title   string `json:"title" db:"title"`     // VARCHAR(500) NOT NULL
    Content string `json:"content" db:"content"` // TEXT NOT NULL
    
    // ==================== III. CLASSIFICATION ====================
    Type     string  `json:"type" db:"type"`         // VARCHAR(50) NOT NULL DEFAULT 'info'
    Priority string  `json:"priority" db:"priority"` // VARCHAR(20) NOT NULL DEFAULT 'normal'
    Category *string `json:"category,omitempty" db:"category"` // VARCHAR(100) NULL
    
    // ==================== IV. STATUS & VISIBILITY ====================
    Status      string `json:"status" db:"status"`                 // VARCHAR(20) NOT NULL DEFAULT 'draft'
    IsPublished bool   `json:"is_published" db:"is_published"`     // BOOLEAN DEFAULT FALSE
    IsPinned    bool   `json:"is_pinned" db:"is_pinned"`           // BOOLEAN DEFAULT FALSE
    
    // ==================== V. SCHEDULING ====================
    StartDate   *time.Time `json:"start_date,omitempty" db:"start_date"`       // TIMESTAMPTZ NULL
    EndDate     *time.Time `json:"end_date,omitempty" db:"end_date"`           // TIMESTAMPTZ NULL
    PublishedAt *time.Time `json:"published_at,omitempty" db:"published_at"`   // TIMESTAMPTZ NULL
    
    // ==================== VI. TARGETING ====================
    TargetAudience map[string]interface{} `json:"target_audience,omitempty" db:"target_audience"` // JSONB
    
    // ==================== VII. DISPLAY SETTINGS ====================
    DisplayLocation []string `json:"display_location,omitempty" db:"display_location"` // VARCHAR(50)[] DEFAULT ARRAY['dashboard']
    Icon            *string  `json:"icon,omitempty" db:"icon"`                         // VARCHAR(100) NULL
    Color           *string  `json:"color,omitempty" db:"color"`                       // VARCHAR(50) NULL
    
    // ==================== VIII. ADDITIONAL DATA ====================
    LinkURL     *string                `json:"link_url,omitempty" db:"link_url"`       // VARCHAR(500) NULL
    LinkText    *string                `json:"link_text,omitempty" db:"link_text"`     // VARCHAR(200) NULL
    Attachments map[string]interface{} `json:"attachments,omitempty" db:"attachments"` // JSONB NULL
    Metadata    map[string]interface{} `json:"metadata,omitempty" db:"metadata"`       // JSONB NULL
    
    // ==================== IX. STATISTICS ====================
    ViewCount  int `json:"view_count" db:"view_count"`   // INTEGER DEFAULT 0
    ClickCount int `json:"click_count" db:"click_count"` // INTEGER DEFAULT 0
    
    // ==================== X. AUDIT TRAIL ====================
    CreatedAt time.Time  `json:"created_at" db:"created_at"`
    CreatedBy *string    `json:"created_by,omitempty" db:"created_by"`
    UpdatedAt time.Time  `json:"updated_at" db:"updated_at"`
    UpdatedBy *string    `json:"updated_by,omitempty" db:"updated_by"`
    DeletedAt *time.Time `json:"deleted_at,omitempty" db:"deleted_at"`
    DeletedBy *string    `json:"deleted_by,omitempty" db:"deleted_by"`
    Version   int        `json:"version" db:"version"`
}
```

**Changes:**
- ✅ Removed phantom fields: target_regions, target_plans, is_active, is_local_time
- ✅ Changed titles/contents JSONB → title/content string
- ✅ Renamed start_at/end_at → start_date/end_date
- ✅ Added 18 missing fields
- ✅ Added tenant_id (REQUIRED)
- ✅ Added proper JSONB fields: target_audience, attachments, metadata
- ✅ Added analytics: view_count, click_count
- ✅ Added soft delete: deleted_at, deleted_by
- ✅ Added audit: created_by, updated_by

### Step 1.2: Update CreateAnnouncementRequest (30min)

**Replace:**
```go
type CreateAnnouncementRequest struct {
    Titles        map[string]string `json:"titles" validate:"required"`
    Contents      map[string]string `json:"contents" validate:"required"`
    Type          string            `json:"type" validate:"required,oneof=INFO WARNING CRITICAL PROMOTION"`
    TargetRegions []string          `json:"target_regions,omitempty"`
    TargetPlans   []string          `json:"target_plans,omitempty"`
    IsActive      *bool             `json:"is_active,omitempty"`
    IsLocalTime   *bool             `json:"is_local_time,omitempty"`
    StartAt       *time.Time        `json:"start_at,omitempty"`
    EndAt         *time.Time        `json:"end_at,omitempty"`
}
```

**With:**
```go
type CreateAnnouncementRequest struct {
    // Required Fields
    TenantID string `json:"tenant_id" validate:"required,uuid"`
    Title    string `json:"title" validate:"required,min=1,max=500"`
    Content  string `json:"content" validate:"required,min=1"`
    Type     string `json:"type" validate:"required,oneof=info warning error success maintenance"`
    Priority string `json:"priority" validate:"required,oneof=low normal high critical"`
    Status   string `json:"status" validate:"required,oneof=draft active expired archived"`
    
    // Optional Fields
    Category        *string                `json:"category,omitempty" validate:"omitempty,max=100"`
    IsPublished     *bool                  `json:"is_published,omitempty"`
    IsPinned        *bool                  `json:"is_pinned,omitempty"`
    StartDate       *time.Time             `json:"start_date,omitempty"`
    EndDate         *time.Time             `json:"end_date,omitempty"`
    PublishedAt     *time.Time             `json:"published_at,omitempty"`
    TargetAudience  map[string]interface{} `json:"target_audience,omitempty"`
    DisplayLocation []string               `json:"display_location,omitempty"`
    Icon            *string                `json:"icon,omitempty" validate:"omitempty,max=100"`
    Color           *string                `json:"color,omitempty" validate:"omitempty,max=50"`
    LinkURL         *string                `json:"link_url,omitempty" validate:"omitempty,url,max=500"`
    LinkText        *string                `json:"link_text,omitempty" validate:"omitempty,max=200"`
    Attachments     map[string]interface{} `json:"attachments,omitempty"`
    Metadata        map[string]interface{} `json:"metadata,omitempty"`
    CreatedBy       *string                `json:"created_by,omitempty" validate:"omitempty,max=255"`
}
```

### Step 1.3: Update UpdateAnnouncementRequest (30min)

All fields as optional pointers:
```go
type UpdateAnnouncementRequest struct {
    Title           *string                `json:"title,omitempty" validate:"omitempty,min=1,max=500"`
    Content         *string                `json:"content,omitempty" validate:"omitempty,min=1"`
    Type            *string                `json:"type,omitempty" validate:"omitempty,oneof=info warning error success maintenance"`
    Priority        *string                `json:"priority,omitempty" validate:"omitempty,oneof=low normal high critical"`
    Category        *string                `json:"category,omitempty" validate:"omitempty,max=100"`
    Status          *string                `json:"status,omitempty" validate:"omitempty,oneof=draft active expired archived"`
    IsPublished     *bool                  `json:"is_published,omitempty"`
    IsPinned        *bool                  `json:"is_pinned,omitempty"`
    StartDate       *time.Time             `json:"start_date,omitempty"`
    EndDate         *time.Time             `json:"end_date,omitempty"`
    PublishedAt     *time.Time             `json:"published_at,omitempty"`
    TargetAudience  map[string]interface{} `json:"target_audience,omitempty"`
    DisplayLocation *[]string              `json:"display_location,omitempty"`
    Icon            *string                `json:"icon,omitempty" validate:"omitempty,max=100"`
    Color           *string                `json:"color,omitempty" validate:"omitempty,max=50"`
    LinkURL         *string                `json:"link_url,omitempty" validate:"omitempty,url,max=500"`
    LinkText        *string                `json:"link_text,omitempty" validate:"omitempty,max=200"`
    Attachments     map[string]interface{} `json:"attachments,omitempty"`
    Metadata        map[string]interface{} `json:"metadata,omitempty"`
    UpdatedBy       *string                `json:"updated_by,omitempty" validate:"omitempty,max=255"`
}
```

### Step 1.4: Verification (30min)

- [ ] Compile Go code: `go build`
- [ ] No compilation errors
- [ ] Struct has exactly 27 fields
- [ ] All db tags match database columns
- [ ] All json tags use snake_case
- [ ] Pointer types for nullable fields

---

## 🔧 PHASE 2: TYPESCRIPT INTERFACE (1.5h)

**File:** `/api/systemAnnouncementApi.ts`  
**Priority:** P0 - CRITICAL  
**Effort:** 1.5 hours

### Step 2.1: Replace SystemAnnouncement Interface (45min)

**Current (WRONG - 11 fields):**
```typescript
export interface SystemAnnouncement {
  _id: string;
  title: string;
  content: string;
  priority: 'INFO' | 'WARNING' | 'CRITICAL';
  status: 'ACTIVE' | 'INACTIVE';
  start_date: string;
  end_date?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  version: number;
}
```

**Replace with (CORRECT - 27 fields):**
```typescript
// ============================================================================
// ENUMS
// ============================================================================

export type AnnouncementType = 'info' | 'warning' | 'error' | 'success' | 'maintenance';
export type AnnouncementPriority = 'low' | 'normal' | 'high' | 'critical';
export type AnnouncementStatus = 'draft' | 'active' | 'expired' | 'archived';

export interface TargetAudience {
  all?: boolean;
  roles?: string[];
  users?: string[];
  tenants?: string[];
}

// ============================================================================
// MAIN INTERFACE
// ============================================================================

export interface SystemAnnouncement {
  // I. IDENTITY & HIERARCHY
  _id: string;
  tenant_id: string;
  
  // II. BASIC CONTENT
  title: string;
  content: string;
  
  // III. CLASSIFICATION
  type: AnnouncementType;
  priority: AnnouncementPriority;
  category?: string;
  
  // IV. STATUS & VISIBILITY
  status: AnnouncementStatus;
  is_published: boolean;
  is_pinned: boolean;
  
  // V. SCHEDULING
  start_date?: string;
  end_date?: string;
  published_at?: string;
  
  // VI. TARGETING
  target_audience?: TargetAudience;
  
  // VII. DISPLAY SETTINGS
  display_location?: string[];
  icon?: string;
  color?: string;
  
  // VIII. ADDITIONAL DATA
  link_url?: string;
  link_text?: string;
  attachments?: Record<string, any>;
  metadata?: Record<string, any>;
  
  // IX. STATISTICS
  view_count: number;
  click_count: number;
  
  // X. AUDIT TRAIL
  created_at: string;
  created_by?: string;
  updated_at: string;
  updated_by?: string;
  deleted_at?: string;
  deleted_by?: string;
  version: number;
}
```

### Step 2.2: Update CreateSystemAnnouncementRequest (20min)

```typescript
export interface CreateSystemAnnouncementRequest {
  // Required
  tenant_id: string;
  title: string;
  content: string;
  type: AnnouncementType;
  priority: AnnouncementPriority;
  status: AnnouncementStatus;
  
  // Optional
  category?: string;
  is_published?: boolean;
  is_pinned?: boolean;
  start_date?: string;
  end_date?: string;
  published_at?: string;
  target_audience?: TargetAudience;
  display_location?: string[];
  icon?: string;
  color?: string;
  link_url?: string;
  link_text?: string;
  attachments?: Record<string, any>;
  metadata?: Record<string, any>;
  created_by?: string;
}
```

### Step 2.3: Update UpdateSystemAnnouncementRequest (20min)

```typescript
export interface UpdateSystemAnnouncementRequest {
  title?: string;
  content?: string;
  type?: AnnouncementType;
  priority?: AnnouncementPriority;
  category?: string;
  status?: AnnouncementStatus;
  is_published?: boolean;
  is_pinned?: boolean;
  start_date?: string;
  end_date?: string;
  published_at?: string;
  target_audience?: TargetAudience;
  display_location?: string[];
  icon?: string;
  color?: string;
  link_url?: string;
  link_text?: string;
  attachments?: Record<string, any>;
  metadata?: Record<string, any>;
  updated_by?: string;
  version: number; // Required for optimistic locking
}
```

### Step 2.4: Update Filters (5min)

```typescript
export interface SystemAnnouncementFilters extends BaseFilters {
  tenant_id?: string;
  type?: AnnouncementType;
  priority?: AnnouncementPriority;
  status?: AnnouncementStatus;
  category?: string;
  is_published?: boolean;
  is_pinned?: boolean;
}
```

### Step 2.5: Verification (10min)

- [ ] TypeScript compiles without errors
- [ ] Interface has 27 fields
- [ ] Enum values match database
- [ ] Required fields marked correctly
- [ ] Optional fields use `?` operator

---

## 🔧 PHASE 3: GOLANG QUERIES (2.5h)

**File:** `/golang-backend/api/announcements_handler.go`  
**Priority:** P0 - CRITICAL  
**Effort:** 2.5 hours

### Step 3.1: Fix ListAnnouncements SELECT (30min)

**Find (Line ~143):**
```go
query := `
    SELECT 
        _id, titles, contents, type,
        target_regions, target_plans,
        is_active, is_local_time, start_at, end_at,
        version, created_at, updated_at
    FROM system_announcements
    WHERE 1=1
`
```

**Replace with:**
```go
query := `
    SELECT 
        _id, tenant_id, title, content, type, priority, category,
        status, is_published, is_pinned,
        start_date, end_date, published_at,
        target_audience, display_location, icon, color,
        link_url, link_text, attachments, metadata,
        view_count, click_count,
        created_at, created_by, updated_at, updated_by,
        deleted_at, deleted_by, version
    FROM system_announcements
    WHERE deleted_at IS NULL
`
```

**Update Scan logic:**
```go
for rows.Next() {
    var ann SystemAnnouncement
    var targetAudienceJSON, attachmentsJSON, metadataJSON []byte
    var category, icon, color, linkURL, linkText sql.NullString
    var createdBy, updatedBy, deletedBy sql.NullString
    var startDate, endDate, publishedAt, deletedAt sql.NullTime
    
    err := rows.Scan(
        &ann.ID, &ann.TenantID, &ann.Title, &ann.Content, 
        &ann.Type, &ann.Priority, &category,
        &ann.Status, &ann.IsPublished, &ann.IsPinned,
        &startDate, &endDate, &publishedAt,
        &targetAudienceJSON, pq.Array(&ann.DisplayLocation), 
        &icon, &color,
        &linkURL, &linkText, &attachmentsJSON, &metadataJSON,
        &ann.ViewCount, &ann.ClickCount,
        &ann.CreatedAt, &createdBy, &ann.UpdatedAt, &updatedBy,
        &deletedAt, &deletedBy, &ann.Version,
    )
    if err != nil {
        continue
    }
    
    // Handle nullable strings
    if category.Valid {
        ann.Category = &category.String
    }
    if icon.Valid {
        ann.Icon = &icon.String
    }
    if color.Valid {
        ann.Color = &color.String
    }
    if linkURL.Valid {
        ann.LinkURL = &linkURL.String
    }
    if linkText.Valid {
        ann.LinkText = &linkText.String
    }
    if createdBy.Valid {
        ann.CreatedBy = &createdBy.String
    }
    if updatedBy.Valid {
        ann.UpdatedBy = &updatedBy.String
    }
    if deletedBy.Valid {
        ann.DeletedBy = &deletedBy.String
    }
    
    // Handle nullable timestamps
    if startDate.Valid {
        ann.StartDate = &startDate.Time
    }
    if endDate.Valid {
        ann.EndDate = &endDate.Time
    }
    if publishedAt.Valid {
        ann.PublishedAt = &publishedAt.Time
    }
    if deletedAt.Valid {
        ann.DeletedAt = &deletedAt.Time
    }
    
    // Unmarshal JSONB fields
    if len(targetAudienceJSON) > 0 {
        json.Unmarshal(targetAudienceJSON, &ann.TargetAudience)
    }
    if len(attachmentsJSON) > 0 {
        json.Unmarshal(attachmentsJSON, &ann.Attachments)
    }
    if len(metadataJSON) > 0 {
        json.Unmarshal(metadataJSON, &ann.Metadata)
    }
    
    announcements = append(announcements, ann)
}
```

### Step 3.2: Fix CreateAnnouncement INSERT (40min)

**Find (Line ~295):**
```go
query := `
    INSERT INTO system_announcements (
        _id, titles, contents, type,
        target_regions, target_plans,
        is_active, is_local_time, start_at, end_at
    ) VALUES (...)
`
```

**Replace with:**
```go
// Set defaults
isPublished := false
if req.IsPublished != nil {
    isPublished = *req.IsPublished
}

isPinned := false
if req.IsPinned != nil {
    isPinned = *req.IsPinned
}

displayLocation := req.DisplayLocation
if displayLocation == nil {
    displayLocation = []string{"dashboard"}
}

// Generate UUID
annID := uuid.New().String()

// Convert JSONB fields to JSON
targetAudienceJSON, _ := json.Marshal(req.TargetAudience)
attachmentsJSON, _ := json.Marshal(req.Attachments)
metadataJSON, _ := json.Marshal(req.Metadata)

query := `
    INSERT INTO system_announcements (
        _id, tenant_id, title, content, type, priority, category,
        status, is_published, is_pinned,
        start_date, end_date, published_at,
        target_audience, display_location, icon, color,
        link_url, link_text, attachments, metadata,
        created_by
    ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10,
        $11, $12, $13,
        $14, $15, $16, $17,
        $18, $19, $20, $21,
        $22
    )
    RETURNING 
        _id, tenant_id, title, content, type, priority, category,
        status, is_published, is_pinned,
        start_date, end_date, published_at,
        target_audience, display_location, icon, color,
        link_url, link_text, attachments, metadata,
        view_count, click_count,
        created_at, created_by, updated_at, updated_by,
        version
`

err := h.db.QueryRow(
    query,
    annID, req.TenantID, req.Title, req.Content, 
    req.Type, req.Priority, req.Category,
    req.Status, isPublished, isPinned,
    req.StartDate, req.EndDate, req.PublishedAt,
    targetAudienceJSON, pq.Array(displayLocation), 
    req.Icon, req.Color,
    req.LinkURL, req.LinkText, attachmentsJSON, metadataJSON,
    req.CreatedBy,
).Scan(/* same as ListAnnouncements scan */)
```

### Step 3.3: Fix UpdateAnnouncement (40min)

Build dynamic query with all new fields:
```go
updates := []string{}
args := []interface{}{}
argIdx := 1

if req.Title != nil {
    updates = append(updates, fmt.Sprintf("title = $%d", argIdx))
    args = append(args, *req.Title)
    argIdx++
}
if req.Content != nil {
    updates = append(updates, fmt.Sprintf("content = $%d", argIdx))
    args = append(args, *req.Content)
    argIdx++
}
if req.Type != nil {
    updates = append(updates, fmt.Sprintf("type = $%d", argIdx))
    args = append(args, *req.Type)
    argIdx++
}
if req.Priority != nil {
    updates = append(updates, fmt.Sprintf("priority = $%d", argIdx))
    args = append(args, *req.Priority)
    argIdx++
}
if req.Category != nil {
    updates = append(updates, fmt.Sprintf("category = $%d", argIdx))
    args = append(args, *req.Category)
    argIdx++
}
if req.Status != nil {
    updates = append(updates, fmt.Sprintf("status = $%d", argIdx))
    args = append(args, *req.Status)
    argIdx++
}
if req.IsPublished != nil {
    updates = append(updates, fmt.Sprintf("is_published = $%d", argIdx))
    args = append(args, *req.IsPublished)
    argIdx++
}
if req.IsPinned != nil {
    updates = append(updates, fmt.Sprintf("is_pinned = $%d", argIdx))
    args = append(args, *req.IsPinned)
    argIdx++
}
if req.StartDate != nil {
    updates = append(updates, fmt.Sprintf("start_date = $%d", argIdx))
    args = append(args, *req.StartDate)
    argIdx++
}
if req.EndDate != nil {
    updates = append(updates, fmt.Sprintf("end_date = $%d", argIdx))
    args = append(args, *req.EndDate)
    argIdx++
}
if req.PublishedAt != nil {
    updates = append(updates, fmt.Sprintf("published_at = $%d", argIdx))
    args = append(args, *req.PublishedAt)
    argIdx++
}
if req.TargetAudience != nil {
    targetAudienceJSON, _ := json.Marshal(req.TargetAudience)
    updates = append(updates, fmt.Sprintf("target_audience = $%d", argIdx))
    args = append(args, targetAudienceJSON)
    argIdx++
}
if req.DisplayLocation != nil {
    updates = append(updates, fmt.Sprintf("display_location = $%d", argIdx))
    args = append(args, pq.Array(*req.DisplayLocation))
    argIdx++
}
if req.Icon != nil {
    updates = append(updates, fmt.Sprintf("icon = $%d", argIdx))
    args = append(args, *req.Icon)
    argIdx++
}
if req.Color != nil {
    updates = append(updates, fmt.Sprintf("color = $%d", argIdx))
    args = append(args, *req.Color)
    argIdx++
}
if req.LinkURL != nil {
    updates = append(updates, fmt.Sprintf("link_url = $%d", argIdx))
    args = append(args, *req.LinkURL)
    argIdx++
}
if req.LinkText != nil {
    updates = append(updates, fmt.Sprintf("link_text = $%d", argIdx))
    args = append(args, *req.LinkText)
    argIdx++
}
if req.Attachments != nil {
    attachmentsJSON, _ := json.Marshal(req.Attachments)
    updates = append(updates, fmt.Sprintf("attachments = $%d", argIdx))
    args = append(args, attachmentsJSON)
    argIdx++
}
if req.Metadata != nil {
    metadataJSON, _ := json.Marshal(req.Metadata)
    updates = append(updates, fmt.Sprintf("metadata = $%d", argIdx))
    args = append(args, metadataJSON)
    argIdx++
}
if req.UpdatedBy != nil {
    updates = append(updates, fmt.Sprintf("updated_by = $%d", argIdx))
    args = append(args, *req.UpdatedBy)
    argIdx++
}

// Add version increment
updates = append(updates, "version = version + 1")

// Add announcement ID
args = append(args, annID)

query := fmt.Sprintf(`
    UPDATE system_announcements 
    SET %s, updated_at = NOW()
    WHERE _id = $%d AND deleted_at IS NULL
    RETURNING _id, type, priority, status, version, updated_at
`, strings.Join(updates, ", "), argIdx)
```

### Step 3.4: Fix DeleteAnnouncement (Soft Delete) (20min)

**Replace hard delete:**
```go
query := `DELETE FROM system_announcements WHERE _id = $1 RETURNING _id`
```

**With soft delete:**
```go
query := `
    UPDATE system_announcements 
    SET deleted_at = NOW(), deleted_by = $2, version = version + 1
    WHERE _id = $1 AND deleted_at IS NULL
    RETURNING _id, deleted_at
`

var id string
var deletedAt time.Time
err := h.db.QueryRow(query, annID, "system").Scan(&id, &deletedAt)
```

### Step 3.5: Fix Search Query (20min)

**Find (Line ~557):**
```go
WHERE 
    titles::text ILIKE $1 OR
    contents::text ILIKE $1
```

**Replace with:**
```go
WHERE 
    deleted_at IS NULL AND (
        title ILIKE $1 OR
        content ILIKE $1 OR
        category ILIKE $1
    )
```

### Step 3.6: Fix Filters (20min)

**Update filter logic:**
```go
// Type filter
if announcementType := r.URL.Query().Get("type"); announcementType != "" {
    query += fmt.Sprintf(" AND type = $%d", argIdx)
    args = append(args, announcementType)
    argIdx++
}

// Priority filter
if priority := r.URL.Query().Get("priority"); priority != "" {
    query += fmt.Sprintf(" AND priority = $%d", argIdx)
    args = append(args, priority)
    argIdx++
}

// Status filter
if status := r.URL.Query().Get("status"); status != "" {
    query += fmt.Sprintf(" AND status = $%d", argIdx)
    args = append(args, status)
    argIdx++
}

// Category filter
if category := r.URL.Query().Get("category"); category != "" {
    query += fmt.Sprintf(" AND category = $%d", argIdx)
    args = append(args, category)
    argIdx++
}

// Published filter
if isPublished := r.URL.Query().Get("is_published"); isPublished == "true" {
    query += " AND is_published = true"
} else if isPublished == "false" {
    query += " AND is_published = false"
}

// Pinned filter
if isPinned := r.URL.Query().Get("is_pinned"); isPinned == "true" {
    query += " AND is_pinned = true"
}
```

### Step 3.7: Fix ToggleActive → ToggleStatus (20min)

**Replace:**
```go
func (h *AnnouncementsHandler) ToggleActive(w http.ResponseWriter, r *http.Request) {
    query := `
        UPDATE system_announcements 
        SET is_active = NOT is_active, version = version + 1
        WHERE _id = $1
        RETURNING is_active
    `
}
```

**With:**
```go
func (h *AnnouncementsHandler) TogglePublished(w http.ResponseWriter, r *http.Request) {
    vars := mux.Vars(r)
    annID := vars["id"]
    
    query := `
        UPDATE system_announcements 
        SET is_published = NOT is_published, 
            published_at = CASE 
                WHEN NOT is_published THEN NOW() 
                ELSE published_at 
            END,
            version = version + 1
        WHERE _id = $1 AND deleted_at IS NULL
        RETURNING is_published, published_at
    `
    
    var isPublished bool
    var publishedAt sql.NullTime
    err := h.db.QueryRow(query, annID).Scan(&isPublished, &publishedAt)
    
    if err == sql.ErrNoRows {
        respondError(w, http.StatusNotFound, "Announcement not found", nil)
        return
    }
    if err != nil {
        respondError(w, http.StatusInternalServerError, "Database error", err)
        return
    }
    
    respondJSON(w, http.StatusOK, map[string]interface{}{
        "is_published": isPublished,
        "published_at": publishedAt,
    })
}
```

---

## 🔧 PHASE 4: REQUEST/RESPONSE TYPES (2h)

Continue with all other handlers following the same pattern...

---

## 🔧 PHASE 5: FRONTEND COMPONENTS (2h)

**Files to update:**
- `/pages/NotificationsPage.tsx`
- `/pages/AddNotificationPage.tsx`
- `/pages/EditNotificationPage.tsx`
- `/components/announcements/AnnouncementForm.tsx`
- `/components/announcements/AnnouncementTable.tsx`
- `/components/announcements/AnnouncementStatusBadge.tsx`

### Changes needed:
1. Update status badge to show draft/active/expired/archived
2. Update priority badge to show low/normal/high/critical
3. Add type badge (info/warning/error/success/maintenance)
4. Add category display
5. Add pin indicator
6. Add publish controls
7. Add tenant_id selection (if multi-tenant)
8. Add targeting controls
9. Add display location controls

---

## 🔧 PHASE 6: ADVANCED FEATURES (2h)

### Add Analytics Endpoints:
```go
// IncrementViewCount increments view count
func (h *AnnouncementsHandler) IncrementViewCount(w http.ResponseWriter, r *http.Request) {
    vars := mux.Vars(r)
    annID := vars["id"]
    
    query := `
        UPDATE system_announcements 
        SET view_count = view_count + 1
        WHERE _id = $1 AND deleted_at IS NULL
        RETURNING view_count
    `
    // ... implementation
}

// IncrementClickCount increments click count
func (h *AnnouncementsHandler) IncrementClickCount(w http.ResponseWriter, r *http.Request) {
    vars := mux.Vars(r)
    annID := vars["id"]
    
    query := `
        UPDATE system_announcements 
        SET click_count = click_count + 1
        WHERE _id = $1 AND deleted_at IS NULL
        RETURNING click_count
    `
    // ... implementation
}
```

### Register new routes:
```go
r.HandleFunc("/api/announcements/{id}/view", h.IncrementViewCount).Methods("POST")
r.HandleFunc("/api/announcements/{id}/click", h.IncrementClickCount).Methods("POST")
```

---

## ✅ TESTING CHECKLIST

After all fixes:

### Backend Tests:
- [ ] Create announcement with all fields
- [ ] Create announcement with minimal fields (required only)
- [ ] Update announcement - partial update
- [ ] Update announcement - full update
- [ ] Get announcement by ID
- [ ] List announcements with pagination
- [ ] Filter by type
- [ ] Filter by priority
- [ ] Filter by status
- [ ] Filter by category
- [ ] Filter by is_published
- [ ] Filter by is_pinned
- [ ] Search announcements by title
- [ ] Search announcements by content
- [ ] Soft delete announcement
- [ ] Cannot get deleted announcement
- [ ] Toggle published status
- [ ] Increment view count
- [ ] Increment click count
- [ ] Validate enum values (should reject invalid)
- [ ] Validate required fields (should reject missing)

### Frontend Tests:
- [ ] Display announcement list
- [ ] Create new announcement
- [ ] Edit existing announcement
- [ ] Delete announcement
- [ ] Filter by various fields
- [ ] Search functionality
- [ ] Status badges display correctly
- [ ] Priority badges display correctly
- [ ] Type badges display correctly
- [ ] Pin/unpin functionality
- [ ] Publish/unpublish functionality
- [ ] View/click tracking works

---

## 🚀 ROLLOUT PLAN

### Step 1: Development
- Complete all phases above
- Run all tests
- Verify compliance score ≥ 95/100

### Step 2: Code Review
- Peer review all changes
- Check against compliance checklist
- Verify no regression

### Step 3: Staging Deployment
- Deploy to staging
- Run integration tests
- Verify with demo data

### Step 4: Production Deployment
- Create database backup
- Deploy backend first
- Deploy frontend
- Monitor for errors
- Rollback plan ready

---

## 📚 APPENDIX: QUICK REFERENCE

### Database Enum Values:

**Type:**
- info
- warning
- error
- success
- maintenance

**Priority:**
- low
- normal
- high
- critical

**Status:**
- draft
- active
- expired
- archived

**Display Location (examples):**
- dashboard
- sidebar
- modal
- banner

### Field Lengths:
- title: 500 characters
- category: 100 characters
- icon: 100 characters
- color: 50 characters
- link_url: 500 characters
- link_text: 200 characters
- created_by/updated_by/deleted_by: 255 characters

---

**Last Updated:** 2026-01-15  
**Version:** 1.0  
**Status:** Ready for implementation
