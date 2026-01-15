/**
 * Subscription Orders API Handler
 * Handles order creation, processing, and lifecycle management
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

type OrdersHandler struct {
	db *sql.DB
}

func NewOrdersHandler(db *sql.DB) *OrdersHandler {
	return &OrdersHandler{db: db}
}

// ==================== TYPES ====================

type SubscriptionOrder struct {
	ID              string                 `json:"_id"`
	TenantID        string                 `json:"tenant_id"`
	PackageID       string                 `json:"package_id"`
	OrderNumber     string                 `json:"order_number"`
	TotalAmount     float64                `json:"total_amount"`
	CurrencyCode    string                 `json:"currency_code"`
	Status          string                 `json:"status"`
	PaymentMethod   *string                `json:"payment_method,omitempty"`
	PackageSnapshot map[string]interface{} `json:"package_snapshot"`
	Version         int64                  `json:"version"`
	CreatedAt       time.Time              `json:"created_at"`
	UpdatedAt       time.Time              `json:"updated_at"`
	DeletedAt       *time.Time             `json:"deleted_at,omitempty"`
}

type OrderWithDetails struct {
	SubscriptionOrder
	TenantName        string `json:"tenant_name"`
	PackageCode       string `json:"package_code"`
	PackageName       string `json:"package_name"`
	ProductName       string `json:"product_name"`
	SubscriptionID    *string `json:"subscription_id,omitempty"`
	SubscriptionCreated bool  `json:"subscription_created"`
}

type CreateOrderRequest struct {
	TenantID      string   `json:"tenant_id" binding:"required"`
	PackageID     string   `json:"package_id" binding:"required"`
	PaymentMethod *string  `json:"payment_method"`
	TotalAmount   *float64 `json:"total_amount"`
	CurrencyCode  *string  `json:"currency_code"`
}

type UpdateOrderRequest struct {
	Status        *string `json:"status,omitempty"`
	PaymentMethod *string `json:"payment_method,omitempty"`
}

type ProcessPaymentRequest struct {
	PaymentMethod string `json:"payment_method" binding:"required"`
}

// ==================== HANDLERS ====================

// GetAll godoc
// @Summary List orders
// @Description Get list of subscription orders with filtering
// @Tags orders
// @Accept json
// @Produce json
// @Param tenant_id query string false "Filter by tenant ID"
// @Param status query string false "Filter by status"
// @Param limit query int false "Limit results" default(50)
// @Param offset query int false "Offset results" default(0)
// @Success 200 {array} SubscriptionOrder
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /orders [get]
func (h *OrdersHandler) GetAll(c *gin.Context) {
	tenantID := c.Query("tenant_id")
	status := c.Query("status")
	limit := c.DefaultQuery("limit", "50")
	offset := c.DefaultQuery("offset", "0")

	query := `
		SELECT _id, tenant_id, package_id, order_number, total_amount,
		       currency_code, status, payment_method, package_snapshot,
		       version, created_at, updated_at, deleted_at
		FROM subscription_orders
		WHERE deleted_at IS NULL
	`
	args := []interface{}{}
	argPos := 1

	if tenantID != "" {
		query += ` AND tenant_id = $` + fmt.Sprint(argPos)
		args = append(args, tenantID)
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
			"error": "Failed to fetch orders: " + err.Error(),
		})
		return
	}
	defer rows.Close()

	orders := []SubscriptionOrder{}
	for rows.Next() {
		var o SubscriptionOrder
		var snapshotJSON []byte

		err := rows.Scan(
			&o.ID, &o.TenantID, &o.PackageID, &o.OrderNumber,
			&o.TotalAmount, &o.CurrencyCode, &o.Status,
			&o.PaymentMethod, &snapshotJSON, &o.Version,
			&o.CreatedAt, &o.UpdatedAt, &o.DeletedAt,
		)
		if err != nil {
			continue
		}

		if len(snapshotJSON) > 0 {
			json.Unmarshal(snapshotJSON, &o.PackageSnapshot)
		}

		orders = append(orders, o)
	}

	c.JSON(http.StatusOK, orders)
}

// GetByID godoc
// @Summary Get order by ID
// @Description Get a single order by ID
// @Tags orders
// @Accept json
// @Produce json
// @Param id path string true "Order ID"
// @Success 200 {object} SubscriptionOrder
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /orders/{id} [get]
func (h *OrdersHandler) GetByID(c *gin.Context) {
	id := c.Param("id")

	if _, err := uuid.Parse(id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid order ID format",
		})
		return
	}

	query := `
		SELECT _id, tenant_id, package_id, order_number, total_amount,
		       currency_code, status, payment_method, package_snapshot,
		       version, created_at, updated_at, deleted_at
		FROM subscription_orders
		WHERE _id = $1 AND deleted_at IS NULL
	`

	var o SubscriptionOrder
	var snapshotJSON []byte

	err := h.db.QueryRow(query, id).Scan(
		&o.ID, &o.TenantID, &o.PackageID, &o.OrderNumber,
		&o.TotalAmount, &o.CurrencyCode, &o.Status,
		&o.PaymentMethod, &snapshotJSON, &o.Version,
		&o.CreatedAt, &o.UpdatedAt, &o.DeletedAt,
	)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Order not found",
		})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch order: " + err.Error(),
		})
		return
	}

	if len(snapshotJSON) > 0 {
		json.Unmarshal(snapshotJSON, &o.PackageSnapshot)
	}

	c.JSON(http.StatusOK, o)
}

// GetByOrderNumber godoc
// @Summary Get order by order number
// @Description Get order by business order number
// @Tags orders
// @Accept json
// @Produce json
// @Param order_number path string true "Order Number"
// @Success 200 {object} SubscriptionOrder
// @Failure 404 {object} ErrorResponse
// @Router /orders/number/{order_number} [get]
func (h *OrdersHandler) GetByOrderNumber(c *gin.Context) {
	orderNumber := c.Param("order_number")

	query := `
		SELECT _id, tenant_id, package_id, order_number, total_amount,
		       currency_code, status, payment_method, package_snapshot,
		       version, created_at, updated_at, deleted_at
		FROM subscription_orders
		WHERE order_number = $1 AND deleted_at IS NULL
	`

	var o SubscriptionOrder
	var snapshotJSON []byte

	err := h.db.QueryRow(query, orderNumber).Scan(
		&o.ID, &o.TenantID, &o.PackageID, &o.OrderNumber,
		&o.TotalAmount, &o.CurrencyCode, &o.Status,
		&o.PaymentMethod, &snapshotJSON, &o.Version,
		&o.CreatedAt, &o.UpdatedAt, &o.DeletedAt,
	)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Order not found",
		})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch order: " + err.Error(),
		})
		return
	}

	if len(snapshotJSON) > 0 {
		json.Unmarshal(snapshotJSON, &o.PackageSnapshot)
	}

	c.JSON(http.StatusOK, o)
}

// Create godoc
// @Summary Create order
// @Description Create a new subscription order
// @Tags orders
// @Accept json
// @Produce json
// @Param order body CreateOrderRequest true "Order data"
// @Success 201 {object} SubscriptionOrder
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /orders [post]
func (h *OrdersHandler) Create(c *gin.Context) {
	var req CreateOrderRequest
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
	var packageData []byte
	packageQuery := `
		SELECT p.price, p.currency, 
		       jsonb_build_object(
		           'code', p.code,
		           'name', p.name,
		           'price', p.price,
		           'currency', p.currency,
		           'billing_cycle', p.billing_cycle,
		           'entitlements_config', p.entitlements_config
		       ) as package_snapshot
		FROM service_packages p
		WHERE p._id = $1 AND p.deleted_at IS NULL AND p.is_active = TRUE
	`
	err = h.db.QueryRow(packageQuery, req.PackageID).Scan(
		&packagePrice, &packageCurrency, &packageData,
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
	totalAmount := packagePrice
	if req.TotalAmount != nil {
		totalAmount = *req.TotalAmount
	}

	// Use package currency if not provided
	currencyCode := packageCurrency
	if req.CurrencyCode != nil {
		currencyCode = *req.CurrencyCode
	}

	// Generate order number
	orderNumber := generateOrderNumber()

	id := uuid.New().String()

	insertQuery := `
		INSERT INTO subscription_orders (
			_id, tenant_id, package_id, order_number,
			total_amount, currency_code, payment_method, package_snapshot
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING _id, tenant_id, package_id, order_number, total_amount,
		          currency_code, status, payment_method, package_snapshot,
		          version, created_at, updated_at
	`

	var o SubscriptionOrder
	var returnedSnapshotJSON []byte

	err = h.db.QueryRow(
		insertQuery,
		id, req.TenantID, req.PackageID, orderNumber,
		totalAmount, currencyCode, req.PaymentMethod, string(packageData),
	).Scan(
		&o.ID, &o.TenantID, &o.PackageID, &o.OrderNumber,
		&o.TotalAmount, &o.CurrencyCode, &o.Status,
		&o.PaymentMethod, &returnedSnapshotJSON, &o.Version,
		&o.CreatedAt, &o.UpdatedAt,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create order: " + err.Error(),
		})
		return
	}

	if len(returnedSnapshotJSON) > 0 {
		json.Unmarshal(returnedSnapshotJSON, &o.PackageSnapshot)
	}

	c.JSON(http.StatusCreated, o)
}

// Update godoc
// @Summary Update order
// @Description Update an existing order
// @Tags orders
// @Accept json
// @Produce json
// @Param id path string true "Order ID"
// @Param order body UpdateOrderRequest true "Order data"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /orders/{id} [patch]
func (h *OrdersHandler) Update(c *gin.Context) {
	id := c.Param("id")

	if _, err := uuid.Parse(id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid order ID format",
		})
		return
	}

	var req UpdateOrderRequest
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
			"PENDING": true, "PAID": true, "CANCELLED": true, "FAILED": true,
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

	if req.PaymentMethod != nil {
		updates = append(updates, fmt.Sprintf("payment_method = $%d", argPos))
		args = append(args, *req.PaymentMethod)
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
		"UPDATE subscription_orders SET %s WHERE _id = $%d AND deleted_at IS NULL RETURNING updated_at",
		strings.Join(updates, ", "),
		argPos,
	)
	args = append(args, id)

	var updatedAt time.Time
	err := h.db.QueryRow(query, args...).Scan(&updatedAt)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Order not found",
		})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update order: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "Order updated successfully",
		"updated_at": updatedAt,
	})
}

// Delete godoc
// @Summary Delete order
// @Description Soft delete an order
// @Tags orders
// @Accept json
// @Produce json
// @Param id path string true "Order ID"
// @Success 200 {object} map[string]string
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /orders/{id} [delete]
func (h *OrdersHandler) Delete(c *gin.Context) {
	id := c.Param("id")

	if _, err := uuid.Parse(id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid order ID format",
		})
		return
	}

	query := `
		UPDATE subscription_orders 
		SET deleted_at = NOW(), updated_at = NOW(), status = 'CANCELLED'
		WHERE _id = $1 AND deleted_at IS NULL
		RETURNING _id
	`

	var deletedID string
	err := h.db.QueryRow(query, id).Scan(&deletedID)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Order not found",
		})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to delete order: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Order cancelled successfully",
	})
}

// GetWithDetails godoc
// @Summary Get order with full details
// @Description Get order with tenant, package, and product information
// @Tags orders
// @Accept json
// @Produce json
// @Param id path string true "Order ID"
// @Success 200 {object} OrderWithDetails
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Router /orders/{id}/details [get]
func (h *OrdersHandler) GetWithDetails(c *gin.Context) {
	id := c.Param("id")

	if _, err := uuid.Parse(id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid order ID format",
		})
		return
	}

	query := `
		SELECT 
			so._id, so.tenant_id, so.package_id, so.order_number,
			so.total_amount, so.currency_code, so.status,
			so.payment_method, so.package_snapshot,
			so.version, so.created_at, so.updated_at, so.deleted_at,
			t.name as tenant_name,
			sp.code as package_code,
			sp.name as package_name,
			p.name as product_name,
			ts._id as subscription_id,
			CASE WHEN ts._id IS NOT NULL THEN TRUE ELSE FALSE END as subscription_created
		FROM subscription_orders so
		JOIN tenants t ON so.tenant_id = t._id
		JOIN service_packages sp ON so.package_id = sp._id
		JOIN products p ON sp.product_id = p._id
		LEFT JOIN tenant_subscriptions ts ON ts.tenant_id = so.tenant_id 
		    AND ts.package_id = so.package_id 
		    AND ts.deleted_at IS NULL
		WHERE so._id = $1 AND so.deleted_at IS NULL
	`

	var o OrderWithDetails
	var snapshotJSON []byte

	err := h.db.QueryRow(query, id).Scan(
		&o.ID, &o.TenantID, &o.PackageID, &o.OrderNumber,
		&o.TotalAmount, &o.CurrencyCode, &o.Status,
		&o.PaymentMethod, &snapshotJSON, &o.Version,
		&o.CreatedAt, &o.UpdatedAt, &o.DeletedAt,
		&o.TenantName, &o.PackageCode, &o.PackageName,
		&o.ProductName, &o.SubscriptionID, &o.SubscriptionCreated,
	)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Order not found",
		})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch order details: " + err.Error(),
		})
		return
	}

	if len(snapshotJSON) > 0 {
		json.Unmarshal(snapshotJSON, &o.PackageSnapshot)
	}

	c.JSON(http.StatusOK, o)
}

// ProcessPayment godoc
// @Summary Process payment for order
// @Description Mark order as paid and create subscription
// @Tags orders
// @Accept json
// @Produce json
// @Param id path string true "Order ID"
// @Param payment body ProcessPaymentRequest true "Payment data"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /orders/{id}/process-payment [post]
func (h *OrdersHandler) ProcessPayment(c *gin.Context) {
	id := c.Param("id")

	if _, err := uuid.Parse(id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid order ID format",
		})
		return
	}

	var req ProcessPaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request data: " + err.Error(),
		})
		return
	}

	// Start transaction
	tx, err := h.db.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to start transaction: " + err.Error(),
		})
		return
	}
	defer tx.Rollback()

	// Get order details
	var tenantID, packageID string
	var totalAmount float64
	var currencyCode string
	var packageSnapshot []byte
	var currentStatus string

	orderQuery := `
		SELECT tenant_id, package_id, total_amount, currency_code, 
		       package_snapshot, status
		FROM subscription_orders
		WHERE _id = $1 AND deleted_at IS NULL
		FOR UPDATE
	`

	err = tx.QueryRow(orderQuery, id).Scan(
		&tenantID, &packageID, &totalAmount, &currencyCode,
		&packageSnapshot, &currentStatus,
	)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Order not found",
		})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch order: " + err.Error(),
		})
		return
	}

	if currentStatus != "PENDING" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Order is not in PENDING status",
		})
		return
	}

	// Update order status
	updateOrderQuery := `
		UPDATE subscription_orders
		SET status = 'PAID',
		    payment_method = $1,
		    updated_at = NOW(),
		    version = version + 1
		WHERE _id = $2
	`

	_, err = tx.Exec(updateOrderQuery, req.PaymentMethod, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update order: " + err.Error(),
		})
		return
	}

	// Parse package snapshot to get entitlements
	var snapshot map[string]interface{}
	json.Unmarshal(packageSnapshot, &snapshot)

	entitlements := snapshot["entitlements_config"]
	entitlementsJSON, _ := json.Marshal(entitlements)

	// Create subscription
	subscriptionID := uuid.New().String()
	createSubQuery := `
		INSERT INTO tenant_subscriptions (
			_id, tenant_id, package_id,
			price_amount, currency_code, granted_entitlements,
			start_at, status
		) VALUES ($1, $2, $3, $4, $5, $6, NOW(), 'ACTIVE')
		RETURNING _id
	`

	var createdSubID string
	err = tx.QueryRow(
		createSubQuery,
		subscriptionID, tenantID, packageID,
		totalAmount, currencyCode, string(entitlementsJSON),
	).Scan(&createdSubID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create subscription: " + err.Error(),
		})
		return
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to commit transaction: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":         "Payment processed successfully",
		"order_status":    "PAID",
		"subscription_id": createdSubID,
	})
}

// Helper function to generate order number
func generateOrderNumber() string {
	now := time.Now()
	return fmt.Sprintf("ORD-%s-%06d",
		now.Format("20060102"),
		now.Unix()%1000000,
	)
}
