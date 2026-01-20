package repository

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"

	"golang-backend/internal/models"
)

type UserGroupRepository interface {
	Create(ctx context.Context, group *models.UserGroup) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.UserGroup, error)
	GetByCode(ctx context.Context, tenantID uuid.UUID, code string) (*models.UserGroup, error)
	List(ctx context.Context, page, pageSize int, tenantID *uuid.UUID, status *string) ([]*models.UserGroup, int, error)
	Update(ctx context.Context, group *models.UserGroup) error
	Delete(ctx context.Context, id uuid.UUID) error
	SoftDelete(ctx context.Context, id uuid.UUID, deletedBy string) error
	ListByTenantID(ctx context.Context, tenantID uuid.UUID) ([]*models.UserGroup, error)
	ListByStatus(ctx context.Context, tenantID uuid.UUID, status string) ([]*models.UserGroup, error)
	UpdateStatus(ctx context.Context, id uuid.UUID, status string) error
}

type userGroupRepository struct {
	db *sqlx.DB
}

func NewUserGroupRepository(db *sqlx.DB) UserGroupRepository {
	return &userGroupRepository{db: db}
}

func (r *userGroupRepository) Create(ctx context.Context, group *models.UserGroup) error {
	query := `
		INSERT INTO user_groups (
			_id, tenant_id, code, name, description, group_type, status,
			"order", metadata, created_at, updated_at, created_by, version
		) VALUES (
			:_id, :tenant_id, :code, :name, :description, :group_type, :status,
			:order, :metadata, :created_at, :updated_at, :created_by, :version
		)`

	_, err := r.db.NamedExecContext(ctx, query, group)
	return err
}

func (r *userGroupRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.UserGroup, error) {
	var group models.UserGroup
	query := `SELECT * FROM user_groups WHERE _id = $1 AND deleted_at IS NULL`

	err := r.db.GetContext(ctx, &group, query, id)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("user group not found")
	}
	return &group, err
}

func (r *userGroupRepository) GetByCode(ctx context.Context, tenantID uuid.UUID, code string) (*models.UserGroup, error) {
	var group models.UserGroup
	query := `SELECT * FROM user_groups WHERE tenant_id = $1 AND code = $2 AND deleted_at IS NULL`

	err := r.db.GetContext(ctx, &group, query, tenantID, code)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("user group not found")
	}
	return &group, err
}

func (r *userGroupRepository) List(ctx context.Context, page, pageSize int, tenantID *uuid.UUID, status *string) ([]*models.UserGroup, int, error) {
	var groups []*models.UserGroup
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

	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM user_groups %s", whereClause)
	err := r.db.GetContext(ctx, &total, countQuery, args...)
	if err != nil {
		return nil, 0, err
	}

	query := fmt.Sprintf(`
		SELECT * FROM user_groups %s
		ORDER BY "order" ASC, name ASC
		LIMIT $%d OFFSET $%d
	`, whereClause, argPos, argPos+1)

	args = append(args, pageSize, offset)
	err = r.db.SelectContext(ctx, &groups, query, args...)
	if err != nil {
		return nil, 0, err
	}

	return groups, total, nil
}

func (r *userGroupRepository) Update(ctx context.Context, group *models.UserGroup) error {
	query := `
		UPDATE user_groups SET
			name = :name,
			description = :description,
			group_type = :group_type,
			status = :status,
			"order" = :order,
			metadata = :metadata,
			updated_at = :updated_at,
			updated_by = :updated_by,
			version = version + 1
		WHERE _id = :_id AND version = :version AND deleted_at IS NULL`

	result, err := r.db.NamedExecContext(ctx, query, group)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return fmt.Errorf("user group not found or version mismatch")
	}

	return nil
}

func (r *userGroupRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM user_groups WHERE _id = $1`

	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return fmt.Errorf("user group not found")
	}

	return nil
}

func (r *userGroupRepository) SoftDelete(ctx context.Context, id uuid.UUID, deletedBy string) error {
	query := `
		UPDATE user_groups
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
		return fmt.Errorf("user group not found")
	}

	return nil
}

func (r *userGroupRepository) ListByTenantID(ctx context.Context, tenantID uuid.UUID) ([]*models.UserGroup, error) {
	var groups []*models.UserGroup
	query := `
		SELECT * FROM user_groups
		WHERE tenant_id = $1 AND deleted_at IS NULL
		ORDER BY "order" ASC, name ASC`

	err := r.db.SelectContext(ctx, &groups, query, tenantID)
	return groups, err
}

func (r *userGroupRepository) ListByStatus(ctx context.Context, tenantID uuid.UUID, status string) ([]*models.UserGroup, error) {
	var groups []*models.UserGroup
	query := `
		SELECT * FROM user_groups
		WHERE tenant_id = $1 AND status = $2 AND deleted_at IS NULL
		ORDER BY "order" ASC, name ASC`

	err := r.db.SelectContext(ctx, &groups, query, tenantID, status)
	return groups, err
}

func (r *userGroupRepository) UpdateStatus(ctx context.Context, id uuid.UUID, status string) error {
	query := `
		UPDATE user_groups
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
		return fmt.Errorf("user group not found")
	}

	return nil
}
