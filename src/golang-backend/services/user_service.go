package services

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"regexp"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/lib/pq"
	"golang.org/x/crypto/bcrypt"

	"vhvplatform/models"
)

// ============================================================================
// USER SERVICE - Business Logic Layer
// ============================================================================

var (
	// Validation errors
	ErrInvalidEmail      = errors.New("invalid email format")
	ErrInvalidPassword   = errors.New("password must be at least 8 characters")
	ErrEmailExists       = errors.New("email already exists")
	ErrPhoneExists       = errors.New("phone number already exists")
	ErrUserNotFound      = errors.New("user not found")
	ErrInvalidCredentials = errors.New("invalid email or password")
	ErrUserBanned        = errors.New("user is banned")
	ErrUserDisabled      = errors.New("user is disabled")
	ErrUserNotVerified   = errors.New("user email not verified")
	ErrInvalidMFACode    = errors.New("invalid MFA code")
	ErrMFANotEnabled     = errors.New("MFA not enabled for this user")

	// Email regex for validation
	emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
)

// UserService handles user business logic
type UserService struct {
	db *sql.DB
}

// NewUserService creates a new user service instance
func NewUserService(db *sql.DB) *UserService {
	return &UserService{db: db}
}

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

// GetUserByID retrieves a user by ID
func (s *UserService) GetUserByID(id string) (*models.User, error) {
	// Validate UUID
	if _, err := uuid.Parse(id); err != nil {
		return nil, fmt.Errorf("invalid user ID format: %w", err)
	}

	query := `
		SELECT 
			_id, email, password_hash, full_name, avatar_url, phone_number,
			status, is_support_staff, mfa_enabled, mfa_secret, is_verified,
			locale, metadata,
			created_at, updated_at, deleted_at
		FROM users
		WHERE _id = $1 AND deleted_at IS NULL
	`

	var u models.User
	var metadataJSON []byte

	err := s.db.QueryRow(query, id).Scan(
		&u.ID, &u.Email, &u.PasswordHash, &u.FullName, &u.AvatarURL, &u.PhoneNumber,
		&u.Status, &u.IsSupportStaff, &u.MFAEnabled, &u.MFASecret, &u.IsVerified,
		&u.Locale, &metadataJSON,
		&u.CreatedAt, &u.UpdatedAt, &u.DeletedAt,
	)

	if err == sql.ErrNoRows {
		return nil, ErrUserNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	// Unmarshal metadata
	if len(metadataJSON) > 0 {
		json.Unmarshal(metadataJSON, &u.Metadata)
	}

	return &u, nil
}

// GetUserByEmail retrieves a user by email
func (s *UserService) GetUserByEmail(email string) (*models.User, error) {
	email = strings.ToLower(strings.TrimSpace(email))

	if !emailRegex.MatchString(email) {
		return nil, ErrInvalidEmail
	}

	query := `
		SELECT 
			_id, email, password_hash, full_name, avatar_url, phone_number,
			status, is_support_staff, mfa_enabled, mfa_secret, is_verified,
			locale, metadata,
			created_at, updated_at, deleted_at
		FROM users
		WHERE LOWER(email) = $1 AND deleted_at IS NULL
	`

	var u models.User
	var metadataJSON []byte

	err := s.db.QueryRow(query, email).Scan(
		&u.ID, &u.Email, &u.PasswordHash, &u.FullName, &u.AvatarURL, &u.PhoneNumber,
		&u.Status, &u.IsSupportStaff, &u.MFAEnabled, &u.MFASecret, &u.IsVerified,
		&u.Locale, &metadataJSON,
		&u.CreatedAt, &u.UpdatedAt, &u.DeletedAt,
	)

	if err == sql.ErrNoRows {
		return nil, ErrUserNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get user by email: %w", err)
	}

	if len(metadataJSON) > 0 {
		json.Unmarshal(metadataJSON, &u.Metadata)
	}

	return &u, nil
}

// ListUsers returns a paginated list of users with filters
func (s *UserService) ListUsers(filters models.UserFilters) ([]models.User, *models.PaginationMeta, error) {
	// Set defaults
	if filters.Page < 1 {
		filters.Page = 1
	}
	if filters.Limit < 1 || filters.Limit > models.MaxLimit {
		filters.Limit = models.DefaultLimit
	}
	if filters.SortBy == "" {
		filters.SortBy = "created_at"
	}
	if filters.SortOrder == "" {
		filters.SortOrder = "desc"
	}

	offset := (filters.Page - 1) * filters.Limit

	// Build query
	query := `
		SELECT 
			_id, email, full_name, avatar_url, phone_number,
			status, is_support_staff, mfa_enabled, is_verified,
			locale, metadata,
			created_at, updated_at, deleted_at
		FROM users
		WHERE 1=1
	`
	args := []interface{}{}
	argIdx := 1

	// Apply filters
	if !filters.IncludeDeleted {
		query += " AND deleted_at IS NULL"
	}

	if filters.Search != "" {
		query += fmt.Sprintf(` AND (
			full_name ILIKE $%d OR 
			email ILIKE $%d OR 
			phone_number ILIKE $%d
		)`, argIdx, argIdx, argIdx)
		args = append(args, "%"+filters.Search+"%")
		argIdx++
	}

	if filters.Status != nil {
		query += fmt.Sprintf(" AND status = $%d", argIdx)
		args = append(args, strings.ToUpper(*filters.Status))
		argIdx++
	}

	if filters.IsVerified != nil {
		query += fmt.Sprintf(" AND is_verified = $%d", argIdx)
		args = append(args, *filters.IsVerified)
		argIdx++
	}

	if filters.IsSupportStaff != nil {
		query += fmt.Sprintf(" AND is_support_staff = $%d", argIdx)
		args = append(args, *filters.IsSupportStaff)
		argIdx++
	}

	if filters.MFAEnabled != nil {
		query += fmt.Sprintf(" AND mfa_enabled = $%d", argIdx)
		args = append(args, *filters.MFAEnabled)
		argIdx++
	}

	if filters.CreatedFrom != nil {
		query += fmt.Sprintf(" AND created_at >= $%d", argIdx)
		args = append(args, *filters.CreatedFrom)
		argIdx++
	}

	if filters.CreatedTo != nil {
		query += fmt.Sprintf(" AND created_at <= $%d", argIdx)
		args = append(args, *filters.CreatedTo)
		argIdx++
	}

	// Sorting
	query += fmt.Sprintf(" ORDER BY %s %s", filters.SortBy, strings.ToUpper(filters.SortOrder))

	// Pagination
	query += fmt.Sprintf(" LIMIT $%d OFFSET $%d", argIdx, argIdx+1)
	args = append(args, filters.Limit, offset)

	// Execute query
	rows, err := s.db.Query(query, args...)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to list users: %w", err)
	}
	defer rows.Close()

	users := []models.User{}
	for rows.Next() {
		var u models.User
		var metadataJSON []byte

		err := rows.Scan(
			&u.ID, &u.Email, &u.FullName, &u.AvatarURL, &u.PhoneNumber,
			&u.Status, &u.IsSupportStaff, &u.MFAEnabled, &u.IsVerified,
			&u.Locale, &metadataJSON,
			&u.CreatedAt, &u.UpdatedAt, &u.DeletedAt,
		)
		if err != nil {
			return nil, nil, fmt.Errorf("failed to scan user: %w", err)
		}

		if len(metadataJSON) > 0 {
			json.Unmarshal(metadataJSON, &u.Metadata)
		}

		users = append(users, u)
	}

	// Get total count
	total, err := s.countUsers(filters)
	if err != nil {
		return nil, nil, err
	}

	// Build pagination meta
	totalPages := (total + filters.Limit - 1) / filters.Limit
	meta := &models.PaginationMeta{
		Page:       filters.Page,
		Limit:      filters.Limit,
		Total:      total,
		TotalPages: totalPages,
		HasNext:    filters.Page < totalPages,
		HasPrev:    filters.Page > 1,
	}

	return users, meta, nil
}

// CreateUser creates a new user
func (s *UserService) CreateUser(req models.CreateUserRequest) (*models.User, error) {
	// Validate email
	req.Email = strings.ToLower(strings.TrimSpace(req.Email))
	if !emailRegex.MatchString(req.Email) {
		return nil, ErrInvalidEmail
	}

	// Validate password
	if len(req.Password) < models.MinPasswordLength {
		return nil, ErrInvalidPassword
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	// Set defaults
	if req.Locale == "" {
		req.Locale = models.DefaultLocale
	}
	if req.Metadata == nil {
		req.Metadata = make(map[string]interface{})
	}

	// Encode metadata
	metadataJSON, _ := json.Marshal(req.Metadata)

	// Generate UUID
	userID := uuid.New().String()

	// Insert user
	query := `
		INSERT INTO users (
			_id, email, password_hash, full_name, avatar_url, phone_number,
			locale, metadata, status, is_verified, is_support_staff, mfa_enabled
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
		)
		RETURNING _id, email, full_name, avatar_url, phone_number,
			status, is_support_staff, mfa_enabled, is_verified,
			locale, metadata, created_at, updated_at
	`

	var u models.User
	var returnedMetadataJSON []byte

	err = s.db.QueryRow(
		query,
		userID, req.Email, string(hashedPassword), req.FullName, req.AvatarURL,
		req.PhoneNumber, req.Locale, metadataJSON, models.UserStatusActive, false, false, false,
	).Scan(
		&u.ID, &u.Email, &u.FullName, &u.AvatarURL, &u.PhoneNumber,
		&u.Status, &u.IsSupportStaff, &u.MFAEnabled, &u.IsVerified,
		&u.Locale, &returnedMetadataJSON,
		&u.CreatedAt, &u.UpdatedAt,
	)

	if err != nil {
		if pqErr, ok := err.(*pq.Error); ok {
			if pqErr.Code == "23505" { // unique_violation
				if strings.Contains(pqErr.Message, "email") {
					return nil, ErrEmailExists
				}
				if strings.Contains(pqErr.Message, "phone") {
					return nil, ErrPhoneExists
				}
			}
		}
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	if len(returnedMetadataJSON) > 0 {
		json.Unmarshal(returnedMetadataJSON, &u.Metadata)
	}

	return &u, nil
}

// UpdateUser updates user information
func (s *UserService) UpdateUser(id string, req models.UpdateUserRequest) (*models.User, error) {
	// Validate UUID
	if _, err := uuid.Parse(id); err != nil {
		return nil, fmt.Errorf("invalid user ID format: %w", err)
	}

	// Build dynamic UPDATE
	updates := []string{}
	args := []interface{}{}
	argIdx := 1

	if req.FullName != nil {
		updates = append(updates, fmt.Sprintf("full_name = $%d", argIdx))
		args = append(args, *req.FullName)
		argIdx++
	}
	if req.AvatarURL != nil {
		updates = append(updates, fmt.Sprintf("avatar_url = $%d", argIdx))
		args = append(args, *req.AvatarURL)
		argIdx++
	}
	if req.PhoneNumber != nil {
		updates = append(updates, fmt.Sprintf("phone_number = $%d", argIdx))
		args = append(args, *req.PhoneNumber)
		argIdx++
	}
	if req.Status != nil {
		updates = append(updates, fmt.Sprintf("status = $%d", argIdx))
		args = append(args, strings.ToUpper(*req.Status))
		argIdx++
	}
	if req.IsSupportStaff != nil {
		updates = append(updates, fmt.Sprintf("is_support_staff = $%d", argIdx))
		args = append(args, *req.IsSupportStaff)
		argIdx++
	}
	if req.IsVerified != nil {
		updates = append(updates, fmt.Sprintf("is_verified = $%d", argIdx))
		args = append(args, *req.IsVerified)
		argIdx++
	}
	if req.Locale != nil {
		updates = append(updates, fmt.Sprintf("locale = $%d", argIdx))
		args = append(args, *req.Locale)
		argIdx++
	}
	if req.Metadata != nil {
		metadataJSON, _ := json.Marshal(req.Metadata)
		updates = append(updates, fmt.Sprintf("metadata = $%d", argIdx))
		args = append(args, metadataJSON)
		argIdx++
	}

	if len(updates) == 0 {
		return nil, errors.New("no fields to update")
	}

	// Add updated_at
	updates = append(updates, "updated_at = NOW()")

	// Add user ID
	args = append(args, id)

	query := fmt.Sprintf(`
		UPDATE users 
		SET %s
		WHERE _id = $%d AND deleted_at IS NULL
		RETURNING _id, email, full_name, avatar_url, phone_number,
			status, is_support_staff, mfa_enabled, is_verified,
			locale, metadata, created_at, updated_at
	`, strings.Join(updates, ", "), argIdx)

	var u models.User
	var metadataJSON []byte

	err := s.db.QueryRow(query, args...).Scan(
		&u.ID, &u.Email, &u.FullName, &u.AvatarURL, &u.PhoneNumber,
		&u.Status, &u.IsSupportStaff, &u.MFAEnabled, &u.IsVerified,
		&u.Locale, &metadataJSON,
		&u.CreatedAt, &u.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, ErrUserNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("failed to update user: %w", err)
	}

	if len(metadataJSON) > 0 {
		json.Unmarshal(metadataJSON, &u.Metadata)
	}

	return &u, nil
}

// DeleteUser performs soft delete on a user
func (s *UserService) DeleteUser(id string) error {
	// Validate UUID
	if _, err := uuid.Parse(id); err != nil {
		return fmt.Errorf("invalid user ID format: %w", err)
	}

	query := `
		UPDATE users 
		SET deleted_at = NOW(), updated_at = NOW()
		WHERE _id = $1 AND deleted_at IS NULL
		RETURNING _id
	`

	var deletedID string
	err := s.db.QueryRow(query, id).Scan(&deletedID)

	if err == sql.ErrNoRows {
		return ErrUserNotFound
	}
	if err != nil {
		return fmt.Errorf("failed to delete user: %w", err)
	}

	return nil
}

// ============================================================================
// HELPER METHODS
// ============================================================================

// countUsers counts total users matching filters
func (s *UserService) countUsers(filters models.UserFilters) (int, error) {
	query := "SELECT COUNT(*) FROM users WHERE 1=1"
	args := []interface{}{}
	argIdx := 1

	if !filters.IncludeDeleted {
		query += " AND deleted_at IS NULL"
	}

	if filters.Search != "" {
		query += fmt.Sprintf(` AND (
			full_name ILIKE $%d OR 
			email ILIKE $%d OR 
			phone_number ILIKE $%d
		)`, argIdx, argIdx, argIdx)
		args = append(args, "%"+filters.Search+"%")
		argIdx++
	}

	if filters.Status != nil {
		query += fmt.Sprintf(" AND status = $%d", argIdx)
		args = append(args, *filters.Status)
		argIdx++
	}

	var count int
	err := s.db.QueryRow(query, args...).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to count users: %w", err)
	}

	return count, nil
}

// GetStatistics returns user statistics
func (s *UserService) GetStatistics() (*models.UserStatistics, error) {
	query := `
		SELECT
			COUNT(*) as total,
			COUNT(*) FILTER (WHERE status = 'ACTIVE') as active,
			COUNT(*) FILTER (WHERE status = 'BANNED') as banned,
			COUNT(*) FILTER (WHERE status = 'DISABLED') as disabled,
			COUNT(*) FILTER (WHERE status = 'PENDING') as pending,
			COUNT(*) FILTER (WHERE is_verified = true) as verified,
			COUNT(*) FILTER (WHERE is_verified = false) as unverified,
			COUNT(*) FILTER (WHERE mfa_enabled = true) as mfa_enabled,
			COUNT(*) FILTER (WHERE is_support_staff = true) as support_staff,
			COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as new_today,
			COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as new_week,
			COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_month
		FROM users
		WHERE deleted_at IS NULL
	`

	stats := &models.UserStatistics{}
	err := s.db.QueryRow(query).Scan(
		&stats.TotalUsers,
		&stats.ActiveUsers,
		&stats.BannedUsers,
		&stats.DisabledUsers,
		&stats.PendingUsers,
		&stats.VerifiedUsers,
		&stats.UnverifiedUsers,
		&stats.MFAEnabledUsers,
		&stats.SupportStaff,
		&stats.NewUsersToday,
		&stats.NewUsersWeek,
		&stats.NewUsersMonth,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to get statistics: %w", err)
	}

	return stats, nil
}
