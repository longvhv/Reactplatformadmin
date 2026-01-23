package yugabyte

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/google/uuid"
	"github.com/lib/pq"
	"github.com/vhv-platform/backend/internal/models"
)

type webhookRepository struct {
	db *sql.DB
}

func NewWebhookRepository(db *sql.DB) *webhookRepository {
	return &webhookRepository{db: db}
}

func (r *webhookRepository) Create(ctx context.Context, webhook *models.Webhook) error {
	query := `
		INSERT INTO webhooks (
			_id, tenant_id, name, url, secret, events, is_active,
			description, headers, retry_policy, timeout,
			created_at, updated_at, created_by, version
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`

	eventsArray := pq.Array([]string{})
	if webhook.Events != "" {
		// Assume events is stored as comma-separated or JSON string
	}

	_, err := r.db.ExecContext(ctx, query,
		webhook.ID, webhook.TenantID, webhook.Name, webhook.URL, webhook.Secret,
		eventsArray, webhook.IsActive, webhook.Description, webhook.Headers,
		webhook.RetryPolicy, webhook.Timeout, webhook.CreatedAt, webhook.UpdatedAt,
		webhook.CreatedBy, webhook.Version,
	)

	return err
}

func (r *webhookRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Webhook, error) {
	query := `
		SELECT _id, tenant_id, name, url, secret, events, is_active,
			description, headers, retry_policy, timeout, last_triggered,
			success_count, failure_count, metadata,
			created_at, updated_at, created_by, updated_by, version
		FROM webhooks
		WHERE _id = $1`

	webhook := &models.Webhook{}
	var eventsArray pq.StringArray

	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&webhook.ID, &webhook.TenantID, &webhook.Name, &webhook.URL, &webhook.Secret,
		&eventsArray, &webhook.IsActive, &webhook.Description, &webhook.Headers,
		&webhook.RetryPolicy, &webhook.Timeout, &webhook.LastTriggered,
		&webhook.SuccessCount, &webhook.FailureCount, &webhook.Metadata,
		&webhook.CreatedAt, &webhook.UpdatedAt, &webhook.CreatedBy,
		&webhook.UpdatedBy, &webhook.Version,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("webhook not found")
	}

	return webhook, err
}

func (r *webhookRepository) ListByTenant(ctx context.Context, tenantID uuid.UUID, page, limit int) ([]*models.Webhook, int, error) {
	// Count
	countQuery := `SELECT COUNT(*) FROM webhooks WHERE tenant_id = $1`
	var total int
	r.db.QueryRowContext(ctx, countQuery, tenantID).Scan(&total)

	// List
	offset := (page - 1) * limit
	query := `
		SELECT _id, tenant_id, name, url, is_active, timeout,
			success_count, failure_count, last_triggered,
			created_at, updated_at, version
		FROM webhooks
		WHERE tenant_id = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3`

	rows, err := r.db.QueryContext(ctx, query, tenantID, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	webhooks := []*models.Webhook{}
	for rows.Next() {
		w := &models.Webhook{}
		rows.Scan(&w.ID, &w.TenantID, &w.Name, &w.URL, &w.IsActive, &w.Timeout,
			&w.SuccessCount, &w.FailureCount, &w.LastTriggered,
			&w.CreatedAt, &w.UpdatedAt, &w.Version)
		webhooks = append(webhooks, w)
	}

	return webhooks, total, nil
}

func (r *webhookRepository) Update(ctx context.Context, webhook *models.Webhook) error {
	query := `
		UPDATE webhooks SET
			name = $2, url = $3, is_active = $4, description = $5,
			headers = $6, retry_policy = $7, timeout = $8, metadata = $9,
			updated_at = $10, updated_by = $11, version = version + 1
		WHERE _id = $1`

	result, err := r.db.ExecContext(ctx, query,
		webhook.ID, webhook.Name, webhook.URL, webhook.IsActive, webhook.Description,
		webhook.Headers, webhook.RetryPolicy, webhook.Timeout, webhook.Metadata,
		webhook.UpdatedAt, webhook.UpdatedBy,
	)

	if err != nil {
		return err
	}

	rows, _ := result.RowsAffected()
	if rows == 0 {
		return fmt.Errorf("webhook not found")
	}

	return nil
}

func (r *webhookRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM webhooks WHERE _id = $1`
	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return err
	}

	rows, _ := result.RowsAffected()
	if rows == 0 {
		return fmt.Errorf("webhook not found")
	}

	return nil
}

func (r *webhookRepository) IncrementSuccessCount(ctx context.Context, id uuid.UUID) error {
	query := `UPDATE webhooks SET success_count = success_count + 1, last_triggered = NOW() WHERE _id = $1`
	_, err := r.db.ExecContext(ctx, query, id)
	return err
}

func (r *webhookRepository) IncrementFailureCount(ctx context.Context, id uuid.UUID) error {
	query := `UPDATE webhooks SET failure_count = failure_count + 1, last_triggered = NOW() WHERE _id = $1`
	_, err := r.db.ExecContext(ctx, query, id)
	return err
}
