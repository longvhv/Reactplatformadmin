package repository

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"

	"golang-backend/internal/models"
)

type TenantSSOConfigRepository interface {
	Create(ctx context.Context, config *models.TenantSSOConfig) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.TenantSSOConfig, error)
	List(ctx context.Context, page, pageSize int, tenantID *uuid.UUID, provider, status *string) ([]*models.TenantSSOConfig, int, error)
	Update(ctx context.Context, config *models.TenantSSOConfig) error
	Delete(ctx context.Context, id uuid.UUID) error
	ListByTenantID(ctx context.Context, tenantID uuid.UUID) ([]*models.TenantSSOConfig, error)
	GetByTenantAndProvider(ctx context.Context, tenantID uuid.UUID, provider string) (*models.TenantSSOConfig, error)
	UpdateStatus(ctx context.Context, id uuid.UUID, status string) error
}

type tenantSSOConfigRepository struct {
	db *sqlx.DB
}

func NewTenantSSOConfigRepository(db *sqlx.DB) TenantSSOConfigRepository {
	return &tenantSSOConfigRepository{db: db}
}

func (r *tenantSSOConfigRepository) Create(ctx context.Context, config *models.TenantSSOConfig) error {
	query := `
		INSERT INTO tenant_sso_configs (
			_id, tenant_id, provider, name, description, status,
			entity_id, sso_url, slo_url, certificate, metadata_url,
			client_id, client_secret, authorization_endpoint, token_endpoint,
			userinfo_endpoint, jwks_uri, scopes, attribute_mapping, settings,
			created_at, updated_at, created_by, version
		) VALUES (
			:_id, :tenant_id, :provider, :name, :description, :status,
			:entity_id, :sso_url, :slo_url, :certificate, :metadata_url,
			:client_id, :client_secret, :authorization_endpoint, :token_endpoint,
			:userinfo_endpoint, :jwks_uri, :scopes, :attribute_mapping, :settings,
			:created_at, :updated_at, :created_by, :version
		)`

	_, err := r.db.NamedExecContext(ctx, query, config)
	return err
}

func (r *tenantSSOConfigRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.TenantSSOConfig, error) {
	var config models.TenantSSOConfig
	query := `SELECT * FROM tenant_sso_configs WHERE _id = $1 AND deleted_at IS NULL`

	err := r.db.GetContext(ctx, &config, query, id)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("SSO config not found")
	}
	return &config, err
}

func (r *tenantSSOConfigRepository) List(ctx context.Context, page, pageSize int, tenantID *uuid.UUID, provider, status *string) ([]*models.TenantSSOConfig, int, error) {
	var configs []*models.TenantSSOConfig
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

	if provider != nil {
		whereClause += fmt.Sprintf(" AND provider = $%d", argPos)
		args = append(args, *provider)
		argPos++
	}

	if status != nil {
		whereClause += fmt.Sprintf(" AND status = $%d", argPos)
		args = append(args, *status)
		argPos++
	}

	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM tenant_sso_configs %s", whereClause)
	err := r.db.GetContext(ctx, &total, countQuery, args...)
	if err != nil {
		return nil, 0, err
	}

	query := fmt.Sprintf(`
		SELECT * FROM tenant_sso_configs %s
		ORDER BY created_at DESC
		LIMIT $%d OFFSET $%d
	`, whereClause, argPos, argPos+1)

	args = append(args, pageSize, offset)
	err = r.db.SelectContext(ctx, &configs, query, args...)
	if err != nil {
		return nil, 0, err
	}

	return configs, total, nil
}

func (r *tenantSSOConfigRepository) Update(ctx context.Context, config *models.TenantSSOConfig) error {
	query := `
		UPDATE tenant_sso_configs SET
			name = :name,
			description = :description,
			status = :status,
			entity_id = :entity_id,
			sso_url = :sso_url,
			slo_url = :slo_url,
			certificate = :certificate,
			metadata_url = :metadata_url,
			client_id = :client_id,
			client_secret = :client_secret,
			authorization_endpoint = :authorization_endpoint,
			token_endpoint = :token_endpoint,
			userinfo_endpoint = :userinfo_endpoint,
			jwks_uri = :jwks_uri,
			scopes = :scopes,
			attribute_mapping = :attribute_mapping,
			settings = :settings,
			updated_at = :updated_at,
			updated_by = :updated_by,
			version = version + 1
		WHERE _id = :_id AND version = :version AND deleted_at IS NULL`

	result, err := r.db.NamedExecContext(ctx, query, config)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return fmt.Errorf("SSO config not found or version mismatch")
	}

	return nil
}

func (r *tenantSSOConfigRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `UPDATE tenant_sso_configs SET deleted_at = NOW() WHERE _id = $1 AND deleted_at IS NULL`

	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return fmt.Errorf("SSO config not found")
	}

	return nil
}

func (r *tenantSSOConfigRepository) ListByTenantID(ctx context.Context, tenantID uuid.UUID) ([]*models.TenantSSOConfig, error) {
	var configs []*models.TenantSSOConfig
	query := `
		SELECT * FROM tenant_sso_configs
		WHERE tenant_id = $1 AND deleted_at IS NULL
		ORDER BY created_at DESC`

	err := r.db.SelectContext(ctx, &configs, query, tenantID)
	return configs, err
}

func (r *tenantSSOConfigRepository) GetByTenantAndProvider(ctx context.Context, tenantID uuid.UUID, provider string) (*models.TenantSSOConfig, error) {
	var config models.TenantSSOConfig
	query := `
		SELECT * FROM tenant_sso_configs
		WHERE tenant_id = $1 AND provider = $2 AND deleted_at IS NULL
		ORDER BY created_at DESC
		LIMIT 1`

	err := r.db.GetContext(ctx, &config, query, tenantID, provider)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("SSO config not found")
	}
	return &config, err
}

func (r *tenantSSOConfigRepository) UpdateStatus(ctx context.Context, id uuid.UUID, status string) error {
	query := `
		UPDATE tenant_sso_configs
		SET status = $1, updated_at = NOW(), version = version + 1
		WHERE _id = $2 AND deleted_at IS NULL`

	result, err := r.db.ExecContext(ctx, query, status, id)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return fmt.Errorf("SSO config not found")
	}

	return nil
}
