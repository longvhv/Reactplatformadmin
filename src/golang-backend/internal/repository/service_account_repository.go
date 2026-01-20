package repository

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"

	"golang-backend/internal/models"
)

// ServiceAccountRepository defines the interface for service account data access
type ServiceAccountRepository interface {
	Create(ctx context.Context, account *models.ServiceAccount) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.ServiceAccount, error)
	GetByClientID(ctx context.Context, clientID string) (*models.ServiceAccount, error)
	List(ctx context.Context, page, pageSize int, tenantID *uuid.UUID, isActive *bool) ([]*models.ServiceAccount, int, error)
	Update(ctx context.Context, account *models.ServiceAccount) error
	Delete(ctx context.Context, id uuid.UUID) error
	ListByTenantID(ctx context.Context, tenantID uuid.UUID, page, pageSize int) ([]*models.ServiceAccount, int, error)
	ListByMemberID(ctx context.Context, memberID uuid.UUID) ([]*models.ServiceAccount, error)
	UpdateStatus(ctx context.Context, id uuid.UUID, isActive bool) error
	ValidateCredentials(ctx context.Context, clientID, clientSecretHash string) (*models.ServiceAccount, error)
}

type serviceAccountRepository struct {
	db *sqlx.DB
}

// NewServiceAccountRepository creates a new service account repository
func NewServiceAccountRepository(db *sqlx.DB) ServiceAccountRepository {
	return &serviceAccountRepository{db: db}
}

// Create creates a new service account
func (r *serviceAccountRepository) Create(ctx context.Context, account *models.ServiceAccount) error {
	query := `
		INSERT INTO service_accounts (
			_id, tenant_id, member_id, name, description,
			client_id, client_secret_hash, is_active,
			created_at, updated_at, version
		) VALUES (
			:_id, :tenant_id, :member_id, :name, :description,
			:client_id, :client_secret_hash, :is_active,
			:created_at, :updated_at, :version
		)`

	_, err := r.db.NamedExecContext(ctx, query, account)
	return err
}

// GetByID gets a service account by ID
func (r *serviceAccountRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.ServiceAccount, error) {
	var account models.ServiceAccount
	query := `SELECT * FROM service_accounts WHERE _id = $1`

	err := r.db.GetContext(ctx, &account, query, id)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("service account not found")
	}
	return &account, err
}

// GetByClientID gets a service account by client ID
func (r *serviceAccountRepository) GetByClientID(ctx context.Context, clientID string) (*models.ServiceAccount, error) {
	var account models.ServiceAccount
	query := `SELECT * FROM service_accounts WHERE client_id = $1`

	err := r.db.GetContext(ctx, &account, query, clientID)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("service account not found")
	}
	return &account, err
}

// List lists service accounts with pagination and filters
func (r *serviceAccountRepository) List(ctx context.Context, page, pageSize int, tenantID *uuid.UUID, isActive *bool) ([]*models.ServiceAccount, int, error) {
	var accounts []*models.ServiceAccount
	var total int

	offset := (page - 1) * pageSize

	// Build WHERE clause
	whereClause := "WHERE 1=1"
	args := []interface{}{}
	argPos := 1

	if tenantID != nil {
		whereClause += fmt.Sprintf(" AND tenant_id = $%d", argPos)
		args = append(args, *tenantID)
		argPos++
	}

	if isActive != nil {
		whereClause += fmt.Sprintf(" AND is_active = $%d", argPos)
		args = append(args, *isActive)
		argPos++
	}

	// Count total
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM service_accounts %s", whereClause)
	err := r.db.GetContext(ctx, &total, countQuery, args...)
	if err != nil {
		return nil, 0, err
	}

	// Get accounts
	query := fmt.Sprintf(`
		SELECT * FROM service_accounts %s
		ORDER BY created_at DESC
		LIMIT $%d OFFSET $%d
	`, whereClause, argPos, argPos+1)

	args = append(args, pageSize, offset)
	err = r.db.SelectContext(ctx, &accounts, query, args...)
	if err != nil {
		return nil, 0, err
	}

	return accounts, total, nil
}

// Update updates a service account
func (r *serviceAccountRepository) Update(ctx context.Context, account *models.ServiceAccount) error {
	query := `
		UPDATE service_accounts SET
			name = :name,
			description = :description,
			is_active = :is_active,
			updated_at = :updated_at,
			version = version + 1
		WHERE _id = :_id AND version = :version`

	result, err := r.db.NamedExecContext(ctx, query, account)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return fmt.Errorf("service account not found or version mismatch")
	}

	return nil
}

// Delete deletes a service account
func (r *serviceAccountRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM service_accounts WHERE _id = $1`

	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return fmt.Errorf("service account not found")
	}

	return nil
}

// ListByTenantID lists service accounts for a specific tenant
func (r *serviceAccountRepository) ListByTenantID(ctx context.Context, tenantID uuid.UUID, page, pageSize int) ([]*models.ServiceAccount, int, error) {
	var accounts []*models.ServiceAccount
	var total int

	offset := (page - 1) * pageSize

	// Count total
	countQuery := `SELECT COUNT(*) FROM service_accounts WHERE tenant_id = $1`
	err := r.db.GetContext(ctx, &total, countQuery, tenantID)
	if err != nil {
		return nil, 0, err
	}

	// Get accounts
	query := `
		SELECT * FROM service_accounts
		WHERE tenant_id = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3`

	err = r.db.SelectContext(ctx, &accounts, query, tenantID, pageSize, offset)
	if err != nil {
		return nil, 0, err
	}

	return accounts, total, nil
}

// ListByMemberID lists service accounts for a specific member
func (r *serviceAccountRepository) ListByMemberID(ctx context.Context, memberID uuid.UUID) ([]*models.ServiceAccount, error) {
	var accounts []*models.ServiceAccount
	query := `
		SELECT * FROM service_accounts
		WHERE member_id = $1
		ORDER BY created_at DESC`

	err := r.db.SelectContext(ctx, &accounts, query, memberID)
	return accounts, err
}

// UpdateStatus updates the active status of a service account
func (r *serviceAccountRepository) UpdateStatus(ctx context.Context, id uuid.UUID, isActive bool) error {
	query := `
		UPDATE service_accounts
		SET is_active = $1, updated_at = NOW(), version = version + 1
		WHERE _id = $2`

	result, err := r.db.ExecContext(ctx, query, isActive, id)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return fmt.Errorf("service account not found")
	}

	return nil
}

// ValidateCredentials validates client credentials
func (r *serviceAccountRepository) ValidateCredentials(ctx context.Context, clientID, clientSecretHash string) (*models.ServiceAccount, error) {
	var account models.ServiceAccount
	query := `
		SELECT * FROM service_accounts
		WHERE client_id = $1 AND client_secret_hash = $2 AND is_active = true`

	err := r.db.GetContext(ctx, &account, query, clientID, clientSecretHash)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("invalid credentials or account inactive")
	}
	return &account, err
}
