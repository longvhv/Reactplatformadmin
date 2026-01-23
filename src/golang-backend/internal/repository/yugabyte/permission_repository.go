package yugabyte

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/google/uuid"
	"github.com/vhv-platform/backend/internal/models"
)

type permissionRepository struct {
	db *sql.DB
}

func NewPermissionRepository(db *sql.DB) *permissionRepository {
	return &permissionRepository{db: db}
}

func (r *permissionRepository) Create(ctx context.Context, permission *models.Permission) error {
	query := `
		INSERT INTO permissions (
			_id, name, code, resource, action, description, category, is_active,
			created_at, updated_at, created_by, version
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`

	_, err := r.db.ExecContext(ctx, query,
		permission.ID, permission.Name, permission.Code, permission.Resource,
		permission.Action, permission.Description, permission.Category, permission.IsActive,
		permission.CreatedAt, permission.UpdatedAt, permission.CreatedBy, permission.Version,
	)

	return err
}

func (r *permissionRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Permission, error) {
	query := `
		SELECT _id, name, code, resource, action, description, category, is_active,
			created_at, updated_at, created_by, updated_by, deleted_at, deleted_by, version
		FROM permissions
		WHERE _id = $1 AND deleted_at IS NULL`

	permission := &models.Permission{}
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&permission.ID, &permission.Name, &permission.Code, &permission.Resource,
		&permission.Action, &permission.Description, &permission.Category, &permission.IsActive,
		&permission.CreatedAt, &permission.UpdatedAt, &permission.CreatedBy,
		&permission.UpdatedBy, &permission.DeletedAt, &permission.DeletedBy, &permission.Version,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("permission not found")
	}

	return permission, err
}

func (r *permissionRepository) GetByCode(ctx context.Context, code string) (*models.Permission, error) {
	query := `
		SELECT _id, name, code, resource, action, description, category, is_active,
			created_at, updated_at, version
		FROM permissions
		WHERE code = $1 AND deleted_at IS NULL`

	permission := &models.Permission{}
	err := r.db.QueryRowContext(ctx, query, code).Scan(
		&permission.ID, &permission.Name, &permission.Code, &permission.Resource,
		&permission.Action, &permission.Description, &permission.Category, &permission.IsActive,
		&permission.CreatedAt, &permission.UpdatedAt, &permission.Version,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("permission not found")
	}

	return permission, err
}

func (r *permissionRepository) List(ctx context.Context, page, limit int) ([]*models.Permission, int, error) {
	// Count
	countQuery := `SELECT COUNT(*) FROM permissions WHERE deleted_at IS NULL`
	var total int
	r.db.QueryRowContext(ctx, countQuery).Scan(&total)

	// List
	offset := (page - 1) * limit
	query := `
		SELECT _id, name, code, resource, action, category, is_active,
			created_at, updated_at, version
		FROM permissions
		WHERE deleted_at IS NULL
		ORDER BY category ASC, resource ASC, action ASC
		LIMIT $1 OFFSET $2`

	rows, err := r.db.QueryContext(ctx, query, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	permissions := []*models.Permission{}
	for rows.Next() {
		p := &models.Permission{}
		rows.Scan(&p.ID, &p.Name, &p.Code, &p.Resource, &p.Action,
			&p.Category, &p.IsActive, &p.CreatedAt, &p.UpdatedAt, &p.Version)
		permissions = append(permissions, p)
	}

	return permissions, total, nil
}

func (r *permissionRepository) ListByRole(ctx context.Context, roleID uuid.UUID) ([]*models.Permission, error) {
	query := `
		SELECT p._id, p.name, p.code, p.resource, p.action, p.category, p.is_active,
			p.created_at, p.updated_at, p.version
		FROM permissions p
		INNER JOIN role_permissions rp ON p._id = rp.permission_id
		WHERE rp.role_id = $1 AND p.deleted_at IS NULL
		ORDER BY p.category ASC, p.resource ASC, p.action ASC`

	rows, err := r.db.QueryContext(ctx, query, roleID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	permissions := []*models.Permission{}
	for rows.Next() {
		p := &models.Permission{}
		rows.Scan(&p.ID, &p.Name, &p.Code, &p.Resource, &p.Action,
			&p.Category, &p.IsActive, &p.CreatedAt, &p.UpdatedAt, &p.Version)
		permissions = append(permissions, p)
	}

	return permissions, nil
}

func (r *permissionRepository) Update(ctx context.Context, permission *models.Permission) error {
	query := `
		UPDATE permissions SET
			name = $2, description = $3, category = $4, is_active = $5,
			updated_at = $6, updated_by = $7, version = version + 1
		WHERE _id = $1 AND deleted_at IS NULL`

	result, err := r.db.ExecContext(ctx, query,
		permission.ID, permission.Name, permission.Description, permission.Category,
		permission.IsActive, permission.UpdatedAt, permission.UpdatedBy,
	)

	if err != nil {
		return err
	}

	rows, _ := result.RowsAffected()
	if rows == 0 {
		return fmt.Errorf("permission not found")
	}

	return nil
}

func (r *permissionRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `UPDATE permissions SET deleted_at = NOW(), updated_at = NOW() WHERE _id = $1 AND deleted_at IS NULL`
	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return err
	}

	rows, _ := result.RowsAffected()
	if rows == 0 {
		return fmt.Errorf("permission not found")
	}

	return nil
}
