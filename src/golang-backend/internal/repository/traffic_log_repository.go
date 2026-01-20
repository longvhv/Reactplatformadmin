package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"

	"golang-backend/internal/models"
)

type TrafficLogRepository interface {
	Create(ctx context.Context, log *models.TrafficLog) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.TrafficLog, error)
	List(ctx context.Context, page, pageSize int, tenantID *uuid.UUID) ([]*models.TrafficLog, int, error)
	GetStats(ctx context.Context, tenantID uuid.UUID, from, to time.Time) (map[string]interface{}, error)
	DeleteOldLogs(ctx context.Context, before time.Time) (int64, error)
}

type trafficLogRepository struct {
	db *sqlx.DB
}

func NewTrafficLogRepository(db *sqlx.DB) TrafficLogRepository {
	return &trafficLogRepository{db: db}
}

func (r *trafficLogRepository) Create(ctx context.Context, log *models.TrafficLog) error {
	query := `INSERT INTO telemetry.traffic_logs (_id, tenant_id, user_id, app_code, method, domain, path,
		status_code, latency_ms, request_size, response_size, ip_address, user_agent, data_region, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`
	_, err := r.db.ExecContext(ctx, query, log.ID, log.TenantID, log.UserID, log.AppCode, log.Method,
		log.Domain, log.Path, log.StatusCode, log.LatencyMs, log.RequestSize, log.ResponseSize,
		log.IPAddress, log.UserAgent, log.DataRegion, log.CreatedAt)
	return err
}

func (r *trafficLogRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.TrafficLog, error) {
	var log models.TrafficLog
	err := r.db.GetContext(ctx, &log, `SELECT * FROM telemetry.traffic_logs WHERE _id = $1`, id)
	return &log, err
}

func (r *trafficLogRepository) List(ctx context.Context, page, pageSize int, tenantID *uuid.UUID) ([]*models.TrafficLog, int, error) {
	offset := (page - 1) * pageSize
	whereClause := "WHERE 1=1"
	args := []interface{}{}
	argPos := 1

	if tenantID != nil {
		whereClause += fmt.Sprintf(" AND tenant_id = $%d", argPos)
		args = append(args, *tenantID)
		argPos++
	}

	var total int
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM telemetry.traffic_logs %s", whereClause)
	r.db.GetContext(ctx, &total, countQuery, args...)

	query := fmt.Sprintf(`SELECT * FROM telemetry.traffic_logs %s ORDER BY created_at DESC LIMIT $%d OFFSET $%d`,
		whereClause, argPos, argPos+1)
	args = append(args, pageSize, offset)

	var logs []*models.TrafficLog
	err := r.db.SelectContext(ctx, &logs, query, args...)
	return logs, total, err
}

func (r *trafficLogRepository) GetStats(ctx context.Context, tenantID uuid.UUID, from, to time.Time) (map[string]interface{}, error) {
	query := `SELECT 
		COUNT(*) as total_requests,
		AVG(latency_ms) as avg_latency,
		SUM(request_size) as total_request_size,
		SUM(response_size) as total_response_size
		FROM telemetry.traffic_logs
		WHERE tenant_id = $1 AND created_at BETWEEN $2 AND $3`
	
	var result struct {
		TotalRequests     int64   `db:"total_requests"`
		AvgLatency        float64 `db:"avg_latency"`
		TotalRequestSize  int64   `db:"total_request_size"`
		TotalResponseSize int64   `db:"total_response_size"`
	}
	
	err := r.db.GetContext(ctx, &result, query, tenantID, from, to)
	if err != nil {
		return nil, err
	}
	
	stats := map[string]interface{}{
		"total_requests":      result.TotalRequests,
		"avg_latency":         result.AvgLatency,
		"total_request_size":  result.TotalRequestSize,
		"total_response_size": result.TotalResponseSize,
	}
	return stats, nil
}

func (r *trafficLogRepository) DeleteOldLogs(ctx context.Context, before time.Time) (int64, error) {
	result, err := r.db.ExecContext(ctx,
		`DELETE FROM telemetry.traffic_logs WHERE created_at < $1`, before)
	if err != nil {
		return 0, err
	}
	return result.RowsAffected()
}
