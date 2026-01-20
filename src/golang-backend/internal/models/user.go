package models

// UserStatus represents user status
type UserStatus string

const (
	UserStatusActive    UserStatus = "ACTIVE"
	UserStatusInactive  UserStatus = "INACTIVE"
	UserStatusSuspended UserStatus = "SUSPENDED"
	UserStatusPending   UserStatus = "PENDING"
)

// User represents a user in the system
type User struct {
	BaseModel
	Email          string                 `json:"email" db:"email" validate:"required,email"`
	PhoneNumber    *string                `json:"phone_number,omitempty" db:"phone_number"`
	FullName       string                 `json:"full_name" db:"full_name" validate:"required"`
	AvatarURL      *string                `json:"avatar_url,omitempty" db:"avatar_url"`
	Status         UserStatus             `json:"status" db:"status" validate:"required"`
	IsSupportStaff bool                   `json:"is_support_staff" db:"is_support_staff"`
	MFAEnabled     bool                   `json:"mfa_enabled" db:"mfa_enabled"`
	Locale         string                 `json:"locale" db:"locale"`
	Metadata       map[string]interface{} `json:"metadata,omitempty" db:"metadata"`
	CreatedBy      *string                `json:"created_by,omitempty" db:"created_by"`
	UpdatedBy      *string                `json:"updated_by,omitempty" db:"updated_by"`
}

// CreateUserRequest represents request to create a user
type CreateUserRequest struct {
	Email          string                 `json:"email" validate:"required,email"`
	PhoneNumber    *string                `json:"phone_number,omitempty"`
	FullName       string                 `json:"full_name" validate:"required"`
	AvatarURL      *string                `json:"avatar_url,omitempty"`
	Status         UserStatus             `json:"status,omitempty"`
	IsSupportStaff bool                   `json:"is_support_staff,omitempty"`
	MFAEnabled     bool                   `json:"mfa_enabled,omitempty"`
	Locale         string                 `json:"locale,omitempty"`
	Metadata       map[string]interface{} `json:"metadata,omitempty"`
}

// UpdateUserRequest represents request to update a user
type UpdateUserRequest struct {
	PhoneNumber    *string                `json:"phone_number,omitempty"`
	FullName       *string                `json:"full_name,omitempty" validate:"omitempty,min=1"`
	AvatarURL      *string                `json:"avatar_url,omitempty"`
	Status         *UserStatus            `json:"status,omitempty"`
	IsSupportStaff *bool                  `json:"is_support_staff,omitempty"`
	MFAEnabled     *bool                  `json:"mfa_enabled,omitempty"`
	Locale         *string                `json:"locale,omitempty"`
	Metadata       map[string]interface{} `json:"metadata,omitempty"`
}

// UserFilters represents filters for querying users
type UserFilters struct {
	Status         *UserStatus `json:"status,omitempty"`
	IsSupportStaff *bool       `json:"is_support_staff,omitempty"`
	MFAEnabled     *bool       `json:"mfa_enabled,omitempty"`
	Search         *string     `json:"search,omitempty"`
	Locale         *string     `json:"locale,omitempty"`
}
