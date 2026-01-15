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
// MODELS - System Announcements & Notifications
// ============================================================================

// SystemAnnouncement represents a system-wide announcement
type SystemAnnouncement struct {
	// I. ĐỊNH DANH & PHÂN CẤP
	ID string `json:"_id" db:"_id"`

	// II. NỘI DUNG ĐA NGÔN NGỮ (JSONB)
	Titles   map[string]string `json:"titles" db:"titles"`
	Contents map[string]string `json:"contents" db:"contents"`
	Type     string            `json:"type" db:"type"` // INFO, WARNING, CRITICAL, PROMOTION

	// III. NHẮM MỤC TIÊU (TARGETING)
	TargetRegions []string `json:"target_regions,omitempty" db:"target_regions"`
	TargetPlans   []string `json:"target_plans,omitempty" db:"target_plans"`

	// IV. VẬN HÀNH & THỜI GIAN
	IsActive    bool       `json:"is_active" db:"is_active"`
	IsLocalTime bool       `json:"is_local_time" db:"is_local_time"`
	StartAt     time.Time  `json:"start_at" db:"start_at"`
	EndAt       *time.Time `json:"end_at,omitempty" db:"end_at"`

	// V. QUẢN TRỊ & AUDIT
	Version   int64     `json:"version" db:"version"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

// NotificationTemplate represents a notification template
type NotificationTemplate struct {
	ID                string                 `json:"_id" db:"_id"`
	TenantID          *string                `json:"tenant_id,omitempty" db:"tenant_id"`
	Code              string                 `json:"code" db:"code"`
	Name              string                 `json:"name" db:"name"`
	SubjectTemplates  map[string]string      `json:"subject_templates" db:"subject_templates"`
	BodyTemplates     map[string]string      `json:"body_templates" db:"body_templates"`
	SMSTemplate       *string                `json:"sms_template,omitempty" db:"sms_template"`
	RequiredVariables []string               `json:"required_variables" db:"required_variables"`
	IsActive          bool                   `json:"is_active" db:"is_active"`
	Version           int64                  `json:"version" db:"version"`
	CreatedAt         time.Time              `json:"created_at" db:"created_at"`
	UpdatedAt         time.Time              `json:"updated_at" db:"updated_at"`
}

// CreateAnnouncementRequest represents request body for creating announcement
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

// UpdateAnnouncementRequest represents request body for updating announcement
type UpdateAnnouncementRequest struct {
	Titles        *map[string]string `json:"titles,omitempty"`
	Contents      *map[string]string `json:"contents,omitempty"`
	Type          *string            `json:"type,omitempty" validate:"omitempty,oneof=INFO WARNING CRITICAL PROMOTION"`
	TargetRegions *[]string          `json:"target_regions,omitempty"`
	TargetPlans   *[]string          `json:"target_plans,omitempty"`
	IsActive      *bool              `json:"is_active,omitempty"`
	IsLocalTime   *bool              `json:"is_local_time,omitempty"`
	StartAt       *time.Time         `json:"start_at,omitempty"`
	EndAt         *time.Time         `json:"end_at,omitempty"`
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
	r.HandleFunc("/api/announcements/{id}/toggle", h.ToggleActive).Methods("PATCH")
	r.HandleFunc("/api/announcements/search", h.SearchAnnouncements).Methods("GET")
	r.HandleFunc("/api/announcements/stats", h.GetStats).Methods("GET")

	// Notification Templates
	r.HandleFunc("/api/notification-templates", h.ListTemplates).Methods("GET")
	r.HandleFunc("/api/notification-templates/{id}", h.GetTemplate).Methods("GET")
	r.HandleFunc("/api/notification-templates", h.CreateTemplate).Methods("POST")
	r.HandleFunc("/api/notification-templates/{id}", h.UpdateTemplate).Methods("PUT", "PATCH")
	r.HandleFunc("/api/notification-templates/{id}", h.DeleteTemplate).Methods("DELETE")
}

// ============================================================================
// HANDLERS - SYSTEM ANNOUNCEMENTS
// ============================================================================

// ListAnnouncements returns all announcements with pagination and filtering
func (h *AnnouncementsHandler) ListAnnouncements(w http.ResponseWriter, r *http.Request) {
	// Query parameters
	announcementType := r.URL.Query().Get("type")
	isActive := r.URL.Query().Get("is_active")
	page := getIntQueryParam(r, "page", 1)
	limit := getIntQueryParam(r, "limit", 20)
	if limit > 100 {
		limit = 100
	}
	offset := (page - 1) * limit

	// Build query
	query := `
		SELECT 
			_id, titles, contents, type,
			target_regions, target_plans,
			is_active, is_local_time, start_at, end_at,
			version, created_at, updated_at
		FROM system_announcements
		WHERE 1=1
	`
	args := []interface{}{}
	argIdx := 1

	if announcementType != "" {
		query += fmt.Sprintf(" AND type = $%d", argIdx)
		args = append(args, announcementType)
		argIdx++
	}

	if isActive == "true" {
		query += " AND is_active = true"
	} else if isActive == "false" {
		query += " AND is_active = false"
	}

	query += " ORDER BY start_at DESC"
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
		var ann SystemAnnouncement
		var titlesJSON, contentsJSON []byte

		err := rows.Scan(
			&ann.ID, &titlesJSON, &contentsJSON, &ann.Type,
			pq.Array(&ann.TargetRegions), pq.Array(&ann.TargetPlans),
			&ann.IsActive, &ann.IsLocalTime, &ann.StartAt, &ann.EndAt,
			&ann.Version, &ann.CreatedAt, &ann.UpdatedAt,
		)
		if err != nil {
			continue
		}

		json.Unmarshal(titlesJSON, &ann.Titles)
		json.Unmarshal(contentsJSON, &ann.Contents)
		announcements = append(announcements, ann)
	}

	// Count total
	var total int
	countQuery := "SELECT COUNT(*) FROM system_announcements WHERE 1=1"
	if announcementType != "" {
		countQuery += " AND type = '" + announcementType + "'"
	}
	h.db.QueryRow(countQuery).Scan(&total)

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
			_id, titles, contents, type,
			target_regions, target_plans,
			is_active, is_local_time, start_at, end_at,
			version, created_at, updated_at
		FROM system_announcements
		WHERE _id = $1
	`

	var ann SystemAnnouncement
	var titlesJSON, contentsJSON []byte

	err := h.db.QueryRow(query, annID).Scan(
		&ann.ID, &titlesJSON, &contentsJSON, &ann.Type,
		pq.Array(&ann.TargetRegions), pq.Array(&ann.TargetPlans),
		&ann.IsActive, &ann.IsLocalTime, &ann.StartAt, &ann.EndAt,
		&ann.Version, &ann.CreatedAt, &ann.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		respondError(w, http.StatusNotFound, "Announcement not found", nil)
		return
	}
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Database error", err)
		return
	}

	json.Unmarshal(titlesJSON, &ann.Titles)
	json.Unmarshal(contentsJSON, &ann.Contents)

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
	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}

	isLocalTime := false
	if req.IsLocalTime != nil {
		isLocalTime = *req.IsLocalTime
	}

	startAt := time.Now()
	if req.StartAt != nil {
		startAt = *req.StartAt
	}

	// Generate UUID
	annID := uuid.New().String()

	// Convert maps to JSON
	titlesJSON, _ := json.Marshal(req.Titles)
	contentsJSON, _ := json.Marshal(req.Contents)

	// Insert
	query := `
		INSERT INTO system_announcements (
			_id, titles, contents, type,
			target_regions, target_plans,
			is_active, is_local_time, start_at, end_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10
		)
		RETURNING _id, titles, contents, type, is_active, is_local_time, 
		          start_at, end_at, version, created_at, updated_at
	`

	var ann SystemAnnouncement
	var retTitlesJSON, retContentsJSON []byte

	err := h.db.QueryRow(
		query,
		annID, titlesJSON, contentsJSON, req.Type,
		pq.Array(req.TargetRegions), pq.Array(req.TargetPlans),
		isActive, isLocalTime, startAt, req.EndAt,
	).Scan(
		&ann.ID, &retTitlesJSON, &retContentsJSON, &ann.Type,
		&ann.IsActive, &ann.IsLocalTime, &ann.StartAt, &ann.EndAt,
		&ann.Version, &ann.CreatedAt, &ann.UpdatedAt,
	)

	if err != nil {
		respondError(w, http.StatusInternalServerError, "Database error", err)
		return
	}

	json.Unmarshal(retTitlesJSON, &ann.Titles)
	json.Unmarshal(retContentsJSON, &ann.Contents)
	ann.TargetRegions = req.TargetRegions
	ann.TargetPlans = req.TargetPlans

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

	if req.Titles != nil {
		titlesJSON, _ := json.Marshal(*req.Titles)
		updates = append(updates, fmt.Sprintf("titles = $%d", argIdx))
		args = append(args, titlesJSON)
		argIdx++
	}
	if req.Contents != nil {
		contentsJSON, _ := json.Marshal(*req.Contents)
		updates = append(updates, fmt.Sprintf("contents = $%d", argIdx))
		args = append(args, contentsJSON)
		argIdx++
	}
	if req.Type != nil {
		updates = append(updates, fmt.Sprintf("type = $%d", argIdx))
		args = append(args, *req.Type)
		argIdx++
	}
	if req.TargetRegions != nil {
		updates = append(updates, fmt.Sprintf("target_regions = $%d", argIdx))
		args = append(args, pq.Array(*req.TargetRegions))
		argIdx++
	}
	if req.TargetPlans != nil {
		updates = append(updates, fmt.Sprintf("target_plans = $%d", argIdx))
		args = append(args, pq.Array(*req.TargetPlans))
		argIdx++
	}
	if req.IsActive != nil {
		updates = append(updates, fmt.Sprintf("is_active = $%d", argIdx))
		args = append(args, *req.IsActive)
		argIdx++
	}
	if req.IsLocalTime != nil {
		updates = append(updates, fmt.Sprintf("is_local_time = $%d", argIdx))
		args = append(args, *req.IsLocalTime)
		argIdx++
	}
	if req.StartAt != nil {
		updates = append(updates, fmt.Sprintf("start_at = $%d", argIdx))
		args = append(args, *req.StartAt)
		argIdx++
	}
	if req.EndAt != nil {
		updates = append(updates, fmt.Sprintf("end_at = $%d", argIdx))
		args = append(args, *req.EndAt)
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
		WHERE _id = $%d
		RETURNING _id, type, is_active, version, updated_at
	`, strings.Join(updates, ", "), argIdx)

	var ann SystemAnnouncement
	err := h.db.QueryRow(query, args...).Scan(
		&ann.ID, &ann.Type, &ann.IsActive, &ann.Version, &ann.UpdatedAt,
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

// DeleteAnnouncement deletes an announcement
func (h *AnnouncementsHandler) DeleteAnnouncement(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	annID := vars["id"]

	// Validate UUID
	if _, err := uuid.Parse(annID); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid announcement ID", err)
		return
	}

	query := `DELETE FROM system_announcements WHERE _id = $1 RETURNING _id`

	var id string
	err := h.db.QueryRow(query, annID).Scan(&id)

	if err == sql.ErrNoRows {
		respondError(w, http.StatusNotFound, "Announcement not found", nil)
		return
	}
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Database error", err)
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"message": "Announcement deleted successfully",
		"id":      id,
	})
}

// GetActiveAnnouncements returns active announcements
func (h *AnnouncementsHandler) GetActiveAnnouncements(w http.ResponseWriter, r *http.Request) {
	query := `
		SELECT 
			_id, titles, contents, type,
			target_regions, target_plans,
			start_at, end_at, is_local_time
		FROM system_announcements
		WHERE is_active = true
			AND start_at <= NOW()
			AND (end_at IS NULL OR end_at > NOW())
		ORDER BY start_at DESC
	`

	rows, err := h.db.Query(query)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Database error", err)
		return
	}
	defer rows.Close()

	announcements := []SystemAnnouncement{}
	for rows.Next() {
		var ann SystemAnnouncement
		var titlesJSON, contentsJSON []byte

		err := rows.Scan(
			&ann.ID, &titlesJSON, &contentsJSON, &ann.Type,
			pq.Array(&ann.TargetRegions), pq.Array(&ann.TargetPlans),
			&ann.StartAt, &ann.EndAt, &ann.IsLocalTime,
		)
		if err != nil {
			continue
		}

		json.Unmarshal(titlesJSON, &ann.Titles)
		json.Unmarshal(contentsJSON, &ann.Contents)
		announcements = append(announcements, ann)
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"data": announcements,
	})
}

// ToggleActive toggles announcement active status
func (h *AnnouncementsHandler) ToggleActive(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	annID := vars["id"]

	query := `
		UPDATE system_announcements 
		SET is_active = NOT is_active, version = version + 1
		WHERE _id = $1
		RETURNING is_active
	`

	var isActive bool
	err := h.db.QueryRow(query, annID).Scan(&isActive)

	if err == sql.ErrNoRows {
		respondError(w, http.StatusNotFound, "Announcement not found", nil)
		return
	}
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Database error", err)
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"is_active": isActive,
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
			_id, titles, contents, type, is_active,
			start_at, version
		FROM system_announcements
		WHERE 
			titles::text ILIKE $1 OR
			contents::text ILIKE $1
		ORDER BY start_at DESC
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
		var ann SystemAnnouncement
		var titlesJSON, contentsJSON []byte

		err := rows.Scan(
			&ann.ID, &titlesJSON, &contentsJSON, &ann.Type, &ann.IsActive,
			&ann.StartAt, &ann.Version,
		)
		if err != nil {
			continue
		}

		json.Unmarshal(titlesJSON, &ann.Titles)
		json.Unmarshal(contentsJSON, &ann.Contents)
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
			COUNT(*) FILTER (WHERE is_active = true) as active,
			COUNT(*) FILTER (WHERE type = 'INFO') as info,
			COUNT(*) FILTER (WHERE type = 'WARNING') as warning,
			COUNT(*) FILTER (WHERE type = 'CRITICAL') as critical,
			COUNT(*) FILTER (WHERE type = 'PROMOTION') as promotion
		FROM system_announcements
	`

	var stats struct {
		Total     int `json:"total"`
		Active    int `json:"active"`
		Info      int `json:"info"`
		Warning   int `json:"warning"`
		Critical  int `json:"critical"`
		Promotion int `json:"promotion"`
	}

	err := h.db.QueryRow(query).Scan(
		&stats.Total, &stats.Active,
		&stats.Info, &stats.Warning, &stats.Critical, &stats.Promotion,
	)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Database error", err)
		return
	}

	respondJSON(w, http.StatusOK, stats)
}

// ============================================================================
// HANDLERS - NOTIFICATION TEMPLATES (Placeholder)
// ============================================================================

func (h *AnnouncementsHandler) ListTemplates(w http.ResponseWriter, r *http.Request) {
	respondJSON(w, http.StatusOK, map[string]interface{}{
		"data":    []interface{}{},
		"message": "Templates API - Coming soon",
	})
}

func (h *AnnouncementsHandler) GetTemplate(w http.ResponseWriter, r *http.Request) {
	respondJSON(w, http.StatusOK, map[string]string{"message": "Get template - Coming soon"})
}

func (h *AnnouncementsHandler) CreateTemplate(w http.ResponseWriter, r *http.Request) {
	respondJSON(w, http.StatusOK, map[string]string{"message": "Create template - Coming soon"})
}

func (h *AnnouncementsHandler) UpdateTemplate(w http.ResponseWriter, r *http.Request) {
	respondJSON(w, http.StatusOK, map[string]string{"message": "Update template - Coming soon"})
}

func (h *AnnouncementsHandler) DeleteTemplate(w http.ResponseWriter, r *http.Request) {
	respondJSON(w, http.StatusOK, map[string]string{"message": "Delete template - Coming soon"})
}
