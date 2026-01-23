package models

import (
	"github.com/google/uuid"
)

// User represents a user in the system
type User struct {
	BaseModel
	Email                string     `json:"email" db:"email"`
	PasswordHash         string     `json:"-" db:"password_hash"`
	DisplayName          *string    `json:"display_name,omitempty" db:"display_name"`
	FirstName            *string    `json:"first_name,omitempty" db:"first_name"`
	LastName             *string    `json:"last_name,omitempty" db:"last_name"`
	PhoneNumber          *string    `json:"phone_number,omitempty" db:"phone_number"`
	AvatarURL            *string    `json:"avatar_url,omitempty" db:"avatar_url"`
	EmailVerified        bool       `json:"email_verified" db:"email_verified"`
	EmailVerifiedAt      *string    `json:"email_verified_at,omitempty" db:"email_verified_at"`
	PhoneVerified        bool       `json:"phone_verified" db:"phone_verified"`
	PhoneVerifiedAt      *string    `json:"phone_verified_at,omitempty" db:"phone_verified_at"`
	IsActive             bool       `json:"is_active" db:"is_active"`
	IsSuperAdmin         bool       `json:"is_super_admin" db:"is_super_admin"`
	LastLoginAt          *string    `json:"last_login_at,omitempty" db:"last_login_at"`
	LastLoginIP          *string    `json:"last_login_ip,omitempty" db:"last_login_ip"`
	FailedLoginAttempts  int        `json:"failed_login_attempts" db:"failed_login_attempts"`
	LockedUntil          *string    `json:"locked_until,omitempty" db:"locked_until"`
	PasswordChangedAt    *string    `json:"password_changed_at,omitempty" db:"password_changed_at"`
	MustChangePassword   bool       `json:"must_change_password" db:"must_change_password"`
	MFAEnabled           bool       `json:"mfa_enabled" db:"mfa_enabled"`
	MFASecret            *string    `json:"-" db:"mfa_secret"`
	PreferredLanguage    string     `json:"preferred_language" db:"preferred_language"`
	Timezone             string     `json:"timezone" db:"timezone"`
	Metadata             *string    `json:"metadata,omitempty" db:"metadata"`
	SupabaseUID          *string    `json:"supabase_uid,omitempty" db:"supabase_uid"`
	ExternalProvider     *string    `json:"external_provider,omitempty" db:"external_provider"`
	ExternalProviderID   *string    `json:"external_provider_id,omitempty" db:"external_provider_id"`
}

// NewUser creates a new User
func NewUser(email, passwordHash string) *User {
	return &User{
		BaseModel:    NewBaseModel(),
		Email:        email,
		PasswordHash: passwordHash,
		IsActive:     true,
		EmailVerified: false,
		PhoneVerified: false,
		IsSuperAdmin:  false,
		MFAEnabled:    false,
		PreferredLanguage: "vi",
		Timezone:      "Asia/Ho_Chi_Minh",
		FailedLoginAttempts: 0,
		MustChangePassword:  false,
	}
}

// UserListFilter for filtering users
type UserListFilter struct {
	Email        *string
	IsActive     *bool
	IsSuperAdmin *bool
	EmailVerified *bool
	Search       *string
	Page         int
	Limit        int
	SortBy       string
	SortOrder    string
}

// Tenant represents an organization/tenant
type Tenant struct {
	BaseModel
	Name              string     `json:"name" db:"name"`
	Code              string     `json:"code" db:"code"`
	Description       *string    `json:"description,omitempty" db:"description"`
	LogoURL           *string    `json:"logo_url,omitempty" db:"logo_url"`
	Website           *string    `json:"website,omitempty" db:"website"`
	Industry          *string    `json:"industry,omitempty" db:"industry"`
	CompanySize       *string    `json:"company_size,omitempty" db:"company_size"`
	Country           *string    `json:"country,omitempty" db:"country"`
	City              *string    `json:"city,omitempty" db:"city"`
	Address           *string    `json:"address,omitempty" db:"address"`
	TaxID             *string    `json:"tax_id,omitempty" db:"tax_id"`
	BillingEmail      *string    `json:"billing_email,omitempty" db:"billing_email"`
	SupportEmail      *string    `json:"support_email,omitempty" db:"support_email"`
	PhoneNumber       *string    `json:"phone_number,omitempty" db:"phone_number"`
	IsActive          bool       `json:"is_active" db:"is_active"`
	TrialEndsAt       *string    `json:"trial_ends_at,omitempty" db:"trial_ends_at"`
	SubscriptionPlan  *string    `json:"subscription_plan,omitempty" db:"subscription_plan"`
	MaxUsers          int        `json:"max_users" db:"max_users"`
	MaxStorage        int64      `json:"max_storage" db:"max_storage"`
	CurrentStorage    int64      `json:"current_storage" db:"current_storage"`
	Settings          *string    `json:"settings,omitempty" db:"settings"`
	Metadata          *string    `json:"metadata,omitempty" db:"metadata"`
	OwnerID           uuid.UUID  `json:"owner_id" db:"owner_id"`
}

// NewTenant creates a new Tenant
func NewTenant(name, code string, ownerID uuid.UUID) *Tenant {
	return &Tenant{
		BaseModel:        NewBaseModel(),
		Name:             name,
		Code:             code,
		IsActive:         true,
		MaxUsers:         5,
		MaxStorage:       1073741824, // 1GB
		CurrentStorage:   0,
		OwnerID:          ownerID,
	}
}

// TenantListFilter for filtering tenants
type TenantListFilter struct {
	Name      *string
	Code      *string
	IsActive  *bool
	Search    *string
	Page      int
	Limit     int
	SortBy    string
	SortOrder string
}

// Role represents a role in RBAC
type Role struct {
	BaseModel
	Name        string     `json:"name" db:"name"`
	Code        string     `json:"code" db:"code"`
	Description *string    `json:"description,omitempty" db:"description"`
	IsSystemRole bool      `json:"is_system_role" db:"is_system_role"`
	IsActive    bool       `json:"is_active" db:"is_active"`
	TenantID    *uuid.UUID `json:"tenant_id,omitempty" db:"tenant_id"`
	Permissions []string   `json:"permissions,omitempty" db:"-"`
}

// NewRole creates a new Role
func NewRole(name, code string) *Role {
	return &Role{
		BaseModel:    NewBaseModel(),
		Name:         name,
		Code:         code,
		IsSystemRole: false,
		IsActive:     true,
	}
}

// Permission represents a permission
type Permission struct {
	BaseModel
	Name        string  `json:"name" db:"name"`
	Code        string  `json:"code" db:"code"`
	Resource    string  `json:"resource" db:"resource"`
	Action      string  `json:"action" db:"action"`
	Description *string `json:"description,omitempty" db:"description"`
	Category    string  `json:"category" db:"category"`
	IsActive    bool    `json:"is_active" db:"is_active"`
}

// NewPermission creates a new Permission
func NewPermission(name, code, resource, action string) *Permission {
	return &Permission{
		BaseModel: NewBaseModel(),
		Name:      name,
		Code:      code,
		Resource:  resource,
		Action:    action,
		IsActive:  true,
		Category:  "general",
	}
}
