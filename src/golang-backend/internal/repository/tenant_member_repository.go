package repository

import (
	"database/sql"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/yourusername/golang-backend/internal/models"
)

type TenantMemberRepository struct {
	db *sqlx.DB
}

func NewTenantMemberRepository(db *sqlx.DB) *TenantMemberRepository {
	return &TenantMemberRepository{db: db}
}

// Create creates a new tenant member
func (r *TenantMemberRepository) Create(member *models.TenantMember) error {
	query := `
		INSERT INTO tenant_members (
			_id, tenant_id, user_id, employee_code, internal_email, job_title,
			manager_id, role, status, joined_at, permissions, metadata,
			created_at, updated_at, version
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
		) RETURNING _id, created_at, updated_at`

	now := time.Now()
	member.ID = uuid.New()
	member.CreatedAt = now
	member.UpdatedAt = now
	member.Version = 1

	if member.Status == "" {
		member.Status = "ACTIVE"
	}
	if member.Role == "" {
		member.Role = "MEMBER"
	}
	if member.Permissions == nil {
		member.Permissions = models.JSONB("[]")
	}
	if member.Metadata == nil {
		member.Metadata = models.JSONB("{}")
	}

	return r.db.QueryRow(
		query,
		member.ID, member.TenantID, member.UserID, member.EmployeeCode,
		member.InternalEmail, member.JobTitle, member.ManagerID, member.Role,
		member.Status, member.JoinedAt, member.Permissions, member.Metadata,
		member.CreatedAt, member.UpdatedAt, member.Version,
	).Scan(&member.ID, &member.CreatedAt, &member.UpdatedAt)
}

// GetByID retrieves a tenant member by ID
func (r *TenantMemberRepository) GetByID(id uuid.UUID) (*models.TenantMember, error) {
	member := &models.TenantMember{}
	query := `
		SELECT _id, tenant_id, user_id, employee_code, internal_email, job_title,
		       manager_id, role, status, joined_at, left_at, permissions, metadata,
		       created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, version
		FROM tenant_members
		WHERE _id = $1 AND deleted_at IS NULL`

	err := r.db.Get(member, query, id)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("tenant member not found")
	}
	return member, err
}

// GetByTenantAndUser retrieves a tenant member by tenant ID and user ID
func (r *TenantMemberRepository) GetByTenantAndUser(tenantID, userID uuid.UUID) (*models.TenantMember, error) {
	member := &models.TenantMember{}
	query := `
		SELECT _id, tenant_id, user_id, employee_code, internal_email, job_title,
		       manager_id, role, status, joined_at, left_at, permissions, metadata,
		       created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, version
		FROM tenant_members
		WHERE tenant_id = $1 AND user_id = $2 AND deleted_at IS NULL`

	err := r.db.Get(member, query, tenantID, userID)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("tenant member not found")
	}
	return member, err
}

// List retrieves tenant members with pagination and filters
func (r *TenantMemberRepository) List(page, pageSize int, filters map[string]interface{}) ([]models.TenantMember, int, error) {
	var members []models.TenantMember
	var total int

	where := []string{"deleted_at IS NULL"}
	args := []interface{}{}
	argCount := 1

	if tenantID, ok := filters["tenant_id"].(string); ok && tenantID != "" {
		where = append(where, fmt.Sprintf("tenant_id = $%d", argCount))
		args = append(args, tenantID)
		argCount++
	}

	if role, ok := filters["role"].(string); ok && role != "" {
		where = append(where, fmt.Sprintf("role = $%d", argCount))
		args = append(args, role)
		argCount++
	}

	if status, ok := filters["status"].(string); ok && status != "" {
		where = append(where, fmt.Sprintf("status = $%d", argCount))
		args = append(args, status)
		argCount++
	}

	if managerID, ok := filters["manager_id"].(string); ok && managerID != "" {
		where = append(where, fmt.Sprintf("manager_id = $%d", argCount))
		args = append(args, managerID)
		argCount++
	}

	whereClause := strings.Join(where, " AND ")

	// Get total count
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM tenant_members WHERE %s", whereClause)
	err := r.db.Get(&total, countQuery, args...)
	if err != nil {
		return nil, 0, err
	}

	// Get paginated results
	offset := (page - 1) * pageSize
	query := fmt.Sprintf(`
		SELECT _id, tenant_id, user_id, employee_code, internal_email, job_title,
		       manager_id, role, status, joined_at, left_at, permissions, metadata,
		       created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, version
		FROM tenant_members
		WHERE %s
		ORDER BY created_at DESC
		LIMIT $%d OFFSET $%d`, whereClause, argCount, argCount+1)

	args = append(args, pageSize, offset)
	err = r.db.Select(&members, query, args...)

	return members, total, err
}

// ListByTenantID retrieves all tenant members for a specific tenant
func (r *TenantMemberRepository) ListByTenantID(tenantID uuid.UUID, page, pageSize int) ([]models.TenantMember, int, error) {
	filters := map[string]interface{}{
		"tenant_id": tenantID.String(),
	}
	return r.List(page, pageSize, filters)
}

// Update updates a tenant member
func (r *TenantMemberRepository) Update(id uuid.UUID, updates map[string]interface{}) (*models.TenantMember, error) {
	if len(updates) == 0 {
		return r.GetByID(id)
	}

	setClauses := []string{}
	args := []interface{}{}
	argCount := 1

	for key, value := range updates {
		setClauses = append(setClauses, fmt.Sprintf("%s = $%d", key, argCount))
		args = append(args, value)
		argCount++
	}

	setClauses = append(setClauses, fmt.Sprintf("updated_at = $%d", argCount))
	args = append(args, time.Now())
	argCount++

	setClauses = append(setClauses, fmt.Sprintf("version = version + 1"))

	args = append(args, id)

	query := fmt.Sprintf(`
		UPDATE tenant_members
		SET %s
		WHERE _id = $%d AND deleted_at IS NULL
		RETURNING _id`, strings.Join(setClauses, ", "), argCount)

	var updatedID uuid.UUID
	err := r.db.QueryRow(query, args...).Scan(&updatedID)
	if err != nil {
		return nil, err
	}

	return r.GetByID(updatedID)
}

// Delete soft deletes a tenant member
func (r *TenantMemberRepository) Delete(id uuid.UUID) error {
	query := `
		UPDATE tenant_members
		SET deleted_at = $1, updated_at = $1
		WHERE _id = $2 AND deleted_at IS NULL`

	result, err := r.db.Exec(query, time.Now(), id)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return fmt.Errorf("tenant member not found")
	}

	return nil
}

// UpdateStatus updates the status of a tenant member
func (r *TenantMemberRepository) UpdateStatus(id uuid.UUID, status string) error {
	query := `
		UPDATE tenant_members
		SET status = $1, updated_at = $2, version = version + 1
		WHERE _id = $3 AND deleted_at IS NULL`

	result, err := r.db.Exec(query, status, time.Now(), id)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return fmt.Errorf("tenant member not found")
	}

	return nil
}

// UpdateRole updates the role of a tenant member
func (r *TenantMemberRepository) UpdateRole(id uuid.UUID, role string) error {
	query := `
		UPDATE tenant_members
		SET role = $1, updated_at = $2, version = version + 1
		WHERE _id = $3 AND deleted_at IS NULL`

	result, err := r.db.Exec(query, role, time.Now(), id)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return fmt.Errorf("tenant member not found")
	}

	return nil
}

// GetActiveCount returns the count of active members in a tenant
func (r *TenantMemberRepository) GetActiveCount(tenantID uuid.UUID) (int, error) {
	var count int
	query := `
		SELECT COUNT(*)
		FROM tenant_members
		WHERE tenant_id = $1 AND status = 'ACTIVE' AND deleted_at IS NULL`

	err := r.db.Get(&count, query, tenantID)
	return count, err
}
