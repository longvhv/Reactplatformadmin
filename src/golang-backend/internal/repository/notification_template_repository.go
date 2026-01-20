package repository

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"

	"golang-backend/internal/models"
)

type NotificationTemplateRepository interface {
	Create(ctx context.Context, template *models.NotificationTemplate) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.NotificationTemplate, error)
	GetByCode(ctx context.Context, code string) (*models.NotificationTemplate, error)
	List(ctx context.Context, page, pageSize int, tenantID *uuid.UUID, notificationType, status, category *string) ([]*models.NotificationTemplate, int, error)
	Update(ctx context.Context, template *models.NotificationTemplate) error
	Delete(ctx context.Context, id uuid.UUID) error
	SoftDelete(ctx context.Context, id uuid.UUID, deletedBy string) error
	ListByTenantID(ctx context.Context, tenantID uuid.UUID) ([]*models.NotificationTemplate, error)
	ListByType(ctx context.Context, notificationType string) ([]*models.NotificationTemplate, error)
	ListByCategory(ctx context.Context, category string) ([]*models.NotificationTemplate, error)
	ListActive(ctx context.Context, tenantID uuid.UUID) ([]*models.NotificationTemplate, error)
	IncrementUsageCount(ctx context.Context, id uuid.UUID) error
	IncrementSuccessCount(ctx context.Context, id uuid.UUID) error
	IncrementFailureCount(ctx context.Context, id uuid.UUID) error
	UpdateStats(ctx context.Context, id uuid.UUID, success bool) error
}

type notificationTemplateRepository struct {
	db *sqlx.DB
}

func NewNotificationTemplateRepository(db *sqlx.DB) NotificationTemplateRepository {
	return &notificationTemplateRepository{db: db}
}

func (r *notificationTemplateRepository) Create(ctx context.Context, template *models.NotificationTemplate) error {
	query := `
		INSERT INTO notification_templates (
			_id, tenant_id, template_code, template_name, description, subject,
			body_text, body_html, notification_type, category, priority,
			language_code, variables, sample_data, delivery_channels,
			send_immediately, scheduled_send_time, status, is_system_template,
			is_editable, usage_count, success_count, failure_count, version,
			parent_template_id, attachments, headers, metadata, tags,
			created_at, created_by, updated_at, updated_by
		) VALUES (
			:_id, :tenant_id, :template_code, :template_name, :description, :subject,
			:body_text, :body_html, :notification_type, :category, :priority,
			:language_code, :variables, :sample_data, :delivery_channels,
			:send_immediately, :scheduled_send_time, :status, :is_system_template,
			:is_editable, :usage_count, :success_count, :failure_count, :version,
			:parent_template_id, :attachments, :headers, :metadata, :tags,
			:created_at, :created_by, :updated_at, :updated_by
		)`

	_, err := r.db.NamedExecContext(ctx, query, template)
	return err
}

func (r *notificationTemplateRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.NotificationTemplate, error) {
	var template models.NotificationTemplate
	query := `SELECT * FROM notification_templates WHERE _id = $1 AND deleted_at IS NULL`

	err := r.db.GetContext(ctx, &template, query, id)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("notification template not found")
	}
	return &template, err
}

func (r *notificationTemplateRepository) GetByCode(ctx context.Context, code string) (*models.NotificationTemplate, error) {
	var template models.NotificationTemplate
	query := `SELECT * FROM notification_templates WHERE template_code = $1 AND deleted_at IS NULL`

	err := r.db.GetContext(ctx, &template, query, code)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("notification template not found")
	}
	return &template, err
}

func (r *notificationTemplateRepository) List(ctx context.Context, page, pageSize int, tenantID *uuid.UUID, notificationType, status, category *string) ([]*models.NotificationTemplate, int, error) {
	var templates []*models.NotificationTemplate
	var total int

	offset := (page - 1) * pageSize

	whereClause := "WHERE deleted_at IS NULL"
	args := []interface{}{}
	argPos := 1

	if tenantID != nil {
		whereClause += fmt.Sprintf(" AND tenant_id = $%d", argPos)
		args = append(args, *tenantID)
		argPos++
	}

	if notificationType != nil {
		whereClause += fmt.Sprintf(" AND notification_type = $%d", argPos)
		args = append(args, *notificationType)
		argPos++
	}

	if status != nil {
		whereClause += fmt.Sprintf(" AND status = $%d", argPos)
		args = append(args, *status)
		argPos++
	}

	if category != nil {
		whereClause += fmt.Sprintf(" AND category = $%d", argPos)
		args = append(args, *category)
		argPos++
	}

	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM notification_templates %s", whereClause)
	err := r.db.GetContext(ctx, &total, countQuery, args...)
	if err != nil {
		return nil, 0, err
	}

	query := fmt.Sprintf(`
		SELECT * FROM notification_templates %s
		ORDER BY created_at DESC
		LIMIT $%d OFFSET $%d
	`, whereClause, argPos, argPos+1)

	args = append(args, pageSize, offset)
	err = r.db.SelectContext(ctx, &templates, query, args...)
	if err != nil {
		return nil, 0, err
	}

	return templates, total, nil
}

func (r *notificationTemplateRepository) Update(ctx context.Context, template *models.NotificationTemplate) error {
	query := `
		UPDATE notification_templates SET
			template_name = :template_name,
			description = :description,
			subject = :subject,
			body_text = :body_text,
			body_html = :body_html,
			category = :category,
			priority = :priority,
			language_code = :language_code,
			variables = :variables,
			sample_data = :sample_data,
			delivery_channels = :delivery_channels,
			send_immediately = :send_immediately,
			scheduled_send_time = :scheduled_send_time,
			status = :status,
			attachments = :attachments,
			headers = :headers,
			metadata = :metadata,
			tags = :tags,
			updated_at = :updated_at,
			updated_by = :updated_by,
			version = version + 1
		WHERE _id = :_id AND deleted_at IS NULL`

	result, err := r.db.NamedExecContext(ctx, query, template)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return fmt.Errorf("notification template not found")
	}

	return nil
}

func (r *notificationTemplateRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM notification_templates WHERE _id = $1`

	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return fmt.Errorf("notification template not found")
	}

	return nil
}

func (r *notificationTemplateRepository) SoftDelete(ctx context.Context, id uuid.UUID, deletedBy string) error {
	query := `
		UPDATE notification_templates
		SET deleted_at = NOW(), deleted_by = $1, updated_at = NOW()
		WHERE _id = $2 AND deleted_at IS NULL`

	result, err := r.db.ExecContext(ctx, query, deletedBy, id)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return fmt.Errorf("notification template not found")
	}

	return nil
}

func (r *notificationTemplateRepository) ListByTenantID(ctx context.Context, tenantID uuid.UUID) ([]*models.NotificationTemplate, error) {
	var templates []*models.NotificationTemplate
	query := `
		SELECT * FROM notification_templates
		WHERE tenant_id = $1 AND deleted_at IS NULL
		ORDER BY created_at DESC`

	err := r.db.SelectContext(ctx, &templates, query, tenantID)
	return templates, err
}

func (r *notificationTemplateRepository) ListByType(ctx context.Context, notificationType string) ([]*models.NotificationTemplate, error) {
	var templates []*models.NotificationTemplate
	query := `
		SELECT * FROM notification_templates
		WHERE notification_type = $1 AND deleted_at IS NULL
		ORDER BY created_at DESC`

	err := r.db.SelectContext(ctx, &templates, query, notificationType)
	return templates, err
}

func (r *notificationTemplateRepository) ListByCategory(ctx context.Context, category string) ([]*models.NotificationTemplate, error) {
	var templates []*models.NotificationTemplate
	query := `
		SELECT * FROM notification_templates
		WHERE category = $1 AND deleted_at IS NULL
		ORDER BY created_at DESC`

	err := r.db.SelectContext(ctx, &templates, query, category)
	return templates, err
}

func (r *notificationTemplateRepository) ListActive(ctx context.Context, tenantID uuid.UUID) ([]*models.NotificationTemplate, error) {
	var templates []*models.NotificationTemplate
	query := `
		SELECT * FROM notification_templates
		WHERE tenant_id = $1
		  AND status = 'active'
		  AND deleted_at IS NULL
		ORDER BY created_at DESC`

	err := r.db.SelectContext(ctx, &templates, query, tenantID)
	return templates, err
}

func (r *notificationTemplateRepository) IncrementUsageCount(ctx context.Context, id uuid.UUID) error {
	query := `
		UPDATE notification_templates
		SET usage_count = usage_count + 1, last_used_at = NOW()
		WHERE _id = $1`

	_, err := r.db.ExecContext(ctx, query, id)
	return err
}

func (r *notificationTemplateRepository) IncrementSuccessCount(ctx context.Context, id uuid.UUID) error {
	query := `
		UPDATE notification_templates
		SET success_count = success_count + 1, last_used_at = NOW()
		WHERE _id = $1`

	_, err := r.db.ExecContext(ctx, query, id)
	return err
}

func (r *notificationTemplateRepository) IncrementFailureCount(ctx context.Context, id uuid.UUID) error {
	query := `
		UPDATE notification_templates
		SET failure_count = failure_count + 1
		WHERE _id = $1`

	_, err := r.db.ExecContext(ctx, query, id)
	return err
}

func (r *notificationTemplateRepository) UpdateStats(ctx context.Context, id uuid.UUID, success bool) error {
	if success {
		return r.IncrementSuccessCount(ctx, id)
	}
	return r.IncrementFailureCount(ctx, id)
}
