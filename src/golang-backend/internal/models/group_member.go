package models

import (
	"database/sql"
	"time"

	"github.com/google/uuid"
)

// GroupMember represents a group member
type GroupMember struct {
	ID             uuid.UUID      `json:"_id" db:"_id"`
	TenantID       uuid.UUID      `json:"tenant_id" db:"tenant_id"`
	UserGroupID    uuid.UUID      `json:"user_group_id" db:"user_group_id"`
	TenantMemberID uuid.UUID      `json:"tenant_member_id" db:"tenant_member_id"`
	IsPrimary      bool           `json:"is_primary" db:"is_primary"`
	RoleInGroup    sql.NullString `json:"role_in_group,omitempty" db:"role_in_group"`
	JoinedAt       sql.NullTime   `json:"joined_at,omitempty" db:"joined_at"`
	LeftAt         sql.NullTime   `json:"left_at,omitempty" db:"left_at"`
	Metadata       JSONB          `json:"metadata,omitempty" db:"metadata"`
	CreatedAt      time.Time      `json:"created_at" db:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at" db:"updated_at"`
	DeletedAt      sql.NullTime   `json:"deleted_at,omitempty" db:"deleted_at"`
	CreatedBy      sql.NullString `json:"created_by,omitempty" db:"created_by"`
	UpdatedBy      sql.NullString `json:"updated_by,omitempty" db:"updated_by"`
	DeletedBy      sql.NullString `json:"deleted_by,omitempty" db:"deleted_by"`
	Version        int64          `json:"version" db:"version"`
}

// CreateGroupMemberRequest represents the request to create a group member
type CreateGroupMemberRequest struct {
	TenantID       uuid.UUID              `json:"tenant_id" validate:"required,uuid"`
	UserGroupID    uuid.UUID              `json:"user_group_id" validate:"required,uuid"`
	TenantMemberID uuid.UUID              `json:"tenant_member_id" validate:"required,uuid"`
	IsPrimary      bool                   `json:"is_primary"`
	RoleInGroup    string                 `json:"role_in_group,omitempty"`
	Metadata       map[string]interface{} `json:"metadata,omitempty"`
	CreatedBy      *uuid.UUID             `json:"created_by,omitempty"`
}

// UpdateGroupMemberRequest represents the request to update a group member
type UpdateGroupMemberRequest struct {
	IsPrimary   *bool                   `json:"is_primary,omitempty"`
	RoleInGroup *string                 `json:"role_in_group,omitempty"`
	Metadata    *map[string]interface{} `json:"metadata,omitempty"`
	UpdatedBy   *uuid.UUID              `json:"updated_by,omitempty"`
}

// TableName returns the table name for GroupMember
func (GroupMember) TableName() string {
	return "group_members"
}
