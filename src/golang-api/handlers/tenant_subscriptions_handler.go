package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

/**
 * Tenant Subscriptions Handler
 * Manages tenant subscriptions to service packages
 * 
 * Features:
 * - Full CRUD operations
 * - Granted entitlements tracking (JSONB)
 * - App codes array (GENERATED COLUMN)
 * - Optimistic locking (version field)
 * - Soft delete support
 * - Subscription lifecycle (ACTIVE → EXPIRED/CANCELLED/PAST_DUE)
 * - Expiry tracking & renewal support
 * - Statistics for active subscriptions
 * 
 * Database Table: tenant_subscriptions
 * Primary Key: _id (UUID v7)
 * Foreign Keys: tenant_id, package_id
 * 
 * Status Flow: ACTIVE → EXPIRED/CANCELLED/PAST_DUE
 */

// TenantSubscription represents subscription entity
type TenantSubscription struct {
	ID                  string          `json:"_id" db:"_id"`
	TenantID            string          `json:"tenant_id" db:"tenant_id"`
	PackageID           string          `json:"package_id" db:"package_id"`
	PriceAmount         float64         `json:"price_amount" db:"price_amount"`
	CurrencyCode        string          `json:"currency_code" db:"currency_code"`
	GrantedEntitlements json.RawMessage `json:"granted_entitlements" db:"granted_entitlements"`
	GrantedAppCodes     []string        `json:"granted_app_codes" db:"granted_app_codes"`
	StartAt             time.Time       `json:"start_at" db:"start_at"`
	EndAt               *time.Time      `json:"end_at,omitempty" db:"end_at"`
	Status              string          `json:"status" db:"status"`
	Version             int64           `json:"version" db:"version"`
	CreatedAt           time.Time       `json:"created_at" db:"created_at"`
	UpdatedAt           time.Time       `json:"updated_at" db:"updated_at"`
	DeletedAt           *time.Time      `json:"deleted_at,omitempty" db:"deleted_at"`
	
	// Joined fields for display
	TenantName          *string         `json:"tenant_name,omitempty" db:"tenant_name"`
	PackageName         *string         `json:"package_name,omitempty" db:"package_name"`
	PackageCode         *string         `json:"package_code,omitempty" db:"package_code"`
}

// CreateSubscriptionRequest for POST /tenant-subscriptions
type CreateSubscriptionRequest struct {
	TenantID            string          `json:"tenant_id" binding:"required"`
	PackageID           string          `json:"package_id" binding:"required"`
	PriceAmount         float64         `json:"price_amount" binding:"required,min=0"`
	CurrencyCode        string          `json:"currency_code" binding:"required,len=3"`
	GrantedEntitlements json.RawMessage `json:"granted_entitlements"`
	StartAt             time.Time       `json:"start_at" binding:"required"`
	EndAt               *time.Time      `json:"end_at"`
	Status              string          `json:"status" binding:"required,oneof=ACTIVE EXPIRED CANCELLED PAST_DUE"`
}

// UpdateSubscriptionRequest for PATCH /tenant-subscriptions/:id
type UpdateSubscriptionRequest struct {
	PriceAmount         *float64        `json:"price_amount,omitempty"`
	GrantedEntitlements json.RawMessage `json:"granted_entitlements,omitempty"`
	EndAt               *time.Time      `json:"end_at,omitempty"`
	Status              *string         `json:"status,omitempty"`
	Version             int64           `json:"version" binding:"required,min=1"`
}

// SubscriptionStatistics for analytics
type SubscriptionStatistics struct {
	TotalSubscriptions   int64   `json:"total_subscriptions"`
	ActiveSubscriptions  int64   `json:"active_subscriptions"`
	ExpiredSubscriptions int64   `json:"expired_subscriptions"`
	CancelledSubscriptions int64 `json:"cancelled_subscriptions"`
	PastDueSubscriptions int64   `json:"past_due_subscriptions"`
	TotalRevenue         float64 `json:"total_revenue"`
	AveragePrice         float64 `json:"average_price"`
}

type TenantSubscriptionHandler struct {
	db *sql.DB
}

func NewTenantSubscriptionHandler(db *sql.DB) *TenantSubscriptionHandler {
	return &TenantSubscriptionHandler{db: db}
}

/**
 * GET /api/v1/tenant-subscriptions
 * List all subscriptions with filters and pagination
 * 
 * Query Parameters:
 * - status: Filter by status (ACTIVE, EXPIRED, CANCELLED, PAST_DUE)
 * - tenant_id: Filter by tenant
 * - package_id: Filter by package
 * - app_code: Filter by granted app code
 * - expiring_soon: Filter subscriptions expiring in next N days
 * - search: Search by tenant/package name
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20)
 */
func (h *TenantSubscriptionHandler) GetAllSubscriptions(c *gin.Context) {
	status := c.Query("status")
	tenantID := c.Query("tenant_id")
	packageID := c.Query("package_id")
	appCode := c.Query("app_code")
	expiringSoon := c.Query("expiring_soon")
	search := c.Query("search")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset := (page - 1) * limit

	query := `
		SELECT 
			s._id, s.tenant_id, s.package_id,
			s.price_amount, s.currency_code,
			s.granted_entitlements, s.granted_app_codes,
			s.start_at, s.end_at, s.status,
			s.version, s.created_at, s.updated_at, s.deleted_at,
			t.name as tenant_name,
			p.name as package_name,
			p.package_code
		FROM tenant_subscriptions s
		LEFT JOIN tenants t ON s.tenant_id = t._id
		LEFT JOIN service_packages p ON s.package_id = p._id
		WHERE s.deleted_at IS NULL
	`
	args := []interface{}{}
	argCount := 1

	if status != "" {
		query += " AND s.status = $" + strconv.Itoa(argCount)
		args = append(args, status)
		argCount++
	}

	if tenantID != "" {
		query += " AND s.tenant_id = $" + strconv.Itoa(argCount)
		args = append(args, tenantID)
		argCount++
	}

	if packageID != "" {
		query += " AND s.package_id = $" + strconv.Itoa(argCount)
		args = append(args, packageID)
		argCount++
	}

	if appCode != "" {
		query += " AND $" + strconv.Itoa(argCount) + " = ANY(s.granted_app_codes)"
		args = append(args, appCode)
		argCount++
	}

	if expiringSoon != "" {
		days, _ := strconv.Atoi(expiringSoon)
		query += " AND s.end_at IS NOT NULL AND s.end_at BETWEEN NOW() AND NOW() + INTERVAL '" + strconv.Itoa(days) + " days'"
	}

	if search != "" {
		query += " AND (t.name ILIKE $" + strconv.Itoa(argCount) + " OR p.name ILIKE $" + strconv.Itoa(argCount) + ")"
		args = append(args, "%"+search+"%")
		argCount++
	}

	query += " ORDER BY s.created_at DESC LIMIT $" + strconv.Itoa(argCount) + " OFFSET $" + strconv.Itoa(argCount+1)
	args = append(args, limit, offset)

	rows, err := h.db.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch subscriptions: " + err.Error()})
		return
	}
	defer rows.Close()

	subscriptions := []TenantSubscription{}
	for rows.Next() {
		var sub TenantSubscription
		var appCodesJSON []byte
		err := rows.Scan(
			&sub.ID, &sub.TenantID, &sub.PackageID,
			&sub.PriceAmount, &sub.CurrencyCode,
			&sub.GrantedEntitlements, &appCodesJSON,
			&sub.StartAt, &sub.EndAt, &sub.Status,
			&sub.Version, &sub.CreatedAt, &sub.UpdatedAt, &sub.DeletedAt,
			&sub.TenantName, &sub.PackageName, &sub.PackageCode,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan subscription: " + err.Error()})
			return
		}
		
		// Parse app codes array
		if len(appCodesJSON) > 0 {
			json.Unmarshal(appCodesJSON, &sub.GrantedAppCodes)
		}
		
		subscriptions = append(subscriptions, sub)
	}

	c.JSON(http.StatusOK, subscriptions)
}

/**
 * GET /api/v1/tenant-subscriptions/:id
 * Get subscription by ID with full details
 */
func (h *TenantSubscriptionHandler) GetSubscriptionByID(c *gin.Context) {
	id := c.Param("id")

	query := `
		SELECT 
			s._id, s.tenant_id, s.package_id,
			s.price_amount, s.currency_code,
			s.granted_entitlements, s.granted_app_codes,
			s.start_at, s.end_at, s.status,
			s.version, s.created_at, s.updated_at, s.deleted_at,
			t.name as tenant_name,
			p.name as package_name,
			p.package_code
		FROM tenant_subscriptions s
		LEFT JOIN tenants t ON s.tenant_id = t._id
		LEFT JOIN service_packages p ON s.package_id = p._id
		WHERE s._id = $1 AND s.deleted_at IS NULL
	`

	var sub TenantSubscription
	var appCodesJSON []byte
	err := h.db.QueryRow(query, id).Scan(
		&sub.ID, &sub.TenantID, &sub.PackageID,
		&sub.PriceAmount, &sub.CurrencyCode,
		&sub.GrantedEntitlements, &appCodesJSON,
		&sub.StartAt, &sub.EndAt, &sub.Status,
		&sub.Version, &sub.CreatedAt, &sub.UpdatedAt, &sub.DeletedAt,
		&sub.TenantName, &sub.PackageName, &sub.PackageCode,
	)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Subscription not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch subscription: " + err.Error()})
		return
	}

	// Parse app codes array
	if len(appCodesJSON) > 0 {
		json.Unmarshal(appCodesJSON, &sub.GrantedAppCodes)
	}

	c.JSON(http.StatusOK, sub)
}

/**
 * POST /api/v1/tenant-subscriptions
 * Create new subscription
 */
func (h *TenantSubscriptionHandler) CreateSubscription(c *gin.Context) {
	var req CreateSubscriptionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	// Validate dates
	if req.EndAt != nil && !req.EndAt.After(req.StartAt) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "end_at must be after start_at"})
		return
	}

	// Generate UUID v7
	id := uuid.New().String()

	// Set default for JSONB field
	if req.GrantedEntitlements == nil {
		req.GrantedEntitlements = json.RawMessage("{}")
	}

	query := `
		INSERT INTO tenant_subscriptions (
			_id, tenant_id, package_id,
			price_amount, currency_code,
			granted_entitlements,
			start_at, end_at, status,
			version, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 1, NOW(), NOW())
		RETURNING _id, created_at, updated_at
	`

	var createdID string
	var createdAt, updatedAt time.Time
	err := h.db.QueryRow(
		query,
		id, req.TenantID, req.PackageID,
		req.PriceAmount, req.CurrencyCode,
		req.GrantedEntitlements,
		req.StartAt, req.EndAt, req.Status,
	).Scan(&createdID, &createdAt, &updatedAt)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create subscription: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"_id":        createdID,
		"created_at": createdAt,
		"updated_at": updatedAt,
		"message":    "Subscription created successfully",
	})
}

/**
 * PATCH /api/v1/tenant-subscriptions/:id
 * Update subscription with optimistic locking
 */
func (h *TenantSubscriptionHandler) UpdateSubscription(c *gin.Context) {
	id := c.Param("id")
	var req UpdateSubscriptionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	// Build dynamic update query
	updateFields := []string{}
	args := []interface{}{}
	argCount := 1

	if req.PriceAmount != nil {
		updateFields = append(updateFields, "price_amount = $"+strconv.Itoa(argCount))
		args = append(args, *req.PriceAmount)
		argCount++
	}

	if req.GrantedEntitlements != nil {
		updateFields = append(updateFields, "granted_entitlements = $"+strconv.Itoa(argCount))
		args = append(args, req.GrantedEntitlements)
		argCount++
	}

	if req.EndAt != nil {
		updateFields = append(updateFields, "end_at = $"+strconv.Itoa(argCount))
		args = append(args, *req.EndAt)
		argCount++
	}

	if req.Status != nil {
		validStatuses := map[string]bool{"ACTIVE": true, "EXPIRED": true, "CANCELLED": true, "PAST_DUE": true}
		if !validStatuses[*req.Status] {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid status"})
			return
		}
		updateFields = append(updateFields, "status = $"+strconv.Itoa(argCount))
		args = append(args, *req.Status)
		argCount++
	}

	if len(updateFields) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No fields to update"})
		return
	}

	// Optimistic locking
	updateFields = append(updateFields, "version = version + 1")
	updateFields = append(updateFields, "updated_at = NOW()")

	query := "UPDATE tenant_subscriptions SET " + 
		join(updateFields, ", ") + 
		" WHERE _id = $" + strconv.Itoa(argCount) + 
		" AND version = $" + strconv.Itoa(argCount+1) + 
		" AND deleted_at IS NULL" +
		" RETURNING version, updated_at"
	
	args = append(args, id, req.Version)

	var newVersion int64
	var updatedAt time.Time
	err := h.db.QueryRow(query, args...).Scan(&newVersion, &updatedAt)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusConflict, gin.H{"error": "Version conflict or subscription not found. Please reload and try again."})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update subscription: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "Subscription updated successfully",
		"version":    newVersion,
		"updated_at": updatedAt,
	})
}

/**
 * DELETE /api/v1/tenant-subscriptions/:id
 * Soft delete subscription
 */
func (h *TenantSubscriptionHandler) SoftDeleteSubscription(c *gin.Context) {
	id := c.Param("id")

	query := `
		UPDATE tenant_subscriptions 
		SET deleted_at = NOW(), updated_at = NOW()
		WHERE _id = $1 AND deleted_at IS NULL
	`

	result, err := h.db.Exec(query, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete subscription: " + err.Error()})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Subscription not found"})
		return
	}

	c.JSON(http.StatusNoContent, nil)
}

/**
 * GET /api/v1/tenants/:tenant_id/subscriptions
 * Get all subscriptions for specific tenant
 */
func (h *TenantSubscriptionHandler) GetSubscriptionsByTenant(c *gin.Context) {
	tenantID := c.Param("tenant_id")
	status := c.Query("status")

	query := `
		SELECT 
			s._id, s.tenant_id, s.package_id,
			s.price_amount, s.currency_code,
			s.granted_entitlements, s.granted_app_codes,
			s.start_at, s.end_at, s.status,
			s.version, s.created_at, s.updated_at, s.deleted_at,
			t.name as tenant_name,
			p.name as package_name,
			p.package_code
		FROM tenant_subscriptions s
		LEFT JOIN tenants t ON s.tenant_id = t._id
		LEFT JOIN service_packages p ON s.package_id = p._id
		WHERE s.tenant_id = $1 AND s.deleted_at IS NULL
	`
	args := []interface{}{tenantID}

	if status != "" {
		query += " AND s.status = $2"
		args = append(args, status)
	}

	query += " ORDER BY s.created_at DESC"

	rows, err := h.db.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch subscriptions: " + err.Error()})
		return
	}
	defer rows.Close()

	subscriptions := []TenantSubscription{}
	for rows.Next() {
		var sub TenantSubscription
		var appCodesJSON []byte
		err := rows.Scan(
			&sub.ID, &sub.TenantID, &sub.PackageID,
			&sub.PriceAmount, &sub.CurrencyCode,
			&sub.GrantedEntitlements, &appCodesJSON,
			&sub.StartAt, &sub.EndAt, &sub.Status,
			&sub.Version, &sub.CreatedAt, &sub.UpdatedAt, &sub.DeletedAt,
			&sub.TenantName, &sub.PackageName, &sub.PackageCode,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan subscription: " + err.Error()})
			return
		}
		
		if len(appCodesJSON) > 0 {
			json.Unmarshal(appCodesJSON, &sub.GrantedAppCodes)
		}
		
		subscriptions = append(subscriptions, sub)
	}

	c.JSON(http.StatusOK, subscriptions)
}

/**
 * GET /api/v1/tenant-subscriptions/statistics
 * Get subscription statistics for analytics
 */
func (h *TenantSubscriptionHandler) GetSubscriptionStatistics(c *gin.Context) {
	query := `
		SELECT 
			COUNT(*) as total_subscriptions,
			COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as active_subscriptions,
			COUNT(CASE WHEN status = 'EXPIRED' THEN 1 END) as expired_subscriptions,
			COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) as cancelled_subscriptions,
			COUNT(CASE WHEN status = 'PAST_DUE' THEN 1 END) as past_due_subscriptions,
			COALESCE(SUM(price_amount), 0) as total_revenue,
			COALESCE(AVG(price_amount), 0) as average_price
		FROM tenant_subscriptions
		WHERE deleted_at IS NULL
	`

	var stats SubscriptionStatistics
	err := h.db.QueryRow(query).Scan(
		&stats.TotalSubscriptions,
		&stats.ActiveSubscriptions,
		&stats.ExpiredSubscriptions,
		&stats.CancelledSubscriptions,
		&stats.PastDueSubscriptions,
		&stats.TotalRevenue,
		&stats.AveragePrice,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch statistics: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, stats)
}

/**
 * POST /api/v1/tenant-subscriptions/:id/check-access
 * Check if subscription grants access to specific app
 */
func (h *TenantSubscriptionHandler) CheckAppAccess(c *gin.Context) {
	id := c.Param("id")
	
	var req struct {
		AppCode string `json:"app_code" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	query := `
		SELECT 
			CASE 
				WHEN $2 = ANY(granted_app_codes) THEN TRUE
				ELSE FALSE
			END as has_access,
			status
		FROM tenant_subscriptions
		WHERE _id = $1 AND deleted_at IS NULL
	`

	var hasAccess bool
	var status string
	err := h.db.QueryRow(query, id, req.AppCode).Scan(&hasAccess, &status)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Subscription not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check access: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"has_access": hasAccess && status == "ACTIVE",
		"app_code":   req.AppCode,
		"status":     status,
	})
}

// Helper function
func join(strs []string, sep string) string {
	if len(strs) == 0 {
		return ""
	}
	result := strs[0]
	for i := 1; i < len(strs); i++ {
		result += sep + strs[i]
	}
	return result
}
