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
// MODELS - Theo chuẩn docs/DatabaseCommand.md
// ============================================================================

// Tenant represents a SaaS tenant/organization
type Tenant struct {
	// I. ĐỊNH DANH & HẠ TẦNG
	ID              string  `json:"_id" db:"_id"`
	Code            string  `json:"code" db:"code"`
	DataRegion      string  `json:"data_region" db:"data_region"`
	ComplianceLevel string  `json:"compliance_level" db:"compliance_level"`
	ParentTenantID  *string `json:"parent_tenant_id,omitempty" db:"parent_tenant_id"`
	Path            *string `json:"path,omitempty" db:"path"`

	// II. THÔNG TIN NGHIỆP VỤ
	Name        string `json:"name" db:"name"`
	Tier        string `json:"tier" db:"tier"`
	BillingType string `json:"billing_type" db:"billing_type"`
	Timezone    string `json:"timezone" db:"timezone"`

	// III. DỮ LIỆU ĐỘNG (JSONB)
	Profile  map[string]interface{} `json:"profile" db:"profile"`
	Settings map[string]interface{} `json:"settings" db:"settings"`

	// IV. TRẠNG THÁI & TRUY VẾT
	Status    string     `json:"status" db:"status"`
	CreatedAt time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt time.Time  `json:"updated_at" db:"updated_at"`
	DeletedAt *time.Time `json:"deleted_at,omitempty" db:"deleted_at"`
	Version   int64      `json:"version" db:"version"`

	// Computed fields (không lưu DB)
	MemberCount *int `json:"member_count,omitempty" db:"-"`
}

// CreateTenantRequest represents request body for creating a tenant
type CreateTenantRequest struct {
	Code            string                 `json:"code" validate:"required,min=3,max=64"`
	Name            string                 `json:"name" validate:"required,min=1"`
	Tier            string                 `json:"tier" validate:"required,oneof=FREE PRO ENTERPRISE PARTNER_BASIC PARTNER_PREMIUM PARTNER_ELITE PROVIDER"`
	DataRegion      string                 `json:"data_region" validate:"omitempty,oneof=ap-southeast-1 us-east-1 eu-central-1"`
	ComplianceLevel string                 `json:"compliance_level" validate:"omitempty,oneof=STANDARD GDPR HIPAA PCI-DSS"`
	BillingType     string                 `json:"billing_type" validate:"omitempty,oneof=PREPAID POSTPAID"`
	Timezone        string                 `json:"timezone" validate:"omitempty"`
	ParentTenantID  *string                `json:"parent_tenant_id,omitempty"`
	Profile         map[string]interface{} `json:"profile,omitempty"`
	Settings        map[string]interface{} `json:"settings,omitempty"`
}

// UpdateTenantRequest represents request body for updating a tenant
type UpdateTenantRequest struct {
	Name            *string                `json:"name,omitempty"`
	Status          *string                `json:"status,omitempty" validate:"omitempty,oneof=TRIAL ACTIVE SUSPENDED CANCELLED"`
	Tier            *string                `json:"tier,omitempty"`
	BillingType     *string                `json:"billing_type,omitempty" validate:"omitempty,oneof=PREPAID POSTPAID"`
	Timezone        *string                `json:"timezone,omitempty"`
	DataRegion      *string                `json:"data_region,omitempty"`
	ComplianceLevel *string                `json:"compliance_level,omitempty"`
	ParentTenantID  *string                `json:"parent_tenant_id,omitempty"`
	Profile         map[string]interface{} `json:"profile,omitempty"`
	Settings        map[string]interface{} `json:"settings,omitempty"`
}

// TenantsHandler handles tenant-related HTTP requests
type TenantsHandler struct {
	db *sql.DB
}

// NewTenantsHandler creates a new tenant handler
func NewTenantsHandler(db *sql.DB) *TenantsHandler {
	return &TenantsHandler{db: db}
}

// ============================================================================
// ROUTE REGISTRATION
// ============================================================================

// RegisterRoutes registers tenant API routes
func (h *TenantsHandler) RegisterRoutes(r *mux.Router) {
	// CRUD
	r.HandleFunc("/api/tenants", h.ListTenants).Methods("GET")
	r.HandleFunc("/api/tenants/{id}", h.GetTenant).Methods("GET")
	r.HandleFunc("/api/tenants", h.CreateTenant).Methods("POST")
	r.HandleFunc("/api/tenants/{id}", h.UpdateTenant).Methods("PUT", "PATCH")
	r.HandleFunc("/api/tenants/{id}", h.DeleteTenant).Methods("DELETE")

	// Special operations
	r.HandleFunc("/api/tenants/{id}/status", h.UpdateTenantStatus).Methods("PATCH")
	r.HandleFunc("/api/tenants/{id}/members", h.GetTenantMembers).Methods("GET")
	r.HandleFunc("/api/tenants/code/{code}", h.GetTenantByCode).Methods("GET")
}

// ============================================================================
// HANDLERS
// ============================================================================

// ListTenants returns all tenants with pagination and filtering
// @Summary List all tenants
// @Description Get all tenants with optional filtering by status, tier, region
// @Tags Tenants
// @Accept json
// @Produce json
// @Param status query string false "Filter by status (TRIAL, ACTIVE, SUSPENDED, CANCELLED)"
// @Param tier query string false "Filter by tier (FREE, PRO, ENTERPRISE, etc.)"
// @Param region query string false "Filter by data_region"
// @Param page query int false "Page number (default: 1)"
// @Param limit query int false "Items per page (default: 20, max: 100)"
// @Success 200 {object} map[string]interface{}
// @Router /api/tenants [get]
func (h *TenantsHandler) ListTenants(w http.ResponseWriter, r *http.Request) {
	// Query parameters
	status := r.URL.Query().Get("status")
	tier := r.URL.Query().Get("tier")
	region := r.URL.Query().Get("region")
	page := getIntQueryParam(r, "page", 1)
	limit := getIntQueryParam(r, "limit", 20)
	if limit > 100 {
		limit = 100
	}
	offset := (page - 1) * limit

	// Build query
	query := `
		SELECT 
			t._id, t.code, t.data_region, t.compliance_level, t.parent_tenant_id, t.path,
			t.name, t.tier, t.billing_type, t.timezone,
			t.profile, t.settings,
			t.status, t.created_at, t.updated_at, t.deleted_at, t.version,
			COUNT(tm._id) as member_count
		FROM tenants t
		LEFT JOIN tenant_members tm ON tm.tenant_id = t._id AND tm.deleted_at IS NULL
		WHERE t.deleted_at IS NULL
	`
	args := []interface{}{}
	argIdx := 1

	if status != "" {
		query += fmt.Sprintf(" AND t.status = $%d", argIdx)
		args = append(args, strings.ToUpper(status))
		argIdx++
	}
	if tier != "" {
		query += fmt.Sprintf(" AND t.tier = $%d", argIdx)
		args = append(args, strings.ToUpper(tier))
		argIdx++
	}
	if region != "" {
		query += fmt.Sprintf(" AND t.data_region = $%d", argIdx)
		args = append(args, region)
		argIdx++
	}

	query += " GROUP BY t._id ORDER BY t.created_at DESC"
	query += fmt.Sprintf(" LIMIT $%d OFFSET $%d", argIdx, argIdx+1)
	args = append(args, limit, offset)

	// Execute query
	rows, err := h.db.Query(query, args...)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Database error", err)
		return
	}
	defer rows.Close()

	tenants := []Tenant{}
	for rows.Next() {
		var t Tenant
		var profileJSON, settingsJSON []byte

		err := rows.Scan(
			&t.ID, &t.Code, &t.DataRegion, &t.ComplianceLevel, &t.ParentTenantID, &t.Path,
			&t.Name, &t.Tier, &t.BillingType, &t.Timezone,
			&profileJSON, &settingsJSON,
			&t.Status, &t.CreatedAt, &t.UpdatedAt, &t.DeletedAt, &t.Version,
			&t.MemberCount,
		)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "Scan error", err)
			return
		}

		json.Unmarshal(profileJSON, &t.Profile)
		json.Unmarshal(settingsJSON, &t.Settings)
		tenants = append(tenants, t)
	}

	// Count total
	var total int
	countQuery := "SELECT COUNT(*) FROM tenants WHERE deleted_at IS NULL"
	h.db.QueryRow(countQuery).Scan(&total)

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"data": tenants,
		"meta": map[string]interface{}{
			"page":  page,
			"limit": limit,
			"total": total,
		},
	})
}

// GetTenant returns a specific tenant by ID
// @Summary Get tenant by ID
// @Description Retrieve tenant details by ID
// @Tags Tenants
// @Accept json
// @Produce json
// @Param id path string true "Tenant ID (UUID)"
// @Success 200 {object} Tenant
// @Failure 404 {object} map[string]string
// @Router /api/tenants/{id} [get]
func (h *TenantsHandler) GetTenant(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	tenantID := vars["id"]

	// Validate UUID
	if _, err := uuid.Parse(tenantID); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid tenant ID", err)
		return
	}

	query := `
		SELECT 
			t._id, t.code, t.data_region, t.compliance_level, t.parent_tenant_id, t.path,
			t.name, t.tier, t.billing_type, t.timezone,
			t.profile, t.settings,
			t.status, t.created_at, t.updated_at, t.deleted_at, t.version,
			COUNT(tm._id) as member_count
		FROM tenants t
		LEFT JOIN tenant_members tm ON tm.tenant_id = t._id AND tm.deleted_at IS NULL
		WHERE t._id = $1 AND t.deleted_at IS NULL
		GROUP BY t._id
	`

	var t Tenant
	var profileJSON, settingsJSON []byte

	err := h.db.QueryRow(query, tenantID).Scan(
		&t.ID, &t.Code, &t.DataRegion, &t.ComplianceLevel, &t.ParentTenantID, &t.Path,
		&t.Name, &t.Tier, &t.BillingType, &t.Timezone,
		&profileJSON, &settingsJSON,
		&t.Status, &t.CreatedAt, &t.UpdatedAt, &t.DeletedAt, &t.Version,
		&t.MemberCount,
	)

	if err == sql.ErrNoRows {
		respondError(w, http.StatusNotFound, "Tenant not found", nil)
		return
	}
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Database error", err)
		return
	}

	json.Unmarshal(profileJSON, &t.Profile)
	json.Unmarshal(settingsJSON, &t.Settings)

	respondJSON(w, http.StatusOK, t)
}

// GetTenantByCode returns a specific tenant by code
func (h *TenantsHandler) GetTenantByCode(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	code := vars["code"]

	query := `
		SELECT 
			t._id, t.code, t.data_region, t.compliance_level, t.parent_tenant_id, t.path,
			t.name, t.tier, t.billing_type, t.timezone,
			t.profile, t.settings,
			t.status, t.created_at, t.updated_at, t.deleted_at, t.version
		FROM tenants t
		WHERE t.code = $1 AND t.deleted_at IS NULL
	`

	var t Tenant
	var profileJSON, settingsJSON []byte

	err := h.db.QueryRow(query, code).Scan(
		&t.ID, &t.Code, &t.DataRegion, &t.ComplianceLevel, &t.ParentTenantID, &t.Path,
		&t.Name, &t.Tier, &t.BillingType, &t.Timezone,
		&profileJSON, &settingsJSON,
		&t.Status, &t.CreatedAt, &t.UpdatedAt, &t.DeletedAt, &t.Version,
	)

	if err == sql.ErrNoRows {
		respondError(w, http.StatusNotFound, "Tenant not found", nil)
		return
	}
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Database error", err)
		return
	}

	json.Unmarshal(profileJSON, &t.Profile)
	json.Unmarshal(settingsJSON, &t.Settings)

	respondJSON(w, http.StatusOK, t)
}

// CreateTenant creates a new tenant
// @Summary Create new tenant
// @Description Create a new tenant
// @Tags Tenants
// @Accept json
// @Produce json
// @Param tenant body CreateTenantRequest true "Tenant data"
// @Success 201 {object} Tenant
// @Failure 400 {object} map[string]string
// @Router /api/tenants [post]
func (h *TenantsHandler) CreateTenant(w http.ResponseWriter, r *http.Request) {
	var req CreateTenantRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid JSON", err)
		return
	}

	// Validate code format (lowercase, alphanumeric, dash)
	codeRegex := regexp.MustCompile(`^[a-z0-9-]+$`)
	if !codeRegex.MatchString(req.Code) {
		respondError(w, http.StatusBadRequest, "Code must be lowercase alphanumeric with dashes only", nil)
		return
	}

	// Set defaults
	if req.DataRegion == "" {
		req.DataRegion = "ap-southeast-1"
	}
	if req.ComplianceLevel == "" {
		req.ComplianceLevel = "STANDARD"
	}
	if req.BillingType == "" {
		req.BillingType = "POSTPAID"
	}
	if req.Timezone == "" {
		req.Timezone = "UTC"
	}
	if req.Profile == nil {
		req.Profile = make(map[string]interface{})
	}
	if req.Settings == nil {
		req.Settings = make(map[string]interface{})
	}

	// Encode JSONB
	profileJSON, _ := json.Marshal(req.Profile)
	settingsJSON, _ := json.Marshal(req.Settings)

	// Generate UUID
	tenantID := uuid.New().String()

	// Insert
	query := `
		INSERT INTO tenants (
			_id, code, name, tier, data_region, compliance_level, billing_type, timezone,
			parent_tenant_id, profile, settings, status
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'TRIAL'
		)
		RETURNING _id, code, name, tier, data_region, compliance_level, billing_type, timezone,
			parent_tenant_id, path, profile, settings, status, created_at, updated_at, version
	`

	var t Tenant
	var returnedProfileJSON, returnedSettingsJSON []byte

	err := h.db.QueryRow(
		query,
		tenantID, req.Code, req.Name, req.Tier, req.DataRegion, req.ComplianceLevel,
		req.BillingType, req.Timezone, req.ParentTenantID, profileJSON, settingsJSON,
	).Scan(
		&t.ID, &t.Code, &t.Name, &t.Tier, &t.DataRegion, &t.ComplianceLevel,
		&t.BillingType, &t.Timezone, &t.ParentTenantID, &t.Path,
		&returnedProfileJSON, &returnedSettingsJSON,
		&t.Status, &t.CreatedAt, &t.UpdatedAt, &t.Version,
	)

	if err != nil {
		if pqErr, ok := err.(*pq.Error); ok {
			if pqErr.Code == "23505" { // unique violation
				respondError(w, http.StatusConflict, "Tenant code already exists", err)
				return
			}
		}
		respondError(w, http.StatusInternalServerError, "Database error", err)
		return
	}

	json.Unmarshal(returnedProfileJSON, &t.Profile)
	json.Unmarshal(returnedSettingsJSON, &t.Settings)

	respondJSON(w, http.StatusCreated, t)
}

// UpdateTenant updates tenant information
func (h *TenantsHandler) UpdateTenant(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	tenantID := vars["id"]

	// Validate UUID
	if _, err := uuid.Parse(tenantID); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid tenant ID", err)
		return
	}

	var req UpdateTenantRequest
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
	if req.Status != nil {
		updates = append(updates, fmt.Sprintf("status = $%d", argIdx))
		args = append(args, strings.ToUpper(*req.Status))
		argIdx++
	}
	if req.Tier != nil {
		updates = append(updates, fmt.Sprintf("tier = $%d", argIdx))
		args = append(args, *req.Tier)
		argIdx++
	}
	if req.BillingType != nil {
		updates = append(updates, fmt.Sprintf("billing_type = $%d", argIdx))
		args = append(args, *req.BillingType)
		argIdx++
	}
	if req.Timezone != nil {
		updates = append(updates, fmt.Sprintf("timezone = $%d", argIdx))
		args = append(args, *req.Timezone)
		argIdx++
	}
	if req.DataRegion != nil {
		updates = append(updates, fmt.Sprintf("data_region = $%d", argIdx))
		args = append(args, *req.DataRegion)
		argIdx++
	}
	if req.ComplianceLevel != nil {
		updates = append(updates, fmt.Sprintf("compliance_level = $%d", argIdx))
		args = append(args, *req.ComplianceLevel)
		argIdx++
	}
	if req.ParentTenantID != nil {
		updates = append(updates, fmt.Sprintf("parent_tenant_id = $%d", argIdx))
		args = append(args, *req.ParentTenantID)
		argIdx++
	}
	if req.Profile != nil {
		profileJSON, _ := json.Marshal(req.Profile)
		updates = append(updates, fmt.Sprintf("profile = $%d", argIdx))
		args = append(args, profileJSON)
		argIdx++
	}
	if req.Settings != nil {
		settingsJSON, _ := json.Marshal(req.Settings)
		updates = append(updates, fmt.Sprintf("settings = $%d", argIdx))
		args = append(args, settingsJSON)
		argIdx++
	}

	if len(updates) == 0 {
		respondError(w, http.StatusBadRequest, "No fields to update", nil)
		return
	}

	// Add tenant ID
	args = append(args, tenantID)

	query := fmt.Sprintf(`
		UPDATE tenants 
		SET %s, updated_at = NOW(), version = version + 1
		WHERE _id = $%d AND deleted_at IS NULL
		RETURNING _id, code, name, tier, data_region, compliance_level, billing_type, timezone,
			parent_tenant_id, path, profile, settings, status, created_at, updated_at, version
	`, strings.Join(updates, ", "), argIdx)

	var t Tenant
	var profileJSON, settingsJSON []byte

	err := h.db.QueryRow(query, args...).Scan(
		&t.ID, &t.Code, &t.Name, &t.Tier, &t.DataRegion, &t.ComplianceLevel,
		&t.BillingType, &t.Timezone, &t.ParentTenantID, &t.Path,
		&profileJSON, &settingsJSON,
		&t.Status, &t.CreatedAt, &t.UpdatedAt, &t.Version,
	)

	if err == sql.ErrNoRows {
		respondError(w, http.StatusNotFound, "Tenant not found", nil)
		return
	}
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Database error", err)
		return
	}

	json.Unmarshal(profileJSON, &t.Profile)
	json.Unmarshal(settingsJSON, &t.Settings)

	respondJSON(w, http.StatusOK, t)
}

// DeleteTenant soft-deletes a tenant
func (h *TenantsHandler) DeleteTenant(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	tenantID := vars["id"]

	// Validate UUID
	if _, err := uuid.Parse(tenantID); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid tenant ID", err)
		return
	}

	query := `
		UPDATE tenants 
		SET deleted_at = NOW(), updated_at = NOW(), version = version + 1
		WHERE _id = $1 AND deleted_at IS NULL
		RETURNING _id
	`

	var id string
	err := h.db.QueryRow(query, tenantID).Scan(&id)

	if err == sql.ErrNoRows {
		respondError(w, http.StatusNotFound, "Tenant not found", nil)
		return
	}
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Database error", err)
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"message": "Tenant deleted successfully",
		"id":      id,
	})
}

// UpdateTenantStatus updates tenant status only
func (h *TenantsHandler) UpdateTenantStatus(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	tenantID := vars["id"]

	var req struct {
		Status string `json:"status" validate:"required,oneof=TRIAL ACTIVE SUSPENDED CANCELLED"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid JSON", err)
		return
	}

	query := `
		UPDATE tenants 
		SET status = $1, updated_at = NOW(), version = version + 1
		WHERE _id = $2 AND deleted_at IS NULL
		RETURNING status, updated_at
	`

	var status string
	var updatedAt time.Time
	err := h.db.QueryRow(query, strings.ToUpper(req.Status), tenantID).Scan(&status, &updatedAt)

	if err == sql.ErrNoRows {
		respondError(w, http.StatusNotFound, "Tenant not found", nil)
		return
	}
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Database error", err)
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"message":    "Status updated successfully",
		"status":     status,
		"updated_at": updatedAt,
	})
}

// GetTenantMembers returns members of a tenant
func (h *TenantsHandler) GetTenantMembers(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	tenantID := vars["id"]

	query := `
		SELECT 
			tm._id, tm.user_id, tm.display_name, tm.status, tm.joined_at,
			u.email, u.full_name, u.avatar_url
		FROM tenant_members tm
		JOIN users u ON u._id = tm.user_id
		WHERE tm.tenant_id = $1 AND tm.deleted_at IS NULL AND u.deleted_at IS NULL
		ORDER BY tm.joined_at DESC
	`

	rows, err := h.db.Query(query, tenantID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Database error", err)
		return
	}
	defer rows.Close()

	members := []map[string]interface{}{}
	for rows.Next() {
		var memberID, userID, displayName, status, email, fullName string
		var avatarURL *string
		var joinedAt time.Time

		err := rows.Scan(&memberID, &userID, &displayName, &status, &joinedAt, &email, &fullName, &avatarURL)
		if err != nil {
			continue
		}

		members = append(members, map[string]interface{}{
			"_id":          memberID,
			"user_id":      userID,
			"display_name": displayName,
			"status":       status,
			"joined_at":    joinedAt,
			"user": map[string]interface{}{
				"email":      email,
				"full_name":  fullName,
				"avatar_url": avatarURL,
			},
		})
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"data": members,
	})
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

func respondJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func respondError(w http.ResponseWriter, status int, message string, err error) {
	response := map[string]interface{}{
		"error":   message,
		"success": false,
	}
	if err != nil && status >= 500 {
		// Only show error details for server errors in development
		response["details"] = err.Error()
	}
	respondJSON(w, status, response)
}

func getIntQueryParam(r *http.Request, key string, defaultValue int) int {
	val := r.URL.Query().Get(key)
	if val == "" {
		return defaultValue
	}
	var result int
	if _, err := fmt.Sscanf(val, "%d", &result); err != nil {
		return defaultValue
	}
	return result
}
