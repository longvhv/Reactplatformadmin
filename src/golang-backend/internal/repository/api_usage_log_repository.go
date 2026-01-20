package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"

	"golang-backend/internal/models"
)

type APIUsageLogRepository interface {
	Create(ctx context.Context, log *models.APIUsageLog) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.APIUsageLog, error)
	List(ctx context.Context, page, pageSize int, tenantID *uuid.UUID, appCode *string) ([]*models.APIUsageLog, int, error)
	GetStats(ctx context.Context, tenantID uuid.UUID, from, to time.Time) (map[string]interface{}, error)
	DeleteOldLogs(ctx context.Context, before time.Time) (int64, error)
}

type apiUsageLogRepository struct {
	db *sqlx.DB
}

func NewAPIUsageLogRepository(db *sqlx.DB) APIUsageLogRepository {
	return &apiUsageLogRepository{db: db}
}

func (r *apiUsageLogRepository) Create(ctx context.Context, log *models.APIUsageLog) error {
	query := `INSERT INTO telemetry.api_usage_logs (_id, tenant_id, app_code, api_endpoint, api_method,
		status_code, request_size, response_size, latency_ms, api_key_id, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`
	_, err := r.db.ExecContext(ctx, query, log.ID, log.TenantID, log.AppCode, log.APIEndpoint,
		log.APIMethod, log.StatusCode, log.RequestSize, log.ResponseSize, log.LatencyMs,
		log.APIKeyID, log.CreatedAt)
	return err
}

func (r *apiUsageLogRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.APIUsageLog, error) {
	var log models.APIUsageLog
	err := r.db.GetContext(ctx, &log, `SELECT * FROM telemetry.api_usage_logs WHERE _id = $1`, id)
	return &log, err
}

func (r *apiUsageLogRepository) List(ctx context.Context, page, pageSize int, tenantID *uuid.UUID, appCode *string) ([]*models.APIUsageLog, int, error) {
	offset := (page - 1) * pageSize
	whereClause := "WHERE 1=1"
	args := []interface{}{}
	argPos := 1

	if tenantID != nil {
		whereClause += fmt.Sprintf(" AND tenant_id = $%d", argPos)
		args = append(args, *tenantID)
		argPos++
	}
	if appCode != nil {
		whereClause += fmt.Sprintf(" AND app_code = $%d", argPos)
		args = append(args, *appCode)
		argPos++
	}

	var total int
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM telemetry.api_usage_logs %s", whereClause)
	r.db.GetContext(ctx, &total, countQuery, args...)

	query := fmt.Sprintf(`SELECT * FROM telemetry.api_usage_logs %s ORDER BY created_at DESC LIMIT $%d OFFSET $%d`,
		whereClause, argPos, argPos+1)
	args = append(args, pageSize, offset)

	var logs []*models.APIUsageLog
	err := r.db.SelectContext(ctx, &logs, query, args...)
	return logs, total, err
}

func (r *apiUsageLogRepository) GetStats(ctx context.Context, tenantID uuid.UUID, from, to time.Time) (map[string]interface{}, error) {
	query := `SELECT 
		COUNT(*) as total_requests,
		AVG(latency_ms) as avg_latency,
		SUM(request_size) as total_request_size,
		SUM(response_size) as total_response_size
		FROM telemetry.api_usage_logs
		WHERE tenant_id = $1 AND created_at BETWEEN $2 AND $3`
	
	var result struct {
		TotalRequests      int64   `db:"total_requests"`
		AvgLatency         float64 `db:"avg_latency"`
		TotalRequestSize   int64   `db:"total_request_size"`
		TotalResponseSize  int64   `db:"total_response_size"`
	}
	
	err := r.db.GetContext(ctx, &result, query, tenantID, from, to)
	if err != nil {
		return nil, err
	}
	
	stats := map[string]interface{}{
		"total_requests":       result.TotalRequests,
		"avg_latency":          result.AvgLatency,
		"total_request_size":   result.TotalRequestSize,
		"total_response_size":  result.TotalResponseSize,
	}
	return stats, nil
}

func (r *apiUsageLogRepository) DeleteOldLogs(ctx context.Context, before time.Time) (int64, error) {
	result, err := r.db.ExecContext(ctx,
		`DELETE FROM telemetry.api_usage_logs WHERE created_at < $1`, before)
	if err != nil {
		return 0, err
	}
	return result.RowsAffected()
}
