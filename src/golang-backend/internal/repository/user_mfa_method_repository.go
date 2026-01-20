package repository

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"

	"golang-backend/internal/models"
)

type UserMFAMethodRepository interface {
	Create(ctx context.Context, method *models.UserMFAMethod) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.UserMFAMethod, error)
	List(ctx context.Context, page, pageSize int, userID *uuid.UUID, methodType, status *string) ([]*models.UserMFAMethod, int, error)
	Update(ctx context.Context, method *models.UserMFAMethod) error
	Delete(ctx context.Context, id uuid.UUID) error
	ListByUserID(ctx context.Context, userID uuid.UUID) ([]*models.UserMFAMethod, error)
	GetPrimaryMethod(ctx context.Context, userID uuid.UUID) (*models.UserMFAMethod, error)
	UpdateStatus(ctx context.Context, id uuid.UUID, status string) error
	UpdateVerificationStatus(ctx context.Context, id uuid.UUID, isVerified bool) error
	SetPrimary(ctx context.Context, userID, methodID uuid.UUID) error
	UpdateUsageStats(ctx context.Context, id uuid.UUID, success bool) error
}

type userMFAMethodRepository struct {
	db *sqlx.DB
}

func NewUserMFAMethodRepository(db *sqlx.DB) UserMFAMethodRepository {
	return &userMFAMethodRepository{db: db}
}

func (r *userMFAMethodRepository) Create(ctx context.Context, method *models.UserMFAMethod) error {
	query := `
		INSERT INTO user_mfa_methods (
			_id, user_id, method_type, method_name, sms_phone_number, sms_phone_verified,
			email_address, email_verified, status, is_verified, is_primary, is_enforced,
			success_count, failure_count, device_name, device_type,
			backup_codes_used, backup_codes_total, totp_secret_encrypted,
			totp_backup_codes_encrypted, backup_codes_encrypted, metadata,
			created_at, updated_at, created_by, version
		) VALUES (
			:_id, :user_id, :method_type, :method_name, :sms_phone_number, :sms_phone_verified,
			:email_address, :email_verified, :status, :is_verified, :is_primary, :is_enforced,
			:success_count, :failure_count, :device_name, :device_type,
			:backup_codes_used, :backup_codes_total, :totp_secret_encrypted,
			:totp_backup_codes_encrypted, :backup_codes_encrypted, :metadata,
			:created_at, :updated_at, :created_by, :version
		)`

	_, err := r.db.NamedExecContext(ctx, query, method)
	return err
}

func (r *userMFAMethodRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.UserMFAMethod, error) {
	var method models.UserMFAMethod
	query := `SELECT * FROM user_mfa_methods WHERE _id = $1 AND deleted_at IS NULL`

	err := r.db.GetContext(ctx, &method, query, id)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("MFA method not found")
	}
	return &method, err
}

func (r *userMFAMethodRepository) List(ctx context.Context, page, pageSize int, userID *uuid.UUID, methodType, status *string) ([]*models.UserMFAMethod, int, error) {
	var methods []*models.UserMFAMethod
	var total int

	offset := (page - 1) * pageSize

	whereClause := "WHERE deleted_at IS NULL"
	args := []interface{}{}
	argPos := 1

	if userID != nil {
		whereClause += fmt.Sprintf(" AND user_id = $%d", argPos)
		args = append(args, *userID)
		argPos++
	}

	if methodType != nil {
		whereClause += fmt.Sprintf(" AND method_type = $%d", argPos)
		args = append(args, *methodType)
		argPos++
	}

	if status != nil {
		whereClause += fmt.Sprintf(" AND status = $%d", argPos)
		args = append(args, *status)
		argPos++
	}

	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM user_mfa_methods %s", whereClause)
	err := r.db.GetContext(ctx, &total, countQuery, args...)
	if err != nil {
		return nil, 0, err
	}

	query := fmt.Sprintf(`
		SELECT * FROM user_mfa_methods %s
		ORDER BY is_primary DESC, created_at DESC
		LIMIT $%d OFFSET $%d
	`, whereClause, argPos, argPos+1)

	args = append(args, pageSize, offset)
	err = r.db.SelectContext(ctx, &methods, query, args...)
	if err != nil {
		return nil, 0, err
	}

	return methods, total, nil
}

func (r *userMFAMethodRepository) Update(ctx context.Context, method *models.UserMFAMethod) error {
	query := `
		UPDATE user_mfa_methods SET
			method_name = :method_name,
			status = :status,
			is_primary = :is_primary,
			is_enforced = :is_enforced,
			sms_phone_number = :sms_phone_number,
			sms_phone_verified = :sms_phone_verified,
			email_address = :email_address,
			email_verified = :email_verified,
			updated_at = :updated_at,
			updated_by = :updated_by,
			version = version + 1
		WHERE _id = :_id AND version = :version AND deleted_at IS NULL`

	result, err := r.db.NamedExecContext(ctx, query, method)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return fmt.Errorf("MFA method not found or version mismatch")
	}

	return nil
}

func (r *userMFAMethodRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `UPDATE user_mfa_methods SET deleted_at = NOW() WHERE _id = $1 AND deleted_at IS NULL`

	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return fmt.Errorf("MFA method not found")
	}

	return nil
}

func (r *userMFAMethodRepository) ListByUserID(ctx context.Context, userID uuid.UUID) ([]*models.UserMFAMethod, error) {
	var methods []*models.UserMFAMethod
	query := `
		SELECT * FROM user_mfa_methods
		WHERE user_id = $1 AND deleted_at IS NULL
		ORDER BY is_primary DESC, created_at DESC`

	err := r.db.SelectContext(ctx, &methods, query, userID)
	return methods, err
}

func (r *userMFAMethodRepository) GetPrimaryMethod(ctx context.Context, userID uuid.UUID) (*models.UserMFAMethod, error) {
	var method models.UserMFAMethod
	query := `
		SELECT * FROM user_mfa_methods
		WHERE user_id = $1 AND is_primary = true AND status = 'ACTIVE' AND deleted_at IS NULL
		LIMIT 1`

	err := r.db.GetContext(ctx, &method, query, userID)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("no primary MFA method found")
	}
	return &method, err
}

func (r *userMFAMethodRepository) UpdateStatus(ctx context.Context, id uuid.UUID, status string) error {
	query := `
		UPDATE user_mfa_methods
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
		return fmt.Errorf("MFA method not found")
	}

	return nil
}

func (r *userMFAMethodRepository) UpdateVerificationStatus(ctx context.Context, id uuid.UUID, isVerified bool) error {
	query := `
		UPDATE user_mfa_methods
		SET is_verified = $1, last_verified_at = NOW(), updated_at = NOW(), version = version + 1
		WHERE _id = $2 AND deleted_at IS NULL`

	result, err := r.db.ExecContext(ctx, query, isVerified, id)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return fmt.Errorf("MFA method not found")
	}

	return nil
}

func (r *userMFAMethodRepository) SetPrimary(ctx context.Context, userID, methodID uuid.UUID) error {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Unset all primary flags for user
	_, err = tx.ExecContext(ctx, `
		UPDATE user_mfa_methods
		SET is_primary = false, updated_at = NOW()
		WHERE user_id = $1 AND deleted_at IS NULL
	`, userID)
	if err != nil {
		return err
	}

	// Set new primary
	result, err := tx.ExecContext(ctx, `
		UPDATE user_mfa_methods
		SET is_primary = true, updated_at = NOW(), version = version + 1
		WHERE _id = $1 AND user_id = $2 AND deleted_at IS NULL
	`, methodID, userID)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return fmt.Errorf("MFA method not found")
	}

	return tx.Commit()
}

func (r *userMFAMethodRepository) UpdateUsageStats(ctx context.Context, id uuid.UUID, success bool) error {
	var query string
	if success {
		query = `
			UPDATE user_mfa_methods
			SET success_count = success_count + 1,
			    last_used_at = NOW(),
			    updated_at = NOW()
			WHERE _id = $1 AND deleted_at IS NULL`
	} else {
		query = `
			UPDATE user_mfa_methods
			SET failure_count = failure_count + 1,
			    updated_at = NOW()
			WHERE _id = $1 AND deleted_at IS NULL`
	}

	_, err := r.db.ExecContext(ctx, query, id)
	return err
}
