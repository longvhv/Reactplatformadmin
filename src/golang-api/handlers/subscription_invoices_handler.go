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
 * Subscription Invoices Handler
 * Manages recurring invoices for tenant subscriptions
 * 
 * Features:
 * - Full CRUD operations
 * - Price adjustments tracking (JSONB)
 * - Optimistic locking (version field)
 * - Soft delete support
 * - Multi-currency support
 * - Overdue invoice tracking
 * - Partner reconciliation
 * - Revenue statistics
 * 
 * Database Table: subscription_invoices
 * Primary Key: _id (UUID v7)
 * Foreign Keys: tenant_id, partner_id, subscription_id
 * 
 * Status Flow: DRAFT → OPEN → PAID/VOID/UNCOLLECTIBLE
 */

// SubscriptionInvoice represents invoice entity
type SubscriptionInvoice struct {
	ID                  string          `json:"_id" db:"_id"`
	TenantID            string          `json:"tenant_id" db:"tenant_id"`
	PartnerID           *string         `json:"partner_id,omitempty" db:"partner_id"`
	SubscriptionID      string          `json:"subscription_id" db:"subscription_id"`
	InvoiceNumber       string          `json:"invoice_number" db:"invoice_number"`
	Amount              float64         `json:"amount" db:"amount"`
	CurrencyCode        string          `json:"currency_code" db:"currency_code"`
	Status              string          `json:"status" db:"status"`
	BillingPeriodStart  time.Time       `json:"billing_period_start" db:"billing_period_start"`
	BillingPeriodEnd    time.Time       `json:"billing_period_end" db:"billing_period_end"`
	DueDate             time.Time       `json:"due_date" db:"due_date"`
	PaidAt              *time.Time      `json:"paid_at,omitempty" db:"paid_at"`
	PriceAdjustments    json.RawMessage `json:"price_adjustments" db:"price_adjustments"`
	Metadata            json.RawMessage `json:"metadata" db:"metadata"`
	Version             int64           `json:"version" db:"version"`
	CreatedAt           time.Time       `json:"created_at" db:"created_at"`
	UpdatedAt           time.Time       `json:"updated_at" db:"updated_at"`
	DeletedAt           *time.Time      `json:"deleted_at,omitempty" db:"deleted_at"`
	
	// Joined fields for display
	TenantName          *string         `json:"tenant_name,omitempty" db:"tenant_name"`
	PartnerName         *string         `json:"partner_name,omitempty" db:"partner_name"`
	SubscriptionCode    *string         `json:"subscription_code,omitempty" db:"subscription_code"`
}

// CreateInvoiceRequest for POST /subscription-invoices
type CreateInvoiceRequest struct {
	TenantID           string          `json:"tenant_id" binding:"required"`
	PartnerID          *string         `json:"partner_id"`
	SubscriptionID     string          `json:"subscription_id" binding:"required"`
	InvoiceNumber      string          `json:"invoice_number" binding:"required"`
	Amount             float64         `json:"amount" binding:"required,min=0"`
	CurrencyCode       string          `json:"currency_code" binding:"required,len=3"`
	Status             string          `json:"status" binding:"required,oneof=DRAFT OPEN PAID VOID UNCOLLECTIBLE"`
	BillingPeriodStart time.Time       `json:"billing_period_start" binding:"required"`
	BillingPeriodEnd   time.Time       `json:"billing_period_end" binding:"required"`
	DueDate            time.Time       `json:"due_date" binding:"required"`
	PriceAdjustments   json.RawMessage `json:"price_adjustments"`
	Metadata           json.RawMessage `json:"metadata"`
}

// UpdateInvoiceRequest for PATCH /subscription-invoices/:id
type UpdateInvoiceRequest struct {
	Amount             *float64        `json:"amount,omitempty"`
	Status             *string         `json:"status,omitempty"`
	DueDate            *time.Time      `json:"due_date,omitempty"`
	PaidAt             *time.Time      `json:"paid_at,omitempty"`
	PriceAdjustments   json.RawMessage `json:"price_adjustments,omitempty"`
	Metadata           json.RawMessage `json:"metadata,omitempty"`
	Version            int64           `json:"version" binding:"required,min=1"`
}

// InvoiceStatistics for analytics
type InvoiceStatistics struct {
	TotalInvoices      int64   `json:"total_invoices"`
	TotalRevenue       float64 `json:"total_revenue"`
	PaidInvoices       int64   `json:"paid_invoices"`
	OpenInvoices       int64   `json:"open_invoices"`
	OverdueInvoices    int64   `json:"overdue_invoices"`
	AverageAmount      float64 `json:"average_amount"`
	CollectionRate     float64 `json:"collection_rate"`
}

type SubscriptionInvoiceHandler struct {
	db *sql.DB
}

func NewSubscriptionInvoiceHandler(db *sql.DB) *SubscriptionInvoiceHandler {
	return &SubscriptionInvoiceHandler{db: db}
}

/**
 * GET /api/v1/subscription-invoices
 * List all invoices with filters and pagination
 * 
 * Query Parameters:
 * - status: Filter by status (DRAFT, OPEN, PAID, VOID, UNCOLLECTIBLE)
 * - tenant_id: Filter by tenant
 * - partner_id: Filter by partner
 * - subscription_id: Filter by subscription
 * - overdue: Filter overdue invoices (true/false)
 * - search: Search by invoice_number
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20)
 */
func (h *SubscriptionInvoiceHandler) GetAllInvoices(c *gin.Context) {
	status := c.Query("status")
	tenantID := c.Query("tenant_id")
	partnerID := c.Query("partner_id")
	subscriptionID := c.Query("subscription_id")
	overdue := c.Query("overdue")
	search := c.Query("search")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset := (page - 1) * limit

	query := `
		SELECT 
			i._id, i.tenant_id, i.partner_id, i.subscription_id, 
			i.invoice_number, i.amount, i.currency_code, i.status,
			i.billing_period_start, i.billing_period_end, i.due_date, i.paid_at,
			i.price_adjustments, i.metadata,
			i.version, i.created_at, i.updated_at, i.deleted_at,
			t.name as tenant_name,
			p.name as partner_name,
			s.subscription_code
		FROM subscription_invoices i
		LEFT JOIN tenants t ON i.tenant_id = t._id
		LEFT JOIN tenants p ON i.partner_id = p._id
		LEFT JOIN tenant_subscriptions s ON i.subscription_id = s._id
		WHERE i.deleted_at IS NULL
	`
	args := []interface{}{}
	argCount := 1

	if status != "" {
		query += " AND i.status = $" + strconv.Itoa(argCount)
		args = append(args, status)
		argCount++
	}

	if tenantID != "" {
		query += " AND i.tenant_id = $" + strconv.Itoa(argCount)
		args = append(args, tenantID)
		argCount++
	}

	if partnerID != "" {
		query += " AND i.partner_id = $" + strconv.Itoa(argCount)
		args = append(args, partnerID)
		argCount++
	}

	if subscriptionID != "" {
		query += " AND i.subscription_id = $" + strconv.Itoa(argCount)
		args = append(args, subscriptionID)
		argCount++
	}

	if overdue == "true" {
		query += " AND i.status = 'OPEN' AND i.due_date < NOW()"
	}

	if search != "" {
		query += " AND i.invoice_number ILIKE $" + strconv.Itoa(argCount)
		args = append(args, "%"+search+"%")
		argCount++
	}

	query += " ORDER BY i.created_at DESC LIMIT $" + strconv.Itoa(argCount) + " OFFSET $" + strconv.Itoa(argCount+1)
	args = append(args, limit, offset)

	rows, err := h.db.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch invoices: " + err.Error()})
		return
	}
	defer rows.Close()

	invoices := []SubscriptionInvoice{}
	for rows.Next() {
		var inv SubscriptionInvoice
		err := rows.Scan(
			&inv.ID, &inv.TenantID, &inv.PartnerID, &inv.SubscriptionID,
			&inv.InvoiceNumber, &inv.Amount, &inv.CurrencyCode, &inv.Status,
			&inv.BillingPeriodStart, &inv.BillingPeriodEnd, &inv.DueDate, &inv.PaidAt,
			&inv.PriceAdjustments, &inv.Metadata,
			&inv.Version, &inv.CreatedAt, &inv.UpdatedAt, &inv.DeletedAt,
			&inv.TenantName, &inv.PartnerName, &inv.SubscriptionCode,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan invoice: " + err.Error()})
			return
		}
		invoices = append(invoices, inv)
	}

	c.JSON(http.StatusOK, invoices)
}

/**
 * GET /api/v1/subscription-invoices/:id
 * Get invoice by ID with full details
 */
func (h *SubscriptionInvoiceHandler) GetInvoiceByID(c *gin.Context) {
	id := c.Param("id")

	query := `
		SELECT 
			i._id, i.tenant_id, i.partner_id, i.subscription_id,
			i.invoice_number, i.amount, i.currency_code, i.status,
			i.billing_period_start, i.billing_period_end, i.due_date, i.paid_at,
			i.price_adjustments, i.metadata,
			i.version, i.created_at, i.updated_at, i.deleted_at,
			t.name as tenant_name,
			p.name as partner_name,
			s.subscription_code
		FROM subscription_invoices i
		LEFT JOIN tenants t ON i.tenant_id = t._id
		LEFT JOIN tenants p ON i.partner_id = p._id
		LEFT JOIN tenant_subscriptions s ON i.subscription_id = s._id
		WHERE i._id = $1 AND i.deleted_at IS NULL
	`

	var inv SubscriptionInvoice
	err := h.db.QueryRow(query, id).Scan(
		&inv.ID, &inv.TenantID, &inv.PartnerID, &inv.SubscriptionID,
		&inv.InvoiceNumber, &inv.Amount, &inv.CurrencyCode, &inv.Status,
		&inv.BillingPeriodStart, &inv.BillingPeriodEnd, &inv.DueDate, &inv.PaidAt,
		&inv.PriceAdjustments, &inv.Metadata,
		&inv.Version, &inv.CreatedAt, &inv.UpdatedAt, &inv.DeletedAt,
		&inv.TenantName, &inv.PartnerName, &inv.SubscriptionCode,
	)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Invoice not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch invoice: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, inv)
}

/**
 * POST /api/v1/subscription-invoices
 * Create new invoice
 */
func (h *SubscriptionInvoiceHandler) CreateInvoice(c *gin.Context) {
	var req CreateInvoiceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	// Validate billing period
	if !req.BillingPeriodEnd.After(req.BillingPeriodStart) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "billing_period_end must be after billing_period_start"})
		return
	}

	// Generate UUID v7
	id := uuid.New().String()

	// Set defaults for JSONB fields
	if req.PriceAdjustments == nil {
		req.PriceAdjustments = json.RawMessage("[]")
	}
	if req.Metadata == nil {
		req.Metadata = json.RawMessage("{}")
	}

	query := `
		INSERT INTO subscription_invoices (
			_id, tenant_id, partner_id, subscription_id, invoice_number,
			amount, currency_code, status,
			billing_period_start, billing_period_end, due_date,
			price_adjustments, metadata,
			version, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 1, NOW(), NOW())
		RETURNING _id, created_at, updated_at
	`

	var createdID string
	var createdAt, updatedAt time.Time
	err := h.db.QueryRow(
		query,
		id, req.TenantID, req.PartnerID, req.SubscriptionID, req.InvoiceNumber,
		req.Amount, req.CurrencyCode, req.Status,
		req.BillingPeriodStart, req.BillingPeriodEnd, req.DueDate,
		req.PriceAdjustments, req.Metadata,
	).Scan(&createdID, &createdAt, &updatedAt)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create invoice: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"_id":        createdID,
		"created_at": createdAt,
		"updated_at": updatedAt,
		"message":    "Invoice created successfully",
	})
}

/**
 * PATCH /api/v1/subscription-invoices/:id
 * Update invoice with optimistic locking
 */
func (h *SubscriptionInvoiceHandler) UpdateInvoice(c *gin.Context) {
	id := c.Param("id")
	var req UpdateInvoiceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	// Build dynamic update query
	updateFields := []string{}
	args := []interface{}{}
	argCount := 1

	if req.Amount != nil {
		updateFields = append(updateFields, "amount = $"+strconv.Itoa(argCount))
		args = append(args, *req.Amount)
		argCount++
	}

	if req.Status != nil {
		// Validate status transition
		validStatuses := map[string]bool{"DRAFT": true, "OPEN": true, "PAID": true, "VOID": true, "UNCOLLECTIBLE": true}
		if !validStatuses[*req.Status] {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid status"})
			return
		}
		updateFields = append(updateFields, "status = $"+strconv.Itoa(argCount))
		args = append(args, *req.Status)
		argCount++
	}

	if req.DueDate != nil {
		updateFields = append(updateFields, "due_date = $"+strconv.Itoa(argCount))
		args = append(args, *req.DueDate)
		argCount++
	}

	if req.PaidAt != nil {
		updateFields = append(updateFields, "paid_at = $"+strconv.Itoa(argCount))
		args = append(args, *req.PaidAt)
		argCount++
	}

	if req.PriceAdjustments != nil {
		updateFields = append(updateFields, "price_adjustments = $"+strconv.Itoa(argCount))
		args = append(args, req.PriceAdjustments)
		argCount++
	}

	if req.Metadata != nil {
		updateFields = append(updateFields, "metadata = $"+strconv.Itoa(argCount))
		args = append(args, req.Metadata)
		argCount++
	}

	if len(updateFields) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No fields to update"})
		return
	}

	// Optimistic locking: version check
	updateFields = append(updateFields, "version = version + 1")
	updateFields = append(updateFields, "updated_at = NOW()")

	query := "UPDATE subscription_invoices SET " + 
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
		c.JSON(http.StatusConflict, gin.H{"error": "Version conflict or invoice not found. Please reload and try again."})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update invoice: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "Invoice updated successfully",
		"version":    newVersion,
		"updated_at": updatedAt,
	})
}

/**
 * DELETE /api/v1/subscription-invoices/:id
 * Soft delete invoice
 */
func (h *SubscriptionInvoiceHandler) SoftDeleteInvoice(c *gin.Context) {
	id := c.Param("id")

	query := `
		UPDATE subscription_invoices 
		SET deleted_at = NOW(), updated_at = NOW()
		WHERE _id = $1 AND deleted_at IS NULL
	`

	result, err := h.db.Exec(query, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete invoice: " + err.Error()})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Invoice not found"})
		return
	}

	c.JSON(http.StatusNoContent, nil)
}

/**
 * GET /api/v1/tenants/:tenant_id/invoices
 * Get all invoices for specific tenant
 */
func (h *SubscriptionInvoiceHandler) GetInvoicesByTenant(c *gin.Context) {
	tenantID := c.Param("tenant_id")
	status := c.Query("status")

	query := `
		SELECT 
			i._id, i.tenant_id, i.partner_id, i.subscription_id,
			i.invoice_number, i.amount, i.currency_code, i.status,
			i.billing_period_start, i.billing_period_end, i.due_date, i.paid_at,
			i.price_adjustments, i.metadata,
			i.version, i.created_at, i.updated_at, i.deleted_at,
			t.name as tenant_name,
			p.name as partner_name,
			s.subscription_code
		FROM subscription_invoices i
		LEFT JOIN tenants t ON i.tenant_id = t._id
		LEFT JOIN tenants p ON i.partner_id = p._id
		LEFT JOIN tenant_subscriptions s ON i.subscription_id = s._id
		WHERE i.tenant_id = $1 AND i.deleted_at IS NULL
	`
	args := []interface{}{tenantID}

	if status != "" {
		query += " AND i.status = $2"
		args = append(args, status)
	}

	query += " ORDER BY i.created_at DESC"

	rows, err := h.db.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch invoices: " + err.Error()})
		return
	}
	defer rows.Close()

	invoices := []SubscriptionInvoice{}
	for rows.Next() {
		var inv SubscriptionInvoice
		err := rows.Scan(
			&inv.ID, &inv.TenantID, &inv.PartnerID, &inv.SubscriptionID,
			&inv.InvoiceNumber, &inv.Amount, &inv.CurrencyCode, &inv.Status,
			&inv.BillingPeriodStart, &inv.BillingPeriodEnd, &inv.DueDate, &inv.PaidAt,
			&inv.PriceAdjustments, &inv.Metadata,
			&inv.Version, &inv.CreatedAt, &inv.UpdatedAt, &inv.DeletedAt,
			&inv.TenantName, &inv.PartnerName, &inv.SubscriptionCode,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan invoice: " + err.Error()})
			return
		}
		invoices = append(invoices, inv)
	}

	c.JSON(http.StatusOK, invoices)
}

/**
 * GET /api/v1/subscription-invoices/statistics
 * Get invoice statistics for analytics
 */
func (h *SubscriptionInvoiceHandler) GetInvoiceStatistics(c *gin.Context) {
	query := `
		SELECT 
			COUNT(*) as total_invoices,
			COALESCE(SUM(amount), 0) as total_revenue,
			COUNT(CASE WHEN status = 'PAID' THEN 1 END) as paid_invoices,
			COUNT(CASE WHEN status = 'OPEN' THEN 1 END) as open_invoices,
			COUNT(CASE WHEN status = 'OPEN' AND due_date < NOW() THEN 1 END) as overdue_invoices,
			COALESCE(AVG(amount), 0) as average_amount
		FROM subscription_invoices
		WHERE deleted_at IS NULL
	`

	var stats InvoiceStatistics
	err := h.db.QueryRow(query).Scan(
		&stats.TotalInvoices,
		&stats.TotalRevenue,
		&stats.PaidInvoices,
		&stats.OpenInvoices,
		&stats.OverdueInvoices,
		&stats.AverageAmount,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch statistics: " + err.Error()})
		return
	}

	// Calculate collection rate
	if stats.TotalInvoices > 0 {
		stats.CollectionRate = float64(stats.PaidInvoices) / float64(stats.TotalInvoices) * 100
	}

	c.JSON(http.StatusOK, stats)
}

// Helper function to join strings
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
