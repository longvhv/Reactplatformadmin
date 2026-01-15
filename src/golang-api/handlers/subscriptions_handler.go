/**
 * Tenant Subscriptions API Handler
 * Handles CRUD operations for tenant subscriptions
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

type SubscriptionsHandler struct {
	db *sql.DB
}

func NewSubscriptionsHandler(db *sql.DB) *SubscriptionsHandler {
	return &SubscriptionsHandler{db: db}
}

// ==================== TYPES ====================

type TenantSubscription struct {
	ID                  string                 `json:"_id"`
	TenantID            string                 `json:"tenant_id"`
	PackageID           string                 `json:"package_id"`
	PriceAmount         float64                `json:"price_amount"`
	CurrencyCode        string                 `json:"currency_code"`
	GrantedEntitlements map[string]interface{} `json:"granted_entitlements"`
	GrantedAppCodes     []string               `json:"granted_app_codes"`
	StartAt             time.Time              `json:"start_at"`
	EndAt               *time.Time             `json:"end_at,omitempty"`
	Status              string                 `json:"status"`
	Version             int64                  `json:"version"`
	CreatedAt           time.Time              `json:"created_at"`
	UpdatedAt           time.Time              `json:"updated_at"`
	DeletedAt           *time.Time             `json:"deleted_at,omitempty"`
}

type CreateSubscriptionRequest struct {
	TenantID            string                  `json:"tenant_id" binding:"required"`
	PackageID           string                  `json:"package_id" binding:"required"`
	PriceAmount         *float64                `json:"price_amount"`
	CurrencyCode        *string                 `json:"currency_code"`
	GrantedEntitlements *map[string]interface{} `json:"granted_entitlements"`
	StartAt             *time.Time              `json:"start_at"`
	EndAt               *time.Time              `json:"end_at"`
}

type UpdateSubscriptionRequest struct {
	Status              *string                 `json:"status,omitempty"`
	EndAt               *time.Time              `json:"end_at"`
	GrantedEntitlements *map[string]interface{} `json:"granted_entitlements,omitempty"`
}

// ==================== HANDLERS ====================

// GetAll godoc
// @Summary List subscriptions
// @Description Get list of tenant subscriptions with filtering
// @Tags subscriptions
// @Accept json
// @Produce json
// @Param tenant_id query string false "Filter by tenant ID"
// @Param package_id query string false "Filter by package ID"
// @Param status query string false "Filter by status"
// @Param limit query int false "Limit results" default(50)
// @Param offset query int false "Offset results" default(0)
// @Success 200 {array} TenantSubscription
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /subscriptions [get]
func (h *SubscriptionsHandler) GetAll(c *gin.Context) {
	tenantID := c.Query("tenant_id")
	packageID := c.Query("package_id")
	status := c.Query("status")
	limit := c.DefaultQuery("limit", "50")
	offset := c.DefaultQuery("offset", "0")

	query := `
		SELECT _id, tenant_id, package_id, price_amount, currency_code,
		       granted_entitlements, granted_app_codes, start_at, end_at,
		       status, version, created_at, updated_at, deleted_at
		FROM tenant_subscriptions
		WHERE deleted_at IS NULL
	`
	args := []interface{}{}
	argPos := 1

	if tenantID != "" {
		query += ` AND tenant_id = $` + fmt.Sprint(argPos)
		args = append(args, tenantID)
		argPos++
	}

	if packageID != "" {
		query += ` AND package_id = $` + fmt.Sprint(argPos)
		args = append(args, packageID)
		argPos++
	}

	if status != "" {
		query += ` AND status = $` + fmt.Sprint(argPos)
		args = append(args, status)
		argPos++
	}

	query += ` ORDER BY created_at DESC LIMIT $` + fmt.Sprint(argPos) +
		` OFFSET $` + fmt.Sprint(argPos+1)
	args = append(args, limit, offset)

	rows, err := h.db.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch subscriptions: " + err.Error(),
		})
		return
	}
	defer rows.Close()

	subscriptions := []TenantSubscription{}
	for rows.Next() {
		var s TenantSubscription
		var entitlementsJSON []byte
		var appCodes []string

		err := rows.Scan(
			&s.ID, &s.TenantID, &s.PackageID, &s.PriceAmount,
			&s.CurrencyCode, &entitlementsJSON, &appCodes,
			&s.StartAt, &s.EndAt, &s.Status, &s.Version,
			&s.CreatedAt, &s.UpdatedAt, &s.DeletedAt,
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

// GetByID godoc
// @Summary Get subscription by ID
// @Description Get a single tenant subscription by ID
// @Tags subscriptions
// @Accept json
// @Produce json
// @Param id path string true "Subscription ID"
// @Success 200 {object} TenantSubscription
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /subscriptions/{id} [get]
func (h *SubscriptionsHandler) GetByID(c *gin.Context) {
	id := c.Param("id")

	if _, err := uuid.Parse(id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid subscription ID format",
		})
		return
	}

	query := `
		SELECT _id, tenant_id, package_id, price_amount, currency_code,
		       granted_entitlements, granted_app_codes, start_at, end_at,
		       status, version, created_at, updated_at, deleted_at
		FROM tenant_subscriptions
		WHERE _id = $1 AND deleted_at IS NULL
	`

	var s TenantSubscription
	var entitlementsJSON []byte
	var appCodes []string

	err := h.db.QueryRow(query, id).Scan(
		&s.ID, &s.TenantID, &s.PackageID, &s.PriceAmount,
		&s.CurrencyCode, &entitlementsJSON, &appCodes,
		&s.StartAt, &s.EndAt, &s.Status, &s.Version,
		&s.CreatedAt, &s.UpdatedAt, &s.DeletedAt,
	)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Subscription not found",
		})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch subscription: " + err.Error(),
		})
		return
	}

	if len(entitlementsJSON) > 0 {
		json.Unmarshal(entitlementsJSON, &s.GrantedEntitlements)
	}
	s.GrantedAppCodes = appCodes

	c.JSON(http.StatusOK, s)
}

// Create godoc
// @Summary Create subscription
// @Description Create a new tenant subscription
// @Tags subscriptions
// @Accept json
// @Produce json
// @Param subscription body CreateSubscriptionRequest true "Subscription data"
// @Success 201 {object} TenantSubscription
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /subscriptions [post]
func (h *SubscriptionsHandler) Create(c *gin.Context) {
	var req CreateSubscriptionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request data: " + err.Error(),
		})
		return
	}

	// Check tenant exists
	var tenantExists bool
	checkTenantQuery := `SELECT EXISTS(SELECT 1 FROM tenants WHERE _id = $1 AND deleted_at IS NULL)`
	err := h.db.QueryRow(checkTenantQuery, req.TenantID).Scan(&tenantExists)
	if err != nil || !tenantExists {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Tenant not found or inactive",
		})
		return
	}

	// Check package exists and get details
	var packagePrice float64
	var packageCurrency string
	var packageEntitlements []byte
	packageQuery := `
		SELECT price, currency, entitlements_config 
		FROM service_packages 
		WHERE _id = $1 AND deleted_at IS NULL AND is_active = TRUE
	`
	err = h.db.QueryRow(packageQuery, req.PackageID).Scan(
		&packagePrice, &packageCurrency, &packageEntitlements,
	)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Package not found or inactive",
		})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch package: " + err.Error(),
		})
		return
	}

	// Use package price if not provided
	priceAmount := packagePrice
	if req.PriceAmount != nil {
		priceAmount = *req.PriceAmount
	}

	// Use package currency if not provided
	currencyCode := packageCurrency
	if req.CurrencyCode != nil {
		currencyCode = *req.CurrencyCode
	}

	// Use package entitlements if not provided
	entitlementsJSON := string(packageEntitlements)
	if req.GrantedEntitlements != nil {
		entitlementsBytes, _ := json.Marshal(*req.GrantedEntitlements)
		entitlementsJSON = string(entitlementsBytes)
	}

	// Use current time if not provided
	startAt := time.Now()
	if req.StartAt != nil {
		startAt = *req.StartAt
	}

	id := uuid.New().String()

	insertQuery := `
		INSERT INTO tenant_subscriptions (
			_id, tenant_id, package_id, price_amount, currency_code,
			granted_entitlements, start_at, end_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING _id, tenant_id, package_id, price_amount, currency_code,
		          granted_entitlements, granted_app_codes, start_at, end_at,
		          status, version, created_at, updated_at
	`

	var s TenantSubscription
	var returnedEntitlementsJSON []byte
	var appCodes []string

	err = h.db.QueryRow(
		insertQuery,
		id, req.TenantID, req.PackageID, priceAmount, currencyCode,
		entitlementsJSON, startAt, req.EndAt,
	).Scan(
		&s.ID, &s.TenantID, &s.PackageID, &s.PriceAmount,
		&s.CurrencyCode, &returnedEntitlementsJSON, &appCodes,
		&s.StartAt, &s.EndAt, &s.Status, &s.Version,
		&s.CreatedAt, &s.UpdatedAt,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create subscription: " + err.Error(),
		})
		return
	}

	if len(returnedEntitlementsJSON) > 0 {
		json.Unmarshal(returnedEntitlementsJSON, &s.GrantedEntitlements)
	}
	s.GrantedAppCodes = appCodes

	c.JSON(http.StatusCreated, s)
}

// Update godoc
// @Summary Update subscription
// @Description Update an existing tenant subscription
// @Tags subscriptions
// @Accept json
// @Produce json
// @Param id path string true "Subscription ID"
// @Param subscription body UpdateSubscriptionRequest true "Subscription data"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /subscriptions/{id} [patch]
func (h *SubscriptionsHandler) Update(c *gin.Context) {
	id := c.Param("id")

	if _, err := uuid.Parse(id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid subscription ID format",
		})
		return
	}

	var req UpdateSubscriptionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request data: " + err.Error(),
		})
		return
	}

	updates := []string{}
	args := []interface{}{}
	argPos := 1

	if req.Status != nil {
		validStatuses := map[string]bool{
			"ACTIVE": true, "EXPIRED": true, "CANCELLED": true, "PAST_DUE": true,
		}
		if !validStatuses[*req.Status] {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Invalid status",
			})
			return
		}
		updates = append(updates, fmt.Sprintf("status = $%d", argPos))
		args = append(args, *req.Status)
		argPos++
	}

	if req.EndAt != nil {
		updates = append(updates, fmt.Sprintf("end_at = $%d", argPos))
		args = append(args, req.EndAt)
		argPos++
	}

	if req.GrantedEntitlements != nil {
		entitlementsJSON, _ := json.Marshal(*req.GrantedEntitlements)
		updates = append(updates, fmt.Sprintf("granted_entitlements = $%d", argPos))
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
		"UPDATE tenant_subscriptions SET %s WHERE _id = $%d AND deleted_at IS NULL RETURNING updated_at",
		strings.Join(updates, ", "),
		argPos,
	)
	args = append(args, id)

	var updatedAt time.Time
	err := h.db.QueryRow(query, args...).Scan(&updatedAt)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Subscription not found",
		})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update subscription: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "Subscription updated successfully",
		"updated_at": updatedAt,
	})
}

// Delete godoc
// @Summary Delete subscription
// @Description Soft delete a tenant subscription
// @Tags subscriptions
// @Accept json
// @Produce json
// @Param id path string true "Subscription ID"
// @Success 200 {object} map[string]string
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /subscriptions/{id} [delete]
func (h *SubscriptionsHandler) Delete(c *gin.Context) {
	id := c.Param("id")

	if _, err := uuid.Parse(id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid subscription ID format",
		})
		return
	}

	query := `
		UPDATE tenant_subscriptions 
		SET deleted_at = NOW(), updated_at = NOW(), status = 'CANCELLED'
		WHERE _id = $1 AND deleted_at IS NULL
		RETURNING _id
	`

	var deletedID string
	err := h.db.QueryRow(query, id).Scan(&deletedID)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Subscription not found",
		})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to delete subscription: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Subscription cancelled successfully",
	})
}
