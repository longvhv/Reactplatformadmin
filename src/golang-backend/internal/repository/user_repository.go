package repository

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/vhv-platform/backend/internal/models"
)

// UserRepository handles database operations for users
type UserRepository struct {
	db *sql.DB
}

// NewUserRepository creates a new user repository
func NewUserRepository(db *sql.DB) *UserRepository {
	return &UserRepository{db: db}
}

// GetAll retrieves all users with optional filters
func (r *UserRepository) GetAll(ctx context.Context, filters models.UserFilters) ([]models.User, error) {
	query := `
		SELECT _id, email, phone_number, full_name, avatar_url, status,
		       is_support_staff, mfa_enabled, locale, metadata,
		       created_at, updated_at, created_by, updated_by, version
		FROM users
		WHERE deleted_at IS NULL
	`

	var args []interface{}
	argIndex := 1

	// Apply filters
	if filters.Status != nil {
		query += fmt.Sprintf(" AND status = $%d", argIndex)
		args = append(args, *filters.Status)
		argIndex++
	}

	if filters.IsSupportStaff != nil {
		query += fmt.Sprintf(" AND is_support_staff = $%d", argIndex)
		args = append(args, *filters.IsSupportStaff)
		argIndex++
	}

	if filters.MFAEnabled != nil {
		query += fmt.Sprintf(" AND mfa_enabled = $%d", argIndex)
		args = append(args, *filters.MFAEnabled)
		argIndex++
	}

	if filters.Locale != nil && *filters.Locale != "" {
		query += fmt.Sprintf(" AND locale = $%d", argIndex)
		args = append(args, *filters.Locale)
		argIndex++
	}

	if filters.Search != nil && *filters.Search != "" {
		query += fmt.Sprintf(" AND (full_name ILIKE $%d OR email ILIKE $%d)", argIndex, argIndex)
		searchTerm := "%" + *filters.Search + "%"
		args = append(args, searchTerm)
		argIndex++
	}

	query += " ORDER BY created_at DESC"

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query users: %w", err)
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var user models.User
		var metadataJSON []byte

		err := rows.Scan(
			&user.ID,
			&user.Email,
			&user.PhoneNumber,
			&user.FullName,
			&user.AvatarURL,
			&user.Status,
			&user.IsSupportStaff,
			&user.MFAEnabled,
			&user.Locale,
			&metadataJSON,
			&user.CreatedAt,
			&user.UpdatedAt,
			&user.CreatedBy,
			&user.UpdatedBy,
			&user.Version,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan user: %w", err)
		}

		// Parse metadata JSON
		if metadataJSON != nil {
			if err := json.Unmarshal(metadataJSON, &user.Metadata); err != nil {
				return nil, fmt.Errorf("failed to parse metadata: %w", err)
			}
		}

		users = append(users, user)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating users: %w", err)
	}

	return users, nil
}

// GetByID retrieves a user by ID
func (r *UserRepository) GetByID(ctx context.Context, id string) (*models.User, error) {
	query := `
		SELECT _id, email, phone_number, full_name, avatar_url, status,
		       is_support_staff, mfa_enabled, locale, metadata,
		       created_at, updated_at, created_by, updated_by, version
		FROM users
		WHERE _id = $1 AND deleted_at IS NULL
	`

	var user models.User
	var metadataJSON []byte

	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&user.ID,
		&user.Email,
		&user.PhoneNumber,
		&user.FullName,
		&user.AvatarURL,
		&user.Status,
		&user.IsSupportStaff,
		&user.MFAEnabled,
		&user.Locale,
		&metadataJSON,
		&user.CreatedAt,
		&user.UpdatedAt,
		&user.CreatedBy,
		&user.UpdatedBy,
		&user.Version,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("user not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	// Parse metadata JSON
	if metadataJSON != nil {
		if err := json.Unmarshal(metadataJSON, &user.Metadata); err != nil {
			return nil, fmt.Errorf("failed to parse metadata: %w", err)
		}
	}

	return &user, nil
}

// GetByEmail retrieves a user by email
func (r *UserRepository) GetByEmail(ctx context.Context, email string) (*models.User, error) {
	query := `
		SELECT _id, email, phone_number, full_name, avatar_url, status,
		       is_support_staff, mfa_enabled, locale, metadata,
		       created_at, updated_at, created_by, updated_by, version
		FROM users
		WHERE email = $1 AND deleted_at IS NULL
	`

	var user models.User
	var metadataJSON []byte

	err := r.db.QueryRowContext(ctx, query, email).Scan(
		&user.ID,
		&user.Email,
		&user.PhoneNumber,
		&user.FullName,
		&user.AvatarURL,
		&user.Status,
		&user.IsSupportStaff,
		&user.MFAEnabled,
		&user.Locale,
		&metadataJSON,
		&user.CreatedAt,
		&user.UpdatedAt,
		&user.CreatedBy,
		&user.UpdatedBy,
		&user.Version,
	)

	if err == sql.ErrNoRows {
		return nil, nil // Email not found is not an error
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get user by email: %w", err)
	}

	// Parse metadata JSON
	if metadataJSON != nil {
		if err := json.Unmarshal(metadataJSON, &user.Metadata); err != nil {
			return nil, fmt.Errorf("failed to parse metadata: %w", err)
		}
	}

	return &user, nil
}

// Create creates a new user
func (r *UserRepository) Create(ctx context.Context, req models.CreateUserRequest) (*models.User, error) {
	// Set default status if not provided
	status := req.Status
	if status == "" {
		status = models.UserStatusActive
	}

	// Set default locale if not provided
	locale := req.Locale
	if locale == "" {
		locale = "vi"
	}

	// Convert metadata to JSON
	var metadataJSON []byte
	if req.Metadata != nil {
		var err error
		metadataJSON, err = json.Marshal(req.Metadata)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal metadata: %w", err)
		}
	}

	query := `
		INSERT INTO users (email, phone_number, full_name, avatar_url, status,
		                   is_support_staff, mfa_enabled, locale, metadata)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING _id, created_at, updated_at, version
	`

	var user models.User
	user.Email = req.Email
	user.PhoneNumber = req.PhoneNumber
	user.FullName = req.FullName
	user.AvatarURL = req.AvatarURL
	user.Status = status
	user.IsSupportStaff = req.IsSupportStaff
	user.MFAEnabled = req.MFAEnabled
	user.Locale = locale
	user.Metadata = req.Metadata

	err := r.db.QueryRowContext(
		ctx, query,
		req.Email,
		req.PhoneNumber,
		req.FullName,
		req.AvatarURL,
		status,
		req.IsSupportStaff,
		req.MFAEnabled,
		locale,
		metadataJSON,
	).Scan(&user.ID, &user.CreatedAt, &user.UpdatedAt, &user.Version)

	if err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	return &user, nil
}

// Update updates a user
func (r *UserRepository) Update(ctx context.Context, id string, req models.UpdateUserRequest) (*models.User, error) {
	// Build dynamic update query
	sets := []string{}
	args := []interface{}{}
	argIndex := 1

	if req.PhoneNumber != nil {
		sets = append(sets, fmt.Sprintf("phone_number = $%d", argIndex))
		args = append(args, *req.PhoneNumber)
		argIndex++
	}

	if req.FullName != nil {
		sets = append(sets, fmt.Sprintf("full_name = $%d", argIndex))
		args = append(args, *req.FullName)
		argIndex++
	}

	if req.AvatarURL != nil {
		sets = append(sets, fmt.Sprintf("avatar_url = $%d", argIndex))
		args = append(args, *req.AvatarURL)
		argIndex++
	}

	if req.Status != nil {
		sets = append(sets, fmt.Sprintf("status = $%d", argIndex))
		args = append(args, *req.Status)
		argIndex++
	}

	if req.IsSupportStaff != nil {
		sets = append(sets, fmt.Sprintf("is_support_staff = $%d", argIndex))
		args = append(args, *req.IsSupportStaff)
		argIndex++
	}

	if req.MFAEnabled != nil {
		sets = append(sets, fmt.Sprintf("mfa_enabled = $%d", argIndex))
		args = append(args, *req.MFAEnabled)
		argIndex++
	}

	if req.Locale != nil {
		sets = append(sets, fmt.Sprintf("locale = $%d", argIndex))
		args = append(args, *req.Locale)
		argIndex++
	}

	if req.Metadata != nil {
		metadataJSON, err := json.Marshal(req.Metadata)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal metadata: %w", err)
		}
		sets = append(sets, fmt.Sprintf("metadata = $%d", argIndex))
		args = append(args, metadataJSON)
		argIndex++
	}

	if len(sets) == 0 {
		return nil, fmt.Errorf("no fields to update")
	}

	// Always update timestamp and version
	sets = append(sets, "updated_at = NOW()", "version = version + 1")

	// Add ID to args
	args = append(args, id)

	query := fmt.Sprintf(`
		UPDATE users
		SET %s
		WHERE _id = $%d AND deleted_at IS NULL
		RETURNING _id, email, phone_number, full_name, avatar_url, status,
		          is_support_staff, mfa_enabled, locale, metadata,
		          created_at, updated_at, created_by, updated_by, version
	`, strings.Join(sets, ", "), argIndex)

	var user models.User
	var metadataJSON []byte

	err := r.db.QueryRowContext(ctx, query, args...).Scan(
		&user.ID,
		&user.Email,
		&user.PhoneNumber,
		&user.FullName,
		&user.AvatarURL,
		&user.Status,
		&user.IsSupportStaff,
		&user.MFAEnabled,
		&user.Locale,
		&metadataJSON,
		&user.CreatedAt,
		&user.UpdatedAt,
		&user.CreatedBy,
		&user.UpdatedBy,
		&user.Version,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("user not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to update user: %w", err)
	}

	// Parse metadata JSON
	if metadataJSON != nil {
		if err := json.Unmarshal(metadataJSON, &user.Metadata); err != nil {
			return nil, fmt.Errorf("failed to parse metadata: %w", err)
		}
	}

	return &user, nil
}

// Delete soft deletes a user
func (r *UserRepository) Delete(ctx context.Context, id string) error {
	query := `
		UPDATE users
		SET deleted_at = NOW()
		WHERE _id = $1 AND deleted_at IS NULL
	`

	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete user: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("user not found")
	}

	return nil
}
