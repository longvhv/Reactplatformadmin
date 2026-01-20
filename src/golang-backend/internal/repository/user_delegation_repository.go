package repository

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"

	"golang-backend/internal/models"
)

type UserDelegationRepository interface {
	Create(ctx context.Context, delegation *models.UserDelegation) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.UserDelegation, error)
	List(ctx context.Context, page, pageSize int, delegatorID, delegateID, tenantID *uuid.UUID, status *string) ([]*models.UserDelegation, int, error)
	Update(ctx context.Context, delegation *models.UserDelegation) error
	Delete(ctx context.Context, id uuid.UUID) error
	ListByDelegator(ctx context.Context, delegatorID uuid.UUID) ([]*models.UserDelegation, error)
	ListByDelegate(ctx context.Context, delegateID uuid.UUID) ([]*models.UserDelegation, error)
	ListByTenant(ctx context.Context, tenantID uuid.UUID) ([]*models.UserDelegation, error)
	Activate(ctx context.Context, id uuid.UUID) error
	Revoke(ctx context.Context, id uuid.UUID, revokedBy uuid.UUID, reason string) error
	Suspend(ctx context.Context, id uuid.UUID) error
	GetActiveDelegations(ctx context.Context, delegatorID uuid.UUID) ([]*models.UserDelegation, error)
	ExpireOldDelegations(ctx context.Context) error
}

type userDelegationRepository struct {
	db *sqlx.DB
}

func NewUserDelegationRepository(db *sqlx.DB) UserDelegationRepository {
	return &userDelegationRepository{db: db}
}

func (r *userDelegationRepository) Create(ctx context.Context, delegation *models.UserDelegation) error {
	query := `
		INSERT INTO user_delegations (
			_id, delegator_id, delegate_id, tenant_id, scope, permissions,
			reason, notes, start_date, end_date, status, auto_expire,
			notified_before_expiry, metadata, created_at, updated_at
		) VALUES (
			:_id, :delegator_id, :delegate_id, :tenant_id, :scope, :permissions,
			:reason, :notes, :start_date, :end_date, :status, :auto_expire,
			:notified_before_expiry, :metadata, :created_at, :updated_at
		)`

	_, err := r.db.NamedExecContext(ctx, query, delegation)
	return err
}

func (r *userDelegationRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.UserDelegation, error) {
	var delegation models.UserDelegation
	query := `SELECT * FROM user_delegations WHERE _id = $1`

	err := r.db.GetContext(ctx, &delegation, query, id)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("delegation not found")
	}
	return &delegation, err
}

func (r *userDelegationRepository) List(ctx context.Context, page, pageSize int, delegatorID, delegateID, tenantID *uuid.UUID, status *string) ([]*models.UserDelegation, int, error) {
	var delegations []*models.UserDelegation
	var total int

	offset := (page - 1) * pageSize

	whereClause := "WHERE 1=1"
	args := []interface{}{}
	argPos := 1

	if delegatorID != nil {
		whereClause += fmt.Sprintf(" AND delegator_id = $%d", argPos)
		args = append(args, *delegatorID)
		argPos++
	}

	if delegateID != nil {
		whereClause += fmt.Sprintf(" AND delegate_id = $%d", argPos)
		args = append(args, *delegateID)
		argPos++
	}

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

	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM user_delegations %s", whereClause)
	err := r.db.GetContext(ctx, &total, countQuery, args...)
	if err != nil {
		return nil, 0, err
	}

	query := fmt.Sprintf(`
		SELECT * FROM user_delegations %s
		ORDER BY created_at DESC
		LIMIT $%d OFFSET $%d
	`, whereClause, argPos, argPos+1)

	args = append(args, pageSize, offset)
	err = r.db.SelectContext(ctx, &delegations, query, args...)
	if err != nil {
		return nil, 0, err
	}

	return delegations, total, nil
}

func (r *userDelegationRepository) Update(ctx context.Context, delegation *models.UserDelegation) error {
	query := `
		UPDATE user_delegations SET
			scope = :scope,
			permissions = :permissions,
			reason = :reason,
			notes = :notes,
			end_date = :end_date,
			auto_expire = :auto_expire,
			metadata = :metadata,
			updated_at = :updated_at
		WHERE _id = :_id`

	result, err := r.db.NamedExecContext(ctx, query, delegation)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return fmt.Errorf("delegation not found")
	}

	return nil
}

func (r *userDelegationRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM user_delegations WHERE _id = $1`

	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return fmt.Errorf("delegation not found")
	}

	return nil
}

func (r *userDelegationRepository) ListByDelegator(ctx context.Context, delegatorID uuid.UUID) ([]*models.UserDelegation, error) {
	var delegations []*models.UserDelegation
	query := `
		SELECT * FROM user_delegations
		WHERE delegator_id = $1
		ORDER BY created_at DESC`

	err := r.db.SelectContext(ctx, &delegations, query, delegatorID)
	return delegations, err
}

func (r *userDelegationRepository) ListByDelegate(ctx context.Context, delegateID uuid.UUID) ([]*models.UserDelegation, error) {
	var delegations []*models.UserDelegation
	query := `
		SELECT * FROM user_delegations
		WHERE delegate_id = $1
		ORDER BY created_at DESC`

	err := r.db.SelectContext(ctx, &delegations, query, delegateID)
	return delegations, err
}

func (r *userDelegationRepository) ListByTenant(ctx context.Context, tenantID uuid.UUID) ([]*models.UserDelegation, error) {
	var delegations []*models.UserDelegation
	query := `
		SELECT * FROM user_delegations
		WHERE tenant_id = $1
		ORDER BY created_at DESC`

	err := r.db.SelectContext(ctx, &delegations, query, tenantID)
	return delegations, err
}

func (r *userDelegationRepository) Activate(ctx context.Context, id uuid.UUID) error {
	query := `
		UPDATE user_delegations
		SET status = 'active', activated_at = NOW(), updated_at = NOW()
		WHERE _id = $1`

	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return fmt.Errorf("delegation not found")
	}

	return nil
}

func (r *userDelegationRepository) Revoke(ctx context.Context, id uuid.UUID, revokedBy uuid.UUID, reason string) error {
	query := `
		UPDATE user_delegations
		SET status = 'revoked',
		    revoked_at = NOW(),
		    revoked_by = $1,
		    revoked_reason = $2,
		    updated_at = NOW()
		WHERE _id = $3`

	result, err := r.db.ExecContext(ctx, query, revokedBy, reason, id)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return fmt.Errorf("delegation not found")
	}

	return nil
}

func (r *userDelegationRepository) Suspend(ctx context.Context, id uuid.UUID) error {
	query := `
		UPDATE user_delegations
		SET status = 'suspended', updated_at = NOW()
		WHERE _id = $1`

	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return fmt.Errorf("delegation not found")
	}

	return nil
}

func (r *userDelegationRepository) GetActiveDelegations(ctx context.Context, delegatorID uuid.UUID) ([]*models.UserDelegation, error) {
	var delegations []*models.UserDelegation
	query := `
		SELECT * FROM user_delegations
		WHERE delegator_id = $1
		  AND status = 'active'
		  AND (end_date IS NULL OR end_date > NOW())
		ORDER BY created_at DESC`

	err := r.db.SelectContext(ctx, &delegations, query, delegatorID)
	return delegations, err
}

func (r *userDelegationRepository) ExpireOldDelegations(ctx context.Context) error {
	query := `
		UPDATE user_delegations
		SET status = 'expired', updated_at = NOW()
		WHERE status IN ('pending', 'active')
		  AND end_date IS NOT NULL
		  AND end_date < NOW()
		  AND auto_expire = true`

	_, err := r.db.ExecContext(ctx, query)
	return err
}
