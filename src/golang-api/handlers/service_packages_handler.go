/**
 * Service Packages API Handler
 * Handles CRUD operations for service packages
 * Aligned with DatabaseCommand.md schema:
 * - Table: service_packages
 * - Primary Key: _id (UUID)
 * - Foreign Key: saas_product_id -> products(_id)
 * - Fields: code, name, description, price_amount, currency_code
 * - JSONB: entitlements_config
 * - Status: ACTIVE, INACTIVE, ARCHIVED
 * - Boolean: is_public
 * - Audit: created_at, updated_at, deleted_at, version
 */

package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type ServicePackagesHandler struct {
	db *sql.DB
}

func NewServicePackagesHandler(db *sql.DB) *ServicePackagesHandler {
	return &ServicePackagesHandler{db: db}
}

// ==================== TYPES ====================

type ServicePackage struct {
	ID                  string                 `json:"_id"`
	SaaSProductID       string                 `json:"saas_product_id"`
	Code                string                 `json:"code"`
	Name                string                 `json:"name"`
	Description         *string                `json:"description,omitempty"`
	PriceAmount         float64                `json:"price_amount"`
	CurrencyCode        string                 `json:"currency_code"`
	EntitlementsConfig  map[string]interface{} `json:"entitlements_config"`
	Status              string                 `json:"status"`
	IsPublic            bool                   `json:"is_public"`
	CreatedAt           time.Time              `json:"created_at"`
	UpdatedAt           time.Time              `json:"updated_at"`
	DeletedAt           *time.Time             `json:"deleted_at,omitempty"`
	Version             int64                  `json:"version"`
}

type CreateServicePackageRequest struct {
	SaaSProductID      string                 `json:"saas_product_id" binding:"required"`
	Code               string                 `json:"code" binding:"required,min=1,max=50"`
	Name               string                 `json:"name" binding:"required,min=1,max=255"`
	Description        *string                `json:"description"`
	PriceAmount        float64                `json:"price_amount" binding:"gte=0"`
	CurrencyCode       string                 `json:"currency_code"`
	EntitlementsConfig map[string]interface{} `json:"entitlements_config"`
	IsPublic           *bool                  `json:"is_public"`
}

type UpdateServicePackageRequest struct {
	Code               *string                 `json:"code,omitempty"`
	Name               *string                 `json:"name,omitempty"`
	Description        *string                 `json:"description"`
	PriceAmount        *float64                `json:"price_amount,omitempty"`
	CurrencyCode       *string                 `json:"currency_code,omitempty"`
	EntitlementsConfig *map[string]interface{} `json:"entitlements_config,omitempty"`
	Status             *string                 `json:"status,omitempty"`
	IsPublic           *bool                   `json:"is_public,omitempty"`
	Version            int64                   `json:"version" binding:"required"`
}

type ServicePackageStats struct {
	Total        int                `json:"total"`
	Active       int                `json:"active"`
	Inactive     int                `json:"inactive"`
	Archived     int                `json:"archived"`
	Public       int                `json:"public"`
	Private      int                `json:"private"`
	ByStatus     map[string]int     `json:"by_status"`
	TotalRevenue float64            `json:"total_revenue"`
}

type ClonePackageRequest struct {
	Code string `json:"code" binding:"required"`
}

// ==================== HANDLERS ====================

// GetAll godoc
// @Summary List service packages
// @Description Get list of service packages with optional filtering
// @Tags service-packages
// @Accept json
// @Produce json
// @Param product_id query string false "Filter by product ID"
// @Param status query string false "Filter by status (ACTIVE, INACTIVE, ARCHIVED)"
// @Param is_public query bool false "Filter by public status"
// @Param search query string false "Search in name and code"
// @Param limit query int false "Limit results" default(50)
// @Param offset query int false "Offset results" default(0)
// @Success 200 {array} ServicePackage
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /packages [get]
func (h *ServicePackagesHandler) GetAll(c *gin.Context) {
	// Query parameters
	productID := c.Query("product_id")
	status := c.Query("status")
	isPublicStr := c.Query("is_public")
	search := c.Query("search")
	limit := c.DefaultQuery("limit", "50")
	offset := c.DefaultQuery("offset", "0")

	// Build query
	query := `
		SELECT _id, saas_product_id, code, name, description,
		       price_amount, currency_code, entitlements_config,
		       status, is_public,
		       created_at, updated_at, deleted_at, version
		FROM service_packages
		WHERE deleted_at IS NULL
	`
	args := []interface{}{}
	argIndex := 1

	// Apply filters
	if productID != "" {
		query += " AND saas_product_id = $" + string(rune(argIndex))
		args = append(args, productID)
		argIndex++
	}

	if status != "" {
		query += " AND status = $" + string(rune(argIndex))
		args = append(args, status)
		argIndex++
	}

	if isPublicStr != "" {
		query += " AND is_public = $" + string(rune(argIndex))
		args = append(args, isPublicStr == "true")
		argIndex++
	}

	if search != "" {
		query += " AND (name ILIKE $" + string(rune(argIndex)) + " OR code ILIKE $" + string(rune(argIndex)) + ")"
		args = append(args, "%"+search+"%")
		argIndex++
	}

	query += " ORDER BY created_at DESC"
	query += " LIMIT $" + string(rune(argIndex)) + " OFFSET $" + string(rune(argIndex+1))
	args = append(args, limit, offset)

	// Execute query
	rows, err := h.db.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error: " + err.Error()})
		return
	}
	defer rows.Close()

	// Parse results
	packages := []ServicePackage{}
	for rows.Next() {
		var pkg ServicePackage
		var entitlementsJSON []byte

		err := rows.Scan(
			&pkg.ID, &pkg.SaaSProductID, &pkg.Code, &pkg.Name, &pkg.Description,
			&pkg.PriceAmount, &pkg.CurrencyCode, &entitlementsJSON,
			&pkg.Status, &pkg.IsPublic,
			&pkg.CreatedAt, &pkg.UpdatedAt, &pkg.DeletedAt, &pkg.Version,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Scan error: " + err.Error()})
			return
		}

		// Parse JSONB
		if entitlementsJSON != nil {
			json.Unmarshal(entitlementsJSON, &pkg.EntitlementsConfig)
		}

		packages = append(packages, pkg)
	}

	c.JSON(http.StatusOK, packages)
}

// GetByID godoc
// @Summary Get service package by ID
// @Description Get detailed information about a service package
// @Tags service-packages
// @Accept json
// @Produce json
// @Param id path string true "Package ID"
// @Success 200 {object} ServicePackage
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /packages/{id} [get]
func (h *ServicePackagesHandler) GetByID(c *gin.Context) {
	id := c.Param("id")

	query := `
		SELECT _id, saas_product_id, code, name, description,
		       price_amount, currency_code, entitlements_config,
		       status, is_public,
		       created_at, updated_at, deleted_at, version
		FROM service_packages
		WHERE _id = $1 AND deleted_at IS NULL
	`

	var pkg ServicePackage
	var entitlementsJSON []byte

	err := h.db.QueryRow(query, id).Scan(
		&pkg.ID, &pkg.SaaSProductID, &pkg.Code, &pkg.Name, &pkg.Description,
		&pkg.PriceAmount, &pkg.CurrencyCode, &entitlementsJSON,
		&pkg.Status, &pkg.IsPublic,
		&pkg.CreatedAt, &pkg.UpdatedAt, &pkg.DeletedAt, &pkg.Version,
	)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Package not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error: " + err.Error()})
		return
	}

	// Parse JSONB
	if entitlementsJSON != nil {
		json.Unmarshal(entitlementsJSON, &pkg.EntitlementsConfig)
	}

	c.JSON(http.StatusOK, pkg)
}

// Create godoc
// @Summary Create new service package
// @Description Create a new service package
// @Tags service-packages
// @Accept json
// @Produce json
// @Param package body CreateServicePackageRequest true "Package data"
// @Success 201 {object} ServicePackage
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /packages [post]
func (h *ServicePackagesHandler) Create(c *gin.Context) {
	var req CreateServicePackageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Generate UUID v7
	id := uuid.New().String()
	now := time.Now()

	// Default values
	if req.CurrencyCode == "" {
		req.CurrencyCode = "VND"
	}
	isPublic := true
	if req.IsPublic != nil {
		isPublic = *req.IsPublic
	}
	if req.EntitlementsConfig == nil {
		req.EntitlementsConfig = make(map[string]interface{})
	}

	// Marshal JSONB
	entitlementsJSON, err := json.Marshal(req.EntitlementsConfig)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "JSON marshal error"})
		return
	}

	query := `
		INSERT INTO service_packages (
			_id, saas_product_id, code, name, description,
			price_amount, currency_code, entitlements_config,
			status, is_public,
			created_at, updated_at, version
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 1)
		RETURNING _id, created_at, updated_at, version
	`

	var pkg ServicePackage
	pkg.SaaSProductID = req.SaaSProductID
	pkg.Code = req.Code
	pkg.Name = req.Name
	pkg.Description = req.Description
	pkg.PriceAmount = req.PriceAmount
	pkg.CurrencyCode = req.CurrencyCode
	pkg.EntitlementsConfig = req.EntitlementsConfig
	pkg.Status = "ACTIVE"
	pkg.IsPublic = isPublic

	err = h.db.QueryRow(
		query,
		id, req.SaaSProductID, req.Code, req.Name, req.Description,
		req.PriceAmount, req.CurrencyCode, entitlementsJSON,
		"ACTIVE", isPublic,
		now, now,
	).Scan(&pkg.ID, &pkg.CreatedAt, &pkg.UpdatedAt, &pkg.Version)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Insert error: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, pkg)
}

// Update godoc
// @Summary Update service package
// @Description Update an existing service package
// @Tags service-packages
// @Accept json
// @Produce json
// @Param id path string true "Package ID"
// @Param package body UpdateServicePackageRequest true "Package data"
// @Success 200 {object} ServicePackage
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 409 {object} ErrorResponse "Version conflict"
// @Failure 500 {object} ErrorResponse
// @Router /packages/{id} [put]
func (h *ServicePackagesHandler) Update(c *gin.Context) {
	id := c.Param("id")

	var req UpdateServicePackageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Build dynamic update query
	query := "UPDATE service_packages SET updated_at = $1, version = version + 1"
	args := []interface{}{time.Now()}
	argIndex := 2

	if req.Code != nil {
		query += ", code = $" + string(rune(argIndex))
		args = append(args, *req.Code)
		argIndex++
	}
	if req.Name != nil {
		query += ", name = $" + string(rune(argIndex))
		args = append(args, *req.Name)
		argIndex++
	}
	if req.Description != nil {
		query += ", description = $" + string(rune(argIndex))
		args = append(args, *req.Description)
		argIndex++
	}
	if req.PriceAmount != nil {
		query += ", price_amount = $" + string(rune(argIndex))
		args = append(args, *req.PriceAmount)
		argIndex++
	}
	if req.CurrencyCode != nil {
		query += ", currency_code = $" + string(rune(argIndex))
		args = append(args, *req.CurrencyCode)
		argIndex++
	}
	if req.EntitlementsConfig != nil {
		entitlementsJSON, _ := json.Marshal(*req.EntitlementsConfig)
		query += ", entitlements_config = $" + string(rune(argIndex))
		args = append(args, entitlementsJSON)
		argIndex++
	}
	if req.Status != nil {
		query += ", status = $" + string(rune(argIndex))
		args = append(args, *req.Status)
		argIndex++
	}
	if req.IsPublic != nil {
		query += ", is_public = $" + string(rune(argIndex))
		args = append(args, *req.IsPublic)
		argIndex++
	}

	query += " WHERE _id = $" + string(rune(argIndex)) + " AND version = $" + string(rune(argIndex+1)) + " AND deleted_at IS NULL"
	args = append(args, id, req.Version)

	result, err := h.db.Exec(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Update error: " + err.Error()})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "Version conflict or package not found"})
		return
	}

	// Fetch updated package
	h.GetByID(c)
}

// Delete godoc
// @Summary Delete service package (soft delete)
// @Description Soft delete a service package
// @Tags service-packages
// @Accept json
// @Produce json
// @Param id path string true "Package ID"
// @Success 204 "No Content"
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /packages/{id} [delete]
func (h *ServicePackagesHandler) Delete(c *gin.Context) {
	id := c.Param("id")

	query := `
		UPDATE service_packages
		SET deleted_at = $1
		WHERE _id = $2 AND deleted_at IS NULL
	`

	result, err := h.db.Exec(query, time.Now(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Delete error: " + err.Error()})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Package not found"})
		return
	}

	c.Status(http.StatusNoContent)
}

// GetStats godoc
// @Summary Get service packages statistics
// @Description Get statistics about service packages
// @Tags service-packages
// @Accept json
// @Produce json
// @Success 200 {object} ServicePackageStats
// @Failure 500 {object} ErrorResponse
// @Router /packages/stats [get]
func (h *ServicePackagesHandler) GetStats(c *gin.Context) {
	query := `
		SELECT
			COUNT(*) as total,
			COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as active,
			COUNT(CASE WHEN status = 'INACTIVE' THEN 1 END) as inactive,
			COUNT(CASE WHEN status = 'ARCHIVED' THEN 1 END) as archived,
			COUNT(CASE WHEN is_public = true THEN 1 END) as public,
			COUNT(CASE WHEN is_public = false THEN 1 END) as private,
			COALESCE(SUM(price_amount), 0) as total_revenue
		FROM service_packages
		WHERE deleted_at IS NULL
	`

	var stats ServicePackageStats
	err := h.db.QueryRow(query).Scan(
		&stats.Total,
		&stats.Active,
		&stats.Inactive,
		&stats.Archived,
		&stats.Public,
		&stats.Private,
		&stats.TotalRevenue,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Stats error: " + err.Error()})
		return
	}

	// Get by status breakdown
	stats.ByStatus = map[string]int{
		"ACTIVE":   stats.Active,
		"INACTIVE": stats.Inactive,
		"ARCHIVED": stats.Archived,
	}

	c.JSON(http.StatusOK, stats)
}

// Clone godoc
// @Summary Clone service package
// @Description Create a copy of an existing service package
// @Tags service-packages
// @Accept json
// @Produce json
// @Param id path string true "Source Package ID"
// @Param clone body ClonePackageRequest true "Clone data"
// @Success 201 {object} ServicePackage
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /packages/{id}/clone [post]
func (h *ServicePackagesHandler) Clone(c *gin.Context) {
	sourceID := c.Param("id")

	var req ClonePackageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get source package
	query := `
		SELECT saas_product_id, name, description, price_amount, currency_code,
		       entitlements_config, is_public
		FROM service_packages
		WHERE _id = $1 AND deleted_at IS NULL
	`

	var (
		productID          string
		name               string
		description        *string
		priceAmount        float64
		currencyCode       string
		entitlementsJSON   []byte
		isPublic           bool
	)

	err := h.db.QueryRow(query, sourceID).Scan(
		&productID, &name, &description, &priceAmount, &currencyCode,
		&entitlementsJSON, &isPublic,
	)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Source package not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error: " + err.Error()})
		return
	}

	// Create new package
	newID := uuid.New().String()
	now := time.Now()
	newName := name + " (Copy)"

	insertQuery := `
		INSERT INTO service_packages (
			_id, saas_product_id, code, name, description,
			price_amount, currency_code, entitlements_config,
			status, is_public,
			created_at, updated_at, version
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 1)
		RETURNING _id, created_at, updated_at, version
	`

	var pkg ServicePackage
	err = h.db.QueryRow(
		insertQuery,
		newID, productID, req.Code, newName, description,
		priceAmount, currencyCode, entitlementsJSON,
		"INACTIVE", isPublic,
		now, now,
	).Scan(&pkg.ID, &pkg.CreatedAt, &pkg.UpdatedAt, &pkg.Version)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Clone error: " + err.Error()})
		return
	}

	// Populate response
	pkg.SaaSProductID = productID
	pkg.Code = req.Code
	pkg.Name = newName
	pkg.Description = description
	pkg.PriceAmount = priceAmount
	pkg.CurrencyCode = currencyCode
	pkg.Status = "INACTIVE"
	pkg.IsPublic = isPublic
	
	if entitlementsJSON != nil {
		json.Unmarshal(entitlementsJSON, &pkg.EntitlementsConfig)
	}

	c.JSON(http.StatusCreated, pkg)
}