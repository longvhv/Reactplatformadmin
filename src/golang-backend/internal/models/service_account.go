package models

import (
	"database/sql"
	"time"

	"github.com/google/uuid"
)

// ServiceAccount represents a service account for machine-to-machine authentication
type ServiceAccount struct {
	BaseModel
	TenantID         uuid.UUID      `json:"tenant_id" db:"tenant_id"`
	MemberID         uuid.UUID      `json:"member_id" db:"member_id"`
	Name             string         `json:"name" db:"name"`
	Description      sql.NullString `json:"description,omitempty" db:"description"`
	ClientID         string         `json:"client_id" db:"client_id"`
	ClientSecretHash string         `json:"-" db:"client_secret_hash"` // Never expose
	IsActive         bool           `json:"is_active" db:"is_active"`
}

// CreateServiceAccountRequest represents the request to create a service account
type CreateServiceAccountRequest struct {
	TenantID    uuid.UUID `json:"tenant_id" validate:"required,uuid"`
	MemberID    uuid.UUID `json:"member_id" validate:"required,uuid"`
	Name        string    `json:"name" validate:"required,min=1,max=255"`
	Description string    `json:"description,omitempty"`
}

// UpdateServiceAccountRequest represents the request to update a service account
type UpdateServiceAccountRequest struct {
	Name        *string `json:"name,omitempty" validate:"omitempty,min=1,max=255"`
	Description *string `json:"description,omitempty"`
	IsActive    *bool   `json:"is_active,omitempty"`
}

// ServiceAccountResponse includes the plain client secret (only on creation)
type ServiceAccountResponse struct {
	ServiceAccount
	ClientSecret string `json:"client_secret,omitempty"` // Only returned on creation
}

// TableName returns the table name for ServiceAccount
func (ServiceAccount) TableName() string {
	return "service_accounts"
}
