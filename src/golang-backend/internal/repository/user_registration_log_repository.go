package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"

	"golang-backend/internal/models"
)

type UserRegistrationLogRepository interface {
	Create(ctx context.Context, log *models.UserRegistrationLog) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.UserRegistrationLog, error)
	List(ctx context.Context, page, pageSize int, tenantID *uuid.UUID) ([]*models.UserRegistrationLog, int, error)
	GetCount(ctx context.Context, tenantID uuid.UUID, from, to time.Time) (int64, error)
	DeleteOldLogs(ctx context.Context, before time.Time) (int64, error)
}

type userRegistrationLogRepository struct {
	db *sqlx.DB
}

func NewUserRegistrationLogRepository(db *sqlx.DB) UserRegistrationLogRepository {
	return &userRegistrationLogRepository{db: db}
}

func (r *userRegistrationLogRepository) Create(ctx context.Context, log *models.UserRegistrationLog) error {
	query := `INSERT INTO telemetry.user_registration_logs (_id, tenant_id, user_id, registration_source, data_region, created_at)
		VALUES ($1, $2, $3, $4, $5, $6)`
	_, err := r.db.ExecContext(ctx, query, log.ID, log.TenantID, log.UserID, log.RegistrationSource, log.DataRegion, log.CreatedAt)
	return err
}

func (r *userRegistrationLogRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.UserRegistrationLog, error) {
	var log models.UserRegistrationLog
	err := r.db.GetContext(ctx, &log, `SELECT * FROM telemetry.user_registration_logs WHERE _id = $1`, id)
	return &log, err
}

func (r *userRegistrationLogRepository) List(ctx context.Context, page, pageSize int, tenantID *uuid.UUID) ([]*models.UserRegistrationLog, int, error) {
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
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM telemetry.user_registration_logs %s", whereClause)
	r.db.GetContext(ctx, &total, countQuery, args...)

	query := fmt.Sprintf(`SELECT * FROM telemetry.user_registration_logs %s ORDER BY created_at DESC LIMIT $%d OFFSET $%d`,
		whereClause, argPos, argPos+1)
	args = append(args, pageSize, offset)

	var logs []*models.UserRegistrationLog
	err := r.db.SelectContext(ctx, &logs, query, args...)
	return logs, total, err
}

func (r *userRegistrationLogRepository) GetCount(ctx context.Context, tenantID uuid.UUID, from, to time.Time) (int64, error) {
	var count int64
	err := r.db.GetContext(ctx, &count,
		`SELECT COUNT(*) FROM telemetry.user_registration_logs WHERE tenant_id = $1 AND created_at BETWEEN $2 AND $3`,
		tenantID, from, to)
	return count, err
}

func (r *userRegistrationLogRepository) DeleteOldLogs(ctx context.Context, before time.Time) (int64, error) {
	result, err := r.db.ExecContext(ctx,
		`DELETE FROM telemetry.user_registration_logs WHERE created_at < $1`, before)
	if err != nil {
		return 0, err
	}
	return result.RowsAffected()
}
