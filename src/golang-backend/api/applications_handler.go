package api

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"regexp"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"github.com/lib/pq"
)

// ============================================================================
// MODELS - Application Management
// ============================================================================

// Application represents a system application
type Application struct {
	// I. ĐỊNH DANH & MÃ KỸ THUẬT
	ID          string  `json:"_id" db:"_id"`
	Code        string  `json:"code" db:"code"`
	Name        string  `json:"name" db:"name"`
	Description *string `json:"description,omitempty" db:"description"`

	// II. TRẠNG THÁI VẬN HÀNH
	IsActive bool `json:"is_active" db:"is_active"`

	// III. AUDIT & VERSIONING
	CreatedAt time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt time.Time  `json:"updated_at" db:"updated_at"`
	DeletedAt *time.Time `json:"deleted_at,omitempty" db:"deleted_at"`
	Version   int64      `json:"version" db:"version"`
}

// AppCapability represents application capability
type AppCapability struct {
	ID           string                 `json:"_id" db:"_id"`
	AppCode      string                 `json:"app_code" db:"app_code"`
	Code         string                 `json:"code" db:"code"`
	Name         string                 `json:"name" db:"name"`
	Type         string                 `json:"type" db:"type"` // BOOLEAN, NUMBER
	DefaultValue map[string]interface{} `json:"default_value" db:"default_value"`
	Description  *string                `json:"description,omitempty" db:"description"`
	IsActive     bool                   `json:"is_active" db:"is_active"`
	CreatedAt    time.Time              `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time              `json:"updated_at" db:"updated_at"`
	DeletedAt    *time.Time             `json:"deleted_at,omitempty" db:"deleted_at"`
	Version      int64                  `json:"version" db:"version"`
}

// CreateApplicationRequest represents request body for creating an application
type CreateApplicationRequest struct {
	Code        string  `json:"code" validate:"required,uppercase"`
	Name        string  `json:"name" validate:"required,min=1"`
	Description *string `json:"description,omitempty"`
	IsActive    *bool   `json:"is_active,omitempty"`
}

// UpdateApplicationRequest represents request body for updating an application
type UpdateApplicationRequest struct {
	Name        *string `json:"name,omitempty" validate:"omitempty,min=1"`
	Description *string `json:"description,omitempty"`
	IsActive    *bool   `json:"is_active,omitempty"`
}

// BulkApplicationActionRequest represents bulk operation request
type BulkApplicationActionRequest struct {
	AppIDs []string `json:"app_ids" validate:"required,min=1"`
	Action string   `json:"action" validate:"required,oneof=delete activate deactivate"`
}

// ApplicationsHandler handles application-related HTTP requests
type ApplicationsHandler struct {
	db *sql.DB
}

// NewApplicationsHandler creates a new applications handler
func NewApplicationsHandler(db *sql.DB) *ApplicationsHandler {
	return &ApplicationsHandler{db: db}
}

// ============================================================================
// ROUTE REGISTRATION
// ============================================================================

// RegisterRoutes registers application API routes
func (h *ApplicationsHandler) RegisterRoutes(r *mux.Router) {
	// CRUD
	r.HandleFunc("/api/applications", h.ListApplications).Methods("GET")
	r.HandleFunc("/api/applications/{id}", h.GetApplication).Methods("GET")
	r.HandleFunc("/api/applications", h.CreateApplication).Methods("POST")
	r.HandleFunc("/api/applications/{id}", h.UpdateApplication).Methods("PUT", "PATCH")
	r.HandleFunc("/api/applications/{id}", h.DeleteApplication).Methods("DELETE")

	// Special operations
	r.HandleFunc("/api/applications/code/{code}", h.GetApplicationByCode).Methods("GET")
	r.HandleFunc("/api/applications/{id}/capabilities", h.GetCapabilities).Methods("GET")
	r.HandleFunc("/api/applications/search", h.SearchApplications).Methods("GET")
	r.HandleFunc("/api/applications/bulk", h.BulkAction).Methods("POST")
	r.HandleFunc("/api/applications/stats", h.GetStats).Methods("GET")
}

// ============================================================================
// HANDLERS
// ============================================================================

// ListApplications returns all applications with pagination and filtering
func (h *ApplicationsHandler) ListApplications(w http.ResponseWriter, r *http.Request) {
	// Query parameters
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
			_id, code, name, description,
			is_active, created_at, updated_at, deleted_at, version
		FROM applications
		WHERE deleted_at IS NULL
	`
	args := []interface{}{}
	argIdx := 1

	if isActive == "true" {
		query += " AND is_active = true"
	} else if isActive == "false" {
		query += " AND is_active = false"
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

	apps := []Application{}
	for rows.Next() {
		var app Application
		err := rows.Scan(
			&app.ID, &app.Code, &app.Name, &app.Description,
			&app.IsActive, &app.CreatedAt, &app.UpdatedAt, &app.DeletedAt, &app.Version,
		)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "Scan error", err)
			return
		}
		apps = append(apps, app)
	}

	// Count total
	var total int
	countQuery := "SELECT COUNT(*) FROM applications WHERE deleted_at IS NULL"
	h.db.QueryRow(countQuery).Scan(&total)

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"data": apps,
		"meta": map[string]interface{}{
			"page":  page,
			"limit": limit,
			"total": total,
		},
	})
}

// GetApplication returns a specific application by ID
func (h *ApplicationsHandler) GetApplication(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	appID := vars["id"]

	// Validate UUID
	if _, err := uuid.Parse(appID); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid application ID", err)
		return
	}

	query := `
		SELECT 
			_id, code, name, description,
			is_active, created_at, updated_at, deleted_at, version
		FROM applications
		WHERE _id = $1 AND deleted_at IS NULL
	`

	var app Application
	err := h.db.QueryRow(query, appID).Scan(
		&app.ID, &app.Code, &app.Name, &app.Description,
		&app.IsActive, &app.CreatedAt, &app.UpdatedAt, &app.DeletedAt, &app.Version,
	)

	if err == sql.ErrNoRows {
		respondError(w, http.StatusNotFound, "Application not found", nil)
		return
	}
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Database error", err)
		return
	}

	respondJSON(w, http.StatusOK, app)
}

// GetApplicationByCode returns an application by code
func (h *ApplicationsHandler) GetApplicationByCode(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	code := strings.ToUpper(vars["code"])

	query := `
		SELECT 
			_id, code, name, description,
			is_active, created_at, updated_at, deleted_at, version
		FROM applications
		WHERE code = $1 AND deleted_at IS NULL
	`

	var app Application
	err := h.db.QueryRow(query, code).Scan(
		&app.ID, &app.Code, &app.Name, &app.Description,
		&app.IsActive, &app.CreatedAt, &app.UpdatedAt, &app.DeletedAt, &app.Version,
	)

	if err == sql.ErrNoRows {
		respondError(w, http.StatusNotFound, "Application not found", nil)
		return
	}
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Database error", err)
		return
	}

	respondJSON(w, http.StatusOK, app)
}

// CreateApplication creates a new application
func (h *ApplicationsHandler) CreateApplication(w http.ResponseWriter, r *http.Request) {
	var req CreateApplicationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid JSON", err)
		return
	}

	// Validate code format (uppercase alphanumeric with underscores)
	codeRegex := regexp.MustCompile(`^[A-Z0-9_]+$`)
	if !codeRegex.MatchString(req.Code) {
		respondError(w, http.StatusBadRequest, "Code must be uppercase alphanumeric with underscores", nil)
		return
	}

	// Set defaults
	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}

	// Generate UUID
	appID := uuid.New().String()

	// Insert
	query := `
		INSERT INTO applications (
			_id, code, name, description, is_active
		) VALUES (
			$1, $2, $3, $4, $5
		)
		RETURNING _id, code, name, description, is_active, created_at, updated_at, version
	`

	var app Application
	err := h.db.QueryRow(
		query,
		appID, req.Code, req.Name, req.Description, isActive,
	).Scan(
		&app.ID, &app.Code, &app.Name, &app.Description,
		&app.IsActive, &app.CreatedAt, &app.UpdatedAt, &app.Version,
	)

	if err != nil {
		if pqErr, ok := err.(*pq.Error); ok {
			if pqErr.Code == "23505" { // unique violation
				respondError(w, http.StatusConflict, "Application code already exists", err)
				return
			}
		}
		respondError(w, http.StatusInternalServerError, "Database error", err)
		return
	}

	respondJSON(w, http.StatusCreated, app)
}

// UpdateApplication updates application information
func (h *ApplicationsHandler) UpdateApplication(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	appID := vars["id"]

	// Validate UUID
	if _, err := uuid.Parse(appID); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid application ID", err)
		return
	}

	var req UpdateApplicationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid JSON", err)
		return
	}

	// Build dynamic UPDATE query
	updates := []string{}
	args := []interface{}{}
	argIdx := 1

	if req.Name != nil {
		updates = append(updates, fmt.Sprintf("name = $%d", argIdx))
		args = append(args, *req.Name)
		argIdx++
	}
	if req.Description != nil {
		updates = append(updates, fmt.Sprintf("description = $%d", argIdx))
		args = append(args, *req.Description)
		argIdx++
	}
	if req.IsActive != nil {
		updates = append(updates, fmt.Sprintf("is_active = $%d", argIdx))
		args = append(args, *req.IsActive)
		argIdx++
	}

	if len(updates) == 0 {
		respondError(w, http.StatusBadRequest, "No fields to update", nil)
		return
	}

	// Add version increment
	updates = append(updates, fmt.Sprintf("version = version + 1"))

	// Add app ID
	args = append(args, appID)

	query := fmt.Sprintf(`
		UPDATE applications 
		SET %s, updated_at = NOW()
		WHERE _id = $%d AND deleted_at IS NULL
		RETURNING _id, code, name, description, is_active, created_at, updated_at, version
	`, strings.Join(updates, ", "), argIdx)

	var app Application
	err := h.db.QueryRow(query, args...).Scan(
		&app.ID, &app.Code, &app.Name, &app.Description,
		&app.IsActive, &app.CreatedAt, &app.UpdatedAt, &app.Version,
	)

	if err == sql.ErrNoRows {
		respondError(w, http.StatusNotFound, "Application not found", nil)
		return
	}
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Database error", err)
		return
	}

	respondJSON(w, http.StatusOK, app)
}

// DeleteApplication soft-deletes an application
func (h *ApplicationsHandler) DeleteApplication(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	appID := vars["id"]

	// Validate UUID
	if _, err := uuid.Parse(appID); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid application ID", err)
		return
	}

	query := `
		UPDATE applications 
		SET deleted_at = NOW(), updated_at = NOW()
		WHERE _id = $1 AND deleted_at IS NULL
		RETURNING _id
	`

	var id string
	err := h.db.QueryRow(query, appID).Scan(&id)

	if err == sql.ErrNoRows {
		respondError(w, http.StatusNotFound, "Application not found", nil)
		return
	}
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Database error", err)
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"message": "Application deleted successfully",
		"id":      id,
	})
}

// GetCapabilities returns capabilities for an application
func (h *ApplicationsHandler) GetCapabilities(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	appID := vars["id"]

	// Get app code first
	var appCode string
	err := h.db.QueryRow("SELECT code FROM applications WHERE _id = $1", appID).Scan(&appCode)
	if err != nil {
		respondError(w, http.StatusNotFound, "Application not found", err)
		return
	}

	// Get capabilities
	query := `
		SELECT 
			_id, app_code, code, name, type, default_value, description,
			is_active, created_at, updated_at, version
		FROM app_capabilities
		WHERE app_code = $1 AND deleted_at IS NULL
		ORDER BY created_at
	`

	rows, err := h.db.Query(query, appCode)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Database error", err)
		return
	}
	defer rows.Close()

	capabilities := []AppCapability{}
	for rows.Next() {
		var cap AppCapability
		var defaultValueJSON []byte

		err := rows.Scan(
			&cap.ID, &cap.AppCode, &cap.Code, &cap.Name, &cap.Type, &defaultValueJSON, &cap.Description,
			&cap.IsActive, &cap.CreatedAt, &cap.UpdatedAt, &cap.Version,
		)
		if err != nil {
			continue
		}

		json.Unmarshal(defaultValueJSON, &cap.DefaultValue)
		capabilities = append(capabilities, cap)
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"data": capabilities,
	})
}

// SearchApplications performs search
func (h *ApplicationsHandler) SearchApplications(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("q")
	if query == "" {
		respondError(w, http.StatusBadRequest, "Search query required", nil)
		return
	}

	limit := getIntQueryParam(r, "limit", 10)

	sqlQuery := `
		SELECT 
			_id, code, name, description,
			is_active, created_at, updated_at, version
		FROM applications
		WHERE deleted_at IS NULL
			AND (
				code ILIKE $1 OR
				name ILIKE $1 OR
				description ILIKE $1
			)
		ORDER BY 
			CASE 
				WHEN code ILIKE $2 THEN 1
				WHEN name ILIKE $2 THEN 2
				ELSE 3
			END,
			created_at DESC
		LIMIT $3
	`

	rows, err := h.db.Query(sqlQuery, "%"+query+"%", query+"%", limit)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Database error", err)
		return
	}
	defer rows.Close()

	apps := []Application{}
	for rows.Next() {
		var app Application
		err := rows.Scan(
			&app.ID, &app.Code, &app.Name, &app.Description,
			&app.IsActive, &app.CreatedAt, &app.UpdatedAt, &app.Version,
		)
		if err != nil {
			continue
		}
		apps = append(apps, app)
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"data":  apps,
		"query": query,
	})
}

// BulkAction performs bulk operations on applications
func (h *ApplicationsHandler) BulkAction(w http.ResponseWriter, r *http.Request) {
	var req BulkApplicationActionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid JSON", err)
		return
	}

	if len(req.AppIDs) == 0 {
		respondError(w, http.StatusBadRequest, "No application IDs provided", nil)
		return
	}

	var query string
	var args []interface{}

	switch req.Action {
	case "delete":
		query = `UPDATE applications SET deleted_at = NOW() WHERE _id = ANY($1)`
		args = []interface{}{pq.Array(req.AppIDs)}
	case "activate":
		query = `UPDATE applications SET is_active = true WHERE _id = ANY($1)`
		args = []interface{}{pq.Array(req.AppIDs)}
	case "deactivate":
		query = `UPDATE applications SET is_active = false WHERE _id = ANY($1)`
		args = []interface{}{pq.Array(req.AppIDs)}
	default:
		respondError(w, http.StatusBadRequest, "Invalid action", nil)
		return
	}

	result, err := h.db.Exec(query, args...)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Bulk action failed", err)
		return
	}

	affected, _ := result.RowsAffected()

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"message":  fmt.Sprintf("Bulk %s completed", req.Action),
		"affected": affected,
	})
}

// GetStats returns statistics
func (h *ApplicationsHandler) GetStats(w http.ResponseWriter, r *http.Request) {
	query := `
		SELECT 
			COUNT(*) as total,
			COUNT(*) FILTER (WHERE is_active = true) as active,
			COUNT(*) FILTER (WHERE is_active = false) as inactive
		FROM applications
		WHERE deleted_at IS NULL
	`

	var stats struct {
		Total    int `json:"total"`
		Active   int `json:"active"`
		Inactive int `json:"inactive"`
	}

	err := h.db.QueryRow(query).Scan(&stats.Total, &stats.Active, &stats.Inactive)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Database error", err)
		return
	}

	respondJSON(w, http.StatusOK, stats)
}
