package models

import (
	"database/sql"
	"time"

	"github.com/google/uuid"
)

// DepartmentMember represents a department member
type DepartmentMember struct {
	ID               uuid.UUID      `json:"_id" db:"_id"`
	TenantID         uuid.UUID      `json:"tenant_id" db:"tenant_id"`
	DepartmentID     uuid.UUID      `json:"department_id" db:"department_id"`
	TenantMemberID   uuid.UUID      `json:"tenant_member_id" db:"tenant_member_id"`
	IsPrimary        bool           `json:"is_primary" db:"is_primary"`
	RoleInDepartment sql.NullString `json:"role_in_department,omitempty" db:"role_in_department"`
	JoinedAt         sql.NullTime   `json:"joined_at,omitempty" db:"joined_at"`
	LeftAt           sql.NullTime   `json:"left_at,omitempty" db:"left_at"`
	Metadata         JSONB          `json:"metadata,omitempty" db:"metadata"`
	CreatedAt        time.Time      `json:"created_at" db:"created_at"`
	UpdatedAt        time.Time      `json:"updated_at" db:"updated_at"`
	DeletedAt        sql.NullTime   `json:"deleted_at,omitempty" db:"deleted_at"`
	CreatedBy        sql.NullString `json:"created_by,omitempty" db:"created_by"`
	UpdatedBy        sql.NullString `json:"updated_by,omitempty" db:"updated_by"`
	DeletedBy        sql.NullString `json:"deleted_by,omitempty" db:"deleted_by"`
	Version          int64          `json:"version" db:"version"`
}

// CreateDepartmentMemberRequest represents the request to create a department member
type CreateDepartmentMemberRequest struct {
	TenantID         uuid.UUID              `json:"tenant_id" validate:"required,uuid"`
	DepartmentID     uuid.UUID              `json:"department_id" validate:"required,uuid"`
	TenantMemberID   uuid.UUID              `json:"tenant_member_id" validate:"required,uuid"`
	IsPrimary        bool                   `json:"is_primary"`
	RoleInDepartment string                 `json:"role_in_department,omitempty"`
	Metadata         map[string]interface{} `json:"metadata,omitempty"`
	CreatedBy        *uuid.UUID             `json:"created_by,omitempty"`
}

// UpdateDepartmentMemberRequest represents the request to update a department member
type UpdateDepartmentMemberRequest struct {
	IsPrimary        *bool                   `json:"is_primary,omitempty"`
	RoleInDepartment *string                 `json:"role_in_department,omitempty"`
	Metadata         *map[string]interface{} `json:"metadata,omitempty"`
	UpdatedBy        *uuid.UUID              `json:"updated_by,omitempty"`
}

// TableName returns the table name for DepartmentMember
func (DepartmentMember) TableName() string {
	return "department_members"
}
