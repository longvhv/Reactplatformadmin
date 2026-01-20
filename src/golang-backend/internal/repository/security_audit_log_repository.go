package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"

	"golang-backend/internal/models"
)

type SecurityAuditLogRepository interface {
	Create(ctx context.Context, log *models.SecurityAuditLog) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.SecurityAuditLog, error)
	List(ctx context.Context, page, pageSize int, tenantID, actorID *uuid.UUID) ([]*models.SecurityAuditLog, int, error)
	ListByTenant(ctx context.Context, tenantID uuid.UUID, limit int) ([]*models.SecurityAuditLog, error)
	ListByActor(ctx context.Context, actorID uuid.UUID, limit int) ([]*models.SecurityAuditLog, error)
	DeleteOldLogs(ctx context.Context, before time.Time) (int64, error)
}

type securityAuditLogRepository struct {
	db *sqlx.DB
}

func NewSecurityAuditLogRepository(db *sqlx.DB) SecurityAuditLogRepository {
	return &securityAuditLogRepository{db: db}
}

func (r *securityAuditLogRepository) Create(ctx context.Context, log *models.SecurityAuditLog) error {
	query := `INSERT INTO telemetry.security_audit_logs (_id, tenant_id, actor_id, impersonator_id,
		event_category, event_action, target_id, resource_type, ip_address, user_agent, details, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`
	_, err := r.db.ExecContext(ctx, query, log.ID, log.TenantID, log.ActorID, log.ImpersonatorID,
		log.EventCategory, log.EventAction, log.TargetID, log.ResourceType, log.IPAddress,
		log.UserAgent, log.Details, log.CreatedAt)
	return err
}

func (r *securityAuditLogRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.SecurityAuditLog, error) {
	var log models.SecurityAuditLog
	err := r.db.GetContext(ctx, &log, `SELECT * FROM telemetry.security_audit_logs WHERE _id = $1`, id)
	return &log, err
}

func (r *securityAuditLogRepository) List(ctx context.Context, page, pageSize int, tenantID, actorID *uuid.UUID) ([]*models.SecurityAuditLog, int, error) {
	offset := (page - 1) * pageSize
	whereClause := "WHERE 1=1"
	args := []interface{}{}
	argPos := 1

	if tenantID != nil {
		whereClause += fmt.Sprintf(" AND tenant_id = $%d", argPos)
		args = append(args, *tenantID)
		argPos++
	}
	if actorID != nil {
		whereClause += fmt.Sprintf(" AND actor_id = $%d", argPos)
		args = append(args, *actorID)
		argPos++
	}

	var total int
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM telemetry.security_audit_logs %s", whereClause)
	r.db.GetContext(ctx, &total, countQuery, args...)

	query := fmt.Sprintf(`SELECT * FROM telemetry.security_audit_logs %s ORDER BY created_at DESC LIMIT $%d OFFSET $%d`,
		whereClause, argPos, argPos+1)
	args = append(args, pageSize, offset)

	var logs []*models.SecurityAuditLog
	err := r.db.SelectContext(ctx, &logs, query, args...)
	return logs, total, err
}

func (r *securityAuditLogRepository) ListByTenant(ctx context.Context, tenantID uuid.UUID, limit int) ([]*models.SecurityAuditLog, error) {
	var logs []*models.SecurityAuditLog
	err := r.db.SelectContext(ctx, &logs,
		`SELECT * FROM telemetry.security_audit_logs WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2`,
		tenantID, limit)
	return logs, err
}

func (r *securityAuditLogRepository) ListByActor(ctx context.Context, actorID uuid.UUID, limit int) ([]*models.SecurityAuditLog, error) {
	var logs []*models.SecurityAuditLog
	err := r.db.SelectContext(ctx, &logs,
		`SELECT * FROM telemetry.security_audit_logs WHERE actor_id = $1 ORDER BY created_at DESC LIMIT $2`,
		actorID, limit)
	return logs, err
}

func (r *securityAuditLogRepository) DeleteOldLogs(ctx context.Context, before time.Time) (int64, error) {
	result, err := r.db.ExecContext(ctx,
		`DELETE FROM telemetry.security_audit_logs WHERE created_at < $1`, before)
	if err != nil {
		return 0, err
	}
	return result.RowsAffected()
}
