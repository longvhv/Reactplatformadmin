package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"

	"golang-backend/internal/models"
)

type AuthLogRepository interface {
	Create(ctx context.Context, log *models.AuthLog) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.AuthLog, error)
	List(ctx context.Context, page, pageSize int, tenantID, userID *uuid.UUID, action, status *string) ([]*models.AuthLog, int, error)
	ListByUser(ctx context.Context, userID uuid.UUID, limit int) ([]*models.AuthLog, error)
	ListByTenant(ctx context.Context, tenantID uuid.UUID, limit int) ([]*models.AuthLog, error)
	DeleteOldLogs(ctx context.Context, before time.Time) (int64, error)
}

type authLogRepository struct {
	db *sqlx.DB
}

func NewAuthLogRepository(db *sqlx.DB) AuthLogRepository {
	return &authLogRepository{db: db}
}

func (r *authLogRepository) Create(ctx context.Context, log *models.AuthLog) error {
	query := `INSERT INTO telemetry.auth_logs (_id, user_id, tenant_id, action, status, ip_address, user_agent,
		browser, os, device_type, location, country_code, error_message, metadata, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`
	_, err := r.db.ExecContext(ctx, query, log.ID, log.UserID, log.TenantID, log.Action, log.Status,
		log.IPAddress, log.UserAgent, log.Browser, log.OS, log.DeviceType, log.Location,
		log.CountryCode, log.ErrorMessage, log.Metadata, log.CreatedAt)
	return err
}

func (r *authLogRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.AuthLog, error) {
	var log models.AuthLog
	err := r.db.GetContext(ctx, &log, `SELECT * FROM telemetry.auth_logs WHERE _id = $1`, id)
	return &log, err
}

func (r *authLogRepository) List(ctx context.Context, page, pageSize int, tenantID, userID *uuid.UUID, action, status *string) ([]*models.AuthLog, int, error) {
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
	if status != nil {
		whereClause += fmt.Sprintf(" AND status = $%d", argPos)
		args = append(args, *status)
		argPos++
	}

	var total int
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM telemetry.auth_logs %s", whereClause)
	r.db.GetContext(ctx, &total, countQuery, args...)

	query := fmt.Sprintf(`SELECT * FROM telemetry.auth_logs %s ORDER BY created_at DESC LIMIT $%d OFFSET $%d`,
		whereClause, argPos, argPos+1)
	args = append(args, pageSize, offset)

	var logs []*models.AuthLog
	err := r.db.SelectContext(ctx, &logs, query, args...)
	return logs, total, err
}

func (r *authLogRepository) ListByUser(ctx context.Context, userID uuid.UUID, limit int) ([]*models.AuthLog, error) {
	var logs []*models.AuthLog
	err := r.db.SelectContext(ctx, &logs,
		`SELECT * FROM telemetry.auth_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`,
		userID, limit)
	return logs, err
}

func (r *authLogRepository) ListByTenant(ctx context.Context, tenantID uuid.UUID, limit int) ([]*models.AuthLog, error) {
	var logs []*models.AuthLog
	err := r.db.SelectContext(ctx, &logs,
		`SELECT * FROM telemetry.auth_logs WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2`,
		tenantID, limit)
	return logs, err
}

func (r *authLogRepository) DeleteOldLogs(ctx context.Context, before time.Time) (int64, error) {
	result, err := r.db.ExecContext(ctx,
		`DELETE FROM telemetry.auth_logs WHERE created_at < $1`, before)
	if err != nil {
		return 0, err
	}
	return result.RowsAffected()
}
