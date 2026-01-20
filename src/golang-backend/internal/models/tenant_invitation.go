package models

import (
	"database/sql"
	"time"

	"github.com/google/uuid"
	"github.com/lib/pq"
)

// TenantInvitation represents an invitation to join a tenant
type TenantInvitation struct {
	ID           uuid.UUID      `json:"_id" db:"_id"`
	TenantID     uuid.UUID      `json:"tenant_id" db:"tenant_id"`
	Email        string         `json:"email" db:"email"`
	RoleIDs      pq.StringArray `json:"role_ids" db:"role_ids"`
	DepartmentID *uuid.UUID     `json:"department_id,omitempty" db:"department_id"`
	Token        string         `json:"token" db:"token"`
	Status       string         `json:"status" db:"status"` // PENDING, ACCEPTED, EXPIRED, REVOKED
	ExpiresAt    time.Time      `json:"expires_at" db:"expires_at"`
	InvitedBy    *uuid.UUID     `json:"invited_by,omitempty" db:"invited_by"`
	CreatedAt    time.Time      `json:"created_at" db:"created_at"`
}

// CreateTenantInvitationRequest represents the request to create a tenant invitation
type CreateTenantInvitationRequest struct {
	TenantID     uuid.UUID   `json:"tenant_id" validate:"required,uuid"`
	Email        string      `json:"email" validate:"required,email"`
	RoleIDs      []string    `json:"role_ids,omitempty"`
	DepartmentID *uuid.UUID  `json:"department_id,omitempty" validate:"omitempty,uuid"`
	ExpiresAt    *time.Time  `json:"expires_at,omitempty"`
	InvitedBy    *uuid.UUID  `json:"invited_by,omitempty" validate:"omitempty,uuid"`
}

// UpdateTenantInvitationRequest represents the request to update a tenant invitation
type UpdateTenantInvitationRequest struct {
	RoleIDs      []string   `json:"role_ids,omitempty"`
	DepartmentID *uuid.UUID `json:"department_id,omitempty" validate:"omitempty,uuid"`
	ExpiresAt    *time.Time `json:"expires_at,omitempty"`
	Status       *string    `json:"status,omitempty" validate:"omitempty,oneof=PENDING ACCEPTED EXPIRED REVOKED"`
}

// TableName returns the table name for TenantInvitation
func (TenantInvitation) TableName() string {
	return "tenant_invitations"
}
