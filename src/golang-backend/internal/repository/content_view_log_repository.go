package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"

	"golang-backend/internal/models"
)

type ContentViewLogRepository interface {
	Create(ctx context.Context, log *models.ContentViewLog) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.ContentViewLog, error)
	List(ctx context.Context, page, pageSize int, tenantID *uuid.UUID, objectType *string) ([]*models.ContentViewLog, int, error)
	ListByObject(ctx context.Context, objectID uuid.UUID, limit int) ([]*models.ContentViewLog, error)
	GetViewCount(ctx context.Context, objectID uuid.UUID) (int64, error)
	DeleteOldLogs(ctx context.Context, before time.Time) (int64, error)
}

type contentViewLogRepository struct {
	db *sqlx.DB
}

func NewContentViewLogRepository(db *sqlx.DB) ContentViewLogRepository {
	return &contentViewLogRepository{db: db}
}

func (r *contentViewLogRepository) Create(ctx context.Context, log *models.ContentViewLog) error {
	query := `INSERT INTO telemetry.content_view_logs (_id, tenant_id, object_type, object_id, category_ids,
		author_id, user_id, visitor_id, ip_address, user_agent, device_type, referrer, view_duration, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`
	_, err := r.db.ExecContext(ctx, query, log.ID, log.TenantID, log.ObjectType, log.ObjectID,
		log.CategoryIDs, log.AuthorID, log.UserID, log.VisitorID, log.IPAddress, log.UserAgent,
		log.DeviceType, log.Referrer, log.ViewDuration, log.CreatedAt)
	return err
}

func (r *contentViewLogRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.ContentViewLog, error) {
	var log models.ContentViewLog
	err := r.db.GetContext(ctx, &log, `SELECT * FROM telemetry.content_view_logs WHERE _id = $1`, id)
	return &log, err
}

func (r *contentViewLogRepository) List(ctx context.Context, page, pageSize int, tenantID *uuid.UUID, objectType *string) ([]*models.ContentViewLog, int, error) {
	offset := (page - 1) * pageSize
	whereClause := "WHERE 1=1"
	args := []interface{}{}
	argPos := 1

	if tenantID != nil {
		whereClause += fmt.Sprintf(" AND tenant_id = $%d", argPos)
		args = append(args, *tenantID)
		argPos++
	}
	if objectType != nil {
		whereClause += fmt.Sprintf(" AND object_type = $%d", argPos)
		args = append(args, *objectType)
		argPos++
	}

	var total int
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM telemetry.content_view_logs %s", whereClause)
	r.db.GetContext(ctx, &total, countQuery, args...)

	query := fmt.Sprintf(`SELECT * FROM telemetry.content_view_logs %s ORDER BY created_at DESC LIMIT $%d OFFSET $%d`,
		whereClause, argPos, argPos+1)
	args = append(args, pageSize, offset)

	var logs []*models.ContentViewLog
	err := r.db.SelectContext(ctx, &logs, query, args...)
	return logs, total, err
}

func (r *contentViewLogRepository) ListByObject(ctx context.Context, objectID uuid.UUID, limit int) ([]*models.ContentViewLog, error) {
	var logs []*models.ContentViewLog
	err := r.db.SelectContext(ctx, &logs,
		`SELECT * FROM telemetry.content_view_logs WHERE object_id = $1 ORDER BY created_at DESC LIMIT $2`,
		objectID, limit)
	return logs, err
}

func (r *contentViewLogRepository) GetViewCount(ctx context.Context, objectID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.GetContext(ctx, &count,
		`SELECT COUNT(*) FROM telemetry.content_view_logs WHERE object_id = $1`, objectID)
	return count, err
}

func (r *contentViewLogRepository) DeleteOldLogs(ctx context.Context, before time.Time) (int64, error) {
	result, err := r.db.ExecContext(ctx,
		`DELETE FROM telemetry.content_view_logs WHERE created_at < $1`, before)
	if err != nil {
		return 0, err
	}
	return result.RowsAffected()
}
