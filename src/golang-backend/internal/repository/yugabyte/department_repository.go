package yugabyte

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/google/uuid"
	"github.com/vhv-platform/backend/internal/models"
)

type departmentRepository struct {
	db *sql.DB
}

func NewDepartmentRepository(db *sql.DB) *departmentRepository {
	return &departmentRepository{db: db}
}

func (r *departmentRepository) Create(ctx context.Context, dept *models.Department) error {
	query := `
		INSERT INTO departments (
			_id, tenant_id, code, name, parent_department_id, manager_id,
			description, status, "order", metadata,
			created_at, updated_at, created_by, version
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`

	_, err := r.db.ExecContext(ctx, query,
		dept.ID, dept.TenantID, dept.Code, dept.Name, dept.ParentDepartmentID,
		dept.ManagerID, dept.Description, dept.Status, dept.Order, dept.Metadata,
		dept.CreatedAt, dept.UpdatedAt, dept.CreatedBy, dept.Version,
	)

	return err
}

func (r *departmentRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Department, error) {
	query := `
		SELECT _id, tenant_id, code, name, parent_department_id, manager_id,
			description, status, "order", metadata,
			created_at, updated_at, created_by, updated_by, deleted_at, deleted_by, version
		FROM departments
		WHERE _id = $1 AND deleted_at IS NULL`

	dept := &models.Department{}
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&dept.ID, &dept.TenantID, &dept.Code, &dept.Name, &dept.ParentDepartmentID,
		&dept.ManagerID, &dept.Description, &dept.Status, &dept.Order, &dept.Metadata,
		&dept.CreatedAt, &dept.UpdatedAt, &dept.CreatedBy, &dept.UpdatedBy,
		&dept.DeletedAt, &dept.DeletedBy, &dept.Version,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("department not found")
	}

	return dept, err
}

func (r *departmentRepository) GetByCode(ctx context.Context, tenantID uuid.UUID, code string) (*models.Department, error) {
	query := `
		SELECT _id, tenant_id, code, name, parent_department_id, manager_id,
			description, status, "order", metadata,
			created_at, updated_at, version
		FROM departments
		WHERE tenant_id = $1 AND code = $2 AND deleted_at IS NULL`

	dept := &models.Department{}
	err := r.db.QueryRowContext(ctx, query, tenantID, code).Scan(
		&dept.ID, &dept.TenantID, &dept.Code, &dept.Name, &dept.ParentDepartmentID,
		&dept.ManagerID, &dept.Description, &dept.Status, &dept.Order, &dept.Metadata,
		&dept.CreatedAt, &dept.UpdatedAt, &dept.Version,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("department not found")
	}

	return dept, err
}

func (r *departmentRepository) ListByTenant(ctx context.Context, tenantID uuid.UUID, page, limit int) ([]*models.Department, int, error) {
	// Count
	countQuery := `SELECT COUNT(*) FROM departments WHERE tenant_id = $1 AND deleted_at IS NULL`
	var total int
	r.db.QueryRowContext(ctx, countQuery, tenantID).Scan(&total)

	// List
	offset := (page - 1) * limit
	query := `
		SELECT _id, tenant_id, code, name, parent_department_id, manager_id,
			status, "order", created_at, updated_at, version
		FROM departments
		WHERE tenant_id = $1 AND deleted_at IS NULL
		ORDER BY "order" ASC, name ASC
		LIMIT $2 OFFSET $3`

	rows, err := r.db.QueryContext(ctx, query, tenantID, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	depts := []*models.Department{}
	for rows.Next() {
		d := &models.Department{}
		rows.Scan(&d.ID, &d.TenantID, &d.Code, &d.Name, &d.ParentDepartmentID,
			&d.ManagerID, &d.Status, &d.Order, &d.CreatedAt, &d.UpdatedAt, &d.Version)
		depts = append(depts, d)
	}

	return depts, total, nil
}

func (r *departmentRepository) Update(ctx context.Context, dept *models.Department) error {
	query := `
		UPDATE departments SET
			name = $2, parent_department_id = $3, manager_id = $4, description = $5,
			status = $6, "order" = $7, metadata = $8, updated_at = $9, updated_by = $10,
			version = version + 1
		WHERE _id = $1 AND deleted_at IS NULL`

	result, err := r.db.ExecContext(ctx, query,
		dept.ID, dept.Name, dept.ParentDepartmentID, dept.ManagerID, dept.Description,
		dept.Status, dept.Order, dept.Metadata, dept.UpdatedAt, dept.UpdatedBy,
	)

	if err != nil {
		return err
	}

	rows, _ := result.RowsAffected()
	if rows == 0 {
		return fmt.Errorf("department not found")
	}

	return nil
}

func (r *departmentRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `UPDATE departments SET deleted_at = NOW(), updated_at = NOW() WHERE _id = $1 AND deleted_at IS NULL`
	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return err
	}

	rows, _ := result.RowsAffected()
	if rows == 0 {
		return fmt.Errorf("department not found")
	}

	return nil
}

func (r *departmentRepository) Exists(ctx context.Context, tenantID uuid.UUID, code string) (bool, error) {
	query := `SELECT EXISTS(SELECT 1 FROM departments WHERE tenant_id = $1 AND code = $2 AND deleted_at IS NULL)`
	var exists bool
	err := r.db.QueryRowContext(ctx, query, tenantID, code).Scan(&exists)
	return exists, err
}