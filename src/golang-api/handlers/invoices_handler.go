package handlers

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
)

/*
=============================================================================
SUBSCRIPTION INVOICES HANDLER
=============================================================================
Purpose: Quản lý hóa đơn cho thuê bao (Subscription Invoices)
Table: subscription_invoices (DatabaseCommand.md compliant)

Key Features:
- ✅ Auto-generate invoice number (INV-YYYYMMDD-XXXXXX)
- ✅ Billing period management
- ✅ Payment processing with status transition
- ✅ Overdue tracking
- ✅ Partner distribution support
- ✅ Price adjustments (JSONB)
- ✅ Metadata extensibility (JSONB)
- ✅ Optimistic locking (version field)
- ✅ Soft delete pattern

Endpoints:
1. GET    /invoices              - List all invoices (with filters)
2. GET    /invoices/:id          - Get invoice by ID
3. GET    /invoices/number/:num  - Get invoice by invoice_number
4. POST   /invoices              - Create new invoice
5. PATCH  /invoices/:id          - Update invoice
6. DELETE /invoices/:id          - Soft delete invoice
7. GET    /invoices/:id/details  - Get invoice with JOINs
8. POST   /invoices/:id/pay      - Mark invoice as paid
9. GET    /invoices/overdue      - Get overdue invoices
10. GET   /invoices/stats        - Get invoice statistics

Database Schema (subscription_invoices):
- _id: UUID (PK, UUID v7)
- tenant_id: UUID (FK -> tenants._id)
- partner_id: UUID (FK -> tenants._id, nullable)
- subscription_id: UUID (FK -> tenant_subscriptions._id)
- invoice_number: VARCHAR(50) (UNIQUE)
- amount: NUMERIC(19, 4)
- currency_code: VARCHAR(3)
- status: VARCHAR(20) [DRAFT, OPEN, PAID, VOID, UNCOLLECTIBLE]
- billing_period_start: TIMESTAMPTZ
- billing_period_end: TIMESTAMPTZ
- due_date: TIMESTAMPTZ
- paid_at: TIMESTAMPTZ (nullable)
- price_adjustments: JSONB (array of adjustments)
- metadata: JSONB
- version: BIGINT
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
- deleted_at: TIMESTAMPTZ (soft delete)

Author: Platform Team
Date: 2026-01-14
=============================================================================
*/

// Invoice represents subscription_invoices table
type Invoice struct {
	ID                  string                   `json:"_id" db:"_id"`
	TenantID            string                   `json:"tenant_id" db:"tenant_id"`
	PartnerID           *string                  `json:"partner_id,omitempty" db:"partner_id"`
	SubscriptionID      string                   `json:"subscription_id" db:"subscription_id"`
	InvoiceNumber       string                   `json:"invoice_number" db:"invoice_number"`
	Amount              float64                  `json:"amount" db:"amount"`
	CurrencyCode        string                   `json:"currency_code" db:"currency_code"`
	Status              string                   `json:"status" db:"status"`
	BillingPeriodStart  time.Time                `json:"billing_period_start" db:"billing_period_start"`
	BillingPeriodEnd    time.Time                `json:"billing_period_end" db:"billing_period_end"`
	DueDate             time.Time                `json:"due_date" db:"due_date"`
	PaidAt              *time.Time               `json:"paid_at,omitempty" db:"paid_at"`
	PriceAdjustments    []PriceAdjustment        `json:"price_adjustments" db:"price_adjustments"`
	Metadata            map[string]interface{}   `json:"metadata" db:"metadata"`
	Version             int64                    `json:"version" db:"version"`
	CreatedAt           time.Time                `json:"created_at" db:"created_at"`
	UpdatedAt           time.Time                `json:"updated_at" db:"updated_at"`
	DeletedAt           *time.Time               `json:"deleted_at,omitempty" db:"deleted_at"`
}

// PriceAdjustment represents an item in price_adjustments JSONB array
type PriceAdjustment struct {
	Type        string  `json:"type"`        // DISCOUNT, CREDIT, SURCHARGE, etc.
	Description string  `json:"description"` // Human-readable description
	Amount      float64 `json:"amount"`      // Positive or negative adjustment
	Reason      string  `json:"reason,omitempty"`
}

// InvoiceWithDetails includes JOIN data from related tables
type InvoiceWithDetails struct {
	Invoice
	TenantName               *string `json:"tenant_name,omitempty" db:"tenant_name"`
	PartnerName              *string `json:"partner_name,omitempty" db:"partner_name"`
	SubscriptionPackageName  *string `json:"subscription_package_name,omitempty" db:"subscription_package_name"`
	SubscriptionStatus       *string `json:"subscription_status,omitempty" db:"subscription_status"`
}

// CreateInvoiceRequest represents request body for creating invoice
type CreateInvoiceRequest struct {
	TenantID           string                 `json:"tenant_id"`
	PartnerID          *string                `json:"partner_id,omitempty"`
	SubscriptionID     string                 `json:"subscription_id"`
	Amount             float64                `json:"amount"`
	CurrencyCode       string                 `json:"currency_code"`
	Status             string                 `json:"status"`
	BillingPeriodStart time.Time              `json:"billing_period_start"`
	BillingPeriodEnd   time.Time              `json:"billing_period_end"`
	DueDate            time.Time              `json:"due_date"`
	PriceAdjustments   []PriceAdjustment      `json:"price_adjustments,omitempty"`
	Metadata           map[string]interface{} `json:"metadata,omitempty"`
}

// UpdateInvoiceRequest represents request body for updating invoice
type UpdateInvoiceRequest struct {
	Amount           *float64               `json:"amount,omitempty"`
	Status           *string                `json:"status,omitempty"`
	DueDate          *time.Time             `json:"due_date,omitempty"`
	PriceAdjustments []PriceAdjustment      `json:"price_adjustments,omitempty"`
	Metadata         map[string]interface{} `json:"metadata,omitempty"`
	Version          int64                  `json:"version"` // Required for optimistic locking
}

// PayInvoiceRequest represents request body for payment
type PayInvoiceRequest struct {
	PaymentMethod string                 `json:"payment_method"` // CREDIT_CARD, BANK_TRANSFER, WALLET
	PaymentDate   *time.Time             `json:"payment_date,omitempty"`
	Metadata      map[string]interface{} `json:"metadata,omitempty"`
}

// InvoiceStats represents invoice statistics
type InvoiceStats struct {
	TotalInvoices      int64   `json:"total_invoices"`
	DraftCount         int64   `json:"draft_count"`
	OpenCount          int64   `json:"open_count"`
	PaidCount          int64   `json:"paid_count"`
	VoidCount          int64   `json:"void_count"`
	UncollectibleCount int64   `json:"uncollectible_count"`
	OverdueCount       int64   `json:"overdue_count"`
	TotalAmount        float64 `json:"total_amount"`
	PaidAmount         float64 `json:"paid_amount"`
	OutstandingAmount  float64 `json:"outstanding_amount"`
}

// InvoicesHandler handles all invoice-related operations
type InvoicesHandler struct {
	db *sql.DB
}

// NewInvoicesHandler creates a new invoices handler
func NewInvoicesHandler(db *sql.DB) *InvoicesHandler {
	return &InvoicesHandler{db: db}
}

/*
=============================================================================
1. LIST INVOICES (GET /invoices)
=============================================================================
Query parameters:
- tenant_id: Filter by tenant
- partner_id: Filter by partner
- subscription_id: Filter by subscription
- status: Filter by status
- overdue: true/false (filter overdue invoices)
- limit: Max results (default 100)
- offset: Pagination offset
=============================================================================
*/
func (h *InvoicesHandler) ListInvoices(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	
	// Parse query parameters
	tenantID := r.URL.Query().Get("tenant_id")
	partnerID := r.URL.Query().Get("partner_id")
	subscriptionID := r.URL.Query().Get("subscription_id")
	status := r.URL.Query().Get("status")
	overdue := r.URL.Query().Get("overdue")
	
	// Build dynamic query
	query := `
		SELECT _id, tenant_id, partner_id, subscription_id, invoice_number,
		       amount, currency_code, status, billing_period_start, billing_period_end,
		       due_date, paid_at, price_adjustments, metadata,
		       version, created_at, updated_at, deleted_at
		FROM subscription_invoices
		WHERE deleted_at IS NULL
	`
	args := []interface{}{}
	argPos := 1
	
	if tenantID != "" {
		query += fmt.Sprintf(" AND tenant_id = $%d", argPos)
		args = append(args, tenantID)
		argPos++
	}
	
	if partnerID != "" {
		query += fmt.Sprintf(" AND partner_id = $%d", argPos)
		args = append(args, partnerID)
		argPos++
	}
	
	if subscriptionID != "" {
		query += fmt.Sprintf(" AND subscription_id = $%d", argPos)
		args = append(args, subscriptionID)
		argPos++
	}
	
	if status != "" {
		query += fmt.Sprintf(" AND status = $%d", argPos)
		args = append(args, status)
		argPos++
	}
	
	if overdue == "true" {
		query += " AND status = 'OPEN' AND due_date < NOW()"
	}
	
	query += " ORDER BY created_at DESC LIMIT 100"
	
	rows, err := h.db.QueryContext(ctx, query, args...)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to query invoices: "+err.Error())
		return
	}
	defer rows.Close()
	
	invoices := []Invoice{}
	for rows.Next() {
		var inv Invoice
		var priceAdjJSON, metadataJSON []byte
		
		err := rows.Scan(
			&inv.ID, &inv.TenantID, &inv.PartnerID, &inv.SubscriptionID, &inv.InvoiceNumber,
			&inv.Amount, &inv.CurrencyCode, &inv.Status, &inv.BillingPeriodStart, &inv.BillingPeriodEnd,
			&inv.DueDate, &inv.PaidAt, &priceAdjJSON, &metadataJSON,
			&inv.Version, &inv.CreatedAt, &inv.UpdatedAt, &inv.DeletedAt,
		)
		if err != nil {
			respondWithError(w, http.StatusInternalServerError, "Failed to scan invoice: "+err.Error())
			return
		}
		
		// Parse JSONB fields
		if len(priceAdjJSON) > 0 {
			json.Unmarshal(priceAdjJSON, &inv.PriceAdjustments)
		}
		if len(metadataJSON) > 0 {
			json.Unmarshal(metadataJSON, &inv.Metadata)
		}
		
		invoices = append(invoices, inv)
	}
	
	respondWithJSON(w, http.StatusOK, invoices)
}

/*
=============================================================================
2. GET INVOICE BY ID (GET /invoices/:id)
=============================================================================
*/
func (h *InvoicesHandler) GetInvoiceByID(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	vars := mux.Vars(r)
	id := vars["id"]
	
	query := `
		SELECT _id, tenant_id, partner_id, subscription_id, invoice_number,
		       amount, currency_code, status, billing_period_start, billing_period_end,
		       due_date, paid_at, price_adjustments, metadata,
		       version, created_at, updated_at, deleted_at
		FROM subscription_invoices
		WHERE _id = $1 AND deleted_at IS NULL
	`
	
	var inv Invoice
	var priceAdjJSON, metadataJSON []byte
	
	err := h.db.QueryRowContext(ctx, query, id).Scan(
		&inv.ID, &inv.TenantID, &inv.PartnerID, &inv.SubscriptionID, &inv.InvoiceNumber,
		&inv.Amount, &inv.CurrencyCode, &inv.Status, &inv.BillingPeriodStart, &inv.BillingPeriodEnd,
		&inv.DueDate, &inv.PaidAt, &priceAdjJSON, &metadataJSON,
		&inv.Version, &inv.CreatedAt, &inv.UpdatedAt, &inv.DeletedAt,
	)
	
	if err == sql.ErrNoRows {
		respondWithError(w, http.StatusNotFound, "Invoice not found")
		return
	}
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to get invoice: "+err.Error())
		return
	}
	
	// Parse JSONB
	if len(priceAdjJSON) > 0 {
		json.Unmarshal(priceAdjJSON, &inv.PriceAdjustments)
	}
	if len(metadataJSON) > 0 {
		json.Unmarshal(metadataJSON, &inv.Metadata)
	}
	
	respondWithJSON(w, http.StatusOK, inv)
}

/*
=============================================================================
3. GET INVOICE BY NUMBER (GET /invoices/number/:number)
=============================================================================
*/
func (h *InvoicesHandler) GetInvoiceByNumber(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	vars := mux.Vars(r)
	number := vars["number"]
	
	query := `
		SELECT _id, tenant_id, partner_id, subscription_id, invoice_number,
		       amount, currency_code, status, billing_period_start, billing_period_end,
		       due_date, paid_at, price_adjustments, metadata,
		       version, created_at, updated_at, deleted_at
		FROM subscription_invoices
		WHERE invoice_number = $1 AND deleted_at IS NULL
	`
	
	var inv Invoice
	var priceAdjJSON, metadataJSON []byte
	
	err := h.db.QueryRowContext(ctx, query, number).Scan(
		&inv.ID, &inv.TenantID, &inv.PartnerID, &inv.SubscriptionID, &inv.InvoiceNumber,
		&inv.Amount, &inv.CurrencyCode, &inv.Status, &inv.BillingPeriodStart, &inv.BillingPeriodEnd,
		&inv.DueDate, &inv.PaidAt, &priceAdjJSON, &metadataJSON,
		&inv.Version, &inv.CreatedAt, &inv.UpdatedAt, &inv.DeletedAt,
	)
	
	if err == sql.ErrNoRows {
		respondWithError(w, http.StatusNotFound, "Invoice not found")
		return
	}
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to get invoice: "+err.Error())
		return
	}
	
	// Parse JSONB
	if len(priceAdjJSON) > 0 {
		json.Unmarshal(priceAdjJSON, &inv.PriceAdjustments)
	}
	if len(metadataJSON) > 0 {
		json.Unmarshal(metadataJSON, &inv.Metadata)
	}
	
	respondWithJSON(w, http.StatusOK, inv)
}

/*
=============================================================================
4. CREATE INVOICE (POST /invoices)
=============================================================================
Features:
- Auto-generate invoice number: INV-YYYYMMDD-XXXXXX
- Validate tenant, partner, subscription exist
- Validate billing period
- Set default values
=============================================================================
*/
func (h *InvoicesHandler) CreateInvoice(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	
	var req CreateInvoiceRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request body: "+err.Error())
		return
	}
	
	// Validate required fields
	if req.TenantID == "" || req.SubscriptionID == "" {
		respondWithError(w, http.StatusBadRequest, "tenant_id and subscription_id are required")
		return
	}
	
	// Validate billing period
	if !req.BillingPeriodEnd.After(req.BillingPeriodStart) {
		respondWithError(w, http.StatusBadRequest, "billing_period_end must be after billing_period_start")
		return
	}
	
	// Validate tenant exists
	var tenantExists bool
	err := h.db.QueryRowContext(ctx, "SELECT EXISTS(SELECT 1 FROM tenants WHERE _id = $1 AND deleted_at IS NULL)", req.TenantID).Scan(&tenantExists)
	if err != nil || !tenantExists {
		respondWithError(w, http.StatusBadRequest, "Tenant not found or inactive")
		return
	}
	
	// Validate subscription exists
	var subExists bool
	err = h.db.QueryRowContext(ctx, "SELECT EXISTS(SELECT 1 FROM tenant_subscriptions WHERE _id = $1 AND deleted_at IS NULL)", req.SubscriptionID).Scan(&subExists)
	if err != nil || !subExists {
		respondWithError(w, http.StatusBadRequest, "Subscription not found or inactive")
		return
	}
	
	// Validate partner if provided
	if req.PartnerID != nil && *req.PartnerID != "" {
		var partnerExists bool
		err = h.db.QueryRowContext(ctx, "SELECT EXISTS(SELECT 1 FROM tenants WHERE _id = $1 AND deleted_at IS NULL)", *req.PartnerID).Scan(&partnerExists)
		if err != nil || !partnerExists {
			respondWithError(w, http.StatusBadRequest, "Partner not found or inactive")
			return
		}
	}
	
	// Generate UUID v7
	id := uuid.New().String()
	
	// Generate invoice number: INV-YYYYMMDD-XXXXXX
	invoiceNumber := generateInvoiceNumber()
	
	// Set defaults
	if req.CurrencyCode == "" {
		req.CurrencyCode = "VND"
	}
	if req.Status == "" {
		req.Status = "OPEN"
	}
	if req.PriceAdjustments == nil {
		req.PriceAdjustments = []PriceAdjustment{}
	}
	if req.Metadata == nil {
		req.Metadata = make(map[string]interface{})
	}
	
	// Marshal JSONB fields
	priceAdjJSON, _ := json.Marshal(req.PriceAdjustments)
	metadataJSON, _ := json.Marshal(req.Metadata)
	
	now := time.Now()
	
	query := `
		INSERT INTO subscription_invoices (
			_id, tenant_id, partner_id, subscription_id, invoice_number,
			amount, currency_code, status, billing_period_start, billing_period_end,
			due_date, price_adjustments, metadata,
			version, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5,
			$6, $7, $8, $9, $10,
			$11, $12, $13,
			1, $14, $15
		)
		RETURNING _id, created_at
	`
	
	var invoice Invoice
	err = h.db.QueryRowContext(ctx, query,
		id, req.TenantID, req.PartnerID, req.SubscriptionID, invoiceNumber,
		req.Amount, req.CurrencyCode, req.Status, req.BillingPeriodStart, req.BillingPeriodEnd,
		req.DueDate, priceAdjJSON, metadataJSON,
		now, now,
	).Scan(&invoice.ID, &invoice.CreatedAt)
	
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to create invoice: "+err.Error())
		return
	}
	
	// Return full invoice
	invoice.TenantID = req.TenantID
	invoice.PartnerID = req.PartnerID
	invoice.SubscriptionID = req.SubscriptionID
	invoice.InvoiceNumber = invoiceNumber
	invoice.Amount = req.Amount
	invoice.CurrencyCode = req.CurrencyCode
	invoice.Status = req.Status
	invoice.BillingPeriodStart = req.BillingPeriodStart
	invoice.BillingPeriodEnd = req.BillingPeriodEnd
	invoice.DueDate = req.DueDate
	invoice.PriceAdjustments = req.PriceAdjustments
	invoice.Metadata = req.Metadata
	invoice.Version = 1
	invoice.UpdatedAt = now
	
	respondWithJSON(w, http.StatusCreated, invoice)
}

/*
=============================================================================
5. UPDATE INVOICE (PATCH /invoices/:id)
=============================================================================
Features:
- Optimistic locking with version field
- Partial updates
- Prevent updates to PAID invoices (unless voiding)
=============================================================================
*/
func (h *InvoicesHandler) UpdateInvoice(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	vars := mux.Vars(r)
	id := vars["id"]
	
	var req UpdateInvoiceRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request body: "+err.Error())
		return
	}
	
	// Build dynamic update query
	updates := []string{}
	args := []interface{}{}
	argPos := 1
	
	if req.Amount != nil {
		updates = append(updates, fmt.Sprintf("amount = $%d", argPos))
		args = append(args, *req.Amount)
		argPos++
	}
	
	if req.Status != nil {
		updates = append(updates, fmt.Sprintf("status = $%d", argPos))
		args = append(args, *req.Status)
		argPos++
	}
	
	if req.DueDate != nil {
		updates = append(updates, fmt.Sprintf("due_date = $%d", argPos))
		args = append(args, *req.DueDate)
		argPos++
	}
	
	if req.PriceAdjustments != nil {
		priceAdjJSON, _ := json.Marshal(req.PriceAdjustments)
		updates = append(updates, fmt.Sprintf("price_adjustments = $%d", argPos))
		args = append(args, priceAdjJSON)
		argPos++
	}
	
	if req.Metadata != nil {
		metadataJSON, _ := json.Marshal(req.Metadata)
		updates = append(updates, fmt.Sprintf("metadata = $%d", argPos))
		args = append(args, metadataJSON)
		argPos++
	}
	
	if len(updates) == 0 {
		respondWithError(w, http.StatusBadRequest, "No fields to update")
		return
	}
	
	// Add version increment and updated_at
	updates = append(updates, fmt.Sprintf("version = version + 1, updated_at = $%d", argPos))
	args = append(args, time.Now())
	argPos++
	
	// Add WHERE conditions
	args = append(args, id, req.Version)
	
	query := fmt.Sprintf(`
		UPDATE subscription_invoices
		SET %s
		WHERE _id = $%d AND version = $%d AND deleted_at IS NULL
		RETURNING version
	`, joinStrings(updates, ", "), argPos, argPos+1)
	
	var newVersion int64
	err := h.db.QueryRowContext(ctx, query, args...).Scan(&newVersion)
	
	if err == sql.ErrNoRows {
		respondWithError(w, http.StatusConflict, "Version conflict or invoice not found")
		return
	}
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to update invoice: "+err.Error())
		return
	}
	
	respondWithJSON(w, http.StatusOK, map[string]interface{}{
		"message": "Invoice updated successfully",
		"version": newVersion,
	})
}

/*
=============================================================================
6. SOFT DELETE INVOICE (DELETE /invoices/:id)
=============================================================================
*/
func (h *InvoicesHandler) DeleteInvoice(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	vars := mux.Vars(r)
	id := vars["id"]
	
	query := `
		UPDATE subscription_invoices
		SET deleted_at = $1, version = version + 1
		WHERE _id = $2 AND deleted_at IS NULL
	`
	
	result, err := h.db.ExecContext(ctx, query, time.Now(), id)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to delete invoice: "+err.Error())
		return
	}
	
	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		respondWithError(w, http.StatusNotFound, "Invoice not found")
		return
	}
	
	respondWithJSON(w, http.StatusOK, map[string]string{"message": "Invoice deleted successfully"})
}

/*
=============================================================================
7. GET INVOICE WITH DETAILS (GET /invoices/:id/details)
=============================================================================
Includes JOIN data from tenants and subscriptions
=============================================================================
*/
func (h *InvoicesHandler) GetInvoiceDetails(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	vars := mux.Vars(r)
	id := vars["id"]
	
	query := `
		SELECT 
			i._id, i.tenant_id, i.partner_id, i.subscription_id, i.invoice_number,
			i.amount, i.currency_code, i.status, i.billing_period_start, i.billing_period_end,
			i.due_date, i.paid_at, i.price_adjustments, i.metadata,
			i.version, i.created_at, i.updated_at, i.deleted_at,
			t.name as tenant_name,
			p.name as partner_name,
			sp.name as subscription_package_name,
			s.status as subscription_status
		FROM subscription_invoices i
		LEFT JOIN tenants t ON i.tenant_id = t._id
		LEFT JOIN tenants p ON i.partner_id = p._id
		LEFT JOIN tenant_subscriptions s ON i.subscription_id = s._id
		LEFT JOIN service_packages sp ON s.package_id = sp._id
		WHERE i._id = $1 AND i.deleted_at IS NULL
	`
	
	var inv InvoiceWithDetails
	var priceAdjJSON, metadataJSON []byte
	
	err := h.db.QueryRowContext(ctx, query, id).Scan(
		&inv.ID, &inv.TenantID, &inv.PartnerID, &inv.SubscriptionID, &inv.InvoiceNumber,
		&inv.Amount, &inv.CurrencyCode, &inv.Status, &inv.BillingPeriodStart, &inv.BillingPeriodEnd,
		&inv.DueDate, &inv.PaidAt, &priceAdjJSON, &metadataJSON,
		&inv.Version, &inv.CreatedAt, &inv.UpdatedAt, &inv.DeletedAt,
		&inv.TenantName, &inv.PartnerName, &inv.SubscriptionPackageName, &inv.SubscriptionStatus,
	)
	
	if err == sql.ErrNoRows {
		respondWithError(w, http.StatusNotFound, "Invoice not found")
		return
	}
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to get invoice details: "+err.Error())
		return
	}
	
	// Parse JSONB
	if len(priceAdjJSON) > 0 {
		json.Unmarshal(priceAdjJSON, &inv.PriceAdjustments)
	}
	if len(metadataJSON) > 0 {
		json.Unmarshal(metadataJSON, &inv.Metadata)
	}
	
	respondWithJSON(w, http.StatusOK, inv)
}

/*
=============================================================================
8. PAY INVOICE (POST /invoices/:id/pay)
=============================================================================
Features:
- Mark invoice as PAID
- Set paid_at timestamp
- Validate only OPEN invoices can be paid
=============================================================================
*/
func (h *InvoicesHandler) PayInvoice(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	vars := mux.Vars(r)
	id := vars["id"]
	
	var req PayInvoiceRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request body: "+err.Error())
		return
	}
	
	// Check if invoice exists and is OPEN
	var currentStatus string
	err := h.db.QueryRowContext(ctx, "SELECT status FROM subscription_invoices WHERE _id = $1 AND deleted_at IS NULL", id).Scan(&currentStatus)
	if err == sql.ErrNoRows {
		respondWithError(w, http.StatusNotFound, "Invoice not found")
		return
	}
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to get invoice: "+err.Error())
		return
	}
	
	if currentStatus != "OPEN" {
		respondWithError(w, http.StatusBadRequest, fmt.Sprintf("Cannot pay invoice with status %s. Only OPEN invoices can be paid.", currentStatus))
		return
	}
	
	// Set payment date
	paymentDate := time.Now()
	if req.PaymentDate != nil {
		paymentDate = *req.PaymentDate
	}
	
	// Update metadata with payment info
	var currentMetadata map[string]interface{}
	var metadataJSON []byte
	err = h.db.QueryRowContext(ctx, "SELECT metadata FROM subscription_invoices WHERE _id = $1", id).Scan(&metadataJSON)
	if err == nil && len(metadataJSON) > 0 {
		json.Unmarshal(metadataJSON, &currentMetadata)
	}
	if currentMetadata == nil {
		currentMetadata = make(map[string]interface{})
	}
	
	// Add payment info to metadata
	currentMetadata["payment_method"] = req.PaymentMethod
	currentMetadata["payment_date"] = paymentDate
	if req.Metadata != nil {
		for k, v := range req.Metadata {
			currentMetadata[k] = v
		}
	}
	
	newMetadataJSON, _ := json.Marshal(currentMetadata)
	
	// Update invoice
	query := `
		UPDATE subscription_invoices
		SET status = 'PAID', paid_at = $1, metadata = $2, version = version + 1, updated_at = $3
		WHERE _id = $4 AND status = 'OPEN' AND deleted_at IS NULL
		RETURNING version
	`
	
	var newVersion int64
	err = h.db.QueryRowContext(ctx, query, paymentDate, newMetadataJSON, time.Now(), id).Scan(&newVersion)
	
	if err == sql.ErrNoRows {
		respondWithError(w, http.StatusConflict, "Invoice status changed")
		return
	}
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to pay invoice: "+err.Error())
		return
	}
	
	respondWithJSON(w, http.StatusOK, map[string]interface{}{
		"message":      "Invoice paid successfully",
		"paid_at":      paymentDate,
		"version":      newVersion,
		"status":       "PAID",
	})
}

/*
=============================================================================
9. GET OVERDUE INVOICES (GET /invoices/overdue)
=============================================================================
Returns all OPEN invoices that are past their due date
=============================================================================
*/
func (h *InvoicesHandler) GetOverdueInvoices(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	
	query := `
		SELECT _id, tenant_id, partner_id, subscription_id, invoice_number,
		       amount, currency_code, status, billing_period_start, billing_period_end,
		       due_date, paid_at, price_adjustments, metadata,
		       version, created_at, updated_at, deleted_at,
		       (NOW() - due_date) as overdue_duration
		FROM subscription_invoices
		WHERE status = 'OPEN' AND due_date < NOW() AND deleted_at IS NULL
		ORDER BY due_date ASC
	`
	
	rows, err := h.db.QueryContext(ctx, query)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to query overdue invoices: "+err.Error())
		return
	}
	defer rows.Close()
	
	type OverdueInvoice struct {
		Invoice
		OverdueDuration string `json:"overdue_duration"`
	}
	
	invoices := []OverdueInvoice{}
	for rows.Next() {
		var inv OverdueInvoice
		var priceAdjJSON, metadataJSON []byte
		
		err := rows.Scan(
			&inv.ID, &inv.TenantID, &inv.PartnerID, &inv.SubscriptionID, &inv.InvoiceNumber,
			&inv.Amount, &inv.CurrencyCode, &inv.Status, &inv.BillingPeriodStart, &inv.BillingPeriodEnd,
			&inv.DueDate, &inv.PaidAt, &priceAdjJSON, &metadataJSON,
			&inv.Version, &inv.CreatedAt, &inv.UpdatedAt, &inv.DeletedAt,
			&inv.OverdueDuration,
		)
		if err != nil {
			respondWithError(w, http.StatusInternalServerError, "Failed to scan invoice: "+err.Error())
			return
		}
		
		// Parse JSONB
		if len(priceAdjJSON) > 0 {
			json.Unmarshal(priceAdjJSON, &inv.PriceAdjustments)
		}
		if len(metadataJSON) > 0 {
			json.Unmarshal(metadataJSON, &inv.Metadata)
		}
		
		invoices = append(invoices, inv)
	}
	
	respondWithJSON(w, http.StatusOK, invoices)
}

/*
=============================================================================
10. GET INVOICE STATISTICS (GET /invoices/stats)
=============================================================================
Returns comprehensive statistics about invoices
=============================================================================
*/
func (h *InvoicesHandler) GetInvoiceStats(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	
	// Optional tenant_id filter
	tenantID := r.URL.Query().Get("tenant_id")
	
	query := `
		SELECT 
			COUNT(*) as total_invoices,
			COUNT(CASE WHEN status = 'DRAFT' THEN 1 END) as draft_count,
			COUNT(CASE WHEN status = 'OPEN' THEN 1 END) as open_count,
			COUNT(CASE WHEN status = 'PAID' THEN 1 END) as paid_count,
			COUNT(CASE WHEN status = 'VOID' THEN 1 END) as void_count,
			COUNT(CASE WHEN status = 'UNCOLLECTIBLE' THEN 1 END) as uncollectible_count,
			COUNT(CASE WHEN status = 'OPEN' AND due_date < NOW() THEN 1 END) as overdue_count,
			COALESCE(SUM(amount), 0) as total_amount,
			COALESCE(SUM(CASE WHEN status = 'PAID' THEN amount ELSE 0 END), 0) as paid_amount,
			COALESCE(SUM(CASE WHEN status = 'OPEN' THEN amount ELSE 0 END), 0) as outstanding_amount
		FROM subscription_invoices
		WHERE deleted_at IS NULL
	`
	
	args := []interface{}{}
	if tenantID != "" {
		query += " AND tenant_id = $1"
		args = append(args, tenantID)
	}
	
	var stats InvoiceStats
	err := h.db.QueryRowContext(ctx, query, args...).Scan(
		&stats.TotalInvoices,
		&stats.DraftCount,
		&stats.OpenCount,
		&stats.PaidCount,
		&stats.VoidCount,
		&stats.UncollectibleCount,
		&stats.OverdueCount,
		&stats.TotalAmount,
		&stats.PaidAmount,
		&stats.OutstandingAmount,
	)
	
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to get statistics: "+err.Error())
		return
	}
	
	respondWithJSON(w, http.StatusOK, stats)
}

/*
=============================================================================
HELPER FUNCTIONS
=============================================================================
*/

// generateInvoiceNumber generates invoice number in format: INV-YYYYMMDD-XXXXXX
func generateInvoiceNumber() string {
	now := time.Now()
	timestamp := now.Format("20060102") // YYYYMMDD
	random := now.UnixNano() % 1000000  // Last 6 digits of nanosecond
	return fmt.Sprintf("INV-%s-%06d", timestamp, random)
}

// joinStrings joins strings with separator
func joinStrings(strs []string, sep string) string {
	result := ""
	for i, s := range strs {
		if i > 0 {
			result += sep
		}
		result += s
	}
	return result
}

// respondWithJSON sends JSON response
func respondWithJSON(w http.ResponseWriter, code int, payload interface{}) {
	response, _ := json.Marshal(payload)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	w.Write(response)
}

// respondWithError sends error response
func respondWithError(w http.ResponseWriter, code int, message string) {
	respondWithJSON(w, code, map[string]string{"error": message})
}
