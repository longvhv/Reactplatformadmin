package clickhouse

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/google/uuid"
)

// LogRepository handles logging to ClickHouse
type LogRepository struct {
	db *sql.DB
}

// NewLogRepository creates a new log repository
func NewLogRepository(db *sql.DB) *LogRepository {
	return &LogRepository{db: db}
}

// AuthLog represents an authentication log entry
type AuthLog struct {
	ID           uuid.UUID
	UserID       uuid.UUID
	Email        string
	Action       string
	Success      bool
	IPAddress    string
	UserAgent    string
	ErrorMessage *string
	Metadata     string
	CreatedAt    time.Time
}

// LogAuth logs authentication event
func (r *LogRepository) LogAuth(ctx context.Context, log AuthLog) error {
	query := `
		INSERT INTO telemetry.auth_logs (
			id, user_id, email, action, success, ip_address, user_agent, error_message, metadata, created_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

	_, err := r.db.ExecContext(ctx, query,
		log.ID, log.UserID, log.Email, log.Action, log.Success,
		log.IPAddress, log.UserAgent, log.ErrorMessage, log.Metadata, log.CreatedAt,
	)

	return err
}

// AuditLog represents an audit log entry
type AuditLog struct {
	ID           uuid.UUID
	UserID       uuid.UUID
	TenantID     *uuid.UUID
	Action       string
	ResourceType string
	ResourceID   uuid.UUID
	Changes      string
	IPAddress    string
	UserAgent    string
	CreatedAt    time.Time
}

// LogAudit logs audit event
func (r *LogRepository) LogAudit(ctx context.Context, log AuditLog) error {
	query := `
		INSERT INTO telemetry.audit_logs (
			id, user_id, tenant_id, action, resource_type, resource_id, changes, ip_address, user_agent, created_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

	_, err := r.db.ExecContext(ctx, query,
		log.ID, log.UserID, log.TenantID, log.Action, log.ResourceType,
		log.ResourceID, log.Changes, log.IPAddress, log.UserAgent, log.CreatedAt,
	)

	return err
}

// TrafficLog represents HTTP traffic log
type TrafficLog struct {
	ID           uuid.UUID
	RequestID    string
	Method       string
	Path         string
	StatusCode   int
	DurationMs   int
	RequestSize  int
	ResponseSize int
	IPAddress    string
	UserAgent    string
	UserID       *uuid.UUID
	TenantID     *uuid.UUID
	CreatedAt    time.Time
}

// LogTraffic logs HTTP traffic
func (r *LogRepository) LogTraffic(ctx context.Context, log TrafficLog) error {
	query := `
		INSERT INTO telemetry.traffic_logs (
			id, request_id, method, path, status_code, duration_ms, request_size, response_size,
			ip_address, user_agent, user_id, tenant_id, created_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

	_, err := r.db.ExecContext(ctx, query,
		log.ID, log.RequestID, log.Method, log.Path, log.StatusCode, log.DurationMs,
		log.RequestSize, log.ResponseSize, log.IPAddress, log.UserAgent,
		log.UserID, log.TenantID, log.CreatedAt,
	)

	return err
}

// ErrorLog represents error log entry
type ErrorLog struct {
	ID           uuid.UUID
	ErrorType    string
	ErrorMessage string
	StackTrace   string
	RequestID    *string
	UserID       *uuid.UUID
	TenantID     *uuid.UUID
	Metadata     string
	Severity     string
	CreatedAt    time.Time
}

// LogError logs error event
func (r *LogRepository) LogError(ctx context.Context, log ErrorLog) error {
	query := `
		INSERT INTO telemetry.error_logs (
			id, error_type, error_message, stack_trace, request_id, user_id, tenant_id, metadata, severity, created_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

	_, err := r.db.ExecContext(ctx, query,
		log.ID, log.ErrorType, log.ErrorMessage, log.StackTrace, log.RequestID,
		log.UserID, log.TenantID, log.Metadata, log.Severity, log.CreatedAt,
	)

	return err
}

// GetAuthStats gets authentication statistics
func (r *LogRepository) GetAuthStats(ctx context.Context, from, to time.Time) ([]map[string]interface{}, error) {
	query := `
		SELECT 
			action,
			success,
			count() AS count
		FROM telemetry.auth_logs
		WHERE created_at >= ? AND created_at <= ?
		GROUP BY action, success
		ORDER BY count DESC`

	rows, err := r.db.QueryContext(ctx, query, from, to)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	stats := []map[string]interface{}{}
	for rows.Next() {
		var action string
		var success bool
		var count int64

		if err := rows.Scan(&action, &success, &count); err != nil {
			return nil, err
		}

		stats = append(stats, map[string]interface{}{
			"action":  action,
			"success": success,
			"count":   count,
		})
	}

	return stats, nil
}

// GetTrafficStats gets traffic statistics
func (r *LogRepository) GetTrafficStats(ctx context.Context, from, to time.Time) (map[string]interface{}, error) {
	query := `
		SELECT
			count() AS total_requests,
			avg(duration_ms) AS avg_duration_ms,
			sum(request_size) AS total_request_size,
			sum(response_size) AS total_response_size
		FROM telemetry.traffic_logs
		WHERE created_at >= ? AND created_at <= ?`

	var stats struct {
		TotalRequests      int64
		AvgDurationMs      float64
		TotalRequestSize   int64
		TotalResponseSize  int64
	}

	err := r.db.QueryRowContext(ctx, query, from, to).Scan(
		&stats.TotalRequests,
		&stats.AvgDurationMs,
		&stats.TotalRequestSize,
		&stats.TotalResponseSize,
	)

	if err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"total_requests":       stats.TotalRequests,
		"avg_duration_ms":      fmt.Sprintf("%.2f", stats.AvgDurationMs),
		"total_request_size":   stats.TotalRequestSize,
		"total_response_size":  stats.TotalResponseSize,
	}, nil
}
