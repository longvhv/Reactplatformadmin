package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

/**
 * Tenants Handler
 * Quản lý tenants (multi-tenancy SaaS)
 * 
 * Features:
 * - CRUD operations
 * - Hierarchical structure (parent_tenant_id)
 * - Data region & compliance level
 * - Tier management (FREE, PRO, ENTERPRISE, PARTNER_*)
 * - JSONB profile & settings
 * - Soft delete
 * 
 * Database: tenants table
 * Primary Key: _id (UUID v7)
 * Unique: code (slug/subdomain)
 */

type Tenant struct {
	ID              string          `json:"_id" db:"_id"`
	Code            string          `json:"code" db:"code"`
	DataRegion      string          `json:"data_region" db:"data_region"`
	ComplianceLevel string          `json:"compliance_level" db:"compliance_level"`
	ParentTenantID  *string         `json:"parent_tenant_id" db:"parent_tenant_id"`
	Path            *string         `json:"path" db:"path"`
	Name            string          `json:"name" db:"name"`
	Tier            string          `json:"tier" db:"tier"`
	BillingType     string          `json:"billing_type" db:"billing_type"`
	Timezone        string          `json:"timezone" db:"timezone"`
	Profile         json.RawMessage `json:"profile" db:"profile"`
	Settings        json.RawMessage `json:"settings" db:"settings"`
	Status          string          `json:"status" db:"status"`
	CreatedAt       time.Time       `json:"created_at" db:"created_at"`
	UpdatedAt       time.Time       `json:"updated_at" db:"updated_at"`
	DeletedAt       *time.Time      `json:"deleted_at,omitempty" db:"deleted_at"`
	Version         int64           `json:"version" db:"version"`
}

type TenantHandler struct {
	db *sql.DB
}

func NewTenantHandler(db *sql.DB) *TenantHandler {
	return &TenantHandler{db: db}
}

/**
 * GET /api/v1/tenants
 * List tenants with filters
 * Query: status, tier, data_region, search, limit, offset
 */
func (h *TenantHandler) GetAll(c *gin.Context) {
	status := c.Query("status")
	tier := c.Query("tier")
	region := c.Query("data_region")
	search := c.Query("search")

	query := `
		SELECT _id, code, data_region, compliance_level, parent_tenant_id, path,
		       name, tier, billing_type, timezone, profile, settings,
		       status, created_at, updated_at, version
		FROM tenants
		WHERE deleted_at IS NULL
	`
	args := []interface{}{}
	argCount := 1

	if status != "" {
		query += ` AND status = $` + string(rune(argCount+'0'))
		args = append(args, status)
		argCount++
	}
	if tier != "" {
		query += ` AND tier = $` + string(rune(argCount+'0'))
		args = append(args, tier)
		argCount++
	}
	if region != "" {
		query += ` AND data_region = $` + string(rune(argCount+'0'))
		args = append(args, region)
		argCount++
	}
	if search != "" {
		query += ` AND (name ILIKE $` + string(rune(argCount+'0')) + ` OR code ILIKE $` + string(rune(argCount+'0')) + `)`
		args = append(args, "%"+search+"%")
		argCount++
	}

	query += ` ORDER BY created_at DESC`

	rows, err := h.db.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch tenants: " + err.Error()})
		return
	}
	defer rows.Close()

	tenants := []Tenant{}
	for rows.Next() {
		var t Tenant
		err := rows.Scan(
			&t.ID, &t.Code, &t.DataRegion, &t.ComplianceLevel, &t.ParentTenantID, &t.Path,
			&t.Name, &t.Tier, &t.BillingType, &t.Timezone, &t.Profile, &t.Settings,
			&t.Status, &t.CreatedAt, &t.UpdatedAt, &t.Version,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan tenant: " + err.Error()})
			return
		}
		tenants = append(tenants, t)
	}

	c.JSON(http.StatusOK, tenants)
}

/**
 * GET /api/v1/tenants/:id
 * Get tenant by ID
 */
func (h *TenantHandler) GetByID(c *gin.Context) {
	id := c.Param("id")

	query := `
		SELECT _id, code, data_region, compliance_level, parent_tenant_id, path,
		       name, tier, billing_type, timezone, profile, settings,
		       status, created_at, updated_at, version
		FROM tenants
		WHERE _id = $1 AND deleted_at IS NULL
	`

	var t Tenant
	err := h.db.QueryRow(query, id).Scan(
		&t.ID, &t.Code, &t.DataRegion, &t.ComplianceLevel, &t.ParentTenantID, &t.Path,
		&t.Name, &t.Tier, &t.BillingType, &t.Timezone, &t.Profile, &t.Settings,
		&t.Status, &t.CreatedAt, &t.UpdatedAt, &t.Version,
	)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Tenant not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch tenant: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, t)
}

/**
 * POST /api/v1/tenants
 * Create tenant
 * Body: { code, name, tier?, status?, data_region?, profile?, settings? }
 */
func (h *TenantHandler) Create(c *gin.Context) {
	var req struct {
		Code            string          `json:"code" binding:"required"`
		Name            string          `json:"name" binding:"required"`
		Tier            string          `json:"tier"`
		Status          string          `json:"status"`
		DataRegion      string          `json:"data_region"`
		ComplianceLevel string          `json:"compliance_level"`
		BillingType     string          `json:"billing_type"`
		Timezone        string          `json:"timezone"`
		ParentTenantID  *string         `json:"parent_tenant_id"`
		Profile         json.RawMessage `json:"profile"`
		Settings        json.RawMessage `json:"settings"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	// Check duplicate code
	var exists bool
	err := h.db.QueryRow(
		"SELECT EXISTS(SELECT 1 FROM tenants WHERE code = $1 AND deleted_at IS NULL)",
		req.Code,
	).Scan(&exists)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check duplicate: " + err.Error()})
		return
	}
	if exists {
		c.JSON(http.StatusConflict, gin.H{"error": "Tenant code already exists"})
		return
	}

	// Defaults
	tier := "FREE"
	if req.Tier != "" {
		tier = req.Tier
	}
	status := "TRIAL"
	if req.Status != "" {
		status = req.Status
	}
	region := "ap-southeast-1"
	if req.DataRegion != "" {
		region = req.DataRegion
	}
	compliance := "STANDARD"
	if req.ComplianceLevel != "" {
		compliance = req.ComplianceLevel
	}
	billing := "POSTPAID"
	if req.BillingType != "" {
		billing = req.BillingType
	}
	tz := "UTC"
	if req.Timezone != "" {
		tz = req.Timezone
	}

	profile := req.Profile
	if profile == nil {
		profile = json.RawMessage("{}")
	}
	settings := req.Settings
	if settings == nil {
		settings = json.RawMessage("{}")
	}

	// Generate UUID
	id := uuid.New().String()
	now := time.Now()

	query := `
		INSERT INTO tenants (
			_id, code, name, tier, status, data_region, compliance_level,
			billing_type, timezone, parent_tenant_id, profile, settings,
			created_at, updated_at, version
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 1)
		RETURNING _id, created_at
	`

	var t Tenant
	err = h.db.QueryRow(
		query, id, req.Code, req.Name, tier, status, region, compliance,
		billing, tz, req.ParentTenantID, profile, settings, now, now,
	).Scan(&t.ID, &t.CreatedAt)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create tenant: " + err.Error()})
		return
	}

	t.Code = req.Code
	t.Name = req.Name
	t.Tier = tier
	t.Status = status

	c.JSON(http.StatusCreated, t)
}

/**
 * PATCH /api/v1/tenants/:id
 * Update tenant
 * Body: { name?, tier?, status?, profile?, settings?, ... }
 */
func (h *TenantHandler) Update(c *gin.Context) {
	id := c.Param("id")

	var req struct {
		Name            *string          `json:"name"`
		Tier            *string          `json:"tier"`
		Status          *string          `json:"status"`
		DataRegion      *string          `json:"data_region"`
		ComplianceLevel *string          `json:"compliance_level"`
		BillingType     *string          `json:"billing_type"`
		Timezone        *string          `json:"timezone"`
		Profile         *json.RawMessage `json:"profile"`
		Settings        *json.RawMessage `json:"settings"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	// Check exists
	var exists bool
	err := h.db.QueryRow(
		"SELECT EXISTS(SELECT 1 FROM tenants WHERE _id = $1 AND deleted_at IS NULL)",
		id,
	).Scan(&exists)

	if err != nil || !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Tenant not found"})
		return
	}

	// Build dynamic update
	query := "UPDATE tenants SET updated_at = NOW(), version = version + 1"
	args := []interface{}{}
	argCount := 1

	if req.Name != nil {
		argCount++
		query += `, name = $` + string(rune(argCount+'0'-1))
		args = append(args, *req.Name)
	}
	if req.Tier != nil {
		argCount++
		query += `, tier = $` + string(rune(argCount+'0'-1))
		args = append(args, *req.Tier)
	}
	if req.Status != nil {
		argCount++
		query += `, status = $` + string(rune(argCount+'0'-1))
		args = append(args, *req.Status)
	}
	if req.DataRegion != nil {
		argCount++
		query += `, data_region = $` + string(rune(argCount+'0'-1))
		args = append(args, *req.DataRegion)
	}
	if req.ComplianceLevel != nil {
		argCount++
		query += `, compliance_level = $` + string(rune(argCount+'0'-1))
		args = append(args, *req.ComplianceLevel)
	}
	if req.BillingType != nil {
		argCount++
		query += `, billing_type = $` + string(rune(argCount+'0'-1))
		args = append(args, *req.BillingType)
	}
	if req.Timezone != nil {
		argCount++
		query += `, timezone = $` + string(rune(argCount+'0'-1))
		args = append(args, *req.Timezone)
	}
	if req.Profile != nil {
		argCount++
		query += `, profile = $` + string(rune(argCount+'0'-1))
		args = append(args, *req.Profile)
	}
	if req.Settings != nil {
		argCount++
		query += `, settings = $` + string(rune(argCount+'0'-1))
		args = append(args, *req.Settings)
	}

	args = append(args, id)
	query += ` WHERE _id = $` + string(rune(argCount+'0')) + ` AND deleted_at IS NULL RETURNING updated_at, version`

	var updatedAt time.Time
	var version int64
	err = h.db.QueryRow(query, args...).Scan(&updatedAt, &version)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update tenant: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "Tenant updated successfully",
		"updated_at": updatedAt,
		"version":    version,
	})
}

/**
 * DELETE /api/v1/tenants/:id
 * Soft delete tenant
 */
func (h *TenantHandler) Delete(c *gin.Context) {
	id := c.Param("id")

	query := `UPDATE tenants SET deleted_at = NOW() WHERE _id = $1 AND deleted_at IS NULL`

	result, err := h.db.Exec(query, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete tenant: " + err.Error()})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Tenant not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Tenant deleted successfully"})
}

/**
 * PATCH /api/v1/tenants/:id/status
 * Update tenant status only
 */
func (h *TenantHandler) UpdateStatus(c *gin.Context) {
	id := c.Param("id")

	var req struct {
		Status string `json:"status" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	query := `
		UPDATE tenants 
		SET status = $1, updated_at = NOW(), version = version + 1
		WHERE _id = $2 AND deleted_at IS NULL
		RETURNING updated_at, version
	`

	var updatedAt time.Time
	var version int64
	err := h.db.QueryRow(query, req.Status, id).Scan(&updatedAt, &version)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Tenant not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update status: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "Tenant status updated successfully",
		"status":     req.Status,
		"updated_at": updatedAt,
		"version":    version,
	})
}
