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

type UsageEventRepository interface {
	Create(ctx context.Context, event *models.UsageEvent) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.UsageEvent, error)
	List(ctx context.Context, page, pageSize int, tenantID, subscriptionID *uuid.UUID, appCode, eventType *string, startTime, endTime *time.Time) ([]*models.UsageEvent, int, error)
	ListByTenantID(ctx context.Context, tenantID uuid.UUID, startTime, endTime time.Time) ([]*models.UsageEvent, error)
	ListBySubscriptionID(ctx context.Context, subscriptionID uuid.UUID, startTime, endTime time.Time) ([]*models.UsageEvent, error)
	GetSummaryByTenant(ctx context.Context, tenantID uuid.UUID, startTime, endTime time.Time) ([]*models.UsageEventSummary, error)
	GetSummaryBySubscription(ctx context.Context, subscriptionID uuid.UUID, startTime, endTime time.Time) ([]*models.UsageEventSummary, error)
	GetTotalUsage(ctx context.Context, tenantID uuid.UUID, eventType string, startTime, endTime time.Time) (float64, error)
	DeleteOldEvents(ctx context.Context, beforeDate time.Time) error
}

type usageEventRepository struct {
	db *sqlx.DB
}

func NewUsageEventRepository(db *sqlx.DB) UsageEventRepository {
	return &usageEventRepository{db: db}
}

func (r *usageEventRepository) Create(ctx context.Context, event *models.UsageEvent) error {
	query := `
		INSERT INTO usage_events (
			_id, tenant_id, subscription_id, app_code, event_type,
			quantity, unit, metadata, data_region, timestamp
		) VALUES (
			:_id, :tenant_id, :subscription_id, :app_code, :event_type,
			:quantity, :unit, :metadata, :data_region, :timestamp
		)`

	_, err := r.db.NamedExecContext(ctx, query, event)
	return err
}

func (r *usageEventRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.UsageEvent, error) {
	var event models.UsageEvent
	query := `SELECT * FROM usage_events WHERE _id = $1`

	err := r.db.GetContext(ctx, &event, query, id)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("usage event not found")
	}
	return &event, err
}

func (r *usageEventRepository) List(ctx context.Context, page, pageSize int, tenantID, subscriptionID *uuid.UUID, appCode, eventType *string, startTime, endTime *time.Time) ([]*models.UsageEvent, int, error) {
	var events []*models.UsageEvent
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

	if subscriptionID != nil {
		whereClause += fmt.Sprintf(" AND subscription_id = $%d", argPos)
		args = append(args, *subscriptionID)
		argPos++
	}

	if appCode != nil {
		whereClause += fmt.Sprintf(" AND app_code = $%d", argPos)
		args = append(args, *appCode)
		argPos++
	}

	if eventType != nil {
		whereClause += fmt.Sprintf(" AND event_type = $%d", argPos)
		args = append(args, *eventType)
		argPos++
	}

	if startTime != nil {
		whereClause += fmt.Sprintf(" AND timestamp >= $%d", argPos)
		args = append(args, *startTime)
		argPos++
	}

	if endTime != nil {
		whereClause += fmt.Sprintf(" AND timestamp <= $%d", argPos)
		args = append(args, *endTime)
		argPos++
	}

	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM usage_events %s", whereClause)
	err := r.db.GetContext(ctx, &total, countQuery, args...)
	if err != nil {
		return nil, 0, err
	}

	query := fmt.Sprintf(`
		SELECT * FROM usage_events %s
		ORDER BY timestamp DESC
		LIMIT $%d OFFSET $%d
	`, whereClause, argPos, argPos+1)

	args = append(args, pageSize, offset)
	err = r.db.SelectContext(ctx, &events, query, args...)
	if err != nil {
		return nil, 0, err
	}

	return events, total, nil
}

func (r *usageEventRepository) ListByTenantID(ctx context.Context, tenantID uuid.UUID, startTime, endTime time.Time) ([]*models.UsageEvent, error) {
	var events []*models.UsageEvent
	query := `
		SELECT * FROM usage_events
		WHERE tenant_id = $1
		  AND timestamp >= $2
		  AND timestamp <= $3
		ORDER BY timestamp DESC`

	err := r.db.SelectContext(ctx, &events, query, tenantID, startTime, endTime)
	return events, err
}

func (r *usageEventRepository) ListBySubscriptionID(ctx context.Context, subscriptionID uuid.UUID, startTime, endTime time.Time) ([]*models.UsageEvent, error) {
	var events []*models.UsageEvent
	query := `
		SELECT * FROM usage_events
		WHERE subscription_id = $1
		  AND timestamp >= $2
		  AND timestamp <= $3
		ORDER BY timestamp DESC`

	err := r.db.SelectContext(ctx, &events, query, subscriptionID, startTime, endTime)
	return events, err
}

func (r *usageEventRepository) GetSummaryByTenant(ctx context.Context, tenantID uuid.UUID, startTime, endTime time.Time) ([]*models.UsageEventSummary, error) {
	var summaries []*models.UsageEventSummary
	query := `
		SELECT 
			event_type,
			COUNT(*) as total_count,
			SUM(quantity) as total_quantity,
			unit,
			MIN(timestamp) as first_event,
			MAX(timestamp) as last_event
		FROM usage_events
		WHERE tenant_id = $1
		  AND timestamp >= $2
		  AND timestamp <= $3
		GROUP BY event_type, unit
		ORDER BY total_quantity DESC`

	err := r.db.SelectContext(ctx, &summaries, query, tenantID, startTime, endTime)
	return summaries, err
}

func (r *usageEventRepository) GetSummaryBySubscription(ctx context.Context, subscriptionID uuid.UUID, startTime, endTime time.Time) ([]*models.UsageEventSummary, error) {
	var summaries []*models.UsageEventSummary
	query := `
		SELECT 
			event_type,
			COUNT(*) as total_count,
			SUM(quantity) as total_quantity,
			unit,
			MIN(timestamp) as first_event,
			MAX(timestamp) as last_event
		FROM usage_events
		WHERE subscription_id = $1
		  AND timestamp >= $2
		  AND timestamp <= $3
		GROUP BY event_type, unit
		ORDER BY total_quantity DESC`

	err := r.db.SelectContext(ctx, &summaries, query, subscriptionID, startTime, endTime)
	return summaries, err
}

func (r *usageEventRepository) GetTotalUsage(ctx context.Context, tenantID uuid.UUID, eventType string, startTime, endTime time.Time) (float64, error) {
	var total float64
	query := `
		SELECT COALESCE(SUM(quantity), 0)
		FROM usage_events
		WHERE tenant_id = $1
		  AND event_type = $2
		  AND timestamp >= $3
		  AND timestamp <= $4`

	err := r.db.GetContext(ctx, &total, query, tenantID, eventType, startTime, endTime)
	return total, err
}

func (r *usageEventRepository) DeleteOldEvents(ctx context.Context, beforeDate time.Time) error {
	query := `DELETE FROM usage_events WHERE timestamp < $1`

	_, err := r.db.ExecContext(ctx, query, beforeDate)
	return err
}
