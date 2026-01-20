package repository

import (
	"database/sql"
	"fmt"
	"strings"

	"github.com/yourusername/golang-backend/internal/models"
)

type WebhookRepository struct {
	db *sql.DB
}

func NewWebhookRepository(db *sql.DB) *WebhookRepository {
	return &WebhookRepository{db: db}
}

func (r *WebhookRepository) Create(webhook *models.Webhook) error {
	query := `
		INSERT INTO webhooks (
			_id, tenant_id, name, description, url, method,
			event_types, event_filter, secret_key, auth_type, auth_config,
			headers, timeout_ms, retry_config, is_active, is_verified,
			verification_token, success_count, failure_count, total_count,
			batch_size, rate_limit, priority, tags, metadata, created_by,
			created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
			$11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
			$21, $22, $23, $24, $25, $26, NOW(), NOW()
		)
		RETURNING _id, created_at, updated_at
	`

	return r.db.QueryRow(
		query,
		webhook.ID, webhook.TenantID, webhook.Name, webhook.Description, webhook.URL, webhook.Method,
		webhook.EventTypes, webhook.EventFilter, webhook.SecretKey, webhook.AuthType, webhook.AuthConfig,
		webhook.Headers, webhook.TimeoutMs, webhook.RetryConfig, webhook.IsActive, webhook.IsVerified,
		webhook.VerificationToken, webhook.SuccessCount, webhook.FailureCount, webhook.TotalCount,
		webhook.BatchSize, webhook.RateLimit, webhook.Priority, webhook.Tags, webhook.Metadata, webhook.CreatedBy,
	).Scan(&webhook.ID, &webhook.CreatedAt, &webhook.UpdatedAt)
}

func (r *WebhookRepository) GetByID(id string) (*models.Webhook, error) {
	query := `
		SELECT 
			_id, tenant_id, name, description, url, method,
			event_types, event_filter, secret_key, auth_type, auth_config,
			headers, timeout_ms, retry_config, is_active, is_verified,
			verification_token, verified_at, last_triggered_at, last_success_at,
			last_failure_at, success_count, failure_count, total_count, avg_response_time_ms,
			batch_size, rate_limit, priority, tags, metadata,
			created_at, updated_at, created_by, updated_by
		FROM webhooks
		WHERE _id = $1
	`

	webhook := &models.Webhook{}
	err := r.db.QueryRow(query, id).Scan(
		&webhook.ID, &webhook.TenantID, &webhook.Name, &webhook.Description, &webhook.URL, &webhook.Method,
		&webhook.EventTypes, &webhook.EventFilter, &webhook.SecretKey, &webhook.AuthType, &webhook.AuthConfig,
		&webhook.Headers, &webhook.TimeoutMs, &webhook.RetryConfig, &webhook.IsActive, &webhook.IsVerified,
		&webhook.VerificationToken, &webhook.VerifiedAt, &webhook.LastTriggeredAt, &webhook.LastSuccessAt,
		&webhook.LastFailureAt, &webhook.SuccessCount, &webhook.FailureCount, &webhook.TotalCount, &webhook.AvgResponseTimeMs,
		&webhook.BatchSize, &webhook.RateLimit, &webhook.Priority, &webhook.Tags, &webhook.Metadata,
		&webhook.CreatedAt, &webhook.UpdatedAt, &webhook.CreatedBy, &webhook.UpdatedBy,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("webhook not found")
	}

	return webhook, err
}

func (r *WebhookRepository) List(tenantID *string, isActive *bool, page, pageSize int) ([]models.Webhook, int, error) {
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

	if isActive != nil {
		argCount++
		conditions = append(conditions, fmt.Sprintf("is_active = $%d", argCount))
		args = append(args, *isActive)
	}

	whereClause := ""
	if len(conditions) > 0 {
		whereClause = "WHERE " + strings.Join(conditions, " AND ")
	}

	// Count total
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM webhooks %s", whereClause)
	var total int
	err := r.db.QueryRow(countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	// Get paginated results
	offset := (page - 1) * pageSize
	query := fmt.Sprintf(`
		SELECT 
			_id, tenant_id, name, description, url, method,
			event_types, event_filter, secret_key, auth_type, auth_config,
			headers, timeout_ms, retry_config, is_active, is_verified,
			verification_token, verified_at, last_triggered_at, last_success_at,
			last_failure_at, success_count, failure_count, total_count, avg_response_time_ms,
			batch_size, rate_limit, priority, tags, metadata,
			created_at, updated_at, created_by, updated_by
		FROM webhooks
		%s
		ORDER BY priority DESC, created_at DESC
		LIMIT $%d OFFSET $%d
	`, whereClause, argCount+1, argCount+2)

	args = append(args, pageSize, offset)
	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var webhooks []models.Webhook
	for rows.Next() {
		var webhook models.Webhook
		err := rows.Scan(
			&webhook.ID, &webhook.TenantID, &webhook.Name, &webhook.Description, &webhook.URL, &webhook.Method,
			&webhook.EventTypes, &webhook.EventFilter, &webhook.SecretKey, &webhook.AuthType, &webhook.AuthConfig,
			&webhook.Headers, &webhook.TimeoutMs, &webhook.RetryConfig, &webhook.IsActive, &webhook.IsVerified,
			&webhook.VerificationToken, &webhook.VerifiedAt, &webhook.LastTriggeredAt, &webhook.LastSuccessAt,
			&webhook.LastFailureAt, &webhook.SuccessCount, &webhook.FailureCount, &webhook.TotalCount, &webhook.AvgResponseTimeMs,
			&webhook.BatchSize, &webhook.RateLimit, &webhook.Priority, &webhook.Tags, &webhook.Metadata,
			&webhook.CreatedAt, &webhook.UpdatedAt, &webhook.CreatedBy, &webhook.UpdatedBy,
		)
		if err != nil {
			return nil, 0, err
		}
		webhooks = append(webhooks, webhook)
	}

	return webhooks, total, nil
}

func (r *WebhookRepository) Update(id string, req *models.UpdateWebhookRequest) error {
	var updates []string
	var args []interface{}
	argCount := 0

	if req.Name != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("name = $%d", argCount))
		args = append(args, *req.Name)
	}

	if req.Description != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("description = $%d", argCount))
		args = append(args, *req.Description)
	}

	if req.URL != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("url = $%d", argCount))
		args = append(args, *req.URL)
	}

	if req.Method != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("method = $%d", argCount))
		args = append(args, *req.Method)
	}

	if req.EventTypes != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("event_types = $%d", argCount))
		args = append(args, models.StringArray(req.EventTypes))
	}

	if req.EventFilter != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("event_filter = $%d", argCount))
		args = append(args, req.EventFilter)
	}

	if req.AuthType != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("auth_type = $%d", argCount))
		args = append(args, *req.AuthType)
	}

	if req.AuthConfig != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("auth_config = $%d", argCount))
		args = append(args, req.AuthConfig)
	}

	if req.Headers != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("headers = $%d", argCount))
		args = append(args, req.Headers)
	}

	if req.TimeoutMs != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("timeout_ms = $%d", argCount))
		args = append(args, *req.TimeoutMs)
	}

	if req.RetryConfig != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("retry_config = $%d", argCount))
		args = append(args, req.RetryConfig)
	}

	if req.IsActive != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("is_active = $%d", argCount))
		args = append(args, *req.IsActive)
	}

	if req.BatchSize != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("batch_size = $%d", argCount))
		args = append(args, *req.BatchSize)
	}

	if req.RateLimit != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("rate_limit = $%d", argCount))
		args = append(args, *req.RateLimit)
	}

	if req.Priority != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("priority = $%d", argCount))
		args = append(args, *req.Priority)
	}

	if req.Tags != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("tags = $%d", argCount))
		args = append(args, models.StringArray(req.Tags))
	}

	if req.Metadata != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("metadata = $%d", argCount))
		args = append(args, req.Metadata)
	}

	if req.UpdatedBy != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("updated_by = $%d", argCount))
		args = append(args, *req.UpdatedBy)
	}

	if len(updates) == 0 {
		return fmt.Errorf("no fields to update")
	}

	updates = append(updates, "updated_at = NOW()")

	argCount++
	args = append(args, id)

	query := fmt.Sprintf(`
		UPDATE webhooks
		SET %s
		WHERE _id = $%d
	`, strings.Join(updates, ", "), argCount)

	result, err := r.db.Exec(query, args...)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return fmt.Errorf("webhook not found")
	}

	return nil
}

func (r *WebhookRepository) Delete(id string) error {
	query := `DELETE FROM webhooks WHERE _id = $1`
	result, err := r.db.Exec(query, id)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return fmt.Errorf("webhook not found")
	}

	return nil
}

func (r *WebhookRepository) ListByTenantID(tenantID string) ([]models.Webhook, error) {
	query := `
		SELECT 
			_id, tenant_id, name, description, url, method,
			event_types, event_filter, secret_key, auth_type, auth_config,
			headers, timeout_ms, retry_config, is_active, is_verified,
			verification_token, verified_at, last_triggered_at, last_success_at,
			last_failure_at, success_count, failure_count, total_count, avg_response_time_ms,
			batch_size, rate_limit, priority, tags, metadata,
			created_at, updated_at, created_by, updated_by
		FROM webhooks
		WHERE tenant_id = $1
		ORDER BY priority DESC, created_at DESC
	`

	rows, err := r.db.Query(query, tenantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var webhooks []models.Webhook
	for rows.Next() {
		var webhook models.Webhook
		err := rows.Scan(
			&webhook.ID, &webhook.TenantID, &webhook.Name, &webhook.Description, &webhook.URL, &webhook.Method,
			&webhook.EventTypes, &webhook.EventFilter, &webhook.SecretKey, &webhook.AuthType, &webhook.AuthConfig,
			&webhook.Headers, &webhook.TimeoutMs, &webhook.RetryConfig, &webhook.IsActive, &webhook.IsVerified,
			&webhook.VerificationToken, &webhook.VerifiedAt, &webhook.LastTriggeredAt, &webhook.LastSuccessAt,
			&webhook.LastFailureAt, &webhook.SuccessCount, &webhook.FailureCount, &webhook.TotalCount, &webhook.AvgResponseTimeMs,
			&webhook.BatchSize, &webhook.RateLimit, &webhook.Priority, &webhook.Tags, &webhook.Metadata,
			&webhook.CreatedAt, &webhook.UpdatedAt, &webhook.CreatedBy, &webhook.UpdatedBy,
		)
		if err != nil {
			return nil, err
		}
		webhooks = append(webhooks, webhook)
	}

	return webhooks, nil
}

func (r *WebhookRepository) UpdateStats(id string, isSuccess bool, responseTimeMs int) error {
	query := `
		UPDATE webhooks
		SET 
			success_count = CASE WHEN $2 THEN success_count + 1 ELSE success_count END,
			failure_count = CASE WHEN $2 THEN failure_count ELSE failure_count + 1 END,
			total_count = total_count + 1,
			last_triggered_at = NOW(),
			last_success_at = CASE WHEN $2 THEN NOW() ELSE last_success_at END,
			last_failure_at = CASE WHEN $2 THEN last_failure_at ELSE NOW() END,
			avg_response_time_ms = CASE 
				WHEN avg_response_time_ms IS NULL THEN $3
				ELSE (avg_response_time_ms * total_count + $3) / (total_count + 1)
			END,
			updated_at = NOW()
		WHERE _id = $1
	`

	_, err := r.db.Exec(query, id, isSuccess, responseTimeMs)
	return err
}

func (r *WebhookRepository) VerifyWebhook(id string) error {
	query := `
		UPDATE webhooks
		SET is_verified = true, verified_at = NOW(), updated_at = NOW()
		WHERE _id = $1
	`

	_, err := r.db.Exec(query, id)
	return err
}
