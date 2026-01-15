/**
 * Package Details Handler
 * Handles package statistics and subscription operations
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

// ==================== TYPES ====================

type PackageStats struct {
	PackageID           string    `json:"package_id"`
	Code                string    `json:"code"`
	Name                string    `json:"name"`
	BillingCycle        string    `json:"billing_cycle"`
	Price               float64   `json:"price"`
	Currency            string    `json:"currency"`
	IsActive            bool      `json:"is_active"`
	CreatedAt           time.Time `json:"created_at"`
	TotalSubscribers    int       `json:"total_subscribers"`
	ActiveSubscribers   int       `json:"active_subscribers"`
	TotalRevenue        float64   `json:"total_revenue"`
	MonthlyRevenue      float64   `json:"monthly_revenue"`
	ChurnRate           float64   `json:"churn_rate"`
}

type PackageSubscriber struct {
	ID           string    `json:"_id"`
	TenantID     string    `json:"tenant_id"`
	TenantName   string    `json:"tenant_name"`
	Status       string    `json:"status"`
	StartDate    time.Time `json:"start_date"`
	EndDate      *time.Time `json:"end_date,omitempty"`
	Price        float64   `json:"price"`
	Currency     string    `json:"currency"`
	CreatedAt    time.Time `json:"created_at"`
}

type PackageRevenueByMonth struct {
	Month             string  `json:"month"`
	Revenue           float64 `json:"revenue"`
	Subscriptions     int     `json:"subscriptions"`
	NewSubscribers    int     `json:"new_subscribers"`
	Churned           int     `json:"churned"`
}

// GetStats godoc
// @Summary Get package statistics
// @Description Get comprehensive statistics for a package
// @Tags packages
// @Accept json
// @Produce json
// @Param id path string true "Package ID"
// @Success 200 {object} PackageStats
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /packages/{id}/stats [get]
func (h *PackagesHandler) GetStats(c *gin.Context) {
	id := c.Param("id")

	if _, err := uuid.Parse(id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid package ID format",
		})
		return
	}

	query := `
		SELECT 
			p._id,
			p.code,
			p.name,
			p.billing_cycle,
			p.price,
			p.currency,
			p.is_active,
			p.created_at,
			
			COUNT(DISTINCT ts._id) as total_subscribers,
			COUNT(DISTINCT CASE WHEN ts.status = 'ACTIVE' THEN ts._id END) as active_subscribers,
			
			COALESCE(SUM(CASE WHEN ts.status = 'ACTIVE' THEN ts.price ELSE 0 END), 0) as total_revenue,
			COALESCE(SUM(CASE 
				WHEN ts.status = 'ACTIVE' 
				AND ts.start_date >= NOW() - INTERVAL '30 days'
				THEN ts.price ELSE 0 
			END), 0) as monthly_revenue,
			
			CASE 
				WHEN COUNT(DISTINCT ts._id) > 0 THEN
					(COUNT(DISTINCT CASE WHEN ts.status = 'CANCELLED' THEN ts._id END)::float / COUNT(DISTINCT ts._id)::float) * 100
				ELSE 0
			END as churn_rate
			
		FROM service_packages p
		LEFT JOIN tenant_subscriptions ts ON p._id = ts.package_id AND ts.deleted_at IS NULL
		WHERE p._id = $1 AND p.deleted_at IS NULL
		GROUP BY p._id, p.code, p.name, p.billing_cycle, p.price, p.currency, p.is_active, p.created_at
	`

	var stats PackageStats
	err := h.db.QueryRow(query, id).Scan(
		&stats.PackageID,
		&stats.Code,
		&stats.Name,
		&stats.BillingCycle,
		&stats.Price,
		&stats.Currency,
		&stats.IsActive,
		&stats.CreatedAt,
		&stats.TotalSubscribers,
		&stats.ActiveSubscribers,
		&stats.TotalRevenue,
		&stats.MonthlyRevenue,
		&stats.ChurnRate,
	)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Package not found",
		})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch package statistics: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// GetSubscribers godoc
// @Summary Get package subscribers
// @Description Get all subscribers of this package
// @Tags packages
// @Accept json
// @Produce json
// @Param id path string true "Package ID"
// @Param status query string false "Filter by status"
// @Success 200 {array} PackageSubscriber
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /packages/{id}/subscribers [get]
func (h *PackagesHandler) GetSubscribers(c *gin.Context) {
	id := c.Param("id")
	statusFilter := c.Query("status")

	if _, err := uuid.Parse(id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid package ID format",
		})
		return
	}

	var exists bool
	checkQuery := `SELECT EXISTS(SELECT 1 FROM service_packages WHERE _id = $1 AND deleted_at IS NULL)`
	err := h.db.QueryRow(checkQuery, id).Scan(&exists)
	if err != nil || !exists {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Package not found",
		})
		return
	}

	query := `
		SELECT 
			ts._id,
			ts.tenant_id,
			t.name as tenant_name,
			ts.status,
			ts.start_date,
			ts.end_date,
			ts.price,
			ts.currency,
			ts.created_at
		FROM tenant_subscriptions ts
		JOIN tenants t ON ts.tenant_id = t._id
		WHERE ts.package_id = $1 AND ts.deleted_at IS NULL
	`

	args := []interface{}{id}
	if statusFilter != "" {
		query += ` AND ts.status = $2`
		args = append(args, statusFilter)
	}

	query += ` ORDER BY ts.created_at DESC`

	rows, err := h.db.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch subscribers: " + err.Error(),
		})
		return
	}
	defer rows.Close()

	subscribers := []PackageSubscriber{}
	for rows.Next() {
		var sub PackageSubscriber
		err := rows.Scan(
			&sub.ID,
			&sub.TenantID,
			&sub.TenantName,
			&sub.Status,
			&sub.StartDate,
			&sub.EndDate,
			&sub.Price,
			&sub.Currency,
			&sub.CreatedAt,
		)
		if err != nil {
			continue
		}
		subscribers = append(subscribers, sub)
	}

	c.JSON(http.StatusOK, subscribers)
}

// GetRevenue godoc
// @Summary Get package revenue
// @Description Get revenue statistics by month
// @Tags packages
// @Accept json
// @Produce json
// @Param id path string true "Package ID"
// @Param months query int false "Number of months" default(6)
// @Success 200 {array} PackageRevenueByMonth
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /packages/{id}/revenue [get]
func (h *PackagesHandler) GetRevenue(c *gin.Context) {
	id := c.Param("id")
	months := c.DefaultQuery("months", "6")

	if _, err := uuid.Parse(id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid package ID format",
		})
		return
	}

	var exists bool
	checkQuery := `SELECT EXISTS(SELECT 1 FROM service_packages WHERE _id = $1 AND deleted_at IS NULL)`
	err := h.db.QueryRow(checkQuery, id).Scan(&exists)
	if err != nil || !exists {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Package not found",
		})
		return
	}

	query := `
		SELECT 
			TO_CHAR(ts.start_date, 'YYYY-MM') as month,
			SUM(ts.price) as revenue,
			COUNT(DISTINCT ts._id) as subscriptions,
			COUNT(DISTINCT CASE 
				WHEN ts.created_at >= DATE_TRUNC('month', ts.start_date)
				THEN ts._id 
			END) as new_subscribers,
			COUNT(DISTINCT CASE 
				WHEN ts.status = 'CANCELLED' OR ts.status = 'EXPIRED'
				THEN ts._id 
			END) as churned
		FROM tenant_subscriptions ts
		WHERE ts.package_id = $1
			AND ts.deleted_at IS NULL
			AND ts.start_date >= NOW() - INTERVAL '$2 months'
		GROUP BY TO_CHAR(ts.start_date, 'YYYY-MM')
		ORDER BY month DESC
	`

	rows, err := h.db.Query(query, id, months)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch revenue data: " + err.Error(),
		})
		return
	}
	defer rows.Close()

	revenues := []PackageRevenueByMonth{}
	for rows.Next() {
		var rev PackageRevenueByMonth
		err := rows.Scan(
			&rev.Month,
			&rev.Revenue,
			&rev.Subscriptions,
			&rev.NewSubscribers,
			&rev.Churned,
		)
		if err != nil {
			continue
		}
		revenues = append(revenues, rev)
	}

	c.JSON(http.StatusOK, revenues)
}

// UpdateStatus godoc
// @Summary Update package status
// @Description Update package active status
// @Tags packages
// @Accept json
// @Produce json
// @Param id path string true "Package ID"
// @Param status body map[string]bool true "Status data"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /packages/{id}/status [patch]
func (h *PackagesHandler) UpdateStatus(c *gin.Context) {
	id := c.Param("id")

	if _, err := uuid.Parse(id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid package ID format",
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
		UPDATE service_packages 
		SET is_active = $1, updated_at = NOW(), version = version + 1
		WHERE _id = $2 AND deleted_at IS NULL
		RETURNING is_active, updated_at
	`

	var isActive bool
	var updatedAt time.Time

	err := h.db.QueryRow(query, req.IsActive, id).Scan(&isActive, &updatedAt)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Package not found",
		})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update package status: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "Package status updated successfully",
		"is_active":  isActive,
		"updated_at": updatedAt,
	})
}

// DuplicatePackage godoc
// @Summary Duplicate package
// @Description Create a copy of an existing package
// @Tags packages
// @Accept json
// @Produce json
// @Param id path string true "Package ID"
// @Param data body map[string]string true "New package code and name"
// @Success 201 {object} ServicePackage
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /packages/{id}/duplicate [post]
func (h *PackagesHandler) DuplicatePackage(c *gin.Context) {
	id := c.Param("id")

	if _, err := uuid.Parse(id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid package ID format",
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

	getQuery := `
		SELECT product_id, billing_cycle, description, price, currency, entitlements_config
		FROM service_packages
		WHERE _id = $1 AND deleted_at IS NULL
	`

	var productID, billingCycle, currency string
	var description *string
	var price float64
	var entitlementsJSON []byte

	err := h.db.QueryRow(getQuery, id).Scan(
		&productID, &billingCycle, &description, &price, &currency, &entitlementsJSON,
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

	newID := uuid.New().String()

	insertQuery := `
		INSERT INTO service_packages (
			_id, product_id, code, name, billing_cycle, description,
			price, currency, entitlements_config
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING _id, product_id, code, name, description, billing_cycle,
		          price, currency, entitlements_config, is_active, is_public,
		          created_at, updated_at, version
	`

	var p ServicePackage
	var returnedEntitlementsJSON []byte

	err = h.db.QueryRow(
		insertQuery,
		newID, productID, req.Code, req.Name, billingCycle,
		description, price, currency, entitlementsJSON,
	).Scan(
		&p.ID, &p.ProductID, &p.Code, &p.Name, &p.Description,
		&p.BillingCycle, &p.Price, &p.Currency, &returnedEntitlementsJSON,
		&p.IsActive, &p.IsPublic, &p.CreatedAt, &p.UpdatedAt, &p.Version,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to duplicate package: " + err.Error(),
		})
		return
	}

	if len(returnedEntitlementsJSON) > 0 {
		json.Unmarshal(returnedEntitlementsJSON, &p.EntitlementsConfig)
	}

	c.JSON(http.StatusCreated, p)
}
