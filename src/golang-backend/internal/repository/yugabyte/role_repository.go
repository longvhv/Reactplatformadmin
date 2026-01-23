package yugabyte

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/google/uuid"
	"github.com/vhv-platform/backend/internal/models"
)

type roleRepository struct {
	db *sql.DB
}

func NewRoleRepository(db *sql.DB) *roleRepository {
	return &roleRepository{db: db}
}

func (r *roleRepository) Create(ctx context.Context, role *models.Role) error {
	query := `
		INSERT INTO roles (
			_id, name, code, description, is_system_role, is_active, tenant_id,
			created_at, updated_at, created_by, version
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`

	_, err := r.db.ExecContext(ctx, query,
		role.ID, role.Name, role.Code, role.Description, role.IsSystemRole,
		role.IsActive, role.TenantID, role.CreatedAt, role.UpdatedAt,
		role.CreatedBy, role.Version,
	)

	return err
}

func (r *roleRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Role, error) {
	query := `
		SELECT _id, name, code, description, is_system_role, is_active, tenant_id,
			created_at, updated_at, created_by, updated_by, deleted_at, deleted_by, version
		FROM roles
		WHERE _id = $1 AND deleted_at IS NULL`

	role := &models.Role{}
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&role.ID, &role.Name, &role.Code, &role.Description, &role.IsSystemRole,
		&role.IsActive, &role.TenantID, &role.CreatedAt, &role.UpdatedAt,
		&role.CreatedBy, &role.UpdatedBy, &role.DeletedAt, &role.DeletedBy, &role.Version,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("role not found")
	}

	return role, err
}

func (r *roleRepository) GetByCode(ctx context.Context, code string, tenantID *uuid.UUID) (*models.Role, error) {
	query := `
		SELECT _id, name, code, description, is_system_role, is_active, tenant_id,
			created_at, updated_at, version
		FROM roles
		WHERE code = $1 AND (tenant_id = $2 OR tenant_id IS NULL) AND deleted_at IS NULL
		LIMIT 1`

	role := &models.Role{}
	err := r.db.QueryRowContext(ctx, query, code, tenantID).Scan(
		&role.ID, &role.Name, &role.Code, &role.Description, &role.IsSystemRole,
		&role.IsActive, &role.TenantID, &role.CreatedAt, &role.UpdatedAt, &role.Version,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("role not found")
	}

	return role, err
}

func (r *roleRepository) ListByTenant(ctx context.Context, tenantID *uuid.UUID, page, limit int) ([]*models.Role, int, error) {
	// Count
	var countQuery string
	var total int

	if tenantID != nil {
		countQuery = `SELECT COUNT(*) FROM roles WHERE (tenant_id = $1 OR is_system_role = true) AND deleted_at IS NULL`
		r.db.QueryRowContext(ctx, countQuery, tenantID).Scan(&total)
	} else {
		countQuery = `SELECT COUNT(*) FROM roles WHERE is_system_role = true AND deleted_at IS NULL`
		r.db.QueryRowContext(ctx, countQuery).Scan(&total)
	}

	// List
	offset := (page - 1) * limit
	var query string
	var rows *sql.Rows
	var err error

	if tenantID != nil {
		query = `
			SELECT _id, name, code, description, is_system_role, is_active, tenant_id,
				created_at, updated_at, version
			FROM roles
			WHERE (tenant_id = $1 OR is_system_role = true) AND deleted_at IS NULL
			ORDER BY is_system_role DESC, name ASC
			LIMIT $2 OFFSET $3`
		rows, err = r.db.QueryContext(ctx, query, tenantID, limit, offset)
	} else {
		query = `
			SELECT _id, name, code, description, is_system_role, is_active, tenant_id,
				created_at, updated_at, version
			FROM roles
			WHERE is_system_role = true AND deleted_at IS NULL
			ORDER BY name ASC
			LIMIT $1 OFFSET $2`
		rows, err = r.db.QueryContext(ctx, query, limit, offset)
	}

	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	roles := []*models.Role{}
	for rows.Next() {
		role := &models.Role{}
		rows.Scan(&role.ID, &role.Name, &role.Code, &role.Description, &role.IsSystemRole,
			&role.IsActive, &role.TenantID, &role.CreatedAt, &role.UpdatedAt, &role.Version)
		roles = append(roles, role)
	}

	return roles, total, nil
}

func (r *roleRepository) Update(ctx context.Context, role *models.Role) error {
	query := `
		UPDATE roles SET
			name = $2, description = $3, is_active = $4,
			updated_at = $5, updated_by = $6, version = version + 1
		WHERE _id = $1 AND deleted_at IS NULL`

	result, err := r.db.ExecContext(ctx, query,
		role.ID, role.Name, role.Description, role.IsActive,
		role.UpdatedAt, role.UpdatedBy,
	)

	if err != nil {
		return err
	}

	rows, _ := result.RowsAffected()
	if rows == 0 {
		return fmt.Errorf("role not found")
	}

	return nil
}

func (r *roleRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `UPDATE roles SET deleted_at = NOW(), updated_at = NOW() WHERE _id = $1 AND deleted_at IS NULL`
	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return err
	}

	rows, _ := result.RowsAffected()
	if rows == 0 {
		return fmt.Errorf("role not found")
	}

	return nil
}

func (r *roleRepository) AssignPermission(ctx context.Context, roleID, permissionID uuid.UUID) error {
	query := `INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`
	_, err := r.db.ExecContext(ctx, query, roleID, permissionID)
	return err
}

func (r *roleRepository) RemovePermission(ctx context.Context, roleID, permissionID uuid.UUID) error {
	query := `DELETE FROM role_permissions WHERE role_id = $1 AND permission_id = $2`
	_, err := r.db.ExecContext(ctx, query, roleID, permissionID)
	return err
}
