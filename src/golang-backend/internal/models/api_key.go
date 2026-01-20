package models

import (
	"database/sql"
	"time"

	"github.com/google/uuid"
	"github.com/lib/pq"
)

// APIKey represents an API key for authentication
type APIKey struct {
	ID          uuid.UUID      `json:"_id" db:"_id"`
	TenantID    uuid.UUID      `json:"tenant_id" db:"tenant_id"`
	Name        string         `json:"name" db:"name"`
	KeyPrefix   string         `json:"key_prefix" db:"key_prefix"`
	KeyHash     string         `json:"key_hash" db:"key_hash"`
	Scopes      pq.StringArray `json:"scopes" db:"scopes"`
	AllowedIPs  pq.StringArray `json:"allowed_ips,omitempty" db:"allowed_ips"`
	ExpiresAt   *time.Time     `json:"expires_at,omitempty" db:"expires_at"`
	LastUsedAt  *time.Time     `json:"last_used_at,omitempty" db:"last_used_at"`
	CreatedAt   time.Time      `json:"created_at" db:"created_at"`
	CreatedBy   *uuid.UUID     `json:"created_by,omitempty" db:"created_by"`
	Version     int64          `json:"version" db:"version"`
}

// CreateAPIKeyRequest represents the request to create an API key
type CreateAPIKeyRequest struct {
	TenantID   uuid.UUID `json:"tenant_id" validate:"required,uuid"`
	Name       string    `json:"name" validate:"required,min=1,max=255"`
	Scopes     []string  `json:"scopes,omitempty"`
	AllowedIPs []string  `json:"allowed_ips,omitempty"`
	ExpiresAt  *time.Time `json:"expires_at,omitempty"`
	CreatedBy  *uuid.UUID `json:"created_by,omitempty" validate:"omitempty,uuid"`
}

// UpdateAPIKeyRequest represents the request to update an API key
type UpdateAPIKeyRequest struct {
	Name       *string    `json:"name,omitempty" validate:"omitempty,min=1,max=255"`
	Scopes     []string   `json:"scopes,omitempty"`
	AllowedIPs []string   `json:"allowed_ips,omitempty"`
	ExpiresAt  *time.Time `json:"expires_at,omitempty"`
}

// APIKeyResponse represents the API key response (includes the plain key only on creation)
type APIKeyResponse struct {
	APIKey
	PlainKey string `json:"plain_key,omitempty"` // Only returned on creation
}

// TableName returns the table name for APIKey
func (APIKey) TableName() string {
	return "api_keys"
}
