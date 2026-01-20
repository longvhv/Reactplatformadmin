package repository

import (
	"database/sql"
	"fmt"
	"strings"
	"time"

	"github.com/yourusername/golang-backend/internal/models"
)

type UserRoleRepository struct {
	db *sql.DB
}

func NewUserRoleRepository(db *sql.DB) *UserRoleRepository {
	return &UserRoleRepository{db: db}
}

func (r *UserRoleRepository) Create(req *models.CreateUserRoleRequest) (*models.UserRole, error) {
	query := `
		INSERT INTO user_roles (
			user_id, role_id, tenant_id, scope, scope_id,
			granted_by, expires_at, is_active, metadata
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING _id, granted_at, created_at, updated_at
	`

	userRole := &models.UserRole{
		UserID:    req.UserID,
		RoleID:    req.RoleID,
		TenantID:  req.TenantID,
		Scope:     req.Scope,
		ScopeID:   req.ScopeID,
		GrantedBy: req.GrantedBy,
		ExpiresAt: req.ExpiresAt,
		IsActive:  req.IsActive,
		Metadata:  req.Metadata,
	}

	err := r.db.QueryRow(
		query,
		userRole.UserID, userRole.RoleID, userRole.TenantID,
		userRole.Scope, userRole.ScopeID, userRole.GrantedBy,
		userRole.ExpiresAt, userRole.IsActive, userRole.Metadata,
	).Scan(&userRole.ID, &userRole.GrantedAt, &userRole.CreatedAt, &userRole.UpdatedAt)

	if err != nil {
		return nil, fmt.Errorf("failed to create user role: %w", err)
	}

	return userRole, nil
}

func (r *UserRoleRepository) GetByID(id string) (*models.UserRole, error) {
	query := `
		SELECT _id, user_id, role_id, tenant_id, scope, scope_id,
			granted_by, granted_at, expires_at, is_active, metadata,
			created_at, updated_at
		FROM user_roles
		WHERE _id = $1
	`

	userRole := &models.UserRole{}
	err := r.db.QueryRow(query, id).Scan(
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

func (r *UserRoleRepository) GetByUserID(userID string, tenantID *string) ([]*models.UserRole, error) {
	conditions := []string{"user_id = $1", "is_active = true"}
	args := []interface{}{userID}
	argIndex := 2

	if tenantID != nil {
		conditions = append(conditions, fmt.Sprintf("tenant_id = $%d", argIndex))
		args = append(args, *tenantID)
		argIndex++
	}

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

	rows, err := r.db.Query(query, args...)
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

func (r *UserRoleRepository) List(userID *string, roleID *string, tenantID *string, limit, offset int) ([]*models.UserRole, int, error) {
	conditions := []string{}
	args := []interface{}{}
	argIndex := 1

	if userID != nil {
		conditions = append(conditions, fmt.Sprintf("user_id = $%d", argIndex))
		args = append(args, *userID)
		argIndex++
	}

	if roleID != nil {
		conditions = append(conditions, fmt.Sprintf("role_id = $%d", argIndex))
		args = append(args, *roleID)
		argIndex++
	}

	if tenantID != nil {
		conditions = append(conditions, fmt.Sprintf("tenant_id = $%d", argIndex))
		args = append(args, *tenantID)
		argIndex++
	}

	whereClause := "1=1"
	if len(conditions) > 0 {
		whereClause = strings.Join(conditions, " AND ")
	}

	// Count total
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM user_roles WHERE %s", whereClause)
	var total int
	err := r.db.QueryRow(countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count user roles: %w", err)
	}

	// Get user roles
	query := fmt.Sprintf(`
		SELECT _id, user_id, role_id, tenant_id, scope, scope_id,
			granted_by, granted_at, expires_at, is_active, metadata,
			created_at, updated_at
		FROM user_roles
		WHERE %s
		ORDER BY created_at DESC
		LIMIT $%d OFFSET $%d
	`, whereClause, argIndex, argIndex+1)

	args = append(args, limit, offset)
	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to list user roles: %w", err)
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
			return nil, 0, fmt.Errorf("failed to scan user role: %w", err)
		}
		userRoles = append(userRoles, userRole)
	}

	return userRoles, total, nil
}

func (r *UserRoleRepository) Update(id string, req *models.UpdateUserRoleRequest) (*models.UserRole, error) {
	sets := []string{"updated_at = CURRENT_TIMESTAMP"}
	args := []interface{}{}
	argIndex := 1

	if req.Scope != nil {
		sets = append(sets, fmt.Sprintf("scope = $%d", argIndex))
		args = append(args, *req.Scope)
		argIndex++
	}
	if req.ScopeID != nil {
		sets = append(sets, fmt.Sprintf("scope_id = $%d", argIndex))
		args = append(args, *req.ScopeID)
		argIndex++
	}
	if req.ExpiresAt != nil {
		sets = append(sets, fmt.Sprintf("expires_at = $%d", argIndex))
		args = append(args, *req.ExpiresAt)
		argIndex++
	}
	if req.IsActive != nil {
		sets = append(sets, fmt.Sprintf("is_active = $%d", argIndex))
		args = append(args, *req.IsActive)
		argIndex++
	}
	if req.Metadata != nil {
		sets = append(sets, fmt.Sprintf("metadata = $%d", argIndex))
		args = append(args, req.Metadata)
		argIndex++
	}

	if len(sets) == 1 { // Only updated_at
		return r.GetByID(id)
	}

	query := fmt.Sprintf(`
		UPDATE user_roles
		SET %s
		WHERE _id = $%d
	`, strings.Join(sets, ", "), argIndex)

	args = append(args, id)
	_, err := r.db.Exec(query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to update user role: %w", err)
	}

	return r.GetByID(id)
}

func (r *UserRoleRepository) Delete(id string) error {
	query := `DELETE FROM user_roles WHERE _id = $1`
	result, err := r.db.Exec(query, id)
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

func (r *UserRoleRepository) RevokeExpiredRoles() (int64, error) {
	query := `
		UPDATE user_roles
		SET is_active = false, updated_at = CURRENT_TIMESTAMP
		WHERE expires_at IS NOT NULL 
		AND expires_at < CURRENT_TIMESTAMP 
		AND is_active = true
	`
	result, err := r.db.Exec(query)
	if err != nil {
		return 0, fmt.Errorf("failed to revoke expired roles: %w", err)
	}

	return result.RowsAffected()
}
