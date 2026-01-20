package models

import (
	"database/sql"
	"time"

	"github.com/google/uuid"
)

// UserDelegation represents a delegation between users
type UserDelegation struct {
	ID                    uuid.UUID      `json:"_id" db:"_id"`
	DelegatorID           uuid.UUID      `json:"delegator_id" db:"delegator_id"`
	DelegateID            uuid.UUID      `json:"delegate_id" db:"delegate_id"`
	TenantID              sql.NullString `json:"tenant_id,omitempty" db:"tenant_id"`
	Scope                 sql.NullString `json:"scope,omitempty" db:"scope"` // admin, manager, editor, viewer, approver, reviewer, auditor, custom
	Permissions           JSONB          `json:"permissions,omitempty" db:"permissions"`
	Reason                sql.NullString `json:"reason,omitempty" db:"reason"`
	Notes                 sql.NullString `json:"notes,omitempty" db:"notes"`
	StartDate             time.Time      `json:"start_date" db:"start_date"`
	EndDate               sql.NullTime   `json:"end_date,omitempty" db:"end_date"`
	Status                string         `json:"status" db:"status"` // pending, active, expired, revoked, suspended
	ActivatedAt           sql.NullTime   `json:"activated_at,omitempty" db:"activated_at"`
	RevokedAt             sql.NullTime   `json:"revoked_at,omitempty" db:"revoked_at"`
	RevokedBy             sql.NullString `json:"revoked_by,omitempty" db:"revoked_by"`
	RevokedReason         sql.NullString `json:"revoked_reason,omitempty" db:"revoked_reason"`
	AutoExpire            bool           `json:"auto_expire" db:"auto_expire"`
	NotifiedBeforeExpiry  bool           `json:"notified_before_expiry" db:"notified_before_expiry"`
	Metadata              JSONB          `json:"metadata,omitempty" db:"metadata"`
	CreatedAt             time.Time      `json:"created_at" db:"created_at"`
	UpdatedAt             time.Time      `json:"updated_at" db:"updated_at"`
}

// CreateUserDelegationRequest represents the request to create a delegation
type CreateUserDelegationRequest struct {
	DelegatorID uuid.UUID              `json:"delegator_id" validate:"required,uuid"`
	DelegateID  uuid.UUID              `json:"delegate_id" validate:"required,uuid"`
	TenantID    *uuid.UUID             `json:"tenant_id,omitempty"`
	Scope       string                 `json:"scope,omitempty" validate:"omitempty,oneof=admin manager editor viewer approver reviewer auditor custom"`
	Permissions []string               `json:"permissions,omitempty"`
	Reason      string                 `json:"reason,omitempty"`
	Notes       string                 `json:"notes,omitempty"`
	StartDate   *time.Time             `json:"start_date,omitempty"`
	EndDate     *time.Time             `json:"end_date,omitempty"`
	AutoExpire  bool                   `json:"auto_expire"`
	Metadata    map[string]interface{} `json:"metadata,omitempty"`
}

// UpdateUserDelegationRequest represents the request to update a delegation
type UpdateUserDelegationRequest struct {
	Scope       *string                 `json:"scope,omitempty" validate:"omitempty,oneof=admin manager editor viewer approver reviewer auditor custom"`
	Permissions *[]string               `json:"permissions,omitempty"`
	Reason      *string                 `json:"reason,omitempty"`
	Notes       *string                 `json:"notes,omitempty"`
	EndDate     *time.Time              `json:"end_date,omitempty"`
	AutoExpire  *bool                   `json:"auto_expire,omitempty"`
	Metadata    *map[string]interface{} `json:"metadata,omitempty"`
}

// RevokeDelegationRequest represents the request to revoke a delegation
type RevokeDelegationRequest struct {
	Reason string `json:"reason,omitempty"`
}

// TableName returns the table name for UserDelegation
func (UserDelegation) TableName() string {
	return "user_delegations"
}
