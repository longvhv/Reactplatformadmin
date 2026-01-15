package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

// AuditLog represents an audit log entry in ClickHouse
type AuditLog struct {
	ID              string    `json:"_id" db:"_id"`
	TenantID        string    `json:"tenant_id" db:"tenant_id"`
	UserID          string    `json:"user_id" db:"user_id"`
	ImpersonatorID  *string   `json:"impersonator_id,omitempty" db:"impersonator_id"`
	EventTime       time.Time `json:"event_time" db:"event_time"`
	Action          string    `json:"action" db:"action"`
	Resource        string    `json:"resource" db:"resource"`
	ResourceID      *string   `json:"resource_id,omitempty" db:"resource_id"`
	Details         string    `json:"details" db:"details"`
	IPAddress       string    `json:"ip_address" db:"ip_address"`
	UserAgent       string    `json:"user_agent" db:"user_agent"`
	Status          string    `json:"status" db:"status"` // SUCCESS, FAILED
	// Joined fields
	UserName         *string `json:"user_name,omitempty" db:"user_name"`
	UserEmail        *string `json:"user_email,omitempty" db:"user_email"`
	ImpersonatorName *string `json:"impersonator_name,omitempty" db:"impersonator_name"`
}

// AuditLogFilters represents filter parameters for audit logs
type AuditLogFilters struct {
	TenantID   string    `json:"tenant_id"`
	UserID     string    `json:"user_id"`
	Action     string    `json:"action"`
	Resource   string    `json:"resource"`
	ResourceID string    `json:"resource_id"`
	Status     string    `json:"status"`
	StartDate  time.Time `json:"start_date"`
	EndDate    time.Time `json:"end_date"`
	Search     string    `json:"search"`
	Limit      int       `json:"limit"`
	Offset     int       `json:"offset"`
}

// AuditLogStatistics represents aggregated statistics
type AuditLogStatistics struct {
	TotalEvents      int                    `json:"total_events"`
	SuccessCount     int                    `json:"success_count"`
	FailedCount      int                    `json:"failed_count"`
	UniqueUsers      int                    `json:"unique_users"`
	EventsByAction   map[string]int         `json:"events_by_action"`
	EventsByResource map[string]int         `json:"events_by_resource"`
	EventsByHour     []map[string]interface{} `json:"events_by_hour"`
	TopUsers         []map[string]interface{} `json:"top_users"`
}

// CreateAuditLogInput represents input for creating audit log
type CreateAuditLogInput struct {
	TenantID       string  `json:"tenant_id" validate:"required,uuid"`
	UserID         string  `json:"user_id" validate:"required,uuid"`
	ImpersonatorID *string `json:"impersonator_id,omitempty" validate:"omitempty,uuid"`
	Action         string  `json:"action" validate:"required"`
	Resource       string  `json:"resource" validate:"required"`
	ResourceID     *string `json:"resource_id,omitempty"`
	Details        string  `json:"details"`
	IPAddress      string  `json:"ip_address" validate:"required,ip"`
	UserAgent      string  `json:"user_agent" validate:"required"`
	Status         string  `json:"status" validate:"omitempty,oneof=SUCCESS FAILED"`
}

// AuditLogHandler handles audit log operations
type AuditLogHandler struct {
	// ClickHouse connection would go here
	// clickhouse *sqlx.DB
}

// NewAuditLogHandler creates a new audit log handler
func NewAuditLogHandler() *AuditLogHandler {
	return &AuditLogHandler{}
}

// RegisterRoutes registers audit log routes
func (h *AuditLogHandler) RegisterRoutes(r chi.Router) {
	r.Route("/audit-logs", func(r chi.Router) {
		r.Get("/", h.ListAuditLogs)
		r.Post("/", h.CreateAuditLog)
		r.Get("/statistics", h.GetStatistics)
		r.Get("/export", h.ExportAuditLogs)
		r.Get("/{id}", h.GetAuditLog)
	})
}

// ListAuditLogs handles GET /audit-logs
// @Summary List audit logs
// @Description Get all audit logs with filters and pagination
// @Tags audit-logs
// @Accept json
// @Produce json
// @Param tenant_id query string false "Tenant ID"
// @Param user_id query string false "User ID"
// @Param action query string false "Action (CREATE, UPDATE, DELETE, etc.)"
// @Param resource query string false "Resource type"
// @Param resource_id query string false "Resource ID"
// @Param status query string false "Status (SUCCESS, FAILED)"
// @Param start_date query string false "Start date (RFC3339)"
// @Param end_date query string false "End date (RFC3339)"
// @Param search query string false "Search term"
// @Param limit query int false "Limit (default: 50)"
// @Param offset query int false "Offset (default: 0)"
// @Success 200 {object} map[string]interface{} "data, total, pagination"
// @Failure 400 {object} map[string]string "error"
// @Failure 500 {object} map[string]string "error"
// @Router /audit-logs [get]
func (h *AuditLogHandler) ListAuditLogs(w http.ResponseWriter, r *http.Request) {
	// Parse query parameters
	filters := AuditLogFilters{
		TenantID:   r.URL.Query().Get("tenant_id"),
		UserID:     r.URL.Query().Get("user_id"),
		Action:     r.URL.Query().Get("action"),
		Resource:   r.URL.Query().Get("resource"),
		ResourceID: r.URL.Query().Get("resource_id"),
		Status:     r.URL.Query().Get("status"),
		Search:     r.URL.Query().Get("search"),
	}

	// Parse limit and offset
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit <= 0 {
		limit = 50
	}
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
	if offset < 0 {
		offset = 0
	}
	filters.Limit = limit
	filters.Offset = offset

	// Parse dates
	if startDate := r.URL.Query().Get("start_date"); startDate != "" {
		if t, err := time.Parse(time.RFC3339, startDate); err == nil {
			filters.StartDate = t
		}
	}
	if endDate := r.URL.Query().Get("end_date"); endDate != "" {
		if t, err := time.Parse(time.RFC3339, endDate); err == nil {
			filters.EndDate = t
		}
	}

	// Build ClickHouse query
	query := `
		SELECT 
			_id,
			tenant_id,
			user_id,
			impersonator_id,
			event_time,
			action,
			resource,
			resource_id,
			details,
			ip_address,
			user_agent,
			status
		FROM audit_logs
		WHERE 1=1
	`
	args := []interface{}{}
	argIdx := 1

	// Apply filters
	if filters.TenantID != "" {
		query += fmt.Sprintf(" AND tenant_id = $%d", argIdx)
		args = append(args, filters.TenantID)
		argIdx++
	}
	if filters.UserID != "" {
		query += fmt.Sprintf(" AND user_id = $%d", argIdx)
		args = append(args, filters.UserID)
		argIdx++
	}
	if filters.Action != "" {
		query += fmt.Sprintf(" AND action = $%d", argIdx)
		args = append(args, filters.Action)
		argIdx++
	}
	if filters.Resource != "" {
		query += fmt.Sprintf(" AND resource = $%d", argIdx)
		args = append(args, filters.Resource)
		argIdx++
	}
	if filters.ResourceID != "" {
		query += fmt.Sprintf(" AND resource_id = $%d", argIdx)
		args = append(args, filters.ResourceID)
		argIdx++
	}
	if filters.Status != "" {
		query += fmt.Sprintf(" AND status = $%d", argIdx)
		args = append(args, filters.Status)
		argIdx++
	}
	if !filters.StartDate.IsZero() {
		query += fmt.Sprintf(" AND event_time >= $%d", argIdx)
		args = append(args, filters.StartDate)
		argIdx++
	}
	if !filters.EndDate.IsZero() {
		query += fmt.Sprintf(" AND event_time <= $%d", argIdx)
		args = append(args, filters.EndDate)
		argIdx++
	}
	if filters.Search != "" {
		query += fmt.Sprintf(" AND (action ILIKE $%d OR resource ILIKE $%d OR details ILIKE $%d)", argIdx, argIdx+1, argIdx+2)
		searchTerm := "%" + filters.Search + "%"
		args = append(args, searchTerm, searchTerm, searchTerm)
		argIdx += 3
	}

	// Add ordering and pagination
	query += " ORDER BY event_time DESC"
	query += fmt.Sprintf(" LIMIT $%d OFFSET $%d", argIdx, argIdx+1)
	args = append(args, filters.Limit, filters.Offset)

	// Execute query (mock data for now)
	logs := []AuditLog{
		{
			ID:         uuid.New().String(),
			TenantID:   "tenant-001",
			UserID:     "user-001",
			EventTime:  time.Now().Add(-1 * time.Hour),
			Action:     "CREATE",
			Resource:   "USER",
			Details:    `{"name":"John Doe","email":"john@example.com"}`,
			IPAddress:  "192.168.1.100",
			UserAgent:  "Mozilla/5.0...",
			Status:     "SUCCESS",
		},
		{
			ID:         uuid.New().String(),
			TenantID:   "tenant-001",
			UserID:     "user-002",
			EventTime:  time.Now().Add(-2 * time.Hour),
			Action:     "UPDATE",
			Resource:   "PRODUCT",
			Details:    `{"changes":{"price":{"old":100,"new":120}}}`,
			IPAddress:  "192.168.1.101",
			UserAgent:  "Mozilla/5.0...",
			Status:     "SUCCESS",
		},
	}

	// Count total (mock)
	total := 2

	// Response
	response := map[string]interface{}{
		"data":  logs,
		"total": total,
		"pagination": map[string]interface{}{
			"limit":    filters.Limit,
			"offset":   filters.Offset,
			"has_more": total > filters.Offset+filters.Limit,
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// GetAuditLog handles GET /audit-logs/{id}
// @Summary Get audit log
// @Description Get single audit log by ID
// @Tags audit-logs
// @Accept json
// @Produce json
// @Param id path string true "Audit Log ID"
// @Success 200 {object} AuditLog
// @Failure 404 {object} map[string]string "error"
// @Failure 500 {object} map[string]string "error"
// @Router /audit-logs/{id} [get]
func (h *AuditLogHandler) GetAuditLog(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	// Validate UUID
	if _, err := uuid.Parse(id); err != nil {
		http.Error(w, `{"error":"Invalid audit log ID"}`, http.StatusBadRequest)
		return
	}

	// Query ClickHouse (mock data)
	log := AuditLog{
		ID:         id,
		TenantID:   "tenant-001",
		UserID:     "user-001",
		EventTime:  time.Now(),
		Action:     "CREATE",
		Resource:   "USER",
		ResourceID: strPtr("user-123"),
		Details:    `{"name":"John Doe","email":"john@example.com","changes":{"status":{"old":"inactive","new":"active"}}}`,
		IPAddress:  "192.168.1.100",
		UserAgent:  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
		Status:     "SUCCESS",
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(log)
}

// CreateAuditLog handles POST /audit-logs
// @Summary Create audit log
// @Description Create a new audit log entry
// @Tags audit-logs
// @Accept json
// @Produce json
// @Param input body CreateAuditLogInput true "Audit log data"
// @Success 201 {object} AuditLog
// @Failure 400 {object} map[string]string "error"
// @Failure 500 {object} map[string]string "error"
// @Router /audit-logs [post]
func (h *AuditLogHandler) CreateAuditLog(w http.ResponseWriter, r *http.Request) {
	var input CreateAuditLogInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, `{"error":"Invalid request body"}`, http.StatusBadRequest)
		return
	}

	// Validate input
	if input.TenantID == "" || input.UserID == "" || input.Action == "" || input.Resource == "" {
		http.Error(w, `{"error":"Missing required fields"}`, http.StatusBadRequest)
		return
	}

	// Set default status
	if input.Status == "" {
		input.Status = "SUCCESS"
	}

	// Create audit log
	log := AuditLog{
		ID:             uuid.New().String(),
		TenantID:       input.TenantID,
		UserID:         input.UserID,
		ImpersonatorID: input.ImpersonatorID,
		EventTime:      time.Now(),
		Action:         input.Action,
		Resource:       input.Resource,
		ResourceID:     input.ResourceID,
		Details:        input.Details,
		IPAddress:      input.IPAddress,
		UserAgent:      input.UserAgent,
		Status:         input.Status,
	}

	// Insert into ClickHouse
	// query := `INSERT INTO audit_logs (...) VALUES (...)`

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(log)
}

// GetStatistics handles GET /audit-logs/statistics
// @Summary Get audit log statistics
// @Description Get aggregated statistics for audit logs
// @Tags audit-logs
// @Accept json
// @Produce json
// @Param tenant_id query string false "Tenant ID"
// @Param start_date query string false "Start date (RFC3339)"
// @Param end_date query string false "End date (RFC3339)"
// @Success 200 {object} AuditLogStatistics
// @Failure 500 {object} map[string]string "error"
// @Router /audit-logs/statistics [get]
func (h *AuditLogHandler) GetStatistics(w http.ResponseWriter, r *http.Request) {
	// Parse filters
	tenantID := r.URL.Query().Get("tenant_id")
	startDate := r.URL.Query().Get("start_date")
	endDate := r.URL.Query().Get("end_date")

	// Build aggregation queries for ClickHouse
	_ = tenantID
	_ = startDate
	_ = endDate

	// Mock statistics
	stats := AuditLogStatistics{
		TotalEvents:  1245,
		SuccessCount: 1180,
		FailedCount:  65,
		UniqueUsers:  42,
		EventsByAction: map[string]int{
			"CREATE": 450,
			"UPDATE": 380,
			"DELETE": 120,
			"VIEW":   295,
		},
		EventsByResource: map[string]int{
			"USER":         320,
			"PRODUCT":      280,
			"ORDER":        245,
			"SUBSCRIPTION": 200,
			"TENANT":       200,
		},
		EventsByHour: []map[string]interface{}{
			{"hour": "00:00", "count": 45},
			{"hour": "01:00", "count": 32},
			{"hour": "02:00", "count": 28},
		},
		TopUsers: []map[string]interface{}{
			{"user_id": "user-001", "user_name": "Admin User", "count": 234},
			{"user_id": "user-002", "user_name": "John Doe", "count": 189},
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stats)
}

// ExportAuditLogs handles GET /audit-logs/export
// @Summary Export audit logs
// @Description Export audit logs to CSV
// @Tags audit-logs
// @Produce text/csv
// @Param tenant_id query string false "Tenant ID"
// @Param start_date query string false "Start date (RFC3339)"
// @Param end_date query string false "End date (RFC3339)"
// @Success 200 {file} csv
// @Failure 500 {object} map[string]string "error"
// @Router /audit-logs/export [get]
func (h *AuditLogHandler) ExportAuditLogs(w http.ResponseWriter, r *http.Request) {
	// Get filters (same as ListAuditLogs)
	// Query ClickHouse for all matching records
	// Generate CSV

	csv := `"Event Time","User ID","Action","Resource","Resource ID","Status","IP Address"
"2024-01-13 10:30:00","user-001","CREATE","USER","user-123","SUCCESS","192.168.1.100"
"2024-01-13 10:25:00","user-002","UPDATE","PRODUCT","prod-456","SUCCESS","192.168.1.101"
`

	w.Header().Set("Content-Type", "text/csv")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=audit-logs-%s.csv", time.Now().Format("2006-01-02")))
	w.Write([]byte(csv))
}

// Helper function
func strPtr(s string) *string {
	return &s
}
