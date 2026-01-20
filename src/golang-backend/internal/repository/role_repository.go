package repository

import (
	"context"
	"database/sql"
	"fmt"
	"strings"

	"github.com/lib/pq"
	"github.com/vhv-platform/backend/internal/models"
)

// RoleRepository handles database operations for roles
type RoleRepository struct {
	db *sql.DB
}

// NewRoleRepository creates a new role repository
func NewRoleRepository(db *sql.DB) *RoleRepository {
	return &RoleRepository{db: db}
}

// GetAll retrieves all roles with optional filters
func (r *RoleRepository) GetAll(ctx context.Context, filters models.RoleFilters) ([]models.Role, error) {
	query := `
		SELECT _id, tenant_id, name, description, type, permission_codes,
		       created_at, updated_at, version
		FROM roles
		WHERE deleted_at IS NULL
	`

	var args []interface{}
	argIndex := 1

	// Apply filters
	if filters.TenantID != nil {
		query += fmt.Sprintf(" AND tenant_id = $%d", argIndex)
		args = append(args, *filters.TenantID)
		argIndex++
	}

	if filters.Type != nil {
		query += fmt.Sprintf(" AND type = $%d", argIndex)
		args = append(args, *filters.Type)
		argIndex++
	}

	if filters.Search != nil && *filters.Search != "" {
		query += fmt.Sprintf(" AND (name ILIKE $%d OR description ILIKE $%d)", argIndex, argIndex)
		searchTerm := "%" + *filters.Search + "%"
		args = append(args, searchTerm)
		argIndex++
	}

	query += " ORDER BY created_at DESC"

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query roles: %w", err)
	}
	defer rows.Close()

	var roles []models.Role
	for rows.Next() {
		var role models.Role
		err := rows.Scan(
			&role.ID,
			&role.TenantID,
			&role.Name,
			&role.Description,
			&role.Type,
			pq.Array(&role.PermissionCodes),
			&role.CreatedAt,
			&role.UpdatedAt,
			&role.Version,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan role: %w", err)
		}
		roles = append(roles, role)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating roles: %w", err)
	}

	return roles, nil
}

// GetByID retrieves a role by ID
func (r *RoleRepository) GetByID(ctx context.Context, id string) (*models.Role, error) {
	query := `
		SELECT _id, tenant_id, name, description, type, permission_codes,
		       created_at, updated_at, version
		FROM roles
		WHERE _id = $1 AND deleted_at IS NULL
	`

	var role models.Role
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&role.ID,
		&role.TenantID,
		&role.Name,
		&role.Description,
		&role.Type,
		pq.Array(&role.PermissionCodes),
		&role.CreatedAt,
		&role.UpdatedAt,
		&role.Version,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("role not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get role: %w", err)
	}

	return &role, nil
}

// Create creates a new role
func (r *RoleRepository) Create(ctx context.Context, req models.CreateRoleRequest) (*models.Role, error) {
	query := `
		INSERT INTO roles (tenant_id, name, description, type, permission_codes)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING _id, created_at, updated_at, version
	`

	roleType := models.RoleTypeCustom
	if req.Type != "" {
		roleType = req.Type
	}

	permissionCodes := req.PermissionCodes
	if permissionCodes == nil {
		permissionCodes = []string{}
	}

	var role models.Role
	role.TenantID = req.TenantID
	role.Name = req.Name
	role.Description = req.Description
	role.Type = roleType
	role.PermissionCodes = permissionCodes

	err := r.db.QueryRowContext(
		ctx, query,
		req.TenantID,
		req.Name,
		req.Description,
		roleType,
		pq.Array(permissionCodes),
	).Scan(&role.ID, &role.CreatedAt, &role.UpdatedAt, &role.Version)

	if err != nil {
		return nil, fmt.Errorf("failed to create role: %w", err)
	}

	return &role, nil
}

// Update updates a role
func (r *RoleRepository) Update(ctx context.Context, id string, req models.UpdateRoleRequest) (*models.Role, error) {
	// Build dynamic update query
	sets := []string{}
	args := []interface{}{}
	argIndex := 1

	if req.Name != nil {
		sets = append(sets, fmt.Sprintf("name = $%d", argIndex))
		args = append(args, *req.Name)
		argIndex++
	}

	if req.Description != nil {
		sets = append(sets, fmt.Sprintf("description = $%d", argIndex))
		args = append(args, *req.Description)
		argIndex++
	}

	if req.PermissionCodes != nil {
		sets = append(sets, fmt.Sprintf("permission_codes = $%d", argIndex))
		args = append(args, pq.Array(req.PermissionCodes))
		argIndex++
	}

	if len(sets) == 0 {
		return nil, fmt.Errorf("no fields to update")
	}

	// Always update timestamp and version
	sets = append(sets, "updated_at = NOW()", "version = version + 1")

	// Add ID to args
	args = append(args, id)

	query := fmt.Sprintf(`
		UPDATE roles
		SET %s
		WHERE _id = $%d AND deleted_at IS NULL
		RETURNING _id, tenant_id, name, description, type, permission_codes,
		          created_at, updated_at, version
	`, strings.Join(sets, ", "), argIndex)

	var role models.Role
	err := r.db.QueryRowContext(ctx, query, args...).Scan(
		&role.ID,
		&role.TenantID,
		&role.Name,
		&role.Description,
		&role.Type,
		pq.Array(&role.PermissionCodes),
		&role.CreatedAt,
		&role.UpdatedAt,
		&role.Version,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("role not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to update role: %w", err)
	}

	return &role, nil
}

// Delete soft deletes a role
func (r *RoleRepository) Delete(ctx context.Context, id string) error {
	query := `
		UPDATE roles
		SET deleted_at = NOW()
		WHERE _id = $1 AND deleted_at IS NULL
	`

	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete role: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("role not found")
	}

	return nil
}
