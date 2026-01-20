package models

import (
	"time"
)

type UserRole struct {
	ID        string     `json:"_id" db:"_id"`
	UserID    string     `json:"user_id" db:"user_id"`
	RoleID    string     `json:"role_id" db:"role_id"`
	TenantID  *string    `json:"tenant_id,omitempty" db:"tenant_id"`
	Scope     string     `json:"scope" db:"scope"`
	ScopeID   *string    `json:"scope_id,omitempty" db:"scope_id"`
	GrantedBy *string    `json:"granted_by,omitempty" db:"granted_by"`
	GrantedAt time.Time  `json:"granted_at" db:"granted_at"`
	ExpiresAt *time.Time `json:"expires_at,omitempty" db:"expires_at"`
	IsActive  bool       `json:"is_active" db:"is_active"`
	Metadata  JSONB      `json:"metadata" db:"metadata"`
	CreatedAt time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt time.Time  `json:"updated_at" db:"updated_at"`
}

type CreateUserRoleRequest struct {
	UserID    string     `json:"user_id" validate:"required,uuid"`
	RoleID    string     `json:"role_id" validate:"required,uuid"`
	TenantID  *string    `json:"tenant_id,omitempty" validate:"omitempty,uuid"`
	Scope     string     `json:"scope" validate:"required,oneof=global tenant application department location custom"`
	ScopeID   *string    `json:"scope_id,omitempty" validate:"omitempty,uuid"`
	GrantedBy *string    `json:"granted_by,omitempty" validate:"omitempty,uuid"`
	ExpiresAt *time.Time `json:"expires_at,omitempty"`
	IsActive  bool       `json:"is_active"`
	Metadata  JSONB      `json:"metadata,omitempty"`
}

type UpdateUserRoleRequest struct {
	Scope     *string    `json:"scope,omitempty" validate:"omitempty,oneof=global tenant application department location custom"`
	ScopeID   *string    `json:"scope_id,omitempty" validate:"omitempty,uuid"`
	ExpiresAt *time.Time `json:"expires_at,omitempty"`
	IsActive  *bool      `json:"is_active,omitempty"`
	Metadata  JSONB      `json:"metadata,omitempty"`
}
