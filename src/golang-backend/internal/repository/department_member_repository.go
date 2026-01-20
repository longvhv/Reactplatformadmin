package repository

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"

	"golang-backend/internal/models"
)

type DepartmentMemberRepository interface {
	Create(ctx context.Context, member *models.DepartmentMember) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.DepartmentMember, error)
	List(ctx context.Context, page, pageSize int, tenantID, departmentID, tenantMemberID *uuid.UUID) ([]*models.DepartmentMember, int, error)
	Update(ctx context.Context, member *models.DepartmentMember) error
	Delete(ctx context.Context, id uuid.UUID) error
	SoftDelete(ctx context.Context, id uuid.UUID, deletedBy string) error
	ListByDepartmentID(ctx context.Context, departmentID uuid.UUID) ([]*models.DepartmentMember, error)
	ListByTenantMemberID(ctx context.Context, tenantMemberID uuid.UUID) ([]*models.DepartmentMember, error)
	GetByDepartmentAndMember(ctx context.Context, departmentID, tenantMemberID uuid.UUID) (*models.DepartmentMember, error)
	RemoveFromDepartment(ctx context.Context, id uuid.UUID) error
	GetActiveCount(ctx context.Context, departmentID uuid.UUID) (int, error)
}

type departmentMemberRepository struct {
	db *sqlx.DB
}

func NewDepartmentMemberRepository(db *sqlx.DB) DepartmentMemberRepository {
	return &departmentMemberRepository{db: db}
}

func (r *departmentMemberRepository) Create(ctx context.Context, member *models.DepartmentMember) error {
	query := `
		INSERT INTO department_members (
			_id, tenant_id, department_id, tenant_member_id, is_primary,
			role_in_department, joined_at, metadata, created_at, updated_at,
			created_by, version
		) VALUES (
			:_id, :tenant_id, :department_id, :tenant_member_id, :is_primary,
			:role_in_department, :joined_at, :metadata, :created_at, :updated_at,
			:created_by, :version
		)`

	_, err := r.db.NamedExecContext(ctx, query, member)
	return err
}

func (r *departmentMemberRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.DepartmentMember, error) {
	var member models.DepartmentMember
	query := `SELECT * FROM department_members WHERE _id = $1 AND deleted_at IS NULL`

	err := r.db.GetContext(ctx, &member, query, id)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("department member not found")
	}
	return &member, err
}

func (r *departmentMemberRepository) List(ctx context.Context, page, pageSize int, tenantID, departmentID, tenantMemberID *uuid.UUID) ([]*models.DepartmentMember, int, error) {
	var members []*models.DepartmentMember
	var total int

	offset := (page - 1) * pageSize

	whereClause := "WHERE deleted_at IS NULL AND left_at IS NULL"
	args := []interface{}{}
	argPos := 1

	if tenantID != nil {
		whereClause += fmt.Sprintf(" AND tenant_id = $%d", argPos)
		args = append(args, *tenantID)
		argPos++
	}

	if departmentID != nil {
		whereClause += fmt.Sprintf(" AND department_id = $%d", argPos)
		args = append(args, *departmentID)
		argPos++
	}

	if tenantMemberID != nil {
		whereClause += fmt.Sprintf(" AND tenant_member_id = $%d", argPos)
		args = append(args, *tenantMemberID)
		argPos++
	}

	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM department_members %s", whereClause)
	err := r.db.GetContext(ctx, &total, countQuery, args...)
	if err != nil {
		return nil, 0, err
	}

	query := fmt.Sprintf(`
		SELECT * FROM department_members %s
		ORDER BY joined_at DESC
		LIMIT $%d OFFSET $%d
	`, whereClause, argPos, argPos+1)

	args = append(args, pageSize, offset)
	err = r.db.SelectContext(ctx, &members, query, args...)
	if err != nil {
		return nil, 0, err
	}

	return members, total, nil
}

func (r *departmentMemberRepository) Update(ctx context.Context, member *models.DepartmentMember) error {
	query := `
		UPDATE department_members SET
			is_primary = :is_primary,
			role_in_department = :role_in_department,
			metadata = :metadata,
			updated_at = :updated_at,
			updated_by = :updated_by,
			version = version + 1
		WHERE _id = :_id AND version = :version AND deleted_at IS NULL`

	result, err := r.db.NamedExecContext(ctx, query, member)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return fmt.Errorf("department member not found or version mismatch")
	}

	return nil
}

func (r *departmentMemberRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM department_members WHERE _id = $1`

	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return fmt.Errorf("department member not found")
	}

	return nil
}

func (r *departmentMemberRepository) SoftDelete(ctx context.Context, id uuid.UUID, deletedBy string) error {
	query := `
		UPDATE department_members
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
		return fmt.Errorf("department member not found")
	}

	return nil
}

func (r *departmentMemberRepository) ListByDepartmentID(ctx context.Context, departmentID uuid.UUID) ([]*models.DepartmentMember, error) {
	var members []*models.DepartmentMember
	query := `
		SELECT * FROM department_members
		WHERE department_id = $1 AND deleted_at IS NULL AND left_at IS NULL
		ORDER BY joined_at DESC`

	err := r.db.SelectContext(ctx, &members, query, departmentID)
	return members, err
}

func (r *departmentMemberRepository) ListByTenantMemberID(ctx context.Context, tenantMemberID uuid.UUID) ([]*models.DepartmentMember, error) {
	var members []*models.DepartmentMember
	query := `
		SELECT * FROM department_members
		WHERE tenant_member_id = $1 AND deleted_at IS NULL AND left_at IS NULL
		ORDER BY joined_at DESC`

	err := r.db.SelectContext(ctx, &members, query, tenantMemberID)
	return members, err
}

func (r *departmentMemberRepository) GetByDepartmentAndMember(ctx context.Context, departmentID, tenantMemberID uuid.UUID) (*models.DepartmentMember, error) {
	var member models.DepartmentMember
	query := `
		SELECT * FROM department_members
		WHERE department_id = $1 AND tenant_member_id = $2 AND deleted_at IS NULL AND left_at IS NULL`

	err := r.db.GetContext(ctx, &member, query, departmentID, tenantMemberID)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("department member not found")
	}
	return &member, err
}

func (r *departmentMemberRepository) RemoveFromDepartment(ctx context.Context, id uuid.UUID) error {
	query := `
		UPDATE department_members
		SET left_at = NOW(), updated_at = NOW()
		WHERE _id = $1 AND deleted_at IS NULL AND left_at IS NULL`

	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return fmt.Errorf("department member not found")
	}

	return nil
}

func (r *departmentMemberRepository) GetActiveCount(ctx context.Context, departmentID uuid.UUID) (int, error) {
	var count int
	query := `
		SELECT COUNT(*) FROM department_members
		WHERE department_id = $1 AND deleted_at IS NULL AND left_at IS NULL`

	err := r.db.GetContext(ctx, &count, query, departmentID)
	return count, err
}
