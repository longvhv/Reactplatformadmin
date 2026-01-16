package api

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"github.com/lib/pq"
)

// ============================================================================
// MODELS - System Announcements
// ============================================================================

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

// CreateAnnouncementRequest represents request body for creating announcement
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

// UpdateAnnouncementRequest represents request body for updating announcement
type UpdateAnnouncementRequest struct {
	Title           *string                 `json:"title,omitempty" validate:"omitempty,min=1,max=500"`
	Content         *string                 `json:"content,omitempty" validate:"omitempty,min=1"`
	Type            *string                 `json:"type,omitempty" validate:"omitempty,oneof=info warning error success maintenance"`
	Priority        *string                 `json:"priority,omitempty" validate:"omitempty,oneof=low normal high critical"`
	Category        *string                 `json:"category,omitempty" validate:"omitempty,max=100"`
	Status          *string                 `json:"status,omitempty" validate:"omitempty,oneof=draft active expired archived"`
	IsPublished     *bool                   `json:"is_published,omitempty"`
	IsPinned        *bool                   `json:"is_pinned,omitempty"`
	StartDate       *time.Time              `json:"start_date,omitempty"`
	EndDate         *time.Time              `json:"end_date,omitempty"`
	PublishedAt     *time.Time              `json:"published_at,omitempty"`
	TargetAudience  *map[string]interface{} `json:"target_audience,omitempty"`
	DisplayLocation *[]string               `json:"display_location,omitempty"`
	Icon            *string                 `json:"icon,omitempty" validate:"omitempty,max=100"`
	Color           *string                 `json:"color,omitempty" validate:"omitempty,max=50"`
	LinkURL         *string                 `json:"link_url,omitempty" validate:"omitempty,url,max=500"`
	LinkText        *string                 `json:"link_text,omitempty" validate:"omitempty,max=200"`
	Attachments     *map[string]interface{} `json:"attachments,omitempty"`
	Metadata        *map[string]interface{} `json:"metadata,omitempty"`
	UpdatedBy       *string                 `json:"updated_by,omitempty" validate:"omitempty,max=255"`
}

// AnnouncementsHandler handles announcement-related HTTP requests
type AnnouncementsHandler struct {
	db *sql.DB
}

// NewAnnouncementsHandler creates a new announcements handler
func NewAnnouncementsHandler(db *sql.DB) *AnnouncementsHandler {
	return &AnnouncementsHandler{db: db}
}

// ============================================================================
// ROUTE REGISTRATION
// ============================================================================

// RegisterRoutes registers announcement API routes
func (h *AnnouncementsHandler) RegisterRoutes(r *mux.Router) {
	// System Announcements
	r.HandleFunc("/api/announcements", h.ListAnnouncements).Methods("GET")
	r.HandleFunc("/api/announcements/{id}", h.GetAnnouncement).Methods("GET")
	r.HandleFunc("/api/announcements", h.CreateAnnouncement).Methods("POST")
	r.HandleFunc("/api/announcements/{id}", h.UpdateAnnouncement).Methods("PUT", "PATCH")
	r.HandleFunc("/api/announcements/{id}", h.DeleteAnnouncement).Methods("DELETE")

	// Special operations
	r.HandleFunc("/api/announcements/active", h.GetActiveAnnouncements).Methods("GET")
	r.HandleFunc("/api/announcements/{id}/toggle", h.ToggleStatus).Methods("PATCH")
	r.HandleFunc("/api/announcements/search", h.SearchAnnouncements).Methods("GET")
	r.HandleFunc("/api/announcements/stats", h.GetStats).Methods("GET")
}

// ============================================================================
// HANDLERS - SYSTEM ANNOUNCEMENTS
// ============================================================================

// ListAnnouncements returns all announcements with pagination and filtering
func (h *AnnouncementsHandler) ListAnnouncements(w http.ResponseWriter, r *http.Request) {
	// Query parameters
	announcementType := r.URL.Query().Get("type")
	priority := r.URL.Query().Get("priority")
	status := r.URL.Query().Get("status")
	page := getIntQueryParam(r, "page", 1)
	limit := getIntQueryParam(r, "limit", 20)
	if limit > 100 {
		limit = 100
	}
	offset := (page - 1) * limit

	// Build query
	query := `
		SELECT 
			_id, tenant_id, title, content, type, priority, category,
			status, is_published, is_pinned, start_date, end_date, published_at,
			target_audience, display_location, icon, color,
			link_url, link_text, attachments, metadata,
			view_count, click_count,
			created_at, created_by, updated_at, updated_by, deleted_at, deleted_by, version
		FROM system_announcements
		WHERE deleted_at IS NULL
	`
	args := []interface{}{}
	argIdx := 1

	if announcementType != "" {
		query += fmt.Sprintf(" AND type = $%d", argIdx)
		args = append(args, announcementType)
		argIdx++
	}
	
	if priority != "" {
		query += fmt.Sprintf(" AND priority = $%d", argIdx)
		args = append(args, priority)
		argIdx++
	}
	
	if status != "" {
		query += fmt.Sprintf(" AND status = $%d", argIdx)
		args = append(args, status)
		argIdx++
	}

	query += " ORDER BY created_at DESC"
	query += fmt.Sprintf(" LIMIT $%d OFFSET $%d", argIdx, argIdx+1)
	args = append(args, limit, offset)

	// Execute query
	rows, err := h.db.Query(query, args...)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Database error", err)
		return
	}
	defer rows.Close()

	announcements := []SystemAnnouncement{}
	for rows.Next() {
		ann, err := scanAnnouncement(rows)
		if err != nil {
			continue
		}
		announcements = append(announcements, ann)
	}

	// Count total
	countQuery := "SELECT COUNT(*) FROM system_announcements WHERE deleted_at IS NULL"
	countArgs := []interface{}{}
	countIdx := 1
	
	if announcementType != "" {
		countQuery += fmt.Sprintf(" AND type = $%d", countIdx)
		countArgs = append(countArgs, announcementType)
		countIdx++
	}
	if priority != "" {
		countQuery += fmt.Sprintf(" AND priority = $%d", countIdx)
		countArgs = append(countArgs, priority)
		countIdx++
	}
	if status != "" {
		countQuery += fmt.Sprintf(" AND status = $%d", countIdx)
		countArgs = append(countArgs, status)
		countIdx++
	}
	
	var total int
	h.db.QueryRow(countQuery, countArgs...).Scan(&total)

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"data": announcements,
		"meta": map[string]interface{}{
			"page":  page,
			"limit": limit,
			"total": total,
		},
	})
}

// GetAnnouncement returns a specific announcement by ID
func (h *AnnouncementsHandler) GetAnnouncement(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	annID := vars["id"]

	// Validate UUID
	if _, err := uuid.Parse(annID); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid announcement ID", err)
		return
	}

	query := `
		SELECT 
			_id, tenant_id, title, content, type, priority, category,
			status, is_published, is_pinned, start_date, end_date, published_at,
			target_audience, display_location, icon, color,
			link_url, link_text, attachments, metadata,
			view_count, click_count,
			created_at, created_by, updated_at, updated_by, deleted_at, deleted_by, version
		FROM system_announcements
		WHERE _id = $1 AND deleted_at IS NULL
	`

	row := h.db.QueryRow(query, annID)
	ann, err := scanAnnouncementRow(row)

	if err == sql.ErrNoRows {
		respondError(w, http.StatusNotFound, "Announcement not found", nil)
		return
	}
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Database error", err)
		return
	}

	respondJSON(w, http.StatusOK, ann)
}

// CreateAnnouncement creates a new announcement
func (h *AnnouncementsHandler) CreateAnnouncement(w http.ResponseWriter, r *http.Request) {
	var req CreateAnnouncementRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid JSON", err)
		return
	}

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

	// Insert
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
			created_at, created_by, updated_at, updated_by, version
	`

	row := h.db.QueryRow(
		query,
		annID, req.TenantID, req.Title, req.Content, 
		req.Type, req.Priority, req.Category,
		req.Status, isPublished, isPinned,
		req.StartDate, req.EndDate, req.PublishedAt,
		targetAudienceJSON, pq.Array(displayLocation), 
		req.Icon, req.Color,
		req.LinkURL, req.LinkText, attachmentsJSON, metadataJSON,
		req.CreatedBy,
	)

	ann, err := scanAnnouncementRow(row)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Database error", err)
		return
	}

	respondJSON(w, http.StatusCreated, ann)
}

// UpdateAnnouncement updates announcement information
func (h *AnnouncementsHandler) UpdateAnnouncement(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	annID := vars["id"]

	// Validate UUID
	if _, err := uuid.Parse(annID); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid announcement ID", err)
		return
	}

	var req UpdateAnnouncementRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid JSON", err)
		return
	}

	// Build dynamic UPDATE query
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
		targetAudienceJSON, _ := json.Marshal(*req.TargetAudience)
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
		attachmentsJSON, _ := json.Marshal(*req.Attachments)
		updates = append(updates, fmt.Sprintf("attachments = $%d", argIdx))
		args = append(args, attachmentsJSON)
		argIdx++
	}
	if req.Metadata != nil {
		metadataJSON, _ := json.Marshal(*req.Metadata)
		updates = append(updates, fmt.Sprintf("metadata = $%d", argIdx))
		args = append(args, metadataJSON)
		argIdx++
	}
	if req.UpdatedBy != nil {
		updates = append(updates, fmt.Sprintf("updated_by = $%d", argIdx))
		args = append(args, *req.UpdatedBy)
		argIdx++
	}

	if len(updates) == 0 {
		respondError(w, http.StatusBadRequest, "No fields to update", nil)
		return
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

	var ann struct {
		ID       string    `json:"_id"`
		Type     string    `json:"type"`
		Priority string    `json:"priority"`
		Status   string    `json:"status"`
		Version  int       `json:"version"`
		UpdatedAt time.Time `json:"updated_at"`
	}

	err := h.db.QueryRow(query, args...).Scan(
		&ann.ID, &ann.Type, &ann.Priority, &ann.Status, &ann.Version, &ann.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		respondError(w, http.StatusNotFound, "Announcement not found", nil)
		return
	}
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Database error", err)
		return
	}

	respondJSON(w, http.StatusOK, ann)
}

// DeleteAnnouncement soft deletes an announcement
func (h *AnnouncementsHandler) DeleteAnnouncement(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	annID := vars["id"]

	// Validate UUID
	if _, err := uuid.Parse(annID); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid announcement ID", err)
		return
	}

	// Soft delete
	query := `
		UPDATE system_announcements 
		SET deleted_at = NOW(), deleted_by = $2, version = version + 1
		WHERE _id = $1 AND deleted_at IS NULL
		RETURNING _id, deleted_at
	`

	var id string
	var deletedAt time.Time
	err := h.db.QueryRow(query, annID, "system").Scan(&id, &deletedAt)

	if err == sql.ErrNoRows {
		respondError(w, http.StatusNotFound, "Announcement not found", nil)
		return
	}
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Database error", err)
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"message":    "Announcement deleted successfully",
		"id":         id,
		"deleted_at": deletedAt,
	})
}

// GetActiveAnnouncements returns active announcements
func (h *AnnouncementsHandler) GetActiveAnnouncements(w http.ResponseWriter, r *http.Request) {
	query := `
		SELECT 
			_id, tenant_id, title, content, type, priority, category,
			status, is_published, is_pinned, start_date, end_date, published_at,
			target_audience, display_location, icon, color,
			link_url, link_text, attachments, metadata,
			view_count, click_count,
			created_at, created_by, updated_at, updated_by, deleted_at, deleted_by, version
		FROM system_announcements
		WHERE status = 'active' 
			AND deleted_at IS NULL
			AND (start_date IS NULL OR start_date <= NOW())
			AND (end_date IS NULL OR end_date > NOW())
		ORDER BY created_at DESC
	`

	rows, err := h.db.Query(query)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Database error", err)
		return
	}
	defer rows.Close()

	announcements := []SystemAnnouncement{}
	for rows.Next() {
		ann, err := scanAnnouncement(rows)
		if err != nil {
			continue
		}
		announcements = append(announcements, ann)
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"data": announcements,
	})
}

// ToggleStatus toggles announcement status between active and draft
func (h *AnnouncementsHandler) ToggleStatus(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	annID := vars["id"]

	query := `
		UPDATE system_announcements 
		SET status = CASE 
			WHEN status = 'active' THEN 'draft' 
			ELSE 'active' 
		END,
		version = version + 1,
		updated_at = NOW()
		WHERE _id = $1 AND deleted_at IS NULL
		RETURNING status
	`

	var status string
	err := h.db.QueryRow(query, annID).Scan(&status)

	if err == sql.ErrNoRows {
		respondError(w, http.StatusNotFound, "Announcement not found", nil)
		return
	}
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Database error", err)
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"status": status,
	})
}

// SearchAnnouncements searches announcements
func (h *AnnouncementsHandler) SearchAnnouncements(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("q")
	if query == "" {
		respondError(w, http.StatusBadRequest, "Search query required", nil)
		return
	}

	sqlQuery := `
		SELECT 
			_id, tenant_id, title, content, type, priority, category,
			status, is_published, is_pinned, start_date, end_date, published_at,
			target_audience, display_location, icon, color,
			link_url, link_text, attachments, metadata,
			view_count, click_count,
			created_at, created_by, updated_at, updated_by, deleted_at, deleted_by, version
		FROM system_announcements
		WHERE deleted_at IS NULL
			AND (
				title ILIKE $1 OR
				content ILIKE $1 OR
				category ILIKE $1
			)
		ORDER BY created_at DESC
		LIMIT 20
	`

	rows, err := h.db.Query(sqlQuery, "%"+query+"%")
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Database error", err)
		return
	}
	defer rows.Close()

	announcements := []SystemAnnouncement{}
	for rows.Next() {
		ann, err := scanAnnouncement(rows)
		if err != nil {
			continue
		}
		announcements = append(announcements, ann)
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"data":  announcements,
		"query": query,
	})
}

// GetStats returns statistics
func (h *AnnouncementsHandler) GetStats(w http.ResponseWriter, r *http.Request) {
	query := `
		SELECT 
			COUNT(*) as total,
			COUNT(*) FILTER (WHERE status = 'active') as active,
			COUNT(*) FILTER (WHERE status = 'draft') as draft,
			COUNT(*) FILTER (WHERE status = 'expired') as expired,
			COUNT(*) FILTER (WHERE status = 'archived') as archived,
			COUNT(*) FILTER (WHERE type = 'info') as info,
			COUNT(*) FILTER (WHERE type = 'warning') as warning,
			COUNT(*) FILTER (WHERE type = 'error') as error,
			COUNT(*) FILTER (WHERE type = 'success') as success,
			COUNT(*) FILTER (WHERE type = 'maintenance') as maintenance
		FROM system_announcements
		WHERE deleted_at IS NULL
	`

	var stats struct {
		Total       int `json:"total"`
		Active      int `json:"active"`
		Draft       int `json:"draft"`
		Expired     int `json:"expired"`
		Archived    int `json:"archived"`
		Info        int `json:"info"`
		Warning     int `json:"warning"`
		Error       int `json:"error"`
		Success     int `json:"success"`
		Maintenance int `json:"maintenance"`
	}

	err := h.db.QueryRow(query).Scan(
		&stats.Total, &stats.Active, &stats.Draft, &stats.Expired, &stats.Archived,
		&stats.Info, &stats.Warning, &stats.Error, &stats.Success, &stats.Maintenance,
	)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Database error", err)
		return
	}

	respondJSON(w, http.StatusOK, stats)
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// scanAnnouncement scans a row into SystemAnnouncement struct
func scanAnnouncement(rows *sql.Rows) (SystemAnnouncement, error) {
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
		return ann, err
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

	return ann, nil
}

// scanAnnouncementRow scans a single row into SystemAnnouncement struct
func scanAnnouncementRow(row *sql.Row) (SystemAnnouncement, error) {
	var ann SystemAnnouncement
	var targetAudienceJSON, attachmentsJSON, metadataJSON []byte
	var category, icon, color, linkURL, linkText sql.NullString
	var createdBy, updatedBy, deletedBy sql.NullString
	var startDate, endDate, publishedAt, deletedAt sql.NullTime

	err := row.Scan(
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
		return ann, err
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

	return ann, nil
}
