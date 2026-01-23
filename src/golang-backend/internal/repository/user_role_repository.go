package repository

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/yourusername/golang-backend/internal/models"
)

type UserRoleRepository interface {
	Create(ctx context.Context, userRole *models.UserRole) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.UserRole, error)
	ListByUserAndTenant(ctx context.Context, userID, tenantID uuid.UUID) ([]*models.UserRole, error)
	ListByUser(ctx context.Context, userID uuid.UUID) ([]*models.UserRole, error)
	Update(ctx context.Context, userRole *models.UserRole) error
	Delete(ctx context.Context, id uuid.UUID) error
	RevokeExpiredRoles(ctx context.Context) (int64, error)
}

type userRoleRepository struct {
	db *sqlx.DB
}

func NewUserRoleRepository(db *sqlx.DB) UserRoleRepository {
	return &userRoleRepository{db: db}
}

func (r *userRoleRepository) Create(ctx context.Context, userRole *models.UserRole) error {
	query := `
		INSERT INTO user_roles (
			user_id, role_id, tenant_id, scope, scope_id,
			granted_by, expires_at, is_active, metadata
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING _id, granted_at, created_at, updated_at
	`

	userRole.ID = uuid.New()
	userRole.GrantedAt = time.Now()
	userRole.CreatedAt = time.Now()
	userRole.UpdatedAt = time.Now()

	err := r.db.QueryRowContext(
		ctx,
		query,
		userRole.UserID, userRole.RoleID, userRole.TenantID,
		userRole.Scope, userRole.ScopeID, userRole.GrantedBy,
		userRole.ExpiresAt, userRole.IsActive, userRole.Metadata,
	).Scan(&userRole.ID, &userRole.GrantedAt, &userRole.CreatedAt, &userRole.UpdatedAt)

	if err != nil {
		return fmt.Errorf("failed to create user role: %w", err)
	}

	return nil
}

func (r *userRoleRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.UserRole, error) {
	query := `
		SELECT _id, user_id, role_id, tenant_id, scope, scope_id,
			granted_by, granted_at, expires_at, is_active, metadata,
			created_at, updated_at
		FROM user_roles
		WHERE _id = $1
	`

	userRole := &models.UserRole{}
	err := r.db.QueryRowContext(query, ctx, id).Scan(
		&userRole.ID, &userRole.UserID, &userRole.RoleID, &userRole.TenantID,
		&userRole.Scope, &userRole.ScopeID, &userRole.GrantedBy, &userRole.GrantedAt,
		&userRole.ExpiresAt, &userRole.IsActive, &userRole.Metadata,
		&userRole.CreatedAt, &userRole.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("user role not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get user role: %w", err)
	}

	return userRole, nil
}

func (r *userRoleRepository) ListByUserAndTenant(ctx context.Context, userID, tenantID uuid.UUID) ([]*models.UserRole, error) {
	conditions := []string{"user_id = $1", "tenant_id = $2", "is_active = true"}
	args := []interface{}{userID, tenantID}
	argIndex := 3

	// Also check for expired roles
	conditions = append(conditions, "(expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)")

	whereClause := strings.Join(conditions, " AND ")

	query := fmt.Sprintf(`
		SELECT _id, user_id, role_id, tenant_id, scope, scope_id,
			granted_by, granted_at, expires_at, is_active, metadata,
			created_at, updated_at
		FROM user_roles
		WHERE %s
		ORDER BY created_at DESC
	`, whereClause)

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to get user roles: %w", err)
	}
	defer rows.Close()

	userRoles := []*models.UserRole{}
	for rows.Next() {
		userRole := &models.UserRole{}
		err := rows.Scan(
			&userRole.ID, &userRole.UserID, &userRole.RoleID, &userRole.TenantID,
			&userRole.Scope, &userRole.ScopeID, &userRole.GrantedBy, &userRole.GrantedAt,
			&userRole.ExpiresAt, &userRole.IsActive, &userRole.Metadata,
			&userRole.CreatedAt, &userRole.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan user role: %w", err)
		}
		userRoles = append(userRoles, userRole)
	}

	return userRoles, nil
}

func (r *userRoleRepository) ListByUser(ctx context.Context, userID uuid.UUID) ([]*models.UserRole, error) {
	conditions := []string{"user_id = $1", "is_active = true"}
	args := []interface{}{userID}
	argIndex := 2

	// Also check for expired roles
	conditions = append(conditions, "(expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)")

	whereClause := strings.Join(conditions, " AND ")

	query := fmt.Sprintf(`
		SELECT _id, user_id, role_id, tenant_id, scope, scope_id,
			granted_by, granted_at, expires_at, is_active, metadata,
			created_at, updated_at
		FROM user_roles
		WHERE %s
		ORDER BY created_at DESC
	`, whereClause)

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to get user roles: %w", err)
	}
	defer rows.Close()

	userRoles := []*models.UserRole{}
	for rows.Next() {
		userRole := &models.UserRole{}
		err := rows.Scan(
			&userRole.ID, &userRole.UserID, &userRole.RoleID, &userRole.TenantID,
			&userRole.Scope, &userRole.ScopeID, &userRole.GrantedBy, &userRole.GrantedAt,
			&userRole.ExpiresAt, &userRole.IsActive, &userRole.Metadata,
			&userRole.CreatedAt, &userRole.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan user role: %w", err)
		}
		userRoles = append(userRoles, userRole)
	}

	return userRoles, nil
}

func (r *userRoleRepository) Update(ctx context.Context, userRole *models.UserRole) error {
	sets := []string{"updated_at = CURRENT_TIMESTAMP"}
	args := []interface{}{}
	argIndex := 1

	if userRole.Scope != nil {
		sets = append(sets, fmt.Sprintf("scope = $%d", argIndex))
		args = append(args, *userRole.Scope)
		argIndex++
	}
	if userRole.ScopeID != nil {
		sets = append(sets, fmt.Sprintf("scope_id = $%d", argIndex))
		args = append(args, *userRole.ScopeID)
		argIndex++
	}
	if userRole.ExpiresAt != nil {
		sets = append(sets, fmt.Sprintf("expires_at = $%d", argIndex))
		args = append(args, *userRole.ExpiresAt)
		argIndex++
	}
	if userRole.IsActive != nil {
		sets = append(sets, fmt.Sprintf("is_active = $%d", argIndex))
		args = append(args, *userRole.IsActive)
		argIndex++
	}
	if userRole.Metadata != nil {
		sets = append(sets, fmt.Sprintf("metadata = $%d", argIndex))
		args = append(args, userRole.Metadata)
		argIndex++
	}

	if len(sets) == 1 { // Only updated_at
		return nil
	}

	query := fmt.Sprintf(`
		UPDATE user_roles
		SET %s
		WHERE _id = $%d
	`, strings.Join(sets, ", "), argIndex)

	args = append(args, userRole.ID)
	_, err := r.db.ExecContext(ctx, query, args...)
	if err != nil {
		return fmt.Errorf("failed to update user role: %w", err)
	}

	return nil
}

func (r *userRoleRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM user_roles WHERE _id = $1`
	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete user role: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("user role not found")
	}

	return nil
}

func (r *userRoleRepository) RevokeExpiredRoles(ctx context.Context) (int64, error) {
	query := `
		UPDATE user_roles
		SET is_active = false, updated_at = CURRENT_TIMESTAMP
		WHERE expires_at IS NOT NULL 
		AND expires_at < CURRENT_TIMESTAMP 
		AND is_active = true
	`
	result, err := r.db.ExecContext(ctx, query)
	if err != nil {
		return 0, fmt.Errorf("failed to revoke expired roles: %w", err)
	}

	return result.RowsAffected()
}