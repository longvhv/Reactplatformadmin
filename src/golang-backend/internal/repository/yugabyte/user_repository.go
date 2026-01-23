package yugabyte

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/google/uuid"
	"github.com/vhv-platform/backend/internal/models"
	"github.com/vhv-platform/backend/internal/repository"
)

type userRepository struct {
	db *sql.DB
}

// NewUserRepository creates a new user repository
func NewUserRepository(db *sql.DB) repository.UserRepository {
	return &userRepository{db: db}
}

func (r *userRepository) Create(ctx context.Context, user *models.User) error {
	query := `
		INSERT INTO users (
			_id, email, password_hash, display_name, first_name, last_name,
			phone_number, avatar_url, email_verified, phone_verified, is_active,
			is_super_admin, mfa_enabled, preferred_language, timezone,
			created_at, updated_at, version
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
		)`

	_, err := r.db.ExecContext(ctx, query,
		user.ID, user.Email, user.PasswordHash, user.DisplayName, user.FirstName,
		user.LastName, user.PhoneNumber, user.AvatarURL, user.EmailVerified,
		user.PhoneVerified, user.IsActive, user.IsSuperAdmin, user.MFAEnabled,
		user.PreferredLanguage, user.Timezone, user.CreatedAt, user.UpdatedAt, user.Version,
	)

	if err != nil {
		return fmt.Errorf("failed to create user: %w", err)
	}

	return nil
}

func (r *userRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.User, error) {
	query := `
		SELECT _id, email, password_hash, display_name, first_name, last_name,
			phone_number, avatar_url, email_verified, email_verified_at, phone_verified,
			phone_verified_at, is_active, is_super_admin, last_login_at, last_login_ip,
			failed_login_attempts, locked_until, password_changed_at, must_change_password,
			mfa_enabled, mfa_secret, preferred_language, timezone, metadata,
			supabase_uid, external_provider, external_provider_id,
			created_at, updated_at, created_by, updated_by, deleted_at, deleted_by, version
		FROM users
		WHERE _id = $1 AND deleted_at IS NULL`

	user := &models.User{}
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&user.ID, &user.Email, &user.PasswordHash, &user.DisplayName, &user.FirstName,
		&user.LastName, &user.PhoneNumber, &user.AvatarURL, &user.EmailVerified,
		&user.EmailVerifiedAt, &user.PhoneVerified, &user.PhoneVerifiedAt,
		&user.IsActive, &user.IsSuperAdmin, &user.LastLoginAt, &user.LastLoginIP,
		&user.FailedLoginAttempts, &user.LockedUntil, &user.PasswordChangedAt,
		&user.MustChangePassword, &user.MFAEnabled, &user.MFASecret,
		&user.PreferredLanguage, &user.Timezone, &user.Metadata,
		&user.SupabaseUID, &user.ExternalProvider, &user.ExternalProviderID,
		&user.CreatedAt, &user.UpdatedAt, &user.CreatedBy, &user.UpdatedBy,
		&user.DeletedAt, &user.DeletedBy, &user.Version,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("user not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	return user, nil
}

func (r *userRepository) GetByEmail(ctx context.Context, email string) (*models.User, error) {
	query := `
		SELECT _id, email, password_hash, display_name, first_name, last_name,
			phone_number, avatar_url, email_verified, email_verified_at, phone_verified,
			phone_verified_at, is_active, is_super_admin, last_login_at, last_login_ip,
			failed_login_attempts, locked_until, password_changed_at, must_change_password,
			mfa_enabled, mfa_secret, preferred_language, timezone, metadata,
			supabase_uid, external_provider, external_provider_id,
			created_at, updated_at, created_by, updated_by, deleted_at, deleted_by, version
		FROM users
		WHERE email = $1 AND deleted_at IS NULL`

	user := &models.User{}
	err := r.db.QueryRowContext(ctx, query, email).Scan(
		&user.ID, &user.Email, &user.PasswordHash, &user.DisplayName, &user.FirstName,
		&user.LastName, &user.PhoneNumber, &user.AvatarURL, &user.EmailVerified,
		&user.EmailVerifiedAt, &user.PhoneVerified, &user.PhoneVerifiedAt,
		&user.IsActive, &user.IsSuperAdmin, &user.LastLoginAt, &user.LastLoginIP,
		&user.FailedLoginAttempts, &user.LockedUntil, &user.PasswordChangedAt,
		&user.MustChangePassword, &user.MFAEnabled, &user.MFASecret,
		&user.PreferredLanguage, &user.Timezone, &user.Metadata,
		&user.SupabaseUID, &user.ExternalProvider, &user.ExternalProviderID,
		&user.CreatedAt, &user.UpdatedAt, &user.CreatedBy, &user.UpdatedBy,
		&user.DeletedAt, &user.DeletedBy, &user.Version,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("user not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	return user, nil
}

func (r *userRepository) Update(ctx context.Context, user *models.User) error {
	query := `
		UPDATE users SET
			email = $2, display_name = $3, first_name = $4, last_name = $5,
			phone_number = $6, avatar_url = $7, email_verified = $8, phone_verified = $9,
			is_active = $10, is_super_admin = $11, last_login_at = $12, last_login_ip = $13,
			failed_login_attempts = $14, locked_until = $15, mfa_enabled = $16,
			preferred_language = $17, timezone = $18, metadata = $19,
			updated_at = $20, updated_by = $21, version = version + 1
		WHERE _id = $1 AND deleted_at IS NULL`

	result, err := r.db.ExecContext(ctx, query,
		user.ID, user.Email, user.DisplayName, user.FirstName, user.LastName,
		user.PhoneNumber, user.AvatarURL, user.EmailVerified, user.PhoneVerified,
		user.IsActive, user.IsSuperAdmin, user.LastLoginAt, user.LastLoginIP,
		user.FailedLoginAttempts, user.LockedUntil, user.MFAEnabled,
		user.PreferredLanguage, user.Timezone, user.Metadata,
		user.UpdatedAt, user.UpdatedBy,
	)

	if err != nil {
		return fmt.Errorf("failed to update user: %w", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	if rows == 0 {
		return fmt.Errorf("user not found")
	}

	return nil
}

func (r *userRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `
		UPDATE users SET
			deleted_at = NOW(),
			updated_at = NOW()
		WHERE _id = $1 AND deleted_at IS NULL`

	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete user: %w", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	if rows == 0 {
		return fmt.Errorf("user not found")
	}

	return nil
}

func (r *userRepository) List(ctx context.Context, filter models.UserListFilter) ([]*models.User, int, error) {
	// Build WHERE clause
	where := "deleted_at IS NULL"
	args := []interface{}{}
	argCount := 1

	if filter.Email != nil {
		where += fmt.Sprintf(" AND email = $%d", argCount)
		args = append(args, *filter.Email)
		argCount++
	}

	if filter.IsActive != nil {
		where += fmt.Sprintf(" AND is_active = $%d", argCount)
		args = append(args, *filter.IsActive)
		argCount++
	}

	if filter.Search != nil && *filter.Search != "" {
		where += fmt.Sprintf(" AND (email ILIKE $%d OR display_name ILIKE $%d OR first_name ILIKE $%d OR last_name ILIKE $%d)", argCount, argCount, argCount, argCount)
		args = append(args, "%"+*filter.Search+"%")
		argCount++
	}

	// Count total
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM users WHERE %s", where)
	var total int
	err := r.db.QueryRowContext(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count users: %w", err)
	}

	// Get data
	sortBy := "created_at"
	if filter.SortBy != "" {
		sortBy = filter.SortBy
	}
	sortOrder := "DESC"
	if filter.SortOrder != "" {
		sortOrder = filter.SortOrder
	}

	offset := (filter.Page - 1) * filter.Limit
	query := fmt.Sprintf(`
		SELECT _id, email, display_name, first_name, last_name, phone_number,
			avatar_url, email_verified, phone_verified, is_active, is_super_admin,
			mfa_enabled, preferred_language, timezone,
			created_at, updated_at, version
		FROM users
		WHERE %s
		ORDER BY %s %s
		LIMIT $%d OFFSET $%d`,
		where, sortBy, sortOrder, argCount, argCount+1)

	args = append(args, filter.Limit, offset)

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to list users: %w", err)
	}
	defer rows.Close()

	users := []*models.User{}
	for rows.Next() {
		user := &models.User{}
		err := rows.Scan(
			&user.ID, &user.Email, &user.DisplayName, &user.FirstName, &user.LastName,
			&user.PhoneNumber, &user.AvatarURL, &user.EmailVerified, &user.PhoneVerified,
			&user.IsActive, &user.IsSuperAdmin, &user.MFAEnabled,
			&user.PreferredLanguage, &user.Timezone,
			&user.CreatedAt, &user.UpdatedAt, &user.Version,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan user: %w", err)
		}
		users = append(users, user)
	}

	return users, total, nil
}

func (r *userRepository) Exists(ctx context.Context, email string) (bool, error) {
	query := `SELECT EXISTS(SELECT 1 FROM users WHERE email = $1 AND deleted_at IS NULL)`
	var exists bool
	err := r.db.QueryRowContext(ctx, query, email).Scan(&exists)
	return exists, err
}
