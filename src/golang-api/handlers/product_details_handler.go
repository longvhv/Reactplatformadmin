/**
 * Products Detail Handler
 * Handles product statistics and related data operations
 */

package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// ==================== TYPES ====================

type ProductStats struct {
	ProductID          string    `json:"product_id"`
	Code               string    `json:"code"`
	Name               string    `json:"name"`
	ProductType        string    `json:"product_type"`
	BasePrice          float64   `json:"base_price"`
	Currency           string    `json:"currency"`
	IsActive           bool      `json:"is_active"`
	CreatedAt          time.Time `json:"created_at"`
	PackagesCount      int       `json:"packages_count"`
	ActivePackages     int       `json:"active_packages"`
	SubscriptionsCount int       `json:"subscriptions_count"`
	ActiveSubscriptions int      `json:"active_subscriptions"`
	TotalRevenue       float64   `json:"total_revenue"`
	MonthlyRevenue     float64   `json:"monthly_revenue"`
}

type ProductPackage struct {
	ID              string    `json:"_id"`
	TenantID        string    `json:"tenant_id"`
	PackageCode     string    `json:"package_code"`
	PackageName     string    `json:"package_name"`
	BillingCycle    string    `json:"billing_cycle"`
	Price           float64   `json:"price"`
	IsActive        bool      `json:"is_active"`
	SubscribersCount int      `json:"subscribers_count"`
	CreatedAt       time.Time `json:"created_at"`
}

type ProductRevenue struct {
	Month          string  `json:"month"`
	Revenue        float64 `json:"revenue"`
	Subscriptions  int     `json:"subscriptions"`
	NewSubscribers int     `json:"new_subscribers"`
}

// GetStats godoc
// @Summary Get product statistics
// @Description Get comprehensive statistics for a product
// @Tags products
// @Accept json
// @Produce json
// @Param id path string true "Product ID"
// @Success 200 {object} ProductStats
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /products/{id}/stats [get]
func (h *ProductsHandler) GetStats(c *gin.Context) {
	id := c.Param("id")

	// Validate UUID
	if _, err := uuid.Parse(id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid product ID format",
		})
		return
	}

	query := `
		SELECT 
			p._id,
			p.code,
			p.name,
			p.product_type,
			p.base_price,
			p.currency,
			p.is_active,
			p.created_at,
			
			-- Packages statistics
			COUNT(DISTINCT sp._id) as packages_count,
			COUNT(DISTINCT CASE WHEN sp.is_active THEN sp._id END) as active_packages,
			
			-- Subscriptions statistics
			COUNT(DISTINCT ts._id) as subscriptions_count,
			COUNT(DISTINCT CASE WHEN ts.status = 'ACTIVE' THEN ts._id END) as active_subscriptions,
			
			-- Revenue statistics
			COALESCE(SUM(CASE WHEN ts.status = 'ACTIVE' THEN sp.price ELSE 0 END), 0) as total_revenue,
			COALESCE(SUM(CASE 
				WHEN ts.status = 'ACTIVE' 
				AND ts.current_period_start >= NOW() - INTERVAL '30 days'
				THEN sp.price ELSE 0 
			END), 0) as monthly_revenue
			
		FROM products p
		LEFT JOIN service_packages sp ON p._id = sp.product_id AND sp.deleted_at IS NULL
		LEFT JOIN tenant_subscriptions ts ON sp._id = ts.package_id AND ts.deleted_at IS NULL
		WHERE p._id = $1 AND p.deleted_at IS NULL
		GROUP BY p._id, p.code, p.name, p.product_type, p.base_price, 
		         p.currency, p.is_active, p.created_at
	`

	var stats ProductStats
	err := h.db.QueryRow(query, id).Scan(
		&stats.ProductID,
		&stats.Code,
		&stats.Name,
		&stats.ProductType,
		&stats.BasePrice,
		&stats.Currency,
		&stats.IsActive,
		&stats.CreatedAt,
		&stats.PackagesCount,
		&stats.ActivePackages,
		&stats.SubscriptionsCount,
		&stats.ActiveSubscriptions,
		&stats.TotalRevenue,
		&stats.MonthlyRevenue,
	)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Product not found",
		})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch product statistics",
		})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// GetPackages godoc
// @Summary Get product packages
// @Description Get all packages using this product
// @Tags products
// @Accept json
// @Produce json
// @Param id path string true "Product ID"
// @Success 200 {array} ProductPackage
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /products/{id}/packages [get]
func (h *ProductsHandler) GetPackages(c *gin.Context) {
	id := c.Param("id")

	// Validate UUID
	if _, err := uuid.Parse(id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid product ID format",
		})
		return
	}

	// Check if product exists
	var exists bool
	checkQuery := `SELECT EXISTS(SELECT 1 FROM products WHERE _id = $1 AND deleted_at IS NULL)`
	err := h.db.QueryRow(checkQuery, id).Scan(&exists)
	if err != nil || !exists {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Product not found",
		})
		return
	}

	query := `
		SELECT 
			sp._id,
			sp.tenant_id,
			sp.code as package_code,
			sp.name as package_name,
			sp.billing_cycle,
			sp.price,
			sp.is_active,
			COUNT(DISTINCT ts._id) as subscribers_count,
			sp.created_at
		FROM service_packages sp
		LEFT JOIN tenant_subscriptions ts ON sp._id = ts.package_id 
			AND ts.status = 'ACTIVE' AND ts.deleted_at IS NULL
		WHERE sp.product_id = $1 AND sp.deleted_at IS NULL
		GROUP BY sp._id, sp.tenant_id, sp.code, sp.name, sp.billing_cycle, 
		         sp.price, sp.is_active, sp.created_at
		ORDER BY sp.created_at DESC
	`

	rows, err := h.db.Query(query, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch packages",
		})
		return
	}
	defer rows.Close()

	packages := []ProductPackage{}
	for rows.Next() {
		var pkg ProductPackage
		err := rows.Scan(
			&pkg.ID,
			&pkg.TenantID,
			&pkg.PackageCode,
			&pkg.PackageName,
			&pkg.BillingCycle,
			&pkg.Price,
			&pkg.IsActive,
			&pkg.SubscribersCount,
			&pkg.CreatedAt,
		)
		if err != nil {
			continue
		}
		packages = append(packages, pkg)
	}

	c.JSON(http.StatusOK, packages)
}

// GetRevenue godoc
// @Summary Get product revenue
// @Description Get revenue statistics by month
// @Tags products
// @Accept json
// @Produce json
// @Param id path string true "Product ID"
// @Param months query int false "Number of months" default(6)
// @Success 200 {array} ProductRevenue
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /products/{id}/revenue [get]
func (h *ProductsHandler) GetRevenue(c *gin.Context) {
	id := c.Param("id")
	months := c.DefaultQuery("months", "6")

	// Validate UUID
	if _, err := uuid.Parse(id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid product ID format",
		})
		return
	}

	// Check if product exists
	var exists bool
	checkQuery := `SELECT EXISTS(SELECT 1 FROM products WHERE _id = $1 AND deleted_at IS NULL)`
	err := h.db.QueryRow(checkQuery, id).Scan(&exists)
	if err != nil || !exists {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Product not found",
		})
		return
	}

	query := `
		SELECT 
			TO_CHAR(ts.current_period_start, 'YYYY-MM') as month,
			SUM(sp.price) as revenue,
			COUNT(DISTINCT ts._id) as subscriptions,
			COUNT(DISTINCT CASE 
				WHEN ts.created_at >= DATE_TRUNC('month', ts.current_period_start)
				THEN ts._id 
			END) as new_subscribers
		FROM tenant_subscriptions ts
		JOIN service_packages sp ON ts.package_id = sp._id
		WHERE sp.product_id = $1
			AND ts.status = 'ACTIVE'
			AND ts.deleted_at IS NULL
			AND sp.deleted_at IS NULL
			AND ts.current_period_start >= NOW() - INTERVAL '$2 months'
		GROUP BY TO_CHAR(ts.current_period_start, 'YYYY-MM')
		ORDER BY month DESC
	`

	rows, err := h.db.Query(query, id, months)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch revenue data",
		})
		return
	}
	defer rows.Close()

	revenues := []ProductRevenue{}
	for rows.Next() {
		var rev ProductRevenue
		err := rows.Scan(
			&rev.Month,
			&rev.Revenue,
			&rev.Subscriptions,
			&rev.NewSubscribers,
		)
		if err != nil {
			continue
		}
		revenues = append(revenues, rev)
	}

	c.JSON(http.StatusOK, revenues)
}

// UpdateStatus godoc
// @Summary Update product status
// @Description Update product active status
// @Tags products
// @Accept json
// @Produce json
// @Param id path string true "Product ID"
// @Param status body map[string]bool true "Status data"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /products/{id}/status [patch]
func (h *ProductsHandler) UpdateStatus(c *gin.Context) {
	id := c.Param("id")

	// Validate UUID
	if _, err := uuid.Parse(id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid product ID format",
		})
		return
	}

	var req struct {
		IsActive bool `json:"is_active"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request data",
		})
		return
	}

	query := `
		UPDATE products 
		SET is_active = $1, updated_at = NOW(), version = version + 1
		WHERE _id = $2 AND deleted_at IS NULL
		RETURNING is_active, updated_at
	`

	var isActive bool
	var updatedAt time.Time

	err := h.db.QueryRow(query, req.IsActive, id).Scan(&isActive, &updatedAt)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Product not found",
		})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update product status",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "Product status updated successfully",
		"is_active":  isActive,
		"updated_at": updatedAt,
	})
}

// DuplicateProduct godoc
// @Summary Duplicate product
// @Description Create a copy of an existing product
// @Tags products
// @Accept json
// @Produce json
// @Param id path string true "Product ID"
// @Param data body map[string]string true "New product code and name"
// @Success 201 {object} Product
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /products/{id}/duplicate [post]
func (h *ProductsHandler) DuplicateProduct(c *gin.Context) {
	id := c.Param("id")

	// Validate UUID
	if _, err := uuid.Parse(id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid product ID format",
		})
		return
	}

	var req struct {
		Code string `json:"code" binding:"required"`
		Name string `json:"name" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request data",
		})
		return
	}

	// Get original product
	getQuery := `
		SELECT tenant_id, product_type, description, base_price, currency, metadata
		FROM products
		WHERE _id = $1 AND deleted_at IS NULL
	`

	var tenantID, productType, currency string
	var description *string
	var basePrice float64
	var metadataJSON []byte

	err := h.db.QueryRow(getQuery, id).Scan(
		&tenantID, &productType, &description, &basePrice, &currency, &metadataJSON,
	)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Product not found",
		})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch product",
		})
		return
	}

	// Check for duplicate code
	var exists bool
	checkQuery := `
		SELECT EXISTS(
			SELECT 1 FROM products 
			WHERE tenant_id = $1 AND code = $2 AND deleted_at IS NULL
		)
	`
	err = h.db.QueryRow(checkQuery, tenantID, req.Code).Scan(&exists)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to check duplicate",
		})
		return
	}

	if exists {
		c.JSON(http.StatusConflict, gin.H{
			"error": "Product with this code already exists",
		})
		return
	}

	// Create new product
	newID := uuid.New().String()

	insertQuery := `
		INSERT INTO products (
			_id, tenant_id, code, name, product_type, description,
			base_price, currency, metadata
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING _id, tenant_id, code, name, product_type, description,
		          base_price, currency, is_active, metadata,
		          created_at, updated_at, version
	`

	var p Product
	var returnedMetadataJSON []byte

	err = h.db.QueryRow(
		insertQuery,
		newID, tenantID, req.Code, req.Name, productType,
		description, basePrice, currency, metadataJSON,
	).Scan(
		&p.ID, &p.TenantID, &p.Code, &p.Name, &p.ProductType,
		&p.Description, &p.BasePrice, &p.Currency, &p.IsActive,
		&returnedMetadataJSON, &p.CreatedAt, &p.UpdatedAt, &p.Version,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to duplicate product",
		})
		return
	}

	// Parse metadata
	if len(returnedMetadataJSON) > 0 {
		json.Unmarshal(returnedMetadataJSON, &p.Metadata)
	}

	c.JSON(http.StatusCreated, p)
}
