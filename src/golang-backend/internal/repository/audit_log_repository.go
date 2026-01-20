package repository

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"

	"golang-backend/internal/models"
)

type AuditLogRepository interface {
	Create(ctx context.Context, log *models.AuditLog) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.AuditLog, error)
	List(ctx context.Context, page, pageSize int, tenantID, userID *uuid.UUID, action, resource, status *string, startTime, endTime *time.Time) ([]*models.AuditLog, int, error)
	ListByTenantID(ctx context.Context, tenantID uuid.UUID, limit int) ([]*models.AuditLog, error)
	ListByUserID(ctx context.Context, userID uuid.UUID, limit int) ([]*models.AuditLog, error)
	ListByResource(ctx context.Context, resource string, resourceID string) ([]*models.AuditLog, error)
	ListByAction(ctx context.Context, action string) ([]*models.AuditLog, error)
	ListByIPAddress(ctx context.Context, ipAddress string) ([]*models.AuditLog, error)
	DeleteOldLogs(ctx context.Context, olderThan time.Time) (int64, error)
	GetStatsByTenant(ctx context.Context, tenantID uuid.UUID, startTime, endTime time.Time) (map[string]interface{}, error)
	GetStatsByUser(ctx context.Context, userID uuid.UUID, startTime, endTime time.Time) (map[string]interface{}, error)
}

type auditLogRepository struct {
	db *sqlx.DB
}

func NewAuditLogRepository(db *sqlx.DB) AuditLogRepository {
	return &auditLogRepository{db: db}
}

func (r *auditLogRepository) Create(ctx context.Context, log *models.AuditLog) error {
	query := `
		INSERT INTO telemetry.audit_logs (
			_id, tenant_id, user_id, impersonator_id, event_time, action,
			resource, resource_id, details, ip_address, user_agent, status
		) VALUES (
			:_id, :tenant_id, :user_id, :impersonator_id, :event_time, :action,
			:resource, :resource_id, :details, :ip_address, :user_agent, :status
		)`

	_, err := r.db.NamedExecContext(ctx, query, log)
	return err
}

func (r *auditLogRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.AuditLog, error) {
	var log models.AuditLog
	query := `SELECT * FROM telemetry.audit_logs WHERE _id = $1`

	err := r.db.GetContext(ctx, &log, query, id)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("audit log not found")
	}
	return &log, err
}

func (r *auditLogRepository) List(ctx context.Context, page, pageSize int, tenantID, userID *uuid.UUID, action, resource, status *string, startTime, endTime *time.Time) ([]*models.AuditLog, int, error) {
	var logs []*models.AuditLog
	var total int

	offset := (page - 1) * pageSize

	whereClause := "WHERE 1=1"
	args := []interface{}{}
	argPos := 1

	if tenantID != nil {
		whereClause += fmt.Sprintf(" AND tenant_id = $%d", argPos)
		args = append(args, *tenantID)
		argPos++
	}

	if userID != nil {
		whereClause += fmt.Sprintf(" AND user_id = $%d", argPos)
		args = append(args, *userID)
		argPos++
	}

	if action != nil {
		whereClause += fmt.Sprintf(" AND action = $%d", argPos)
		args = append(args, *action)
		argPos++
	}

	if resource != nil {
		whereClause += fmt.Sprintf(" AND resource = $%d", argPos)
		args = append(args, *resource)
		argPos++
	}

	if status != nil {
		whereClause += fmt.Sprintf(" AND status = $%d", argPos)
		args = append(args, *status)
		argPos++
	}

	if startTime != nil {
		whereClause += fmt.Sprintf(" AND event_time >= $%d", argPos)
		args = append(args, *startTime)
		argPos++
	}

	if endTime != nil {
		whereClause += fmt.Sprintf(" AND event_time <= $%d", argPos)
		args = append(args, *endTime)
		argPos++
	}

	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM telemetry.audit_logs %s", whereClause)
	err := r.db.GetContext(ctx, &total, countQuery, args...)
	if err != nil {
		return nil, 0, err
	}

	query := fmt.Sprintf(`
		SELECT * FROM telemetry.audit_logs %s
		ORDER BY event_time DESC
		LIMIT $%d OFFSET $%d
	`, whereClause, argPos, argPos+1)

	args = append(args, pageSize, offset)
	err = r.db.SelectContext(ctx, &logs, query, args...)
	if err != nil {
		return nil, 0, err
	}

	return logs, total, nil
}

func (r *auditLogRepository) ListByTenantID(ctx context.Context, tenantID uuid.UUID, limit int) ([]*models.AuditLog, error) {
	var logs []*models.AuditLog
	query := `
		SELECT * FROM telemetry.audit_logs
		WHERE tenant_id = $1
		ORDER BY event_time DESC
		LIMIT $2`

	err := r.db.SelectContext(ctx, &logs, query, tenantID, limit)
	return logs, err
}

func (r *auditLogRepository) ListByUserID(ctx context.Context, userID uuid.UUID, limit int) ([]*models.AuditLog, error) {
	var logs []*models.AuditLog
	query := `
		SELECT * FROM telemetry.audit_logs
		WHERE user_id = $1
		ORDER BY event_time DESC
		LIMIT $2`

	err := r.db.SelectContext(ctx, &logs, query, userID, limit)
	return logs, err
}

func (r *auditLogRepository) ListByResource(ctx context.Context, resource string, resourceID string) ([]*models.AuditLog, error) {
	var logs []*models.AuditLog
	query := `
		SELECT * FROM telemetry.audit_logs
		WHERE resource = $1 AND resource_id = $2
		ORDER BY event_time DESC`

	err := r.db.SelectContext(ctx, &logs, query, resource, resourceID)
	return logs, err
}

func (r *auditLogRepository) ListByAction(ctx context.Context, action string) ([]*models.AuditLog, error) {
	var logs []*models.AuditLog
	query := `
		SELECT * FROM telemetry.audit_logs
		WHERE action = $1
		ORDER BY event_time DESC
		LIMIT 1000`

	err := r.db.SelectContext(ctx, &logs, query, action)
	return logs, err
}

func (r *auditLogRepository) ListByIPAddress(ctx context.Context, ipAddress string) ([]*models.AuditLog, error) {
	var logs []*models.AuditLog
	query := `
		SELECT * FROM telemetry.audit_logs
		WHERE ip_address = $1
		ORDER BY event_time DESC
		LIMIT 1000`

	err := r.db.SelectContext(ctx, &logs, query, ipAddress)
	return logs, err
}

func (r *auditLogRepository) DeleteOldLogs(ctx context.Context, olderThan time.Time) (int64, error) {
	query := `DELETE FROM telemetry.audit_logs WHERE event_time < $1`

	result, err := r.db.ExecContext(ctx, query, olderThan)
	if err != nil {
		return 0, err
	}

	return result.RowsAffected()
}

func (r *auditLogRepository) GetStatsByTenant(ctx context.Context, tenantID uuid.UUID, startTime, endTime time.Time) (map[string]interface{}, error) {
	stats := make(map[string]interface{})

	// Total events
	var totalEvents int
	totalQuery := `
		SELECT COUNT(*) FROM telemetry.audit_logs
		WHERE tenant_id = $1 AND event_time BETWEEN $2 AND $3`
	if err := r.db.GetContext(ctx, &totalEvents, totalQuery, tenantID, startTime, endTime); err != nil {
		return nil, err
	}
	stats["total_events"] = totalEvents

	// Events by action
	var actionStats []struct {
		Action string `db:"action"`
		Count  int    `db:"count"`
	}
	actionQuery := `
		SELECT action, COUNT(*) as count FROM telemetry.audit_logs
		WHERE tenant_id = $1 AND event_time BETWEEN $2 AND $3
		GROUP BY action
		ORDER BY count DESC`
	if err := r.db.SelectContext(ctx, &actionStats, actionQuery, tenantID, startTime, endTime); err != nil {
		return nil, err
	}
	stats["by_action"] = actionStats

	// Events by status
	var statusStats []struct {
		Status string `db:"status"`
		Count  int    `db:"count"`
	}
	statusQuery := `
		SELECT status, COUNT(*) as count FROM telemetry.audit_logs
		WHERE tenant_id = $1 AND event_time BETWEEN $2 AND $3 AND status IS NOT NULL
		GROUP BY status`
	if err := r.db.SelectContext(ctx, &statusStats, statusQuery, tenantID, startTime, endTime); err != nil {
		return nil, err
	}
	stats["by_status"] = statusStats

	return stats, nil
}

func (r *auditLogRepository) GetStatsByUser(ctx context.Context, userID uuid.UUID, startTime, endTime time.Time) (map[string]interface{}, error) {
	stats := make(map[string]interface{})

	// Total events
	var totalEvents int
	totalQuery := `
		SELECT COUNT(*) FROM telemetry.audit_logs
		WHERE user_id = $1 AND event_time BETWEEN $2 AND $3`
	if err := r.db.GetContext(ctx, &totalEvents, totalQuery, userID, startTime, endTime); err != nil {
		return nil, err
	}
	stats["total_events"] = totalEvents

	// Events by action
	var actionStats []struct {
		Action string `db:"action"`
		Count  int    `db:"count"`
	}
	actionQuery := `
		SELECT action, COUNT(*) as count FROM telemetry.audit_logs
		WHERE user_id = $1 AND event_time BETWEEN $2 AND $3
		GROUP BY action
		ORDER BY count DESC`
	if err := r.db.SelectContext(ctx, &actionStats, actionQuery, userID, startTime, endTime); err != nil {
		return nil, err
	}
	stats["by_action"] = actionStats

	return stats, nil
}
