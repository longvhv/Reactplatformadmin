/**
 * Service Packages API Handler
 * Handles CRUD operations for service packages
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
)

type PackagesHandler struct {
	db *sql.DB
}

func NewPackagesHandler(db *sql.DB) *PackagesHandler {
	return &PackagesHandler{db: db}
}

// ==================== TYPES ====================

type ServicePackage struct {
	ID                 string                 `json:"_id"`
	ProductID          string                 `json:"product_id"`
	Code               string                 `json:"code"`
	Name               string                 `json:"name"`
	Description        *string                `json:"description,omitempty"`
	BillingCycle       string                 `json:"billing_cycle"`
	Price              float64                `json:"price"`
	Currency           string                 `json:"currency"`
	EntitlementsConfig map[string]interface{} `json:"entitlements_config"`
	IsActive           bool                   `json:"is_active"`
	IsPublic           bool                   `json:"is_public"`
	CreatedAt          time.Time              `json:"created_at"`
	UpdatedAt          time.Time              `json:"updated_at"`
	DeletedAt          *time.Time             `json:"deleted_at,omitempty"`
	Version            int64                  `json:"version"`
}

type CreatePackageRequest struct {
	ProductID          string                 `json:"product_id" binding:"required"`
	Code               string                 `json:"code" binding:"required,min=1,max=50"`
	Name               string                 `json:"name" binding:"required,min=1,max=255"`
	Description        *string                `json:"description"`
	BillingCycle       string                 `json:"billing_cycle" binding:"required,oneof=MONTHLY QUARTERLY YEARLY LIFETIME"`
	Price              float64                `json:"price" binding:"gte=0"`
	Currency           string                 `json:"currency" binding:"required,len=3"`
	EntitlementsConfig map[string]interface{} `json:"entitlements_config"`
}

type UpdatePackageRequest struct {
	Name               *string                 `json:"name,omitempty"`
	Description        *string                 `json:"description"`
	BillingCycle       *string                 `json:"billing_cycle,omitempty"`
	Price              *float64                `json:"price,omitempty"`
	Currency           *string                 `json:"currency,omitempty"`
	EntitlementsConfig *map[string]interface{} `json:"entitlements_config,omitempty"`
	IsActive           *bool                   `json:"is_active,omitempty"`
	IsPublic           *bool                   `json:"is_public,omitempty"`
}

// ==================== HANDLERS ====================

// GetAll godoc
// @Summary List service packages
// @Description Get list of service packages with filtering
// @Tags packages
// @Accept json
// @Produce json
// @Param product_id query string false "Filter by product ID"
// @Param billing_cycle query string false "Filter by billing cycle"
// @Param is_active query bool false "Filter by active status"
// @Param is_public query bool false "Filter by public status"
// @Param search query string false "Search in name and code"
// @Param limit query int false "Limit results" default(50)
// @Param offset query int false "Offset results" default(0)
// @Success 200 {array} ServicePackage
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /packages [get]
func (h *PackagesHandler) GetAll(c *gin.Context) {
	productID := c.Query("product_id")
	billingCycle := c.Query("billing_cycle")
	isActiveStr := c.Query("is_active")
	isPublicStr := c.Query("is_public")
	search := c.Query("search")
	limit := c.DefaultQuery("limit", "50")
	offset := c.DefaultQuery("offset", "0")

	query := `
		SELECT _id, product_id, code, name, description, billing_cycle,
		       price, currency, entitlements_config, is_active, is_public,
		       created_at, updated_at, deleted_at, version
		FROM service_packages
		WHERE deleted_at IS NULL
	`
	args := []interface{}{}
	argPos := 1

	if productID != "" {
		query += ` AND product_id = $` + fmt.Sprint(argPos)
		args = append(args, productID)
		argPos++
	}

	if billingCycle != "" {
		query += ` AND billing_cycle = $` + fmt.Sprint(argPos)
		args = append(args, billingCycle)
		argPos++
	}

	if isActiveStr != "" {
		isActive := isActiveStr == "true"
		query += ` AND is_active = $` + fmt.Sprint(argPos)
		args = append(args, isActive)
		argPos++
	}

	if isPublicStr != "" {
		isPublic := isPublicStr == "true"
		query += ` AND is_public = $` + fmt.Sprint(argPos)
		args = append(args, isPublic)
		argPos++
	}

	if search != "" {
		query += ` AND (LOWER(name) LIKE $` + fmt.Sprint(argPos) +
			` OR LOWER(code) LIKE $` + fmt.Sprint(argPos) + `)`
		args = append(args, "%"+strings.ToLower(search)+"%")
		argPos++
	}

	query += ` ORDER BY created_at DESC LIMIT $` + fmt.Sprint(argPos) +
		` OFFSET $` + fmt.Sprint(argPos+1)
	args = append(args, limit, offset)

	rows, err := h.db.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch packages: " + err.Error(),
		})
		return
	}
	defer rows.Close()

	packages := []ServicePackage{}
	for rows.Next() {
		var p ServicePackage
		var entitlementsJSON []byte

		err := rows.Scan(
			&p.ID, &p.ProductID, &p.Code, &p.Name, &p.Description,
			&p.BillingCycle, &p.Price, &p.Currency, &entitlementsJSON,
			&p.IsActive, &p.IsPublic, &p.CreatedAt, &p.UpdatedAt,
			&p.DeletedAt, &p.Version,
		)
		if err != nil {
			continue
		}

		if len(entitlementsJSON) > 0 {
			json.Unmarshal(entitlementsJSON, &p.EntitlementsConfig)
		}

		packages = append(packages, p)
	}

	c.JSON(http.StatusOK, packages)
}

// GetByID godoc
// @Summary Get package by ID
// @Description Get a single service package by ID
// @Tags packages
// @Accept json
// @Produce json
// @Param id path string true "Package ID"
// @Success 200 {object} ServicePackage
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /packages/{id} [get]
func (h *PackagesHandler) GetByID(c *gin.Context) {
	id := c.Param("id")

	if _, err := uuid.Parse(id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid package ID format",
		})
		return
	}

	query := `
		SELECT _id, product_id, code, name, description, billing_cycle,
		       price, currency, entitlements_config, is_active, is_public,
		       created_at, updated_at, deleted_at, version
		FROM service_packages
		WHERE _id = $1 AND deleted_at IS NULL
	`

	var p ServicePackage
	var entitlementsJSON []byte

	err := h.db.QueryRow(query, id).Scan(
		&p.ID, &p.ProductID, &p.Code, &p.Name, &p.Description,
		&p.BillingCycle, &p.Price, &p.Currency, &entitlementsJSON,
		&p.IsActive, &p.IsPublic, &p.CreatedAt, &p.UpdatedAt,
		&p.DeletedAt, &p.Version,
	)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Package not found",
		})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch package: " + err.Error(),
		})
		return
	}

	if len(entitlementsJSON) > 0 {
		json.Unmarshal(entitlementsJSON, &p.EntitlementsConfig)
	}

	c.JSON(http.StatusOK, p)
}

// Create godoc
// @Summary Create package
// @Description Create a new service package
// @Tags packages
// @Accept json
// @Produce json
// @Param package body CreatePackageRequest true "Package data"
// @Success 201 {object} ServicePackage
// @Failure 400 {object} ErrorResponse
// @Failure 409 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /packages [post]
func (h *PackagesHandler) Create(c *gin.Context) {
	var req CreatePackageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request data: " + err.Error(),
		})
		return
	}

	// Validate billing cycle
	validCycles := map[string]bool{
		"MONTHLY": true, "QUARTERLY": true, "YEARLY": true, "LIFETIME": true,
	}
	if !validCycles[req.BillingCycle] {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid billing cycle",
		})
		return
	}

	// Check product exists
	var productExists bool
	checkProductQuery := `SELECT EXISTS(SELECT 1 FROM products WHERE _id = $1 AND deleted_at IS NULL)`
	err := h.db.QueryRow(checkProductQuery, req.ProductID).Scan(&productExists)
	if err != nil || !productExists {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Product not found or inactive",
		})
		return
	}

	// Check for duplicate code
	var exists bool
	checkQuery := `SELECT EXISTS(SELECT 1 FROM service_packages WHERE code = $1 AND deleted_at IS NULL)`
	err = h.db.QueryRow(checkQuery, req.Code).Scan(&exists)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to check duplicate",
		})
		return
	}

	if exists {
		c.JSON(http.StatusConflict, gin.H{
			"error": "Package with this code already exists",
		})
		return
	}

	id := uuid.New().String()

	entitlementsJSON := "{}"
	if req.EntitlementsConfig != nil {
		entitlementsBytes, _ := json.Marshal(req.EntitlementsConfig)
		entitlementsJSON = string(entitlementsBytes)
	}

	query := `
		INSERT INTO service_packages (
			_id, product_id, code, name, description, billing_cycle,
			price, currency, entitlements_config
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING _id, product_id, code, name, description, billing_cycle,
		          price, currency, entitlements_config, is_active, is_public,
		          created_at, updated_at, version
	`

	var p ServicePackage
	var returnedEntitlementsJSON []byte

	err = h.db.QueryRow(
		query,
		id, req.ProductID, req.Code, req.Name, req.Description,
		req.BillingCycle, req.Price, req.Currency, entitlementsJSON,
	).Scan(
		&p.ID, &p.ProductID, &p.Code, &p.Name, &p.Description,
		&p.BillingCycle, &p.Price, &p.Currency, &returnedEntitlementsJSON,
		&p.IsActive, &p.IsPublic, &p.CreatedAt, &p.UpdatedAt, &p.Version,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create package: " + err.Error(),
		})
		return
	}

	if len(returnedEntitlementsJSON) > 0 {
		json.Unmarshal(returnedEntitlementsJSON, &p.EntitlementsConfig)
	}

	c.JSON(http.StatusCreated, p)
}

// Update godoc
// @Summary Update package
// @Description Update an existing service package
// @Tags packages
// @Accept json
// @Produce json
// @Param id path string true "Package ID"
// @Param package body UpdatePackageRequest true "Package data"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /packages/{id} [patch]
func (h *PackagesHandler) Update(c *gin.Context) {
	id := c.Param("id")

	if _, err := uuid.Parse(id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid package ID format",
		})
		return
	}

	var req UpdatePackageRequest
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
		args = append(args, req.Description)
		argPos++
	}

	if req.BillingCycle != nil {
		validCycles := map[string]bool{
			"MONTHLY": true, "QUARTERLY": true, "YEARLY": true, "LIFETIME": true,
		}
		if !validCycles[*req.BillingCycle] {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Invalid billing cycle",
			})
			return
		}
		updates = append(updates, fmt.Sprintf("billing_cycle = $%d", argPos))
		args = append(args, *req.BillingCycle)
		argPos++
	}

	if req.Price != nil {
		if *req.Price < 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Price cannot be negative",
			})
			return
		}
		updates = append(updates, fmt.Sprintf("price = $%d", argPos))
		args = append(args, *req.Price)
		argPos++
	}

	if req.Currency != nil {
		if len(*req.Currency) != 3 {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Currency must be 3 characters",
			})
			return
		}
		updates = append(updates, fmt.Sprintf("currency = $%d", argPos))
		args = append(args, *req.Currency)
		argPos++
	}

	if req.IsActive != nil {
		updates = append(updates, fmt.Sprintf("is_active = $%d", argPos))
		args = append(args, *req.IsActive)
		argPos++
	}

	if req.IsPublic != nil {
		updates = append(updates, fmt.Sprintf("is_public = $%d", argPos))
		args = append(args, *req.IsPublic)
		argPos++
	}

	if req.EntitlementsConfig != nil {
		entitlementsJSON, _ := json.Marshal(*req.EntitlementsConfig)
		updates = append(updates, fmt.Sprintf("entitlements_config = $%d", argPos))
		args = append(args, string(entitlementsJSON))
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
		"UPDATE service_packages SET %s WHERE _id = $%d AND deleted_at IS NULL RETURNING updated_at",
		strings.Join(updates, ", "),
		argPos,
	)
	args = append(args, id)

	var updatedAt time.Time
	err := h.db.QueryRow(query, args...).Scan(&updatedAt)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Package not found",
		})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update package: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "Package updated successfully",
		"updated_at": updatedAt,
	})
}

// Delete godoc
// @Summary Delete package
// @Description Soft delete a service package
// @Tags packages
// @Accept json
// @Produce json
// @Param id path string true "Package ID"
// @Success 200 {object} map[string]string
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /packages/{id} [delete]
func (h *PackagesHandler) Delete(c *gin.Context) {
	id := c.Param("id")

	if _, err := uuid.Parse(id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid package ID format",
		})
		return
	}

	query := `
		UPDATE service_packages 
		SET deleted_at = NOW(), updated_at = NOW()
		WHERE _id = $1 AND deleted_at IS NULL
		RETURNING _id
	`

	var deletedID string
	err := h.db.QueryRow(query, id).Scan(&deletedID)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Package not found",
		})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to delete package: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Package deleted successfully",
	})
}
