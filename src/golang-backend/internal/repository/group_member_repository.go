package repository

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"

	"golang-backend/internal/models"
)

type GroupMemberRepository interface {
	Create(ctx context.Context, member *models.GroupMember) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.GroupMember, error)
	List(ctx context.Context, page, pageSize int, tenantID, userGroupID, tenantMemberID *uuid.UUID) ([]*models.GroupMember, int, error)
	Update(ctx context.Context, member *models.GroupMember) error
	Delete(ctx context.Context, id uuid.UUID) error
	SoftDelete(ctx context.Context, id uuid.UUID, deletedBy string) error
	ListByUserGroupID(ctx context.Context, userGroupID uuid.UUID) ([]*models.GroupMember, error)
	ListByTenantMemberID(ctx context.Context, tenantMemberID uuid.UUID) ([]*models.GroupMember, error)
	GetByGroupAndMember(ctx context.Context, userGroupID, tenantMemberID uuid.UUID) (*models.GroupMember, error)
	RemoveFromGroup(ctx context.Context, id uuid.UUID) error
	GetActiveCount(ctx context.Context, userGroupID uuid.UUID) (int, error)
}

type groupMemberRepository struct {
	db *sqlx.DB
}

func NewGroupMemberRepository(db *sqlx.DB) GroupMemberRepository {
	return &groupMemberRepository{db: db}
}

func (r *groupMemberRepository) Create(ctx context.Context, member *models.GroupMember) error {
	query := `
		INSERT INTO group_members (
			_id, tenant_id, user_group_id, tenant_member_id, is_primary,
			role_in_group, joined_at, metadata, created_at, updated_at,
			created_by, version
		) VALUES (
			:_id, :tenant_id, :user_group_id, :tenant_member_id, :is_primary,
			:role_in_group, :joined_at, :metadata, :created_at, :updated_at,
			:created_by, :version
		)`

	_, err := r.db.NamedExecContext(ctx, query, member)
	return err
}

func (r *groupMemberRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.GroupMember, error) {
	var member models.GroupMember
	query := `SELECT * FROM group_members WHERE _id = $1 AND deleted_at IS NULL`

	err := r.db.GetContext(ctx, &member, query, id)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("group member not found")
	}
	return &member, err
}

func (r *groupMemberRepository) List(ctx context.Context, page, pageSize int, tenantID, userGroupID, tenantMemberID *uuid.UUID) ([]*models.GroupMember, int, error) {
	var members []*models.GroupMember
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

	if userGroupID != nil {
		whereClause += fmt.Sprintf(" AND user_group_id = $%d", argPos)
		args = append(args, *userGroupID)
		argPos++
	}

	if tenantMemberID != nil {
		whereClause += fmt.Sprintf(" AND tenant_member_id = $%d", argPos)
		args = append(args, *tenantMemberID)
		argPos++
	}

	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM group_members %s", whereClause)
	err := r.db.GetContext(ctx, &total, countQuery, args...)
	if err != nil {
		return nil, 0, err
	}

	query := fmt.Sprintf(`
		SELECT * FROM group_members %s
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

func (r *groupMemberRepository) Update(ctx context.Context, member *models.GroupMember) error {
	query := `
		UPDATE group_members SET
			is_primary = :is_primary,
			role_in_group = :role_in_group,
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
		return fmt.Errorf("group member not found or version mismatch")
	}

	return nil
}

func (r *groupMemberRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM group_members WHERE _id = $1`

	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return fmt.Errorf("group member not found")
	}

	return nil
}

func (r *groupMemberRepository) SoftDelete(ctx context.Context, id uuid.UUID, deletedBy string) error {
	query := `
		UPDATE group_members
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
		return fmt.Errorf("group member not found")
	}

	return nil
}

func (r *groupMemberRepository) ListByUserGroupID(ctx context.Context, userGroupID uuid.UUID) ([]*models.GroupMember, error) {
	var members []*models.GroupMember
	query := `
		SELECT * FROM group_members
		WHERE user_group_id = $1 AND deleted_at IS NULL AND left_at IS NULL
		ORDER BY joined_at DESC`

	err := r.db.SelectContext(ctx, &members, query, userGroupID)
	return members, err
}

func (r *groupMemberRepository) ListByTenantMemberID(ctx context.Context, tenantMemberID uuid.UUID) ([]*models.GroupMember, error) {
	var members []*models.GroupMember
	query := `
		SELECT * FROM group_members
		WHERE tenant_member_id = $1 AND deleted_at IS NULL AND left_at IS NULL
		ORDER BY joined_at DESC`

	err := r.db.SelectContext(ctx, &members, query, tenantMemberID)
	return members, err
}

func (r *groupMemberRepository) GetByGroupAndMember(ctx context.Context, userGroupID, tenantMemberID uuid.UUID) (*models.GroupMember, error) {
	var member models.GroupMember
	query := `
		SELECT * FROM group_members
		WHERE user_group_id = $1 AND tenant_member_id = $2 AND deleted_at IS NULL AND left_at IS NULL`

	err := r.db.GetContext(ctx, &member, query, userGroupID, tenantMemberID)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("group member not found")
	}
	return &member, err
}

func (r *groupMemberRepository) RemoveFromGroup(ctx context.Context, id uuid.UUID) error {
	query := `
		UPDATE group_members
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
		return fmt.Errorf("group member not found")
	}

	return nil
}

func (r *groupMemberRepository) GetActiveCount(ctx context.Context, userGroupID uuid.UUID) (int, error) {
	var count int
	query := `
		SELECT COUNT(*) FROM group_members
		WHERE user_group_id = $1 AND deleted_at IS NULL AND left_at IS NULL`

	err := r.db.GetContext(ctx, &count, query, userGroupID)
	return count, err
}
