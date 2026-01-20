package repository

import (
	"context"
	"database/sql"
	"fmt"
	"strings"

	"github.com/vhv-platform/backend/internal/models"
)

// PermissionRepository handles database operations for permissions
type PermissionRepository struct {
	db *sql.DB
}

// NewPermissionRepository creates a new permission repository
func NewPermissionRepository(db *sql.DB) *PermissionRepository {
	return &PermissionRepository{db: db}
}

// GetAll retrieves all permissions with optional filters
func (r *PermissionRepository) GetAll(ctx context.Context, filters models.PermissionFilters) ([]models.Permission, error) {
	query := `
		SELECT _id, code, name, description, category, resource_type, type,
		       is_system, sort_order, created_at, updated_at, version
		FROM permissions
		WHERE deleted_at IS NULL
	`

	var args []interface{}
	argIndex := 1

	// Apply filters
	if filters.Category != nil {
		query += fmt.Sprintf(" AND category = $%d", argIndex)
		args = append(args, *filters.Category)
		argIndex++
	}

	if filters.Type != nil {
		query += fmt.Sprintf(" AND type = $%d", argIndex)
		args = append(args, *filters.Type)
		argIndex++
	}

	if filters.ResourceType != nil && *filters.ResourceType != "" {
		query += fmt.Sprintf(" AND resource_type = $%d", argIndex)
		args = append(args, *filters.ResourceType)
		argIndex++
	}

	if filters.IsSystem != nil {
		query += fmt.Sprintf(" AND is_system = $%d", argIndex)
		args = append(args, *filters.IsSystem)
		argIndex++
	}

	if filters.Search != nil && *filters.Search != "" {
		query += fmt.Sprintf(" AND (code ILIKE $%d OR name ILIKE $%d OR description ILIKE $%d)", argIndex, argIndex, argIndex)
		searchTerm := "%" + *filters.Search + "%"
		args = append(args, searchTerm)
		argIndex++
	}

	query += " ORDER BY category, sort_order, name"

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query permissions: %w", err)
	}
	defer rows.Close()

	var permissions []models.Permission
	for rows.Next() {
		var perm models.Permission
		err := rows.Scan(
			&perm.ID,
			&perm.Code,
			&perm.Name,
			&perm.Description,
			&perm.Category,
			&perm.ResourceType,
			&perm.Type,
			&perm.IsSystem,
			&perm.SortOrder,
			&perm.CreatedAt,
			&perm.UpdatedAt,
			&perm.Version,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan permission: %w", err)
		}
		permissions = append(permissions, perm)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating permissions: %w", err)
	}

	return permissions, nil
}

// GetByID retrieves a permission by ID
func (r *PermissionRepository) GetByID(ctx context.Context, id string) (*models.Permission, error) {
	query := `
		SELECT _id, code, name, description, category, resource_type, type,
		       is_system, sort_order, created_at, updated_at, version
		FROM permissions
		WHERE _id = $1 AND deleted_at IS NULL
	`

	var perm models.Permission
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&perm.ID,
		&perm.Code,
		&perm.Name,
		&perm.Description,
		&perm.Category,
		&perm.ResourceType,
		&perm.Type,
		&perm.IsSystem,
		&perm.SortOrder,
		&perm.CreatedAt,
		&perm.UpdatedAt,
		&perm.Version,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("permission not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get permission: %w", err)
	}

	return &perm, nil
}

// GetByCode retrieves a permission by code
func (r *PermissionRepository) GetByCode(ctx context.Context, code string) (*models.Permission, error) {
	query := `
		SELECT _id, code, name, description, category, resource_type, type,
		       is_system, sort_order, created_at, updated_at, version
		FROM permissions
		WHERE code = $1 AND deleted_at IS NULL
	`

	var perm models.Permission
	err := r.db.QueryRowContext(ctx, query, code).Scan(
		&perm.ID,
		&perm.Code,
		&perm.Name,
		&perm.Description,
		&perm.Category,
		&perm.ResourceType,
		&perm.Type,
		&perm.IsSystem,
		&perm.SortOrder,
		&perm.CreatedAt,
		&perm.UpdatedAt,
		&perm.Version,
	)

	if err == sql.ErrNoRows {
		return nil, nil // Code not found is not an error
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get permission by code: %w", err)
	}

	return &perm, nil
}

// GetByCodes retrieves multiple permissions by their codes
func (r *PermissionRepository) GetByCodes(ctx context.Context, codes []string) ([]models.Permission, error) {
	if len(codes) == 0 {
		return []models.Permission{}, nil
	}

	// Build placeholders for IN clause
	placeholders := make([]string, len(codes))
	args := make([]interface{}, len(codes))
	for i, code := range codes {
		placeholders[i] = fmt.Sprintf("$%d", i+1)
		args[i] = code
	}

	query := fmt.Sprintf(`
		SELECT _id, code, name, description, category, resource_type, type,
		       is_system, sort_order, created_at, updated_at, version
		FROM permissions
		WHERE code IN (%s) AND deleted_at IS NULL
		ORDER BY category, sort_order, name
	`, strings.Join(placeholders, ", "))

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query permissions by codes: %w", err)
	}
	defer rows.Close()

	var permissions []models.Permission
	for rows.Next() {
		var perm models.Permission
		err := rows.Scan(
			&perm.ID,
			&perm.Code,
			&perm.Name,
			&perm.Description,
			&perm.Category,
			&perm.ResourceType,
			&perm.Type,
			&perm.IsSystem,
			&perm.SortOrder,
			&perm.CreatedAt,
			&perm.UpdatedAt,
			&perm.Version,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan permission: %w", err)
		}
		permissions = append(permissions, perm)
	}

	return permissions, rows.Err()
}

// Create creates a new permission
func (r *PermissionRepository) Create(ctx context.Context, req models.CreatePermissionRequest) (*models.Permission, error) {
	query := `
		INSERT INTO permissions (code, name, description, category, resource_type, 
		                        type, is_system, sort_order)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING _id, created_at, updated_at, version
	`

	var perm models.Permission
	perm.Code = req.Code
	perm.Name = req.Name
	perm.Description = req.Description
	perm.Category = req.Category
	perm.ResourceType = req.ResourceType
	perm.Type = req.Type
	perm.IsSystem = req.IsSystem
	perm.SortOrder = req.SortOrder

	err := r.db.QueryRowContext(
		ctx, query,
		req.Code,
		req.Name,
		req.Description,
		req.Category,
		req.ResourceType,
		req.Type,
		req.IsSystem,
		req.SortOrder,
	).Scan(&perm.ID, &perm.CreatedAt, &perm.UpdatedAt, &perm.Version)

	if err != nil {
		return nil, fmt.Errorf("failed to create permission: %w", err)
	}

	return &perm, nil
}

// Update updates a permission
func (r *PermissionRepository) Update(ctx context.Context, id string, req models.UpdatePermissionRequest) (*models.Permission, error) {
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

	if req.Category != nil {
		sets = append(sets, fmt.Sprintf("category = $%d", argIndex))
		args = append(args, *req.Category)
		argIndex++
	}

	if req.ResourceType != nil {
		sets = append(sets, fmt.Sprintf("resource_type = $%d", argIndex))
		args = append(args, *req.ResourceType)
		argIndex++
	}

	if req.Type != nil {
		sets = append(sets, fmt.Sprintf("type = $%d", argIndex))
		args = append(args, *req.Type)
		argIndex++
	}

	if req.SortOrder != nil {
		sets = append(sets, fmt.Sprintf("sort_order = $%d", argIndex))
		args = append(args, *req.SortOrder)
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
		UPDATE permissions
		SET %s
		WHERE _id = $%d AND deleted_at IS NULL
		RETURNING _id, code, name, description, category, resource_type, type,
		          is_system, sort_order, created_at, updated_at, version
	`, strings.Join(sets, ", "), argIndex)

	var perm models.Permission
	err := r.db.QueryRowContext(ctx, query, args...).Scan(
		&perm.ID,
		&perm.Code,
		&perm.Name,
		&perm.Description,
		&perm.Category,
		&perm.ResourceType,
		&perm.Type,
		&perm.IsSystem,
		&perm.SortOrder,
		&perm.CreatedAt,
		&perm.UpdatedAt,
		&perm.Version,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("permission not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to update permission: %w", err)
	}

	return &perm, nil
}

// Delete soft deletes a permission
func (r *PermissionRepository) Delete(ctx context.Context, id string) error {
	query := `
		UPDATE permissions
		SET deleted_at = NOW()
		WHERE _id = $1 AND deleted_at IS NULL
	`

	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete permission: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("permission not found")
	}

	return nil
}
