package repository

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"

	"golang-backend/internal/models"
)

type DepartmentRepository interface {
	Create(ctx context.Context, dept *models.Department) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.Department, error)
	GetByCode(ctx context.Context, tenantID uuid.UUID, code string) (*models.Department, error)
	List(ctx context.Context, page, pageSize int, tenantID *uuid.UUID, status *string) ([]*models.Department, int, error)
	Update(ctx context.Context, dept *models.Department) error
	Delete(ctx context.Context, id uuid.UUID) error
	SoftDelete(ctx context.Context, id uuid.UUID, deletedBy string) error
	ListByTenantID(ctx context.Context, tenantID uuid.UUID) ([]*models.Department, error)
	ListByParentID(ctx context.Context, parentID uuid.UUID) ([]*models.Department, error)
	ListByStatus(ctx context.Context, tenantID uuid.UUID, status string) ([]*models.Department, error)
	ListByManager(ctx context.Context, managerID uuid.UUID) ([]*models.Department, error)
	UpdateStatus(ctx context.Context, id uuid.UUID, status string) error
	GetHierarchy(ctx context.Context, tenantID uuid.UUID) ([]*models.Department, error)
}

type departmentRepository struct {
	db *sqlx.DB
}

func NewDepartmentRepository(db *sqlx.DB) DepartmentRepository {
	return &departmentRepository{db: db}
}

func (r *departmentRepository) Create(ctx context.Context, dept *models.Department) error {
	query := `
		INSERT INTO departments (
			_id, tenant_id, code, name, parent_department_id, manager_id,
			description, status, "order", metadata, created_at, updated_at,
			created_by, version
		) VALUES (
			:_id, :tenant_id, :code, :name, :parent_department_id, :manager_id,
			:description, :status, :order, :metadata, :created_at, :updated_at,
			:created_by, :version
		)`

	_, err := r.db.NamedExecContext(ctx, query, dept)
	return err
}

func (r *departmentRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Department, error) {
	var dept models.Department
	query := `SELECT * FROM departments WHERE _id = $1 AND deleted_at IS NULL`

	err := r.db.GetContext(ctx, &dept, query, id)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("department not found")
	}
	return &dept, err
}

func (r *departmentRepository) GetByCode(ctx context.Context, tenantID uuid.UUID, code string) (*models.Department, error) {
	var dept models.Department
	query := `SELECT * FROM departments WHERE tenant_id = $1 AND code = $2 AND deleted_at IS NULL`

	err := r.db.GetContext(ctx, &dept, query, tenantID, code)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("department not found")
	}
	return &dept, err
}

func (r *departmentRepository) List(ctx context.Context, page, pageSize int, tenantID *uuid.UUID, status *string) ([]*models.Department, int, error) {
	var depts []*models.Department
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

	if status != nil {
		whereClause += fmt.Sprintf(" AND status = $%d", argPos)
		args = append(args, *status)
		argPos++
	}

	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM departments %s", whereClause)
	err := r.db.GetContext(ctx, &total, countQuery, args...)
	if err != nil {
		return nil, 0, err
	}

	query := fmt.Sprintf(`
		SELECT * FROM departments %s
		ORDER BY "order" ASC, name ASC
		LIMIT $%d OFFSET $%d
	`, whereClause, argPos, argPos+1)

	args = append(args, pageSize, offset)
	err = r.db.SelectContext(ctx, &depts, query, args...)
	if err != nil {
		return nil, 0, err
	}

	return depts, total, nil
}

func (r *departmentRepository) Update(ctx context.Context, dept *models.Department) error {
	query := `
		UPDATE departments SET
			name = :name,
			parent_department_id = :parent_department_id,
			manager_id = :manager_id,
			description = :description,
			status = :status,
			"order" = :order,
			metadata = :metadata,
			updated_at = :updated_at,
			updated_by = :updated_by,
			version = version + 1
		WHERE _id = :_id AND version = :version AND deleted_at IS NULL`

	result, err := r.db.NamedExecContext(ctx, query, dept)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return fmt.Errorf("department not found or version mismatch")
	}

	return nil
}

func (r *departmentRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM departments WHERE _id = $1`

	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return fmt.Errorf("department not found")
	}

	return nil
}

func (r *departmentRepository) SoftDelete(ctx context.Context, id uuid.UUID, deletedBy string) error {
	query := `
		UPDATE departments
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
		return fmt.Errorf("department not found")
	}

	return nil
}

func (r *departmentRepository) ListByTenantID(ctx context.Context, tenantID uuid.UUID) ([]*models.Department, error) {
	var depts []*models.Department
	query := `
		SELECT * FROM departments
		WHERE tenant_id = $1 AND deleted_at IS NULL
		ORDER BY "order" ASC, name ASC`

	err := r.db.SelectContext(ctx, &depts, query, tenantID)
	return depts, err
}

func (r *departmentRepository) ListByParentID(ctx context.Context, parentID uuid.UUID) ([]*models.Department, error) {
	var depts []*models.Department
	query := `
		SELECT * FROM departments
		WHERE parent_department_id = $1 AND deleted_at IS NULL
		ORDER BY "order" ASC, name ASC`

	err := r.db.SelectContext(ctx, &depts, query, parentID)
	return depts, err
}

func (r *departmentRepository) ListByStatus(ctx context.Context, tenantID uuid.UUID, status string) ([]*models.Department, error) {
	var depts []*models.Department
	query := `
		SELECT * FROM departments
		WHERE tenant_id = $1 AND status = $2 AND deleted_at IS NULL
		ORDER BY "order" ASC, name ASC`

	err := r.db.SelectContext(ctx, &depts, query, tenantID, status)
	return depts, err
}

func (r *departmentRepository) ListByManager(ctx context.Context, managerID uuid.UUID) ([]*models.Department, error) {
	var depts []*models.Department
	query := `
		SELECT * FROM departments
		WHERE manager_id = $1 AND deleted_at IS NULL
		ORDER BY "order" ASC, name ASC`

	err := r.db.SelectContext(ctx, &depts, query, managerID)
	return depts, err
}

func (r *departmentRepository) UpdateStatus(ctx context.Context, id uuid.UUID, status string) error {
	query := `
		UPDATE departments
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
		return fmt.Errorf("department not found")
	}

	return nil
}

func (r *departmentRepository) GetHierarchy(ctx context.Context, tenantID uuid.UUID) ([]*models.Department, error) {
	var depts []*models.Department
	query := `
		WITH RECURSIVE department_tree AS (
			SELECT * FROM departments 
			WHERE tenant_id = $1 AND parent_department_id IS NULL AND deleted_at IS NULL
			UNION ALL
			SELECT d.* FROM departments d
			INNER JOIN department_tree dt ON d.parent_department_id = dt._id
			WHERE d.deleted_at IS NULL
		)
		SELECT * FROM department_tree
		ORDER BY "order" ASC, name ASC`

	err := r.db.SelectContext(ctx, &depts, query, tenantID)
	return depts, err
}
