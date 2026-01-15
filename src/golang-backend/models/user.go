package models

import (
	"time"
)

// ============================================================================
// USER MODELS - Quản lý Người dùng
// ============================================================================

// User represents a global user identity in the system
// Table: users
// Description: Stores authentication and profile information for all users
type User struct {
	// I. ĐỊNH DANH (IDENTITY)
	ID           string  `json:"_id" db:"_id"`                          // UUID - Primary key
	Email        string  `json:"email" db:"email"`                      // UNIQUE - Email đăng nhập chính
	PasswordHash *string `json:"-" db:"password_hash"`                  // Bcrypt hash - Never returned in JSON
	FullName     string  `json:"full_name" db:"full_name"`              // Tên hiển thị
	AvatarURL    *string `json:"avatar_url,omitempty" db:"avatar_url"`  // Link ảnh đại diện
	PhoneNumber  *string `json:"phone_number,omitempty" db:"phone_number"` // UNIQUE - Số điện thoại (2FA/Recovery)

	// II. TRẠNG THÁI & BẢO MẬT (SECURITY)
	Status         string  `json:"status" db:"status"`                       // ACTIVE, BANNED, DISABLED, PENDING
	IsSupportStaff bool    `json:"is_support_staff" db:"is_support_staff"`   // Nhân viên hỗ trợ?
	MFAEnabled     bool    `json:"mfa_enabled" db:"mfa_enabled"`             // Multi-Factor Authentication enabled?
	MFASecret      *string `json:"-" db:"mfa_secret"`                        // TOTP secret - Never returned
	IsVerified     bool    `json:"is_verified" db:"is_verified"`             // Email đã xác thực?

	// III. CẤU HÌNH & METADATA
	Locale   string                 `json:"locale" db:"locale"`     // vi-VN, en-US - Ngôn ngữ ưa thích
	Metadata map[string]interface{} `json:"metadata" db:"metadata"` // JSONB - Thông tin bổ sung

	// IV. TRUY VẾT (AUDIT TRAIL)
	CreatedAt time.Time  `json:"created_at" db:"created_at"` // Timestamp tạo
	UpdatedAt time.Time  `json:"updated_at" db:"updated_at"` // Timestamp cập nhật
	DeletedAt *time.Time `json:"deleted_at,omitempty" db:"deleted_at"` // Soft delete timestamp
}

// ============================================================================
// REQUEST & RESPONSE DTOs
// ============================================================================

// CreateUserRequest represents the request body for creating a new user
type CreateUserRequest struct {
	Email       string                 `json:"email" validate:"required,email,max=255"`
	Password    string                 `json:"password" validate:"required,min=8,max=128"`
	FullName    string                 `json:"full_name" validate:"required,min=1,max=255"`
	AvatarURL   *string                `json:"avatar_url,omitempty" validate:"omitempty,url,max=2048"`
	PhoneNumber *string                `json:"phone_number,omitempty" validate:"omitempty,max=20"`
	Locale      string                 `json:"locale,omitempty" validate:"omitempty,oneof=vi-VN en-US zh-CN ja-JP ko-KR"`
	Metadata    map[string]interface{} `json:"metadata,omitempty"`
}

// UpdateUserRequest represents the request body for updating user information
type UpdateUserRequest struct {
	FullName       *string                `json:"full_name,omitempty" validate:"omitempty,min=1,max=255"`
	AvatarURL      *string                `json:"avatar_url,omitempty" validate:"omitempty,url,max=2048"`
	PhoneNumber    *string                `json:"phone_number,omitempty" validate:"omitempty,max=20"`
	Status         *string                `json:"status,omitempty" validate:"omitempty,oneof=ACTIVE BANNED DISABLED PENDING"`
	IsSupportStaff *bool                  `json:"is_support_staff,omitempty"`
	IsVerified     *bool                  `json:"is_verified,omitempty"`
	Locale         *string                `json:"locale,omitempty" validate:"omitempty,oneof=vi-VN en-US zh-CN ja-JP ko-KR"`
	Metadata       map[string]interface{} `json:"metadata,omitempty"`
}

// ChangePasswordRequest represents a password change request
type ChangePasswordRequest struct {
	OldPassword string `json:"old_password" validate:"required"`
	NewPassword string `json:"new_password" validate:"required,min=8,max=128"`
}

// ResetPasswordRequest represents a password reset request
type ResetPasswordRequest struct {
	Email string `json:"email" validate:"required,email"`
}

// SetPasswordRequest sets password via reset token
type SetPasswordRequest struct {
	Token       string `json:"token" validate:"required"`
	NewPassword string `json:"new_password" validate:"required,min=8,max=128"`
}

// VerifyEmailRequest represents email verification request
type VerifyEmailRequest struct {
	Token string `json:"token" validate:"required"`
}

// VerifyPhoneRequest represents phone verification request
type VerifyPhoneRequest struct {
	Code string `json:"code" validate:"required,len=6"`
}

// EnableMFARequest represents request to enable MFA
type EnableMFARequest struct {
	Secret string `json:"secret" validate:"required"`
	Code   string `json:"code" validate:"required,len=6"`
}

// DisableMFARequest represents request to disable MFA
type DisableMFARequest struct {
	Code string `json:"code" validate:"required,len=6"`
}

// ToggleMFARequest toggles MFA status
type ToggleMFARequest struct {
	Enabled bool `json:"enabled"`
}

// BulkActionRequest represents bulk operation request
type BulkActionRequest struct {
	UserIDs []string `json:"user_ids" validate:"required,min=1,max=100,dive,uuid4"`
	Action  string   `json:"action" validate:"required,oneof=delete disable enable verify ban unban"`
}

// ============================================================================
// RESPONSE MODELS
// ============================================================================

// UserResponse represents user data returned to client (sanitized)
type UserResponse struct {
	ID             string                 `json:"_id"`
	Email          string                 `json:"email"`
	FullName       string                 `json:"full_name"`
	AvatarURL      *string                `json:"avatar_url,omitempty"`
	PhoneNumber    *string                `json:"phone_number,omitempty"`
	Status         string                 `json:"status"`
	IsSupportStaff bool                   `json:"is_support_staff"`
	MFAEnabled     bool                   `json:"mfa_enabled"`
	IsVerified     bool                   `json:"is_verified"`
	Locale         string                 `json:"locale"`
	Metadata       map[string]interface{} `json:"metadata"`
	CreatedAt      time.Time              `json:"created_at"`
	UpdatedAt      time.Time              `json:"updated_at"`
}

// UserListResponse represents paginated list of users
type UserListResponse struct {
	Data []UserResponse `json:"data"`
	Meta PaginationMeta `json:"meta"`
}

// PaginationMeta contains pagination metadata
type PaginationMeta struct {
	Page       int   `json:"page"`
	Limit      int   `json:"limit"`
	Total      int   `json:"total"`
	TotalPages int   `json:"total_pages"`
	HasNext    bool  `json:"has_next"`
	HasPrev    bool  `json:"has_prev"`
}

// BulkActionResponse represents response for bulk operations
type BulkActionResponse struct {
	Message      string   `json:"message"`
	Affected     int      `json:"affected"`
	SuccessIDs   []string `json:"success_ids,omitempty"`
	FailedIDs    []string `json:"failed_ids,omitempty"`
}

// ============================================================================
// FILTER & QUERY PARAMS
// ============================================================================

// UserFilters represents query parameters for listing/searching users
type UserFilters struct {
	// Pagination
	Page  int `json:"page" query:"page" validate:"omitempty,min=1"`
	Limit int `json:"limit" query:"limit" validate:"omitempty,min=1,max=100"`

	// Search
	Search string `json:"search" query:"search"` // Full-text search on name, email, phone

	// Status filters
	Status         *string `json:"status" query:"status" validate:"omitempty,oneof=ACTIVE BANNED DISABLED PENDING"`
	IsVerified     *bool   `json:"is_verified" query:"verified"`
	IsSupportStaff *bool   `json:"is_support_staff" query:"support_staff"`
	MFAEnabled     *bool   `json:"mfa_enabled" query:"mfa"`

	// Date range filters
	CreatedFrom *time.Time `json:"created_from" query:"created_from"`
	CreatedTo   *time.Time `json:"created_to" query:"created_to"`

	// Sorting
	SortBy    string `json:"sort_by" query:"sort_by" validate:"omitempty,oneof=created_at updated_at email full_name"`
	SortOrder string `json:"sort_order" query:"sort_order" validate:"omitempty,oneof=asc desc"`

	// Advanced
	IncludeDeleted bool `json:"include_deleted" query:"include_deleted"`
}

// ============================================================================
// USER STATISTICS
// ============================================================================

// UserStatistics represents aggregated user statistics
type UserStatistics struct {
	TotalUsers      int `json:"total_users"`
	ActiveUsers     int `json:"active_users"`
	BannedUsers     int `json:"banned_users"`
	DisabledUsers   int `json:"disabled_users"`
	PendingUsers    int `json:"pending_users"`
	VerifiedUsers   int `json:"verified_users"`
	UnverifiedUsers int `json:"unverified_users"`
	MFAEnabledUsers int `json:"mfa_enabled_users"`
	SupportStaff    int `json:"support_staff"`
	NewUsersToday   int `json:"new_users_today"`
	NewUsersWeek    int `json:"new_users_week"`
	NewUsersMonth   int `json:"new_users_month"`
}

// ============================================================================
// HELPER METHODS
// ============================================================================

// ToResponse converts User model to sanitized UserResponse
func (u *User) ToResponse() UserResponse {
	return UserResponse{
		ID:             u.ID,
		Email:          u.Email,
		FullName:       u.FullName,
		AvatarURL:      u.AvatarURL,
		PhoneNumber:    u.PhoneNumber,
		Status:         u.Status,
		IsSupportStaff: u.IsSupportStaff,
		MFAEnabled:     u.MFAEnabled,
		IsVerified:     u.IsVerified,
		Locale:         u.Locale,
		Metadata:       u.Metadata,
		CreatedAt:      u.CreatedAt,
		UpdatedAt:      u.UpdatedAt,
	}
}

// IsActive checks if user is active
func (u *User) IsActive() bool {
	return u.Status == "ACTIVE" && u.DeletedAt == nil
}

// IsBanned checks if user is banned
func (u *User) IsBanned() bool {
	return u.Status == "BANNED"
}

// CanLogin checks if user can login
func (u *User) CanLogin() bool {
	return u.IsActive() && u.IsVerified
}

// NeedsMFA checks if user needs MFA verification
func (u *User) NeedsMFA() bool {
	return u.MFAEnabled && u.MFASecret != nil
}

// ============================================================================
// CONSTANTS
// ============================================================================

const (
	// User Status
	UserStatusActive   = "ACTIVE"
	UserStatusBanned   = "BANNED"
	UserStatusDisabled = "DISABLED"
	UserStatusPending  = "PENDING"

	// Default Values
	DefaultLocale = "vi-VN"
	DefaultLimit  = 20
	MaxLimit      = 100

	// Validation
	MinPasswordLength = 8
	MaxPasswordLength = 128
	MinFullNameLength = 1
	MaxFullNameLength = 255
	MaxEmailLength    = 255
	MaxPhoneLength    = 20
)

// ValidStatuses returns list of valid user statuses
func ValidStatuses() []string {
	return []string{
		UserStatusActive,
		UserStatusBanned,
		UserStatusDisabled,
		UserStatusPending,
	}
}

// ValidLocales returns list of supported locales
func ValidLocales() []string {
	return []string{
		"vi-VN", // Vietnamese
		"en-US", // English
		"zh-CN", // Chinese Simplified
		"ja-JP", // Japanese
		"ko-KR", // Korean
		"th-TH", // Thai
	}
}
