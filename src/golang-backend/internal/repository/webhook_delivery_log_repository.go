package repository

import (
	"database/sql"
	"fmt"
	"strings"

	"github.com/yourusername/golang-backend/internal/models"
)

type WebhookDeliveryLogRepository struct {
	db *sql.DB
}

func NewWebhookDeliveryLogRepository(db *sql.DB) *WebhookDeliveryLogRepository {
	return &WebhookDeliveryLogRepository{db: db}
}

func (r *WebhookDeliveryLogRepository) Create(log *models.WebhookDeliveryLog) error {
	query := `
		INSERT INTO telemetry.webhook_delivery_logs (
			_id, tenant_id, webhook_id, event_type, target_url,
			payload, response_body, status_code, is_success, latency_ms,
			attempt_number, created_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW()
		)
		RETURNING _id, created_at
	`

	return r.db.QueryRow(
		query,
		log.ID,
		log.TenantID,
		log.WebhookID,
		log.EventType,
		log.TargetURL,
		log.Payload,
		log.ResponseBody,
		log.StatusCode,
		log.IsSuccess,
		log.LatencyMs,
		log.AttemptNumber,
	).Scan(&log.ID, &log.CreatedAt)
}

func (r *WebhookDeliveryLogRepository) GetByID(id string) (*models.WebhookDeliveryLog, error) {
	query := `
		SELECT 
			_id, tenant_id, webhook_id, event_type, target_url,
			payload, response_body, status_code, is_success, latency_ms,
			attempt_number, created_at
		FROM telemetry.webhook_delivery_logs
		WHERE _id = $1
	`

	log := &models.WebhookDeliveryLog{}
	err := r.db.QueryRow(query, id).Scan(
		&log.ID,
		&log.TenantID,
		&log.WebhookID,
		&log.EventType,
		&log.TargetURL,
		&log.Payload,
		&log.ResponseBody,
		&log.StatusCode,
		&log.IsSuccess,
		&log.LatencyMs,
		&log.AttemptNumber,
		&log.CreatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("webhook delivery log not found")
	}

	return log, err
}

func (r *WebhookDeliveryLogRepository) List(tenantID, webhookID *string, isSuccess *bool, page, pageSize int) ([]models.WebhookDeliveryLog, int, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	var conditions []string
	var args []interface{}
	argCount := 0

	if tenantID != nil {
		argCount++
		conditions = append(conditions, fmt.Sprintf("tenant_id = $%d", argCount))
		args = append(args, *tenantID)
	}

	if webhookID != nil {
		argCount++
		conditions = append(conditions, fmt.Sprintf("webhook_id = $%d", argCount))
		args = append(args, *webhookID)
	}

	if isSuccess != nil {
		argCount++
		conditions = append(conditions, fmt.Sprintf("is_success = $%d", argCount))
		args = append(args, *isSuccess)
	}

	whereClause := ""
	if len(conditions) > 0 {
		whereClause = "WHERE " + strings.Join(conditions, " AND ")
	}

	// Count total
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM telemetry.webhook_delivery_logs %s", whereClause)
	var total int
	err := r.db.QueryRow(countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	// Get paginated results
	offset := (page - 1) * pageSize
	query := fmt.Sprintf(`
		SELECT 
			_id, tenant_id, webhook_id, event_type, target_url,
			payload, response_body, status_code, is_success, latency_ms,
			attempt_number, created_at
		FROM telemetry.webhook_delivery_logs
		%s
		ORDER BY created_at DESC
		LIMIT $%d OFFSET $%d
	`, whereClause, argCount+1, argCount+2)

	args = append(args, pageSize, offset)
	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var logs []models.WebhookDeliveryLog
	for rows.Next() {
		var log models.WebhookDeliveryLog
		err := rows.Scan(
			&log.ID,
			&log.TenantID,
			&log.WebhookID,
			&log.EventType,
			&log.TargetURL,
			&log.Payload,
			&log.ResponseBody,
			&log.StatusCode,
			&log.IsSuccess,
			&log.LatencyMs,
			&log.AttemptNumber,
			&log.CreatedAt,
		)
		if err != nil {
			return nil, 0, err
		}
		logs = append(logs, log)
	}

	return logs, total, nil
}

func (r *WebhookDeliveryLogRepository) ListByWebhookID(webhookID string, page, pageSize int) ([]models.WebhookDeliveryLog, int, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	// Count total
	countQuery := `SELECT COUNT(*) FROM telemetry.webhook_delivery_logs WHERE webhook_id = $1`
	var total int
	err := r.db.QueryRow(countQuery, webhookID).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	// Get paginated results
	offset := (page - 1) * pageSize
	query := `
		SELECT 
			_id, tenant_id, webhook_id, event_type, target_url,
			payload, response_body, status_code, is_success, latency_ms,
			attempt_number, created_at
		FROM telemetry.webhook_delivery_logs
		WHERE webhook_id = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`

	rows, err := r.db.Query(query, webhookID, pageSize, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var logs []models.WebhookDeliveryLog
	for rows.Next() {
		var log models.WebhookDeliveryLog
		err := rows.Scan(
			&log.ID,
			&log.TenantID,
			&log.WebhookID,
			&log.EventType,
			&log.TargetURL,
			&log.Payload,
			&log.ResponseBody,
			&log.StatusCode,
			&log.IsSuccess,
			&log.LatencyMs,
			&log.AttemptNumber,
			&log.CreatedAt,
		)
		if err != nil {
			return nil, 0, err
		}
		logs = append(logs, log)
	}

	return logs, total, nil
}

func (r *WebhookDeliveryLogRepository) ListByTenantID(tenantID string, page, pageSize int) ([]models.WebhookDeliveryLog, int, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	// Count total
	countQuery := `SELECT COUNT(*) FROM telemetry.webhook_delivery_logs WHERE tenant_id = $1`
	var total int
	err := r.db.QueryRow(countQuery, tenantID).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	// Get paginated results
	offset := (page - 1) * pageSize
	query := `
		SELECT 
			_id, tenant_id, webhook_id, event_type, target_url,
			payload, response_body, status_code, is_success, latency_ms,
			attempt_number, created_at
		FROM telemetry.webhook_delivery_logs
		WHERE tenant_id = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`

	rows, err := r.db.Query(query, tenantID, pageSize, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var logs []models.WebhookDeliveryLog
	for rows.Next() {
		var log models.WebhookDeliveryLog
		err := rows.Scan(
			&log.ID,
			&log.TenantID,
			&log.WebhookID,
			&log.EventType,
			&log.TargetURL,
			&log.Payload,
			&log.ResponseBody,
			&log.StatusCode,
			&log.IsSuccess,
			&log.LatencyMs,
			&log.AttemptNumber,
			&log.CreatedAt,
		)
		if err != nil {
			return nil, 0, err
		}
		logs = append(logs, log)
	}

	return logs, total, nil
}

func (r *WebhookDeliveryLogRepository) GetStats(webhookID string) (map[string]interface{}, error) {
	query := `
		SELECT 
			COUNT(*) as total_deliveries,
			SUM(CASE WHEN is_success = true THEN 1 ELSE 0 END) as successful_deliveries,
			SUM(CASE WHEN is_success = false THEN 1 ELSE 0 END) as failed_deliveries,
			AVG(latency_ms) as avg_latency_ms,
			MAX(latency_ms) as max_latency_ms,
			MIN(latency_ms) as min_latency_ms
		FROM telemetry.webhook_delivery_logs
		WHERE webhook_id = $1
	`

	var totalDeliveries, successfulDeliveries, failedDeliveries int
	var avgLatency, maxLatency, minLatency sql.NullFloat64

	err := r.db.QueryRow(query, webhookID).Scan(
		&totalDeliveries,
		&successfulDeliveries,
		&failedDeliveries,
		&avgLatency,
		&maxLatency,
		&minLatency,
	)
	if err != nil {
		return nil, err
	}

	stats := map[string]interface{}{
		"total_deliveries":      totalDeliveries,
		"successful_deliveries": successfulDeliveries,
		"failed_deliveries":     failedDeliveries,
		"avg_latency_ms":        avgLatency.Float64,
		"max_latency_ms":        maxLatency.Float64,
		"min_latency_ms":        minLatency.Float64,
	}

	return stats, nil
}
