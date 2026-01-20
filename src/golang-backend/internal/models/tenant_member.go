package models

import (
	"database/sql"
	"time"

	"github.com/google/uuid"
)

// TenantMember represents a user's membership in a tenant organization
type TenantMember struct {
	BaseModel
	TenantID      uuid.UUID      `json:"tenant_id" db:"tenant_id"`
	UserID        uuid.UUID      `json:"user_id" db:"user_id"`
	EmployeeCode  sql.NullString `json:"employee_code,omitempty" db:"employee_code"`
	InternalEmail sql.NullString `json:"internal_email,omitempty" db:"internal_email"`
	JobTitle      sql.NullString `json:"job_title,omitempty" db:"job_title"`
	ManagerID     *uuid.UUID     `json:"manager_id,omitempty" db:"manager_id"`
	Role          string         `json:"role" db:"role"`                   // OWNER, ADMIN, MEMBER, VIEWER
	Status        string         `json:"status" db:"status"`               // ACTIVE, RESIGNED, ONBOARDING, SUSPENDED
	JoinedAt      *time.Time     `json:"joined_at,omitempty" db:"joined_at"`
	LeftAt        *time.Time     `json:"left_at,omitempty" db:"left_at"`
	Permissions   JSONB          `json:"permissions" db:"permissions"`
	Metadata      JSONB          `json:"metadata" db:"metadata"`
}

// CreateTenantMemberRequest represents the request to create a tenant member
type CreateTenantMemberRequest struct {
	TenantID      uuid.UUID  `json:"tenant_id" validate:"required,uuid"`
	UserID        uuid.UUID  `json:"user_id" validate:"required,uuid"`
	EmployeeCode  string     `json:"employee_code,omitempty"`
	InternalEmail string     `json:"internal_email,omitempty" validate:"omitempty,email"`
	JobTitle      string     `json:"job_title,omitempty"`
	ManagerID     *uuid.UUID `json:"manager_id,omitempty" validate:"omitempty,uuid"`
	Role          string     `json:"role" validate:"required,oneof=OWNER ADMIN MEMBER VIEWER"`
	Status        string     `json:"status,omitempty" validate:"omitempty,oneof=ACTIVE RESIGNED ONBOARDING SUSPENDED"`
	JoinedAt      *time.Time `json:"joined_at,omitempty"`
	Permissions   JSONB      `json:"permissions,omitempty"`
	Metadata      JSONB      `json:"metadata,omitempty"`
}

// UpdateTenantMemberRequest represents the request to update a tenant member
type UpdateTenantMemberRequest struct {
	EmployeeCode  *string    `json:"employee_code,omitempty"`
	InternalEmail *string    `json:"internal_email,omitempty" validate:"omitempty,email"`
	JobTitle      *string    `json:"job_title,omitempty"`
	ManagerID     *uuid.UUID `json:"manager_id,omitempty" validate:"omitempty,uuid"`
	Role          *string    `json:"role,omitempty" validate:"omitempty,oneof=OWNER ADMIN MEMBER VIEWER"`
	Status        *string    `json:"status,omitempty" validate:"omitempty,oneof=ACTIVE RESIGNED ONBOARDING SUSPENDED"`
	JoinedAt      *time.Time `json:"joined_at,omitempty"`
	LeftAt        *time.Time `json:"left_at,omitempty"`
	Permissions   JSONB      `json:"permissions,omitempty"`
	Metadata      JSONB      `json:"metadata,omitempty"`
}

// TableName returns the table name for TenantMember
func (TenantMember) TableName() string {
	return "tenant_members"
}
