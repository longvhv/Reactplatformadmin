package api

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
)

// ============================================================================
// MODELS - Tenant Detail Operations
// ============================================================================

// TenantUsageMetrics represents usage statistics
type TenantUsageMetrics struct {
	TenantID           string    `json:"tenant_id"`
	Period             string    `json:"period"` // daily, weekly, monthly
	ActiveUsers        int       `json:"active_users"`
	StorageUsedGB      float64   `json:"storage_used_gb"`
	StorageLimitGB     float64   `json:"storage_limit_gb"`
	APICallsCount      int64     `json:"api_calls_count"`
	APICallsLimit      int64     `json:"api_calls_limit"`
	BandwidthUsedGB    float64   `json:"bandwidth_used_gb"`
	LastCalculatedAt   time.Time `json:"last_calculated_at"`
}

// TenantAuditLog represents audit trail entry
type TenantAuditLog struct {
	ID          string                 `json:"_id"`
	TenantID    string                 `json:"tenant_id"`
	UserID      string                 `json:"user_id"`
	Action      string                 `json:"action"` // created, updated, deleted, status_changed
	EntityType  string                 `json:"entity_type"` // tenant, member, settings
	EntityID    string                 `json:"entity_id"`
	Changes     map[string]interface{} `json:"changes"`
	IPAddress   string                 `json:"ip_address"`
	UserAgent   string                 `json:"user_agent"`
	CreatedAt   time.Time              `json:"created_at"`
}

// TenantBillingInfo represents billing information
type TenantBillingInfo struct {
	TenantID            string    `json:"tenant_id"`
	CurrentPeriodStart  time.Time `json:"current_period_start"`
	CurrentPeriodEnd    time.Time `json:"current_period_end"`
	CurrentAmount       float64   `json:"current_amount"`
	Currency            string    `json:"currency"`
	BillingCycle        string    `json:"billing_cycle"` // monthly, yearly
	NextBillingDate     time.Time `json:"next_billing_date"`
	PaymentMethod       string    `json:"payment_method"`
	OutstandingBalance  float64   `json:"outstanding_balance"`
}

// TenantInvoice represents invoice
type TenantInvoice struct {
	ID             string    `json:"_id"`
	TenantID       string    `json:"tenant_id"`
	InvoiceNumber  string    `json:"invoice_number"`
	Amount         float64   `json:"amount"`
	Currency       string    `json:"currency"`
	Status         string    `json:"status"` // pending, paid, overdue, cancelled
	PeriodStart    time.Time `json:"period_start"`
	PeriodEnd      time.Time `json:"period_end"`
	IssueDate      time.Time `json:"issue_date"`
	DueDate        time.Time `json:"due_date"`
	PaidDate       *time.Time `json:"paid_date,omitempty"`
	DownloadURL    string    `json:"download_url"`
}

// TenantDetailHandler handles tenant detail operations
type TenantDetailHandler struct {
	db *sql.DB
}

// NewTenantDetailHandler creates new handler
func NewTenantDetailHandler(db *sql.DB) *TenantDetailHandler {
	return &TenantDetailHandler{db: db}
}

// ============================================================================
// ROUTE REGISTRATION
// ============================================================================

// RegisterRoutes registers tenant detail routes
func (h *TenantDetailHandler) RegisterRoutes(r *mux.Router) {
	// Usage & Analytics
	r.HandleFunc("/api/tenants/{id}/usage", h.GetTenantUsage).Methods("GET")
	r.HandleFunc("/api/tenants/{id}/analytics", h.GetTenantAnalytics).Methods("GET")

	// Audit Logs
	r.HandleFunc("/api/tenants/{id}/audit-logs", h.GetTenantAuditLogs).Methods("GET")
	r.HandleFunc("/api/tenants/{id}/audit-logs", h.CreateAuditLog).Methods("POST")

	// Billing
	r.HandleFunc("/api/tenants/{id}/billing", h.GetTenantBilling).Methods("GET")
	r.HandleFunc("/api/tenants/{id}/invoices", h.GetTenantInvoices).Methods("GET")
	r.HandleFunc("/api/tenants/{id}/invoices/{invoice_id}", h.GetInvoice).Methods("GET")

	// Member Operations (extended from tenants_handler.go)
	r.HandleFunc("/api/tenants/{id}/members/{member_id}", h.UpdateMember).Methods("PATCH")
	r.HandleFunc("/api/tenants/{id}/members/{member_id}", h.RemoveMember).Methods("DELETE")
	r.HandleFunc("/api/tenants/{id}/members/invite", h.InviteMember).Methods("POST")

	// Settings
	r.HandleFunc("/api/tenants/{id}/settings", h.GetTenantSettings).Methods("GET")
	r.HandleFunc("/api/tenants/{id}/settings", h.UpdateTenantSettings).Methods("PATCH")
}

// ============================================================================
// USAGE & ANALYTICS HANDLERS
// ============================================================================

// GetTenantUsage returns usage metrics
func (h *TenantDetailHandler) GetTenantUsage(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	tenantID := vars["id"]

	if _, err := uuid.Parse(tenantID); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid tenant ID", err)
		return
	}

	period := r.URL.Query().Get("period")
	if period == "" {
		period = "monthly"
	}

	// Get tenant to check limits
	var tier string
	var settingsJSON []byte
	err := h.db.QueryRow(`
		SELECT tier, settings FROM tenants WHERE _id = $1 AND deleted_at IS NULL
	`, tenantID).Scan(&tier, &settingsJSON)

	if err == sql.ErrNoRows {
		respondError(w, http.StatusNotFound, "Tenant not found", nil)
		return
	}
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Database error", err)
		return
	}

	var settings map[string]interface{}
	json.Unmarshal(settingsJSON, &settings)

	// Get member count as active users
	var activeUsers int
	h.db.QueryRow(`
		SELECT COUNT(*) FROM tenant_members 
		WHERE tenant_id = $1 AND status = 'ACTIVE' AND deleted_at IS NULL
	`, tenantID).Scan(&activeUsers)

	// Extract limits from settings
	limits, _ := settings["limits"].(map[string]interface{})
	storageLimit := 5.0 // default FREE
	apiCallsLimit := int64(1000) // default FREE

	if limits != nil {
		if val, ok := limits["storage_gb"].(float64); ok {
			storageLimit = val
		}
		if val, ok := limits["api_calls_per_month"].(float64); ok {
			apiCallsLimit = int64(val)
		}
	}

	// Mock current usage (in production, query from usage tracking tables)
	usage := TenantUsageMetrics{
		TenantID:           tenantID,
		Period:             period,
		ActiveUsers:        activeUsers,
		StorageUsedGB:      storageLimit * 0.35, // 35% used
		StorageLimitGB:     storageLimit,
		APICallsCount:      int64(float64(apiCallsLimit) * 0.42), // 42% used
		APICallsLimit:      apiCallsLimit,
		BandwidthUsedGB:    2.5,
		LastCalculatedAt:   time.Now(),
	}

	respondJSON(w, http.StatusOK, usage)
}

// GetTenantAnalytics returns analytics data
func (h *TenantDetailHandler) GetTenantAnalytics(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	tenantID := vars["id"]

	// Get member growth over time
	rows, err := h.db.Query(`
		SELECT 
			DATE(created_at) as date,
			COUNT(*) as count
		FROM tenant_members
		WHERE tenant_id = $1 AND deleted_at IS NULL
		GROUP BY DATE(created_at)
		ORDER BY date DESC
		LIMIT 30
	`, tenantID)

	if err != nil {
		respondError(w, http.StatusInternalServerError, "Database error", err)
		return
	}
	defer rows.Close()

	memberGrowth := []map[string]interface{}{}
	for rows.Next() {
		var date time.Time
		var count int
		rows.Scan(&date, &count)
		memberGrowth = append(memberGrowth, map[string]interface{}{
			"date":  date.Format("2006-01-02"),
			"count": count,
		})
	}

	analytics := map[string]interface{}{
		"member_growth": memberGrowth,
		"generated_at":  time.Now(),
	}

	respondJSON(w, http.StatusOK, analytics)
}

// ============================================================================
// AUDIT LOG HANDLERS
// ============================================================================

// GetTenantAuditLogs returns audit logs
func (h *TenantDetailHandler) GetTenantAuditLogs(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	tenantID := vars["id"]

	action := r.URL.Query().Get("action")
	entityType := r.URL.Query().Get("entity_type")
	page := getIntQueryParam(r, "page", 1)
	limit := getIntQueryParam(r, "limit", 50)
	offset := (page - 1) * limit

	// Build query
	query := `
		SELECT 
			al._id, al.tenant_id, al.user_id, al.action, al.entity_type, 
			al.entity_id, al.changes, al.ip_address, al.user_agent, al.created_at
		FROM audit_logs al
		WHERE al.tenant_id = $1
	`
	args := []interface{}{tenantID}
	argIdx := 2

	if action != "" {
		query += fmt.Sprintf(" AND al.action = $%d", argIdx)
		args = append(args, action)
		argIdx++
	}
	if entityType != "" {
		query += fmt.Sprintf(" AND al.entity_type = $%d", argIdx)
		args = append(args, entityType)
		argIdx++
	}

	query += " ORDER BY al.created_at DESC"
	query += fmt.Sprintf(" LIMIT $%d OFFSET $%d", argIdx, argIdx+1)
	args = append(args, limit, offset)

	// Mock data for now (create audit_logs table in production)
	logs := []TenantAuditLog{
		{
			ID:         uuid.New().String(),
			TenantID:   tenantID,
			UserID:     uuid.New().String(),
			Action:     "updated",
			EntityType: "tenant",
			EntityID:   tenantID,
			Changes: map[string]interface{}{
				"name": map[string]string{"old": "Old Name", "new": "New Name"},
			},
			IPAddress: "192.168.1.1",
			UserAgent: "Mozilla/5.0",
			CreatedAt: time.Now().Add(-2 * time.Hour),
		},
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"data": logs,
		"meta": map[string]interface{}{
			"page":  page,
			"limit": limit,
		},
	})
}

// CreateAuditLog creates an audit log entry
func (h *TenantDetailHandler) CreateAuditLog(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	tenantID := vars["id"]

	var req TenantAuditLog
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid JSON", err)
		return
	}

	req.ID = uuid.New().String()
	req.TenantID = tenantID
	req.CreatedAt = time.Now()

	// In production, insert into audit_logs table
	// For now, just return success

	respondJSON(w, http.StatusCreated, req)
}

// ============================================================================
// BILLING HANDLERS
// ============================================================================

// GetTenantBilling returns billing information
func (h *TenantDetailHandler) GetTenantBilling(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	tenantID := vars["id"]

	// Mock billing info
	billing := TenantBillingInfo{
		TenantID:            tenantID,
		CurrentPeriodStart:  time.Now().AddDate(0, 0, -15),
		CurrentPeriodEnd:    time.Now().AddDate(0, 1, -15),
		CurrentAmount:       99.00,
		Currency:            "USD",
		BillingCycle:        "monthly",
		NextBillingDate:     time.Now().AddDate(0, 1, -15),
		PaymentMethod:       "Credit Card (**** 4242)",
		OutstandingBalance:  0.00,
	}

	respondJSON(w, http.StatusOK, billing)
}

// GetTenantInvoices returns invoices
func (h *TenantDetailHandler) GetTenantInvoices(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	tenantID := vars["id"]

	// Mock invoices
	invoices := []TenantInvoice{
		{
			ID:            uuid.New().String(),
			TenantID:      tenantID,
			InvoiceNumber: "INV-2024-001",
			Amount:        99.00,
			Currency:      "USD",
			Status:        "paid",
			PeriodStart:   time.Now().AddDate(0, -1, 0),
			PeriodEnd:     time.Now(),
			IssueDate:     time.Now().AddDate(0, -1, 0),
			DueDate:       time.Now().AddDate(0, -1, 7),
			DownloadURL:   "/api/invoices/download/xxx",
		},
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"data": invoices,
	})
}

// GetInvoice returns specific invoice
func (h *TenantDetailHandler) GetInvoice(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	invoiceID := vars["invoice_id"]

	// Mock invoice detail
	invoice := TenantInvoice{
		ID:            invoiceID,
		InvoiceNumber: "INV-2024-001",
		Amount:        99.00,
		Currency:      "USD",
		Status:        "paid",
	}

	respondJSON(w, http.StatusOK, invoice)
}

// ============================================================================
// MEMBER MANAGEMENT HANDLERS
// ============================================================================

// InviteMember invites a new member
func (h *TenantDetailHandler) InviteMember(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	tenantID := vars["id"]

	var req struct {
		Email       string `json:"email"`
		DisplayName string `json:"display_name"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid JSON", err)
		return
	}

	// Find or create user by email
	var userID string
	err := h.db.QueryRow(`
		SELECT _id FROM users WHERE email = $1 AND deleted_at IS NULL
	`, req.Email).Scan(&userID)

	if err == sql.ErrNoRows {
		// Create new user
		userID = uuid.New().String()
		_, err = h.db.Exec(`
			INSERT INTO users (_id, email, full_name, status)
			VALUES ($1, $2, $3, 'PENDING')
		`, userID, req.Email, req.DisplayName)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "Failed to create user", err)
			return
		}
	}

	// Create tenant member
	memberID := uuid.New().String()
	_, err = h.db.Exec(`
		INSERT INTO tenant_members (_id, tenant_id, user_id, display_name, status)
		VALUES ($1, $2, $3, $4, 'INVITED')
	`, memberID, tenantID, userID, req.DisplayName)

	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to add member", err)
		return
	}

	respondJSON(w, http.StatusCreated, map[string]interface{}{
		"message":   "Member invited successfully",
		"member_id": memberID,
		"email":     req.Email,
	})
}

// UpdateMember updates member information
func (h *TenantDetailHandler) UpdateMember(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	memberID := vars["member_id"]

	var req struct {
		DisplayName *string `json:"display_name,omitempty"`
		Status      *string `json:"status,omitempty"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid JSON", err)
		return
	}

	updates := []string{}
	args := []interface{}{}
	argIdx := 1

	if req.DisplayName != nil {
		updates = append(updates, fmt.Sprintf("display_name = $%d", argIdx))
		args = append(args, *req.DisplayName)
		argIdx++
	}
	if req.Status != nil {
		updates = append(updates, fmt.Sprintf("status = $%d", argIdx))
		args = append(args, *req.Status)
		argIdx++
	}

	if len(updates) == 0 {
		respondError(w, http.StatusBadRequest, "No fields to update", nil)
		return
	}

	args = append(args, memberID)
	query := fmt.Sprintf(`
		UPDATE tenant_members 
		SET %s, updated_at = NOW()
		WHERE _id = $%d AND deleted_at IS NULL
	`, fmt.Sprintf("%s", updates), argIdx)

	_, err := h.db.Exec(query, args...)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Update failed", err)
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{
		"message": "Member updated successfully",
	})
}

// RemoveMember removes a member
func (h *TenantDetailHandler) RemoveMember(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	memberID := vars["member_id"]

	_, err := h.db.Exec(`
		UPDATE tenant_members 
		SET deleted_at = NOW() 
		WHERE _id = $1
	`, memberID)

	if err != nil {
		respondError(w, http.StatusInternalServerError, "Remove failed", err)
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{
		"message": "Member removed successfully",
	})
}

// ============================================================================
// SETTINGS HANDLERS
// ============================================================================

// GetTenantSettings returns tenant settings
func (h *TenantDetailHandler) GetTenantSettings(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	tenantID := vars["id"]

	var settingsJSON []byte
	err := h.db.QueryRow(`
		SELECT settings FROM tenants WHERE _id = $1 AND deleted_at IS NULL
	`, tenantID).Scan(&settingsJSON)

	if err != nil {
		respondError(w, http.StatusInternalServerError, "Database error", err)
		return
	}

	var settings map[string]interface{}
	json.Unmarshal(settingsJSON, &settings)

	respondJSON(w, http.StatusOK, settings)
}

// UpdateTenantSettings updates tenant settings
func (h *TenantDetailHandler) UpdateTenantSettings(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	tenantID := vars["id"]

	var newSettings map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&newSettings); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid JSON", err)
		return
	}

	settingsJSON, _ := json.Marshal(newSettings)

	_, err := h.db.Exec(`
		UPDATE tenants 
		SET settings = $1, updated_at = NOW()
		WHERE _id = $2 AND deleted_at IS NULL
	`, settingsJSON, tenantID)

	if err != nil {
		respondError(w, http.StatusInternalServerError, "Update failed", err)
		return
	}

	respondJSON(w, http.StatusOK, newSettings)
}
