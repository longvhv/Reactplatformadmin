package yugabyte

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/google/uuid"
	"github.com/vhv-platform/backend/internal/models"
)

type tenantMemberRepository struct {
	db *sql.DB
}

func NewTenantMemberRepository(db *sql.DB) *tenantMemberRepository {
	return &tenantMemberRepository{db: db}
}

func (r *tenantMemberRepository) Create(ctx context.Context, member *models.TenantMember) error {
	query := `
		INSERT INTO tenant_members (
			_id, tenant_id, user_id, employee_code, job_title, department,
			manager_id, status, joined_at, is_active, is_primary,
			work_email, work_phone, work_location, metadata,
			created_at, updated_at, version
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`

	_, err := r.db.ExecContext(ctx, query,
		member.ID, member.TenantID, member.UserID, member.EmployeeCode, member.JobTitle,
		member.Department, member.ManagerID, member.Status, member.JoinedAt,
		member.IsActive, member.IsPrimary, member.WorkEmail, member.WorkPhone,
		member.WorkLocation, member.Metadata, member.CreatedAt, member.UpdatedAt, member.Version,
	)

	return err
}

func (r *tenantMemberRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.TenantMember, error) {
	query := `
		SELECT _id, tenant_id, user_id, employee_code, job_title, department,
			manager_id, status, joined_at, left_at, is_active, is_primary,
			work_email, work_phone, work_location, metadata,
			created_at, updated_at, created_by, updated_by, deleted_at, deleted_by, version
		FROM tenant_members
		WHERE _id = $1 AND deleted_at IS NULL`

	member := &models.TenantMember{}
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&member.ID, &member.TenantID, &member.UserID, &member.EmployeeCode, &member.JobTitle,
		&member.Department, &member.ManagerID, &member.Status, &member.JoinedAt, &member.LeftAt,
		&member.IsActive, &member.IsPrimary, &member.WorkEmail, &member.WorkPhone,
		&member.WorkLocation, &member.Metadata, &member.CreatedAt, &member.UpdatedAt,
		&member.CreatedBy, &member.UpdatedBy, &member.DeletedAt, &member.DeletedBy, &member.Version,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("tenant member not found")
	}

	return member, err
}

func (r *tenantMemberRepository) GetByTenantAndUser(ctx context.Context, tenantID, userID uuid.UUID) (*models.TenantMember, error) {
	query := `
		SELECT _id, tenant_id, user_id, employee_code, job_title, department,
			manager_id, status, joined_at, left_at, is_active, is_primary,
			work_email, work_phone, work_location, metadata,
			created_at, updated_at, version
		FROM tenant_members
		WHERE tenant_id = $1 AND user_id = $2 AND deleted_at IS NULL`

	member := &models.TenantMember{}
	err := r.db.QueryRowContext(ctx, query, tenantID, userID).Scan(
		&member.ID, &member.TenantID, &member.UserID, &member.EmployeeCode, &member.JobTitle,
		&member.Department, &member.ManagerID, &member.Status, &member.JoinedAt, &member.LeftAt,
		&member.IsActive, &member.IsPrimary, &member.WorkEmail, &member.WorkPhone,
		&member.WorkLocation, &member.Metadata, &member.CreatedAt, &member.UpdatedAt, &member.Version,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("tenant member not found")
	}

	return member, err
}

func (r *tenantMemberRepository) ListByTenant(ctx context.Context, tenantID uuid.UUID, page, limit int) ([]*models.TenantMember, int, error) {
	// Count total
	countQuery := `SELECT COUNT(*) FROM tenant_members WHERE tenant_id = $1 AND deleted_at IS NULL`
	var total int
	r.db.QueryRowContext(ctx, countQuery, tenantID).Scan(&total)

	// Get data
	offset := (page - 1) * limit
	query := `
		SELECT _id, tenant_id, user_id, employee_code, job_title, status,
			is_active, is_primary, work_email, created_at, updated_at, version
		FROM tenant_members
		WHERE tenant_id = $1 AND deleted_at IS NULL
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3`

	rows, err := r.db.QueryContext(ctx, query, tenantID, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	members := []*models.TenantMember{}
	for rows.Next() {
		m := &models.TenantMember{}
		rows.Scan(&m.ID, &m.TenantID, &m.UserID, &m.EmployeeCode, &m.JobTitle,
			&m.Status, &m.IsActive, &m.IsPrimary, &m.WorkEmail,
			&m.CreatedAt, &m.UpdatedAt, &m.Version)
		members = append(members, m)
	}

	return members, total, nil
}

func (r *tenantMemberRepository) Update(ctx context.Context, member *models.TenantMember) error {
	query := `
		UPDATE tenant_members SET
			employee_code = $2, job_title = $3, department = $4, manager_id = $5,
			status = $6, left_at = $7, is_active = $8, work_email = $9,
			work_phone = $10, work_location = $11, metadata = $12,
			updated_at = $13, updated_by = $14, version = version + 1
		WHERE _id = $1 AND deleted_at IS NULL`

	result, err := r.db.ExecContext(ctx, query,
		member.ID, member.EmployeeCode, member.JobTitle, member.Department,
		member.ManagerID, member.Status, member.LeftAt, member.IsActive,
		member.WorkEmail, member.WorkPhone, member.WorkLocation, member.Metadata,
		member.UpdatedAt, member.UpdatedBy,
	)

	if err != nil {
		return err
	}

	rows, _ := result.RowsAffected()
	if rows == 0 {
		return fmt.Errorf("tenant member not found")
	}

	return nil
}

func (r *tenantMemberRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `UPDATE tenant_members SET deleted_at = NOW(), updated_at = NOW() WHERE _id = $1 AND deleted_at IS NULL`
	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return err
	}

	rows, _ := result.RowsAffected()
	if rows == 0 {
		return fmt.Errorf("tenant member not found")
	}

	return nil
}

func (r *tenantMemberRepository) Exists(ctx context.Context, tenantID, userID uuid.UUID) (bool, error) {
	query := `SELECT EXISTS(SELECT 1 FROM tenant_members WHERE tenant_id = $1 AND user_id = $2 AND deleted_at IS NULL)`
	var exists bool
	err := r.db.QueryRowContext(ctx, query, tenantID, userID).Scan(&exists)
	return exists, err
}
