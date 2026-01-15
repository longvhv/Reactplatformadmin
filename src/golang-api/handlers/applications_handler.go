/**
 * Applications API Handler
 * Manages technical application definitions and capabilities
 */

package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/lib/pq"
)

type ApplicationsHandler struct {
	db *sql.DB
}

func NewApplicationsHandler(db *sql.DB) *ApplicationsHandler {
	return &ApplicationsHandler{db: db}
}

// ==================== TYPES ====================

type Application struct {
	ID          string     `json:"_id"`
	Code        string     `json:"code"`
	Name        string     `json:"name"`
	Description *string    `json:"description,omitempty"`
	IsActive    bool       `json:"is_active"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
	DeletedAt   *time.Time `json:"deleted_at,omitempty"`
	Version     int64      `json:"version"`
}

type ApplicationWithCapabilities struct {
	Application
	Capabilities []AppCapability `json:"capabilities"`
}

type AppCapability struct {
	ID           string          `json:"_id"`
	AppCode      string          `json:"app_code"`
	Code         string          `json:"code"`
	Name         string          `json:"name"`
	Type         string          `json:"type"`
	DefaultValue json.RawMessage `json:"default_value"`
	Description  *string         `json:"description,omitempty"`
	IsActive     bool            `json:"is_active"`
	CreatedAt    time.Time       `json:"created_at"`
	UpdatedAt    time.Time       `json:"updated_at"`
	DeletedAt    *time.Time      `json:"deleted_at,omitempty"`
	Version      int64           `json:"version"`
}

type CreateApplicationRequest struct {
	Code        string  `json:"code" binding:"required"`
	Name        string  `json:"name" binding:"required"`
	Description *string `json:"description"`
	IsActive    *bool   `json:"is_active"`
}

type UpdateApplicationRequest struct {
	Name        *string `json:"name"`
	Description *string `json:"description"`
	IsActive    *bool   `json:"is_active"`
}

type CreateCapabilityRequest struct {
	Code         string          `json:"code" binding:"required"`
	Name         string          `json:"name" binding:"required"`
	Type         string          `json:"type" binding:"required"`
	DefaultValue json.RawMessage `json:"default_value" binding:"required"`
	Description  *string         `json:"description"`
	IsActive     *bool           `json:"is_active"`
}

type UpdateCapabilityRequest struct {
	Name         *string          `json:"name"`
	Type         *string          `json:"type"`
	DefaultValue *json.RawMessage `json:"default_value"`
	Description  *string          `json:"description"`
	IsActive     *bool            `json:"is_active"`
}

// ==================== APPLICATION HANDLERS ====================

// GetAllApplications godoc
// @Summary List applications
// @Description Get list of all applications with filtering
// @Tags applications
// @Accept json
// @Produce json
// @Param is_active query boolean false "Filter by active status"
// @Param include_deleted query boolean false "Include soft-deleted records"
// @Param limit query int false "Limit results" default(50)
// @Param offset query int false "Offset results" default(0)
// @Success 200 {array} Application
// @Failure 500 {object} ErrorResponse
// @Router /applications [get]
func (h *ApplicationsHandler) GetAllApplications(c *gin.Context) {
	isActive := c.Query("is_active")
	includeDeleted := c.Query("include_deleted") == "true"
	limit := c.DefaultQuery("limit", "50")
	offset := c.DefaultQuery("offset", "0")

	query := `
		SELECT _id, code, name, description, is_active,
		       created_at, updated_at, deleted_at, version
		FROM applications
		WHERE 1=1
	`
	args := []interface{}{}
	argPos := 1

	if !includeDeleted {
		query += ` AND deleted_at IS NULL`
	}

	if isActive != "" {
		query += ` AND is_active = $` + fmt.Sprint(argPos)
		args = append(args, isActive == "true")
		argPos++
	}

	query += ` ORDER BY created_at DESC LIMIT $` + fmt.Sprint(argPos) +
		` OFFSET $` + fmt.Sprint(argPos+1)
	args = append(args, limit, offset)

	rows, err := h.db.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch applications: " + err.Error(),
		})
		return
	}
	defer rows.Close()

	applications := []Application{}
	for rows.Next() {
		var app Application
		err := rows.Scan(
			&app.ID, &app.Code, &app.Name, &app.Description,
			&app.IsActive, &app.CreatedAt, &app.UpdatedAt,
			&app.DeletedAt, &app.Version,
		)
		if err != nil {
			continue
		}
		applications = append(applications, app)
	}

	c.JSON(http.StatusOK, applications)
}

// GetApplicationByCode godoc
// @Summary Get application by code
// @Description Get a single application by its code
// @Tags applications
// @Accept json
// @Produce json
// @Param code path string true "Application code (e.g., HRM_RECRUIT)"
// @Success 200 {object} Application
// @Failure 404 {object} ErrorResponse
// @Router /applications/code/{code} [get]
func (h *ApplicationsHandler) GetApplicationByCode(c *gin.Context) {
	code := c.Param("code")

	query := `
		SELECT _id, code, name, description, is_active,
		       created_at, updated_at, deleted_at, version
		FROM applications
		WHERE code = $1 AND deleted_at IS NULL
	`

	var app Application
	err := h.db.QueryRow(query, code).Scan(
		&app.ID, &app.Code, &app.Name, &app.Description,
		&app.IsActive, &app.CreatedAt, &app.UpdatedAt,
		&app.DeletedAt, &app.Version,
	)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Application not found",
		})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch application: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, app)
}

// GetApplicationByID godoc
// @Summary Get application by ID
// @Description Get a single application by UUID
// @Tags applications
// @Accept json
// @Produce json
// @Param id path string true "Application UUID"
// @Success 200 {object} Application
// @Failure 404 {object} ErrorResponse
// @Router /applications/{id} [get]
func (h *ApplicationsHandler) GetApplicationByID(c *gin.Context) {
	id := c.Param("id")

	if _, err := uuid.Parse(id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid application ID format",
		})
		return
	}

	query := `
		SELECT _id, code, name, description, is_active,
		       created_at, updated_at, deleted_at, version
		FROM applications
		WHERE _id = $1 AND deleted_at IS NULL
	`

	var app Application
	err := h.db.QueryRow(query, id).Scan(
		&app.ID, &app.Code, &app.Name, &app.Description,
		&app.IsActive, &app.CreatedAt, &app.UpdatedAt,
		&app.DeletedAt, &app.Version,
	)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Application not found",
		})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch application: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, app)
}

// GetApplicationWithCapabilities godoc
// @Summary Get application with capabilities
// @Description Get application along with all its capabilities
// @Tags applications
// @Accept json
// @Produce json
// @Param code path string true "Application code"
// @Success 200 {object} ApplicationWithCapabilities
// @Failure 404 {object} ErrorResponse
// @Router /applications/code/{code}/with-capabilities [get]
func (h *ApplicationsHandler) GetApplicationWithCapabilities(c *gin.Context) {
	code := c.Param("code")

	// Get application
	appQuery := `
		SELECT _id, code, name, description, is_active,
		       created_at, updated_at, deleted_at, version
		FROM applications
		WHERE code = $1 AND deleted_at IS NULL
	`

	var result ApplicationWithCapabilities
	err := h.db.QueryRow(appQuery, code).Scan(
		&result.ID, &result.Code, &result.Name, &result.Description,
		&result.IsActive, &result.CreatedAt, &result.UpdatedAt,
		&result.DeletedAt, &result.Version,
	)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Application not found",
		})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch application: " + err.Error(),
		})
		return
	}

	// Get capabilities
	capQuery := `
		SELECT _id, app_code, code, name, type, default_value, description,
		       is_active, created_at, updated_at, deleted_at, version
		FROM app_capabilities
		WHERE app_code = $1 AND deleted_at IS NULL
		ORDER BY created_at ASC
	`

	rows, err := h.db.Query(capQuery, code)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch capabilities: " + err.Error(),
		})
		return
	}
	defer rows.Close()

	result.Capabilities = []AppCapability{}
	for rows.Next() {
		var cap AppCapability
		err := rows.Scan(
			&cap.ID, &cap.AppCode, &cap.Code, &cap.Name,
			&cap.Type, &cap.DefaultValue, &cap.Description,
			&cap.IsActive, &cap.CreatedAt, &cap.UpdatedAt,
			&cap.DeletedAt, &cap.Version,
		)
		if err != nil {
			continue
		}
		result.Capabilities = append(result.Capabilities, cap)
	}

	c.JSON(http.StatusOK, result)
}

// CreateApplication godoc
// @Summary Create application
// @Description Create a new application
// @Tags applications
// @Accept json
// @Produce json
// @Param application body CreateApplicationRequest true "Application data"
// @Success 201 {object} Application
// @Failure 400 {object} ErrorResponse
// @Failure 409 {object} ErrorResponse
// @Router /applications [post]
func (h *ApplicationsHandler) CreateApplication(c *gin.Context) {
	var req CreateApplicationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request data: " + err.Error(),
		})
		return
	}

	// Validate code format (uppercase, numbers, underscores only)
	if !isValidAppCode(req.Code) {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid code format. Use uppercase letters, numbers, and underscores only (e.g., HRM_RECRUIT)",
		})
		return
	}

	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}

	id := uuid.New().String()

	insertQuery := `
		INSERT INTO applications (
			_id, code, name, description, is_active
		) VALUES ($1, $2, $3, $4, $5)
		RETURNING _id, code, name, description, is_active,
		          created_at, updated_at, deleted_at, version
	`

	var app Application
	err := h.db.QueryRow(
		insertQuery,
		id, req.Code, req.Name, req.Description, isActive,
	).Scan(
		&app.ID, &app.Code, &app.Name, &app.Description,
		&app.IsActive, &app.CreatedAt, &app.UpdatedAt,
		&app.DeletedAt, &app.Version,
	)

	if err != nil {
		if pqErr, ok := err.(*pq.Error); ok {
			if pqErr.Code == "23505" { // Unique violation
				c.JSON(http.StatusConflict, gin.H{
					"error": "Application code already exists",
				})
				return
			}
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create application: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, app)
}

// UpdateApplication godoc
// @Summary Update application
// @Description Update an existing application
// @Tags applications
// @Accept json
// @Produce json
// @Param code path string true "Application code"
// @Param application body UpdateApplicationRequest true "Application data"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Router /applications/code/{code} [patch]
func (h *ApplicationsHandler) UpdateApplication(c *gin.Context) {
	code := c.Param("code")

	var req UpdateApplicationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request data: " + err.Error(),
		})
		return
	}

	updates := []string{}
	args := []interface{}{}
	argPos := 1

	if req.Name != nil {
		updates = append(updates, fmt.Sprintf("name = $%d", argPos))
		args = append(args, *req.Name)
		argPos++
	}

	if req.Description != nil {
		updates = append(updates, fmt.Sprintf("description = $%d", argPos))
		args = append(args, *req.Description)
		argPos++
	}

	if req.IsActive != nil {
		updates = append(updates, fmt.Sprintf("is_active = $%d", argPos))
		args = append(args, *req.IsActive)
		argPos++
	}

	if len(updates) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "No fields to update",
		})
		return
	}

	updates = append(updates, "updated_at = NOW()")
	updates = append(updates, "version = version + 1")

	query := fmt.Sprintf(
		"UPDATE applications SET %s WHERE code = $%d AND deleted_at IS NULL RETURNING updated_at",
		strings.Join(updates, ", "),
		argPos,
	)
	args = append(args, code)

	var updatedAt time.Time
	err := h.db.QueryRow(query, args...).Scan(&updatedAt)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Application not found",
		})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update application: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "Application updated successfully",
		"updated_at": updatedAt,
	})
}

// DeleteApplication godoc
// @Summary Delete application (soft delete)
// @Description Soft delete an application
// @Tags applications
// @Accept json
// @Produce json
// @Param code path string true "Application code"
// @Success 200 {object} map[string]string
// @Failure 404 {object} ErrorResponse
// @Router /applications/code/{code} [delete]
func (h *ApplicationsHandler) DeleteApplication(c *gin.Context) {
	code := c.Param("code")

	query := `
		UPDATE applications 
		SET deleted_at = NOW(), updated_at = NOW(), version = version + 1
		WHERE code = $1 AND deleted_at IS NULL
		RETURNING deleted_at
	`

	var deletedAt time.Time
	err := h.db.QueryRow(query, code).Scan(&deletedAt)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Application not found or already deleted",
		})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to delete application: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "Application deleted successfully",
		"deleted_at": deletedAt,
	})
}

// ==================== CAPABILITY HANDLERS ====================

// GetCapabilitiesByApp godoc
// @Summary Get capabilities by application
// @Description Get all capabilities for a specific application
// @Tags capabilities
// @Accept json
// @Produce json
// @Param app_code path string true "Application code"
// @Param is_active query boolean false "Filter by active status"
// @Success 200 {array} AppCapability
// @Failure 500 {object} ErrorResponse
// @Router /applications/code/{app_code}/capabilities [get]
func (h *ApplicationsHandler) GetCapabilitiesByApp(c *gin.Context) {
	appCode := c.Param("app_code")
	isActive := c.Query("is_active")

	query := `
		SELECT _id, app_code, code, name, type, default_value, description,
		       is_active, created_at, updated_at, deleted_at, version
		FROM app_capabilities
		WHERE app_code = $1 AND deleted_at IS NULL
	`
	args := []interface{}{appCode}

	if isActive != "" {
		query += ` AND is_active = $2`
		args = append(args, isActive == "true")
	}

	query += ` ORDER BY created_at ASC`

	rows, err := h.db.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch capabilities: " + err.Error(),
		})
		return
	}
	defer rows.Close()

	capabilities := []AppCapability{}
	for rows.Next() {
		var cap AppCapability
		err := rows.Scan(
			&cap.ID, &cap.AppCode, &cap.Code, &cap.Name,
			&cap.Type, &cap.DefaultValue, &cap.Description,
			&cap.IsActive, &cap.CreatedAt, &cap.UpdatedAt,
			&cap.DeletedAt, &cap.Version,
		)
		if err != nil {
			continue
		}
		capabilities = append(capabilities, cap)
	}

	c.JSON(http.StatusOK, capabilities)
}

// CreateCapability godoc
// @Summary Create capability
// @Description Create a new capability for an application
// @Tags capabilities
// @Accept json
// @Produce json
// @Param app_code path string true "Application code"
// @Param capability body CreateCapabilityRequest true "Capability data"
// @Success 201 {object} AppCapability
// @Failure 400 {object} ErrorResponse
// @Failure 409 {object} ErrorResponse
// @Router /applications/code/{app_code}/capabilities [post]
func (h *ApplicationsHandler) CreateCapability(c *gin.Context) {
	appCode := c.Param("app_code")

	var req CreateCapabilityRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request data: " + err.Error(),
		})
		return
	}

	// Validate code format (lowercase, numbers, underscores only)
	if !isValidCapabilityCode(req.Code) {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid code format. Use lowercase letters, numbers, and underscores only (e.g., max_users)",
		})
		return
	}

	// Validate type
	if req.Type != "BOOLEAN" && req.Type != "NUMBER" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid type. Must be BOOLEAN or NUMBER",
		})
		return
	}

	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}

	id := uuid.New().String()

	insertQuery := `
		INSERT INTO app_capabilities (
			_id, app_code, code, name, type, default_value, description, is_active
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING _id, app_code, code, name, type, default_value, description,
		          is_active, created_at, updated_at, deleted_at, version
	`

	var cap AppCapability
	err := h.db.QueryRow(
		insertQuery,
		id, appCode, req.Code, req.Name, req.Type, req.DefaultValue, req.Description, isActive,
	).Scan(
		&cap.ID, &cap.AppCode, &cap.Code, &cap.Name,
		&cap.Type, &cap.DefaultValue, &cap.Description,
		&cap.IsActive, &cap.CreatedAt, &cap.UpdatedAt,
		&cap.DeletedAt, &cap.Version,
	)

	if err != nil {
		if pqErr, ok := err.(*pq.Error); ok {
			if pqErr.Code == "23505" { // Unique violation
				c.JSON(http.StatusConflict, gin.H{
					"error": "Capability code already exists for this application",
				})
				return
			}
			if pqErr.Code == "23503" { // Foreign key violation
				c.JSON(http.StatusBadRequest, gin.H{
					"error": "Application not found",
				})
				return
			}
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create capability: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, cap)
}

// UpdateCapability godoc
// @Summary Update capability
// @Description Update an existing capability
// @Tags capabilities
// @Accept json
// @Produce json
// @Param id path string true "Capability UUID"
// @Param capability body UpdateCapabilityRequest true "Capability data"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Router /capabilities/{id} [patch]
func (h *ApplicationsHandler) UpdateCapability(c *gin.Context) {
	id := c.Param("id")

	if _, err := uuid.Parse(id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid capability ID format",
		})
		return
	}

	var req UpdateCapabilityRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request data: " + err.Error(),
		})
		return
	}

	updates := []string{}
	args := []interface{}{}
	argPos := 1

	if req.Name != nil {
		updates = append(updates, fmt.Sprintf("name = $%d", argPos))
		args = append(args, *req.Name)
		argPos++
	}

	if req.Type != nil {
		if *req.Type != "BOOLEAN" && *req.Type != "NUMBER" {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Invalid type. Must be BOOLEAN or NUMBER",
			})
			return
		}
		updates = append(updates, fmt.Sprintf("type = $%d", argPos))
		args = append(args, *req.Type)
		argPos++
	}

	if req.DefaultValue != nil {
		updates = append(updates, fmt.Sprintf("default_value = $%d", argPos))
		args = append(args, *req.DefaultValue)
		argPos++
	}

	if req.Description != nil {
		updates = append(updates, fmt.Sprintf("description = $%d", argPos))
		args = append(args, *req.Description)
		argPos++
	}

	if req.IsActive != nil {
		updates = append(updates, fmt.Sprintf("is_active = $%d", argPos))
		args = append(args, *req.IsActive)
		argPos++
	}

	if len(updates) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "No fields to update",
		})
		return
	}

	updates = append(updates, "updated_at = NOW()")
	updates = append(updates, "version = version + 1")

	query := fmt.Sprintf(
		"UPDATE app_capabilities SET %s WHERE _id = $%d AND deleted_at IS NULL RETURNING updated_at",
		strings.Join(updates, ", "),
		argPos,
	)
	args = append(args, id)

	var updatedAt time.Time
	err := h.db.QueryRow(query, args...).Scan(&updatedAt)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Capability not found",
		})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update capability: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "Capability updated successfully",
		"updated_at": updatedAt,
	})
}

// DeleteCapability godoc
// @Summary Delete capability (soft delete)
// @Description Soft delete a capability
// @Tags capabilities
// @Accept json
// @Produce json
// @Param id path string true "Capability UUID"
// @Success 200 {object} map[string]string
// @Failure 404 {object} ErrorResponse
// @Router /capabilities/{id} [delete]
func (h *ApplicationsHandler) DeleteCapability(c *gin.Context) {
	id := c.Param("id")

	if _, err := uuid.Parse(id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid capability ID format",
		})
		return
	}

	query := `
		UPDATE app_capabilities 
		SET deleted_at = NOW(), updated_at = NOW(), version = version + 1
		WHERE _id = $1 AND deleted_at IS NULL
		RETURNING deleted_at
	`

	var deletedAt time.Time
	err := h.db.QueryRow(query, id).Scan(&deletedAt)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Capability not found or already deleted",
		})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to delete capability: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "Capability deleted successfully",
		"deleted_at": deletedAt,
	})
}

// ==================== HELPER FUNCTIONS ====================

func isValidAppCode(code string) bool {
	// Must be uppercase letters, numbers, and underscores only
	for _, ch := range code {
		if !((ch >= 'A' && ch <= 'Z') || (ch >= '0' && ch <= '9') || ch == '_') {
			return false
		}
	}
	return len(code) > 0 && len(code) <= 50
}

func isValidCapabilityCode(code string) bool {
	// Must be lowercase letters, numbers, and underscores only
	for _, ch := range code {
		if !((ch >= 'a' && ch <= 'z') || (ch >= '0' && ch <= '9') || ch == '_') {
			return false
		}
	}
	return len(code) > 0 && len(code) <= 50
}
