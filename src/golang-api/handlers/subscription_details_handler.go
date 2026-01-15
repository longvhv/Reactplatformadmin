/**
 * Subscription Details Handler
 * Handles subscription analytics and operations
 */

package handlers

import (
	"database/sql"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// ==================== TYPES ====================

type SubscriptionWithDetails struct {
	TenantSubscription
	TenantName       string  `json:"tenant_name"`
	PackageCode      string  `json:"package_code"`
	PackageName      string  `json:"package_name"`
	PackageBillingCycle string `json:"package_billing_cycle"`
	ProductName      string  `json:"product_name"`
	DaysRemaining    *int    `json:"days_remaining,omitempty"`
	IsExpired        bool    `json:"is_expired"`
}

type SubscriptionUsageStats struct {
	SubscriptionID   string                 `json:"subscription_id"`
	TenantID         string                 `json:"tenant_id"`
	PackageID        string                 `json:"package_id"`
	Status           string                 `json:"status"`
	StartDate        time.Time              `json:"start_date"`
	EndDate          *time.Time             `json:"end_date,omitempty"`
	DaysActive       int                    `json:"days_active"`
	DaysRemaining    *int                   `json:"days_remaining,omitempty"`
	EntitlementsUsed map[string]interface{} `json:"entitlements_used"`
	TotalSpent       float64                `json:"total_spent"`
}

type RenewSubscriptionRequest struct {
	Duration int    `json:"duration" binding:"required,min=1"` // in months
	EndAt    *time.Time `json:"end_at"`
}

// GetWithDetails godoc
// @Summary Get subscription with full details
// @Description Get subscription with tenant, package, and product information
// @Tags subscriptions
// @Accept json
// @Produce json
// @Param id path string true "Subscription ID"
// @Success 200 {object} SubscriptionWithDetails
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /subscriptions/{id}/details [get]
func (h *SubscriptionsHandler) GetWithDetails(c *gin.Context) {
	id := c.Param("id")

	if _, err := uuid.Parse(id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid subscription ID format",
		})
		return
	}

	query := `
		SELECT 
			ts._id, ts.tenant_id, ts.package_id, ts.price_amount, ts.currency_code,
			ts.granted_entitlements, ts.granted_app_codes, ts.start_at, ts.end_at,
			ts.status, ts.version, ts.created_at, ts.updated_at, ts.deleted_at,
			t.name as tenant_name,
			sp.code as package_code,
			sp.name as package_name,
			sp.billing_cycle as package_billing_cycle,
			p.name as product_name,
			CASE 
				WHEN ts.end_at IS NOT NULL THEN 
					EXTRACT(DAY FROM (ts.end_at - NOW()))::int
				ELSE NULL
			END as days_remaining,
			CASE 
				WHEN ts.end_at IS NOT NULL AND ts.end_at < NOW() THEN TRUE
				ELSE FALSE
			END as is_expired
		FROM tenant_subscriptions ts
		JOIN tenants t ON ts.tenant_id = t._id
		JOIN service_packages sp ON ts.package_id = sp._id
		JOIN products p ON sp.product_id = p._id
		WHERE ts._id = $1 AND ts.deleted_at IS NULL
	`

	var s SubscriptionWithDetails
	var entitlementsJSON []byte
	var appCodes []string

	err := h.db.QueryRow(query, id).Scan(
		&s.ID, &s.TenantID, &s.PackageID, &s.PriceAmount,
		&s.CurrencyCode, &entitlementsJSON, &appCodes,
		&s.StartAt, &s.EndAt, &s.Status, &s.Version,
		&s.CreatedAt, &s.UpdatedAt, &s.DeletedAt,
		&s.TenantName, &s.PackageCode, &s.PackageName,
		&s.PackageBillingCycle, &s.ProductName,
		&s.DaysRemaining, &s.IsExpired,
	)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Subscription not found",
		})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch subscription details: " + err.Error(),
		})
		return
	}

	if len(entitlementsJSON) > 0 {
		json.Unmarshal(entitlementsJSON, &s.GrantedEntitlements)
	}
	s.GrantedAppCodes = appCodes

	c.JSON(http.StatusOK, s)
}

// GetUsageStats godoc
// @Summary Get subscription usage statistics
// @Description Get detailed usage stats for a subscription
// @Tags subscriptions
// @Accept json
// @Produce json
// @Param id path string true "Subscription ID"
// @Success 200 {object} SubscriptionUsageStats
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /subscriptions/{id}/usage [get]
func (h *SubscriptionsHandler) GetUsageStats(c *gin.Context) {
	id := c.Param("id")

	if _, err := uuid.Parse(id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid subscription ID format",
		})
		return
	}

	query := `
		SELECT 
			_id, tenant_id, package_id, status, start_at, end_at,
			granted_entitlements, price_amount,
			EXTRACT(DAY FROM (NOW() - start_at))::int as days_active,
			CASE 
				WHEN end_at IS NOT NULL THEN 
					EXTRACT(DAY FROM (end_at - NOW()))::int
				ELSE NULL
			END as days_remaining
		FROM tenant_subscriptions
		WHERE _id = $1 AND deleted_at IS NULL
	`

	var stats SubscriptionUsageStats
	var entitlementsJSON []byte

	err := h.db.QueryRow(query, id).Scan(
		&stats.SubscriptionID,
		&stats.TenantID,
		&stats.PackageID,
		&stats.Status,
		&stats.StartDate,
		&stats.EndDate,
		&entitlementsJSON,
		&stats.TotalSpent,
		&stats.DaysActive,
		&stats.DaysRemaining,
	)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Subscription not found",
		})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch usage stats: " + err.Error(),
		})
		return
	}

	if len(entitlementsJSON) > 0 {
		json.Unmarshal(entitlementsJSON, &stats.EntitlementsUsed)
	}

	c.JSON(http.StatusOK, stats)
}

// CancelSubscription godoc
// @Summary Cancel subscription
// @Description Cancel an active subscription
// @Tags subscriptions
// @Accept json
// @Produce json
// @Param id path string true "Subscription ID"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /subscriptions/{id}/cancel [post]
func (h *SubscriptionsHandler) CancelSubscription(c *gin.Context) {
	id := c.Param("id")

	if _, err := uuid.Parse(id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid subscription ID format",
		})
		return
	}

	query := `
		UPDATE tenant_subscriptions 
		SET status = 'CANCELLED', 
		    end_at = NOW(),
		    updated_at = NOW(), 
		    version = version + 1
		WHERE _id = $1 AND deleted_at IS NULL AND status = 'ACTIVE'
		RETURNING status, end_at, updated_at
	`

	var status string
	var endAt time.Time
	var updatedAt time.Time

	err := h.db.QueryRow(query, id).Scan(&status, &endAt, &updatedAt)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Subscription not found or already cancelled",
		})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to cancel subscription: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "Subscription cancelled successfully",
		"status":     status,
		"end_at":     endAt,
		"updated_at": updatedAt,
	})
}

// RenewSubscription godoc
// @Summary Renew subscription
// @Description Extend subscription for additional months
// @Tags subscriptions
// @Accept json
// @Produce json
// @Param id path string true "Subscription ID"
// @Param renewal body RenewSubscriptionRequest true "Renewal data"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /subscriptions/{id}/renew [post]
func (h *SubscriptionsHandler) RenewSubscription(c *gin.Context) {
	id := c.Param("id")

	if _, err := uuid.Parse(id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid subscription ID format",
		})
		return
	}

	var req RenewSubscriptionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request data: " + err.Error(),
		})
		return
	}

	// Get current subscription
	var currentEndAt *time.Time
	checkQuery := `SELECT end_at FROM tenant_subscriptions WHERE _id = $1 AND deleted_at IS NULL`
	err := h.db.QueryRow(checkQuery, id).Scan(&currentEndAt)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Subscription not found",
		})
		return
	}

	// Calculate new end date
	var newEndAt time.Time
	if req.EndAt != nil {
		newEndAt = *req.EndAt
	} else {
		baseDate := time.Now()
		if currentEndAt != nil && currentEndAt.After(time.Now()) {
			baseDate = *currentEndAt
		}
		newEndAt = baseDate.AddDate(0, req.Duration, 0)
	}

	query := `
		UPDATE tenant_subscriptions 
		SET status = 'ACTIVE',
		    end_at = $1,
		    updated_at = NOW(),
		    version = version + 1
		WHERE _id = $2 AND deleted_at IS NULL
		RETURNING status, end_at, updated_at
	`

	var status string
	var endAt time.Time
	var updatedAt time.Time

	err = h.db.QueryRow(query, newEndAt, id).Scan(&status, &endAt, &updatedAt)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to renew subscription: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "Subscription renewed successfully",
		"status":     status,
		"end_at":     endAt,
		"updated_at": updatedAt,
	})
}

// CheckAccess godoc
// @Summary Check app access
// @Description Check if subscription has access to specific app
// @Tags subscriptions
// @Accept json
// @Produce json
// @Param tenant_id query string true "Tenant ID"
// @Param app_code query string true "App code"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Router /subscriptions/check-access [get]
func (h *SubscriptionsHandler) CheckAccess(c *gin.Context) {
	tenantID := c.Query("tenant_id")
	appCode := c.Query("app_code")

	if tenantID == "" || appCode == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "tenant_id and app_code are required",
		})
		return
	}

	query := `
		SELECT EXISTS(
			SELECT 1 FROM tenant_subscriptions
			WHERE tenant_id = $1 
			AND status = 'ACTIVE'
			AND deleted_at IS NULL
			AND $2 = ANY(granted_app_codes)
			AND (end_at IS NULL OR end_at > NOW())
		)
	`

	var hasAccess bool
	err := h.db.QueryRow(query, tenantID, appCode).Scan(&hasAccess)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to check access: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"tenant_id":  tenantID,
		"app_code":   appCode,
		"has_access": hasAccess,
	})
}

// GetExpiringSubscriptions godoc
// @Summary Get expiring subscriptions
// @Description Get subscriptions expiring within specified days
// @Tags subscriptions
// @Accept json
// @Produce json
// @Param days query int false "Days until expiry" default(30)
// @Success 200 {array} SubscriptionWithDetails
// @Failure 500 {object} ErrorResponse
// @Router /subscriptions/expiring [get]
func (h *SubscriptionsHandler) GetExpiringSubscriptions(c *gin.Context) {
	days := c.DefaultQuery("days", "30")

	query := `
		SELECT 
			ts._id, ts.tenant_id, ts.package_id, ts.price_amount, ts.currency_code,
			ts.granted_entitlements, ts.granted_app_codes, ts.start_at, ts.end_at,
			ts.status, ts.version, ts.created_at, ts.updated_at,
			t.name as tenant_name,
			sp.code as package_code,
			sp.name as package_name,
			EXTRACT(DAY FROM (ts.end_at - NOW()))::int as days_remaining
		FROM tenant_subscriptions ts
		JOIN tenants t ON ts.tenant_id = t._id
		JOIN service_packages sp ON ts.package_id = sp._id
		WHERE ts.deleted_at IS NULL
		AND ts.status = 'ACTIVE'
		AND ts.end_at IS NOT NULL
		AND ts.end_at BETWEEN NOW() AND NOW() + INTERVAL '$1 days'
		ORDER BY ts.end_at ASC
	`

	rows, err := h.db.Query(query, days)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch expiring subscriptions: " + err.Error(),
		})
		return
	}
	defer rows.Close()

	subscriptions := []SubscriptionWithDetails{}
	for rows.Next() {
		var s SubscriptionWithDetails
		var entitlementsJSON []byte
		var appCodes []string

		err := rows.Scan(
			&s.ID, &s.TenantID, &s.PackageID, &s.PriceAmount,
			&s.CurrencyCode, &entitlementsJSON, &appCodes,
			&s.StartAt, &s.EndAt, &s.Status, &s.Version,
			&s.CreatedAt, &s.UpdatedAt,
			&s.TenantName, &s.PackageCode, &s.PackageName,
			&s.DaysRemaining,
		)
		if err != nil {
			continue
		}

		if len(entitlementsJSON) > 0 {
			json.Unmarshal(entitlementsJSON, &s.GrantedEntitlements)
		}
		s.GrantedAppCodes = appCodes

		subscriptions = append(subscriptions, s)
	}

	c.JSON(http.StatusOK, subscriptions)
}
